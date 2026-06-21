import { describe, expect, it } from 'vitest';

import {
  buildSessionClaimsSnapshot,
  normalizeSessionId,
  type SessionClaimsSnapshot,
  type SessionSnapshotUserInput,
} from '../session-claims-snapshot';
import { resolveHydrationLevel } from '../session-refresh-diff';

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
  exp: 4_102_444_800,
  iat: 4_102_358_400,
} as const;

const BASE_USER: SessionSnapshotUserInput = {
  usuario_id: 'user-11111111-1111-1111-1111-111111111111',
  cliente_id: 'client-22222222-2222-2222-2222-222222222222',
  user_type: 'user',
  empresa_activa: 'empresa-33333333-3333-3333-3333-333333333333',
  es_admin_cliente: false,
  requires_password_change: false,
};

function buildPriorSnapshot(
  overrides?: Partial<SessionSnapshotUserInput>,
  empresaActivaId?: string | null,
): SessionClaimsSnapshot {
  const token = createMockAccessToken({ ...BASE_PAYLOAD });
  return buildSessionClaimsSnapshot(
    token,
    { ...BASE_USER, ...overrides },
    empresaActivaId ?? BASE_USER.empresa_activa ?? null,
  );
}

describe('normalizeSessionId', () => {
  it('retorna null para null, undefined y strings vacíos', () => {
    expect(normalizeSessionId(null)).toBeNull();
    expect(normalizeSessionId(undefined)).toBeNull();
    expect(normalizeSessionId('')).toBeNull();
    expect(normalizeSessionId('   ')).toBeNull();
  });

  it('recorta y conserva UUID válido', () => {
    expect(normalizeSessionId('  abc-123  ')).toBe('abc-123');
  });
});

describe('buildSessionClaimsSnapshot', () => {
  it('prioriza empresaActivaId sobre user.empresa_activa y JWT', () => {
    const token = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-from-jwt',
    });
    const snapshot = buildSessionClaimsSnapshot(
      token,
      { ...BASE_USER, empresa_activa: 'empresa-from-user' },
      'empresa-from-state',
    );
    expect(snapshot.empresaId).toBe('empresa-from-state');
  });

  it('marca hasUser=false cuando user es null', () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const snapshot = buildSessionClaimsSnapshot(token, null, BASE_USER.empresa_activa ?? null);
    expect(snapshot.hasUser).toBe(false);
    expect(snapshot.usuarioId).toBe(BASE_PAYLOAD.sub);
  });

  it('construye snapshot con token inválido usando solo user y empresaActivaId', () => {
    const snapshot = buildSessionClaimsSnapshot(
      'not-a-jwt',
      BASE_USER,
      BASE_USER.empresa_activa ?? null,
    );
    expect(snapshot.hasUser).toBe(true);
    expect(snapshot.empresaId).toBe(BASE_USER.empresa_activa);
    expect(snapshot.usuarioId).toBe(BASE_USER.usuario_id);
    expect(snapshot.clienteId).toBe(BASE_USER.cliente_id);
    expect(snapshot.selectionPending).toBe(false);
    expect(snapshot.isImpersonation).toBe(false);
  });

  it('lee flags booleanos string desde JWT cuando user no los define', () => {
    const token = createMockAccessToken({
      ...BASE_PAYLOAD,
      requires_password_change: 'true',
      es_admin_cliente: '1',
      is_impersonation: 'true',
    });
    const snapshot = buildSessionClaimsSnapshot(
      token,
      { usuario_id: BASE_USER.usuario_id },
      null,
    );
    expect(snapshot.requiresPasswordChange).toBe(true);
    expect(snapshot.esAdminCliente).toBe(true);
    expect(snapshot.isImpersonation).toBe(true);
  });
});

describe('resolveHydrationLevel', () => {
  it('retorna NONE cuando solo cambian exp/iat y el contexto es idéntico', () => {
    const prior = buildPriorSnapshot();
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      exp: 4_102_531_200,
      iat: 4_102_444_800,
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('NONE');
  });

  it('retorna FULL cuando empresa_id del nuevo JWT difiere del snapshot', () => {
    const prior = buildPriorSnapshot();
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-99999999-9999-9999-9999-999999999999',
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna FULL cuando cliente_id del nuevo JWT difiere del snapshot', () => {
    const prior = buildPriorSnapshot();
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      cliente_id: 'client-99999999-9999-9999-9999-999999999999',
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna FULL cuando sub del nuevo JWT difiere del snapshot', () => {
    const prior = buildPriorSnapshot();
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      sub: 'user-99999999-9999-9999-9999-999999999999',
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna FULL cuando user_type del nuevo JWT difiere del snapshot', () => {
    const prior = buildPriorSnapshot();
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      user_type: 'tenant_admin',
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna FULL cuando requires_password_change pasa de false a true', () => {
    const prior = buildPriorSnapshot({ requires_password_change: false });
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      requires_password_change: true,
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna NONE cuando requires_password_change pasa de true a false', () => {
    const prior = buildPriorSnapshot({ requires_password_change: true });
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      requires_password_change: false,
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('NONE');
  });

  it('retorna FULL cuando is_impersonation cambia en el nuevo JWT', () => {
    const prior = buildPriorSnapshot();
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      is_impersonation: true,
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna FULL cuando empresa_selection_pending es true en el nuevo JWT', () => {
    const prior = buildPriorSnapshot();
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_selection_pending: true,
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna FULL cuando prior.hasUser es false (user null pre-refresh)', () => {
    const token = createMockAccessToken({ ...BASE_PAYLOAD });
    const prior = buildSessionClaimsSnapshot(token, null, BASE_USER.empresa_activa ?? null);
    const newToken = createMockAccessToken({ ...BASE_PAYLOAD, exp: 4_102_531_200 });
    expect(prior.hasUser).toBe(false);
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });

  it('retorna FULL cuando el nuevo token es inválido', () => {
    const prior = buildPriorSnapshot();
    expect(resolveHydrationLevel(prior, 'invalid-token')).toBe('FULL');
  });

  it('normaliza UUID con espacios al comparar empresa_id', () => {
    const prior = buildPriorSnapshot({}, 'empresa-33333333-3333-3333-3333-333333333333');
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: '  empresa-33333333-3333-3333-3333-333333333333  ',
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('NONE');
  });

  it('retorna FULL cuando empresaActivaId del snapshot difiere del claim aunque user.empresa_activa coincida', () => {
    const token = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    const prior = buildSessionClaimsSnapshot(
      token,
      {
        ...BASE_USER,
        empresa_activa: 'empresa-33333333-3333-3333-3333-333333333333',
      },
      'empresa-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
    const newToken = createMockAccessToken({
      ...BASE_PAYLOAD,
      empresa_id: 'empresa-33333333-3333-3333-3333-333333333333',
    });
    expect(resolveHydrationLevel(prior, newToken)).toBe('FULL');
  });
});
