/**
 * Tipos API del módulo CFG (Administrador de secuencias).
 * Fuente: docs/frontend-contracts/cfg/01_API_CONTRACT.md §7 (+ OpenAPI cuando exista).
 * MUST NOT: cliente_id en Read.
 */

export type CfgScopeType = 'TENANT' | 'EMPRESA' | 'ALMACEN' | 'PUNTO_VENTA';

export type CfgSeparador = '' | '-';

/** Políticas de generación admitidas en PATCH / lectura. */
export type CfgGenerationPolicy =
  | 'AUTO_REQUIRED'
  | 'AUTO_DEFAULT'
  | 'MANUAL_ONLY';

export const CFG_GENERATION_POLICIES: readonly CfgGenerationPolicy[] = [
  'AUTO_REQUIRED',
  'AUTO_DEFAULT',
  'MANUAL_ONLY',
] as const;

/** Alias contrato OpenAPI / UI. */
export type CodigoSecuenciaRead = CfgSecuencia;
export type CodigoSecuenciaUpdate = CfgSecuenciaUpdate;
export type CodigoSecuenciaPreviewResponse = CfgSecuenciaPreview;

/**
 * Lectura de secuencia de código (campos UI-críticos).
 * IDs de scope tipados para consumo interno; nunca renderizar UUID en UI.
 */
export interface CfgSecuencia {
  secuencia_id: string;
  sequence_key: string;
  prefijo: string;
  separador: CfgSeparador;
  longitud_numero: number;
  numero_inicial: number;
  ultimo_numero: number;
  es_activo: boolean;
  generation_policy: CfgGenerationPolicy | string;
  modulo_codigo: string;
  scope_type: CfgScopeType;
  config_locked: boolean;
  policy_drift: boolean;
  supports_preview: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  /** Enrich opcional — mostrar nombre; si solo hay id → "—" en display utils. */
  empresa_id?: string | null;
  empresa_nombre?: string | null;
  almacen_id?: string | null;
  almacen_nombre?: string | null;
  punto_venta_id?: string | null;
  punto_venta_nombre?: string | null;
}

/** Body PATCH — formato + política; al menos un campo en runtime. */
export interface CfgSecuenciaUpdate {
  prefijo?: string;
  separador?: CfgSeparador;
  longitud_numero?: number;
  numero_inicial?: number;
  generation_policy?: CfgGenerationPolicy;
}

/** Respuesta POST …/preview. */
export interface CfgSecuenciaPreview {
  codigo_estimado: string;
  disclaimer: string;
  consume_contador: boolean;
  ultimo_numero_actual: number;
  numero_inicial: number;
  es_activo: boolean;
}
