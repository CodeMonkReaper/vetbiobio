'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin';

interface OverviewData {
  pendingSubmissions: number;
  openReports: number;
  clinics: {
    active: number;
    draft: number;
    inactive: number;
    closed: number;
    total: number;
    verified: number;
  };
  recentSubmissions: Array<{
    id: string;
    trackingCode: string;
    type: string;
    status: string;
    createdAt: string;
    submitterName: string | null;
    clinic?: { name: string; slug: string } | null;
  }>;
  recentReports: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    clinic?: { name: string; slug: string } | null;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi('/admin/overview')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message === 'UNAUTHORIZED') {
          router.push('/admin/login');
        } else {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl">
        <p className="font-semibold">Error al cargar datos del panel:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resumen y Moderación</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona las clínicas, solicitudes ciudadanas y reportes de la Región del Biobío.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Aportes Pendientes</span>
            <span className="text-2xl">📥</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{data?.pendingSubmissions ?? 0}</span>
            <span className="text-xs font-medium text-emerald-600">por moderar</span>
          </div>
          <Link
            href="/admin/aportes?status=PENDING"
            className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Revisar bandeja &rarr;
          </Link>
          <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reportes Abiertos</span>
            <span className="text-2xl">🚨</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{data?.openReports ?? 0}</span>
            <span className="text-xs font-medium text-amber-600">abiertos</span>
          </div>
          <Link
            href="/admin/reportes"
            className="mt-3 inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            Ver reportes &rarr;
          </Link>
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clínicas Activas</span>
            <span className="text-2xl">🏥</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{data?.clinics.active ?? 0}</span>
            <span className="text-xs font-medium text-slate-500">de {data?.clinics.total ?? 0} totales</span>
          </div>
          <Link
            href="/admin/clinics"
            className="mt-3 inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Administrar &rarr;
          </Link>
          <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">En Borrador / Verificadas</span>
            <span className="text-2xl">🛡️</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{data?.clinics.draft ?? 0}</span>
            <span className="text-xs text-slate-500">borradores / {data?.clinics.verified ?? 0} verif.</span>
          </div>
          <Link
            href="/admin/verificar"
            className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Ver verificaciones &rarr;
          </Link>
          <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-500"></div>
        </div>
      </div>

      {/* Grid: Recent Submissions & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submissions Section */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📥</span>
              <h2 className="font-bold text-slate-900">Últimos Aportes Ciudadanos</h2>
            </div>
            <Link
              href="/admin/aportes"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Ver todos &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(!data?.recentSubmissions || data.recentSubmissions.length === 0) ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No hay aportes pendientes en este momento.
              </div>
            ) : (
              data.recentSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {sub.trackingCode}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {sub.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      {sub.clinic ? sub.clinic.name : 'Nueva Clínica / General'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(sub.createdAt).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {sub.submitterName && ` · Por: ${sub.submitterName}`}
                    </p>
                  </div>
                  <Link
                    href={`/admin/aportes/${sub.id}`}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                  >
                    Moderar
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <h2 className="font-bold text-slate-900">Reportes de Usuarios</h2>
            </div>
            <Link
              href="/admin/reportes"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              Ver todos &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(!data?.recentReports || data.recentReports.length === 0) ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No hay reportes abiertos.
              </div>
            ) : (
              data.recentReports.map((rep) => (
                <div key={rep.id} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        {rep.reason}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      {rep.clinic?.name ?? 'Sin clínica asociada'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(rep.createdAt).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Link
                    href="/admin/reportes"
                    className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Resolver
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
