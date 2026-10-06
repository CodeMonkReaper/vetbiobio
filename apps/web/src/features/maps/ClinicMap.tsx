// Placeholder mapa — Mapbox solo frontend con token público.
export function ClinicMap({ lat, lng }: { lat: number; lng: number }) {
  return <div data-lat={lat} data-lng={lng} role="img" aria-label={`Mapa ${lat},${lng}`} />;
}
