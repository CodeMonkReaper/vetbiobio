import { CatalogDetail } from '@/components/catalog/Catalog';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `${params.slug} | Especialidades | VetBiobío`,
    alternates: { canonical: `/especialidades/${params.slug}` },
  };
}

export default function Especialidad({ params }: { params: { slug: string } }) {
  return CatalogDetail({ kind: 'specialties', slug: params.slug });
}
