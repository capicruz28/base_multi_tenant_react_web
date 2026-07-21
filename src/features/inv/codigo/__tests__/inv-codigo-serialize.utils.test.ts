import { describe, it, expect } from 'vitest';

import {
  INV_MOTOR_FIELD_KEYS,
  normalizeInvAutoDefaultCreateField,
  stripInvAutoRequiredField,
  stripInvMotorFieldFromUpdate,
  toInvUpdatePayloadWithoutMotor,
} from '../inv-codigo-serialize.utils';

describe('inv-codigo-serialize.utils', () => {
  describe('normalizeInvAutoDefaultCreateField (AUTO_DEFAULT)', () => {
    it('omite string vacío', () => {
      const result = normalizeInvAutoDefaultCreateField(
        { empresa_id: 'e1', codigo: '', nombre: 'Cat' },
        INV_MOTOR_FIELD_KEYS.codigo,
      );
      expect(result).toEqual({ empresa_id: 'e1', nombre: 'Cat' });
      expect('codigo' in result).toBe(false);
    });

    it('omite null y undefined', () => {
      expect(
        normalizeInvAutoDefaultCreateField(
          { nombre: 'X', codigo: null },
          INV_MOTOR_FIELD_KEYS.codigo,
        ),
      ).toEqual({ nombre: 'X' });
      expect(
        normalizeInvAutoDefaultCreateField(
          { nombre: 'X', codigo: undefined },
          INV_MOTOR_FIELD_KEYS.codigo,
        ),
      ).toEqual({ nombre: 'X' });
    });

    it('omite solo whitespace', () => {
      const result = normalizeInvAutoDefaultCreateField(
        { codigo: '   ', nombre: 'X' },
        INV_MOTOR_FIELD_KEYS.codigo,
      );
      expect('codigo' in result).toBe(false);
    });

    it('conserva código manual trimmeado', () => {
      const result = normalizeInvAutoDefaultCreateField(
        { codigo: '  CAT001  ', nombre: 'X' },
        INV_MOTOR_FIELD_KEYS.codigo,
      );
      expect(result).toEqual({ codigo: 'CAT001', nombre: 'X' });
    });

    it('aplica a codigo_sku', () => {
      const result = normalizeInvAutoDefaultCreateField(
        { codigo_sku: '', nombre: 'Prod' },
        INV_MOTOR_FIELD_KEYS.codigoSku,
      );
      expect('codigo_sku' in result).toBe(false);
    });
  });

  describe('stripInvAutoRequiredField (AUTO_REQUIRED)', () => {
    it('elimina numero_movimiento aunque tenga valor', () => {
      const result = stripInvAutoRequiredField(
        {
          empresa_id: 'e1',
          numero_movimiento: 'MOV000001',
          tipo_movimiento_id: 't1',
        },
        INV_MOTOR_FIELD_KEYS.numeroMovimiento,
      );
      expect(result).toEqual({ empresa_id: 'e1', tipo_movimiento_id: 't1' });
      expect('numero_movimiento' in result).toBe(false);
    });

    it('elimina numero_inventario', () => {
      const result = stripInvAutoRequiredField(
        { numero_inventario: 'IF00001', almacen_id: 'a1' },
        INV_MOTOR_FIELD_KEYS.numeroInventario,
      );
      expect(result).toEqual({ almacen_id: 'a1' });
    });

    it('es idempotente si la clave no existe', () => {
      const base = { empresa_id: 'e1' };
      expect(
        stripInvAutoRequiredField(base, INV_MOTOR_FIELD_KEYS.numeroMovimiento),
      ).toEqual(base);
    });
  });

  describe('stripInvMotorFieldFromUpdate (BR-IMM)', () => {
    it('omite codigo en UPDATE', () => {
      const result = stripInvMotorFieldFromUpdate(
        { codigo: 'CAT001', nombre: 'Nueva' },
        INV_MOTOR_FIELD_KEYS.codigo,
      );
      expect(result).toEqual({ nombre: 'Nueva' });
    });

    it('omite codigo_sku sin tocar otros códigos de producto', () => {
      const result = stripInvMotorFieldFromUpdate(
        {
          codigo_sku: 'P00001',
          codigo_barra: '775',
          codigo_interno: 'INT',
          nombre: 'Prod',
        },
        INV_MOTOR_FIELD_KEYS.codigoSku,
      );
      expect(result).toEqual({
        codigo_barra: '775',
        codigo_interno: 'INT',
        nombre: 'Prod',
      });
    });

    it('toInvUpdatePayloadWithoutMotor tipa Omit', () => {
      const result = toInvUpdatePayloadWithoutMotor(
        { codigo: 'X', nombre: 'Y' },
        'codigo',
      );
      expect(result).toEqual({ nombre: 'Y' });
    });
  });
});
