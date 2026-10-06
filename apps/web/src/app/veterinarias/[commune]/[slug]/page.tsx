import { notFound } from 'next/navigation';
import { fetchClinic } from '@/lib/api';
import { Breadcrumbs } from '@/components/layout/chrome';
import { ClinicHero } from '@/features/clinic-profile/ClinicHero';
import { ClinicContact } from '@/features/clinic-profile/ClinicContact';
import { ScheduleTable } from '@/features/clinic-profile/ScheduleTable';
import { ClinicExams, ClinicServices } from '@/features/clinic-profile/ClinicServices';
import { ClinicProfessionals } from '@/features/clinic-profile/ClinicProfessionals';
import { ClinicLocation, ClinicPhotos } from '@/features/clinic-profile/ClinicLocation';
import type { ClinicProfile } from '@/types/domain';

interface Props {
  params: { commune: string; slug: string };
}

// Ruta SEO /veterinarias/[commune]/[slug] — backend resuelve por slug (ADR-004).
export async function generateMetadata({ params }: Props) {
  const profile = await fetchClinic(params.slug).catch(() => null);
  const name = (profile?.data?.name as string | undefined) ?? params.slug;
  return {
    title: `${name} en ${params.commune} | VetBiobío`,
    description: `${name}: dirección, horarios, servicios, precios y verificación en ${params.commune}, Biobío.`,
    alternates: { canonical: `/veterinarias/${params.commune}/${params.slug}` },
    openGraph: { title: `${name} | VetBiobío`, type: 'article' },
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
    geo: typeof c.latitude === 'number' && typeof c.longitude === 'number'
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

export default async function ClinicProfile({ params }: Props) {
  const profile = (await fetchClinic(params.slug).catch(() => null)) as { data: ClinicProfile } | null;
  if (!profile) notFound();
  const c = profile.data;

  return (
    <main className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(c)) }} />
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { href: '/veterinarias', label: 'Veterinarias' },
          { href: `/veterinarias?commune=${params.commune}`, label: c.commune ?? params.commune },
          { label: c.name },
        ]}
      />
      <ClinicHero clinic={c} communeSlug={params.commune} />
      <ClinicContact clinic={c} />
      <ClinicLocation clinic={c} />
      <ScheduleTable schedules={c.schedules} />
      <ClinicServices services={c.services} />
      <ClinicExams exams={c.exams} />
      <ClinicProfessionals professionals={c.professionals} />
      {c.equipment.length > 0 && (
        <section aria-labelledby="equipamiento" className="space-y-2">
          <h2 id="equipamiento" className="text-xl font-semibold">Equipamiento</h2>
          <ul className="flex flex-wrap gap-2">
            {c.equipment.map((e) => (
              <li key={e.name} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm">
                {e.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      <ClinicPhotos photos={c.photos} />
      <p className="text-sm text-ink-soft">
        Precios referenciales, pueden variar. Confirma directamente con el establecimiento.
      </p>
      <p className="text-sm text-ink-soft">
        ¿Encontraste información incorrecta? <a href={`/reportar?clinica=${c.slug}`} className="underline hover:text-brand-700">Reportar</a>
      </p>
    </main>
  );
}
