/**
 * IAM-FE-PHASE-08 IMPL-13 — Regresión V8.x + manifesto suites Fase 8.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { composeTerminationEventEmitters } from '@/core/auth/session/session-telemetry-auth-wiring';
import { getSessionTelemetryFlagsSnapshot } from '@/core/auth/session/session-telemetry.flags';

const ROOT = process.cwd();

export const PHASE_08_REGRESSION_SUITE_MANIFEST = {
  phase08Flags: 'src/core/auth/session/__tests__/session-telemetry.flags.test.ts',
  phase08Redaction: 'src/core/auth/session/__tests__/session-telemetry-redaction.policy.test.ts',
  phase08Events: 'src/core/auth/session/__tests__/session-telemetry-events.policy.test.ts',
  phase08Emitter: 'src/core/auth/session/__tests__/session-telemetry.emitter.test.ts',
  phase08Regression: 'src/shared/context/__tests__/auth-phase-08-regression.test.ts',
  phase07Regression: 'src/shared/context/__tests__/auth-phase-07-regression.test.ts',
  phase06Regression: 'src/shared/context/__tests__/auth-phase-06-regression.test.ts',
  phase05Regression: 'src/shared/context/__tests__/auth-phase-05-regression.test.ts',
  phase04Regression: 'src/shared/context/__tests__/auth-phase-04-regression.test.ts',
  phase03Regression: 'src/shared/context/__tests__/auth-phase-03-regression.test.ts',
} as const;

function readSource(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('IAM-FE-PHASE-08 regression (IMPL-13/14)', () => {
  it('IMPL-08/09 — AuthContext wiring F8 telemetry + composeTerminationEventEmitters', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('composeTerminationEventEmitters');
    expect(source).toContain('createSessionTelemetryTerminationEmitter');
    expect(source).toContain('emitSessionRefreshOutcomeTelemetry');
    expect(source).toContain('SESSION_TELEMETRY_V8_ENABLED');
    expect(source).not.toMatch(/executeRefreshWithResilience\s*\([\s\S]*?\/\/ F8/);
  });

  it('IMPL-10 — auth-debug delega a telemetría cuando master ON', () => {
    const source = readSource('src/core/auth/utils/auth-debug.ts');
    expect(source).toContain('isSessionTelemetryEffective');
    expect(source).toContain('emitSessionDiagContext');
  });

  it('IMPL-10 — post-login-diag delega a NAV_GATE telemetría', () => {
    const source = readSource('src/core/auth/utils/post-login-diag-log.ts');
    expect(source).toContain('emitNavGateDiag');
    expect(source).toContain('isSessionTelemetryEffective');
  });

  it('IMPL-11 — SessionTelemetryAuthSync binders montados', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('SessionTelemetryAuthSyncEmittedBinder');
    expect(source).toContain('SessionTelemetryAuthSyncBinder');
  });

  it('P1-03 — composeTerminationEventEmitters compone emitters sin mutar payload', () => {
    const calls: string[] = [];
    const composed = composeTerminationEventEmitters(
      () => {
        calls.push('a');
      },
      () => {
        calls.push('b');
      },
    );
    composed({
      reason: 'MANUAL_LOGOUT',
      profile: {
        reason: 'MANUAL_LOGOUT',
        toastMessage: null,
        severity: 'info',
        redirectPath: '/login',
      },
      isSecurityTermination: false,
    });
    expect(calls).toEqual(['a', 'b']);
  });

  it('cuerpos congelados F1–F7 — session-auth-sync-emit sin F8', () => {
    const source = readSource('src/core/auth/session/session-auth-sync-emit.ts');
    expect(source).not.toContain('SESSION_TELEMETRY');
    expect(source).not.toContain('session-telemetry');
  });

  it('F7 congelado — session-ux modules sin F8', () => {
    const source = readSource('src/core/auth/session/session-ux-presenter.ts');
    expect(source).not.toContain('session-telemetry');
  });

  it('manifesto — suites Phase 08 definidas', () => {
    expect(PHASE_08_REGRESSION_SUITE_MANIFEST.phase08Flags).toContain('session-telemetry.flags');
    expect(PHASE_08_REGRESSION_SUITE_MANIFEST.phase07Regression).toContain('auth-phase-07-regression');
  });

  it('flags F8 ortogonales a F7', () => {
    const f8 = getSessionTelemetryFlagsSnapshot();
    expect(f8.masterEnabled).toBeDefined();
    expect(readSource('src/core/auth/session/session-ux.flags.ts')).not.toContain('TELEMETRY_V8');
  });
});
