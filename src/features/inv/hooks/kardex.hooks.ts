import { useEffect, useMemo } from 'react';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useErpListQuery, type ErpListResourceConfig } from '@/core/list';
import { buildInvListQuery, invFetchList, kardexService } from '../services/inv.service';
import type { InvListParams, KardexLineaRead } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

/** Whitelist sort + Tier C — FRONTEND_LISTADOS_CONTRACT_V1 §4 INV kardex. */
export const KARDEX_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'C',
  sortableColumns: ['fecha_movimiento', 'cantidad_base', 'costo_unitario'],
  defaultLimit: 50,
  forcePagination: true,
  defaultSort: { sort_by: 'fecha_movimiento', sort_dir: 'desc' },
};

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

/** Gate estricto: requiere `producto_id` no vacío antes de fetch (contrato §6.8). */
function resolveKardexProductoId(productoId?: string): string {
  return (productoId ?? '').trim();
}

export function useKardexErpList(options?: {
  producto_id?: string;
  almacen_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const productoId = resolveKardexProductoId(options?.producto_id);
  const hasProductoId = productoId.length > 0;
  const enabled = gateEnabled && hasProductoId && (options?.enabled ?? true);

  const baseFilters = useMemo(
    () => ({
      empresa_id: scopeEmpresaId ?? undefined,
      producto_id: productoId,
      almacen_id: options?.almacen_id,
      fecha_desde: options?.fecha_desde,
      fecha_hasta: options?.fecha_hasta,
    }),
    [scopeEmpresaId, productoId, options?.almacen_id, options?.fecha_desde, options?.fecha_hasta],
  );

  const listQuery = useErpListQuery<KardexLineaRead, typeof baseFilters>({
    queryKeyPrefix: ['inv', 'kardex', 'list', scopeEmpresaId ?? '', productoId],
    fetcher: (params) =>
      invFetchList<KardexLineaRead>(
        '/kardex',
        buildInvListQuery(params as InvListParams, { includeSoloActivosDefault: false }),
      ),
    baseFilters,
    config: KARDEX_LIST_CONFIG,
    enabled,
    staleTime: INV_LIST_STALE_TIME_MS,
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [productoId, options?.almacen_id, options?.fecha_desde, options?.fecha_hasta, setPage]);

  return { ...listQuery, hasProductoId };
}

export function useKardex(options?: {
  producto_id?: string;
  almacen_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const productoId = resolveKardexProductoId(options?.producto_id);
  const almacenId = options?.almacen_id ?? '';
  const fechaDesde = options?.fecha_desde ?? '';
  const fechaHasta = options?.fecha_hasta ?? '';
  const enabled = gateEnabled && productoId.length > 0 && (options?.enabled ?? true);

  return useTenantQuery<KardexLineaRead[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', productoId, almacenId, fechaDesde, fechaHasta),
    queryFn: () =>
      kardexService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        producto_id: productoId,
        almacen_id: options?.almacen_id,
        fecha_desde: options?.fecha_desde,
        fecha_hasta: options?.fecha_hasta,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}
