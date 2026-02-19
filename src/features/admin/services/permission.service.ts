import api from '@/core/api/api';
import type { PermissionState } from '../types/permission.types';

interface BackendPermissionItemGetResponse {
  menu_id: string; // UUID format
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_exportar: boolean;
  puede_imprimir: boolean;
  puede_aprobar: boolean;
  permisos_extra: any | null;
  permiso_id: string; // UUID format
  cliente_id: string; // UUID format
  rol_id: string; // UUID format
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  menu_nombre?: string;
  menu_url?: string;
  menu_icono?: string;
}
type BackendGetResponse = BackendPermissionItemGetResponse[];

interface BackendPermissionItemUpdateRequest {
  menu_id: string; // UUID format
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

interface BackendUpdateRequestPayload {
  permisos: BackendPermissionItemUpdateRequest[];
}

interface PermisoCreateUpdate {
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

export const permissionService = {
  getRolePermissions: async (rol_Id: string): Promise<PermissionState> => {
    // ✅ CORREGIDO: Usar el endpoint correcto
    const endpoint = `/permisos/roles/${rol_Id}/permisos/`;
    try {
      const response = await api.get<BackendGetResponse>(endpoint);
      const backendPermissions = response.data;

      if (!Array.isArray(backendPermissions)) {
        console.error(`La respuesta de la API desde ${endpoint} no es un array:`, backendPermissions);
        return {};
      }

      const frontendPermissions: PermissionState = {};
      for (const item of backendPermissions) {
        frontendPermissions[item.menu_id] = {
          ver: item.puede_ver ?? false,
          crear: item.puede_crear ?? false,
          editar: item.puede_editar ?? false,
          eliminar: item.puede_eliminar ?? false,
          exportar: item.puede_exportar ?? false,
          imprimir: item.puede_imprimir ?? false,
          aprobar: item.puede_aprobar ?? false,
        };
      }
      
      if (import.meta.env.DEV) {
        console.log("✅ [PermissionService] Permisos transformados:", {
          total: Object.keys(frontendPermissions).length,
          permisos: frontendPermissions,
          backendResponse: backendPermissions,
        });
      }

      return frontendPermissions;

    } catch (error) {
      console.error(`Error fetching permissions for rol ${rol_Id} from ${endpoint}:`, error);
      throw new Error('Error al obtener los permisos del rol.');
    }
  },

  /**
   * ⚠️ DEPRECADO: Este método usa el endpoint antiguo que ya no funciona
   * Usar updateRolePermissionsBatch en su lugar
   * @deprecated Usar updateRolePermissionsBatch
   */
  updateRolePermissions: async (rol_Id: string, payload: BackendUpdateRequestPayload): Promise<void> => {
    // ✅ CAMBIO: agregado / al final
    const endpoint = `/roles/${rol_Id}/permisos/`;
    try {
      console.log("Permissions Service - Sending PUT Request Payload:", payload);
      await api.put<void>(endpoint, payload);
    } catch (error) {
      console.error(`Error updating permissions for rol ${rol_Id} at ${endpoint}:`, error);
      throw new Error('Error al actualizar los permisos del rol.');
    }
  },

  /**
   * ✅ NUEVO: Actualiza permisos de un rol para múltiples menús
   * Usa el endpoint PUT /permisos/roles/{rol_id}/menus/{menu_id}/ para cada menú
   */
  updateRolePermissionsBatch: async (
    rolId: string,
    permisos: BackendPermissionItemUpdateRequest[]
  ): Promise<void> => {
    try {
      console.log(`Permissions Service - Updating permissions for rol ${rolId}`, { totalMenus: permisos.length });

      // Actualizar cada permiso individualmente usando el endpoint correcto
      const updatePromises = permisos.map(async (permiso) => {
        const endpoint = `/permisos/roles/${rolId}/menus/${permiso.menu_id}/`;
        const payload: PermisoCreateUpdate = {
          puede_ver: permiso.puede_ver,
          puede_editar: permiso.puede_editar,
          puede_eliminar: permiso.puede_eliminar,
        };

        if (import.meta.env.DEV) {
          console.log(`Updating permission for menu ${permiso.menu_id}:`, payload);
        }

        await api.put<void>(endpoint, payload);
      });

      // Ejecutar todas las actualizaciones en paralelo
      await Promise.all(updatePromises);

      if (import.meta.env.DEV) {
        console.log(`✅ Successfully updated ${permisos.length} permissions for rol ${rolId}`);
      }
    } catch (error) {
      console.error(`Error updating permissions batch for rol ${rolId}:`, error);
      throw new Error('Error al actualizar los permisos del rol.');
    }
  }
};