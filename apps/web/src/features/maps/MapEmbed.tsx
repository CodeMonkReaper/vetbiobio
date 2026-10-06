// Mapa sin token: embed OpenStreetMap con marcador. Sin dependencias.
// Mismo marco visual que ClinicMap (aspect fijo, borde, caption).
export function MapEmbed({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const dLon = 0.02;
  const dLat = 0.012;
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - dLon}%2C${lat - dLat}%2C${lng + dLon}%2C${lat + dLat}` +
    `&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="relative aspect-video w-full bg-paper">
        <iframe
          title={`Mapa: ${label}`}
          src={src}
          loading="lazy"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <figcaption className="flex items-center justify-between px-4 py-2 text-sm text-ink-soft">
        <span>{label}</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-brand-700"
        >
          Ver mapa ampliado
        </a>
      </figcaption>
    </figure>
  );
}
