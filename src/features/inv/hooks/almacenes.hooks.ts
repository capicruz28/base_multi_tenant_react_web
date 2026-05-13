import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { almacenService } from '../services/inv.service';
import type { Almacen, AlmacenCreate, AlmacenUpdate } from '../types/inv.types';

const qk = {
  list: (empresaId: string | undefined, sucursalId?: string, soloActivos?: boolean) =>
    ['inv', 'almacen', 'list', empresaId ?? '', sucursalId ?? '', soloActivos ?? true] as const,
  detail: (almacenId: string) => ['inv', 'almacen', 'detail', almacenId] as const,
};

export function useAlmacenes(options?: {
  empresa_id?: string;
  sucursal_id?: string;
  solo_activos?: boolean;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const sucursalId = options?.sucursal_id;
  const soloActivos = options?.solo_activos ?? true;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Almacen[], Error>({
    queryKey: qk.list(empresaId, sucursalId, soloActivos),
    queryFn: () => almacenService.list({ empresa_id: empresaId, sucursal_id: sucursalId, solo_activos: soloActivos }),
    enabled,
  });
}

export function useAlmacen(almacenId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!almacenId;

  return useTenantQuery<Almacen, Error>({
    queryKey: qk.detail(almacenId ?? ''),
    queryFn: () => almacenService.getById(almacenId ?? ''),
    enabled,
  });
}

export function useCreateAlmacen() {
  const qc = useQueryClient();

  return useMutation<Almacen, Error, AlmacenCreate>({
    mutationFn: (payload) => almacenService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'almacen', 'list'] });
      toast.success('Almacén creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateAlmacen() {
  const qc = useQueryClient();

  return useMutation<Almacen, Error, { almacenId: string; payload: AlmacenUpdate }>({
    mutationFn: ({ almacenId, payload }) => almacenService.update(almacenId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'almacen', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.almacenId) });
      toast.success('Almacén actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteAlmacen() {
  const qc = useQueryClient();

  return useMutation<void, Error, { almacenId: string }>({
    mutationFn: ({ almacenId }) => almacenService.delete(almacenId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'almacen', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.almacenId) });
      toast.success('Almacén eliminado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarAlmacen() {
  const qc = useQueryClient();

  return useMutation<Almacen, Error, { almacenId: string }>({
    mutationFn: ({ almacenId }) => almacenService.reactivar(almacenId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'almacen', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.almacenId) });
      toast.success('Almacén reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

