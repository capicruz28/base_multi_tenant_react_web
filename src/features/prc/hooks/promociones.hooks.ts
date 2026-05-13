import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { promocionService } from '../services/prc.service';
import type { Promocion, PromocionCreate, PromocionListParams, PromocionUpdate } from '../types/prc.types';

export const promocionQueryKeys = {
  list: (p: PromocionListParams | undefined) =>
    [
      'prc',
      'promocion',
      'list',
      p?.empresa_id ?? '',
      p?.tipo_promocion ?? '',
      p?.aplica_a ?? '',
      p?.producto_id ?? '',
      p?.categoria_id ?? '',
      p?.solo_activos ?? true,
      p?.solo_vigentes ?? false,
      p?.buscar ?? '',
    ] as const,
  detail: (id: string, empresaId?: string) =>
    ['prc', 'promocion', 'detail', id, empresaId ?? ''] as const,
};

export type UsePromocionesOptions = PromocionListParams & { enabled?: boolean };

export function usePromociones(options?: UsePromocionesOptions) {
  const { enabled: enabledOption = true, ...listParams } = options ?? {};
  const params: PromocionListParams | undefined =
    Object.keys(listParams).length > 0 ? (listParams as PromocionListParams) : undefined;

  return useTenantQuery<Promocion[], Error>({
    queryKey: promocionQueryKeys.list(params),
    queryFn: () => promocionService.list(params),
    enabled: enabledOption,
  });
}

export function usePromocion(
  promocionId: string | null | undefined,
  options?: { empresa_id?: string; enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!promocionId;
  const empresaId = options?.empresa_id;

  return useTenantQuery<Promocion, Error>({
    queryKey: promocionQueryKeys.detail(promocionId ?? '', empresaId),
    queryFn: () => promocionService.getById(promocionId ?? '', empresaId),
    enabled,
  });
}

export function useCreatePromocion() {
  const qc = useQueryClient();

  return useMutation<Promocion, Error, PromocionCreate>({
    mutationFn: (payload) => promocionService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prc', 'promocion', 'list'] });
      toast.success('Promoción creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdatePromocion() {
  const qc = useQueryClient();

  return useMutation<
    Promocion,
    Error,
    { promocionId: string; payload: PromocionUpdate; empresa_id?: string }
  >({
    mutationFn: ({ promocionId, payload, empresa_id }) =>
      promocionService.update(promocionId, payload, empresa_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['prc', 'promocion', 'list'] });
      qc.invalidateQueries({ queryKey: promocionQueryKeys.detail(vars.promocionId, vars.empresa_id) });
      toast.success('Promoción actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeletePromocion() {
  const qc = useQueryClient();

  return useMutation<void, Error, { promocionId: string; empresa_id?: string }>({
    mutationFn: ({ promocionId, empresa_id }) => promocionService.delete(promocionId, empresa_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['prc', 'promocion', 'list'] });
      qc.invalidateQueries({ queryKey: promocionQueryKeys.detail(vars.promocionId, vars.empresa_id) });
      toast.success('Promoción desactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarPromocion() {
  const qc = useQueryClient();

  return useMutation<Promocion, Error, { promocionId: string; empresa_id?: string }>({
    mutationFn: ({ promocionId, empresa_id }) => promocionService.reactivar(promocionId, empresa_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['prc', 'promocion', 'list'] });
      qc.invalidateQueries({ queryKey: promocionQueryKeys.detail(vars.promocionId, vars.empresa_id) });
      toast.success('Promoción reactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
