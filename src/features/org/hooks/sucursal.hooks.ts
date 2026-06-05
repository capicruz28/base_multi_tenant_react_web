import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { toastOrgApiError } from '../utils/org-api-error';
import { sucursalService } from '../services/org.service';
import type { Sucursal, SucursalCreate, SucursalUpdate } from '../types/org.types';
import { useOrgCompanyQueryGate } from './org-company-query-gate';

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean, buscar?: string) =>
    ['org', 'sucursal', 'list', scopeEmpresaId, soloActivos, (buscar ?? '').trim()] as const,
  detail: (sucursalId: string, scopeEmpresaId: string) =>
    ['org', 'sucursal', 'detail', sucursalId, scopeEmpresaId] as const,
};

export function useSucursales(options?: {
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled } = useOrgCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;

  return useTenantQuery<Sucursal[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos, buscar),
    queryFn: () => sucursalService.list({ solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useSucursal(sucursalId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useOrgCompanyQueryGate(options);
  const enabled = gateEnabled && !!sucursalId;

  return useTenantQuery<Sucursal, Error>({
    queryKey: qk.detail(sucursalId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => sucursalService.getById(sucursalId ?? ''),
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
      toastOrgApiError(err);
    },
  });
}

export function useUpdateSucursal() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<Sucursal, Error, { sucursalId: string; payload: SucursalUpdate }>({
    mutationFn: ({ sucursalId, payload }) => sucursalService.update(sucursalId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'sucursal', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.sucursalId, scopeEmpresaId ?? ''),
      });
      toast.success('Sucursal actualizada.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useDeleteSucursal() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<void, Error, { sucursalId: string }>({
    mutationFn: ({ sucursalId }) => sucursalService.delete(sucursalId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'sucursal', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.sucursalId, scopeEmpresaId ?? ''),
      });
      toast.success('Sucursal eliminada.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useReactivarSucursal() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<Sucursal, Error, { sucursalId: string }>({
    mutationFn: ({ sucursalId }) => sucursalService.reactivar(sucursalId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'sucursal', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.sucursalId, scopeEmpresaId ?? ''),
      });
      toast.success('Sucursal reactivada.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}
