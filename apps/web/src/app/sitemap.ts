import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const API = process.env.INTERNAL_API_URL ?? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1');

export const revalidate = 86400; // 1 día

// Incluye comunas y clínicas cuando la API está disponible; si no, rutas base.
// Regla anti-thin-content (seo-content-policy): el sitemap no crea las páginas,
// solo refleja las que cumplen N>=3 (el combo comuna×examen no se incluye).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/veterinarias`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/comparar`, changeFrequency: 'weekly', priority: 0.5 },
  ];
  try {
    const [communesRes, clinicsRes] = await Promise.all([
      fetch(`${API}/communes?region=08`, { next: { revalidate } }),
      fetch(`${API}/clinics?limit=50`, { next: { revalidate } }),
    ]);
    if (communesRes.ok) {
      const communes = (await communesRes.json()) as { data: Array<{ slug: string }> };
      for (const c of communes.data ?? []) {
        base.push({ url: `${SITE}/veterinarias/${c.slug}`, changeFrequency: 'daily', priority: 0.7 });
      }
    }
    if (clinicsRes.ok) {
      const clinics = (await clinicsRes.json()) as { data: Array<{ slug: string; commune_slug: string }> };
      for (const c of clinics.data ?? []) {
        base.push({ url: `${SITE}/veterinarias/${c.commune_slug}/${c.slug}`, changeFrequency: 'weekly', priority: 0.8 });
      }
    }
  } catch {
    // Build sin API: solo rutas base.
  }
  return base;
}
