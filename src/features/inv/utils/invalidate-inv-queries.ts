import type { QueryClient } from '@tanstack/react-query';

/** Prefijo de todas las queries React Query del módulo INV. */
export const INV_QUERY_KEY_PREFIX = ['inv'] as const;

/**
 * Invalida caché INV tras cambio de empresa activa (JWT) o tenant.
 * Complementa `queryClient.clear()` global en auth.
 */
export function invalidateInvQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: [...INV_QUERY_KEY_PREFIX] });
}

export function removeInvQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: [...INV_QUERY_KEY_PREFIX] });
}
