import type { Metadata } from 'next';
import '../styles/globals.css';
import { Footer, Header } from '@/components/layout/chrome';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'VetBiobío — Veterinarias en la Región del Biobío',
    template: '%s | VetBiobío',
  },
  description: 'Directorio verificado de clínicas veterinarias: servicios, precios, exámenes y urgencias.',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'VetBiobío',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:bg-white focus:p-2">
          Saltar al contenido
        </a>
        <Header />
        <div id="contenido" className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
