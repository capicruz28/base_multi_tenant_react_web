/**
 * Feature flag rollback — Session Termination Fase 2 (IAM-FE-PHASE-02 Paso 9).
 * §21.1 / §21.2: desactivar vía VITE_SESSION_TERMINATION_V2_ENABLED=false + redeploy.
 */

/** Valor por defecto en implementación (diseño §21.1). */
export const DEFAULT_SESSION_TERMINATION_V2_ENABLED = true;

/**
 * Interpreta VITE_SESSION_TERMINATION_V2_ENABLED.
 * Valores falsy explícitos: "false", "0", "no" (case-insensitive).
 */
export function parseSessionTerminationEnabled(
  envValue: string | undefined,
): boolean {
  if (envValue === undefined || envValue.trim() === '') {
    return DEFAULT_SESSION_TERMINATION_V2_ENABLED;
  }

  const normalized = envValue.trim().toLowerCase();

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  return DEFAULT_SESSION_TERMINATION_V2_ENABLED;
}

/**
 * Flag compilado: true = flujo Fase 2 (Pasos 1–9); false = legacy doLogout.
 * Ortogonal a REFRESH_HYDRATE_ENABLED (Fase 1).
 */
export const SESSION_TERMINATION_V2_ENABLED = parseSessionTerminationEnabled(
  import.meta.env.VITE_SESSION_TERMINATION_V2_ENABLED,
);
