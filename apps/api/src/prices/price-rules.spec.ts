import { validatePriceAmounts, previousValidUntil } from './price-rules';

describe('price-rules (ADR-005)', () => {
  it('acepta FIXED/RANGE/FROM/CONTACT válidos', () => {
    expect(() => validatePriceAmounts('FIXED', 25000, 25000)).not.toThrow();
    expect(() => validatePriceAmounts('RANGE', 20000, 30000)).not.toThrow();
    expect(() => validatePriceAmounts('FROM', 25000, null)).not.toThrow();
    expect(() => validatePriceAmounts('CONTACT', null, null)).not.toThrow();
  });

  it('rechaza negativos y combinaciones inválidas', () => {
    expect(() => validatePriceAmounts('FIXED', -5, -5)).toThrow(/negativo/);
    expect(() => validatePriceAmounts('FIXED', 20000, 25000)).toThrow(/FIXED/);
    expect(() => validatePriceAmounts('RANGE', 30000, 20000)).toThrow(/RANGE/);
    expect(() => validatePriceAmounts('RANGE', 25000, 25000)).toThrow(/RANGE/);
    expect(() => validatePriceAmounts('FROM', 25000, 30000)).toThrow(/FROM/);
    expect(() => validatePriceAmounts('CONTACT', 1000, null)).toThrow(/CONTACT/);
  });

  it('cierra vigencia el día anterior', () => {
    expect(previousValidUntil('2026-10-01')).toBe('2026-09-30');
    expect(previousValidUntil('2026-03-01')).toBe('2026-02-28');
    expect(() => previousValidUntil('no-fecha')).toThrow(/inválido/);
  });
});
