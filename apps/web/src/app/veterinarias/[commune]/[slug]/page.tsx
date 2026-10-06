import { notFound } from 'next/navigation';
import { fetchClinic } from '@/lib/api';
import { ClinicMap } from '@/features/maps/ClinicMap';
import { ContactLink, TrackView } from '@/features/tracking/Track';

interface Props { params: { commune: string; slug: string } }

// Ruta SEO /veterinarias/[commune]/[slug] — backend resuelve por slug (ADR-004).
export async function generateMetadata({ params }: Props) {
  const profile = await fetchClinic(params.slug).catch(() => null);
  const name = (profile?.data?.name as string | undefined) ?? params.slug;
  return {
    title: `${name} en ${params.commune} | VetBiobío`,
    alternates: { canonical: `/veterinarias/${params.commune}/${params.slug}` },
  };
}

function badge(status: string, verifiedAt: string | null) {
  if (status === 'VERIFIED') return `✓ Información verificada — Verificada el ${verifiedAt?.slice(0, 10) ?? ''}`;
  if (status === 'OUTDATED') return `⚠ Posiblemente desactualizada — Última verificación: ${verifiedAt?.slice(0, 10) ?? 's/f'}`;
  return 'ⓘ Información sin verificar';
}

function price(p: { min_amount: number | null; max_amount: number | null; pricing_type: string; currency: string }) {
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;
  if (p.pricing_type === 'FIXED' && p.min_amount !== null) return fmt(p.min_amount);
  if (p.pricing_type === 'RANGE' && p.min_amount !== null && p.max_amount !== null) return `${fmt(p.min_amount)} – ${fmt(p.max_amount)}`;
  if (p.pricing_type === 'FROM' && p.min_amount !== null) return `Desde ${fmt(p.min_amount)}`;
  return 'Precio a convenir';
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Item = Record<string, unknown>;

function jsonLd(c: Item) {
  const schedules = (c.schedules as Item[]).filter((h) => !(h.is_closed as boolean) && h.opening_time);
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
    geo: typeof c.latitude === 'number' ? { '@type': 'GeoCoordinates', latitude: c.latitude, longitude: c.longitude } : undefined,
    openingHoursSpecification: schedules.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAYS[h.day_of_week as number],
      opens: (h.opening_time as string).slice(0, 5),
      closes: (h.closing_time as string).slice(0, 5),
    })),
  };
}

export default async function ClinicProfile({ params }: Props) {
  const profile = await fetchClinic(params.slug).catch(() => null);
  if (!profile) notFound();
  const c = profile.data as Item;
  const wa = c.whatsapp as string | null;
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(c)) }} />
      <TrackView slug={params.slug} />
      {(c.is_sponsored as boolean) && <p><strong>Patrocinado</strong> <small>(publicidad pagada, no afecta la verificación)</small></p>}
      {(c.is_premium as boolean) && <p><span>★ Perfil Premium</span></p>}
      <h1>{c.name as string}</h1>
      <p><small>{badge(c.verification_status as string, c.verified_at as string | null)}</small></p>
      <p>{c.address as string}, {c.commune as string}</p>
      {(c.is_emergency as boolean) && <p><strong>Atiende urgencias</strong>{(c.is_24h as boolean) ? ' — 24 horas' : ''}</p>}
      {(c.open_now as boolean) ? <p>Abierta ahora</p> : <p><small>Cerrada en este momento (según horario informado)</small></p>}

      <h2>Contacto</h2>
      <ul>
        {(c.phone as string | null) && <li><ContactLink href={`tel:${c.phone as string}`} slug={params.slug} type="phone_click">{c.phone as string}</ContactLink></li>}
        {wa && <li><ContactLink href={`https://wa.me/${(wa as string).replace('+', '')}`} slug={params.slug} type="whatsapp_click" external>WhatsApp</ContactLink></li>}
        {(c.website as string | null) && <li><ContactLink href={c.website as string} slug={params.slug} type="website_click" external>Sitio web</ContactLink></li>}
      </ul>

      <h2>Ubicación</h2>
      {typeof c.latitude === 'number' && typeof c.longitude === 'number' ? (
        <ClinicMap lat={c.latitude as number} lng={c.longitude as number} label={c.name as string} />
      ) : <p>Sin coordenadas.</p>}

      <h2>Horarios</h2>
      {(c.schedules as Item[]).length === 0 && <p>Horario no informado.</p>}
      <ul>
        {(c.schedules as Item[]).map((h, i) => (
          <li key={i}>{DAYS[h.day_of_week as number]}: {(h.is_closed as boolean) ? 'Cerrado' : `${h.opening_time as string}–${h.closing_time as string}`}</li>
        ))}
      </ul>

      <h2>Servicios y precios</h2>
      <ul>
        {(c.services as Item[]).map((s) => (
          <li key={s.slug as string}>{s.name as string} — {price(s as unknown as { min_amount: number | null; max_amount: number | null; pricing_type: string; currency: string })} <small>({badge(s.verification_status as string, s.verified_at as string | null)})</small></li>
        ))}
      </ul>

      <h2>Exámenes</h2>
      <ul>
        {(c.exams as Item[]).map((e) => (
          <li key={e.slug as string}>{e.name as string} — {price(e as unknown as { min_amount: number | null; max_amount: number | null; pricing_type: string; currency: string })}</li>
        ))}
      </ul>

      <h2>Profesionales</h2>
      <ul>
        {(c.professionals as Item[]).map((p, i) => (
          <li key={i}>{p.display_name as string} ({p.professional_type as string}){(p.specialties as string) ? ` — ${p.specialties as string}` : ''}</li>
        ))}
      </ul>

      {(c.equipment as Item[]).length > 0 && (
        <><h2>Equipamiento</h2><ul>{(c.equipment as Item[]).map((e, i) => <li key={i}>{e.name as string}</li>)}</ul></>
      )}

      <p><small>Precios referenciales, pueden variar. Confirma directamente con el establecimiento.</small></p>
      <p><small>¿Encontraste información incorrecta? <a href={`/reportar?clinica=${params.slug}`}>Reportar</a></small></p>
    </main>
  );
}
