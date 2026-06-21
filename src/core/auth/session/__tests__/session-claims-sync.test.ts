import { describe, expect, it, vi } from 'vitest';

import {
  applyClaimsSync,
  type ClaimsSyncMergeableUser,
} from '../session-claims-sync';

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

const BASE_USER: ClaimsSyncMergeableUser = {
  usuario_id: 'user-11111111-1111-1111-1111-111111111111',
  cliente_id: 'client-22222222-2222-2222-2222-222222222222',
  user_type: 'user',
  empresa_activa: 'empresa-33333333-3333-3333-3333-333333333333',
  es_admin_cliente: false,
  requires_password_change: false,
  nombre_usuario: 'jdoe',
  roles: ['operativo'],
};

const BASE_CLAIMS = {
  sub: 'user-11111111-1111-1111-1111-111111111111',
  cliente_id: 'client-22222222-2222-2222-2222-222222222222',
  empresa_id: 'empresa-33333333-3333-3333-3333-333333333333',
  user_type: 'user',
  es_admin_cliente: false,
  requires_password_change: false,
  empresa_selection_pending: false,
  is_impersonation: false,
} as const;

describe('applyClaimsSync', () => {
  it('sincroniza requires_password_change desde claims', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      requires_password_change: true,
    });
    const result = applyClaimsSync({ newToken: token, currentUser: BASE_USER });
    expect(result.userPatch?.requires_password_change).toBe(true);
    expect(result.mergedUser?.requires_password_change).toBe(true);
  });

  it('sincroniza empresa_id (empresaActivaId) priorizando claim JWT', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      empresa_id: 'empresa-99999999-9999-9999-9999-999999999999',
    });
    const result = applyClaimsSync({
      newToken: token,
      currentUser: {
        ...BASE_USER,
        empresa_activa: 'empresa-33333333-3333-3333-3333-333333333333',
      },
    });
    expect(result.empresaActivaId).toBe('empresa-99999999-9999-9999-9999-999999999999');
    expect(result.mergedUser?.empresa_activa).toBe(
      'empresa-99999999-9999-9999-9999-999999999999',
    );
  });

  it('sincroniza user_type desde claims', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      user_type: 'tenant_admin',
    });
    const result = applyClaimsSync({ newToken: token, currentUser: BASE_USER });
    expect(result.userPatch?.user_type).toBe('tenant_admin');
    expect(result.mergedUser?.user_type).toBe('tenant_admin');
  });

  it('sincroniza flags de impersonación', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      is_impersonation: true,
      impersonated_by: 'admin-uuid',
      impersonated_by_username: 'platform.admin',
    });
    const result = applyClaimsSync({ newToken: token, currentUser: BASE_USER });
    expect(result.isImpersonation).toBe(true);
    expect(result.impersonatedBy).toBe('admin-uuid');
    expect(result.impersonatedByUsername).toBe('platform.admin');
  });

  it('limpia impersonación cuando el claim es false', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      is_impersonation: false,
    });
    const result = applyClaimsSync({ newToken: token, currentUser: BASE_USER });
    expect(result.isImpersonation).toBe(false);
    expect(result.impersonatedBy).toBeNull();
    expect(result.impersonatedByUsername).toBeNull();
  });

  it('sincroniza empresa_selection_pending', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      empresa_selection_pending: true,
    });
    const result = applyClaimsSync({ newToken: token, currentUser: BASE_USER });
    expect(result.requiereSeleccionEmpresa).toBe(true);
  });

  it('sincroniza es_admin_cliente con lógica OR user/claims', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      es_admin_cliente: true,
    });
    const result = applyClaimsSync({
      newToken: token,
      currentUser: { ...BASE_USER, es_admin_cliente: false },
    });
    expect(result.esAdminCliente).toBe(true);
    expect(result.mergedUser?.es_admin_cliente).toBe(true);
  });

  it('mantiene es_admin_cliente true si user ya era admin aunque claim sea false', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      es_admin_cliente: false,
    });
    const result = applyClaimsSync({
      newToken: token,
      currentUser: { ...BASE_USER, es_admin_cliente: true },
    });
    expect(result.esAdminCliente).toBe(true);
    expect(result.mergedUser?.es_admin_cliente).toBe(true);
  });

  it('con user null retorna mergedUser null y estado derivado de claims', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      empresa_id: 'empresa-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      empresa_selection_pending: true,
    });
    const result = applyClaimsSync({ newToken: token, currentUser: null });
    expect(result.mergedUser).toBeNull();
    expect(result.userPatch).toBeNull();
    expect(result.empresaActivaId).toBe('empresa-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(result.requiereSeleccionEmpresa).toBe(true);
    expect(result.esAdminCliente).toBe(false);
  });

  it('hace merge parcial preservando campos no sincronizados del user', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      requires_password_change: true,
    });
    const result = applyClaimsSync({ newToken: token, currentUser: BASE_USER });
    expect(result.mergedUser?.nombre_usuario).toBe('jdoe');
    expect(result.mergedUser?.roles).toEqual(['operativo']);
    expect(result.mergedUser?.requires_password_change).toBe(true);
  });

  it('no muta el objeto currentUser (inmutabilidad)', () => {
    const user = { ...BASE_USER, requires_password_change: false };
    const frozen = JSON.parse(JSON.stringify(user)) as ClaimsSyncMergeableUser;
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      requires_password_change: true,
      empresa_id: 'empresa-nueva',
    });
    applyClaimsSync({ newToken: token, currentUser: user });
    expect(user).toEqual(frozen);
  });

  it('es idempotente con mismas entradas', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      requires_password_change: true,
    });
    const input = { newToken: token, currentUser: BASE_USER };
    const first = applyClaimsSync(input);
    const second = applyClaimsSync(input);
    expect(second).toEqual(first);
  });

  it('funciona sin callbacks definidos', () => {
    const token = createMockAccessToken(BASE_CLAIMS);
    expect(() =>
      applyClaimsSync({ newToken: token, currentUser: BASE_USER }),
    ).not.toThrow();
  });

  it('invoca syncEmpresaSession cuando está definido', () => {
    const token = createMockAccessToken(BASE_CLAIMS);
    const syncEmpresaSession = vi.fn();
    applyClaimsSync(
      { newToken: token, currentUser: BASE_USER },
      { syncEmpresaSession },
    );
    expect(syncEmpresaSession).toHaveBeenCalledTimes(1);
    expect(syncEmpresaSession).toHaveBeenCalledWith(
      expect.objectContaining({ usuario_id: BASE_USER.usuario_id }),
      token,
    );
  });

  it('invoca syncImpersonationFromToken cuando está definido', () => {
    const token = createMockAccessToken({
      ...BASE_CLAIMS,
      is_impersonation: true,
      impersonated_by: 'admin-1',
    });
    const syncImpersonationFromToken = vi.fn();
    applyClaimsSync(
      { newToken: token, currentUser: BASE_USER },
      { syncImpersonationFromToken },
    );
    expect(syncImpersonationFromToken).toHaveBeenCalledTimes(1);
    expect(syncImpersonationFromToken).toHaveBeenCalledWith(token);
  });

  it('propaga excepción si syncEmpresaSession lanza', () => {
    const token = createMockAccessToken(BASE_CLAIMS);
    const syncEmpresaSession = vi.fn(() => {
      throw new Error('sync empresa failed');
    });
    expect(() =>
      applyClaimsSync(
        { newToken: token, currentUser: BASE_USER },
        { syncEmpresaSession },
      ),
    ).toThrow('sync empresa failed');
  });

  it('propaga excepción si syncImpersonationFromToken lanza', () => {
    const token = createMockAccessToken(BASE_CLAIMS);
    const syncImpersonationFromToken = vi.fn(() => {
      throw new Error('sync impersonation failed');
    });
    expect(() =>
      applyClaimsSync(
        { newToken: token, currentUser: BASE_USER },
        { syncImpersonationFromToken },
      ),
    ).toThrow('sync impersonation failed');
  });

  it('lanza error con token inválido', () => {
    expect(() =>
      applyClaimsSync({ newToken: 'invalid', currentUser: BASE_USER }),
    ).toThrow('Invalid access token for claims sync');
  });
});
