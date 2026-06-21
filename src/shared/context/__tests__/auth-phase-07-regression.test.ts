/**
 * IAM-FE-PHASE-07-IMPL-13 — Regresión V7.x + manifesto suites Fase 7.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveSessionUxPresentationChannel } from '@/core/auth/session/session-ux-presenter.policy';
import { getSessionUxFlagsSnapshot } from '@/core/auth/session/session-ux.flags';

const ROOT = process.cwd();

export const PHASE_07_REGRESSION_SUITE_MANIFEST = {
  phase07Flags: 'src/core/auth/session/__tests__/session-ux.flags.test.ts',
  phase07PresenterPolicy: 'src/core/auth/session/__tests__/session-ux-presenter.policy.test.ts',
  phase07LimitPolicy: 'src/core/auth/session/__tests__/session-limit-ux.policy.test.ts',
  phase07GatePolicy: 'src/core/auth/session/__tests__/session-bootstrap-gate.policy.test.ts',
  phase07Presenter: 'src/core/auth/session/__tests__/session-ux-presenter.test.ts',
  phase07LoginLimit: 'src/features/auth/utils/__tests__/login-session-limit.test.ts',
  phase07Regression: 'src/shared/context/__tests__/auth-phase-07-regression.test.ts',
  phase06Regression: 'src/shared/context/__tests__/auth-phase-06-regression.test.ts',
  phase05Regression: 'src/shared/context/__tests__/auth-phase-05-regression.test.ts',
  phase04Regression: 'src/shared/context/__tests__/auth-phase-04-regression.test.ts',
  phase03Regression: 'src/shared/context/__tests__/auth-phase-03-regression.test.ts',
} as const;

function readSource(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readTerminationWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-termination.compositor.ts');
}

function readUseAuthProviderSource(): string {
  return readSource('src/core/auth/provider/useAuthProvider.ts');
}

describe('IAM-FE-PHASE-07 regression (IMPL-13)', () => {
  it('IMPL-09 — AuthContext wiring F7 createSessionUxTerminationWiring', () => {
    const assembly = readUseAuthProviderSource();
    const termination = readTerminationWiringSource();
    expect(assembly).toContain('useAuthProviderTerminationRuntime');
    expect(termination).toContain('createSessionUxTerminationWiring');
    expect(termination).toContain('SESSION_UX_V7_ENABLED');
    expect(termination).not.toMatch(/terminateSession\s*\([\s\S]*?\/\/ F7/);
  });

  it('IMPL-10 — App monta SessionUxBinder + SessionBootstrapGate', () => {
    const source = readSource('src/app/provider.tsx');
    expect(source).toContain('SessionUxBinder');
    expect(source).toContain('SessionBootstrapGate');
  });

  it('IMPL-10 — ProtectedRoute usa isSessionGateReady', () => {
    const source = readSource('src/shared/components/ProtectedRoute.tsx');
    expect(source).toContain('isSessionGateReady');
    expect(source).toContain('isSessionBootstrapGateActive');
  });

  it('V7.1 — modal channel para IDLE_TIMEOUT', () => {
    const flags = getSessionUxFlagsSnapshot({ masterEnabled: true, modalEnabled: true });
    expect(resolveSessionUxPresentationChannel('IDLE_TIMEOUT', flags)).toBe('MODAL');
  });

  it('V6.4 regresión — IMPERSONATION_END bypass modal', () => {
    const flags = getSessionUxFlagsSnapshot({ masterEnabled: true, modalEnabled: true });
    expect(resolveSessionUxPresentationChannel('IMPERSONATION_END', flags)).toBe('TOAST_ONLY');
  });

  it('cuerpos congelados F1–F6 — terminateSession body intacto', () => {
    const source = readSource('src/core/auth/session/session-terminate.ts');
    expect(source).toContain('deps.showTerminationToast(profile)');
    expect(source).toContain('deps.redirectToLogin(profile.redirectPath)');
    expect(source).not.toContain('SESSION_UX_V7');
  });

  it('F6 congelado — impersonation modules sin F7 modal', () => {
    const source = readSource('src/core/auth/session/session-impersonation-exit.ts');
    expect(source).not.toContain('SessionExpiredDialog');
    expect(source).not.toContain('executeSessionUxPresentation');
  });

  it('manifesto — suites Phase 07 definidas', () => {
    expect(PHASE_07_REGRESSION_SUITE_MANIFEST.phase07Flags).toContain('session-ux.flags');
    expect(PHASE_07_REGRESSION_SUITE_MANIFEST.phase06Regression).toContain('auth-phase-06-regression');
  });
});
