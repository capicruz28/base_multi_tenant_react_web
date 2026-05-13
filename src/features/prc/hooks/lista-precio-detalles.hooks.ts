import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { listaPrecioDetalleService } from '../services/prc.service';
import type { ListaPrecioDetalle, ListaPrecioDetalleCreate, ListaPrecioDetalleUpdate } from '../types/prc.types';

export const listaPrecioDetalleQueryKeys = {
  list: (
    listaPrecioId: string,
    p?: { producto_id?: string; solo_activos?: boolean }
  ) =>
    [
      'prc',
      'lista-precio-detalle',
      'list',
      listaPrecioId,
      p?.producto_id ?? '',
      p?.solo_activos ?? true,
    ] as const,
  detail: (detalleId: string) => ['prc', 'lista-precio-detalle', 'detail', detalleId] as const,
};

export function useListaPrecioDetalles(
  listaPrecioId: string | null | undefined,
  options?: { producto_id?: string; solo_activos?: boolean; enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!listaPrecioId;
  const productoId = options?.producto_id;
  const soloActivos = options?.solo_activos ?? true;

  return useTenantQuery<ListaPrecioDetalle[], Error>({
    queryKey: listaPrecioDetalleQueryKeys.list(listaPrecioId ?? '', {
      producto_id: productoId,
      solo_activos: soloActivos,
    }),
    queryFn: () =>
      listaPrecioDetalleService.list(listaPrecioId ?? '', {
        producto_id: productoId,
        solo_activos: soloActivos,
      }),
    enabled,
  });
}

export function useListaPrecioDetalle(
  detalleId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!detalleId;

  return useTenantQuery<ListaPrecioDetalle, Error>({
    queryKey: listaPrecioDetalleQueryKeys.detail(detalleId ?? ''),
    queryFn: () => listaPrecioDetalleService.getById(detalleId ?? ''),
    enabled,
  });
}

export function useCreateListaPrecioDetalle() {
  const qc = useQueryClient();

  return useMutation<ListaPrecioDetalle, Error, { listaPrecioId: string; payload: ListaPrecioDetalleCreate }>({
    mutationFn: ({ listaPrecioId, payload }) => listaPrecioDetalleService.create(listaPrecioId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio-detalle', 'list', vars.listaPrecioId] });
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio', 'detail', vars.listaPrecioId] });
      toast.success('Detalle agregado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateListaPrecioDetalle() {
  const qc = useQueryClient();

  return useMutation<
    ListaPrecioDetalle,
    Error,
    { detalleId: string; listaPrecioId: string; payload: ListaPrecioDetalleUpdate }
  >({
    mutationFn: ({ detalleId, payload }) => listaPrecioDetalleService.update(detalleId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: listaPrecioDetalleQueryKeys.detail(vars.detalleId) });
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio-detalle', 'list', vars.listaPrecioId] });
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio', 'detail', vars.listaPrecioId] });
      toast.success('Detalle actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
