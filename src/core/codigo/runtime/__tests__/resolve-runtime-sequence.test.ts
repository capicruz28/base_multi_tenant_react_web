import { describe, it, expect } from 'vitest';
import { resolveRuntimeSequence } from '../resolve-runtime-sequence';
import type {
  CodigoRuntimeSequenceItem,
  CodigoRuntimeSnapshot,
} from '../runtime-snapshot.types';

const EMPRESA_A = '11111111-1111-1111-1111-111111111111';
const EMPRESA_B = '22222222-2222-2222-2222-222222222222';
const ALMACEN_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PV_A = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

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

describe('resolveRuntimeSequence', () => {
  it('TENANT resuelve el ítem único', () => {
    const doc = snapshot([
      item({
        sequence_key: 'org_empresa',
        scope_type: 'TENANT',
        prefijo: 'EMP',
      }),
    ]);
    const result = resolveRuntimeSequence({
      snapshot: doc,
      sequenceKey: 'org_empresa',
    });
    expect(result.status).toBe('resolved');
    if (result.status === 'resolved') {
      expect(result.item.prefijo).toBe('EMP');
      expect(result.item.generation_policy).toBe('AUTO_DEFAULT');
    }
  });

  it('EMPRESA multiempresa: no usa el primer ítem; match por empresa activa', () => {
    const doc = snapshot([
      item({
        sequence_key: 'org_sucursal',
        scope_type: 'EMPRESA',
        empresa_id: EMPRESA_A,
        prefijo: 'SUC',
        generation_policy: 'AUTO_DEFAULT',
      }),
      item({
        sequence_key: 'org_sucursal',
        scope_type: 'EMPRESA',
        empresa_id: EMPRESA_B,
        prefijo: 'SUX',
        generation_policy: 'MANUAL_ONLY',
      }),
    ]);

    const forA = resolveRuntimeSequence({
      snapshot: doc,
      sequenceKey: 'org_sucursal',
      scopeContext: { empresaId: EMPRESA_A },
    });
    expect(forA.status).toBe('resolved');
    if (forA.status === 'resolved') {
      expect(forA.item.prefijo).toBe('SUC');
      expect(forA.item.generation_policy).toBe('AUTO_DEFAULT');
    }

    const forB = resolveRuntimeSequence({
      snapshot: doc,
      sequenceKey: 'org_sucursal',
      scopeContext: { empresaId: EMPRESA_B },
    });
    expect(forB.status).toBe('resolved');
    if (forB.status === 'resolved') {
      expect(forB.item.prefijo).toBe('SUX');
      expect(forB.item.generation_policy).toBe('MANUAL_ONLY');
    }
  });

  it('EMPRESA sin empresaId en contexto → not_found', () => {
    const doc = snapshot([
      item({
        sequence_key: 'org_sucursal',
        scope_type: 'EMPRESA',
        empresa_id: EMPRESA_A,
      }),
    ]);
    expect(
      resolveRuntimeSequence({
        snapshot: doc,
        sequenceKey: 'org_sucursal',
        scopeContext: {},
      }).status,
    ).toBe('not_found');
  });

  it('ALMACEN match por almacen_id y empresa si aplica', () => {
    const doc = snapshot([
      item({
        sequence_key: 'inv_almacen_seq',
        scope_type: 'ALMACEN',
        empresa_id: EMPRESA_A,
        almacen_id: ALMACEN_A,
        prefijo: 'ALM',
      }),
    ]);
    const ok = resolveRuntimeSequence({
      snapshot: doc,
      sequenceKey: 'inv_almacen_seq',
      scopeContext: { empresaId: EMPRESA_A, almacenId: ALMACEN_A },
    });
    expect(ok.status).toBe('resolved');

    const wrongEmpresa = resolveRuntimeSequence({
      snapshot: doc,
      sequenceKey: 'inv_almacen_seq',
      scopeContext: { empresaId: EMPRESA_B, almacenId: ALMACEN_A },
    });
    expect(wrongEmpresa.status).toBe('not_found');
  });

  it('PUNTO_VENTA match por punto_venta_id', () => {
    const doc = snapshot([
      item({
        sequence_key: 'pos_ticket',
        scope_type: 'PUNTO_VENTA',
        punto_venta_id: PV_A,
        prefijo: 'PV',
      }),
    ]);
    const ok = resolveRuntimeSequence({
      snapshot: doc,
      sequenceKey: 'pos_ticket',
      scopeContext: { puntoVentaId: PV_A },
    });
    expect(ok.status).toBe('resolved');
    expect(
      resolveRuntimeSequence({
        snapshot: doc,
        sequenceKey: 'pos_ticket',
        scopeContext: { puntoVentaId: EMPRESA_A },
      }).status,
    ).toBe('not_found');
  });

  it('not_found si sequence_key ausente', () => {
    const doc = snapshot([
      item({ sequence_key: 'org_empresa', scope_type: 'TENANT' }),
    ]);
    expect(
      resolveRuntimeSequence({
        snapshot: doc,
        sequenceKey: 'org_sucursal',
      }).status,
    ).toBe('not_found');
  });

  it('snapshot vacío (items: []) → not_found', () => {
    expect(
      resolveRuntimeSequence({
        snapshot: snapshot([]),
        sequenceKey: 'org_empresa',
      }).status,
    ).toBe('not_found');
  });

  it('snapshot null/undefined → not_found', () => {
    expect(
      resolveRuntimeSequence({
        snapshot: null,
        sequenceKey: 'org_empresa',
      }).status,
    ).toBe('not_found');
  });

  it('inactive cuando es_activo false', () => {
    const doc = snapshot([
      item({
        sequence_key: 'org_departamento',
        scope_type: 'EMPRESA',
        empresa_id: EMPRESA_A,
        es_activo: false,
        prefijo: 'DEP',
      }),
    ]);
    const result = resolveRuntimeSequence({
      snapshot: doc,
      sequenceKey: 'org_departamento',
      scopeContext: { empresaId: EMPRESA_A },
    });
    expect(result.status).toBe('inactive');
    if (result.status === 'inactive') {
      expect(result.item.prefijo).toBe('DEP');
    }
  });

  it('no inventa defaults si la key no está', () => {
    const result = resolveRuntimeSequence({
      snapshot: snapshot([]),
      sequenceKey: 'org_cargo',
    });
    expect(result).toEqual({ status: 'not_found' });
  });
});
