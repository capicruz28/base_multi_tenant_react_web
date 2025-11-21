// src/services/cliente.service.ts
import api from './api';
import {
  Cliente,
  ClienteCreate,
  ClienteUpdate,
  ClienteListResponse,
  ClienteStats,
  ClienteFilters,
  ClienteResponse,
  SubdomainValidationResponse
} from '../types/cliente.types';
import { getErrorMessage } from './error.service';

const BASE_URL = '/clientes';

/**
 * Servicio para gestión de clientes (Super Admin)
 * Alineado con los endpoints del backend (app.api.v1.endpoints.clientes)
 */
export const clienteService = {
  /**
   * Obtener lista de clientes con paginación y filtros
   * Endpoint: GET /clientes/?skip=0&limit=10&solo_activos=true&buscar=...
   */
  async getClientes(
    pagina: number = 1,
    limite: number = 10,
    filtros?: ClienteFilters
  ): Promise<ClienteListResponse> {
    try {
      const params = new URLSearchParams();
      const skip = (pagina - 1) * limite;
      params.append('skip', skip.toString());
      params.append('limit', limite.toString());
      
      // Filtros del backend
      if (filtros) {
        if (filtros.es_activo !== undefined) {
          params.append('solo_activos', filtros.es_activo.toString());
        }
        if (filtros.buscar) {
          params.append('buscar', filtros.buscar);
        }
      } else {
        params.append('solo_activos', 'true');
      }

      const url = `${BASE_URL}/?${params.toString()}`;
      const { data } = await api.get<ClienteListResponse>(url);
      
      return data;
    } catch (error) {
      console.error('❌ Error en getClientes:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener la lista de clientes');
    }
  },

  /**
   * Obtener un cliente por ID
   * Endpoint: GET /clientes/{cliente_id}/
   */
  async getClienteById(id: number): Promise<Cliente> {
    try {
      const { data } = await api.get<Cliente>(`${BASE_URL}/${id}/`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching client by ID:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener el cliente');
    }
  },

  /**
   * Crear un nuevo cliente
   * Endpoint: POST /clientes/
   */
  async createCliente(clienteData: ClienteCreate): Promise<Cliente> {
    try {
      const { data } = await api.post<ClienteResponse>(`${BASE_URL}/`, clienteData);
      if (data.data) {
        return data.data;
      }
      throw new Error('Respuesta del servidor sin datos del cliente');
    } catch (error) {
      console.error('❌ Error creating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al crear el cliente');
    }
  },

  /**
   * Actualizar un cliente existente
   * Endpoint: PUT /clientes/{cliente_id}/
   */
  async updateCliente(id: number, clienteData: ClienteUpdate): Promise<Cliente> {
    try {
      const { data } = await api.put<ClienteResponse>(`${BASE_URL}/${id}/`, clienteData);
      if (data.data) {
        return data.data;
      }
      throw new Error('Respuesta del servidor sin datos del cliente');
    } catch (error) {
      console.error('❌ Error updating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al actualizar el cliente');
    }
  },

  /**
   * Activar un cliente
   * Endpoint: PUT /clientes/{cliente_id}/activar/
   */
  async activateCliente(id: number): Promise<Cliente> {
    try {
      const { data } = await api.put<ClienteResponse>(`${BASE_URL}/${id}/activar/`);
      if (data.data) {
        return data.data;
      }
      throw new Error('Respuesta del servidor sin datos del cliente');
    } catch (error) {
      console.error('❌ Error activating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al activar el cliente');
    }
  },

  /**
   * Desactivar un cliente (eliminación lógica)
   * Endpoint: DELETE /clientes/{cliente_id}/
   */
  async deactivateCliente(id: number): Promise<{ message: string }> {
    try {
      const { data } = await api.delete<{ success: boolean; message: string; cliente_id: number }>(`${BASE_URL}/${id}/`);
      return { message: data.message || 'Cliente desactivado exitosamente' };
    } catch (error) {
      console.error('❌ Error deactivating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al desactivar el cliente');
    }
  },

  /**
   * Suspender un cliente
   * Endpoint: PUT /clientes/{cliente_id}/suspender/
   */
  async suspendCliente(id: number): Promise<Cliente> {
    try {
      const { data } = await api.put<ClienteResponse>(`${BASE_URL}/${id}/suspender/`);
      if (data.data) {
        return data.data;
      }
      throw new Error('Respuesta del servidor sin datos del cliente');
    } catch (error) {
      console.error('❌ Error suspending client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al suspender el cliente');
    }
  },

  /**
   * Obtener estadísticas de un cliente
   * Endpoint: GET /clientes/{cliente_id}/estadisticas/
   */
  async getClienteStats(id: number): Promise<ClienteStats> {
    try {
      const { data } = await api.get<ClienteStats>(`${BASE_URL}/${id}/estadisticas/`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching client stats:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener estadísticas del cliente');
    }
  },

  /**
   * Validar subdominio único
   * TODO: Implementar endpoint en backend: GET /clientes/validar-subdominio/?subdominio=xxx
   */
  async validateSubdominio(subdominio: string): Promise<SubdomainValidationResponse> {
    try {
      // Por ahora, validamos solo el formato en el frontend
      // Cuando el backend implemente el endpoint, usar:
      // const { data } = await api.get<SubdomainValidationResponse>(`${BASE_URL}/validar-subdominio/?subdominio=${subdominio}`);
      
      // Validación básica de formato
      const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
      if (!subdomainRegex.test(subdominio)) {
        return {
          disponible: false,
          mensaje: 'El subdominio debe contener solo letras minúsculas, números y guiones, y no puede comenzar o terminar con guión.'
        };
      }
      
      if (subdominio.length < 3 || subdominio.length > 63) {
        return {
          disponible: false,
          mensaje: 'El subdominio debe tener entre 3 y 63 caracteres.'
        };
      }
      
      // Por ahora asumimos que está disponible (el backend validará la unicidad)
      return { disponible: true };
    } catch (error) {
      console.error('❌ Error validating subdomain:', error);
      return {
        disponible: false,
        mensaje: 'Error al validar el subdominio'
      };
    }
  },

  /**
   * Endpoint de diagnóstico para niveles de acceso
   * Endpoint: GET /clientes/debug/access-levels
   */
  async debugAccessLevels(): Promise<any> {
    try {
      const { data } = await api.get(`${BASE_URL}/debug/access-levels`);
      return data;
    } catch (error) {
      console.error('❌ Error in debug access levels:', error);
      throw new Error(getErrorMessage(error).message || 'Error en diagnóstico de niveles');
    }
  },

  /**
   * Endpoint de diagnóstico de información de usuario
   * Endpoint: GET /clientes/debug/user-info
   */
  async debugUserInfo(): Promise<any> {
    try {
      const { data } = await api.get(`${BASE_URL}/debug/user-info`);
      return data;
    } catch (error) {
      console.error('❌ Error in debug user info:', error);
      throw new Error(getErrorMessage(error).message || 'Error en diagnóstico de usuario');
    }
  }
};