import Link from 'next/link';

/**
 * Paginación accesible con enlaces semánticos (SSR friendly, preserva filtros en URL).
 * Cumple con touch target de 44px en móviles y atributos aria-current.
 */
export function Pagination({
  page,
  totalPages,
  base,
  className = '',
}: {
  page: number;
  totalPages: number;
  base: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams(base);
    qs.set('page', String(p));
    return `/veterinarias?${qs.toString()}`;
  };

  return (
    <nav
      aria-label="Paginación de resultados"
      className={`flex flex-wrap items-center justify-center gap-3 py-4 ${className}`}
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:border-brand-600 hover:text-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
        >
          ← Anterior
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-md border border-border-subtle bg-surface-alt px-4 py-2 text-sm font-medium text-ink-mute"
        >
          ← Anterior
        </span>
      )}

      <span
        aria-current="page"
        className="px-2 text-sm font-medium text-ink-soft select-none"
      >
        Página <strong className="font-semibold text-ink">{page}</strong> de {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:border-brand-600 hover:text-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
        >
          Siguiente →
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-md border border-border-subtle bg-surface-alt px-4 py-2 text-sm font-medium text-ink-mute"
        >
          Siguiente →
        </span>
      )}
    </nav>
  );
}
