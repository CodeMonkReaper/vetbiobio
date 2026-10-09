import type { ReactNode } from 'react';
import type { PricingType } from '@/types/domain';
import { formatFrom, formatPrice } from '@/lib/prices';

export function Card({
  children,
  className = '',
  hoverable = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-border-subtle bg-surface shadow-card transition-shadow ${
        hoverable ? 'hover:shadow-md hover:border-border-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Precio CLP (§16): exacto / desde / rango / a convenir, siempre con moneda y números tabulares.
 */
export function PriceDisplay({
  min,
  max,
  type,
  className = '',
}: {
  min: number | null;
  max: number | null;
  type: PricingType;
  className?: string;
}) {
  return (
    <span className={`tabular-nums font-semibold text-ink ${className}`}>
      {formatPrice(min, max, type)}
    </span>
  );
}

/**
 * Precio "desde" para cards y listados rápidos.
 */
export function FromPrice({
  min,
  className = '',
}: {
  min: number | null;
  className?: string;
}) {
  return (
    <span className={`tabular-nums font-semibold text-ink ${className}`}>
      {formatFrom(min)}
    </span>
  );
}

/**
 * Skeleton accesible respetando preferencias de movimiento reducido.
 */
export function Skeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200 motion-reduce:animate-none ${className}`}
    />
  );
}

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

const ALERT_CONFIG: Record<
  AlertTone,
  {
    classes: string;
    icon: ReactNode;
  }
> = {
  info: {
    classes: 'border-status-unverified-border bg-status-unverified-bg text-status-unverified-text',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  success: {
    classes: 'border-status-verified-border bg-status-verified-bg text-status-verified-text',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    classes: 'border-status-outdated-border bg-status-outdated-bg text-status-outdated-text',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  error: {
    classes: 'border-status-danger-border bg-status-danger-bg text-status-danger-text',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const config = ALERT_CONFIG[tone];
  const role = tone === 'error' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed ${config.classes} ${className}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-1 text-sm' : ''}>{children}</div>
      </div>
    </div>
  );
}

export function Empty({
  title,
  description,
  hints,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  hints?: string[];
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center ${className}`}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-2xl" aria-hidden="true">
        🐾
      </div>
      <p className="text-lg font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-mute max-w-md mx-auto">{description}</p>}
      {hints && hints.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-ink-soft">
          {hints.map((h) => (
            <li key={h} className="flex items-center justify-center gap-1.5">
              <span aria-hidden="true" className="text-brand-600">
                •
              </span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
