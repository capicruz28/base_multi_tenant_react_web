import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { categoriaService } from '../services/inv.service';
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/inv.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean) =>
    ['inv', 'categoria', 'list', empresaId ?? '', soloActivos] as const,
  detail: (categoriaId: string) => ['inv', 'categoria', 'detail', categoriaId] as const,
};

export function useCategorias(options?: { empresa_id?: string; solo_activos?: boolean; enabled?: boolean }) {
  const empresaId = options?.empresa_id;
  const soloActivos = options?.solo_activos ?? true;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Categoria[], Error>({
    queryKey: qk.list(empresaId, soloActivos),
    queryFn: () => categoriaService.list({ empresa_id: empresaId, solo_activos: soloActivos }),
    enabled,
  });
}

export function useCategoria(categoriaId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!categoriaId;

  return useTenantQuery<Categoria, Error>({
    queryKey: qk.detail(categoriaId ?? ''),
    queryFn: () => categoriaService.getById(categoriaId ?? ''),
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

  return useMutation<Categoria, Error, { categoriaId: string; payload: CategoriaUpdate }>({
    mutationFn: ({ categoriaId, payload }) => categoriaService.update(categoriaId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'categoria', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.categoriaId) });
      toast.success('Categoría actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteCategoria() {
  const qc = useQueryClient();

  return useMutation<void, Error, { categoriaId: string }>({
    mutationFn: ({ categoriaId }) => categoriaService.delete(categoriaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'categoria', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.categoriaId) });
      toast.success('Categoría eliminada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarCategoria() {
  const qc = useQueryClient();

  return useMutation<Categoria, Error, { categoriaId: string }>({
    mutationFn: ({ categoriaId }) => categoriaService.reactivar(categoriaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'categoria', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.categoriaId) });
      toast.success('Categoría reactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

