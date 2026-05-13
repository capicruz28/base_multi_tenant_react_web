import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { centroCostoService } from '../services/org.service';
import type { CentroCosto, CentroCostoCreate, CentroCostoUpdate } from '../types/org.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean, buscar?: string) =>
    ['org', 'centroCosto', 'list', empresaId ?? '', soloActivos, (buscar ?? '').trim()] as const,
  detail: (centroCostoId: string, empresaId?: string) =>
    ['org', 'centroCosto', 'detail', centroCostoId, empresaId ?? ''] as const,
};

export function useCentrosCosto(options?: {
  empresa_id?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<CentroCosto[], Error>({
    queryKey: qk.list(empresaId, soloActivos, buscar),
    queryFn: () => centroCostoService.list({ empresa_id: empresaId, solo_activos: soloActivos, buscar }),
    enabled,
  });
}

export function useCentroCosto(
  centroCostoId: string | null | undefined,
  options?: { empresa_id?: string; enabled?: boolean }
) {
  const empresaId = options?.empresa_id;
  const enabled = (options?.enabled ?? true) && !!centroCostoId;

  return useTenantQuery<CentroCosto, Error>({
    queryKey: qk.detail(centroCostoId ?? '', empresaId),
    queryFn: () => centroCostoService.getById(centroCostoId ?? '', { empresa_id: empresaId }),
    enabled,
  });
}

export function useCreateCentroCosto() {
  const qc = useQueryClient();

  return useMutation<CentroCosto, Error, CentroCostoCreate>({
    mutationFn: (payload) => centroCostoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'centroCosto', 'list'] });
      toast.success('Centro de costo creado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useUpdateCentroCosto() {
  const qc = useQueryClient();

  return useMutation<
    CentroCosto,
    Error,
    { centroCostoId: string; payload: CentroCostoUpdate; empresa_id?: string }
  >({
    mutationFn: ({ centroCostoId, payload, empresa_id }) =>
      centroCostoService.update(centroCostoId, payload, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'centroCosto', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.centroCostoId, vars.empresa_id) });
      toast.success('Centro de costo actualizado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useDeleteCentroCosto() {
  const qc = useQueryClient();

  return useMutation<void, Error, { centroCostoId: string; empresa_id?: string }>({
    mutationFn: ({ centroCostoId, empresa_id }) => centroCostoService.delete(centroCostoId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'centroCosto', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.centroCostoId, vars.empresa_id) });
      toast.success('Centro de costo eliminado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useReactivarCentroCosto() {
  const qc = useQueryClient();

  return useMutation<CentroCosto, Error, { centroCostoId: string; empresa_id?: string }>({
    mutationFn: ({ centroCostoId, empresa_id }) => centroCostoService.reactivar(centroCostoId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'centroCosto', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.centroCostoId, vars.empresa_id) });
      toast.success('Centro de costo reactivado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

