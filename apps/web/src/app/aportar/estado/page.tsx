'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface TrackingResult {
  trackingCode: string;
  type: string;
  status: string;
  createdAt: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  clinic?: {
    name: string;
    slug: string;
  } | null;
}

function ConsultarEstadoContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get('codigo') ?? '';

  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(searchCode: string) {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/submissions/track/${encodeURIComponent(searchCode.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('No se encontró ningún aporte con este código.');
        }
        throw new Error('Error al consultar el estado.');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCode) {
      void handleSearch(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <span className="text-4xl block">🔍</span>
        <h1 className="text-2xl font-bold text-slate-900">Consultar Estado de Aporte</h1>
        <p className="text-sm text-slate-500">
          Ingresa el código que recibiste al enviar tu información (ej: VBB-A1B2)
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSearch(code);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="VBB-XXXX"
          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Consultar'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl text-center">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-mono text-slate-400 block">Código</span>
              <span className="font-mono font-bold text-slate-900 text-lg">{result.trackingCode}</span>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                result.status === 'PENDING'
                  ? 'bg-amber-100 text-amber-800'
                  : result.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {result.status === 'PENDING' ? 'En Revisión' : result.status === 'APPROVED' ? 'Aprobado y Publicado' : 'Rechazado'}
            </span>
          </div>

          <div className="text-xs space-y-2 text-slate-600">
            <p>
              <span className="font-semibold text-slate-400 uppercase">Tipo:</span> {result.type}
            </p>
            {result.clinic && (
              <p>
                <span className="font-semibold text-slate-400 uppercase">Clínica:</span> {result.clinic.name}
              </p>
            )}
            <p>
              <span className="font-semibold text-slate-400 uppercase">Fecha de envío:</span>{' '}
              {new Date(result.createdAt).toLocaleDateString('es-CL', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>

            {result.reviewNotes && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Nota de los moderadores:</span>
                <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800">
                  {result.reviewNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <Link href="/aportar" className="text-xs font-semibold text-emerald-600 hover:underline">
          &larr; Enviar un nuevo aporte
        </Link>
      </div>
    </div>
  );
}

export default function ConsultarEstadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <ConsultarEstadoContent />
    </Suspense>
  );
}
