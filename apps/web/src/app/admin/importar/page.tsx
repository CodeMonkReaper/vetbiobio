'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi } from '@/lib/admin';
import { Alert } from '@/components/ui/display';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BoxIcon,
  FileTextIcon,
  UploadIcon,
  RefreshIcon,
  CheckIcon,
} from '@/components/admin/icons/AdminIcons';

interface ImportBatch {
  id: string;
  filename: string;
  uploadedBy: string | null;
  status:
    | 'PENDING_ANALYSIS'
    | 'ANALYZING'
    | 'ANALYZED'
    | 'APPLYING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  appliedRows: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface ImportBatchRow {
  id: string;
  batchId: string;
  rowNumber: number;
  rawData: Record<string, unknown>;
  parsedData: Record<string, unknown> | null;
  status:
    | 'PENDING'
    | 'VALID'
    | 'POSSIBLE_DUPLICATE'
    | 'INVALID'
    | 'APPLIED'
    | 'REJECTED'
    | 'ERROR';
  actionType: 'INSERT' | 'UPDATE' | 'SKIP';
  matchedClinicId: string | null;
  matchedClinic: { id: string; name: string; slug: string } | null;
  matchReason: string | null;
  matchScore: number | null;
  differences: Record<string, { current: unknown; proposed: unknown }>;
  errorMessage: string | null;
  createdAt: string;
}

const SAMPLE_CSV = `nombre,direccion,comuna,telefono,email,web,latitud,longitud
Clínica Veterinaria Los Ángeles Centro,Colón 340,Los Ángeles,+56912345678,contacto@losangelesvet.cl,https://losangelesvet.cl,-37.4697,-72.3537
Veterinaria Chiguayante Sur,Manuel Rodríguez 890,Chiguayante,+56987654321,info@vetchiguayante.cl,https://vetchiguayante.cl,-36.9180,-73.0230
Clínica San Pedro de la Paz,Pedro Aguirre Cerda 1050,San Pedro de la Paz,+56412233445,admin@sanpedrovet.cl,https://sanpedrovet.cl,-36.8420,-73.1050
Veterinaria Fuera de Región,Alameda 100,Santiago,+56911223344,stgo@vet.cl,,-33.4489,-70.6693`;

function getBatchStatusTone(status: ImportBatch['status']): BadgeTone {
  switch (status) {
    case 'ANALYZED':
      return 'info';
    case 'ANALYZING':
    case 'APPLYING':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'CANCELLED':
    case 'PENDING_ANALYSIS':
    default:
      return 'neutral';
  }
}

function getBatchStatusLabel(status: ImportBatch['status']): string {
  switch (status) {
    case 'ANALYZED':
      return 'Analizado (Dry-Run)';
    case 'ANALYZING':
      return 'Analizando...';
    case 'APPLYING':
      return 'Aplicando a BD...';
    case 'COMPLETED':
      return 'Aplicado';
    case 'FAILED':
      return 'Fallido';
    case 'CANCELLED':
      return 'Cancelado';
    case 'PENDING_ANALYSIS':
      return 'Pendiente';
    default:
      return status;
  }
}

function getRowStatusTone(status: ImportBatchRow['status']): BadgeTone {
  switch (status) {
    case 'VALID':
      return 'success';
    case 'POSSIBLE_DUPLICATE':
      return 'warning';
    case 'INVALID':
    case 'ERROR':
    case 'REJECTED':
      return 'error';
    case 'APPLIED':
      return 'brand';
    case 'PENDING':
    default:
      return 'neutral';
  }
}

function getRowStatusLabel(status: ImportBatchRow['status']): string {
  switch (status) {
    case 'VALID':
      return 'Válida (Nueva)';
    case 'POSSIBLE_DUPLICATE':
      return 'Posible Duplicado';
    case 'INVALID':
      return 'Inválida';
    case 'ERROR':
      return 'Error de Esquema';
    case 'APPLIED':
      return 'Aplicada';
    case 'REJECTED':
      return 'Rechazada';
    case 'PENDING':
      return 'Pendiente';
    default:
      return status;
  }
}

export default function ImportarPage() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [rows, setRows] = useState<ImportBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros de filas
  const [rowStatusFilter, setRowStatusFilter] = useState<string>('');

  // Entrada de archivo o texto
  const [csvContent, setCsvContent] = useState('');
  const [filename, setFilename] = useState('clinicas_biobio.csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi('/admin/import/batches?limit=10');
      const list = (res.data as ImportBatch[]) || [];
      setBatches(list);
      if (list.length > 0 && !selectedBatch) {
        setSelectedBatch(list[0] ?? null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando lotes de importación');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch]);

  const loadRows = useCallback(async (batchId: string) => {
    try {
      setLoadingRows(true);
      const params = new URLSearchParams();
      if (rowStatusFilter) params.set('status', rowStatusFilter);
      params.set('limit', '50');

      const res = await adminApi(`/admin/import/batches/${batchId}/rows?${params.toString()}`);
      setRows((res.data as ImportBatchRow[]) || []);
    } catch (err: unknown) {
      console.error('Error cargando filas:', err);
    } finally {
      setLoadingRows(false);
    }
  }, [rowStatusFilter]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (selectedBatch) {
      void loadRows(selectedBatch.id);
    }
  }, [selectedBatch, loadRows]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      setError('Debes ingresar o cargar contenido CSV o JSON.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await adminApi('/admin/import/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: csvContent,
        }),
      });

      setSuccessMsg(
        `Lote #${res.batchId} recibido exitosamente con ${res.totalRows} filas. El worker asíncrono está analizando duplicados con PostGIS y trigramas en segundo plano.`,
      );

      setCsvContent('');
      await loadBatches();

      setTimeout(() => {
        void loadBatches();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir lote de importación');
    } finally {
      setUploading(false);
    }
  };

  const handleRowActionChange = async (
    rowId: string,
    actionType: 'INSERT' | 'UPDATE' | 'SKIP',
  ) => {
    if (!selectedBatch) return;
    try {
      await adminApi(`/admin/import/batches/${selectedBatch.id}/rows/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType }),
      });

      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, actionType } : r)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error modificando acción de la fila');
    }
  };

  const handleApplyBatch = async () => {
    if (!selectedBatch) return;
    if (
      !confirm(
        `¿Confirmas la aplicación del lote #${selectedBatch.id} a producción? Se ejecutarán transacciones atómicas y se registrará trazabilidad en auditoría.`,
      )
    ) {
      return;
    }

    try {
      setApplying(true);
      setError(null);
      setSuccessMsg(null);

      const res = await adminApi(`/admin/import/batches/${selectedBatch.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      setSuccessMsg(
        `Lote #${res.batchId} aplicado exitosamente a producción: ${res.appliedRows} filas creadas/actualizadas. Se ha disparado la reevaluación del Motor de Calidad de Datos.`,
      );

      await loadBatches();
      await loadRows(selectedBatch.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al aplicar lote a producción');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelBatch = async () => {
    if (!selectedBatch) return;
    if (!confirm(`¿Estás seguro de descartar y cancelar el lote #${selectedBatch.id}?`)) {
      return;
    }

    try {
      await adminApi(`/admin/import/batches/${selectedBatch.id}/cancel`, {
        method: 'POST',
      });
      setSuccessMsg(`Lote #${selectedBatch.id} cancelado.`);
      await loadBatches();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cancelando lote');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header institucional */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BoxIcon className="w-6 h-6 text-teal-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ingesta Masiva y Staging (Dry-Run)
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Carga de datos desacoplada, deduplicación multicriterio (PostGIS + trigramas + E.164) y worker transaccional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setCsvContent(SAMPLE_CSV);
              setFilename('piloto_biobio_muestra.csv');
            }}
            className="text-xs inline-flex items-center gap-1.5"
          >
            <FileTextIcon className="w-4 h-4 text-slate-600" />
            <span>Cargar CSV de Muestra</span>
          </Button>
        </div>
      </div>

      {/* Notificaciones */}
      {error && (
        <Alert tone="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert tone="success" title="Operación Exitosa" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Formulario de Carga */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UploadIcon className="w-4 h-4 text-teal-600" />
          <span>Subir Nuevo Lote para Análisis</span>
        </h2>

        <form onSubmit={(e) => void handleSubmitBatch(e)} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.json"
                onChange={handleFileUpload}
                aria-label="Seleccionar archivo CSV o JSON para importación"
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                disabled={uploading || !csvContent.trim()}
                className="w-full sm:w-auto text-xs font-bold inline-flex items-center gap-1.5"
              >
                <UploadIcon className="w-4 h-4 text-white" />
                <span>{uploading ? 'Analizando en Staging...' : 'Subir y Analizar (Dry-Run)'}</span>
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="csv-textarea" className="block text-xs font-semibold text-slate-600 mb-1">
              Contenido CSV o JSON (puedes pegar directamente):
            </label>
            <textarea
              id="csv-textarea"
              rows={4}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="nombre,direccion,comuna,telefono,email,latitud,longitud..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-900"
            />
          </div>
        </form>
      </div>

      {/* Historial de Lotes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Lotes de Importación</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecciona un lote para inspeccionar el visor Dry-Run y previsualizar cambios
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBatches()}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition"
            aria-label="Actualizar lista de lotes"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600" aria-label="Historial de lotes de importación">
            <thead className="bg-slate-50 uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Lote ID</th>
                <th scope="col" className="px-6 py-3">Archivo</th>
                <th scope="col" className="px-6 py-3">Estado</th>
                <th scope="col" className="px-6 py-3">Total Filas</th>
                <th scope="col" className="px-6 py-3">Válidas</th>
                <th scope="col" className="px-6 py-3">Duplicados</th>
                <th scope="col" className="px-6 py-3">Errores</th>
                <th scope="col" className="px-6 py-3">Aplicadas</th>
                <th scope="col" className="px-6 py-3">Fecha</th>
                <th scope="col" className="px-6 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-slate-400">
                    {loading ? 'Cargando lotes...' : 'No hay lotes de importación registrados.'}
                  </td>
                </tr>
              ) : (
                batches.map((b) => {
                  const isSelected = selectedBatch?.id === b.id;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBatch(b)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-emerald-50/70 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-3 font-mono font-bold text-slate-800">#{b.id}</td>
                      <td className="px-6 py-3 text-slate-900 font-medium">{b.filename}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <Badge tone={getBatchStatusTone(b.status)} size="sm">
                          {getBatchStatusLabel(b.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{b.totalRows}</td>
                      <td className="px-6 py-3 text-emerald-700 font-semibold">{b.validRows}</td>
                      <td className="px-6 py-3 text-amber-700 font-semibold">{b.duplicateRows}</td>
                      <td className="px-6 py-3 text-rose-700 font-semibold">{b.errorRows}</td>
                      <td className="px-6 py-3 text-sky-700 font-semibold">{b.appliedRows}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString('es-CL', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span
                          className={`text-xs ${
                            isSelected ? 'text-emerald-700 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? '● Seleccionado' : 'Ver detalle'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visor Dry-Run de Filas */}
      {selectedBatch && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
                  LOTE #{selectedBatch.id}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Previsualización Dry-Run: {selectedBatch.filename}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Compara las filas antes de escribir en producción. Revisa el análisis de duplicados y diferencias.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {selectedBatch.status === 'ANALYZED' && (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => void handleApplyBatch()}
                    disabled={applying}
                    className="text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <CheckIcon className="w-4 h-4 text-white" />
                    <span>{applying ? 'Aplicando transacciones...' : 'Aplicar a Producción'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCancelBatch()}
                    className="text-xs text-slate-600 hover:text-rose-600 border-slate-300 hover:border-rose-300"
                  >
                    Cancelar Lote
                  </Button>
                </>
              )}

              {selectedBatch.status === 'COMPLETED' && (
                <Badge tone="success" size="md">
                  ✓ Lote Aplicado en Producción
                </Badge>
              )}
            </div>
          </div>

          {/* Filtros de Filas */}
          <div className="px-6 flex items-center gap-2">
            <label htmlFor="row-filter" className="text-xs font-semibold text-slate-600">
              Filtrar por estado:
            </label>
            <select
              id="row-filter"
              value={rowStatusFilter}
              onChange={(e) => setRowStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">Todos ({selectedBatch.totalRows})</option>
              <option value="VALID">Válidas / Nuevas ({selectedBatch.validRows})</option>
              <option value="POSSIBLE_DUPLICATE">Posibles Duplicados ({selectedBatch.duplicateRows})</option>
              <option value="INVALID">Inválidas ({selectedBatch.errorRows})</option>
              <option value="APPLIED">Aplicadas ({selectedBatch.appliedRows})</option>
            </select>
          </div>

          {/* Tabla de Filas */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600" aria-label="Filas del lote de importación">
              <thead className="bg-slate-50 uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">#</th>
                  <th scope="col" className="px-6 py-3">Clínica Propuesta</th>
                  <th scope="col" className="px-6 py-3">Contacto / Comuna</th>
                  <th scope="col" className="px-6 py-3">Estado Análisis</th>
                  <th scope="col" className="px-6 py-3">Coincidencia / Razón</th>
                  <th scope="col" className="px-6 py-3">Diferencias Detectadas</th>
                  <th scope="col" className="px-6 py-3">Acción Asignada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      {loadingRows ? 'Cargando filas analizadas...' : 'No hay filas en este estado.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const rawParsed = (row.parsedData || row.rawData || {}) as Record<string, unknown>;
                    const name = typeof rawParsed.name === 'string' ? rawParsed.name : '—';
                    const address = typeof rawParsed.address === 'string' ? rawParsed.address : '—';
                    const phone =
                      typeof rawParsed.phoneE164 === 'string'
                        ? rawParsed.phoneE164
                        : typeof rawParsed.phone === 'string'
                        ? rawParsed.phone
                        : '—';
                    const commune =
                      typeof rawParsed.communeCut === 'string'
                        ? rawParsed.communeCut
                        : typeof rawParsed.comuna === 'string'
                        ? rawParsed.comuna
                        : '—';

                    const diffKeys = Object.keys(row.differences || {});

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">
                          {row.rowNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">{name}</div>
                          <div className="text-[11px] text-slate-500">{address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800 font-medium">{phone}</div>
                          <div className="text-[11px] text-slate-400">CUT: {commune}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge tone={getRowStatusTone(row.status)} size="sm">
                            {getRowStatusLabel(row.status)}
                          </Badge>
                          {row.errorMessage && (
                            <div className="text-[10px] text-rose-600 mt-1 max-w-xs font-medium">
                              {row.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {row.matchedClinic ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge tone="warning" size="sm">
                                  Posible Duplicado
                                </Badge>
                                {row.matchScore !== null && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    Score: {row.matchScore}
                                  </span>
                                )}
                              </div>
                              <div className="font-semibold text-slate-800 text-xs">
                                {row.matchedClinic.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {row.matchReason || 'Criterio territorial'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Sin colisión</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          {diffKeys.length > 0 ? (
                            <div className="space-y-1.5">
                              {diffKeys.map((k) => (
                                <div
                                  key={k}
                                  className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200"
                                >
                                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-0.5">
                                    {k}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="line-through text-slate-400 text-xs">
                                      {String(row.differences[k]?.current ?? '—')}
                                    </span>
                                    <span className="text-slate-400">→</span>
                                    <span className="font-semibold text-emerald-800 text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      {String(row.differences[k]?.proposed ?? '—')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Sin diferencias</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {selectedBatch.status === 'ANALYZED' ? (
                            <select
                              value={row.actionType}
                              aria-label={`Acción para fila #${row.rowNumber}`}
                              onChange={(e) =>
                                void handleRowActionChange(
                                  row.id,
                                  e.target.value as 'INSERT' | 'UPDATE' | 'SKIP',
                                )
                              }
                              className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border ${
                                row.actionType === 'INSERT'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : row.actionType === 'UPDATE'
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <option value="INSERT">INSERT (Crear nueva)</option>
                              <option value="UPDATE">UPDATE (Actualizar)</option>
                              <option value="SKIP">SKIP (Omitir)</option>
                            </select>
                          ) : (
                            <Badge
                              tone={
                                row.actionType === 'INSERT'
                                  ? 'success'
                                  : row.actionType === 'UPDATE'
                                  ? 'info'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {row.actionType}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
