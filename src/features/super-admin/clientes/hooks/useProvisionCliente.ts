/**
 * Mutación de provisionamiento de tenant (super-admin).
 * Retorna credenciales iniciales — no persistir fuera de memoria efímera en UI.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { clienteService } from '../services/cliente.service';
import type { ClienteCreate, ClienteCreateResult } from '../types/cliente.types';
import { getErrorMessage, getValidationErrors } from '@/core/services/error.service';
import { useTenant } from '@/features/tenant/components/TenantContext';

export function useProvisionCliente() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation<ClienteCreateResult, Error, ClienteCreate>({
    mutationFn: (data) => clienteService.provisionCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['clientes', tenantId],
      });
    },
    onError: (error) => {
      const { fieldErrors, status } = getValidationErrors(error);
      if ((status === 422 || status === 400) && Object.keys(fieldErrors).length > 0) {
        return;
      }
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al crear el cliente');
    },
  });
}
