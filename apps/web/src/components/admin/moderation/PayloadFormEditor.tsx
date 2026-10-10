'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/fields';
import { XMarkIcon } from '../icons/AdminIcons';

interface PayloadFormEditorProps {
  payload: Record<string, unknown>;
  originalPayload: Record<string, unknown>;
  isPending: boolean;
  onChange: (updated: Record<string, unknown>) => void;
  focusedFieldName?: string | null;
}

const KNOWN_FIELD_METADATA: Record<
  string,
  { label: string; hint?: string; type?: 'text' | 'number' | 'boolean' | 'textarea' }
> = {
  name: { label: 'Nombre de la Clínica', hint: 'Razón social o nombre público' },
  nombre: { label: 'Nombre de la Clínica', hint: 'Alias del nombre' },
  phone: { label: 'Teléfono Principal', hint: 'Formato recomendado: +569...' },
  telefono: { label: 'Teléfono Principal', hint: 'Alias de teléfono' },
  whatsapp: { label: 'WhatsApp de Contacto', hint: 'Formato: +569...' },
  email: { label: 'Correo Electrónico', hint: 'Email de contacto oficial' },
  website: { label: 'Sitio Web Oficial', hint: 'URL completa con https://' },
  web: { label: 'Sitio Web Oficial', hint: 'Alias de sitio web' },
  address: { label: 'Dirección Física', hint: 'Calle, número, comuna' },
  communeCut: { label: 'Código CUT Comuna', hint: 'Ej: 08101 (Concepción), 08107 (San Pedro de la Paz)' },
  cut: { label: 'Código CUT Comuna', hint: 'Alias de código comunal' },
  description: { label: 'Descripción / Reseña', type: 'textarea', hint: 'Detalles de la clínica o servicios' },
  descripcion: { label: 'Descripción / Reseña', type: 'textarea', hint: 'Alias de descripción' },
  isEmergency: { label: 'Atención de Urgencias', type: 'boolean', hint: '¿Cuenta con atención inmediata para emergencias?' },
  urgencias: { label: 'Atención de Urgencias', type: 'boolean', hint: 'Alias de atención de urgencias' },
  is24h: { label: 'Atención 24 Horas Continua', type: 'boolean', hint: '¿Abierto de forma ininterrumpida?' },
  serviceSlug: { label: 'Slug del Servicio', hint: 'Identificador del catálogo (ej: consulta-general)' },
  service: { label: 'Slug del Servicio', hint: 'Alias de servicio' },
  pricingType: { label: 'Tipo de Tarifa', hint: 'FIXED, RANGE, FROM o CONTACT' },
  minAmount: { label: 'Monto Mínimo (CLP)', type: 'number', hint: 'En pesos chilenos sin puntos' },
  maxAmount: { label: 'Monto Máximo (CLP)', type: 'number', hint: 'Para rango tarifario' },
  amount: { label: 'Monto Fijo (CLP)', type: 'number', hint: 'Alias de arancel' },
  notes: { label: 'Notas del Arancel', hint: 'Condiciones o detalles de la tarifa' },
};

export function PayloadFormEditor({
  payload,
  originalPayload,
  isPending,
  onChange,
  focusedFieldName,
}: PayloadFormEditorProps) {
  const [tab, setTab] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(payload, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // New custom property inputs
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Sincronizar hacia JSON cuando se cambia de pestaña o se edita el formulario
  const handleTabChange = (newTab: 'form' | 'json') => {
    if (newTab === 'json') {
      setJsonText(JSON.stringify(payload, null, 2));
      setJsonError(null);
    } else {
      if (!jsonError) {
        try {
          const parsed = JSON.parse(jsonText);
          onChange(parsed);
        } catch {
          // Mantener payload previo si hay error
        }
      }
    }
    setTab(newTab);
  };

  const handleFieldChange = (key: string, value: unknown) => {
    const next = { ...payload, [key]: value };
    onChange(next);
    setJsonText(JSON.stringify(next, null, 2));
  };

  const handleRemoveField = (key: string) => {
    if (isPending && window.confirm(`¿Estás seguro de eliminar el campo "${key}" del aporte?`)) {
      const next = { ...payload };
      delete next[key];
      onChange(next);
      setJsonText(JSON.stringify(next, null, 2));
    }
  };

  const handleAddField = () => {
    const k = newKey.trim();
    if (!k) return;

    let parsedVal: unknown = newValue;
    if (newValue.toLowerCase() === 'true') parsedVal = true;
    else if (newValue.toLowerCase() === 'false') parsedVal = false;
    else if (!isNaN(Number(newValue)) && newValue.trim() !== '') parsedVal = Number(newValue);

    const next = { ...payload, [k]: parsedVal };
    onChange(next);
    setJsonText(JSON.stringify(next, null, 2));
    setNewKey('');
    setNewValue('');
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setJsonError(null);
      onChange(parsed);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Error de sintaxis JSON');
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setJsonError(null);
      onChange(parsed);
    } catch {
      setJsonError('No es posible formatear: el JSON contiene errores sintácticos.');
    }
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card space-y-4">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-3">
        <div>
          <h2 className="text-base font-bold text-ink">
            Datos Proporcionados en el Aporte ({isPending ? 'Edición Habilitada' : 'Solo Lectura'})
          </h2>
          <p className="text-xs text-ink-mute mt-0.5">
            {isPending
              ? 'Puedes corregir o completar los datos antes de aprobar. Serán los que impacten en la base de datos.'
              : 'Valores registrados de la solicitud de modificación.'}
          </p>
        </div>

        {isPending && (
          <div className="inline-flex rounded-lg border border-border-subtle p-1 bg-surface-alt">
            <button
              type="button"
              onClick={() => handleTabChange('form')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                tab === 'form' ? 'bg-surface text-brand-800 shadow-sm' : 'text-ink-mute hover:text-ink'
              }`}
            >
              Formulario Estructurado
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('json')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                tab === 'json' ? 'bg-surface text-brand-800 shadow-sm' : 'text-ink-mute hover:text-ink'
              }`}
            >
              Editor JSON
            </button>
          </div>
        )}
      </div>

      {/* Structured Form View */}
      {(!isPending || tab === 'form') && (
        <div className="space-y-4">
          {Object.keys(payload).length === 0 ? (
            <p className="text-xs text-ink-mute italic py-2">No hay campos en el payload del aporte.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(payload).map(([k, v]) => {
                const isBool = typeof v === 'boolean';
                const isNum = typeof v === 'number';
                const meta = KNOWN_FIELD_METADATA[k];
                const originalVal = originalPayload[k];
                const isFieldModified = JSON.stringify(v) !== JSON.stringify(originalVal);
                const isFocused = focusedFieldName === k;

                return (
                  <div
                    key={k}
                    id={`field-container-${k}`}
                    className={`rounded-xl border p-3 space-y-1.5 transition-all ${
                      isFocused
                        ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-600'
                        : isFieldModified
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-border-subtle bg-surface-alt/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label htmlFor={`input-${k}`} className="text-xs font-bold text-ink">
                          {meta?.label || k}
                        </label>
                        {meta?.label && <span className="font-mono text-[10px] text-ink-mute">({k})</span>}
                        {isFieldModified && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 rounded">
                            Modificado
                          </span>
                        )}
                      </div>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleRemoveField(k)}
                          title={`Eliminar propiedad ${k}`}
                          className="text-ink-mute hover:text-rose-700 transition p-1"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {meta?.hint && <p className="text-[11px] text-ink-mute leading-snug">{meta.hint}</p>}

                    {isPending ? (
                      isBool ? (
                        <div className="pt-1">
                          <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                            <input
                              type="checkbox"
                              id={`input-${k}`}
                              checked={Boolean(v)}
                              onChange={(e) => handleFieldChange(k, e.target.checked)}
                              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                            />
                            <span>{v ? 'Activado / Sí' : 'Desactivado / No'}</span>
                          </label>
                        </div>
                      ) : meta?.type === 'textarea' || (typeof v === 'string' && v.length > 80) ? (
                        <textarea
                          id={`input-${k}`}
                          value={String(v ?? '')}
                          onChange={(e) => handleFieldChange(k, e.target.value)}
                          rows={2}
                          className="w-full text-xs rounded-md border border-border bg-surface p-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
                        />
                      ) : typeof v === 'object' && v !== null ? (
                        <textarea
                          id={`input-${k}`}
                          value={JSON.stringify(v)}
                          onChange={(e) => {
                            try {
                              handleFieldChange(k, JSON.parse(e.target.value));
                            } catch {
                              handleFieldChange(k, e.target.value);
                            }
                          }}
                          rows={2}
                          className="w-full text-xs font-mono rounded-md border border-border bg-surface p-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
                        />
                      ) : (
                        <Input
                          id={`input-${k}`}
                          type={isNum ? 'number' : 'text'}
                          value={String(v ?? '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isNum && !isNaN(Number(val)) && val !== '') {
                              handleFieldChange(k, Number(val));
                            } else {
                              handleFieldChange(k, val);
                            }
                          }}
                          className="text-xs"
                        />
                      )
                    ) : (
                      <div className="text-xs font-medium text-ink break-words py-1">
                        {isBool ? (v ? 'Sí' : 'No') : typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add custom key/value property */}
          {isPending && (
            <div className="rounded-xl border border-dashed border-border p-3.5 bg-surface-alt/40 space-y-2">
              <span className="text-xs font-semibold text-ink-soft block">
                + Añadir campo o propiedad adicional al aporte
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nombre del campo (ej: email, website)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="flex-1 text-xs rounded-md border border-border bg-surface px-3 py-1.5 text-ink placeholder:text-ink-mute"
                />
                <input
                  type="text"
                  placeholder="Valor asignado"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 text-xs rounded-md border border-border bg-surface px-3 py-1.5 text-ink placeholder:text-ink-mute"
                />
                <button
                  type="button"
                  onClick={handleAddField}
                  className="rounded-md bg-surface border border-border hover:bg-surface-alt px-3.5 py-1.5 text-xs font-semibold text-ink transition"
                >
                  Añadir campo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* JSON Direct Editor */}
      {isPending && tab === 'json' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-mute">
            <span>Editor JSON directo de la carga útil</span>
            <button
              type="button"
              onClick={handleFormatJson}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
            >
              Formatear e Indentar JSON
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={12}
            className={`w-full rounded-xl border p-3.5 font-mono text-xs leading-relaxed transition ${
              jsonError
                ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:outline-rose-500'
                : 'border-slate-800 bg-slate-900 text-emerald-400 focus:outline-brand-500'
            }`}
            spellCheck={false}
          />
          {jsonError && (
            <p className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
              <span>Error de sintaxis: {jsonError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
