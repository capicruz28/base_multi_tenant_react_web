import type { Parametro, ParametroCreate } from '../types/org.types';
import type { ParametroAlcanceKind } from '../components/OrgParametroAlcanceField';
import type { ParametroHybridTab } from '../hooks/parametro-query-keys';

export function isParametroGlobal(row: Pick<Parametro, 'empresa_id'>): boolean {
  return !row.empresa_id;
}

export function buildParametroCreatePayload(
  form: ParametroCreate,
  alcance: ParametroAlcanceKind,
  scopeEmpresaId: string | null,
): ParametroCreate {
  const base = { ...form };
  if (alcance === 'global') {
    return { ...base, empresa_id: undefined };
  }
  if (scopeEmpresaId) {
    return { ...base, empresa_id: scopeEmpresaId };
  }
  return { ...base, empresa_id: undefined };
}

/** Crear/editar/eliminar fila global: solo tenant_admin / platform. */
export function canMutateParametroRow(
  row: Pick<Parametro, 'empresa_id'>,
  canManageGlobal: boolean,
): boolean {
  if (isParametroGlobal(row)) return canManageGlobal;
  return true;
}

/** Alcance por defecto al abrir modal create según pestaña activa. */
export function defaultCreateAlcanceForTab(
  tab: ParametroHybridTab,
  canManageGlobal: boolean,
): ParametroAlcanceKind {
  if (tab === 'global' && canManageGlobal) return 'global';
  return 'override';
}

export function canOpenCreateOnTab(
  tab: ParametroHybridTab,
  canManageGlobal: boolean,
  scopeEmpresaId: string | null,
): boolean {
  if (tab === 'global') return canManageGlobal;
  if (tab === 'override') return Boolean(scopeEmpresaId);
  return Boolean(scopeEmpresaId);
}
