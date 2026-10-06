import type { ScheduleEntry } from '@/types/domain';
import { Card } from '@/components/ui/display';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Horarios legibles (§21), incluyendo overnight y días cerrados.
export function ScheduleTable({ schedules }: { schedules: ScheduleEntry[] }) {
  return (
    <section aria-labelledby="horarios" className="space-y-2">
      <h2 id="horarios" className="text-xl font-semibold">Horarios</h2>
      {schedules.length === 0 ? (
        <p className="text-ink-soft">Horario no informado.</p>
      ) : (
        <Card className="overflow-hidden">
          <dl className="divide-y divide-slate-100">
            {schedules.map((h, i) => (
              <div key={i} className="flex justify-between px-4 py-2">
                <dt className="font-medium">{DAYS[h.day_of_week] ?? `Día ${h.day_of_week}`}</dt>
                <dd className="text-ink-soft">
                  {h.is_closed || !h.opening_time || !h.closing_time
                    ? 'Cerrado'
                    : `${h.opening_time.slice(0, 5)} – ${h.closing_time.slice(0, 5)}${h.is_overnight ? ' (+1 día)' : ''}`}
                  {h.label ? ` · ${h.label}` : ''}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </section>
  );
}
