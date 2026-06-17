import { useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useErpListQuery, type ErpListResourceConfig } from '@/core/list';
import { getErrorMessage } from '@/core/services/error.service';
import { almacenService, buildInvListQuery, invFetchList } from '../services/inv.service';
import type { Almacen, AlmacenCreate, AlmacenUpdate, InvListParams } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

export const ALMACENES_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'B',
  sortableColumns: ['codigo', 'nombre', 'tipo_almacen', 'fecha_creacion'],
  defaultLimit: 50,
  forcePagination: true,
};

const qk = {
  list: (scopeEmpresaId: string, sucursalId: string, soloActivos: boolean) =>
    ['inv', 'almacen', 'list', scopeEmpresaId, sucursalId, soloActivos] as const,
  detail: (almacenId: string, scopeEmpresaId: string) =>
    ['inv', 'almacen', 'detail', almacenId, scopeEmpresaId] as const,
};

export function useAlmacenesErpList(options?: {
  sucursal_id?: string;
  solo_activos?: boolean;
  debouncedBuscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;
  const debouncedBuscar = options?.debouncedBuscar;

  const baseFilters = useMemo(
    () => ({
      solo_activos: soloActivos,
      empresa_id: scopeEmpresaId ?? undefined,
      sucursal_id: options?.sucursal_id,
    }),
    [soloActivos, scopeEmpresaId, options?.sucursal_id],
  );

  const listQuery = useErpListQuery<Almacen, typeof baseFilters>({
    queryKeyPrefix: ['inv', 'almacen', 'list', scopeEmpresaId ?? ''],
    fetcher: (params) =>
      invFetchList<Almacen>('/almacenes', buildInvListQuery(params as InvListParams)),
    baseFilters,
    debouncedBuscar,
    config: ALMACENES_LIST_CONFIG,
    enabled: gateEnabled,
    staleTime: INV_LIST_STALE_TIME_MS,
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [debouncedBuscar, soloActivos, options?.sucursal_id, setPage]);

  return listQuery;
}

export function useAlmacenes(options?: {
  sucursal_id?: string;
  solo_activos?: boolean;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const sucursalId = options?.sucursal_id ?? '';
  const soloActivos = options?.solo_activos ?? true;

  return useTenantQuery<Almacen[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', sucursalId, soloActivos),
    queryFn: () =>
      almacenService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        sucursal_id: options?.sucursal_id,
        solo_activos: soloActivos,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled: gateEnabled,
  });
}

export function useAlmacen(almacenId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && !!almacenId;

  return useTenantQuery<Almacen, Error>({
    queryKey: qk.detail(almacenId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => almacenService.getById(almacenId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
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
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Almacen, Error, { almacenId: string; payload: AlmacenUpdate }>({
    mutationFn: ({ almacenId, payload }) => almacenService.update(almacenId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'almacen', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.almacenId, scopeEmpresaId ?? ''),
      });
      toast.success('Almacén actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteAlmacen() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<void, Error, { almacenId: string }>({
    mutationFn: ({ almacenId }) => almacenService.delete(almacenId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'almacen', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.almacenId, scopeEmpresaId ?? ''),
      });
      toast.success('Almacén eliminado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarAlmacen() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Almacen, Error, { almacenId: string }>({
    mutationFn: ({ almacenId }) => almacenService.reactivar(almacenId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'almacen', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.almacenId, scopeEmpresaId ?? ''),
      });
      toast.success('Almacén reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
