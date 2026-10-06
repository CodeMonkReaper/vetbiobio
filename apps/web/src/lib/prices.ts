import type { PricingType } from '@/types/domain';

// Formato único de precios CLP (§16). Usado por PriceDisplay y ComparisonTable.
export function formatPrice(min: number | null, max: number | null, type: PricingType): string {
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;
  if (type === 'FIXED' && min !== null) return `${fmt(min)} CLP`;
  if (type === 'RANGE' && min !== null && max !== null) return `${fmt(min)} – ${fmt(max)} CLP`;
  if (type === 'FROM' && min !== null) return `Desde ${fmt(min)} CLP`;
  return 'Consultar precio';
}

// Precio "desde" para cards (sin moneda explícita, contexto de tarjeta).
export function formatFrom(min: number | null): string {
  if (min === null) return 'Consultar precio';
  return `Desde $${min.toLocaleString('es-CL')}`;
}
