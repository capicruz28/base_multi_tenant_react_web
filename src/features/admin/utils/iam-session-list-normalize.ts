import type { ErpPaginatedResponse } from '@/core/list';
import type {
  AdminSessionRead,
  PaginatedAdminSessionsResponse,
} from '@/features/admin/types/session.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isPaginatedAdminSessionsResponse(
  data: unknown,
): data is PaginatedAdminSessionsResponse {
  if (!isRecord(data)) {
    return false;
  }

  const hasItemsEnvelope = Array.isArray(data.items);
  const hasLegacyEnvelope = Array.isArray(data.sessions);

  return hasItemsEnvelope || hasLegacyEnvelope;
}

function resolvePaginatedItems(data: PaginatedAdminSessionsResponse): AdminSessionRead[] {
  if (Array.isArray(data.items)) {
    return data.items;
  }
  return data.sessions ?? [];
}

function resolvePaginatedTotal(data: PaginatedAdminSessionsResponse): number {
  if (typeof data.total === 'number') {
    return data.total;
  }
  return data.total_sesiones ?? 0;
}

/**
 * Normaliza `AdminSessionRead[]` o envelope paginado → ErpPaginatedResponse.
 * Dual envelope: `items`/`total` (canónico) + `sessions`/`total_sesiones` (legacy).
 * Tolerancia superset V2: campos adicionales se preservan en items sin transformación.
 */
export function normalizeAdminSessionsResponse(
  data: AdminSessionRead[] | PaginatedAdminSessionsResponse,
  page: number,
  limit: number,
): ErpPaginatedResponse<AdminSessionRead> {
  if (isPaginatedAdminSessionsResponse(data)) {
    return {
      items: resolvePaginatedItems(data),
      total: resolvePaginatedTotal(data),
      pagina_actual: data.pagina_actual,
      total_paginas: data.total_paginas,
      limit: data.limit,
    };
  }

  const allItems = Array.isArray(data) ? data : [];
  const total = allItems.length;
  const total_paginas = limit > 0 ? Math.ceil(total / limit) : 0;
  const start = (page - 1) * limit;

  return {
    items: allItems.slice(start, start + limit),
    total,
    pagina_actual: page,
    total_paginas,
    limit,
  };
}
