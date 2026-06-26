export interface ActiveSessionsFilteredResultsMetaProps {
  hasActiveFilters: boolean;
  tenantTotal: number;
  filteredTotal: number;
}

/** Copy dual KPI/listado con filtros — spec v1.1 §6.2 (Fase 2). */
export function ActiveSessionsFilteredResultsMeta({
  hasActiveFilters,
  tenantTotal,
  filteredTotal,
}: ActiveSessionsFilteredResultsMetaProps) {
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="mb-3 space-y-1 text-sm text-text-soft">
      <p>{tenantTotal} sesiones activas del tenant</p>
      <p>{filteredTotal} resultados</p>
    </div>
  );
}

export interface ActiveSessionsPaginationDualCopyProps {
  hasActiveFilters: boolean;
  filteredTotal: number;
  tenantTotal: number;
  rangeStart: number;
  rangeEnd: number;
}

/** Subtítulo dual junto a paginación — no modifica ErpPagination. */
export function ActiveSessionsPaginationDualCopy({
  hasActiveFilters,
  filteredTotal,
  tenantTotal,
  rangeStart,
  rangeEnd,
}: ActiveSessionsPaginationDualCopyProps) {
  if (filteredTotal === 0) {
    return <span>Sin registros</span>;
  }

  if (hasActiveFilters) {
    return (
      <span>
        Mostrando <span className="font-medium text-text-base">{rangeStart}</span> a{' '}
        <span className="font-medium text-text-base">{rangeEnd}</span> de{' '}
        <span className="font-medium text-text-base">{filteredTotal}</span> resultados ·{' '}
        <span className="font-medium text-text-base">{tenantTotal}</span> en el tenant
      </span>
    );
  }

  return (
    <span>
      Mostrando <span className="font-medium text-text-base">{rangeStart}</span> a{' '}
      <span className="font-medium text-text-base">{rangeEnd}</span> de{' '}
      <span className="font-medium text-text-base">{filteredTotal}</span>
    </span>
  );
}
