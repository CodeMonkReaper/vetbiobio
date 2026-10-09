'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { Badge } from '@/components/ui/Badge';

export interface ClinicBasic {
  id: string | number;
  slug: string;
  name: string;
  commune?: string;
  verification_status?: string;
}

export function AdminClinicHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSlug = searchParams.get('clinica') ?? '';

  const [clinics, setClinics] = useState<ClinicBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminApi('/admin/clinics?limit=100')
      .then((res) => {
        if (mounted) {
          setClinics((res.data as ClinicBasic[]) || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeClinic = useMemo(() => {
    return clinics.find((c) => c.slug === currentSlug);
  }, [clinics, currentSlug]);

  const filteredClinics = useMemo(() => {
    if (!search.trim()) return clinics;
    const q = search.toLowerCase();
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.commune && c.commune.toLowerCase().includes(q)) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [clinics, search]);

  const navTabs = [
    { label: '💰 Precios y Aranceles', path: '/admin/precios' },
    { label: '🕒 Horarios Semanales', path: '/admin/horarios' },
    { label: '📸 Galería Fotográfica', path: '/admin/fotos' },
    { label: '🛡️ Estado y Verificación', path: '/admin/verificar' },
  ];

  function handleSelectClinic(slug: string) {
    setShowSelectorModal(false);
    router.push(`${pathname}?clinica=${slug}`);
  }

  return (
    <div className="space-y-6">
      {/* Selector contextual de clínica */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 transition">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Contexto de Clínica
              </span>
              {activeClinic?.verification_status && (
                <Badge
                  tone={activeClinic.verification_status === 'VERIFIED' ? 'success' : 'warning'}
                  size="sm"
                >
                  {activeClinic.verification_status === 'VERIFIED' ? 'Verificada Oficial' : 'Pendiente Revisión'}
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {activeClinic ? (
                <>
                  <span>🏥</span>
                  <span>{activeClinic.name}</span>
                  {activeClinic.commune && (
                    <span className="text-sm font-normal text-slate-500">
                      ({activeClinic.commune})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>{title}</span>
                </>
              )}
            </h1>
            <p className="text-sm text-slate-500">
              {activeClinic
                ? `Administrando datos de ${activeClinic.name}. Cambios reflejados en tiempo real.`
                : subtitle || 'Selecciona una clínica veterinaria del Biobío para continuar con la edición.'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {activeClinic && (
              <a
                href={`/veterinarias/${activeClinic.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm"
                title="Abrir ficha pública en nueva pestaña"
              >
                <span>🌐</span> Ficha Pública
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowSelectorModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm"
            >
              <span>🔄</span> {activeClinic ? 'Cambiar Clínica' : 'Seleccionar Clínica'}
            </button>
          </div>
        </div>

        {/* Barra de pestañas si hay clínica seleccionada */}
        {activeClinic && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  href={`${tab.path}?clinica=${activeClinic.slug}`}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal / Selector de Clínica */}
      {showSelectorModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clinic-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 id="clinic-modal-title" className="text-lg font-bold text-slate-900">
                  Seleccionar Clínica Veterinaria
                </h2>
                <p className="text-xs text-slate-500">
                  Selecciona una de las {clinics.length} veterinarias registradas en la Región del Biobío.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSelectorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 text-lg"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, comuna o slug (ej. Talcahuano, Chiguayante)..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Cargando clínicas disponibles...
                </div>
              ) : filteredClinics.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No se encontraron clínicas coincidentes con &quot;{search}&quot;.
                </div>
              ) : (
                filteredClinics.map((c) => {
                  const isCurrent = c.slug === currentSlug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => handleSelectClinic(c.slug)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2">
                          <span>🏥</span>
                          <span>{c.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                              Activa
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {c.commune ? `Comuna: ${c.commune}` : 'Región del Biobío'} · Slug: <code className="text-slate-600">{c.slug}</code>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        Seleccionar →
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSelectorModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Si no hay clínica seleccionada, mostrar selector amigable en el cuerpo */}
      {!activeClinic && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🏥
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Selecciona una clínica veterinaria
          </h2>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            Para gestionar {title.toLowerCase()} necesitas indicar sobre qué veterinaria trabajarás. Elige una de la lista para comenzar.
          </p>
          <button
            type="button"
            onClick={() => setShowSelectorModal(true)}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-md transition"
          >
            Abrir catálogo de clínicas ({clinics.length} disponibles)
          </button>
        </div>
      )}

      {/* Contenido inyectado si hay clínica activa */}
      {activeClinic && children}
    </div>
  );
}
