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
    orden: 5,
  },
];