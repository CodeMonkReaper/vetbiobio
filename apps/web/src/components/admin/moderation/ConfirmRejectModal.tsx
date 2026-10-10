'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  trackingCode: string;
  initialNotes?: string;
}

export function ConfirmRejectModal({
  isOpen,
  onClose,
  onConfirm,
  trackingCode,
  initialNotes = '',
}: ConfirmRejectModalProps) {
  const [rejectReason, setRejectReason] = useState(initialNotes);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setError('Por favor indica una breve justificación o motivo del rechazo para la auditoría.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(rejectReason.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al rechazar el aporte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title="Confirmar Rechazo del Aporte"
      description={`Estás a punto de rechazar el aporte #${trackingCode}. Esta acción marcará el registro como REJECTED y quedará asentada en la trazabilidad de auditoría.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reject-reason" className="block text-xs font-semibold uppercase text-ink-mute mb-1">
            Motivo o justificación del rechazo <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ej: Información inconsistente con el arancel oficial de la clínica, duplicado, etc."
            className="w-full rounded-md border border-border bg-surface p-2.5 text-xs text-ink placeholder:text-ink-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
            disabled={submitting}
            autoFocus
          />
          {error && <p className="mt-1 text-xs font-semibold text-rose-700">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            isLoading={submitting}
          >
            Confirmar Rechazo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
