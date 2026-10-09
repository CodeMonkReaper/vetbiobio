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

export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  description: string;
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
  if (text.includes('urgenc') || text.includes('emergenc') || text.includes('critico') || text.includes('hospital')) return '🚨';
  if (text.includes('rehabilit') || text.includes('fisioterap')) return '🏃';
  if (text.includes('exotic') || text.includes('ave') || text.includes('reptil')) return '🦜';
  if (text.includes('consult') || text.includes('control') || text.includes('general')) return '🩺';
  return '🐾';
}

function getCategoryForItem(base: string, item: CatalogItem): CategoryGroup {
  const text = `${item.name} ${item.slug}`.toLowerCase();

  if (base.includes('servicios')) {
    if (text.includes('urgenc') || text.includes('emergenc') || text.includes('hospital') || text.includes('critico') || text.includes('fluidoter')) {
      return {
        id: 'urgencias',
        name: 'Urgencias y Cuidados Críticos',
        icon: '🚨',
        description: 'Atención 24h, estabilización y hospitalización continua.',
      };
    }
    if (text.includes('cirug') || text.includes('esteril') || text.includes('castra') || text.includes('quirurg') || text.includes('destart') || text.includes('dental')) {
      return {
        id: 'cirugia',
        name: 'Cirugía y Procedimientos',
        icon: '✂️',
        description: 'Pabellón quirúrgico, esterilizaciones y odontología clínica.',
      };
    }
    if (text.includes('ecograf') || text.includes('radiograf') || text.includes('rayos') || text.includes('laborat') || text.includes('muestra') || text.includes('endoscop')) {
      return {
        id: 'diagnostico',
        name: 'Diagnóstico e Imagenología',
        icon: '🔬',
        description: 'Ecografía, radiología digital y toma de muestras.',
      };
    }
    if (text.includes('rehabilit') || text.includes('fisioterap') || text.includes('acupunt') || text.includes('nutric') || text.includes('peluquer')) {
      return {
        id: 'bienestar',
        name: 'Bienestar y Rehabilitación',
        icon: '🏃',
        description: 'Terapia física, soporte nutricional y cuidados.',
      };
    }
    return {
      id: 'general',
      name: 'Atención General y Preventiva',
      icon: '🩺',
      description: 'Consultas médicas, vacunación, desparasitación y microchips.',
    };
  }

  if (base.includes('especialidades')) {
    if (text.includes('traumatolog') || text.includes('ortoped') || text.includes('neuro') || text.includes('columna')) {
      return {
        id: 'quirurgica_neuro',
        name: 'Cirugía, Ortopedia y Neurología',
        icon: '🦴',
        description: 'Patologías osteoarticulares, columna y sistema nervioso.',
      };
    }
    if (text.includes('oftalmo') || text.includes('dermato') || text.includes('odonto') || text.includes('otolog')) {
      return {
        id: 'sentidos',
        name: 'Sentidos y Dermatología',
        icon: '👁️',
        description: 'Ojos, piel, conducto auditivo y salud oral.',
      };
    }
    if (text.includes('oncol') || text.includes('anestesi') || text.includes('algiolog') || text.includes('paliativ')) {
      return {
        id: 'oncologia_alivio',
        name: 'Oncología y Cuidados Especiales',
        icon: '🎗️',
        description: 'Tratamiento oncológico, manejo del dolor y anestesiología.',
      };
    }
    if (text.includes('exotic') || text.includes('ave') || text.includes('reptil') || text.includes('silvestre')) {
      return {
        id: 'exoticos',
        name: 'Animales Exóticos y No Convencionales',
        icon: '🦜',
        description: 'Medicina especializada en aves, reptiles y pequeños mamíferos.',
      };
    }
    return {
      id: 'medicina_interna',
      name: 'Medicina Interna y Órganos',
      icon: '🩺',
      description: 'Cardiología, felina, nefrología, endocrinología y digestivo.',
    };
  }

  // Exámenes
  if (text.includes('radiograf') || text.includes('ecograf') || text.includes('rayos') || text.includes('ecocardio') || text.includes('tomograf') || text.includes('tac') || text.includes('resonanc')) {
    return {
      id: 'imagenologia',
      name: 'Diagnóstico por Imagen',
      icon: '🩻',
      description: 'Radiología digital de alta resolución y ultrasonido.',
    };
  }
  if (text.includes('citolog') || text.includes('biopsia') || text.includes('cultivo') || text.includes('antibiogram') || text.includes('patolog') || text.includes('histopat')) {
    return {
      id: 'patologia',
      name: 'Patología y Microbiología',
      icon: '🔬',
      description: 'Cultivos bacterianos, biopsias y estudio histopatológico.',
    };
  }
  if (text.includes('electro') || text.includes('ecg') || text.includes('presion') || text.includes('hormon') || text.includes('tiroid')) {
    return {
      id: 'funcional',
      name: 'Pruebas Funcionales y Cardíacas',
      icon: '🫀',
      description: 'Evaluación electrocardiográfica y perfiles endocrinos.',
    };
  }
  return {
    id: 'laboratorio_clinico',
    name: 'Laboratorio Clínico y Sangre',
    icon: '🧪',
    description: 'Hemogramas, perfiles bioquímicos y urianálisis.',
  };
}

export function CatalogInteractiveGrid({
  items,
  meta,
}: {
  items: CatalogItem[];
  meta: CatalogMeta;
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mapear cada ítem con su categoría correspondiente
  const categorizedItems = useMemo(() => {
    return items.map((item) => ({
      item,
      category: getCategoryForItem(meta.base, item),
    }));
  }, [items, meta.base]);

  // Lista única de categorías encontradas
  const categories = useMemo(() => {
    const map = new Map<string, CategoryGroup & { count: number }>();
    categorizedItems.forEach(({ category }) => {
      const existing = map.get(category.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(category.id, { ...category, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [categorizedItems]);

  // Filtrado reactivo por texto y categoría seleccionada
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categorizedItems.filter(({ item, category }) => {
      if (selectedCategory !== 'all' && category.id !== selectedCategory) {
        return false;
      }
      if (q) {
        return item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categorizedItems, search, selectedCategory]);

  // Agrupación de resultados filtrados por categoría para vista estructurada
  const groupedResults = useMemo(() => {
    const groups = new Map<string, { category: CategoryGroup; items: CatalogItem[] }>();
    filteredItems.forEach(({ item, category }) => {
      if (!groups.has(category.id)) {
        groups.set(category.id, { category, items: [] });
      }
      groups.get(category.id)!.items.push(item);
    });
    return Array.from(groups.values());
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda interactiva */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar en catálogo de ${meta.plural.toLowerCase()} (ej. consulta, ecografía, cirugía)...`}
            aria-label={`Buscar ${meta.plural.toLowerCase()}`}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <span className="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>
            Mostrando {filteredItems.length} de {items.length} {meta.plural.toLowerCase()}
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

      {/* Píldoras de filtro por categoría */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>🌟</span>
          <span>Todas las categorías ({items.length})</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-emerald-950 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Si no hay resultados */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-base font-bold text-slate-800">
            No encontramos coincidencias para &quot;{search}&quot;
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Intenta con otro término o selecciona otra categoría.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        /* Secciones por categoría */
        <div className="space-y-8">
          {groupedResults.map(({ category, items: groupItems }) => (
            <section key={category.id} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {category.name}
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    ({groupItems.length})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 sm:mt-0">
                  {category.description}
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupItems.map((item) => {
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
                              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                                {item.name}
                              </h3>
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
