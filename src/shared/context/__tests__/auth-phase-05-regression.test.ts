/**
 * IAM-FE-PHASE-05-IMPL-13 — Regresión V5.x + manifesto suites Fase 5.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { emitSessionRefreshedSync } from '@/core/auth/session/session-auth-sync-emit';
import { sessionAuthSyncChannel } from '@/core/auth/session/session-auth-sync-channel';
import { buildSessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import {
  applyL02GuardToRefreshClassifyInput,
  registerCambiarEmpresaL02Guard,
  resetCambiarEmpresaL02GuardForTests,
} from '@/core/auth/session/session-cambiar-empresa-l02';
import { executeRefreshWithResilience } from '@/core/auth/session/session-refresh-resilience';
import { classifySessionTermination } from '@/core/auth/session/session-termination-reason';
import {
  buildBootstrapTerminationClassifyInput,
  buildInterceptorRefreshTerminationClassifyInput,
  buildInterceptorTerminationClassifyInput,
  executeBootstrapRefreshTermination,
  executeInterceptorRefreshTermination,
} from '@/shared/context/AuthContext';

const ROOT = process.cwd();

export const PHASE_05_REGRESSION_SUITE_MANIFEST = {
  phase05Flags: 'src/core/auth/session/__tests__/session-refresh-resilience.flags.test.ts',
  phase05RetryPolicy: 'src/core/auth/session/__tests__/session-refresh-retry.policy.test.ts',
  phase05OutcomeResolver: 'src/core/auth/session/__tests__/session-refresh-outcome.resolver.test.ts',
  phase05L02Guard: 'src/core/auth/session/__tests__/session-cambiar-empresa-l02.test.ts',
  phase05Resilience: 'src/core/auth/session/__tests__/session-refresh-resilience.test.ts',
  phase05Regression: 'src/shared/context/__tests__/auth-phase-05-regression.test.ts',
  phase04Regression: 'src/shared/context/__tests__/auth-phase-04-regression.test.ts',
  phase03Regression: 'src/shared/context/__tests__/auth-phase-03-regression.test.ts',
} as const;

function readSource(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('IAM-FE-PHASE-05 regression (IMPL-13)', () => {
  it('V5.1 — AuthContext usa executeRefreshWithResilience en interceptor', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('executeRefreshWithResilience');
    expect(source).toContain("source: 'interceptor'");
    expect(source).not.toMatch(
      /isRefreshingPromise[\s\S]{0,800}await authService\.refreshToken\(\)/,
    );
  });

  it('V5.1 — AuthContext usa executeRefreshWithResilience en bootstrap', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain("source: 'bootstrap'");
  });

  it('IMPL-06 — cambiarEmpresaActiva registra guard L-02', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('registerCambiarEmpresaL02Guard');
  });

  it('IMPL-09 — executeInterceptorRefreshTermination enriquece classify L-02', () => {
    const source = readSource('src/shared/context/AuthContext.tsx');
    expect(source).toContain('applyL02GuardToRefreshClassifyInput');
    expect(source).toContain('clearCambiarEmpresaL02Guard');
  });

  it('IMPL-10 — emit SESSION_REFRESHED incluye refreshOutcome opcional', () => {
    const postSpy = vi.spyOn(sessionAuthSyncChannel, 'post').mockReturnValue(true);
    const token = 'header.payload.sig';
    const snapshot = buildSessionClaimsSnapshot(token, null, null);

    emitSessionRefreshedSync({
      accessToken: token,
      claimsSnapshot: snapshot,
      empresaActivaId: null,
      refreshOutcome: 'ROTATED',
    });

    expect(postSpy.mock.calls[0]?.[0]?.payload).toMatchObject({
      refreshOutcome: 'ROTATED',
    });
  });

  it('V5.4 — interceptor terminate con guard L-02 → SESSION_EXPIRED', async () => {
    resetCambiarEmpresaL02GuardForTests();
    registerCambiarEmpresaL02Guard('empresa-1', Date.now());

    const runTerminateSession = vi.fn().mockResolvedValue(undefined);
    const error = {
      response: {
        status: 401,
        data: { detail: 'token_reuse detected' },
      },
    };

    await executeInterceptorRefreshTermination(runTerminateSession, error);

    const input = runTerminateSession.mock.calls[0]?.[0];
    expect(input?.reason).toBe('SESSION_EXPIRED');
  });

  it('IMPL-09 — classify interceptor refresh preserva TOKEN_REUSE sin guard', () => {
    const input = buildInterceptorRefreshTerminationClassifyInput({
      response: {
        status: 401,
        data: { detail: 'token_reuse — todas sus sesiones' },
      },
    });

    const classification = classifySessionTermination(input);
    expect(classification.reason).toBe('TOKEN_REUSE');
  });

  it('bootstrap terminate enriquece L-02', async () => {
    resetCambiarEmpresaL02GuardForTests();
    registerCambiarEmpresaL02Guard('empresa-1', Date.now());

    const runTerminateSession = vi.fn().mockResolvedValue(undefined);
    await executeBootstrapRefreshTermination(runTerminateSession, {
      response: { status: 401, data: { detail: 'unauthorized' } },
    });

    expect(runTerminateSession.mock.calls[0]?.[0]?.reason).toBe('SESSION_EXPIRED');
  });

  it('módulos F5 presentes según diseño §4', () => {
    const modules = [
      'session-refresh-resilience.flags.ts',
      'session-refresh-outcome.types.ts',
      'session-refresh-retry.policy.ts',
      'session-refresh-outcome.resolver.ts',
      'session-refresh-resilience.ts',
      'session-cambiar-empresa-l02.ts',
    ];

    for (const mod of modules) {
      expect(() => readSource(`src/core/auth/session/${mod}`)).not.toThrow();
    }
  });

  it('V5.5 — executeRefreshWithResilience retorna outcome ROTATED en éxito', async () => {
    const result = await executeRefreshWithResilience(
      { source: 'interceptor', singleFlightRole: 'leader' },
      { callRefresh: vi.fn().mockResolvedValue('access-token') },
    );

    expect(result.metadata.outcome).toBe('ROTATED');
  });

  it('P1-02 — refresh post-cambiarEmpresa emite ALREADY_ROTATED', async () => {
    registerCambiarEmpresaL02Guard('empresa-1', 1_000);

    const result = await executeRefreshWithResilience(
      { source: 'interceptor', singleFlightRole: 'leader' },
      {
        callRefresh: vi.fn().mockResolvedValue('access-token'),
        getNowMs: () => 1_000,
      },
    );

    expect(result.metadata.outcome).toBe('ALREADY_ROTATED');
  });

  it('regresión F4 — cuerpos auth-sync congelados salvo refreshOutcome opcional', () => {
    const emitSource = readSource('src/core/auth/session/session-auth-sync-emit.ts');
    expect(emitSource).toContain('emitSessionRefreshedSync');
    expect(emitSource).not.toContain('refreshOutcome');

    const typesSource = readSource('src/core/auth/session/session-auth-sync.types.ts');
    expect(typesSource).toContain('refreshOutcome?: RefreshOutcome');
  });

  it('regresión F2 — buildInterceptorTerminationClassifyInput sin cambio firma', () => {
    const hydrateError = new Error('Post-refresh full hydration failed');
    expect(buildInterceptorTerminationClassifyInput(hydrateError)).toEqual({
      context: 'hydrate',
    });

    const refreshInput = buildInterceptorTerminationClassifyInput({
      response: { status: 401 },
    });
    expect(refreshInput.context).toBe('refresh');
  });

  it('regresión F2 — bootstrap classify input preservado', () => {
    const input = buildBootstrapTerminationClassifyInput({
      response: { status: 401 },
    });
    expect(input.context).toBe('bootstrap');
    expect(input.httpStatus).toBe(401);
  });

  it('L-02 enrich no altera classify sin guard activo', () => {
    resetCambiarEmpresaL02GuardForTests();
    const base = buildInterceptorRefreshTerminationClassifyInput({
      response: { status: 401, data: { detail: 'token_reuse' } },
    });
    const enriched = applyL02GuardToRefreshClassifyInput(base, Date.now());
    expect(enriched).toEqual(base);
  });
});
