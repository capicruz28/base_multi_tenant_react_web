/**
 * Runtime bridge Session UX — conecta presenter puro con React modal.
 * IMPL-06 / IMPL-09 — D-P1-01 deferred redirect.
 */

import type { SessionExpiredDialogModel } from './session-ux.types';

export type SessionUxModalListener = (model: SessionExpiredDialogModel | null) => void;

let modalListener: SessionUxModalListener | null = null;
let pendingRedirectPath: string | null = null;
let deferRedirectActive = false;
const modalQueue: SessionExpiredDialogModel[] = [];

export function registerSessionUxModalListener(
  listener: SessionUxModalListener,
): () => void {
  modalListener = listener;
  return () => {
    if (modalListener === listener) {
      modalListener = null;
    }
  };
}

export function openSessionUxModal(model: SessionExpiredDialogModel): void {
  deferRedirectActive = true;
  modalListener?.(model);
}

export function enqueueSessionUxModal(model: SessionExpiredDialogModel): void {
  modalQueue.push(model);
}

export function drainSessionUxModalQueue(): SessionExpiredDialogModel | null {
  if (modalQueue.length === 0) {
    return null;
  }
  const next = modalQueue.shift() ?? null;
  if (next) {
    openSessionUxModal(next);
  }
  return next;
}

export function closeSessionUxModal(): void {
  deferRedirectActive = false;
  modalListener?.(null);
  void drainSessionUxModalQueue();
}

export function setPendingSessionUxRedirect(path: string): void {
  pendingRedirectPath = path;
  deferRedirectActive = true;
}

export function getLastSessionUxDeferRedirect(): boolean {
  return deferRedirectActive;
}

export function clearPendingSessionUxRedirect(): string | null {
  deferRedirectActive = false;
  const path = pendingRedirectPath;
  pendingRedirectPath = null;
  return path;
}

export function getPendingSessionUxRedirectPath(): string | null {
  return pendingRedirectPath;
}

export function resetSessionUxPresenterRuntime(): void {
  modalQueue.length = 0;
  pendingRedirectPath = null;
  deferRedirectActive = false;
  modalListener?.(null);
}
