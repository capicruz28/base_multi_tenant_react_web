import { useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { buildErpListQueryParams, useErpListQuery, type ErpListResourceConfig } from '@/core/list';
import { toastOrgApiError } from '../utils/org-api-error';
import { centroCostoService, orgFetchList } from '../services/org.service';
import type { CentroCosto, CentroCostoCreate, CentroCostoUpdate, OrgCompanyListParams } from '../types/org.types';
import { useOrgCompanyQueryGate } from './org-company-query-gate';

/** Whitelist sort — FRONTEND_LISTADOS_CONTRACT_V1 §4 ORG centros-costo. */
export const CENTROS_COSTO_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'B',
  sortableColumns: ['codigo', 'nombre', 'tipo_centro_costo', 'nivel', 'fecha_creacion'],
  defaultLimit: 50,
  forcePagination: true,
};

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean, buscar?: string) =>
    ['org', 'centro-costo', 'list', scopeEmpresaId, soloActivos, (buscar ?? '').trim()] as const,
  detail: (centroCostoId: string, scopeEmpresaId: string) =>
    ['org', 'centro-costo', 'detail', centroCostoId, scopeEmpresaId] as const,
};

export function useCentrosCostoErpList(options?: {
  solo_activos?: boolean;
  debouncedBuscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useOrgCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;
  const debouncedBuscar = options?.debouncedBuscar;

  const baseFilters = useMemo(
    () => ({
      solo_activos: soloActivos,
    }),
    [soloActivos],
  );

  const listQuery = useErpListQuery<CentroCosto, typeof baseFilters>({
    queryKeyPrefix: ['org', 'centro-costo', 'list', scopeEmpresaId ?? ''],
    fetcher: (params) =>
      orgFetchList<CentroCosto>(
        '/centros-costo',
        buildErpListQueryParams(
          { solo_activos: (params as OrgCompanyListParams).solo_activos ?? true },
          params as OrgCompanyListParams,
        ),
      ),
    baseFilters,
    debouncedBuscar,
    config: CENTROS_COSTO_LIST_CONFIG,
    enabled: gateEnabled,
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [debouncedBuscar, soloActivos, setPage]);

  return listQuery;
}

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
