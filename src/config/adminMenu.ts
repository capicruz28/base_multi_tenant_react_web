// src/config/adminMenu.ts (RENOMBRADO Y AJUSTADO)

import { SidebarMenuItem } from '../types/menu.types'; 

/**
 * Menú de Administración de Tenant - Para Administradores de Cliente
 * Este menú permite gestionar usuarios, roles y configuración dentro del tenant específico
 */

// El campo 'icono' debe coincidir con el nombre de un componente en LucideIcons
export const tenantAdminNavItems: SidebarMenuItem[] = [
  // Título/Separador para Administración del Tenant
  { 
    menu_id: 'tenant_admin_header',
    nombre: 'Administración del Tenant', 
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
  // Opciones de gestión dentro del tenant
  {
    menu_id: 'user_management',
    nombre: 'Gestión de Usuarios',
    ruta: '/admin/usuarios',
    icono: 'Users',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 1,
  },
  {
    menu_id: 'role_management',
    nombre: 'Roles y Permisos',
    ruta: '/admin/roles',
    icono: 'ShieldCheck',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 2,
  },
  {
    menu_id: 'area_management',
    nombre: 'Gestión de Áreas',
    ruta: '/admin/areas',
    icono: 'FolderKanban',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 3,
  },
  {
    menu_id: 'menu_management',
    nombre: 'Gestión de Menús',
    ruta: '/admin/menus',
    icono: 'ListTree',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 4,
  },
  {
    menu_id: 'session_management',
    nombre: 'Sesiones Activas',
    ruta: '/admin/sesiones',
    icono: 'LogOut',
    children: [],
    es_activo: true,
    padre_menu_id: null,
    area_id: null,
    area_nombre: null,
    orden: 5,
  },
];

// ✅ MANTENER compatibilidad hacia atrás (exportación alias)
export const administrationNavItems = tenantAdminNavItems;