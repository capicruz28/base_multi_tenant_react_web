import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearCodigoRegistryForTests,
  getCodigoEntry,
  listCodigoEntriesByModule,
  registerCodigoManifest,
} from '@/core/codigo';

import { INV_CODIGO_MANIFEST, INV_CODIGO_SEQUENCE_KEYS } from '../inv.codigo.manifest';

describe('inv.codigo.manifest', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  it('registra las siete entidades INV Wave 1', () => {
    const entries = listCodigoEntriesByModule('inv');
    expect(entries).toHaveLength(7);
    expect(entries.map((e) => e.sequenceKey).sort()).toEqual(
      Object.values(INV_CODIGO_SEQUENCE_KEYS).sort(),
    );
  });

  it('maestros AUTO_DEFAULT usan fieldKey codigo (excepto producto)', () => {
    for (const key of [
      INV_CODIGO_SEQUENCE_KEYS.categoria,
      INV_CODIGO_SEQUENCE_KEYS.unidadMedida,
      INV_CODIGO_SEQUENCE_KEYS.tipoMovimiento,
      INV_CODIGO_SEQUENCE_KEYS.almacen,
    ]) {
      const entry = getCodigoEntry(key);
      expect(entry.fieldKey).toBe('codigo');
      expect(entry.policy).toBe('AUTO_DEFAULT');
      expect(entry.moduleCode).toBe('inv');
      expect(entry.meta.scopeLabel).toBe('empresa');
    }
  });

  it('producto usa fieldKey codigo_sku y AUTO_DEFAULT', () => {
    const entry = getCodigoEntry(INV_CODIGO_SEQUENCE_KEYS.producto);
    expect(entry.fieldKey).toBe('codigo_sku');
    expect(entry.policy).toBe('AUTO_DEFAULT');
    expect(entry.meta.prefixHint).toBe('P');
    expect(entry.meta.maxLength).toBe(50);
  });

  it('documentos usan AUTO_REQUIRED y fieldKeys de número', () => {
    const movimiento = getCodigoEntry(INV_CODIGO_SEQUENCE_KEYS.movimiento);
    expect(movimiento.fieldKey).toBe('numero_movimiento');
    expect(movimiento.policy).toBe('AUTO_REQUIRED');
    expect(movimiento.meta.prefixHint).toBe('MOV');

    const inventario = getCodigoEntry(INV_CODIGO_SEQUENCE_KEYS.inventarioFisico);
    expect(inventario.fieldKey).toBe('numero_inventario');
    expect(inventario.policy).toBe('AUTO_REQUIRED');
    expect(inventario.meta.prefixHint).toBe('IF');
  });
});
