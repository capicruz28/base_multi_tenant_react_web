import type { ErpPaginatedResponse } from '@/core/list';
import type {
  AdminSessionRead,
  PaginatedAdminSessionsResponse,
} from '@/features/admin/types/session.types';

export function isPaginatedAdminSessionsResponse(
  data: unknown,
): data is PaginatedAdminSessionsResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'sessions' in data &&
    Array.isArray((data as PaginatedAdminSessionsResponse).sessions)
  );
}

/**
 * Normaliza legacy `AdminSessionRead[]` o envelope paginado → ErpPaginatedResponse.
 * Legacy: aplica slice client-side según page/limit solicitados.
 */
export function normalizeAdminSessionsResponse(
  data: AdminSessionRead[] | PaginatedAdminSessionsResponse,
  page: number,
  limit: number,
): ErpPaginatedResponse<AdminSessionRead> {
  if (isPaginatedAdminSessionsResponse(data)) {
    return {
      items: data.sessions,
      total: data.total_sesiones,
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
