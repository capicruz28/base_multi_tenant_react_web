/**
 * Feature flags — Cross-Tab Authentication Sync Fase 4 (IAM-FE-PHASE-04 IMPL-01).
 * Rollback vía VITE_SESSION_AUTH_SYNC_V4_ENABLED / VITE_SESSION_AUTH_SYNC_SELECTION_ENABLED.
 */

/** Valor por defecto master flag Fase 4 (diseño §8.1). */
export const DEFAULT_SESSION_AUTH_SYNC_V4_ENABLED = true;

/** Valor por defecto sub-flag selection Schema A (diseño §8.1). */
export const DEFAULT_SESSION_AUTH_SYNC_SELECTION_ENABLED = true;

/**
 * Interpreta VITE_SESSION_AUTH_SYNC_V4_ENABLED.
 * Valores falsy explícitos: "false", "0", "no" (case-insensitive).
 */
export function parseSessionAuthSyncV4Enabled(
  envValue: string | undefined,
): boolean {
  if (envValue === undefined || envValue.trim() === '') {
    return DEFAULT_SESSION_AUTH_SYNC_V4_ENABLED;
  }

  const normalized = envValue.trim().toLowerCase();

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  return DEFAULT_SESSION_AUTH_SYNC_V4_ENABLED;
}

/**
 * Interpreta VITE_SESSION_AUTH_SYNC_SELECTION_ENABLED.
 * Valores falsy explícitos: "false", "0", "no" (case-insensitive).
 */
export function parseSessionAuthSyncSelectionEnabled(
  envValue: string | undefined,
): boolean {
  if (envValue === undefined || envValue.trim() === '') {
    return DEFAULT_SESSION_AUTH_SYNC_SELECTION_ENABLED;
  }

  const normalized = envValue.trim().toLowerCase();

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  return DEFAULT_SESSION_AUTH_SYNC_SELECTION_ENABLED;
}

/**
 * Flag compilado: master Fase 4 — canal auth-sync + apply inbound.
 * Ortogonal a Fases 1–3.
 */
export const SESSION_AUTH_SYNC_V4_ENABLED = parseSessionAuthSyncV4Enabled(
  import.meta.env.VITE_SESSION_AUTH_SYNC_V4_ENABLED,
);

/**
 * Flag compilado: sub-flag GAP-P2-04 — sync selection store Schema A.
 */
export const SESSION_AUTH_SYNC_SELECTION_ENABLED = parseSessionAuthSyncSelectionEnabled(
  import.meta.env.VITE_SESSION_AUTH_SYNC_SELECTION_ENABLED,
);
