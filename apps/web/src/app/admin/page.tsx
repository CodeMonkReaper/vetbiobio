'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { Card, Alert, Skeleton } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import {
  InboxIcon,
  ReportIcon,
  ClinicIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@/components/admin/icons/AdminIcons';

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

const SUBMISSION_TYPE_TRANSLATIONS: Record<string, string> = {
  NEW_CLINIC: 'Nueva clínica',
  UPDATE_CLINIC: 'Actualización',
  CLINIC_UPDATE: 'Actualización',
  UPDATE_PRICE: 'Aranceles',
  PRICE: 'Arancel',
  SCHEDULE: 'Horario',
  NEW_SERVICE: 'Nuevo servicio',
  REPORT_CLOSURE: 'Cierre',
  NEW_PROMOTION: 'Promoción',
  CORRECT_DATA: 'Corrección',
  OTHER: 'Otro aporte',
};

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
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar panel';
        if (msg === 'UNAUTHORIZED') {
          router.push('/admin/login');
        } else {
          setError(msg);
          setLoading(false);
        }
      });
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Cargando panel de control">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <Alert tone="error" title="Error al cargar el panel de control">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Título y Descripción */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Panel de Moderación y Supervisión
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-mute">
            Supervisa colaboraciones ciudadanas, incidencias y el estado del catálogo veterinario en la Región del Biobío.
          </p>
        </div>
        <Badge tone="brand">Panel Administrativo</Badge>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Aportes Pendientes */}
        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">
              Aportes Pendientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <InboxIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tabular-nums">
              {data?.pendingSubmissions ?? 0}
            </span>
            <span className="text-xs font-semibold text-brand-700">por moderar</span>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Link
              href="/admin/aportes?status=PENDING"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
            >
              <span>Revisar bandeja</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* KPI 2: Reportes Abiertos */}
        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">
              Reportes Abiertos
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ReportIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tabular-nums">
              {data?.openReports ?? 0}
            </span>
            <span className="text-xs font-semibold text-amber-800">por resolver</span>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Link
              href="/admin/reportes"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition"
            >
              <span>Ver reportes</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* KPI 3: Clínicas Activas */}
        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">
              Clínicas Activas
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ClinicIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tabular-nums">
              {data?.clinics.active ?? 0}
            </span>
            <span className="text-xs text-ink-mute">de {data?.clinics.total ?? 0} totales</span>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Link
              href="/admin/clinics"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition"
            >
              <span>Ver directorio</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* KPI 4: En Borrador y Verificadas */}
        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">
              Borradores y Verificación
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tabular-nums">
              {data?.clinics.draft ?? 0}
            </span>
            <span className="text-xs text-ink-mute">borradores / {data?.clinics.verified ?? 0} verif.</span>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Link
              href="/admin/verificar"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
            >
              <span>Verificaciones</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Secciones de Aportes Recientes y Reportes */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 1. Bandeja Reciente de Aportes Ciudadanos */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <div className="flex items-center gap-2">
              <InboxIcon className="w-5 h-5 text-brand-700" />
              <h2 className="font-bold text-ink">Últimos Aportes Ciudadanos</h2>
            </div>
            <Link
              href="/admin/aportes"
              className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
            >
              <span>Ver todos</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border-subtle">
            {!data?.recentSubmissions || data.recentSubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-mute">
                No hay aportes pendientes en este momento.
              </div>
            ) : (
              data.recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-surface-alt/70"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-surface-alt px-2 py-0.5 font-mono text-xs font-bold text-ink border border-border-subtle">
                        {sub.trackingCode}
                      </span>
                      <Badge tone="brand">
                        {SUBMISSION_TYPE_TRANSLATIONS[sub.type] ?? sub.type}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {sub.clinic ? sub.clinic.name : 'Nueva clínica no registrada'}
                    </p>
                    <p className="text-xs text-ink-mute tabular-nums">
                      {new Date(sub.createdAt).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {sub.submitterName && ` · Por: ${sub.submitterName}`}
                    </p>
                  </div>

                  <ButtonLink href={`/admin/aportes/${sub.id}`} variant="primary" size="sm">
                    Moderar
                  </ButtonLink>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 2. Bandeja de Reportes de Usuarios */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <div className="flex items-center gap-2">
              <ReportIcon className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-ink">Reportes de la Comunidad</h2>
            </div>
            <Link
              href="/admin/reportes"
              className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 transition"
            >
              <span>Ver todos</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border-subtle">
            {!data?.recentReports || data.recentReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-mute">
                No hay reportes abiertos pendientes de revisión.
              </div>
            ) : (
              data.recentReports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-surface-alt/70"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge tone="warning">{rep.reason}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {rep.clinic?.name ?? 'Sin clínica asociada'}
                    </p>
                    <p className="text-xs text-ink-mute tabular-nums">
                      {new Date(rep.createdAt).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <ButtonLink href="/admin/reportes" variant="secondary" size="sm">
                    Resolver
                  </ButtonLink>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
