const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function adminApi(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, credentials: 'include' });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string } | null)?.message ?? `Error ${res.status}`);
  }
  return res.json();
}
