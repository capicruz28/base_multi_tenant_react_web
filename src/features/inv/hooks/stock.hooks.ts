import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { stockService } from '../services/inv.service';
import type { Stock } from '../types/inv.types';

const qk = {
  list: (empresaId?: string, productoId?: string, almacenId?: string) =>
    ['inv', 'stock', 'list', empresaId ?? '', productoId ?? '', almacenId ?? ''] as const,
  alertas: (empresaId?: string, almacenId?: string) =>
    ['inv', 'stock', 'alertas', empresaId ?? '', almacenId ?? ''] as const,
  porProductoAlmacen: (productoId?: string, almacenId?: string) =>
    ['inv', 'stock', 'por-producto-almacen', productoId ?? '', almacenId ?? ''] as const,
  detail: (stockId: string) => ['inv', 'stock', 'detail', stockId] as const,
};

export function useStocks(options?: {
  empresa_id?: string;
  producto_id?: string;
  almacen_id?: string;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const productoId = options?.producto_id;
  const almacenId = options?.almacen_id;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Stock[], Error>({
    queryKey: qk.list(empresaId, productoId, almacenId),
    queryFn: () => stockService.list({ empresa_id: empresaId, producto_id: productoId, almacen_id: almacenId }),
    enabled,
  });
}

export function useStockAlertas(options?: { empresa_id?: string; almacen_id?: string; enabled?: boolean }) {
  const empresaId = options?.empresa_id;
  const almacenId = options?.almacen_id;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Stock[], Error>({
    queryKey: qk.alertas(empresaId, almacenId),
    queryFn: () => stockService.alertas({ empresa_id: empresaId, almacen_id: almacenId }),
    enabled,
  });
}

export function useStockPorProductoAlmacen(
  productoId: string | null | undefined,
  almacenId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!productoId && !!almacenId;

  return useTenantQuery<Stock | null, Error>({
    queryKey: qk.porProductoAlmacen(productoId ?? '', almacenId ?? ''),
    queryFn: () => stockService.getByProductoAlmacen(productoId ?? '', almacenId ?? ''),
    enabled,
  });
}

export function useStock(stockId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!stockId;

  return useTenantQuery<Stock, Error>({
    queryKey: qk.detail(stockId ?? ''),
    queryFn: () => stockService.getById(stockId ?? ''),
    enabled,
  });
}

