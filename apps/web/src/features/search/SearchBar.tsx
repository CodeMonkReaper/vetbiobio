'use client';

import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/fields';

// Buscador principal (§12): la búsqueda real la hace la API vía URL (/veterinarias?q=&commune=).
export function SearchBar() {
  return (
    <form action="/veterinarias" method="get" role="search" className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label="¿Qué necesitas?" htmlFor="q">
          <Input id="q" name="q" placeholder="Buscar veterinaria, servicio o especialidad" autoComplete="off" />
        </Field>
      </div>
      <div className="sm:w-56">
        <Field label="¿Dónde?" htmlFor="commune">
          <Input id="commune" name="commune" placeholder="Concepción" autoComplete="off" />
        </Field>
      </div>
      <Button type="submit">Buscar</Button>
    </form>
  );
}
