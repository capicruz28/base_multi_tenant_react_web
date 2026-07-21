import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';

import type { UnidadMedidaCreate, UnidadMedidaUpdate } from '../types/inv.types';
import {
  INV_MOTOR_FIELD_KEYS,
  normalizeInvAutoDefaultCreateField,
  stripInvMotorFieldFromUpdate,
} from './inv-codigo-serialize.utils';

/** Base CREATE Unidad de Medida — sin campo Motor. */
export function buildUnidadMedidaCreateBasePayload(
  form: UnidadMedidaCreate,
  scopeEmpresaId: string,
): UnidadMedidaCreate {
  const { codigo: _omitCodigo, ...rest } = form;
  const scoped = assertBodyEmpresaMatchesSession({ ...rest }, scopeEmpresaId);
  return normalizeInvAutoDefaultCreateField(
    scoped as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as UnidadMedidaCreate;
}

/** UPDATE Unidad de Medida — BR-IMM: nunca incluye `codigo`. */
export function buildUnidadMedidaUpdatePayload(form: UnidadMedidaUpdate): UnidadMedidaUpdate {
  return stripInvMotorFieldFromUpdate(
    { ...form } as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as UnidadMedidaUpdate;
}
