'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi } from '@/lib/admin';

interface ImportBatch {
  id: string;
  filename: string;
  uploadedBy: string | null;
  status: 'PENDING_ANALYSIS' | 'ANALYZING' | 'ANALYZED' | 'APPLYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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
  rawData: Record<string, any>;
  parsedData: Record<string, any> | null;
  status: 'PENDING' | 'VALID' | 'POSSIBLE_DUPLICATE' | 'INVALID' | 'APPLIED' | 'REJECTED' | 'ERROR';
  actionType: 'INSERT' | 'UPDATE' | 'SKIP';
  matchedClinicId: string | null;
  matchedClinic: { id: string; name: string; slug: string } | null;
  matchReason: string | null;
  matchScore: number | null;
  differences: Record<string, { current: any; proposed: any }>;
  errorMessage: string | null;
  createdAt: string;
}

const SAMPLE_CSV = `nombre,direccion,comuna,telefono,email,web,latitud,longitud
Clínica Veterinaria Los Ángeles Centro,Colón 340,Los Ángeles,+56912345678,contacto@losangelesvet.cl,https://losangelesvet.cl,-37.4697,-72.3537
Veterinaria Chiguayante Sur,Manuel Rodríguez 890,Chiguayante,+56987654321,info@vetchiguayante.cl,https://vetchiguayante.cl,-36.9180,-73.0230
Clínica San Pedro de la Paz,Pedro Aguirre Cerda 1050,San Pedro de la Paz,+56412233445,admin@sanpedrovet.cl,https://sanpedrovet.cl,-36.8420,-73.1050
Veterinaria Fuera de Región,Alameda 100,Santiago,+56911223344,stgo@vet.cl,,-33.4489,-70.6693`;

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
      const list: ImportBatch[] = res.data || [];
      setBatches(list);
      if (list.length > 0 && !selectedBatch) {
        setSelectedBatch(list[0] ?? null);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando lotes de importación');
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
      setRows(res.data || []);
    } catch (err: any) {
      console.error('Error cargando filas:', err);
    } finally {
      setLoadingRows(false);
    }
  }, [rowStatusFilter]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (selectedBatch) {
      loadRows(selectedBatch.id);
    }
  }, [selectedBatch, loadRows]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
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

      // Recargar tras 2 segundos para dar tiempo al worker a terminar el análisis inicial
      setTimeout(async () => {
        await loadBatches();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al subir lote de importación');
    } finally {
      setUploading(false);
    }
  };

  const handleRowActionChange = async (rowId: string, actionType: 'INSERT' | 'UPDATE' | 'SKIP') => {
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
    } catch (err: any) {
      setError(err.message || 'Error modificando acción de la fila');
    }
  };

  const handleApplyBatch = async () => {
    if (!selectedBatch) return;
    if (
      !confirm(
        `¿Confirmas la aplicación del lote #${selectedBatch.id} a producción? Se ejecutarán transacciones atómicas y se registrará trazabilidad en audit_log.`,
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
    } catch (err: any) {
      setError(err.message || 'Error al aplicar lote a producción');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelBatch = async () => {
    if (!selectedBatch) return;
    if (!confirm(`¿Estás seguro de descartar y cancelar el lote #${selectedBatch.id}?`)) return;

    try {
      await adminApi(`/admin/import/batches/${selectedBatch.id}/cancel`, {
        method: 'POST',
      });
      setSuccessMsg(`Lote #${selectedBatch.id} cancelado.`);
      await loadBatches();
    } catch (err: any) {
      setError(err.message || 'Error cancelando lote');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ANALYZED':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'ANALYZING':
        return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getRowStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'POSSIBLE_DUPLICATE':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'INVALID':
      case 'ERROR':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'APPLIED':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📦</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ingesta Masiva y Staging (Dry-Run)
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Carga de datos desacoplada, deduplicación multicriterio (PostGIS + trigramas + E.164) y worker SKIP LOCKED
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCsvContent(SAMPLE_CSV);
              setFilename('piloto_biobio_muestra.csv');
            }}
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition border border-slate-300"
          >
            📋 Cargar CSV de Muestra
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-sm">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
          <span className="text-xl">✓</span>
          <div>
            <h3 className="font-semibold text-sm">Operación Exitosa</h3>
            <p className="text-sm">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Formulario de Carga */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Subir Nuevo Lote para Análisis</h2>

        <form onSubmit={handleSubmitBatch} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
            <div className="w-full sm:w-auto">
              <button
                type="submit"
                disabled={uploading || !csvContent.trim()}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {uploading ? 'Analizando en Staging...' : '🚀 Subir y Analizar (Dry-Run)'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Contenido CSV o JSON (puedes pegar directamente):
            </label>
            <textarea
              rows={4}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="nombre,direccion,comuna,telefono,email,latitud,longitud..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>
        </form>
      </div>

      {/* Historial de Lotes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Lotes de Importación</h2>
            <p className="text-xs text-slate-500">
              Selecciona un lote para inspeccionar el visor Dry-Run y previsualizar cambios
            </p>
          </div>
          <button
            onClick={loadBatches}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            ↻ Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-slate-400 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Lote ID</th>
                <th className="px-6 py-3">Archivo</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Total Filas</th>
                <th className="px-6 py-3">Válidas</th>
                <th className="px-6 py-3">Duplicados</th>
                <th className="px-6 py-3">Errores</th>
                <th className="px-6 py-3">Aplicadas</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3 text-right">Acción</th>
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
                      <td className="px-6 py-3 text-slate-900">{b.filename}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            b.status,
                          )}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">{b.totalRows}</td>
                      <td className="px-6 py-3 text-emerald-700 font-semibold">{b.validRows}</td>
                      <td className="px-6 py-3 text-amber-700 font-semibold">{b.duplicateRows}</td>
                      <td className="px-6 py-3 text-rose-700 font-semibold">{b.errorRows}</td>
                      <td className="px-6 py-3 text-sky-700 font-semibold">{b.appliedRows}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
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
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
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
                  <button
                    onClick={handleApplyBatch}
                    disabled={applying}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {applying ? 'Aplicando transacciones...' : '✓ Aplicar a Producción'}
                  </button>
                  <button
                    onClick={handleCancelBatch}
                    className="text-slate-600 hover:text-rose-600 text-xs font-medium px-3 py-2 border border-slate-300 hover:border-rose-300 rounded-xl transition"
                  >
                    Cancelar Lote
                  </button>
                </>
              )}

              {selectedBatch.status === 'COMPLETED' && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  ✓ Lote Aplicado en Producción
                </span>
              )}
            </div>
          </div>

          {/* Filtros de Filas */}
          <div className="px-6 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filtrar por estado:</span>
            <select
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
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-slate-400 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Clínica Propuesta</th>
                  <th className="px-6 py-3">Contacto / Comuna</th>
                  <th className="px-6 py-3">Estado Análisis</th>
                  <th className="px-6 py-3">Coincidencia / Razón</th>
                  <th className="px-6 py-3">Diferencias Detectadas</th>
                  <th className="px-6 py-3">Acción Asignada</th>
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
                    const parsed = row.parsedData || row.rawData;
                    const diffKeys = Object.keys(row.differences || {});

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">
                          {row.rowNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">{parsed.name}</div>
                          <div className="text-[11px] text-slate-500">{parsed.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800 font-medium">
                            {parsed.phoneE164 || parsed.phone || '—'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            CUT: {parsed.communeCut || parsed.comuna || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRowStatusBadge(
                              row.status,
                            )}`}
                          >
                            {row.status}
                          </span>
                          {row.errorMessage && (
                            <div className="text-[10px] text-rose-600 mt-1 max-w-xs">
                              {row.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {row.matchedClinic ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {row.matchedClinic.name}
                              </div>
                              <div className="text-[10px] text-amber-700 font-mono">
                                {row.matchReason} (Score: {row.matchScore})
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Sin colisión</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          {diffKeys.length > 0 ? (
                            <div className="space-y-1">
                              {diffKeys.map((k) => (
                                <div key={k} className="text-[10px] bg-slate-50 p-1 rounded border border-slate-200">
                                  <span className="font-bold uppercase text-slate-600">{k}: </span>
                                  <span className="line-through text-slate-400 mr-1">
                                    {String(row.differences[k]?.current ?? '—')}
                                  </span>
                                  <span className="text-emerald-700 font-semibold">
                                    → {String(row.differences[k]?.proposed ?? '—')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {selectedBatch.status === 'ANALYZED' ? (
                            <select
                              value={row.actionType}
                              onChange={(e) =>
                                handleRowActionChange(row.id, e.target.value as any)
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
                            <span className="font-bold text-[11px] text-slate-600">
                              {row.actionType}
                            </span>
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
