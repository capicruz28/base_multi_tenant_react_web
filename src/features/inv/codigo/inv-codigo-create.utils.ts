import { mergeCodigoIntoPayload } from '@/core/codigo';
import type { CodigoFieldControllerResult } from '@/core/codigo';

import { stripInvAutoRequiredField } from './inv-codigo-serialize.utils';

/**
 * Patrón canónico CREATE INV — merge payload + mutate + errores inline código.
 * Espejo de `mutateOrgCreateWithCodigo` para maestros / Producto AUTO_DEFAULT.
 */
export async function mutateInvCreateWithCodigo<T extends Record<string, unknown>, R>(
  codigo: CodigoFieldControllerResult,
  basePayload: T,
  mutateAsync: (payload: T) => Promise<R>,
): Promise<R> {
  codigo.actions.setSaving(true);
  try {
    const payload = mergeCodigoIntoPayload(basePayload, codigo.payloadSlice);
    const result = await mutateAsync(payload);
    codigo.actions.setSuccess();
    return result;
  } catch (error) {
    codigo.actions.applyApiError(error);
    throw error;
  } finally {
    codigo.actions.setSaving(false);
  }
}

/**
 * CREATE documental AUTO_REQUIRED — omite el campo Motor y ejecuta la mutación.
 * No usa CodigoFieldController (no hay entrada manual).
 */
export async function mutateInvCreateAutoRequired<T extends Record<string, unknown>, R>(
  fieldKey: string,
  basePayload: T,
  mutateAsync: (payload: T) => Promise<R>,
): Promise<R> {
  const payload = stripInvAutoRequiredField(basePayload, fieldKey);
  return mutateAsync(payload);
}
