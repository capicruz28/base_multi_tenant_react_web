import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { toastOrgApiError } from '../utils/org-api-error';
import { parametroService } from '../services/org.service';
import type { Parametro, ParametroCreate, ParametroEfectivo, ParametroUpdate } from '../types/org.types';
import { useOrgHybridQueryGate } from './org-company-query-gate';
import {
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

type ListOptions = {
  modulo_codigo?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
};

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

export function useParametrosEfectivos(options?: ListOptions) {
  const { scopeEmpresaId, enabled } = useOrgHybridQueryGate(options);
  const filters = listFiltersFromOptions(options);

  return useTenantQuery<ParametroEfectivo[], Error>({
    queryKey: parametroQueryKeys.effective(scopeEmpresaId ?? '', filters),
    queryFn: () => fetchParametrosEfectivos(filters),
    enabled,
  });
}

export function useParametrosGlobal(options?: ListOptions) {
  const { enabled } = useOrgHybridQueryGate(options);
  const filters = listFiltersFromOptions(options);

  return useTenantQuery<Parametro[], Error>({
    queryKey: parametroQueryKeys.global(filters),
    queryFn: () => fetchParametrosByVista('global', filters),
    enabled,
  });
}

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
  const effective = useParametrosEfectivos({ ...options, enabled: tab === 'effective' && (options?.enabled ?? true) });
  const global = useParametrosGlobal({ ...options, enabled: tab === 'global' && (options?.enabled ?? true) });
  const override = useParametrosOverride({ ...options, enabled: tab === 'override' && (options?.enabled ?? true) });

  if (tab === 'global') return global;
  if (tab === 'override') return override;
  return effective;
}

export { vistaFromTab };
