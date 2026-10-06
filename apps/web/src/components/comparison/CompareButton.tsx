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

// Selección de comparación en localStorage (sin estado global, §42).
// La página /comparar lee ?slugs=.
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
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={selected}
      aria-label={`${selected ? 'Quitar' : 'Agregar'} ${name} de la comparación`}
      className="inline-flex items-center justify-center rounded border border-slate-300 bg-white px-4 py-2 font-medium hover:border-brand-500"
    >
      {selected ? '✓ Comparando' : 'Comparar'}
    </button>
  );
}

export function CompareBar() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(read());
    const onStorage = () => setSlugs(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Refresca al volver a la pestaña (mismo-tab no dispara storage).
  useEffect(() => {
    const onFocus = () => setSlugs(read());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (slugs.length < 2) return null;
  return (
    <div className="sticky bottom-4 mx-auto flex w-fit items-center gap-3 rounded-lg border border-brand-200 bg-white px-4 py-2 shadow-card">
      <span className="text-sm">{slugs.length} para comparar</span>
      <Link
        href={`/comparar?slugs=${slugs.join(',')}`}
        className="rounded bg-brand-600 px-4 py-1.5 font-medium text-white hover:bg-brand-700"
      >
        Comparar
      </Link>
      <button type="button" className="text-sm text-ink-soft hover:text-ink" onClick={() => { localStorage.removeItem(KEY); setSlugs([]); }}>
        Limpiar
      </button>
    </div>
  );
}
