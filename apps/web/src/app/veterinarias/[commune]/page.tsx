import Link from 'next/link';
import { fetchCatalog, fetchClinics } from '@/lib/api';
import { ClinicCard } from '@/components/clinics/ClinicCard';
import { Breadcrumbs } from '@/components/layout/chrome';
import { Empty } from '@/components/ui/display';
import type { ClinicSummary } from '@/types/domain';

// Listado por comuna (§58): /veterinarias/concepcion. Convive con ?commune=.
export async function generateMetadata({ params }: { params: { commune: string } }) {
  return {
    title: `Veterinarias en ${params.commune} | VetBiobío`,
    alternates: { canonical: `/veterinarias/${params.commune}` },
  };
}

export default async function PorComuna({ params }: { params: { commune: string } }) {
  const communes = await fetchCatalog('communes');
  const found = ((communes.data ?? []) as Array<{ slug: string; name: string }>).find(
    (c) => c.slug === params.commune,
  );
  if (!found) {
    return (
      <main className="space-y-4">
        <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { href: '/veterinarias', label: 'Veterinarias' }, { label: params.commune }]} />
        <Empty title="Comuna no encontrada." hints={['Vuelve al listado general.']} />
      </main>
    );
  }
  const res = await fetchClinics({ commune: params.commune, limit: '20' });
  const clinics = (res.data ?? []) as ClinicSummary[];
  return (
    <main className="space-y-4">
      <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { href: '/veterinarias', label: 'Veterinarias' }, { label: found.name }]} />
      <h1 className="text-2xl font-bold">Veterinarias en {found.name} ({res.meta?.total ?? 0})</h1>
      <p>
        <Link href={`/veterinarias?commune=${params.commune}`} className="text-brand-700 underline">
          Filtrar y ordenar
        </Link>
      </p>
      {clinics.length === 0 ? (
        <Empty title="Aún no hay veterinarias aquí." hints={['Prueba con otra comuna.']} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {clinics.map((c) => (
            <li key={c.slug}>
              <ClinicCard clinic={c} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
