import type { ProfilePricedItem } from '@/types/domain';
import { Card, PriceDisplay } from '@/components/ui/display';
import { VerificationBadge } from '@/components/ui/Badge';

function PricedList({ items }: { items: ProfilePricedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle bg-surface-alt p-6 text-center text-sm text-ink-mute">
        No hay aranceles registrados en esta categoría para este establecimiento.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((s) => (
        <li key={s.slug}>
          <Card className="flex h-full flex-col justify-between p-4 space-y-3">
            <div>
              <p className="font-bold text-ink text-base">{s.name}</p>
              <div className="mt-1">
                <VerificationBadge
                  status={s.verification_status}
                  verifiedAt={s.verified_at}
                />
              </div>
            </div>

            <div className="rounded-lg bg-surface-alt p-2.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
                Arancel referencial
              </span>
              <div className="text-base font-bold text-ink">
                <PriceDisplay min={s.min_amount} max={s.max_amount} type={s.pricing_type} />
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function ClinicServices({ services }: { services: ProfilePricedItem[] }) {
  return (
    <section aria-labelledby="servicios-titulo" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-2">
        <h2 id="servicios-titulo" className="text-xl font-bold tracking-tight text-ink">
          Servicios clínicos y aranceles referenciales
        </h2>
        <span className="text-xs text-ink-mute">
          Valores base en mesón informados
        </span>
      </div>
      <PricedList items={services} />
    </section>
  );
}

export function ClinicExams({ exams }: { exams: ProfilePricedItem[] }) {
  return (
    <section aria-labelledby="examenes-titulo" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-2">
        <h2 id="examenes-titulo" className="text-xl font-bold tracking-tight text-ink">
          Exámenes y diagnóstico clínico
        </h2>
        <span className="text-xs text-ink-mute">
          Laboratorio e imagenología
        </span>
      </div>
      <PricedList items={exams} />
    </section>
  );
}
