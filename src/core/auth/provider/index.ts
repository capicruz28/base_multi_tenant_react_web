/**
 * IAM-FE-PHASE-09 — L9 Auth Provider (barrel interno).
 * IMPL-12: ensamblador + compositors finales.
 */

export type {
	AuthProviderAssemblyPhase,
	AuthProviderAssemblyResult,
	AuthProviderAuthState,
	AuthProviderAuthSyncEventType,
	AuthProviderAuthSyncRuntime,
	AuthProviderBootstrapEffectDeps,
	AuthProviderBootstrapRuntime,
	AuthProviderCleanupApi,
	AuthProviderCompositorFactory,
	AuthProviderCompositorFactoryContext,
	AuthProviderCompositorId,
	AuthProviderContextValue,
	AuthProviderDerivedContextFlags,
	AuthProviderEmitAuthSyncSessionToken,
	AuthProviderEmitSessionRefreshOutcomeTelemetry,
	AuthProviderEmpresaRuntime,
	AuthProviderFailedQueueEntry,
	AuthProviderImpersonationControlledExitInput,
	AuthProviderImpersonationRuntime,
	AuthProviderLegacyLogoutDeps,
	AuthProviderPermissionsRuntime,
	AuthProviderPhaseAPayload,
	AuthProviderPhaseAId,
	AuthProviderPhaseBEffectsContract,
	AuthProviderPhaseBId,
	AuthProviderPhaseCPayload,
	AuthProviderPhaseCId,
	AuthProviderPhaseDBinderProps,
	AuthProviderPhaseDPayload,
	AuthProviderPhaseDId,
	AuthProviderPublicActionsCompositorFactory,
	AuthProviderPublicActionsRuntime,
	AuthProviderPublicContextKey,
	AuthProviderRefreshPromise,
	AuthProviderRefreshRuntime,
	AuthProviderRefreshWiringRuntime,
	AuthProviderRefs,
	AuthProviderRemoteProbeRuntimeState,
	AuthProviderRequestInterceptorEffectDeps,
	AuthProviderResponseInterceptorEffectDeps,
	AuthProviderRuntime,
	AuthProviderSetters,
	AuthProviderState,
	AuthProviderStateCompositorFactory,
	AuthProviderTelemetryUxRuntime,
	AuthProviderTerminationCompositorFactory,
	AuthProviderTerminationRuntime,
} from './auth-provider.types';

export {
	AUTH_PROVIDER_ALLOWED_IMPORT_PREFIXES,
	AUTH_PROVIDER_ASSEMBLY_PHASE_ORDER,
	AUTH_PROVIDER_COMPOSITOR_MODULE_PATTERN,
	AUTH_PROVIDER_FORBIDDEN_COMPOSITOR_TO_COMPOSITOR,
	AUTH_PROVIDER_FORBIDDEN_IMPORT_PREFIXES,
	AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS,
} from './auth-provider.types';

export { useAuthProvider } from './useAuthProvider';
export type { UseAuthProviderResult } from './useAuthProvider';

export { AuthProviderPhaseDBinders } from './auth-provider-telemetry-ux.compositor';

export {
	useAuthProviderEmitAuthSyncSessionToken,
	useAuthProviderAuthSyncListenerDeps,
} from './auth-provider-auth-sync.compositor';

export {
	useAuthProviderPublicActions,
	type UseAuthProviderPublicActionsParams,
	type UseAuthProviderPublicActionsResult,
} from './auth-provider-public-actions';
