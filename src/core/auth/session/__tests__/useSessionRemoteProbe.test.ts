import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as sessionRemoteProbe from '@/core/auth/session/session-remote-probe';
import {
  buildSessionProbeContext,
  buildSessionRemoteProbePolicy,
  evaluateSessionRemoteProbe,
  useSessionRemoteProbe,
} from '@/core/auth/session/useSessionRemoteProbe';

const eligibleState = {
  isAuthenticated: true,
  isImpersonationActive: false,
  isSelectionPending: false,
  isTerminating: false,
};

describe('buildSessionRemoteProbePolicy (IMPL-06)', () => {
  it('desacopla sessionLogoutV3Enabled del master flag (A3-01)', () => {
    const policy = buildSessionRemoteProbePolicy(true);

    expect(policy.sessionLogoutV3Enabled).toBe(true);
    expect(policy.remoteProbeEnabled).toBe(true);
  });
});

describe('evaluateSessionRemoteProbe (IMPL-06)', () => {
  it('no actualiza lastProbeAtMs cuando policy rechaza', async () => {
    const lastProbeAtMsRef = { current: null as number | null };
    const runSessionValidityProbe = vi.fn().mockResolvedValue(undefined);

    const executed = await evaluateSessionRemoteProbe({
      context: buildSessionProbeContext(eligibleState, null),
      policy: buildSessionRemoteProbePolicy(false),
      nowMs: 1_000,
      runSessionValidityProbe,
      lastProbeAtMsRef,
    });

    expect(executed).toBe(false);
    expect(runSessionValidityProbe).not.toHaveBeenCalled();
    expect(lastProbeAtMsRef.current).toBeNull();
  });

  it('actualiza lastProbeAtMs solo tras ejecución exitosa (A3-03)', async () => {
    const lastProbeAtMsRef = { current: null as number | null };
    const runSessionValidityProbe = vi.fn().mockResolvedValue(undefined);
    const getNowMs = vi.fn().mockReturnValue(5_000);

    const executed = await evaluateSessionRemoteProbe({
      context: buildSessionProbeContext(eligibleState, null),
      policy: buildSessionRemoteProbePolicy(true),
      nowMs: 5_000,
      runSessionValidityProbe,
      lastProbeAtMsRef,
      getNowMs,
    });

    expect(executed).toBe(true);
    expect(runSessionValidityProbe).toHaveBeenCalledTimes(1);
    expect(lastProbeAtMsRef.current).toBe(5_000);
  });

  it('inyecta nowMs en shouldRunSessionProbe (A3-02)', async () => {
    const shouldRunSpy = vi.spyOn(sessionRemoteProbe, 'shouldRunSessionProbe');
    const lastProbeAtMsRef = { current: null as number | null };

    await evaluateSessionRemoteProbe({
      context: buildSessionProbeContext(eligibleState, null),
      policy: buildSessionRemoteProbePolicy(true),
      nowMs: 9_999,
      runSessionValidityProbe: vi.fn().mockResolvedValue(undefined),
      lastProbeAtMsRef,
    });

    expect(shouldRunSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      9_999,
    );

    shouldRunSpy.mockRestore();
  });
});

describe('useSessionRemoteProbe (IMPL-06)', () => {
  let addDocumentListener: ReturnType<typeof vi.spyOn>;
  let removeDocumentListener: ReturnType<typeof vi.spyOn>;
  let addWindowListener: ReturnType<typeof vi.spyOn>;
  let removeWindowListener: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addDocumentListener = vi.spyOn(document, 'addEventListener');
    removeDocumentListener = vi.spyOn(document, 'removeEventListener');
    addWindowListener = vi.spyOn(window, 'addEventListener');
    removeWindowListener = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registra listeners visibilitychange y focus cuando enabled', () => {
    renderHook(() =>
      useSessionRemoteProbe({
        enabled: true,
        getRuntimeState: () => eligibleState,
        runSessionValidityProbe: vi.fn().mockResolvedValue(undefined),
      }),
    );

    expect(addDocumentListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(addWindowListener).toHaveBeenCalledWith('focus', expect.any(Function));
  });

  it('no registra listeners cuando enabled es false', () => {
    renderHook(() =>
      useSessionRemoteProbe({
        enabled: false,
        getRuntimeState: () => eligibleState,
        runSessionValidityProbe: vi.fn().mockResolvedValue(undefined),
      }),
    );

    expect(addDocumentListener).not.toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(addWindowListener).not.toHaveBeenCalledWith('focus', expect.any(Function));
  });

  it('elimina listeners al desmontar', () => {
    const { unmount } = renderHook(() =>
      useSessionRemoteProbe({
        enabled: true,
        getRuntimeState: () => eligibleState,
        runSessionValidityProbe: vi.fn().mockResolvedValue(undefined),
      }),
    );

    unmount();

    expect(removeDocumentListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(removeWindowListener).toHaveBeenCalledWith('focus', expect.any(Function));
  });

  it('visibilitychange ejecuta probe cuando policy permite', async () => {
    const runSessionValidityProbe = vi.fn().mockResolvedValue(undefined);
    const getNowMs = vi.fn().mockReturnValue(10_000);

    renderHook(() =>
      useSessionRemoteProbe({
        enabled: true,
        getRuntimeState: () => eligibleState,
        runSessionValidityProbe,
        getNowMs,
      }),
    );

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(runSessionValidityProbe).toHaveBeenCalledTimes(1);
    expect(getNowMs).toHaveBeenCalled();
  });

  it('focus ejecuta probe cuando policy permite', async () => {
    const runSessionValidityProbe = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useSessionRemoteProbe({
        enabled: true,
        getRuntimeState: () => eligibleState,
        runSessionValidityProbe,
        getNowMs: () => 20_000,
      }),
    );

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(runSessionValidityProbe).toHaveBeenCalledTimes(1);
  });

  it('policy false (enabled off) no ejecuta probe en focus', async () => {
    const runSessionValidityProbe = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useSessionRemoteProbe({
        enabled: false,
        getRuntimeState: () => eligibleState,
        runSessionValidityProbe,
      }),
    );

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(runSessionValidityProbe).not.toHaveBeenCalled();
  });

  it('respeta minInterval — segundo evento no ejecuta probe antes de intervalo', async () => {
    const runSessionValidityProbe = vi.fn().mockResolvedValue(undefined);
    let now = 1_000;
    const getNowMs = vi.fn(() => now);

    renderHook(() =>
      useSessionRemoteProbe({
        enabled: true,
        getRuntimeState: () => eligibleState,
        runSessionValidityProbe,
        getNowMs,
      }),
    );

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    now = 2_000;
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(runSessionValidityProbe).toHaveBeenCalledTimes(1);
  });
});
