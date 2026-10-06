import type { Metadata } from 'next';
import '../styles/globals.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'VetBiobío — Veterinarias en la Región del Biobío',
  description: 'Directorio verificado de clínicas veterinarias: servicios, precios, exámenes y urgencias.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
