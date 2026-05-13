import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { unidadMedidaService } from '../services/inv.service';
import type { UnidadMedida, UnidadMedidaCreate, UnidadMedidaUpdate } from '../types/inv.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean) =>
    ['inv', 'unidad-medida', 'list', empresaId ?? '', soloActivos] as const,
  detail: (unidadMedidaId: string) => ['inv', 'unidad-medida', 'detail', unidadMedidaId] as const,
};

export function useUnidadesMedida(options?: { empresa_id?: string; solo_activos?: boolean; enabled?: boolean }) {
  const empresaId = options?.empresa_id;
  const soloActivos = options?.solo_activos ?? true;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<UnidadMedida[], Error>({
    queryKey: qk.list(empresaId, soloActivos),
    queryFn: () => unidadMedidaService.list({ empresa_id: empresaId, solo_activos: soloActivos }),
    enabled,
  });
}

export function useUnidadMedida(unidadMedidaId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!unidadMedidaId;

  return useTenantQuery<UnidadMedida, Error>({
    queryKey: qk.detail(unidadMedidaId ?? ''),
    queryFn: () => unidadMedidaService.getById(unidadMedidaId ?? ''),
    enabled,
  });
}

export function useCreateUnidadMedida() {
  const qc = useQueryClient();

  return useMutation<UnidadMedida, Error, UnidadMedidaCreate>({
    mutationFn: (payload) => unidadMedidaService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      toast.success('Unidad de medida creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateUnidadMedida() {
  const qc = useQueryClient();

  return useMutation<UnidadMedida, Error, { unidadMedidaId: string; payload: UnidadMedidaUpdate }>({
    mutationFn: ({ unidadMedidaId, payload }) => unidadMedidaService.update(unidadMedidaId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.unidadMedidaId) });
      toast.success('Unidad de medida actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteUnidadMedida() {
  const qc = useQueryClient();

  return useMutation<void, Error, { unidadMedidaId: string }>({
    mutationFn: ({ unidadMedidaId }) => unidadMedidaService.delete(unidadMedidaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.unidadMedidaId) });
      toast.success('Unidad de medida eliminada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarUnidadMedida() {
  const qc = useQueryClient();

  return useMutation<UnidadMedida, Error, { unidadMedidaId: string }>({
    mutationFn: ({ unidadMedidaId }) => unidadMedidaService.reactivar(unidadMedidaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.unidadMedidaId) });
      toast.success('Unidad de medida reactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

