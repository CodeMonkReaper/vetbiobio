'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { AdminClinicHeader } from '@/components/admin/AdminClinicHeader';
import { Card, Alert } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/fields';
import { ClockIcon, CalendarIcon, ZapIcon, RefreshIcon } from '@/components/admin/icons/AdminIcons';
import { validateScheduleForm } from '@/lib/admin-form-validation';

const DAYS_ORDERED = [
  { index: 1, name: 'Lunes' },
  { index: 2, name: 'Martes' },
  { index: 3, name: 'Miércoles' },
  { index: 4, name: 'Jueves' },
  { index: 5, name: 'Viernes' },
  { index: 6, name: 'Sábado' },
  { index: 0, name: 'Domingo' },
];

type ScheduleRow = {
  id: number;
  day_of_week: number;
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
};

export default function AdminHorarios() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Cargando módulo de horarios...
        </div>
      }
    >
      <HorariosInner />
    </Suspense>
  );
}

function HorariosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('clinica') ?? '';

  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulario de edición
  const [form, setForm] = useState({
    day: 1,
    open: '09:00',
    close: '19:00',
    closed: false,
    is24h: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminApi(`/admin/clinics/${slug}/schedules`);
      setRows((res as ScheduleRow[]) || []);
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [router, slug]);

  useEffect(() => {
    if (slug) void load();
  }, [load, slug]);

  // Mapa de días a sus registros
  const scheduleMap = new Map<number, ScheduleRow>();
  rows.forEach((r) => scheduleMap.set(r.day_of_week, r));

  function handleSelectDay(dayIndex: number) {
    const existing = scheduleMap.get(dayIndex);
    if (existing) {
      const is24h =
        !existing.is_closed &&
        existing.opening_time?.startsWith('00:00') &&
        (existing.closing_time?.startsWith('23:59') || existing.closing_time?.startsWith('24:00'));
      setForm({
        day: dayIndex,
        open: existing.opening_time ? existing.opening_time.slice(0, 5) : '09:00',
        close: existing.closing_time ? existing.closing_time.slice(0, 5) : '19:00',
        closed: existing.is_closed,
        is24h: Boolean(is24h),
      });
    } else {
      setForm({
        day: dayIndex,
        open: '09:00',
        close: '19:00',
        closed: false,
        is24h: false,
      });
    }
    setError('');
    setSuccess('');
    const formElement = document.getElementById('schedule-edit-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  }

  // Validación previa en cliente de intervalos de apertura y cierre
  const validationError = useMemo(() => {
    return validateScheduleForm(form);
  }, [form]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      let openTime: string | undefined = form.open;
      let closeTime: string | undefined = form.close;

      if (form.closed) {
        openTime = undefined;
        closeTime = undefined;
      } else if (form.is24h) {
        openTime = '00:00:00';
        closeTime = '23:59:59';
      }

      await adminApi(`/admin/clinics/${slug}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: Number(form.day),
          openingTime: openTime,
          closingTime: closeTime,
          isClosed: form.closed,
        }),
      });

      const dayObj = DAYS_ORDERED.find((d) => d.index === form.day);
      setSuccess(`Horario de ${dayObj?.name} actualizado correctamente.`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Replicar horario de lunes a otros días específicos
  async function replicateSchedule(targetDays: number[], label: string) {
    const monday = scheduleMap.get(1);
    if (!monday) {
      setError('Debes configurar primero el horario del Lunes para usarlo como plantilla.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      for (const day of targetDays) {
        await adminApi(`/admin/clinics/${slug}/schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayOfWeek: day,
            openingTime: monday.is_closed ? undefined : monday.opening_time,
            closingTime: monday.is_closed ? undefined : monday.closing_time,
            isClosed: monday.is_closed,
          }),
        });
      }
      setSuccess(`Horario de Lunes replicado exitosamente (${label}).`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Configurar urgencia continua 24/7 (todos los 7 días)
  async function setEmergency247() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      for (let day = 0; day <= 6; day++) {
        await adminApi(`/admin/clinics/${slug}/schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayOfWeek: day,
            openingTime: '00:00:00',
            closingTime: '23:59:59',
            isClosed: false,
          }),
        });
      }
      setSuccess('Clínica configurada como Servicio de Urgencia 24/7 (atención ininterrumpida los 7 días).');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto space-y-6">
      <AdminClinicHeader
        title="Gestión de Horarios Semanales"
        subtitle="Administra los turnos de atención, jornadas diurnas y servicio de urgencias 24 horas."
      >
        {/* Notificaciones */}
        {error && (
          <Alert tone="error" title="Error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert tone="success" title="Horario Actualizado" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Acciones de atajo y replicación */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ZapIcon className="w-4 h-4 text-amber-600" />
                <span>Plantillas y Replicación Rápida de Horario</span>
              </div>
              <div className="text-xs text-slate-500">
                Usa el horario del Lunes como base para configurar rápidamente los turnos semanales.
              </div>
            </div>
            <span className="text-[11px] text-slate-500">
              {scheduleMap.has(1) ? '✓ Lunes configurado como plantilla' : 'Configura el Lunes primero'}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void replicateSchedule([2, 3, 4, 5], 'Lunes a Viernes')}
              disabled={saving || loading || !scheduleMap.has(1)}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Replicar Lunes a Viernes</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void replicateSchedule([2, 3, 4, 5, 6], 'Lunes a Sábado')}
              disabled={saving || loading || !scheduleMap.has(1)}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Replicar Lunes a Sábado</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void replicateSchedule([0, 2, 3, 4, 5, 6], 'Toda la Semana')}
              disabled={saving || loading || !scheduleMap.has(1)}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <RefreshIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Replicar los 7 Días</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void setEmergency247()}
              disabled={saving || loading}
              className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 inline-flex items-center gap-1.5"
            >
              <ZapIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Establecer Urgencia 24/7</span>
            </Button>
          </div>
        </div>

        {/* Cuadrícula de 7 días */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS_ORDERED.map(({ index, name }) => {
            const sched = scheduleMap.get(index);
            const isSelected = form.day === index;
            const is24h =
              sched &&
              !sched.is_closed &&
              sched.opening_time?.startsWith('00:00') &&
              (sched.closing_time?.startsWith('23:59') || sched.closing_time?.startsWith('24:00'));

            return (
              <Card
                key={index}
                className={`p-3.5 border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/40'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
                onClick={() => handleSelectDay(index)}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    )}
                  </div>

                  {!sched ? (
                    <div className="text-xs text-slate-400 italic">Sin configurar</div>
                  ) : sched.is_closed ? (
                    <Badge tone="error" size="sm">
                      Cerrado
                    </Badge>
                  ) : is24h ? (
                    <Badge tone="success" size="sm">
                      24 Horas
                    </Badge>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-800 tabular-nums">
                        {sched.opening_time?.slice(0, 5)} – {sched.closing_time?.slice(0, 5)}
                      </div>
                      <Badge tone="info" size="sm">
                        Diurno
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <span className="text-[11px] font-semibold text-emerald-700 hover:underline">
                    {isSelected ? 'Editando' : 'Modificar →'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Panel de edición */}
        <div id="schedule-edit-form" className="max-w-xl mx-auto">
          <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-teal-600" />
                <span>
                  Editar Horario — {DAYS_ORDERED.find((d) => d.index === form.day)?.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajusta las horas de apertura y cierre para este día específico de la semana.
              </p>
            </div>

            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <Field label="Día de la semana" htmlFor="day-select" required>
                <Select
                  id="day-select"
                  value={form.day}
                  onChange={(e) => handleSelectDay(Number(e.target.value))}
                >
                  {DAYS_ORDERED.map((d) => (
                    <option key={d.index} value={d.index}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={form.closed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        closed: e.target.checked,
                        is24h: e.target.checked ? false : form.is24h,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Cerrado todo el día</span>
                </label>

                {!form.closed && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={form.is24h}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          is24h: e.target.checked,
                          open: e.target.checked ? '00:00' : form.open,
                          close: e.target.checked ? '23:59' : form.close,
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Urgencia / Atención 24 Horas continuas</span>
                  </label>
                )}
              </div>

              {!form.closed && !form.is24h && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                        htmlFor="opening-time"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Hora Apertura
                    </label>
                    <input
                      id="opening-time"
                      type="time"
                      value={form.open}
                      onChange={(e) => setForm({ ...form, open: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="closing-time"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Hora Cierre
                    </label>
                    <input
                      id="closing-time"
                      type="time"
                      value={form.close}
                      onChange={(e) => setForm({ ...form, close: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {validationError && (
                <Alert tone="warning" title="Discrepancia de Intervalo">
                  {validationError}
                </Alert>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                disabled={saving || Boolean(validationError)}
              >
                {saving ? 'Guardando horario...' : 'Guardar Horario'}
              </Button>
            </form>
          </Card>
        </div>
      </AdminClinicHeader>
    </main>
  );
}
