import type { SidebarMenuItem } from '../../../types/menu.types';

export type RolePermissionsTab = 'acciones' | 'pantallas';

export interface HierarchicalStructure {
  modulo_id: string;
  modulo_nombre: string;
  modulo_icono: string | null;
  modulo_color: string | null;
  secciones: Array<{
    seccion_id: string;
    seccion_nombre: string;
    seccion_icono: string | null;
    menus: SidebarMenuItem[];
  }>;
}

export interface MenuPermissionUpdateItem {
  menu_id: string;
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}
