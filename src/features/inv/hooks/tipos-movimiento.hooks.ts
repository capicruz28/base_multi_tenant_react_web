import { useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useErpListQuery, type ErpListResourceConfig } from '@/core/list';
import { getErrorMessage } from '@/core/services/error.service';
import { buildInvListQuery, invFetchList, tipoMovimientoService } from '../services/inv.service';
import type { InvListParams, TipoMovimiento, TipoMovimientoCreate, TipoMovimientoUpdate } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

export const TIPOS_MOVIMIENTO_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'B',
  sortableColumns: ['codigo', 'nombre', 'clase_movimiento', 'fecha_creacion'],
  defaultLimit: 50,
  forcePagination: true,
};

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean) =>
    ['inv', 'tipo-movimiento', 'list', scopeEmpresaId, soloActivos] as const,
  detail: (tipoMovimientoId: string, scopeEmpresaId: string) =>
    ['inv', 'tipo-movimiento', 'detail', tipoMovimientoId, scopeEmpresaId] as const,
};

export function useTiposMovimientoErpList(options?: {
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
    }),
    [soloActivos, scopeEmpresaId],
  );

  const listQuery = useErpListQuery<TipoMovimiento, typeof baseFilters>({
    queryKeyPrefix: ['inv', 'tipo-movimiento', 'list', scopeEmpresaId ?? ''],
    fetcher: (params) =>
      invFetchList<TipoMovimiento>('/tipos-movimiento', buildInvListQuery(params as InvListParams)),
    baseFilters,
    debouncedBuscar,
    config: TIPOS_MOVIMIENTO_LIST_CONFIG,
    enabled: gateEnabled,
    staleTime: INV_LIST_STALE_TIME_MS,
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [debouncedBuscar, soloActivos, setPage]);

  return listQuery;
}

export function useTiposMovimiento(options?: { solo_activos?: boolean; enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;

  return useTenantQuery<TipoMovimiento[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos),
    queryFn: () =>
      tipoMovimientoService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        solo_activos: soloActivos,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled: gateEnabled,
  });
}

export function useTipoMovimiento(tipoMovimientoId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && !!tipoMovimientoId;

  return useTenantQuery<TipoMovimiento, Error>({
    queryKey: qk.detail(tipoMovimientoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => tipoMovimientoService.getById(tipoMovimientoId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useCreateTipoMovimiento() {
  const qc = useQueryClient();

  return useMutation<TipoMovimiento, Error, TipoMovimientoCreate>({
    mutationFn: (payload) => tipoMovimientoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      toast.success('Tipo de movimiento creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateTipoMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<TipoMovimiento, Error, { tipoMovimientoId: string; payload: TipoMovimientoUpdate }>({
    mutationFn: ({ tipoMovimientoId, payload }) => tipoMovimientoService.update(tipoMovimientoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.tipoMovimientoId, scopeEmpresaId ?? ''),
      });
      toast.success('Tipo de movimiento actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteTipoMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<void, Error, { tipoMovimientoId: string }>({
    mutationFn: ({ tipoMovimientoId }) => tipoMovimientoService.delete(tipoMovimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.tipoMovimientoId, scopeEmpresaId ?? ''),
      });
      toast.success('Tipo de movimiento eliminado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarTipoMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<TipoMovimiento, Error, { tipoMovimientoId: string }>({
    mutationFn: ({ tipoMovimientoId }) => tipoMovimientoService.reactivar(tipoMovimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.tipoMovimientoId, scopeEmpresaId ?? ''),
      });
      toast.success('Tipo de movimiento reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
