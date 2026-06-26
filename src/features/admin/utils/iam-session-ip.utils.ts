import type { UserSessionRead } from '@/features/admin/types/session.types';

const PLACEHOLDER = '—';

function normalizeIp(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Última IP conocida de la sesión (`last_seen_ip` en BD).
 * Prioridad: `device.ip_address` → alias raíz `ip_address` (compat legacy).
 */
export function resolveLastSeenIp(
  session: Pick<UserSessionRead, 'device' | 'ip_address'>,
): string | null {
  const fromDevice = normalizeIp(session.device?.ip_address);
  if (fromDevice) {
    return fromDevice;
  }
  return normalizeIp(session.ip_address);
}

/**
 * IP original del login (inmutable, auditoría).
 * No usar como proxy de última actividad ni sustituir `resolveLastSeenIp`.
 */
export function resolveLoginIp(
  session: Pick<UserSessionRead, 'login_ip'>,
): string | null {
  return normalizeIp(session.login_ip);
}

/** Texto display para última IP — nunca expone `login_ip`. */
export function formatLastSeenIp(
  session: Pick<UserSessionRead, 'device' | 'ip_address'>,
): string {
  return resolveLastSeenIp(session) ?? PLACEHOLDER;
}

/** Texto display para IP de login (auditoría). */
export function formatLoginIp(
  session: Pick<UserSessionRead, 'login_ip'>,
): string {
  return resolveLoginIp(session) ?? PLACEHOLDER;
}

function normalizeIpForCompare(value: string | null): string | null {
  if (value == null) {
    return null;
  }
  return value.trim().toLowerCase() || null;
}

/** Indica si login_ip difiere de la última IP conocida (Fase 2). */
export function resolveSessionIpMismatch(
  session: Pick<UserSessionRead, 'login_ip' | 'device' | 'ip_address'>,
): boolean {
  const loginIp = normalizeIpForCompare(resolveLoginIp(session));
  const lastSeenIp = normalizeIpForCompare(resolveLastSeenIp(session));
  if (loginIp == null || lastSeenIp == null) {
    return false;
  }
  return loginIp !== lastSeenIp;
}
