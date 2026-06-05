/**
 * Hooks de Movimiento Detalle (solo lectura directa).
 * Las mutaciones de creación/edición de líneas se gestionan desde
 * movimientos.hooks.ts usando los endpoints con-detalle.
 */
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { movimientoDetalleService } from '../services/inv.service';
import type { MovimientoDetalleRead } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';

const qk = {
  list: (empresaId?: string, movimientoId?: string, productoId?: string) =>
    ['inv', 'movimiento-detalle', 'list', empresaId ?? '', movimientoId ?? '', productoId ?? ''] as const,
  detail: (movimientoDetalleId: string) =>
    ['inv', 'movimiento-detalle', 'detail', movimientoDetalleId] as const,
};

export function useMovimientosDetalle(options?: {
  empresa_id?: string;
  movimiento_id?: string;
  producto_id?: string;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;

  return useTenantQuery<MovimientoDetalleRead[], Error>({
    queryKey: qk.list(options?.empresa_id, options?.movimiento_id, options?.producto_id),
    queryFn: () =>
      movimientoDetalleService.list({
        empresa_id: options?.empresa_id,
        movimiento_id: options?.movimiento_id,
        producto_id: options?.producto_id,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useMovimientoDetalle(
  movimientoDetalleId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!movimientoDetalleId;

  return useTenantQuery<MovimientoDetalleRead, Error>({
    queryKey: qk.detail(movimientoDetalleId ?? ''),
    queryFn: () => movimientoDetalleService.getById(movimientoDetalleId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}
