import { SidebarMenuItem } from '@/features/admin/types/menu.types';

/**
 * Menú de Administración Global - Solo para Super Administradores
 * Este menú permite gestionar clientes, módulos y conexiones a nivel del sistema
 */

export const superAdminNavItems: SidebarMenuItem[] = [
  // Título/Separador para Administración Global
  {
    menu_id: 'super_admin_header',
    nombre: 'Administración Global',
    ruta: null,
    icono: null,
    isSeparator: true,
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: null,
  },
  // Dashboard de Super Admin
  {
    menu_id: 'super_admin_dashboard',
    nombre: 'Dashboard',
    ruta: '/super-admin/dashboard',
    icono: 'LayoutDashboard',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 1,
  },
  // Gestión de Clientes Multi-Tenant
  {
    menu_id: 'client_management',
    nombre: 'Gestión de Clientes',
    ruta: '/super-admin/clientes',
    icono: 'Building2',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 2,
  },
  // Gestión de Módulos del Sistema
  {
    menu_id: 'module_management',
    nombre: 'Módulos del Sistema',
    ruta: '/super-admin/modulos',
    icono: 'Package',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 3,
  },
  // Gestión de Secciones
  {
    menu_id: 'section_management',
    nombre: 'Secciones',
    ruta: '/super-admin/secciones',
    icono: 'Folder',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 4,
  },
  // Gestión de Menús
  {
    menu_id: 'menu_management',
    nombre: 'Menús',
    ruta: '/super-admin/menus',
    icono: 'Menu',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 5,
  },
  // Gestión de Plantillas de Roles
  {
    menu_id: 'role_template_management',
    nombre: 'Plantillas de Roles',
    ruta: '/super-admin/plantillas-roles',
    icono: 'Shield',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 6,
  },
  // Vista Jerárquica
  {
    menu_id: 'hierarchical_view',
    nombre: 'Vista Jerárquica',
    ruta: '/super-admin/vista-jerarquica',
    icono: 'Network',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 7,
  },
  // Auditoría Global del Sistema
  {
    menu_id: 'global_audit',
    nombre: 'Auditoría Global',
    ruta: '/super-admin/auditoria',
    icono: 'ClipboardList',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 8,
  },
];




