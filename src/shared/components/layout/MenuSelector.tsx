import { useMemo } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import type { SidebarMenuItem } from '@/features/admin/types/menu.types';
import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import { useLayoutShell } from './LayoutShellContext';
import { filterModulosForShell } from './sidebar-menu.utils';
import { isMenuVisibleInPayload } from '@/core/auth/utils/menu-shell.utils';

/**
 * Lista plana de administración desde /auth/menu (módulos ya filtrados por shell).
 */
function transformAdminMenuFromAuthMenu(modulos: AuthMenuModulo[]): SidebarMenuItem[] {
  const items: SidebarMenuItem[] = [];

  for (const modulo of modulos) {
    for (const seccion of modulo.secciones || []) {
      const visibleMenus = (seccion.menus || []).filter((m) => isMenuVisibleInPayload(m));
      if (visibleMenus.length === 0) continue;

      const firstMenuRuta = visibleMenus[0].ruta;
      const baseOrden = (modulo.orden ?? 0) * 1_000_000 + (seccion.orden ?? 0) * 1_000;

      items.push({
        menu_id: `separator-${seccion.seccion_id}`,
        nombre: seccion.nombre,
        ruta: firstMenuRuta,
        icono: null,
        children: [],
        es_activo: true,
        padre_menu_id: null,
        area_id: modulo.modulo_id,
        area_nombre: modulo.nombre,
        orden: baseOrden - 1,
        isSeparator: true,
      });

      for (const menu of visibleMenus) {
        items.push({
          menu_id: menu.menu_id,
          nombre: menu.nombre,
          ruta: menu.ruta,
          icono: menu.icono,
          children: [],
          es_activo: true,
          padre_menu_id: null,
          area_id: modulo.modulo_id,
          area_nombre: modulo.nombre,
          orden: baseOrden + menu.orden,
        });
      }
    }
  }

  return items.slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

/**
 * Menú de administración desde GET /auth/menu, particionado por shell de layout (admin | super-admin).
 */
export const useAdminMenuItems = (): { items: SidebarMenuItem[]; loading: boolean } => {
  const { menuModulos: menu } = useAuth();
  const shell = useLayoutShell();

  const loading = menu === null;

  const items = useMemo(() => {
    if (!menu) return [];
    if (shell === 'app') return [];
    const forShell = filterModulosForShell(menu, shell);
    return transformAdminMenuFromAuthMenu(forShell);
  }, [menu, shell]);

  return { items, loading };
};
