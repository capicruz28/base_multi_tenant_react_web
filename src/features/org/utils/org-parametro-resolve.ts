import type { Parametro, ParametroEfectivo, ParametroVista } from '../types/org.types';

export function parametroCodeKey(p: Pick<Parametro, 'modulo_codigo' | 'codigo_parametro'>): string {
  return `${p.modulo_codigo}::${p.codigo_parametro}`;
}

export function isParametroEfectivo(row: Parametro): row is ParametroEfectivo {
  return (
    'alcance_efectivo' in row &&
    (row as ParametroEfectivo).alcance_efectivo != null
  );
}

/** CANDIDATO LIMPIEZA POST-ERP-LIST: filtro client si API devuelve listado mixto. */
export function filterParametrosByVista(list: Parametro[], vista: ParametroVista): Parametro[] {
  if (vista === 'global') return list.filter((p) => !p.empresa_id);
  if (vista === 'override') return list.filter((p) => Boolean(p.empresa_id));
  return list;
}

/**
 * Resuelve valores efectivos: override de empresa activa gana sobre global tenant.
 * CANDIDATO LIMPIEZA POST-ERP-LIST: conservado como fallback si `vista=efectivo` paginado falla.
 */
export function resolveParametrosEfectivos(
  globals: Parametro[],
  overrides: Parametro[],
): ParametroEfectivo[] {
  const map = new Map<string, ParametroEfectivo>();

  for (const g of globals.filter((p) => !p.empresa_id)) {
    map.set(parametroCodeKey(g), { ...g, alcance_efectivo: 'global' });
  }
  for (const o of overrides.filter((p) => Boolean(p.empresa_id))) {
    map.set(parametroCodeKey(o), { ...o, alcance_efectivo: 'override' });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.modulo_codigo.localeCompare(b.modulo_codigo) ||
    a.codigo_parametro.localeCompare(b.codigo_parametro),
  );
}
