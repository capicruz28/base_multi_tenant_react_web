import { describe, expect, it } from 'vitest';

import {
  serializeInventarioFisicoCreatePayload,
  serializeInventarioFisicoUpdatePayload,
  serializeMovimientoCreatePayload,
  serializeMovimientoUpdatePayload,
} from '../documento-codigo.payload';

describe('documentos INV AUTO_REQUIRED — serializers compartidos', () => {
  describe('Movimiento', () => {
    it('CREATE simple omite numero_movimiento', () => {
      const payload = serializeMovimientoCreatePayload({
        empresa_id: 'emp-1',
        numero_movimiento: 'MOV-HACK',
        tipo_movimiento_id: 'tm-1',
        fecha_contable: '2026-07-17',
      });

      expect('numero_movimiento' in payload).toBe(false);
      expect(payload.tipo_movimiento_id).toBe('tm-1');
    });

    it('CREATE con detalle reutiliza el mismo serializer', () => {
      const payload = serializeMovimientoCreatePayload({
        empresa_id: 'emp-1',
        numero_movimiento: 'MOV-HACK',
        tipo_movimiento_id: 'tm-1',
        fecha_contable: '2026-07-17',
        detalles: [{ producto_id: 'p-1', cantidad: 1 }],
      });

      expect('numero_movimiento' in payload).toBe(false);
      expect(payload.detalles).toHaveLength(1);
    });

    it('UPDATE simple y con detalle cumplen BR-IMM con el mismo serializer', () => {
      const simple = serializeMovimientoUpdatePayload({
        numero_movimiento: 'MOV-HACK',
        observaciones: 'Simple',
      });
      const conDetalle = serializeMovimientoUpdatePayload({
        numero_movimiento: 'MOV-HACK',
        observaciones: 'Con detalle',
        detalles: [{ producto_id: 'p-1', cantidad: 2 }],
      });

      expect('numero_movimiento' in simple).toBe(false);
      expect('numero_movimiento' in conDetalle).toBe(false);
      expect(conDetalle.detalles).toHaveLength(1);
    });
  });

  describe('Inventario físico', () => {
    it('CREATE simple omite numero_inventario', () => {
      const payload = serializeInventarioFisicoCreatePayload({
        empresa_id: 'emp-1',
        numero_inventario: 'IF-HACK',
        fecha_inventario: '2026-07-17',
        almacen_id: 'alm-1',
        tipo_inventario: 'total',
      });

      expect('numero_inventario' in payload).toBe(false);
      expect(payload.almacen_id).toBe('alm-1');
    });

    it('CREATE con detalle reutiliza el mismo serializer', () => {
      const payload = serializeInventarioFisicoCreatePayload({
        empresa_id: 'emp-1',
        numero_inventario: 'IF-HACK',
        fecha_inventario: '2026-07-17',
        almacen_id: 'alm-1',
        tipo_inventario: 'total',
        detalles: [{ producto_id: 'p-1', cantidad_sistema: 10 }],
      });

      expect('numero_inventario' in payload).toBe(false);
      expect(payload.detalles).toHaveLength(1);
    });

    it('UPDATE simple y con detalle cumplen BR-IMM con el mismo serializer', () => {
      const simple = serializeInventarioFisicoUpdatePayload({
        numero_inventario: 'IF-HACK',
        descripcion: 'Simple',
      });
      const conDetalle = serializeInventarioFisicoUpdatePayload({
        numero_inventario: 'IF-HACK',
        descripcion: 'Con detalle',
        detalles: [{ producto_id: 'p-1', cantidad_sistema: 10 }],
      });

      expect('numero_inventario' in simple).toBe(false);
      expect('numero_inventario' in conDetalle).toBe(false);
      expect(conDetalle.detalles).toHaveLength(1);
    });
  });

  it('no altera payloads propios de workflows', () => {
    const anularMovimiento = { motivo: 'Error de captura' };
    const estornarMovimiento = { motivo: 'Reversión' };
    const aprobarInventario = { tipo_movimiento_id: 'tm-ajuste', observaciones: 'Aprobar' };

    expect(serializeMovimientoUpdatePayload(anularMovimiento)).toEqual(anularMovimiento);
    expect(serializeMovimientoUpdatePayload(estornarMovimiento)).toEqual(estornarMovimiento);
    expect(serializeInventarioFisicoUpdatePayload(aprobarInventario)).toEqual(aprobarInventario);
  });
});
