/**
 * Selection store sync Schema A — IAM-FE-PHASE-04 IMPL-11 (GAP-P2-04).
 */

import type { LoginEmpresaSelectionResponse } from '@/features/auth/types/auth.types';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';

import {
  SESSION_AUTH_SYNC_SELECTION_ENABLED,
  SESSION_AUTH_SYNC_V4_ENABLED,
} from './session-auth-sync.flags';
import { postAuthSyncEvent } from './session-auth-sync-emit';
import type { AuthSyncEnvelope, AuthSyncSelectionSyncPayload } from './session-auth-sync.types';

export function isSelectionSyncEffective(): boolean {
  return SESSION_AUTH_SYNC_V4_ENABLED && SESSION_AUTH_SYNC_SELECTION_ENABLED;
}

function buildSelectionPayloadFromStore(): AuthSyncSelectionSyncPayload {
  const state = useEmpresaSelectionStore.getState();

  if (!state.hasPendingSelection()) {
    return {
      selectionToken: null,
      empresasDisponibles: [],
      userPreview: null,
      cleared: true,
    };
  }

  return {
    selectionToken: state.selectionToken,
    empresasDisponibles: state.empresasDisponibles,
    userPreview: state.userPreview as Record<string, unknown> | null,
    cleared: false,
  };
}

/** Emite snapshot selection tras setPendingSelection local. */
export function emitSelectionSyncFromResponse(
  response: LoginEmpresaSelectionResponse,
): boolean {
  if (!isSelectionSyncEffective()) {
    return false;
  }

  return postAuthSyncEvent('SELECTION_SYNC', {
    selectionToken: response.selection_token,
    empresasDisponibles: response.empresas_disponibles ?? [],
    userPreview: (response.user_data ?? null) as Record<string, unknown> | null,
    cleared: false,
  });
}

/** Emite limpieza selection (clearPendingSelection local). */
export function emitSelectionSyncCleared(): boolean {
  if (!isSelectionSyncEffective()) {
    return false;
  }

  return postAuthSyncEvent('SELECTION_SYNC', {
    selectionToken: null,
    empresasDisponibles: [],
    userPreview: null,
    cleared: true,
  });
}

/** Emite estado actual del store (reconciliación). */
export function emitSelectionSyncFromStore(): boolean {
  if (!isSelectionSyncEffective()) {
    return false;
  }

  return postAuthSyncEvent('SELECTION_SYNC', buildSelectionPayloadFromStore());
}

/** Aplica payload SELECTION_SYNC en pestaña seguidora. */
export function applySelectionSyncFromEnvelope(
  envelope: AuthSyncEnvelope<'SELECTION_SYNC'>,
): void {
  if (!isSelectionSyncEffective()) {
    return;
  }

  const { payload } = envelope;

  if (payload.cleared || !payload.selectionToken?.trim()) {
    useEmpresaSelectionStore.getState().clearPendingSelection();
    return;
  }

  useEmpresaSelectionStore.getState().setPendingSelection({
    requiere_seleccion_empresa: true,
    selection_token: payload.selectionToken,
    empresas_disponibles: [...payload.empresasDisponibles],
    user_data: payload.userPreview as LoginEmpresaSelectionResponse['user_data'],
  });
}
