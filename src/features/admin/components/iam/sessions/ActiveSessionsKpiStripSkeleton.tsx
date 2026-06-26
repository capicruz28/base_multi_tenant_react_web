/** Skeleton franja KPI — spec v1.1 Fase 1B (4 celdas, no tabla). */
export function ActiveSessionsKpiStripSkeleton() {
  return (
    <div
      className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Cargando indicadores de sesiones"
    >
      {[1, 2, 3, 4].map((cell) => (
        <div
          key={cell}
          className="h-[72px] rounded-lg border border-border-base bg-subtle animate-pulse"
        />
      ))}
    </div>
  );
}
