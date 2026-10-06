export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function fetchClinics(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/clinics?${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error buscando clínicas');
  return res.json();
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
