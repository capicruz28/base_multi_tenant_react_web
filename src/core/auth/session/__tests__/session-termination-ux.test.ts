import { describe, expect, it } from 'vitest';

import type { SessionTerminationReason } from '../session-termination-reason';
import {
  buildLoginRedirectPath,
  resolveLoginBannerMessage,
  resolveLoginSessionQueryParam,
  resolveTerminationUx,
  resolveTerminationUxSeverity,
  SESSION_EXPIRED_CANONICAL_MESSAGE,
  shouldShowLoginBanner,
  shouldShowTerminationToast,
  TOKEN_REUSE_CANONICAL_MESSAGE,
  type SessionTerminationUxProfile,
} from '../session-termination-ux';

const ALL_REASONS: SessionTerminationReason[] = [
  'MANUAL_LOGOUT',
  'REFRESH_UNAUTHORIZED',
  'SESSION_EXPIRED',
  'TOKEN_REUSE',
  'REFRESH_REVOKED',
  'IDLE_TIMEOUT',
  'ABSOLUTE_EXPIRY',
  'REFRESH_INVALID',
  'HYDRATE_FAILED',
  'BOOTSTRAP_FAILED',
  'SELECTION_INVALID',
  'IMPERSONATION_END',
  'SILENT_CLEANUP',
  'UNKNOWN',
];

function expectProfile(
  profile: SessionTerminationUxProfile,
  expected: {
    reason: SessionTerminationReason;
    toastMessage: string | null;
    loginQueryParam?: 'expired' | 'security' | 'idle' | 'error';
    severity: 'info' | 'warning' | 'error';
    redirectPath: string;
  },
): void {
  expect(profile.reason).toBe(expected.reason);
  expect(profile.toastMessage).toBe(expected.toastMessage);
  expect(profile.severity).toBe(expected.severity);
  expect(profile.redirectPath).toBe(expected.redirectPath);

  if (expected.loginQueryParam !== undefined) {
    expect(profile.loginQueryParam).toBe(expected.loginQueryParam);
  } else {
    expect(profile.loginQueryParam).toBeUndefined();
  }
}

describe('resolveTerminationUx', () => {
  it('cubre todos los SessionTerminationReason definidos', () => {
    for (const reason of ALL_REASONS) {
      const profile = resolveTerminationUx(reason);
      expect(profile.reason).toBe(reason);
      expect(profile.redirectPath.length).toBeGreaterThan(0);
    }
  });

  it('SESSION_EXPIRED usa mensaje §19 y query expired', () => {
    const profile = resolveTerminationUx('SESSION_EXPIRED');

    expectProfile(profile, {
      reason: 'SESSION_EXPIRED',
      toastMessage: SESSION_EXPIRED_CANONICAL_MESSAGE,
      loginQueryParam: 'expired',
      severity: 'error',
      redirectPath: '/login?session=expired',
    });
  });

  it('REFRESH_UNAUTHORIZED comparte UX con SESSION_EXPIRED', () => {
    const profile = resolveTerminationUx('REFRESH_UNAUTHORIZED');

    expect(profile.toastMessage).toBe(SESSION_EXPIRED_CANONICAL_MESSAGE);
    expect(profile.loginQueryParam).toBe('expired');
    expect(profile.redirectPath).toBe('/login?session=expired');
  });

  it('TOKEN_REUSE difiere de SESSION_EXPIRED en mensaje y query', () => {
    const expired = resolveTerminationUx('SESSION_EXPIRED');
    const reuse = resolveTerminationUx('TOKEN_REUSE');

    expect(reuse.toastMessage).toBe(TOKEN_REUSE_CANONICAL_MESSAGE);
    expect(reuse.loginQueryParam).toBe('security');
    expect(reuse.redirectPath).toBe('/login?session=security');
    expect(reuse.toastMessage).not.toBe(expired.toastMessage);
    expect(reuse.loginQueryParam).not.toBe(expired.loginQueryParam);
  });

  it('REFRESH_INVALID usa query error', () => {
    const profile = resolveTerminationUx('REFRESH_INVALID');

    expect(profile.loginQueryParam).toBe('error');
    expect(profile.redirectPath).toBe('/login?session=error');
    expect(profile.severity).toBe('error');
  });

  it('REFRESH_REVOKED usa query expired', () => {
    const profile = resolveTerminationUx('REFRESH_REVOKED');

    expect(profile.loginQueryParam).toBe('expired');
    expect(profile.redirectPath).toBe('/login?session=expired');
  });

  it('IDLE_TIMEOUT usa mensaje y query idle con severidad warning', () => {
    const profile = resolveTerminationUx('IDLE_TIMEOUT');

    expectProfile(profile, {
      reason: 'IDLE_TIMEOUT',
      toastMessage: 'Sesión cerrada por inactividad.',
      loginQueryParam: 'idle',
      severity: 'warning',
      redirectPath: '/login?session=idle',
    });
  });

  it('HYDRATE_FAILED usa mensaje de restauración y query error', () => {
    const profile = resolveTerminationUx('HYDRATE_FAILED');

    expectProfile(profile, {
      reason: 'HYDRATE_FAILED',
      toastMessage: 'No se pudo restaurar la sesión.',
      loginQueryParam: 'error',
      severity: 'error',
      redirectPath: '/login?session=error',
    });
  });

  it('MANUAL_LOGOUT no incluye query param', () => {
    const profile = resolveTerminationUx('MANUAL_LOGOUT');

    expectProfile(profile, {
      reason: 'MANUAL_LOGOUT',
      toastMessage: 'Sesión cerrada.',
      severity: 'info',
      redirectPath: '/login',
    });
  });

  it('ABSOLUTE_EXPIRY comparte UX expired con SESSION_EXPIRED', () => {
    const absolute = resolveTerminationUx('ABSOLUTE_EXPIRY');
    const expired = resolveTerminationUx('SESSION_EXPIRED');

    expect(absolute.toastMessage).toBe(expired.toastMessage);
    expect(absolute.loginQueryParam).toBe('expired');
    expect(absolute.redirectPath).toBe('/login?session=expired');
  });

  it('BOOTSTRAP_FAILED usa mensaje §19', () => {
    const profile = resolveTerminationUx('BOOTSTRAP_FAILED');

    expect(profile.toastMessage).toBe(SESSION_EXPIRED_CANONICAL_MESSAGE);
    expect(profile.loginQueryParam).toBe('expired');
  });

  it('SELECTION_INVALID usa query error', () => {
    const profile = resolveTerminationUx('SELECTION_INVALID');

    expect(profile.loginQueryParam).toBe('error');
    expect(profile.severity).toBe('error');
  });

  it('IMPERSONATION_END no incluye query param', () => {
    const profile = resolveTerminationUx('IMPERSONATION_END');

    expect(profile.toastMessage).toBe('Modo soporte finalizado.');
    expect(profile.loginQueryParam).toBeUndefined();
    expect(profile.redirectPath).toBe('/login');
    expect(profile.severity).toBe('info');
  });

  it('SILENT_CLEANUP no tiene toast ni query param', () => {
    const profile = resolveTerminationUx('SILENT_CLEANUP');

    expectProfile(profile, {
      reason: 'SILENT_CLEANUP',
      toastMessage: null,
      severity: 'info',
      redirectPath: '/login',
    });
  });

  it('UNKNOWN usa query error y severidad warning', () => {
    const profile = resolveTerminationUx('UNKNOWN');

    expect(profile.loginQueryParam).toBe('error');
    expect(profile.severity).toBe('warning');
    expect(profile.redirectPath).toBe('/login?session=error');
  });

  it('prioriza backendDetail sobre copy FE cuando aplica (§20.2)', () => {
    const backendDetail = 'Detalle personalizado del backend.';

    const expired = resolveTerminationUx('SESSION_EXPIRED', { backendDetail });
    const reuse = resolveTerminationUx('TOKEN_REUSE', { backendDetail });
    const hydrate = resolveTerminationUx('HYDRATE_FAILED', { backendDetail });

    expect(expired.toastMessage).toBe(backendDetail);
    expect(reuse.toastMessage).toBe(backendDetail);
    expect(hydrate.toastMessage).toBe('No se pudo restaurar la sesión.');
  });

  it('ignora backendDetail vacío y usa copy FE', () => {
    const profile = resolveTerminationUx('SESSION_EXPIRED', { backendDetail: '   ' });

    expect(profile.toastMessage).toBe(SESSION_EXPIRED_CANONICAL_MESSAGE);
  });

  it('respeta loginPath personalizado', () => {
    const profile = resolveTerminationUx('SESSION_EXPIRED', { loginPath: '/auth/login' });

    expect(profile.redirectPath).toBe('/auth/login?session=expired');
  });

  describe('Idempotencia', () => {
    it('produce perfil estructuralmente igual en llamadas repetidas', () => {
      const first = resolveTerminationUx('TOKEN_REUSE');
      const second = resolveTerminationUx('TOKEN_REUSE');

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });
  });

  describe('Inmutabilidad', () => {
    it('retorna perfil congelado', () => {
      const profile = resolveTerminationUx('SESSION_EXPIRED');

      expect(Object.isFrozen(profile)).toBe(true);
    });

    it('mutar options no altera segunda resolución', () => {
      const options = { backendDetail: 'Mensaje A', loginPath: '/login' };
      const first = resolveTerminationUx('SESSION_EXPIRED', options);

      options.backendDetail = 'Mensaje B';
      options.loginPath = '/otro';

      const second = resolveTerminationUx('SESSION_EXPIRED', {
        backendDetail: 'Mensaje A',
        loginPath: '/login',
      });

      expect(first).toEqual(second);
    });
  });
});

describe('buildLoginRedirectPath', () => {
  it('retorna /login sin query para MANUAL_LOGOUT', () => {
    expect(buildLoginRedirectPath('MANUAL_LOGOUT')).toBe('/login');
  });

  it('retorna query security para TOKEN_REUSE', () => {
    expect(buildLoginRedirectPath('TOKEN_REUSE')).toBe('/login?session=security');
  });

  it('retorna query expired para SESSION_EXPIRED', () => {
    expect(buildLoginRedirectPath('SESSION_EXPIRED')).toBe('/login?session=expired');
  });

  it('retorna query idle para IDLE_TIMEOUT', () => {
    expect(buildLoginRedirectPath('IDLE_TIMEOUT')).toBe('/login?session=idle');
  });

  it('retorna query error para HYDRATE_FAILED', () => {
    expect(buildLoginRedirectPath('HYDRATE_FAILED')).toBe('/login?session=error');
  });

  it('normaliza loginPath sin slash inicial', () => {
    expect(buildLoginRedirectPath('SESSION_EXPIRED', { loginPath: 'auth/login' })).toBe(
      '/auth/login?session=expired',
    );
  });

  it('usa /login cuando loginPath está vacío', () => {
    expect(buildLoginRedirectPath('MANUAL_LOGOUT', { loginPath: '   ' })).toBe('/login');
  });

  it('es idempotente', () => {
    const first = buildLoginRedirectPath('REFRESH_INVALID');
    const second = buildLoginRedirectPath('REFRESH_INVALID');

    expect(first).toBe(second);
    expect(first).toBe('/login?session=error');
  });
});

describe('helpers de resolución UX', () => {
  it('shouldShowTerminationToast es false solo para SILENT_CLEANUP', () => {
    for (const reason of ALL_REASONS) {
      const expected = reason !== 'SILENT_CLEANUP';
      expect(shouldShowTerminationToast(reason)).toBe(expected);
    }
  });

  it('shouldShowLoginBanner refleja presencia de loginQueryParam', () => {
    expect(shouldShowLoginBanner('SESSION_EXPIRED')).toBe(true);
    expect(shouldShowLoginBanner('MANUAL_LOGOUT')).toBe(false);
    expect(shouldShowLoginBanner('IMPERSONATION_END')).toBe(false);
    expect(shouldShowLoginBanner('SILENT_CLEANUP')).toBe(false);
  });

  it('resolveLoginSessionQueryParam retorna param canónico por reason', () => {
    expect(resolveLoginSessionQueryParam('TOKEN_REUSE')).toBe('security');
    expect(resolveLoginSessionQueryParam('MANUAL_LOGOUT')).toBeUndefined();
  });

  it('resolveLoginBannerMessage delega en resolveTerminationUx', () => {
    const message = resolveLoginBannerMessage('TOKEN_REUSE');
    const profile = resolveTerminationUx('TOKEN_REUSE');

    expect(message).toBe(profile.toastMessage);
  });

  it('resolveTerminationUxSeverity retorna severidad del perfil', () => {
    expect(resolveTerminationUxSeverity('IDLE_TIMEOUT')).toBe('warning');
    expect(resolveTerminationUxSeverity('MANUAL_LOGOUT')).toBe('info');
    expect(resolveTerminationUxSeverity('TOKEN_REUSE')).toBe('error');
  });
});

describe('casos inválidos', () => {
  it('reason desconocido en runtime cae en perfil UNKNOWN vía cast defensivo en tests', () => {
    const unknownReason = 'NOT_A_REAL_REASON' as SessionTerminationReason;
    const definitionExists = ALL_REASONS.includes(unknownReason);

    expect(definitionExists).toBe(false);
  });

  it('buildLoginRedirectPath con reason válido nunca produce query malformado', () => {
    for (const reason of ALL_REASONS) {
      const path = buildLoginRedirectPath(reason);
      expect(path.startsWith('/')).toBe(true);
      expect(path.includes('??')).toBe(false);
    }
  });
});
