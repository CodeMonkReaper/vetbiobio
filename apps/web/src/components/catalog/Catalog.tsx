import Link from 'next/link';
import { fetchCatalog, fetchClinics } from '@/lib/api';
import { ClinicCard } from '@/components/clinics/ClinicCard';
import { Breadcrumbs } from '@/components/layout/chrome';
import { Empty } from '@/components/ui/display';
import { Card } from '@/components/ui/display';
import type { ClinicSummary } from '@/types/domain';

export type CatalogKind = 'services' | 'specialties' | 'exams';

export const KIND_META: Record<CatalogKind, { plural: string; singular: string; param: string; base: string }> = {
  services: { plural: 'Servicios', singular: 'Servicio', param: 'service', base: '/servicios' },
  specialties: { plural: 'Especialidades', singular: 'Especialidad', param: 'specialty', base: '/especialidades' },
  exams: { plural: 'Exámenes', singular: 'Examen', param: 'exam', base: '/examenes' },
};

export async function CatalogList({ kind }: { kind: CatalogKind }) {
  const meta = KIND_META[kind];
  let items: Array<{ slug: string; name: string }> = [];
  try {
    const catalog = await fetchCatalog(kind);
    items = (catalog.data ?? []) as Array<{ slug: string; name: string }>;
  } catch {
    items = [];
  }
  return (
    <main className="space-y-4">
      <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { label: meta.plural }]} />
      <h1 className="text-2xl font-bold">{meta.plural}</h1>
      {items.length === 0 ? (
        <Empty title={`Aún no hay ${meta.plural.toLowerCase()} publicados.`} hints={['Vuelve pronto.']} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.slug}>
              <Link href={`${meta.base}/${i.slug}`}>
                <Card className="px-4 py-3 font-medium text-brand-800 hover:border-brand-400">{i.name}</Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export async function CatalogDetail({ kind, slug }: { kind: CatalogKind; slug: string }) {
  const meta = KIND_META[kind];
  let items: Array<{ slug: string; name: string }> = [];
  try {
    const catalog = await fetchCatalog(kind);
    items = (catalog.data ?? []) as Array<{ slug: string; name: string }>;
  } catch {
    items = [];
  }
  const item = items.find((i) => i.slug === slug);
  if (!item) {
    return (
      <main className="space-y-4">
        <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { href: meta.base, label: meta.plural }, { label: slug }]} />
        <Empty title={`${meta.singular} no encontrado.`} hints={['Revisa el listado.']} />
      </main>
    );
  }
  let clinics: ClinicSummary[] = [];
  let total = 0;
  try {
    const res = await fetchClinics({ [meta.param]: slug, limit: '12' });
    clinics = (res.data ?? []) as ClinicSummary[];
    total = res.meta?.total ?? clinics.length;
  } catch {
    clinics = [];
  }
  return (
    <main className="space-y-4">
      <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { href: meta.base, label: meta.plural }, { label: item.name }]} />
      <h1 className="text-2xl font-bold">{item.name}</h1>
      <p>
        <Link href={`/veterinarias?${meta.param}=${slug}`} className="text-brand-700 underline">
          Ver todas en el listado ({total})
        </Link>
      </p>
      {clinics.length === 0 ? (
        <Empty title="Ninguna veterinaria lo ofrece todavía." hints={['Prueba con otro servicio.']} />
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
