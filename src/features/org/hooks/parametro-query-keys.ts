import type { ParametroVista } from '../types/org.types';

export type ParametroListFilters = {
  moduloCodigo?: string;
  soloActivos: boolean;
  buscar?: string;
};

function filterSuffix(filters: ParametroListFilters): readonly (string | boolean)[] {
  return [
    (filters.moduloCodigo ?? '').trim(),
    filters.soloActivos,
    (filters.buscar ?? '').trim(),
  ] as const;
}

/** Claves React Query — Etapa D híbrido. */
export const parametroQueryKeys = {
  effective: (scopeEmpresaId: string, filters: ParametroListFilters) =>
    ['org', 'parametros', 'effective', scopeEmpresaId, ...filterSuffix(filters)] as const,
  global: (filters: ParametroListFilters) =>
    ['org', 'parametros', 'global', ...filterSuffix(filters)] as const,
  override: (scopeEmpresaId: string, filters: ParametroListFilters) =>
    ['org', 'parametros', 'override', scopeEmpresaId, ...filterSuffix(filters)] as const,
  detail: (parametroId: string, scopeEmpresaId: string) =>
    ['org', 'parametros', 'detail', parametroId, scopeEmpresaId] as const,
  allListsPrefix: ['org', 'parametros'] as const,
  legacyListPrefix: ['org', 'parametro', 'list'] as const,
};

export function listFiltersFromOptions(options?: {
  modulo_codigo?: string;
  solo_activos?: boolean;
  buscar?: string;
}): ParametroListFilters {
  return {
    moduloCodigo: options?.modulo_codigo,
    soloActivos: options?.solo_activos ?? true,
    buscar: options?.buscar,
  };
}

export type ParametroHybridTab = 'effective' | 'global' | 'override';

export function vistaFromTab(tab: ParametroHybridTab): ParametroVista {
  return tab;
}
