/**
 * Feature flag rollback — Post-Refresh Session Alignment (IAM-FE-PHASE-01 Paso 8).
 * §8.5 / §11.4: desactivar vía VITE_REFRESH_HYDRATE_ENABLED=false + redeploy.
 */

/** Valor por defecto en implementación (diseño §8.5). */
export const DEFAULT_REFRESH_HYDRATE_ENABLED = true;

/**
 * Interpreta VITE_REFRESH_HYDRATE_ENABLED.
 * Valores falsy explícitos: "false", "0", "no" (case-insensitive).
 */
export function parseRefreshHydrateEnabled(
  envValue: string | undefined,
): boolean {
  if (envValue === undefined || envValue.trim() === '') {
    return DEFAULT_REFRESH_HYDRATE_ENABLED;
  }

  const normalized = envValue.trim().toLowerCase();

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  return DEFAULT_REFRESH_HYDRATE_ENABLED;
}

/**
 * Flag compilado: true = flujo Fase 1 (Pasos 1–7); false = legacy interceptor.
 */
export const REFRESH_HYDRATE_ENABLED = parseRefreshHydrateEnabled(
  import.meta.env.VITE_REFRESH_HYDRATE_ENABLED,
);
