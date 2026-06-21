import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_PROBE_POLICY,
  resolveProbeDebounceKey,
  SESSION_REMOTE_PROBE_DEBOUNCE_KEY_PREFIX,
  shouldRunSessionProbe,
  type SessionProbeContext,
  type SessionProbePolicy,
} from '../session-remote-probe';

const NOW_MS = 1_700_000_000_000;

function createEligibleContext(
  overrides?: Partial<SessionProbeContext>,
): SessionProbeContext {
  return {
    isAuthenticated: true,
    isImpersonationActive: false,
    isSelectionPending: false,
    isTerminating: false,
    isDocumentVisible: true,
    lastProbeAtMs: null,
    ...overrides,
  };
}

describe('session-remote-probe (IMPL-03)', () => {
  describe('shouldRunSessionProbe — gates de contexto', () => {
    it('retorna true cuando authenticated y visible con política default', () => {
      const context = createEligibleContext();

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        true,
      );
    });

    it('retorna false cuando not authenticated', () => {
      const context = createEligibleContext({ isAuthenticated: false });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        false,
      );
    });

    it('retorna false cuando tab oculta (document not visible)', () => {
      const context = createEligibleContext({ isDocumentVisible: false });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        false,
      );
    });

    it('retorna false en impersonation', () => {
      const context = createEligibleContext({ isImpersonationActive: true });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        false,
      );
    });

    it('retorna false cuando terminating', () => {
      const context = createEligibleContext({ isTerminating: true });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        false,
      );
    });

    it('retorna false cuando selection pending', () => {
      const context = createEligibleContext({ isSelectionPending: true });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        false,
      );
    });
  });

  describe('shouldRunSessionProbe — debounce y minInterval', () => {
    it('retorna false si elapsed < debounceFocusMs', () => {
      const context = createEligibleContext({
        lastProbeAtMs: NOW_MS - 200,
      });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        false,
      );
    });

    it('retorna false si elapsed < minIntervalMs pero >= debounceFocusMs', () => {
      const context = createEligibleContext({
        lastProbeAtMs: NOW_MS - 3_000,
      });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        false,
      );
    });

    it('retorna true si elapsed >= minIntervalMs', () => {
      const context = createEligibleContext({
        lastProbeAtMs: NOW_MS - 5_000,
      });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        true,
      );
    });

    it('omite checks de intervalo cuando nowMs no se provee', () => {
      const context = createEligibleContext({
        lastProbeAtMs: NOW_MS - 100,
      });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY)).toBe(true);
    });

    it('permite probe con lastProbeAtMs null', () => {
      const context = createEligibleContext({ lastProbeAtMs: null });

      expect(shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS)).toBe(
        true,
      );
    });
  });

  describe('shouldRunSessionProbe — feature flags', () => {
    it('retorna false cuando remoteProbeEnabled es false', () => {
      const context = createEligibleContext();
      const policy: SessionProbePolicy = {
        ...DEFAULT_SESSION_PROBE_POLICY,
        remoteProbeEnabled: false,
      };

      expect(shouldRunSessionProbe(context, policy, NOW_MS)).toBe(false);
    });

    it('retorna false cuando sessionLogoutV3Enabled es false', () => {
      const context = createEligibleContext();
      const policy: SessionProbePolicy = {
        ...DEFAULT_SESSION_PROBE_POLICY,
        sessionLogoutV3Enabled: false,
      };

      expect(shouldRunSessionProbe(context, policy, NOW_MS)).toBe(false);
    });

    it('retorna true cuando ambos flags están ON y contexto elegible', () => {
      const context = createEligibleContext();
      const policy: SessionProbePolicy = {
        ...DEFAULT_SESSION_PROBE_POLICY,
        remoteProbeEnabled: true,
        sessionLogoutV3Enabled: true,
      };

      expect(shouldRunSessionProbe(context, policy, NOW_MS)).toBe(true);
    });
  });

  describe('shouldRunSessionProbe — probeOnVisibilityOnly', () => {
    it('permite probe con tab oculta si probeOnVisibilityOnly es false', () => {
      const context = createEligibleContext({ isDocumentVisible: false });
      const policy: SessionProbePolicy = {
        ...DEFAULT_SESSION_PROBE_POLICY,
        probeOnVisibilityOnly: false,
      };

      expect(shouldRunSessionProbe(context, policy, NOW_MS)).toBe(true);
    });
  });

  describe('resolveProbeDebounceKey', () => {
    it('devuelve clave estable para mismo contexto', () => {
      const context = createEligibleContext();
      const first = resolveProbeDebounceKey(context);
      const second = resolveProbeDebounceKey(context);

      expect(first).toBe(second);
    });

    it('incluye prefijo contractual', () => {
      const key = resolveProbeDebounceKey(createEligibleContext());

      expect(key.startsWith(SESSION_REMOTE_PROBE_DEBOUNCE_KEY_PREFIX)).toBe(true);
    });

    it('diferencia authenticated vs anonymous', () => {
      const authenticatedKey = resolveProbeDebounceKey(createEligibleContext());
      const anonymousKey = resolveProbeDebounceKey(
        createEligibleContext({ isAuthenticated: false }),
      );

      expect(authenticatedKey).not.toBe(anonymousKey);
    });

    it('diferencia impersonation vs standard', () => {
      const standardKey = resolveProbeDebounceKey(createEligibleContext());
      const impersonationKey = resolveProbeDebounceKey(
        createEligibleContext({ isImpersonationActive: true }),
      );

      expect(standardKey).not.toBe(impersonationKey);
    });

    it('no muta el contexto recibido', () => {
      const context = createEligibleContext();
      const snapshot = { ...context };

      resolveProbeDebounceKey(context);

      expect(context).toEqual(snapshot);
    });
  });

  describe('inmutabilidad y pureza', () => {
    it('no muta SessionProbeContext', () => {
      const context = createEligibleContext({ lastProbeAtMs: NOW_MS - 5_000 });
      const snapshot = { ...context };

      shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS);

      expect(context).toEqual(snapshot);
    });

    it('no muta SessionProbePolicy pasada como argumento', () => {
      const context = createEligibleContext();
      const policy: SessionProbePolicy = {
        ...DEFAULT_SESSION_PROBE_POLICY,
      };
      const snapshot = { ...policy };

      shouldRunSessionProbe(context, policy, NOW_MS);

      expect(policy).toEqual(snapshot);
    });

    it('DEFAULT_SESSION_PROBE_POLICY coincide con diseño §9.5', () => {
      expect(DEFAULT_SESSION_PROBE_POLICY.minIntervalMs).toBe(5_000);
      expect(DEFAULT_SESSION_PROBE_POLICY.debounceFocusMs).toBe(500);
      expect(DEFAULT_SESSION_PROBE_POLICY.probeOnVisibilityOnly).toBe(true);
    });

    it('shouldRunSessionProbe es determinista para misma entrada', () => {
      const context = createEligibleContext();
      const first = shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS);
      const second = shouldRunSessionProbe(context, DEFAULT_SESSION_PROBE_POLICY, NOW_MS);

      expect(first).toBe(second);
    });
  });
});
