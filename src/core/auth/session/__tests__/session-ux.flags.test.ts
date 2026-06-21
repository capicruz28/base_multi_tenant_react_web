/**
 * IAM-FE-PHASE-07 IMPL-01 — session-ux.flags tests.
 */
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_BOOTSTRAP_GATE_V7_ENABLED,
  DEFAULT_SESSION_EXPIRED_MODAL_V7_ENABLED,
  DEFAULT_SESSION_LIMIT_FEEDBACK_V7_ENABLED,
  DEFAULT_SESSION_UX_V7_ENABLED,
  getSessionUxFlagsSnapshot,
  isSessionBootstrapGateActive,
  isSessionUxModalActive,
  parseSessionBootstrapGateV7Enabled,
  parseSessionExpiredModalV7Enabled,
  parseSessionLimitFeedbackV7Enabled,
  parseSessionUxV7Enabled,
} from '@/core/auth/session/session-ux.flags';

describe('session-ux.flags (IMPL-01)', () => {
  it('defaults master + sub-flags ON', () => {
    expect(DEFAULT_SESSION_UX_V7_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_EXPIRED_MODAL_V7_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_LIMIT_FEEDBACK_V7_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_BOOTSTRAP_GATE_V7_ENABLED).toBe(true);
  });

  it('parseBoolean env values', () => {
    expect(parseSessionUxV7Enabled('false')).toBe(false);
    expect(parseSessionUxV7Enabled('true')).toBe(true);
    expect(parseSessionExpiredModalV7Enabled('0')).toBe(false);
    expect(parseSessionLimitFeedbackV7Enabled('no')).toBe(false);
    expect(parseSessionBootstrapGateV7Enabled(undefined)).toBe(true);
  });

  it('L1 rollback — master OFF desactiva modal y gate helpers', () => {
    const flags = getSessionUxFlagsSnapshot({ masterEnabled: false });
    expect(isSessionUxModalActive(flags)).toBe(false);
    expect(isSessionBootstrapGateActive(flags)).toBe(false);
  });

  it('L2/L4 sub-flags ortogonales', () => {
    const flags = getSessionUxFlagsSnapshot({
      masterEnabled: true,
      modalEnabled: false,
      bootstrapGateEnabled: false,
    });
    expect(isSessionUxModalActive(flags)).toBe(false);
    expect(isSessionBootstrapGateActive(flags)).toBe(false);
  });
});
