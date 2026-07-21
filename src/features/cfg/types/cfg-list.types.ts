/**
 * Tipos de listado / filtros / formulario formato — CFG Wave 0.
 */

import type { ErpListQueryBase } from '@/core/list';
import type {
  CfgGenerationPolicy,
  CfgScopeType,
  CfgSeparador,
} from './cfg.types';

/** Params GET /api/v1/cfg/secuencias (UI siempre envía page+limit desde W2). */
export interface CfgSecuenciaListParams extends ErpListQueryBase {
  modulo_codigo?: string;
  es_activo?: boolean;
  scope_type?: CfgScopeType;
  /** Reservado API; UI MVP no lo setea (D8). */
  empresa_id?: string;
  sequence_key?: string;
}

export type CfgEsActivoFilterUi = 'activas' | 'inactivas' | 'todas';

export interface CfgSecuenciaListFiltersUi {
  modulo_codigo: string;
  es_activo: CfgEsActivoFilterUi;
  scope_type: '' | CfgScopeType;
}

export interface CfgSecuenciaFormatoForm {
  prefijo: string;
  separador: CfgSeparador;
  longitud_numero: number;
  numero_inicial: number;
  generation_policy: CfgGenerationPolicy;
}

export type CfgSecuenciaFieldErrors = Partial<
  Record<keyof CfgSecuenciaFormatoForm, string>
>;
