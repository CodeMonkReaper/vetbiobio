import { CatalogDetail } from '@/components/catalog/Catalog';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `${params.slug} | Servicios | VetBiobío`,
    alternates: { canonical: `/servicios/${params.slug}` },
  };
}

export default function Servicio({ params }: { params: { slug: string } }) {
  return CatalogDetail({ kind: 'services', slug: params.slug });
}
