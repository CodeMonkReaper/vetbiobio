'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';

interface SubmissionItem {
  id: string;
  trackingCode: string;
  type: string;
  status: string;
  createdAt: string;
  message: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  clinic?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
}

function AportesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') ?? 'PENDING';

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('limit', '50');

      const res = await adminApi(`/admin/submissions?${params.toString()}`);
      setSubmissions(res.data);
    } catch (err) {
      if ((err as Error).message === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, router]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const typeLabels: Record<string, string> = {
    NEW_CLINIC: 'Nueva Clínica',
    UPDATE_CLINIC: 'Actualizar Datos',
    REPORT_CLOSURE: 'Reporte de Cierre',
    NEW_SERVICE: 'Nuevo Servicio',
    UPDATE_PRICE: 'Actualizar Precios',
    NEW_PROMOTION: 'Nueva Promoción',
    CORRECT_DATA: 'Corregir Datos',
    OTHER: 'Otro / Consulta',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bandeja de Aportes Ciudadanos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Revisa, edita y aprueba las colaboraciones enviadas por la comunidad.
          </p>
        </div>
        <button
          onClick={() => loadSubmissions()}
          className="self-start sm:self-auto bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {[
            { id: 'PENDING', label: 'Pendientes' },
            { id: 'APPROVED', label: 'Aprobados' },
            { id: 'REJECTED', label: 'Rechazados' },
            { id: 'ALL', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type select */}
        <div className="flex items-center gap-2">
          <label htmlFor="type-filter" className="text-xs font-semibold text-slate-500 uppercase">
            Tipo:
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Table or Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-2 text-sm text-slate-500">Cargando aportes...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl block mb-2">📭</span>
            <p className="font-medium text-slate-600">No hay aportes con los filtros seleccionados.</p>
            <p className="text-xs text-slate-400 mt-1">Los nuevos envíos aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Clínica / Destino</th>
                  <th className="py-3 px-4">Remitente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {submissions.map((sub) => {
                  let statusBadgeClass = 'bg-amber-100 text-amber-800';
                  let statusText = 'Pendiente';
                  if (sub.status === 'APPROVED') {
                    statusBadgeClass = 'bg-emerald-100 text-emerald-800';
                    statusText = 'Aprobado';
                  } else if (sub.status === 'REJECTED') {
                    statusBadgeClass = 'bg-rose-100 text-rose-800';
                    statusText = 'Rechazado';
                  }

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">
                        {sub.trackingCode}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-slate-100 text-slate-800 text-xs font-medium px-2 py-0.5 rounded">
                          {typeLabels[sub.type] || sub.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {sub.clinic ? (
                          <Link
                            href={`/admin/clinics`}
                            className="text-emerald-700 hover:underline"
                          >
                            {sub.clinic.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Nueva Clínica / S.I.</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {sub.submitterName || (sub.submitterEmail ? 'Anónimo' : 'Sin datos')}
                        {sub.submitterEmail && (
                          <span className="block text-slate-400 text-[11px] truncate max-w-[150px]">
                            {sub.submitterEmail}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${statusBadgeClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/aportes/${sub.id}`}
                          className="inline-flex items-center font-bold text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                        >
                          Moderar &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAportesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <AportesContent />
    </Suspense>
  );
}
