import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  applyInboundAuthSyncEvent,
  markAuthSyncTerminationApplied,
  resetAuthSyncApplyStateForTests,
  shouldSkipProbeAfterAuthSyncTermination,
  AUTH_SYNC_TERMINATION_PROBE_SKIP_MS,
} from '../session-auth-sync-apply';
import {
  getAuthSyncTabId,
  resetAuthSyncEmitStateForTests,
  resetAuthSyncTabIdForTests,
} from '../session-auth-sync-emit';
import { AUTH_SYNC_PROTOCOL_VERSION } from '../session-auth-sync.types';
import type { SessionClaimsSnapshot } from '../session-claims-snapshot';

const BASE_SNAPSHOT: SessionClaimsSnapshot = {
  empresaId: 'empresa-1',
  clienteId: 'cliente-1',
  usuarioId: 'user-1',
  userType: 'user',
  esAdminCliente: false,
  requiresPasswordChange: false,
  selectionPending: false,
  isImpersonation: false,
  hasUser: true,
};

function createEnvelope<T extends 'SESSION_REFRESHED' | 'SESSION_TERMINATED'>(
  type: T,
  payload: T extends 'SESSION_REFRESHED'
    ? { accessToken: string; claimsSnapshot: SessionClaimsSnapshot; empresaActivaId: string | null }
    : { reason: 'MANUAL_LOGOUT'; redirectPath?: string },
  tabId = 'other-tab',
) {
  return {
    v: AUTH_SYNC_PROTOCOL_VERSION,
    eventId: `evt-${Math.random()}`,
    tabId,
    type,
    issuedAtMs: Date.now(),
    payload,
  } as const;
}

describe('session-auth-sync-apply (IMPL-05)', () => {
  beforeEach(() => {
    resetAuthSyncApplyStateForTests();
    resetAuthSyncEmitStateForTests();
    resetAuthSyncTabIdForTests();
  });

  it('R1 — ignora mensajes con tabId propio', async () => {
    const runPostRefresh = vi.fn();
    const selfTab = getAuthSyncTabId();

    await applyInboundAuthSyncEvent(
      createEnvelope('SESSION_REFRESHED', {
        accessToken: 'new-token',
        claimsSnapshot: BASE_SNAPSHOT,
        empresaActivaId: 'empresa-1',
      }, selfTab),
      {
        getCurrentAccessToken: () => 'old-token',
        getIsTerminating: () => false,
        clearRefreshingPromise: vi.fn(),
        buildPriorSnapshot: () => BASE_SNAPSHOT,
        runPostRefreshFromSync: runPostRefresh,
        applyFullSessionFromSync: vi.fn(),
        runTerminateFromSync: vi.fn(),
        applySelectionFromSync: vi.fn(),
        invalidateModulesAfterEmpresaChange: vi.fn(),
      },
    );

    expect(runPostRefresh).not.toHaveBeenCalled();
  });

  it('R5 — ignora REFRESHED si accessToken igual al actual', async () => {
    const runPostRefresh = vi.fn();

    await applyInboundAuthSyncEvent(
      createEnvelope('SESSION_REFRESHED', {
        accessToken: 'same-token',
        claimsSnapshot: BASE_SNAPSHOT,
        empresaActivaId: 'empresa-1',
      }),
      {
        getCurrentAccessToken: () => 'same-token',
        getIsTerminating: () => false,
        clearRefreshingPromise: vi.fn(),
        buildPriorSnapshot: () => BASE_SNAPSHOT,
        runPostRefreshFromSync: runPostRefresh,
        applyFullSessionFromSync: vi.fn(),
        runTerminateFromSync: vi.fn(),
        applySelectionFromSync: vi.fn(),
        invalidateModulesAfterEmpresaChange: vi.fn(),
      },
    );

    expect(runPostRefresh).not.toHaveBeenCalled();
  });

  it('V4.2 — SESSION_TERMINATED aplica terminate callServer false', async () => {
    const runTerminate = vi.fn();
    const clearRefresh = vi.fn();

    await applyInboundAuthSyncEvent(
      createEnvelope('SESSION_TERMINATED', { reason: 'MANUAL_LOGOUT' }),
      {
        getCurrentAccessToken: () => 'token',
        getIsTerminating: () => false,
        clearRefreshingPromise: clearRefresh,
        buildPriorSnapshot: () => BASE_SNAPSHOT,
        runPostRefreshFromSync: vi.fn(),
        applyFullSessionFromSync: vi.fn(),
        runTerminateFromSync: runTerminate,
        applySelectionFromSync: vi.fn(),
        invalidateModulesAfterEmpresaChange: vi.fn(),
      },
    );

    expect(runTerminate).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'MANUAL_LOGOUT' }),
    );
  });

  it('V4.4 — REFRESHED aborta refresh local antes de aplicar token leader', async () => {
    const clearRefresh = vi.fn();
    const runPostRefresh = vi.fn().mockResolvedValue(undefined);

    await applyInboundAuthSyncEvent(
      createEnvelope('SESSION_REFRESHED', {
        accessToken: 'leader-token',
        claimsSnapshot: BASE_SNAPSHOT,
        empresaActivaId: 'empresa-1',
      }),
      {
        getCurrentAccessToken: () => 'stale-token',
        getIsTerminating: () => false,
        clearRefreshingPromise: clearRefresh,
        buildPriorSnapshot: () => BASE_SNAPSHOT,
        runPostRefreshFromSync: runPostRefresh,
        applyFullSessionFromSync: vi.fn(),
        runTerminateFromSync: vi.fn(),
        applySelectionFromSync: vi.fn(),
        invalidateModulesAfterEmpresaChange: vi.fn(),
      },
    );

    expect(clearRefresh).toHaveBeenCalled();
    expect(runPostRefresh).toHaveBeenCalledWith('leader-token', BASE_SNAPSHOT);
  });

  it('IMPL-12 — shouldSkipProbeAfterAuthSyncTermination dentro de ventana', () => {
    const now = 50_000;
    markAuthSyncTerminationApplied(now - 2_000);
    expect(shouldSkipProbeAfterAuthSyncTermination(now)).toBe(true);
    expect(
      shouldSkipProbeAfterAuthSyncTermination(now + AUTH_SYNC_TERMINATION_PROBE_SKIP_MS),
    ).toBe(false);
  });
});
