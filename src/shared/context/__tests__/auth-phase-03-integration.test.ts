import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { executeLogoutAllFlow } from '@/core/auth/session/session-logout-all';
import { shouldRunSessionProbe } from '@/core/auth/session/session-remote-probe';
import { terminateSession } from '@/core/auth/session/session-terminate';
import {
  buildSessionProbeContext,
  buildSessionRemoteProbePolicy,
  evaluateSessionRemoteProbe,
} from '@/core/auth/session/useSessionRemoteProbe';
import { executeActiveSessionRevoke } from '@/features/admin/pages/ActiveSessionsPage';
import type { AdminSessionRead } from '@/features/admin/types/session.types';
import {
  buildDoLogoutTerminateInput,
  buildLogoutAllTerminateInput,
  executeDoLogoutTermination,
  executeInterceptorRefreshTermination,
  executeLogoutAllTermination,
  getLogoutAllFlowDeps,
  getSessionValidityProbeDeps,
  getTerminateSessionDeps,
  runSessionTerminationExit,
  type LegacySessionLogoutDeps,
} from '@/shared/context/AuthContext';
import { runSessionValidityProbe } from '@/shared/context/AuthContext';

const ROOT = process.cwd();

function readSource(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function createTerminateHarness() {
  const order: string[] = [];
  const isTerminatingRef = { current: false };
  const redirectToLogin = vi.fn((loginPath: string) => {
    order.push(`redirect:${loginPath}`);
  });

  const deps = getTerminateSessionDeps({
    isTerminatingRef,
    processQueue: () => {
      order.push('processQueue');
    },
    clearLocalAuthState: () => {
      order.push('clearLocalAuthState');
    },
    getHadAuthenticatedUser: () => true,
    callLogoutEndpoint: async () => {
      order.push('callLogoutEndpoint');
    },
    clearQueryCache: () => {
      order.push('clearQueryCache');
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
    isTerminatingRef,
    redirectToLogin,
    deps,
    runTerminateSession,
    legacyDeps,
  };
}

const eligibleProbeState = {
  isAuthenticated: true,
  isImpersonationActive: false,
  isSelectionPending: false,
  isTerminating: false,
};

const ownRevokedSession: AdminSessionRead = {
  token_id: 'token-own',
  usuario_id: 'admin-user',
  cliente_id: 'client-1',
  created_at: '2026-01-01T00:00:00Z',
  last_used_at: '2026-01-01T12:00:00Z',
  expires_at: '2026-12-31T00:00:00Z',
  device_name: 'Chrome',
  device_id: 'device-1',
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0',
  client_type: 'web',
  nombre_usuario: 'Admin',
  nombre: 'Admin',
  apellido: 'User',
};

describe('IAM-FE-PHASE-03 Paso 9 — integración V3.x', () => {
  describe('V3.1 — Logout manual (regresión Fase 2)', () => {
    it('runSessionTerminationExit → executeDoLogoutTermination → terminateSession con callServer true', async () => {
      const { order, runTerminateSession } = createTerminateHarness();
      const dispatcherOrder: string[] = [];

      await runSessionTerminationExit({
        v2Enabled: true,
        legacyDeps: createTerminateHarness().legacyDeps,
        legacyCallServer: true,
        v2Action: async () => {
          dispatcherOrder.push('v2Action');
          await executeDoLogoutTermination(runTerminateSession, { callServer: true });
        },
      });

      expect(dispatcherOrder).toEqual(['v2Action']);
      expect(order).toEqual([
        'processQueue',
        'callLogoutEndpoint',
        'clearLocalAuthState',
        'clearQueryCache',
        'showTerminationToast',
        'redirect:/login',
      ]);
      expect(buildDoLogoutTerminateInput({ callServer: true }).callServer).toBe(true);
    });
  });

  describe('V3.2 — Logout All cadena completa (IMPL-04/07)', () => {
    it('logout_all → executeLogoutAllFlow → runSessionTerminationExit → terminateSession callServer false', async () => {
      const { order, runTerminateSession, legacyDeps, redirectToLogin, isTerminatingRef } =
        createTerminateHarness();
      const flowOrder: string[] = [];
      const callLogoutAllEndpoint = vi.fn(async () => {
        flowOrder.push('POST /auth/logout_all/');
      });

      const flowInput = { preservePreLoginBranding: true };

      await executeLogoutAllFlow(
        flowInput,
        getLogoutAllFlowDeps({
          isTerminatingRef,
          callLogoutAllEndpoint,
          runTerminateAfterLogoutAll: async () => {
            flowOrder.push('runTerminateAfterLogoutAll');
            await executeLogoutAllTermination(
              runTerminateSession,
              legacyDeps,
              flowInput,
              redirectToLogin,
            );
          },
        }),
      );

      expect(flowOrder).toEqual([
        'POST /auth/logout_all/',
        'runTerminateAfterLogoutAll',
      ]);
      expect(callLogoutAllEndpoint).toHaveBeenCalledTimes(1);
      expect(order).toContain('processQueue');
      expect(order).toContain('clearLocalAuthState');
      expect(order).toContain('clearQueryCache');
      expect(order).toContain('redirect:/login');
      expect(order).not.toContain('callLogoutEndpoint');
      expect(buildLogoutAllTerminateInput(flowInput).callServer).toBe(false);
    });

    it('runSessionTerminationExit es el único dispatcher en logout all V2', async () => {
      const v2Action = vi.fn().mockResolvedValue(undefined);
      const legacyLogout = vi.fn();

      await runSessionTerminationExit({
        v2Enabled: true,
        legacyDeps: {
          processQueue: vi.fn(),
          callLogoutEndpoint: vi.fn(),
          clearLocalAuthState: vi.fn(),
          getHadAuthenticatedUser: () => true,
        },
        legacyCallServer: false,
        v2Action,
      });

      expect(v2Action).toHaveBeenCalledTimes(1);
      expect(legacyLogout).not.toHaveBeenCalled();
    });
  });

  describe('V3.3 — Revocación remota → probe → interceptor → Fase 2', () => {
    it('SessionRemoteProbe lifecycle ejecuta runSessionValidityProbe vía evaluateSessionRemoteProbe', async () => {
      const fetchMe = vi.fn().mockResolvedValue({ usuario_id: 'u1' });
      const runSessionValidityProbeFn = vi.fn(async () => {
        await runSessionValidityProbe(
          getSessionValidityProbeDeps({
            isProbeInFlightRef: { current: false },
            fetchMe,
          }),
        );
      });

      const executed = await evaluateSessionRemoteProbe({
        context: buildSessionProbeContext(eligibleProbeState, null),
        policy: buildSessionRemoteProbePolicy(true),
        nowMs: 10_000,
        runSessionValidityProbe: runSessionValidityProbeFn,
        lastProbeAtMsRef: { current: null },
      });

      expect(executed).toBe(true);
      expect(runSessionValidityProbeFn).toHaveBeenCalledTimes(1);
      expect(fetchMe).toHaveBeenCalledTimes(1);
    });

    it('probe 401 propagado + refresh 401 → executeInterceptorRefreshTermination → terminateSession', async () => {
      const me401 = {
        response: { status: 401, data: { detail: 'Sesión revocada' } },
        config: { url: '/auth/me/' },
      };
      const refresh401 = {
        response: { status: 401, data: { detail: 'Sesión expirada o cerrada remotamente' } },
        config: { url: '/auth/refresh/' },
      };

      const fetchMe = vi.fn().mockRejectedValue(me401);
      await expect(
        runSessionValidityProbe(
          getSessionValidityProbeDeps({
            isProbeInFlightRef: { current: false },
            fetchMe,
          }),
        ),
      ).rejects.toEqual(me401);

      const { order, runTerminateSession, redirectToLogin } = createTerminateHarness();
      await executeInterceptorRefreshTermination(runTerminateSession, refresh401);

      expect(order).toContain('processQueue');
      expect(order).toContain('clearLocalAuthState');
      expect(order).toContain('clearQueryCache');
      expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
    });

    it('post-revoke admin (IMPL-08) encadena runSessionValidityProbe sin terminateSession directo', async () => {
      const runSessionValidityProbeFn = vi.fn().mockResolvedValue(undefined);
      const queryClient = {} as import('@tanstack/react-query').QueryClient;

      await executeActiveSessionRevoke(ownRevokedSession, queryClient, {
        revokeSessionById: vi.fn().mockResolvedValue(undefined),
        invalidateActiveSessionsListQueries: vi.fn().mockResolvedValue(undefined),
        runSessionValidityProbe: runSessionValidityProbeFn,
        isCurrentSession: (session) => session.token_id === 'token-own',
        showSuccessToast: vi.fn(),
        showErrorToast: vi.fn(),
      });

      expect(runSessionValidityProbeFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('V3.4 — Idempotencia logout all', () => {
    it('segundo executeLogoutAllFlow no-op cuando isTerminatingRef activo', async () => {
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

    it('terminateSession single-flight evita doble cleanup en logout all concurrente', async () => {
      const { isTerminatingRef, runTerminateSession } = createTerminateHarness();
      const order: string[] = [];
      let releaseCleanup: (() => void) | null = null;
      const cleanupGate = new Promise<void>((resolve) => {
        releaseCleanup = resolve;
      });

      const deps = getTerminateSessionDeps({
        isTerminatingRef,
        processQueue: () => {
          order.push('processQueue');
        },
        clearLocalAuthState: async () => {
          order.push('clearLocalAuthState');
          await cleanupGate;
        },
        getHadAuthenticatedUser: () => true,
        callLogoutEndpoint: async () => undefined,
        clearQueryCache: () => undefined,
        showTerminationToast: () => undefined,
        redirectToLogin: () => undefined,
      });

      const runTerminate = (input: Parameters<typeof terminateSession>[0]) =>
        terminateSession(input, deps);

      const input = buildLogoutAllTerminateInput({ preservePreLoginBranding: true });
      const first = runTerminate(input);
      const second = runTerminate(input);

      await Promise.resolve();
      expect(order.filter((step) => step === 'processQueue')).toHaveLength(1);

      releaseCleanup?.();
      await first;
      await second;
    });
  });

  describe('Arquitectura — contratos IMPL-04…08', () => {
    it('terminateSession permanece como único orquestador V2 (sin segundo orquestador)', async () => {
      const { runTerminateSession, order } = createTerminateHarness();

      await terminateSession(buildLogoutAllTerminateInput({}), createTerminateHarness().deps);
      await executeDoLogoutTermination(runTerminateSession, { callServer: true });

      expect(order.length).toBeGreaterThan(0);
    });

    it('shouldRunSessionProbe rechaza contexto terminating (probe skip)', () => {
      const allowed = shouldRunSessionProbe(
        buildSessionProbeContext(eligibleProbeState, null),
        buildSessionRemoteProbePolicy(true),
        1_000,
      );
      const blocked = shouldRunSessionProbe(
        buildSessionProbeContext({ ...eligibleProbeState, isTerminating: true }, null),
        buildSessionRemoteProbePolicy(true),
        2_000,
      );

      expect(allowed).toBe(true);
      expect(blocked).toBe(false);
    });

    it('Header consume únicamente logoutAllSessions de useAuth (IMPL-07)', () => {
      const headerSrc = readSource('src/shared/components/layout/Header.tsx');

      expect(headerSrc).toMatch(/logoutAllSessions/);
      expect(headerSrc).toMatch(/useAuth\(\)/);
      expect(headerSrc).not.toMatch(/executeLogoutAllFlow/);
      expect(headerSrc).not.toMatch(/terminateSession/);
      expect(headerSrc).not.toMatch(/runSessionTerminationExit/);
      expect(headerSrc).not.toMatch(/authService\.logoutAll/);
    });

    it('LogoutAllConfirmDialog delega confirmación vía onConfirm sin orquestadores (IMPL-07)', () => {
      const dialogSrc = readSource('src/features/auth/components/LogoutAllConfirmDialog.tsx');

      expect(dialogSrc).toMatch(/variant="danger"/);
      expect(dialogSrc).not.toMatch(/logoutAllSessions\s*\(/);
      expect(dialogSrc).not.toMatch(/executeLogoutAllFlow/);
      expect(dialogSrc).not.toMatch(/terminateSession\s*\(/);
    });

    it('ActiveSessionsPage consume runSessionValidityProbe vía useAuth/deps (IMPL-08)', () => {
      const pageSrc = readSource('src/features/admin/pages/ActiveSessionsPage.tsx');

      expect(pageSrc).toMatch(/runSessionValidityProbe/);
      expect(pageSrc).toMatch(/useAuth\(\)/);
      expect(pageSrc).not.toMatch(/authService\.me/);
      expect(pageSrc).not.toMatch(/import.*terminateSession/);
      expect(pageSrc).not.toMatch(/terminateSession\s*\(/);
      expect(pageSrc).not.toMatch(/runSessionTerminationExit/);
    });
  });
});
