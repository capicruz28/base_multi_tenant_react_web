import { useQuery } from '@tanstack/react-query';

import { provisioningService } from '../services/provisioning.service';
import type { DedicatedProvisioningStatusRead } from '../types/provisioning.types';

export const provisioningStatusQueryKey = (clienteId: string) =>
  ['provisioning-status', clienteId] as const;

export interface UseProvisioningStatusOptions {
  enabled?: boolean;
  /** URL relativa/absoluta del 201 — prioridad sobre URL canónica. */
  statusUrl?: string;
}

/**
 * Consulta puntual de GET provisioning-status (sin polling).
 */
export function useProvisioningStatus(
  clienteId: string | undefined,
  options?: UseProvisioningStatusOptions,
) {
  const enabled = Boolean(clienteId) && (options?.enabled ?? true);

  return useQuery<DedicatedProvisioningStatusRead, Error>({
    queryKey: [...provisioningStatusQueryKey(clienteId ?? ''), options?.statusUrl ?? ''],
    queryFn: () =>
      provisioningService.getProvisioningStatus(clienteId!, {
        statusUrl: options?.statusUrl,
      }),
    enabled,
  });
}
