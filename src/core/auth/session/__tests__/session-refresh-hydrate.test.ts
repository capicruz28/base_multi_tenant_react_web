import { describe, expect, it } from 'vitest';

import {
  mergeSessionUserFromMe,
  hydrateSessionCore,
  type HydrateSessionCoreDeps,
} from '../session-refresh-hydrate';
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

const BASE_ME: UserData = {
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

describe('mergeSessionUserFromMe', () => {
  it('combina /auth/me con claims JWT', () => {
    const token = createMockAccessToken({
      sub: 'user-11111111-1111-1111-1111-111111111111',
      cliente_id: 'client-22222222-2222-2222-2222-222222222222',
      empresa_id: 'empresa-99999999-9999-9999-9999-999999999999',
      es_admin_cliente: true,
      requires_password_change: true,
    });
    const result = mergeSessionUserFromMe(
      { ...BASE_ME, usuario_id: '', cliente_id: '', empresa_activa: null },
      token,
      null,
    );
    expect(result.usuario_id).toBe('user-11111111-1111-1111-1111-111111111111');
    expect(result.cliente_id).toBe('client-22222222-2222-2222-2222-222222222222');
    expect(result.empresa_activa).toBe('empresa-99999999-9999-9999-9999-999999999999');
    expect(result.es_admin_cliente).toBe(true);
    expect(result.requires_password_change).toBe(false);
  });

  it('usa tokenUser como fallback cuando usuario_id vacío y sin sub en claims', () => {
    const token = createMockAccessToken({ cliente_id: 'client-1' });
    const tokenUser: UserData = {
      ...BASE_ME,
      usuario_id: 'from-token-user',
      nombre_usuario: 'preserved',
    };
    const result = mergeSessionUserFromMe(
      { ...BASE_ME, usuario_id: '', nombre_usuario: 'from-me' },
      token,
      tokenUser,
    );
    expect(result.usuario_id).toBe('from-token-user');
    expect(result.nombre_usuario).toBe('from-me');
  });
});

describe('hydrateSessionCore', () => {
  it('omite bootstrap guard en modo interceptor', async () => {
    const token = createMockAccessToken({
      empresa_selection_pending: true,
      sub: 'user-1',
      cliente_id: 'client-1',
    });
    const fetchMe = async () => BASE_ME;
    const calls: string[] = [];

    const deps: HydrateSessionCoreDeps = {
      getToken: () => token,
      getTokenUser: () => null,
      setAuthUser: () => {
        calls.push('setAuthUser');
      },
      fetchMe,
      doLogout: async () => {
        calls.push('doLogout');
      },
      syncEmpresaSession: () => {
        calls.push('syncEmpresaSession');
      },
      syncImpersonationFromToken: () => {
        calls.push('syncImpersonation');
      },
      updateAccessLevels: () => {
        calls.push('updateAccessLevels');
      },
      loadMenuAndPermissionsFromAuthMenu: async () => {
        calls.push('loadMenu');
        return [];
      },
      loadEmpresasElegiblesForSession: async () => [],
      determineUserType: () => 'user',
      setRequiereSeleccionEmpresa: () => undefined,
      setMenuModulos: () => undefined,
      setPermissions: () => undefined,
      setMenuPermissionsReady: () => undefined,
      setEmpresasElegibles: () => undefined,
      setAuthInitialized: () => undefined,
      setIsBootstrapped: () => undefined,
      setSessionMenuSnapshot: () => undefined,
    };

    const result = await hydrateSessionCore({ mode: 'interceptor', skipBootstrapFlags: true }, deps);
    expect(result).not.toBeNull();
    expect(calls).toContain('setAuthUser');
    expect(calls).not.toContain('doLogout');
  });

  it('retorna null en bootstrap cuando token no es sesión completa', async () => {
    const token = createMockAccessToken({ empresa_selection_pending: true });
    const deps: HydrateSessionCoreDeps = {
      getToken: () => token,
      getTokenUser: () => null,
      setAuthUser: () => undefined,
      fetchMe: async () => BASE_ME,
      doLogout: async () => undefined,
      syncEmpresaSession: () => undefined,
      syncImpersonationFromToken: () => undefined,
      updateAccessLevels: () => undefined,
      loadMenuAndPermissionsFromAuthMenu: async () => null,
      loadEmpresasElegiblesForSession: async () => [],
      determineUserType: () => 'user',
      setRequiereSeleccionEmpresa: () => undefined,
      setMenuModulos: () => undefined,
      setPermissions: () => undefined,
      setMenuPermissionsReady: () => undefined,
      setEmpresasElegibles: () => undefined,
      setAuthInitialized: () => undefined,
      setIsBootstrapped: () => undefined,
      setSessionMenuSnapshot: () => undefined,
    };

    const result = await hydrateSessionCore({ mode: 'bootstrap' }, deps);
    expect(result).toBeNull();
  });
});
