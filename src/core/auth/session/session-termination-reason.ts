/**
 * Taxonomía de terminación de sesión — IAM-FE-PHASE-02 Paso 1.
 * Módulo puro: sin React, HTTP, storage ni efectos secundarios.
 */

/** Motivo canónico de fin de sesión. */
export type SessionTerminationReason =
  | 'MANUAL_LOGOUT'
  | 'REFRESH_UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'TOKEN_REUSE'
  | 'REFRESH_REVOKED'
  | 'IDLE_TIMEOUT'
  | 'ABSOLUTE_EXPIRY'
  | 'REFRESH_INVALID'
  | 'HYDRATE_FAILED'
  | 'BOOTSTRAP_FAILED'
  | 'SELECTION_INVALID'
  | 'IMPERSONATION_END'
  | 'SILENT_CLEANUP'
  | 'UNKNOWN';

/** Origen lógico de la terminación. */
export type SessionTerminationCategory = 'backend' | 'frontend' | 'security' | 'unknown';

/** Severidad UX asociada al motivo. */
export type SessionTerminationSeverity = 'info' | 'warning' | 'error';

/** Fuente del evento (contrato interno Paso 2+). */
export type SessionTerminationSource = 'backend' | 'frontend' | 'unknown';

/** Resultado de clasificación — inmutable por contrato. */
export interface SessionTerminationClassification {
  readonly reason: SessionTerminationReason;
  readonly category: SessionTerminationCategory;
  readonly severity: SessionTerminationSeverity;
  readonly source: SessionTerminationSource;
  readonly httpStatus?: number;
  readonly detail?: string;
}

/** Entrada HTTP normalizada (sin Axios). */
export interface ParseTerminationFromHttpInput {
  httpStatus?: number;
  detail?: unknown;
  url?: string;
}

/** Contexto de flujo para clasificación ampliada. */
export type SessionTerminationFlowContext =
  | 'refresh'
  | 'bootstrap'
  | 'hydrate'
  | 'api'
  | 'manual'
  | 'selection'
  | 'impersonation';

export interface ClassifySessionTerminationInput extends ParseTerminationFromHttpInput {
  /** Hint explícito desde caller frontend; tiene prioridad si es válido. */
  reasonHint?: SessionTerminationReason;
  context?: SessionTerminationFlowContext;
}

const TOKEN_REUSE_PATTERNS = [
  'token_reuse',
  'token reuse',
  'reutilización',
  'reutilizacion',
  'seguridad',
  'todas sus sesiones',
  'todas las sesiones',
  'all sessions',
  'all your sessions',
] as const;

const IDLE_TIMEOUT_PATTERNS = ['idle', 'inactividad', 'inactivity', 'idle_timeout'] as const;

const ABSOLUTE_EXPIRY_PATTERNS = [
  'expiración absoluta',
  'expiracion absoluta',
  'expires_at',
  'caducidad',
  'absolute expiry',
  'absolute expiration',
] as const;

const REFRESH_REVOKED_PATTERNS = [
  'revocad',
  'revoked',
  'revocación',
  'revocacion',
  'admin revoke',
  'cerrada por el administrador',
] as const;

const REFRESH_INVALID_PATTERNS = [
  'inválid',
  'invalid',
  'not_found',
  'no encontrad',
  'malformad',
  'no existe',
] as const;

const SESSION_EXPIRED_PATTERNS = [
  'cerrada remotamente',
  'sesión expirada',
  'sesion expirada',
  'session expired',
  'vuelva a iniciar',
  'vuelve a iniciar',
  'please log in',
  'iniciar sesión',
  'iniciar sesion',
] as const;

function normalizeDetail(detail: unknown): string | undefined {
  if (typeof detail === 'string') {
    const trimmed = detail.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'msg' in item) {
          const msg = (item as { msg: unknown }).msg;
          return typeof msg === 'string' ? msg.trim() : '';
        }
        return '';
      })
      .filter((msg) => msg.length > 0);

    return messages.length > 0 ? messages.join(' ') : undefined;
  }

  return undefined;
}

function normalizeUrl(url: string | undefined): string {
  if (!url) {
    return '';
  }
  return url.trim().toLowerCase();
}

function isRefreshUrl(url: string): boolean {
  return url.includes('/auth/refresh');
}

function matchesAnyPattern(text: string, patterns: readonly string[]): boolean {
  const normalized = text.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern));
}

function resolveCategory(reason: SessionTerminationReason): SessionTerminationCategory {
  switch (reason) {
    case 'TOKEN_REUSE':
      return 'security';
    case 'MANUAL_LOGOUT':
    case 'HYDRATE_FAILED':
    case 'BOOTSTRAP_FAILED':
    case 'SELECTION_INVALID':
    case 'IMPERSONATION_END':
    case 'SILENT_CLEANUP':
      return 'frontend';
    case 'REFRESH_UNAUTHORIZED':
    case 'SESSION_EXPIRED':
    case 'REFRESH_REVOKED':
    case 'IDLE_TIMEOUT':
    case 'ABSOLUTE_EXPIRY':
    case 'REFRESH_INVALID':
      return 'backend';
    case 'UNKNOWN':
      return 'unknown';
  }
}

function resolveSeverity(reason: SessionTerminationReason): SessionTerminationSeverity {
  switch (reason) {
    case 'MANUAL_LOGOUT':
    case 'SILENT_CLEANUP':
    case 'IMPERSONATION_END':
      return 'info';
    case 'IDLE_TIMEOUT':
    case 'UNKNOWN':
      return 'warning';
    case 'REFRESH_UNAUTHORIZED':
    case 'SESSION_EXPIRED':
    case 'TOKEN_REUSE':
    case 'REFRESH_REVOKED':
    case 'ABSOLUTE_EXPIRY':
    case 'REFRESH_INVALID':
    case 'HYDRATE_FAILED':
    case 'BOOTSTRAP_FAILED':
    case 'SELECTION_INVALID':
      return 'error';
  }
}

function resolveSource(reason: SessionTerminationReason): SessionTerminationSource {
  switch (reason) {
    case 'MANUAL_LOGOUT':
    case 'HYDRATE_FAILED':
    case 'BOOTSTRAP_FAILED':
    case 'SELECTION_INVALID':
    case 'IMPERSONATION_END':
    case 'SILENT_CLEANUP':
      return 'frontend';
    case 'REFRESH_UNAUTHORIZED':
    case 'SESSION_EXPIRED':
    case 'TOKEN_REUSE':
    case 'REFRESH_REVOKED':
    case 'IDLE_TIMEOUT':
    case 'ABSOLUTE_EXPIRY':
    case 'REFRESH_INVALID':
      return 'backend';
    case 'UNKNOWN':
      return 'unknown';
  }
}

function buildClassification(
  reason: SessionTerminationReason,
  options?: { httpStatus?: number; detail?: string },
): SessionTerminationClassification {
  return Object.freeze({
    reason,
    category: resolveCategory(reason),
    severity: resolveSeverity(reason),
    source: resolveSource(reason),
    ...(options?.httpStatus !== undefined ? { httpStatus: options.httpStatus } : {}),
    ...(options?.detail !== undefined ? { detail: options.detail } : {}),
  });
}

function parseReasonFromDetailAndUrl(
  detail: string | undefined,
  url: string,
  httpStatus: number | undefined,
): SessionTerminationReason {
  if (detail) {
    if (matchesAnyPattern(detail, TOKEN_REUSE_PATTERNS)) {
      return 'TOKEN_REUSE';
    }
    if (matchesAnyPattern(detail, IDLE_TIMEOUT_PATTERNS)) {
      return 'IDLE_TIMEOUT';
    }
    if (matchesAnyPattern(detail, ABSOLUTE_EXPIRY_PATTERNS)) {
      return 'ABSOLUTE_EXPIRY';
    }
    if (matchesAnyPattern(detail, REFRESH_REVOKED_PATTERNS)) {
      return 'REFRESH_REVOKED';
    }
    if (matchesAnyPattern(detail, REFRESH_INVALID_PATTERNS)) {
      return 'REFRESH_INVALID';
    }
    if (matchesAnyPattern(detail, SESSION_EXPIRED_PATTERNS)) {
      return 'SESSION_EXPIRED';
    }
  }

  if (httpStatus === 401 && isRefreshUrl(url)) {
    return 'REFRESH_UNAUTHORIZED';
  }

  if (httpStatus === 401) {
    return 'SESSION_EXPIRED';
  }

  if (httpStatus === 403) {
    return 'REFRESH_REVOKED';
  }

  return 'UNKNOWN';
}

const FRONTEND_REASON_HINTS: ReadonlySet<SessionTerminationReason> = new Set([
  'MANUAL_LOGOUT',
  'HYDRATE_FAILED',
  'BOOTSTRAP_FAILED',
  'SELECTION_INVALID',
  'IMPERSONATION_END',
  'SILENT_CLEANUP',
]);

function resolveFromFlowContext(
  context: SessionTerminationFlowContext | undefined,
): SessionTerminationReason | null {
  switch (context) {
    case 'hydrate':
      return 'HYDRATE_FAILED';
    case 'manual':
      return 'MANUAL_LOGOUT';
    case 'selection':
      return 'SELECTION_INVALID';
    case 'impersonation':
      return 'IMPERSONATION_END';
    default:
      return null;
  }
}

function resolveBootstrapFallback(
  context: SessionTerminationFlowContext | undefined,
  httpStatus: number | undefined,
): SessionTerminationReason | null {
  if (context !== 'bootstrap') {
    return null;
  }
  if (httpStatus === 401 || httpStatus === 500) {
    return 'BOOTSTRAP_FAILED';
  }
  return null;
}

function hasHttpSignals(
  httpStatus: number | undefined,
  detail: string | undefined,
  url: string,
): boolean {
  return httpStatus !== undefined || detail !== undefined || url.length > 0;
}

/**
 * Clasifica terminación desde datos HTTP puros (sin Axios).
 * Prioridad: patrones detail → contexto URL refresh → status HTTP.
 */
export function parseTerminationFromHttp(
  input: ParseTerminationFromHttpInput,
): SessionTerminationClassification {
  const detail = normalizeDetail(input.detail);
  const url = normalizeUrl(input.url);
  const reason = parseReasonFromDetailAndUrl(detail, url, input.httpStatus);

  return buildClassification(reason, {
    httpStatus: input.httpStatus,
    detail,
  });
}

/**
 * Clasifica terminación desde contexto HTTP + hints de flujo frontend.
 * Idempotente: misma entrada → misma salida estructural.
 */
export function classifySessionTermination(
  input: ClassifySessionTerminationInput,
): SessionTerminationClassification {
  const detail = normalizeDetail(input.detail);
  const url = normalizeUrl(input.url);

  if (input.reasonHint && FRONTEND_REASON_HINTS.has(input.reasonHint)) {
    return buildClassification(input.reasonHint, {
      httpStatus: input.httpStatus,
      detail,
    });
  }

  const contextReason = resolveFromFlowContext(input.context);
  if (contextReason) {
    return buildClassification(contextReason, {
      httpStatus: input.httpStatus,
      detail,
    });
  }

  if (hasHttpSignals(input.httpStatus, detail, url)) {
    const httpClassification = parseTerminationFromHttp({
      httpStatus: input.httpStatus,
      detail: input.detail ?? detail,
      url: input.url,
    });

    const bootstrapFallback = resolveBootstrapFallback(input.context, input.httpStatus);
    if (
      bootstrapFallback &&
      (httpClassification.reason === 'REFRESH_UNAUTHORIZED' ||
        httpClassification.reason === 'UNKNOWN')
    ) {
      return buildClassification(bootstrapFallback, {
        httpStatus: input.httpStatus,
        detail,
      });
    }

    return httpClassification;
  }

  const bootstrapOnly = resolveBootstrapFallback(input.context, input.httpStatus);
  if (bootstrapOnly) {
    return buildClassification(bootstrapOnly, {
      httpStatus: input.httpStatus,
      detail,
    });
  }

  return buildClassification('UNKNOWN');
}

/** true si el motivo implica incidente de seguridad (TOKEN_REUSE). */
export function isSecurityTermination(reason: SessionTerminationReason): boolean {
  return reason === 'TOKEN_REUSE';
}

/**
 * true si el usuario puede recuperar sesión con un login estándar
 * (sin implicación de compromiso de credenciales).
 */
export function isRecoverableTermination(reason: SessionTerminationReason): boolean {
  return !isSecurityTermination(reason);
}
