/**
 * IAM-FE-PHASE-07 IMPL-05 — session-bootstrap-gate.policy tests (V7.3).
 */
import { describe, expect, it } from 'vitest';

import {
  isSessionGateReady,
  resolveSessionBootstrapGate,
} from '@/core/auth/session/session-bootstrap-gate.policy';
import { getSessionUxFlagsSnapshot } from '@/core/auth/session/session-ux.flags';
import type { SessionBootstrapGateInput } from '@/core/auth/session/session-ux.types';

const readyInput: SessionBootstrapGateInput = {
  isBootstrapped: true,
  authInitialized: true,
  authLoading: false,
  isAuthenticated: true,
  permissionsInitialized: true,
  menuPermissionsReady: true,
  isPublicRoute: false,
  isSelectionRoute: false,
  selectionHydrated: true,
};

describe('session-bootstrap-gate.policy (IMPL-05)', () => {
  const flagsOn = getSessionUxFlagsSnapshot({
    masterEnabled: true,
    bootstrapGateEnabled: true,
  });

  const flagsOff = getSessionUxFlagsSnapshot({
    masterEnabled: false,
    bootstrapGateEnabled: false,
  });

  it('V7.3 — G1 bloquea sin bootstrap', () => {
    const decision = resolveSessionBootstrapGate(
      { ...readyInput, isBootstrapped: false },
      flagsOn,
    );
    expect(decision.shouldBlock).toBe(true);
    expect(decision.gateId).toBe('G1');
  });

  it('G2 bloquea authLoading', () => {
    const decision = resolveSessionBootstrapGate(
      { ...readyInput, authLoading: true },
      flagsOn,
    );
    expect(decision.shouldBlock).toBe(true);
    expect(decision.gateId).toBe('G2');
  });

  it('G3 bloquea permisos pendientes', () => {
    const decision = resolveSessionBootstrapGate(
      { ...readyInput, permissionsInitialized: false },
      flagsOn,
    );
    expect(decision.shouldBlock).toBe(true);
    expect(decision.gateId).toBe('G3');
  });

  it('D-P2-03 — G_SELECTION bloquea selección empresa', () => {
    const decision = resolveSessionBootstrapGate(
      {
        ...readyInput,
        isSelectionRoute: true,
        selectionHydrated: false,
      },
      flagsOn,
    );
    expect(decision.shouldBlock).toBe(true);
    expect(decision.gateId).toBe('G_SELECTION');
  });

  it('ruta pública solo G1', () => {
    const decision = resolveSessionBootstrapGate(
      {
        ...readyInput,
        isPublicRoute: true,
        isBootstrapped: true,
        isAuthenticated: false,
        permissionsInitialized: false,
      },
      flagsOn,
    );
    expect(decision.shouldBlock).toBe(false);
  });

  it('L4 rollback — gate OFF no bloquea', () => {
    expect(resolveSessionBootstrapGate(readyInput, flagsOff).shouldBlock).toBe(false);
    expect(isSessionGateReady(readyInput, flagsOn)).toBe(true);
  });

  it('D-P2-02 — isSessionGateReady función pura sin useAuth', () => {
    expect(isSessionGateReady(readyInput, flagsOn)).toBe(true);
    expect(
      isSessionGateReady({ ...readyInput, authInitialized: false }, flagsOn),
    ).toBe(false);
  });
});
