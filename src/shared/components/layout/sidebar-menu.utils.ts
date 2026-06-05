import type { SidebarMenuItem } from '@/features/admin/types/menu.types';

import type { AuthMenuModulo, AuthMenuItem } from '@/core/auth/types/auth-menu.types';

import { mapLegacyErpPath } from '@/core/routing/post-login-path';

import type { LayoutShellVariant } from './layout-shell.types';

import {

  filterModulosForLayoutShell,

  isMenuItemForLayoutShell,

  isMenuVisibleInPayload,

} from '@/core/auth/utils/menu-shell.utils';



/** @deprecated Solo reportes de migración de rutas; no usar para visibilidad del menú. */

export const ADMIN_MODULE_CODES = new Set<string>(['SYS_ADMIN', 'ADMIN_SYSTEM', 'ADMINISTRACION']);



/**

 * Módulos visibles en el shell actual.

 * Fuente de verdad: payload GET /auth/menu (is_visible, is_enabled) + partición por shell (metadata o ruta).

 */

export function filterModulosForShell(

  modulos: AuthMenuModulo[],

  shell: LayoutShellVariant,

): AuthMenuModulo[] {

  return filterModulosForLayoutShell(modulos, shell);

}



/** Ítem visible en payload y asignado al shell de layout (presentación, no RBAC). */

export function isMenuVisibleForShell(

  menu: AuthMenuItem,

  modulo: AuthMenuModulo,

  shell: LayoutShellVariant,

): boolean {

  return isMenuItemForLayoutShell(menu, modulo, shell);

}



export function normalizeNavRoute(

  ruta: string | null | undefined,

  variant: LayoutShellVariant,

): string | null {

  if (!ruta || ruta === '#') return ruta ?? null;

  const path = ruta.startsWith('/') ? ruta : `/${ruta}`;

  if (variant === 'app') {

    return mapLegacyErpPath(path);

  }

  return path;

}



function normalizeSidebarItemRoutes(

  items: SidebarMenuItem[],

  variant: LayoutShellVariant,

): SidebarMenuItem[] {

  return items.map((item) => ({

    ...item,

    ruta: item.ruta ? normalizeNavRoute(item.ruta, variant) : item.ruta,

    children: normalizeSidebarItemRoutes(item.children || [], variant),

  }));

}



/** Convierte AuthMenuModulo[] en árbol de sidebar; en `app` normaliza rutas a `/app/*`. */

export function transformAuthMenuToSidebarItems(

  modulos: AuthMenuModulo[],

  variant: LayoutShellVariant,

): SidebarMenuItem[] {

  const items: SidebarMenuItem[] = [];

  for (const modulo of modulos) {

    const moduloItem: SidebarMenuItem = {

      menu_id: `modulo-${modulo.modulo_id}`,

      nombre: modulo.nombre,

      icono: modulo.icono,

      ruta: null,

      orden: modulo.orden,

      level: 0,

      es_activo: true,

      padre_menu_id: null,

      area_id: modulo.modulo_id,

      area_nombre: modulo.nombre,

      children: [],

    };

    for (const seccion of modulo.secciones || []) {

      const seccionItem: SidebarMenuItem = {

        menu_id: `seccion-${seccion.seccion_id}`,

        nombre: seccion.nombre,

        icono: seccion.icono,

        ruta: null,

        orden: seccion.orden,

        level: 1,

        es_activo: true,

        padre_menu_id: moduloItem.menu_id,

        area_id: modulo.modulo_id,

        area_nombre: modulo.nombre,

        children: [],

      };

      for (const menu of seccion.menus || []) {

        if (!isMenuVisibleInPayload(menu)) continue;

        const menuItem: SidebarMenuItem = {

          menu_id: menu.menu_id,

          nombre: menu.nombre,

          icono: menu.icono,

          ruta: menu.ruta,

          orden: menu.orden,

          level: 2,

          es_activo: true,

          padre_menu_id: seccionItem.menu_id,

          area_id: modulo.modulo_id,

          area_nombre: modulo.nombre,

          children: (menu.submenus || [])

            .filter((sub: AuthMenuItem) => isMenuVisibleInPayload(sub))

            .map((sub: AuthMenuItem) => ({

              menu_id: sub.menu_id,

              nombre: sub.nombre,

              icono: sub.icono,

              ruta: sub.ruta,

              orden: sub.orden,

              level: 3,

              es_activo: true,

              padre_menu_id: menu.menu_id,

              area_id: modulo.modulo_id,

              area_nombre: modulo.nombre,

              children: [],

            })),

        };

        seccionItem.children.push(menuItem);

      }

      if (seccionItem.children.length > 0) {

        moduloItem.children.push(seccionItem);

      }

    }

    if (moduloItem.children.length > 0) {

      items.push(moduloItem);

    }

  }

  const sortByOrder = (list: SidebarMenuItem[]): SidebarMenuItem[] =>

    [...list]

      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

      .map((item) => ({ ...item, children: sortByOrder(item.children || []) }));

  return normalizeSidebarItemRoutes(sortByOrder(items), variant);

}



/** Rutas de menú en BD que aún no tienen prefijo `/app` (para reporte / migración futura). */

export function listMenuRoutesWithoutAppPrefix(modulos: AuthMenuModulo[]): string[] {

  const routes = new Set<string>();

  const walk = (menus: AuthMenuItem[]) => {

    for (const menu of menus) {

      if (!isMenuVisibleInPayload(menu)) continue;

      if (menu.ruta && menu.ruta !== '#') {

        const path = menu.ruta.startsWith('/') ? menu.ruta : `/${menu.ruta}`;

        if (!path.startsWith('/app/') && !path.startsWith('/admin') && !path.startsWith('/super-admin')) {

          routes.add(path);

        }

      }

      (menu.submenus || []).forEach((sub) => walk([sub]));

    }

  };

  for (const modulo of modulos) {

    for (const seccion of modulo.secciones || []) {

      walk(seccion.menus || []);

    }

  }

  return [...routes].sort();

}


