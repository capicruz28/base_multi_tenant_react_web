import { mergeCodigoIntoPayload } from '@/core/codigo';
import type { CodigoFieldControllerResult } from '@/core/codigo';

/**
 * Patrón canónico CREATE ORG — merge payload + mutate + errores inline código.
 * Usado por las 5 páginas certificadoras del FCE.
 */
export async function mutateOrgCreateWithCodigo<T extends Record<string, unknown>, R>(
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
