import React from 'react';

export interface InvTableSkeletonProps {
  /** Número de columnas (debe coincidir con la tabla real). */
  columns: number;
  /** Filas de placeholder (por defecto 8). */
  rows?: number;
}

/**
 * Skeleton de tabla para listados INV — mismo contenedor visual que las tablas de ORG
 * (`overflow-x-auto rounded-lg border … shadow`).
 */
export function InvTableSkeleton({ columns, rows = 8 }: InvTableSkeletonProps) {
  const safeCols = Math.max(1, columns);
  const safeRows = Math.max(1, rows);

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border-base shadow animate-pulse"
      aria-busy
      aria-label="Cargando tabla"
    >
      <table className="min-w-full divide-y divide-border-base">
        <thead className="bg-subtle">
          <tr>
            {Array.from({ length: safeCols }, (_, i) => (
              <th key={`sk-h-${i}`} className="px-4 py-3">
                <div className="h-3 bg-overlay rounded w-20 max-w-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border-base">
          {Array.from({ length: safeRows }, (_, ri) => (
            <tr key={`sk-r-${ri}`}>
              {Array.from({ length: safeCols }, (_, ci) => (
                <td key={`sk-r-${ri}-c-${ci}`} className="px-4 py-3">
                  <div className="h-4 bg-subtle rounded w-full max-w-[140px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
