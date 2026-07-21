import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  buildCodigoPayloadSlice,
  clearCodigoRegistryForTests,
  mergeCodigoIntoPayload,
  registerCodigoManifest,
  resolvePolicyBehavior,
} from '@/core/codigo';

import { buildAlmacenCreateBasePayload, buildAlmacenUpdatePayload } from '../almacen-codigo.payload';
import { INV_CODIGO_MANIFEST, INV_CODIGO_SEQUENCE_KEYS } from '../inv.codigo.manifest';
import {
  buildTipoMovimientoCreateBasePayload,
  buildTipoMovimientoUpdatePayload,
} from '../tipo-movimiento-codigo.payload';
import {
  buildUnidadMedidaCreateBasePayload,
  buildUnidadMedidaUpdatePayload,
} from '../unidad-medida-codigo.payload';

vi.mock('@/features/org/utils/org-body-scope', () => ({
  assertBodyEmpresaMatchesSession: <T extends Record<string, unknown>>(body: T, empresaId: string) => ({
    ...body,
    empresa_id: empresaId,
  }),
}));

describe('maestros Fase 2 — payload CREATE/UPDATE (Engine)', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  describe('Unidad de Medida', () => {
    it('CREATE omite codigo vacío del base payload', () => {
      const payload = buildUnidadMedidaCreateBasePayload(
        {
          empresa_id: '',
          codigo: '',
          nombre: 'Kilogramo',
          tipo_unidad: 'peso',
          es_activo: true,
        },
        'emp-1',
      );
      expect('codigo' in payload).toBe(false);
      expect(payload).toMatchObject({
        empresa_id: 'emp-1',
        nombre: 'Kilogramo',
        tipo_unidad: 'peso',
      });
    });

    it('CREATE auto merge sin codigo; manual con trim', () => {
      const entry = INV_CODIGO_MANIFEST.find(
        (e) => e.sequenceKey === INV_CODIGO_SEQUENCE_KEYS.unidadMedida,
      )!;
      const profile = resolvePolicyBehavior(entry, 'create');
      const base = buildUnidadMedidaCreateBasePayload(
        { empresa_id: '', nombre: 'UM', tipo_unidad: 'cantidad', es_activo: true },
        'emp-1',
      );
      const auto = mergeCodigoIntoPayload(
        base as Record<string, unknown>,
        buildCodigoPayloadSlice({
          entry,
          mode: 'create',
          profile,
          assignmentMode: 'auto',
          value: '',
        }),
      );
      expect('codigo' in auto).toBe(false);

      const manual = mergeCodigoIntoPayload(
        base as Record<string, unknown>,
        buildCodigoPayloadSlice({
          entry,
          mode: 'create',
          profile,
          assignmentMode: 'manual',
          value: '  UM010  ',
        }),
      );
      expect(manual.codigo).toBe('UM010');
    });

    it('UPDATE BR-IMM elimina codigo', () => {
      const payload = buildUnidadMedidaUpdatePayload({
        codigo: 'UM001',
        nombre: 'Actualizada',
        tipo_unidad: 'peso',
      } as Parameters<typeof buildUnidadMedidaUpdatePayload>[0] & { codigo: string });
      expect('codigo' in payload).toBe(false);
      expect(payload.nombre).toBe('Actualizada');
    });
  });

  describe('Tipo de Movimiento', () => {
    it('CREATE omite codigo vacío del base payload', () => {
      const payload = buildTipoMovimientoCreateBasePayload(
        {
          empresa_id: '',
          codigo: '',
          nombre: 'Ingreso',
          clase_movimiento: 'ENTRADA',
          es_activo: true,
        },
        'emp-1',
      );
      expect('codigo' in payload).toBe(false);
      expect(payload.nombre).toBe('Ingreso');
    });

    it('CREATE auto/manual vía Engine', () => {
      const entry = INV_CODIGO_MANIFEST.find(
        (e) => e.sequenceKey === INV_CODIGO_SEQUENCE_KEYS.tipoMovimiento,
      )!;
      const profile = resolvePolicyBehavior(entry, 'create');
      const base = buildTipoMovimientoCreateBasePayload(
        { empresa_id: '', nombre: 'TM', clase_movimiento: 'SALIDA', es_activo: true },
        'emp-1',
      );
      expect(
        'codigo' in
          mergeCodigoIntoPayload(
            base as Record<string, unknown>,
            buildCodigoPayloadSlice({
              entry,
              mode: 'create',
              profile,
              assignmentMode: 'auto',
              value: '',
            }),
          ),
      ).toBe(false);
      expect(
        mergeCodigoIntoPayload(
          base as Record<string, unknown>,
          buildCodigoPayloadSlice({
            entry,
            mode: 'create',
            profile,
            assignmentMode: 'manual',
            value: 'TM099',
          }),
        ).codigo,
      ).toBe('TM099');
    });

    it('UPDATE BR-IMM elimina codigo', () => {
      const payload = buildTipoMovimientoUpdatePayload({
        codigo: 'HACK',
        nombre: 'X',
        clase_movimiento: 'AJUSTE',
      } as Parameters<typeof buildTipoMovimientoUpdatePayload>[0] & { codigo: string });
      expect('codigo' in payload).toBe(false);
    });
  });

  describe('Almacén', () => {
    it('CREATE omite codigo vacío del base payload', () => {
      const payload = buildAlmacenCreateBasePayload(
        {
          empresa_id: '',
          codigo: '',
          nombre: 'Central',
          tipo_almacen: 'general',
          es_activo: true,
        },
        'emp-1',
      );
      expect('codigo' in payload).toBe(false);
      expect(payload.nombre).toBe('Central');
    });

    it('CREATE auto/manual vía Engine', () => {
      const entry = INV_CODIGO_MANIFEST.find(
        (e) => e.sequenceKey === INV_CODIGO_SEQUENCE_KEYS.almacen,
      )!;
      const profile = resolvePolicyBehavior(entry, 'create');
      const base = buildAlmacenCreateBasePayload(
        { empresa_id: '', nombre: 'ALM', tipo_almacen: 'general', es_activo: true },
        'emp-1',
      );
      expect(
        'codigo' in
          mergeCodigoIntoPayload(
            base as Record<string, unknown>,
            buildCodigoPayloadSlice({
              entry,
              mode: 'create',
              profile,
              assignmentMode: 'auto',
              value: '',
            }),
          ),
      ).toBe(false);
      expect(
        mergeCodigoIntoPayload(
          base as Record<string, unknown>,
          buildCodigoPayloadSlice({
            entry,
            mode: 'create',
            profile,
            assignmentMode: 'manual',
            value: 'ALM050',
          }),
        ).codigo,
      ).toBe('ALM050');
    });

    it('UPDATE BR-IMM elimina codigo', () => {
      const payload = buildAlmacenUpdatePayload({
        codigo: 'ALM001',
        nombre: 'Y',
        tipo_almacen: 'transito',
      } as Parameters<typeof buildAlmacenUpdatePayload>[0] & { codigo: string });
      expect('codigo' in payload).toBe(false);
      expect(payload.tipo_almacen).toBe('transito');
    });
  });
});
