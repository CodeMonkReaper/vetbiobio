'use client';

import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/fields';

/**
 * Buscador principal (§12): Enruta a /veterinarias con parámetros 'q' y 'commune'.
 * Diseñado con touch targets de 44px, foco visible y etiquetas explícitas.
 */
export function SearchBar() {
  return (
    <form
      action="/veterinarias"
      method="get"
      role="search"
      aria-label="Buscar clínicas veterinarias"
      className="flex flex-col gap-3.5 rounded-2xl border border-border-subtle bg-surface p-4 shadow-card transition-shadow hover:shadow-md sm:flex-row sm:items-end sm:gap-4 sm:p-5"
    >
      <div className="flex-1">
        <Field label="¿Qué servicio o clínica buscas?" htmlFor="q">
          <Input
            id="q"
            name="q"
            placeholder="Ej: Consulta, Radiografía, Los Boldos..."
            autoComplete="off"
          />
        </Field>
      </div>
      <div className="sm:w-64">
        <Field label="¿En qué comuna?" htmlFor="commune">
          <Input
            id="commune"
            name="commune"
            placeholder="Ej: Concepción, Talcahuano..."
            autoComplete="off"
          />
        </Field>
      </div>
      <Button
        type="submit"
        variant="primary"
        className="w-full sm:w-auto"
        leftIcon={
          <svg
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
      >
        Buscar
      </Button>
    </form>
  );
}
