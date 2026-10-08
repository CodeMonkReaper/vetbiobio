import Link from 'next/link';

const LINKS = [
  { href: '/veterinarias', label: 'Veterinarias' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/especialidades', label: 'Especialidades' },
  { href: '/examenes', label: 'Exámenes' },
  { href: '/comparar', label: 'Comparar' },
];

// Header §10: logo + secciones + comparar + botón Aportar. Mobile: nav horizontal con scroll.
export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-emerald-700 flex items-center gap-2">
            <span>🐾</span> VetBiobío
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-4 overflow-x-auto text-sm text-slate-600 font-medium">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-emerald-700 transition">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/aportar"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <span>➕</span> Aportar Información
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500">
        <div>
          <p>© {new Date().getFullYear()} VetBiobío — Directorio de Clínicas Veterinarias de la Región del Biobío.</p>
        </div>
        <nav aria-label="Legal y Enlaces" className="flex flex-wrap gap-4 font-medium">
          <Link href="/aportar" className="text-emerald-700 hover:underline">Colaborar</Link>
          <Link href="/aportar/estado" className="hover:text-emerald-700">Consultar Aporte</Link>
          <Link href="/terminos" className="hover:text-emerald-700">Términos</Link>
          <Link href="/privacidad" className="hover:text-emerald-700">Privacidad</Link>
          <Link href="/reportar" className="hover:text-emerald-700">Reportar</Link>
          <Link href="/admin" className="hover:text-emerald-700 text-slate-400">Admin</Link>
        </nav>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ trail }: { trail: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Migas de pan" className="text-sm text-slate-400">
      <ol className="flex flex-wrap gap-1">
        {trail.map((t, i) => (
          <li key={t.label} className="flex gap-1">
            {i > 0 && <span aria-hidden="true">→</span>}
            {t.href ? (
              <Link href={t.href} className="hover:text-emerald-700">
                {t.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-slate-700 font-medium">
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
