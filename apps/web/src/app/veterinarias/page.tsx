import { fetchClinics } from '@/lib/api';

interface Props {
  searchParams: Record<string, string | undefined>;
}

// SSR: /veterinarias?q=&commune=&exam=&emergency=&verified_only=&sort=
export async function generateMetadata({ searchParams }: Props) {
  const q = searchParams.q ? ` ${searchParams.q}` : '';
  return {
    title: `Veterinarias${q} en Biobío | VetBiobío`,
    alternates: { canonical: '/veterinarias' },
  };
}

function badge(status: string, verifiedAt: string | null) {
  if (status === 'VERIFIED') return `✓ Verificada el ${verifiedAt?.slice(0, 10) ?? ''}`;
  if (status === 'OUTDATED') return `⚠ Posiblemente desactualizada (${verifiedAt?.slice(0, 10) ?? 's/f'})`;
  if (status === 'PENDING_REVIEW') return '◷ En revisión';
  return 'ⓘ Sin verificar';
}

export default async function Listing({ searchParams }: Props) {
  const params: Record<string, string> = {};
  for (const k of ['q', 'commune', 'exam', 'service', 'specialty', 'emergency', 'verified_only', 'sort']) {
    if (searchParams[k]) params[k] = searchParams[k] as string;
  }
  let result: { data: unknown[]; meta: { total: number } } = { data: [], meta: { total: 0 } };
  try {
    result = await fetchClinics(params);
  } catch {
    return <main><h1>Veterinarias</h1><p>No se pudo cargar el listado. Intenta más tarde.</p></main>;
  }
  return (
    <main>
      <h1>Veterinarias ({result.meta.total})</h1>
      <ul>
        {(result.data as Array<Record<string, unknown>>).map((c) => (
          <li key={c.slug as string}>
            {(c.is_sponsored as boolean) && <strong>Patrocinado </strong>}
            <a href={`/veterinarias/${c.commune_slug as string}/${c.slug as string}`}>{c.name as string}</a>
            {(c.is_premium as boolean) && <span> ★ Premium</span>}
            {' — '}{c.commune as string}
            {typeof c.km === 'number' ? ` — ${(c.km as number).toFixed(1)} km` : ''}
            {typeof c.min_price === 'number' ? ` — $${(c.min_price as number).toLocaleString('es-CL')}` : ' — Precio a convenir'}
            {(c.open_now as boolean) ? ' · Abierta ahora' : ''}
            <br /><small>{badge(c.verification_status as string, c.verified_at as string | null)}</small>
          </li>
        ))}
      </ul>
      <p><small>Precios referenciales. Confirma directamente con el establecimiento.</small></p>
    </main>
  );
}
