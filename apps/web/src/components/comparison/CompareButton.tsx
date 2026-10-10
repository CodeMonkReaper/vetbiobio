'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'vetbiobio-compare';
const MAX = 3;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/**
 * Botón accesible para agregar o quitar una clínica del comparador (§42).
 * Touch target garantizado (44px), indicador aria-pressed y foco visible.
 */
export function CompareButton({ slug, name }: { slug: string; name: string }) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setSelected(read().includes(slug));
  }, [slug]);

  function toggle() {
    const current = read();
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSelected(next.includes(slug));
    window.dispatchEvent(new Event('storage'));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={selected}
      aria-label={`${selected ? 'Quitar' : 'Agregar'} ${name} ${selected ? 'de' : 'a'} la comparación`}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 ${
        selected
          ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm hover:bg-brand-100'
          : 'border-border bg-surface text-ink hover:border-border-hover hover:bg-surface-alt'
      }`}
    >
      <span aria-hidden="true" className="mr-1.5 font-bold">
        {selected ? '✓' : '⇄'}
      </span>
      <span>{selected ? 'Comparando' : 'Comparar'}</span>
    </button>
  );
}

/**
 * Barra flotante accesible de comparación territorial (§42).
 */
export function CompareBar() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(read());
    const onStorage = () => setSlugs(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const onFocus = () => setSlugs(read());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (slugs.length < 2) return null;

  return (
    <div
      role="region"
      aria-label="Barra de comparación de clínicas"
      className="sticky bottom-6 z-30 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-2xl border border-brand-300 bg-surface px-4 py-2.5 shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800" aria-hidden="true">
          {slugs.length}
        </span>
        <span className="text-xs font-medium text-ink">
          {slugs.length === 2 ? '2 clínicas seleccionadas' : '3 clínicas (máximo)'}
        </span>
      </div>

      <Link
        href={`/comparar?slugs=${slugs.join(',')}`}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
      >
        Comparar ahora &rarr;
      </Link>

      <button
        type="button"
        className="inline-flex min-h-[44px] items-center px-2 text-xs font-medium text-ink-mute transition hover:text-ink focus-visible:rounded"
        onClick={() => {
          localStorage.removeItem(KEY);
          setSlugs([]);
          window.dispatchEvent(new Event('storage'));
        }}
      >
        Limpiar
      </button>
    </div>
  );
}
