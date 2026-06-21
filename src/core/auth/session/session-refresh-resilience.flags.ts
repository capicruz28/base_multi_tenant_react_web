/**
 * Feature flags — Refresh Resilience Fase 5 (IAM-FE-PHASE-05 IMPL-01).
 */

export const DEFAULT_SESSION_REFRESH_RESILIENCE_V5_ENABLED = true;
export const DEFAULT_SESSION_REFRESH_RETRY_500_V5_ENABLED = true;
export const DEFAULT_SESSION_REFRESH_RETRY_429_V5_ENABLED = true;
export const DEFAULT_SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED = true;

function parseBooleanFlag(
  envValue: string | undefined,
  defaultValue: boolean,
): boolean {
  if (envValue === undefined || envValue.trim() === '') {
    return defaultValue;
  }

  const normalized = envValue.trim().toLowerCase();

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  return defaultValue;
}

export function parseSessionRefreshResilienceV5Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_REFRESH_RESILIENCE_V5_ENABLED);
}

export function parseSessionRefreshRetry500V5Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_REFRESH_RETRY_500_V5_ENABLED);
}

export function parseSessionRefreshRetry429V5Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_REFRESH_RETRY_429_V5_ENABLED);
}

export function parseSessionCambiarEmpresaL02V5Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED);
}

export const SESSION_REFRESH_RESILIENCE_V5_ENABLED = parseSessionRefreshResilienceV5Enabled(
  import.meta.env.VITE_SESSION_REFRESH_RESILIENCE_V5_ENABLED,
);

export const SESSION_REFRESH_RETRY_500_V5_ENABLED = parseSessionRefreshRetry500V5Enabled(
  import.meta.env.VITE_SESSION_REFRESH_RETRY_500_V5_ENABLED,
);

export const SESSION_REFRESH_RETRY_429_V5_ENABLED = parseSessionRefreshRetry429V5Enabled(
  import.meta.env.VITE_SESSION_REFRESH_RETRY_429_V5_ENABLED,
);

export const SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED = parseSessionCambiarEmpresaL02V5Enabled(
  import.meta.env.VITE_SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED,
);
