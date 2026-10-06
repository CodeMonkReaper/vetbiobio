import { CatalogDetail } from '@/components/catalog/Catalog';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `${params.slug} | Exámenes | VetBiobío`,
    alternates: { canonical: `/examenes/${params.slug}` },
  };
}

export default function Examen({ params }: { params: { slug: string } }) {
  return CatalogDetail({ kind: 'exams', slug: params.slug });
}
