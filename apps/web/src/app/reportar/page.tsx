'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const REASONS = [
  ['CLOSED', 'Veterinaria cerrada'],
  ['WRONG_PRICE', 'Precio incorrecto'],
  ['WRONG_SCHEDULE', 'Horario incorrecto'],
  ['WRONG_PHONE', 'Teléfono incorrecto'],
  ['SERVICE_UNAVAILABLE', 'Servicio no disponible'],
  ['PROFESSIONAL_LEFT', 'Profesional ya no trabaja aquí'],
  ['OTHER', 'Otra'],
] as const;

interface Props {
  searchParams: Record<string, string | undefined>;
}

// ?clinica=<slug>. Sin datos personales (ver verification-policy §5).
export default function Reportar({ searchParams }: Props) {
  const slug = searchParams.clinica ?? '';
  const [reason, setReason] = useState<string>('WRONG_PRICE');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch(`${API}/reports`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, reason, message: message || undefined }),
    });
    if (res.status === 429) {
      setError('Demasiados reportes. Intenta más tarde.');
      return;
    }
    if (!res.ok) {
      setError('No se pudo enviar el reporte.');
      return;
    }
    setDone(true);
  }

  if (done) return <main><h1>Reporte enviado</h1><p>Gracias, lo revisaremos a la brevedad.</p></main>;

  return (
    <main>
      <h1>Reportar información incorrecta</h1>
      {slug && <p>Clínica: <strong>{slug}</strong></p>}
      <form onSubmit={(e) => void submit(e)}>
        <label htmlFor="reason">Motivo</label>
        <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label htmlFor="message">Detalle (opcional)</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        <button type="submit">Enviar reporte</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
