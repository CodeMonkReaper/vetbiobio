'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin';

const ENTITIES = ['clinic', 'clinic_location', 'clinic_service', 'clinic_exam', 'clinic_service_price', 'clinic_exam_price', 'schedule', 'clinic_photo'];
const STATES = ['UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'OUTDATED', 'REJECTED'];
const SOURCES = ['OFFICIAL_WEBSITE', 'OFFICIAL_SOCIAL_MEDIA', 'PHONE', 'WHATSAPP', 'EMAIL', 'DIRECT_COMMUNICATION', 'PUBLIC_SOURCE', 'ADMIN_RESEARCH', 'OTHER'];

export default function AdminVerificar() {
  const router = useRouter();
  const [form, setForm] = useState({ entityType: 'clinic', entityId: '', newStatus: 'VERIFIED', source: 'PHONE', method: '', notes: '' });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult('');
    try {
      const res = await adminApi('/admin/verifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, entityId: Number(form.entityId) }),
      });
      setResult(JSON.stringify(res));
    } catch (err) {
      if ((err as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((err as Error).message);
    }
  }

  return (
    <main>
      <h1>Verificar</h1>
      {error && <p role="alert">{error}</p>}
      {result && <p>{result}</p>}
      <form onSubmit={(e) => void submit(e)}>
        <label>Entidad
          <select value={form.entityType} onChange={(e) => set('entityType', e.target.value)}>
            {ENTITIES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>ID <input value={form.entityId} onChange={(e) => set('entityId', e.target.value)} required /></label>
        <label>Estado
          <select value={form.newStatus} onChange={(e) => set('newStatus', e.target.value)}>
            {STATES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>Fuente
          <select value={form.source} onChange={(e) => set('source', e.target.value)}>
            {SOURCES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>Método/nota <input value={form.method} onChange={(e) => set('method', e.target.value)} placeholder="Método o evidencia" /></label>
        <button type="submit">Aplicar</button>
      </form>
      <p><small>VERIFIED exige fuente + método o nota. Transiciones inválidas se rechazan.</small></p>
    </main>
  );
}
