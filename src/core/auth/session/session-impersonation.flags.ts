/**
 * Feature flags — Impersonation Exit Fase 6 (IAM-FE-PHASE-06 IMPL-01).
 */

export const DEFAULT_SESSION_IMPERSONATION_V6_ENABLED = true;
export const DEFAULT_SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED = true;
export const DEFAULT_SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED = true;
export const DEFAULT_SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED = true;

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

export function parseSessionImpersonationV6Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_IMPERSONATION_V6_ENABLED);
}

export function parseSessionImpersonationExitInterceptorV6Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(
    envValue,
    DEFAULT_SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED,
  );
}

export function parseSessionImpersonationCambiarEmpresaV6Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(
    envValue,
    DEFAULT_SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED,
  );
}

export function parseSessionImpersonationAuthSyncV6Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(
    envValue,
    DEFAULT_SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED,
  );
}

export const SESSION_IMPERSONATION_V6_ENABLED = parseSessionImpersonationV6Enabled(
  import.meta.env.VITE_SESSION_IMPERSONATION_V6_ENABLED,
);

export const SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED =
  parseSessionImpersonationExitInterceptorV6Enabled(
    import.meta.env.VITE_SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED,
  );

export const SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED =
  parseSessionImpersonationCambiarEmpresaV6Enabled(
    import.meta.env.VITE_SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED,
  );

export const SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED =
  parseSessionImpersonationAuthSyncV6Enabled(
    import.meta.env.VITE_SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED,
  );

export interface SessionImpersonationFlagsSnapshot {
  readonly masterEnabled: boolean;
  readonly interceptorEnabled: boolean;
  readonly cambiarEmpresaEnabled: boolean;
  readonly authSyncEnabled: boolean;
}

export function getSessionImpersonationFlagsSnapshot(
  overrides?: Partial<SessionImpersonationFlagsSnapshot>,
): SessionImpersonationFlagsSnapshot {
  return {
    masterEnabled: overrides?.masterEnabled ?? SESSION_IMPERSONATION_V6_ENABLED,
    interceptorEnabled:
      overrides?.interceptorEnabled ?? SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED,
    cambiarEmpresaEnabled:
      overrides?.cambiarEmpresaEnabled ?? SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED,
    authSyncEnabled:
      overrides?.authSyncEnabled ?? SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED,
  };
}
