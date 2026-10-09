'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/fields';
import { Card, Alert } from '@/components/ui/display';
import { Breadcrumbs } from '@/components/layout/chrome';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface TrackingResult {
  trackingCode: string;
  type: string;
  status: string;
  createdAt: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  clinic?: {
    name: string;
    slug: string;
  } | null;
}

const TYPE_TRANSLATIONS: Record<string, string> = {
  NEW_CLINIC: 'Nueva clínica veterinaria',
  UPDATE_CLINIC: 'Actualización de clínica existente',
  UPDATE_PRICE: 'Actualización de aranceles',
  PRICE: 'Actualización de arancel',
  SCHEDULE: 'Actualización de horarios',
  NEW_SERVICE: 'Nuevo servicio o especialidad',
  REPORT_CLOSURE: 'Cierre o cese de operaciones',
  NEW_PROMOTION: 'Campaña o beneficio',
  CORRECT_DATA: 'Corrección de datos de contacto o ubicación',
  OTHER: 'Otra información comunitaria',
};

function ConsultarEstadoContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get('codigo') ?? '';

  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(searchCode: string) {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/submissions/track/${encodeURIComponent(searchCode.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('No se encontró ningún aporte con el código ingresado. Verifica los caracteres e intenta nuevamente.');
        }
        throw new Error('Ocurrió un problema de conexión al consultar el estado.');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCode) {
      void handleSearch(initialCode);
    }
  }, [initialCode]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-verified-border bg-status-verified-bg px-3 py-1 text-xs font-bold text-status-verified-text">
            <span aria-hidden="true">✓</span>
            <span>Aprobado y publicado</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-3 py-1 text-xs font-bold text-status-danger-text">
            <span aria-hidden="true">✕</span>
            <span>Rechazado tras revisión</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-outdated-border bg-status-outdated-bg px-3 py-1 text-xs font-bold text-status-outdated-text">
            <span aria-hidden="true">◷</span>
            <span>En revisión administrativa</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { href: '/aportar', label: 'Aporte Ciudadano' },
          { label: 'Consultar Estado' },
        ]}
      />

      <Card className="space-y-6 p-6 sm:p-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt text-2xl select-none" aria-hidden="true">
            🔍
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Consultar estado de tu aporte
          </h1>
          <p className="text-sm text-ink-mute">
            Ingresa el código alfanumérico que recibiste al enviar la información.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSearch(code);
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label="Código de seguimiento" htmlFor="track-code">
              <Input
                id="track-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: VBB-A1B2 o VET-..."
                className="font-mono font-bold uppercase tracking-wider"
                required
              />
            </Field>
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full sm:w-auto"
          >
            Consultar
          </Button>
        </form>

        {error && (
          <Alert tone="error" title="Aporte no encontrado">
            {error}
          </Alert>
        )}

        {result && (
          <div className="rounded-xl border border-border-subtle bg-surface-alt p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
                  Código de Seguimiento
                </span>
                <span className="font-mono text-xl font-bold text-ink">
                  {result.trackingCode}
                </span>
              </div>
              <div>{getStatusBadge(result.status)}</div>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-ink-mute uppercase tracking-wider text-[10px]">
                  Tipo de Aporte
                </dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {TYPE_TRANSLATIONS[result.type] ?? result.type}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-ink-mute uppercase tracking-wider text-[10px]">
                  Fecha de Envío
                </dt>
                <dd className="mt-0.5 font-medium text-ink tabular-nums">
                  {new Date(result.createdAt).toLocaleDateString('es-CL', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>

              {result.clinic && (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-ink-mute uppercase tracking-wider text-[10px]">
                    Clínica Asociada
                  </dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    <Link
                      href={`/veterinarias`}
                      className="text-brand-700 underline underline-offset-2 hover:text-brand-800"
                    >
                      {result.clinic.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>

            {result.reviewNotes && (
              <div className="pt-3 border-t border-border-subtle">
                <span className="block text-xs font-semibold text-ink mb-1">
                  Nota del equipo de moderación:
                </span>
                <div className="rounded-lg border border-border-subtle bg-surface p-3 text-xs text-ink-soft">
                  {result.reviewNotes}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 text-center border-t border-border-subtle">
          <Link
            href="/aportar"
            className="text-xs font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            &larr; ¿Quieres enviar otro aporte ciudadano?
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ConsultarEstadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
        </div>
      }
    >
      <ConsultarEstadoContent />
    </Suspense>
  );
}
