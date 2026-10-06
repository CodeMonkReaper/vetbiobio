import Link from 'next/link';
import type { ClinicSummary } from '@/types/domain';
import { Card, FromPrice } from '@/components/ui/display';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { CompareButton } from '@/components/comparison/CompareButton';

// Tarjeta de veterinaria (§14): imagen (cuando haya), verificación, premium,
// comuna, distancia, precio desde, horario y acciones.
export function ClinicCard({ clinic }: { clinic: ClinicSummary }) {
  const href = `/veterinarias/${clinic.commune_slug}/${clinic.slug}`;
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {clinic.is_sponsored && <Badge tone="info">Patrocinado</Badge>}
        {clinic.is_premium && <Badge tone="success">★ Premium</Badge>}
      </div>
      <h2 className="text-lg font-semibold">
        <Link href={href} className="hover:text-brand-700">
          {clinic.name}
        </Link>
      </h2>
      <VerificationBadge status={clinic.verification_status} verifiedAt={clinic.verified_at} />
      <p className="text-sm text-ink-soft">
        {clinic.commune}
        {typeof clinic.km === 'number' && ` · ${clinic.km.toFixed(1)} km`}
        {clinic.open_now ? ' · Abierta ahora' : ''}
      </p>
      <p className="text-sm">
        Desde: <FromPrice min={clinic.min_price} />
      </p>
      <div className="mt-auto flex gap-2 pt-2">
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Ver perfil
        </Link>
        <CompareButton slug={clinic.slug} name={clinic.name} />
      </div>
    </Card>
  );
}
