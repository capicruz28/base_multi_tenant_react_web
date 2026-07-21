import { useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useErpListQuery, type ErpListResourceConfig } from '@/core/list';
import { getErrorMessage } from '@/core/services/error.service';
import { buildInvListQuery, invFetchList, unidadMedidaService } from '../services/inv.service';
import type { InvListParams, UnidadMedida, UnidadMedidaCreate, UnidadMedidaUpdate } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

export const UNIDADES_MEDIDA_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'B',
  sortableColumns: ['codigo', 'nombre', 'tipo_unidad', 'fecha_creacion'],
  defaultLimit: 50,
  forcePagination: true,
};

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean) =>
    ['inv', 'unidad-medida', 'list', scopeEmpresaId, soloActivos] as const,
  detail: (unidadMedidaId: string, scopeEmpresaId: string) =>
    ['inv', 'unidad-medida', 'detail', unidadMedidaId, scopeEmpresaId] as const,
};

export function useUnidadesMedidaErpList(options?: {
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

  const listQuery = useErpListQuery<UnidadMedida, typeof baseFilters>({
    queryKeyPrefix: ['inv', 'unidad-medida', 'list', scopeEmpresaId ?? ''],
    fetcher: (params) =>
      invFetchList<UnidadMedida>('/unidades-medida', buildInvListQuery(params as InvListParams)),
    baseFilters,
    debouncedBuscar,
    config: UNIDADES_MEDIDA_LIST_CONFIG,
    enabled: gateEnabled,
    staleTime: INV_LIST_STALE_TIME_MS,
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [debouncedBuscar, soloActivos, setPage]);

  return listQuery;
}

export function useUnidadesMedida(options?: { solo_activos?: boolean; enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;

  return useTenantQuery<UnidadMedida[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos),
    queryFn: () =>
      unidadMedidaService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        solo_activos: soloActivos,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled: gateEnabled,
  });
}

export function useUnidadMedida(unidadMedidaId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && !!unidadMedidaId;

  return useTenantQuery<UnidadMedida, Error>({
    queryKey: qk.detail(unidadMedidaId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => unidadMedidaService.getById(unidadMedidaId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useCreateUnidadMedida() {
  const qc = useQueryClient();

  return useMutation<UnidadMedida, Error, UnidadMedidaCreate>({
    mutationFn: (payload) => unidadMedidaService.create(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      toast.success(`Unidad de medida creada con código ${data.codigo}`);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateUnidadMedida() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<UnidadMedida, Error, { unidadMedidaId: string; payload: UnidadMedidaUpdate }>({
    mutationFn: ({ unidadMedidaId, payload }) => unidadMedidaService.update(unidadMedidaId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.unidadMedidaId, scopeEmpresaId ?? ''),
      });
      toast.success('Unidad de medida actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteUnidadMedida() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<void, Error, { unidadMedidaId: string }>({
    mutationFn: ({ unidadMedidaId }) => unidadMedidaService.delete(unidadMedidaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.unidadMedidaId, scopeEmpresaId ?? ''),
      });
      toast.success('Unidad de medida eliminada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarUnidadMedida() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<UnidadMedida, Error, { unidadMedidaId: string }>({
    mutationFn: ({ unidadMedidaId }) => unidadMedidaService.reactivar(unidadMedidaId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'unidad-medida', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.unidadMedidaId, scopeEmpresaId ?? ''),
      });
      toast.success('Unidad de medida reactivada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
