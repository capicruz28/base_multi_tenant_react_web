/**
 * Hooks de Inventario Físico Detalle (solo lectura directa).
 * Las mutaciones de creación/edición de líneas se gestionan desde
 * inventario-fisico.hooks.ts usando los endpoints con-detalle.
 */
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { inventarioFisicoDetalleService } from '../services/inv.service';
import type { InventarioFisicoDetalleRead } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';

const qk = {
  list: (empresaId?: string, inventarioFisicoId?: string, productoId?: string) =>
    [
      'inv',
      'inventario-fisico-detalle',
      'list',
      empresaId ?? '',
      inventarioFisicoId ?? '',
      productoId ?? '',
    ] as const,
  detail: (inventarioFisicoDetalleId: string) =>
    ['inv', 'inventario-fisico-detalle', 'detail', inventarioFisicoDetalleId] as const,
};

export function useInventariosFisicosDetalle(options?: {
  empresa_id?: string;
  inventario_fisico_id?: string;
  producto_id?: string;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;

  return useTenantQuery<InventarioFisicoDetalleRead[], Error>({
    queryKey: qk.list(options?.empresa_id, options?.inventario_fisico_id, options?.producto_id),
    queryFn: () =>
      inventarioFisicoDetalleService.list({
        empresa_id: options?.empresa_id,
        inventario_fisico_id: options?.inventario_fisico_id,
        producto_id: options?.producto_id,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useInventarioFisicoDetalle(
  inventarioFisicoDetalleId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!inventarioFisicoDetalleId;

  return useTenantQuery<InventarioFisicoDetalleRead, Error>({
    queryKey: qk.detail(inventarioFisicoDetalleId ?? ''),
    queryFn: () =>
      inventarioFisicoDetalleService.getById(inventarioFisicoDetalleId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}
