'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { AdminClinicHeader } from '@/components/admin/AdminClinicHeader';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/fields';

const ENTITY_LABELS: Record<string, string> = {
  clinic: '🏥 Clínica (Ficha General)',
  clinic_location: '📍 Ubicación y Coordenadas GPS',
  clinic_service: '🩺 Servicio Clínico',
  clinic_exam: '🔬 Examen Diagnóstico',
  clinic_service_price: '💰 Arancel de Servicio',
  clinic_exam_price: '💵 Arancel de Examen',
  schedule: '🕒 Horario de Atención',
  clinic_photo: '📸 Fotografía de Instalaciones',
};

const STATE_DETAILS: Record<string, { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' | 'info' }> = {
  VERIFIED: { label: 'VERIFIED — Verificado Oficialmente', tone: 'success' },
  PENDING_REVIEW: { label: 'PENDING_REVIEW — En Revisión', tone: 'warning' },
  UNVERIFIED: { label: 'UNVERIFIED — No Verificado', tone: 'neutral' },
  OUTDATED: { label: 'OUTDATED — Desactualizado', tone: 'info' },
  REJECTED: { label: 'REJECTED — Rechazado / Inválido', tone: 'error' },
};

const SOURCE_LABELS: Record<string, string> = {
  OFFICIAL_WEBSITE: '🌐 Sitio Web Oficial de la Clínica',
  OFFICIAL_SOCIAL_MEDIA: '📱 Red Social Oficial (Instagram, Facebook)',
  PHONE: '📞 Llamada Telefónica de Validación',
  WHATSAPP: '💬 Chat de WhatsApp Institucional',
  EMAIL: '✉️ Correo Electrónico Verificado',
  DIRECT_COMMUNICATION: '🤝 Comunicación Directa con el Director Médico',
  PUBLIC_SOURCE: '🏛️ Registro Público (Colmevet / SAG / Minsal)',
  ADMIN_RESEARCH: '🔍 Investigación y Contraste de Moderación',
  OTHER: '📄 Otra Evidencia Documentada',
};

type VerificationResult = {
  entityType: string;
  entityId: number;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
};

export default function AdminVerificar() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Cargando módulo de verificación...
        </div>
      }
    >
      <VerificarInner />
    </Suspense>
  );
}

function VerificarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('clinica') ?? '';

  const [form, setForm] = useState({
    entityType: 'clinic',
    entityId: '',
    newStatus: 'VERIFIED',
    source: 'OFFICIAL_WEBSITE',
    method: 'Revisión de sitio web y cotejo con registros veterinarios',
    notes: '',
  });

  const [loadingClinic, setLoadingClinic] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Si hay slug, resolver el ID numérico de la clínica para autocompletar
  useEffect(() => {
    if (!slug) return;
    setLoadingClinic(true);
    adminApi(`/admin/clinics?q=${slug}`)
      .then((res) => {
        const list = (res.data as Array<{ id: number; slug: string }>) || [];
        const match = list.find((c) => c.slug === slug);
        if (match) {
          setForm((prev) => ({
            ...prev,
            entityType: 'clinic',
            entityId: String(match.id),
          }));
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        setLoadingClinic(false);
      });
  }, [slug]);

  const setField = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);

    try {
      const res = (await adminApi('/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: form.entityType,
          entityId: Number(form.entityId),
          newStatus: form.newStatus,
          source: form.source,
          method: form.method || undefined,
          notes: form.notes || undefined,
        }),
      })) as {
        entityType: string;
        entityId: number;
        oldStatus: string;
        newStatus: string;
      };

      setResult({
        ...res,
        timestamp: new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    } catch (err) {
      if ((err as Error).message === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto space-y-6">
      <AdminClinicHeader
        title="Protocolo de Verificación y Confianza"
        subtitle="Otorga los sellos de verificación oficial mediante auditoría de fuentes primarias (SAG, Colmevet, contacto directo)."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Verificación */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Aplicar Cambio de Estado de Verificación</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toda verificación genera una entrada inmutable en <code>verification_log</code> y <code>audit_log</code>.
                  </p>
                </div>
                <Badge tone="info" size="sm">
                  Auditoría Activa
                </Badge>
              </div>

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

              {result && (
                <div
                  role="status"
                  className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-2 text-sm">
                      <span>✅</span>
                      <span>Transición de estado registrada con éxito</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-800">
                      {result.timestamp}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 pt-1 border-t border-emerald-200">
                    <div>
                      <strong>Entidad:</strong> <code className="font-bold">{result.entityType}</code> #{result.entityId}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Transición:</strong>
                      <span className="line-through text-slate-500">{result.oldStatus}</span>
                      <span>➔</span>
                      <Badge tone={STATE_DETAILS[result.newStatus]?.tone || 'neutral'} size="sm">
                        {result.newStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => void submit(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Tipo de Entidad" htmlFor="entity-type" required>
                    <Select
                      id="entity-type"
                      value={form.entityType}
                      onChange={(e) => setField('entityType', e.target.value)}
                      required
                    >
                      {Object.entries(ENTITY_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="ID Numérico de la Entidad"
                    htmlFor="entity-id"
                    hint={loadingClinic ? 'Cargando ID...' : 'Identificador en base de datos'}
                    required
                  >
                    <Input
                      id="entity-id"
                      type="number"
                      value={form.entityId}
                      onChange={(e) => setField('entityId', e.target.value)}
                      placeholder="Ej: 14"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nuevo Estado" htmlFor="new-status" required>
                    <Select
                      id="new-status"
                      value={form.newStatus}
                      onChange={(e) => setField('newStatus', e.target.value)}
                      required
                    >
                      {Object.entries(STATE_DETAILS).map(([k, detail]) => (
                        <option key={k} value={k}>
                          {detail.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Fuente de Verificación" htmlFor="source-select" required>
                    <Select
                      id="source-select"
                      value={form.source}
                      onChange={(e) => setField('source', e.target.value)}
                      required
                    >
                      {Object.entries(SOURCE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="Método o Evidencia de Contraste"
                  htmlFor="method-input"
                  hint="Obligatorio para estado VERIFIED (ej: Acta Colmevet Nº 4921, llamada con Dr. Muñoz)"
                  required={form.newStatus === 'VERIFIED'}
                >
                  <Input
                    id="method-input"
                    value={form.method}
                    onChange={(e) => setField('method', e.target.value)}
                    placeholder="Descripción detallada del método de validación realizado..."
                    required={form.newStatus === 'VERIFIED'}
                  />
                </Field>

                <Field label="Notas Internas de Auditoría (Opcional)" htmlFor="notes-area">
                  <Textarea
                    id="notes-area"
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Observaciones de auditoría o condiciones para la próxima revisión..."
                  />
                </Field>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  disabled={busy || !form.entityId}
                >
                  {busy ? 'Aplicando verificación...' : 'Guardar y Certificar Estado'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Guía y Criterios de Calidad */}
          <div className="space-y-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>📋</span>
                <span>Criterios de Verificación</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="font-semibold text-emerald-950 flex items-center gap-1.5 mb-1">
                    <span>🟢</span> <strong>Estado VERIFIED</strong>
                  </div>
                  <p>
                    Otorga el sello verificado verde. Requiere obligatoriamente fuente oficial (sitio, teléfono o registro SAG) y método documentado.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="font-semibold text-amber-950 flex items-center gap-1.5 mb-1">
                    <span>🟡</span> <strong>Estado PENDING_REVIEW</strong>
                  </div>
                  <p>
                    Aportes ciudadanos o datos que requieren cotejo manual antes de ser publicados con sello oficial.
                  </p>
                </div>

                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="font-semibold text-rose-950 flex items-center gap-1.5 mb-1">
                    <span>🔴</span> <strong>Estado REJECTED</strong>
                  </div>
                  <p>
                    Datos erróneos o veterinarias cerradas permanentemente. Inhabilita la visibilidad pública de la entidad.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AdminClinicHeader>
    </main>
  );
}
