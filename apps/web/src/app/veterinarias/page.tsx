import { Suspense } from 'react';
import { fetchClinics, fetchCatalog } from '@/lib/api';
import { ClinicCard } from '@/components/clinics/ClinicCard';
import { FilterPanel } from '@/components/search/FilterPanel';
import { CompareBar } from '@/components/comparison/CompareButton';
import { Pagination } from '@/components/ui/Pagination';
import { Alert, Empty } from '@/components/ui/display';
import { Breadcrumbs } from '@/components/layout/chrome';
import type { ClinicSummary } from '@/types/domain';

interface Props {
  searchParams: Record<string, string | undefined>;
}

export async function generateMetadata({ searchParams }: Props) {
  const q = searchParams.q ? ` ${searchParams.q}` : '';
  return {
    title: `Veterinarias${q} en Biobío | VetBiobío`,
    alternates: { canonical: '/veterinarias' },
  };
}

// Listado SSR (§13, §24, §25): filtros en URL, cards, paginación y estados.
export default async function Listing({ searchParams }: Props) {
  const params: Record<string, string> = {};
  for (const k of ['q', 'commune', 'service', 'exam', 'specialty', 'emergency', 'verified_only', 'sort', 'page', 'limit']) {
    if (searchParams[k]) params[k] = searchParams[k] as string;
  }

  let result: { data: ClinicSummary[]; meta: { total: number; page: number; totalPages: number } } | null = null;
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
    <main className="space-y-4">
      <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { label: 'Veterinarias' }]} />
      <h1 className="text-2xl font-bold">
        Veterinarias{result ? ` (${result.meta.total})` : ''}
      </h1>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside aria-label="Filtros">
          <Suspense>
            <FilterPanel
              communes={communes.data ?? []}
              services={services.data ?? []}
              exams={exams.data ?? []}
              specialties={specialties.data ?? []}
            />
          </Suspense>
        </aside>

        <section aria-label="Resultados" className="space-y-4">
          {failed || !result ? (
            <Alert tone="error">
              No pudimos cargar las veterinarias. <a href="/veterinarias" className="underline">Intentar nuevamente</a>
            </Alert>
          ) : result.data.length === 0 ? (
            <Empty
              title="No encontramos veterinarias con estos criterios."
              hints={['Ampliar la ubicación.', 'Eliminar algún filtro.', 'Buscar otro servicio.']}
            />
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2">
                {result.data.map((c) => (
                  <li key={c.slug}>
                    <ClinicCard clinic={c} />
                  </li>
                ))}
              </ul>
              <Pagination page={result.meta.page} totalPages={result.meta.totalPages} base={base.toString()} />
            </>
          )}
        </section>
      </div>

      <CompareBar />
      <p><small>Precios referenciales. Confirma directamente con el establecimiento.</small></p>
    </main>
  );
}
