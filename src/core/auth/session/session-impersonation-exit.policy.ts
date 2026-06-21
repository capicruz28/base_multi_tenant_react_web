/**
 * Política pura impersonation exit — IAM-FE-PHASE-06 IMPL-03.
 */

import {
  getSessionImpersonationFlagsSnapshot,
  type SessionImpersonationFlagsSnapshot,
} from './session-impersonation.flags';
import type {
  ImpersonationExitPolicyDecision,
  ImpersonationExitSource,
  ResolveImpersonationExitPolicyInput,
} from './session-impersonation.types';
import { resolveTerminationUx } from './session-termination-ux';

const BOOTSTRAP_EXPIRED_MESSAGE =
  'Tu sesión de soporte expiró o ya no es válida. Retornando a Platform Admin…';

const BOOTSTRAP_INVALID_MESSAGE = BOOTSTRAP_EXPIRED_MESSAGE;

const CAMBIAR_EMPRESA_FORBIDDEN_MESSAGE =
  'Cambio de empresa no permitido en modo soporte.';

const INTERCEPTOR_ERP_AUTH_MESSAGE =
  'La sesión de soporte ya no es válida. Retornando a Platform Admin…';

const SOURCE_TOAST_MESSAGES: Readonly<
  Partial<Record<ImpersonationExitSource, string>>
> = {
  BOOTSTRAP_SUPPORT_EXPIRED: BOOTSTRAP_EXPIRED_MESSAGE,
  BOOTSTRAP_SUPPORT_INVALID: BOOTSTRAP_INVALID_MESSAGE,
  CAMBIAR_EMPRESA_FORBIDDEN: CAMBIAR_EMPRESA_FORBIDDEN_MESSAGE,
  INTERCEPTOR_ERP_401: INTERCEPTOR_ERP_AUTH_MESSAGE,
  INTERCEPTOR_ERP_403: INTERCEPTOR_ERP_AUTH_MESSAGE,
};

export function resolveImpersonationExitSourceFromHttpStatus(
  httpStatus: number | undefined,
): ImpersonationExitSource {
  if (httpStatus === 403) {
    return 'INTERCEPTOR_ERP_403';
  }
  return 'INTERCEPTOR_ERP_401';
}

export function resolveBootstrapImpersonationExitSource(
  bootstrapReason: NonNullable<ResolveImpersonationExitPolicyInput['bootstrapReason']>,
): ImpersonationExitSource {
  if (bootstrapReason === 'expired') {
    return 'BOOTSTRAP_SUPPORT_EXPIRED';
  }
  return 'BOOTSTRAP_SUPPORT_INVALID';
}

export function resolveImpersonationExitToastMessage(
  source: ImpersonationExitSource,
): string {
  const override = SOURCE_TOAST_MESSAGES[source];
  if (override) {
    return override;
  }
  return resolveTerminationUx('IMPERSONATION_END').toastMessage ?? 'Modo soporte finalizado.';
}

export function shouldRedirectToSuperAdminAfterImpersonationExit(
  pathname: string,
  source: ImpersonationExitSource,
): boolean {
  if (source === 'MANUAL_END') {
    return false;
  }
  return pathname.startsWith('/app') || pathname.startsWith('/admin');
}

export function resolveImpersonationExitPolicy(
  input: ResolveImpersonationExitPolicyInput,
  flags: SessionImpersonationFlagsSnapshot = getSessionImpersonationFlagsSnapshot(),
): ImpersonationExitPolicyDecision {
  if (!input.isSupportMode && input.context !== 'manual') {
    return { action: 'NO_OP' };
  }

  if (!flags.masterEnabled) {
    if (input.context === 'manual') {
      return { action: 'DELEGATE_MANUAL' };
    }
    return { action: 'REJECT_LEGACY' };
  }

  switch (input.context) {
    case 'interceptor': {
      if (!flags.interceptorEnabled) {
        return { action: 'REJECT_LEGACY' };
      }
      return {
        action: 'CONTROLLED_EXIT',
        source: resolveImpersonationExitSourceFromHttpStatus(input.httpStatus),
      };
    }
    case 'cambiar_empresa_precheck':
    case 'cambiar_empresa_forbidden': {
      if (!flags.cambiarEmpresaEnabled) {
        return { action: 'REJECT_LEGACY' };
      }
      return {
        action: 'CONTROLLED_EXIT',
        source: 'CAMBIAR_EMPRESA_FORBIDDEN',
      };
    }
    case 'bootstrap': {
      const bootstrapReason = input.bootstrapReason ?? 'invalid';
      return {
        action: 'CONTROLLED_EXIT',
        source: resolveBootstrapImpersonationExitSource(bootstrapReason),
      };
    }
    case 'manual':
      return {
        action: 'CONTROLLED_EXIT',
        source: 'MANUAL_END',
      };
    case 'selection_failed':
      return {
        action: 'CONTROLLED_EXIT',
        source: 'SELECTION_FAILED',
      };
    default:
      return { action: 'NO_OP' };
  }
}
