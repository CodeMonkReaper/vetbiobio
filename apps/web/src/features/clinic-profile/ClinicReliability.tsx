'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ReliabilityData {
  score: number;
  tier: 'ALTA' | 'MEDIA' | 'BAJA' | 'CRITICA';
  completenessScore: number;
  verificationScore: number;
  freshnessScore: number;
  activeIssuesCount: number;
  breakdown: {
    factors?: {
      completeness?: { points: number; max: number; detail: string };
      verification?: { points: number; max: number; detail: string };
      freshness?: { points: number; max: number; detail: string };
      penalties?: { points: number; detail: string };
    };
  };
  disclaimer: string;
}

/**
 * Indicador y diálogo modal accesible del Índice de Confiabilidad Documental (§15, §18).
 * Utiliza el componente Modal con trampa de foco, Escape y restauración de foco.
 */
export function ClinicReliability({
  data,
  clinicName,
}: {
  data: ReliabilityData | null;
  clinicName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!data) return null;

  const getTierTone = (tier: string) => {
    switch (tier) {
      case 'ALTA':
        return {
          pill: 'bg-status-verified-bg text-status-verified-text border-status-verified-border',
          dot: 'bg-emerald-600',
          badge: 'bg-brand-700 text-white',
        };
      case 'MEDIA':
        return {
          pill: 'bg-status-review-bg text-status-review-text border-status-review-border',
          dot: 'bg-amber-600',
          badge: 'bg-amber-700 text-white',
        };
      default:
        return {
          pill: 'bg-status-danger-bg text-status-danger-text border-status-danger-border',
          dot: 'bg-rose-600',
          badge: 'bg-rose-700 text-white',
        };
    }
  };

  const tone = getTierTone(data.tier);
  const factors = data.breakdown?.factors;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 ${tone.pill}`}
        title="Abrir desglose metodológico de confiabilidad y cotejo documental"
        aria-haspopup="dialog"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden="true" />
        <span className="tabular-nums font-bold">Confiabilidad: {data.score}/100</span>
        <span className="text-[11px] font-bold uppercase tracking-wider">· {data.tier}</span>
        <span className="ml-1 text-[11px] font-semibold underline underline-offset-2">
          ¿Cómo se calcula?
        </span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Índice de Confiabilidad Documental"
        description={`Evaluación explicable y objetiva de los datos territoriales para ${clinicName}.`}
        triggerRef={triggerRef}
      >
        <div className="space-y-5 text-sm text-ink-soft">
          {/* Puntaje Central */}
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-alt p-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                Puntaje Ponderado
              </span>
              <div className="text-3xl font-extrabold text-ink tabular-nums">
                {data.score} <span className="text-sm font-normal text-ink-mute">/ 100 pts</span>
              </div>
            </div>
            <div className={`rounded-md px-3 py-1 text-xs font-bold tracking-wide ${tone.badge}`}>
              NIVEL {data.tier}
            </div>
          </div>

          {/* Desglose de Factores con Barras de Progreso Accesibles */}
          <div className="space-y-4">
            {/* Factor 1: Completitud */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-ink">
                <span>1. Completitud de la Ficha</span>
                <span className="tabular-nums">{data.completenessScore} / 30 pts</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={data.completenessScore}
                aria-valuemin={0}
                aria-valuemax={30}
                aria-label="Puntaje de completitud de la ficha"
              >
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-300 motion-reduce:transition-none"
                  style={{ width: `${(data.completenessScore / 30) * 100}%` }}
                />
              </div>
              {factors?.completeness?.detail && (
                <p className="text-[11px] text-ink-mute">{factors.completeness.detail}</p>
              )}
            </div>

            {/* Factor 2: Verificación */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-ink">
                <span>2. Verificación Humana en Terreno</span>
                <span className="tabular-nums">{data.verificationScore} / 40 pts</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={data.verificationScore}
                aria-valuemin={0}
                aria-valuemax={40}
                aria-label="Puntaje de verificación humana"
              >
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-300 motion-reduce:transition-none"
                  style={{ width: `${(data.verificationScore / 40) * 100}%` }}
                />
              </div>
              {factors?.verification?.detail && (
                <p className="text-[11px] text-ink-mute">{factors.verification.detail}</p>
              )}
            </div>

            {/* Factor 3: Frescura */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-ink">
                <span>3. Frescura y Actualización</span>
                <span className="tabular-nums">{data.freshnessScore} / 30 pts</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={data.freshnessScore}
                aria-valuemin={0}
                aria-valuemax={30}
                aria-label="Puntaje de frescura de datos"
              >
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-300 motion-reduce:transition-none"
                  style={{ width: `${(data.freshnessScore / 30) * 100}%` }}
                />
              </div>
              {factors?.freshness?.detail && (
                <p className="text-[11px] text-ink-mute">{factors.freshness.detail}</p>
              )}
            </div>

            {/* Penalizaciones por incidencias si existen */}
            {factors?.penalties && factors.penalties.points > 0 && (
              <div className="rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-status-danger-text">
                <span className="font-bold">Penalización por incidencias reportadas:</span>
                <p className="mt-0.5 text-xs">{factors.penalties.detail}</p>
              </div>
            )}
          </div>

          {/* Advertencia Legal Obligatoria de No Certificación Sanitaria */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
            <span className="font-bold">Aviso metodológico: </span>
            {data.disclaimer}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
