import type { ProfessionalType, ProfileProfessional } from '@/types/domain';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';

const TYPE_LABEL: Record<ProfessionalType, string> = {
  VETERINARIAN: 'Médico/a Veterinario/a',
  VETERINARY_TECHNICIAN: 'Técnico/a Veterinario/a',
  SPECIALIST: 'Especialista',
  OTHER: 'Profesional Clínico/a',
};

export function ProfessionalCard({ professional }: { professional: ProfileProfessional }) {
  return (
    <Card className="flex h-full flex-col justify-between p-4 space-y-2">
      <div>
        <p className="font-bold text-ink text-base">{professional.display_name}</p>
        <p className="text-xs font-semibold text-brand-700">
          {TYPE_LABEL[professional.professional_type] ?? professional.professional_type}
        </p>
        {professional.role && (
          <p className="mt-1 text-xs text-ink-mute">{professional.role}</p>
        )}
      </div>

      {professional.specialties && (
        <div className="pt-2 border-t border-border-subtle">
          <Badge tone="brand">{professional.specialties}</Badge>
        </div>
      )}
    </Card>
  );
}

export function ClinicProfessionals({ professionals }: { professionals: ProfileProfessional[] }) {
  if (professionals.length === 0) return null;

  return (
    <section aria-labelledby="profesionales-titulo" className="space-y-3">
      <div className="border-b border-border-subtle pb-2">
        <h2 id="profesionales-titulo" className="text-xl font-bold tracking-tight text-ink">
          Equipo médico y profesionales
        </h2>
        <p className="text-xs text-ink-mute">
          Profesionales acreditados del establecimiento.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {professionals.map((p) => (
          <li key={`${p.display_name}-${p.role ?? ''}`}>
            <ProfessionalCard professional={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
