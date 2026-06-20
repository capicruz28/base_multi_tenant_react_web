import { useEffect, useRef } from 'react';
import type { ErpPaginatedResponse } from '@/core/list/erp-list.types';

export type PlatformCatalogListPagination = Pick<
  ErpPaginatedResponse<unknown>,
  'total' | 'pagina_actual' | 'total_paginas' | 'limit'
>;

/**
 * WP-06.1 — Evita skeleton/parpadeo en refetch por cambio de queryKey (§7.5 sin keepPreviousData).
 * Patrón page-level para catálogos globales FA-001.
 */
export function useStablePlatformCatalogListView<T>(
  items: T[],
  pagination: PlatformCatalogListPagination | undefined,
  isLoading: boolean,
  isFetching: boolean,
) {
  const lastSettledItemsRef = useRef<T[]>([]);
  const lastSettledPaginationRef = useRef<PlatformCatalogListPagination | undefined>(undefined);

  useEffect(() => {
    if (!isFetching) {
      lastSettledItemsRef.current = items;
      if (pagination) {
        lastSettledPaginationRef.current = pagination;
      }
    }
  }, [isFetching, items, pagination]);

  const displayItems =
    isFetching && items.length === 0 && lastSettledItemsRef.current.length > 0
      ? lastSettledItemsRef.current
      : items;

  const displayPagination =
    pagination ??
    (isFetching ? lastSettledPaginationRef.current : undefined);

  /** SK-01: skeleton solo carga inicial sin datos previos (no en cada refetch por buscar). */
  const showInitialSkeleton = isLoading && displayItems.length === 0;

  return { displayItems, displayPagination, showInitialSkeleton };
}
