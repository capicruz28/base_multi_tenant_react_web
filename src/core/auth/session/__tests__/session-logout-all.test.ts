import { describe, expect, it, vi } from 'vitest';

import {
  executeLogoutAllFlow,
  type LogoutAllFlowDeps,
  type LogoutAllFlowInput,
} from '../session-logout-all';

interface RecordedCall {
  name: string;
  payload?: unknown;
}

interface TestHarness {
  order: string[];
  calls: RecordedCall[];
  deps: LogoutAllFlowDeps;
}

function createHarness(overrides?: Partial<LogoutAllFlowDeps>): TestHarness {
  const order: string[] = [];
  const calls: RecordedCall[] = [];

  const record = (name: string, payload?: unknown): void => {
    order.push(name);
    calls.push({ name, payload });
  };

  const deps: LogoutAllFlowDeps = {
    getIsTerminating: () => false,
    callLogoutAllEndpoint: async () => {
      record('callLogoutAllEndpoint');
    },
    runTerminateAfterLogoutAll: async () => {
      record('runTerminateAfterLogoutAll');
    },
    ...overrides,
  };

  return { order, calls, deps };
}

const defaultInput: LogoutAllFlowInput = {
  preservePreLoginBranding: true,
  skipRedirect: false,
};

describe('executeLogoutAllFlow (IMPL-02)', () => {
  describe('happy path', () => {
    it('ejecuta callLogoutAllEndpoint y luego runTerminateAfterLogoutAll', async () => {
      const harness = createHarness();

      await executeLogoutAllFlow(defaultInput, harness.deps);

      expect(harness.order).toEqual([
        'callLogoutAllEndpoint',
        'runTerminateAfterLogoutAll',
      ]);
    });

    it('completa sin error cuando deps resuelven', async () => {
      const harness = createHarness();

      await expect(
        executeLogoutAllFlow(defaultInput, harness.deps),
      ).resolves.toBeUndefined();
    });
  });

  describe('logout_all error', () => {
    it('propaga el error y no ejecuta terminate', async () => {
      const logoutError = new Error('logout_all failed');
      const harness = createHarness({
        callLogoutAllEndpoint: async () => {
          harness.order.push('callLogoutAllEndpoint');
          throw logoutError;
        },
        runTerminateAfterLogoutAll: async () => {
          harness.order.push('runTerminateAfterLogoutAll');
        },
      });

      await expect(
        executeLogoutAllFlow(defaultInput, harness.deps),
      ).rejects.toThrow('logout_all failed');

      expect(harness.order).toEqual(['callLogoutAllEndpoint']);
      expect(harness.order).not.toContain('runTerminateAfterLogoutAll');
    });

    it('invoca onLogoutAllRejected antes de propagar', async () => {
      const logoutError = new Error('network');
      const onRejected = vi.fn();
      const harness = createHarness({
        callLogoutAllEndpoint: async () => {
          throw logoutError;
        },
        onLogoutAllRejected: onRejected,
      });

      await expect(
        executeLogoutAllFlow(defaultInput, harness.deps),
      ).rejects.toThrow('network');

      expect(onRejected).toHaveBeenCalledTimes(1);
      expect(onRejected).toHaveBeenCalledWith(logoutError);
    });

    it('no invoca onLogoutAllRejected cuando no está inyectado', async () => {
      const harness = createHarness({
        callLogoutAllEndpoint: async () => {
          throw new Error('fail');
        },
      });

      await expect(
        executeLogoutAllFlow(defaultInput, harness.deps),
      ).rejects.toThrow('fail');
    });
  });

  describe('guard isTerminating', () => {
    it('retorna sin llamadas cuando ya está terminando', async () => {
      const harness = createHarness({
        getIsTerminating: () => true,
      });

      await executeLogoutAllFlow(defaultInput, harness.deps);

      expect(harness.order).toEqual([]);
    });

    it('retorno void idempotente sin propagar error', async () => {
      const harness = createHarness({
        getIsTerminating: () => true,
      });

      const result = await executeLogoutAllFlow(defaultInput, harness.deps);

      expect(result).toBeUndefined();
    });
  });

  describe('orden exacto de llamadas', () => {
    it('logout_all siempre precede a terminate en éxito', async () => {
      const harness = createHarness();

      await executeLogoutAllFlow(defaultInput, harness.deps);

      const logoutIndex = harness.order.indexOf('callLogoutAllEndpoint');
      const terminateIndex = harness.order.indexOf('runTerminateAfterLogoutAll');

      expect(logoutIndex).toBe(0);
      expect(terminateIndex).toBe(1);
      expect(logoutIndex).toBeLessThan(terminateIndex);
    });

    it('getIsTerminating se evalúa antes de callLogoutAllEndpoint', async () => {
      const invocationOrder: string[] = [];
      const deps: LogoutAllFlowDeps = {
        getIsTerminating: () => {
          invocationOrder.push('getIsTerminating');
          return false;
        },
        callLogoutAllEndpoint: async () => {
          invocationOrder.push('callLogoutAllEndpoint');
        },
        runTerminateAfterLogoutAll: async () => {
          invocationOrder.push('runTerminateAfterLogoutAll');
        },
      };

      await executeLogoutAllFlow(defaultInput, deps);

      expect(invocationOrder[0]).toBe('getIsTerminating');
      expect(invocationOrder[1]).toBe('callLogoutAllEndpoint');
    });
  });

  describe('idempotencia', () => {
    it('segunda invocación con isTerminating true no duplica llamadas', async () => {
      let terminating = false;
      const order: string[] = [];

      const deps: LogoutAllFlowDeps = {
        getIsTerminating: () => terminating,
        callLogoutAllEndpoint: async () => {
          order.push('callLogoutAllEndpoint');
        },
        runTerminateAfterLogoutAll: async () => {
          order.push('runTerminateAfterLogoutAll');
          terminating = true;
        },
      };

      await executeLogoutAllFlow(defaultInput, deps);
      await executeLogoutAllFlow(defaultInput, deps);

      expect(order.filter((s) => s === 'callLogoutAllEndpoint')).toHaveLength(1);
      expect(order.filter((s) => s === 'runTerminateAfterLogoutAll')).toHaveLength(1);
    });
  });

  describe('propagación de errores', () => {
    it('propaga error de runTerminateAfterLogoutAll', async () => {
      const terminateError = new Error('terminate failed');
      const harness = createHarness({
        runTerminateAfterLogoutAll: async () => {
          harness.order.push('runTerminateAfterLogoutAll');
          throw terminateError;
        },
      });

      await expect(
        executeLogoutAllFlow(defaultInput, harness.deps),
      ).rejects.toThrow('terminate failed');

      expect(harness.order).toContain('callLogoutAllEndpoint');
      expect(harness.order).toContain('runTerminateAfterLogoutAll');
    });

    it('no invoca onLogoutAllRejected cuando falla terminate', async () => {
      const onRejected = vi.fn();
      const harness = createHarness({
        runTerminateAfterLogoutAll: async () => {
          throw new Error('terminate');
        },
        onLogoutAllRejected: onRejected,
      });

      await expect(
        executeLogoutAllFlow(defaultInput, harness.deps),
      ).rejects.toThrow('terminate');

      expect(onRejected).not.toHaveBeenCalled();
    });
  });

  describe('input inmutable', () => {
    it('no muta LogoutAllFlowInput recibido', async () => {
      const harness = createHarness();
      const input: LogoutAllFlowInput = {
        preservePreLoginBranding: false,
        skipRedirect: true,
      };
      const snapshot = { ...input };

      await executeLogoutAllFlow(input, harness.deps);

      expect(input).toEqual(snapshot);
    });

    it('acepta input vacío sin error', async () => {
      const harness = createHarness();

      await expect(executeLogoutAllFlow({}, harness.deps)).resolves.toBeUndefined();
    });
  });

  describe('dependencias opcionales', () => {
    it('funciona sin onLogoutAllRejected en happy path', async () => {
      const harness = createHarness();

      await expect(
        executeLogoutAllFlow(defaultInput, harness.deps),
      ).resolves.toBeUndefined();
    });

    it('onLogoutAllRejected es opcional y no se invoca en éxito', async () => {
      const onRejected = vi.fn();
      const harness = createHarness({ onLogoutAllRejected: onRejected });

      await executeLogoutAllFlow(defaultInput, harness.deps);

      expect(onRejected).not.toHaveBeenCalled();
    });
  });
});
