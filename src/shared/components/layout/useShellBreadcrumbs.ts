import { useMemo } from 'react';
import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import type { SidebarMenuItem } from '@/features/admin/types/menu.types';
import type { LayoutShellVariant } from './layout-shell.types';
import { SHELL_ADMIN_SECTION_TITLE } from './layout-shell.types';
import { resolveAccountCenterBreadcrumbs } from '@/features/account/utils/account-center-breadcrumbs.utils';
import {
  filterModulosForShell,
  isMenuVisibleForShell,
  normalizeNavRoute,
  transformAuthMenuToSidebarItems,
} from './sidebar-menu.utils';

export interface ShellBreadcrumbItem {
  nombre: string;
  ruta?: string | null;
}

function findBreadcrumbInSidebarTree(
  items: SidebarMenuItem[],
  targetPath: string,
  current: ShellBreadcrumbItem[] = [],
): ShellBreadcrumbItem[] | null {
  for (const item of items) {
    const itemPath = item.ruta ? (item.ruta.startsWith('/') ? item.ruta : `/${item.ruta}`) : '#';
    const isSection = item.menu_id.startsWith('seccion-');
    const newBreadcrumb = isSection
      ? current
      : [...current, { nombre: item.nombre, ruta: item.ruta || null }];

    if (item.ruta && itemPath === targetPath) {
      return newBreadcrumb;
    }

    if (item.children?.length) {
      const childResult = findBreadcrumbInSidebarTree(item.children, targetPath, newBreadcrumb);
      if (childResult) return childResult;
    }

    if (item.ruta && targetPath.startsWith(itemPath) && itemPath !== '/') {
      return newBreadcrumb;
    }
  }
  return null;
}

function resolveFromAdminFlatItems(
  adminMenuItems: SidebarMenuItem[],
  pathname: string,
  shell: LayoutShellVariant,
): ShellBreadcrumbItem[] | null {
  const adminItem = adminMenuItems.find((item) => {
    if (item.isSeparator) return false;
    const itemPath = item.ruta ? (item.ruta.startsWith('/') ? item.ruta : `/${item.ruta}`) : '#';
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  });

  if (!adminItem) return null;

  const adminTitle = SHELL_ADMIN_SECTION_TITLE[shell] ?? 'Administración';
  return [
    { nombre: adminTitle, ruta: null },
    { nombre: adminItem.nombre, ruta: adminItem.ruta || null },
  ];
}

function resolveFromModulosWalk(
  menuModulos: AuthMenuModulo[],
  shell: LayoutShellVariant,
  pathname: string,
): ShellBreadcrumbItem[] | null {
  for (const modulo of filterModulosForShell(menuModulos, shell)) {
    for (const seccion of modulo.secciones ?? []) {
      for (const menu of seccion.menus ?? []) {
        if (!isMenuVisibleForShell(menu, modulo, shell) || !menu.ruta) continue;

        const raw = menu.ruta.startsWith('/') ? menu.ruta : `/${menu.ruta}`;
        const menuPath = normalizeNavRoute(raw, shell) ?? raw;

        if (pathname === menuPath || pathname.startsWith(`${menuPath}/`)) {
          return [
            { nombre: modulo.nombre, ruta: null },
            { nombre: menu.nombre, ruta: menuPath },
          ];
        }

        for (const sub of menu.submenus ?? []) {
          if (!sub.is_visible || !sub.is_enabled || !sub.ruta) continue;
          const subRaw = sub.ruta.startsWith('/') ? sub.ruta : `/${sub.ruta}`;
          const subPath = normalizeNavRoute(subRaw, shell) ?? subRaw;
          if (pathname === subPath || pathname.startsWith(`${subPath}/`)) {
            return [
              { nombre: modulo.nombre, ruta: null },
              { nombre: menu.nombre, ruta: menuPath },
              { nombre: sub.nombre, ruta: subPath },
            ];
          }
        }
      }
    }
  }
  return null;
}

/** Resuelve breadcrumbs para el shell y pathname actuales (sin escribir en contexto). */
export function resolveShellBreadcrumbs(
  menuModulos: AuthMenuModulo[] | null,
  shell: LayoutShellVariant,
  pathname: string,
  adminMenuItems: SidebarMenuItem[] = [],
): ShellBreadcrumbItem[] {
  if (shell === 'app') {
    const accountCrumbs = resolveAccountCenterBreadcrumbs(pathname);
    if (accountCrumbs) return accountCrumbs;
  }

  if (!menuModulos || menuModulos.length === 0) {
    return resolveFromAdminFlatItems(adminMenuItems, pathname, shell) ?? [];
  }

  if (shell === 'app') {
    const tree = transformAuthMenuToSidebarItems(
      filterModulosForShell(menuModulos, 'app'),
      'app',
    );
    const fromTree = findBreadcrumbInSidebarTree(tree, pathname);
    if (fromTree) return fromTree;
  } else {
    const fromWalk = resolveFromModulosWalk(menuModulos, shell, pathname);
    if (fromWalk) return fromWalk;
  }

  return resolveFromAdminFlatItems(adminMenuItems, pathname, shell) ?? [];
}

/**
 * Breadcrumbs derivados del menú de auth y shell actual.
 * El consumidor (Header) es el único que debe escribir en BreadcrumbContext.
 */
export function useShellBreadcrumbs(
  menuModulos: AuthMenuModulo[] | null,
  shell: LayoutShellVariant,
  pathname: string,
  adminMenuItems: SidebarMenuItem[] = [],
): ShellBreadcrumbItem[] {
  return useMemo(
    () => resolveShellBreadcrumbs(menuModulos, shell, pathname, adminMenuItems),
    [menuModulos, shell, pathname, adminMenuItems],
  );
}
