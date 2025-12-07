/**
 * Hook para verificación de permisos granulares (LBAC)
 * 
 * Permite verificar si el usuario tiene permisos específicos en módulos
 * Ejemplo: can('planillas', 'crear')
 */
import { useAuth } from '@/shared/context/AuthContext';
import type { PermissionAction } from '../types/permission.types';

/**
 * Hook para verificar permisos del usuario
 * 
 * @example
 * ```tsx
 * const { can, permissions, loading } = usePermissions();
 * 
 * if (can('planillas', 'crear')) {
 *   // Mostrar botón de crear
 * }
 * ```
 */
export const usePermissions = () => {
  const { 
    permissions, 
    isSuperAdmin,
    loading 
  } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico en un módulo
   * 
   * @param module - Nombre del módulo (ej: 'planillas', 'logistica')
   * @param action - Acción a verificar (ej: 'ver', 'crear', 'editar')
   * @returns true si el usuario tiene el permiso, false en caso contrario
   */
  const can = (module: string, action: PermissionAction): boolean => {
    // Super admin tiene todos los permisos
    if (isSuperAdmin) {
      return true;
    }

    // Si permissions es null, significa que es super admin o no hay permisos cargados
    // Si no hay permisos cargados (objeto vacío o null), retornar false
    if (!permissions) {
      // Si es super admin ya retornamos true arriba, así que esto es para usuarios normales sin permisos
      return false;
    }

    // Obtener permisos del módulo
    const modulePermissions = permissions[module];
    if (!modulePermissions) {
      return false;
    }

    // Verificar el permiso específico
    return modulePermissions[action] ?? false;
  };

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   * 
   * @param module - Nombre del módulo
   * @param actions - Array de acciones a verificar
   * @returns true si el usuario tiene al menos uno de los permisos
   */
  const canAny = (module: string, actions: PermissionAction[]): boolean => {
    return actions.some(action => can(module, action));
  };

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * 
   * @param module - Nombre del módulo
   * @param actions - Array de acciones a verificar
   * @returns true si el usuario tiene todos los permisos
   */
  const canAll = (module: string, actions: PermissionAction[]): boolean => {
    return actions.every(action => can(module, action));
  };

  /**
   * Obtiene todos los permisos de un módulo específico
   * 
   * @param module - Nombre del módulo
   * @returns Permisos del módulo o null si no existe
   */
  const getModulePermissions = (module: string) => {
    if (!permissions) return null;
    return permissions[module] || null;
  };

  return {
    can,
    canAny,
    canAll,
    getModulePermissions,
    permissions,
    loading,
    isSuperAdmin,
  };
};

