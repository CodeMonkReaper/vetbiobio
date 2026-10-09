import type { ReactNode } from 'react';
import type { VerificationStatus } from '@/types/domain';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'brand';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-alt text-ink-soft border-border',
  success: 'bg-status-verified-bg text-status-verified-text border-status-verified-border',
  warning: 'bg-status-outdated-bg text-status-outdated-text border-status-outdated-border',
  error: 'bg-status-danger-bg text-status-danger-text border-status-danger-border',
  info: 'bg-status-unverified-bg text-status-unverified-text border-status-unverified-border',
  brand: 'bg-brand-50 text-brand-800 border-brand-200',
};

export function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  className = '',
}: {
  children: ReactNode;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.2 text-[11px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${sizeClasses} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  {
    tone: BadgeTone;
    symbol: string;
    label: (date: string) => string;
    description: string;
  }
> = {
  VERIFIED: {
    tone: 'success',
    symbol: '✓',
    label: (date) => (date ? `Verificada el ${date}` : 'Verificada'),
    description: 'Datos confirmados en terreno o por fuente oficial del establecimiento.',
  },
  PENDING_REVIEW: {
    tone: 'warning',
    symbol: '◷',
    label: () => 'En revisión',
    description: 'La información fue enviada o detectada y está en cola de verificación territorial.',
  },
  OUTDATED: {
    tone: 'warning',
    symbol: '⚠',
    label: (date) => `Posiblemente desactualizada (${date || 's/f'})`,
    description: 'Ha pasado tiempo desde la última verificación; se recomienda confirmar antes de acudir.',
  },
  UNVERIFIED: {
    tone: 'info',
    symbol: 'ⓘ',
    label: () => 'Sin verificar',
    description: 'Ficha creada automáticamente o pendiente de cotejo territorial.',
  },
  REJECTED: {
    tone: 'error',
    symbol: '✕',
    label: () => 'Rechazada',
    description: 'Ficha desestimada tras revisión por inconsistencias o cierre.',
  },
};

export function VerificationBadge({
  status,
  verifiedAt,
  className = '',
}: {
  status: VerificationStatus;
  verifiedAt?: string | null;
  className?: string;
}) {
  const config = VERIFICATION_CONFIG[status] ?? VERIFICATION_CONFIG.UNVERIFIED;
  const dateFormatted = verifiedAt ? verifiedAt.slice(0, 10) : '';
  const text = config.label(dateFormatted);

  return (
    <span
      title={config.description}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${TONES[config.tone]} ${className}`}
    >
      <span aria-hidden="true" className="font-bold select-none">
        {config.symbol}
      </span>
      <span>{text}</span>
    </span>
  );
}
