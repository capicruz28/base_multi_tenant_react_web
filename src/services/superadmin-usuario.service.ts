import api from '../core/api/api';
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
  cliente_id?: string;
  ordenar_por?: 'fecha_creacion' | 'fecha_ultimo_acceso' | 'nombre_usuario';
  orden?: 'asc' | 'desc';
}

export interface UsuarioActividadParams {
  limite?: number;
  tipo_evento?: string;
}

export interface UsuarioSesionesParams {
  solo_activas?: boolean;
}

export const superadminUsuarioService = {
  async getUsuariosGlobales(
    {
      page = 1,
      limit = 20,
      search,
      es_activo,
      cliente_id,
      ordenar_por,
      orden,
    }: SuperadminUsuarioListParams = {},
  ): Promise<PaginatedSuperadminUsuariosResponse> {
    const params: Record<string, unknown> = { page, limit };
    if (search) params.search = search;
    if (typeof es_activo === 'boolean') params.es_activo = es_activo;
    if (cliente_id) params.cliente_id = cliente_id;
    if (ordenar_por) params.ordenar_por = ordenar_por;
    if (orden) params.orden = orden;

    const response = await api.get<PaginatedSuperadminUsuariosResponse>(`${BASE_URL}/`, {
      params,
    });
    return response.data;
  },

  async getUsuariosByCliente(
    clienteId: string,
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

  async getUsuarioDetalle(usuarioId: number, cliente_id?: string): Promise<SuperadminUsuario> {
    const params: Record<string, any> = {};
    if (cliente_id !== undefined) params.cliente_id = cliente_id;
    
    const response = await api.get<SuperadminUsuario>(`${BASE_URL}/${usuarioId}/`, {
      params,
    });
    return response.data;
  },

  async getUsuarioActividad(
    usuarioId: string,
    { limite = 50, tipo_evento }: UsuarioActividadParams = {},
    cliente_id?: string,
  ): Promise<UsuarioActividadResponse> {
    const params: Record<string, any> = { limite };
    if (tipo_evento) {
      params.tipo_evento = tipo_evento;
    }
    if (cliente_id !== undefined) params.cliente_id = cliente_id;

    const response = await api.get<UsuarioActividadResponse>(
      `${BASE_URL}/${usuarioId}/actividad/`,
      { params },
    );
    return response.data;
  },

  async getUsuarioSesiones(
    usuarioId: string,
    { solo_activas = true }: UsuarioSesionesParams = {},
    cliente_id?: string,
  ): Promise<UsuarioSesionesResponse> {
    const params: Record<string, any> = { solo_activas };
    if (cliente_id !== undefined) params.cliente_id = cliente_id;

    const response = await api.get<UsuarioSesionesResponse>(
      `${BASE_URL}/${usuarioId}/sesiones/`,
      { params },
    );
    return response.data;
  },
};













