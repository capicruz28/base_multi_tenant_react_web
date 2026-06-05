/**
 * Logs temporales DEV — diagnóstico post-login → /unauthorized.
 * Filtrar consola: POST_LOGIN_DIAG
 * Eliminar tras cerrar investigación runtime.
 */
const TAG = '[POST_LOGIN_DIAG]';

export function logPostLoginDiag(
  component: string,
  event: string,
  payload: Record<string, unknown> = {},
): void {
  if (!import.meta.env.DEV) return;
  console.log(TAG, { component, event, ts: performance.now(), ...payload });
}

export function warnPostLoginDiag(
  component: string,
  event: string,
  payload: Record<string, unknown> = {},
): void {
  if (!import.meta.env.DEV) return;
  console.warn(TAG, { component, event, ts: performance.now(), ...payload });
}
