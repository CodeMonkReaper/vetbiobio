import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/globals.css';
import { Footer, Header } from '@/components/layout/chrome';
import { TopBanner } from '@/components/ui/TopBanner';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'VetBiobío — Clínicas Veterinarias en la Región del Biobío',
    template: '%s | VetBiobío',
  },
  description: 'Directorio territorial y confiable de clínicas veterinarias en la Región del Biobío: servicios, precios referenciales, exámenes y urgencias.',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'VetBiobío',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} scroll-pt-20 scroll-pb-24`}>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2.5 focus:font-semibold focus:text-ink focus:shadow-lg focus:outline-none"
        >
          Saltar al contenido principal
        </a>
        <TopBanner />
        <Header />
        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none pb-20"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
