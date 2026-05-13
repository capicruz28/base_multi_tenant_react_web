import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { inventarioFisicoService } from '../services/inv.service';
import type {
  AprobarInventarioFisicoRequest,
  InventarioFisico,
  InventarioFisicoCreate,
  InventarioFisicoUpdate,
} from '../types/inv.types';

const qk = {
  list: (empresaId?: string, almacenId?: string, estado?: string, fechaDesde?: string, fechaHasta?: string) =>
    [
      'inv',
      'inventario-fisico',
      'list',
      empresaId ?? '',
      almacenId ?? '',
      estado ?? '',
      fechaDesde ?? '',
      fechaHasta ?? '',
    ] as const,
  detail: (inventarioFisicoId: string) => ['inv', 'inventario-fisico', 'detail', inventarioFisicoId] as const,
};

export function useInventariosFisicos(options?: {
  empresa_id?: string;
  almacen_id?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;
  return useTenantQuery<InventarioFisico[], Error>({
    queryKey: qk.list(options?.empresa_id, options?.almacen_id, options?.estado, options?.fecha_desde, options?.fecha_hasta),
    queryFn: () =>
      inventarioFisicoService.list({
        empresa_id: options?.empresa_id,
        almacen_id: options?.almacen_id,
        estado: options?.estado,
        fecha_desde: options?.fecha_desde,
        fecha_hasta: options?.fecha_hasta,
      }),
    enabled,
  });
}

export function useInventarioFisico(inventarioFisicoId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!inventarioFisicoId;

  return useTenantQuery<InventarioFisico, Error>({
    queryKey: qk.detail(inventarioFisicoId ?? ''),
    queryFn: () => inventarioFisicoService.getById(inventarioFisicoId ?? ''),
    enabled,
  });
}

export function useCreateInventarioFisico() {
  const qc = useQueryClient();

  return useMutation<InventarioFisico, Error, InventarioFisicoCreate>({
    mutationFn: (payload) => inventarioFisicoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      toast.success('Inventario físico creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateInventarioFisico() {
  const qc = useQueryClient();

  return useMutation<InventarioFisico, Error, { inventarioFisicoId: string; payload: InventarioFisicoUpdate }>({
    mutationFn: ({ inventarioFisicoId, payload }) => inventarioFisicoService.update(inventarioFisicoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId) });
      toast.success('Inventario físico actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularInventarioFisico() {
  const qc = useQueryClient();

  return useMutation<InventarioFisico, Error, { inventarioFisicoId: string }>({
    mutationFn: ({ inventarioFisicoId }) => inventarioFisicoService.anular(inventarioFisicoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId) });
      toast.success('Inventario físico anulado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAprobarInventarioFisico() {
  const qc = useQueryClient();

  return useMutation<
    InventarioFisico,
    Error,
    { inventarioFisicoId: string; payload: AprobarInventarioFisicoRequest }
  >({
    mutationFn: ({ inventarioFisicoId, payload }) => inventarioFisicoService.aprobar(inventarioFisicoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId) });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'list'] });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'alertas'] });
      toast.success('Inventario físico aprobado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

