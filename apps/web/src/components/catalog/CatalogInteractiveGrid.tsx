'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';

export interface CatalogItem {
  slug: string;
  name: string;
}

export interface CatalogMeta {
  plural: string;
  singular: string;
  param: string;
  base: string;
}

function getItemIcon(name: string, slug: string): string {
  const text = `${name} ${slug}`.toLowerCase();
  if (text.includes('vacun') || text.includes('inmun')) return '💉';
  if (text.includes('cirug') || text.includes('esteril') || text.includes('castra')) return '✂️';
  if (text.includes('ecograf') || text.includes('ultrason')) return '📡';
  if (text.includes('radiograf') || text.includes('rayos') || text.includes('rx')) return '🩻';
  if (text.includes('sangre') || text.includes('hemogram') || text.includes('perfil') || text.includes('laborator') || text.includes('orina') || text.includes('copro')) return '🧪';
  if (text.includes('dermatolog') || text.includes('piel')) return '🧴';
  if (text.includes('oftalmolog') || text.includes('ojo')) return '👁️';
  if (text.includes('odontolog') || text.includes('dental') || text.includes('destart')) return '🦷';
  if (text.includes('cardiolog') || text.includes('coraz')) return '🫀';
  if (text.includes('traumatolog') || text.includes('ortoped') || text.includes('hueso')) return '🦴';
  if (text.includes('neurolog')) return '🧠';
  if (text.includes('oncol')) return '🎗️';
  if (text.includes('urgenc') || text.includes('emergenc') || text.includes('critico')) return '🚨';
  if (text.includes('rehabilit') || text.includes('fisioterap')) return '🏃';
  if (text.includes('exotic') || text.includes('ave') || text.includes('reptil')) return '🦜';
  if (text.includes('consult') || text.includes('control') || text.includes('general')) return '🩺';
  return '🐾';
}

export function CatalogInteractiveGrid({
  items,
  meta,
}: {
  items: CatalogItem[];
  meta: CatalogMeta;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) => item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda interactiva */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar en catálogo de ${meta.plural.toLowerCase()} (ej. consulta, rayos x)...`}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <span className="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>
            Mostrando {filtered.length} de {items.length} {meta.plural.toLowerCase()}
          </span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-emerald-700 hover:underline"
            >
              (Limpiar)
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-base font-bold text-slate-800">
            No encontramos coincidencias para &quot;{search}&quot;
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Intenta con otro término o explora las categorías completas.
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
          >
            Ver todos los {meta.plural.toLowerCase()}
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const icon = getItemIcon(item.name, item.slug);
            return (
              <li key={item.slug}>
                <Link
                  href={`${meta.base}/${item.slug}`}
                  className="block h-full group focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 rounded-xl"
                >
                  <Card className="h-full p-4 sm:p-5 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between group-hover:-translate-y-0.5">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          {icon}
                        </div>
                        <Badge tone="neutral" size="sm">
                          {meta.singular}
                        </Badge>
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {item.name}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {item.slug}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                      <span>Ver veterinarias que lo imparten</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
