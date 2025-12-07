/**
 * Hooks de mutaciones para gestión de clientes
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { clienteService } from '../services/cliente.service';
import { Cliente, ClienteCreate, ClienteUpdate } from '../types/cliente.types';
import { getErrorMessage } from '../../../../core/services/error.service';
import { useTenant } from '../../../../features/tenant/components/TenantContext';

/**
 * Hook para crear un cliente
 */
export function useCreateCliente() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation<Cliente, Error, ClienteCreate>({
    mutationFn: (data) => clienteService.createCliente(data),
    onSuccess: () => {
      // Invalidar la lista de clientes
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', tenantId] 
      });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error) => {
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al crear el cliente');
    },
  });
}

/**
 * Hook para actualizar un cliente
 */
export function useUpdateCliente() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation<Cliente, Error, { id: string; data: ClienteUpdate }>({
    mutationFn: ({ id, data }) => clienteService.updateCliente(id, data),
    onSuccess: (_, variables) => {
      // Invalidar la lista y el detalle del cliente
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', tenantId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['cliente', variables.id] 
      });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error) => {
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al actualizar el cliente');
    },
  });
}

/**
 * Hook para activar un cliente
 */
export function useActivateCliente() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation<Cliente, Error, string>({
    mutationFn: (id) => clienteService.activateCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', tenantId] 
      });
      toast.success('Cliente activado exitosamente');
    },
    onError: (error) => {
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al activar el cliente');
    },
  });
}

/**
 * Hook para desactivar un cliente
 */
export function useDeactivateCliente() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => clienteService.deactivateCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', tenantId] 
      });
      toast.success('Cliente desactivado exitosamente');
    },
    onError: (error) => {
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al desactivar el cliente');
    },
  });
}

