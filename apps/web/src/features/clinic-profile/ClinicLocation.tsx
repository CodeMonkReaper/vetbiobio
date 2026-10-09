import Image from 'next/image';
import type { ClinicPhoto, ClinicProfile } from '@/types/domain';
import { ClinicMap } from '@/features/maps/ClinicMap';
import { Card } from '@/components/ui/display';

/**
 * Ubicación territorial en mapa interactivo (§22).
 */
export function ClinicLocation({ clinic }: { clinic: ClinicProfile }) {
  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="text-lg font-bold text-ink">Ubicación y cómo llegar</h2>
        <p className="text-xs text-ink-mute">
          {clinic.address ? `${clinic.address}, ` : ''}{clinic.commune}, Región del Biobío
        </p>
      </div>

      {typeof clinic.latitude === 'number' && typeof clinic.longitude === 'number' ? (
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <ClinicMap lat={clinic.latitude} lng={clinic.longitude} label={clinic.name} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface-alt p-6 text-center text-xs text-ink-mute">
          Coordenadas geográficas no informadas para este establecimiento.
        </div>
      )}
    </Card>
  );
}

/**
 * Galería de fotos del centro (§41): next/image con lazy loading y alt descriptivo.
 */
export function ClinicPhotos({ photos }: { photos: ClinicPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="fotografias-titulo" className="space-y-3">
      <div className="border-b border-border-subtle pb-2">
        <h2 id="fotografias-titulo" className="text-xl font-bold tracking-tight text-ink">
          Instalaciones y fotografías
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, idx) => (
          <li key={p.url || idx} className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
            <Image
              src={p.url}
              alt={p.alt_text ?? 'Fotografía de las instalaciones veterinarias'}
              width={640}
              height={480}
              loading="lazy"
              className="h-44 w-full object-cover transition duration-300 hover:scale-105"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
