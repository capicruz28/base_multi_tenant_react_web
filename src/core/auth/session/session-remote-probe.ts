/**
 * Política de probe remoto — IAM-FE-PHASE-03 IMPL-03.
 * Decide si ejecutar validación de sesión; sin HTTP, DOM, React ni timers.
 */

/** Contexto de evaluación inyectado desde AuthContext (IMPL-05/06). */
export interface SessionProbeContext {
  isAuthenticated: boolean;
  isImpersonationActive: boolean;
  isSelectionPending: boolean;
  isTerminating: boolean;
  isDocumentVisible: boolean;
  lastProbeAtMs: number | null;
}

/** Parámetros de throttle y gates de feature flags (wiring merge flags compile-time). */
export interface SessionProbePolicy {
  minIntervalMs: number;
  debounceFocusMs: number;
  probeOnVisibilityOnly: boolean;
  remoteProbeEnabled: boolean;
  sessionLogoutV3Enabled: boolean;
}

/** Valores por defecto — minInterval 5s (IAM-FE-REMOTE-REVOCATION-THROTTLE-PATCH-01). */
export const DEFAULT_SESSION_PROBE_POLICY: Readonly<SessionProbePolicy> = Object.freeze({
  minIntervalMs: 5_000,
  debounceFocusMs: 500,
  probeOnVisibilityOnly: true,
  remoteProbeEnabled: true,
  sessionLogoutV3Enabled: true,
});

/** Prefijo estable para claves de debounce en wiring (IMPL-05). */
export const SESSION_REMOTE_PROBE_DEBOUNCE_KEY_PREFIX = 'iam:session-remote-probe';

/**
 * Evalúa si corresponde ejecutar un probe de sesión.
 * Puramente declarativo: no muta `context` ni `policy`.
 *
 * @param nowMs — timestamp de referencia inyectado por el caller (evita timers en módulo).
 */
export function shouldRunSessionProbe(
  context: SessionProbeContext,
  policy: SessionProbePolicy = DEFAULT_SESSION_PROBE_POLICY,
  nowMs?: number,
): boolean {
  if (!policy.remoteProbeEnabled) {
    return false;
  }

  if (!policy.sessionLogoutV3Enabled) {
    return false;
  }

  if (!context.isAuthenticated) {
    return false;
  }

  if (context.isImpersonationActive) {
    return false;
  }

  if (context.isSelectionPending) {
    return false;
  }

  if (context.isTerminating) {
    return false;
  }

  if (policy.probeOnVisibilityOnly && !context.isDocumentVisible) {
    return false;
  }

  if (nowMs !== undefined && context.lastProbeAtMs !== null) {
    const elapsedMs = nowMs - context.lastProbeAtMs;

    if (elapsedMs < policy.debounceFocusMs) {
      return false;
    }

    if (elapsedMs < policy.minIntervalMs) {
      return false;
    }
  }

  return true;
}

/**
 * Devuelve una clave estable para reutilización de debounce en wiring.
 * Determinística: misma entrada → misma salida; sin efectos secundarios.
 */
export function resolveProbeDebounceKey(context: SessionProbeContext): string {
  const scope = context.isAuthenticated ? 'authenticated' : 'anonymous';
  const mode = context.isImpersonationActive ? 'impersonation' : 'standard';

  return `${SESSION_REMOTE_PROBE_DEBOUNCE_KEY_PREFIX}:${scope}:${mode}`;
}
