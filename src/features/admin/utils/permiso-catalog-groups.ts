import type { PermisoCatalogoItem } from '../types/permisos-negocio.types';

export interface PermisoCatalogGroup {
  key: string;
  label: string;
  items: PermisoCatalogoItem[];
}

const GENERAL_GROUP_KEY = '__general__';
const GENERAL_GROUP_LABEL = 'General';

function normalizeGroupKey(value: string | null | undefined): string | null {
  if (!value || !String(value).trim()) return null;
  return String(value).trim().toLowerCase();
}

/** Prefijo del código antes del primer punto (ej. inv.stock.ver → inv). */
export function extractCodigoPrefix(codigo: string | null | undefined): string | null {
  if (!codigo || !String(codigo).trim()) return null;
  const firstSegment = String(codigo).trim().split('.')[0];
  return firstSegment ? firstSegment.toLowerCase() : null;
}

function resolveGroupKey(item: PermisoCatalogoItem): string {
  const fromRecurso = normalizeGroupKey(item.recurso);
  if (fromRecurso) return fromRecurso;

  const fromCodigo = extractCodigoPrefix(item.codigo);
  if (fromCodigo) return fromCodigo;

  const fromModulo = normalizeGroupKey(item.modulo_id);
  if (fromModulo) return fromModulo;

  return GENERAL_GROUP_KEY;
}

function resolveGroupLabel(key: string, items: PermisoCatalogoItem[]): string {
  if (key === GENERAL_GROUP_KEY) return GENERAL_GROUP_LABEL;

  const sample = items[0];
  if (sample?.recurso?.trim()) return sample.recurso.trim();

  if (sample?.codigo) {
    const prefix = extractCodigoPrefix(sample.codigo);
    if (prefix) return prefix;
  }

  if (sample?.modulo_id?.trim()) return sample.modulo_id.trim();

  return key;
}

function sortCatalogItems(items: PermisoCatalogoItem[]): PermisoCatalogoItem[] {
  return items.slice().sort((a, b) => {
    const nameA = (a.nombre ?? a.codigo ?? '').toLowerCase();
    const nameB = (b.nombre ?? b.codigo ?? '').toLowerCase();
    return nameA.localeCompare(nameB, 'es');
  });
}

/**
 * Agrupa el catálogo RBAC V1 por recurso, prefijo de código o módulo.
 * Orden: alfabético por label de grupo; ítems ordenados por nombre/código.
 */
export function groupPermisoCatalog(catalogo: PermisoCatalogoItem[]): PermisoCatalogGroup[] {
  const activeItems = catalogo.filter((item) => item.es_activo !== false);
  const map = new Map<string, PermisoCatalogoItem[]>();

  for (const item of activeItems) {
    const key = resolveGroupKey(item);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  const groups: PermisoCatalogGroup[] = Array.from(map.entries()).map(([key, items]) => ({
    key,
    label: resolveGroupLabel(key, items),
    items: sortCatalogItems(items),
  }));

  groups.sort((a, b) => {
    if (a.key === GENERAL_GROUP_KEY) return 1;
    if (b.key === GENERAL_GROUP_KEY) return -1;
    return a.label.localeCompare(b.label, 'es');
  });

  return groups;
}

/** Filtra ítems por término en nombre, código o descripción. */
export function filterPermisoCatalog(
  catalogo: PermisoCatalogoItem[],
  searchTerm: string,
): PermisoCatalogoItem[] {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return catalogo;

  return catalogo.filter((item) => {
    const haystack = [
      item.nombre,
      item.codigo,
      item.descripcion,
      item.recurso,
      item.accion,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

/** Agrupa catálogo filtrado; omite grupos vacíos. */
export function groupFilteredPermisoCatalog(
  catalogo: PermisoCatalogoItem[],
  searchTerm: string,
): PermisoCatalogGroup[] {
  const filtered = filterPermisoCatalog(catalogo, searchTerm);
  return groupPermisoCatalog(filtered);
}
