import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { empresaService } from '../services/org.service';
import type { Empresa } from '../types/org.types';

const qk = {
  list: (soloActivos: boolean, buscar?: string) =>
    ['org', 'empresa', 'tenant-list', soloActivos, (buscar ?? '').trim()] as const,
};

/**
 * Catálogo tenant-scoped de empresas (/org/empresa).
 * NO usar para scope operacional company-scoped (usar useOrgSessionScope.scopeEmpresaId).
 */
export function useEmpresasTenant(options?: {
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Empresa[], Error>({
    queryKey: qk.list(soloActivos, buscar),
    queryFn: () => empresaService.list({ solo_activos: soloActivos, buscar }),
    enabled,
  });
}
