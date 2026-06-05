import type { QueryClient } from '@tanstack/react-query';
import { parametroQueryKeys } from '../hooks/parametro-query-keys';

export function invalidateOrgParametroQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: parametroQueryKeys.allListsPrefix });
  void queryClient.invalidateQueries({ queryKey: parametroQueryKeys.legacyListPrefix });
}

export function removeOrgParametroQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: parametroQueryKeys.allListsPrefix });
  queryClient.removeQueries({ queryKey: parametroQueryKeys.legacyListPrefix });
}
