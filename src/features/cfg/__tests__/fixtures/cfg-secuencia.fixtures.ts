/**
 * Fixtures CFG Wave 1+ — IDs fake fijos (no renderizar en UI asserts).
 */

import type {
  CfgSecuencia,
  CfgSecuenciaPreview,
} from '../../types/cfg.types';
import type { CfgSecuenciaFormatoForm } from '../../types/cfg-list.types';
import type { ErpPaginatedResponse } from '@/core/list';

const ID_ACTIVA = '11111111-1111-4111-8111-111111111111';
const ID_INACTIVA = '22222222-2222-4222-8222-222222222222';
const ID_LOCKED = '33333333-3333-4333-8333-333333333333';
const ID_DRIFT = '44444444-4444-4444-8444-444444444444';
const ID_NO_PREVIEW = '55555555-5555-4555-8555-555555555555';

const baseSecuencia = (
  overrides: Partial<CfgSecuencia> & Pick<CfgSecuencia, 'secuencia_id' | 'sequence_key'>,
): CfgSecuencia => ({
  prefijo: 'EMP',
  separador: '-',
  longitud_numero: 4,
  numero_inicial: 1,
  ultimo_numero: 10,
  es_activo: true,
  generation_policy: 'AUTO_DEFAULT',
  modulo_codigo: 'ORG',
  scope_type: 'TENANT',
  config_locked: false,
  policy_drift: false,
  supports_preview: true,
  fecha_creacion: '2026-01-01T00:00:00Z',
  fecha_actualizacion: '2026-01-02T00:00:00Z',
  ...overrides,
});

export const fixtureSecuenciaActiva: CfgSecuencia = baseSecuencia({
  secuencia_id: ID_ACTIVA,
  sequence_key: 'org_departamento',
});

export const fixtureSecuenciaInactiva: CfgSecuencia = baseSecuencia({
  secuencia_id: ID_INACTIVA,
  sequence_key: 'org_cargo',
  es_activo: false,
});

export const fixtureSecuenciaLocked: CfgSecuencia = baseSecuencia({
  secuencia_id: ID_LOCKED,
  sequence_key: 'org_empresa',
  config_locked: true,
  prefijo: 'EMP',
});

export const fixtureSecuenciaDrift: CfgSecuencia = baseSecuencia({
  secuencia_id: ID_DRIFT,
  sequence_key: 'inv_producto',
  modulo_codigo: 'INV',
  policy_drift: true,
});

export const fixtureSecuenciaNoPreview: CfgSecuencia = baseSecuencia({
  secuencia_id: ID_NO_PREVIEW,
  sequence_key: 'inv_almacen',
  modulo_codigo: 'INV',
  supports_preview: false,
});

export const fixtureListEnvelope: ErpPaginatedResponse<CfgSecuencia> = {
  items: [fixtureSecuenciaActiva, fixtureSecuenciaInactiva],
  total: 2,
  pagina_actual: 1,
  total_paginas: 1,
  limit: 50,
};

export const fixturePreviewOk: CfgSecuenciaPreview = {
  codigo_estimado: 'EMP-0011',
  disclaimer: 'Estimación no vinculante; no consume correlativo.',
  consume_contador: false,
  ultimo_numero_actual: 10,
  numero_inicial: 1,
  es_activo: true,
};

export const fixtureFormatoBaseline: CfgSecuenciaFormatoForm = {
  prefijo: 'EMP',
  separador: '-',
  longitud_numero: 4,
  numero_inicial: 1,
  generation_policy: 'AUTO_DEFAULT',
};
