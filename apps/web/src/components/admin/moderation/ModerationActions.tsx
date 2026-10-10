'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircleIcon, XCircleIcon } from '../icons/AdminIcons';

interface ModerationActionsProps {
  status: string;
  submissionType: string;
  reviewNotes: string;
  onNotesChange: (notes: string) => void;
  onApprove: (publishDirectly: boolean) => Promise<void>;
  onOpenRejectModal: () => void;
  processing: boolean;
  hasBlockingErrors: boolean;
  isDirty: boolean;
}

export function ModerationActions({
  status,
  submissionType,
  reviewNotes,
  onNotesChange,
  onApprove,
  onOpenRejectModal,
  processing,
  hasBlockingErrors,
  isDirty,
}: ModerationActionsProps) {
  const isPending = status === 'PENDING';

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <h2 className="text-base font-bold text-ink">Resolución de Moderación</h2>
        <p className="text-xs text-ink-mute mt-0.5">
          Aplica las reglas y cambios de forma permanente a la base de datos de producción.
        </p>
      </div>

      {/* Review Notes for Audit */}
      <div>
        <label htmlFor="moderation-notes" className="block text-xs font-semibold uppercase text-ink-mute mb-1">
          Notas de Moderación / Auditoría
        </label>
        <textarea
          id="moderation-notes"
          rows={3}
          value={reviewNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={!isPending || processing}
          placeholder="Notas internas sobre la verificación de la clínica o fuentes consultadas..."
          className="w-full text-xs rounded-md border border-border bg-surface p-2.5 text-ink placeholder:text-ink-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 disabled:bg-surface-alt disabled:text-ink-mute"
        />
      </div>

      {/* Actions */}
      {isPending ? (
        <div className="space-y-2.5 pt-1">
          {hasBlockingErrors && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 font-medium">
              Corrige los errores bloqueantes indicados en el panel para habilitar la aprobación.
            </div>
          )}

          {isDirty && !hasBlockingErrors && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
              Tienes cambios locales. Al aprobar, se enviará y aplicará el borrador actual automáticamente.
            </div>
          )}

          {/* Botón principal: Aprobar y Publicar */}
          <Button
            variant="primary"
            size="md"
            className="w-full font-bold shadow-sm"
            onClick={() => onApprove(true)}
            isLoading={processing}
            disabled={hasBlockingErrors || processing}
            leftIcon={<CheckCircleIcon className="w-5 h-5" />}
          >
            Aprobar y Publicar
          </Button>

          {/* Opción para NEW_CLINIC: Aprobar en DRAFT */}
          {submissionType === 'NEW_CLINIC' && (
            <button
              type="button"
              onClick={() => onApprove(false)}
              disabled={hasBlockingErrors || processing}
              className="w-full inline-flex items-center justify-center min-h-[44px] rounded-md bg-slate-700 hover:bg-slate-800 text-white font-medium px-4 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700 disabled:opacity-50"
            >
              Aprobar como Borrador (DRAFT)
            </button>
          )}

          {/* Botón Rechazar */}
          <button
            type="button"
            onClick={onOpenRejectModal}
            disabled={processing}
            className="w-full inline-flex items-center justify-center min-h-[44px] rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold px-4 py-2 text-xs border border-rose-200 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700 disabled:opacity-50 gap-1.5"
          >
            <XCircleIcon className="w-4 h-4 text-rose-700" />
            <span>Rechazar Aporte</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-surface-alt text-ink-mute text-xs rounded-xl text-center font-medium border border-border-subtle">
          Este aporte ya se encuentra resuelto con estado <strong className="text-ink">{status}</strong>.
        </div>
      )}
    </div>
  );
}
