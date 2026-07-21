import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';

import type { AlmacenCreate, AlmacenUpdate } from '../types/inv.types';
import {
  INV_MOTOR_FIELD_KEYS,
  normalizeInvAutoDefaultCreateField,
  stripInvMotorFieldFromUpdate,
} from './inv-codigo-serialize.utils';

/** Base CREATE Almacén — sin campo Motor. */
export function buildAlmacenCreateBasePayload(
  form: AlmacenCreate,
  scopeEmpresaId: string,
): AlmacenCreate {
  const { codigo: _omitCodigo, ...rest } = form;
  const scoped = assertBodyEmpresaMatchesSession({ ...rest }, scopeEmpresaId);
  return normalizeInvAutoDefaultCreateField(
    scoped as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as AlmacenCreate;
}

/** UPDATE Almacén — BR-IMM: nunca incluye `codigo`. */
export function buildAlmacenUpdatePayload(form: AlmacenUpdate): AlmacenUpdate {
  return stripInvMotorFieldFromUpdate(
    { ...form } as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as AlmacenUpdate;
}
