/**
 * Hook base para mutaciones con soporte de tenant
 * 
 * Este hook facilita invalidar queries relacionadas con el tenant
 * después de mutaciones exitosas.
 */
import { 
  useMutation, 
  UseMutationOptions, 
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { useTenant } from '../../features/tenant/components/TenantContext';

/**
 * Hook para mutaciones que requieren tenantId
 * 
 * @example
 * const mutation = useTenantMutation({
 *   mutationFn: (data) => clienteService.createCliente(data),
 *   invalidateQueries: ['clientes'], // Invalidará ['clientes', tenantId]
 * });
 */
export function useTenantMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    invalidateQueries?: readonly unknown[]; // Queries a invalidar después de éxito
  }
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { invalidateQueries, onSuccess, ...restOptions } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...restOptions,
    onSuccess: (data, variables, context) => {
      // Invalidar queries relacionadas con el tenant
      if (invalidateQueries && tenantId && Array.isArray(invalidateQueries)) {
        invalidateQueries.forEach((queryKey) => {
          if (Array.isArray(queryKey)) {
            const tenantAwareKey = [...queryKey, tenantId];
            queryClient.invalidateQueries({ queryKey: tenantAwareKey });
          }
        });
      }

      // Ejecutar onSuccess original si existe
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
  });
}

