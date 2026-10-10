'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLinkItem {
  href: string;
  label: string;
}

export function HeaderNav({ links }: { links: NavLinkItem[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Navegación Desktop */}
      <nav
        aria-label="Navegación principal"
        className="hidden md:flex items-center gap-1 text-sm font-medium text-ink-soft lg:gap-2"
      >
        {links.map((l) => {
          const isActive = pathname === l.href || (l.href !== '/' && pathname.startsWith(`${l.href}/`));
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-md px-3 py-1.5 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 ${
                isActive
                  ? 'bg-brand-50 font-bold text-brand-900 border-b-2 border-brand-700'
                  : 'hover:bg-surface-alt hover:text-brand-700 text-ink-soft'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* Botón Hamburguesa Móvil (Touch target 44px) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-surface-alt md:hidden focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
      >
        {isOpen ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Panel Plegable Móvil */}
      {isOpen && (
        <div
          id="mobile-menu"
          role="region"
          aria-label="Menú móvil desplegable"
          className="absolute left-0 right-0 top-full z-50 border-b border-border-subtle bg-surface/98 p-4 shadow-xl backdrop-blur-md md:hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <nav aria-label="Navegación móvil" className="flex flex-col gap-1">
            {links.map((l) => {
              const isActive = pathname === l.href || (l.href !== '/' && pathname.startsWith(`${l.href}/`));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-4 py-2.5 text-base font-medium transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 ${
                    isActive
                      ? 'bg-brand-50 font-bold text-brand-900 border-l-4 border-brand-700'
                      : 'text-ink hover:bg-surface-alt hover:text-brand-700'
                  }`}
                >
                  <span>{l.label}</span>
                  {isActive && (
                    <span className="text-xs font-semibold text-brand-700" aria-hidden="true">
                      Activo
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="mt-3 border-t border-border-subtle pt-3">
              <Link
                href="/aportar"
                onClick={() => setIsOpen(false)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
              >
                <span>Aportar Información</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
