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

describe('IAM-FE-PHASE-06 regression (IMPL-13)', () => {
  it('V6.1 — AuthContext interceptor usa resolveImpersonationExitPolicy + controlled exit', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('resolveImpersonationExitPolicy');
    expect(source).toContain('runImpersonationControlledExit');
    expect(source).toContain("context: 'interceptor'");
    expect(source).not.toMatch(
      /isImpersonationSupportMode[\s\S]{0,200}sin refresh plataforma ni restore parent automático/,
    );
  });

  it('V6.1 — short-circuit soporte antes de executeRefreshWithResilience', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    const interceptorBlock = source.slice(
      source.indexOf('// Modo soporte: salida controlada F6'),
      source.indexOf('if (error.response?.status === 401 && !originalRequest._retry)'),
    );
    expect(interceptorBlock).toContain('resolveImpersonationExitPolicy');
    expect(interceptorBlock).not.toContain('executeRefreshWithResilience');
  });

  it('IMPL-07 — cambiarEmpresaActiva guard impersonación + handler 403', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain("context: 'cambiar_empresa_precheck'");
    expect(source).toContain("context: 'cambiar_empresa_forbidden'");
  });

  it('IMPL-08 — bootstrap soporte delega controlled exit F6', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain("context: 'bootstrap'");
    expect(source).toContain('controlledExitToPlatform');
    expect(source).toContain('runImpersonationControlledExit');
  });

  it('V6.4 — endImpersonation usa orchestrator F6', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
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
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('const restorePlatformSession = useCallback');
    expect(source).toContain('getPlatformParentSession()');
    expect(source).toContain('await initializeAuth()');
    expect(source).toContain('executeRefreshWithResilience');
    expect(source).toContain('terminateSession');
  });

  it('PATCH-01 — follower IM-06 limpia sessionStorage tras inbound SESSION_LOGIN parent', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('applyInboundImpersonationExitStorageCleanup');
    expect(source).toContain('clearPlatformParentSession()');
    expect(source).toContain('clearImpersonationSupportSession()');
    expect(source).toContain('applyInboundImpersonationExitStorageCleanup(newToken)');
    expect(source).toContain('applyInboundImpersonationExitStorageCleanup(accessToken)');
  });

  it('PATCH-02 — bootstrap memoria delega me_failed a controlled exit F6', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain("bootstrapPath: 'memory-rehydrate'");
    expect(source).toContain("await controlledExitToPlatform('me_failed'");
    expect(source).not.toContain('/* sin refresh plataforma en modo soporte */');
  });
});
