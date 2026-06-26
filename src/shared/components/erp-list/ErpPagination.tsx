import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { derivePaginationMeta } from '@/core/list/erp-list-normalize';
import type { ErpPaginatedResponse } from '@/core/list/erp-list.types';

export interface ErpPaginationProps {
  /** Respuesta normalizada o metadatos mínimos. */
  pagination: Pick<
    ErpPaginatedResponse<unknown>,
    'total' | 'pagina_actual' | 'total_paginas' | 'limit'
  >;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: readonly number[];
  disabled?: boolean;
  className?: string;
  /** Reemplaza el resumen por defecto (consolidación copy dual). */
  summarySlot?: ReactNode;
}

const DEFAULT_LIMIT_OPTIONS = [25, 50, 100] as const;

/**
 * Paginador server-side — sin has_next/has_prev (contrato §2).
 */
export function ErpPagination({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = DEFAULT_LIMIT_OPTIONS,
  disabled = false,
  className = '',
  summarySlot,
}: ErpPaginationProps) {
  const meta = derivePaginationMeta({
    items: [],
    ...pagination,
  });

  if (meta.total_paginas <= 1 && meta.total <= meta.limit && !onLimitChange) {
    return null;
  }

  const rangeStart = meta.total === 0 ? 0 : (meta.pagina_actual - 1) * meta.limit + 1;
  const rangeEnd = Math.min(meta.pagina_actual * meta.limit, meta.total);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border-base bg-subtle ${className}`.trim()}
    >
      <div className="text-sm text-text-soft">
        {summarySlot ?? (
          <>
            {meta.total === 0 ? (
              'Sin registros'
            ) : (
              <>
                Mostrando <span className="font-medium text-text-base">{rangeStart}</span> a{' '}
                <span className="font-medium text-text-base">{rangeEnd}</span> de{' '}
                <span className="font-medium text-text-base">{meta.total}</span>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange ? (
          <label className="flex items-center gap-2 text-sm text-text-soft">
            <span>Por página</span>
            <select
              value={meta.limit}
              disabled={disabled}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 border border-border-base rounded-md bg-surface text-text-base text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !meta.hasPrev}
          onClick={() => onPageChange(meta.pagina_actual - 1)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Anterior
        </Button>
        <span className="text-sm text-text-base px-1">
          Página {meta.pagina_actual} de {Math.max(meta.total_paginas, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !meta.hasNext}
          onClick={() => onPageChange(meta.pagina_actual + 1)}
          className="gap-1"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
