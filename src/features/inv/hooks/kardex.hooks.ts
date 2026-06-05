import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { kardexService } from '../services/inv.service';
import type { KardexLineaRead } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

const qk = {
  list: (
    scopeEmpresaId: string,
    productoId: string,
    almacenId: string,
    fechaDesde: string,
    fechaHasta: string,
  ) =>
    ['inv', 'kardex', 'list', scopeEmpresaId, productoId, almacenId, fechaDesde, fechaHasta] as const,
};

export function useKardex(options?: {
  producto_id?: string;
  almacen_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const productoId = options?.producto_id ?? '';
  const almacenId = options?.almacen_id ?? '';
  const fechaDesde = options?.fecha_desde ?? '';
  const fechaHasta = options?.fecha_hasta ?? '';
  const enabled = gateEnabled && (options?.enabled ?? true);

  return useTenantQuery<KardexLineaRead[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', productoId, almacenId, fechaDesde, fechaHasta),
    queryFn: () =>
      kardexService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        producto_id: options?.producto_id,
        almacen_id: options?.almacen_id,
        fecha_desde: options?.fecha_desde,
        fecha_hasta: options?.fecha_hasta,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}
