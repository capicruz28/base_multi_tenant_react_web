// src/shared/utils/menuSearch.ts
import type { AuthMenuModulo, AuthMenuItem } from '../../core/auth/types/auth-menu.types';
import type { LayoutShellVariant } from '@/shared/components/layout/layout-shell.types';
import {
  isMenuVisibleForShell,
  normalizeNavRoute,
} from '@/shared/components/layout/sidebar-menu.utils';

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
 * @param shell  Contexto de layout ('app' | 'admin' | 'super-admin')
 */
export function searchMenuItems(
  modulos: AuthMenuModulo[],
  query: string,
  currentPath: string,
  shell: LayoutShellVariant,
): MenuSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: MenuSearchResult[] = [];

  for (const modulo of modulos) {
    const matchedMenus: MenuSearchItem[] = [];

    for (const seccion of modulo.secciones ?? []) {
      for (const menu of seccion.menus ?? []) {
        if (!isMenuVisibleForShell(menu, modulo, shell)) continue;

        const matchesQuery =
          menu.nombre.toLowerCase().includes(normalizedQuery) ||
          (menu.descripcion ?? '').toLowerCase().includes(normalizedQuery) ||
          (menu.ruta ?? '').toLowerCase().includes(normalizedQuery);

        if (matchesQuery) {
          const raw = menu.ruta
            ? menu.ruta.startsWith('/')
              ? menu.ruta
              : `/${menu.ruta}`
            : '';
          const ruta = raw ? normalizeNavRoute(raw, shell) ?? raw : '';
          const isActive =
            !!ruta &&
            (currentPath === ruta || currentPath.startsWith(ruta + '/'));

          matchedMenus.push({ ...menu, ruta: ruta || menu.ruta, isActive });
        }
      }
    }

    if (matchedMenus.length > 0) {
      results.push({ modulo, menus: matchedMenus });
    }
  }

  return results;
}
