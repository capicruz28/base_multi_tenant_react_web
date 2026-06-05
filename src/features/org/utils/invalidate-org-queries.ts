import type { QueryClient } from '@tanstack/react-query';
import { invalidateOrgParametroQueries } from './invalidate-org-parametro-queries';

/** Prefijo de todas las queries React Query del módulo ORG. */
export const ORG_QUERY_KEY_PREFIX = ['org'] as const;

/**
 * Invalida caché ORG tras cambio de empresa activa (JWT) o tenant.
 * Complementa `queryClient.clear()` global en auth.
 */
export function invalidateOrgQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: [...ORG_QUERY_KEY_PREFIX] });
  invalidateOrgParametroQueries(queryClient);
}

export function removeOrgQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: [...ORG_QUERY_KEY_PREFIX] });
}
