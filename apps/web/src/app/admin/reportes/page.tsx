'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin';
import { Card, Alert, Skeleton, Empty } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ReportIcon,
  RefreshIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClinicIcon,
} from '@/components/admin/icons/AdminIcons';

type ReportItem = {
  id: string;
  reason: string;
  message: string | null;
  status: string;
  createdAt: string;
  clinic: { slug: string; name: string } | null;
};

const STATUS_TABS = [
  { id: 'OPEN', label: 'Abiertos' },
  { id: 'TRIAGED', label: 'En Revisión' },
  { id: 'RESOLVED', label: 'Resueltos' },
  { id: 'REJECTED', label: 'Descartados' },
];

export default function AdminReportesPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi(`/admin/reports?status=${statusFilter}`);
      setReports(res as ReportItem[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar reportes';
      if (msg === 'UNAUTHORIZED') router.push('/admin/login');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleResolve(id: string, newStatus: 'TRIAGED' | 'RESOLVED' | 'REJECTED') {
    setActionProcessingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminApi(`/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg(
        newStatus === 'RESOLVED'
          ? `Reporte #${id} marcado como resuelto.`
          : newStatus === 'TRIAGED'
          ? `Reporte #${id} puesto en revisión.`
          : `Reporte #${id} descartado.`
      );
      await load();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al actualizar reporte.');
    } finally {
      setActionProcessingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ReportIcon className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Reportes de Incidencias
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-ink-mute">
            Reclamos, datos desactualizados e incidencias reportadas por usuarios sobre las clínicas del directorio.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void load()}
          leftIcon={<RefreshIcon className="w-4 h-4" />}
        >
          Actualizar
        </Button>
      </div>

      {/* Pestañas de Estado */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Notificaciones */}
      {successMsg && (
        <Alert tone="success" title="Acción realizada">
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert tone="error" title="Error en la operación">
          {error}
        </Alert>
      )}

      {/* Listado */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : reports.length === 0 ? (
        <Empty
          title="Sin incidencias en esta categoría"
          description={`No hay reportes actualmente con estado "${statusFilter}".`}
          hints={[
            'Revisa las otras pestañas para consultar reportes en revisión o históricos resueltos.',
          ]}
          action={
            <Button variant="secondary" size="sm" onClick={() => setStatusFilter('OPEN')}>
              Ver reportes abiertos
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border-subtle">
            {reports.map((report) => {
              const isProcessing = actionProcessingId === report.id;

              return (
                <div
                  key={report.id}
                  className="p-5 hover:bg-surface-alt/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={report.status === 'RESOLVED' ? 'brand' : 'warning'}>
                        {report.reason}
                      </Badge>
                      <span className="font-mono text-xs text-ink-mute bg-surface-alt px-2 py-0.5 rounded border border-border-subtle">
                        #{report.id}
                      </span>
                      <span className="text-xs text-ink-mute tabular-nums">
                        {new Date(report.createdAt).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
                      {report.clinic ? (
                        <Link
                          href={`/admin/clinics?q=${encodeURIComponent(report.clinic.slug)}`}
                          className="text-brand-700 hover:underline flex items-center gap-1"
                        >
                          <ClinicIcon className="w-4 h-4 text-emerald-600" />
                          <span>{report.clinic.name}</span>
                          <span className="font-mono text-xs text-ink-mute font-normal">
                            (/{report.clinic.slug})
                          </span>
                        </Link>
                      ) : (
                        <span className="text-ink-mute italic text-xs">Sin clínica específica vinculada</span>
                      )}
                    </div>

                    <div className="text-xs text-ink-soft bg-surface-alt/70 p-3 rounded-lg border border-border-subtle max-w-3xl leading-relaxed whitespace-pre-wrap">
                      {report.message || 'Sin mensaje descriptivo adicional'}
                    </div>
                  </div>

                  {/* Acciones de Resolución */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    {report.status !== 'TRIAGED' && report.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => void handleResolve(report.id, 'TRIAGED')}
                        disabled={isProcessing}
                        className="inline-flex min-h-[38px] items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-alt transition disabled:opacity-50"
                      >
                        En Revisión
                      </button>
                    )}

                    {report.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => void handleResolve(report.id, 'RESOLVED')}
                        disabled={isProcessing}
                        className="inline-flex min-h-[38px] items-center gap-1.5 justify-center rounded-md bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Resolver</span>
                      </button>
                    )}

                    {report.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => void handleResolve(report.id, 'REJECTED')}
                        disabled={isProcessing}
                        className="inline-flex min-h-[38px] items-center gap-1.5 justify-center rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                      >
                        <XCircleIcon className="w-3.5 h-3.5 text-rose-600" />
                        <span>Descartar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
