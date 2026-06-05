import type { AuthMenuModulo, AuthMenuItem } from '@/core/auth/types/auth-menu.types';
import type { SidebarMenuItem } from '../../../types/menu.types';
import type { HierarchicalStructure } from './role-permissions.types';

function authMenuItemToSidebarItem(
  menu: AuthMenuItem,
  seccionId: string,
  seccionNombre: string,
  parentId: string | null,
): SidebarMenuItem {
  return {
    menu_id: menu.menu_id,
    nombre: menu.nombre,
    icono: menu.icono ?? null,
    ruta: menu.ruta ?? null,
    orden: menu.orden ?? null,
    level: 2,
    es_activo: menu.permisos?.ver ?? true,
    padre_menu_id: parentId,
    area_id: seccionId,
    area_nombre: seccionNombre,
    children: (menu.submenus ?? []).map((child) =>
      authMenuItemToSidebarItem(child, seccionId, seccionNombre, menu.menu_id),
    ),
  };
}

export function authModulosToHierarchical(modulos: AuthMenuModulo[]): HierarchicalStructure[] {
  return modulos.map((mod) => ({
    modulo_id: mod.modulo_id,
    modulo_nombre: mod.nombre,
    modulo_icono: mod.icono ?? null,
    modulo_color: mod.color ?? null,
    secciones: (mod.secciones || []).map((sec) => ({
      seccion_id: sec.seccion_id,
      seccion_nombre: sec.nombre,
      seccion_icono: sec.icono ?? null,
      menus: (sec.menus || []).map((menu) =>
        authMenuItemToSidebarItem(menu, sec.seccion_id, sec.nombre, null),
      ),
    })),
  }));
}

export function collectMenuIdsFromHierarchy(structure: HierarchicalStructure[]): string[] {
  const ids: string[] = [];

  const walk = (node: SidebarMenuItem) => {
    ids.push(node.menu_id);
    node.children.forEach(walk);
  };

  for (const modulo of structure) {
    for (const seccion of modulo.secciones) {
      seccion.menus.forEach(walk);
    }
  }

  return ids;
}

function menuNodeMatchesSearch(node: SidebarMenuItem, query: string): boolean {
  const haystack = node.nombre.toLowerCase();
  if (haystack.includes(query)) return true;
  return node.children.some((child) => menuNodeMatchesSearch(child, query));
}

/** Filtra la jerarquía conservando ramas con al menos un menú que coincida. */
export function filterHierarchicalByMenuSearch(
  structure: HierarchicalStructure[],
  searchTerm: string,
): HierarchicalStructure[] {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return structure;

  return structure
    .map((modulo) => ({
      ...modulo,
      secciones: modulo.secciones
        .map((seccion) => ({
          ...seccion,
          menus: seccion.menus.filter((menu) => menuNodeMatchesSearch(menu, query)),
        }))
        .filter((seccion) => seccion.menus.length > 0),
    }))
    .filter((modulo) => modulo.secciones.length > 0);
}

export function countMenusWithVer(
  structure: HierarchicalStructure[],
  permissions: Record<string, { ver: boolean } | undefined>,
): number {
  let count = 0;
  const walk = (node: SidebarMenuItem) => {
    if (permissions[node.menu_id]?.ver) count += 1;
    node.children.forEach(walk);
  };
  for (const modulo of structure) {
    for (const seccion of modulo.secciones) {
      seccion.menus.forEach(walk);
    }
  }
  return count;
}
