/**
 * Auth wiring Session UX — factories para TerminateSessionDeps (IMPL-09).
 */

import type { SessionTerminationUxProfile } from './session-termination-ux';
import {
  executeSessionUxPresentation,
  executeSessionUxRedirect,
  type SessionUxPresentationRuntimeDeps,
} from './session-ux-presenter';
import {
  getSessionUxFlagsSnapshot,
  isSessionUxModalActive,
  type SessionUxFlagsSnapshot,
} from './session-ux.flags';

export interface CreateSessionUxTerminationWiringInput {
  readonly legacyShowToast: (profile: SessionTerminationUxProfile) => void;
  readonly legacyRedirect: (path: string) => void;
  readonly flags?: SessionUxFlagsSnapshot;
  readonly getBackendDetail?: () => string | undefined;
}

export interface SessionUxTerminationWiring {
  readonly showTerminationToast: (profile: SessionTerminationUxProfile) => void;
  readonly redirectToLogin: (path: string) => void;
}

/**
 * PATCH-01 (A-P1-01): señal limit desde getBackendDetail o profile.toastMessage (F2).
 * Sin mutar classifySessionTermination ni session-termination-ux.ts.
 */
export function resolveSessionUxBackendDetail(
  profile: SessionTerminationUxProfile,
  getBackendDetail?: () => string | undefined,
): string | undefined {
  const explicit = getBackendDetail?.()?.trim();
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const fromProfile = profile.toastMessage?.trim();
  if (fromProfile && fromProfile.length > 0) {
    return fromProfile;
  }

  return undefined;
}

export function createSessionUxTerminationWiring(
  input: CreateSessionUxTerminationWiringInput,
): SessionUxTerminationWiring {
  const flags = input.flags ?? getSessionUxFlagsSnapshot();

  if (!isSessionUxModalActive(flags)) {
    return {
      showTerminationToast: input.legacyShowToast,
      redirectToLogin: input.legacyRedirect,
    };
  }

  const runtimeDeps: SessionUxPresentationRuntimeDeps = {
    flags,
    legacyShowToast: input.legacyShowToast,
  };

  return {
    showTerminationToast: (profile) => {
      executeSessionUxPresentation(
        {
          profile,
          backendDetail: resolveSessionUxBackendDetail(profile, input.getBackendDetail),
        },
        runtimeDeps,
      );
    },
    redirectToLogin: (path) => {
      executeSessionUxRedirect(path, input.legacyRedirect);
    },
  };
}
