/**
 * Validador y normalizador de telefonía chilena (móvil y fija).
 * Formato internacional estándar E.164 (+56...)
 */
export function isValidChileanPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // 1. Formato E.164 canónico:
  // Móvil: +569XXXXXXXX (12 caracteres: +56 9 y 8 dígitos)
  if (/^\+569\d{8}$/.test(cleaned)) return true;

  // Fijo Biobío/Nacional: +5641XXXXXXX o +5642XXXXXXX o +5643XXXXXXX o +562XXXXXXX (11 o 12 caracteres)
  if (/^\+56[2-9]\d{7,8}$/.test(cleaned)) return true;

  return false;
}

export function normalizeChileanPhone(phone: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');

  // Si comienza con 56 (código país)
  if (digits.startsWith('56')) {
    digits = digits.slice(2);
  }

  // Móvil ingresado como 9XXXXXXXX (9 dígitos)
  if (digits.length === 9 && digits.startsWith('9')) {
    return `+56${digits}`;
  }

  // Fijo Concepción/Biobío ingresado como 41XXXXXXX (9 dígitos) o 2XXXXXXX (8 dígitos)
  if ((digits.length === 8 || digits.length === 9) && !digits.startsWith('0')) {
    return `+56${digits}`;
  }

  return null;
}
