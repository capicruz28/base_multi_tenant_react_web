/**
 * Tipos Session UX Presentation — IAM-FE-PHASE-07 IMPL-02 (L7-A).
 */

import type { SessionTerminationReason } from './session-termination-reason';
import type {
  SessionTerminationUxProfile,
  SessionLoginQueryParam,
} from './session-termination-ux';

/** Canal de presentación post-terminación. */
export type SessionUxPresentationChannel = 'MODAL' | 'TOAST_ONLY' | 'SILENT';

/** Query param login extendido F7 (no modifica SessionLoginQueryParam F2). */
export type SessionLoginQueryParamV7 = SessionLoginQueryParam | 'limit';

/** Entrada al presenter policy. */
export interface SessionUxPresenterInput {
  readonly reason: SessionTerminationReason;
  readonly profile: SessionTerminationUxProfile;
  readonly backendDetail?: string;
  readonly erpDialogOpen?: boolean;
}

/** Resultado de política presenter. */
export interface SessionUxPresentationDecision {
  readonly channel: SessionUxPresentationChannel;
  readonly profile: SessionTerminationUxProfile;
  readonly modalMessage: string | null;
  readonly redirectPath: string;
  readonly loginQueryParam?: SessionLoginQueryParamV7;
  readonly deferRedirect: boolean;
  readonly queueModal: boolean;
}

/** Payload modal global. */
export interface SessionExpiredDialogModel {
  readonly reason: SessionTerminationReason;
  readonly message: string;
  readonly severity: SessionTerminationUxProfile['severity'];
  readonly redirectPath: string;
}

/** Identificador gate bootstrap V7.3. */
export type SessionBootstrapGateId = 'G1' | 'G2' | 'G3' | 'G_SELECTION';

/** Entrada política gate bootstrap. */
export interface SessionBootstrapGateInput {
  readonly isBootstrapped: boolean;
  readonly authInitialized: boolean;
  readonly authLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly permissionsInitialized: boolean;
  readonly menuPermissionsReady: boolean;
  readonly isPublicRoute: boolean;
  readonly isSelectionRoute: boolean;
  readonly selectionHydrated: boolean;
}

/** Resultado política gate bootstrap. */
export interface SessionBootstrapGateDecision {
  readonly shouldBlock: boolean;
  readonly gateId: SessionBootstrapGateId | null;
  readonly message: string;
}

/** Entrada heurística session limit. */
export interface SessionLimitDetectionInput {
  readonly detail?: string;
  readonly reason?: SessionTerminationReason;
}
