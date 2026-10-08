'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin';

interface ClinicRow {
  id: string;
  slug: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  verification_status: string;
  commune: string;
  commune_slug: string;
  has_location: boolean;
  pending_submissions: number;
  open_reports: number;
  created_at: string;
  updated_at: string;
}

export default function AdminClinics() {
  const router = useRouter();
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    address: '',
    communeCut: '08101',
    latitude: '-36.827',
    longitude: '-73.05',
    phone: '',
    email: '',
    whatsapp: '',
    isEmergency: false,
    is24h: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '100');

      const res = await adminApi(`/admin/clinics?${params.toString()}`);
      setClinics(res.data as ClinicRow[]);
      setError('');
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError('No se pudo cargar el listado de clínicas.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(id: string, newStatus: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'CLOSED') {
    try {
      await adminApi(`/admin/clinics/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
    } catch (err) {
      alert(`Error al cambiar estado: ${(err as Error).message}`);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await adminApi('/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          communeCut: form.communeCut,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          phone: form.phone || undefined,
          email: form.email || undefined,
          whatsapp: form.whatsapp || undefined,
          isEmergency: form.isEmergency,
          is24h: form.is24h,
        }),
      });
      setShowCreateModal(false);
      setForm({
        name: '',
        address: '',
        communeCut: '08101',
        latitude: '-36.827',
        longitude: '-73.05',
        phone: '',
        email: '',
        whatsapp: '',
        isEmergency: false,
        is24h: false,
      });
      await load();
    } catch (err) {
      setError(`No se pudo crear: ${(err as Error).message}`);
    }
  }

  const communes = [
    { cut: '08101', name: 'Concepción' },
    { cut: '08102', name: 'Coronel' },
    { cut: '08103', name: 'Chiguayante' },
    { cut: '08104', name: 'Florida' },
    { cut: '08105', name: 'Hualqui' },
    { cut: '08106', name: 'Lota' },
    { cut: '08107', name: 'Penco' },
    { cut: '08108', name: 'San Pedro de la Paz' },
    { cut: '08109', name: 'Santa Juana' },
    { cut: '08110', name: 'Talcahuano' },
    { cut: '08111', name: 'Tomé' },
    { cut: '08112', name: 'Hualpén' },
    { cut: '08301', name: 'Los Ángeles' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Clínicas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra todas las veterinarias registradas, estados de publicación y ubicaciones.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span> Nueva Clínica
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'ACTIVE', 'DRAFT', 'INACTIVE', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'Todas' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
          />
          <button
            onClick={() => load()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Buscar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Clinics Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-2 text-sm text-slate-500">Cargando clínicas...</p>
          </div>
        ) : clinics.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="font-medium text-slate-600">No se encontraron clínicas con los filtros actuales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Clínica</th>
                  <th className="py-3 px-4">Comuna</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Verificación</th>
                  <th className="py-3 px-4">Pendientes</th>
                  <th className="py-3 px-4">Gestión</th>
                  <th className="py-3 px-4 text-right">Cambiar Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {clinics.map((c) => {
                  let statusColor = 'bg-slate-100 text-slate-700';
                  if (c.status === 'ACTIVE') statusColor = 'bg-emerald-100 text-emerald-800';
                  else if (c.status === 'DRAFT') statusColor = 'bg-amber-100 text-amber-800';
                  else if (c.status === 'CLOSED') statusColor = 'bg-rose-100 text-rose-800';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-400 font-mono">/{c.slug}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                        {c.commune || 'Sin comuna'}
                        {!c.has_location && (
                          <span className="block text-rose-500 text-[10px] font-bold">⚠️ Sin dirección</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {c.verification_status}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          {c.pending_submissions > 0 && (
                            <Link
                              href={`/admin/aportes?clinicId=${c.id}&status=PENDING`}
                              className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[11px] hover:underline"
                            >
                              📥 {c.pending_submissions}
                            </Link>
                          )}
                          {c.open_reports > 0 && (
                            <Link
                              href="/admin/reportes"
                              className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded text-[11px] hover:underline"
                            >
                              🚨 {c.open_reports}
                            </Link>
                          )}
                          {c.pending_submissions === 0 && c.open_reports === 0 && (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs space-x-1 whitespace-nowrap">
                        <Link
                          href={`/admin/precios?clinica=${c.slug}`}
                          className="text-blue-600 hover:underline px-1 py-0.5"
                        >
                          Precios
                        </Link>
                        <span>·</span>
                        <Link
                          href={`/admin/horarios?clinica=${c.slug}`}
                          className="text-blue-600 hover:underline px-1 py-0.5"
                        >
                          Horarios
                        </Link>
                        <span>·</span>
                        <Link
                          href={`/admin/fotos?clinica=${c.slug}`}
                          className="text-blue-600 hover:underline px-1 py-0.5"
                        >
                          Fotos
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        {c.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'ACTIVE')}
                            disabled={!c.has_location}
                            title={!c.has_location ? 'Requiere ubicación para publicar' : 'Publicar'}
                            className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold px-2 py-1 rounded transition disabled:opacity-40"
                          >
                            Publicar
                          </button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'DRAFT')}
                            className="bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 text-xs font-semibold px-2 py-1 rounded transition"
                          >
                            Borrador
                          </button>
                        )}
                        {c.status !== 'INACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'INACTIVE')}
                            className="bg-slate-100 hover:bg-slate-700 hover:text-white text-slate-600 text-xs font-semibold px-2 py-1 rounded transition"
                          >
                            Desactivar
                          </button>
                        )}
                        {c.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'CLOSED')}
                            className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 text-xs font-semibold px-2 py-1 rounded transition"
                          >
                            Cerrar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Crear Nueva Clínica (Borrador)</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={create} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Veterinaria Biobío Salud"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: O'Higgins 1234"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Comuna</label>
                  <select
                    value={form.communeCut}
                    onChange={(e) => setForm({ ...form, communeCut: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    {communes.map((c) => (
                      <option key={c.cut} value={c.cut}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+569..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latitud</label>
                  <input
                    type="text"
                    required
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Longitud</label>
                  <input
                    type="text"
                    required
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isEmergency}
                    onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  Tiene Urgencias
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is24h}
                    onChange={(e) => setForm({ ...form, is24h: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  Atención 24 Horas
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-sm"
                >
                  Guardar Clínica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
