import Link from 'next/link';
import type { ClinicProfile } from '@/types/domain';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { TrackView, ContactLink } from '@/features/tracking/Track';
import { ClinicReliability, type ReliabilityData } from './ClinicReliability';
import { EmergencyIcon } from '@/components/icons/PublicIcons';

/**
 * Cabecera principal de la ficha (§18):
 * Identidad territorial, estado de verificación con doble codificación, acceso a confiabilidad y botón de llamada rápida.
 */
export function ClinicHero({
  clinic,
  communeSlug,
  reliability,
}: {
  clinic: ClinicProfile;
  communeSlug: string;
  reliability?: ReliabilityData | null;
}) {
  return (
    <section
      aria-labelledby="clinic-hero-title"
      className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card sm:p-8"
    >
      <TrackView slug={clinic.slug} />

      {/* Badges de Estado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge
            status={clinic.verification_status}
            verifiedAt={clinic.verified_at}
          />
          {clinic.is_24h && (
            <Badge tone="warning">
              <EmergencyIcon className="h-3.5 w-3.5" />
              <span>Urgencias 24 Horas</span>
            </Badge>
          )}
          {clinic.is_emergency && !clinic.is_24h && <Badge tone="warning">Urgencias</Badge>}
          {clinic.is_premium && <Badge tone="brand">★ Establecimiento Destacado</Badge>}
          {clinic.is_sponsored && <Badge tone="neutral">Patrocinado</Badge>}
        </div>

        {reliability && (
          <ClinicReliability data={reliability} clinicName={clinic.name} />
        )}
      </div>

      {/* Nombre y Dirección */}
      <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1
            id="clinic-hero-title"
            className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl"
          >
            {clinic.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <span aria-hidden="true">📍</span>
              <span>{clinic.address ? `${clinic.address}, ` : ''}{clinic.commune}</span>
            </span>

            {clinic.open_now !== null && (
              <span className="flex items-center gap-1.5">
                <span>·</span>
                {clinic.open_now ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-status-verified-text">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                    <span>Abierta ahora</span>
                  </span>
                ) : (
                  <span className="font-medium text-ink-mute">Cerrada en este momento</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Botón de Llamada Rápida en Urgencias (Mobile First) */}
        {clinic.phone && (
          <div className="shrink-0 pt-2 md:pt-0">
            <ContactLink
              href={`tel:${clinic.phone}`}
              slug={clinic.slug}
              type="phone_click"
            >
              <span className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700">
                <span aria-hidden="true">📞</span>
                <span>Llamar ahora</span>
              </span>
            </ContactLink>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle text-xs text-ink-mute">
        <Link
          href={`/veterinarias?commune=${communeSlug}`}
          className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 focus-visible:rounded"
        >
          &larr; Explorar más clínicas veterinarias en {clinic.commune}
        </Link>
      </div>
    </section>
  );
}
