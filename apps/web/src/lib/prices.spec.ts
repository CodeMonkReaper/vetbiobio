import { describe, expect, it } from 'vitest';
import { formatPrice, formatFrom } from './prices';

describe('formatPrice (§16)', () => {
  it('exacto con CLP', () => {
    expect(formatPrice(25000, 25000, 'FIXED')).toBe('$25.000 CLP');
  });
  it('desde', () => {
    expect(formatPrice(25000, null, 'FROM')).toBe('Desde $25.000 CLP');
  });
  it('rango', () => {
    expect(formatPrice(20000, 30000, 'RANGE')).toBe('$20.000 – $30.000 CLP');
  });
  it('sin precio público', () => {
    expect(formatPrice(null, null, 'CONTACT')).toBe('Consultar precio');
    expect(formatPrice(null, null, 'FIXED')).toBe('Consultar precio');
  });
  it('formatFrom para cards', () => {
    expect(formatFrom(18000)).toBe('Desde $18.000');
    expect(formatFrom(null)).toBe('Consultar precio');
  });
});
