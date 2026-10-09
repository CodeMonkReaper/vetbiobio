import Link from 'next/link';

const LINKS = [
  { href: '/veterinarias', label: 'Veterinarias' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/especialidades', label: 'Especialidades' },
  { href: '/examenes', label: 'Exámenes' },
  { href: '/comparar', label: 'Comparar' },
];

/**
 * Header accesible (§10): Logotipo territorial + navegación mobile-first + botón de acción con touch target 44px.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2 text-xl font-bold tracking-tight text-brand-700 transition hover:text-brand-800 focus-visible:rounded"
          >
            <span className="text-2xl select-none" aria-hidden="true">
              🐾
            </span>
            <span>VetBiobío</span>
          </Link>

          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-1 overflow-x-auto text-sm font-medium text-ink-soft sm:gap-2"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-md px-2.5 py-1.5 transition hover:bg-surface-alt hover:text-brand-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/aportar"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
          >
            <span aria-hidden="true">➕</span>
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
          <p className="mt-1 text-[11px] text-ink-mute">
            Proyecto de portafolio y servicio comunitario. Datos sujetos a verificación territorial.
          </p>
        </div>

        <nav aria-label="Legal y Enlaces" className="flex flex-wrap gap-4 font-medium">
          <Link href="/aportar" className="text-brand-700 hover:underline">
            Colaborar
          </Link>
          <Link href="/aportar/estado" className="text-ink-soft hover:text-brand-700">
            Consultar Aporte
          </Link>
          <Link href="/terminos" className="text-ink-soft hover:text-brand-700">
            Términos
          </Link>
          <Link href="/privacidad" className="text-ink-soft hover:text-brand-700">
            Privacidad
          </Link>
          <Link href="/reportar" className="text-ink-soft hover:text-brand-700">
            Reportar
          </Link>
          <Link href="/admin" className="text-ink-mute hover:text-ink">
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
                className="font-medium text-ink-soft transition hover:text-brand-700 hover:underline"
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
