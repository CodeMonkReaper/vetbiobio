'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { Card, Alert, Skeleton, Empty } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/fields';

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

const TYPE_LABELS: Record<string, string> = {
  NEW_CLINIC: 'Nueva Clínica',
  UPDATE_CLINIC: 'Actualizar Datos',
  REPORT_CLOSURE: 'Reporte de Cierre',
  NEW_SERVICE: 'Nuevo Servicio',
  UPDATE_PRICE: 'Actualizar Precios',
  NEW_PROMOTION: 'Nueva Promoción',
  CORRECT_DATA: 'Corregir Datos',
  OTHER: 'Otro / Consulta',
};

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-verified-border bg-status-verified-bg px-2.5 py-0.5 text-xs font-semibold text-status-verified-text">
            <span aria-hidden="true">✓</span>
            <span>Aprobado</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 text-xs font-semibold text-status-danger-text">
            <span aria-hidden="true">✕</span>
            <span>Rechazado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-outdated-border bg-status-outdated-bg px-2.5 py-0.5 text-xs font-semibold text-status-outdated-text">
            <span aria-hidden="true">◷</span>
            <span>Pendiente</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Bandeja de Aportes Ciudadanos
          </h1>
          <p className="mt-1 text-sm text-ink-mute">
            Revisa, edita y aprueba las colaboraciones territoriales enviadas por la comunidad.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => loadSubmissions()}
          leftIcon={<span aria-hidden="true">🔄</span>}
        >
          Actualizar lista
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        {/* Pestañas de Estado con Touch Target de 44px */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'PENDING', label: 'Pendientes' },
            { id: 'APPROVED', label: 'Aprobados' },
            { id: 'REJECTED', label: 'Rechazados' },
            { id: 'ALL', label: 'Todos' },
          ].map((tab) => (
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

        {/* Selector de Tipo */}
        <div className="flex items-center gap-2">
          <label htmlFor="type-filter" className="text-xs font-bold uppercase tracking-wider text-ink-mute">
            Tipo:
          </label>
          <div className="w-56">
            <Select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Estados de Carga y Error */}
      {error && (
        <Alert tone="error" title="Error al cargar aportes">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando aportes">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : submissions.length === 0 ? (
        <Empty
          title="No hay aportes en esta bandeja"
          description={`No se encontraron aportes con el estado "${statusFilter}".`}
          hints={['Prueba cambiando a otra pestaña de estado.', 'Selecciona "Todos" para ver el historial completo.']}
          action={
            <Button variant="secondary" onClick={() => setStatusFilter('ALL')}>
              Ver todos los aportes
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface-alt text-xs font-semibold text-ink-mute uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Código / Fecha</th>
                  <th scope="col" className="px-5 py-3">Tipo</th>
                  <th scope="col" className="px-5 py-3">Clínica Referida</th>
                  <th scope="col" className="px-5 py-3">Remitente</th>
                  <th scope="col" className="px-5 py-3">Estado</th>
                  <th scope="col" className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="transition hover:bg-surface-alt/60">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-ink bg-surface-alt px-2 py-0.5 rounded">
                        {sub.trackingCode}
                      </span>
                      <span className="block text-xs text-ink-mute tabular-nums mt-1">
                        {new Date(sub.createdAt).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge tone="brand">
                        {TYPE_LABELS[sub.type] ?? sub.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {sub.clinic ? (
                        <span className="font-semibold text-ink">{sub.clinic.name}</span>
                      ) : (
                        <span className="text-ink-mute italic">Nueva / Sin asociar</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-soft">
                      {sub.submitterName || 'Anónimo'}
                      {sub.submitterEmail && (
                        <span className="block text-[11px] text-ink-mute">{sub.submitterEmail}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link href={`/admin/aportes/${sub.id}`}>
                        <Button variant="primary" size="sm">
                          Moderar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function AdminAportesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
        </div>
      }
    >
      <AportesContent />
    </Suspense>
  );
}
