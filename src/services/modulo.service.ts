// src/services/modulo.service.ts - VERSIÓN CORREGIDA
import api from './api';
import {
  Modulo,
  ModuloCreate,
  ModuloUpdate,
  ModuloListResponse,
  ModuloAsignado
} from '../types/modulo.types';
import { getErrorMessage } from './error.service';

// ✅ USAR MISMO PATRÓN QUE CLIENTES
const BASE_URL = '/modulos';

/**
 * Servicio para gestión de módulos (Super Admin)
 */
export const moduloService = {
  /**
   * Obtener lista de módulos del sistema
   */
  async getModulos(
    pagina: number = 1,
    limite: number = 50
  ): Promise<ModuloListResponse> {
    try {
      const params = new URLSearchParams();
      const skip = (pagina - 1) * limite;
      params.append('skip', skip.toString());
      params.append('limit', limite.toString());

      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      const url = `${BASE_URL}/?${params.toString()}`;
      console.log('🔄 Llamando endpoint módulos:', url);

      const { data: modulos } = await api.get<Modulo[]>(url);
      console.log('✅ Respuesta módulos recibida:', modulos.length, 'módulos');
      
      return {
        modulos: modulos,
        pagina_actual: pagina,
        total_paginas: Math.ceil(modulos.length / limite),
        total_modulos: modulos.length,
        limite: limite
      };
    } catch (error) {
      console.error('❌ Error fetching modules:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener la lista de módulos');
    }
  },

  /**
   * Obtener detalle de un módulo por ID
   */
  async getModuloById(id: number): Promise<Modulo> {
    try {
      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      const { data } = await api.get<Modulo>(`${BASE_URL}/${id}/`);
      console.log('✅ Módulo obtenido por ID:', id);
      return data;
    } catch (error) {
      console.error('❌ Error fetching module by ID:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener el módulo');
    }
  },

  /**
   * Crear un nuevo módulo
   */
  async createModulo(moduloData: ModuloCreate): Promise<Modulo> {
    try {
      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      const { data } = await api.post<Modulo>(`${BASE_URL}/`, moduloData);
      console.log('✅ Módulo creado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error creating module:', error);
      throw new Error(getErrorMessage(error).message || 'Error al crear el módulo');
    }
  },

  /**
   * Actualizar un módulo existente
   */
  async updateModulo(id: number, moduloData: ModuloUpdate): Promise<Modulo> {
    try {
      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      const { data } = await api.put<Modulo>(`${BASE_URL}/${id}/`, moduloData);
      console.log('✅ Módulo actualizado:', id);
      return data;
    } catch (error) {
      console.error('❌ Error updating module:', error);
      throw new Error(getErrorMessage(error).message || 'Error al actualizar el módulo');
    }
  },

  /**
   * Obtener módulos asignados a un cliente
   */
  async getModulosByCliente(clienteId: number): Promise<ModuloAsignado[]> {
    try {
      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      const { data } = await api.get<ModuloAsignado[]>(`${BASE_URL}/clientes/${clienteId}/modulos/`);
      console.log('✅ Módulos del cliente obtenidos:', clienteId);
      return data;
    } catch (error) {
      console.error('❌ Error fetching client modules:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener módulos del cliente');
    }
  },

  /**
   * Asignar módulo a cliente
   */
  async assignModulo(
    clienteId: number, 
    moduloId: number, 
    config?: Record<string, any>,
    limite_usuarios?: number,
    limite_registros?: number
  ): Promise<ModuloAsignado> {
    try {
      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      const { data } = await api.post<ModuloAsignado>(
        `${BASE_URL}/clientes/${clienteId}/modulos/${moduloId}/`,
        {
          configuracion: config,
          limite_usuarios,
          limite_registros
        }
      );
      console.log('✅ Módulo asignado a cliente:', { clienteId, moduloId });
      return data;
    } catch (error) {
      console.error('❌ Error assigning module to client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al asignar módulo al cliente');
    }
  },

  /**
   * Remover módulo de cliente
   */
  async removeModulo(clienteId: number, moduloId: number): Promise<{ message: string }> {
    try {
      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      await api.delete(`${BASE_URL}/clientes/${clienteId}/modulos/${moduloId}/`);
      console.log('✅ Módulo removido del cliente:', { clienteId, moduloId });
      return { message: 'Módulo removido exitosamente del cliente' };
    } catch (error) {
      console.error('❌ Error removing module from client:', error);
      throw new Error(getErrorMessage(error).message || 'Error al remover módulo del cliente');
    }
  },

  /**
   * Actualizar configuración de módulo activo
   */
  async updateModuloConfig(
    clienteId: number,
    moduloId: number,
    config?: Record<string, any>,
    limite_usuarios?: number,
    limite_registros?: number
  ): Promise<ModuloAsignado> {
    try {
      // ✅ CORREGIDO: Usar mismo patrón - BARRA AL FINAL
      const { data } = await api.put<ModuloAsignado>(
        `${BASE_URL}/clientes/${clienteId}/modulos/${moduloId}/`,
        {
          configuracion: config,
          limite_usuarios,
          limite_registros
        }
      );
      console.log('✅ Configuración de módulo actualizada:', { clienteId, moduloId });
      return data;
    } catch (error) {
      console.error('❌ Error updating module configuration:', error);
      throw new Error(getErrorMessage(error).message || 'Error al actualizar configuración del módulo');
    }
  }
};