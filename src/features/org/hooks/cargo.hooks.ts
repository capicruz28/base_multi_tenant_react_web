import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { toastOrgApiError } from '../utils/org-api-error';
import { cargoService } from '../services/org.service';
import type { Cargo, CargoCreate, CargoUpdate } from '../types/org.types';
import { useOrgCompanyQueryGate } from './org-company-query-gate';

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean, buscar?: string) =>
    ['org', 'cargo', 'list', scopeEmpresaId, soloActivos, (buscar ?? '').trim()] as const,
  detail: (cargoId: string, scopeEmpresaId: string) =>
    ['org', 'cargo', 'detail', cargoId, scopeEmpresaId] as const,
};

export function useCargos(options?: {
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled } = useOrgCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;

  return useTenantQuery<Cargo[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos, buscar),
    queryFn: () => cargoService.list({ solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useCargo(cargoId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useOrgCompanyQueryGate(options);
  const enabled = gateEnabled && !!cargoId;

  return useTenantQuery<Cargo, Error>({
    queryKey: qk.detail(cargoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => cargoService.getById(cargoId ?? ''),
    enabled,
  });
}

export function useCreateCargo() {
  const qc = useQueryClient();

  return useMutation<Cargo, Error, CargoCreate>({
    mutationFn: (payload) => cargoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'cargo', 'list'] });
      toast.success('Cargo creado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useUpdateCargo() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<Cargo, Error, { cargoId: string; payload: CargoUpdate }>({
    mutationFn: ({ cargoId, payload }) => cargoService.update(cargoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'cargo', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.cargoId, scopeEmpresaId ?? '') });
      toast.success('Cargo actualizado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useDeleteCargo() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<void, Error, { cargoId: string }>({
    mutationFn: ({ cargoId }) => cargoService.delete(cargoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'cargo', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.cargoId, scopeEmpresaId ?? '') });
      toast.success('Cargo eliminado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useReactivarCargo() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgCompanyQueryGate();

  return useMutation<Cargo, Error, { cargoId: string }>({
    mutationFn: ({ cargoId }) => cargoService.reactivar(cargoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'cargo', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.cargoId, scopeEmpresaId ?? '') });
      toast.success('Cargo reactivado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}
