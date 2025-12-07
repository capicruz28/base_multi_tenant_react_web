/**
 * Hook para gestión de clientes con React Query
 * 
 * Este hook encapsula la lógica de fetching de clientes usando React Query
 * con soporte de tenant. Para super-admin, el tenantId puede ser null.
 */
import { useQuery } from '@tanstack/react-query';
import { clienteService } from '@/features/super-admin/clientes/services/cliente.service';
import { ClienteListResponse, ClienteFilters } from '@/features/super-admin/clientes/types/cliente.types';
import { useTenant } from '../../features/tenant/components/TenantContext';
import { useAuth } from '../../shared/context/AuthContext';

interface UseClientesOptions {
  pagina?: number;
  limite?: number;
  filtros?: ClienteFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener lista de clientes
 * 
 * @example
 * const { data, isLoading, error } = useClientes({
 *   pagina: 1,
 *   limite: 10,
 *   filtros: { buscar: 'acme' }
 * });
 */
export function useClientes(options: UseClientesOptions = {}) {
  const { pagina = 1, limite = 10, filtros, enabled = true } = options;
  const { tenantId } = useTenant();
  const { isSuperAdmin } = useAuth();

  // Para super-admin, no requerimos tenantId (puede ser null)
  // Para otros usuarios, requerimos tenantId válido
  const requireTenant = !isSuperAdmin;

  return useQuery<ClienteListResponse, Error>({
    queryKey: ['clientes', tenantId, pagina, limite, filtros],
    queryFn: () => clienteService.getClientes(pagina, limite, filtros),
    enabled: enabled && (isSuperAdmin || (requireTenant && !!tenantId)),
    staleTime: 2 * 60 * 1000, // 2 minutos - datos de clientes cambian poco
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

