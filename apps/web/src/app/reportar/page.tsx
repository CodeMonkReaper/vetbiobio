'use client';

import { useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const REASONS = [
  ['CLOSED', 'Veterinaria cerrada definitivamente'],
  ['WRONG_PRICE', 'Precio incorrecto o desactualizado'],
  ['WRONG_SCHEDULE', 'Horario de atención incorrecto'],
  ['WRONG_PHONE', 'Teléfono o contacto incorrecto'],
  ['SERVICE_UNAVAILABLE', 'Servicio listado ya no disponible'],
  ['PROFESSIONAL_LEFT', 'Profesional ya no atiende en el lugar'],
  ['OTHER', 'Otra inconsistencia'],
] as const;

interface Props {
  searchParams: Record<string, string | undefined>;
}

export default function Reportar({ searchParams }: Props) {
  const clinicSlug = searchParams.clinica ?? '';
  const [reason, setReason] = useState<string>('WRONG_PRICE');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicSlug: clinicSlug || undefined,
          reason,
          message: message || undefined,
        }),
      });

      if (res.status === 429) {
        setError('Demasiados reportes enviados. Intenta más tarde.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? 'No se pudo enviar el reporte.');
        return;
      }
      setDone(true);
    } catch {
      setError('Error de conexión al enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <span className="text-4xl block">✅</span>
        <h1 className="text-2xl font-bold text-slate-900">Reporte Recibido</h1>
        <p className="text-sm text-slate-600">
          Muchas gracias por avisarnos. Nuestro equipo revisará la información y la actualizará en la plataforma.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto my-10 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportar Información Incorrecta</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ayúdanos a mantener el directorio fidedigno. No recopilamos datos personales en este formulario.
        </p>
      </div>

      {clinicSlug && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <span>🏥</span>
          <span>
            Clínica reportada: <strong>{clinicSlug}</strong>
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <div>
          <label htmlFor="reason" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Motivo del reporte
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {REASONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Detalle adicional (opcional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Describe qué dato está incorrecto (ej: el teléfono cambió a +569...)"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Enviar Reporte'}
        </button>
      </form>
    </main>
  );
}
