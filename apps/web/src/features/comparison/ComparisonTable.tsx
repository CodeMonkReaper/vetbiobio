// Comparación hasta 3 clínicas (?ids=a,b) — tabla precio/distancia/servicios/exámenes/urgencias/verificación.
export function ComparisonTable({ ids }: { ids: string[] }) {
  return <table><caption>Comparar: {ids.join(', ')}</caption></table>;
}
