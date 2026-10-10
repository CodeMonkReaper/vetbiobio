import type { MetadataRoute } from 'next';
import { BIOBIO_COMMUNES } from '@/data/communes';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vetbiobio.cl';
const API = process.env.INTERNAL_API_URL ?? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1');

export const revalidate = 86400; // 1 día

/**
 * Sitemap dinámico con soporte territorial completo:
 * Incluye rutas raíz, /acerca, /servicios, /especialidades, /examenes,
 * todas las 33 comunas del Biobío y fichas de clínicas activas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/veterinarias`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/servicios`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/especialidades`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/examenes`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/acerca`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/comparar`, changeFrequency: 'weekly', priority: 0.5 },
  ];

  // Agregar las 33 comunas
  for (const c of BIOBIO_COMMUNES) {
    base.push({
      url: `${SITE}/veterinarias/${c.slug}`,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  try {
    const [clinicsRes, servicesRes, examsRes, specialtiesRes] = await Promise.all([
      fetch(`${API}/clinics?limit=100`, { next: { revalidate } }),
      fetch(`${API}/services`, { next: { revalidate } }),
      fetch(`${API}/exams`, { next: { revalidate } }),
      fetch(`${API}/specialties`, { next: { revalidate } }),
    ]);

    if (clinicsRes.ok) {
      const clinics = (await clinicsRes.json()) as { data: Array<{ slug: string; commune_slug: string }> };
      for (const c of clinics.data ?? []) {
        base.push({
          url: `${SITE}/veterinarias/${c.commune_slug}/${c.slug}`,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    if (servicesRes.ok) {
      const services = (await servicesRes.json()) as { data: Array<{ slug: string }> };
      for (const s of services.data ?? []) {
        base.push({
          url: `${SITE}/servicios/${s.slug}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    if (examsRes.ok) {
      const exams = (await examsRes.json()) as { data: Array<{ slug: string }> };
      for (const e of exams.data ?? []) {
        base.push({
          url: `${SITE}/examenes/${e.slug}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    if (specialtiesRes.ok) {
      const specialties = (await specialtiesRes.json()) as { data: Array<{ slug: string }> };
      for (const sp of specialties.data ?? []) {
        base.push({
          url: `${SITE}/especialidades/${sp.slug}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {
    // Build sin API activa: mantiene rutas base y comunas canónicas
  }

  return base;
}
