/**
 * Política presenter Session UX — IAM-FE-PHASE-07 IMPL-03 (L7-B).
 * Pura: sin React, router ni toast.
 */

import type { SessionTerminationReason } from './session-termination-reason';
import type { SessionUxFlagsSnapshot } from './session-ux.flags';
import {
  detectSessionLimitFromSignals,
  resolveSessionLimitRedirectPath,
  resolveSessionLimitUxMessage,
} from './session-limit-ux.policy';
import type {
  SessionUxPresentationChannel,
  SessionUxPresentationDecision,
  SessionUxPresenterInput,
} from './session-ux.types';

const MODAL_ELIGIBLE_REASONS: ReadonlySet<SessionTerminationReason> = new Set([
  'SESSION_EXPIRED',
  'REFRESH_UNAUTHORIZED',
  'TOKEN_REUSE',
  'IDLE_TIMEOUT',
  'REFRESH_REVOKED',
  'ABSOLUTE_EXPIRY',
  'HYDRATE_FAILED',
  'BOOTSTRAP_FAILED',
  'REFRESH_INVALID',
  'SELECTION_INVALID',
  'UNKNOWN',
]);

/**
 * UX-03 — IMPERSONATION_END siempre toast-only; bypass modal incondicional.
 * UX-06 — copy limit permitido solo vía override presenter (session-limit-ux.policy).
 */
export function resolveSessionUxPresentationChannel(
  reason: SessionTerminationReason,
  flags: SessionUxFlagsSnapshot,
): SessionUxPresentationChannel {
  if (reason === 'SILENT_CLEANUP') {
    return 'SILENT';
  }

  if (reason === 'IMPERSONATION_END' || reason === 'MANUAL_LOGOUT') {
    return 'TOAST_ONLY';
  }

  if (!flags.masterEnabled || !flags.modalEnabled) {
    return 'TOAST_ONLY';
  }

  if (!MODAL_ELIGIBLE_REASONS.has(reason)) {
    return 'TOAST_ONLY';
  }

  return 'MODAL';
}

function applySessionLimitOverrides(
  input: SessionUxPresenterInput,
  flags: SessionUxFlagsSnapshot,
  baseDecision: Omit<SessionUxPresentationDecision, 'queueModal'>,
): SessionUxPresentationDecision {
  const isSessionLimit = detectSessionLimitFromSignals({
    detail: input.backendDetail,
    reason: input.reason,
  });

  if (!isSessionLimit || !flags.masterEnabled || !flags.limitFeedbackEnabled) {
    return {
      ...baseDecision,
      queueModal: Boolean(input.erpDialogOpen && baseDecision.channel === 'MODAL'),
    };
  }

  const limitMessage = resolveSessionLimitUxMessage();
  const limitRedirectPath = resolveSessionLimitRedirectPath();

  return {
    ...baseDecision,
    modalMessage: limitMessage,
    redirectPath: limitRedirectPath,
    loginQueryParam: 'limit',
    queueModal: Boolean(input.erpDialogOpen && baseDecision.channel === 'MODAL'),
  };
}

/**
 * Resuelve decisión completa de presentación post-terminación.
 * UX-01: canal MODAL implica deferRedirect=true (redirect post-ack).
 */
export function resolveSessionUxPresentation(
  input: SessionUxPresenterInput,
  flags: SessionUxFlagsSnapshot,
): SessionUxPresentationDecision {
  const channel = resolveSessionUxPresentationChannel(input.reason, flags);
  const deferRedirect = channel === 'MODAL';

  const baseDecision: Omit<SessionUxPresentationDecision, 'queueModal'> = {
    channel,
    profile: input.profile,
    modalMessage:
      channel === 'MODAL' ? input.profile.toastMessage : null,
    redirectPath: input.profile.redirectPath,
    ...(input.profile.loginQueryParam !== undefined
      ? { loginQueryParam: input.profile.loginQueryParam }
      : {}),
    deferRedirect,
  };

  return applySessionLimitOverrides(input, flags, baseDecision);
}

/** true si el canal requiere toast legacy (rollback / IMPERSONATION_END). */
export function shouldUseLegacyTerminationToast(
  decision: SessionUxPresentationDecision,
): boolean {
  return decision.channel === 'TOAST_ONLY';
}

/** Prioridad terminación sobre Dialog ERP abierto — encolar modal. */
export function shouldQueueSessionUxModal(
  decision: SessionUxPresentationDecision,
): boolean {
  return decision.queueModal;
}
