'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Checkbox } from '@/components/ui/fields';
import { Card } from '@/components/ui/display';

export interface CatalogItem {
  slug: string;
  name: string;
}

/**
 * Panel de filtros (§24):
 * Mantiene el estado en la URL para enlaces compartibles y soporte nativo de historial del navegador.
 * En móviles incluye control colapsable para no desplazar los resultados fuera de la vista.
 */
export function FilterPanel({
  communes,
  services,
  exams,
  specialties,
}: {
  communes: CatalogItem[];
  services: CatalogItem[];
  exams: CatalogItem[];
  specialties: CatalogItem[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';

  const [q, setQ] = useState(get('q'));
  const [commune, setCommune] = useState(get('commune'));
  const [service, setService] = useState(get('service'));
  const [exam, setExam] = useState(get('exam'));
  const [specialty, setSpecialty] = useState(get('specialty'));
  const [sort, setSort] = useState(get('sort'));
  const [emergency, setEmergency] = useState(params.get('emergency') === 'true');
  const [verified, setVerified] = useState(params.get('verified_only') === 'true');
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Cuenta de filtros activos
  const activeCount = [
    Boolean(q),
    Boolean(commune),
    Boolean(service),
    Boolean(exam),
    Boolean(specialty),
    Boolean(sort),
    emergency,
    verified,
  ].filter(Boolean).length;

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (q.trim()) qs.set('q', q.trim());
    if (commune) qs.set('commune', commune);
    if (service) qs.set('service', service);
    if (exam) qs.set('exam', exam);
    if (specialty) qs.set('specialty', specialty);
    if (sort) qs.set('sort', sort);
    if (emergency) qs.set('emergency', 'true');
    if (verified) qs.set('verified_only', 'true');

    router.push(`/veterinarias?${qs.toString()}`);
    setIsMobileExpanded(false);
  }

  function clear() {
    setQ('');
    setCommune('');
    setService('');
    setExam('');
    setSpecialty('');
    setSort('');
    setEmergency(false);
    setVerified(false);
    router.push('/veterinarias');
    setIsMobileExpanded(false);
  }

  return (
    <Card className="p-4 sm:p-5">
      {/* Botón toggle para dispositivos móviles */}
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          aria-expanded={isMobileExpanded}
          className="flex min-h-[44px] flex-1 items-center justify-between text-sm font-bold text-ink"
        >
          <span className="flex items-center gap-2">
            <span>⚙️ Filtros de búsqueda</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                {activeCount} activo{activeCount > 1 ? 's' : ''}
              </span>
            )}
          </span>
          <span aria-hidden="true" className="text-base text-ink-mute">
            {isMobileExpanded ? '▲ Ocultar' : '▼ Mostrar'}
          </span>
        </button>
      </div>

      {/* Formulario de filtros */}
      <form
        onSubmit={apply}
        className={`space-y-4 pt-3 md:pt-0 ${
          isMobileExpanded ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="hidden items-center justify-between border-b border-border-subtle pb-3 md:flex">
          <span className="font-bold text-ink">Filtros</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
              {activeCount} activo{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <Field label="Término o nombre" htmlFor="f-q">
          <Input
            id="f-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Clínica, servicio, médico…"
          />
        </Field>

        <Field label="Comuna" htmlFor="f-commune">
          <Select
            id="f-commune"
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
          >
            <option value="">Todas las comunas</option>
            {communes.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Servicio clínico" htmlFor="f-service">
          <Select
            id="f-service"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Todos los servicios</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Examen o diagnóstico" htmlFor="f-exam">
          <Select
            id="f-exam"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
          >
            <option value="">Todos los exámenes</option>
            {exams.map((ex) => (
              <option key={ex.slug} value={ex.slug}>
                {ex.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Especialidad médica" htmlFor="f-specialty">
          <Select
            id="f-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option value="">Todas las especialidades</option>
            {specialties.map((sp) => (
              <option key={sp.slug} value={sp.slug}>
                {sp.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Criterio de orden" htmlFor="f-sort">
          <Select
            id="f-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">Relevancia y frescura</option>
            <option value="DISTANCE">Distancia (más cercanas)</option>
            <option value="PRICE_ASC">Arancel: menor a mayor</option>
            <option value="PRICE_DESC">Arancel: mayor a menor</option>
            <option value="VERIFICATION">Mayor nivel de verificación</option>
          </Select>
        </Field>

        <div className="space-y-1 pt-2 border-t border-border-subtle">
          <Checkbox
            id="f-emergency"
            label="Solo urgencias 24h"
            description="Con médico presencial o de guardia"
            checked={emergency}
            onChange={(e) => setEmergency(e.target.checked)}
          />

          <Checkbox
            id="f-verified"
            label="Solo verificadas"
            description="Datos confirmados en terreno"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button type="submit" variant="primary" className="flex-1">
            Aplicar filtros
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={clear}
            className="flex-1"
          >
            Limpiar
          </Button>
        </div>
      </form>
    </Card>
  );
}
