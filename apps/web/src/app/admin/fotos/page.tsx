'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { fetchClinic } from '@/lib/api';

type Photo = { url: string; alt_text: string | null; is_primary: boolean };

export default function AdminFotos() {
  return (
    <Suspense>
      <FotosInner />
    </Suspense>
  );
}

function FotosInner() {
  const router = useRouter();
  const slug = useSearchParams().get('clinica') ?? '';
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetchClinic(slug);
      setPhotos((res?.data?.photos as Photo[]) ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [slug]);

  useEffect(() => { if (slug) void load(); }, [load, slug]);

  async function upload(file: File) {
    setError('');
    setBusy(true);
    try {
      // 1) firma server-side (el secreto nunca sale del backend)
      const sign = await adminApi('/admin/media/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      }) as { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string };
      // 2) subida directa navegador → Cloudinary
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sign.apiKey);
      fd.append('timestamp', String(sign.timestamp));
      fd.append('signature', sign.signature);
      fd.append('folder', sign.folder);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: 'POST', body: fd });
      if (!up.ok) throw new Error('Subida a Cloudinary falló');
      const done = (await up.json()) as { secure_url: string; public_id: string };
      // 3) adjunta a la clínica
      await adminApi('/admin/media/photos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicSlug: slug, url: done.secure_url, publicId: done.public_id, altText: alt || null }),
      });
      setAlt('');
      await load();
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!slug) return <main><h1>Fotos</h1><p>Falta ?clinica=slug</p></main>;

  return (
    <main>
      <h1>Fotos — {slug}</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {photos.map((p) => (
          <li key={p.url}><a href={p.url} target="_blank" rel="noreferrer">{p.alt_text ?? p.url}</a>{p.is_primary ? ' ★' : ''}</li>
        ))}
      </ul>
      <h2>Subir foto</h2>
      <label>Texto alternativo <input value={alt} onChange={(e) => setAlt(e.target.value)} /></label>
      <input
        type="file" accept="image/*" disabled={busy}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
      />
      {busy && <p>Subiendo…</p>}
    </main>
  );
}
