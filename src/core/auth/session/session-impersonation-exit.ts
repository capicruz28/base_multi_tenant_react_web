/**
 * Orquestador impersonation controlled exit — IAM-FE-PHASE-06 IMPL-04.
 */

import { buildSessionClaimsSnapshot } from './session-claims-snapshot';
import type { EmitImpersonationPostRestoreSyncInput } from './session-impersonation-auth-sync';
import { resolveImpersonationExitToastMessage } from './session-impersonation-exit.policy';
import type { ImpersonationExitSource } from './session-impersonation.types';
import type { UserData } from '@/features/auth/types/auth.types';

export interface ExecuteImpersonationControlledExitInput {
  readonly source: ImpersonationExitSource;
  readonly redirectToSuperAdmin?: boolean;
  readonly skipEndImpersonationApi?: boolean;
}

export interface ExecuteImpersonationControlledExitDeps {
  showToast: (message: string, severity: 'info' | 'error' | 'warning') => void;
  callEndImpersonationApi?: () => Promise<void>;
  restorePlatformSession: (options?: { redirectToSuperAdmin?: boolean }) => Promise<void>;
  emitPostRestoreAuthSync?: (input: EmitImpersonationPostRestoreSyncInput) => void;
  getRestoredAccessToken?: () => string | null;
  getCurrentUser?: () => UserData | null;
  getEmpresaActivaId?: () => string | null;
  logDev?: (message: string, extra?: Record<string, unknown>) => void;
}

let impersonationExitInFlight: Promise<void> | null = null;

export function resetImpersonationExitStateForTests(): void {
  impersonationExitInFlight = null;
}

export function isImpersonationExitInFlight(): boolean {
  return impersonationExitInFlight !== null;
}

async function runImpersonationControlledExit(
  input: ExecuteImpersonationControlledExitInput,
  deps: ExecuteImpersonationControlledExitDeps,
): Promise<void> {
  const toastMessage = resolveImpersonationExitToastMessage(input.source);
  deps.showToast(toastMessage, 'info');

  if (!input.skipEndImpersonationApi && deps.callEndImpersonationApi) {
    try {
      await deps.callEndImpersonationApi();
    } catch (error) {
      deps.logDev?.('[impersonation-exit] endImpersonation API best-effort failed', {
        source: input.source,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await deps.restorePlatformSession({
    redirectToSuperAdmin: input.redirectToSuperAdmin,
  });

  const accessToken = deps.getRestoredAccessToken?.()?.trim();
  if (!accessToken || !deps.emitPostRestoreAuthSync) {
    return;
  }

  deps.emitPostRestoreAuthSync({
    accessToken,
    claimsSnapshot: buildSessionClaimsSnapshot(
      accessToken,
      deps.getCurrentUser?.() ?? null,
      deps.getEmpresaActivaId?.() ?? null,
    ),
    empresaActivaId: deps.getEmpresaActivaId?.() ?? null,
    source: input.source,
  });
}

/**
 * Ejecuta salida controlada a Platform Admin con guard de idempotencia.
 */
export async function executeImpersonationControlledExit(
  input: ExecuteImpersonationControlledExitInput,
  deps: ExecuteImpersonationControlledExitDeps,
): Promise<void> {
  if (impersonationExitInFlight) {
    return impersonationExitInFlight;
  }

  impersonationExitInFlight = runImpersonationControlledExit(input, deps).finally(() => {
    impersonationExitInFlight = null;
  });

  return impersonationExitInFlight;
}
