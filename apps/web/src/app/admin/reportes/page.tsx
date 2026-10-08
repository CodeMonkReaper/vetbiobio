'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin';

type Report = {
  id: number;
  reason: string;
  message: string | null;
  status: string;
  createdAt?: string;
  clinic: { slug: string; name: string } | null;
};

export default function AdminReportes() {
  const router = useRouter();
  const [rows, setRows] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi('/admin/reports');
      setRows(res as Report[]);
      setError('');
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(id: number, status: string) {
    try {
      await adminApi(`/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      alert(`Error al actualizar reporte: ${(e as Error).message}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes de Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reclamos, errores detectados y avisos enviados sobre fichas clínicas.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition self-start sm:self-auto"
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="mt-2 text-sm text-slate-500">Cargando reportes...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl block mb-2">🎉</span>
            <p className="font-medium text-slate-600">No hay reportes abiertos pendientes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.id} className="p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {r.reason}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID #{r.id}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {r.clinic ? (
                      <Link href={`/admin/clinics`} className="text-emerald-700 hover:underline">
                        🏥 {r.clinic.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic">Sin clínica específica</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 max-w-2xl bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    {r.message || 'Sin mensaje adicional del usuario'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => void resolve(r.id, 'TRIAGED')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    En Revisión
                  </button>
                  <button
                    onClick={() => void resolve(r.id, 'RESOLVED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    Resolver
                  </button>
                  <button
                    onClick={() => void resolve(r.id, 'REJECTED')}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
