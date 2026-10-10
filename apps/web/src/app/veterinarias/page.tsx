import { Suspense } from 'react';
import Link from 'next/link';
import { fetchClinics, fetchCatalog } from '@/lib/api';
import { ClinicCard } from '@/components/clinics/ClinicCard';
import { FilterPanel } from '@/components/search/FilterPanel';
import { CompareBar } from '@/components/comparison/CompareButton';
import { Pagination } from '@/components/ui/Pagination';
import { Alert, Empty } from '@/components/ui/display';
import { ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/layout/chrome';
import { InfoIcon } from '@/components/icons/PublicIcons';
import type { ClinicSummary } from '@/types/domain';

interface Props {
  searchParams: Record<string, string | undefined>;
}

export async function generateMetadata({ searchParams }: Props) {
  const q = searchParams.q ? ` "${searchParams.q}"` : '';
  const com = searchParams.commune ? ` en ${searchParams.commune}` : '';
  const hasFilter = Boolean(
    searchParams.q ||
      searchParams.commune ||
      searchParams.service ||
      searchParams.exam ||
      searchParams.specialty ||
      searchParams.species ||
      searchParams.emergency ||
      searchParams.open_now ||
      searchParams.verified_only ||
      searchParams.sort
  );

  return {
    title: `Directorio de Veterinarias${q}${com}`,
    description: `Consulta clínicas veterinarias verificadas en la Región del Biobío con aranceles referenciales y urgencias 24h.`,
    alternates: { canonical: '/veterinarias' },
    ...(hasFilter ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Listado principal SSR (§13, §24, §25):
 * Los filtros residen en la URL para máxima indexabilidad, compartibilidad y accesibilidad.
 */
export default async function Listing({ searchParams }: Props) {
  const params: Record<string, string> = {};
  for (const k of [
    'q',
    'commune',
    'service',
    'exam',
    'specialty',
    'species',
    'emergency',
    'open_now',
    'verified_only',
    'sort',
    'page',
    'limit',
  ]) {
    if (searchParams[k]) params[k] = searchParams[k] as string;
  }

  let result: {
    data: ClinicSummary[];
    meta: { total: number; page: number; totalPages: number };
  } | null = null;
  let failed = false;

  try {
    result = await fetchClinics(params);
    // Soporte frontend para open_now
    if (params.open_now === 'true' && result) {
      result.data = result.data.filter((c) => c.open_now === true);
      result.meta.total = result.data.length;
    }
  } catch {
    failed = true;
  }

  const [communes, services, exams, specialties] = await Promise.all([
    fetchCatalog('communes'),
    fetchCatalog('services'),
    fetchCatalog('exams'),
    fetchCatalog('specialties'),
  ]);

  // Total real registrado en la base de datos (independiente de filtros)
  let totalRegistry: number | null;
  const isFiltered = Object.keys(params).some(
    (k) => !['page', 'limit'].includes(k)
  );
  if (!isFiltered && result) {
    totalRegistry = result.meta.total;
  } else {
    try {
      const allRes = await fetchClinics({ limit: '1' });
      totalRegistry = allRes?.meta?.total ?? null;
    } catch {
      totalRegistry = null;
    }
  }

  const base = new URLSearchParams(params);
  base.delete('page');

  // Construcción de chips de filtros activos con botón de remoción individual
  function getRemoveHref(keyToRemove: string) {
    const next = new URLSearchParams(params);
    next.delete(keyToRemove);
    next.delete('page');
    const qs = next.toString();
    return qs ? `/veterinarias?${qs}` : '/veterinarias';
  }

  const activeFilters: Array<{ key: string; label: string; removeHref: string }> = [];
  if (params.q) {
    activeFilters.push({
      key: 'q',
      label: `«${params.q}»`,
      removeHref: getRemoveHref('q'),
    });
  }
  if (params.commune) {
    const foundCom = (communes.data as Array<{ slug: string; name: string }> | undefined)?.find(
      (c) => c.slug === params.commune
    );
    activeFilters.push({
      key: 'commune',
      label: foundCom?.name ?? params.commune,
      removeHref: getRemoveHref('commune'),
    });
  }
  if (params.service) {
    const foundServ = (services.data as Array<{ slug: string; name: string }> | undefined)?.find(
      (s) => s.slug === params.service
    );
    activeFilters.push({
      key: 'service',
      label: foundServ?.name ?? params.service,
      removeHref: getRemoveHref('service'),
    });
  }
  if (params.exam) {
    const foundExam = (exams.data as Array<{ slug: string; name: string }> | undefined)?.find(
      (e) => e.slug === params.exam
    );
    activeFilters.push({
      key: 'exam',
      label: foundExam?.name ?? params.exam,
      removeHref: getRemoveHref('exam'),
    });
  }
  if (params.specialty) {
    const foundSpec = (specialties.data as Array<{ slug: string; name: string }> | undefined)?.find(
      (s) => s.slug === params.specialty
    );
    activeFilters.push({
      key: 'specialty',
      label: foundSpec?.name ?? params.specialty,
      removeHref: getRemoveHref('specialty'),
    });
  }
  if (params.species) {
    activeFilters.push({
      key: 'species',
      label: params.species === 'EXOTIC' ? 'Exóticos' : params.species,
      removeHref: getRemoveHref('species'),
    });
  }
  if (params.emergency === 'true') {
    activeFilters.push({
      key: 'emergency',
      label: 'Urgencia 24h',
      removeHref: getRemoveHref('emergency'),
    });
  }
  if (params.open_now === 'true') {
    activeFilters.push({
      key: 'open_now',
      label: 'Abierta ahora',
      removeHref: getRemoveHref('open_now'),
    });
  }
  if (params.verified_only === 'true') {
    activeFilters.push({
      key: 'verified_only',
      label: 'Verificadas',
      removeHref: getRemoveHref('verified_only'),
    });
  }
  if (params.sort) {
    const sortLabels: Record<string, string> = {
      PRICE_ASC: 'Precio menor a mayor',
      PRICE_DESC: 'Precio mayor a menor',
      VERIFICATION: 'Mayor verificación',
      DISTANCE: 'Cercanía geográfica',
      RELEVANCE: 'Relevancia',
    };
    activeFilters.push({
      key: 'sort',
      label: sortLabels[params.sort] ?? params.sort,
      removeHref: getRemoveHref('sort'),
    });
  }

  const emptyTitle = params.q
    ? `No encontramos resultados para «${params.q}»`
    : 'No encontramos veterinarias con estos criterios';

  return (
    <div className="space-y-6 py-2">
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { label: 'Directorio de Veterinarias' },
        ]}
      />

      {/* Encabezado del Directorio */}
      <div className="space-y-3 border-b border-border-subtle pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Clínicas Veterinarias en el Biobío
            </h1>
            <p className="mt-1 text-sm text-ink-mute" aria-live="polite">
              {result
                ? `Mostrando ${result.data.length} de ${result.meta.total} clínicas encontradas según los filtros aplicados.`
                : 'Directorio territorial verificado de atención de salud animal.'}
            </p>
          </div>

          {totalRegistry !== null && (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 border border-brand-200">
              {totalRegistry} establecimientos registrados
            </span>
          )}
        </div>

        {/* Chips de Filtros Activos con Botón de Quitar */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Filtros activos">
            <span className="text-xs font-semibold text-ink-mute">Filtros activos:</span>
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-300 bg-brand-50/70 px-3 py-1 text-xs font-medium text-brand-900"
              >
                <span>{f.label}</span>
                <Link
                  href={f.removeHref}
                  aria-label={`Quitar filtro ${f.label}`}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-brand-700 hover:bg-brand-200 hover:text-brand-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
                >
                  <span aria-hidden="true" className="font-bold">✕</span>
                </Link>
              </span>
            ))}
            <Link
              href="/veterinarias"
              className="inline-flex min-h-[32px] items-center text-xs font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
            >
              Restablecer todos
            </Link>
          </div>
        )}
      </div>

      {/* Estructura Principal: Filtros y Resultados */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Barra Lateral de Filtros */}
        <aside aria-label="Filtros de búsqueda" className="shrink-0">
          <Suspense fallback={<div className="h-96 rounded-xl bg-surface-alt animate-pulse" />}>
            <FilterPanel
              communes={communes.data ?? []}
              services={services.data ?? []}
              exams={exams.data ?? []}
              specialties={specialties.data ?? []}
            />
          </Suspense>
        </aside>

        {/* Sección de Resultados */}
        <section aria-label="Resultados de búsqueda" className="space-y-6">
          {failed || !result ? (
            <Alert tone="error" title="No pudimos cargar el directorio">
              <p>Ocurrió un problema de conexión al consultar los datos territoriales.</p>
              <div className="mt-3">
                <ButtonLink href="/veterinarias" variant="secondary" size="sm">
                  Reintentar búsqueda
                </ButtonLink>
              </div>
            </Alert>
          ) : result.data.length === 0 ? (
            <Empty
              title={emptyTitle}
              description="Es posible que ningún centro cumpla simultáneamente con todos los filtros elegidos."
              hints={[
                'Prueba seleccionando «Todo el Biobío» para ampliar la cobertura territorial.',
                'Si activaste urgencias 24h, verifica si existen clínicas con atención diurna en la zona.',
                'Revisa que el término de búsqueda no contenga errores ortográficos.',
              ]}
              action={
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ButtonLink href="/veterinarias" variant="primary">
                    Restablecer todos los filtros
                  </ButtonLink>
                  <Link
                    href="/aportar"
                    className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-700 hover:underline"
                  >
                    ¿Falta esta clínica? Aporta información &rarr;
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2">
                {result.data.map((clinic) => (
                  <li key={clinic.slug}>
                    <ClinicCard clinic={clinic} />
                  </li>
                ))}
              </ul>

              {/* Paginación Accesible */}
              <Pagination
                page={result.meta.page}
                totalPages={result.meta.totalPages}
                base={base.toString()}
              />
            </>
          )}

          {/* Aviso Metodológico al Pie (oculto en estado vacío de 0 resultados) */}
          {result && result.data.length > 0 && (
            <div className="rounded-xl border border-border-subtle bg-surface-alt p-4 text-xs text-ink-mute">
              <p className="flex items-start gap-2.5">
                <InfoIcon className="h-4 w-4 shrink-0 text-ink-mute mt-0.5" />
                <span>
                  <strong>Aviso de transparencia:</strong> Los aranceles desplegados son referenciales e informados según
                  el último cotejo disponible. El valor final puede variar de acuerdo a la complejidad del paciente, peso o
                  recargo de atención en horario nocturno. Confirma con la clínica antes de concurrir.
                </span>
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Barra Flotante de Comparación */}
      <CompareBar />
    </div>
  );
}
