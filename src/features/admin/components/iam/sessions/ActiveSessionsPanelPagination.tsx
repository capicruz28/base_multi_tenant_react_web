import type { ReactNode } from 'react';

import { derivePaginationMeta } from '@/core/list/erp-list-normalize';
import type { ErpPaginatedResponse } from '@/core/list/erp-list.types';
import { ErpPagination } from '@/shared/components/erp-list';
import { ActiveSessionsPaginationDualCopy } from '@/features/admin/components/iam/sessions/ActiveSessionsFilteredResultsMeta';

export interface ActiveSessionsPanelPaginationProps {
  pagination: Pick<
    ErpPaginatedResponse<unknown>,
    'total' | 'pagina_actual' | 'total_paginas' | 'limit'
  >;
  hasActiveFilters: boolean;
  tenantTotal: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: readonly number[];
  disabled?: boolean;
}

/** Paginación con copy dual consolidado en una sola línea (Fase 2 + toolbar UX). */
export function ActiveSessionsPanelPagination({
  pagination,
  hasActiveFilters,
  tenantTotal,
  onPageChange,
  onLimitChange,
  limitOptions,
  disabled = false,
}: ActiveSessionsPanelPaginationProps) {
  const meta = derivePaginationMeta({
    items: [],
    ...pagination,
  });

  const rangeStart = meta.total === 0 ? 0 : (meta.pagina_actual - 1) * meta.limit + 1;
  const rangeEnd = Math.min(meta.pagina_actual * meta.limit, meta.total);

  let summarySlot: ReactNode | undefined;

  if (hasActiveFilters) {
    summarySlot = (
      <ActiveSessionsPaginationDualCopy
        hasActiveFilters
        filteredTotal={meta.total}
        tenantTotal={tenantTotal}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />
    );
  }

  return (
    <ErpPagination
      pagination={pagination}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      limitOptions={limitOptions}
      disabled={disabled}
      summarySlot={summarySlot}
    />
  );
}
