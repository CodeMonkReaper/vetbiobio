import type { ScheduleEntry } from '@/types/domain';
import { Card } from '@/components/ui/display';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Tabla de horarios de atención (§21):
 * Identifica el día de la semana actual y muestra claramente si está abierto, cerrado o con horario continuado.
 */
export function ScheduleTable({ schedules }: { schedules: ScheduleEntry[] }) {
  const currentDayIndex = new Date().getDay();

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="text-lg font-bold text-ink">Horarios de atención</h2>
        <p className="text-xs text-ink-mute">
          Horarios declarados por el establecimiento. En festivos o emergencias pueden variar.
        </p>
      </div>

      {schedules.length === 0 ? (
        <p className="text-sm text-ink-mute">Horario no informado por el establecimiento.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <dl className="divide-y divide-border-subtle text-sm">
            {schedules.map((h, i) => {
              const isToday = h.day_of_week === currentDayIndex;
              const isClosed = h.is_closed || !h.opening_time || !h.closing_time;

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                    isToday ? 'bg-brand-50/70 font-semibold' : 'bg-surface'
                  }`}
                >
                  <dt className="flex items-center gap-2 text-ink">
                    <span>{DAYS[h.day_of_week] ?? `Día ${h.day_of_week}`}</span>
                    {isToday && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        Hoy
                      </span>
                    )}
                  </dt>
                  <dd className="text-right">
                    {isClosed ? (
                      <span className="font-medium text-rose-800">Cerrado</span>
                    ) : (
                      <span className="tabular-nums text-ink">
                        {h.opening_time?.slice(0, 5)} – {h.closing_time?.slice(0, 5)}
                        {h.is_overnight && (
                          <span className="ml-1 text-xs text-brand-700 font-semibold">(+1 día)</span>
                        )}
                      </span>
                    )}
                    {h.label && (
                      <span className="block text-xs font-normal text-ink-mute">
                        {h.label}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </Card>
  );
}
