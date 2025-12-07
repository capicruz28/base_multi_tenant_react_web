/**
 * Servicio para gestión de permisos granulares
 * 
 * Calcula permisos del usuario desde sus roles usando la tabla rol_menu_permiso
 */
import api from '@/core/api/api';
import type { 
  BackendRolePermission, 
  UserPermissions, 
  MenuIdToModuleMap 
} from '../types/permission.types';

/**
 * Obtiene los permisos de un rol específico desde el backend
 * 
 * Si el endpoint no está disponible, retorna array vacío (no bloquea el login)
 */
const getRolePermissions = async (rolId: string): Promise<BackendRolePermission[]> => {
  try {
    const response = await api.get<BackendRolePermission[]>(`/roles/${rolId}/permisos/`);
    return response.data;
  } catch (error: any) {
    // Si el endpoint no existe (404) o hay error de validación (422), no bloquear
    const status = error?.response?.status;
    if (status === 404 || status === 422 || status === 500) {
      console.warn(`⚠️ [PermissionService] Endpoint /roles/${rolId}/permisos/ no disponible (${status}). Usando permisos basados en roles.`);
      return [];
    }
    // Para otros errores, también retornar vacío para no bloquear
    console.warn(`⚠️ [PermissionService] Error obteniendo permisos del rol ${rolId}:`, error?.message || error);
    return [];
  }
};

/**
 * Obtiene el mapeo de menu_id a nombre de módulo desde el backend
 * 
 * Si el endpoint no está disponible, retorna mapeo vacío (no bloquea el login)
 */
const getMenuIdToModuleMap = async (): Promise<MenuIdToModuleMap> => {
  try {
    // Intentar obtener desde el backend si existe endpoint
    const menuServiceModule = await import('@/features/admin/services/menu.service');
    const menus = await menuServiceModule.menuService.getFullMenuTree();
    
    // Si getFullMenuTree retorna array vacío (porque falló), retornar mapeo vacío
    if (!menus || menus.length === 0) {
      console.warn('⚠️ [PermissionService] No se pudieron obtener menús. Usando permisos basados en roles.');
      return {};
    }
    
    const map: MenuIdToModuleMap = {};
    
    // Función recursiva para mapear menús
    const mapMenus = (items: any[]) => {
      items.forEach(item => {
        if (item.menu_id && item.ruta) {
          // Extraer nombre del módulo desde la ruta
          // Ejemplo: '/planillas/empleados' -> 'planillas'
          const moduleName = item.ruta.split('/').filter(Boolean)[0];
          if (moduleName) {
            map[item.menu_id] = moduleName;
          }
        }
        if (item.children && Array.isArray(item.children)) {
          mapMenus(item.children);
        }
      });
    };
    
    mapMenus(menus);
    return map;
  } catch (error: any) {
    // No bloquear si el endpoint no está disponible
    console.warn('⚠️ [PermissionService] Error obteniendo mapeo de menús:', error?.message || error);
    // Retornar mapeo vacío si falla
    return {};
  }
};

/**
 * Agrega permisos de múltiples roles
 * Si un rol tiene un permiso, el resultado lo tendrá (OR lógico)
 */
const mergeRolePermissions = (
  permissions1: UserPermissions,
  permissions2: UserPermissions
): UserPermissions => {
  const merged: UserPermissions = { ...permissions1 };
  
  Object.keys(permissions2).forEach(module => {
    if (!merged[module]) {
      merged[module] = { ...permissions2[module] };
    } else {
      // Merge: si cualquiera de los roles tiene el permiso, el usuario lo tiene
      merged[module] = {
        ver: merged[module].ver || permissions2[module].ver,
        crear: merged[module].crear || permissions2[module].crear,
        editar: merged[module].editar || permissions2[module].editar,
        eliminar: merged[module].eliminar || permissions2[module].eliminar,
        exportar: merged[module].exportar || permissions2[module].exportar,
        imprimir: merged[module].imprimir || permissions2[module].imprimir,
      };
    }
  });
  
  return merged;
};

/**
 * Calcula los permisos agregados del usuario desde sus roles
 * 
 * @param roleIds - Array de IDs de roles del usuario
 * @returns Permisos agregados del usuario organizados por módulo
 */
export const calculateUserPermissions = async (
  roleIds: string[]
): Promise<UserPermissions> => {
  if (!roleIds || roleIds.length === 0) {
    return {};
  }
  
  try {
    // Obtener mapeo de menu_id a módulo
    const menuIdToModule = await getMenuIdToModuleMap();
    
    // Obtener permisos de cada rol
    const rolePermissionsPromises = roleIds.map(rolId => getRolePermissions(rolId));
    const rolePermissionsArrays = await Promise.all(rolePermissionsPromises);
    
    // Agregar permisos de todos los roles
    let aggregatedPermissions: UserPermissions = {};
    
    // Si no hay mapeo de menús y no hay permisos de roles, retornar vacío
    const hasMenuMapping = Object.keys(menuIdToModule).length > 0;
    const hasRolePermissions = rolePermissionsArrays.some(arr => arr.length > 0);
    
    if (!hasMenuMapping && !hasRolePermissions) {
      console.warn('⚠️ [PermissionService] No se pudieron obtener permisos desde el backend. Los endpoints pueden no estar disponibles. El sistema funcionará con permisos basados en roles (RBAC).');
      return {};
    }
    
    if (!hasMenuMapping) {
      console.warn('⚠️ [PermissionService] No se pudo obtener mapeo de menús. Los permisos granulares pueden no funcionar correctamente.');
    }
    
    if (!hasRolePermissions) {
      console.warn('⚠️ [PermissionService] No se pudieron obtener permisos de roles desde el backend. Los permisos granulares pueden no funcionar correctamente.');
    }
    
    rolePermissionsArrays.forEach(rolePermissions => {
      const modulePermissions: UserPermissions = {};
      
      rolePermissions.forEach(perm => {
        // Obtener nombre del módulo desde el mapeo
        const moduleName = menuIdToModule[perm.menu_id];
        
        if (!moduleName) {
          // Si no hay mapeo, usar menu_id como fallback (no ideal, pero funcional)
          console.warn(`⚠️ [PermissionService] No se encontró mapeo para menu_id: ${perm.menu_id}`);
          return;
        }
        
        // Si el módulo ya existe, mergear permisos (OR lógico)
        if (modulePermissions[moduleName]) {
          modulePermissions[moduleName] = {
            ver: modulePermissions[moduleName].ver || perm.puede_ver,
            crear: modulePermissions[moduleName].crear || (perm.puede_crear ?? false),
            editar: modulePermissions[moduleName].editar || perm.puede_editar,
            eliminar: modulePermissions[moduleName].eliminar || perm.puede_eliminar,
            exportar: modulePermissions[moduleName].exportar || (perm.puede_exportar ?? false),
            imprimir: modulePermissions[moduleName].imprimir || (perm.puede_imprimir ?? false),
          };
        } else {
          // Crear nuevo módulo
          modulePermissions[moduleName] = {
            ver: perm.puede_ver,
            crear: perm.puede_crear ?? false,
            editar: perm.puede_editar,
            eliminar: perm.puede_eliminar,
            exportar: perm.puede_exportar ?? false,
            imprimir: perm.puede_imprimir ?? false,
          };
        }
      });
      
      // Mergear con permisos agregados
      aggregatedPermissions = mergeRolePermissions(aggregatedPermissions, modulePermissions);
    });
    
    const moduleCount = Object.keys(aggregatedPermissions).length;
    if (moduleCount > 0) {
      console.log(`✅ [PermissionService] Permisos calculados: ${moduleCount} módulo(s)`);
    } else {
      console.warn('⚠️ [PermissionService] No se pudieron calcular permisos granulares. El sistema usará permisos basados en roles (RBAC).');
    }
    return aggregatedPermissions;
  } catch (error) {
    console.error('Error calculando permisos del usuario:', error);
    // Retornar permisos vacíos en caso de error
    return {};
  }
};

/**
 * Obtiene permisos del usuario actual desde el backend
 * 
 * Si el backend tiene endpoint GET /auth/me/permisos/, usar este método
 * Si no, usar calculateUserPermissions() con los roles del usuario
 */
export const getUserPermissions = async (
  roleIds: string[]
): Promise<UserPermissions> => {
  // TODO: Intentar obtener desde endpoint directo si existe
  // try {
  //   const response = await api.get<UserPermissions>('/auth/me/permisos/');
  //   return response.data;
  // } catch (error) {
  //   // Si no existe el endpoint, calcular desde roles
  //   return calculateUserPermissions(roleIds);
  // }
  
  // Por ahora, calcular desde roles
  return calculateUserPermissions(roleIds);
};

