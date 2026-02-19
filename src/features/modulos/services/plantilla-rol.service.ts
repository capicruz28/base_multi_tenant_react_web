/**
 * Servicio para gestión de plantillas de roles
 * Endpoints: /plantillas-roles/
 * Alineado con la refactorización del backend
 */
import api from '@/core/api/api';
import type {
  PlantillaRol,
  PlantillaRolCreate,
  PlantillaRolUpdate,
  PlantillaRolFilters,
  PaginatedPlantillaRolResponse,
  PlantillaRolResponse,
} from '../types/plantilla-rol.types';

const BASE_URL = '/plantillas-roles';

export const plantillaRolService = {
  /**
   * Listar plantillas de roles con paginación
   * ✅ ACTUALIZADO: Si hay modulo_id, usar el endpoint específico GET /plantillas-roles/modulo/{modulo_id}/
   * Endpoint: GET /plantillas-roles/modulo/{modulo_id}/
   */
  async getPlantillas(
    filters?: PlantillaRolFilters
  ): Promise<PaginatedPlantillaRolResponse> {
    try {
      // ✅ ACTUALIZADO: Si hay modulo_id, usar el endpoint específico
      if (filters?.modulo_id) {
        return await this.getPlantillasByModulo(filters.modulo_id, filters);
      }
      
      // ⚠️ Si no hay modulo_id, el endpoint genérico puede no estar disponible
      // Por ahora, retornar vacío con un warning
      if (import.meta.env.DEV) {
        console.warn('⚠️ [PlantillaRolService] getPlantillas() llamado sin modulo_id. El endpoint /plantillas-roles/ puede no estar disponible. Use getPlantillasByModulo() en su lugar.');
      }
      
      return {
        items: [],
        total: 0,
        page: 1,
        size: filters?.limit || 20,
        pages: 0,
      };
    } catch (error) {
      console.error('Error fetching plantillas roles:', error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Obtener plantillas de roles de un módulo específico
   * Endpoint: GET /plantillas-roles/modulo/{modulo_id}/
   * Respuesta: { success: boolean, message: string, data: BackendPlantillaRol[] }
   */
  async getPlantillasByModulo(
    moduloId: string,
    filters?: PlantillaRolFilters
  ): Promise<PaginatedPlantillaRolResponse> {
    if (!moduloId || typeof moduloId !== 'string') {
      throw new Error('moduloId es requerido y debe ser un string');
    }

    try {
      // ✅ ACTUALIZADO: El backend devuelve campos diferentes
      interface BackendPlantillaRol {
        plantilla_id: string; // ✅ Backend usa plantilla_id
        modulo_id: string;
        nombre_rol: string; // ✅ Backend usa nombre_rol
        descripcion?: string | null;
        nivel_acceso?: number;
        permisos_json: string; // ✅ Backend devuelve como string JSON
        es_activo: boolean; // ✅ Backend usa es_activo
        orden?: number;
        fecha_creacion?: string | null;
        fecha_actualizacion?: string | null;
      }

      interface PlantillasByModuloResponse {
        success: boolean;
        message: string;
        data: BackendPlantillaRol[];
      }

      const endpoint = `${BASE_URL}/modulo/${moduloId}/`;
      const { data } = await api.get<PlantillasByModuloResponse>(endpoint);
      
      if (data && data.success && Array.isArray(data.data)) {
        // ✅ Mapear campos del backend al tipo TypeScript
        let plantillas: PlantillaRol[] = data.data.map(backendPlantilla => {
          // Parsear permisos_json de string a objeto
          let permisosParsed: Record<string, any> = {};
          try {
            if (typeof backendPlantilla.permisos_json === 'string') {
              permisosParsed = JSON.parse(backendPlantilla.permisos_json);
            } else if (backendPlantilla.permisos_json) {
              permisosParsed = backendPlantilla.permisos_json;
            }
          } catch (parseError) {
            if (import.meta.env.DEV) {
              console.warn('⚠️ Error parseando permisos_json:', parseError, backendPlantilla.permisos_json);
            }
          }

          return {
            plantilla_rol_id: backendPlantilla.plantilla_id, // ✅ Mapear plantilla_id -> plantilla_rol_id
            modulo_id: backendPlantilla.modulo_id,
            nombre: backendPlantilla.nombre_rol, // ✅ Mapear nombre_rol -> nombre
            descripcion: backendPlantilla.descripcion,
            permisos_json: permisosParsed,
            es_activa: backendPlantilla.es_activo, // ✅ Mapear es_activo -> es_activa
            fecha_creacion: backendPlantilla.fecha_creacion,
            fecha_actualizacion: backendPlantilla.fecha_actualizacion,
          };
        });

        // Aplicar filtros adicionales en el frontend si es necesario
        if (filters?.es_activa !== undefined) {
          plantillas = plantillas.filter(p => p.es_activa === filters.es_activa);
        }
        
        if (filters?.nombre) {
          const searchLower = filters.nombre.toLowerCase();
          plantillas = plantillas.filter(p => 
            p.nombre?.toLowerCase().includes(searchLower)
          );
        }

        // Aplicar paginación en el frontend
        const skip = filters?.skip || 0;
        const limit = filters?.limit || 20;
        const paginatedItems = plantillas.slice(skip, skip + limit);
        
        if (import.meta.env.DEV) {
          console.log(`✅ [PlantillaRolService] Plantillas obtenidas para módulo ${moduloId}:`, {
            total: plantillas.length,
            filtradas: paginatedItems.length,
            filters,
          });
        }
        
        return {
          items: paginatedItems,
          total: plantillas.length,
          page: Math.floor(skip / limit) + 1,
          size: limit,
          pages: Math.ceil(plantillas.length / limit),
        };
      } else {
        console.error(`Respuesta inesperada de ${endpoint}:`, data);
        return {
          items: [],
          total: 0,
          page: 1,
          size: filters?.limit || 20,
          pages: 0,
        };
      }
    } catch (error: any) {
      // Si el endpoint retorna 404, significa que no hay plantillas
      if (error?.response?.status === 404) {
        if (import.meta.env.DEV) {
          console.log(`ℹ️ Módulo ${moduloId} no tiene plantillas aún`);
        }
        return {
          items: [],
          total: 0,
          page: 1,
          size: filters?.limit || 20,
          pages: 0,
        };
      }
      console.error(`Error fetching plantillas for modulo ${moduloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Obtener una plantilla por ID
   * Endpoint: GET /plantillas-roles/{plantilla_id}/
   * Respuesta: { success: boolean, message: string, data: PlantillaRol }
   */
  async getPlantillaById(plantillaRolId: string): Promise<PlantillaRolResponse> {
    try {
      interface ModuloRolPlantillaByIdResponse {
        success: boolean;
        message: string;
        data: {
          plantilla_id: string;
          modulo_id: string;
          nombre_rol: string;
          descripcion?: string | null;
          nivel_acceso?: number;
          permisos_json: string;
          es_activo: boolean;
          orden?: number;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }
      const { data } = await api.get<ModuloRolPlantillaByIdResponse>(`${BASE_URL}/${plantillaRolId}/`);
      
      if (data && data.success && data.data) {
        let permisosParsed: Record<string, any> = {};
        try {
          if (typeof data.data.permisos_json === 'string') {
            permisosParsed = JSON.parse(data.data.permisos_json);
          } else if (data.data.permisos_json) {
            permisosParsed = data.data.permisos_json;
          }
        } catch (parseError) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Error parseando permisos_json:', parseError);
          }
        }

        const plantillaResponse: PlantillaRolResponse = {
          success: data.success,
          message: data.message,
          data: {
            plantilla_rol_id: data.data.plantilla_id,
            modulo_id: data.data.modulo_id,
            nombre: data.data.nombre_rol,
            descripcion: data.data.descripcion,
            permisos_json: permisosParsed,
            es_activa: data.data.es_activo,
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return plantillaResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error fetching plantilla ${plantillaRolId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Crear una nueva plantilla de rol
   * Endpoint: POST /plantillas-roles/
   * El backend espera ModuloRolPlantillaCreate con nombre_rol y permisos_json como string
   */
  async createPlantilla(plantillaData: PlantillaRolCreate): Promise<PlantillaRolResponse> {
    try {
      // ✅ Transformar PlantillaRolCreate a ModuloRolPlantillaCreate
      interface ModuloRolPlantillaCreatePayload {
        nombre_rol: string; // ✅ Backend usa nombre_rol
        modulo_id: string;
        descripcion?: string | null;
        nivel_acceso?: number;
        permisos_json: string; // ✅ Backend espera string JSON
        es_activo?: boolean; // ✅ Backend usa es_activo
        orden?: number;
      }

      const payload: ModuloRolPlantillaCreatePayload = {
        nombre_rol: plantillaData.nombre || '', // ✅ Mapear nombre -> nombre_rol
        modulo_id: plantillaData.modulo_id,
        descripcion: plantillaData.descripcion || null,
        nivel_acceso: (plantillaData as any).nivel_acceso || 1,
        permisos_json: typeof plantillaData.permisos_json === 'string' 
          ? plantillaData.permisos_json 
          : JSON.stringify(plantillaData.permisos_json || {}), // ✅ Convertir objeto a string JSON
        es_activo: plantillaData.es_activa !== undefined ? plantillaData.es_activa : true, // ✅ Mapear es_activa -> es_activo
        orden: (plantillaData as any).orden || 0,
      };

      interface ModuloRolPlantillaResponse {
        success: boolean;
        message: string;
        data: {
          plantilla_id: string; // ✅ Backend devuelve plantilla_id
          modulo_id: string;
          nombre_rol: string; // ✅ Backend devuelve nombre_rol
          descripcion?: string | null;
          nivel_acceso?: number;
          permisos_json: string; // ✅ Backend devuelve como string
          es_activo: boolean; // ✅ Backend devuelve es_activo
          orden?: number;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }

      const { data } = await api.post<ModuloRolPlantillaResponse>(`${BASE_URL}/`, payload);
      
      if (data && data.success && data.data) {
        // Transformar la respuesta del backend a PlantillaRolResponse
        let permisosParsed: Record<string, any> = {};
        try {
          if (typeof data.data.permisos_json === 'string') {
            permisosParsed = JSON.parse(data.data.permisos_json);
          } else if (data.data.permisos_json) {
            permisosParsed = data.data.permisos_json;
          }
        } catch (parseError) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Error parseando permisos_json:', parseError);
          }
        }

        const plantillaResponse: PlantillaRolResponse = {
          success: data.success,
          message: data.message,
          data: {
            plantilla_rol_id: data.data.plantilla_id, // ✅ Mapear plantilla_id -> plantilla_rol_id
            modulo_id: data.data.modulo_id,
            nombre: data.data.nombre_rol, // ✅ Mapear nombre_rol -> nombre
            descripcion: data.data.descripcion,
            permisos_json: permisosParsed,
            es_activa: data.data.es_activo, // ✅ Mapear es_activo -> es_activa
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return plantillaResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error creating plantilla:', error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Actualizar una plantilla existente
   * Endpoint: PUT /plantillas-roles/{plantilla_id}/
   * El backend espera ModuloRolPlantillaUpdate con nombre_rol y permisos_json como string
   */
  async updatePlantilla(
    plantillaRolId: string,
    plantillaData: PlantillaRolUpdate
  ): Promise<PlantillaRolResponse> {
    try {
      // ✅ Transformar PlantillaRolUpdate a ModuloRolPlantillaUpdate
      interface ModuloRolPlantillaUpdatePayload {
        nombre_rol?: string; // ✅ Backend usa nombre_rol
        descripcion?: string | null;
        nivel_acceso?: number;
        permisos_json?: string; // ✅ Backend espera string JSON
        es_activo?: boolean; // ✅ Backend usa es_activo
        orden?: number;
      }

      const payload: ModuloRolPlantillaUpdatePayload = {};
      
      if (plantillaData.nombre !== undefined) payload.nombre_rol = plantillaData.nombre; // ✅ Mapear nombre -> nombre_rol
      if (plantillaData.descripcion !== undefined) payload.descripcion = plantillaData.descripcion;
      if ((plantillaData as any).nivel_acceso !== undefined) payload.nivel_acceso = (plantillaData as any).nivel_acceso;
      if (plantillaData.permisos_json !== undefined) {
        payload.permisos_json = typeof plantillaData.permisos_json === 'string' 
          ? plantillaData.permisos_json 
          : JSON.stringify(plantillaData.permisos_json); // ✅ Convertir objeto a string JSON
      }
      if (plantillaData.es_activa !== undefined) payload.es_activo = plantillaData.es_activa; // ✅ Mapear es_activa -> es_activo
      if ((plantillaData as any).orden !== undefined) payload.orden = (plantillaData as any).orden;

      // Eliminar campos undefined
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof ModuloRolPlantillaUpdatePayload] === undefined) {
          delete payload[key as keyof ModuloRolPlantillaUpdatePayload];
        }
      });

      interface ModuloRolPlantillaResponse {
        success: boolean;
        message: string;
        data: {
          plantilla_id: string; // ✅ Backend devuelve plantilla_id
          modulo_id: string;
          nombre_rol: string; // ✅ Backend devuelve nombre_rol
          descripcion?: string | null;
          nivel_acceso?: number;
          permisos_json: string; // ✅ Backend devuelve como string
          es_activo: boolean; // ✅ Backend devuelve es_activo
          orden?: number;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }

      const { data } = await api.put<ModuloRolPlantillaResponse>(`${BASE_URL}/${plantillaRolId}/`, payload);
      
      if (data && data.success && data.data) {
        // Transformar la respuesta del backend a PlantillaRolResponse
        let permisosParsed: Record<string, any> = {};
        try {
          if (typeof data.data.permisos_json === 'string') {
            permisosParsed = JSON.parse(data.data.permisos_json);
          } else if (data.data.permisos_json) {
            permisosParsed = data.data.permisos_json;
          }
        } catch (parseError) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Error parseando permisos_json:', parseError);
          }
        }

        const plantillaResponse: PlantillaRolResponse = {
          success: data.success,
          message: data.message,
          data: {
            plantilla_rol_id: data.data.plantilla_id, // ✅ Mapear plantilla_id -> plantilla_rol_id
            modulo_id: data.data.modulo_id,
            nombre: data.data.nombre_rol, // ✅ Mapear nombre_rol -> nombre
            descripcion: data.data.descripcion,
            permisos_json: permisosParsed,
            es_activa: data.data.es_activo, // ✅ Mapear es_activo -> es_activa
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return plantillaResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error updating plantilla ${plantillaRolId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Activar una plantilla
   * Endpoint: PATCH /plantillas-roles/{plantilla_id}/activar/
   */
  async activatePlantilla(plantillaRolId: string): Promise<PlantillaRolResponse> {
    try {
      interface ModuloRolPlantillaResponse {
        success: boolean;
        message: string;
        data: {
          plantilla_id: string;
          modulo_id: string;
          nombre_rol: string;
          descripcion?: string | null;
          nivel_acceso?: number;
          permisos_json: string;
          es_activo: boolean;
          orden?: number;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }
      const { data } = await api.patch<ModuloRolPlantillaResponse>(`${BASE_URL}/${plantillaRolId}/activar/`);
      
      if (data && data.success && data.data) {
        let permisosParsed: Record<string, any> = {};
        try {
          if (typeof data.data.permisos_json === 'string') {
            permisosParsed = JSON.parse(data.data.permisos_json);
          } else if (data.data.permisos_json) {
            permisosParsed = data.data.permisos_json;
          }
        } catch (parseError) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Error parseando permisos_json:', parseError);
          }
        }

        const plantillaResponse: PlantillaRolResponse = {
          success: data.success,
          message: data.message,
          data: {
            plantilla_rol_id: data.data.plantilla_id,
            modulo_id: data.data.modulo_id,
            nombre: data.data.nombre_rol,
            descripcion: data.data.descripcion,
            permisos_json: permisosParsed,
            es_activa: data.data.es_activo,
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return plantillaResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error activating plantilla ${plantillaRolId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Desactivar una plantilla
   * Endpoint: PATCH /plantillas-roles/{plantilla_id}/desactivar/
   */
  async deactivatePlantilla(plantillaRolId: string): Promise<PlantillaRolResponse> {
    try {
      interface ModuloRolPlantillaResponse {
        success: boolean;
        message: string;
        data: {
          plantilla_id: string;
          modulo_id: string;
          nombre_rol: string;
          descripcion?: string | null;
          nivel_acceso?: number;
          permisos_json: string;
          es_activo: boolean;
          orden?: number;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }
      const { data } = await api.patch<ModuloRolPlantillaResponse>(`${BASE_URL}/${plantillaRolId}/desactivar/`);
      
      if (data && data.success && data.data) {
        let permisosParsed: Record<string, any> = {};
        try {
          if (typeof data.data.permisos_json === 'string') {
            permisosParsed = JSON.parse(data.data.permisos_json);
          } else if (data.data.permisos_json) {
            permisosParsed = data.data.permisos_json;
          }
        } catch (parseError) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Error parseando permisos_json:', parseError);
          }
        }

        const plantillaResponse: PlantillaRolResponse = {
          success: data.success,
          message: data.message,
          data: {
            plantilla_rol_id: data.data.plantilla_id,
            modulo_id: data.data.modulo_id,
            nombre: data.data.nombre_rol,
            descripcion: data.data.descripcion,
            permisos_json: permisosParsed,
            es_activa: data.data.es_activo,
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return plantillaResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error deactivating plantilla ${plantillaRolId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Desactivar una plantilla (alias para deletePlantilla)
   * Endpoint: PATCH /plantillas-roles/{plantilla_id}/desactivar/
   * Nota: El backend usa desactivar en lugar de DELETE
   */
  async deletePlantilla(plantillaRolId: string): Promise<void> {
    try {
      await this.deactivatePlantilla(plantillaRolId);
    } catch (error) {
      console.error(`Error deleting plantilla ${plantillaRolId}:`, error);
      throw error;
    }
  },
};

