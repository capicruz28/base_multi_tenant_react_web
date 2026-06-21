/**
 * IAM-FE-PHASE-04-IMPL-14 — Regresión V4.x + manifesto suites Fase 4.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { createAuthSyncTerminationEmitter } from '@/core/auth/session/session-auth-sync-emit';
import { sessionAuthSyncChannel } from '@/core/auth/session/session-auth-sync-channel';
import { AUTH_SYNC_CHANNEL_NAME } from '@/core/auth/session/session-auth-sync-channel';
import {
  buildSessionProbeContext,
  buildSessionRemoteProbePolicy,
  evaluateSessionRemoteProbe,
} from '@/core/auth/session/useSessionRemoteProbe';
import { markAuthSyncTerminationApplied } from '@/core/auth/session/session-auth-sync-apply';
import { getTerminateSessionDeps } from '@/shared/context/AuthContext';

const ROOT = process.cwd();

export const PHASE_04_REGRESSION_SUITE_MANIFEST = {
  phase04Flags: 'src/core/auth/session/__tests__/session-auth-sync.flags.test.ts',
  phase04Emit: 'src/core/auth/session/__tests__/session-auth-sync-emit.test.ts',
  phase04Apply: 'src/core/auth/session/__tests__/session-auth-sync-apply.test.ts',
  phase04Selection: 'src/core/auth/session/__tests__/session-auth-sync-selection.test.ts',
  phase04Regression: 'src/shared/context/__tests__/auth-phase-04-regression.test.ts',
  phase03Regression: 'src/shared/context/__tests__/auth-phase-03-regression.test.ts',
} as const;

function readSource(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readUseAuthProviderSource(): string {
  return readSource('src/core/auth/provider/useAuthProvider.ts');
}

function readPublicActionsSource(): string {
  return readSource('src/core/auth/provider/auth-provider-public-actions.ts');
}

function readTelemetryBindersSource(): string {
  return readSource('src/core/auth/provider/auth-provider-telemetry-ux.compositor.tsx');
}

function readAuthSyncWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-auth-sync.compositor.ts');
}

function readTerminationWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-termination.compositor.ts');
}

describe('IAM-FE-PHASE-04 regression (IMPL-14)', () => {
  it('V4.1 — canal auth-sync separado de tenant-sync', () => {
    expect(AUTH_SYNC_CHANNEL_NAME).toBe('auth-sync');
    expect(AUTH_SYNC_CHANNEL_NAME).not.toBe('tenant-sync');
  });

  it('V4.2 — getTerminateSessionDeps incluye emitTerminationEvent Fase 4', () => {
    const emitTerminationEvent = vi.fn();
    const deps = getTerminateSessionDeps({
      isTerminatingRef: { current: false },
      processQueue: vi.fn(),
      clearLocalAuthState: vi.fn(),
      getHadAuthenticatedUser: () => true,
      callLogoutEndpoint: vi.fn(),
      clearQueryCache: vi.fn(),
      showTerminationToast: vi.fn(),
      redirectToLogin: vi.fn(),
      emitTerminationEvent,
    });

    expect(deps.emitTerminationEvent).toBe(emitTerminationEvent);
  });

  it('V4.2 — createAuthSyncTerminationEmitter emite SESSION_TERMINATED', () => {
    const postSpy = vi.spyOn(sessionAuthSyncChannel, 'post').mockReturnValue(true);
    const emit = createAuthSyncTerminationEmitter();

    emit({
      reason: 'MANUAL_LOGOUT',
      profile: {
        reason: 'MANUAL_LOGOUT',
        toastMessage: 'Sesión cerrada.',
        severity: 'info',
        redirectPath: '/login',
      },
      isSecurityTermination: false,
    });

    expect(postSpy).toHaveBeenCalled();
    expect(postSpy.mock.calls[0]?.[0]?.type).toBe('SESSION_TERMINATED');
  });

  it('V4.3 — AuthContext wiring incluye AuthSyncListenerBinder', () => {
    const assembly = readUseAuthProviderSource();
    const telemetry = readTelemetryBindersSource();
    const termination = readTerminationWiringSource();
    expect(telemetry).toContain('AuthSyncListenerBinder');
    expect(assembly).toContain('emitAuthSyncSessionToken');
    expect(assembly).toContain('useAuthProviderTerminationRuntime');
    expect(termination).toContain('createAuthSyncTerminationEmitter');
  });

  it('V4.4 — probe skip tras terminación BC reciente', async () => {
    markAuthSyncTerminationApplied(Date.now() - 1_000);
    const runProbe = vi.fn();

    const ran = await evaluateSessionRemoteProbe({
      context: buildSessionProbeContext(
        {
          isAuthenticated: true,
          isImpersonationActive: false,
          isSelectionPending: false,
          isTerminating: false,
        },
        null,
      ),
      policy: buildSessionRemoteProbePolicy(true),
      nowMs: Date.now(),
      runSessionValidityProbe: runProbe,
      lastProbeAtMsRef: { current: null },
    });

    expect(ran).toBe(false);
    expect(runProbe).not.toHaveBeenCalled();
  });

  it('V4.5 — Login emite selection sync', () => {
    const source = readSource('src/features/auth/pages/Login.tsx');
    expect(source).toContain('emitSelectionSyncFromResponse');
  });

  it('manifesto incluye suites Phase-04', () => {
    for (const suitePath of Object.values(PHASE_04_REGRESSION_SUITE_MANIFEST)) {
      expect(() => readSource(suitePath)).not.toThrow();
    }
  });
});
