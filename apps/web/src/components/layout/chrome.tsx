import Link from 'next/link';
import { HeaderNav } from './HeaderNav';

const LINKS = [
  { href: '/veterinarias', label: 'Veterinarias' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/especialidades', label: 'Especialidades' },
  { href: '/examenes', label: 'Exámenes' },
  { href: '/comparar', label: 'Comparar' },
];

/**
 * Header accesible (§10): Logotipo territorial + navegación mobile-first de una sola fila.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:py-3 relative">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2 text-xl font-bold tracking-tight text-brand-700 transition hover:text-brand-800 focus-visible:rounded"
        >
          <svg
            className="h-6 w-6 text-brand-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span>VetBiobío</span>
        </Link>

        {/* Navegación responsiva con menú móvil plegable */}
        <div className="flex items-center gap-3">
          <HeaderNav links={LINKS} />
          <Link
            href="/aportar"
            className="hidden md:inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
          >
            <span>Aportar Información</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Footer accesible con alto contraste (cumple WCAG 2.2 AA) y enlaces organizados.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-ink-mute sm:flex-row">
        <div>
          <p>© {new Date().getFullYear()} VetBiobío — Directorio de Clínicas Veterinarias de la Región del Biobío.</p>
          <p className="mt-1 text-xs text-ink-mute">
            Proyecto comunitario independiente. Datos sujetos a verificación territorial.
          </p>
        </div>

        <nav aria-label="Legal y Enlaces" className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-xs">
          <Link href="/acerca" className="inline-flex min-h-[44px] items-center text-brand-700 hover:underline">
            Acerca y Metodología
          </Link>
          <Link href="/aportar" className="inline-flex min-h-[44px] items-center text-ink-soft hover:text-brand-700">
            Colaborar
          </Link>
          <Link href="/aportar/estado" className="inline-flex min-h-[44px] items-center text-ink-soft hover:text-brand-700">
            Consultar Aporte
          </Link>
          <Link href="/terminos" className="inline-flex min-h-[44px] items-center text-ink-soft hover:text-brand-700">
            Términos
          </Link>
          <Link href="/privacidad" className="inline-flex min-h-[44px] items-center text-ink-soft hover:text-brand-700">
            Privacidad
          </Link>
          <Link href="/reportar" className="inline-flex min-h-[44px] items-center text-ink-soft hover:text-brand-700">
            Reportar
          </Link>
          <Link href="/admin" className="inline-flex min-h-[44px] items-center text-ink-mute hover:text-ink">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/**
 * Migas de pan con soporte para aria-current y contraste garantizado.
 */
export function Breadcrumbs({
  trail,
}: {
  trail: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav aria-label="Migas de pan" className="text-xs text-ink-mute">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((t, i) => (
          <li key={t.label} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="select-none text-ink-mute">
                /
              </span>
            )}
            {t.href ? (
              <Link
                href={t.href}
                className="font-medium text-ink-soft transition hover:text-brand-700 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-700 rounded-sm"
              >
                {t.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink">
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
