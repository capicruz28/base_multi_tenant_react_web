import type { ErpPaginatedResponse } from '@/core/list';
import type { PaginatedUsersResponse, UserWithRoles } from '../types/usuario.types';

/** Adaptador envelope IAM → ErpPaginatedResponse (LR-N01). */
export function normalizePaginatedUsersResponse(
  data: PaginatedUsersResponse,
  limit: number,
): ErpPaginatedResponse<UserWithRoles> {
  return {
    items: data.usuarios,
    total: data.total_usuarios,
    pagina_actual: data.pagina_actual,
    total_paginas: data.total_paginas,
    limit,
  };
}
