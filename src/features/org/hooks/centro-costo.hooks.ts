import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { toastOrgApiError } from '../utils/org-api-error';
import { centroCostoService } from '../services/org.service';
import type { CentroCosto, CentroCostoCreate, CentroCostoUpdate } from '../types/org.types';
import { useOrgCompanyQueryGate } from './org-company-query-gate';

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean, buscar?: string) =>
    ['org', 'centro-costo', 'list', scopeEmpresaId, soloActivos, (buscar ?? '').trim()] as const,
  detail: (centroCostoId: string, scopeEmpresaId: string) =>
    ['org', 'centro-costo', 'detail', centroCostoId, scopeEmpresaId] as const,
};

export function useCentrosCosto(options?: {
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled } = useOrgCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;

  return useTenantQuery<CentroCosto[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos, buscar),
    queryFn: () => centroCostoService.list({ solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useCentroCosto(
  centroCostoId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { scopeEmpresaId, enabled: gateEnabled } = useOrgCompanyQueryGate(options);
  const enabled = gateEnabled && !!centroCostoId;

  return useTenantQuery<CentroCosto, Error>({
    queryKey: qk.detail(centroCostoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => centroCostoService.getById(centroCostoId ?? ''),
    enabled,
  });
}

export function useCreateCentroCosto() {
  const qc = useQueryClient();

  return useMutation<CentroCosto, Error, CentroCostoCreate>({
    mutationFn: (payload) => centroCostoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'centro-costo', 'list'] });
      toast.success('Centro de costo creado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useUpdateCentroCosto() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<CentroCosto, Error, { centroCostoId: string; payload: CentroCostoUpdate }>({
    mutationFn: ({ centroCostoId, payload }) => centroCostoService.update(centroCostoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'centro-costo', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.centroCostoId, scopeEmpresaId ?? ''),
      });
      toast.success('Centro de costo actualizado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useDeleteCentroCosto() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<void, Error, { centroCostoId: string }>({
    mutationFn: ({ centroCostoId }) => centroCostoService.delete(centroCostoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'centro-costo', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.centroCostoId, scopeEmpresaId ?? ''),
      });
      toast.success('Centro de costo eliminado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useReactivarCentroCosto() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<CentroCosto, Error, { centroCostoId: string }>({
    mutationFn: ({ centroCostoId }) => centroCostoService.reactivar(centroCostoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'centro-costo', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.centroCostoId, scopeEmpresaId ?? ''),
      });
      toast.success('Centro de costo reactivado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}
