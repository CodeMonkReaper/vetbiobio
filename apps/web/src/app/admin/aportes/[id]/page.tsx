'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin';

interface SubmissionDetail {
  id: string;
  trackingCode: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  message: string | null;
  evidenceUrl: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  consentAt: string | null;
  payload: Record<string, any>;
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

export default function AdminAporteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await adminApi(`/admin/submissions/${id}`);
      setSubmission(data);
      if (data.reviewNotes) {
        setNotes(data.reviewNotes);
      }
    } catch (err) {
      if ((err as Error).message === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleApprove(publishDirectly: boolean) {
    if (!confirm(publishDirectly ? '¿Aprobar y publicar directamente?' : '¿Aprobar como borrador?')) return;
    setProcessing(true);
    setError(null);
    try {
      await adminApi(`/admin/submissions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewNotes: notes,
          publishDirectly,
        }),
      });
      setSuccessMsg('Aporte aprobado y aplicado exitosamente.');
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!confirm('¿Rechazar este aporte?')) return;
    setProcessing(true);
    setError(null);
    try {
      await adminApi(`/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewNotes: notes,
        }),
      });
      setSuccessMsg('Aporte rechazado.');
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/admin/aportes" className="text-sm font-semibold text-emerald-600 hover:underline">
          &larr; Volver a la bandeja
        </Link>
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          {error ?? 'Aporte no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/admin/aportes"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
        >
          &larr; Volver a la bandeja de aportes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Aporte #{submission.trackingCode}</h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  submission.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : submission.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {submission.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Recibido el{' '}
              {new Date(submission.createdAt).toLocaleString('es-CL', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
          ✅ {successMsg}
        </div>
      )}

      {/* Main Grid: Data on left, Actions on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Details Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Información del Aporte
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">Tipo</span>
                <span className="font-semibold text-slate-800">{submission.type}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">Clínica Asociada</span>
                {submission.clinic ? (
                  <span className="font-medium text-emerald-700">{submission.clinic.name}</span>
                ) : (
                  <span className="text-slate-400 italic">No especificada / Nueva</span>
                )}
              </div>
            </div>

            {submission.message && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                  Mensaje del Colaborador
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                  {submission.message}
                </div>
              </div>
            )}

            {submission.evidenceUrl && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                  Enlace de Evidencia
                </span>
                <a
                  href={submission.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline break-all"
                >
                  🔗 {submission.evidenceUrl} &rarr;
                </a>
              </div>
            )}
          </div>

          {/* Structured Payload Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Datos Proporcionados (Payload JSON)
            </h2>
            <p className="text-xs text-slate-500">
              Estos campos se aplican automáticamente a la base de datos al aprobar el aporte.
            </p>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-96">
              {JSON.stringify(submission.payload, null, 2)}
            </pre>
          </div>

          {/* Review History Card if processed */}
          {submission.status !== 'PENDING' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Registro de Moderación
              </h2>
              <div className="text-xs space-y-2 text-slate-600">
                <p>
                  <span className="font-semibold">Revisado por:</span>{' '}
                  {submission.reviewer?.email ?? 'Administrador'}
                </p>
                <p>
                  <span className="font-semibold">Fecha de revisión:</span>{' '}
                  {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString('es-CL') : 'N/A'}
                </p>
                {submission.appliedEntityType && (
                  <p>
                    <span className="font-semibold">Entidad creada/actualizada:</span>{' '}
                    <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                      {submission.appliedEntityType} #{submission.appliedEntityId}
                    </span>
                  </p>
                )}
                {submission.reviewNotes && (
                  <div>
                    <span className="font-semibold block mb-1">Notas de resolución:</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800">
                      {submission.reviewNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Panel on Right */}
        <div className="space-y-6">
          {/* Submitter Info Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Datos del Remitente
            </h2>
            <div className="text-xs space-y-2 text-slate-600">
              <div>
                <span className="font-semibold text-slate-400 uppercase block">Nombre</span>
                <span className="font-medium text-slate-800 text-sm">
                  {submission.submitterName || 'No indicado'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 uppercase block">Correo Electrónico</span>
                <span className="font-medium text-slate-800 text-sm">
                  {submission.submitterEmail || 'No indicado'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 uppercase block">Consentimiento (Ley 19.628)</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                  submission.consentAt ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {submission.consentAt ? 'Consentimiento otorgado' : 'Sin datos de contacto'}
                </span>
              </div>
            </div>
          </div>

          {/* Moderation Actions Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Acción de Moderación
            </h2>

            <div>
              <label htmlFor="notes" className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                Notas del Administrador (Auditoría)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submission.status !== 'PENDING' || processing}
                placeholder="Escribe comentarios sobre la verificación o decisión..."
                rows={3}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
            </div>

            {submission.status === 'PENDING' ? (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleApprove(true)}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>✅</span> Aprobar y Publicar
                </button>

                {submission.type === 'NEW_CLINIC' && (
                  <button
                    onClick={() => handleApprove(false)}
                    disabled={processing}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    Aprobar como Borrador (DRAFT)
                  </button>
                )}

                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-4 rounded-lg text-xs border border-rose-200 transition disabled:opacity-50"
                >
                  ❌ Rechazar Aporte
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 text-slate-500 text-xs rounded-lg text-center font-medium">
                Este aporte ya fue resuelto ({submission.status}).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
