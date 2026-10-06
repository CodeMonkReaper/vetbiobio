import type { PricingType } from '@/types/domain';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white shadow-card ${className}`}>{children}</div>;
}

// Precio CLP (§16): exacto / desde / rango / a convenir, siempre con moneda.
export function PriceDisplay({ min, max, type }: {
  min: number | null; max: number | null; type: PricingType;
}) {
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;
  const text =
    type === 'FIXED' && min !== null ? `${fmt(min)} CLP`
    : type === 'RANGE' && min !== null && max !== null ? `${fmt(min)} – ${fmt(max)} CLP`
    : type === 'FROM' && min !== null ? `Desde ${fmt(min)} CLP`
    : 'Consultar precio';
  return <span className="font-semibold text-ink">{text}</span>;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function Alert({ tone = 'info', children }: {
  tone?: 'info' | 'success' | 'warning' | 'error'; children: React.ReactNode;
}) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-brand-200 bg-brand-50 text-brand-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  } as const;
  return <div role="alert" className={`rounded border px-4 py-3 ${tones[tone]}`}>{children}</div>;
}

export function Empty({ title, hints }: { title: string; hints: string[] }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-lg font-medium">{title}</p>
      <ul className="mt-2 space-y-1 text-ink-soft">
        {hints.map((h) => <li key={h}>{h}</li>)}
      </ul>
    </div>
  );
}
