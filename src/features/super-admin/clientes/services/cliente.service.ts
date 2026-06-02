// src/features/super-admin/clientes/services/cliente.service.ts
import api from '@/core/api/api';
import axios from 'axios';
import {
  Cliente,
  ClienteCreate,
  ClienteUpdate,
  ClienteListResponse,
  ClienteStats,
  ClienteFilters,
  ClienteResponse,
  SubdomainValidationResponse,
} from '../types/cliente.types';

const BASE_URL = '/clientes';

/**
 * Servicio para gestión de clientes (Super Admin).
 * Errores HTTP: propagan AxiosError (patrón ORG) para resolución única en hooks/UI vía getErrorMessage.
 */
export const clienteService = {
  async getClientes(
    pagina: number = 1,
    limite: number = 10,
    filtros?: ClienteFilters,
  ): Promise<ClienteListResponse> {
    const params = new URLSearchParams();
    const skip = (pagina - 1) * limite;
    params.append('skip', skip.toString());
    params.append('limit', limite.toString());

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
  },

  async getClienteById(id: string): Promise<Cliente> {
    const { data } = await api.get<Cliente>(`${BASE_URL}/${id}/`);
    return data;
  },

  async createCliente(clienteData: ClienteCreate): Promise<Cliente> {
    const { data } = await api.post<ClienteResponse>(`${BASE_URL}/`, clienteData);
    if (data.data) {
      return data.data;
    }
    throw new Error('Respuesta del servidor sin datos del cliente');
  },

  async updateCliente(id: string, clienteData: ClienteUpdate): Promise<Cliente> {
    const { data } = await api.put<ClienteResponse>(`${BASE_URL}/${id}/`, clienteData);
    if (data.data) {
      return data.data;
    }
    throw new Error('Respuesta del servidor sin datos del cliente');
  },

  async activateCliente(id: string): Promise<Cliente> {
    const { data } = await api.put<ClienteResponse>(`${BASE_URL}/${id}/activar/`);
    if (data.data) {
      return data.data;
    }
    throw new Error('Respuesta del servidor sin datos del cliente');
  },

  async deactivateCliente(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string; cliente_id: string }>(
      `${BASE_URL}/${id}/`,
    );
    return { message: data.message || 'Cliente desactivado exitosamente' };
  },

  async suspendCliente(id: string): Promise<Cliente> {
    const { data } = await api.put<ClienteResponse>(`${BASE_URL}/${id}/suspender/`);
    if (data.data) {
      return data.data;
    }
    throw new Error('Respuesta del servidor sin datos del cliente');
  },

  /**
   * Si el endpoint no está disponible (404/500), retorna null sin bloquear el detalle.
   */
  async getClienteStats(id: string): Promise<ClienteStats | null> {
    try {
      const { data } = await api.get<ClienteStats>(`${BASE_URL}/${id}/estadisticas/`);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 500 || status === 404) {
          if (import.meta.env.DEV) {
            console.log(`ℹ️ Endpoint /clientes/${id}/estadisticas/ no disponible (${status})`);
          }
          return null;
        }
      }
      throw error;
    }
  },

  async validateSubdominio(subdominio: string): Promise<SubdomainValidationResponse> {
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdominio)) {
      return {
        disponible: false,
        mensaje:
          'El subdominio debe contener solo letras minúsculas, números y guiones, y no puede comenzar o terminar con guión.',
      };
    }

    if (subdominio.length < 3 || subdominio.length > 63) {
      return {
        disponible: false,
        mensaje: 'El subdominio debe tener entre 3 y 63 caracteres.',
      };
    }

    return { disponible: true };
  },

  async debugAccessLevels(): Promise<unknown> {
    const { data } = await api.get(`${BASE_URL}/debug/access-levels`);
    return data;
  },

  async debugUserInfo(): Promise<unknown> {
    const { data } = await api.get(`${BASE_URL}/debug/user-info`);
    return data;
  },
};
