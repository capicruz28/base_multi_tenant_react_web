import {
  INV_MOTOR_FIELD_KEYS,
  stripInvAutoRequiredField,
  stripInvMotorFieldFromUpdate,
} from './inv-codigo-serialize.utils';

/**
 * Movimiento AUTO_REQUIRED CREATE.
 * Serializer único para payload simple y `con-detalle`.
 */
export function serializeMovimientoCreatePayload<T extends object>(payload: T): T {
  return stripInvAutoRequiredField(
    payload as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.numeroMovimiento,
  ) as T;
}

/**
 * Movimiento BR-IMM UPDATE.
 * Serializer único para payload simple y `con-detalle`.
 */
export function serializeMovimientoUpdatePayload<T extends object>(payload: T): T {
  return stripInvMotorFieldFromUpdate(
    payload as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.numeroMovimiento,
  ) as T;
}

/**
 * Inventario físico AUTO_REQUIRED CREATE.
 * Serializer único para payload simple y `con-detalle`.
 */
export function serializeInventarioFisicoCreatePayload<T extends object>(
  payload: T,
): T {
  return stripInvAutoRequiredField(
    payload as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.numeroInventario,
  ) as T;
}

/**
 * Inventario físico BR-IMM UPDATE.
 * Serializer único para payload simple y `con-detalle`.
 */
export function serializeInventarioFisicoUpdatePayload<T extends object>(
  payload: T,
): T {
  return stripInvMotorFieldFromUpdate(
    payload as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.numeroInventario,
  ) as T;
}
