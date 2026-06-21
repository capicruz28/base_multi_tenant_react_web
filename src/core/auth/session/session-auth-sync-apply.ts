/**
 * Aplicación inbound auth-sync — IAM-FE-PHASE-04 IMPL-05.
 * Traduce evento BC → F1 hydrate o F2 terminate (puro respecto a React).
 */

import { REFRESH_HYDRATE_ENABLED } from './refresh-hydrate.flags';
import { SESSION_AUTH_SYNC_V4_ENABLED } from './session-auth-sync.flags';
import {
  getAuthSyncTabId,
  registerInboundEventId,
  runWithInboundApplyAsync,
} from './session-auth-sync-emit';
import type { AuthSyncEnvelope } from './session-auth-sync.types';
import type { SessionClaimsSnapshot } from './session-claims-snapshot';
import type { SessionTerminationReason } from './session-termination-reason';

/** Skip probe post-terminación BC — IMPL-12 (§7.1). */
export const AUTH_SYNC_TERMINATION_PROBE_SKIP_MS = 10_000;

let lastAuthSyncTerminatedAtMs: number | null = null;

/** Single-flight inbound — R6. */
let inboundApplyPromise: Promise<void> | null = null;

export function markAuthSyncTerminationApplied(nowMs: number = Date.now()): void {
  lastAuthSyncTerminatedAtMs = nowMs;
}

export function getLastAuthSyncTerminatedAtMs(): number | null {
  return lastAuthSyncTerminatedAtMs;
}

export function resetAuthSyncApplyStateForTests(): void {
  lastAuthSyncTerminatedAtMs = null;
  inboundApplyPromise = null;
}

export interface ApplyInboundAuthSyncDeps {
  getCurrentAccessToken: () => string | null;
  getIsTerminating: () => boolean;
  /** V4.4 — abort refresh local antes de aplicar token leader. */
  clearRefreshingPromise: () => void;
  buildPriorSnapshot: () => SessionClaimsSnapshot | null;
  runPostRefreshFromSync: (
    newToken: string,
    priorSnapshot: SessionClaimsSnapshot,
  ) => Promise<void>;
  applyFullSessionFromSync: (accessToken: string) => Promise<boolean>;
  runTerminateFromSync: (input: {
    reason: SessionTerminationReason;
    redirectPath?: string;
    preservePreLoginBranding?: boolean;
  }) => Promise<void>;
  applySelectionFromSync: (envelope: AuthSyncEnvelope<'SELECTION_SYNC'>) => void;
  invalidateModulesAfterEmpresaChange: () => void;
}

function normalizeToken(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function shouldSkipInboundEnvelope(
  envelope: AuthSyncEnvelope,
  deps: ApplyInboundAuthSyncDeps,
): boolean {
  if (!SESSION_AUTH_SYNC_V4_ENABLED) {
    return true;
  }

  // R1 — ignorar self-echo
  if (envelope.tabId === getAuthSyncTabId()) {
    return true;
  }

  // R2 — dedup eventId
  if (!registerInboundEventId(envelope.eventId, envelope.issuedAtMs)) {
    return true;
  }

  // R7 — skip inbound si terminando (except TERMINATED ya deduped)
  if (deps.getIsTerminating() && envelope.type !== 'SESSION_TERMINATED') {
    return true;
  }

  return false;
}

function shouldSkipRefreshedForSameToken(
  accessToken: string,
  currentToken: string | null,
): boolean {
  // R5 — mismo access token
  return normalizeToken(accessToken) === normalizeToken(currentToken);
}

async function applySessionTokenEvent(
  envelope: AuthSyncEnvelope<'SESSION_LOGIN' | 'SESSION_REFRESHED'>,
  deps: ApplyInboundAuthSyncDeps,
): Promise<void> {
  const { accessToken } = envelope.payload;
  const currentToken = deps.getCurrentAccessToken();

  if (shouldSkipRefreshedForSameToken(accessToken, currentToken)) {
    return;
  }

  deps.clearRefreshingPromise();

  if (REFRESH_HYDRATE_ENABLED) {
    const priorSnapshot =
      envelope.payload.claimsSnapshot ?? deps.buildPriorSnapshot();

    if (priorSnapshot) {
      await deps.runPostRefreshFromSync(accessToken, priorSnapshot);
      return;
    }
  }

  await deps.applyFullSessionFromSync(accessToken);
}

async function applyInboundAuthSyncEventInternal(
  envelope: AuthSyncEnvelope,
  deps: ApplyInboundAuthSyncDeps,
): Promise<void> {
  if (shouldSkipInboundEnvelope(envelope, deps)) {
    return;
  }

  await runWithInboundApplyAsync(async () => {
    switch (envelope.type) {
      case 'SESSION_LOGIN':
      case 'SESSION_REFRESHED':
        await applySessionTokenEvent(envelope, deps);
        break;

      case 'EMPRESA_CHANGED': {
        const { accessToken } = envelope.payload;
        const currentToken = deps.getCurrentAccessToken();

        if (shouldSkipRefreshedForSameToken(accessToken, currentToken)) {
          deps.invalidateModulesAfterEmpresaChange();
          return;
        }

        deps.clearRefreshingPromise();

        if (REFRESH_HYDRATE_ENABLED) {
          const priorSnapshot =
            envelope.payload.claimsSnapshot ?? deps.buildPriorSnapshot();

          if (priorSnapshot) {
            await deps.runPostRefreshFromSync(accessToken, priorSnapshot);
            deps.invalidateModulesAfterEmpresaChange();
            return;
          }
        }

        const applied = await deps.applyFullSessionFromSync(accessToken);
        if (applied) {
          deps.invalidateModulesAfterEmpresaChange();
        }
        break;
      }

      case 'SESSION_TERMINATED': {
        await deps.runTerminateFromSync({
          reason: envelope.payload.reason,
          redirectPath: envelope.payload.redirectPath,
          preservePreLoginBranding: envelope.payload.preservePreLoginBranding,
        });
        markAuthSyncTerminationApplied();
        break;
      }

      case 'SELECTION_SYNC':
        deps.applySelectionFromSync(envelope);
        break;

      default:
        break;
    }
  });
}

/**
 * Aplica evento inbound con cola single-flight — R6.
 */
export function applyInboundAuthSyncEvent(
  envelope: AuthSyncEnvelope,
  deps: ApplyInboundAuthSyncDeps,
): Promise<void> {
  if (inboundApplyPromise) {
    return inboundApplyPromise.then(() => applyInboundAuthSyncEvent(envelope, deps));
  }

  inboundApplyPromise = applyInboundAuthSyncEventInternal(envelope, deps).finally(() => {
    inboundApplyPromise = null;
  });

  return inboundApplyPromise;
}

/**
 * Evalúa si probe remoto debe omitirse tras terminación BC reciente.
 */
export function shouldSkipProbeAfterAuthSyncTermination(
  nowMs: number,
  lastTerminatedAtMs: number | null = getLastAuthSyncTerminatedAtMs(),
): boolean {
  if (lastTerminatedAtMs === null) {
    return false;
  }

  return nowMs - lastTerminatedAtMs < AUTH_SYNC_TERMINATION_PROBE_SKIP_MS;
}
