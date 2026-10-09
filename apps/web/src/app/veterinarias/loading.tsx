import { Skeleton } from '@/components/ui/display';

/**
 * Esqueleto de carga accesible respetando preferencias de movimiento reducido (§25).
 */
export default function Loading() {
  return (
    <div className="space-y-6 py-2" aria-busy="true" aria-label="Cargando directorio de veterinarias">
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Skeleton className="h-[480px] rounded-xl" />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
