import type { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import type { SessionClaimsSnapshot } from '../session-claims-snapshot';
import {
  applyPostRefreshRqInvalidation,
  resolvePostRefreshRqAction,
} from '../session-rq-invalidation';

const PRIOR_SNAPSHOT: SessionClaimsSnapshot = {
  empresaId: 'empresa-11111111-1111-1111-1111-111111111111',
  clienteId: 'client-22222222-2222-2222-2222-222222222222',
  usuarioId: 'user-33333333-3333-3333-3333-333333333333',
  userType: 'user',
  esAdminCliente: false,
  requiresPasswordChange: false,
  selectionPending: false,
  isImpersonation: false,
  hasUser: true,
};

function createMockQueryClient(): QueryClient {
  return {
    clear: vi.fn(),
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
  } as unknown as QueryClient;
}

describe('resolvePostRefreshRqAction', () => {
  it('NONE → ninguna invalidación', () => {
    expect(
      resolvePostRefreshRqAction(PRIOR_SNAPSHOT, 'NONE', {
        empresaId: 'empresa-changed',
        clienteId: 'client-changed',
      }),
    ).toBe('none');
  });

  it('FULL solo cambio empresa → org-inv', () => {
    expect(
      resolvePostRefreshRqAction(PRIOR_SNAPSHOT, 'FULL', {
        empresaId: 'empresa-99999999-9999-9999-9999-999999999999',
        clienteId: PRIOR_SNAPSHOT.clienteId,
      }),
    ).toBe('org-inv');
  });

  it('FULL cambio tenant → clear-all', () => {
    expect(
      resolvePostRefreshRqAction(PRIOR_SNAPSHOT, 'FULL', {
        empresaId: PRIOR_SNAPSHOT.empresaId,
        clienteId: 'client-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      }),
    ).toBe('clear-all');
  });

  it('FULL cambio empresa y tenant → clear-all (prioridad tenant)', () => {
    expect(
      resolvePostRefreshRqAction(PRIOR_SNAPSHOT, 'FULL', {
        empresaId: 'empresa-99999999-9999-9999-9999-999999999999',
        clienteId: 'client-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      }),
    ).toBe('clear-all');
  });

  it('FULL sin cambio empresa ni tenant → none', () => {
    expect(
      resolvePostRefreshRqAction(PRIOR_SNAPSHOT, 'FULL', {
        empresaId: PRIOR_SNAPSHOT.empresaId,
        clienteId: PRIOR_SNAPSHOT.clienteId,
      }),
    ).toBe('none');
  });
});

describe('applyPostRefreshRqInvalidation', () => {
  it('none no invoca clear ni invalidate', () => {
    const queryClient = createMockQueryClient();
    applyPostRefreshRqInvalidation('none', queryClient);
    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('org-inv invalida ORG e INV sin clear', () => {
    const queryClient = createMockQueryClient();
    applyPostRefreshRqInvalidation('org-inv', queryClient);
    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('clear-all ejecuta queryClient.clear() únicamente', () => {
    const queryClient = createMockQueryClient();
    applyPostRefreshRqInvalidation('clear-all', queryClient);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});
