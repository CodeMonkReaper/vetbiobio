'use client';

import React from 'react';
import type { ValidationIssue } from '@/lib/moderation-validation';
import { XCircleIcon } from '../icons/AdminIcons';

interface ValidationPanelProps {
  issues: ValidationIssue[];
  onFocusField?: (fieldName: string) => void;
}

export function ValidationPanel({ issues, onFocusField }: ValidationPanelProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 flex items-center gap-2.5">
        <span className="font-bold">Requisitos de publicación cumplidos.</span>
        <span className="text-emerald-700">El aporte cuenta con los datos mínimos válidos para ser procesado.</span>
      </div>
    );
  }

  const blockingErrors = issues.filter((i) => i.isBlocking);
  const warnings = issues.filter((i) => !i.isBlocking);

  return (
    <div className="space-y-3">
      {blockingErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950 space-y-2 shadow-sm"
        >
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <XCircleIcon className="w-4 h-4 text-rose-700" />
            <span>Errores Bloqueantes antes de Aprobar ({blockingErrors.length})</span>
          </div>
          <p className="text-[11px] text-rose-800">
            La política de negocio del backend requiere resolver los siguientes campos antes de aprobar y publicar:
          </p>
          <ul className="space-y-1.5 pt-1">
            {blockingErrors.map((err, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span className="flex-1 font-medium">{err.message}</span>
                {err.field && onFocusField && (
                  <button
                    type="button"
                    onClick={() => onFocusField(err.field!)}
                    className="underline text-rose-800 hover:text-rose-950 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-800 rounded px-1"
                  >
                    Ir al campo ({err.field})
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <span>Advertencias Informativas ({warnings.length})</span>
          </div>
          <ul className="space-y-1 pt-0.5">
            {warnings.map((warn, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span className="flex-1">{warn.message}</span>
                {warn.field && onFocusField && (
                  <button
                    type="button"
                    onClick={() => onFocusField(warn.field!)}
                    className="underline text-amber-800 hover:text-amber-950 font-semibold rounded px-1"
                  >
                    Ver ({warn.field})
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
