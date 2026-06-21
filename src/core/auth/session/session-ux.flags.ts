/**
 * Feature flags — Session UX Fase 7 (IAM-FE-PHASE-07 IMPL-01).
 */

export const DEFAULT_SESSION_UX_V7_ENABLED = true;
export const DEFAULT_SESSION_EXPIRED_MODAL_V7_ENABLED = true;
export const DEFAULT_SESSION_LIMIT_FEEDBACK_V7_ENABLED = true;
export const DEFAULT_SESSION_BOOTSTRAP_GATE_V7_ENABLED = true;

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

export function parseSessionUxV7Enabled(envValue: string | undefined): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_UX_V7_ENABLED);
}

export function parseSessionExpiredModalV7Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_EXPIRED_MODAL_V7_ENABLED);
}

export function parseSessionLimitFeedbackV7Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_LIMIT_FEEDBACK_V7_ENABLED);
}

export function parseSessionBootstrapGateV7Enabled(
  envValue: string | undefined,
): boolean {
  return parseBooleanFlag(envValue, DEFAULT_SESSION_BOOTSTRAP_GATE_V7_ENABLED);
}

export const SESSION_UX_V7_ENABLED = parseSessionUxV7Enabled(
  import.meta.env.VITE_SESSION_UX_V7_ENABLED,
);

export const SESSION_EXPIRED_MODAL_V7_ENABLED = parseSessionExpiredModalV7Enabled(
  import.meta.env.VITE_SESSION_EXPIRED_MODAL_V7_ENABLED,
);

export const SESSION_LIMIT_FEEDBACK_V7_ENABLED = parseSessionLimitFeedbackV7Enabled(
  import.meta.env.VITE_SESSION_LIMIT_FEEDBACK_V7_ENABLED,
);

export const SESSION_BOOTSTRAP_GATE_V7_ENABLED = parseSessionBootstrapGateV7Enabled(
  import.meta.env.VITE_SESSION_BOOTSTRAP_GATE_V7_ENABLED,
);

export interface SessionUxFlagsSnapshot {
  readonly masterEnabled: boolean;
  readonly modalEnabled: boolean;
  readonly limitFeedbackEnabled: boolean;
  readonly bootstrapGateEnabled: boolean;
}

export function getSessionUxFlagsSnapshot(
  overrides?: Partial<SessionUxFlagsSnapshot>,
): SessionUxFlagsSnapshot {
  return {
    masterEnabled: overrides?.masterEnabled ?? SESSION_UX_V7_ENABLED,
    modalEnabled: overrides?.modalEnabled ?? SESSION_EXPIRED_MODAL_V7_ENABLED,
    limitFeedbackEnabled:
      overrides?.limitFeedbackEnabled ?? SESSION_LIMIT_FEEDBACK_V7_ENABLED,
    bootstrapGateEnabled:
      overrides?.bootstrapGateEnabled ?? SESSION_BOOTSTRAP_GATE_V7_ENABLED,
  };
}

/** Master ON + sub-flag modal activo. */
export function isSessionUxModalActive(
  flags: SessionUxFlagsSnapshot = getSessionUxFlagsSnapshot(),
): boolean {
  return flags.masterEnabled && flags.modalEnabled;
}

/** Master ON + sub-flag bootstrap gate activo. */
export function isSessionBootstrapGateActive(
  flags: SessionUxFlagsSnapshot = getSessionUxFlagsSnapshot(),
): boolean {
  return flags.masterEnabled && flags.bootstrapGateEnabled;
}
