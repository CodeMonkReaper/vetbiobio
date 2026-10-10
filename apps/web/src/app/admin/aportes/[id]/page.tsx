'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin';
import { Alert } from '@/components/ui/display';
import { ModerationHeader } from '@/components/admin/moderation/ModerationHeader';
import { ComparisonView } from '@/components/admin/moderation/ComparisonView';
import { ValidationPanel } from '@/components/admin/moderation/ValidationPanel';
import { ModerationActions } from '@/components/admin/moderation/ModerationActions';
import { ConfirmRejectModal } from '@/components/admin/moderation/ConfirmRejectModal';
import { PayloadFormEditor } from '@/components/admin/moderation/PayloadFormEditor';
import { validateSubmissionForApproval } from '@/lib/moderation-validation';
import { ExternalLinkIcon, ShieldCheckIcon } from '@/components/admin/icons/AdminIcons';

interface SubmissionDetail {
  id: string;
  trackingCode: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clinicId?: string | null;
  message: string | null;
  evidenceUrl: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  consentAt: string | null;
  payload: Record<string, unknown>;
  reviewNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  appliedEntityType: string | null;
  appliedEntityId: string | null;
  clinic?: {
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
  } | null;
  reviewer?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

const TYPE_TRANSLATIONS: Record<string, string> = {
  NEW_CLINIC: 'Nueva Clínica',
  UPDATE_CLINIC: 'Actualizar Datos',
  CLINIC_UPDATE: 'Actualizar Datos',
  REPORT_CLOSURE: 'Reporte de Cierre',
  NEW_SERVICE: 'Nuevo Servicio',
  UPDATE_PRICE: 'Actualizar Precios',
  PRICE: 'Actualizar Precios',
  SCHEDULE: 'Actualizar Horarios',
  NEW_PROMOTION: 'Nueva Promoción',
  CORRECT_DATA: 'Corregir Datos',
  OTHER: 'Otro / Consulta',
};

export default function AdminAporteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Server state
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local draft state
  const [serverPayload, setServerPayload] = useState<Record<string, unknown>>({});
  const [draftPayload, setDraftPayload] = useState<Record<string, unknown>>({});
  const [serverMessage, setServerMessage] = useState<string>('');
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Save & action states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [processing, setProcessing] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Load contribution data from API
  const loadData = useCallback(async () => {
    try {
      const data = await adminApi(`/admin/submissions/${id}`);
      setSubmission(data);
      const payload = data.payload || {};
      setServerPayload(payload);
      setDraftPayload(payload);
      setServerMessage(data.message || '');
      setDraftMessage(data.message || '');
      setReviewNotes(data.reviewNotes || '');
      setSaveStatus('idle');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar aporte';
      if (msg === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine if draft is dirty
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(draftPayload) !== JSON.stringify(serverPayload) ||
      draftMessage !== serverMessage
    );
  }, [draftPayload, serverPayload, draftMessage, serverMessage]);

  // Window beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Validation issues
  const validationIssues = useMemo(() => {
    if (!submission) return [];
    return validateSubmissionForApproval(
      submission.type,
      draftPayload,
      Boolean(submission.clinicId || submission.clinic)
    );
  }, [submission, draftPayload]);

  const hasBlockingErrors = useMemo(() => {
    return validationIssues.some((i) => i.isBlocking);
  }, [validationIssues]);

  // Jump to field helper
  const handleFocusField = (fieldName: string) => {
    setFocusedField(fieldName);
    const element = document.getElementById(`field-container-${fieldName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const input = document.getElementById(`input-${fieldName}`);
        if (input) input.focus();
      }, 300);
    }
  };

  // Discard draft changes
  const handleDiscardChanges = () => {
    if (window.confirm('¿Deseas descartar todas las modificaciones locales no guardadas?')) {
      setDraftPayload(serverPayload);
      setDraftMessage(serverMessage);
      setSaveStatus('idle');
      setSuccessMsg(null);
    }
  };

  // Save draft to server
  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await adminApi(`/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: draftPayload,
          message: draftMessage,
          reviewNotes: reviewNotes,
        }),
      });

      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              payload: updated.payload,
              message: updated.message,
              reviewNotes: updated.reviewNotes,
            }
          : null
      );
      setServerPayload(updated.payload || {});
      setDraftPayload(updated.payload || {});
      setServerMessage(updated.message || '');
      setDraftMessage(updated.message || '');
      setSaveStatus('saved');
      setSuccessMsg('Borrador guardado exitosamente en el servidor.');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: unknown) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Error al guardar modificaciones');
    }
  };

  // Approve contribution
  const handleApprove = async (publishDirectly: boolean) => {
    if (hasBlockingErrors) {
      setError('No se puede aprobar el aporte porque existen errores bloqueantes de validación.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // If there are unsaved local changes, persist them first
      if (isDirty) {
        await adminApi(`/admin/submissions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: draftPayload,
            message: draftMessage,
            reviewNotes: reviewNotes,
          }),
        });
      }

      await adminApi(`/admin/submissions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewNotes: reviewNotes || undefined,
          publishDirectly,
        }),
      });

      setSuccessMsg(
        publishDirectly
          ? 'Aporte aprobado y publicado exitosamente en la base de datos.'
          : 'Aporte aprobado como borrador (DRAFT) para revisión técnica.'
      );
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al aprobar el aporte.');
    } finally {
      setProcessing(false);
    }
  };

  // Reject contribution
  const handleRejectConfirm = async (reasonNotes: string) => {
    setProcessing(true);
    setError(null);
    try {
      await adminApi(`/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewNotes: reasonNotes,
        }),
      });
      setSuccessMsg('Aporte rechazado correctamente.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al rechazar el aporte.';
      setError(msg);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" aria-busy="true">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/admin/aportes" className="text-sm font-semibold text-brand-700 hover:underline">
          &larr; Volver a la bandeja
        </Link>
        <Alert tone="error" title="Error al cargar el aporte">
          {error}
        </Alert>
      </div>
    );
  }

  if (!submission) return null;

  const isPending = submission.status === 'PENDING';
  const typeLabel = TYPE_TRANSLATIONS[submission.type] || submission.type;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Moderation Header */}
      <ModerationHeader
        trackingCode={submission.trackingCode}
        status={submission.status}
        type={submission.type}
        typeLabel={typeLabel}
        createdAt={submission.createdAt}
        isDirty={isDirty}
        saveStatus={saveStatus}
        onSave={handleSaveDraft}
        savingData={saveStatus === 'saving'}
      />

      {/* Global Alerts */}
      {successMsg && (
        <Alert tone="success" title="Operación completada">
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert tone="error" title="Atención requerida">
          {error}
        </Alert>
      )}

      {/* Pre-approval Validation Summary */}
      {isPending && (
        <ValidationPanel
          issues={validationIssues}
          onFocusField={handleFocusField}
        />
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Column: Data Review, Comparison, and Payload Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinic Comparison (if modifying existing clinic) */}
          <ComparisonView
            clinic={submission.clinic}
            proposedPayload={draftPayload}
            submissionType={submission.type}
          />

          {/* Interactive Payload Editor */}
          <PayloadFormEditor
            payload={draftPayload}
            originalPayload={serverPayload}
            isPending={isPending}
            onChange={setDraftPayload}
            focusedFieldName={focusedField}
          />

          {/* Submitter Message / Notes */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                Mensaje o Justificación del Aporte
              </h2>
              {isPending && (
                <span className="text-[11px] text-brand-700 font-semibold">Editable</span>
              )}
            </div>

            {isPending ? (
              <textarea
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                rows={3}
                placeholder="Comentarios adicionales provistos por el ciudadano..."
                className="w-full text-xs rounded-md border border-border bg-surface p-3 text-ink placeholder:text-ink-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
              />
            ) : (
              <div className="p-3 bg-surface-alt border border-border-subtle rounded-lg text-xs text-ink-soft whitespace-pre-wrap">
                {submission.message || 'Sin mensaje adicional adjunto.'}
              </div>
            )}

            {submission.evidenceUrl && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-ink-mute uppercase block mb-1">
                  Enlace de Evidencia / Respaldo
                </span>
                <a
                  href={submission.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline break-all"
                >
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                  <span>{submission.evidenceUrl}</span>
                </a>
              </div>
            )}
          </div>

          {/* Audit Timeline if already resolved */}
          {!isPending && (
            <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card space-y-3">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border-subtle pb-2">
                Trazabilidad de Resolución
              </h2>
              <div className="text-xs space-y-2 text-ink-soft">
                <p>
                  <strong className="text-ink">Moderador:</strong>{' '}
                  {submission.reviewer?.email || 'Administrador VetBiobío'}
                </p>
                <p>
                  <strong className="text-ink">Fecha de resolución:</strong>{' '}
                  {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString('es-CL') : 'N/A'}
                </p>
                {submission.appliedEntityType && (
                  <p>
                    <strong className="text-ink">Entidad afectada:</strong>{' '}
                    <span className="font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border-subtle">
                      {submission.appliedEntityType} #{submission.appliedEntityId}
                    </span>
                  </p>
                )}
                {submission.reviewNotes && (
                  <div className="pt-1">
                    <strong className="text-ink block mb-1">Notas de resolución:</strong>
                    <div className="p-3 bg-surface-alt rounded-md border border-border-subtle text-ink">
                      {submission.reviewNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Submitter Details and Actions */}
        <div className="space-y-6">
          {/* Submitter Details Card */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card space-y-3">
            <h2 className="text-base font-bold text-ink border-b border-border-subtle pb-2 flex items-center justify-between">
              <span>Datos del Remitente</span>
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            </h2>
            <div className="text-xs space-y-2.5">
              <div>
                <span className="font-semibold text-ink-mute uppercase text-[10px] block">Nombre</span>
                <span className="font-medium text-ink text-sm">
                  {submission.submitterName || 'Anónimo'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-ink-mute uppercase text-[10px] block">Correo Electrónico</span>
                <span className="font-medium text-ink text-sm">
                  {submission.submitterEmail || 'No informado'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-ink-mute uppercase text-[10px] block">Consentimiento (Ley 19.628)</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold mt-1 ${
                    submission.consentAt
                      ? 'bg-status-verified-bg text-status-verified-text border border-status-verified-border'
                      : 'bg-surface-alt text-ink-mute border border-border-subtle'
                  }`}
                >
                  {submission.consentAt ? 'Consentimiento otorgado' : 'Sin datos de contacto'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <ModerationActions
            status={submission.status}
            submissionType={submission.type}
            reviewNotes={reviewNotes}
            onNotesChange={setReviewNotes}
            onApprove={handleApprove}
            onOpenRejectModal={() => setIsRejectModalOpen(true)}
            processing={processing}
            hasBlockingErrors={hasBlockingErrors}
            isDirty={isDirty}
          />

          {/* Quick Discard local changes */}
          {isPending && isDirty && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="text-xs font-semibold text-ink-mute hover:text-ink underline transition py-1"
              >
                Descartar cambios locales no guardados
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      <ConfirmRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        trackingCode={submission.trackingCode}
        initialNotes={reviewNotes}
      />
    </div>
  );
}
