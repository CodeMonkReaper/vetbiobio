import { slugify, uniqueSlug } from './slug';

describe('slug (ADR-004)', () => {
  it('normaliza tildes, ñ y caracteres', () => {
    expect(slugify('Clínica Veterinaria Concepción')).toBe('clinica-veterinaria-concepcion');
    expect(slugify('Los Ángeles')).toBe('los-angeles');
    expect(slugify('  Tomé!! ')).toBe('tome');
  });

  it('resuelve colisiones con sufijo', async () => {
    const taken = new Set(['clinica-x', 'clinica-x-2']);
    const slug = await uniqueSlug('Clínica X', async (s) => taken.has(s));
    expect(slug).toBe('clinica-x-3');
  });

  it('usa base directa si está libre', async () => {
    await expect(uniqueSlug('Nueva', async () => false)).resolves.toBe('nueva');
  });
});
