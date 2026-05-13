import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { cargoService } from '../services/org.service';
import type { Cargo, CargoCreate, CargoUpdate } from '../types/org.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean, buscar?: string) =>
    ['org', 'cargo', 'list', empresaId ?? '', soloActivos, (buscar ?? '').trim()] as const,
  detail: (cargoId: string, empresaId?: string) =>
    ['org', 'cargo', 'detail', cargoId, empresaId ?? ''] as const,
};

export function useCargos(options?: {
  empresa_id?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Cargo[], Error>({
    queryKey: qk.list(empresaId, soloActivos, buscar),
    queryFn: () => cargoService.list({ empresa_id: empresaId, solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useCargo(cargoId: string | null | undefined, options?: { empresa_id?: string; enabled?: boolean }) {
  const empresaId = options?.empresa_id;
  const enabled = (options?.enabled ?? true) && !!cargoId;

  return useTenantQuery<Cargo, Error>({
    queryKey: qk.detail(cargoId ?? '', empresaId),
    queryFn: () => cargoService.getById(cargoId ?? '', { empresa_id: empresaId }),
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
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useUpdateCargo() {
  const qc = useQueryClient();

  return useMutation<Cargo, Error, { cargoId: string; payload: CargoUpdate; empresa_id?: string }>({
    mutationFn: ({ cargoId, payload, empresa_id }) => cargoService.update(cargoId, payload, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'cargo', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.cargoId, vars.empresa_id) });
      toast.success('Cargo actualizado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useDeleteCargo() {
  const qc = useQueryClient();

  return useMutation<void, Error, { cargoId: string; empresa_id?: string }>({
    mutationFn: ({ cargoId, empresa_id }) => cargoService.delete(cargoId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'cargo', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.cargoId, vars.empresa_id) });
      toast.success('Cargo eliminado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useReactivarCargo() {
  const qc = useQueryClient();

  return useMutation<Cargo, Error, { cargoId: string; empresa_id?: string }>({
    mutationFn: ({ cargoId, empresa_id }) => cargoService.reactivar(cargoId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'cargo', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.cargoId, vars.empresa_id) });
      toast.success('Cargo reactivado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

