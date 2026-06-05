import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { stockService } from '../services/inv.service';
import type { Stock } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

const qk = {
  list: (scopeEmpresaId: string, productoId: string, almacenId: string) =>
    ['inv', 'stock', 'list', scopeEmpresaId, productoId, almacenId] as const,
  alertas: (scopeEmpresaId: string, almacenId: string) =>
    ['inv', 'stock', 'alertas', scopeEmpresaId, almacenId] as const,
  porProductoAlmacen: (productoId: string, almacenId: string) =>
    ['inv', 'stock', 'por-producto-almacen', productoId, almacenId] as const,
  detail: (stockId: string) => ['inv', 'stock', 'detail', stockId] as const,
};

export function useStocks(options?: {
  producto_id?: string;
  almacen_id?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const productoId = options?.producto_id ?? '';
  const almacenId = options?.almacen_id ?? '';
  const enabled = gateEnabled && (options?.enabled ?? true);

  return useTenantQuery<Stock[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', productoId, almacenId),
    queryFn: () =>
      stockService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        producto_id: options?.producto_id,
        almacen_id: options?.almacen_id,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useStockAlertas(options?: { almacen_id?: string; enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const almacenId = options?.almacen_id ?? '';
  const enabled = gateEnabled && (options?.enabled ?? true);

  return useTenantQuery<Stock[], Error>({
    queryKey: qk.alertas(scopeEmpresaId ?? '', almacenId),
    queryFn: () =>
      stockService.alertas({
        empresa_id: scopeEmpresaId ?? undefined,
        almacen_id: options?.almacen_id,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useStockPorProductoAlmacen(
  productoId: string | null | undefined,
  almacenId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true) && !!productoId && !!almacenId;

  return useTenantQuery<Stock | null, Error>({
    queryKey: qk.porProductoAlmacen(productoId ?? '', almacenId ?? ''),
    queryFn: () => stockService.getByProductoAlmacen(productoId ?? '', almacenId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useStock(stockId: string | null | undefined, options?: { enabled?: boolean }) {
  const { enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true) && !!stockId;

  return useTenantQuery<Stock, Error>({
    queryKey: qk.detail(stockId ?? ''),
    queryFn: () => stockService.getById(stockId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}
