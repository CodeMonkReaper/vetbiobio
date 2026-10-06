import { CatalogList } from '@/components/catalog/Catalog';

export async function generateMetadata() {
  return { title: 'Exámenes veterinarios | VetBiobío', alternates: { canonical: '/examenes' } };
}

export default function Examenes() {
  return CatalogList({ kind: 'exams' });
}
