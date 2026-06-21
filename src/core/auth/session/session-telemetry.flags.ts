/**
 * Feature flags — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-01).
 */

export const DEFAULT_SESSION_TELEMETRY_V8_ENABLED = true;
export const DEFAULT_SESSION_TELEMETRY_DEV_V8_ENABLED = true;
export const DEFAULT_SESSION_TELEMETRY_REFRESH_V8_ENABLED = true;
export const DEFAULT_SESSION_TELEMETRY_TERMINATION_V8_ENABLED = true;
export const DEFAULT_SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED = true;

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

export function parseSessionTelemetryV8Enabled(envValue: string | undefined): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_TELEMETRY_V8_ENABLED);
}

export function parseSessionTelemetryDevV8Enabled(envValue: string | undefined): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_TELEMETRY_DEV_V8_ENABLED);
}

export function parseSessionTelemetryRefreshV8Enabled(envValue: string | undefined): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_TELEMETRY_REFRESH_V8_ENABLED);
}

export function parseSessionTelemetryTerminationV8Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_TELEMETRY_TERMINATION_V8_ENABLED);
}

export function parseSessionTelemetryAuthSyncV8Enabled(envValue: string | undefined): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED);
}

export const SESSION_TELEMETRY_V8_ENABLED = parseSessionTelemetryV8Enabled(
  import.meta.env.VITE_SESSION_TELEMETRY_V8_ENABLED,
);

export const SESSION_TELEMETRY_DEV_V8_ENABLED = parseSessionTelemetryDevV8Enabled(
  import.meta.env.VITE_SESSION_TELEMETRY_DEV_V8_ENABLED,
);

export const SESSION_TELEMETRY_REFRESH_V8_ENABLED = parseSessionTelemetryRefreshV8Enabled(
  import.meta.env.VITE_SESSION_TELEMETRY_REFRESH_V8_ENABLED,
);

export const SESSION_TELEMETRY_TERMINATION_V8_ENABLED =
  parseSessionTelemetryTerminationV8Enabled(
    import.meta.env.VITE_SESSION_TELEMETRY_TERMINATION_V8_ENABLED,
  );

export const SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED = parseSessionTelemetryAuthSyncV8Enabled(
  import.meta.env.VITE_SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED,
);

export interface SessionTelemetryFlagsSnapshot {
  readonly masterEnabled: boolean;
  readonly devSinkEnabled: boolean;
  readonly refreshEnabled: boolean;
  readonly terminationEnabled: boolean;
  readonly authSyncEnabled: boolean;
}

export function getSessionTelemetryFlagsSnapshot(
  overrides?: Partial<SessionTelemetryFlagsSnapshot>,
): SessionTelemetryFlagsSnapshot {
  return {
    masterEnabled: overrides?.masterEnabled ?? SESSION_TELEMETRY_V8_ENABLED,
    devSinkEnabled: overrides?.devSinkEnabled ?? SESSION_TELEMETRY_DEV_V8_ENABLED,
    refreshEnabled: overrides?.refreshEnabled ?? SESSION_TELEMETRY_REFRESH_V8_ENABLED,
    terminationEnabled:
      overrides?.terminationEnabled ?? SESSION_TELEMETRY_TERMINATION_V8_ENABLED,
    authSyncEnabled: overrides?.authSyncEnabled ?? SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED,
  };
}

/** Master ON — telemetría activa (emitter); legacy logs deben delegar aquí. */
export function isSessionTelemetryEffective(
  flags: SessionTelemetryFlagsSnapshot = getSessionTelemetryFlagsSnapshot(),
): boolean {
  return flags.masterEnabled;
}

/** Sink consola DEV — master + sub DEV + import.meta.env.DEV. */
export function isSessionTelemetryDevSinkActive(
  flags: SessionTelemetryFlagsSnapshot = getSessionTelemetryFlagsSnapshot(),
): boolean {
  return flags.masterEnabled && flags.devSinkEnabled && import.meta.env.DEV;
}

export function isSessionTelemetryRefreshActive(
  flags: SessionTelemetryFlagsSnapshot = getSessionTelemetryFlagsSnapshot(),
): boolean {
  return flags.masterEnabled && flags.refreshEnabled;
}

export function isSessionTelemetryTerminationActive(
  flags: SessionTelemetryFlagsSnapshot = getSessionTelemetryFlagsSnapshot(),
): boolean {
  return flags.masterEnabled && flags.terminationEnabled;
}

export function isSessionTelemetryAuthSyncActive(
  flags: SessionTelemetryFlagsSnapshot = getSessionTelemetryFlagsSnapshot(),
): boolean {
  return flags.masterEnabled && flags.authSyncEnabled;
}
