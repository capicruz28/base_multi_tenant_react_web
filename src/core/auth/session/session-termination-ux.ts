/**
 * Política UX de terminación de sesión — IAM-FE-PHASE-02 Paso 2.
 * Módulo puro: sin React, router, toast ni efectos secundarios.
 */

import type {
  SessionTerminationReason,
  SessionTerminationSeverity,
} from './session-termination-reason';

/** Query param `session` soportado por la página de login (Paso 8). */
export type SessionLoginQueryParam = 'expired' | 'security' | 'idle' | 'error';

/** Perfil UX resuelto para un motivo de terminación. */
export interface SessionTerminationUxProfile {
  readonly reason: SessionTerminationReason;
  readonly toastMessage: string | null;
  readonly loginQueryParam?: SessionLoginQueryParam;
  readonly severity: SessionTerminationSeverity;
  readonly redirectPath: string;
}

export interface ResolveTerminationUxOptions {
  /** Detail del backend; prioridad sobre copy FE cuando aplique (§20.2). */
  backendDetail?: string;
  /** Ruta base de login. Default `/login`. */
  loginPath?: string;
}

export interface BuildLoginRedirectPathOptions {
  /** Ruta base de login. Default `/login`. */
  loginPath?: string;
}

interface ReasonUxDefinition {
  readonly defaultToastMessage: string | null;
  readonly loginQueryParam?: SessionLoginQueryParam;
  readonly severity: SessionTerminationSeverity;
  readonly prefersBackendDetail: boolean;
}

/** Mensaje canónico §19 — refresh 401 / session expired. */
export const SESSION_EXPIRED_CANONICAL_MESSAGE =
  'Sesión expirada o cerrada remotamente. Por favor, vuelva a iniciar sesión.';

/** Mensaje canónico TOKEN_REUSE (§20.2). */
export const TOKEN_REUSE_CANONICAL_MESSAGE =
  'Por seguridad, tu sesión fue cerrada en todos los dispositivos. Inicia sesión nuevamente.';

const IDLE_TIMEOUT_MESSAGE = 'Sesión cerrada por inactividad.';
const HYDRATE_FAILED_MESSAGE = 'No se pudo restaurar la sesión.';
const MANUAL_LOGOUT_MESSAGE = 'Sesión cerrada.';
const REFRESH_REVOKED_MESSAGE =
  'Tu sesión fue cerrada remotamente. Por favor, vuelva a iniciar sesión.';
const REFRESH_INVALID_MESSAGE =
  'Tu sesión no es válida. Por favor, vuelva a iniciar sesión.';
const SELECTION_INVALID_MESSAGE =
  'La selección de empresa no es válida. Por favor, vuelva a iniciar sesión.';
const IMPERSONATION_END_MESSAGE = 'Modo soporte finalizado.';
const UNKNOWN_MESSAGE =
  'No se pudo continuar con la sesión. Por favor, vuelva a iniciar sesión.';

const DEFAULT_LOGIN_PATH = '/login';

const UX_BY_REASON: Readonly<Record<SessionTerminationReason, ReasonUxDefinition>> = {
  MANUAL_LOGOUT: {
    defaultToastMessage: MANUAL_LOGOUT_MESSAGE,
    severity: 'info',
    prefersBackendDetail: false,
  },
  REFRESH_UNAUTHORIZED: {
    defaultToastMessage: SESSION_EXPIRED_CANONICAL_MESSAGE,
    loginQueryParam: 'expired',
    severity: 'error',
    prefersBackendDetail: true,
  },
  SESSION_EXPIRED: {
    defaultToastMessage: SESSION_EXPIRED_CANONICAL_MESSAGE,
    loginQueryParam: 'expired',
    severity: 'error',
    prefersBackendDetail: true,
  },
  TOKEN_REUSE: {
    defaultToastMessage: TOKEN_REUSE_CANONICAL_MESSAGE,
    loginQueryParam: 'security',
    severity: 'error',
    prefersBackendDetail: true,
  },
  REFRESH_REVOKED: {
    defaultToastMessage: REFRESH_REVOKED_MESSAGE,
    loginQueryParam: 'expired',
    severity: 'error',
    prefersBackendDetail: true,
  },
  IDLE_TIMEOUT: {
    defaultToastMessage: IDLE_TIMEOUT_MESSAGE,
    loginQueryParam: 'idle',
    severity: 'warning',
    prefersBackendDetail: true,
  },
  ABSOLUTE_EXPIRY: {
    defaultToastMessage: SESSION_EXPIRED_CANONICAL_MESSAGE,
    loginQueryParam: 'expired',
    severity: 'error',
    prefersBackendDetail: true,
  },
  REFRESH_INVALID: {
    defaultToastMessage: REFRESH_INVALID_MESSAGE,
    loginQueryParam: 'error',
    severity: 'error',
    prefersBackendDetail: true,
  },
  HYDRATE_FAILED: {
    defaultToastMessage: HYDRATE_FAILED_MESSAGE,
    loginQueryParam: 'error',
    severity: 'error',
    prefersBackendDetail: false,
  },
  BOOTSTRAP_FAILED: {
    defaultToastMessage: SESSION_EXPIRED_CANONICAL_MESSAGE,
    loginQueryParam: 'expired',
    severity: 'error',
    prefersBackendDetail: true,
  },
  SELECTION_INVALID: {
    defaultToastMessage: SELECTION_INVALID_MESSAGE,
    loginQueryParam: 'error',
    severity: 'error',
    prefersBackendDetail: false,
  },
  IMPERSONATION_END: {
    defaultToastMessage: IMPERSONATION_END_MESSAGE,
    severity: 'info',
    prefersBackendDetail: false,
  },
  SILENT_CLEANUP: {
    defaultToastMessage: null,
    severity: 'info',
    prefersBackendDetail: false,
  },
  UNKNOWN: {
    defaultToastMessage: UNKNOWN_MESSAGE,
    loginQueryParam: 'error',
    severity: 'warning',
    prefersBackendDetail: false,
  },
};

function normalizeBackendDetail(detail: string | undefined): string | undefined {
  if (!detail) {
    return undefined;
  }
  const trimmed = detail.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeLoginPath(loginPath: string | undefined): string {
  const trimmed = (loginPath ?? DEFAULT_LOGIN_PATH).trim();
  if (trimmed.length === 0) {
    return DEFAULT_LOGIN_PATH;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function resolveToastMessage(
  definition: ReasonUxDefinition,
  backendDetail: string | undefined,
): string | null {
  if (definition.defaultToastMessage === null) {
    return null;
  }
  if (definition.prefersBackendDetail && backendDetail) {
    return backendDetail;
  }
  return definition.defaultToastMessage;
}

/**
 * Resuelve el perfil UX completo para un motivo de terminación.
 * Idempotente: misma entrada → misma salida estructural.
 */
export function resolveTerminationUx(
  reason: SessionTerminationReason,
  options?: ResolveTerminationUxOptions,
): SessionTerminationUxProfile {
  const definition = UX_BY_REASON[reason];
  const backendDetail = normalizeBackendDetail(options?.backendDetail);
  const loginPath = normalizeLoginPath(options?.loginPath);
  const toastMessage = resolveToastMessage(definition, backendDetail);

  return Object.freeze({
    reason,
    toastMessage,
    ...(definition.loginQueryParam !== undefined
      ? { loginQueryParam: definition.loginQueryParam }
      : {}),
    severity: definition.severity,
    redirectPath: buildLoginRedirectPath(reason, { loginPath }),
  });
}

/**
 * Construye la ruta de redirect post-terminación (`/login?session=...`).
 * No preserva `from` ni returnTo (§20.3).
 */
export function buildLoginRedirectPath(
  reason: SessionTerminationReason,
  options?: BuildLoginRedirectPathOptions,
): string {
  const loginPath = normalizeLoginPath(options?.loginPath);
  const queryParam = UX_BY_REASON[reason].loginQueryParam;

  if (!queryParam) {
    return loginPath;
  }

  return `${loginPath}?session=${queryParam}`;
}

/** true si el motivo debe mostrar toast (excluye SILENT_CLEANUP). */
export function shouldShowTerminationToast(reason: SessionTerminationReason): boolean {
  return UX_BY_REASON[reason].defaultToastMessage !== null;
}

/** true si el login debe mostrar banner según query param. */
export function shouldShowLoginBanner(reason: SessionTerminationReason): boolean {
  return UX_BY_REASON[reason].loginQueryParam !== undefined;
}

/** Resuelve el query param `session` para la página de login. */
export function resolveLoginSessionQueryParam(
  reason: SessionTerminationReason,
): SessionLoginQueryParam | undefined {
  return UX_BY_REASON[reason].loginQueryParam;
}

/** Mensaje para banner de login; prioriza backendDetail cuando aplique. */
export function resolveLoginBannerMessage(
  reason: SessionTerminationReason,
  options?: ResolveTerminationUxOptions,
): string | null {
  const profile = resolveTerminationUx(reason, options);
  return profile.toastMessage;
}

/** Severidad UX asociada al motivo. */
export function resolveTerminationUxSeverity(
  reason: SessionTerminationReason,
): SessionTerminationSeverity {
  return UX_BY_REASON[reason].severity;
}
