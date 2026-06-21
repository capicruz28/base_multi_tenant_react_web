/**
 * Tipos impersonation exit — IAM-FE-PHASE-06 IMPL-02.
 */

export type ImpersonationExitSource =
  | 'INTERCEPTOR_ERP_401'
  | 'INTERCEPTOR_ERP_403'
  | 'CAMBIAR_EMPRESA_FORBIDDEN'
  | 'BOOTSTRAP_SUPPORT_EXPIRED'
  | 'BOOTSTRAP_SUPPORT_INVALID'
  | 'MANUAL_END'
  | 'SELECTION_FAILED';

export type ImpersonationExitContext =
  | 'interceptor'
  | 'cambiar_empresa_precheck'
  | 'cambiar_empresa_forbidden'
  | 'bootstrap'
  | 'manual'
  | 'selection_failed';

export type ImpersonationExitAction =
  | 'NO_OP'
  | 'REJECT_LEGACY'
  | 'CONTROLLED_EXIT'
  | 'DELEGATE_MANUAL';

export type ImpersonationBootstrapExitReason = 'expired' | 'invalid' | 'me_failed';

export interface ImpersonationExitPolicyDecision {
  readonly action: ImpersonationExitAction;
  readonly source?: ImpersonationExitSource;
}

export interface ResolveImpersonationExitPolicyInput {
  readonly isSupportMode: boolean;
  readonly context: ImpersonationExitContext;
  readonly httpStatus?: number;
  readonly bootstrapReason?: ImpersonationBootstrapExitReason;
}
