'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type Row = { id: number; day_of_week: number; opening_time: string | null; closing_time: string | null; is_closed: boolean };

export default function AdminHorarios() {
  const router = useRouter();
  const slug = useSearchParams().get('clinica') ?? '';
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ day: '1', open: '09:00', close: '18:00', closed: false });

  const load = useCallback(async () => {
    try {
      const res = await adminApi(`/admin/clinics/${slug}/schedules`);
      setRows(res as Row[]);
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
      await adminApi(`/admin/clinics/${slug}/schedules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: Number(form.day),
          openingTime: form.closed ? undefined : form.open,
          closingTime: form.closed ? undefined : form.close,
          isClosed: form.closed,
        }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!slug) return <main><h1>Horarios</h1><p>Falta ?clinica=slug</p></main>;

  return (
    <main>
      <h1>Horarios — {slug}</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {rows.map((r) => (
          <li key={r.id}>{DAYS[r.day_of_week]}: {r.is_closed ? 'Cerrado' : `${(r.opening_time as string)?.slice(0, 5)}–${(r.closing_time as string)?.slice(0, 5)}`}</li>
        ))}
      </ul>
      <h2>Agregar horario</h2>
      <form onSubmit={(e) => void submit(e)}>
        <label>Día
          <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </label>
        <label>Apertura <input type="time" value={form.open} onChange={(e) => setForm({ ...form, open: e.target.value })} /></label>
        <label>Cierre <input type="time" value={form.close} onChange={(e) => setForm({ ...form, close: e.target.value })} /></label>
        <label><input type="checkbox" checked={form.closed} onChange={(e) => setForm({ ...form, closed: e.target.checked })} /> Cerrado</label>
        <button type="submit">Guardar</button>
      </form>
    </main>
  );
}
