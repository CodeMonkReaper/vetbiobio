import { CatalogList } from '@/components/catalog/Catalog';

export async function generateMetadata() {
  return { title: 'Servicios veterinarios | VetBiobío', alternates: { canonical: '/servicios' } };
}

export default function Servicios() {
  return CatalogList({ kind: 'services' });
}
