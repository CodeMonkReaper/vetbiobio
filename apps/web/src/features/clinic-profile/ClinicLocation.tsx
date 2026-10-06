import Image from 'next/image';
import type { ClinicPhoto, ClinicProfile } from '@/types/domain';
import { ClinicMap } from '@/features/maps/ClinicMap';

// Ubicación (§22): coordenadas siempre desde la API, nunca inferidas.
export function ClinicLocation({ clinic }: { clinic: ClinicProfile }) {
  return (
    <section aria-labelledby="ubicacion" className="space-y-2">
      <h2 id="ubicacion" className="text-xl font-semibold">Ubicación</h2>
      {typeof clinic.latitude === 'number' && typeof clinic.longitude === 'number' ? (
        <>
          <p className="text-ink-soft">
            {clinic.address}
            {clinic.address && ', '}
            {clinic.commune}
          </p>
          <ClinicMap lat={clinic.latitude} lng={clinic.longitude} label={clinic.name} />
        </>
      ) : (
        <p className="text-ink-soft">Información no disponible</p>
      )}
    </section>
  );
}

// Fotografías (§41): next/image con alt obligatorio.
export function ClinicPhotos({ photos }: { photos: ClinicPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="fotografias" className="space-y-3">
      <h2 id="fotografias" className="text-xl font-semibold">Fotografías</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <li key={p.url}>
            <Image
              src={p.url}
              alt={p.alt_text ?? 'Fotografía del establecimiento'}
              width={640}
              height={480}
              loading="lazy"
              className="rounded-lg object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
