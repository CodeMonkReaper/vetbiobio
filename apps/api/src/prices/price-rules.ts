// Reglas puras de precios (ADR-005). Sin I/O: testeables sin BD.
export type PricingType = 'FIXED' | 'RANGE' | 'FROM' | 'CONTACT';

export function validatePriceAmounts(t: PricingType, min: number | null, max: number | null): void {
  if (min !== null && min < 0) throw new Error('Monto no puede ser negativo');
  if (max !== null && max < 0) throw new Error('Monto no puede ser negativo');
  if (t === 'FIXED' && !(min !== null && min === max)) throw new Error('FIXED requiere min=max');
  if (t === 'RANGE' && !(min !== null && max !== null && min < max)) throw new Error('RANGE requiere min<max');
  if (t === 'FROM' && !(min !== null && max === null)) throw new Error('FROM requiere solo min');
  if (t === 'CONTACT' && !(min === null && max === null)) throw new Error('CONTACT no lleva montos');
}

// Cierre de vigencia anterior: valid_until = nuevo_from - 1 día (database-design §7).
export function previousValidUntil(newValidFrom: string): string {
  const d = new Date(`${newValidFrom}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error('valid_from inválido (YYYY-MM-DD)');
  return new Date(d.getTime() - 86400000).toISOString().slice(0, 10);
}
