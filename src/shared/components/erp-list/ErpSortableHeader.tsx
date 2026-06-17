import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ErpListSortState } from '@/core/list/erp-list.types';

export interface ErpSortableHeaderProps {
  column: string;
  label: string;
  sortableColumns: readonly string[];
  sort: ErpListSortState;
  onSort: (column: string) => void;
  className?: string;
}

/**
 * Cabecera ordenable — solo columnas en whitelist (PERF-04).
 */
export function ErpSortableHeader({
  column,
  label,
  sortableColumns,
  sort,
  onSort,
  className = '',
}: ErpSortableHeaderProps) {
  const isSortable = sortableColumns.includes(column);
  const isActive = sort.sort_by === column;

  if (!isSortable) {
    return (
      <th
        scope="col"
        className={`px-4 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider ${className}`.trim()}
      >
        {label}
      </th>
    );
  }

  const SortIcon = !isActive ? ArrowUpDown : sort.sort_dir === 'desc' ? ArrowDown : ArrowUp;

  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider ${className}`.trim()}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 hover:text-text-base focus:outline-none focus:ring-2 focus:ring-brand-primary rounded"
      >
        <span>{label}</span>
        <SortIcon className={`h-3.5 w-3.5 ${isActive ? 'text-brand-primary' : 'opacity-60'}`} aria-hidden />
        <span className="sr-only">
          {isActive ? `Ordenado ${sort.sort_dir === 'desc' ? 'descendente' : 'ascendente'}` : 'Ordenar columna'}
        </span>
      </button>
    </th>
  );
}
