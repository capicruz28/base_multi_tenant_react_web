import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';

import { applySelectionSyncFromEnvelope, emitSelectionSyncFromResponse } from '../session-auth-sync-selection';
import { sessionAuthSyncChannel } from '../session-auth-sync-channel';
import { AUTH_SYNC_PROTOCOL_VERSION } from '../session-auth-sync.types';
import { resetAuthSyncEmitStateForTests, resetAuthSyncTabIdForTests } from '../session-auth-sync-emit';

describe('session-auth-sync-selection (IMPL-11)', () => {
  beforeEach(() => {
    resetAuthSyncEmitStateForTests();
    resetAuthSyncTabIdForTests();
    useEmpresaSelectionStore.getState().clearPendingSelection();
  });

  it('V4.5 — emitSelectionSyncFromResponse publica SELECTION_SYNC', () => {
    const postSpy = vi.spyOn(sessionAuthSyncChannel, 'post').mockReturnValue(true);

    emitSelectionSyncFromResponse({
      requiere_seleccion_empresa: true,
      selection_token: 'sel-token',
      empresas_disponibles: [{ empresa_id: 'e1', razon_social: 'Acme', nombre_comercial: null }],
      user_data: null,
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0]?.[0]?.type).toBe('SELECTION_SYNC');
  });

  it('applySelectionSyncFromEnvelope actualiza store local', () => {
    applySelectionSyncFromEnvelope({
      v: AUTH_SYNC_PROTOCOL_VERSION,
      eventId: 'evt-sel-1',
      tabId: 'other-tab',
      type: 'SELECTION_SYNC',
      issuedAtMs: Date.now(),
      payload: {
        selectionToken: 'sel-token',
        empresasDisponibles: [{ empresa_id: 'e1', razon_social: 'Acme', nombre_comercial: null }],
        userPreview: null,
        cleared: false,
      },
    });

    expect(useEmpresaSelectionStore.getState().selectionToken).toBe('sel-token');
    expect(useEmpresaSelectionStore.getState().hasPendingSelection()).toBe(true);
  });

  it('applySelectionSyncFromEnvelope cleared limpia store', () => {
    useEmpresaSelectionStore.getState().setPendingSelection({
      requiere_seleccion_empresa: true,
      selection_token: 'old',
      empresas_disponibles: [],
    });

    applySelectionSyncFromEnvelope({
      v: AUTH_SYNC_PROTOCOL_VERSION,
      eventId: 'evt-sel-2',
      tabId: 'other-tab',
      type: 'SELECTION_SYNC',
      issuedAtMs: Date.now(),
      payload: {
        selectionToken: null,
        empresasDisponibles: [],
        userPreview: null,
        cleared: true,
      },
    });

    expect(useEmpresaSelectionStore.getState().hasPendingSelection()).toBe(false);
  });
});
