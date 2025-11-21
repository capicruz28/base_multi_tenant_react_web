/**
 * Servicio para gestión de conexiones de base de datos (Super Admin)
 * Alineado 100% con los endpoints del backend (app.api.v1.endpoints.conexiones)
 */
import api from './api';
import {
  Conexion,
  ConexionCreate,
  ConexionUpdate,
  ConexionTest,
  ConexionTestResult
} from '../types/conexion.types';
import { getErrorMessage } from './error.service';

const BASE_URL = '/conexiones';

export const conexionService = {
  /**
   * Listar conexiones de un cliente
   * Endpoint: GET /conexiones/clientes/{cliente_id}/
   */
  async getConexiones(cliente_id: number): Promise<Conexion[]> {
    try {
      const { data } = await api.get<Conexion[]>(`${BASE_URL}/clientes/${cliente_id}/`);
      return data;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener conexiones del cliente');
    }
  },

  /**
   * Obtener conexión principal de un módulo
   * Endpoint: GET /conexiones/clientes/{cliente_id}/modulos/{modulo_id}/principal/
   */
  async getConexionPrincipal(cliente_id: number, modulo_id: number): Promise<Conexion | null> {
    try {
      const { data } = await api.get<Conexion>(
        `${BASE_URL}/clientes/${cliente_id}/modulos/${modulo_id}/principal/`
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching principal connection:', error);
      throw new Error(getErrorMessage(error).message || 'Error al obtener conexión principal');
    }
  },

  /**
   * Crear nueva conexión
   * Endpoint: POST /conexiones/clientes/{cliente_id}/
   */
  async createConexion(cliente_id: number, conexionData: ConexionCreate): Promise<Conexion> {
    try {
      conexionData.cliente_id = cliente_id;
      const { data } = await api.post<Conexion>(`${BASE_URL}/clientes/${cliente_id}/`, conexionData);
      return data;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw new Error(getErrorMessage(error).message || 'Error al crear la conexión');
    }
  },

  /**
   * Actualizar conexión existente
   * Endpoint: PUT /conexiones/{conexion_id}/
   */
  async updateConexion(conexion_id: number, conexionData: ConexionUpdate): Promise<Conexion> {
    try {
      const { data } = await api.put<Conexion>(`${BASE_URL}/${conexion_id}/`, conexionData);
      return data;
    } catch (error) {
      console.error('Error updating connection:', error);
      throw new Error(getErrorMessage(error).message || 'Error al actualizar la conexión');
    }
  },

  /**
   * Desactivar conexión (eliminación lógica)
   * Endpoint: DELETE /conexiones/{conexion_id}/
   */
  async deleteConexion(conexion_id: number): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/${conexion_id}/`);
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw new Error(getErrorMessage(error).message || 'Error al desactivar la conexión');
    }
  },

  /**
   * Testear conexión (sin guardar)
   * Endpoint: POST /conexiones/test
   */
  async testConexion(testData: ConexionTest): Promise<ConexionTestResult> {
    try {
      const { data } = await api.post<ConexionTestResult>(`${BASE_URL}/test`, testData);
      return data;
    } catch (error) {
      console.error('Error testing connection:', error);
      throw new Error(getErrorMessage(error).message || 'Error al probar la conexión');
    }
  }
};
