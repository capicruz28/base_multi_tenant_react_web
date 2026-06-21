import { describe, expect, it, beforeEach } from 'vitest';

import { registerCambiarEmpresaL02Guard, resetCambiarEmpresaL02GuardForTests } from '../session-cambiar-empresa-l02';
import {
  buildRefreshOutcomeMetadata,
  resolveFailureRefreshOutcome,
  resolveSuccessRefreshOutcome,
} from '../session-refresh-outcome.resolver';

describe('session-refresh-outcome.resolver (IMPL-04 / IMPL-11)', () => {
  beforeEach(() => {
    resetCambiarEmpresaL02GuardForTests();
  });

  describe('resolveSuccessRefreshOutcome', () => {
    it('V5.5 — líder single-flight → ROTATED', () => {
      expect(resolveSuccessRefreshOutcome({ singleFlightRole: 'leader' })).toBe('ROTATED');
    });

    it('follower en cola → ALREADY_ROTATED', () => {
      expect(resolveSuccessRefreshOutcome({ singleFlightRole: 'queued' })).toBe(
        'ALREADY_ROTATED',
      );
    });

    it('L-02 guard activo → ALREADY_ROTATED (heurística §6.2)', () => {
      registerCambiarEmpresaL02Guard('empresa-aaa', 1_000);
      expect(resolveSuccessRefreshOutcome({ singleFlightRole: 'leader', nowMs: 1_000 })).toBe(
        'ALREADY_ROTATED',
      );
    });
  });

  describe('resolveFailureRefreshOutcome', () => {
    it('401 genérico → REFRESH_FAILED_401', () => {
      expect(
        resolveFailureRefreshOutcome({
          http: { httpStatus: 401 },
          source: 'interceptor',
          attemptCount: 1,
          backoffMsApplied: 0,
        }),
      ).toBe('REFRESH_FAILED_401');
    });

    it('401 con detail token_reuse → REFRESH_FAILED_TOKEN_REUSE', () => {
      expect(
        resolveFailureRefreshOutcome({
          http: {
            httpStatus: 401,
            detail: 'token_reuse detected — todas sus sesiones cerradas',
          },
          source: 'interceptor',
          attemptCount: 1,
          backoffMsApplied: 0,
        }),
      ).toBe('REFRESH_FAILED_TOKEN_REUSE');
    });

    it('500 agotado → REFRESH_FAILED_500_EXHAUSTED', () => {
      expect(
        resolveFailureRefreshOutcome({
          http: { httpStatus: 500 },
          source: 'bootstrap',
          attemptCount: 2,
          backoffMsApplied: 500,
        }),
      ).toBe('REFRESH_FAILED_500_EXHAUSTED');
    });

    it('429 agotado → REFRESH_FAILED_429_EXHAUSTED', () => {
      expect(
        resolveFailureRefreshOutcome({
          http: { httpStatus: 429 },
          source: 'interceptor',
          attemptCount: 2,
          backoffMsApplied: 1_000,
        }),
      ).toBe('REFRESH_FAILED_429_EXHAUSTED');
    });

    it('401 con guard L-02 activo → REFRESH_FAILED_401 (no TOKEN_REUSE)', () => {
      registerCambiarEmpresaL02Guard('empresa-aaa', 1_000);
      expect(
        resolveFailureRefreshOutcome({
          http: {
            httpStatus: 401,
            detail: 'token_reuse detected',
          },
          source: 'interceptor',
          attemptCount: 1,
          backoffMsApplied: 0,
          nowMs: 1_000,
        }),
      ).toBe('REFRESH_FAILED_401');
    });
  });

  describe('buildRefreshOutcomeMetadata', () => {
    it('incluye source, attemptCount y singleFlightRole', () => {
      const metadata = buildRefreshOutcomeMetadata('ROTATED', {
        source: 'interceptor',
        attemptCount: 1,
        backoffMsApplied: 0,
        singleFlightRole: 'leader',
        httpStatus: 200,
        nowMs: 1_000,
      });

      expect(metadata).toMatchObject({
        outcome: 'ROTATED',
        source: 'interceptor',
        attemptCount: 1,
        singleFlightRole: 'leader',
        httpStatus: 200,
      });
    });
  });
});
