import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { tipoMovimientoService } from '../services/inv.service';
import type { TipoMovimiento, TipoMovimientoCreate, TipoMovimientoUpdate } from '../types/inv.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean) =>
    ['inv', 'tipo-movimiento', 'list', empresaId ?? '', soloActivos] as const,
  detail: (tipoMovimientoId: string) => ['inv', 'tipo-movimiento', 'detail', tipoMovimientoId] as const,
};

export function useTiposMovimiento(options?: { empresa_id?: string; solo_activos?: boolean; enabled?: boolean }) {
  const empresaId = options?.empresa_id;
  const soloActivos = options?.solo_activos ?? true;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<TipoMovimiento[], Error>({
    queryKey: qk.list(empresaId, soloActivos),
    queryFn: () => tipoMovimientoService.list({ empresa_id: empresaId, solo_activos: soloActivos }),
    enabled,
  });
}

export function useTipoMovimiento(tipoMovimientoId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!tipoMovimientoId;

  return useTenantQuery<TipoMovimiento, Error>({
    queryKey: qk.detail(tipoMovimientoId ?? ''),
    queryFn: () => tipoMovimientoService.getById(tipoMovimientoId ?? ''),
    enabled,
  });
}

export function useCreateTipoMovimiento() {
  const qc = useQueryClient();

  return useMutation<TipoMovimiento, Error, TipoMovimientoCreate>({
    mutationFn: (payload) => tipoMovimientoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      toast.success('Tipo de movimiento creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateTipoMovimiento() {
  const qc = useQueryClient();

  return useMutation<TipoMovimiento, Error, { tipoMovimientoId: string; payload: TipoMovimientoUpdate }>({
    mutationFn: ({ tipoMovimientoId, payload }) => tipoMovimientoService.update(tipoMovimientoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.tipoMovimientoId) });
      toast.success('Tipo de movimiento actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteTipoMovimiento() {
  const qc = useQueryClient();

  return useMutation<void, Error, { tipoMovimientoId: string }>({
    mutationFn: ({ tipoMovimientoId }) => tipoMovimientoService.delete(tipoMovimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.tipoMovimientoId) });
      toast.success('Tipo de movimiento eliminado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarTipoMovimiento() {
  const qc = useQueryClient();

  return useMutation<TipoMovimiento, Error, { tipoMovimientoId: string }>({
    mutationFn: ({ tipoMovimientoId }) => tipoMovimientoService.reactivar(tipoMovimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.tipoMovimientoId) });
      toast.success('Tipo de movimiento reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

