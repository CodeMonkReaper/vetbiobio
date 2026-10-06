import Link from 'next/link';
import type { ClinicProfile } from '@/types/domain';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { ContactLink, TrackView } from '@/features/tracking/Track';

// Hero del perfil (§18): identidad, verificación, comuna y acciones. Sin "Reservar hora".
export function ClinicHero({ clinic, communeSlug }: { clinic: ClinicProfile; communeSlug: string }) {
  return (
    <section aria-labelledby="clinic-name" className="space-y-2">
      <TrackView slug={clinic.slug} />
      <div className="flex flex-wrap items-center gap-2">
        {clinic.is_sponsored && <Badge tone="info">Patrocinado</Badge>}
        {clinic.is_premium && <Badge tone="success">★ Premium</Badge>}
      </div>
      <h1 id="clinic-name" className="text-3xl font-bold">{clinic.name}</h1>
      <VerificationBadge status={clinic.verification_status} verifiedAt={clinic.verified_at} />
      <p className="text-ink-soft">
        {clinic.commune}, Biobío
        {clinic.is_emergency && ' · Atiende urgencias'}
        {clinic.is_24h && ' · 24 horas'}
        {clinic.open_now ? ' · Abierta ahora' : ''}
      </p>
      <p className="text-sm text-ink-mute">
        <Link href={`/veterinarias?commune=${communeSlug}`} className="hover:text-brand-700">
          Ver más en {clinic.commune}
        </Link>
      </p>
    </section>
  );
}
