/**
 * Feature flag rollback — Logout & Remote Revocation Fase 3 (IAM-FE-PHASE-03 IMPL-01).
 * §20.1 / §21.1: desactivar vía VITE_SESSION_LOGOUT_V3_ENABLED /
 * VITE_SESSION_REMOTE_PROBE_ENABLED=false + redeploy.
 */

/** Valor por defecto master flag Fase 3 (diseño §20.1). */
export const DEFAULT_SESSION_LOGOUT_V3_ENABLED = true;

/** Valor por defecto sub-flag probe remoto (diseño §20.1). */
export const DEFAULT_SESSION_REMOTE_PROBE_ENABLED = true;

/**
 * Interpreta VITE_SESSION_LOGOUT_V3_ENABLED.
 * Valores falsy explícitos: "false", "0", "no" (case-insensitive).
 */
export function parseSessionLogoutV3Enabled(
  envValue: string | undefined,
): boolean {
  if (envValue === undefined || envValue.trim() === '') {
    return DEFAULT_SESSION_LOGOUT_V3_ENABLED;
  }

  const normalized = envValue.trim().toLowerCase();

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  return DEFAULT_SESSION_LOGOUT_V3_ENABLED;
}

/**
 * Interpreta VITE_SESSION_REMOTE_PROBE_ENABLED.
 * Valores falsy explícitos: "false", "0", "no" (case-insensitive).
 */
export function parseSessionRemoteProbeEnabled(
  envValue: string | undefined,
): boolean {
  if (envValue === undefined || envValue.trim() === '') {
    return DEFAULT_SESSION_REMOTE_PROBE_ENABLED;
  }

  const normalized = envValue.trim().toLowerCase();

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  return DEFAULT_SESSION_REMOTE_PROBE_ENABLED;
}

/**
 * Flag compilado: true = flujo Fase 3 logout all + orquestación; false = sin UI/cuerpo V3.
 * Ortogonal a REFRESH_HYDRATE_ENABLED (Fase 1) y SESSION_TERMINATION_V2_ENABLED (Fase 2).
 */
export const SESSION_LOGOUT_V3_ENABLED = parseSessionLogoutV3Enabled(
  import.meta.env.VITE_SESSION_LOGOUT_V3_ENABLED,
);

/**
 * Flag compilado: true = probe focus/visibility + post-revoke admin; false = detección pasiva.
 * Sub-flag de Fase 3; puede desactivarse independientemente del master flag.
 */
export const SESSION_REMOTE_PROBE_ENABLED = parseSessionRemoteProbeEnabled(
  import.meta.env.VITE_SESSION_REMOTE_PROBE_ENABLED,
);
