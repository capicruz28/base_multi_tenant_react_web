/**
 * Servicio para gestión de módulos (Super Admin)
 * Alineado 100% con los endpoints del backend (app.api.v1.endpoints.modulos)
 */
import api from '@/core/api/api';
import {
  Modulo,
  ModuloCreate,
  ModuloUpdate,
  ModuloConInfoActivacion,
  ModuloActivo,
  ModuloActivoCreate,
  ModuloActivoUpdate,
  PaginatedModuloResponse,  
  ModuloConInfoActivacionListResponse,
  ModuloResponse,
  ModuloDeleteResponse,
  ModuloFilters,
  WorkflowActivacionCompletaRequest,
  WorkflowActivacionCompletaResponse,
  WorkflowDesactivacionCompletaResponse,
  WorkflowEstadoCompletoResponse
} from '../types/modulo.types';

const BASE_URL = '/modulos';

export const moduloService = {
  /**
   * Listar catálogo de módulos con paginación
   * Endpoint: GET /modulos/?skip=0&limit=100&solo_activos=true
   */
  async getModulos(
    pagina: number = 1,
    limite: number = 100,
    solo_activos: boolean = true
  ): Promise<PaginatedModuloResponse> {
    try {
      const params = new URLSearchParams();
      const skip = (pagina - 1) * limite;
      params.append('skip', skip.toString());
      params.append('limit', limite.toString());
      params.append('solo_activos', solo_activos.toString());

      const url = `${BASE_URL}/?${params.toString()}`;
      const { data } = await api.get<PaginatedModuloResponse>(url);
      return data;
    } catch (error) {
      console.error('Error fetching modules:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Buscar módulos con filtros
   * Endpoint: GET /modulos/search/?buscar=...&es_modulo_core=...&requiere_licencia=...
   */
  async buscarModulos(
    pagina: number = 1,
    limite: number = 100,
    filtros?: ModuloFilters
  ): Promise<PaginatedModuloResponse> {
    try {
      const params = new URLSearchParams();
      const skip = (pagina - 1) * limite;
      params.append('skip', skip.toString());
      params.append('limit', limite.toString());

      if (filtros) {
        if (filtros.buscar) params.append('buscar', filtros.buscar);
        if (filtros.es_modulo_core !== undefined) params.append('es_modulo_core', filtros.es_modulo_core.toString());
        if (filtros.requiere_licencia !== undefined) params.append('requiere_licencia', filtros.requiere_licencia.toString());
        if (filtros.solo_activos !== undefined) params.append('solo_activos', filtros.solo_activos.toString());
      }

      const url = `${BASE_URL}/search/?${params.toString()}`;
      const { data } = await api.get<PaginatedModuloResponse>(url);
      return data;
    } catch (error) {
      console.error('Error searching modules:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Obtener detalle de un módulo
   * Endpoint: GET /modulos/{modulo_id}/
   */
  async getModuloById(modulo_id: string): Promise<Modulo> {
    try {
      const { data } = await api.get<ModuloResponse>(`${BASE_URL}/${modulo_id}/`);
      if (!data.data) {
        throw new Error('Módulo no encontrado');
      }
      return data.data;
    } catch (error) {
      console.error('Error fetching module by ID:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Crear un nuevo módulo
   * Endpoint: POST /modulos/
   */
  async createModulo(moduloData: ModuloCreate): Promise<Modulo> {
    try {
      const { data } = await api.post<ModuloResponse>(`${BASE_URL}/`, moduloData);
      if (!data.data) {
        throw new Error('Error al crear el módulo');
      }
      return data.data;
    } catch (error) {
      console.error('Error creating module:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Actualizar un módulo existente
   * Endpoint: PUT /modulos/{modulo_id}/
   */
  async updateModulo(modulo_id: string, moduloData: ModuloUpdate): Promise<Modulo> {
    try {
      const { data } = await api.put<ModuloResponse>(`${BASE_URL}/${modulo_id}/`, moduloData);
      if (!data.data) {
        throw new Error('Error al actualizar el módulo');
      }
      return data.data;
    } catch (error) {
      console.error('Error updating module:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Eliminar (desactivar) un módulo
   * Endpoint: DELETE /modulos/{modulo_id}/
   */
  async deleteModulo(modulo_id: string): Promise<void> {
    try {
      await api.delete<ModuloDeleteResponse>(`${BASE_URL}/${modulo_id}/`);
    } catch (error) {
      console.error('Error deleting module:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Listar módulos de un cliente con información de activación
   * Endpoint: GET /modulos/clientes/{cliente_id}/modulos/
   */
  async getModulosByCliente(cliente_id: string): Promise<ModuloConInfoActivacion[]> {
    try {
      const { data } = await api.get<ModuloConInfoActivacionListResponse>(`${BASE_URL}/clientes/${cliente_id}/modulos/`);
      return data.data;
    } catch (error) {
      console.error('Error fetching client modules:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Activar módulo para un cliente
   * Endpoint: POST /modulos/clientes/{cliente_id}/modulos/{modulo_id}/activar/
   */
  async activarModuloCliente(
    cliente_id: string,
    modulo_id: string,
    activacionData: ModuloActivoCreate
  ): Promise<ModuloActivo> {
    try {
      activacionData.cliente_id = cliente_id;
      activacionData.modulo_id = modulo_id;
      const { data } = await api.post<{ success: boolean; message: string; data: ModuloActivo }>(
        `${BASE_URL}/clientes/${cliente_id}/modulos/${modulo_id}/activar/`,
        activacionData
      );
      return data.data;
    } catch (error) {
      console.error('Error activating module:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Actualizar configuración de módulo activo
   * Endpoint: PUT /modulos/clientes/{cliente_id}/modulos/{modulo_id}/
   */
  async updateModuloActivo(
    cliente_id: string,
    modulo_id: string,
    updateData: ModuloActivoUpdate
  ): Promise<ModuloActivo> {
    try {
      const { data } = await api.put<{ success: boolean; message: string; data: ModuloActivo }>(
        `${BASE_URL}/clientes/${cliente_id}/modulos/${modulo_id}/`,
        updateData
      );
      return data.data;
    } catch (error) {
      console.error('Error updating active module:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * Desactivar módulo para un cliente
   * Endpoint: POST /modulos/clientes/{cliente_id}/modulos/{modulo_id}/desactivar/
   */
  async desactivarModuloCliente(cliente_id: string, modulo_id: string): Promise<void> {
    try {
      await api.post<{ success: boolean; message: string }>(
        `${BASE_URL}/clientes/${cliente_id}/modulos/${modulo_id}/desactivar/`
      );
    } catch (error) {
      console.error('Error deactivating module:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * [WORKFLOW] Activar módulo completo con conexión opcional
   * Endpoint: POST /modulos/clientes/{cliente_id}/modulos/{modulo_id}/activar-completo/
   */
  async activarModuloCompleto(
    cliente_id: string,
    modulo_id: string,
    workflowData: WorkflowActivacionCompletaRequest
  ): Promise<WorkflowActivacionCompletaResponse> {
    try {
      const { data } = await api.post<WorkflowActivacionCompletaResponse>(
        `${BASE_URL}/clientes/${cliente_id}/modulos/${modulo_id}/activar-completo/`,
        workflowData
      );
      return data;
    } catch (error) {
      console.error('Error in workflow activar-completo:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * [WORKFLOW] Desactivar módulo completo con todas sus conexiones
   * Endpoint: DELETE /modulos/clientes/{cliente_id}/modulos/{modulo_id}/desactivar-completo/
   */
  async desactivarModuloCompleto(
    cliente_id: string,
    modulo_id: string
  ): Promise<WorkflowDesactivacionCompletaResponse> {
    try {
      const { data } = await api.delete<WorkflowDesactivacionCompletaResponse>(
        `${BASE_URL}/clientes/${cliente_id}/modulos/${modulo_id}/desactivar-completo/`
      );
      return data;
    } catch (error) {
      console.error('Error in workflow desactivar-completo:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  },

  /**
   * [WORKFLOW] Obtener estado completo de un módulo para un cliente
   * Endpoint: GET /modulos/clientes/{cliente_id}/modulos/{modulo_id}/estado-completo/
   */
  async obtenerEstadoCompleto(
    cliente_id: string,
    modulo_id: string
  ): Promise<WorkflowEstadoCompletoResponse> {
    try {
      const { data } = await api.get<WorkflowEstadoCompletoResponse>(
        `${BASE_URL}/clientes/${cliente_id}/modulos/${modulo_id}/estado-completo/`
      );
      return data;
    } catch (error) {
      console.error('Error in workflow estado-completo:', error);
      // Re-lanzar el error original para preservar la información de Axios
      throw error;
    }
  }
};
