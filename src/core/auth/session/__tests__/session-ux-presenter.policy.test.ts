/**
 * IAM-FE-PHASE-07 IMPL-03 — session-ux-presenter.policy tests.
 */
import { describe, expect, it } from 'vitest';

import { resolveTerminationUx } from '@/core/auth/session/session-termination-ux';
import {
  resolveSessionUxPresentation,
  resolveSessionUxPresentationChannel,
  shouldUseLegacyTerminationToast,
} from '@/core/auth/session/session-ux-presenter.policy';
import { getSessionUxFlagsSnapshot } from '@/core/auth/session/session-ux.flags';

describe('session-ux-presenter.policy (IMPL-03)', () => {
  const flagsOn = getSessionUxFlagsSnapshot({
    masterEnabled: true,
    modalEnabled: true,
    limitFeedbackEnabled: true,
  });

  const flagsOff = getSessionUxFlagsSnapshot({
    masterEnabled: false,
    modalEnabled: false,
  });

  it('V7.1 — SESSION_EXPIRED elegible modal', () => {
    expect(resolveSessionUxPresentationChannel('SESSION_EXPIRED', flagsOn)).toBe('MODAL');
  });

  it('D-P1-03 — REFRESH_REVOKED (no REMOTE_REVOKE) elegible modal', () => {
    expect(resolveSessionUxPresentationChannel('REFRESH_REVOKED', flagsOn)).toBe('MODAL');
  });

  it('UX-03 — IMPERSONATION_END toast-only', () => {
    expect(resolveSessionUxPresentationChannel('IMPERSONATION_END', flagsOn)).toBe('TOAST_ONLY');
  });

  it('MANUAL_LOGOUT sin modal', () => {
    expect(resolveSessionUxPresentationChannel('MANUAL_LOGOUT', flagsOn)).toBe('TOAST_ONLY');
  });

  it('SILENT_CLEANUP silencioso', () => {
    expect(resolveSessionUxPresentationChannel('SILENT_CLEANUP', flagsOn)).toBe('SILENT');
  });

  it('UX-02 rollback L2 — modal OFF → toast legacy', () => {
    expect(resolveSessionUxPresentationChannel('SESSION_EXPIRED', flagsOff)).toBe('TOAST_ONLY');
  });

  it('UX-01 — MODAL deferRedirect true', () => {
    const profile = resolveTerminationUx('SESSION_EXPIRED');
    const decision = resolveSessionUxPresentation(
      { reason: 'SESSION_EXPIRED', profile },
      flagsOn,
    );
    expect(decision.channel).toBe('MODAL');
    expect(decision.deferRedirect).toBe(true);
    expect(shouldUseLegacyTerminationToast(decision)).toBe(false);
  });

  it('D-P2-05 — encola modal si erpDialogOpen', () => {
    const profile = resolveTerminationUx('IDLE_TIMEOUT');
    const decision = resolveSessionUxPresentation(
      { reason: 'IDLE_TIMEOUT', profile, erpDialogOpen: true },
      flagsOn,
    );
    expect(decision.queueModal).toBe(true);
  });
});
