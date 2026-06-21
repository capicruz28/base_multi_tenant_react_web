/**
 * Política Session Limit UX — IAM-FE-PHASE-07 IMPL-04 (L7-C).
 * Heurística FE sin modificar OpenAPI ni session-termination-ux.ts F2.
 */

import type { SessionLimitDetectionInput } from './session-ux.types';

/** Copy dedicado session limit (UX-06 override presenter). */
export const SESSION_LIMIT_VICTIM_MESSAGE =
  'Tu sesión se cerró porque se alcanzó el límite de dispositivos activos. Inicia sesión nuevamente.';

export const SESSION_LIMIT_LOGIN_QUERY = 'limit' as const;

const SESSION_LIMIT_PATTERNS = [
  'session_limit',
  'max_active',
  'demasiados dispositivos',
  'session limit',
  'límite de dispositivos',
  'limite de dispositivos',
  'dispositivos activos',
] as const;

function normalizeDetail(detail: string | undefined): string {
  return (detail ?? '').trim().toLowerCase();
}

function matchesSessionLimitPattern(detail: string): boolean {
  return SESSION_LIMIT_PATTERNS.some((pattern) => detail.includes(pattern));
}

/**
 * Detecta session limit desde señales HTTP/detail existentes.
 * D-P1-02: miss heurística → caller usa copy F2 estándar (fallback expired).
 */
export function detectSessionLimitFromSignals(
  input: SessionLimitDetectionInput,
): boolean {
  const detail = normalizeDetail(input.detail);
  if (detail.length > 0 && matchesSessionLimitPattern(detail)) {
    return true;
  }
  return false;
}

export function resolveSessionLimitUxMessage(): string {
  return SESSION_LIMIT_VICTIM_MESSAGE;
}

export function resolveSessionLimitRedirectPath(loginPath = '/login'): string {
  return `${loginPath}?session=${SESSION_LIMIT_LOGIN_QUERY}`;
}

export function resolveSessionLimitBannerSeverity(): 'info' {
  return 'info';
}
