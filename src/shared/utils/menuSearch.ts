// src/shared/utils/menuSearch.ts
import type { AuthMenuModulo, AuthMenuItem } from '../../core/auth/types/auth-menu.types';
import { ERP_MODULES } from '../../core/constants/erp-modules';

const ERP_CODES = new Set(ERP_MODULES.map((m) => m.codigo));

/**
 * Determina si un ítem de menú es visible para el usuario según su rol.
 * Replica exactamente el filtro de TopNavbar (Nivel 2) y filteredModulos (Nivel 1).
 */
function isMenuVisibleForUser(
  menu: AuthMenuItem,
  modulo: AuthMenuModulo,
  userType: string,
): boolean {
  const isErp = ERP_CODES.has(modulo.codigo ?? '');
  if (isErp) return menu.is_visible && menu.is_enabled;
  if (userType === 'platform_admin') {
    return (menu.is_visible && menu.is_enabled) && (menu.ruta?.startsWith('/super-admin') ?? false);
  }
  if (userType === 'tenant_admin') {
    return (menu.is_visible && menu.is_enabled) && (menu.ruta?.startsWith('/admin') ?? false);
  }
  return false;
}

/** AuthMenuItem enriquecido con el estado activo calculado desde currentPath. */
export interface MenuSearchItem extends AuthMenuItem {
  isActive: boolean;
}

/** Resultado de búsqueda agrupado por módulo. */
export interface MenuSearchResult {
  modulo: AuthMenuModulo;
  menus: MenuSearchItem[];
}

/**
 * Busca en todos los módulos accesibles para el usuario los ítems de menú
 * cuyo nombre, descripción o ruta contengan el query (case-insensitive).
 *
 * @param modulos   Lista de módulos provenientes de AuthContext.menuModulos
 * @param query     Texto ingresado por el usuario
 * @param currentPath  pathname actual (useLocation().pathname)
 * @param userType  Rol del usuario ('platform_admin' | 'tenant_admin' | 'user')
 * @returns Array de resultados agrupados por módulo, vacío si query es vacío
 */
export function searchMenuItems(
  modulos: AuthMenuModulo[],
  query: string,
  currentPath: string,
  userType: string,
): MenuSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: MenuSearchResult[] = [];

  for (const modulo of modulos) {
    const matchedMenus: MenuSearchItem[] = [];

    for (const seccion of modulo.secciones ?? []) {
      for (const menu of seccion.menus ?? []) {
        if (!isMenuVisibleForUser(menu, modulo, userType)) continue;

        const matchesQuery =
          menu.nombre.toLowerCase().includes(normalizedQuery) ||
          (menu.descripcion ?? '').toLowerCase().includes(normalizedQuery) ||
          (menu.ruta ?? '').toLowerCase().includes(normalizedQuery);

        if (matchesQuery) {
          const ruta = menu.ruta
            ? menu.ruta.startsWith('/')
              ? menu.ruta
              : `/${menu.ruta}`
            : '';
          const isActive =
            !!ruta &&
            (currentPath === ruta || currentPath.startsWith(ruta + '/'));

          matchedMenus.push({ ...menu, isActive });
        }
      }
    }

    if (matchedMenus.length > 0) {
      results.push({ modulo, menus: matchedMenus });
    }
  }

  return results;
}
