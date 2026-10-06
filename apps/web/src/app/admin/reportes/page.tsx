'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin';

type Report = { id: number; reason: string; message: string | null; status: string; clinic: { slug: string; name: string } | null };

export default function AdminReportes() {
  const router = useRouter();
  const [rows, setRows] = useState<Report[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await adminApi('/admin/reports');
      setRows(res as Report[]);
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((e as Error).message);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function resolve(id: number, status: string) {
    await adminApi(`/admin/reports/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <main>
      <h1>Reportes abiertos</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            [{r.reason}] {r.clinic?.name ?? 's/clínica'} — {r.message ?? 'sin detalle'}
            <button onClick={() => void resolve(r.id, 'TRIAGED')}>Triaged</button>
            <button onClick={() => void resolve(r.id, 'RESOLVED')}>Resolver</button>
            <button onClick={() => void resolve(r.id, 'REJECTED')}>Rechazar</button>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p>Sin reportes abiertos.</p>}
    </main>
  );
}
