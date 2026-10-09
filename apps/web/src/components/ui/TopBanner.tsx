import Link from 'next/link';

/**
 * TopBanner — Franja permanente de transparencia del piloto territorial.
 * Comunica que los datos están en verificación activa y previene falsas expectativas de precio.
 */
export function TopBanner() {
  return (
    <aside
      aria-label="Aviso de estado del directorio"
      className="border-b border-amber-200 bg-amber-100 px-4 py-2.5 text-xs text-amber-950 print:hidden"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 leading-relaxed">
          <span aria-hidden="true" className="font-bold select-none">
            ⚠️
          </span>
          <span>
            <strong className="font-semibold">Piloto en marcha:</strong> Datos en proceso de verificación territorial.
            Algunos precios pueden variar respecto al valor en mesón.
          </span>
        </p>
        <Link
          href="/acerca#metodologia"
          className="inline-flex min-h-[32px] items-center font-semibold underline underline-offset-2 hover:text-amber-900 focus-visible:rounded"
        >
          ¿Cómo verificamos?
        </Link>
      </div>
    </aside>
  );
}
