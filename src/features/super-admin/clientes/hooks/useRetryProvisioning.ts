import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { getErrorMessage } from '@/core/services/error.service';

import { provisioningService } from '../services/provisioning.service';
import type { ProvisioningRetryResponse } from '../types/provisioning.types';
import { provisioningStatusQueryKey } from './useProvisioningStatus';

/**
 * POST provisioning/retry (202) — toast de error únicamente en onError (ER-02).
 */
export function useRetryProvisioning() {
  const queryClient = useQueryClient();

  return useMutation<ProvisioningRetryResponse, Error, string>({
    mutationFn: (clienteId) => provisioningService.retryProvisioning(clienteId),
    onSuccess: (data, clienteId) => {
      void queryClient.invalidateQueries({
        queryKey: provisioningStatusQueryKey(clienteId),
      });
      toast.success(data.message || 'Reintento de provisioning iniciado.');
    },
    onError: (error) => {
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al reintentar el provisioning.');
    },
  });
}
