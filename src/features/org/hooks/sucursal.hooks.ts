import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { sucursalService } from '../services/org.service';
import type { Sucursal, SucursalCreate, SucursalUpdate } from '../types/org.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean, buscar?: string) =>
    ['org', 'sucursal', 'list', empresaId ?? '', soloActivos, (buscar ?? '').trim()] as const,
  detail: (sucursalId: string, empresaId?: string) =>
    ['org', 'sucursal', 'detail', sucursalId, empresaId ?? ''] as const,
};

export function useSucursales(options?: {
  empresa_id?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Sucursal[], Error>({
    queryKey: qk.list(empresaId, soloActivos, buscar),
    queryFn: () => sucursalService.list({ empresa_id: empresaId, solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useSucursal(
  sucursalId: string | null | undefined,
  options?: { empresa_id?: string; enabled?: boolean }
) {
  const empresaId = options?.empresa_id;
  const enabled = (options?.enabled ?? true) && !!sucursalId;

  return useTenantQuery<Sucursal, Error>({
    queryKey: qk.detail(sucursalId ?? '', empresaId),
    queryFn: () => sucursalService.getById(sucursalId ?? '', { empresa_id: empresaId }),
    enabled,
  });
}

export function useCreateSucursal() {
  const qc = useQueryClient();

  return useMutation<Sucursal, Error, SucursalCreate>({
    mutationFn: (payload) => sucursalService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'sucursal', 'list'] });
      toast.success('Sucursal creada.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useUpdateSucursal() {
  const qc = useQueryClient();

  return useMutation<Sucursal, Error, { sucursalId: string; payload: SucursalUpdate; empresa_id?: string }>({
    mutationFn: ({ sucursalId, payload, empresa_id }) =>
      sucursalService.update(sucursalId, payload, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'sucursal', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.sucursalId, vars.empresa_id) });
      toast.success('Sucursal actualizada.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useDeleteSucursal() {
  const qc = useQueryClient();

  return useMutation<void, Error, { sucursalId: string; empresa_id?: string }>({
    mutationFn: ({ sucursalId, empresa_id }) => sucursalService.delete(sucursalId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'sucursal', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.sucursalId, vars.empresa_id) });
      toast.success('Sucursal eliminada.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useReactivarSucursal() {
  const qc = useQueryClient();

  return useMutation<Sucursal, Error, { sucursalId: string; empresa_id?: string }>({
    mutationFn: ({ sucursalId, empresa_id }) => sucursalService.reactivar(sucursalId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'sucursal', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.sucursalId, vars.empresa_id) });
      toast.success('Sucursal reactivada.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

