import type { PermissionState, MenuPermissions } from '../../../types/permission.types';
import type { MenuPermissionUpdateItem } from './role-permissions.types';

const DEFAULT_MENU_PERMS: MenuPermissions = {
  ver: false,
  crear: false,
  editar: false,
  eliminar: false,
};

function normalizeMenuPerms(perms: MenuPermissions | undefined): MenuPermissions {
  if (!perms) return { ...DEFAULT_MENU_PERMS };
  return {
    ver: Boolean(perms.ver),
    crear: Boolean(perms.crear),
    editar: Boolean(perms.editar),
    eliminar: Boolean(perms.eliminar),
  };
}

export function clonePermissionState(state: PermissionState): PermissionState {
  const next: PermissionState = {};
  for (const [menuId, perms] of Object.entries(state)) {
    next[menuId] = { ...normalizeMenuPerms(perms) };
  }
  return next;
}

export function sortPermisoIds(ids: string[]): string[] {
  return [...ids].map(String).sort();
}

export function areNegocioIdsEqual(a: string[], b: string[]): boolean {
  const left = sortPermisoIds(a);
  const right = sortPermisoIds(b);
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

export function areMenuPermissionsEqual(
  initial: PermissionState,
  current: PermissionState,
): boolean {
  const menuIds = new Set([...Object.keys(initial), ...Object.keys(current)]);
  for (const menuId of menuIds) {
    const a = normalizeMenuPerms(initial[menuId]);
    const b = normalizeMenuPerms(current[menuId]);
    if (a.ver !== b.ver || a.editar !== b.editar || a.eliminar !== b.eliminar) {
      return false;
    }
  }
  return true;
}

/** Solo menús cuya tupla ver/editar/eliminar cambió (mismos campos que PUT batch). */
export function diffMenuPermissions(
  initial: PermissionState,
  current: PermissionState,
): MenuPermissionUpdateItem[] {
  const changes: MenuPermissionUpdateItem[] = [];
  const menuIds = new Set([...Object.keys(initial), ...Object.keys(current)]);

  for (const menuId of menuIds) {
    const init = normalizeMenuPerms(initial[menuId]);
    const curr = normalizeMenuPerms(current[menuId]);
    if (
      init.ver !== curr.ver ||
      init.editar !== curr.editar ||
      init.eliminar !== curr.eliminar
    ) {
      changes.push({
        menu_id: menuId,
        puede_ver: curr.ver,
        puede_editar: curr.editar,
        puede_eliminar: curr.eliminar,
      });
    }
  }

  return changes;
}
