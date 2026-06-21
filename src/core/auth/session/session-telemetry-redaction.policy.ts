/**
 * Redaction Policy — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-03).
 * RED-01…RED-06 — sanitización recursiva obligatoria pre-sink.
 */

export const SESSION_TELEMETRY_ACCESS_TOKEN_PREFIX_MAX = 28;
export const SESSION_TELEMETRY_HTTP_DETAIL_MAX = 512;

const REDACTED = '(redacted)';

const FORBIDDEN_KEYS = new Set([
  'accessToken',
  'access_token',
  'refresh_token',
  'refreshToken',
  'password',
  'selection_token',
  'authorization',
  'Authorization',
  'set-cookie',
  'Set-Cookie',
  'cookie',
  'cookies',
  'document.cookie',
]);

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeString(value: string, keyHint?: string): string {
  const normalizedKey = keyHint?.toLowerCase() ?? '';

  if (FORBIDDEN_KEYS.has(keyHint ?? '') || normalizedKey.includes('password')) {
    return REDACTED;
  }

  if (normalizedKey === 'accesstokenprefix' || keyHint === 'accessTokenPrefix') {
    return value.slice(0, SESSION_TELEMETRY_ACCESS_TOKEN_PREFIX_MAX);
  }

  let sanitized = value.replace(JWT_PATTERN, REDACTED);

  if (sanitized.length > SESSION_TELEMETRY_HTTP_DETAIL_MAX) {
    sanitized = `${sanitized.slice(0, SESSION_TELEMETRY_HTTP_DETAIL_MAX)}…`;
  }

  return sanitized;
}

function sanitizeValue(value: unknown, keyHint?: string): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value, keyHint);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (isPlainObject(value)) {
    return sanitizeRecord(value);
  }

  return REDACTED;
}

/** Redacción recursiva de records arbitrarios (legacy diag → telemetry). */
export function sanitizeRecord(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key)) {
      if (key === 'accessTokenPrefix') {
        output[key] =
          typeof value === 'string'
            ? value.slice(0, SESSION_TELEMETRY_ACCESS_TOKEN_PREFIX_MAX)
            : REDACTED;
      } else {
        output[key] = REDACTED;
      }
      continue;
    }

    output[key] = sanitizeValue(value, key);
  }

  return output;
}

/** Prefix seguro para access token — RED-01. */
export function toAccessTokenPrefix(token: string | null | undefined): string | null {
  if (!token || token.trim().length === 0) {
    return null;
  }
  return token.slice(0, SESSION_TELEMETRY_ACCESS_TOKEN_PREFIX_MAX);
}

/** Aplica redacción al envelope completo antes de sink — RED-06. */
export function applySessionTelemetryRedaction(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeRecord(payload);
}
