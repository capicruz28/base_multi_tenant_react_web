/**
 * Servicio para activación de módulos por cliente
 * Endpoints: /cliente-modulo/cliente/{cliente_id}/ y /cliente-modulo/{cliente_modulo_id}/
 * Alineado con la refactorización del backend V2
 */
import api from '@/core/api/api';
import type {
  ClienteModulo,
  ClienteModuloCreate,
  ClienteModuloUpdate,
  ClienteModuloResponse,
  ClienteModuloListResponse,
} from '../types/cliente-modulo.types';

const BASE_URL = '/cliente-modulo';

export const clienteModuloService = {
  /**
   * ✅ NUEVO: Obtener módulos activos de un cliente específico
   * Endpoint: GET /cliente-modulo/cliente/{cliente_id}/
   * Respuesta: { success: boolean, message: string, data: ClienteModulo[] }
   */
  async getClienteModulosByClienteId(clienteId: string): Promise<ClienteModulo[]> {
    try {
      const { data } = await api.get<ClienteModuloListResponse>(`${BASE_URL}/cliente/${clienteId}/`);
      
      // ✅ El backend devuelve { success, message, data }
      if (data && data.success && Array.isArray(data.data)) {
        if (import.meta.env.DEV) {
          console.log(`✅ Módulos activos obtenidos para cliente ${clienteId}:`, data.data.length);
        }
        return data.data;
      }
      
      // Si la estructura no es la esperada, retornar array vacío
      if (import.meta.env.DEV) {
        console.warn('⚠️ Respuesta inesperada del backend:', data);
      }
      return [];
    } catch (error: any) {
      // Si el endpoint retorna 404, significa que el cliente no tiene módulos activos
      if (error?.response?.status === 404) {
        if (import.meta.env.DEV) {
          console.log(`ℹ️ Cliente ${clienteId} no tiene módulos activos aún`);
        }
        return [];
      }
      console.error(`Error fetching cliente modulos for cliente ${clienteId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Obtener un módulo activo por ID
   * Endpoint: GET /cliente-modulo/{cliente_modulo_id}/
   */
  async getClienteModuloById(clienteModuloId: string): Promise<ClienteModuloResponse> {
    try {
      const { data } = await api.get<ClienteModuloResponse>(`${BASE_URL}/${clienteModuloId}/`);
      return data;
    } catch (error) {
      console.error(`Error fetching cliente modulo ${clienteModuloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Activar un módulo para un cliente
   * Endpoint: POST /cliente-modulo/activar/
   * Parámetros: { cliente_id, modulo_id, ...configuracion }
   */
  async activateModulo(moduloData: ClienteModuloCreate): Promise<ClienteModuloResponse> {
    try {
      const { data } = await api.post<ClienteModuloResponse>(`${BASE_URL}/activar/`, moduloData);
      return data;
    } catch (error) {
      console.error('Error activating modulo:', error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Actualizar configuración de un módulo activo
   * Endpoint: PUT /cliente-modulo/{cliente_modulo_id}/
   */
  async updateClienteModulo(
    clienteModuloId: string,
    moduloData: ClienteModuloUpdate
  ): Promise<ClienteModuloResponse> {
    try {
      const { data } = await api.put<ClienteModuloResponse>(`${BASE_URL}/${clienteModuloId}/`, moduloData);
      return data;
    } catch (error) {
      console.error(`Error updating cliente modulo ${clienteModuloId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Desactivar un módulo para un cliente
   * Endpoint: DELETE /cliente-modulo/cliente/{cliente_id}/modulo/{modulo_id}/
   * 
   * @param clienteId - ID del cliente (UUID)
   * @param moduloId - ID del módulo (UUID)
   */
  async deactivateModulo(clienteId: string, moduloId: string): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/cliente/${clienteId}/modulo/${moduloId}/`);
    } catch (error) {
      console.error(`Error deactivating modulo ${moduloId} for cliente ${clienteId}:`, error);
      throw error;
    }
  },
};

