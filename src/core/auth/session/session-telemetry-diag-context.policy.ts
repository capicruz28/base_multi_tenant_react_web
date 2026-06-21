/**
 * SESSION_DIAG_CONTEXT — whitelist estricta + sanitización previa al emit (PATCH-01 A-P1-02/03).
 * RED-05: sin username, email, nombres ni identificadores personales.
 */

import { applySessionTelemetryRedaction, sanitizeRecord } from './session-telemetry-redaction.policy';

/** Campos permitidos en SESSION_DIAG_CONTEXT (allowlist cerrada). */
const SESSION_DIAG_CONTEXT_ALLOWLIST = new Set([
  'attemptCount',
  'canInitializeFullSession',
  'detail',
  'empresa_selection',
  'empresa_selection_pending',
  'hasAccessToken',
  'hasCredentials',
  'hasPendingSelection',
  'hasPlatformParentSession',
  'hasUserData',
  'has_platform_parent_session',
  'headerKeys',
  'httpStatus',
  'hydrateSkipped',
  'is_impersonation',
  'meReceived',
  'message',
  'moduleCount',
  'operation',
  'outcome',
  'pathname',
  'path',
  'rawPendingClaim',
  'refreshFailed',
  'refreshOk',
  'requestUrl',
  'source',
  'status',
  'statusCode',
  'subdomain',
  'token_replaced',
  'token_source',
  'url',
  'user_type',
]);

/** Campos prohibidos explícitamente — PII / tokens (RED-05, A-P1-01). */
const SESSION_DIAG_CONTEXT_DENIED_KEYS = new Set([
  'accessToken',
  'access_token',
  'accessTokenPrefix',
  'email',
  'nombre',
  'nombre_usuario',
  'new_token_prefix',
  'password',
  'previous_token_prefix',
  'refresh_token',
  'selection_token',
  'tokenPrefix',
  'token_prefix',
  'usuario',
  'usuario_id',
  'username',
]);

function isAllowlistedDiagContextKey(key: string): boolean {
  if (SESSION_DIAG_CONTEXT_DENIED_KEYS.has(key)) {
    return false;
  }
  return SESSION_DIAG_CONTEXT_ALLOWLIST.has(key);
}

/** Whitelist estricta — descarta cualquier campo no permitido. */
export function pickAllowlistedSessionDiagContextFields(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!isAllowlistedDiagContextKey(key)) {
      continue;
    }
    output[key] = value;
  }

  return output;
}

/**
 * Prepara fields para SESSION_DIAG_CONTEXT: whitelist → sanitizeRecord → redaction envelope.
 * PATCH-01 A-P1-03 — no confiar solo en redaction del emitter.
 */
export function prepareSessionDiagContextFields(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const allowlisted = pickAllowlistedSessionDiagContextFields(input);
  const sanitized = sanitizeRecord(allowlisted);
  return applySessionTelemetryRedaction(sanitized);
}
