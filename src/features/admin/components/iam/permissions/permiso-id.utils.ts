import type { PermisoAsignadoItem, PermisoCatalogoItem } from '../../../types/permisos-negocio.types';

export function getPermisoIdFromCatalogItem(p: PermisoCatalogoItem): string {
  return String(p.permiso_id ?? '').trim();
}

export function getPermisoIdsFromAssignedList(
  items: PermisoAsignadoItem[] | PermisoCatalogoItem[],
): string[] {
  return items
    .map((p) => String(p.permiso_id ?? '').trim())
    .filter(Boolean);
}
