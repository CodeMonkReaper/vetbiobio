'use client';

import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useId,
} from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * Modal accesible (WCAG 2.2):
 * - role="dialog", aria-modal="true", aria-labelledby, aria-describedby.
 * - Trampa de foco (Focus Trap) navegable con Tab / Shift+Tab.
 * - Cierre accesible con tecla Escape y clic en backdrop.
 * - Restaura el foco al elemento disparador al cerrarse.
 * - Bloquea el scroll del fondo mientras está visible.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  triggerRef,
  className = '',
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Guardar foco previo
    previouslyFocusedElementRef.current = (document.activeElement as HTMLElement) ?? null;

    // Bloquear scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Poner foco en el modal o su primer elemento enfocable
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        if (first) {
          first.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    // Manejador de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (!firstElement || !lastElement) return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      // Devolver foco
      const returnTarget = triggerRef?.current ?? previouslyFocusedElementRef.current;
      if (returnTarget && typeof returnTarget.focus === 'function') {
        returnTarget.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Contenedor del Diálogo */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-lg outline-none border border-border-subtle ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana modal"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-surface-alt hover:text-ink focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {description && (
          <p id={descId} className="mt-2 text-sm text-ink-soft">
            {description}
          </p>
        )}

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
