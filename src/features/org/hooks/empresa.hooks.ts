import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { toastOrgApiError } from '../utils/org-api-error';
import { empresaService } from '../services/org.service';
import type { Empresa, EmpresaCreate, EmpresaUpdate } from '../types/org.types';

const qk = {
  list: (soloActivos: boolean, buscar?: string) =>
    ['org', 'empresa', 'list', soloActivos, (buscar ?? '').trim()] as const,
  detail: (empresaId: string) => ['org', 'empresa', 'detail', empresaId] as const,
};

/** @deprecated Preferir useEmpresasTenant() para catálogo tenant. */
export function useEmpresas(options?: { solo_activos?: boolean; buscar?: string; enabled?: boolean }) {
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Empresa[], Error>({
    queryKey: qk.list(soloActivos, buscar),
    queryFn: () => empresaService.list({ solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export { useEmpresasTenant } from './useEmpresasTenant';

export function useEmpresa(empresaId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!empresaId;

  return useTenantQuery<Empresa, Error>({
    queryKey: qk.detail(empresaId ?? ''),
    queryFn: () => empresaService.getById(empresaId ?? ''),
    enabled,
  });
}

export function useCreateEmpresa() {
  const qc = useQueryClient();

  return useMutation<Empresa, Error, EmpresaCreate>({
    mutationFn: (payload) => empresaService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'empresa', 'list'] });
      toast.success('Empresa creada.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useUpdateEmpresa() {
  const qc = useQueryClient();

  return useMutation<Empresa, Error, { empresaId: string; payload: EmpresaUpdate }>({
    mutationFn: ({ empresaId, payload }) => empresaService.update(empresaId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'empresa', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.empresaId) });
      toast.success('Empresa actualizada.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useDeleteEmpresa() {
  const qc = useQueryClient();

  return useMutation<void, Error, { empresaId: string }>({
    mutationFn: ({ empresaId }) => empresaService.delete(empresaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'empresa', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.empresaId) });
      toast.success('Empresa eliminada.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useReactivarEmpresa() {
  const qc = useQueryClient();

  return useMutation<Empresa, Error, { empresaId: string }>({
    mutationFn: ({ empresaId }) => empresaService.reactivar(empresaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'empresa', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.empresaId) });
      toast.success('Empresa reactivada.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

