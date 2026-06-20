import type { ErpPaginatedResponse } from '@/core/list';
import type { PaginatedRolResponse, Rol } from '../types/rol.types';

/** Adaptador envelope IAM → ErpPaginatedResponse (LR-N01). */
export function normalizePaginatedRolResponse(
  data: PaginatedRolResponse,
  limit: number,
): ErpPaginatedResponse<Rol> {
  return {
    items: data.roles,
    total: data.total_roles,
    pagina_actual: data.pagina_actual,
    total_paginas: data.total_paginas,
    limit,
  };
}
