import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  buildCodigoPayloadSlice,
  clearCodigoRegistryForTests,
  mergeCodigoIntoPayload,
  registerCodigoManifest,
  resolvePolicyBehavior,
} from '@/core/codigo';

import {
  buildCategoriaCreateBasePayload,
  buildCategoriaUpdatePayload,
} from '../categoria-codigo.payload';
import { INV_CODIGO_MANIFEST, INV_CODIGO_SEQUENCE_KEYS } from '../inv.codigo.manifest';

vi.mock('@/features/org/utils/org-body-scope', () => ({
  assertBodyEmpresaMatchesSession: <T extends Record<string, unknown>>(body: T, empresaId: string) => ({
    ...body,
    empresa_id: empresaId,
  }),
}));

describe('categoria-codigo.payload', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  describe('CREATE serializer / payload', () => {
    it('omite codigo del base payload aunque venga vacío en el form', () => {
      const payload = buildCategoriaCreateBasePayload(
        {
          empresa_id: '',
          codigo: '',
          nombre: 'Repuestos',
          metodo_costeo_defecto: 'promedio',
          es_activo: true,
        },
        'emp-1',
      );
      expect(payload).toEqual({
        empresa_id: 'emp-1',
        nombre: 'Repuestos',
        metodo_costeo_defecto: 'promedio',
        es_activo: true,
      });
      expect('codigo' in payload).toBe(false);
    });

    it('Engine AUTO omite codigo al merge (payload contractual CREATE)', () => {
      const entry = INV_CODIGO_MANIFEST.find(
        (e) => e.sequenceKey === INV_CODIGO_SEQUENCE_KEYS.categoria,
      )!;
      const profile = resolvePolicyBehavior(entry, 'create');
      const slice = buildCodigoPayloadSlice({
        entry,
        mode: 'create',
        profile,
        assignmentMode: 'auto',
        value: '',
      });
      const base = buildCategoriaCreateBasePayload(
        { empresa_id: '', nombre: 'Cat', metodo_costeo_defecto: 'fifo', es_activo: true },
        'emp-1',
      );
      const merged = mergeCodigoIntoPayload(
        base as Record<string, unknown>,
        slice,
      );
      expect('codigo' in merged).toBe(false);
      expect(merged.nombre).toBe('Cat');
      expect(merged.empresa_id).toBe('emp-1');
    });

    it('Engine MANUAL incluye codigo trimmeado', () => {
      const entry = INV_CODIGO_MANIFEST.find(
        (e) => e.sequenceKey === INV_CODIGO_SEQUENCE_KEYS.categoria,
      )!;
      const profile = resolvePolicyBehavior(entry, 'create');
      const slice = buildCodigoPayloadSlice({
        entry,
        mode: 'create',
        profile,
        assignmentMode: 'manual',
        value: '  CAT099  ',
      });
      const base = buildCategoriaCreateBasePayload(
        { empresa_id: '', nombre: 'Cat', es_activo: true },
        'emp-1',
      );
      const merged = mergeCodigoIntoPayload(
        base as Record<string, unknown>,
        slice,
      );
      expect(merged.codigo).toBe('CAT099');
    });
  });

  describe('UPDATE serializer / BR-IMM', () => {
    it('elimina codigo del payload UPDATE', () => {
      const payload = buildCategoriaUpdatePayload({
        codigo: 'CAT001',
        nombre: 'Actualizada',
        metodo_costeo_defecto: 'promedio',
      } as Parameters<typeof buildCategoriaUpdatePayload>[0] & { codigo: string });
      expect(payload).toEqual({
        nombre: 'Actualizada',
        metodo_costeo_defecto: 'promedio',
      });
      expect('codigo' in payload).toBe(false);
    });

    it('BR-IMM: manipulación local de codigo no llega al PUT', () => {
      const formState = {
        nombre: 'X',
        codigo: 'HACKED',
        cuenta_contable_inventario: '10.1',
      };
      const payload = buildCategoriaUpdatePayload(
        formState as Parameters<typeof buildCategoriaUpdatePayload>[0] & { codigo: string },
      );
      expect(payload.nombre).toBe('X');
      expect(payload.cuenta_contable_inventario).toBe('10.1');
      expect('codigo' in payload).toBe(false);
    });
  });
});
