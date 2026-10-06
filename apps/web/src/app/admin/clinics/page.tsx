'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type Clinic = { slug: string; name: string; commune: string; verification_status: string };

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, credentials: 'include' });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export default function AdminClinics() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', address: '', communeCut: '08101', latitude: '', longitude: '' });

  const load = useCallback(async () => {
    try {
      const res = await api('/clinics?limit=50');
      setClinics(res.data as Clinic[]);
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError('No se pudo cargar el listado.');
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/clinics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, address: form.address, communeCut: form.communeCut,
          latitude: Number(form.latitude), longitude: Number(form.longitude),
        }),
      });
      setForm({ name: '', address: '', communeCut: '08101', latitude: '', longitude: '' });
      await load();
    } catch (err) {
      setError(`No se pudo crear: ${(err as Error).message}`);
    }
  }

  async function deactivate(id: string, slug: string) {
    // El endpoint usa id numérico; se resuelve vía perfil admin por slug.
    const detail = await api(`/admin/clinics/${slug}`);
    await api(`/admin/clinics/${(detail.data as { id: number }).id}/deactivate`, { method: 'PATCH' });
    await load();
  }

  async function logout() {
    await api('/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <main>
      <h1>Admin — clínicas</h1>
      <button onClick={() => void logout()}>Salir</button>
      <nav>
        <a href="/admin/reportes">Reportes</a> · <a href="/admin/verificar">Verificar</a>
      </nav>
      {error && <p role="alert">{error}</p>}
      <h2>Crear (DRAFT)</h2>
      <form onSubmit={(e) => void create(e)}>
        <input aria-label="Nombre" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input aria-label="Dirección" placeholder="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <input aria-label="CUT comuna" placeholder="CUT (ej. 08101)" value={form.communeCut} onChange={(e) => setForm({ ...form, communeCut: e.target.value })} required />
        <input aria-label="Latitud" placeholder="Latitud" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
        <input aria-label="Longitud" placeholder="Longitud" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
        <button type="submit">Crear</button>
      </form>
      <h2>Listado</h2>
      <ul>
        {clinics.map((c) => (
          <li key={c.slug}>
            {c.name} — {c.commune} [{c.verification_status}]
            <a href={`/admin/precios?clinica=${c.slug}`}>Precios</a>
            <a href={`/admin/horarios?clinica=${c.slug}`}>Horarios</a>
            <a href={`/admin/fotos?clinica=${c.slug}`}>Fotos</a>
            <button onClick={() => void deactivate(c.slug, c.slug)}>Desactivar</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
