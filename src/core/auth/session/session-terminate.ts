/**
 * Orquestador de terminación de sesión — IAM-FE-PHASE-02 Paso 3.
 * Coordina T0→T3 vía DI; sin React, router, toast ni QueryClient directos.
 */

import type { SessionTerminationReason } from './session-termination-reason';
import {
  resolveTerminationUx,
  shouldShowTerminationToast,
  type SessionTerminationUxProfile,
} from './session-termination-ux';

/** Mensaje estable para rechazo de cola interceptor (§13). */
export const SESSION_TERMINATED_ERROR_MESSAGE = 'Session terminated';

export interface TerminateSessionInput {
  /** Motivo canónico ya clasificado (T0 externo o caller). */
  reason: SessionTerminationReason;
  /** POST `/auth/logout/` best-effort. */
  callServer?: boolean;
  /** Error original para logs DEV y extracción opcional de `detail`. */
  error?: unknown;
  /** Solo limpieza; omite redirect (tests / edge impersonation). */
  skipRedirect?: boolean;
  /** Hereda lógica `hadAuthenticatedUser` en cleanup de branding. */
  preservePreLoginBranding?: boolean;
}

export interface ClearAuthStateOptions {
  preservePreLoginBranding?: boolean;
}

export interface TerminateSessionDeps {
  getIsTerminating: () => boolean;
  setIsTerminating: (value: boolean) => void;
  /** Anula single-flight refresh antes de rechazar cola (§6.1, §13). */
  clearRefreshingPromise?: () => void;
  processQueue: (error: Error | null, token: string | null) => void;
  clearAuthState: (options: ClearAuthStateOptions) => void | Promise<void>;
  callLogoutEndpoint: () => void | Promise<void>;
  clearQueryCache: () => void | Promise<void>;
  showTerminationToast: (profile: SessionTerminationUxProfile) => void;
  redirectToLogin: (path: string) => void;
  /** Hook extensible Fase 4; no-op si no se inyecta. */
  emitTerminationEvent?: (payload: TerminateSessionEventPayload) => void;
}

export interface TerminateSessionEventPayload {
  readonly reason: SessionTerminationReason;
  readonly profile: SessionTerminationUxProfile;
  readonly isSecurityTermination: boolean;
}

/** Error estable para `processQueue` en terminación. */
export function createSessionTerminatedError(): Error {
  return new Error(SESSION_TERMINATED_ERROR_MESSAGE);
}

function normalizeDetailValue(detail: unknown): string | undefined {
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
      .filter((message) => message.length > 0);

    return messages.length > 0 ? messages.join(' ') : undefined;
  }

  return undefined;
}

/**
 * Extrae `detail` de errores tipo Axios sin importar Axios.
 * Usado en T0 para priorizar copy backend en UX (§20.2).
 */
export function extractBackendDetailFromError(error: unknown): string | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }

  if (typeof error === 'string') {
    return normalizeDetailValue(error);
  }

  if (typeof error === 'object') {
    if ('response' in error) {
      const response = (error as { response?: { data?: { detail?: unknown } } }).response;
      const detail = response?.data?.detail;
      if (detail !== undefined) {
        return normalizeDetailValue(detail);
      }
    }

    if ('detail' in error) {
      return normalizeDetailValue((error as { detail: unknown }).detail);
    }
  }

  return undefined;
}

function resolveTerminationProfile(
  input: TerminateSessionInput,
): SessionTerminationUxProfile {
  const backendDetail = extractBackendDetailFromError(input.error);
  return resolveTerminationUx(input.reason, { backendDetail });
}

/**
 * Orquestador T0→T3 de terminación de sesión.
 *
 * Secuencia (§6.1, §13, §14):
 * 1. Guard idempotencia
 * 2. Anular refresh in-flight
 * 3. Rechazar cola (`processQueue`)
 * 4. Logout servidor best-effort (si `callServer`)
 * 5. Limpiar estado auth
 * 6. Limpiar cache RQ
 * 7. Emitir evento (opcional)
 * 8. Toast UX (si aplica)
 * 9. Redirect login (salvo `skipRedirect`)
 */
export async function terminateSession(
  input: TerminateSessionInput,
  deps: TerminateSessionDeps,
): Promise<void> {
  if (deps.getIsTerminating()) {
    return;
  }

  deps.setIsTerminating(true);

  try {
    const profile = resolveTerminationProfile(input);

    deps.clearRefreshingPromise?.();

    deps.processQueue(createSessionTerminatedError(), null);

    if (input.callServer === true) {
      await invokeBestEffort(deps.callLogoutEndpoint);
    }

    await invokeMaybeAsync(() =>
      deps.clearAuthState({
        preservePreLoginBranding: input.preservePreLoginBranding,
      }),
    );

    await invokeMaybeAsync(deps.clearQueryCache);

    deps.emitTerminationEvent?.({
      reason: input.reason,
      profile,
      isSecurityTermination: input.reason === 'TOKEN_REUSE',
    });

    if (shouldShowTerminationToast(input.reason) && profile.toastMessage !== null) {
      deps.showTerminationToast(profile);
    }

    if (input.skipRedirect !== true) {
      deps.redirectToLogin(profile.redirectPath);
    }
  } finally {
    deps.setIsTerminating(false);
  }
}

async function invokeBestEffort(callback: () => void | Promise<void>): Promise<void> {
  try {
    await invokeMaybeAsync(callback);
  } catch {
    // Best-effort: no bloquea terminación (§6.1, §6.5).
  }
}

async function invokeMaybeAsync(callback: () => void | Promise<void>): Promise<void> {
  await callback();
}
