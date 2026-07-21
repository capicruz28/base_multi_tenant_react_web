import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';

import type { ProductoCreate, ProductoUpdate } from '../types/inv.types';
import {
  INV_MOTOR_FIELD_KEYS,
  normalizeInvAutoDefaultCreateField,
  stripInvMotorFieldFromUpdate,
} from './inv-codigo-serialize.utils';

/**
 * Base CREATE Producto — omite solo `codigo_sku` (Motor).
 * Conserva `codigo_barra`, `codigo_interno`, `codigo_fabricante`, `codigo_sunat`.
 */
export function buildProductoCreateBasePayload(
  form: ProductoCreate,
  scopeEmpresaId: string,
): ProductoCreate {
  const { codigo_sku: _omitSku, ...rest } = form;
  const scoped = assertBodyEmpresaMatchesSession({ ...rest }, scopeEmpresaId);
  return normalizeInvAutoDefaultCreateField(
    scoped as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigoSku,
  ) as ProductoCreate;
}

/**
 * UPDATE Producto — BR-IMM únicamente sobre `codigo_sku`.
 * No elimina códigos de negocio (barra / interno / fabricante / sunat).
 */
export function buildProductoUpdatePayload(form: ProductoUpdate): ProductoUpdate {
  return stripInvMotorFieldFromUpdate(
    { ...form } as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigoSku,
  ) as ProductoUpdate;
}
