import { useCallback, useEffect, useRef } from 'react';

import { shouldSkipProbeAfterAuthSyncTermination } from './session-auth-sync-apply';
import { SESSION_REMOTE_PROBE_ENABLED } from './session-logout-v3.flags';
import {
  DEFAULT_SESSION_PROBE_POLICY,
  shouldRunSessionProbe,
  type SessionProbeContext,
  type SessionProbePolicy,
} from './session-remote-probe';

/** Estado runtime inyectado desde AuthProvider (IMPL-06). */
export interface SessionRemoteProbeRuntimeState {
  isAuthenticated: boolean;
  isImpersonationActive: boolean;
  isSelectionPending: boolean;
  isTerminating: boolean;
}

export interface UseSessionRemoteProbeOptions {
  /** Sub-flag compile-time; default SESSION_REMOTE_PROBE_ENABLED. */
  enabled?: boolean;
  getRuntimeState: () => SessionRemoteProbeRuntimeState;
  runSessionValidityProbe: () => Promise<void>;
  getNowMs?: () => number;
}

/**
 * Política probe: remoteProbeEnabled refleja sub-flag;
 * sessionLogoutV3Enabled=true desacopla probe del master flag (AUDIT-A A3-01).
 */
export function buildSessionRemoteProbePolicy(remoteProbeEnabled: boolean): SessionProbePolicy {
  return {
    ...DEFAULT_SESSION_PROBE_POLICY,
    remoteProbeEnabled,
    sessionLogoutV3Enabled: true,
  };
}

export function buildSessionProbeContext(
  state: SessionRemoteProbeRuntimeState,
  lastProbeAtMs: number | null,
): SessionProbeContext {
  const isDocumentVisible =
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : false;

  return {
    isAuthenticated: state.isAuthenticated,
    isImpersonationActive: state.isImpersonationActive,
    isSelectionPending: state.isSelectionPending,
    isTerminating: state.isTerminating,
    isDocumentVisible,
    lastProbeAtMs,
  };
}

export interface EvaluateSessionRemoteProbeParams {
  context: SessionProbeContext;
  policy: SessionProbePolicy;
  nowMs: number;
  runSessionValidityProbe: () => Promise<void>;
  lastProbeAtMsRef: { current: number | null };
  getNowMs?: () => number;
}

/**
 * Evalúa política y ejecuta probe si corresponde.
 * Actualiza lastProbeAtMs solo tras ejecución real (AUDIT-A A3-03).
 */
export async function evaluateSessionRemoteProbe(
  params: EvaluateSessionRemoteProbeParams,
): Promise<boolean> {
  if (shouldSkipProbeAfterAuthSyncTermination(params.nowMs)) {
    return false;
  }

  if (!shouldRunSessionProbe(params.context, params.policy, params.nowMs)) {
    return false;
  }

  await params.runSessionValidityProbe();

  const resolveNow = params.getNowMs ?? (() => Date.now());
  params.lastProbeAtMsRef.current = resolveNow();

  return true;
}

/**
 * Lifecycle DOM: visibilitychange + focus → shouldRunSessionProbe → runSessionValidityProbe.
 */
export function useSessionRemoteProbe(options: UseSessionRemoteProbeOptions): void {
  const enabled = options.enabled ?? SESSION_REMOTE_PROBE_ENABLED;
  const lastProbeAtMsRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleProbeTrigger = useCallback(async () => {
    const opts = optionsRef.current;
    const probeEnabled = opts.enabled ?? SESSION_REMOTE_PROBE_ENABLED;

    if (!probeEnabled) {
      return;
    }

    const nowMs = (opts.getNowMs ?? (() => Date.now()))();
    const context = buildSessionProbeContext(
      opts.getRuntimeState(),
      lastProbeAtMsRef.current,
    );
    const policy = buildSessionRemoteProbePolicy(probeEnabled);

    await evaluateSessionRemoteProbe({
      context,
      policy,
      nowMs,
      runSessionValidityProbe: opts.runSessionValidityProbe,
      lastProbeAtMsRef,
      getNowMs: opts.getNowMs,
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onVisibilityChange = (): void => {
      void handleProbeTrigger();
    };

    const onFocus = (): void => {
      void handleProbeTrigger();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, handleProbeTrigger]);
}

/** Binder nulo para montar dentro de AuthProvider (IMPL-06). */
export function SessionRemoteProbeBinder(options: UseSessionRemoteProbeOptions): null {
  useSessionRemoteProbe(options);
  return null;
}
