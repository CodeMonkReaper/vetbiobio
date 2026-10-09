import Link from 'next/link';
import { fetchCatalog, fetchClinics } from '@/lib/api';
import { ClinicCard } from '@/components/clinics/ClinicCard';
import { Breadcrumbs } from '@/components/layout/chrome';
import { Empty } from '@/components/ui/display';
import { CatalogInteractiveGrid } from './CatalogInteractiveGrid';
import type { ClinicSummary } from '@/types/domain';

export type CatalogKind = 'services' | 'specialties' | 'exams';

export const KIND_META: Record<
  CatalogKind,
  {
    plural: string;
    singular: string;
    param: string;
    base: string;
    description: string;
    icon: string;
  }
> = {
  services: {
    plural: 'Servicios Veterinarios',
    singular: 'Servicio',
    param: 'service',
    base: '/servicios',
    description:
      'Catálogo de procedimientos clínicos, cirugías, vacunación y cuidados preventivos ofrecidos en el Biobío.',
    icon: '🩺',
  },
  specialties: {
    plural: 'Especialidades Médicas',
    singular: 'Especialidad',
    param: 'specialty',
    base: '/especialidades',
    description:
      'Disciplinas veterinarias avanzadas atendidas por médicos colegiados (oftalmología, cardiología, oncología y más).',
    icon: '🎓',
  },
  exams: {
    plural: 'Exámenes Diagnósticos',
    singular: 'Examen',
    param: 'exam',
    base: '/examenes',
    description:
      'Pruebas de laboratorio clínico, diagnóstico por imagen (ecografía, radiografía) y análisis patológico.',
    icon: '🔬',
  },
};

export async function CatalogList({ kind }: { kind: CatalogKind }) {
  const meta = KIND_META[kind];
  let items: Array<{ slug: string; name: string }>;
  try {
    const catalog = await fetchCatalog(kind);
    items = (catalog.data ?? []) as Array<{ slug: string; name: string }>;
  } catch {
    items = [];
  }

  return (
    <main className="max-w-7xl mx-auto space-y-6 py-2">
      <Breadcrumbs trail={[{ href: '/', label: 'Inicio' }, { label: meta.plural }]} />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{meta.icon}</span>
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
            Directorio Oficial del Biobío
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {meta.plural}
        </h1>
        <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mt-2">
          {meta.description}
        </p>
      </div>

      {items.length === 0 ? (
        <Empty
          title={`Aún no hay ${meta.plural.toLowerCase()} publicados.`}
          hints={['Vuelve pronto o revisa la búsqueda general.']}
        />
      ) : (
        <CatalogInteractiveGrid items={items} meta={meta} />
      )}
    </main>
  );
}

export async function CatalogDetail({ kind, slug }: { kind: CatalogKind; slug: string }) {
  const meta = KIND_META[kind];
  let items: Array<{ slug: string; name: string }>;
  try {
    const catalog = await fetchCatalog(kind);
    items = (catalog.data ?? []) as Array<{ slug: string; name: string }>;
  } catch {
    items = [];
  }
  const item = items.find((i) => i.slug === slug);
  if (!item) {
    return (
      <main className="max-w-7xl mx-auto space-y-4 py-2">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Inicio' },
            { href: meta.base, label: meta.plural },
            { label: slug },
          ]}
        />
        <Empty
          title={`${meta.singular} no encontrado.`}
          hints={['Revisa el listado o utiliza el buscador principal.']}
        />
      </main>
    );
  }

  let clinics: ClinicSummary[];
  let total = 0;
  try {
    const res = await fetchClinics({ [meta.param]: slug, limit: '12' });
    clinics = (res.data ?? []) as ClinicSummary[];
    total = res.meta?.total ?? clinics.length;
  } catch {
    clinics = [];
  }

  return (
    <main className="max-w-7xl mx-auto space-y-6 py-2">
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { href: meta.base, label: meta.plural },
          { label: item.name },
        ]}
      />

      {/* Hero Detalle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {meta.singular} Certificado
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Slug: {item.slug}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {item.name}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Encuentra clínicas veterinarias y hospitales que disponen de {item.name.toLowerCase()} en el Gran Concepción y comunas de la Región del Biobío.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-xl">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Disponibilidad Regional
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {total} {total === 1 ? 'veterinaria' : 'veterinarias'}
          </div>
          <Link
            href={`/veterinarias?${meta.param}=${slug}`}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
          >
            Ver en mapa y listado completo →
          </Link>
        </div>
      </div>

      {/* Resultados de clínicas */}
      {clinics.length === 0 ? (
        <Empty
          title="Ninguna veterinaria lo ofrece actualmente en los registros."
          hints={['Prueba consultando por comunas vecinas o revisa la atención de urgencia.']}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Clínicas que imparten {item.name} ({clinics.length})
            </h2>
            <Link
              href={meta.base}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Volver al catálogo de {meta.plural.toLowerCase()}
            </Link>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clinics.map((c) => (
              <li key={c.slug}>
                <ClinicCard clinic={c} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
