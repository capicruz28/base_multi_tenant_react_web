import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { categoriaService } from '../services/inv.service';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/inv.types';

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean) =>
    ['inv', 'categoria', 'list', scopeEmpresaId, soloActivos] as const,
  detail: (categoriaId: string, scopeEmpresaId: string) =>
    ['inv', 'categoria', 'detail', categoriaId, scopeEmpresaId] as const,
};

export function useCategorias(options?: { solo_activos?: boolean; enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;

  return useTenantQuery<Categoria[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos),
    queryFn: () =>
      categoriaService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        solo_activos: soloActivos,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled: gateEnabled,
  });
}

export function useCategoria(
  categoriaId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && !!categoriaId;

  return useTenantQuery<Categoria, Error>({
    queryKey: qk.detail(categoriaId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => categoriaService.getById(categoriaId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useCreateCategoria() {
  const qc = useQueryClient();

  return useMutation<Categoria, Error, CategoriaCreate>({
    mutationFn: (payload) => categoriaService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'categoria', 'list'] });
      toast.success('Categoría creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateCategoria() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Categoria, Error, { categoriaId: string; payload: CategoriaUpdate }>({
    mutationFn: ({ categoriaId, payload }) => categoriaService.update(categoriaId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'categoria', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.categoriaId, scopeEmpresaId ?? ''),
      });
      toast.success('Categoría actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteCategoria() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<void, Error, { categoriaId: string }>({
    mutationFn: ({ categoriaId }) => categoriaService.delete(categoriaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'categoria', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.categoriaId, scopeEmpresaId ?? ''),
      });
      toast.success('Categoría eliminada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarCategoria() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Categoria, Error, { categoriaId: string }>({
    mutationFn: ({ categoriaId }) => categoriaService.reactivar(categoriaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'categoria', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.categoriaId, scopeEmpresaId ?? ''),
      });
      toast.success('Categoría reactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
