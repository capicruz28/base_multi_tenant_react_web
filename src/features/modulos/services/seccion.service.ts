/**
 * Servicio para gestión de secciones de módulos
 * Endpoints: /secciones/
 * Alineado con la refactorización del backend
 */
import api from '@/core/api/api';
import type {
  Seccion,
  SeccionCreate,
  SeccionUpdate,
  SeccionFilters,
  PaginatedSeccionResponse,
  SeccionResponse,
} from '../types/seccion.types';

const BASE_URL = '/secciones';

export const seccionService = {
  /**
   * Listar secciones con paginación
   * ✅ ACTUALIZADO: Si se proporciona modulo_id, usa el endpoint específico /secciones/modulo/{modulo_id}/
   * Endpoint: GET /secciones/modulo/{modulo_id}/ (si hay modulo_id)
   *          GET /secciones/ (si no hay modulo_id - puede no estar disponible)
   * Respuesta: { success: boolean, message: string, data: Seccion[], pagination: {...} }
   */
  async getSecciones(
    filters?: SeccionFilters
  ): Promise<PaginatedSeccionResponse> {
    try {
      // ✅ ACTUALIZADO: Si hay modulo_id, usar el endpoint específico
      if (filters?.modulo_id) {
        const secciones = await this.getSeccionesByModulo(filters.modulo_id);
        
        // Aplicar filtros adicionales en el frontend si es necesario
        let filteredSecciones = secciones;
        
        if (import.meta.env.DEV) {
          console.log(`📦 [SeccionService] getSecciones - Secciones obtenidas del módulo:`, {
            total: secciones.length,
            filtros: filters,
            secciones: secciones.map(s => ({ id: s.seccion_id, nombre: s.nombre, activa: s.es_activa }))
          });
        }
        
        if (filters.es_activa !== undefined) {
          const beforeFilter = filteredSecciones.length;
          filteredSecciones = filteredSecciones.filter(s => s.es_activa === filters.es_activa);
          if (import.meta.env.DEV) {
            console.log(`🔍 [SeccionService] Filtro es_activa=${filters.es_activa}: ${beforeFilter} -> ${filteredSecciones.length}`);
          }
        }
        
        if (filters.nombre) {
          const searchLower = filters.nombre.toLowerCase();
          filteredSecciones = filteredSecciones.filter(s => 
            s.nombre?.toLowerCase().includes(searchLower) || 
            s.codigo?.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.codigo) {
          filteredSecciones = filteredSecciones.filter(s => 
            s.codigo?.toLowerCase().includes(filters.codigo!.toLowerCase())
          );
        }
        
        // Aplicar paginación en el frontend
        const skip = filters.skip || 0;
        const limit = filters.limit || 20;
        const paginatedItems = filteredSecciones.slice(skip, skip + limit);
        
        if (import.meta.env.DEV) {
          console.log(`📄 [SeccionService] Paginación: skip=${skip}, limit=${limit}, total=${filteredSecciones.length}, items=${paginatedItems.length}`);
        }
        
        return {
          items: paginatedItems,
          total: filteredSecciones.length,
          page: Math.floor(skip / limit) + 1,
          size: limit,
          pages: Math.ceil(filteredSecciones.length / limit) || 1,
        };
      }
      
      // ⚠️ Si no hay modulo_id, el endpoint genérico puede no estar disponible
      // Por ahora, retornar vacío con un warning
      if (import.meta.env.DEV) {
        console.warn('⚠️ [SeccionService] getSecciones() llamado sin modulo_id. El endpoint /secciones/ puede no estar disponible. Use getSeccionesByModulo() en su lugar.');
      }
      
      return {
        items: [],
        total: 0,
        page: 1,
        size: filters?.limit || 20,
        pages: 0,
      };
    } catch (error) {
      console.error('Error fetching secciones:', error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Obtener una sección por ID
   * Endpoint: GET /secciones/{seccion_id}/
   * Respuesta: { success: boolean, message: string, data: Seccion }
   */
  async getSeccionById(seccionId: string): Promise<SeccionResponse> {
    try {
      interface ModuloSeccionByIdResponse {
        success: boolean;
        message: string;
        data: {
          seccion_id: string;
          modulo_id: string;
          codigo: string;
          nombre: string;
          descripcion?: string | null;
          icono: string;
          orden: number;
          es_activo: boolean;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }
      const { data } = await api.get<ModuloSeccionByIdResponse>(`${BASE_URL}/${seccionId}/`);
      
      if (data && data.success && data.data) {
        const seccionResponse: SeccionResponse = {
          success: data.success,
          message: data.message,
          data: {
            seccion_id: data.data.seccion_id,
            modulo_id: data.data.modulo_id,
            codigo: data.data.codigo,
            nombre: data.data.nombre,
            descripcion: data.data.descripcion,
            icono: data.data.icono,
            orden: data.data.orden,
            es_activa: data.data.es_activo,
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return seccionResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error fetching seccion ${seccionId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Crear una nueva sección
   * Endpoint: POST /secciones/
   * El backend espera ModuloSeccionCreate con es_activo (no es_activa)
   */
  async createSeccion(seccionData: SeccionCreate): Promise<SeccionResponse> {
    try {
      // ✅ Transformar SeccionCreate (es_activa) a ModuloSeccionCreate (es_activo)
      interface ModuloSeccionCreatePayload {
        codigo: string;
        nombre: string;
        modulo_id: string;
        descripcion?: string | null;
        icono?: string | null;
        orden?: number;
        es_seccion_sistema?: boolean;
        es_activo: boolean; // ✅ Backend usa es_activo
      }

      const payload: ModuloSeccionCreatePayload = {
        codigo: seccionData.codigo,
        nombre: seccionData.nombre,
        modulo_id: seccionData.modulo_id,
        descripcion: seccionData.descripcion || null,
        icono: seccionData.icono || null,
        orden: seccionData.orden || 0,
        es_seccion_sistema: (seccionData as any).es_seccion_sistema || false,
        es_activo: seccionData.es_activa !== undefined ? seccionData.es_activa : true, // ✅ Mapear es_activa -> es_activo
      };

      interface ModuloSeccionResponse {
        success: boolean;
        message: string;
        data: {
          seccion_id: string;
          modulo_id: string;
          codigo: string;
          nombre: string;
          descripcion?: string | null;
          icono: string;
          orden: number;
          es_activo: boolean; // ✅ Backend devuelve es_activo
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }

      const { data } = await api.post<ModuloSeccionResponse>(`${BASE_URL}/`, payload);
      
      if (data && data.success && data.data) {
        // Transformar la respuesta del backend a SeccionResponse
        const seccionResponse: SeccionResponse = {
          success: data.success,
          message: data.message,
          data: {
            seccion_id: data.data.seccion_id,
            modulo_id: data.data.modulo_id,
            codigo: data.data.codigo,
            nombre: data.data.nombre,
            descripcion: data.data.descripcion,
            icono: data.data.icono,
            orden: data.data.orden,
            es_activa: data.data.es_activo, // ✅ Mapear es_activo -> es_activa
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return seccionResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error creating seccion:', error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Actualizar una sección existente
   * Endpoint: PUT /secciones/{seccion_id}/
   * El backend espera ModuloSeccionUpdate con es_activo (no es_activa)
   */
  async updateSeccion(
    seccionId: string,
    seccionData: SeccionUpdate
  ): Promise<SeccionResponse> {
    try {
      // ✅ Transformar SeccionUpdate (es_activa) a ModuloSeccionUpdate (es_activo)
      interface ModuloSeccionUpdatePayload {
        codigo?: string;
        nombre?: string;
        descripcion?: string | null;
        icono?: string | null;
        orden?: number;
        es_seccion_sistema?: boolean;
        es_activo?: boolean; // ✅ Backend usa es_activo
      }

      const payload: ModuloSeccionUpdatePayload = {};
      
      if (seccionData.codigo !== undefined) payload.codigo = seccionData.codigo;
      if (seccionData.nombre !== undefined) payload.nombre = seccionData.nombre;
      if (seccionData.descripcion !== undefined) payload.descripcion = seccionData.descripcion;
      if (seccionData.icono !== undefined) payload.icono = seccionData.icono;
      if (seccionData.orden !== undefined) payload.orden = seccionData.orden;
      if ((seccionData as any).es_seccion_sistema !== undefined) payload.es_seccion_sistema = (seccionData as any).es_seccion_sistema;
      if (seccionData.es_activa !== undefined) payload.es_activo = seccionData.es_activa; // ✅ Mapear es_activa -> es_activo

      interface ModuloSeccionResponse {
        success: boolean;
        message: string;
        data: {
          seccion_id: string;
          modulo_id: string;
          codigo: string;
          nombre: string;
          descripcion?: string | null;
          icono: string;
          orden: number;
          es_activo: boolean; // ✅ Backend devuelve es_activo
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }

      const { data } = await api.put<ModuloSeccionResponse>(`${BASE_URL}/${seccionId}/`, payload);
      
      if (data && data.success && data.data) {
        // Transformar la respuesta del backend a SeccionResponse
        const seccionResponse: SeccionResponse = {
          success: data.success,
          message: data.message,
          data: {
            seccion_id: data.data.seccion_id,
            modulo_id: data.data.modulo_id,
            codigo: data.data.codigo,
            nombre: data.data.nombre,
            descripcion: data.data.descripcion,
            icono: data.data.icono,
            orden: data.data.orden,
            es_activa: data.data.es_activo, // ✅ Mapear es_activo -> es_activa
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return seccionResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error updating seccion ${seccionId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Desactivar una sección
   * Endpoint: PATCH /secciones/{seccion_id}/desactivar/
   * Nota: El backend usa desactivar en lugar de DELETE
   */
  async deleteSeccion(seccionId: string): Promise<void> {
    try {
      await api.patch(`${BASE_URL}/${seccionId}/desactivar/`);
    } catch (error) {
      console.error(`Error deleting seccion ${seccionId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Activar una sección
   * Endpoint: PATCH /secciones/{seccion_id}/activar/
   */
  async activateSeccion(seccionId: string): Promise<SeccionResponse> {
    try {
      interface ModuloSeccionResponse {
        success: boolean;
        message: string;
        data: {
          seccion_id: string;
          modulo_id: string;
          codigo: string;
          nombre: string;
          descripcion?: string | null;
          icono: string;
          orden: number;
          es_activo: boolean;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }
      const { data } = await api.patch<ModuloSeccionResponse>(`${BASE_URL}/${seccionId}/activar/`);
      
      if (data && data.success && data.data) {
        const seccionResponse: SeccionResponse = {
          success: data.success,
          message: data.message,
          data: {
            seccion_id: data.data.seccion_id,
            modulo_id: data.data.modulo_id,
            codigo: data.data.codigo,
            nombre: data.data.nombre,
            descripcion: data.data.descripcion,
            icono: data.data.icono,
            orden: data.data.orden,
            es_activa: data.data.es_activo,
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return seccionResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error activating seccion ${seccionId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Desactivar una sección
   * Endpoint: PATCH /secciones/{seccion_id}/desactivar/
   */
  async deactivateSeccion(seccionId: string): Promise<SeccionResponse> {
    try {
      interface ModuloSeccionResponse {
        success: boolean;
        message: string;
        data: {
          seccion_id: string;
          modulo_id: string;
          codigo: string;
          nombre: string;
          descripcion?: string | null;
          icono: string;
          orden: number;
          es_activo: boolean;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
        };
      }
      const { data } = await api.patch<ModuloSeccionResponse>(`${BASE_URL}/${seccionId}/desactivar/`);
      
      if (data && data.success && data.data) {
        const seccionResponse: SeccionResponse = {
          success: data.success,
          message: data.message,
          data: {
            seccion_id: data.data.seccion_id,
            modulo_id: data.data.modulo_id,
            codigo: data.data.codigo,
            nombre: data.data.nombre,
            descripcion: data.data.descripcion,
            icono: data.data.icono,
            orden: data.data.orden,
            es_activa: data.data.es_activo,
            fecha_creacion: data.data.fecha_creacion ?? '',
            fecha_actualizacion: data.data.fecha_actualizacion ?? '',
          },
        };
        return seccionResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error deactivating seccion ${seccionId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Obtener secciones de un módulo específico
   * Endpoint: GET /secciones/modulo/{modulo_id}/
   * Respuesta: { success: boolean, message: string, data: Seccion[] }
   */
  async getSeccionesByModulo(moduloId: string): Promise<Seccion[]> {
    if (!moduloId || typeof moduloId !== 'string') {
      throw new Error('moduloId es requerido y debe ser un string');
    }

    try {
      // ✅ ACTUALIZADO: El backend devuelve es_activo (masculino), pero el tipo espera es_activa (femenino)
      interface BackendSeccion {
        seccion_id: string;
        modulo_id: string;
        codigo: string;
        nombre: string;
        descripcion?: string | null;
        icono: string;
        orden: number;
        es_activo: boolean; // ✅ Backend usa es_activo
        es_seccion_sistema?: boolean;
        fecha_creacion?: string | null;
        fecha_actualizacion?: string | null;
      }

      interface SeccionesByModuloResponse {
        success: boolean;
        message: string;
        data: BackendSeccion[];
      }

      const endpoint = `${BASE_URL}/modulo/${moduloId}/`;
      const { data } = await api.get<SeccionesByModuloResponse>(endpoint);
      
      if (data && data.success && Array.isArray(data.data)) {
        // ✅ Mapear es_activo del backend a es_activa del tipo
        const secciones: Seccion[] = data.data.map(backendSeccion => ({
          seccion_id: backendSeccion.seccion_id,
          modulo_id: backendSeccion.modulo_id,
          codigo: backendSeccion.codigo,
          nombre: backendSeccion.nombre,
          descripcion: backendSeccion.descripcion,
          icono: backendSeccion.icono,
          orden: backendSeccion.orden,
          es_activa: backendSeccion.es_activo, // ✅ Mapear es_activo -> es_activa
          fecha_creacion: backendSeccion.fecha_creacion,
          fecha_actualizacion: backendSeccion.fecha_actualizacion,
        }));
        
        if (import.meta.env.DEV) {
          console.log(`✅ [SeccionService] Secciones obtenidas para módulo ${moduloId}:`, secciones.length);
        }
        return secciones;
      } else {
        console.error(`Respuesta inesperada de ${endpoint}:`, data);
        return [];
      }
    } catch (error: any) {
      // Si el endpoint retorna 404, significa que no hay secciones
      if (error?.response?.status === 404) {
        if (import.meta.env.DEV) {
          console.log(`ℹ️ Módulo ${moduloId} no tiene secciones aún`);
        }
        return [];
      }
      console.error(`Error fetching secciones for modulo ${moduloId}:`, error);
      throw error;
    }
  },
};

