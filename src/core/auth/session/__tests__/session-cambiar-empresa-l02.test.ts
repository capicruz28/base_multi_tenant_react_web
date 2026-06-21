import { describe, expect, it, beforeEach } from 'vitest';

import {
  applyL02GuardToRefreshClassifyInput,
  CAMBIAR_EMPRESA_L02_GUARD_TTL_MS,
  clearCambiarEmpresaL02Guard,
  getCambiarEmpresaL02Guard,
  isCambiarEmpresaL02GuardActive,
  registerCambiarEmpresaL02Guard,
  resetCambiarEmpresaL02GuardForTests,
} from '../session-cambiar-empresa-l02';
import { classifySessionTermination } from '../session-termination-reason';
import { SESSION_EXPIRED_CANONICAL_MESSAGE } from '../session-termination-ux';

describe('session-cambiar-empresa-l02 (IMPL-06 / IMPL-11)', () => {
  beforeEach(() => {
    resetCambiarEmpresaL02GuardForTests();
  });

  it('registra guard tras cambiarEmpresa OK', () => {
    registerCambiarEmpresaL02Guard('empresa-aaa', 1_000);
    const guard = getCambiarEmpresaL02Guard();

    expect(guard).toMatchObject({
      empresaId: 'empresa-aaa',
      registeredAtMs: 1_000,
      outcomeHint: 'ALREADY_ROTATED_L02',
    });
    expect(isCambiarEmpresaL02GuardActive(1_000)).toBe(true);
  });

  it('TTL 60s — guard expira', () => {
    registerCambiarEmpresaL02Guard('empresa-aaa', 0);
    expect(isCambiarEmpresaL02GuardActive(CAMBIAR_EMPRESA_L02_GUARD_TTL_MS - 1)).toBe(true);
    expect(isCambiarEmpresaL02GuardActive(CAMBIAR_EMPRESA_L02_GUARD_TTL_MS)).toBe(false);
  });

  it('clear guard lo desactiva', () => {
    registerCambiarEmpresaL02Guard('empresa-aaa', 0);
    clearCambiarEmpresaL02Guard();
    expect(isCambiarEmpresaL02GuardActive(0)).toBe(false);
  });

  it('V5.4 — 401 refresh con guard activo → SESSION_EXPIRED (no TOKEN_REUSE)', () => {
    registerCambiarEmpresaL02Guard('empresa-aaa', 1_000);

    const enriched = applyL02GuardToRefreshClassifyInput(
      {
        context: 'refresh',
        httpStatus: 401,
        detail: 'token_reuse detected',
        url: '/auth/refresh/',
      },
      1_000,
    );

    expect(enriched.detail).toBe(SESSION_EXPIRED_CANONICAL_MESSAGE);

    const classification = classifySessionTermination(enriched);
    expect(classification.reason).toBe('SESSION_EXPIRED');
    expect(classification.reason).not.toBe('TOKEN_REUSE');
  });

  it('401 sin guard activo mantiene TOKEN_REUSE si detail aplica', () => {
    const classification = classifySessionTermination({
      context: 'refresh',
      httpStatus: 401,
      detail: 'token_reuse detected — todas sus sesiones',
      url: '/auth/refresh/',
    });

    expect(classification.reason).toBe('TOKEN_REUSE');
  });
});
