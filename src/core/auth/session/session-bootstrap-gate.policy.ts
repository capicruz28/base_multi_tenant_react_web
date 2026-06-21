/**
 * Política Bootstrap Gates V7.3 — IAM-FE-PHASE-07 IMPL-05 (L7-D).
 * Pura: sin React.
 */

import type { SessionUxFlagsSnapshot } from './session-ux.flags';
import { isSessionBootstrapGateActive } from './session-ux.flags';
import type {
  SessionBootstrapGateDecision,
  SessionBootstrapGateInput,
} from './session-ux.types';

const DEFAULT_GATE_MESSAGE = 'Verificando sesión...';

/**
 * D-P2-02 — sessionGateReady es función pura sobre campos useAuth() existentes.
 * No extiende firma pública useAuth().
 */
export function resolveSessionBootstrapGate(
  input: SessionBootstrapGateInput,
  flags: SessionUxFlagsSnapshot,
): SessionBootstrapGateDecision {
  if (!isSessionBootstrapGateActive(flags)) {
    return { shouldBlock: false, gateId: null, message: '' };
  }

  if (input.isPublicRoute) {
    if (!input.isBootstrapped) {
      return { shouldBlock: true, gateId: 'G1', message: DEFAULT_GATE_MESSAGE };
    }
    return { shouldBlock: false, gateId: null, message: '' };
  }

  if (!input.isBootstrapped) {
    return { shouldBlock: true, gateId: 'G1', message: DEFAULT_GATE_MESSAGE };
  }

  if (!input.authInitialized || input.authLoading) {
    return { shouldBlock: true, gateId: 'G2', message: DEFAULT_GATE_MESSAGE };
  }

  if (input.isSelectionRoute && !input.selectionHydrated) {
    return { shouldBlock: true, gateId: 'G_SELECTION', message: DEFAULT_GATE_MESSAGE };
  }

  if (
    input.isAuthenticated &&
    (!input.permissionsInitialized || !input.menuPermissionsReady)
  ) {
    return { shouldBlock: true, gateId: 'G3', message: DEFAULT_GATE_MESSAGE };
  }

  return { shouldBlock: false, gateId: null, message: '' };
}

export function isSessionGateReady(
  input: SessionBootstrapGateInput,
  flags: SessionUxFlagsSnapshot,
): boolean {
  return !resolveSessionBootstrapGate(input, flags).shouldBlock;
}
