import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { inventarioFisicoDetalleService } from '../services/inv.service';
import type {
  InventarioFisicoDetalleCreate,
  InventarioFisicoDetalleRead,
  InventarioFisicoDetalleUpdate,
} from '../types/inv.types';

const qk = {
  list: (empresaId?: string, inventarioFisicoId?: string, productoId?: string) =>
    ['inv', 'inventario-fisico-detalle', 'list', empresaId ?? '', inventarioFisicoId ?? '', productoId ?? ''] as const,
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
    queryFn: () => inventarioFisicoDetalleService.getById(inventarioFisicoDetalleId ?? ''),
    enabled,
  });
}

export function useCreateInventarioFisicoDetalle() {
  const qc = useQueryClient();

  return useMutation<InventarioFisicoDetalleRead, Error, InventarioFisicoDetalleCreate>({
    mutationFn: (payload) => inventarioFisicoDetalleService.create(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico-detalle', 'list'] });
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'detail', vars.inventario_fisico_id] });
      toast.success('Línea agregada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateInventarioFisicoDetalle() {
  const qc = useQueryClient();

  return useMutation<
    InventarioFisicoDetalleRead,
    Error,
    { inventarioFisicoDetalleId: string; payload: InventarioFisicoDetalleUpdate; inventarioFisicoId?: string }
  >({
    mutationFn: ({ inventarioFisicoDetalleId, payload }) =>
      inventarioFisicoDetalleService.update(inventarioFisicoDetalleId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico-detalle', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoDetalleId) });
      if (vars.inventarioFisicoId) {
        qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'detail', vars.inventarioFisicoId] });
      }
      toast.success('Línea actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

