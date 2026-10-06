import type { VerificationStatus } from '@/types/domain';

// Badge de verificación (§15): texto + símbolo, nunca solo color.
const STYLES: Record<VerificationStatus, string> = {
  VERIFIED: 'bg-brand-50 text-brand-800 border-brand-200',
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200',
  OUTDATED: 'bg-amber-50 text-amber-800 border-amber-200',
  UNVERIFIED: 'bg-slate-100 text-ink-soft border-slate-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
};

export function Badge({ children, tone = 'neutral', className = '' }: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-slate-100 text-ink-soft border-slate-200',
    success: 'bg-brand-50 text-brand-800 border-brand-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function VerificationBadge({ status, verifiedAt }: { status: VerificationStatus; verifiedAt: string | null }) {
  const date = verifiedAt?.slice(0, 10) ?? '';
  const text =
    status === 'VERIFIED' ? `✓ Verificada el ${date}`
    : status === 'OUTDATED' ? `⚠ Posiblemente desactualizada (${date || 's/f'})`
    : status === 'PENDING_REVIEW' ? '◷ En revisión'
    : status === 'REJECTED' ? '✕ Rechazada'
    : 'ⓘ Sin verificar';
  return <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm ${STYLES[status]}`}>{text}</span>;
}
