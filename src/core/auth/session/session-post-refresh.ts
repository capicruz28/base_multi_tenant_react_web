import {
  applyClaimsSync,
  type ApplyClaimsSyncCallbacks,
  type ClaimsSyncMergeableUser,
} from './session-claims-sync';
import type { SessionClaimsSnapshot } from './session-claims-snapshot';
import {
  resolveHydrationLevel,
  type HydrationLevel,
} from './session-refresh-diff';
import {
  hydrateSessionCore,
  type HydrateSessionCoreDeps,
  type HydrateSessionMode,
} from './session-refresh-hydrate';

export interface ApplyPostRefreshSessionInput {
  newToken: string;
  priorSnapshot: SessionClaimsSnapshot;
  currentUser: ClaimsSyncMergeableUser | null;
  /** Modo L2 cuando diff exige FULL. Default: `interceptor`. */
  mode?: HydrateSessionMode;
}

export interface ApplyPostRefreshSessionDeps {
  /** L0 — persiste el nuevo access token en auth ref/state. */
  swapAccessToken: (newToken: string) => void;
  /** L1 — callbacks opcionales para applyClaimsSync. */
  claimsSyncCallbacks?: ApplyClaimsSyncCallbacks;
  /** Post-L1 — actualiza auth.user parcial tras claims sync. */
  applyAuthUserAfterClaimsSync: (
    mergedUser: ClaimsSyncMergeableUser | null,
    token: string,
  ) => void;
  /** L2 — dependencias inyectadas para hydrateSessionCore. */
  hydrateDeps: HydrateSessionCoreDeps;
}

/** Resultado interno expuesto para tests y observabilidad (Paso 5). */
export interface ApplyPostRefreshSessionResult {
  hydrationLevel: HydrationLevel;
}

/**
 * Orquestador post-refresh: L0 token swap → L1 claims sync → diff → L2 opcional.
 * Puro respecto a React; efectos solo vía DI (IAM-FE-PHASE-01 Paso 4).
 */
export async function applyPostRefreshSession(
  input: ApplyPostRefreshSessionInput,
  deps: ApplyPostRefreshSessionDeps,
): Promise<ApplyPostRefreshSessionResult> {
  const { newToken, priorSnapshot, currentUser, mode = 'interceptor' } = input;

  deps.swapAccessToken(newToken);

  const claimsSyncResult = applyClaimsSync(
    { newToken, currentUser },
    deps.claimsSyncCallbacks,
  );

  deps.applyAuthUserAfterClaimsSync(claimsSyncResult.mergedUser, newToken);

  const hydrationLevel = resolveHydrationLevel(priorSnapshot, newToken);

  if (hydrationLevel === 'NONE') {
    return { hydrationLevel };
  }

  const hydratedUser = await hydrateSessionCore(
    {
      mode,
      skipBootstrapFlags: true,
    },
    deps.hydrateDeps,
  );

  if (!hydratedUser) {
    throw new Error('Post-refresh full hydration failed');
  }

  return { hydrationLevel };
}
