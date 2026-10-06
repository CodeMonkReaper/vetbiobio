import Link from 'next/link';

// Paginación con links (SSR, preserva filtros en URL, §24).
export function Pagination({ page, totalPages, base }: { page: number; totalPages: number; base: string }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(base);
    qs.set('page', String(p));
    return `/veterinarias?${qs}`;
  };
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className="rounded border border-slate-300 bg-white px-3 py-1.5 hover:border-brand-500">
          ← Anterior
        </Link>
      )}
      <span aria-current="page" className="text-sm text-ink-soft">
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className="rounded border border-slate-300 bg-white px-3 py-1.5 hover:border-brand-500">
          Siguiente →
        </Link>
      )}
    </nav>
  );
}
