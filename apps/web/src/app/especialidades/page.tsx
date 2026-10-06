import { CatalogList } from '@/components/catalog/Catalog';

export async function generateMetadata() {
  return { title: 'Especialidades veterinarias | VetBiobío', alternates: { canonical: '/especialidades' } };
}

export default function Especialidades() {
  return CatalogList({ kind: 'specialties' });
}
