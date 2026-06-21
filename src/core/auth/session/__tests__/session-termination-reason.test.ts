import { describe, expect, it } from 'vitest';

import {
  classifySessionTermination,
  isRecoverableTermination,
  isSecurityTermination,
  parseTerminationFromHttp,
  type ClassifySessionTerminationInput,
  type SessionTerminationClassification,
  type SessionTerminationReason,
} from '../session-termination-reason';

const REFRESH_URL = '/api/v1/auth/refresh/';

function expectClassification(
  result: SessionTerminationClassification,
  expected: {
    reason: SessionTerminationReason;
    category: 'backend' | 'frontend' | 'security' | 'unknown';
    severity: 'info' | 'warning' | 'error';
    source?: 'backend' | 'frontend' | 'unknown';
    httpStatus?: number;
    detail?: string;
  },
): void {
  expect(result.reason).toBe(expected.reason);
  expect(result.category).toBe(expected.category);
  expect(result.severity).toBe(expected.severity);
  if (expected.source !== undefined) {
    expect(result.source).toBe(expected.source);
  }
  if (expected.httpStatus !== undefined) {
    expect(result.httpStatus).toBe(expected.httpStatus);
  }
  if (expected.detail !== undefined) {
    expect(result.detail).toBe(expected.detail);
  }
}

describe('parseTerminationFromHttp', () => {
  describe('SESSION_EXPIRED', () => {
    it('clasifica mensaje §19 estándar en refresh 401', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Su sesión fue cerrada remotamente. Vuelva a iniciar sesión.',
      });

      expectClassification(result, {
        reason: 'SESSION_EXPIRED',
        category: 'backend',
        severity: 'error',
        source: 'backend',
        httpStatus: 401,
        detail: 'Su sesión fue cerrada remotamente. Vuelva a iniciar sesión.',
      });
    });

    it('clasifica "sesión expirada" case-insensitive', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'SESION EXPIRADA',
      });

      expect(result.reason).toBe('SESSION_EXPIRED');
    });

    it('clasifica 401 API sin detail como SESSION_EXPIRED', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: '/api/v1/inv/productos/',
      });

      expectClassification(result, {
        reason: 'SESSION_EXPIRED',
        category: 'backend',
        severity: 'error',
        httpStatus: 401,
      });
    });
  });

  describe('REFRESH_UNAUTHORIZED', () => {
    it('clasifica 401 refresh genérico sin detail', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
      });

      expectClassification(result, {
        reason: 'REFRESH_UNAUTHORIZED',
        category: 'backend',
        severity: 'error',
        source: 'backend',
        httpStatus: 401,
      });
    });

    it('clasifica 401 refresh con detail no reconocido', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Unauthorized',
      });

      expect(result.reason).toBe('REFRESH_UNAUTHORIZED');
    });
  });

  describe('REFRESH_INVALID', () => {
    it('clasifica token inválido en refresh', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Refresh token inválido o malformado',
      });

      expectClassification(result, {
        reason: 'REFRESH_INVALID',
        category: 'backend',
        severity: 'error',
        httpStatus: 401,
      });
    });

    it('clasifica not_found en detail', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Refresh token not_found',
      });

      expect(result.reason).toBe('REFRESH_INVALID');
    });
  });

  describe('REFRESH_REVOKED', () => {
    it('clasifica sesión revocada por admin', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'La sesión fue revocada por el administrador',
      });

      expectClassification(result, {
        reason: 'REFRESH_REVOKED',
        category: 'backend',
        severity: 'error',
        httpStatus: 401,
      });
    });

    it('clasifica remotely revoked en inglés', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Session remotely revoked',
      });

      expect(result.reason).toBe('REFRESH_REVOKED');
    });

    it('clasifica 403 sin detail como REFRESH_REVOKED', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 403,
        url: REFRESH_URL,
      });

      expect(result.reason).toBe('REFRESH_REVOKED');
    });
  });

  describe('TOKEN_REUSE', () => {
    it('clasifica token_reuse explícito', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'token_reuse detected',
      });

      expectClassification(result, {
        reason: 'TOKEN_REUSE',
        category: 'security',
        severity: 'error',
        source: 'backend',
        httpStatus: 401,
      });
    });

    it('clasifica mensaje de seguridad con todas las sesiones', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Por seguridad, se cerraron todas sus sesiones',
      });

      expect(result.reason).toBe('TOKEN_REUSE');
    });

    it('prioriza TOKEN_REUSE sobre SESSION_EXPIRED cuando coexisten indicadores', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'token_reuse: sesión expirada por seguridad',
      });

      expect(result.reason).toBe('TOKEN_REUSE');
    });
  });

  describe('IDLE_TIMEOUT', () => {
    it('clasifica inactividad en español', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Sesión cerrada por inactividad',
      });

      expectClassification(result, {
        reason: 'IDLE_TIMEOUT',
        category: 'backend',
        severity: 'warning',
        httpStatus: 401,
      });
    });

    it('clasifica idle_timeout en detail', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'idle_timeout exceeded',
      });

      expect(result.reason).toBe('IDLE_TIMEOUT');
    });
  });

  describe('ABSOLUTE_EXPIRY', () => {
    it('clasifica expiración absoluta', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'La sesión alcanzó su expiración absoluta (expires_at)',
      });

      expectClassification(result, {
        reason: 'ABSOLUTE_EXPIRY',
        category: 'backend',
        severity: 'error',
        httpStatus: 401,
      });
    });

    it('clasifica caducidad absoluta', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Caducidad de sesión alcanzada',
      });

      expect(result.reason).toBe('ABSOLUTE_EXPIRY');
    });
  });

  describe('UNKNOWN', () => {
    it('clasifica entrada vacía como UNKNOWN', () => {
      const result = parseTerminationFromHttp({});

      expectClassification(result, {
        reason: 'UNKNOWN',
        category: 'unknown',
        severity: 'warning',
        source: 'unknown',
      });
    });

    it('clasifica status no mapeado sin detail como UNKNOWN', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 500,
        url: '/api/v1/auth/me',
      });

      expect(result.reason).toBe('UNKNOWN');
    });
  });

  describe('Errores HTTP — detail Pydantic', () => {
    it('concatena array Pydantic en detail', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: [{ msg: 'token_reuse' }, { msg: 'detected' }],
      });

      expect(result.reason).toBe('TOKEN_REUSE');
      expect(result.detail).toBe('token_reuse detected');
    });
  });

  describe('Casos inválidos', () => {
    it('ignora detail vacío y usa fallback refresh 401', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: '   ',
      });

      expect(result.reason).toBe('REFRESH_UNAUTHORIZED');
      expect(result.detail).toBeUndefined();
    });

    it('ignora detail no string ni array', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: { code: 'TOKEN_REUSE' },
      });

      expect(result.reason).toBe('REFRESH_UNAUTHORIZED');
      expect(result.detail).toBeUndefined();
    });

    it('normaliza URL con espacios y mayúsculas', () => {
      const result = parseTerminationFromHttp({
        httpStatus: 401,
        url: '  /API/V1/AUTH/REFRESH/  ',
      });

      expect(result.reason).toBe('REFRESH_UNAUTHORIZED');
    });
  });
});

describe('classifySessionTermination', () => {
  describe('MANUAL_LOGOUT', () => {
    it('clasifica logout manual por context', () => {
      const result = classifySessionTermination({ context: 'manual' });

      expectClassification(result, {
        reason: 'MANUAL_LOGOUT',
        category: 'frontend',
        severity: 'info',
        source: 'frontend',
      });
    });

    it('respeta reasonHint MANUAL_LOGOUT', () => {
      const result = classifySessionTermination({
        reasonHint: 'MANUAL_LOGOUT',
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'token_reuse',
      });

      expect(result.reason).toBe('MANUAL_LOGOUT');
    });
  });

  describe('HYDRATE_FAILED', () => {
    it('clasifica fallo hydrate por context', () => {
      const result = classifySessionTermination({ context: 'hydrate' });

      expectClassification(result, {
        reason: 'HYDRATE_FAILED',
        category: 'frontend',
        severity: 'error',
        source: 'frontend',
      });
    });
  });

  describe('BOOTSTRAP_FAILED', () => {
    it('clasifica bootstrap 401', () => {
      const result = classifySessionTermination({
        context: 'bootstrap',
        httpStatus: 401,
        url: REFRESH_URL,
      });

      expect(result.reason).toBe('BOOTSTRAP_FAILED');
    });

    it('clasifica bootstrap 500', () => {
      const result = classifySessionTermination({
        context: 'bootstrap',
        httpStatus: 500,
      });

      expect(result.reason).toBe('BOOTSTRAP_FAILED');
    });

    it('prioriza TOKEN_REUSE del detail sobre bootstrap context', () => {
      const result = classifySessionTermination({
        context: 'bootstrap',
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'token_reuse detected',
      });

      expect(result.reason).toBe('TOKEN_REUSE');
    });

    it('usa BOOTSTRAP_FAILED cuando refresh 401 es genérico', () => {
      const result = classifySessionTermination({
        context: 'bootstrap',
        httpStatus: 401,
        url: REFRESH_URL,
      });

      expect(result.reason).toBe('BOOTSTRAP_FAILED');
    });
  });

  describe('Delegación HTTP', () => {
    it('delega a parseTerminationFromHttp cuando hay datos HTTP', () => {
      const result = classifySessionTermination({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Su sesión fue cerrada remotamente',
      });

      expect(result.reason).toBe('SESSION_EXPIRED');
    });
  });

  describe('UNKNOWN', () => {
    it('retorna UNKNOWN sin contexto ni HTTP', () => {
      const result = classifySessionTermination({});

      expectClassification(result, {
        reason: 'UNKNOWN',
        category: 'unknown',
        severity: 'warning',
      });
    });
  });

  describe('Idempotencia', () => {
    it('produce clasificación estructuralmente igual en llamadas repetidas', () => {
      const input: ClassifySessionTerminationInput = {
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'token_reuse detected',
      };

      const first = classifySessionTermination(input);
      const second = classifySessionTermination(input);

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });

    it('parseTerminationFromHttp es idempotente', () => {
      const input = {
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'Sesión cerrada por inactividad',
      };

      const first = parseTerminationFromHttp(input);
      const second = parseTerminationFromHttp(input);

      expect(first).toEqual(second);
    });
  });

  describe('Inmutabilidad', () => {
    it('retorna objeto congelado', () => {
      const result = classifySessionTermination({
        httpStatus: 401,
        url: REFRESH_URL,
      });

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('mutar input no altera segunda clasificación', () => {
      const input: ClassifySessionTerminationInput = {
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'token_reuse',
      };

      const first = classifySessionTermination(input);
      input.detail = 'sesión expirada';
      input.httpStatus = 500;

      const second = classifySessionTermination({
        httpStatus: 401,
        url: REFRESH_URL,
        detail: 'token_reuse',
      });

      expect(first).toEqual(second);
    });
  });
});

describe('isSecurityTermination', () => {
  it('retorna true solo para TOKEN_REUSE', () => {
    expect(isSecurityTermination('TOKEN_REUSE')).toBe(true);
  });

  it('retorna false para motivos no de seguridad', () => {
    const nonSecurity: SessionTerminationReason[] = [
      'SESSION_EXPIRED',
      'REFRESH_INVALID',
      'REFRESH_REVOKED',
      'MANUAL_LOGOUT',
      'HYDRATE_FAILED',
      'ABSOLUTE_EXPIRY',
      'IDLE_TIMEOUT',
      'UNKNOWN',
      'REFRESH_UNAUTHORIZED',
    ];

    for (const reason of nonSecurity) {
      expect(isSecurityTermination(reason)).toBe(false);
    }
  });
});

describe('isRecoverableTermination', () => {
  it('retorna false para TOKEN_REUSE', () => {
    expect(isRecoverableTermination('TOKEN_REUSE')).toBe(false);
  });

  it('retorna true para terminaciones recuperables con login estándar', () => {
    const recoverable: SessionTerminationReason[] = [
      'SESSION_EXPIRED',
      'REFRESH_INVALID',
      'REFRESH_REVOKED',
      'MANUAL_LOGOUT',
      'HYDRATE_FAILED',
      'ABSOLUTE_EXPIRY',
      'IDLE_TIMEOUT',
      'UNKNOWN',
      'REFRESH_UNAUTHORIZED',
      'BOOTSTRAP_FAILED',
    ];

    for (const reason of recoverable) {
      expect(isRecoverableTermination(reason)).toBe(true);
    }
  });
});
