/**
 * IAM-FE-PHASE-07 IMPL-04 — session-limit-ux.policy tests (V7.2).
 */
import { describe, expect, it } from 'vitest';

import {
  detectSessionLimitFromSignals,
  resolveSessionLimitRedirectPath,
  resolveSessionLimitUxMessage,
  SESSION_LIMIT_VICTIM_MESSAGE,
} from '@/core/auth/session/session-limit-ux.policy';
import { resolveSessionUxPresentation } from '@/core/auth/session/session-ux-presenter.policy';
import { resolveTerminationUx } from '@/core/auth/session/session-termination-ux';
import { getSessionUxFlagsSnapshot } from '@/core/auth/session/session-ux.flags';

describe('session-limit-ux.policy (IMPL-04)', () => {
  it('V7.2 — detecta patrones session limit', () => {
    expect(
      detectSessionLimitFromSignals({ detail: 'session_limit exceeded for tenant' }),
    ).toBe(true);
    expect(
      detectSessionLimitFromSignals({ detail: 'max_active sessions reached' }),
    ).toBe(true);
    expect(
      detectSessionLimitFromSignals({ detail: 'demasiados dispositivos activos' }),
    ).toBe(true);
  });

  it('D-P1-02 — miss heurística → false (fallback expired en presenter)', () => {
    expect(detectSessionLimitFromSignals({ detail: 'Sesión expirada' })).toBe(false);
  });

  it('override copy limit + redirect ?session=limit', () => {
    const flags = getSessionUxFlagsSnapshot({
      masterEnabled: true,
      modalEnabled: true,
      limitFeedbackEnabled: true,
    });
    const profile = resolveTerminationUx('SESSION_EXPIRED');
    const decision = resolveSessionUxPresentation(
      {
        reason: 'SESSION_EXPIRED',
        profile,
        backendDetail: 'session_limit: max devices',
      },
      flags,
    );
    expect(decision.modalMessage).toBe(SESSION_LIMIT_VICTIM_MESSAGE);
    expect(decision.redirectPath).toBe(resolveSessionLimitRedirectPath());
    expect(decision.loginQueryParam).toBe('limit');
  });

  it('copy dedicado constante', () => {
    expect(resolveSessionLimitUxMessage()).toBe(SESSION_LIMIT_VICTIM_MESSAGE);
  });
});
