// src/services/conexion.service.ts - VERSIÓN CORREGIDA Y CONSISTENTE
import api from './api';
import {
  Conexion,
  ConexionCreate,
  ConexionUpdate,
  ConexionTestResult
} from '../types/conexion.types';
import { getErrorMessage } from './error.service';

/**
 * Servicio para gestión de conexiones de base de datos (Super Admin)
 * 
 * Proporciona métodos para crear, leer, actualizar, eliminar y probar
 * conexiones a bases de datos por cliente y módulo.
 */
export const conexionService = {
  /**
   * Obtener todas las conexiones de un cliente específico
   * 
   * @param clienteId - ID del cliente
   * @returns Promise con array de conexiones del cliente
   * @throws Error si falla la solicitud
   */
  async getConexiones(clienteId: number): Promise<Conexion[]> {
    try {
      console.log(`🔄 Obteniendo conexiones para cliente: ${clienteId}`);
      
      // ✅ URL CORREGIDA: Según backend - /conexiones/clientes/{cliente_id}
      const { data } = await api.get<Conexion[]>(`/conexiones/clientes/${clienteId}`);
      
      console.log(`✅ ${data.length} conexiones obtenidas para cliente ${clienteId}`);
      return data;
    } catch (error) {
      console.error(`❌ Error obteniendo conexiones para cliente ${clienteId}:`, error);
      const errorMessage = getErrorMessage(error).message || 'Error al obtener conexiones del cliente';
      throw new Error(errorMessage);
    }
  },

  /**
   * Crear una nueva conexión para un cliente
   * 
   * @param clienteId - ID del cliente
   * @param conexionData - Datos de la conexión a crear
   * @returns Promise con la conexión creada
   * @throws Error si falla la creación
   */
  async createConexion(clienteId: number, conexionData: ConexionCreate): Promise<Conexion> {
    try {
      console.log(`🔄 Creando conexión para cliente: ${clienteId}`, {
        modulo_id: conexionData.modulo_id,
        servidor: conexionData.servidor,
        nombre_bd: conexionData.nombre_bd
      });
      
      // ✅ URL CORREGIDA: Según backend - /conexiones/clientes/{cliente_id}
      const { data } = await api.post<Conexion>(`/conexiones/clientes/${clienteId}`, conexionData);
      
      console.log(`✅ Conexión creada exitosamente: ${data.conexion_id}`);
      return data;
    } catch (error) {
      console.error(`❌ Error creando conexión para cliente ${clienteId}:`, error);
      const errorMessage = getErrorMessage(error).message || 'Error al crear la conexión';
      throw new Error(errorMessage);
    }
  },

  /**
   * Actualizar una conexión existente
   * 
   * @param conexionId - ID de la conexión a actualizar
   * @param conexionData - Datos actualizados de la conexión
   * @returns Promise con la conexión actualizada
   * @throws Error si falla la actualización
   */
  async updateConexion(conexionId: number, conexionData: ConexionUpdate): Promise<Conexion> {
    try {
      console.log(`🔄 Actualizando conexión: ${conexionId}`, conexionData);
      
      // ✅ URL CORREGIDA: Según backend - /conexiones/{conexion_id}
      const { data } = await api.put<Conexion>(`/conexiones/${conexionId}`, conexionData);
      
      console.log(`✅ Conexión actualizada exitosamente: ${conexionId}`);
      return data;
    } catch (error) {
      console.error(`❌ Error actualizando conexión ${conexionId}:`, error);
      const errorMessage = getErrorMessage(error).message || 'Error al actualizar la conexión';
      throw new Error(errorMessage);
    }
  },

  /**
   * Eliminar (desactivar) una conexión
   * 
   * @param conexionId - ID de la conexión a eliminar
   * @returns Promise vacío
   * @throws Error si falla la eliminación
   */
  async deleteConexion(conexionId: number): Promise<void> {
    try {
      console.log(`🔄 Eliminando conexión: ${conexionId}`);
      
      // ✅ URL CORREGIDA: Según backend - /conexiones/{conexion_id}
      await api.delete(`/conexiones/${conexionId}`);
      
      console.log(`✅ Conexión eliminada exitosamente: ${conexionId}`);
    } catch (error) {
      console.error(`❌ Error eliminando conexión ${conexionId}:`, error);
      const errorMessage = getErrorMessage(error).message || 'Error al eliminar la conexión';
      throw new Error(errorMessage);
    }
  },

  /**
   * Probar una configuración de conexión sin guardarla
   * 
   * @param conexionData - Datos de la conexión a probar
   * @returns Promise con resultado de la prueba
   * @throws Error si falla la prueba
   */
  async testConexion(conexionData: ConexionCreate): Promise<ConexionTestResult> {
    try {
      console.log(`🧪 Probando conexión:`, {
        servidor: conexionData.servidor,
        nombre_bd: conexionData.nombre_bd
      });
      
      // ✅ URL CORREGIDA: Según backend - /conexiones/test
      const { data } = await api.post<ConexionTestResult>(`/conexiones/test`, conexionData);
      
      console.log(`✅ Prueba de conexión completada: ${data.exito ? 'ÉXITO' : 'FALLO'}`);
      return data;
    } catch (error) {
      console.error(`❌ Error probando conexión:`, error);
      const errorMessage = getErrorMessage(error).message || 'Error al probar la conexión';
      throw new Error(errorMessage);
    }
  },

  /**
   * Probar una conexión existente
   * 
   * @param conexionId - ID de la conexión existente a probar
   * @returns Promise con resultado de la prueba
   * @throws Error si falla la prueba
   */
  async testConexionExistente(conexionId: number): Promise<ConexionTestResult> {
    try {
      console.log(`🧪 Probando conexión existente: ${conexionId}`);
      
      // ✅ URL CORREGIDA: Según backend - /conexiones/{conexion_id}/test
      const { data } = await api.post<ConexionTestResult>(`/conexiones/${conexionId}/test`);
      
      console.log(`✅ Prueba de conexión existente completada: ${data.exito ? 'ÉXITO' : 'FALLO'}`);
      return data;
    } catch (error) {
      console.error(`❌ Error probando conexión existente ${conexionId}:`, error);
      const errorMessage = getErrorMessage(error).message || 'Error al probar la conexión existente';
      throw new Error(errorMessage);
    }
  },

  /**
   * Obtener la conexión principal de un módulo específico
   * 
   * @param clienteId - ID del cliente
   * @param moduloId - ID del módulo
   * @returns Promise con la conexión principal o null si no existe
   * @throws Error si falla la consulta
   */
  async getConexionPrincipal(clienteId: number, moduloId: number): Promise<Conexion | null> {
    try {
      console.log(`🔄 Obteniendo conexión principal: cliente ${clienteId}, módulo ${moduloId}`);
      
      // ✅ URL CORREGIDA: Según backend - /conexiones/clientes/{cliente_id}/modulos/{modulo_id}/principal
      const { data } = await api.get<Conexion | null>(
        `/conexiones/clientes/${clienteId}/modulos/${moduloId}/principal`
      );
      
      console.log(`✅ Conexión principal ${data ? 'encontrada' : 'no encontrada'}`);
      return data;
    } catch (error) {
      console.error(`❌ Error obteniendo conexión principal:`, error);
      const errorMessage = getErrorMessage(error).message || 'Error al obtener la conexión principal';
      throw new Error(errorMessage);
    }
  }
};