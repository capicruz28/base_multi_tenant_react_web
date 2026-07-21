import { describe, it, expect } from 'vitest';
import { resolveEffectiveCodigoPolicy } from '../resolve-effective-codigo-policy';
import type {
  CodigoRuntimeSequenceItem,
  CodigoRuntimeSnapshot,
} from '../runtime-snapshot.types';

const EMPRESA_A = '11111111-1111-1111-1111-111111111111';

function item(
  partial: Partial<CodigoRuntimeSequenceItem> &
    Pick<CodigoRuntimeSequenceItem, 'sequence_key' | 'scope_type'>,
): CodigoRuntimeSequenceItem {
  return {
    modulo_codigo: 'ORG',
    empresa_id: null,
    almacen_id: null,
    punto_venta_id: null,
    generation_policy: 'AUTO_DEFAULT',
    es_activo: true,
    prefijo: 'X',
    separador: '',
    longitud_numero: 3,
    supports_preview: true,
    allow_manual: true,
    normalize_case: 'UPPER',
    max_output_length: 20,
    ...partial,
  };
}

function snapshot(items: CodigoRuntimeSequenceItem[]): CodigoRuntimeSnapshot {
  return {
    schema_version: '1.0',
    generated_at: '2026-07-20T23:15:00.000000',
    content_revision: 'abc',
    items,
  };
}

describe('resolveEffectiveCodigoPolicy (SSOT Runtime)', () => {
  it('loading → status loading (sin Manifest)', () => {
    expect(
      resolveEffectiveCodigoPolicy({
        sequenceKey: 'org_sucursal',
        snapshot: undefined,
        isSnapshotLoading: true,
        isSnapshotError: false,
      }),
    ).toEqual({ status: 'loading' });
  });

  it('error → status error (sin Manifest)', () => {
    expect(
      resolveEffectiveCodigoPolicy({
        sequenceKey: 'inv_movimiento',
        snapshot: undefined,
        isSnapshotLoading: false,
        isSnapshotError: true,
      }),
    ).toEqual({ status: 'error' });
  });

  it('resolved → policy del Snapshot', () => {
    const result = resolveEffectiveCodigoPolicy({
      sequenceKey: 'org_sucursal',
      snapshot: snapshot([
        item({
          sequence_key: 'org_sucursal',
          scope_type: 'EMPRESA',
          empresa_id: EMPRESA_A,
          generation_policy: 'MANUAL_ONLY',
        }),
      ]),
      isSnapshotLoading: false,
      isSnapshotError: false,
      scopeContext: { empresaId: EMPRESA_A },
    });
    expect(result.status).toBe('resolved');
    if (result.status === 'resolved') {
      expect(result.policy).toBe('MANUAL_ONLY');
    }
  });

  it('AUTO_REQUIRED / AUTO_DEFAULT desde Runtime', () => {
    const autoReq = resolveEffectiveCodigoPolicy({
      sequenceKey: 'inv_movimiento',
      snapshot: snapshot([
        item({
          sequence_key: 'inv_movimiento',
          scope_type: 'EMPRESA',
          empresa_id: EMPRESA_A,
          generation_policy: 'AUTO_REQUIRED',
        }),
      ]),
      isSnapshotLoading: false,
      isSnapshotError: false,
      scopeContext: { empresaId: EMPRESA_A },
    });
    expect(autoReq.status).toBe('resolved');
    if (autoReq.status === 'resolved') {
      expect(autoReq.policy).toBe('AUTO_REQUIRED');
    }

    const autoDef = resolveEffectiveCodigoPolicy({
      sequenceKey: 'org_empresa',
      snapshot: snapshot([
        item({
          sequence_key: 'org_empresa',
          scope_type: 'TENANT',
          generation_policy: 'AUTO_DEFAULT',
        }),
      ]),
      isSnapshotLoading: false,
      isSnapshotError: false,
    });
    expect(autoDef.status).toBe('resolved');
    if (autoDef.status === 'resolved') {
      expect(autoDef.policy).toBe('AUTO_DEFAULT');
    }
  });

  it('not_found → status not_found (sin Manifest)', () => {
    expect(
      resolveEffectiveCodigoPolicy({
        sequenceKey: 'org_cargo',
        snapshot: snapshot([]),
        isSnapshotLoading: false,
        isSnapshotError: false,
      }),
    ).toEqual({ status: 'not_found' });
  });

  it('inactive → status inactive (sin Manifest)', () => {
    const result = resolveEffectiveCodigoPolicy({
      sequenceKey: 'org_departamento',
      snapshot: snapshot([
        item({
          sequence_key: 'org_departamento',
          scope_type: 'EMPRESA',
          empresa_id: EMPRESA_A,
          es_activo: false,
          generation_policy: 'MANUAL_ONLY',
        }),
      ]),
      isSnapshotLoading: false,
      isSnapshotError: false,
      scopeContext: { empresaId: EMPRESA_A },
    });
    expect(result.status).toBe('inactive');
  });

  it('policy inválida → invalid_policy', () => {
    const result = resolveEffectiveCodigoPolicy({
      sequenceKey: 'org_sucursal',
      snapshot: snapshot([
        item({
          sequence_key: 'org_sucursal',
          scope_type: 'EMPRESA',
          empresa_id: EMPRESA_A,
          generation_policy: 'UNKNOWN_POLICY',
        }),
      ]),
      isSnapshotLoading: false,
      isSnapshotError: false,
      scopeContext: { empresaId: EMPRESA_A },
    });
    expect(result.status).toBe('invalid_policy');
  });
});
