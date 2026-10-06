import type { ProfilePricedItem } from '@/types/domain';
import { Card, PriceDisplay } from '@/components/ui/display';
import { VerificationBadge } from '@/components/ui/Badge';

// Servicios y exámenes con precio vigente y verificación propia (§19).
function PricedList({ items }: { items: ProfilePricedItem[] }) {
  if (items.length === 0) return <p className="text-ink-soft">Información no disponible</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((s) => (
        <li key={s.slug}>
          <Card className="space-y-1 p-4">
            <p className="font-medium">{s.name}</p>
            <PriceDisplay min={s.min_amount} max={s.max_amount} type={s.pricing_type} />
            <div>
              <VerificationBadge status={s.verification_status} verifiedAt={s.verified_at} />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function ClinicServices({ services }: { services: ProfilePricedItem[] }) {
  return (
    <section aria-labelledby="servicios" className="space-y-3">
      <h2 id="servicios" className="text-xl font-semibold">Servicios y precios</h2>
      <PricedList items={services} />
    </section>
  );
}

export function ClinicExams({ exams }: { exams: ProfilePricedItem[] }) {
  return (
    <section aria-labelledby="examenes" className="space-y-3">
      <h2 id="examenes" className="text-xl font-semibold">Exámenes</h2>
      <PricedList items={exams} />
    </section>
  );
}
