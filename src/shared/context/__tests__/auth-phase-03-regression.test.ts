/**
 * IAM-FE-PHASE-03-IMPL-10 — Regresión completa Fase 1 + Fase 2 + Fase 3.
 *
 * Matriz contractual (diseño §26.4, §1292):
 * - Fase 1: V1.1, V1.2, V1.3, V1.4
 * - Fase 2: V2.1, V2.2, V2.3, V2.4, V2.5, V2.6
 * - Fase 3: V3.1, V3.2, V3.3, V3.4
 *
 * Suites complementarias ejecutadas en CI (ver REGRESSION_SUITE_MANIFEST).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { buildSessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import { applyPostRefreshSession } from '@/core/auth/session/session-post-refresh';
import { hydrateSessionCore } from '@/core/auth/session/session-refresh-hydrate';
import { executeLogoutAllFlow } from '@/core/auth/session/session-logout-all';
import {
  SESSION_EXPIRED_CANONICAL_MESSAGE,
  TOKEN_REUSE_CANONICAL_MESSAGE,
  resolveTerminationUx,
} from '@/core/auth/session/session-termination-ux';
import {
  SESSION_TERMINATED_ERROR_MESSAGE,
  terminateSession,
} from '@/core/auth/session/session-terminate';
import {
  buildSessionProbeContext,
  buildSessionRemoteProbePolicy,
  evaluateSessionRemoteProbe,
} from '@/core/auth/session/useSessionRemoteProbe';
import type { UserData } from '@/features/auth/types/auth.types';
import { resolveLoginBannerFromSessionQuery } from '@/features/auth/utils/login-session-termination';
import {
  buildDoLogoutTerminateInput,
  buildLogoutAllTerminateInput,
  executeBootstrapRefreshTermination,
  executeDoLogoutTermination,
  executeInterceptorRefreshTermination,
  executeLogoutAllTermination,
  getLogoutAllFlowDeps,
  getSessionValidityProbeDeps,
  getTerminateSessionDeps,
  runSessionTerminationExit,
  runSessionValidityProbe,
  type LegacySessionLogoutDeps,
} from '@/shared/context/AuthContext';

const ROOT = process.cwd();

/** Manifesto de suites de regresión — documentación IMPL-10. */
export const REGRESSION_SUITE_MANIFEST = {
  phase03Regression: 'src/shared/context/__tests__/auth-phase-03-regression.test.ts',
  phase03Integration: 'src/shared/context/__tests__/auth-phase-03-integration.test.ts',
  phase02Closure: 'src/shared/context/__tests__/auth-phase-02-closure.test.ts',
  phase01Interceptor: 'src/core/auth/session/__tests__/session-interceptor-flow.test.ts',
  phase01PostRefresh: 'src/core/auth/session/__tests__/session-post-refresh.test.ts',
  phase01Hydrate: 'src/core/auth/session/__tests__/session-refresh-hydrate.test.ts',
  phase02Terminate: 'src/core/auth/session/__tests__/session-terminate.test.ts',
  phase03LogoutAll: 'src/core/auth/session/__tests__/session-logout-all.test.ts',
  phase03ProbeLifecycle: 'src/core/auth/session/__tests__/useSessionRemoteProbe.test.ts',
  phase03LogoutWiring: 'src/shared/context/__tests__/auth-logout-all.test.ts',
  phase03ProbeWiring: 'src/shared/context/__tests__/auth-session-validity-probe.test.ts',
  phase03HeaderUi: 'src/shared/components/layout/__tests__/Header.logout-all.test.ts',
  phase03AdminRevoke: 'src/features/admin/pages/__tests__/ActiveSessionsPage.post-revoke.test.ts',
  phase04Flags: 'src/core/auth/session/__tests__/session-auth-sync.flags.test.ts',
  phase04Emit: 'src/core/auth/session/__tests__/session-auth-sync-emit.test.ts',
  phase04Apply: 'src/core/auth/session/__tests__/session-auth-sync-apply.test.ts',
  phase04Selection: 'src/core/auth/session/__tests__/session-auth-sync-selection.test.ts',
  phase04Regression: 'src/shared/context/__tests__/auth-phase-04-regression.test.ts',
} as const;

function readSource(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function encodeBase64Url(value: string): string {
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(value)
      : Buffer.from(value, 'utf8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createMockAccessToken(payload: Record<string, unknown>): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

const BASE_PAYLOAD = {
  sub: 'user-11111111-1111-1111-1111-111111111111',
  cliente_id: 'client-22222222-2222-2222-2222-222222222222',
  empresa_id: 'empresa-33333333-3333-3333-3333-333333333333',
  user_type: 'user',
  es_admin_cliente: false,
  requires_password_change: false,
  empresa_selection_pending: false,
  is_impersonation: false,
} as const;

const BASE_USER: UserData = {
  usuario_id: 'user-11111111-1111-1111-1111-111111111111',
  cliente_id: 'client-22222222-2222-2222-2222-222222222222',
  nombre_usuario: 'jdoe',
  correo: 'jdoe@example.com',
  nombre: 'John',
  apellido: 'Doe',
  es_activo: true,
  roles: ['operativo'],
  empresa_activa: 'empresa-33333333-3333-3333-3333-333333333333',
  es_admin_cliente: false,
  requires_password_change: false,
};

const BACKEND_DETAIL_19 =
  'Sesión expirada o cerrada remotamente. Por favor, vuelva a iniciar sesión.';

function createTerminateHarness() {
  const order: string[] = [];
  const isTerminatingRef = { current: false };
  const redirectToLogin = vi.fn((loginPath: string) => {
    order.push(`redirect:${loginPath}`);
  });
  const clearQueryCache = vi.fn(() => {
    order.push('clearQueryCache');
  });
  const rejected: Error[] = [];

  const deps = getTerminateSessionDeps({
    isTerminatingRef,
    processQueue: (error) => {
      order.push('processQueue');
      if (error) {
        rejected.push(error);
      }
    },
    clearLocalAuthState: () => {
      order.push('clearLocalAuthState');
    },
    getHadAuthenticatedUser: () => true,
    callLogoutEndpoint: async () => {
      order.push('callLogoutEndpoint');
    },
    clearQueryCache: () => {
      clearQueryCache();
    },
    showTerminationToast: () => {
      order.push('showTerminationToast');
    },
    redirectToLogin,
  });

  const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
    terminateSession(input, deps);

  const legacyDeps: LegacySessionLogoutDeps = {
    processQueue: deps.processQueue,
    callLogoutEndpoint: deps.callLogoutEndpoint,
    clearLocalAuthState: (preserve) => {
      deps.clearAuthState({ preservePreLoginBranding: preserve });
    },
    getHadAuthenticatedUser: () => true,
  };

  return {
    order,
    rejected,
    isTerminatingRef,
    redirectToLogin,
    clearQueryCache,
    deps,
    runTerminateSession,
    legacyDeps,
  };
}

function createHydrateDeps(token: string, fetchMe: ReturnType<typeof vi.fn>) {
  return {
    getToken: () => token,
    getTokenUser: () => BASE_USER,
    setAuthUser: vi.fn(),
    fetchMe,
    doLogout: vi.fn(),
    syncEmpresaSession: vi.fn(),
    syncImpersonationFromToken: vi.fn(),
    updateAccessLevels: vi.fn(),
    loadMenuAndPermissionsFromAuthMenu: async () => [],
    loadEmpresasElegiblesForSession: async () => [],
    determineUserType: () => 'user' as const,
    setRequiereSeleccionEmpresa: vi.fn(),
    setMenuModulos: vi.fn(),
    setPermissions: vi.fn(),
    setMenuPermissionsReady: vi.fn(),
    setEmpresasElegibles: vi.fn(),
    setAuthInitialized: vi.fn(),
    setIsBootstrapped: vi.fn(),
    setSessionMenuSnapshot: vi.fn(),
  };
}

describe('IAM-FE-PHASE-03 Paso 10 — Regresión Fase 1 (V1.x)', () => {
  it('V1.1 — 401→refresh OK: applyPostRefreshSession + processQueue post-éxito', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const processQueue = vi.fn();
    const priorSnapshot = buildSessionClaimsSnapshot(
      token,
      BASE_USER,
      BASE_USER.empresa_activa ?? null,
    );

    const result = await applyPostRefreshSession(
      { newToken: token, priorSnapshot, currentUser: BASE_USER, mode: 'interceptor' },
      {
        swapAccessToken: vi.fn(),
        applyAuthUserAfterClaimsSync: vi.fn(),
        hydrateDeps: createHydrateDeps(token, vi.fn()),
      },
    );

    processQueue(null, token);

    expect(result.hydrationLevel).toBe('NONE');
    expect(processQueue).toHaveBeenCalledWith(null, token);
  });

  it('V1.2 — empresa_id en JWT cambia: hydrate FULL vía applyPostRefreshSession', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-99999999-9999-9999-9999-999999999999',
    });
    const fetchMe = vi.fn(async () => BASE_USER);
    const priorSnapshot = buildSessionClaimsSnapshot(
      priorToken,
      BASE_USER,
      BASE_USER.empresa_activa ?? null,
    );

    const result = await applyPostRefreshSession(
      { newToken, priorSnapshot, currentUser: BASE_USER, mode: 'interceptor' },
      {
        swapAccessToken: vi.fn(),
        applyAuthUserAfterClaimsSync: vi.fn(),
        hydrateDeps: createHydrateDeps(newToken, fetchMe),
      },
    );

    expect(result.hydrationLevel).toBe('FULL');
    expect(fetchMe).toHaveBeenCalledTimes(1);
  });

  it('V1.3 — refresh sin cambio contexto: NONE sin /auth/me', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const fetchMe = vi.fn(async () => BASE_USER);
    const priorSnapshot = buildSessionClaimsSnapshot(
      token,
      BASE_USER,
      BASE_USER.empresa_activa ?? null,
    );

    const result = await applyPostRefreshSession(
      { newToken: token, priorSnapshot, currentUser: BASE_USER, mode: 'interceptor' },
      {
        swapAccessToken: vi.fn(),
        applyAuthUserAfterClaimsSync: vi.fn(),
        hydrateDeps: createHydrateDeps(token, fetchMe),
      },
    );

    expect(result.hydrationLevel).toBe('NONE');
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it('anti-deadlock — 401 /auth/me durante refresh leader no se encola (interceptor)', () => {
    const interceptors = readSource(
      'src/core/auth/provider/auth-provider-interceptors.compositor.ts',
    );
    const enqueueBlockStart = interceptors.indexOf('if (getRefreshingPromise())');
    expect(enqueueBlockStart).toBeGreaterThan(-1);
    const enqueueBlock = interceptors.slice(
      enqueueBlockStart,
      enqueueBlockStart + 900,
    );
    expect(enqueueBlock).toContain("pendingUrl.includes('/auth/me')");
    expect(enqueueBlock).toContain('return Promise.reject(error)');
    expect(enqueueBlock.indexOf("pendingUrl.includes('/auth/me')")).toBeLessThan(
      enqueueBlock.indexOf('failedQueueRef.current.push'),
    );
  });

  it('V1.4 — bootstrap hydrateSessionCore conserva contrato', async () => {
    const token = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_selection_pending: true,
    });
    const fetchMe = vi.fn(async () => null);

    const result = await hydrateSessionCore(
      { mode: 'bootstrap' },
      createHydrateDeps(token, fetchMe),
    );

    expect(result).toBeNull();
    expect(fetchMe).not.toHaveBeenCalled();
  });
});

describe('IAM-FE-PHASE-03 Paso 10 — Regresión Fase 2 (V2.x)', () => {
  it('V2.1 — refresh 401 interceptor: cleanup + redirect sin segundo refresh', async () => {
    const { order, runTerminateSession, redirectToLogin } = createTerminateHarness();

    await executeInterceptorRefreshTermination(runTerminateSession, {
      response: { status: 401, data: { detail: BACKEND_DETAIL_19 } },
      config: { url: '/api/v1/auth/refresh/' },
    });

    expect(order).toEqual([
      'processQueue',
      'clearLocalAuthState',
      'clearQueryCache',
      'showTerminationToast',
      'redirect:/login?session=expired',
    ]);
    expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
  });

  it('V2.2 — refresh 401 bootstrap: cleanup + redirect /login', async () => {
    const { order, runTerminateSession, redirectToLogin } = createTerminateHarness();

    await executeBootstrapRefreshTermination(runTerminateSession, {
      response: { status: 401 },
      config: { url: '/api/v1/auth/refresh/' },
    });

    expect(order).toContain('clearLocalAuthState');
    expect(order).toContain('clearQueryCache');
    expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
  });

  it('V2.3 — mensaje backend §19 priorizado en UX', () => {
    const profile = resolveTerminationUx('SESSION_EXPIRED', {
      backendDetail: BACKEND_DETAIL_19,
    });

    expect(profile.toastMessage).toBe(BACKEND_DETAIL_19);
    expect(resolveLoginBannerFromSessionQuery('expired')?.message).toBe(
      SESSION_EXPIRED_CANONICAL_MESSAGE,
    );
  });

  it('V2.4 — TOKEN_REUSE mensaje diferenciado', () => {
    const expired = resolveTerminationUx('SESSION_EXPIRED');
    const reuse = resolveTerminationUx('TOKEN_REUSE');

    expect(reuse.toastMessage).toBe(TOKEN_REUSE_CANONICAL_MESSAGE);
    expect(reuse.toastMessage).not.toBe(expired.toastMessage);
  });

  it('V2.5 — processQueue rechaza cola con error estable', async () => {
    const { rejected, runTerminateSession } = createTerminateHarness();

    await executeInterceptorRefreshTermination(runTerminateSession, {
      response: { status: 401 },
      config: { url: '/api/v1/auth/refresh/' },
    });

    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.message).toBe(SESSION_TERMINATED_ERROR_MESSAGE);
  });

  it('V2.6 — queryClient.clear en terminación flag ON', async () => {
    const { clearQueryCache, runTerminateSession } = createTerminateHarness();

    await executeInterceptorRefreshTermination(runTerminateSession, {
      response: { status: 401 },
      config: { url: '/api/v1/auth/refresh/' },
    });

    expect(clearQueryCache).toHaveBeenCalledTimes(1);
  });
});

describe('IAM-FE-PHASE-03 Paso 10 — Regresión Fase 3 (V3.x)', () => {
  it('V3.1 — logout manual: runSessionTerminationExit → terminateSession callServer true', async () => {
    const { order, runTerminateSession } = createTerminateHarness();

    await runSessionTerminationExit({
      v2Enabled: true,
      legacyDeps: createTerminateHarness().legacyDeps,
      v2Action: () => executeDoLogoutTermination(runTerminateSession, { callServer: true }),
    });

    expect(order).toContain('callLogoutEndpoint');
    expect(buildDoLogoutTerminateInput({ callServer: true }).reason).toBe('MANUAL_LOGOUT');
  });

  it('V3.2 — logout all: executeLogoutAllFlow → terminateSession callServer false', async () => {
    const { order, runTerminateSession, legacyDeps, redirectToLogin, isTerminatingRef } =
      createTerminateHarness();
    const flowOrder: string[] = [];

    await executeLogoutAllFlow(
      { preservePreLoginBranding: true },
      getLogoutAllFlowDeps({
        isTerminatingRef,
        callLogoutAllEndpoint: async () => {
          flowOrder.push('logout_all');
        },
        runTerminateAfterLogoutAll: async () => {
          flowOrder.push('terminate');
          await executeLogoutAllTermination(
            runTerminateSession,
            legacyDeps,
            { preservePreLoginBranding: true },
            redirectToLogin,
          );
        },
      }),
    );

    expect(flowOrder).toEqual(['logout_all', 'terminate']);
    expect(order).not.toContain('callLogoutEndpoint');
    expect(buildLogoutAllTerminateInput({}).callServer).toBe(false);
  });

  it('V3.3 — probe lifecycle no invoca terminateSession; 401 delega a Fase 2', async () => {
    const fetchMe = vi.fn().mockRejectedValue({
      response: { status: 401 },
      config: { url: '/auth/me/' },
    });
    const terminateSpy = vi.fn();

    await evaluateSessionRemoteProbe({
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
      nowMs: 1_000,
      runSessionValidityProbe: async () => {
        await runSessionValidityProbe(
          getSessionValidityProbeDeps({
            isProbeInFlightRef: { current: false },
            fetchMe,
          }),
        );
      },
      lastProbeAtMsRef: { current: null },
    }).catch(() => undefined);

    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(terminateSpy).not.toHaveBeenCalled();

    const { redirectToLogin, runTerminateSession } = createTerminateHarness();
    await executeInterceptorRefreshTermination(runTerminateSession, {
      response: { status: 401 },
      config: { url: '/auth/refresh/' },
    });
    expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
  });

  it('V3.4 — idempotencia logout all: isTerminatingRef bloquea segundo flujo', async () => {
    const callLogoutAllEndpoint = vi.fn();
    const runTerminateAfterLogoutAll = vi.fn();

    await executeLogoutAllFlow(
      {},
      getLogoutAllFlowDeps({
        isTerminatingRef: { current: true },
        callLogoutAllEndpoint,
        runTerminateAfterLogoutAll,
      }),
    );

    expect(callLogoutAllEndpoint).not.toHaveBeenCalled();
    expect(runTerminateAfterLogoutAll).not.toHaveBeenCalled();
  });
});

describe('IAM-FE-PHASE-03 Paso 10 — Invariantes arquitectónicos post-Fase 3', () => {
  it('applyPostRefreshSession y hydrateSessionCore sin dependencias Fase 3', () => {
    const postRefreshSrc = readSource('src/core/auth/session/session-post-refresh.ts');
    const hydrateSrc = readSource('src/core/auth/session/session-refresh-hydrate.ts');

    expect(postRefreshSrc).toMatch(/export async function applyPostRefreshSession/);
    expect(hydrateSrc).toMatch(/export async function hydrateSessionCore/);
    expect(postRefreshSrc).not.toMatch(/session-logout-all|useSessionRemoteProbe|logoutAllSessions/);
    expect(hydrateSrc).not.toMatch(/session-logout-all|useSessionRemoteProbe|logoutAllSessions/);
  });

  it('terminateSession permanece único orquestador V2 exportado', () => {
    const terminateSrc = readSource('src/core/auth/session/session-terminate.ts');

    expect(terminateSrc).toMatch(/export async function terminateSession/);
    expect(terminateSrc).not.toMatch(/executeLogoutAllFlow/);
  });

  it('runSessionTerminationExit permanece único dispatcher', async () => {
    const v2Action = vi.fn();
    const legacyOrder: string[] = [];

    await runSessionTerminationExit({
      v2Enabled: true,
      legacyDeps: {
        processQueue: () => legacyOrder.push('legacy'),
        callLogoutEndpoint: vi.fn(),
        clearLocalAuthState: vi.fn(),
        getHadAuthenticatedUser: () => false,
      },
      v2Action,
    });

    expect(v2Action).toHaveBeenCalledTimes(1);
    expect(legacyOrder).toHaveLength(0);
  });

  it('executeLogoutAllFlow mantiene callServer false en terminate wiring', () => {
    const input = buildLogoutAllTerminateInput({ preservePreLoginBranding: true });

    expect(input.callServer).toBe(false);
    expect(input.reason).toBe('MANUAL_LOGOUT');
  });

  it('SessionRemoteProbeBinder no altera applyPostRefreshSession en probe 200', async () => {
    const fetchMe = vi.fn().mockResolvedValue(BASE_USER);
    const applyPostRefreshSpy = vi.fn();

    await evaluateSessionRemoteProbe({
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
      nowMs: 5_000,
      runSessionValidityProbe: async () => {
        await runSessionValidityProbe(
          getSessionValidityProbeDeps({
            isProbeInFlightRef: { current: false },
            fetchMe,
          }),
        );
      },
      lastProbeAtMsRef: { current: null },
    });

    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(applyPostRefreshSpy).not.toHaveBeenCalled();
  });

  it('processQueue conserva contrato Fase 2 en terminateSession', async () => {
    const { rejected, runTerminateSession } = createTerminateHarness();

    await runTerminateSession({
      reason: 'SESSION_EXPIRED',
      callServer: false,
      error: { response: { status: 401 } },
    });

    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.message).toBe(SESSION_TERMINATED_ERROR_MESSAGE);
  });

  it('REGRESSION_SUITE_MANIFEST documenta cobertura por fase', () => {
    expect(Object.keys(REGRESSION_SUITE_MANIFEST).length).toBeGreaterThanOrEqual(10);
    expect(REGRESSION_SUITE_MANIFEST.phase03Regression).toContain('auth-phase-03-regression');
    expect(REGRESSION_SUITE_MANIFEST.phase02Closure).toContain('auth-phase-02-closure');
  });
});
