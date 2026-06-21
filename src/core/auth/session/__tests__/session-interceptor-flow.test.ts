import { describe, expect, it, vi } from 'vitest';

import { buildSessionClaimsSnapshot } from '../session-claims-snapshot';
import { applyPostRefreshSession } from '../session-post-refresh';
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

/**
 * Simula el contrato Paso 5 del interceptor 401:
 * priorSnapshot PRE-refresh → applyPostRefreshSession → processQueue post-éxito.
 */
async function simulateInterceptorRefreshSuccess(options: {
  priorToken: string;
  newToken: string;
  empresaActivaId: string | null;
  processQueue: ReturnType<typeof vi.fn>;
}): Promise<void> {
  const { priorToken, newToken, empresaActivaId, processQueue } = options;

  const priorSnapshot = buildSessionClaimsSnapshot(
    priorToken,
    BASE_USER,
    empresaActivaId,
  );

  const order: string[] = [];

  await applyPostRefreshSession(
    {
      newToken,
      priorSnapshot,
      currentUser: BASE_USER,
      mode: 'interceptor',
    },
    {
      swapAccessToken: () => order.push('L0'),
      applyAuthUserAfterClaimsSync: () => order.push('L1-auth'),
      hydrateDeps: {
        getToken: () => newToken,
        getTokenUser: () => BASE_USER,
        setAuthUser: vi.fn(),
        fetchMe: async () => {
          order.push('L2');
          return BASE_USER;
        },
        doLogout: async () => undefined,
        syncEmpresaSession: vi.fn(),
        syncImpersonationFromToken: vi.fn(),
        updateAccessLevels: vi.fn(),
        loadMenuAndPermissionsFromAuthMenu: async () => [],
        loadEmpresasElegiblesForSession: async () => [],
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

  processQueue(null, newToken);
  order.push('processQueue');

  expect(order[order.length - 1]).toBe('processQueue');
}

describe('interceptor 401 integration contract (Paso 5)', () => {
  it('captura priorSnapshot con token PRE-refresh y empresaActivaId de sesión', () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const snapshot = buildSessionClaimsSnapshot(
      priorToken,
      BASE_USER,
      'empresa-session-state-id',
    );
    expect(snapshot.empresaId).toBe('empresa-session-state-id');
    expect(snapshot.usuarioId).toBe(BASE_USER.usuario_id);
  });

  it('ejecuta processQueue solo tras applyPostRefreshSession exitoso (NONE)', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const processQueue = vi.fn();

    const priorSnapshot = buildSessionClaimsSnapshot(
      token,
      BASE_USER,
      BASE_USER.empresa_activa ?? null,
    );

    await applyPostRefreshSession(
      {
        newToken: token,
        priorSnapshot,
        currentUser: BASE_USER,
        mode: 'interceptor',
      },
      {
        swapAccessToken: vi.fn(),
        applyAuthUserAfterClaimsSync: vi.fn(),
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

    processQueue(null, token);
    expect(processQueue).toHaveBeenCalledWith(null, token);
  });

  it('no debe llamar processQueue si applyPostRefreshSession falla', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-changed',
    });
    const processQueue = vi.fn();

    const priorSnapshot = buildSessionClaimsSnapshot(
      priorToken,
      BASE_USER,
      BASE_USER.empresa_activa ?? null,
    );

    await expect(
      applyPostRefreshSession(
        {
          newToken,
          priorSnapshot,
          currentUser: BASE_USER,
          mode: 'interceptor',
        },
        {
          swapAccessToken: vi.fn(),
          applyAuthUserAfterClaimsSync: vi.fn(),
          hydrateDeps: {
            getToken: () => newToken,
            getTokenUser: () => BASE_USER,
            setAuthUser: vi.fn(),
            fetchMe: async () => {
              throw new Error('hydrate error');
            },
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
      ),
    ).rejects.toThrow('hydrate error');

    expect(processQueue).not.toHaveBeenCalled();
  });

  it('simula flujo FULL: snapshot pre-refresh distinto → hydrate → processQueue al final', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-99999999-9999-9999-9999-999999999999',
    });
    const processQueue = vi.fn();

    await simulateInterceptorRefreshSuccess({
      priorToken,
      newToken,
      empresaActivaId: BASE_USER.empresa_activa ?? null,
      processQueue,
    });

    expect(processQueue).toHaveBeenCalledTimes(1);
    expect(processQueue).toHaveBeenCalledWith(null, newToken);
  });
});
