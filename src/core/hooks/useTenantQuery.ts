/**
 * Hook base para queries con soporte de tenant
 * 
 * Este hook asegura que todas las queries incluyan el tenantId en sus keys,
 * previniendo mezcla de datos entre tenants.
 */
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useTenant } from '../../features/tenant/components/TenantContext';

/**
 * Hook para queries que requieren tenantId
 * 
 * @example
 * const { data, isLoading } = useTenantQuery({
 *   queryKey: ['clientes'],
 *   queryFn: () => clienteService.getClientes(),
 * });
 * 
 * // La key final será: ['clientes', tenantId, ...rest]
 */
export function useTenantQuery<TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'queryKey'> & {
    queryKey: readonly unknown[];
    requireTenant?: boolean; // Si true, la query solo se ejecuta si hay tenant válido
  }
): UseQueryResult<TData, TError> {
  const { tenantId, isTenantValid } = useTenant();
  const { queryKey, requireTenant = true, enabled, ...restOptions } = options;

  // Construir la key con tenantId
  const tenantAwareKey = tenantId 
    ? [...queryKey, tenantId] 
    : queryKey;

  // Si requireTenant es true y no hay tenant válido, deshabilitar la query
  const isEnabled = requireTenant 
    ? isTenantValid && (enabled !== false)
    : enabled !== false;

  return useQuery<TData, TError>({
    ...restOptions,
    queryKey: tenantAwareKey,
    enabled: isEnabled,
  });
}

