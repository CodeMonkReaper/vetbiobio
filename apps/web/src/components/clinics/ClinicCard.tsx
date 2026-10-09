import Link from 'next/link';
import type { ClinicSummary } from '@/types/domain';
import { Card, FromPrice } from '@/components/ui/display';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { CompareButton } from '@/components/comparison/CompareButton';

/**
 * Tarjeta de clínica veterinaria (§14):
 * Muestra estado de verificación con doble codificación, arancel desde en formato tabular-nums,
 * estado horario y acciones táctiles de al menos 44px.
 */
export function ClinicCard({ clinic }: { clinic: ClinicSummary }) {
  const href = `/veterinarias/${clinic.commune_slug}/${clinic.slug}`;

  return (
    <Card hoverable className="flex h-full flex-col justify-between p-5">
      <div className="space-y-3">
        {/* Cabecera de Estados y Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <VerificationBadge
            status={clinic.verification_status}
            verifiedAt={clinic.verified_at}
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {clinic.is_24h && (
              <Badge tone="warning">🚨 24h</Badge>
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
              <span aria-hidden="true">📍</span>
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
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-normal text-ink-soft">Desde</span>
                <FromPrice min={clinic.min_price} />
              </div>
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
