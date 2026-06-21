import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AUTH_SYNC_EVENT_DEDUP_WINDOW_MS,
  AUTH_SYNC_REFRESHED_DEBOUNCE_MS,
  buildAuthSyncEnvelope,
  createAuthSyncTerminationEmitter,
  emitSessionRefreshedSync,
  getAuthSyncTabId,
  isInboundApplyActive,
  postAuthSyncEvent,
  registerInboundEventId,
  resetAuthSyncEmitStateForTests,
  resetAuthSyncTabIdForTests,
  runWithInboundApply,
} from '../session-auth-sync-emit';
import { sessionAuthSyncChannel } from '../session-auth-sync-channel';
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

describe('session-auth-sync-emit (IMPL-04)', () => {
  beforeEach(() => {
    resetAuthSyncEmitStateForTests();
    resetAuthSyncTabIdForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('buildAuthSyncEnvelope incluye v1, tabId y eventId', () => {
    const envelope = buildAuthSyncEnvelope('SESSION_LOGIN', {
      accessToken: 'token-a',
      claimsSnapshot: BASE_SNAPSHOT,
      empresaActivaId: 'empresa-1',
    });

    expect(envelope.v).toBe(1);
    expect(envelope.type).toBe('SESSION_LOGIN');
    expect(envelope.tabId).toBe(getAuthSyncTabId());
    expect(envelope.eventId.length).toBeGreaterThan(0);
  });

  it('R3 — no emite durante inbound apply', () => {
    const postSpy = vi.spyOn(sessionAuthSyncChannel, 'post').mockReturnValue(true);

    runWithInboundApply(() => {
      emitSessionRefreshedSync({
        accessToken: 'token-b',
        claimsSnapshot: BASE_SNAPSHOT,
        empresaActivaId: 'empresa-1',
      });
    });

    expect(postSpy).not.toHaveBeenCalled();
    expect(isInboundApplyActive()).toBe(false);
  });

  it('R2 — registerInboundEventId deduplica eventId', () => {
    const now = Date.now();
    expect(registerInboundEventId('evt-1', now)).toBe(true);
    expect(registerInboundEventId('evt-1', now)).toBe(false);
  });

  it('R2 — purga eventIds fuera de ventana', () => {
    const now = Date.now();
    registerInboundEventId('evt-old', now - AUTH_SYNC_EVENT_DEDUP_WINDOW_MS - 1);
    expect(registerInboundEventId('evt-old', now)).toBe(true);
  });

  it('R4 — debounce REFRESHED', () => {
    const postSpy = vi.spyOn(sessionAuthSyncChannel, 'post').mockReturnValue(true);
    const now = 1_000_000;

    postAuthSyncEvent(
      'SESSION_REFRESHED',
      {
        accessToken: 'token-1',
        claimsSnapshot: BASE_SNAPSHOT,
        empresaActivaId: 'empresa-1',
      },
      now,
    );

    postAuthSyncEvent(
      'SESSION_REFRESHED',
      {
        accessToken: 'token-2',
        claimsSnapshot: BASE_SNAPSHOT,
        empresaActivaId: 'empresa-1',
      },
      now + AUTH_SYNC_REFRESHED_DEBOUNCE_MS - 100,
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('createAuthSyncTerminationEmitter serializa SESSION_TERMINATED', () => {
    const postSpy = vi.spyOn(sessionAuthSyncChannel, 'post').mockReturnValue(true);
    const emit = createAuthSyncTerminationEmitter();

    emit({
      reason: 'MANUAL_LOGOUT',
      profile: {
        reason: 'MANUAL_LOGOUT',
        toastMessage: 'Sesión cerrada.',
        severity: 'info',
        redirectPath: '/login',
      },
      isSecurityTermination: false,
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const envelope = postSpy.mock.calls[0]?.[0];
    expect(envelope?.type).toBe('SESSION_TERMINATED');
    expect(envelope?.payload).toMatchObject({ reason: 'MANUAL_LOGOUT' });
  });
});
