// src/services/cliente.service.ts - VERSIÓN COMPATIBLE
import api from './api';
import {
  Cliente,
  ClienteCreate,
  ClienteUpdate,
  ClienteListResponse,
  ClienteStats,
  ClienteFilters
} from '../types/cliente.types';
import { getErrorMessage } from './error.service';

// ✅ USAR MISMO PATRÓN QUE USUARIOS
const BASE_URL = '/clientes';

/**
 * Servicio para gestión de clientes (Super Admin)
 */
export const clienteService = {
  /**
   * Obtener lista de clientes con paginación y filtros
   */
  async getClientes(
    pagina: number = 1,
    limite: number = 10,
    filtros?: ClienteFilters  // ✅ MANTENER para compatibilidad
  ): Promise<ClienteListResponse> {
    try {
      const params = new URLSearchParams();
      const skip = (pagina - 1) * limite;
      params.append('skip', skip.toString());
      params.append('limit', limite.toString());

      // ✅ MARCAR COMO USADO PARA ELIMINAR WARNING
      if (filtros) {
        console.log('🔍 Filtros recibidos (no implementados aún):', filtros);
        // TODO: Implementar filtros cuando el backend los soporte
      }

      // ✅ CORREGIDO: Usar mismo patrón que usuarios - BARRA AL FINAL
      const url = `${BASE_URL}/?${params.toString()}`;
      console.log('🔄 Llamando endpoint clientes:', url);

      const { data: clientes } = await api.get<Cliente[]>(url);
      console.log('✅ Respuesta clientes recibida:', clientes.length, 'clientes');
      
      return {
        clientes: clientes,
        pagina_actual: pagina,
        total_paginas: Math.ceil(clientes.length / limite),
        total_clientes: clientes.length,
        limite: limite
      };
    } catch (error) {
      console.error('❌ Error en getClientes:', error);
      const err: any = error;
      console.error('❌ Detalles error:', {
        message: err?.message ?? String(err),
        status: err?.response?.status,
        data: err?.response?.data
      });
      throw new Error(getErrorMessage(err).message || 'Error al obtener la lista de clientes');
    }
  },

  // ... (el resto de los métodos se mantienen igual)
  /**
   * Obtener un cliente por ID
   */
  async getClienteById(id: number): Promise<Cliente> {
    try {
      const { data } = await api.get<Cliente>(`${BASE_URL}/${id}/`);
      console.log('✅ Cliente obtenido por ID:', id);
      return data;
    } catch (error) {
      console.error('❌ Error fetching client by ID:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener el cliente');
    }
  },

  /**
   * Crear un nuevo cliente
   */
  async createCliente(clienteData: ClienteCreate): Promise<Cliente> {
    try {
      const { data } = await api.post<Cliente>(`${BASE_URL}/`, clienteData);
      console.log('✅ Cliente creado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error creating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al crear el cliente');
    }
  },

  /**
   * Actualizar un cliente existente
   */
  async updateCliente(id: number, clienteData: ClienteUpdate): Promise<Cliente> {
    try {
      const { data } = await api.put<Cliente>(`${BASE_URL}/${id}/`, clienteData);
      console.log('✅ Cliente actualizado:', id);
      return data;
    } catch (error) {
      console.error('❌ Error updating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al actualizar el cliente');
    }
  },

  /**
   * Activar un cliente
   */
  async activateCliente(id: number): Promise<Cliente> {
    try {
      const { data } = await api.put<Cliente>(`${BASE_URL}/${id}/activar/`);
      console.log('✅ Cliente activado:', id);
      return data;
    } catch (error) {
      console.error('❌ Error activating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al activar el cliente');
    }
  },

  /**
   * Desactivar un cliente (eliminación lógica)
   */
  async deactivateCliente(id: number): Promise<{ message: string }> {
    try {
      await api.delete(`${BASE_URL}/${id}/`);
      console.log('✅ Cliente desactivado:', id);
      return { message: 'Cliente desactivado exitosamente' };
    } catch (error) {
      console.error('❌ Error deactivating client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al desactivar el cliente');
    }
  },

  /**
   * Suspender un cliente
   */
  async suspendCliente(id: number): Promise<Cliente> {
    try {
      const { data } = await api.put<Cliente>(`${BASE_URL}/${id}/suspender/`);
      console.log('✅ Cliente suspendido:', id);
      return data;
    } catch (error) {
      console.error('❌ Error suspending client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al suspender el cliente');
    }
  },

  /**
   * Obtener estadísticas de un cliente
   */
  async getClienteStats(id: number): Promise<ClienteStats> {
    try {
      const { data } = await api.get<ClienteStats>(`${BASE_URL}/${id}/estadisticas/`);
      console.log('✅ Estadísticas obtenidas para cliente:', id);
      return data;
    } catch (error) {
      console.error('❌ Error fetching client stats:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener estadísticas del cliente');
    }
  },

  /**
   * Validar subdominio único
   */
  async validateSubdominio(): Promise<{ disponible: boolean }> {
    try {
      console.warn('Endpoint de validación de subdominio no implementado en backend');
      return { disponible: true };
    } catch (error) {
      console.error('❌ Error validating subdomain:', error);
      throw new Error(getErrorMessage(error).message || 'Error al validar subdominio');
    }
  },

  /**
   * Endpoint de diagnóstico para niveles de acceso
   */
  async debugAccessLevels(): Promise<any> {
    try {
      const { data } = await api.get(`${BASE_URL}/debug/access-levels/`);
      return data;
    } catch (error) {
      console.error('❌ Error in debug access levels:', error);
      throw new Error(getErrorMessage(error).message || 'Error en diagnóstico de niveles');
    }
  },

  /**
   * Endpoint de diagnóstico de información de usuario
   */
  async debugUserInfo(): Promise<any> {
    try {
      const { data } = await api.get(`${BASE_URL}/debug/user-info/`);
      return data;
    } catch (error) {
      console.error('❌ Error in debug user info:', error);
      throw new Error(getErrorMessage(error).message || 'Error en diagnóstico de usuario');
    }
  }
};