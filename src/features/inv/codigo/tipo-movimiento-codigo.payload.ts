import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';

import type { TipoMovimientoCreate, TipoMovimientoUpdate } from '../types/inv.types';
import {
  INV_MOTOR_FIELD_KEYS,
  normalizeInvAutoDefaultCreateField,
  stripInvMotorFieldFromUpdate,
} from './inv-codigo-serialize.utils';

/** Base CREATE Tipo de Movimiento — sin campo Motor. */
export function buildTipoMovimientoCreateBasePayload(
  form: TipoMovimientoCreate,
  scopeEmpresaId: string,
): TipoMovimientoCreate {
  const { codigo: _omitCodigo, ...rest } = form;
  const scoped = assertBodyEmpresaMatchesSession({ ...rest }, scopeEmpresaId);
  return normalizeInvAutoDefaultCreateField(
    scoped as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as TipoMovimientoCreate;
}

/** UPDATE Tipo de Movimiento — BR-IMM: nunca incluye `codigo`. */
export function buildTipoMovimientoUpdatePayload(form: TipoMovimientoUpdate): TipoMovimientoUpdate {
  return stripInvMotorFieldFromUpdate(
    { ...form } as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as TipoMovimientoUpdate;
}
