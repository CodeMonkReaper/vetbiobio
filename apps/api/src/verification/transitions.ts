// Transiciones de verificación (verification-policy §1). Puras y testeables.
export type VStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'OUTDATED' | 'REJECTED';

const ALLOWED: Record<VStatus, VStatus[]> = {
  UNVERIFIED: ['PENDING_REVIEW', 'VERIFIED'],
  PENDING_REVIEW: ['VERIFIED', 'REJECTED', 'UNVERIFIED'],
  VERIFIED: ['OUTDATED', 'UNVERIFIED'],
  OUTDATED: ['PENDING_REVIEW', 'VERIFIED'],
  REJECTED: ['PENDING_REVIEW'],
};

export function canTransition(from: VStatus | null, to: VStatus): boolean {
  if (!from) return to === 'PENDING_REVIEW' || to === 'VERIFIED' || to === 'UNVERIFIED';
  return (ALLOWED[from] ?? []).includes(to);
}

// VERIFIED exige evidencia mínima declarada (fuente + método o nota).
export function requiresEvidence(to: VStatus, source?: string | null, method?: string | null, notes?: string | null): boolean {
  if (to !== 'VERIFIED') return false;
  return !(source && (method || notes));
}
