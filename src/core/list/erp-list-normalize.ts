import type { ErpListPaginationMeta, ErpListTier, ErpPaginatedResponse } from './erp-list.types';

/** Type guard — envelope paginado vs legacy `list[]`. */
export function isPaginated<T>(data: unknown): data is ErpPaginatedResponse<T> {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'items' in data &&
    Array.isArray((data as ErpPaginatedResponse<T>).items)
  );
}

/**
 * Normaliza respuesta API a envelope único para UI.
 * Legacy `list[]` → envelope sintético (Tier A / transición).
 */
export function normalizeListResponse<T>(
  data: T[] | ErpPaginatedResponse<T>,
  _tier?: ErpListTier,
): ErpPaginatedResponse<T> {
  if (isPaginated<T>(data)) {
    return data;
  }
  const items = Array.isArray(data) ? data : [];
  return {
    items,
    total: items.length,
    pagina_actual: 1,
    total_paginas: items.length > 0 ? 1 : 0,
    limit: items.length,
  };
}

/** Extrae solo `items` — compatibilidad hooks legacy sin paginación. */
export function unwrapListItems<T>(data: T[] | ErpPaginatedResponse<T>): T[] {
  if (isPaginated<T>(data)) return data.items;
  return Array.isArray(data) ? data : [];
}

/** Deriva navegación sin `has_next`/`has_prev` (contrato §2). */
export function derivePaginationMeta(response: ErpPaginatedResponse<unknown>): ErpListPaginationMeta {
  const { total, pagina_actual, total_paginas, limit } = response;
  return {
    total,
    pagina_actual,
    total_paginas,
    limit,
    hasPrev: pagina_actual > 1,
    hasNext: pagina_actual < total_paginas,
  };
}
