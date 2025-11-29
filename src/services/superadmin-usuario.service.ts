import api from './api';
import {
  PaginatedSuperadminUsuariosResponse,
  SuperadminUsuario,
  UsuarioActividadResponse,
  UsuarioSesionesResponse,
} from '../types/superadmin-usuario.types';

const BASE_URL = '/superadmin/usuarios';

export interface SuperadminUsuarioListParams {
  page?: number;
  limit?: number;
  search?: string;
  es_activo?: boolean;
}

export interface UsuarioActividadParams {
  limite?: number;
  tipo_evento?: string;
}

export interface UsuarioSesionesParams {
  solo_activas?: boolean;
}

export const superadminUsuarioService = {
  async getUsuariosByCliente(
    clienteId: number,
    { page = 1, limit = 20, search, es_activo }: SuperadminUsuarioListParams = {},
  ): Promise<PaginatedSuperadminUsuariosResponse> {
    const params: Record<string, any> = {
      page,
      limit,
    };

    if (search) {
      params.search = search;
    }
    if (typeof es_activo === 'boolean') {
      params.es_activo = es_activo;
    }

    const response = await api.get<PaginatedSuperadminUsuariosResponse>(
      `${BASE_URL}/clientes/${clienteId}/usuarios/`,
      { params },
    );
    return response.data;
  },

  async getUsuarioDetalle(usuarioId: number): Promise<SuperadminUsuario> {
    const response = await api.get<SuperadminUsuario>(`${BASE_URL}/${usuarioId}/`);
    return response.data;
  },

  async getUsuarioActividad(
    usuarioId: number,
    { limite = 50, tipo_evento }: UsuarioActividadParams = {},
  ): Promise<UsuarioActividadResponse> {
    const params: Record<string, any> = { limite };
    if (tipo_evento) {
      params.tipo_evento = tipo_evento;
    }

    const response = await api.get<UsuarioActividadResponse>(
      `${BASE_URL}/${usuarioId}/actividad/`,
      { params },
    );
    return response.data;
  },

  async getUsuarioSesiones(
    usuarioId: number,
    { solo_activas = true }: UsuarioSesionesParams = {},
  ): Promise<UsuarioSesionesResponse> {
    const params: Record<string, any> = { solo_activas };

    const response = await api.get<UsuarioSesionesResponse>(
      `${BASE_URL}/${usuarioId}/sesiones/`,
      { params },
    );
    return response.data;
  },
};




