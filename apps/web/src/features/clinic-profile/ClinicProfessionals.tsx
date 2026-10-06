import type { ProfessionalType, ProfileProfessional } from '@/types/domain';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';

const TYPE_LABEL: Record<ProfessionalType, string> = {
  VETERINARIAN: 'Médica/o veterinaria/o',
  VETERINARY_TECHNICIAN: 'Técnica/o veterinaria/o',
  SPECIALIST: 'Especialista',
  OTHER: 'Profesional',
};

// Profesional (§20): solo datos reales del backend, sin inventar.
export function ProfessionalCard({ professional }: { professional: ProfileProfessional }) {
  return (
    <Card className="space-y-1 p-4">
      <p className="font-medium">{professional.display_name}</p>
      <p className="text-sm text-ink-soft">{TYPE_LABEL[professional.professional_type] ?? professional.professional_type}</p>
      {professional.role && <p className="text-sm text-ink-soft">{professional.role}</p>}
      {professional.specialties && (
        <p>
          <Badge tone="info">{professional.specialties}</Badge>
        </p>
      )}
    </Card>
  );
}

export function ClinicProfessionals({ professionals }: { professionals: ProfileProfessional[] }) {
  return (
    <section aria-labelledby="profesionales" className="space-y-3">
      <h2 id="profesionales" className="text-xl font-semibold">Profesionales</h2>
      {professionals.length === 0 ? (
        <p className="text-ink-soft">Información no disponible</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {professionals.map((p) => (
            <li key={`${p.display_name}-${p.role ?? ''}`}>
              <ProfessionalCard professional={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
