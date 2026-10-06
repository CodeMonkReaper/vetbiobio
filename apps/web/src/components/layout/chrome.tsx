import Link from 'next/link';

const LINKS = [
  { href: '/veterinarias', label: 'Veterinarias' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/especialidades', label: 'Especialidades' },
  { href: '/examenes', label: 'Exámenes' },
  { href: '/comparar', label: 'Comparar' },
];

// Header §10: logo + secciones + comparar. Mobile: nav horizontal con scroll.
export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-700">
          VetBiobío
        </Link>
        <nav aria-label="Principal" className="flex flex-1 items-center gap-4 overflow-x-auto text-ink-soft">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <nav aria-label="Legal" className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-6 text-sm text-ink-soft">
        <Link href="/terminos" className="hover:text-brand-700">Términos</Link>
        <Link href="/privacidad" className="hover:text-brand-700">Privacidad</Link>
        <Link href="/reportar" className="hover:text-brand-700">Reportar</Link>
      </nav>
    </footer>
  );
}

export function Breadcrumbs({ trail }: { trail: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Migas de pan" className="text-sm text-ink-mute">
      <ol className="flex flex-wrap gap-1">
        {trail.map((t, i) => (
          <li key={t.label} className="flex gap-1">
            {i > 0 && <span aria-hidden="true">→</span>}
            {t.href ? <Link href={t.href} className="hover:text-brand-700">{t.label}</Link> : <span aria-current="page">{t.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
