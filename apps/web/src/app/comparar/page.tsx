import { fetchCompare } from '@/lib/api';

interface Props {
  searchParams: Record<string, string | undefined>;
}

type Item = Record<string, unknown>;
type Price = { min_amount: number | null; max_amount: number | null; pricing_type: string };

function price(p: Price | undefined) {
  if (!p) return '—';
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;
  if (p.pricing_type === 'FIXED' && p.min_amount !== null) return fmt(p.min_amount);
  if (p.pricing_type === 'RANGE' && p.min_amount !== null && p.max_amount !== null) return `${fmt(p.min_amount)} – ${fmt(p.max_amount)}`;
  if (p.pricing_type === 'FROM' && p.min_amount !== null) return `Desde ${fmt(p.min_amount)}`;
  return 'A convenir';
}

function find(list: Item[], slug: string): Price | undefined {
  return (list.find((x) => x.slug === slug) as unknown as Price | undefined);
}

export async function generateMetadata() {
  return {
    title: 'Comparar veterinarias | VetBiobío',
    alternates: { canonical: '/comparar' },
    robots: { index: false, follow: true },
  };
}

// ?slugs=a,b[,c] (&lat&lng opcionales para distancia). Máx 3 (API valida).
export default async function Compare({ searchParams }: Props) {
  const slugs = (searchParams.slugs ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  if (slugs.length < 2) {
    return (
      <main>
        <h1>Comparar</h1>
        <p>Indica 2 o 3 clínicas: <code>/comparar?slugs=clinica-a,clinica-b</code></p>
      </main>
    );
  }
  let profiles: Item[] = [];
  try {
    const res = await fetchCompare(slugs, searchParams.lat, searchParams.lng);
    profiles = res.data as Item[];
  } catch {
    return <main><h1>Comparar</h1><p>No se pudo cargar la comparación.</p></main>;
  }
  const rows: Array<{ label: string; get: (c: Item) => string }> = [
    { label: 'Comuna', get: (c) => c.commune as string },
    { label: 'Distancia', get: (c) => (typeof c.km === 'number' ? `${(c.km as number).toFixed(1)} km` : '—') },
    { label: 'Consulta', get: (c) => price(find(c.services as Item[], 'consulta-general')) },
    { label: 'Radiografía', get: (c) => { const e = find(c.exams as Item[], 'radiografia'); return e ? price(e) : 'No'; } },
    { label: 'Ecografía', get: (c) => { const e = find(c.exams as Item[], 'ecografia'); return e ? price(e) : 'No'; } },
    { label: 'Urgencias', get: (c) => ((c.is_emergency as boolean) ? 'Sí' : 'No') },
    { label: 'Abierto ahora', get: (c) => ((c.open_now as boolean) ? 'Sí' : 'No') },
    { label: 'Verificación', get: (c) => (c.verification_status as string) === 'VERIFIED' ? `✓ ${(c.verified_at as string)?.slice(0, 10) ?? ''}` : (c.verification_status as string) },
  ];
  return (
    <main>
      <h1>Comparar</h1>
      <table>
        <thead>
          <tr><th>Criterio</th>{profiles.map((c) => <th key={c.slug as string}>{c.name as string}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}><td>{r.label}</td>{profiles.map((c) => <td key={c.slug as string}>{r.get(c)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <p><small>Precios referenciales. La verificación y la monetización son independientes: un perfil patrocinado no implica verificación.</small></p>
    </main>
  );
}
