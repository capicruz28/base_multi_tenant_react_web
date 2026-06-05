import { Loader } from 'lucide-react';

export interface RoleStatsCellProps {
  loading: boolean;
  unavailable?: boolean;
  value?: number | null;
  tooltip?: string;
  emptyLabel?: string;
}

/**
 * Celda de métrica (usuarios o permisos) con skeleton y estados vacíos.
 */
export function RoleStatsCell({
  loading,
  unavailable = false,
  value,
  tooltip,
  emptyLabel = '—',
}: RoleStatsCellProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-soft">
        <Loader className="h-3.5 w-3.5 animate-spin text-brand-primary" aria-hidden />
        <span className="sr-only">Cargando…</span>
      </span>
    );
  }

  if (unavailable || value === undefined || value === null) {
    return (
      <span
        className="text-text-soft"
        title={tooltip ?? 'No disponible'}
      >
        {emptyLabel}
      </span>
    );
  }

  return (
    <span className="text-text-base tabular-nums" title={tooltip}>
      {value}
    </span>
  );
}
