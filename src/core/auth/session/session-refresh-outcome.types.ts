/**
 * Taxonomía Refresh Outcomes — IAM-FE-PHASE-05 IMPL-02 (GAP-P2-01).
 */

export type RefreshOutcome =
  | 'ROTATED'
  | 'ALREADY_ROTATED'
  | 'REFRESH_FAILED_401'
  | 'REFRESH_FAILED_TOKEN_REUSE'
  | 'REFRESH_FAILED_403'
  | 'REFRESH_FAILED_500_EXHAUSTED'
  | 'REFRESH_FAILED_429_EXHAUSTED'
  | 'REFRESH_UNKNOWN';

export type RefreshResilienceSource = 'interceptor' | 'bootstrap';

export type RefreshSingleFlightRole = 'leader' | 'queued';

export interface RefreshOutcomeMetadata {
  readonly outcome: RefreshOutcome;
  readonly httpStatus?: number;
  readonly attemptCount: number;
  readonly backoffMsApplied: number;
  readonly source: RefreshResilienceSource;
  readonly l02GuardActive: boolean;
  readonly singleFlightRole: RefreshSingleFlightRole;
}

export interface RefreshHttpErrorContext {
  readonly httpStatus?: number;
  readonly retryAfterHeader?: string;
  readonly detail?: string;
}
