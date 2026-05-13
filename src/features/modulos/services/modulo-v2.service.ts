/**
 * Servicio para gestión de módulos V2
 * Endpoints: /modulos-v2/
 * Alineado con la refactorización del backend
 */
import api from '@/core/api/api';
import type {
  ModuloV2,
  ModuloV2Create,
  ModuloV2Update,
  ModuloV2Filters,
  PaginatedModuloV2Response,
  ModuloV2Response,
  ModuloV2DisponiblesResponse,
  ModuloV2ListResponse,
} from '../types/modulo-v2.types';

const BASE_URL = '/modulos-v2';

export const moduloV2Service = {
  /**
   * Listar catálogo de módulos con paginación
   * Endpoint: GET /modulos-v2/
   * Respuesta: { success: boolean, message: string, data: ModuloV2[], pagination: {...} }
   */
  async getModulos(
    filters?: ModuloV2Filters
  ): Promise<PaginatedModuloV2Response> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.codigo) params.append('codigo', filters.codigo);
        if (filters.nombre) params.append('nombre', filters.nombre);
        if (filters.categoria) params.append('categoria', filters.categoria);
        // ✅ CORREGIDO: El backend espera 'solo_activos' en lugar de 'es_activo'
        if (filters.es_activo !== undefined) {
          params.append('solo_activos', filters.es_activo.toString());
        }
        if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
        if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
      }

      const url = params.toString() ? `${BASE_URL}/?${params.toString()}` : `${BASE_URL}/`;
      const { data } = await api.get<ModuloV2ListResponse>(url);
      
      // ✅ El backend devuelve { success, message, data, pagination }
      if (data && data.success && Array.isArray(data.data)) {
        // Convertir a la estructura esperada por el componente
        return {
          items: data.data,
          total: data.pagination?.total || data.data.length,
          page: data.pagination?.current_page || 1,
          size: data.pagination?.limit || data.data.length,
          pages: data.pagination?.total_pages || 1,
        };
      }
      
      // Si la estructura no es la esperada, retornar respuesta vacía
      if (import.meta.env.DEV) {
        console.warn('⚠️ Respuesta inesperada de /modulos-v2/:', data);
      }
      return {
        items: [],
        total: 0,
        page: 1,
        size: 0,
        pages: 0,
      };
    } catch (error) {
      console.error('Error fetching modulos v2:', error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Obtener un módulo por ID
   * Endpoint: GET /modulos-v2/{modulo_id}/
   * Respuesta: { success: boolean, message: string, data: ModuloV2 }
   */
  async getModuloById(moduloId: string): Promise<ModuloV2Response> {
    try {
      interface ModuloV2ByIdResponse {
        success: boolean;
        message: string;
        data: ModuloV2;
      }
      const { data } = await api.get<ModuloV2ByIdResponse>(`${BASE_URL}/${moduloId}/`);
      
      if (data && data.success && data.data) {
        return {
          success: data.success,
          message: data.message,
          data: data.data,
        };
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error fetching modulo ${moduloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Crear un nuevo módulo
   * Endpoint: POST /modulos-v2/
   * Respuesta: { success: boolean, message: string, data: ModuloV2 }
   */
  async createModulo(moduloData: ModuloV2Create): Promise<ModuloV2Response> {
    try {
      interface ModuloV2CreateResponse {
        success: boolean;
        message: string;
        data: ModuloV2;
      }
      const { data } = await api.post<ModuloV2CreateResponse>(`${BASE_URL}/`, moduloData);
      
      if (data && data.success && data.data) {
        return {
          success: data.success,
          message: data.message,
          data: data.data,
        };
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error creating modulo:', error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Actualizar un módulo existente
   * Endpoint: PUT /modulos-v2/{modulo_id}/
   * Respuesta: { success: boolean, message: string, data: ModuloV2 }
   */
  async updateModulo(
    moduloId: string,
    moduloData: ModuloV2Update
  ): Promise<ModuloV2Response> {
    try {
      interface ModuloV2UpdateResponse {
        success: boolean;
        message: string;
        data: ModuloV2;
      }
      const { data } = await api.put<ModuloV2UpdateResponse>(`${BASE_URL}/${moduloId}/`, moduloData);
      
      if (data && data.success && data.data) {
        return {
          success: data.success,
          message: data.message,
          data: data.data,
        };
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error updating modulo ${moduloId}:`, error);
      throw error;
    }
  },

  /**
   * Actualización parcial de un módulo
   * Endpoint: PATCH /modulos-v2/{modulo_id}/
   * ⚠️ DEPRECADO: Para activar/desactivar, usar activateModulo() o deactivateModulo()
   * Respuesta: { success: boolean, message: string, data: ModuloV2 }
   */
  async patchModulo(
    moduloId: string,
    moduloData: Partial<ModuloV2Update>
  ): Promise<ModuloV2Response> {
    try {
      interface ModuloV2PatchResponse {
        success: boolean;
        message: string;
        data: ModuloV2;
      }
      const { data } = await api.patch<ModuloV2PatchResponse>(`${BASE_URL}/${moduloId}/`, moduloData);
      
      if (data && data.success && data.data) {
        return {
          success: data.success,
          message: data.message,
          data: data.data,
        };
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error patching modulo ${moduloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Activar un módulo
   * Endpoint: PATCH /modulos-v2/{modulo_id}/activar/
   * Respuesta: { success: boolean, message: string, data: ModuloV2 }
   */
  async activateModulo(moduloId: string): Promise<ModuloV2Response> {
    try {
      interface ModuloV2ActivateResponse {
        success: boolean;
        message: string;
        data: ModuloV2;
      }
      const { data } = await api.patch<ModuloV2ActivateResponse>(`${BASE_URL}/${moduloId}/activar/`);
      
      if (data && data.success && data.data) {
        return {
          success: data.success,
          message: data.message,
          data: data.data,
        };
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error activating modulo ${moduloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Desactivar un módulo
   * Endpoint: PATCH /modulos-v2/{modulo_id}/desactivar/
   * Respuesta: { success: boolean, message: string, data: ModuloV2 }
   */
  async deactivateModulo(moduloId: string): Promise<ModuloV2Response> {
    try {
      interface ModuloV2DeactivateResponse {
        success: boolean;
        message: string;
        data: ModuloV2;
      }
      const { data } = await api.patch<ModuloV2DeactivateResponse>(`${BASE_URL}/${moduloId}/desactivar/`);
      
      if (data && data.success && data.data) {
        return {
          success: data.success,
          message: data.message,
          data: data.data,
        };
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error deactivating modulo ${moduloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Eliminar un módulo (borrado lógico)
   * Endpoint: DELETE /modulos-v2/{modulo_id}/
   */
  async deleteModulo(moduloId: string): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/${moduloId}/`);
    } catch (error) {
      console.error(`Error deleting modulo ${moduloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Obtener módulos disponibles para un cliente (no activados)
   * Endpoint: GET /modulos-v2/disponibles/{cliente_id}/
   * Retorna los módulos que el cliente puede activar pero aún no tiene activos
   * Respuesta: { success: boolean, message: string, data: ModuloV2[] }
   */
  async getModulosDisponibles(clienteId: string): Promise<ModuloV2[]> {
    try {
      const { data } = await api.get<ModuloV2DisponiblesResponse>(`${BASE_URL}/disponibles/${clienteId}/`);
      
      // ✅ El backend devuelve { success, message, data }
      if (data && data.success && Array.isArray(data.data)) {
        if (import.meta.env.DEV) {
          console.log(`✅ Módulos disponibles obtenidos para cliente ${clienteId}:`, data.data.length);
        }
        return data.data;
      }
      
      // Si la estructura no es la esperada, retornar array vacío
      if (import.meta.env.DEV) {
        console.warn('⚠️ Respuesta inesperada de /modulos-v2/disponibles/:', data);
      }
      return [];
    } catch (error: any) {
      // Si el endpoint retorna 404, significa que no hay módulos disponibles
      if (error?.response?.status === 404) {
        if (import.meta.env.DEV) {
          console.log(`ℹ️ Cliente ${clienteId} no tiene módulos disponibles para activar`);
        }
        return [];
      }
      console.error(`Error fetching modulos disponibles for cliente ${clienteId}:`, error);
      throw error;
    }
  },
};

