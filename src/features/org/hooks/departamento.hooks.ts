import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { toastOrgApiError } from '../utils/org-api-error';
import { departamentoService } from '../services/org.service';
import type { Departamento, DepartamentoCreate, DepartamentoUpdate } from '../types/org.types';
import { useOrgCompanyQueryGate } from './org-company-query-gate';

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean, buscar?: string) =>
    ['org', 'departamento', 'list', scopeEmpresaId, soloActivos, (buscar ?? '').trim()] as const,
  detail: (departamentoId: string, scopeEmpresaId: string) =>
    ['org', 'departamento', 'detail', departamentoId, scopeEmpresaId] as const,
};

export function useDepartamentos(options?: {
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled } = useOrgCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;

  return useTenantQuery<Departamento[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos, buscar),
    queryFn: () => departamentoService.list({ solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useDepartamento(
  departamentoId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { scopeEmpresaId, enabled: gateEnabled } = useOrgCompanyQueryGate(options);
  const enabled = gateEnabled && !!departamentoId;

  return useTenantQuery<Departamento, Error>({
    queryKey: qk.detail(departamentoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => departamentoService.getById(departamentoId ?? ''),
    enabled,
  });
}

export function useCreateDepartamento() {
  const qc = useQueryClient();

  return useMutation<Departamento, Error, DepartamentoCreate>({
    mutationFn: (payload) => departamentoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'departamento', 'list'] });
      toast.success('Departamento creado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useUpdateDepartamento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<Departamento, Error, { departamentoId: string; payload: DepartamentoUpdate }>({
    mutationFn: ({ departamentoId, payload }) =>
      departamentoService.update(departamentoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'departamento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.departamentoId, scopeEmpresaId ?? ''),
      });
      toast.success('Departamento actualizado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useDeleteDepartamento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<void, Error, { departamentoId: string }>({
    mutationFn: ({ departamentoId }) => departamentoService.delete(departamentoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'departamento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.departamentoId, scopeEmpresaId ?? ''),
      });
      toast.success('Departamento eliminado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useReactivarDepartamento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<Departamento, Error, { departamentoId: string }>({
    mutationFn: ({ departamentoId }) => departamentoService.reactivar(departamentoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'departamento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.departamentoId, scopeEmpresaId ?? ''),
      });
      toast.success('Departamento reactivado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}
