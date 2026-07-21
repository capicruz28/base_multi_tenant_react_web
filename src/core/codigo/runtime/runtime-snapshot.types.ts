/**
 * Tipos — Runtime Snapshot (contrato 00_RUNTIME_SNAPSHOT_CONTRACT.md v1.0).
 * SSOT de generation_policy / formato efectivo para consumidores FCE.
 */

import type { CodigoGenerationPolicy } from '../engine/codigo-engine.types';

export type CodigoRuntimeScopeType =
  | 'TENANT'
  | 'EMPRESA'
  | 'ALMACEN'
  | 'PUNTO_VENTA';

export type CodigoRuntimeNormalizeCase = 'UPPER' | 'AS_IS';

/** Ítem de `items[]` — proyección Runtime por secuencia/scope. */
export interface CodigoRuntimeSequenceItem {
  sequence_key: string;
  modulo_codigo: string;
  scope_type: CodigoRuntimeScopeType | string;
  empresa_id: string | null;
  almacen_id: string | null;
  punto_venta_id: string | null;
  generation_policy: CodigoGenerationPolicy | string;
  es_activo: boolean;
  prefijo: string;
  separador: string;
  longitud_numero: number;
  supports_preview: boolean;
  allow_manual: boolean;
  normalize_case: CodigoRuntimeNormalizeCase | string;
  max_output_length: number;
}

/** Documento raíz GET /api/v1/cfg/runtime/snapshot */
export interface CodigoRuntimeSnapshot {
  schema_version: string;
  generated_at: string;
  content_revision: string;
  items: CodigoRuntimeSequenceItem[];
}

/** Contexto de sesión / formulario para resolución §7. */
export interface CodigoRuntimeScopeContext {
  empresaId?: string | null;
  almacenId?: string | null;
  puntoVentaId?: string | null;
}

export type ResolveRuntimeSequenceResult =
  | { status: 'resolved'; item: CodigoRuntimeSequenceItem }
  | { status: 'inactive'; item: CodigoRuntimeSequenceItem }
  | { status: 'not_found' };
