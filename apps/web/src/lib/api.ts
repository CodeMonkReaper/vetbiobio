import { BIOBIO_COMMUNES } from '@/data/communes';

const isServer = typeof window === 'undefined';
export const API_BASE = isServer && process.env.INTERNAL_API_URL
  ? process.env.INTERNAL_API_URL
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1');

export async function fetchClinics(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/clinics?${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error buscando clínicas');
  return res.json();
}

export async function fetchCatalog(kind: 'communes' | 'services' | 'exams' | 'specialties') {
  try {
    const res = await fetch(`${API_BASE}/${kind}`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      if (kind === 'communes') return { data: BIOBIO_COMMUNES };
      return { data: [] };
    }
    const json = await res.json();
    if (kind === 'communes' && (!json.data || json.data.length === 0)) {
      return { data: BIOBIO_COMMUNES };
    }
    return json;
  } catch {
    if (kind === 'communes') return { data: BIOBIO_COMMUNES };
    return { data: [] };
  }
}

export async function fetchClinic(slug: string) {
  const res = await fetch(`${API_BASE}/clinics/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error cargando clínica');
  return res.json();
}

export async function fetchCompare(slugs: string[], lat?: string, lng?: string) {
  const qs = new URLSearchParams({ slugs: slugs.join(',') });
  if (lat) qs.set('lat', lat);
  if (lng) qs.set('lng', lng);
  const res = await fetch(`${API_BASE}/clinics/compare/by-slugs?${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error comparando clínicas');
  return res.json();
}

export async function fetchClinicReliability(slug: string) {
  const res = await fetch(`${API_BASE}/clinics/${encodeURIComponent(slug)}/reliability`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

