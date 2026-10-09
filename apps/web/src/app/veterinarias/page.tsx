import { Suspense } from 'react';
import Link from 'next/link';
import { fetchClinics, fetchCatalog } from '@/lib/api';
import { ClinicCard } from '@/components/clinics/ClinicCard';
import { FilterPanel } from '@/components/search/FilterPanel';
import { CompareBar } from '@/components/comparison/CompareButton';
import { Pagination } from '@/components/ui/Pagination';
import { Alert, Empty } from '@/components/ui/display';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/layout/chrome';
import type { ClinicSummary } from '@/types/domain';

interface Props {
  searchParams: Record<string, string | undefined>;
}

export async function generateMetadata({ searchParams }: Props) {
  const q = searchParams.q ? ` "${searchParams.q}"` : '';
  const com = searchParams.commune ? ` en ${searchParams.commune}` : '';
  return {
    title: `Directorio de Veterinarias${q}${com} | VetBiobío`,
    description: `Consulta clínicas veterinarias verificadas en la Región del Biobío con aranceles referenciales y urgencias 24h.`,
    alternates: { canonical: '/veterinarias' },
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
    'emergency',
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
  } catch {
    failed = true;
  }

  const [communes, services, exams, specialties] = await Promise.all([
    fetchCatalog('communes'),
    fetchCatalog('services'),
    fetchCatalog('exams'),
    fetchCatalog('specialties'),
  ]);

  const base = new URLSearchParams(params);
  base.delete('page');

  return (
    <div className="space-y-6 py-2">
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { label: 'Directorio de Veterinarias' },
        ]}
      />

      {/* Encabezado del Directorio */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Clínicas Veterinarias en el Biobío
          </h1>
          <p className="mt-1 text-sm text-ink-mute">
            {result
              ? `Mostrando ${result.data.length} de ${result.meta.total} clínicas encontradas según los filtros aplicados.`
              : 'Directorio territorial verificado de atención de salud animal.'}
          </p>
        </div>

        {result && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 border border-brand-200">
            {result.meta.total} establecimientos registrados
          </span>
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
                <Link href="/veterinarias">
                  <Button variant="secondary" size="sm">
                    Reintentar búsqueda
                  </Button>
                </Link>
              </div>
            </Alert>
          ) : result.data.length === 0 ? (
            <Empty
              title="No encontramos veterinarias con estos criterios"
              description="Es posible que ningún centro cumpla simultáneamente con todos los filtros elegidos."
              hints={[
                'Prueba ampliando la comuna o quitando el filtro de urgencias 24h.',
                'Revisa que el término de búsqueda no contenga errores ortográficos.',
                'Verifica en comunas aledañas del Gran Concepción.',
              ]}
              action={
                <Link href="/veterinarias">
                  <Button variant="primary">Restablecer todos los filtros</Button>
                </Link>
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

          {/* Aviso Metodológico al Pie */}
          <div className="rounded-xl border border-border-subtle bg-surface-alt p-4 text-xs text-ink-mute">
            <p className="flex items-start gap-2">
              <span aria-hidden="true" className="select-none font-bold">
                ℹ️
              </span>
              <span>
                <strong>Aviso de transparencia:</strong> Los aranceles desplegados son referenciales e informados según
                el último cotejo disponible. El valor final puede variar de acuerdo a la complejidad del paciente, peso o
                recargo de atención en horario nocturno. Confirma con la clínica antes de concurrir.
              </span>
            </p>
          </div>
        </section>
      </div>

      {/* Barra Flotante de Comparación */}
      <CompareBar />
    </div>
  );
}
