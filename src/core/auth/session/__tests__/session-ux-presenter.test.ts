/**
 * IAM-FE-PHASE-07 IMPL-06/12 — session-ux-presenter orchestrator tests.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { resolveTerminationUx } from '@/core/auth/session/session-termination-ux';
import {
  acknowledgeSessionUxModal,
  executeSessionUxPresentation,
  executeSessionUxRedirect,
} from '@/core/auth/session/session-ux-presenter';
import {
  getLastSessionUxDeferRedirect,
  resetSessionUxPresenterRuntime,
} from '@/core/auth/session/session-ux-presenter.runtime';
import { getSessionUxFlagsSnapshot } from '@/core/auth/session/session-ux.flags';
import {
  createSessionUxTerminationWiring,
  resolveSessionUxBackendDetail,
} from '@/core/auth/session/session-ux-auth-wiring';
import { resolveSessionLimitRedirectPath } from '@/core/auth/session/session-limit-ux.policy';

describe('session-ux-presenter (IMPL-06)', () => {
  beforeEach(() => {
    resetSessionUxPresenterRuntime();
  });

  it('D-P1-01 — MODAL defer redirect hasta ack', () => {
    const legacyRedirect = vi.fn();
    const profile = resolveTerminationUx('SESSION_EXPIRED');
    const flags = getSessionUxFlagsSnapshot({
      masterEnabled: true,
      modalEnabled: true,
    });

    const result = executeSessionUxPresentation(
      { profile },
      {
        flags,
        legacyShowToast: vi.fn(),
      },
    );

    expect(result.deferRedirect).toBe(true);
    executeSessionUxRedirect('/login?session=expired', legacyRedirect);
    expect(legacyRedirect).not.toHaveBeenCalled();
    expect(getLastSessionUxDeferRedirect()).toBe(true);

    acknowledgeSessionUxModal(legacyRedirect);
    expect(legacyRedirect).toHaveBeenCalledWith('/login?session=expired');
  });

  it('UX-03 — IMPERSONATION_END usa toast legacy sin defer', () => {
    const legacyShowToast = vi.fn();
    const legacyRedirect = vi.fn();
    const profile = resolveTerminationUx('IMPERSONATION_END');
    const flags = getSessionUxFlagsSnapshot({
      masterEnabled: true,
      modalEnabled: true,
    });

    executeSessionUxPresentation(
      { profile },
      { flags, legacyShowToast },
    );
    executeSessionUxRedirect('/login', legacyRedirect);

    expect(legacyShowToast).toHaveBeenCalled();
    expect(legacyRedirect).toHaveBeenCalledWith('/login');
  });

  it('PATCH-01 A-P1-01 — session limit desde profile.toastMessage en wiring terminate', () => {
    const legacyShowToast = vi.fn();
    const legacyRedirect = vi.fn();
    const wiring = createSessionUxTerminationWiring({
      legacyShowToast,
      legacyRedirect,
      flags: getSessionUxFlagsSnapshot({
        masterEnabled: true,
        modalEnabled: true,
        limitFeedbackEnabled: true,
      }),
    });

    const profile = resolveTerminationUx('SESSION_EXPIRED', {
      backendDetail: 'session_limit exceeded for tenant',
    });

    expect(
      resolveSessionUxBackendDetail(profile),
    ).toBe('session_limit exceeded for tenant');

    wiring.showTerminationToast(profile);
    wiring.redirectToLogin(profile.redirectPath);

    acknowledgeSessionUxModal(legacyRedirect);
    expect(legacyRedirect).toHaveBeenCalledWith(resolveSessionLimitRedirectPath());
    expect(legacyShowToast).not.toHaveBeenCalled();
  });

  it('PATCH-01 A-P1-01 — fallback expired sin evidencia session limit', () => {
    const legacyRedirect = vi.fn();
    const wiring = createSessionUxTerminationWiring({
      legacyShowToast: vi.fn(),
      legacyRedirect,
      flags: getSessionUxFlagsSnapshot({
        masterEnabled: true,
        modalEnabled: true,
        limitFeedbackEnabled: true,
      }),
    });

    const profile = resolveTerminationUx('SESSION_EXPIRED');

    wiring.showTerminationToast(profile);
    wiring.redirectToLogin(profile.redirectPath);

    acknowledgeSessionUxModal(legacyRedirect);
    expect(legacyRedirect).toHaveBeenCalledWith('/login?session=expired');
  });

  it('createSessionUxTerminationWiring — rollback L1 pasa legacy', () => {
    const legacyShowToast = vi.fn();
    const legacyRedirect = vi.fn();
    const wiring = createSessionUxTerminationWiring({
      legacyShowToast,
      legacyRedirect,
      flags: getSessionUxFlagsSnapshot({ masterEnabled: false }),
    });

    const profile = resolveTerminationUx('SESSION_EXPIRED');
    wiring.showTerminationToast(profile);
    wiring.redirectToLogin('/login?session=expired');

    expect(legacyRedirect).toHaveBeenCalledWith('/login?session=expired');
  });
});
