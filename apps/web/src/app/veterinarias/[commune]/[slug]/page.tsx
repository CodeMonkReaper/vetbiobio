import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchClinic, fetchClinicReliability } from '@/lib/api';
import { Breadcrumbs } from '@/components/layout/chrome';
import { ClinicHero } from '@/features/clinic-profile/ClinicHero';
import { ClinicContact } from '@/features/clinic-profile/ClinicContact';
import { ScheduleTable } from '@/features/clinic-profile/ScheduleTable';
import { ClinicExams, ClinicServices } from '@/features/clinic-profile/ClinicServices';
import { ClinicProfessionals } from '@/features/clinic-profile/ClinicProfessionals';
import { ClinicLocation, ClinicPhotos } from '@/features/clinic-profile/ClinicLocation';
import { Card } from '@/components/ui/display';
import type { ClinicProfile } from '@/types/domain';

interface Props {
  params: { commune: string; slug: string };
}

export async function generateMetadata({ params }: Props) {
  const profile = await fetchClinic(params.slug).catch(() => null);
  const name = (profile?.data?.name as string | undefined) ?? params.slug;
  return {
    title: `${name} en ${params.commune} | VetBiobío`,
    description: `${name}: aranceles referenciales, horarios de atención, servicios clínicos y verificación territorial en ${params.commune}, Biobío.`,
    alternates: { canonical: `/veterinarias/${params.commune}/${params.slug}` },
    openGraph: {
      title: `${name} | VetBiobío`,
      description: `Ficha verificada de ${name} en ${params.commune}, Biobío.`,
      type: 'article',
    },
  };
}

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function jsonLd(c: ClinicProfile) {
  const schedules = c.schedules.filter((h) => !h.is_closed && h.opening_time && h.closing_time);
  return {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: c.name,
    telephone: c.phone ?? undefined,
    url: c.website ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address,
      addressLocality: c.commune,
      addressRegion: 'Biobío',
      addressCountry: 'CL',
    },
    geo:
      typeof c.latitude === 'number' && typeof c.longitude === 'number'
        ? { '@type': 'GeoCoordinates', latitude: c.latitude, longitude: c.longitude }
        : undefined,
    openingHoursSpecification: schedules.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAYS[h.day_of_week],
      opens: (h.opening_time as string).slice(0, 5),
      closes: (h.closing_time as string).slice(0, 5),
    })),
  };
}

export default async function ClinicProfilePage({ params }: Props) {
  const [profile, reliability] = await Promise.all([
    fetchClinic(params.slug).catch(() => null) as Promise<{ data: ClinicProfile } | null>,
    fetchClinicReliability(params.slug).catch(() => null),
  ]);

  if (!profile || !profile.data) {
    notFound();
  }

  const c = profile.data;

  return (
    <div className="space-y-8 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(c)) }}
      />

      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { href: '/veterinarias', label: 'Veterinarias' },
          { href: `/veterinarias?commune=${params.commune}`, label: c.commune ?? params.commune },
          { label: c.name },
        ]}
      />

      {/* Cabecera Principal */}
      <ClinicHero
        clinic={c}
        communeSlug={params.commune}
        reliability={reliability}
      />

      {/* Estructura Principal en Dos Columnas */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Columna Principal: Servicios, Aranceles y Personal */}
        <div className="space-y-8">
          <ClinicServices services={c.services} />

          <ClinicExams exams={c.exams} />

          <ClinicProfessionals professionals={c.professionals} />

          {c.equipment && c.equipment.length > 0 && (
            <section aria-labelledby="equipamiento-titulo" className="space-y-3">
              <div className="border-b border-border-subtle pb-2">
                <h2 id="equipamiento-titulo" className="text-xl font-bold tracking-tight text-ink">
                  Equipamiento e infraestructura
                </h2>
              </div>
              <ul className="flex flex-wrap gap-2">
                {c.equipment.map((e) => (
                  <li
                    key={e.name}
                    className="inline-flex items-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-xs"
                  >
                    <span aria-hidden="true" className="mr-1.5 text-brand-600">
                      ✓
                    </span>
                    <span>{e.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ClinicPhotos photos={c.photos} />

          {/* Bloque de Transparencia y Reporte */}
          <Card className="p-5 bg-surface-alt/70 space-y-2">
            <p className="text-xs text-ink-mute leading-relaxed">
              <strong>Transparencia de aranceles:</strong> Los valores indicados corresponden a precios base informados
              y verificados territorialmente. Pueden existir variaciones por urgencias nocturnas, peso del paciente o insumos quirúrgicos.
            </p>
            <p className="text-xs text-ink-mute">
              ¿Detectaste algún dato erróneo o un cambio de arancel?{' '}
              <Link
                href={`/reportar?clinica=${encodeURIComponent(c.slug)}`}
                className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
              >
                Ayúdanos a corregirlo reportando la ficha aquí
              </Link>
              .
            </p>
          </Card>
        </div>

        {/* Columna Lateral: Contacto, Horarios y Ubicación */}
        <aside aria-label="Información de atención y contacto" className="space-y-6">
          <div className="lg:sticky lg:top-20 space-y-6">
            <ClinicContact clinic={c} />

            <ScheduleTable schedules={c.schedules} />

            <ClinicLocation clinic={c} />
          </div>
        </aside>
      </div>
    </div>
  );
}
