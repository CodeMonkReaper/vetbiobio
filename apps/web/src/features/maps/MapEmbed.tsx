// Mapa sin token: embed OpenStreetMap con marcador. Sin dependencias.
// Mapbox GL queda pendiente de NEXT_PUBLIC_MAPBOX_TOKEN (ver docs/architecture.md).
export function MapEmbed({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const dLon = 0.02;
  const dLat = 0.012;
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - dLon}%2C${lat - dLat}%2C${lng + dLon}%2C${lat + dLat}` +
    `&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <figure>
      <iframe title={`Mapa: ${label}`} src={src} width="100%" height="300" loading="lazy" />
      <figcaption>
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`} target="_blank" rel="noreferrer">
          Ver mapa ampliado
        </a>
      </figcaption>
    </figure>
  );
}
