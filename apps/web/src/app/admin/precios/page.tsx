'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';

type Row = { id: number; kind: string; slug: string; name: string; min_amount: number | null; pricing_type: string | null };

export default function AdminPrecios() {
  return (
    <Suspense>
      <PreciosInner />
    </Suspense>
  );
}

function PreciosInner() {
  const router = useRouter();
  const slug = useSearchParams().get('clinica') ?? '';
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id: '', kind: 'service', min: '', max: '', type: 'FIXED' });

  const load = useCallback(async () => {
    try {
      const res = await adminApi(`/admin/clinics/${slug}/services`);
      setRows(res.data as Row[]);
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((e as Error).message);
    }
  }, [router, slug]);

  useEffect(() => { if (slug) void load(); }, [load, slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const kind = form.kind === 'exam' ? 'exam' : 'service';
      await adminApi(`/admin/prices/${kind}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(kind === 'exam' ? { clinicExamId: Number(form.id) } : { clinicServiceId: Number(form.id) }),
          minAmount: form.min === '' ? null : Number(form.min),
          maxAmount: form.max === '' ? null : Number(form.max),
          pricingType: form.type,
        }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!slug) return <main><h1>Precios</h1><p>Falta ?clinica=slug</p></main>;

  return (
    <main>
      <h1>Precios — {slug}</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {rows.map((r) => (
          <li key={`${r.kind}-${r.id}`}>[{r.kind}] {r.name} — {r.min_amount ?? 's/p'} ({r.pricing_type ?? '—'})</li>
        ))}
      </ul>
      <h2>Agregar precio (cierra vigencia anterior)</h2>
      <form onSubmit={(e) => void submit(e)}>
        <label>ID ítem <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required /></label>
        <label>Tipo ítem
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="service">servicio</option>
            <option value="exam">examen</option>
          </select>
        </label>
        <label>Mín <input value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} /></label>
        <label>Máx <input value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })} /></label>
        <label>Tipo precio
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>FIXED</option><option>RANGE</option><option>FROM</option><option>CONTACT</option>
          </select>
        </label>
        <button type="submit">Guardar</button>
      </form>
    </main>
  );
}
