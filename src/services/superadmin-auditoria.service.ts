import api from './api';
import {
  AuthAuditLog,
  PaginatedAuthAuditLogResponse,
} from '../types/superadmin-auditoria.types';

const BASE_URL = '/superadmin/auditoria';

export interface AuthLogsParams {
  cliente_id: number;
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
      cliente_id,
      page,
      limit,
      ordenar_por,
      orden,
    };

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

  async getAuthLogDetalle(logId: number): Promise<AuthAuditLog> {
    const response = await api.get<AuthAuditLog>(`${BASE_URL}/autenticacion/${logId}/`);
    return response.data;
  },
};




