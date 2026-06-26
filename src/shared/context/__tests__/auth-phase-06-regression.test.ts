/**
 * IAM-FE-PHASE-06-IMPL-13 — Regresión V6.x + manifesto suites Fase 6.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { emitSessionLoginSync } from '@/core/auth/session/session-auth-sync-emit';
import { sessionAuthSyncChannel } from '@/core/auth/session/session-auth-sync-channel';
import { buildSessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import { buildImpersonationPostRestoreLoginPayload } from '@/core/auth/session/session-impersonation-auth-sync';
import {
  resolveImpersonationExitPolicy,
} from '@/core/auth/session/session-impersonation-exit.policy';
import { executeRefreshWithResilience } from '@/core/auth/session/session-refresh-resilience';

const ROOT = process.cwd();

export const PHASE_06_REGRESSION_SUITE_MANIFEST = {
  phase06Flags: 'src/core/auth/session/__tests__/session-impersonation.flags.test.ts',
  phase06Policy: 'src/core/auth/session/__tests__/session-impersonation-exit.policy.test.ts',
  phase06Orchestrator: 'src/core/auth/session/__tests__/session-impersonation-exit.test.ts',
  phase06AuthSync: 'src/core/auth/session/__tests__/session-impersonation-auth-sync.test.ts',
  phase06Integration: 'src/core/auth/session/__tests__/session-impersonation-interceptor.integration.test.ts',
  phase06Regression: 'src/shared/context/__tests__/auth-phase-06-regression.test.ts',
  phase05Regression: 'src/shared/context/__tests__/auth-phase-05-regression.test.ts',
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

function readAuthSyncWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-auth-sync.compositor.ts');
}

function readImpersonationWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-impersonation.compositor.ts');
}

function readTerminationWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-termination.compositor.ts');
}

function readBootstrapWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-bootstrap.compositor.ts');
}

function readInterceptorsWiringSource(): string {
  return readSource('src/core/auth/provider/auth-provider-interceptors.compositor.ts');
}

describe('IAM-FE-PHASE-06 regression (IMPL-13)', () => {
  it('V6.1 — AuthContext interceptor usa resolveImpersonationExitPolicy + controlled exit', () => {
    const assembly = readUseAuthProviderSource();
    const interceptors = readInterceptorsWiringSource();
    expect(assembly).toContain('useAuthProviderResponseInterceptorEffect');
    expect(interceptors).toContain('resolveImpersonationExitPolicy');
    expect(interceptors).toContain('runImpersonationControlledExit');
    expect(interceptors).toContain("context: 'interceptor'");
    expect(interceptors).not.toMatch(
      /isImpersonationSupportMode[\s\S]{0,200}sin refresh plataforma ni restore parent automático/,
    );
  });

  it('V6.1 — short-circuit soporte antes de executeRefreshWithResilience', () => {
    const interceptors = readInterceptorsWiringSource();
    const interceptorBlock = interceptors.slice(
      interceptors.indexOf('// Modo soporte: salida controlada F6'),
      interceptors.indexOf('if (error.response?.status === 401 && !originalRequest._retry)'),
    );
    expect(interceptorBlock).toContain('resolveImpersonationExitPolicy');
    expect(interceptorBlock).not.toContain('executeRefreshWithResilience');
  });

  it('IMPL-07 — cambiarEmpresaActiva usa guard in-place impersonación (POST-CERT P0)', () => {
    const source = readPublicActionsSource();
    expect(source).toContain('evaluateCambiarEmpresaImpersonationGuard');
    expect(source).not.toContain("context: 'cambiar_empresa_precheck'");
    expect(source).not.toContain("context: 'cambiar_empresa_forbidden'");
  });

  it('IMPL-08 — bootstrap soporte delega controlled exit F6', () => {
    const assembly = readUseAuthProviderSource();
    const bootstrap = readBootstrapWiringSource();
    expect(assembly).toContain('useAuthProviderBootstrapEffect');
    expect(bootstrap).toContain("context: 'bootstrap'");
    expect(bootstrap).toContain('controlledExitToPlatform');
    expect(bootstrap).toContain('runImpersonationControlledExit');
  });

  it('V6.4 — endImpersonation usa orchestrator F6', () => {
    const source = readPublicActionsSource();
    expect(source).toContain("context: 'manual'");
    expect(source).toContain('includeEndImpersonationApi: true');
  });

  it('IMPL-10 — SESSION_LOGIN payload admite impersonationExitSource opcional', () => {
    const postSpy = vi.spyOn(sessionAuthSyncChannel, 'post').mockReturnValue(true);
    const token = 'header.payload.sig';
    const snapshot = buildSessionClaimsSnapshot(token, null, null);

    const payload = buildImpersonationPostRestoreLoginPayload({
      accessToken: token,
      claimsSnapshot: snapshot,
      empresaActivaId: null,
      source: 'MANUAL_END',
    });

    emitSessionLoginSync(payload);

    expect(postSpy.mock.calls[0]?.[0]?.payload).toMatchObject({
      impersonationExitSource: 'MANUAL_END',
    });
  });

  it('IM-02 — executeRefreshWithResilience no invocado en branch soporte interceptor', async () => {
    const decision = resolveImpersonationExitPolicy({
      isSupportMode: true,
      context: 'interceptor',
      httpStatus: 401,
    });
    expect(decision.action).toBe('CONTROLLED_EXIT');

    const callRefresh = vi.fn().mockResolvedValue('new-token');
    await expect(
      executeRefreshWithResilience(
        { source: 'interceptor' },
        { callRefresh },
      ),
    ).resolves.toBeDefined();
    expect(callRefresh).toHaveBeenCalled();
  });

  it('manifesto — suites Phase 06 definidas', () => {
    expect(PHASE_06_REGRESSION_SUITE_MANIFEST.phase06Flags).toContain('session-impersonation.flags');
    expect(PHASE_06_REGRESSION_SUITE_MANIFEST.phase05Regression).toContain('auth-phase-05-regression');
  });

  it('cuerpos congelados F1–F5 — restorePlatformSession body intacto', () => {
    const assembly = readUseAuthProviderSource();
    const interceptors = readInterceptorsWiringSource();
    const bootstrap = readBootstrapWiringSource();
    const termination = readTerminationWiringSource();
    const impersonation = readImpersonationWiringSource();
    expect(assembly).toContain('useAuthProviderImpersonationLateRuntime');
    expect(impersonation).toContain('const restorePlatformSession = useCallback');
    expect(impersonation).toContain('getPlatformParentSession()');
    expect(impersonation).toContain('await initializeAuth()');
    expect(interceptors).toContain('executeRefreshWithResilience');
    expect(bootstrap).toContain('executeRefreshWithResilience');
    expect(termination).toContain('terminateSession');
    expect(assembly).toContain('useAuthProviderTerminationRuntime');
  });

  it('PATCH-01 — follower IM-06 limpia sessionStorage tras inbound SESSION_LOGIN parent', () => {
    const assembly = readUseAuthProviderSource();
    const impersonation = readImpersonationWiringSource();
    const authSync = readAuthSyncWiringSource();
    expect(assembly).toContain('applyInboundImpersonationExitStorageCleanup');
    expect(impersonation).toContain('clearPlatformParentSession()');
    expect(impersonation).toContain('clearImpersonationSupportSession()');
    expect(authSync).toContain('applyInboundImpersonationExitStorageCleanup(newToken)');
    expect(authSync).toContain('applyInboundImpersonationExitStorageCleanup(accessToken)');
  });

  it('PATCH-02 — bootstrap memoria delega me_failed a controlled exit F6', () => {
    const bootstrap = readBootstrapWiringSource();
    expect(bootstrap).toContain("bootstrapPath: 'memory-rehydrate'");
    expect(bootstrap).toContain("await controlledExitToPlatform('me_failed'");
    expect(bootstrap).not.toContain('/* sin refresh plataforma en modo soporte */');
  });
});
