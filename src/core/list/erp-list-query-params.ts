import { ERP_LIST_DEFAULT_LIMIT, ERP_LIST_MAX_LIMIT } from './erp-list.constants';
import type { ErpListQueryBase } from './erp-list.types';

export type ErpListQueryParamValue = string | number | boolean;

/**
 * Añade page/limit/buscar/sort al objeto query.
 * Reglas contrato: `limit` solo con `page`; `sort_dir` solo con `sort_by`.
 */
export function appendErpListPaginationSort(
  query: Record<string, ErpListQueryParamValue>,
  listQuery?: Partial<ErpListQueryBase>,
): void {
  const buscar = listQuery?.buscar?.trim();
  if (buscar) {
    query.buscar = buscar;
  }

  if (listQuery?.page != null && listQuery.page >= 1) {
    query.page = listQuery.page;
    const limit = listQuery.limit ?? ERP_LIST_DEFAULT_LIMIT;
    query.limit = Math.min(Math.max(1, limit), ERP_LIST_MAX_LIMIT);
  }

  if (listQuery?.sort_by) {
    query.sort_by = listQuery.sort_by;
    if (listQuery.sort_dir) {
      query.sort_dir = listQuery.sort_dir;
    }
  }
}

/**
 * Construye query HTTP mezclando filtros de dominio + params transversales PERF.
 */
export function buildErpListQueryParams(
  base: Record<string, ErpListQueryParamValue | undefined | null>,
  listQuery?: Partial<ErpListQueryBase>,
): Record<string, ErpListQueryParamValue> {
  const query: Record<string, ErpListQueryParamValue> = {};

  for (const [key, value] of Object.entries(base)) {
    if (value === undefined || value === null || value === '') continue;
    query[key] = value;
  }

  appendErpListPaginationSort(query, listQuery);
  return query;
}

/** Params efectivos para fetch según tier y estado UI. */
export function resolveErpListFetchParams(
  base: Partial<ErpListQueryBase>,
  config: { tier: 'A' | 'B' | 'C'; forcePagination?: boolean; defaultLimit?: number },
  state: {
    page: number;
    limit: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    debouncedBuscar?: string;
  },
): Partial<ErpListQueryBase> {
  const shouldPaginate =
    config.forcePagination === true || config.tier === 'C' || base.page != null;

  const merged: Partial<ErpListQueryBase> = {
    ...base,
    buscar: state.debouncedBuscar?.trim() || base.buscar,
    sort_by: state.sort_by ?? base.sort_by,
    sort_dir: state.sort_dir ?? base.sort_dir,
  };

  if (shouldPaginate) {
    merged.page = state.page;
    merged.limit = state.limit ?? config.defaultLimit ?? ERP_LIST_DEFAULT_LIMIT;
  }

  return merged;
}
