import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  buildCodigoPayloadSlice,
  clearCodigoRegistryForTests,
  mergeCodigoIntoPayload,
  registerCodigoManifest,
  resolvePolicyBehavior,
} from '@/core/codigo';

import { INV_CODIGO_MANIFEST, INV_CODIGO_SEQUENCE_KEYS } from '../inv.codigo.manifest';
import {
  buildProductoCreateBasePayload,
  buildProductoUpdatePayload,
} from '../producto-codigo.payload';

vi.mock('@/features/org/utils/org-body-scope', () => ({
  assertBodyEmpresaMatchesSession: <T extends Record<string, unknown>>(body: T, empresaId: string) => ({
    ...body,
    empresa_id: empresaId,
  }),
}));

const PRODUCTO_BASE = {
  empresa_id: '',
  nombre: 'Tornillo',
  tipo_producto: 'bien',
  unidad_medida_base_id: 'um-1',
  moneda_costo: 'mon-1',
  moneda_venta: 'mon-1',
  codigo_barra: '775123',
  codigo_interno: 'INT-01',
  codigo_fabricante: 'FAB-01',
  codigo_sunat: '15121501',
  es_activo: true,
} as const;

describe('producto-codigo.payload', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  describe('CREATE — solo codigo_sku es Motor', () => {
    it('omite codigo_sku vacío y conserva códigos de negocio', () => {
      const payload = buildProductoCreateBasePayload(
        { ...PRODUCTO_BASE, codigo_sku: '' },
        'emp-1',
      );
      expect('codigo_sku' in payload).toBe(false);
      expect(payload.codigo_barra).toBe('775123');
      expect(payload.codigo_interno).toBe('INT-01');
      expect(payload.codigo_fabricante).toBe('FAB-01');
      expect(payload.codigo_sunat).toBe('15121501');
      expect(payload.empresa_id).toBe('emp-1');
    });

    it('Engine AUTO omite codigo_sku al merge', () => {
      const entry = INV_CODIGO_MANIFEST.find(
        (e) => e.sequenceKey === INV_CODIGO_SEQUENCE_KEYS.producto,
      )!;
      expect(entry.fieldKey).toBe('codigo_sku');
      const profile = resolvePolicyBehavior(entry, 'create');
      const base = buildProductoCreateBasePayload({ ...PRODUCTO_BASE }, 'emp-1');
      const merged = mergeCodigoIntoPayload(
        base as Record<string, unknown>,
        buildCodigoPayloadSlice({
          entry,
          mode: 'create',
          profile,
          assignmentMode: 'auto',
          value: '',
        }),
      );
      expect('codigo_sku' in merged).toBe(false);
      expect(merged.codigo_barra).toBe('775123');
      expect(merged.codigo_interno).toBe('INT-01');
    });

    it('Engine MANUAL incluye codigo_sku trimmeado sin tocar otros códigos', () => {
      const entry = INV_CODIGO_MANIFEST.find(
        (e) => e.sequenceKey === INV_CODIGO_SEQUENCE_KEYS.producto,
      )!;
      const profile = resolvePolicyBehavior(entry, 'create');
      const base = buildProductoCreateBasePayload({ ...PRODUCTO_BASE }, 'emp-1');
      const merged = mergeCodigoIntoPayload(
        base as Record<string, unknown>,
        buildCodigoPayloadSlice({
          entry,
          mode: 'create',
          profile,
          assignmentMode: 'manual',
          value: '  P00099  ',
        }),
      );
      expect(merged.codigo_sku).toBe('P00099');
      expect(merged.codigo_barra).toBe('775123');
      expect(merged.codigo_fabricante).toBe('FAB-01');
      expect(merged.codigo_sunat).toBe('15121501');
    });
  });

  describe('UPDATE — BR-IMM solo codigo_sku', () => {
    it('elimina codigo_sku y conserva códigos de negocio', () => {
      const payload = buildProductoUpdatePayload({
        codigo_sku: 'P00001',
        nombre: 'Actualizado',
        codigo_barra: '775999',
        codigo_interno: 'INT-X',
        codigo_fabricante: 'FAB-X',
        codigo_sunat: '999',
      } as Parameters<typeof buildProductoUpdatePayload>[0] & { codigo_sku: string });

      expect('codigo_sku' in payload).toBe(false);
      expect(payload.nombre).toBe('Actualizado');
      expect(payload.codigo_barra).toBe('775999');
      expect(payload.codigo_interno).toBe('INT-X');
      expect(payload.codigo_fabricante).toBe('FAB-X');
      expect(payload.codigo_sunat).toBe('999');
    });

    it('BR-IMM: manipulación local de codigo_sku no llega al PUT', () => {
      const payload = buildProductoUpdatePayload({
        codigo_sku: 'HACKED',
        codigo_barra: 'KEEP',
        nombre: 'Y',
      } as Parameters<typeof buildProductoUpdatePayload>[0] & { codigo_sku: string });
      expect('codigo_sku' in payload).toBe(false);
      expect(payload.codigo_barra).toBe('KEEP');
    });
  });
});
