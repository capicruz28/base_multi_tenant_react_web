/**
 * Indexa permisos de ruta desde GET /auth/menu (sin recalcular RBAC).
 * OR de menu.permisos por módulo para PermissionGuard / usePermissions().can().
 */
import { getERPModuleByCodigo } from '@/core/constants/erp-modules';
import type { AuthMenuModulo, AuthMenuItem } from '@/core/auth/types/auth-menu.types';
import type { UserPermissions } from '@/core/auth/types/permission.types';
import { isMenuVisibleInPayload } from '@/core/auth/utils/menu-shell.utils';

function permissionKeyForModuloCodigo(codigo: string): string {
  const normalized = codigo?.trim().toUpperCase() ?? '';
  const cfg = getERPModuleByCodigo(normalized);
  return cfg?.permissionModule ?? codigo.toLowerCase();
}

export function indexRoutePermissionsFromMenu(modulos: AuthMenuModulo[]): UserPermissions {
  const result: UserPermissions = {};

  const aggregateMenu = (
    menu: AuthMenuItem,
    agg: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      exportar: boolean;
      imprimir: boolean;
    },
  ) => {
    if (!isMenuVisibleInPayload(menu)) return;
    if (menu.permisos) {
      agg.ver = agg.ver || menu.permisos.ver;
      agg.crear = agg.crear || menu.permisos.crear;
      agg.editar = agg.editar || menu.permisos.editar;
      agg.eliminar = agg.eliminar || menu.permisos.eliminar;
      agg.exportar = agg.exportar || (menu.permisos.exportar ?? false);
      agg.imprimir = agg.imprimir || (menu.permisos.imprimir ?? false);
    }
    (menu.submenus || []).forEach((sub) => aggregateMenu(sub, agg));
  };

  for (const modulo of modulos) {
    const key = permissionKeyForModuloCodigo(modulo.codigo);
    const agg = {
      ver: false,
      crear: false,
      editar: false,
      eliminar: false,
      exportar: false,
      imprimir: false,
    };
    for (const seccion of modulo.secciones || []) {
      for (const menu of seccion.menus || []) {
        aggregateMenu(menu, agg);
      }
    }
    result[key] = agg;
  }

  return result;
}
