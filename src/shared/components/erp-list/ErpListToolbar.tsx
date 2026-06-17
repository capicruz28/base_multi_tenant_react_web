import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export interface ErpListToolbarProps {
  /** Zona izquierda: búsqueda + filtros. */
  children?: ReactNode;
  /** Zona derecha: acciones (Crear, etc.). */
  actions?: ReactNode;
  /** Muestra botón limpiar cuando hay filtros activos. */
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
  className?: string;
}

/**
 * Toolbar reutilizable listados — layout TB-01 compatible.
 * No incluye selector empresa (ME-02).
 */
export function ErpListToolbar({
  children,
  actions,
  hasActiveFilters = false,
  onClearFilters,
  clearFiltersLabel = 'Limpiar filtros',
  className = '',
}: ErpListToolbarProps) {
  return (
    <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        {children}
        {hasActiveFilters && onClearFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-text-soft hover:text-text-base gap-1"
          >
            <X className="h-4 w-4" aria-hidden />
            {clearFiltersLabel}
          </Button>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
