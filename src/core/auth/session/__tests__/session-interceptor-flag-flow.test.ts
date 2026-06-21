import { describe, expect, it, vi } from 'vitest';

import { buildSessionClaimsSnapshot } from '../session-claims-snapshot';
import { applyPostRefreshSession } from '../session-post-refresh';
import { parseRefreshHydrateEnabled } from '../refresh-hydrate.flags';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import type { UserData } from '@/features/auth/types/auth.types';

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

interface InterceptorDeps {
  priorToken: string;
  newToken: string;
  currentUser: UserData | null;
  empresaActivaId: string | null;
  processQueue: ReturnType<typeof vi.fn>;
  runPostRefreshSession: ReturnType<typeof vi.fn>;
  applyPostRefreshRqInvalidation: ReturnType<typeof vi.fn>;
  applyLegacyTokenSwap: ReturnType<typeof vi.fn>;
}

/**
 * Réplica del branch del interceptor AuthContext (Paso 8) para tests de contrato.
 */
async function simulateInterceptorRefreshBranch(
  refreshHydrateEnabled: boolean,
  deps: InterceptorDeps,
): Promise<void> {
  const {
    priorToken,
    newToken,
    currentUser,
    empresaActivaId,
    processQueue,
    runPostRefreshSession,
    applyPostRefreshRqInvalidation,
    applyLegacyTokenSwap,
  } = deps;

  if (refreshHydrateEnabled) {
    const priorSnapshot = buildSessionClaimsSnapshot(
      priorToken,
      currentUser,
      empresaActivaId,
    );
    await runPostRefreshSession(newToken, priorSnapshot);
    applyPostRefreshRqInvalidation();
  } else {
    await applyLegacyTokenSwap(newToken);
  }

  processQueue(null, newToken);
}

describe('interceptor flag branch (Paso 8)', () => {
  it('Flag ON → ejecuta applyPostRefreshSession y RQ invalidation', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const runPostRefreshSession = vi.fn().mockResolvedValue({ hydrationLevel: 'NONE' });
    const applyPostRefreshRqInvalidation = vi.fn();
    const applyLegacyTokenSwap = vi.fn();
    const processQueue = vi.fn();

    await simulateInterceptorRefreshBranch(true, {
      priorToken: token,
      newToken: token,
      currentUser: BASE_USER,
      empresaActivaId: BASE_USER.empresa_activa ?? null,
      processQueue,
      runPostRefreshSession,
      applyPostRefreshRqInvalidation,
      applyLegacyTokenSwap,
    });

    expect(runPostRefreshSession).toHaveBeenCalledTimes(1);
    expect(applyPostRefreshRqInvalidation).toHaveBeenCalledTimes(1);
    expect(applyLegacyTokenSwap).not.toHaveBeenCalled();
    expect(processQueue).toHaveBeenCalledWith(null, token);
  });

  it('Flag OFF → ejecuta solo legacy token swap sin orquestador ni RQ', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const runPostRefreshSession = vi.fn();
    const applyPostRefreshRqInvalidation = vi.fn();
    const applyLegacyTokenSwap = vi.fn().mockResolvedValue(undefined);
    const processQueue = vi.fn();

    await simulateInterceptorRefreshBranch(false, {
      priorToken: token,
      newToken: token,
      currentUser: BASE_USER,
      empresaActivaId: BASE_USER.empresa_activa ?? null,
      processQueue,
      runPostRefreshSession,
      applyPostRefreshRqInvalidation,
      applyLegacyTokenSwap,
    });

    expect(applyLegacyTokenSwap).toHaveBeenCalledTimes(1);
    expect(applyLegacyTokenSwap).toHaveBeenCalledWith(token);
    expect(runPostRefreshSession).not.toHaveBeenCalled();
    expect(applyPostRefreshRqInvalidation).not.toHaveBeenCalled();
    expect(processQueue).toHaveBeenCalledWith(null, token);
  });

  it('legacy swap solo mergea requires_password_change desde JWT', async () => {
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      requires_password_change: true,
    });

    const setAuth = vi.fn();
    let authRef = { token: 'old', user: BASE_USER };

    const applyLegacyTokenSwap = async (token: string) => {
      const refreshClaims = decodeAccessToken(token);

      const refreshedUser = authRef.user
        ? {
            ...authRef.user,
            requires_password_change: Boolean(refreshClaims?.requires_password_change),
          }
        : authRef.user;

      authRef = {
        ...authRef,
        token,
        user: refreshedUser,
      };
      setAuth(authRef);
    };

    await applyLegacyTokenSwap(newToken);

    expect(authRef.token).toBe(newToken);
    expect(authRef.user?.requires_password_change).toBe(true);
    expect(authRef.user?.empresa_activa).toBe(BASE_USER.empresa_activa);
    expect(setAuth).toHaveBeenCalledTimes(1);
  });

  it('processQueue se invoca tras éxito en ambos modos', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const baseDeps = {
      priorToken: token,
      newToken: token,
      currentUser: BASE_USER,
      empresaActivaId: BASE_USER.empresa_activa ?? null,
      runPostRefreshSession: vi.fn().mockResolvedValue({ hydrationLevel: 'NONE' }),
      applyPostRefreshRqInvalidation: vi.fn(),
      applyLegacyTokenSwap: vi.fn().mockResolvedValue(undefined),
    };

    const processQueueOn = vi.fn();
    await simulateInterceptorRefreshBranch(true, { ...baseDeps, processQueue: processQueueOn });
    expect(processQueueOn).toHaveBeenCalledWith(null, token);

    const processQueueOff = vi.fn();
    await simulateInterceptorRefreshBranch(false, { ...baseDeps, processQueue: processQueueOff });
    expect(processQueueOff).toHaveBeenCalledWith(null, token);
  });

  it('módulos session internos sin cambio: applyPostRefreshSession NONE sigue igual', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const priorSnapshot = buildSessionClaimsSnapshot(
      token,
      BASE_USER,
      BASE_USER.empresa_activa ?? null,
    );

    const swapAccessToken = vi.fn();
    const applyAuthUserAfterClaimsSync = vi.fn();

    const result = await applyPostRefreshSession(
      {
        newToken: token,
        priorSnapshot,
        currentUser: BASE_USER,
        mode: 'interceptor',
      },
      {
        swapAccessToken,
        applyAuthUserAfterClaimsSync,
        hydrateDeps: {
          getToken: () => token,
          getTokenUser: () => BASE_USER,
          setAuthUser: vi.fn(),
          fetchMe: vi.fn(),
          doLogout: vi.fn(),
          syncEmpresaSession: vi.fn(),
          syncImpersonationFromToken: vi.fn(),
          updateAccessLevels: vi.fn(),
          loadMenuAndPermissionsFromAuthMenu: vi.fn(),
          loadEmpresasElegiblesForSession: vi.fn(),
          determineUserType: () => 'user',
          setRequiereSeleccionEmpresa: vi.fn(),
          setMenuModulos: vi.fn(),
          setPermissions: vi.fn(),
          setMenuPermissionsReady: vi.fn(),
          setEmpresasElegibles: vi.fn(),
          setAuthInitialized: vi.fn(),
          setIsBootstrapped: vi.fn(),
          setSessionMenuSnapshot: vi.fn(),
        },
      },
    );

    expect(result.hydrationLevel).toBe('NONE');
    expect(swapAccessToken).toHaveBeenCalledWith(token);
    expect(applyAuthUserAfterClaimsSync).toHaveBeenCalled();
  });

  it('bootstrap no consume el flag: parseRefreshHydrateEnabled es independiente del modo', () => {
    expect(parseRefreshHydrateEnabled(undefined)).toBe(true);
    expect(parseRefreshHydrateEnabled('false')).toBe(false);
  });
});
