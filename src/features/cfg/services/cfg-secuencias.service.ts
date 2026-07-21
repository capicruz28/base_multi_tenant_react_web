/**
 * Servicio HTTP CFG — secuencias de código.
 * Paths efectivos: /api/v1/cfg/secuencias… (baseURL Axios + BASE).
 * Sin toast, sin React Query.
 */

import api from '@/core/api/api';
import {
  buildErpListQueryParams,
  type ErpPaginatedResponse,
} from '@/core/list';
import type {
  CfgSecuencia,
  CfgSecuenciaPreview,
  CfgSecuenciaUpdate,
} from '../types/cfg.types';
import type { CfgSecuenciaListParams } from '../types/cfg-list.types';

const BASE = '/cfg';

export type CfgSecuenciaListResponse =
  | CfgSecuencia[]
  | ErpPaginatedResponse<CfgSecuencia>;

function buildCfgSecuenciaListQuery(
  params?: CfgSecuenciaListParams,
): Record<string, string | number | boolean> {
  return buildErpListQueryParams(
    {
      modulo_codigo: params?.modulo_codigo,
      es_activo: params?.es_activo,
      scope_type: params?.scope_type,
      empresa_id: params?.empresa_id,
      sequence_key: params?.sequence_key,
    },
    params,
  );
}

export const cfgSecuenciaService = {
  /**
   * operationId: list_cfg_codigo_secuencias
   */
  list: async (
    params?: CfgSecuenciaListParams,
  ): Promise<CfgSecuenciaListResponse> => {
    const { data } = await api.get<CfgSecuenciaListResponse>(
      `${BASE}/secuencias`,
      { params: buildCfgSecuenciaListQuery(params) },
    );
    return data;
  },

  /**
   * operationId: get_cfg_codigo_secuencia
   */
  getById: async (secuenciaId: string): Promise<CfgSecuencia> => {
    const { data } = await api.get<CfgSecuencia>(
      `${BASE}/secuencias/${secuenciaId}`,
    );
    return data;
  },

  /**
   * operationId: update_cfg_codigo_secuencia
   * Body: prefijo / separador / longitud_numero / numero_inicial / generation_policy.
   */
  update: async (
    secuenciaId: string,
    body: CfgSecuenciaUpdate,
  ): Promise<CfgSecuencia> => {
    const { data } = await api.patch<CfgSecuencia>(
      `${BASE}/secuencias/${secuenciaId}`,
      body,
    );
    return data;
  },

  /**
   * operationId: desactivar_cfg_codigo_secuencia
   */
  desactivar: async (secuenciaId: string): Promise<CfgSecuencia> => {
    const { data } = await api.delete<CfgSecuencia>(
      `${BASE}/secuencias/${secuenciaId}`,
    );
    return data;
  },

  /**
   * operationId: reactivar_cfg_codigo_secuencia
   */
  reactivar: async (secuenciaId: string): Promise<CfgSecuencia> => {
    const { data } = await api.post<CfgSecuencia>(
      `${BASE}/secuencias/${secuenciaId}/reactivar`,
    );
    return data;
  },

  /**
   * operationId: preview_cfg_codigo_secuencia
   * Body: vacío.
   */
  preview: async (secuenciaId: string): Promise<CfgSecuenciaPreview> => {
    const { data } = await api.post<CfgSecuenciaPreview>(
      `${BASE}/secuencias/${secuenciaId}/preview`,
    );
    return data;
  },
};
