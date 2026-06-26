/**
 * Guard in-place — cambiar empresa prohibido en modo impersonación (POST-CERT P0 Stage 1).
 * Sin React, HTTP ni side effects.
 */

import { isImpersonationSupportMode } from '@/core/auth/utils/impersonation-fe-log';

import { SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED } from './session-impersonation.flags';

export const CAMBIAR_EMPRESA_IMPERSONATION_BLOCKED_MESSAGE =
  'No es posible cambiar de empresa mientras se encuentra en modo impersonación.';

export interface CambiarEmpresaImpersonationGuardOptions {
  readonly guardEnabled?: boolean;
}

export interface CambiarEmpresaImpersonationGuardResult {
  readonly blocked: boolean;
  readonly message: string;
}

/**
 * Evalúa si cambiar empresa debe bloquearse por impersonación activa.
 * @param token — access token ERP actual
 * @param options.guardEnabled — default SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED
 */
export function evaluateCambiarEmpresaImpersonationGuard(
  token: string | null | undefined,
  options?: CambiarEmpresaImpersonationGuardOptions,
): CambiarEmpresaImpersonationGuardResult {
  const message = CAMBIAR_EMPRESA_IMPERSONATION_BLOCKED_MESSAGE;
  const guardEnabled = options?.guardEnabled ?? SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED;

  if (!guardEnabled) {
    return { blocked: false, message };
  }

  if (isImpersonationSupportMode(token)) {
    return { blocked: true, message };
  }

  return { blocked: false, message };
}
