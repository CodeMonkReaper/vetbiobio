'use client';

import { Suspense, useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { Card, Alert, Skeleton, Empty } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/fields';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshIcon,
  SearchIcon,
  ArrowRightIcon,
} from '@/components/admin/icons/AdminIcons';

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

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  NEW_CLINIC: 'Nueva Clínica',
  UPDATE_CLINIC: 'Actualizar Datos',
  CLINIC_UPDATE: 'Actualizar Datos',
  REPORT_CLOSURE: 'Reporte de Cierre',
  NEW_SERVICE: 'Nuevo Servicio',
  UPDATE_PRICE: 'Actualizar Precios',
  PRICE: 'Actualizar Precios',
  SCHEDULE: 'Actualizar Horarios',
  NEW_PROMOTION: 'Nueva Promoción',
  CORRECT_DATA: 'Corregir Datos',
  OTHER: 'Otro / Consulta',
};

function AportesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter values from URL search params for preservation
  const initialStatus = searchParams?.get('status') ?? 'PENDING';
  const initialType = searchParams?.get('type') ?? '';
  const initialPage = parseInt(searchParams?.get('page') ?? '1', 10);
  const initialSearch = searchParams?.get('q') ?? '';

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state changes with URL query parameters so navigation back preserves context
  const updateQueryParams = useCallback(
    (newStatus: string, newType: string, newPage: number, newSearch: string) => {
      const params = new URLSearchParams();
      if (newStatus && newStatus !== 'ALL') params.set('status', newStatus);
      else if (newStatus === 'ALL') params.set('status', 'ALL');

      if (newType) params.set('type', newType);
      if (newPage > 1) params.set('page', String(newPage));
      if (newSearch.trim()) params.set('q', newSearch.trim());

      router.replace(`/admin/aportes?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('page', String(currentPage));
      params.append('limit', '25');

      const res = await adminApi(`/admin/submissions?${params.toString()}`);
      setSubmissions(res.data || []);
      if (res.meta) {
        setPaginationMeta(res.meta);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar aportes';
      if (msg === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, currentPage, router]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Handle Tab Switch
  const handleTabChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    updateQueryParams(newStatus, typeFilter, 1, searchQuery);
  };

  // Handle Type Change
  const handleTypeChange = (newType: string) => {
    setTypeFilter(newType);
    setCurrentPage(1);
    updateQueryParams(statusFilter, newType, 1, searchQuery);
  };

  // Handle Search Input Change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateQueryParams(statusFilter, typeFilter, currentPage, query);
  };

  // Client-side text filter for instant search responsiveness
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const query = searchQuery.trim().toLowerCase();
    return submissions.filter((sub) => {
      const tracking = sub.trackingCode.toLowerCase();
      const clinicName = sub.clinic?.name?.toLowerCase() || '';
      const submitter = sub.submitterName?.toLowerCase() || '';
      const email = sub.submitterEmail?.toLowerCase() || '';
      return (
        tracking.includes(query) ||
        clinicName.includes(query) ||
        submitter.includes(query) ||
        email.includes(query)
      );
    });
  }, [submissions, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-verified-border bg-status-verified-bg px-2.5 py-0.5 text-xs font-semibold text-status-verified-text">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            <span>Aprobado</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 text-xs font-semibold text-status-danger-text">
            <XCircleIcon className="w-3.5 h-3.5" />
            <span>Rechazado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-outdated-border bg-status-outdated-bg px-2.5 py-0.5 text-xs font-semibold text-status-outdated-text">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>Pendiente</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Bandeja de Aportes Ciudadanos
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-mute">
            Revisa, valida y modera las colaboraciones enviadas por la comunidad de la Región del Biobío.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadSubmissions()}
            leftIcon={<RefreshIcon className="w-4 h-4" />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Pestañas de Estado con accesibilidad y touch target de 44px */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'PENDING', label: 'Pendientes' },
              { id: 'APPROVED', label: 'Aprobados' },
              { id: 'REJECTED', label: 'Rechazados' },
              { id: 'ALL', label: 'Todos' },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Buscador Rápido y Selector de Tipo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[240px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-mute">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar por código, clínica..."
                className="w-full min-h-[44px] rounded-md border border-border bg-surface pl-9 pr-3 text-xs text-ink placeholder:text-ink-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="text-xs"
                aria-label="Filtrar por tipo de aporte"
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
        </div>
      </Card>

      {/* Estados de Carga y Error */}
      {error && (
        <Alert tone="error" title="Error al consultar aportes">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando bandeja de aportes">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Empty
          title="No se encontraron aportes"
          description={
            searchQuery
              ? `No hay aportes que coincidan con "${searchQuery}".`
              : `No hay registros con el estado seleccionado (${statusFilter}).`
          }
          hints={[
            'Verifica el texto en el buscador.',
            'Cambia de pestaña para consultar el historial en Aprobados, Rechazados o Todos.',
          ]}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                handleTabChange('ALL');
              }}
            >
              Ver todos los aportes
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border-subtle bg-surface-alt text-xs font-semibold text-ink-mute uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3">Código / Fecha</th>
                    <th scope="col" className="px-5 py-3">Tipo de Aporte</th>
                    <th scope="col" className="px-5 py-3">Clínica Referida</th>
                    <th scope="col" className="px-5 py-3">Remitente</th>
                    <th scope="col" className="px-5 py-3">Estado</th>
                    <th scope="col" className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="transition hover:bg-surface-alt/60">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-ink bg-surface-alt px-2 py-0.5 rounded border border-border-subtle">
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
                          <span className="text-ink-mute italic text-xs">Nueva / Sin asociar</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-soft">
                        <span className="font-medium text-ink block">
                          {sub.submitterName || 'Anónimo'}
                        </span>
                        {sub.submitterEmail && (
                          <span className="text-[11px] text-ink-mute block">{sub.submitterEmail}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link href={`/admin/aportes/${sub.id}`}>
                          <Button
                            variant="primary"
                            size="sm"
                            rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                          >
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

          {/* Pagination Controls */}
          {paginationMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-xs text-ink-mute">
              <div>
                Mostrando <strong className="text-ink">{filteredSubmissions.length}</strong> de{' '}
                <strong className="text-ink">{paginationMeta.total}</strong> aportes registrados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const prev = currentPage - 1;
                    setCurrentPage(prev);
                    updateQueryParams(statusFilter, typeFilter, prev, searchQuery);
                  }}
                >
                  Anterior
                </Button>
                <span className="font-medium text-ink px-2">
                  Página {currentPage} de {paginationMeta.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= paginationMeta.totalPages}
                  onClick={() => {
                    const next = currentPage + 1;
                    setCurrentPage(next);
                    updateQueryParams(statusFilter, typeFilter, next, searchQuery);
                  }}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
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
