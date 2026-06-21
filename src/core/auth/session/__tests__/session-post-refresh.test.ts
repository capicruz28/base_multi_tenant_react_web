import { describe, expect, it, vi } from 'vitest';

import {
  buildSessionClaimsSnapshot,
  type SessionSnapshotUserInput,
} from '../session-claims-snapshot';
import {
  applyPostRefreshSession,
  type ApplyPostRefreshSessionDeps,
} from '../session-post-refresh';
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

const BASE_USER: SessionSnapshotUserInput = {
  usuario_id: 'user-11111111-1111-1111-1111-111111111111',
  cliente_id: 'client-22222222-2222-2222-2222-222222222222',
  user_type: 'user',
  empresa_activa: 'empresa-33333333-3333-3333-3333-333333333333',
  es_admin_cliente: false,
  requires_password_change: false,
  nombre_usuario: 'jdoe',
  roles: ['operativo'],
};

const BASE_ME: UserData = {
  usuario_id: BASE_USER.usuario_id!,
  cliente_id: BASE_USER.cliente_id!,
  nombre_usuario: 'jdoe',
  correo: 'jdoe@example.com',
  nombre: 'John',
  apellido: 'Doe',
  es_activo: true,
  roles: ['operativo'],
  empresa_activa: BASE_USER.empresa_activa,
  es_admin_cliente: false,
  requires_password_change: false,
};

function buildPriorSnapshot(token: string) {
  return buildSessionClaimsSnapshot(token, BASE_USER, BASE_USER.empresa_activa ?? null);
}

function createMinimalHydrateDeps(
  token: string,
  overrides?: Partial<ApplyPostRefreshSessionDeps['hydrateDeps']>,
): ApplyPostRefreshSessionDeps['hydrateDeps'] {
  return {
    getToken: () => token,
    getTokenUser: () => null,
    setAuthUser: vi.fn(),
    fetchMe: async () => BASE_ME,
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
    ...overrides,
  };
}

function createDeps(
  token: string,
  options?: {
    hydrateOverrides?: Partial<ApplyPostRefreshSessionDeps['hydrateDeps']>;
    claimsSyncCallbacks?: ApplyPostRefreshSessionDeps['claimsSyncCallbacks'];
  },
): ApplyPostRefreshSessionDeps {
  return {
    swapAccessToken: vi.fn(),
    claimsSyncCallbacks: options?.claimsSyncCallbacks,
    applyAuthUserAfterClaimsSync: vi.fn(),
    hydrateDeps: createMinimalHydrateDeps(token, options?.hydrateOverrides),
  };
}

describe('applyPostRefreshSession', () => {
  it('termina en NONE sin invocar hydrateSessionCore', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(token);
    const fetchMe = vi.fn(async () => BASE_ME);
    const deps = createDeps(token, { hydrateOverrides: { fetchMe } });

    const result = await applyPostRefreshSession(
      { newToken: token, priorSnapshot: prior, currentUser: BASE_USER },
      deps,
    );

    expect(result.hydrationLevel).toBe('NONE');
    expect(fetchMe).not.toHaveBeenCalled();
    expect(deps.swapAccessToken).toHaveBeenCalledWith(token);
    expect(deps.applyAuthUserAfterClaimsSync).toHaveBeenCalled();
  });

  it('ejecuta hydrateSessionCore cuando diff es FULL', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(priorToken);
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-99999999-9999-9999-9999-999999999999',
    });
    const fetchMe = vi.fn(async () => BASE_ME);
    const deps = createDeps(newToken, { hydrateOverrides: { fetchMe } });

    const result = await applyPostRefreshSession(
      { newToken, priorSnapshot: prior, currentUser: BASE_USER },
      deps,
    );

    expect(result.hydrationLevel).toBe('FULL');
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(deps.hydrateDeps.setAuthInitialized).not.toHaveBeenCalled();
    expect(deps.hydrateDeps.setIsBootstrapped).not.toHaveBeenCalled();
  });

  it('lanza error con token inválido en L1', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(priorToken);
    const deps = createDeps('invalid-token');

    await expect(
      applyPostRefreshSession(
        { newToken: 'invalid-token', priorSnapshot: prior, currentUser: BASE_USER },
        deps,
      ),
    ).rejects.toThrow('Invalid access token for claims sync');

    expect(deps.swapAccessToken).toHaveBeenCalledWith('invalid-token');
  });

  it('propaga excepción si hydrateSessionCore lanza', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(priorToken);
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-99999999-9999-9999-9999-999999999999',
    });
    const deps = createDeps(newToken, {
      hydrateOverrides: {
        fetchMe: async () => {
          throw new Error('hydrate failed');
        },
      },
    });

    await expect(
      applyPostRefreshSession(
        { newToken, priorSnapshot: prior, currentUser: BASE_USER },
        deps,
      ),
    ).rejects.toThrow('hydrate failed');
  });

  it('lanza error si hydrateSessionCore retorna null', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(priorToken);
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      user_type: 'tenant_admin',
    });
    const deps = createDeps(newToken, {
      hydrateOverrides: {
        fetchMe: async () => null,
      },
    });

    await expect(
      applyPostRefreshSession(
        { newToken, priorSnapshot: prior, currentUser: BASE_USER },
        deps,
      ),
    ).rejects.toThrow('Post-refresh full hydration failed');
  });

  it('invoca callbacks L1 syncEmpresaSession y syncImpersonationFromToken', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(token);
    const syncEmpresaSession = vi.fn();
    const syncImpersonationFromToken = vi.fn();
    const deps = createDeps(token, {
      claimsSyncCallbacks: { syncEmpresaSession, syncImpersonationFromToken },
    });

    await applyPostRefreshSession(
      { newToken: token, priorSnapshot: prior, currentUser: BASE_USER },
      deps,
    );

    expect(syncEmpresaSession).toHaveBeenCalledTimes(1);
    expect(syncImpersonationFromToken).toHaveBeenCalledTimes(1);
  });

  it('respeta orden de ejecución L0 → L1 → diff → L2', async () => {
    const priorToken = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(priorToken);
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });

    const order: string[] = [];
    const deps: ApplyPostRefreshSessionDeps = {
      swapAccessToken: () => {
        order.push('L0');
      },
      applyAuthUserAfterClaimsSync: () => {
        order.push('L1-auth');
      },
      hydrateDeps: createMinimalHydrateDeps(newToken, {
        fetchMe: async () => {
          order.push('L2-me');
          return BASE_ME;
        },
        updateAccessLevels: () => {
          order.push('L2-levels');
        },
      }),
    };

    await applyPostRefreshSession(
      { newToken, priorSnapshot: prior, currentUser: BASE_USER },
      deps,
    );

    expect(order.indexOf('L0')).toBeLessThan(order.indexOf('L1-auth'));
    expect(order.indexOf('L1-auth')).toBeLessThan(order.indexOf('L2-me'));
    expect(order).toContain('L2-me');
  });

  it('respeta orden L0 → L1 sin L2 en NONE', async () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildPriorSnapshot(token);
    const order: string[] = [];
    const fetchMe = vi.fn(async () => BASE_ME);

    const deps: ApplyPostRefreshSessionDeps = {
      swapAccessToken: () => order.push('L0'),
      applyAuthUserAfterClaimsSync: () => order.push('L1-auth'),
      hydrateDeps: createMinimalHydrateDeps(token, { fetchMe }),
    };

    await applyPostRefreshSession(
      { newToken: token, priorSnapshot: prior, currentUser: BASE_USER },
      deps,
    );

    expect(order).toEqual(['L0', 'L1-auth']);
    expect(fetchMe).not.toHaveBeenCalled();
  });
});
