import { Skeleton } from '@/components/ui/display';

// Loading con skeletons (§25), no spinners gigantes.
export default function Loading() {
  return (
    <main className="space-y-4" aria-busy="true" aria-label="Cargando veterinarias">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Skeleton className="h-96" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </main>
  );
}
