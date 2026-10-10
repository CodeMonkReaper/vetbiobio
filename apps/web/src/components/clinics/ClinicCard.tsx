import Link from 'next/link';
import Image from 'next/image';
import type { ClinicSummary } from '@/types/domain';
import { Card, FromPrice } from '@/components/ui/display';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { CompareButton } from '@/components/comparison/CompareButton';
import { EmergencyIcon, PinIcon } from '@/components/icons/PublicIcons';

/**
 * Tarjeta de clínica veterinaria (§14):
 * Muestra fotografía de portada, estado de verificación con doble codificación,
 * arancel desde en formato tabular-nums, estado horario y acciones táctiles de al menos 44px.
 */
export function ClinicCard({ clinic }: { clinic: ClinicSummary }) {
  const href = `/veterinarias/${clinic.commune_slug}/${clinic.slug}`;

  return (
    <Card hoverable className="group flex h-full flex-col justify-between p-5 motion-reduce:transform-none motion-reduce:transition-none">
      <div className="space-y-3">
        {/* Cabecera Visual (Fotografía real o Placeholder elegante con patrón de marca) */}
        <div className="-mx-5 -mt-5 mb-3.5 overflow-hidden rounded-t-xl bg-surface-alt">
          <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
            {clinic.cover_photo_url ? (
              <Image
                src={clinic.cover_photo_url}
                alt={`Instalaciones de ${clinic.name}`}
                width={480}
                height={192}
                className="h-36 w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                loading="lazy"
              />
            ) : (
              <div className="relative flex h-36 w-full items-center justify-center overflow-hidden border-b border-border-subtle bg-gradient-to-br from-brand-50/90 via-surface-alt to-brand-100/40 transition duration-300 group-hover:brightness-[0.98]">
                {/* Patrón geométrico sutil de fondo */}
                <div
                  className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#146354_1.5px,transparent_1.5px)] [background-size:14px_14px]"
                  aria-hidden="true"
                />
                {/* Emblema central de clínica veterinaria */}
                <div className="relative flex flex-col items-center gap-1.5 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200/70 bg-surface text-brand-600 shadow-sm transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium tracking-wide text-ink-mute">
                    Sin fotografía oficial
                  </span>
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Cabecera de Estados y Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <VerificationBadge
            status={clinic.verification_status}
            verifiedAt={clinic.verified_at}
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {clinic.is_24h && (
              <Badge tone="warning">
                <EmergencyIcon className="h-3.5 w-3.5" />
                <span>24h</span>
              </Badge>
            )}
            {clinic.is_premium && (
              <Badge tone="brand">★ Destacada</Badge>
            )}
            {clinic.is_sponsored && (
              <Badge tone="neutral">Patrocinada</Badge>
            )}
          </div>
        </div>

        {/* Nombre de la Clínica */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            <Link
              href={href}
              className="transition hover:text-brand-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 focus-visible:rounded"
            >
              {clinic.name}
            </Link>
          </h2>

          {/* Metadatos Territoriales y Horarios */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
            <span className="flex items-center gap-1 font-medium text-ink-soft">
              <PinIcon className="h-3.5 w-3.5 text-brand-600" />
              <span>{clinic.commune}</span>
            </span>

            {typeof clinic.km === 'number' && (
              <span className="flex items-center gap-1">
                <span>·</span>
                <span>{clinic.km.toFixed(1)} km</span>
              </span>
            )}

            {clinic.open_now !== null && (
              <span className="flex items-center gap-1.5">
                <span>·</span>
                {clinic.open_now ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-status-verified-text">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                    <span>Abierta ahora</span>
                  </span>
                ) : (
                  <span className="font-medium text-ink-mute">Cerrada ahora</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Bloque de Precios Referenciales */}
        <div className="rounded-lg bg-surface-alt p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
            Arancel referencial
          </span>
          <div className="mt-0.5 text-base font-bold text-ink">
            {clinic.min_price ? (
              <FromPrice min={clinic.min_price} />
            ) : (
              <span className="text-xs font-medium text-ink-mute">A consultar en mesón</span>
            )}
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-border-subtle">
        <Link
          href={href}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
        >
          Ver ficha completa
        </Link>
        <CompareButton slug={clinic.slug} name={clinic.name} />
      </div>
    </Card>
  );
}
