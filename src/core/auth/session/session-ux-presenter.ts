/**
 * Orquestador Session UX Presentation — IAM-FE-PHASE-07 IMPL-06 (L7-B runtime bridge).
 * Sin React; coordina policy + runtime modal/redirect.
 */

import type { SessionTerminationUxProfile } from './session-termination-ux';
import {
  resolveSessionUxPresentation,
  shouldUseLegacyTerminationToast,
} from './session-ux-presenter.policy';
import type { SessionUxFlagsSnapshot } from './session-ux.flags';
import type { SessionExpiredDialogModel } from './session-ux.types';
import {
  clearPendingSessionUxRedirect,
  enqueueSessionUxModal,
  getLastSessionUxDeferRedirect,
  getPendingSessionUxRedirectPath,
  openSessionUxModal,
  setPendingSessionUxRedirect,
} from './session-ux-presenter.runtime';

export interface ExecuteSessionUxPresentationInput {
  readonly profile: SessionTerminationUxProfile;
  readonly backendDetail?: string;
  readonly erpDialogOpen?: boolean;
}

export interface SessionUxPresentationRuntimeDeps {
  readonly flags: SessionUxFlagsSnapshot;
  readonly legacyShowToast: (profile: SessionTerminationUxProfile) => void;
}

export interface SessionUxPresentationResult {
  readonly deferRedirect: boolean;
  readonly redirectPath: string;
}

function buildModalModel(
  profile: SessionTerminationUxProfile,
  message: string,
  redirectPath: string,
): SessionExpiredDialogModel {
  return {
    reason: profile.reason,
    message,
    severity: profile.severity,
    redirectPath,
  };
}

/** Detecta Dialog Radix ERP abierto (D-P2-05 — encolar modal). */
export function isErpDialogOpen(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.querySelector('[role="dialog"][data-state="open"]') !== null;
}

/**
 * Ejecuta presentación post-terminación.
 * UX-01: MODAL → no toast legacy paralelo.
 */
export function executeSessionUxPresentation(
  input: ExecuteSessionUxPresentationInput,
  deps: SessionUxPresentationRuntimeDeps,
): SessionUxPresentationResult {
  const decision = resolveSessionUxPresentation(
    {
      reason: input.profile.reason,
      profile: input.profile,
      backendDetail: input.backendDetail,
      erpDialogOpen: input.erpDialogOpen ?? isErpDialogOpen(),
    },
    deps.flags,
  );

  if (decision.channel === 'SILENT') {
    return { deferRedirect: false, redirectPath: decision.redirectPath };
  }

  if (shouldUseLegacyTerminationToast(decision)) {
    if (input.profile.toastMessage !== null) {
      deps.legacyShowToast(input.profile);
    }
    return { deferRedirect: false, redirectPath: decision.redirectPath };
  }

  const modalMessage = decision.modalMessage ?? input.profile.toastMessage;
  if (modalMessage === null) {
    return { deferRedirect: false, redirectPath: decision.redirectPath };
  }

  const modalModel = buildModalModel(
    input.profile,
    modalMessage,
    decision.redirectPath,
  );

  if (decision.queueModal) {
    enqueueSessionUxModal(modalModel);
  } else {
    openSessionUxModal(modalModel);
  }

  if (decision.deferRedirect) {
    setPendingSessionUxRedirect(decision.redirectPath);
  }

  return {
    deferRedirect: decision.deferRedirect,
    redirectPath: decision.redirectPath,
  };
}

/**
 * Wrapper redirect post-terminación (D-P1-01 invariante IMPL-09).
 * Si defer activo → no navega; ack modal dispara redirect.
 */
export function executeSessionUxRedirect(
  path: string,
  legacyRedirect: (path: string) => void,
): void {
  const shouldDefer = getLastSessionUxDeferRedirect();
  if (shouldDefer) {
    if (getPendingSessionUxRedirectPath() === null) {
      setPendingSessionUxRedirect(path);
    }
    return;
  }
  clearPendingSessionUxRedirect();
  legacyRedirect(path);
}

/** Invocado desde SessionExpiredDialog al confirmar. */
export function acknowledgeSessionUxModal(
  legacyRedirect: (path: string) => void,
): void {
  const path = clearPendingSessionUxRedirect();
  if (path) {
    legacyRedirect(path);
  }
}
