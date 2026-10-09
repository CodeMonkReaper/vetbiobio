'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { AdminClinicHeader } from '@/components/admin/AdminClinicHeader';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Field, Input, Select } from '@/components/ui/fields';
import { Button } from '@/components/ui/Button';

type Row = {
  id: number;
  kind: 'service' | 'exam';
  slug: string;
  name: string;
  min_amount: number | null;
  max_amount?: number | null;
  pricing_type: string | null;
};

export default function AdminPrecios() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Cargando módulo de precios...
        </div>
      }
    >
      <PreciosInner />
    </Suspense>
  );
}

function PreciosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('clinica') ?? '';

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'service' | 'exam'>('all');
  const [filterPrice, setFilterPrice] = useState<'all' | 'with-price' | 'no-price'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulario
  const [form, setForm] = useState({
    id: '',
    kind: 'service' as 'service' | 'exam',
    min: '',
    max: '',
    type: 'FIXED',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminApi(`/admin/clinics/${slug}/services`);
      const data = (res.data as Row[]) || [];
      setRows(data);
      const first = data[0];
      if (first && !form.id) {
        setForm((prev) => ({
          ...prev,
          id: String(first.id),
          kind: first.kind,
        }));
      }
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [router, slug, form.id]);

  useEffect(() => {
    if (slug) void load();
  }, [load, slug]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterKind !== 'all' && r.kind !== filterKind) return false;
      if (filterPrice === 'with-price' && r.min_amount === null) return false;
      if (filterPrice === 'no-price' && r.min_amount !== null) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, filterKind, filterPrice, searchQuery]);

  // Selección de ítem en tabla para precargar formulario
  function handleSelectRow(row: Row) {
    setForm({
      id: String(row.id),
      kind: row.kind,
      min: row.min_amount !== null ? String(row.min_amount) : '',
      max: row.max_amount !== null && row.max_amount !== undefined ? String(row.max_amount) : '',
      type: row.pricing_type || 'FIXED',
    });
    setSuccess('');
    setError('');
    // Desplazar suavemente al formulario
    const formElement = document.getElementById('price-form-section');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const kind = form.kind === 'exam' ? 'exam' : 'service';
      await adminApi(`/admin/prices/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(kind === 'exam'
            ? { clinicExamId: Number(form.id) }
            : { clinicServiceId: Number(form.id) }),
          minAmount: form.min === '' ? null : Number(form.min),
          maxAmount: form.max === '' ? null : Number(form.max),
          pricingType: form.type,
        }),
      });
      setSuccess('Arancel actualizado con éxito. El valor previo quedó archivado en auditoría.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function formatClp(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 's/p';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const stats = useMemo(() => {
    const total = rows.length;
    const withPrice = rows.filter((r) => r.min_amount !== null).length;
    const withoutPrice = total - withPrice;
    return { total, withPrice, withoutPrice };
  }, [rows]);

  return (
    <main className="max-w-7xl mx-auto space-y-6">
      <AdminClinicHeader
        title="Gestión de Precios y Aranceles"
        subtitle="Administra los aranceles referenciales de servicios y exámenes clínicos en pesos chilenos (CLP)."
      >
        {/* Métricas y resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border border-slate-200">
            <div className="text-xs uppercase font-bold text-slate-500">Catálogo Asignado</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total} ítems</div>
            <div className="text-xs text-slate-500 mt-0.5">Servicios y exámenes disponibles</div>
          </Card>
          <Card className="p-4 bg-white border border-emerald-200 bg-emerald-50/30">
            <div className="text-xs uppercase font-bold text-emerald-800">Con Precio Vigente</div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{stats.withPrice} activos</div>
            <div className="text-xs text-emerald-700 mt-0.5">Visibles con arancel en CLP</div>
          </Card>
          <Card className="p-4 bg-white border border-amber-200 bg-amber-50/30">
            <div className="text-xs uppercase font-bold text-amber-800">Pendientes de Arancel</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">{stats.withoutPrice} sin precio</div>
            <div className="text-xs text-amber-700 mt-0.5">Aparecen como &quot;Consultar clínica&quot;</div>
          </Card>
        </div>

        {/* Notificaciones */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-rose-500 hover:text-rose-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>{success}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="text-emerald-500 hover:text-emerald-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listado y tabla */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por nombre de prestación..."
                  aria-label="Filtrar prestaciones por nombre o código"
                  className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={filterKind}
                    onChange={(e) => setFilterKind(e.target.value as 'all' | 'service' | 'exam')}
                    className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                    aria-label="Filtrar por tipo"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="service">Solo Servicios</option>
                    <option value="exam">Solo Exámenes</option>
                  </select>

                  <select
                    value={filterPrice}
                    onChange={(e) => setFilterPrice(e.target.value as 'all' | 'with-price' | 'no-price')}
                    className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                    aria-label="Filtrar por arancel"
                  >
                    <option value="all">Cualquier estado</option>
                    <option value="with-price">Con precio</option>
                    <option value="no-price">Sin precio</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500 text-sm">Cargando aranceles...</div>
              ) : filteredRows.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No se encontraron ítems con los filtros aplicados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Prestación</th>
                        <th className="py-2.5 px-3 text-right">Arancel CLP</th>
                        <th className="py-2.5 px-3 text-center">Modalidad</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((r) => {
                        const isSelected = form.id === String(r.id) && form.kind === r.kind;
                        return (
                          <tr
                            key={`${r.kind}-${r.id}`}
                            className={`hover:bg-slate-50 transition ${
                              isSelected ? 'bg-emerald-50/60 font-medium' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge
                                tone={r.kind === 'service' ? 'info' : 'neutral'}
                                size="sm"
                              >
                                {r.kind === 'service' ? '🩺 Servicio' : '🔬 Examen'}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-slate-900">
                              <div className="font-medium">{r.name}</div>
                              <div className="text-[11px] text-slate-400">ID #{r.id} · {r.slug}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold tabular-nums whitespace-nowrap">
                              {r.min_amount !== null ? (
                                <span className="text-emerald-800">
                                  {r.pricing_type === 'FROM' && 'Desde '}
                                  {formatClp(r.min_amount)}
                                  {r.max_amount ? ` – ${formatClp(r.max_amount)}` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic text-xs">
                                  Sin arancel
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {r.pricing_type || '—'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleSelectRow(r)}
                                className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                                  isSelected
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isSelected ? 'Editando' : 'Editar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de actualización */}
          <div id="price-form-section" className="space-y-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>✏️</span>
                  <span>Actualizar Arancel</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registra o actualiza el precio vigente. El arancel anterior queda archivado con vigencia histórica.
                </p>
              </div>

              <form onSubmit={(e) => void submit(e)} className="space-y-4">
                <Field label="Prestación / Ítem" htmlFor="item-select" required>
                  <Select
                    id="item-select"
                    value={`${form.kind}:${form.id}`}
                    onChange={(e) => {
                      const [kind, id] = e.target.value.split(':') as ['service' | 'exam', string];
                      const found = rows.find((r) => r.kind === kind && String(r.id) === id);
                      if (found) {
                        setForm({
                          id,
                          kind,
                          min: found.min_amount !== null ? String(found.min_amount) : '',
                          max: found.max_amount !== null && found.max_amount !== undefined ? String(found.max_amount) : '',
                          type: found.pricing_type || 'FIXED',
                        });
                      }
                    }}
                    required
                  >
                    {rows.map((r) => (
                      <option key={`${r.kind}-${r.id}`} value={`${r.kind}:${r.id}`}>
                        [{r.kind === 'service' ? 'Servicio' : 'Examen'}] {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Modalidad de Tarifa" htmlFor="pricing-type" required>
                  <Select
                    id="pricing-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    required
                  >
                    <option value="FIXED">FIXED — Precio Fijo Exacto</option>
                    <option value="RANGE">RANGE — Rango (Mínimo y Máximo)</option>
                    <option value="FROM">FROM — Desde un monto base</option>
                    <option value="CONTACT">CONTACT — A convenir / Consultar</option>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Monto Mínimo (CLP)"
                    htmlFor="min-amount"
                    hint="Ej: 25000"
                  >
                    <Input
                      id="min-amount"
                      type="number"
                      min="0"
                      step="500"
                      value={form.min}
                      onChange={(e) => setForm({ ...form, min: e.target.value })}
                      placeholder="25000"
                    />
                  </Field>

                  <Field
                    label="Monto Máximo (CLP)"
                    htmlFor="max-amount"
                    hint="Solo para rango"
                  >
                    <Input
                      id="max-amount"
                      type="number"
                      min="0"
                      step="500"
                      value={form.max}
                      onChange={(e) => setForm({ ...form, max: e.target.value })}
                      placeholder="40000"
                      disabled={form.type !== 'RANGE'}
                    />
                  </Field>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">Vista previa de visualización:</div>
                  <div className="font-mono text-emerald-800 font-bold">
                    {form.min ? (
                      <>
                        {form.type === 'FROM' && 'Desde '}
                        {formatClp(Number(form.min))}
                        {form.type === 'RANGE' && form.max ? ` – ${formatClp(Number(form.max))}` : ''}
                      </>
                    ) : (
                      'Consultar en clínica'
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  disabled={saving || !form.id}
                >
                  {saving ? 'Guardando arancel...' : 'Guardar y Publicar Arancel'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </AdminClinicHeader>
    </main>
  );
}
