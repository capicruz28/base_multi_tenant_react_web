import { describe, expect, it } from 'vitest';

import type { SessionTerminationReason } from '../session-termination-reason';
import {
  TOKEN_REUSE_CANONICAL_MESSAGE,
  SESSION_EXPIRED_CANONICAL_MESSAGE,
} from '../session-termination-ux';
import {
  createSessionTerminatedError,
  extractBackendDetailFromError,
  SESSION_TERMINATED_ERROR_MESSAGE,
  terminateSession,
  type TerminateSessionDeps,
  type TerminateSessionInput,
} from '../session-terminate';

interface RecordedCall {
  name: string;
  payload?: unknown;
}

interface TestHarness {
  order: string[];
  isTerminating: boolean;
  deps: TerminateSessionDeps;
  calls: RecordedCall[];
}

function createHarness(overrides?: Partial<TerminateSessionDeps>): TestHarness {
  const order: string[] = [];
  const calls: RecordedCall[] = [];
  let isTerminating = false;

  const record = (name: string, payload?: unknown): void => {
    order.push(name);
    calls.push({ name, payload });
  };

  const deps: TerminateSessionDeps = {
    getIsTerminating: () => isTerminating,
    setIsTerminating: (value) => {
      isTerminating = value;
      record('setIsTerminating', value);
    },
    clearRefreshingPromise: () => {
      record('clearRefreshingPromise');
    },
    processQueue: (error, token) => {
      record('processQueue', { errorMessage: error?.message ?? null, token });
    },
    clearAuthState: (options) => {
      record('clearAuthState', options);
    },
    callLogoutEndpoint: async () => {
      record('callLogoutEndpoint');
    },
    clearQueryCache: () => {
      record('clearQueryCache');
    },
    showTerminationToast: (profile) => {
      record('showTerminationToast', {
        reason: profile.reason,
        message: profile.toastMessage,
        redirectPath: profile.redirectPath,
      });
    },
    redirectToLogin: (path) => {
      record('redirectToLogin', path);
    },
    emitTerminationEvent: (payload) => {
      record('emitTerminationEvent', payload);
    },
    ...overrides,
  };

  return { order, isTerminating: false, deps, calls };
}

function getOrderWithoutGuard(order: string[]): string[] {
  return order.filter((step) => step !== 'setIsTerminating');
}

describe('terminateSession', () => {
  describe('flujo normal', () => {
    it('ejecuta secuencia T0→T3 completa para SESSION_EXPIRED', async () => {
      const harness = createHarness();

      await terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);

      expect(getOrderWithoutGuard(harness.order)).toEqual([
        'clearRefreshingPromise',
        'processQueue',
        'clearAuthState',
        'clearQueryCache',
        'emitTerminationEvent',
        'showTerminationToast',
        'redirectToLogin',
      ]);

      const toastCall = harness.calls.find((call) => call.name === 'showTerminationToast');
      expect(toastCall?.payload).toMatchObject({
        reason: 'SESSION_EXPIRED',
        message: SESSION_EXPIRED_CANONICAL_MESSAGE,
        redirectPath: '/login?session=expired',
      });

      expect(harness.calls.find((call) => call.name === 'redirectToLogin')?.payload).toBe(
        '/login?session=expired',
      );
      expect(harness.isTerminating).toBe(false);
    });

    it('invoca callLogoutEndpoint cuando callServer es true', async () => {
      const harness = createHarness();

      await terminateSession(
        { reason: 'MANUAL_LOGOUT', callServer: true },
        harness.deps,
      );

      const steps = getOrderWithoutGuard(harness.order);
      const queueIndex = steps.indexOf('processQueue');
      const logoutIndex = steps.indexOf('callLogoutEndpoint');
      const authIndex = steps.indexOf('clearAuthState');

      expect(logoutIndex).toBeGreaterThan(queueIndex);
      expect(logoutIndex).toBeLessThan(authIndex);
      expect(steps).toContain('callLogoutEndpoint');
    });

    it('propaga preservePreLoginBranding a clearAuthState', async () => {
      const harness = createHarness();

      await terminateSession(
        { reason: 'MANUAL_LOGOUT', preservePreLoginBranding: true },
        harness.deps,
      );

      expect(harness.calls.find((call) => call.name === 'clearAuthState')?.payload).toEqual({
        preservePreLoginBranding: true,
      });
    });
  });

  describe('razones recuperables', () => {
    const recoverableReasons: SessionTerminationReason[] = [
      'SESSION_EXPIRED',
      'REFRESH_UNAUTHORIZED',
      'REFRESH_INVALID',
      'REFRESH_REVOKED',
      'MANUAL_LOGOUT',
      'HYDRATE_FAILED',
      'BOOTSTRAP_FAILED',
      'IDLE_TIMEOUT',
      'ABSOLUTE_EXPIRY',
      'UNKNOWN',
    ];

    it.each(recoverableReasons)('completa terminación para %s', async (reason) => {
      const harness = createHarness();

      await terminateSession({ reason }, harness.deps);

      expect(harness.order).toContain('processQueue');
      expect(harness.order).toContain('clearAuthState');
      expect(harness.order).toContain('clearQueryCache');
    });
  });

  describe('razones de seguridad', () => {
    it('TOKEN_REUSE usa mensaje y redirect de seguridad', async () => {
      const harness = createHarness();

      await terminateSession({ reason: 'TOKEN_REUSE' }, harness.deps);

      expect(harness.calls.find((call) => call.name === 'showTerminationToast')?.payload).toMatchObject({
        reason: 'TOKEN_REUSE',
        message: TOKEN_REUSE_CANONICAL_MESSAGE,
        redirectPath: '/login?session=security',
      });

      const event = harness.calls.find((call) => call.name === 'emitTerminationEvent')?.payload as {
        isSecurityTermination: boolean;
      };
      expect(event.isSecurityTermination).toBe(true);
    });

    it('reason no seguridad emite isSecurityTermination false', async () => {
      const harness = createHarness();

      await terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);

      const event = harness.calls.find((call) => call.name === 'emitTerminationEvent')?.payload as {
        isSecurityTermination: boolean;
      };
      expect(event.isSecurityTermination).toBe(false);
    });
  });

  describe('callbacks opcionales', () => {
    it('omite clearRefreshingPromise cuando no está inyectado', async () => {
      const harness = createHarness({ clearRefreshingPromise: undefined });

      await terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);

      expect(harness.order).not.toContain('clearRefreshingPromise');
      expect(harness.order[0]).toBe('setIsTerminating');
      expect(getOrderWithoutGuard(harness.order)[0]).toBe('processQueue');
    });

    it('omite emitTerminationEvent cuando no está inyectado', async () => {
      const harness = createHarness({ emitTerminationEvent: undefined });

      await terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);

      expect(harness.order).not.toContain('emitTerminationEvent');
    });

    it('no llama showTerminationToast en SILENT_CLEANUP', async () => {
      const harness = createHarness();

      await terminateSession({ reason: 'SILENT_CLEANUP' }, harness.deps);

      expect(harness.order).not.toContain('showTerminationToast');
      expect(harness.order).toContain('redirectToLogin');
    });

    it('omite redirect cuando skipRedirect es true', async () => {
      const harness = createHarness();

      await terminateSession(
        { reason: 'SESSION_EXPIRED', skipRedirect: true },
        harness.deps,
      );

      expect(harness.order).not.toContain('redirectToLogin');
      expect(harness.order).toContain('showTerminationToast');
    });

    it('no llama callLogoutEndpoint cuando callServer no es true', async () => {
      const harness = createHarness();

      await terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);

      expect(harness.order).not.toContain('callLogoutEndpoint');
    });
  });

  describe('propagación de errores', () => {
    it('propaga error de clearAuthState y restablece isTerminating', async () => {
      const harness = createHarness({
        clearAuthState: () => {
          harness.order.push('clearAuthState');
          throw new Error('clearAuthState failed');
        },
      });

      await expect(
        terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps),
      ).rejects.toThrow('clearAuthState failed');

      expect(harness.isTerminating).toBe(false);
      expect(harness.order).toContain('processQueue');
      expect(harness.order).not.toContain('clearQueryCache');
      expect(harness.order).not.toContain('redirectToLogin');
    });

    it('propaga error de clearQueryCache', async () => {
      const harness = createHarness({
        clearQueryCache: () => {
          harness.order.push('clearQueryCache');
          throw new Error('clearQueryCache failed');
        },
      });

      await expect(
        terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps),
      ).rejects.toThrow('clearQueryCache failed');

      expect(harness.order).toContain('clearAuthState');
      expect(harness.order).not.toContain('redirectToLogin');
    });

    it('no propaga error de callLogoutEndpoint (best-effort)', async () => {
      const harness = createHarness({
        callLogoutEndpoint: async () => {
          harness.order.push('callLogoutEndpoint');
          throw new Error('logout endpoint failed');
        },
      });

      await expect(
        terminateSession(
          { reason: 'MANUAL_LOGOUT', callServer: true },
          harness.deps,
        ),
      ).resolves.toBeUndefined();

      expect(harness.order).toContain('clearAuthState');
      expect(harness.order).toContain('redirectToLogin');
    });
  });

  describe('orden exacto de ejecución', () => {
    it('processQueue usa error estable antes de cleanup', async () => {
      const harness = createHarness();

      await terminateSession({ reason: 'HYDRATE_FAILED' }, harness.deps);

      const queueCall = harness.calls.find((call) => call.name === 'processQueue');
      expect(queueCall?.payload).toEqual({
        errorMessage: SESSION_TERMINATED_ERROR_MESSAGE,
        token: null,
      });

      const steps = getOrderWithoutGuard(harness.order);
      expect(steps.indexOf('processQueue')).toBeLessThan(steps.indexOf('clearAuthState'));
      expect(steps.indexOf('clearAuthState')).toBeLessThan(steps.indexOf('clearQueryCache'));
      expect(steps.indexOf('clearQueryCache')).toBeLessThan(steps.indexOf('showTerminationToast'));
      expect(steps.indexOf('showTerminationToast')).toBeLessThan(steps.indexOf('redirectToLogin'));
    });

    it('prioriza backendDetail del error en T0 para UX', async () => {
      const harness = createHarness();
      const backendDetail = 'Mensaje backend personalizado.';

      await terminateSession(
        {
          reason: 'SESSION_EXPIRED',
          error: { response: { data: { detail: backendDetail } } },
        },
        harness.deps,
      );

      expect(harness.calls.find((call) => call.name === 'showTerminationToast')?.payload).toMatchObject({
        message: backendDetail,
      });
    });
  });

  describe('idempotencia', () => {
    it('no ejecuta secuencia si ya está terminando', async () => {
      const harness = createHarness({
        getIsTerminating: () => true,
      });

      await terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);

      expect(harness.order).toHaveLength(0);
    });

    it('segunda llamada concurrente durante ejecución es no-op', async () => {
      let releaseClearAuth: (() => void) | null = null;
      const clearAuthGate = new Promise<void>((resolve) => {
        releaseClearAuth = resolve;
      });

      const harness = createHarness({
        clearAuthState: async () => {
          harness.order.push('clearAuthState');
          await clearAuthGate;
        },
      });

      const first = terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);
      await Promise.resolve();

      await terminateSession({ reason: 'SESSION_EXPIRED' }, harness.deps);

      releaseClearAuth?.();
      await first;

      const processQueueCalls = harness.calls.filter((call) => call.name === 'processQueue');
      expect(processQueueCalls).toHaveLength(1);
    });
  });

  describe('inmutabilidad', () => {
    it('no muta el input', async () => {
      const harness = createHarness();
      const input: TerminateSessionInput = {
        reason: 'SESSION_EXPIRED',
        callServer: true,
        preservePreLoginBranding: false,
        error: { response: { data: { detail: 'detalle' } } },
      };
      const snapshot = structuredClone(input);

      await terminateSession(input, harness.deps);

      expect(input).toEqual(snapshot);
    });
  });
});

describe('createSessionTerminatedError', () => {
  it('retorna Error con mensaje estable', () => {
    const error = createSessionTerminatedError();

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(SESSION_TERMINATED_ERROR_MESSAGE);
  });

  it('es idempotente en mensaje', () => {
    const first = createSessionTerminatedError();
    const second = createSessionTerminatedError();

    expect(first.message).toBe(second.message);
    expect(first).not.toBe(second);
  });
});

describe('extractBackendDetailFromError', () => {
  it('extrae detail string de error tipo Axios', () => {
    const detail = extractBackendDetailFromError({
      response: { data: { detail: '  Sesión expirada  ' } },
    });

    expect(detail).toBe('Sesión expirada');
  });

  it('concatena detail array Pydantic', () => {
    const detail = extractBackendDetailFromError({
      response: { data: { detail: [{ msg: 'Error A' }, { msg: 'Error B' }] } },
    });

    expect(detail).toBe('Error A Error B');
  });

  it('retorna undefined para error nulo o sin detail', () => {
    expect(extractBackendDetailFromError(null)).toBeUndefined();
    expect(extractBackendDetailFromError({})).toBeUndefined();
    expect(extractBackendDetailFromError({ response: { data: {} } })).toBeUndefined();
  });
});
