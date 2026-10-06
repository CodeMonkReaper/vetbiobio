import { fetchCompare } from '@/lib/api';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { Breadcrumbs } from '@/components/layout/chrome';
import { Empty } from '@/components/ui/display';
import type { ClinicProfile } from '@/types/domain';

interface Props {
  searchParams: Record<string, string | undefined>;
}

export async function generateMetadata() {
  return {
    title: 'Comparar veterinarias | VetBiobío',
    alternates: { canonical: '/comparar' },
    robots: { index: false, follow: true },
  };
}

// ?slugs=a,b[,c] (&lat&lng opcionales). Máx 3 (API valida).
export default async function Compare({ searchParams }: Props) {
  const slugs = (searchParams.slugs ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  if (slugs.length < 2) {
    return (
      <main className="space-y-4">
        <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { label: 'Comparar' }]} />
        <h1 className="text-2xl font-bold">Comparar</h1>
        <Empty
          title="Elige 2 o 3 clínicas para comparar."
          hints={['Usa el botón “Comparar” en cada tarjeta del listado.']}
        />
      </main>
    );
  }

  let profiles: ClinicProfile[] | null;
  try {
    const res = await fetchCompare(slugs, searchParams.lat, searchParams.lng);
    profiles = res.data as ClinicProfile[];
  } catch {
    profiles = null;
  }

  return (
    <main className="space-y-4">
      <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { label: 'Comparar' }]} />
      <h1 className="text-2xl font-bold">Comparar</h1>
      {!profiles ? (
        <Empty
          title="No pudimos cargar la comparación."
          hints={['Revisa que los nombres sean válidos.', 'Vuelve al listado y elige de nuevo.']}
        />
      ) : (
        <ComparisonTable clinics={profiles} />
      )}
      <p className="text-sm text-ink-soft">
        Precios referenciales. La verificación y la monetización son independientes: un perfil
        patrocinado no implica verificación.
      </p>
    </main>
  );
}
