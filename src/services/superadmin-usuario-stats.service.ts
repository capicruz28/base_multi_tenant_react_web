import api from '../core/api/api';
import type {
  PlatformUsuariosStatsParams,
  PlatformUsuariosStatsResponse,
} from '../types/platform-usuarios-stats.types';

const STATS_URL = '/superadmin/usuarios/stats';

export const superadminUsuarioStatsService = {
  async getUsuariosStats(
    params: PlatformUsuariosStatsParams = {},
  ): Promise<PlatformUsuariosStatsResponse> {
    const query: Record<string, string> = {};
    if (params.cliente_id) {
      query.cliente_id = params.cliente_id;
    }
    if (params.search) {
      query.search = params.search;
    }
    if (params.proveedor_autenticacion) {
      query.proveedor_autenticacion = params.proveedor_autenticacion;
    }

    const response = await api.get<PlatformUsuariosStatsResponse>(STATS_URL, {
      params: query,
    });
    return response.data;
  },
};
