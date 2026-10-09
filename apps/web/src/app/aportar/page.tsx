'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/fields';
import { Card, Alert } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/layout/chrome';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const APORTE_TIPOS = [
  { value: 'NEW_CLINIC', label: '🏥 Registrar una nueva clínica veterinaria' },
  { value: 'UPDATE_CLINIC', label: '📝 Actualizar datos de clínica existente' },
  { value: 'UPDATE_PRICE', label: '💰 Informar nuevos aranceles o precios' },
  { value: 'NEW_SERVICE', label: '🩺 Informar nuevo servicio o especialidad' },
  { value: 'REPORT_CLOSURE', label: '⛔ Reportar cese de atención o cierre' },
  { value: 'NEW_PROMOTION', label: '🎁 Campaña municipal o vacunación' },
  { value: 'CORRECT_DATA', label: '🔍 Corregir dirección o teléfono erróneo' },
  { value: 'OTHER', label: '💬 Otra información o sugerencia' },
];

function AportarContent() {
  const searchParams = useSearchParams();
  const defaultClinic = searchParams?.get('clinica') ?? '';

  const [formData, setFormData] = useState({
    type: defaultClinic ? 'UPDATE_CLINIC' : 'NEW_CLINIC',
    clinicName: defaultClinic,
    message: '',
    evidenceUrl: '',
    submitterName: '',
    submitterEmail: '',
    hasConsent: false,
    payloadText: '',
  });

  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [trackingCode, setTrackingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    setErrorMessage('');

    try {
      const payloadObj: Record<string, string> = {
        detalle: formData.payloadText.trim(),
      };
      if (formData.clinicName.trim()) {
        payloadObj.clinicReference = formData.clinicName.trim();
      }

      const response = await fetch(`${API}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          message: formData.message.trim() || undefined,
          evidenceUrl: formData.evidenceUrl.trim() || undefined,
          submitterName: formData.submitterName.trim() || undefined,
          submitterEmail: formData.submitterEmail.trim() || undefined,
          hasConsent: formData.hasConsent,
          payload: payloadObj,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Error al procesar el aporte. Verifica los campos requeridos.');
      }

      const data = await response.json();
      setTrackingCode(data.trackingCode);
      setStatus('SUCCESS');
    } catch (error) {
      setErrorMessage((error as Error).message);
      setStatus('ERROR');
    }
  };

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card className="space-y-6 p-6 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-verified-bg text-3xl select-none" aria-hidden="true">
            🎉
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              ¡Aporte ciudadano recibido con éxito!
            </h1>
            <p className="mx-auto max-w-md text-sm text-ink-soft">
              Muchas gracias por colaborar con la comunidad del Biobío. La información será cotejada por nuestro equipo de moderación territorial antes de ser publicada.
            </p>
          </div>

          {/* Código de Seguimiento */}
          <div className="mx-auto max-w-sm rounded-xl border border-border-subtle bg-surface-alt p-6">
            <span className="block text-xs font-bold uppercase tracking-wider text-ink-mute">
              Tu Código de Seguimiento
            </span>
            <p className="mt-2 text-3xl font-mono font-extrabold tracking-wider text-brand-700 select-all">
              {trackingCode}
            </p>
            <p className="mt-2 text-xs text-ink-mute">
              Conserva este código para verificar cuándo se apruebe tu actualización.
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                {copied ? '✓ Código copiado' : 'Copiar código'}
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Link href={`/aportar/estado?codigo=${encodeURIComponent(trackingCode)}`}>
              <Button variant="primary">
                Consultar estado de este aporte
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setStatus('IDLE');
                setFormData({
                  type: 'NEW_CLINIC',
                  clinicName: '',
                  message: '',
                  evidenceUrl: '',
                  submitterName: '',
                  submitterEmail: '',
                  hasConsent: false,
                  payloadText: '',
                });
              }}
            >
              Enviar otro aporte
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { label: 'Aporte Ciudadano' },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">Colaboración Abierta</Badge>
            <span className="text-xs text-ink-mute">Participación territorial</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Aportar información de clínicas veterinarias
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Envía nuevos establecimientos, aranceles actualizados o cambios de horario para beneficio de todos los tutores de mascotas.
          </p>
        </div>

        <Link href="/aportar/estado" className="shrink-0">
          <Button variant="outline" size="sm">
            🔍 Ya tengo un código de seguimiento
          </Button>
        </Link>
      </div>

      {status === 'ERROR' && (
        <Alert tone="error" title="No pudimos registrar tu aporte">
          {errorMessage || 'Ocurrió un error al procesar el envío. Revisa los datos e intenta nuevamente.'}
        </Alert>
      )}

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Tipo de aporte */}
          <Field
            label="Tipo de aporte o solicitud"
            htmlFor="type"
            required
            hint="Selecciona la categoría que mejor describa la información que vas a enviar"
          >
            <Select
              id="type"
              name="type"
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
            >
              {APORTE_TIPOS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>

          {/* 2. Nombre de la clínica */}
          <Field
            label="Nombre de la clínica veterinaria"
            htmlFor="clinicName"
            hint="Nombre oficial o de fantasía del establecimiento (si aplica)"
          >
            <Input
              id="clinicName"
              name="clinicName"
              value={formData.clinicName}
              onChange={(e) => setFormData((prev) => ({ ...prev, clinicName: e.target.value }))}
              placeholder="Ej: Clínica Veterinaria Los Boldos, o Dr. Pérez"
            />
          </Field>

          {/* 3. Detalle de la información */}
          <Field
            label="Información que deseas registrar o actualizar"
            htmlFor="payloadText"
            required
            hint="Indica dirección, comuna, aranceles de consulta/vacunas, horarios o si atienden emergencias 24h"
          >
            <Textarea
              id="payloadText"
              name="payloadText"
              required
              rows={4}
              value={formData.payloadText}
              onChange={(e) => setFormData((prev) => ({ ...prev, payloadText: e.target.value }))}
              placeholder="Ej: La clínica ahora atiende de lunes a domingo las 24 horas. El valor de consulta diurna es $18.000 y el de urgencia nocturna es $32.000..."
            />
          </Field>

          {/* 4. Enlace de respaldo */}
          <Field
            label="Enlace de respaldo o fuente (Opcional)"
            htmlFor="evidenceUrl"
            hint="Enlace a Instagram, Facebook oficial, sitio web o boleta que permita cotejar los datos"
          >
            <Input
              type="url"
              id="evidenceUrl"
              name="evidenceUrl"
              value={formData.evidenceUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, evidenceUrl: e.target.value }))}
              placeholder="https://instagram.com/clinica... o enlace público"
            />
          </Field>

          {/* 5. Nota adicional para el moderador */}
          <Field
            label="Nota adicional para los moderadores (Opcional)"
            htmlFor="message"
          >
            <Input
              id="message"
              name="message"
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="¿Algo más que debamos tener en cuenta al verificar?"
            />
          </Field>

          {/* 6. Datos de contacto opcionales (Ley 19.628) */}
          <div className="rounded-xl border border-border-subtle bg-surface-alt p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                Datos de contacto del remitente (Opcionales)
              </span>
              <span className="text-[11px] text-ink-mute">
                Ley 19.628 Protección de la Vida Privada
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre o alias" htmlFor="submitterName">
                <Input
                  id="submitterName"
                  name="submitterName"
                  value={formData.submitterName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, submitterName: e.target.value }))}
                  placeholder="Ej: Macarena"
                />
              </Field>

              <Field label="Correo electrónico" htmlFor="submitterEmail">
                <Input
                  type="email"
                  id="submitterEmail"
                  name="submitterEmail"
                  value={formData.submitterEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, submitterEmail: e.target.value }))}
                  placeholder="contacto@ejemplo.cl"
                />
              </Field>
            </div>

            {Boolean(formData.submitterEmail) && (
              <div className="pt-2 border-t border-border-subtle">
                <Checkbox
                  id="hasConsent"
                  name="hasConsent"
                  label="Autorizo el uso de mi correo exclusivamente para resolver dudas sobre este aporte."
                  description="No te enviaremos publicidad ni compartiremos tus datos con terceros."
                  checked={formData.hasConsent}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hasConsent: e.target.checked }))}
                />
              </div>
            )}
          </div>

          {/* Botón de Envío */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={status === 'LOADING'}
              disabled={Boolean(formData.submitterEmail) && !formData.hasConsent}
            >
              🚀 Enviar aporte para revisión
            </Button>
            <p className="mt-2 text-center text-xs text-ink-mute">
              Al enviar tu aporte ayudas a miles de tutores de animales de la Región del Biobío.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function AportarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
        </div>
      }
    >
      <AportarContent />
    </Suspense>
  );
}
