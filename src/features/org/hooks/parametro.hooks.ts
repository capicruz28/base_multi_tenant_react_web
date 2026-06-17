import { useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import {
  isPaginated,
  useErpListQuery,
  type ErpListResourceConfig,
  type ErpPaginatedResponse,
} from '@/core/list';
import { toastOrgApiError } from '../utils/org-api-error';
import { buildOrgParametroListQuery, orgFetchList, parametroService } from '../services/org.service';
import type {
  OrgParametroListParams,
  Parametro,
  ParametroCreate,
  ParametroEfectivo,
  ParametroUpdate,
  ParametroVista,
} from '../types/org.types';
import { useOrgHybridQueryGate } from './org-company-query-gate';
import {
  hybridTabToParametroVista,
  listFiltersFromOptions,
  parametroQueryKeys,
  type ParametroHybridTab,
  vistaFromTab,
} from './parametro-query-keys';
import {
  filterParametrosByVista,
  isParametroEfectivo,
  resolveParametrosEfectivos,
} from '../utils/org-parametro-resolve';
import { invalidateOrgParametroQueries } from '../utils/invalidate-org-parametro-queries';

/** Whitelist sort — FRONTEND_LISTADOS_CONTRACT_V1 §4 ORG parámetros. */
export const PARAMETROS_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'B',
  sortableColumns: [
    'modulo_codigo',
    'codigo_parametro',
    'nombre_parametro',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  defaultLimit: 50,
  forcePagination: true,
};

type ListOptions = {
  modulo_codigo?: string;
  solo_activos?: boolean;
  buscar?: string;
  debouncedBuscar?: string;
  enabled?: boolean;
};

function enrichParametroRowForVista(
  row: Parametro,
  vista: ParametroVista,
): Parametro | ParametroEfectivo {
  if (vista !== 'efectivo') return row;
  if (isParametroEfectivo(row)) return row;
  return {
    ...row,
    alcance_efectivo: row.empresa_id ? 'override' : 'global',
  };
}

function enrichParametrosListResponse(
  data: Parametro[] | ErpPaginatedResponse<Parametro>,
  vista: ParametroVista,
): Parametro[] | ErpPaginatedResponse<Parametro | ParametroEfectivo> {
  if (isPaginated(data)) {
    return {
      ...data,
      items: data.items.map((row) => enrichParametroRowForVista(row, vista)),
    };
  }
  return data.map((row) => enrichParametroRowForVista(row, vista));
}

/**
 * Listado paginado por tab híbrida — `orgFetchList` + `normalizeListResponse` (useErpListQuery).
 * Fallback legacy (`fetchParametrosEfectivos`, etc.) conservado como candidato de limpieza posterior.
 */
export function useParametrosErpList(options: {
  tab: ParametroHybridTab;
  modulo_codigo?: string;
  solo_activos?: boolean;
  debouncedBuscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useOrgHybridQueryGate(options);
  const soloActivos = options.solo_activos ?? true;
  const debouncedBuscar = options.debouncedBuscar;
  const vista = hybridTabToParametroVista(options.tab);
  const moduloCodigo = options.modulo_codigo?.trim() || undefined;

  const baseFilters = useMemo(
    () => ({
      solo_activos: soloActivos,
      modulo_codigo: moduloCodigo,
      vista,
    }),
    [soloActivos, moduloCodigo, vista],
  );

  const listQuery = useErpListQuery<Parametro | ParametroEfectivo, typeof baseFilters>({
    queryKeyPrefix: ['org', 'parametros', 'list', options.tab, scopeEmpresaId ?? ''],
    fetcher: async (params) => {
      const raw = await orgFetchList<Parametro>(
        '/parametros',
        buildOrgParametroListQuery(params as OrgParametroListParams),
      );
      return enrichParametrosListResponse(raw, vista);
    },
    baseFilters,
    debouncedBuscar,
    config: PARAMETROS_LIST_CONFIG,
    enabled: gateEnabled && (options.enabled ?? true),
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [debouncedBuscar, soloActivos, moduloCodigo, options.tab, setPage]);

  return listQuery;
}

/** @deprecated Legacy full-load + fallback híbrido — candidato eliminación post-validación ErpList. */
async function fetchParametrosByVista(
  vista: 'global' | 'override',
  filters: ReturnType<typeof listFiltersFromOptions>,
): Promise<Parametro[]> {
  const raw = await parametroService.list({
    modulo_codigo: filters.moduloCodigo,
    solo_activos: filters.soloActivos,
    buscar: filters.buscar,
    vista,
  });
  return filterParametrosByVista(raw, vista);
}

async function fetchParametrosEfectivos(
  filters: ReturnType<typeof listFiltersFromOptions>,
): Promise<ParametroEfectivo[]> {
  try {
    const fromApi = await parametroService.list({
      modulo_codigo: filters.moduloCodigo,
      solo_activos: filters.soloActivos,
      buscar: filters.buscar,
      vista: 'efectivo',
    });
    if (fromApi.length > 0 && fromApi.every(isParametroEfectivo)) {
      return fromApi as ParametroEfectivo[];
    }
    if (fromApi.length > 0 && fromApi.some(isParametroEfectivo)) {
      return fromApi.map((row) =>
        isParametroEfectivo(row)
          ? row
          : {
              ...row,
              alcance_efectivo: row.empresa_id ? 'override' : 'global',
            },
      );
    }
  } catch {
    /* fallback merge */
  }

  const [globals, overrides] = await Promise.all([
    fetchParametrosByVista('global', filters),
    fetchParametrosByVista('override', filters),
  ]);
  return resolveParametrosEfectivos(globals, overrides);
}

/** @deprecated Legacy full-load — usar `useParametrosErpList`. Fallback híbrido conservado. */
export function useParametrosEfectivos(options?: ListOptions) {
  const { scopeEmpresaId, enabled } = useOrgHybridQueryGate(options);
  const filters = listFiltersFromOptions(options);

  return useTenantQuery<ParametroEfectivo[], Error>({
    queryKey: parametroQueryKeys.effective(scopeEmpresaId ?? '', filters),
    queryFn: () => fetchParametrosEfectivos(filters),
    enabled,
  });
}

/** @deprecated Legacy full-load — usar `useParametrosErpList`. */
export function useParametrosGlobal(options?: ListOptions) {
  const { enabled } = useOrgHybridQueryGate(options);
  const filters = listFiltersFromOptions(options);

  return useTenantQuery<Parametro[], Error>({
    queryKey: parametroQueryKeys.global(filters),
    queryFn: () => fetchParametrosByVista('global', filters),
    enabled,
  });
}

/** @deprecated Legacy full-load — usar `useParametrosErpList`. */
export function useParametrosOverride(options?: ListOptions) {
  const { scopeEmpresaId, enabled } = useOrgHybridQueryGate(options);
  const filters = listFiltersFromOptions(options);

  return useTenantQuery<Parametro[], Error>({
    queryKey: parametroQueryKeys.override(scopeEmpresaId ?? '', filters),
    queryFn: () => fetchParametrosByVista('override', filters),
    enabled,
  });
}

/** @deprecated Usar hooks por vista (effective / global / override). */
export function useParametros(options?: ListOptions) {
  return useParametrosEfectivos(options);
}

export function useParametro(parametroId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useOrgHybridQueryGate(options);
  const enabled = gateEnabled && !!parametroId;

  return useTenantQuery<Parametro, Error>({
    queryKey: parametroQueryKeys.detail(parametroId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => parametroService.getById(parametroId ?? ''),
    enabled,
  });
}

export function useCreateParametro() {
  const qc = useQueryClient();

  return useMutation<Parametro, Error, ParametroCreate>({
    mutationFn: (payload) => parametroService.create(payload),
    onSuccess: () => {
      invalidateOrgParametroQueries(qc);
      toast.success('Parámetro creado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useUpdateParametro() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgHybridQueryGate();

  return useMutation<Parametro, Error, { parametroId: string; payload: ParametroUpdate }>({
    mutationFn: ({ parametroId, payload }) => parametroService.update(parametroId, payload),
    onSuccess: (_data, vars) => {
      invalidateOrgParametroQueries(qc);
      qc.invalidateQueries({
        queryKey: parametroQueryKeys.detail(vars.parametroId, scopeEmpresaId ?? ''),
      });
      toast.success('Parámetro actualizado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useDeleteParametro() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgHybridQueryGate();

  return useMutation<void, Error, { parametroId: string }>({
    mutationFn: ({ parametroId }) => parametroService.delete(parametroId),
    onSuccess: (_data, vars) => {
      invalidateOrgParametroQueries(qc);
      qc.invalidateQueries({
        queryKey: parametroQueryKeys.detail(vars.parametroId, scopeEmpresaId ?? ''),
      });
      toast.success('Parámetro eliminado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useReactivarParametro() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useOrgHybridQueryGate();

  return useMutation<Parametro, Error, { parametroId: string }>({
    mutationFn: ({ parametroId }) => parametroService.reactivar(parametroId),
    onSuccess: (_data, vars) => {
      invalidateOrgParametroQueries(qc);
      qc.invalidateQueries({
        queryKey: parametroQueryKeys.detail(vars.parametroId, scopeEmpresaId ?? ''),
      });
      toast.success('Parámetro reactivado.');
    },
    onError: (err) => {
      toastOrgApiError(err);
    },
  });
}

export function useParametrosForTab(tab: ParametroHybridTab, options?: ListOptions) {
  const gateEnabled = options?.enabled ?? true;
  const shared = {
    modulo_codigo: options?.modulo_codigo,
    solo_activos: options?.solo_activos,
    debouncedBuscar: options?.debouncedBuscar ?? options?.buscar,
  };

  const effective = useParametrosErpList({
    tab: 'effective',
    ...shared,
    enabled: tab === 'effective' && gateEnabled,
  });
  const global = useParametrosErpList({
    tab: 'global',
    ...shared,
    enabled: tab === 'global' && gateEnabled,
  });
  const override = useParametrosErpList({
    tab: 'override',
    ...shared,
    enabled: tab === 'override' && gateEnabled,
  });

  if (tab === 'global') return global;
  if (tab === 'override') return override;
  return effective;
}

export { vistaFromTab };
