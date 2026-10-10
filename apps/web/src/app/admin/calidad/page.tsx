'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/admin';
import { Alert } from '@/components/ui/display';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  TargetIcon,
  ZapIcon,
  CheckIcon,
  XMarkIcon,
} from '@/components/admin/icons/AdminIcons';

interface OverviewData {
  totalClinics: number;
  averageScore: number;
  healthyClinicsPercent: number;
  totalOpenIssues: number;
  issuesBySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  issuesByRule: Array<{ ruleCode: string; count: number }>;
  tiers: {
    ALTA: number;
    MEDIA: number;
    BAJA: number;
    CRITICA: number;
  };
  lastRun: {
    id: string;
    triggerType: string;
    startedAt: string;
    finishedAt: string | null;
    evaluatedClinics: number;
    openIssuesCount: number;
    resolvedIssuesCount: number;
    executionTimeMs: number;
  } | null;
  disclaimer: string;
}

interface Issue {
  id: string;
  clinicId: string;
  runId: string | null;
  ruleCode: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  causeDescription: string;
  recommendedAction: string;
  metadata: Record<string, unknown>;
  fingerprint: string;
  firstDetectedAt: string | null;
  lastEvaluatedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  resolutionReason: string | null;
  clinic: {
    id: string;
    name: string;
    slug: string;
    communeName?: string | null;
    communeSlug?: string | null;
  };
}

interface RunItem {
  id: string;
  triggerType: string;
  triggeredBy: string | null;
  evaluatedClinics: number;
  openIssuesCount: number;
  resolvedIssuesCount: number;
  executionTimeMs: number;
  startedAt: string;
  finishedAt: string | null;
}

function getSeverityTone(severity: Issue['severity']): BadgeTone {
  switch (severity) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'info';
    case 'LOW':
    default:
      return 'neutral';
  }
}

function getIssueStatusTone(status: Issue['status']): BadgeTone {
  switch (status) {
    case 'OPEN':
      return 'error';
    case 'RESOLVED':
      return 'success';
    case 'DISMISSED':
    default:
      return 'neutral';
  }
}

function getIssueStatusLabel(status: Issue['status']): string {
  switch (status) {
    case 'OPEN':
      return 'Abierta';
    case 'RESOLVED':
      return 'Resuelta';
    case 'DISMISSED':
      return 'Descartada';
    default:
      return status;
  }
}

export default function CalidadPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'RESOLVED' | 'DISMISSED' | ''>('OPEN');
  const [severityFilter, setSeverityFilter] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | ''>('');
  const [ruleFilter, setRuleFilter] = useState<string>('');

  // Modal de resolución
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolveAction, setResolveAction] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ovData, runsData] = await Promise.all([
        adminApi('/admin/data-quality/overview'),
        adminApi('/admin/data-quality/runs?limit=5'),
      ]);

      setOverview(ovData as OverviewData);
      setRuns((runsData.data as RunItem[]) || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando datos del motor de calidad');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadIssues = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (severityFilter) params.set('severity', severityFilter);
      if (ruleFilter) params.set('ruleCode', ruleFilter);
      params.set('limit', '50');

      const issuesData = await adminApi(`/admin/data-quality/issues?${params.toString()}`);
      setIssues((issuesData.data as Issue[]) || []);
    } catch (err: unknown) {
      console.error('Error cargando incidencias:', err);
    }
  }, [statusFilter, severityFilter, ruleFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  const handleRunAudit = async () => {
    try {
      setRunningAudit(true);
      setError(null);
      setSuccessMsg(null);

      const res = await adminApi('/admin/data-quality/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      setSuccessMsg(
        `Auditoría completada exitosamente: ${res.evaluatedClinics} clínicas evaluadas en ${res.durationMs}ms. Se detectaron ${res.openIssues} incidencias activas.`,
      );

      await Promise.all([loadData(), loadIssues()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar auditoría manual');
    } finally {
      setRunningAudit(false);
    }
  };

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (resolutionNotes.trim().length < 5) {
      setError('Debes ingresar al menos 5 caracteres en las notas de resolución.');
      return;
    }

    try {
      setSubmittingResolution(true);
      setError(null);

      await adminApi(`/admin/data-quality/issues/${selectedIssue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolveAction,
          resolutionNotes: resolutionNotes.trim(),
        }),
      });

      setSuccessMsg(
        `Incidencia #${selectedIssue.id} marcada como ${resolveAction === 'RESOLVED' ? 'Resuelta' : 'Descartada'} con éxito.`,
      );

      setSelectedIssue(null);
      setResolutionNotes('');
      await Promise.all([loadData(), loadIssues()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado de la incidencia');
    } finally {
      setSubmittingResolution(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TargetIcon className="w-6 h-6 text-teal-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Motor de Calidad de Datos
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Auditoría continua, detección declarativa de anomalías e índice explicable de confiabilidad.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleRunAudit()}
            disabled={runningAudit}
            className="inline-flex items-center gap-2 font-medium"
          >
            {runningAudit ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Evaluando Clínicas...</span>
              </>
            ) : (
              <>
                <ZapIcon className="w-4 h-4 text-white" />
                <span>Ejecutar Auditoría Ahora</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert tone="error" title="Atención" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert tone="success" title="Operación Exitosa" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Salud Regional
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {overview.healthyClinicsPercent}%
              </span>
              <span className="text-xs text-emerald-700 font-semibold">Tier Alta (&ge;80)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {overview.tiers.ALTA} de {overview.totalClinics} clínicas con datos de alta confiabilidad
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Puntaje Promedio
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {overview.averageScore}
              </span>
              <span className="text-xs text-slate-400">/ 100 pts</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Completitud (30) + Verificación (40) + Frescura (30)
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Incidencias Abiertas
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-700">
                {overview.totalOpenIssues}
              </span>
              <span className="text-xs font-medium text-slate-500">activas</span>
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-rose-700 font-semibold">{overview.issuesBySeverity.CRITICAL} Críticas</span>
              <span className="text-slate-300">·</span>
              <span className="text-amber-700 font-semibold">{overview.issuesBySeverity.HIGH} Altas</span>
              <span className="text-slate-300">·</span>
              <span className="text-sky-700 font-semibold">{overview.issuesBySeverity.MEDIUM} Medias</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Última Auditoría
            </div>
            <div className="text-lg font-bold text-slate-900">
              {overview.lastRun ? (
                <>
                  {new Date(overview.lastRun.startedAt).toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({new Date(overview.lastRun.startedAt).toLocaleDateString('es-CL')})
                  </span>
                </>
              ) : (
                'Sin registros'
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {overview.lastRun ? (
                <>
                  Modo: {overview.lastRun.triggerType === 'MANUAL' ? 'Manual' : 'Cron 03:00 AM'} ·{' '}
                  {overview.lastRun.executionTimeMs}ms
                </>
              ) : (
                'Presiona "Ejecutar Auditoría Ahora"'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Bandeja de Incidencias */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bandeja de Incidencias Idempotentes</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Infracciones detectadas por el catálogo de 7 reglas. Se auto-resuelven al corregir los datos en origen.
              </p>
            </div>

            {/* Controles de Filtro */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                aria-label="Filtrar por estado de incidencia"
                onChange={(e) => setStatusFilter(e.target.value as 'OPEN' | 'RESOLVED' | 'DISMISSED' | '')}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="OPEN">Estado: Abiertas</option>
                <option value="RESOLVED">Estado: Resueltas</option>
                <option value="DISMISSED">Estado: Descartadas</option>
                <option value="">Estado: Todas</option>
              </select>

              <select
                value={severityFilter}
                aria-label="Filtrar por severidad de incidencia"
                onChange={(e) => setSeverityFilter(e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | '')}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Severidad: Todas</option>
                <option value="CRITICAL">Crítica (-25)</option>
                <option value="HIGH">Alta (-10)</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>

              <select
                value={ruleFilter}
                aria-label="Filtrar por regla de calidad"
                onChange={(e) => setRuleFilter(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Regla: Todas</option>
                <option value="RULE_INVALID_PHONE">RULE_INVALID_PHONE</option>
                <option value="RULE_SUSPICIOUS_GEO">RULE_SUSPICIOUS_GEO</option>
                <option value="RULE_SCHEDULE_CONFLICT">RULE_SCHEDULE_CONFLICT</option>
                <option value="RULE_EXPIRED_PRICES">RULE_EXPIRED_PRICES</option>
                <option value="RULE_OUTDATED_VERIFICATION">RULE_OUTDATED_VERIFICATION</option>
                <option value="RULE_DUPLICATE_PHONE">RULE_DUPLICATE_PHONE</option>
                <option value="RULE_INCOMPLETE_FIELDS">RULE_INCOMPLETE_FIELDS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla Accesible */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600" aria-label="Bandeja de Incidencias de Calidad de Datos">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Severidad</th>
                <th scope="col" className="px-6 py-3">Clínica / Comuna</th>
                <th scope="col" className="px-6 py-3">Regla & Causa</th>
                <th scope="col" className="px-6 py-3">Acción Recomendada</th>
                <th scope="col" className="px-6 py-3">Estado</th>
                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {loading ? 'Cargando incidencias...' : 'No hay incidencias que coincidan con los filtros seleccionados.'}
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={getSeverityTone(issue.severity)} size="sm">
                        {issue.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {issue.clinic.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {issue.clinic.communeName || 'Región del Biobío'}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        {issue.ruleCode}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {issue.causeDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                      {issue.recommendedAction}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={getIssueStatusTone(issue.status)} size="sm">
                        {getIssueStatusLabel(issue.status)}
                      </Badge>
                      {issue.resolutionReason && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {issue.resolutionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {issue.status === 'OPEN' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setResolveAction('RESOLVED');
                            setResolutionNotes('');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition min-h-[36px]"
                        >
                          Resolver
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setResolveAction(issue.status === 'RESOLVED' ? 'DISMISSED' : 'RESOLVED');
                            setResolutionNotes(issue.resolutionNotes || '');
                          }}
                          className="text-slate-600 hover:text-slate-900 text-xs font-medium underline min-h-[36px] px-2 py-1"
                        >
                          Ver Detalle
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Corridas */}
      {runs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Historial de Ejecuciones de Auditoría
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600" aria-label="Historial de ejecuciones de auditoría">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-2">ID</th>
                  <th scope="col" className="px-4 py-2">Disparador</th>
                  <th scope="col" className="px-4 py-2">Fecha y Hora</th>
                  <th scope="col" className="px-4 py-2">Clínicas</th>
                  <th scope="col" className="px-4 py-2">Incidencias Abiertas</th>
                  <th scope="col" className="px-4 py-2">Auto-Resueltas</th>
                  <th scope="col" className="px-4 py-2">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-mono font-bold text-slate-800">#{r.id}</td>
                    <td className="px-4 py-2">
                      <span className="font-semibold text-slate-700">
                        {r.triggerType === 'MANUAL' ? 'Manual (Admin)' : 'Cron Diario (03:00 AM)'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(r.startedAt).toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-800">{r.evaluatedClinics}</td>
                    <td className="px-4 py-2 font-semibold text-rose-700">{r.openIssuesCount}</td>
                    <td className="px-4 py-2 font-semibold text-emerald-700">{r.resolvedIssuesCount}</td>
                    <td className="px-4 py-2 font-mono text-slate-500">{r.executionTimeMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer Legal Visible Obligatorio */}
      <div className="bg-slate-100 border border-slate-200 text-slate-700 p-5 rounded-2xl text-xs leading-relaxed">
        <span className="font-bold text-slate-900">Aviso Legal de Conformidad: </span>
        {overview?.disclaimer ||
          'El Puntaje de Confiabilidad de VetBiobío refleja exclusivamente la frescura, integridad y corroboración documental de los datos de contacto y horarios publicados en la plataforma. No constituye una certificación sanitaria ni avala la calidad médica de los servicios veterinarios.'}
      </div>

      {/* Modal Accesible de Resolución / Detalle */}
      {selectedIssue && (
        <Modal
          isOpen={Boolean(selectedIssue)}
          onClose={() => setSelectedIssue(null)}
          title={`Incidencia #${selectedIssue.id} — ${selectedIssue.clinic.name}`}
          description={`Severidad: ${selectedIssue.severity} · Regla: ${selectedIssue.ruleCode}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={getSeverityTone(selectedIssue.severity)} size="sm">
                Severidad {selectedIssue.severity}
              </Badge>
              <Badge tone={getIssueStatusTone(selectedIssue.status)} size="sm">
                {getIssueStatusLabel(selectedIssue.status)}
              </Badge>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-600">Regla violada: </span>
                <span className="font-mono text-slate-900">{selectedIssue.ruleCode}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Causa detectada: </span>
                <span className="text-slate-800">{selectedIssue.causeDescription}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Acción sugerida: </span>
                <span className="text-slate-800">{selectedIssue.recommendedAction}</span>
              </div>
              {selectedIssue.metadata && Object.keys(selectedIssue.metadata).length > 0 && (
                <div>
                  <span className="font-bold text-slate-600">Metadatos técnicos: </span>
                  <pre className="mt-1 p-2 bg-white rounded border border-slate-200 overflow-x-auto text-[11px] font-mono text-slate-800">
                    {JSON.stringify(selectedIssue.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {selectedIssue.status === 'OPEN' ? (
              <form onSubmit={(e) => void handleResolveIssue(e)} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Acción de Moderación
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setResolveAction('RESOLVED')}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition inline-flex items-center justify-center gap-1.5 ${
                        resolveAction === 'RESOLVED'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Marcar como Resuelta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolveAction('DISMISSED')}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition inline-flex items-center justify-center gap-1.5 ${
                        resolveAction === 'DISMISSED'
                          ? 'bg-slate-100 border-slate-500 text-slate-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                      <span>Descartar (Excepción)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes-textarea" className="block text-xs font-semibold text-slate-700 mb-1">
                    Notas de Moderación (Obligatorio, mín. 5 caracteres)
                  </label>
                  <textarea
                    id="notes-textarea"
                    required
                    minLength={5}
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Ej. Datos contrastados telefónicamente con el director técnico..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submittingResolution}
                  >
                    {submittingResolution ? 'Guardando...' : 'Confirmar Resolución'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Razón de resolución: </span>
                  <span className="text-slate-800">{selectedIssue.resolutionReason}</span>
                </div>
                {selectedIssue.resolutionNotes && (
                  <div>
                    <span className="font-semibold text-slate-500">Notas: </span>
                    <span className="text-slate-800">{selectedIssue.resolutionNotes}</span>
                  </div>
                )}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
