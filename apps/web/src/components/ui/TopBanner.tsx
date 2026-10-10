'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'vetbiobio-topbanner-dismissed';

/**
 * TopBanner — Franja descartable de transparencia del piloto territorial (§10).
 * Persiste el descarte en sessionStorage para no reaparecer durante la sesión de navegación.
 */
export function TopBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // sessionStorage no disponible (modo incógnito estricto o cookies bloqueadas)
    }
  }, []);

  function handleDismiss() {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignorar fallo de almacenamiento
    }
  }

  // Prevenir parpadeo o render si está descartado
  if (!isMounted || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Aviso de estado del directorio"
      className="border-b border-amber-200 bg-amber-100 px-4 py-2 text-xs text-amber-950 print:hidden"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="flex items-center gap-2 leading-relaxed">
          <svg
            className="h-4 w-4 shrink-0 text-amber-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>
            <strong className="font-semibold">Piloto en marcha:</strong> Datos en proceso de verificación territorial.
            Precios referenciales sujetos a confirmación.
          </span>
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/acerca#metodologia"
            className="inline-flex min-h-[44px] items-center px-2 font-semibold underline underline-offset-2 hover:text-amber-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-800 focus-visible:rounded"
          >
            ¿Cómo verificamos?
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso de piloto"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-amber-800 hover:bg-amber-200/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
