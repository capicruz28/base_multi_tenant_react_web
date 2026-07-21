import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';

import type { CategoriaCreate, CategoriaUpdate } from '../types/inv.types';
import {
  INV_MOTOR_FIELD_KEYS,
  normalizeInvAutoDefaultCreateField,
  stripInvMotorFieldFromUpdate,
} from './inv-codigo-serialize.utils';

/**
 * Base CREATE Categoría — sin campo Motor.
 * El código lo aporta `mutateInvCreateWithCodigo` vía Engine (auto omit / manual trim).
 */
export function buildCategoriaCreateBasePayload(
  form: CategoriaCreate,
  scopeEmpresaId: string,
): CategoriaCreate {
  const { codigo: _omitCodigo, ...rest } = form;
  const scoped = assertBodyEmpresaMatchesSession({ ...rest }, scopeEmpresaId);
  return normalizeInvAutoDefaultCreateField(
    scoped as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as CategoriaCreate;
}

/**
 * UPDATE Categoría — BR-IMM: nunca incluye `codigo`.
 */
export function buildCategoriaUpdatePayload(form: CategoriaUpdate): CategoriaUpdate {
  return stripInvMotorFieldFromUpdate(
    { ...form } as Record<string, unknown>,
    INV_MOTOR_FIELD_KEYS.codigo,
  ) as CategoriaUpdate;
}
