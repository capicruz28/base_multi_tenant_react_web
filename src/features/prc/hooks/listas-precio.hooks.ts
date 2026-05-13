import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { listaPrecioService } from '../services/prc.service';
import type {
  ListaPrecio,
  ListaPrecioCreate,
  ListaPrecioListParams,
  ListaPrecioUpdate,
} from '../types/prc.types';

export const listaPrecioQueryKeys = {
  list: (p: ListaPrecioListParams | undefined) =>
    [
      'prc',
      'lista-precio',
      'list',
      p?.empresa_id ?? '',
      p?.tipo_lista ?? '',
      p?.solo_activos ?? true,
      p?.solo_vigentes ?? false,
      p?.buscar ?? '',
    ] as const,
  detail: (id: string, empresaId?: string) =>
    ['prc', 'lista-precio', 'detail', id, empresaId ?? ''] as const,
};

export type UseListasPrecioOptions = ListaPrecioListParams & { enabled?: boolean };

export function useListasPrecio(options?: UseListasPrecioOptions) {
  const { enabled: enabledOption = true, ...listParams } = options ?? {};
  const params: ListaPrecioListParams | undefined =
    Object.keys(listParams).length > 0 ? (listParams as ListaPrecioListParams) : undefined;

  return useTenantQuery<ListaPrecio[], Error>({
    queryKey: listaPrecioQueryKeys.list(params),
    queryFn: () => listaPrecioService.list(params),
    enabled: enabledOption,
  });
}

export function useListaPrecio(
  listaPrecioId: string | null | undefined,
  options?: { empresa_id?: string; enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!listaPrecioId;
  const empresaId = options?.empresa_id;

  return useTenantQuery<ListaPrecio, Error>({
    queryKey: listaPrecioQueryKeys.detail(listaPrecioId ?? '', empresaId),
    queryFn: () => listaPrecioService.getById(listaPrecioId ?? '', empresaId),
    enabled,
  });
}

export function useCreateListaPrecio() {
  const qc = useQueryClient();

  return useMutation<ListaPrecio, Error, ListaPrecioCreate>({
    mutationFn: (payload) => listaPrecioService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio', 'list'] });
      toast.success('Lista de precio creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateListaPrecio() {
  const qc = useQueryClient();

  return useMutation<
    ListaPrecio,
    Error,
    { listaPrecioId: string; payload: ListaPrecioUpdate; empresa_id?: string }
  >({
    mutationFn: ({ listaPrecioId, payload, empresa_id }) =>
      listaPrecioService.update(listaPrecioId, payload, empresa_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio', 'list'] });
      qc.invalidateQueries({ queryKey: listaPrecioQueryKeys.detail(vars.listaPrecioId, vars.empresa_id) });
      toast.success('Lista de precio actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteListaPrecio() {
  const qc = useQueryClient();

  return useMutation<void, Error, { listaPrecioId: string; empresa_id?: string }>({
    mutationFn: ({ listaPrecioId, empresa_id }) => listaPrecioService.delete(listaPrecioId, empresa_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio', 'list'] });
      qc.invalidateQueries({ queryKey: listaPrecioQueryKeys.detail(vars.listaPrecioId, vars.empresa_id) });
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio-detalle', 'list', vars.listaPrecioId] });
      toast.success('Lista de precio desactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarListaPrecio() {
  const qc = useQueryClient();

  return useMutation<ListaPrecio, Error, { listaPrecioId: string; empresa_id?: string }>({
    mutationFn: ({ listaPrecioId, empresa_id }) => listaPrecioService.reactivar(listaPrecioId, empresa_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['prc', 'lista-precio', 'list'] });
      qc.invalidateQueries({ queryKey: listaPrecioQueryKeys.detail(vars.listaPrecioId, vars.empresa_id) });
      toast.success('Lista de precio reactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
