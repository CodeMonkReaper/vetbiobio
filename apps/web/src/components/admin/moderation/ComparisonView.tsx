'use client';

import React from 'react';

interface ClinicData {
  id: string;
  name: string;
  slug: string;
  status: string;
  phoneE164: string | null;
  email: string | null;
  website: string | null;
  whatsappE164: string | null;
  description: string | null;
  isEmergency: boolean;
  is24h: boolean;
}

interface ComparisonViewProps {
  clinic: ClinicData | null | undefined;
  proposedPayload: Record<string, unknown>;
  submissionType: string;
}

export function ComparisonView({ clinic, proposedPayload, submissionType }: ComparisonViewProps) {
  if (!clinic) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 bg-surface-alt/40 text-xs text-ink-mute">
        <p className="font-semibold text-ink">Registro de Nueva Entidad</p>
        <p className="mt-1">
          Este aporte corresponde a una clínica que no existe en el catálogo actual. No hay valores históricos con los que comparar.
        </p>
      </div>
    );
  }

  // Key mappings between clinic model and submission payload aliases
  const fieldDefinitions: Array<{
    key: string;
    label: string;
    getOriginal: (c: ClinicData) => unknown;
    getProposed: (p: Record<string, unknown>) => unknown;
  }> = [
    {
      key: 'name',
      label: 'Nombre',
      getOriginal: (c) => c.name,
      getProposed: (p) => p.name || p.nombre,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      getOriginal: (c) => c.phoneE164,
      getProposed: (p) => p.phone || p.telefono,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      getOriginal: (c) => c.whatsappE164,
      getProposed: (p) => p.whatsapp,
    },
    {
      key: 'email',
      label: 'Correo Electrónico',
      getOriginal: (c) => c.email,
      getProposed: (p) => p.email,
    },
    {
      key: 'website',
      label: 'Sitio Web',
      getOriginal: (c) => c.website,
      getProposed: (p) => p.website || p.web,
    },
    {
      key: 'description',
      label: 'Descripción',
      getOriginal: (c) => c.description,
      getProposed: (p) => p.description || p.descripcion,
    },
    {
      key: 'isEmergency',
      label: 'Atención de Urgencia',
      getOriginal: (c) => (c.isEmergency ? 'Sí' : 'No'),
      getProposed: (p) => {
        const val = p.isEmergency !== undefined ? p.isEmergency : p.urgencias;
        if (val === undefined) return undefined;
        return val ? 'Sí' : 'No';
      },
    },
    {
      key: 'is24h',
      label: 'Horario Continuo 24 Horas',
      getOriginal: (c) => (c.is24h ? 'Sí' : 'No'),
      getProposed: (p) => {
        if (p.is24h === undefined) return undefined;
        return p.is24h ? 'Sí' : 'No';
      },
    },
  ];

  // Specific price comparison if it's a price update
  const isPriceUpdate = submissionType === 'UPDATE_PRICE' || submissionType === 'PRICE';

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <h2 className="text-base font-bold text-ink">Comparación con Registro Actual</h2>
          <p className="text-xs text-ink-mute mt-0.5">
            Clínica: <span className="font-semibold text-brand-700">{clinic.name}</span> (ID: {clinic.id})
          </p>
        </div>
        <span className="text-xs bg-surface-alt px-2.5 py-1 rounded text-ink-soft border border-border-subtle font-medium">
          Estado actual: {clinic.status}
        </span>
      </div>

      {isPriceUpdate ? (
        <div className="text-xs space-y-3">
          <p className="text-ink-soft">
            Este aporte propone actualizar los aranceles para el servicio{' '}
            <strong className="text-ink font-mono">{String(proposedPayload.serviceSlug || proposedPayload.service || 'No especificado')}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-alt/70 border border-border-subtle">
            <div>
              <span className="font-bold text-ink-mute uppercase text-[11px] block">Tipo de Arancel Propuesto</span>
              <span className="font-semibold text-ink text-sm">{String(proposedPayload.pricingType || 'FIXED')}</span>
            </div>
            <div>
              <span className="font-bold text-ink-mute uppercase text-[11px] block">Monto Propuesto</span>
              <span className="font-semibold text-brand-700 text-sm">
                {proposedPayload.amount != null
                  ? `$${Number(proposedPayload.amount).toLocaleString('es-CL')}`
                  : proposedPayload.minAmount != null
                  ? `$${Number(proposedPayload.minAmount).toLocaleString('es-CL')} - $${Number(proposedPayload.maxAmount || 0).toLocaleString('es-CL')}`
                  : 'A consultar'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-ink-mute uppercase font-semibold">
                <th scope="col" className="py-2.5 pr-4">Campo</th>
                <th scope="col" className="py-2.5 px-4 bg-slate-50/50">Valor en Base de Datos</th>
                <th scope="col" className="py-2.5 pl-4 bg-emerald-50/30">Valor Propuesto en Aporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {fieldDefinitions.map((field) => {
                const originalVal = field.getOriginal(clinic);
                const proposedVal = field.getProposed(proposedPayload);
                const hasProposal = proposedVal !== undefined && proposedVal !== null && proposedVal !== '';
                const isModified = hasProposal && String(proposedVal).trim() !== String(originalVal ?? '').trim();

                return (
                  <tr
                    key={field.key}
                    className={`transition-colors ${
                      isModified ? 'bg-amber-50/60 font-medium' : hasProposal ? 'hover:bg-surface-alt/40' : 'opacity-70'
                    }`}
                  >
                    <td className="py-2.5 pr-4 text-ink font-semibold whitespace-nowrap">
                      {field.label}
                      {isModified && (
                        <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 uppercase">
                          Modificado
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-ink-soft whitespace-pre-wrap break-words max-w-[200px]">
                      {originalVal ? String(originalVal) : <span className="text-ink-mute italic">Vacío / No registrado</span>}
                    </td>
                    <td className="py-2.5 pl-4 text-ink whitespace-pre-wrap break-words max-w-[200px]">
                      {hasProposal ? (
                        <span className={isModified ? 'text-brand-800 font-semibold' : 'text-ink-soft'}>
                          {String(proposedVal)}
                        </span>
                      ) : (
                        <span className="text-ink-mute italic">Sin propuesta de cambio</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
