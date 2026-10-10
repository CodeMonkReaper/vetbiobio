'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin';
import { Card, Alert, Skeleton, Empty } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  ClinicIcon,
  SearchIcon,
  InboxIcon,
  ReportIcon,
} from '@/components/admin/icons/AdminIcons';

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

const COMMUNES = [
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

export default function AdminClinicsPage() {
  const router = useRouter();
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      params.append('limit', '100');

      const res = await adminApi(`/admin/clinics?${params.toString()}`);
      setClinics(res.data as ClinicRow[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar clínicas';
      if (msg === 'UNAUTHORIZED') router.push('/admin/login');
      else setError('No se pudo cargar el listado de clínicas.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusChange(id: string, newStatus: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'CLOSED') {
    setUpdatingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminApi(`/admin/clinics/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg(`Estado actualizado a ${newStatus} correctamente.`);
      await load();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCreateClinic(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
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
      setSuccessMsg('Clínica creada exitosamente en modo borrador (DRAFT).');
      await load();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la clínica.');
    } finally {
      setCreating(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center rounded-full bg-status-verified-bg px-2.5 py-0.5 text-xs font-semibold text-status-verified-text border border-status-verified-border">
            Activa
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center rounded-full bg-status-outdated-bg px-2.5 py-0.5 text-xs font-semibold text-status-outdated-text border border-status-outdated-border">
            Borrador
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center rounded-full bg-status-danger-bg px-2.5 py-0.5 text-xs font-semibold text-status-danger-text border border-status-danger-border">
            Cerrada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-ink-mute border border-border-subtle">
            Inactiva
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Directorio de Clínicas Veterinarias
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-mute">
            Administra las veterinarias registradas, estados de publicación y georreferenciación en Biobío.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<ClinicIcon className="w-4 h-4" />}
        >
          Nueva Clínica
        </Button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: '', label: 'Todas' },
            { id: 'ACTIVE', label: 'Activas' },
            { id: 'DRAFT', label: 'Borrador' },
            { id: 'INACTIVE', label: 'Inactivas' },
            { id: 'CLOSED', label: 'Cerradas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-mute">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] rounded-md border border-border bg-surface pl-9 pr-3 text-xs text-ink placeholder:text-ink-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          />
        </div>
      </Card>

      {/* Alertas */}
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

      {/* Tabla de Clínicas */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : clinics.length === 0 ? (
        <Empty
          title="No se encontraron clínicas"
          description={
            searchQuery
              ? `No hay clínicas registradas que coincidan con "${searchQuery}".`
              : 'No hay clínicas registradas con el estado seleccionado.'
          }
          hints={['Verifica el término en el buscador.', 'Cambia el filtro de estado a "Todas".']}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
              }}
            >
              Ver todas las clínicas
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface-alt text-xs font-semibold text-ink-mute uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Clínica</th>
                  <th scope="col" className="px-5 py-3">Comuna</th>
                  <th scope="col" className="px-5 py-3">Estado</th>
                  <th scope="col" className="px-5 py-3">Verificación</th>
                  <th scope="col" className="px-5 py-3">Pendientes</th>
                  <th scope="col" className="px-5 py-3">Módulos</th>
                  <th scope="col" className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {clinics.map((c) => {
                  const isRowUpdating = updatingId === c.id;

                  return (
                    <tr key={c.id} className="transition hover:bg-surface-alt/60">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-ink">{c.name}</div>
                        <div className="text-xs text-ink-mute font-mono">/{c.slug}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-ink-soft">
                        <span className="font-medium">{c.commune || 'Sin comuna'}</span>
                        {!c.has_location && (
                          <span className="block text-status-danger-text text-[11px] font-semibold mt-0.5">
                            Sin dirección georreferenciada
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-ink-mute">
                        <Badge tone="neutral">{c.verification_status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          {c.pending_submissions > 0 && (
                            <Link
                              href={`/admin/aportes?clinicId=${c.id}&status=PENDING`}
                              className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-800 hover:underline border border-brand-200"
                            >
                              <InboxIcon className="w-3 h-3" />
                              <span>{c.pending_submissions}</span>
                            </Link>
                          )}
                          {c.open_reports > 0 && (
                            <Link
                              href="/admin/reportes"
                              className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-800 hover:underline border border-rose-200"
                            >
                              <ReportIcon className="w-3 h-3" />
                              <span>{c.open_reports}</span>
                            </Link>
                          )}
                          {c.pending_submissions === 0 && c.open_reports === 0 && (
                            <span className="text-ink-mute text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-brand-700 font-medium">
                          <Link href={`/admin/precios?clinica=${c.slug}`} className="hover:underline">
                            Precios
                          </Link>
                          <span className="text-border">·</span>
                          <Link href={`/admin/horarios?clinica=${c.slug}`} className="hover:underline">
                            Horarios
                          </Link>
                          <span className="text-border">·</span>
                          <Link href={`/admin/fotos?clinica=${c.slug}`} className="hover:underline">
                            Fotos
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1">
                        {c.status !== 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.id, 'ACTIVE')}
                            disabled={!c.has_location || isRowUpdating}
                            title={!c.has_location ? 'Requiere dirección para publicar' : 'Publicar'}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-md transition disabled:opacity-40"
                          >
                            Publicar
                          </button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.id, 'DRAFT')}
                            disabled={isRowUpdating}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-md transition disabled:opacity-40"
                          >
                            A Borrador
                          </button>
                        )}
                        {c.status !== 'INACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.id, 'INACTIVE')}
                            disabled={isRowUpdating}
                            className="bg-surface-alt hover:bg-slate-200 text-ink-soft border border-border-subtle text-xs font-semibold px-2.5 py-1 rounded-md transition disabled:opacity-40"
                          >
                            Desactivar
                          </button>
                        )}
                        {c.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.id, 'CLOSED')}
                            disabled={isRowUpdating}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-md transition disabled:opacity-40"
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
        </Card>
      )}

      {/* Modal Accesible para Crear Nueva Clínica */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          if (!creating) setShowCreateModal(false);
        }}
        title="Crear Nueva Clínica (Borrador)"
        description="Registra los datos iniciales de una clínica. Se creará en estado DRAFT para revisión técnica antes de su publicación."
      >
        <form onSubmit={handleCreateClinic} className="space-y-4 text-xs">
          <div>
            <label htmlFor="clinic-name" className="block text-xs font-bold text-ink uppercase mb-1">
              Nombre de la Clínica <span className="text-rose-600">*</span>
            </label>
            <input
              id="clinic-name"
              type="text"
              required
              placeholder="Ej: Veterinaria Biobío Salud"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-border bg-surface p-2 text-ink text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
            />
          </div>

          <div>
            <label htmlFor="clinic-address" className="block text-xs font-bold text-ink uppercase mb-1">
              Dirección Física <span className="text-rose-600">*</span>
            </label>
            <input
              id="clinic-address"
              type="text"
              required
              placeholder="Ej: O'Higgins 1234"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-md border border-border bg-surface p-2 text-ink text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="clinic-commune" className="block text-xs font-bold text-ink uppercase mb-1">
                Comuna
              </label>
              <select
                id="clinic-commune"
                value={form.communeCut}
                onChange={(e) => setForm({ ...form, communeCut: e.target.value })}
                className="w-full rounded-md border border-border bg-surface p-2 text-ink text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
              >
                {COMMUNES.map((c) => (
                  <option key={c.cut} value={c.cut}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="clinic-phone" className="block text-xs font-bold text-ink uppercase mb-1">
                Teléfono de Contacto
              </label>
              <input
                id="clinic-phone"
                type="text"
                placeholder="+569..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-border bg-surface p-2 text-ink text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="clinic-lat" className="block text-xs font-bold text-ink uppercase mb-1">
                Latitud
              </label>
              <input
                id="clinic-lat"
                type="text"
                required
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full rounded-md border border-border bg-surface p-2 text-ink font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
              />
            </div>
            <div>
              <label htmlFor="clinic-lng" className="block text-xs font-bold text-ink uppercase mb-1">
                Longitud
              </label>
              <input
                id="clinic-lng"
                type="text"
                required
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full rounded-md border border-border bg-surface p-2 text-ink font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
              <input
                type="checkbox"
                checked={form.isEmergency}
                onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })}
                className="h-4 w-4 text-brand-600 rounded border-border"
              />
              <span>Atención de Urgencias</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
              <input
                type="checkbox"
                checked={form.is24h}
                onChange={(e) => setForm({ ...form, is24h: e.target.checked })}
                className="h-4 w-4 text-brand-600 rounded border-border"
              />
              <span>Atención 24 Horas</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={creating}
            >
              Guardar Clínica
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
