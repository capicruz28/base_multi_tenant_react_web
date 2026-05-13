import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { movimientoDetalleService } from '../services/inv.service';
import type { MovimientoDetalleCreate, MovimientoDetalleRead, MovimientoDetalleUpdate } from '../types/inv.types';

const qk = {
  list: (empresaId?: string, movimientoId?: string, productoId?: string) =>
    ['inv', 'movimiento-detalle', 'list', empresaId ?? '', movimientoId ?? '', productoId ?? ''] as const,
  detail: (movimientoDetalleId: string) => ['inv', 'movimiento-detalle', 'detail', movimientoDetalleId] as const,
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
    enabled,
  });
}

export function useMovimientoDetalle(movimientoDetalleId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!movimientoDetalleId;

  return useTenantQuery<MovimientoDetalleRead, Error>({
    queryKey: qk.detail(movimientoDetalleId ?? ''),
    queryFn: () => movimientoDetalleService.getById(movimientoDetalleId ?? ''),
    enabled,
  });
}

export function useCreateMovimientoDetalle() {
  const qc = useQueryClient();

  return useMutation<MovimientoDetalleRead, Error, MovimientoDetalleCreate>({
    mutationFn: (payload) => movimientoDetalleService.create(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento-detalle', 'list'] });
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'detail', vars.movimiento_id] });
      toast.success('Línea agregada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateMovimientoDetalle() {
  const qc = useQueryClient();

  return useMutation<
    MovimientoDetalleRead,
    Error,
    { movimientoDetalleId: string; payload: MovimientoDetalleUpdate; movimientoId?: string }
  >({
    mutationFn: ({ movimientoDetalleId, payload }) => movimientoDetalleService.update(movimientoDetalleId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento-detalle', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoDetalleId) });
      if (vars.movimientoId) qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'detail', vars.movimientoId] });
      toast.success('Línea actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

