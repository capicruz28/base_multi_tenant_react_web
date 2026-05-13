import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { departamentoService } from '../services/org.service';
import type { Departamento, DepartamentoCreate, DepartamentoUpdate } from '../types/org.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean, buscar?: string) =>
    ['org', 'departamento', 'list', empresaId ?? '', soloActivos, (buscar ?? '').trim()] as const,
  detail: (departamentoId: string, empresaId?: string) =>
    ['org', 'departamento', 'detail', departamentoId, empresaId ?? ''] as const,
};

export function useDepartamentos(options?: {
  empresa_id?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Departamento[], Error>({
    queryKey: qk.list(empresaId, soloActivos, buscar),
    queryFn: () => departamentoService.list({ empresa_id: empresaId, solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useDepartamento(
  departamentoId: string | null | undefined,
  options?: { empresa_id?: string; enabled?: boolean }
) {
  const empresaId = options?.empresa_id;
  const enabled = (options?.enabled ?? true) && !!departamentoId;

  return useTenantQuery<Departamento, Error>({
    queryKey: qk.detail(departamentoId ?? '', empresaId),
    queryFn: () => departamentoService.getById(departamentoId ?? '', { empresa_id: empresaId }),
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
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useUpdateDepartamento() {
  const qc = useQueryClient();

  return useMutation<
    Departamento,
    Error,
    { departamentoId: string; payload: DepartamentoUpdate; empresa_id?: string }
  >({
    mutationFn: ({ departamentoId, payload, empresa_id }) =>
      departamentoService.update(departamentoId, payload, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'departamento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.departamentoId, vars.empresa_id) });
      toast.success('Departamento actualizado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useDeleteDepartamento() {
  const qc = useQueryClient();

  return useMutation<void, Error, { departamentoId: string; empresa_id?: string }>({
    mutationFn: ({ departamentoId, empresa_id }) =>
      departamentoService.delete(departamentoId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'departamento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.departamentoId, vars.empresa_id) });
      toast.success('Departamento eliminado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useReactivarDepartamento() {
  const qc = useQueryClient();

  return useMutation<Departamento, Error, { departamentoId: string; empresa_id?: string }>({
    mutationFn: ({ departamentoId, empresa_id }) =>
      departamentoService.reactivar(departamentoId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'departamento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.departamentoId, vars.empresa_id) });
      toast.success('Departamento reactivado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

