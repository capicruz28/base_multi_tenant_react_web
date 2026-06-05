/**
 * Asegura empresa_id en body create/update company-scoped = empresa activa JWT.
 */
export function assertBodyEmpresaMatchesSession<T extends { empresa_id: string }>(
  payload: T,
  scopeEmpresaId: string | null,
): T {
  if (!scopeEmpresaId) {
    throw new Error('No hay empresa activa en sesión');
  }
  return { ...payload, empresa_id: scopeEmpresaId };
}
