/**
 * Adaptadores de serialización INV Wave 1 — Motor de Códigos.
 * Cumplen AUTO_DEFAULT / AUTO_REQUIRED / BR-IMM sin acoplarse a pantallas.
 *
 * Los consumidores (Fase 1+) deben invocar estos helpers antes de mutate;
 * Fase 0 no cablea ningún formulario.
 */

/** Campos Motor canónicos INV Wave 1 */
export const INV_MOTOR_FIELD_KEYS = {
  codigo: 'codigo',
  codigoSku: 'codigo_sku',
  numeroMovimiento: 'numero_movimiento',
  numeroInventario: 'numero_inventario',
} as const;

export type InvMotorFieldKey =
  (typeof INV_MOTOR_FIELD_KEYS)[keyof typeof INV_MOTOR_FIELD_KEYS];

function omitKey<T extends Record<string, unknown>>(
  payload: T,
  fieldKey: string,
): T {
  if (!(fieldKey in payload)) {
    return payload;
  }
  const next = { ...payload };
  delete next[fieldKey];
  return next;
}

/**
 * AUTO_DEFAULT (CREATE) — string vacío / null / solo whitespace ⇒ omite la clave.
 * Valor no vacío ⇒ trim y conserva.
 */
export function normalizeInvAutoDefaultCreateField<T extends Record<string, unknown>>(
  payload: T,
  fieldKey: string,
): T {
  if (!(fieldKey in payload)) {
    return payload;
  }

  const raw = payload[fieldKey];
  if (raw === null || raw === undefined) {
    return omitKey(payload, fieldKey);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return omitKey(payload, fieldKey);
    }
    return { ...payload, [fieldKey]: trimmed };
  }

  return payload;
}

/**
 * AUTO_REQUIRED (CREATE / UPDATE) — el número nunca viaja en el request.
 * Elimina la clave aunque venga con valor (Backend genera / BR-IMM).
 */
export function stripInvAutoRequiredField<T extends Record<string, unknown>>(
  payload: T,
  fieldKey: string,
): T {
  return omitKey(payload, fieldKey);
}

/**
 * BR-IMM (UPDATE) — el identificador Motor no se envía en PUT.
 * Aplica a `codigo`, `codigo_sku`, `numero_movimiento` y `numero_inventario`.
 */
export function stripInvMotorFieldFromUpdate<T extends Record<string, unknown>>(
  payload: T,
  fieldKey: string,
): T {
  return omitKey(payload, fieldKey);
}

/**
 * Atajo tipado: omite el campo Motor de un payload UPDATE.
 * Equivalente semántico a `Omit<T, K>` en runtime.
 */
export function toInvUpdatePayloadWithoutMotor<
  T extends Record<string, unknown>,
  K extends string,
>(payload: T, fieldKey: K): Omit<T, K> {
  return omitKey(payload, fieldKey) as Omit<T, K>;
}
