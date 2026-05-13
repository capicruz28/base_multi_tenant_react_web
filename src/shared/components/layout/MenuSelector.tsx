import { useMemo } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import type { SidebarMenuItem } from '@/features/admin/types/menu.types';
import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import { ERP_MODULES } from '@/core/constants/erp-modules';

// Conjunto de códigos de módulos ERP para separar módulos de negocio vs administración
const ERP_CODES = new Set(ERP_MODULES.map((m) => m.codigo));

/**
 * Transforma los módulos NO ERP de /auth/menu en items de sidebar
 * para la sección de Administración (Super Admin / Tenant Admin).
 *
 * Respeta la estructura módulo → sección → menú insertando separadores
 * (isSeparator) al inicio de cada sección para agrupar visualmente los menús.
 * El separador hereda la ruta del primer menú de la sección para que el filtro
 * global/tenant (por prefijo /super-admin vs /admin) funcione correctamente.
 *
 * La estructura visual (render) se mantiene en NewSidebar;
 * aquí solo cambiamos la fuente de datos.
 */
function transformAdminMenuFromAuthMenu(modulos: AuthMenuModulo[]): SidebarMenuItem[] {
  const adminModules = modulos.filter((modulo) => !ERP_CODES.has(modulo.codigo));

  const items: SidebarMenuItem[] = [];

  for (const modulo of adminModules) {
    for (const seccion of modulo.secciones || []) {
      const visibleMenus = (seccion.menus || []).filter(
        (m) => m.is_visible && m.is_enabled
      );
      if (visibleMenus.length === 0) continue;

      const firstMenuRuta = visibleMenus[0].ruta;
      const baseOrden = (modulo.orden ?? 0) * 1_000_000 + (seccion.orden ?? 0) * 1_000;

      // Separador de sección (permite que el filtro global/tenant lo enrute correctamente)
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
 * Selector de menú de administración basado en /auth/menu.
 *
 * - Elimina la lógica basada en isSuperAdmin/accessLevel/userType.
 * - No usa menús hardcodeados; todo viene de AuthContext (GET /auth/menu).
 */
export const useAdminMenuItems = (): { items: SidebarMenuItem[]; loading: boolean } => {
  const { menuModulos: menu } = useAuth();

  const loading = menu === null;

  const items = useMemo(
    () => (menu ? transformAdminMenuFromAuthMenu(menu as AuthMenuModulo[]) : []),
    [menu]
  );

  if (import.meta.env.DEV) {
    // Debug temporal para verificar estructura real del menú desde AuthContext
    // eslint-disable-next-line no-console
    console.log('MENU FROM AUTH:', menu);
  }

  return { items, loading };
};

