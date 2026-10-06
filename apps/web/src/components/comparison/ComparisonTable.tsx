import type { ClinicProfile } from '@/types/domain';
import { VerificationBadge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/prices';

export interface CompareRow {
  label: string;
  get: (c: ClinicProfile) => React.ReactNode;
}

interface Priced {
  slug: string;
  min_amount: number | null;
  max_amount: number | null;
  pricing_type: string;
}

function priceOf(list: Priced[], slug: string): string {
  const p = list.find((x) => x.slug === slug);
  if (!p) return 'No';
  if (p.pricing_type === 'CONTACT') return 'A convenir';
  return formatPrice(p.min_amount, p.max_amount, p.pricing_type as 'FIXED' | 'RANGE' | 'FROM');
}

export function compareRows(): CompareRow[] {
  return [
    { label: 'Comuna', get: (c) => c.commune ?? '—' },
    { label: 'Distancia', get: (c) => (typeof c.km === 'number' ? `${c.km.toFixed(1)} km` : '—') },
    { label: 'Consulta', get: (c) => priceOf(c.services as unknown as Priced[], 'consulta-general') },
    { label: 'Radiografía', get: (c) => priceOf(c.exams as unknown as Priced[], 'radiografia') },
    { label: 'Ecografía', get: (c) => priceOf(c.exams as unknown as Priced[], 'ecografia') },
    { label: 'Urgencias', get: (c) => (c.is_emergency ? 'Sí' : 'No') },
    { label: 'Abierto ahora', get: (c) => (c.open_now ? 'Sí' : 'No') },
    {
      label: 'Verificación',
      get: (c) => <VerificationBadge status={c.verification_status} verifiedAt={c.verified_at} />,
    },
  ];
}

// Tabla desktop + cards apiladas en mobile con scroll horizontal accesible (§23).
export function ComparisonTable({ clinics }: { clinics: ClinicProfile[] }) {
  const rows = compareRows();
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse rounded-lg bg-white text-left shadow-card">
          <caption className="sr-only">Comparación de veterinarias</caption>
          <thead>
            <tr className="border-b border-slate-200">
              <th scope="col" className="px-4 py-3 font-medium text-ink-soft">Criterio</th>
              {clinics.map((c) => (
                <th key={c.slug} scope="col" className="px-4 py-3">
                  <a href={`/veterinarias/${c.commune_slug}/${c.slug}`} className="font-semibold hover:text-brand-700">
                    {c.name}
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="px-4 py-2 font-medium text-ink-soft">{r.label}</th>
                {clinics.map((c) => (
                  <td key={c.slug} className="px-4 py-2">{r.get(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: una card por clínica con sus filas */}
      <div className="grid gap-4 md:hidden">
        {clinics.map((c) => (
          <section key={c.slug} aria-label={c.name} className="rounded-lg border border-slate-200 bg-white shadow-card">
            <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">
              <a href={`/veterinarias/${c.commune_slug}/${c.slug}`} className="hover:text-brand-700">{c.name}</a>
            </h2>
            <dl className="divide-y divide-slate-100">
              {rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-4 px-4 py-2">
                  <dt className="font-medium text-ink-soft">{r.label}</dt>
                  <dd className="text-right">{r.get(c)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
