/**
 * Tipos para el sistema de permisos granulares (LBAC)
 * 
 * Basado en la tabla rol_menu_permiso de la BD:
 * - puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, puede_imprimir
 */

/**
 * Acciones de permisos disponibles
 */
export type PermissionAction = 
  | 'ver' 
  | 'crear' 
  | 'editar' 
  | 'eliminar' 
  | 'exportar' 
  | 'imprimir';

/**
 * Permisos de un módulo específico
 * Ejemplo: { ver: true, crear: false, editar: true, eliminar: false, exportar: false, imprimir: false }
 */
export interface ModulePermissions {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  exportar: boolean;
  imprimir: boolean;
}

/**
 * Permisos del usuario organizados por módulo
 * Key = nombre del módulo (ej: 'planillas', 'logistica')
 * Value = permisos del módulo
 * 
 * Ejemplo:
 * {
 *   planillas: { ver: true, crear: false, editar: true, eliminar: false, exportar: false, imprimir: false },
 *   logistica: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, imprimir: false }
 * }
 */
export type UserPermissions = Record<string, ModulePermissions>;

/**
 * Respuesta del backend para permisos de un rol
 * (Desde GET /roles/{rol_id}/permisos/)
 */
export interface BackendRolePermission {
  menu_id: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_exportar?: boolean;
  puede_imprimir?: boolean;
  rol_menu_id: string;
  rol_id: string;
}

/**
 * Mapeo de menu_id a nombre de módulo
 * Se usa para convertir menu_id (UUID) a nombre de módulo legible
 * 
 * Este mapeo debe mantenerse sincronizado con la tabla menu de la BD
 * o obtenerse dinámicamente desde el backend
 */
export type MenuIdToModuleMap = Record<string, string>;

