import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { getErrorMessage } from '@/core/services/error.service';

import { provisioningService } from '../services/provisioning.service';
import type { ProvisioningAbortResponse } from '../types/provisioning.types';
import { provisioningStatusQueryKey } from './useProvisioningStatus';

const ABORT_REASON_MAX_LENGTH = 500;

export interface AbortProvisioningVariables {
  clienteId: string;
  reason?: string;
}

/**
 * POST provisioning/abort — toast de error únicamente en onError (ER-02).
 */
export function useAbortProvisioning() {
  const queryClient = useQueryClient();

  return useMutation<ProvisioningAbortResponse, Error, AbortProvisioningVariables>({
    mutationFn: ({ clienteId, reason }) => {
      const trimmed = reason?.trim();
      if (trimmed && trimmed.length > ABORT_REASON_MAX_LENGTH) {
        throw new Error(
          `El motivo de cancelación no puede superar ${ABORT_REASON_MAX_LENGTH} caracteres.`,
        );
      }
      return provisioningService.abortProvisioning(clienteId, trimmed);
    },
    onSuccess: (data, { clienteId }) => {
      void queryClient.invalidateQueries({
        queryKey: provisioningStatusQueryKey(clienteId),
      });
      toast.success(data.message || 'Provisioning abortado.');
    },
    onError: (error) => {
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al abortar el provisioning.');
    },
  });
}
