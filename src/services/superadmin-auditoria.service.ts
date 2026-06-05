import api from '../core/api/api';
import {
  AuthAuditLog,
  AuditoriaEstadisticasResponse,
  PaginatedAuthAuditLogResponse,
  PaginatedSyncAuditLogResponse,
} from '../types/superadmin-auditoria.types';

const BASE_URL = '/superadmin/auditoria';

export interface AuditoriaEstadisticasParams {
  cliente_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface SyncLogsParams {
  cliente_origen_id?: string;
  cliente_destino_id?: string;
  usuario_id?: string;
  tipo_sincronizacion?: string;
  direccion?: string;
  operacion?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
  ordenar_por?: string;
  orden?: 'asc' | 'desc';
}

export interface AuthLogsParams {
  cliente_id?: string;
  page?: number;
  limit?: number;
  usuario_id?: number;
  evento?: string;
  exito?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  ip_address?: string;
  ordenar_por?: string;
  orden?: 'asc' | 'desc';
}

export const superadminAuditoriaService = {
  async getAuditoriaEstadisticas({
    cliente_id,
    fecha_desde,
    fecha_hasta,
  }: AuditoriaEstadisticasParams = {}): Promise<AuditoriaEstadisticasResponse> {
    const params: Record<string, string> = {};
    if (cliente_id !== undefined) params.cliente_id = cliente_id;
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;

    const response = await api.get<AuditoriaEstadisticasResponse>(
      `${BASE_URL}/estadisticas/`,
      { params },
    );
    return response.data;
  },

  async getAuthLogsByCliente({
    cliente_id,
    page = 1,
    limit = 50,
    usuario_id,
    evento,
    exito,
    fecha_desde,
    fecha_hasta,
    ip_address,
    ordenar_por = 'fecha_evento',
    orden = 'desc',
  }: AuthLogsParams): Promise<PaginatedAuthAuditLogResponse> {
    const params: Record<string, any> = {
      page,
      limit,
      ordenar_por,
      orden,
    };

    if (cliente_id !== undefined) params.cliente_id = cliente_id;
    if (usuario_id) params.usuario_id = usuario_id;
    if (evento) params.evento = evento;
    if (typeof exito === 'boolean') params.exito = exito;
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;
    if (ip_address) params.ip_address = ip_address;

    const response = await api.get<PaginatedAuthAuditLogResponse>(
      `${BASE_URL}/autenticacion/`,
      { params },
    );
    return response.data;
  },

  async getSyncLogs({
    cliente_origen_id,
    cliente_destino_id,
    usuario_id,
    tipo_sincronizacion,
    direccion,
    operacion,
    estado,
    fecha_desde,
    fecha_hasta,
    page = 1,
    limit = 10,
    ordenar_por = 'fecha_sincronizacion',
    orden = 'desc',
  }: SyncLogsParams = {}): Promise<PaginatedSyncAuditLogResponse> {
    const params: Record<string, string | number> = {
      page,
      limit,
      ordenar_por,
      orden,
    };

    if (cliente_origen_id) params.cliente_origen_id = cliente_origen_id;
    if (cliente_destino_id) params.cliente_destino_id = cliente_destino_id;
    if (usuario_id) params.usuario_id = usuario_id;
    if (tipo_sincronizacion) params.tipo_sincronizacion = tipo_sincronizacion;
    if (direccion) params.direccion = direccion;
    if (operacion) params.operacion = operacion;
    if (estado) params.estado = estado;
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;

    const response = await api.get<PaginatedSyncAuditLogResponse>(
      `${BASE_URL}/sincronizacion/`,
      { params },
    );
    return response.data;
  },

  async getAuthLogDetalle(logId: string, cliente_id?: string): Promise<AuthAuditLog> {
    const params: Record<string, any> = {};
    if (cliente_id !== undefined) params.cliente_id = cliente_id;
    
    const response = await api.get<AuthAuditLog>(`${BASE_URL}/autenticacion/${logId}/`, {
      params,
    });
    return response.data;
  },
};













