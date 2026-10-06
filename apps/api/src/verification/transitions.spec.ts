import { canTransition, requiresEvidence } from './transitions';

describe('transitions (verification-policy)', () => {
  it('permite el ciclo de vida válido', () => {
    expect(canTransition('UNVERIFIED', 'PENDING_REVIEW')).toBe(true);
    expect(canTransition('PENDING_REVIEW', 'VERIFIED')).toBe(true);
    expect(canTransition('VERIFIED', 'OUTDATED')).toBe(true);
    expect(canTransition('OUTDATED', 'VERIFIED')).toBe(true);
    expect(canTransition('REJECTED', 'PENDING_REVIEW')).toBe(true);
  });

  it('bloquea saltos inválidos', () => {
    expect(canTransition('UNVERIFIED', 'OUTDATED')).toBe(false);
    expect(canTransition('VERIFIED', 'REJECTED')).toBe(false);
    expect(canTransition('REJECTED', 'VERIFIED')).toBe(false);
  });

  it('VERIFIED exige fuente + método o nota', () => {
    expect(requiresEvidence('VERIFIED', 'PHONE', 'llamada', null)).toBe(false);
    expect(requiresEvidence('VERIFIED', 'PHONE', null, null)).toBe(true);
    expect(requiresEvidence('VERIFIED', null, null, null)).toBe(true);
    expect(requiresEvidence('OUTDATED')).toBe(false);
  });
});
