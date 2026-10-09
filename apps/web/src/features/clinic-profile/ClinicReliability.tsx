'use client';

import { useState } from 'react';

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

export function ClinicReliability({
  data,
  clinicName,
}: {
  data: ReliabilityData | null;
  clinicName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  const getTierTone = (tier: string) => {
    switch (tier) {
      case 'ALTA':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-600 text-white',
        };
      case 'MEDIA':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          badge: 'bg-amber-600 text-white',
        };
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          badge: 'bg-rose-600 text-white',
        };
    }
  };

  const tone = getTierTone(data.tier);
  const factors = data.breakdown?.factors;

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs hover:shadow-sm transition cursor-pointer ${tone.bg}`}
          title="Ver desglose de confiabilidad y corroboración de datos"
        >
          <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
          <span>Confiabilidad: {data.score}/100</span>
          <span className="text-[10px] uppercase font-bold opacity-80">· {data.tier}</span>
          <span className="text-[11px] underline ml-1 text-slate-500 hover:text-slate-800">
            ¿Cómo se calcula?
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Índice de Confiabilidad Documental
                </div>
                <h3 className="text-lg font-bold text-slate-900">{clinicName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Score Central */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs text-slate-500 font-medium">Puntaje Global</div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {data.score} <span className="text-sm font-normal text-slate-400">/ 100 pts</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold ${tone.badge}`}>
                NIVEL {data.tier}
              </div>
            </div>

            {/* Factores Desglosados */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>1. Completitud de la Ficha</span>
                  <span>{data.completenessScore} / 30 pts</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(data.completenessScore / 30) * 100}%` }}
                  />
                </div>
                {factors?.completeness?.detail && (
                  <p className="text-[11px] text-slate-500 mt-1">{factors.completeness.detail}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>2. Nivel de Verificación Humana</span>
                  <span>{data.verificationScore} / 40 pts</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(data.verificationScore / 40) * 100}%` }}
                  />
                </div>
                {factors?.verification?.detail && (
                  <p className="text-[11px] text-slate-500 mt-1">{factors.verification.detail}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>3. Frescura y Actualización</span>
                  <span>{data.freshnessScore} / 30 pts</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(data.freshnessScore / 30) * 100}%` }}
                  />
                </div>
                {factors?.freshness?.detail && (
                  <p className="text-[11px] text-slate-500 mt-1">{factors.freshness.detail}</p>
                )}
              </div>

              {factors?.penalties && factors.penalties.points > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                  <div className="font-semibold">Penalizaciones por incidencias activas:</div>
                  <div className="text-[11px]">{factors.penalties.detail}</div>
                </div>
              )}
            </div>

            {/* Aviso Legal de No Certificación Sanitaria (OBLIGATORIO) */}
            <div className="p-3.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[11px] leading-relaxed">
              <span className="font-bold text-slate-800">Aviso Legal Importante: </span>
              {data.disclaimer}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
