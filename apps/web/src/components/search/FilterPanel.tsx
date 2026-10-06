'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/fields';

export interface CatalogItem {
  slug: string;
  name: string;
}

// Panel de filtros (§24): todo vive en la URL (?q=&commune=&service=...).
// Compartible, indexable y compatible con back/forward.
export function FilterPanel({ communes, services, exams, specialties }: {
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

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (commune) qs.set('commune', commune);
    if (service) qs.set('service', service);
    if (exam) qs.set('exam', exam);
    if (specialty) qs.set('specialty', specialty);
    if (sort) qs.set('sort', sort);
    if (emergency) qs.set('emergency', 'true');
    if (verified) qs.set('verified_only', 'true');
    router.push(`/veterinarias?${qs}`);
  }

  function clear() {
    setQ(''); setCommune(''); setService(''); setExam(''); setSpecialty('');
    setSort(''); setEmergency(false); setVerified(false);
    router.push('/veterinarias');
  }

  const select = (id: string, label: string, value: string, set: (v: string) => void, items: CatalogItem[], all: string) => (
    <Field label={label} htmlFor={id}>
      <Select id={id} value={value} onChange={(e) => set(e.target.value)}>
        <option value="">{all}</option>
        {items.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
      </Select>
    </Field>
  );

  return (
    <form onSubmit={apply} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <Field label="Buscar" htmlFor="f-q">
        <Input id="f-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, servicio, especialidad…" />
      </Field>
      {select('f-commune', 'Comuna', commune, setCommune, communes, 'Todas')}
      {select('f-service', 'Servicio', service, setService, services, 'Todos')}
      {select('f-exam', 'Examen', exam, setExam, exams, 'Todos')}
      {select('f-specialty', 'Especialidad', specialty, setSpecialty, specialties, 'Todas')}
      <Field label="Orden" htmlFor="f-sort">
        <Select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Relevancia</option>
          <option value="DISTANCE">Distancia</option>
          <option value="PRICE_ASC">Precio: menor a mayor</option>
          <option value="PRICE_DESC">Precio: mayor a menor</option>
          <option value="VERIFICATION">Verificación</option>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
        Solo urgencias
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
        Solo verificadas
      </label>
      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="secondary" onClick={clear}>Limpiar</Button>
      </div>
    </form>
  );
}
