/**
 * IAM-FE-PHASE-09 IMPL-02 — Contratos L9 (types only).
 *
 * DR-D02: ensamblaje normativo Fase A → B → C → D (baseline IMPL-01 §9).
 * Sin implementación runtime — compositors en IMPL-06+.
 */

import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch, MutableRefObject, ReactNode, SetStateAction } from 'react';

import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import type { UserPermissions } from '@/core/auth/types/permission.types';
import type { ApplyInboundAuthSyncDeps } from '@/core/auth/session/session-auth-sync-apply';
import type { SessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import type { ImpersonationExitSource } from '@/core/auth/session/session-impersonation.types';
import type { LoadMenuUxOptions } from '@/core/auth/session/session-menu-ux';
import type { RefreshOutcomeMetadata } from '@/core/auth/session/session-refresh-outcome.types';
import type { HydrateSessionMode } from '@/core/auth/session/session-refresh-hydrate';
import type { ApplyPostRefreshSessionResult } from '@/core/auth/session/session-post-refresh';
import type { RefreshOutcome } from '@/core/auth/session/session-refresh-outcome.types';
import type { TerminationEventEmitter } from '@/core/auth/session/session-telemetry-auth-wiring';
import type { SessionTerminationCaller } from '@/core/auth/session/session-telemetry.types';
import type { SessionTerminationUxProfile } from '@/core/auth/session/session-termination-ux';
import type { TerminateSessionInput } from '@/core/auth/session/session-terminate';
import type {
	AuthLoginSession,
	ClienteInfo,
	EmpresaOption,
	PasswordChangeRequest,
	Token,
	UserData,
} from '@/features/auth/types/auth.types';

// ---------------------------------------------------------------------------
// Public context — mirror inmutable useAuth() (36 keys, DR-P1-01)
// ---------------------------------------------------------------------------

/** Estado token + user (AuthContext L671–674). */
export interface AuthProviderAuthState {
	readonly user: UserData | null;
	readonly token: string | null;
}

/**
 * Contrato público idéntico a AuthContextType (L676–721).
 * useAuth() MUST expose exactly these keys through IMPL-12.
 */
export interface AuthProviderContextValue {
	readonly auth: AuthProviderAuthState;
	readonly setAuthFromLogin: (response: Token) => Promise<AuthLoginSession | null>;
	readonly completeEmpresaSelection: (empresaId: string) => Promise<UserData | null>;
	readonly cambiarEmpresaActiva: (empresaId: string) => Promise<UserData | null>;
	readonly logout: () => Promise<void>;
	readonly logoutAllSessions: () => Promise<void>;
	readonly runSessionValidityProbe: () => Promise<void>;
	readonly isAuthenticated: boolean;
	readonly loading: boolean;
	readonly authInitialized: boolean;
	readonly isBootstrapped: boolean;
	readonly hasRole: (...roles: string[]) => boolean;
	readonly accessLevel: number;
	readonly isSuperAdmin: boolean;
	readonly userType: string;
	readonly clienteInfo: ClienteInfo | null;
	readonly permissions: UserPermissions | null;
	readonly menuModulos: AuthMenuModulo[] | null;
	readonly menuPermissionsReady: boolean;
	readonly empresaActivaId: string | null;
	readonly empresasElegibles: EmpresaOption[];
	/** @deprecated Alias de empresasElegibles */
	readonly empresasDisponibles: EmpresaOption[];
	readonly requiereSeleccionEmpresa: boolean;
	readonly esAdminCliente: boolean;
	readonly hasEmpresaActivaFlag: boolean;
	readonly canAccessErp: boolean;
	readonly mustSelectEmpresa: boolean;
	readonly reloadMenuAndPermissions: () => Promise<void>;
	readonly isImpersonation: boolean;
	readonly impersonatedBy: string | null;
	readonly impersonatedByUsername: string | null;
	readonly impersonationClienteLabel: string | null;
	readonly startImpersonation: (
		clienteId: string,
		options?: { clienteLabel?: string },
	) => Promise<{ requiresEmpresaSelection: boolean }>;
	readonly endImpersonation: () => Promise<void>;
	readonly requiresPasswordChange: boolean;
	readonly completePasswordChange: (
		payload: PasswordChangeRequest,
	) => Promise<AuthLoginSession | null>;
}

/** Lista canónica V9.1 — 36 keys (IMPL-01 §12). */
export const AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS = [
	'auth',
	'setAuthFromLogin',
	'completeEmpresaSelection',
	'cambiarEmpresaActiva',
	'logout',
	'logoutAllSessions',
	'runSessionValidityProbe',
	'isAuthenticated',
	'loading',
	'authInitialized',
	'isBootstrapped',
	'hasRole',
	'accessLevel',
	'isSuperAdmin',
	'userType',
	'clienteInfo',
	'permissions',
	'menuModulos',
	'menuPermissionsReady',
	'empresaActivaId',
	'empresasElegibles',
	'empresasDisponibles',
	'requiereSeleccionEmpresa',
	'esAdminCliente',
	'hasEmpresaActivaFlag',
	'canAccessErp',
	'mustSelectEmpresa',
	'reloadMenuAndPermissions',
	'isImpersonation',
	'impersonatedBy',
	'impersonatedByUsername',
	'impersonationClienteLabel',
	'startImpersonation',
	'endImpersonation',
	'requiresPasswordChange',
	'completePasswordChange',
] as const satisfies ReadonlyArray<keyof AuthProviderContextValue>;

export type AuthProviderPublicContextKey =
	(typeof AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS)[number];

// ---------------------------------------------------------------------------
// DR-D02 — Orden de ensamblaje (baseline monolito, NO plan simplificado)
// ---------------------------------------------------------------------------

export type AuthProviderAssemblyPhase = 'A' | 'B' | 'C' | 'D';

/** Orden normativo único: pre-effects → effects → post-effect public → render. */
export const AUTH_PROVIDER_ASSEMBLY_PHASE_ORDER = [
	'A',
	'B',
	'C',
	'D',
] as const satisfies readonly AuthProviderAssemblyPhase[];

/**
 * Fase A — definiciones pre-effects (AuthContext L771–1740, IMPL-01 §9.1).
 * Incluye hydrateFetchMeErrorRef en posición tardía L1485 (antes de E5).
 */
export type AuthProviderPhaseAId = 'A';

/**
 * Fase B — effects E5 request, E6 response, E7 bootstrap (L1767–2465).
 */
export type AuthProviderPhaseBId = 'B';

/**
 * Fase C — callbacks públicos y context value post-effects (L2471–2967).
 * applyFullSessionToken y derivados viven aquí, NO en Fase A.
 */
export type AuthProviderPhaseCId = 'C';

/**
 * Fase D — JSX binders F3/F4/F8 (L3035–3054).
 */
export type AuthProviderPhaseDId = 'D';

// ---------------------------------------------------------------------------
// State & setters
// ---------------------------------------------------------------------------

export interface AuthProviderState {
	readonly auth: AuthProviderAuthState;
	readonly loading: boolean;
	readonly authInitialized: boolean;
	readonly isBootstrapped: boolean;
	readonly accessLevel: number;
	readonly isSuperAdmin: boolean;
	readonly userType: string;
	readonly clienteInfo: ClienteInfo | null;
	readonly permissions: UserPermissions | null;
	readonly menuModulos: AuthMenuModulo[] | null;
	readonly menuPermissionsReady: boolean;
	readonly empresaActivaId: string | null;
	readonly empresasElegibles: EmpresaOption[];
	readonly requiereSeleccionEmpresa: boolean;
	readonly esAdminCliente: boolean;
	readonly isImpersonation: boolean;
	readonly impersonatedBy: string | null;
	readonly impersonatedByUsername: string | null;
	readonly impersonationClienteLabel: string | null;
}

export interface AuthProviderSetters {
	readonly setAuth: Dispatch<SetStateAction<AuthProviderAuthState>>;
	readonly setLoading: Dispatch<SetStateAction<boolean>>;
	readonly setAuthInitialized: Dispatch<SetStateAction<boolean>>;
	readonly setIsBootstrapped: Dispatch<SetStateAction<boolean>>;
	readonly setAccessLevel: Dispatch<SetStateAction<number>>;
	readonly setIsSuperAdmin: Dispatch<SetStateAction<boolean>>;
	readonly setUserType: Dispatch<SetStateAction<string>>;
	readonly setClienteInfo: Dispatch<SetStateAction<ClienteInfo | null>>;
	readonly setPermissions: Dispatch<SetStateAction<UserPermissions | null>>;
	readonly setMenuModulos: Dispatch<SetStateAction<AuthMenuModulo[] | null>>;
	readonly setMenuPermissionsReady: Dispatch<SetStateAction<boolean>>;
	readonly setEmpresaActivaId: Dispatch<SetStateAction<string | null>>;
	readonly setEmpresasElegibles: Dispatch<SetStateAction<EmpresaOption[]>>;
	readonly setRequiereSeleccionEmpresa: Dispatch<SetStateAction<boolean>>;
	readonly setEsAdminCliente: Dispatch<SetStateAction<boolean>>;
	readonly setIsImpersonation: Dispatch<SetStateAction<boolean>>;
	readonly setImpersonatedBy: Dispatch<SetStateAction<string | null>>;
	readonly setImpersonatedByUsername: Dispatch<SetStateAction<string | null>>;
	readonly setImpersonationClienteLabel: Dispatch<SetStateAction<string | null>>;
}

// ---------------------------------------------------------------------------
// Refs & refresh singleton (DR-P1-03 — contrato; impl IMPL-05)
// ---------------------------------------------------------------------------

export type AuthProviderRefreshPromise = Promise<string> | null;

export interface AuthProviderFailedQueueEntry {
	readonly resolve: (value: string) => void;
	readonly reject: (reason?: Error) => void;
}

export interface AuthProviderRefs {
	readonly authRef: MutableRefObject<AuthProviderAuthState>;
	readonly loadingRef: MutableRefObject<boolean>;
	readonly empresaActivaIdRef: MutableRefObject<string | null>;
	readonly isInitializedRef: MutableRefObject<boolean>;
	readonly failedQueueRef: MutableRefObject<AuthProviderFailedQueueEntry[]>;
	readonly isTerminatingRef: MutableRefObject<boolean>;
	readonly isLogoutAllInFlightRef: MutableRefObject<boolean>;
	readonly isSessionValidityProbeInFlightRef: MutableRefObject<boolean>;
	readonly terminationCallerHintRef: MutableRefObject<SessionTerminationCaller | undefined>;
	/** Declaración tardía permitida en Fase A (monolito L1485). */
	readonly hydrateFetchMeErrorRef: MutableRefObject<unknown>;
	readonly sessionMenuSnapshotRef: MutableRefObject<AuthMenuModulo[] | null>;
}

export interface AuthProviderRefreshRuntime {
	readonly getRefreshingPromise: () => AuthProviderRefreshPromise;
	readonly setRefreshingPromise: (promise: AuthProviderRefreshPromise) => void;
	readonly clearRefreshingPromise: () => void;
}

// ---------------------------------------------------------------------------
// Legacy logout deps (mirror AuthContext export — sin importar AuthContext)
// ---------------------------------------------------------------------------

export interface AuthProviderLegacyLogoutDeps {
	readonly clearRefreshingPromise?: () => void;
	readonly processQueue: (error: Error | null, token: string | null) => void;
	readonly callLogoutEndpoint: () => void | Promise<void>;
	readonly clearLocalAuthState: (preservePreLoginBranding: boolean) => void;
	readonly getHadAuthenticatedUser: () => boolean;
}

// ---------------------------------------------------------------------------
// Domain runtime slices
// ---------------------------------------------------------------------------

export interface AuthProviderCleanupApi {
	readonly performLocalAuthCleanup: (preservePreLoginBranding: boolean) => void;
	readonly processQueue: (error: Error | null, token: string | null) => void;
}

export interface AuthProviderTerminationRuntime {
	readonly runTerminateSession: (input: TerminateSessionInput) => Promise<void>;
	readonly doLogout: (callServer?: boolean) => Promise<void>;
	readonly logoutAllSessions: () => Promise<void>;
	readonly runSessionValidityProbeForSession: () => Promise<void>;
	readonly legacyLogoutDeps: AuthProviderLegacyLogoutDeps;
	readonly redirectToLoginAfterTermination: (path: string) => void;
	readonly showTerminationToastAfterTermination: (
		profile: SessionTerminationUxProfile,
	) => void;
}

export interface AuthProviderBootstrapRuntime {
	readonly initializeAuth: () => Promise<UserData | null>;
	readonly runHydrateSessionCore: (mode: HydrateSessionMode) => Promise<UserData | null>;
	readonly runBootstrap: () => Promise<void>;
}

export interface AuthProviderRefreshWiringRuntime {
	readonly runPostRefreshSession: (
		newToken: string,
		priorSnapshot: SessionClaimsSnapshot,
	) => Promise<ApplyPostRefreshSessionResult>;
	readonly skipsTokenRefresh: (url?: string) => boolean;
	readonly isPublicEndpoint: (url?: string) => boolean;
}

export interface AuthProviderImpersonationControlledExitInput {
	readonly source: ImpersonationExitSource;
	readonly redirectToSuperAdmin?: boolean;
	readonly skipEndImpersonationApi?: boolean;
	readonly includeEndImpersonationApi?: boolean;
}

export interface AuthProviderImpersonationRuntime {
	readonly syncImpersonationFromToken: (token: string | null) => void;
	readonly clearImpersonationState: () => void;
	readonly isImpersonationActive: () => boolean;
	readonly restorePlatformSession: (options?: {
		redirectToSuperAdmin?: boolean;
	}) => Promise<void>;
	readonly runImpersonationControlledExit: (
		input: AuthProviderImpersonationControlledExitInput,
	) => Promise<void>;
	readonly applyInboundImpersonationExitStorageCleanup: (accessToken: string) => void;
}

export interface AuthProviderEmpresaRuntime {
	readonly syncEmpresaSession: (user: UserData | null, token: string | null) => void;
	readonly loadEmpresasElegiblesForSession: (user: UserData) => Promise<EmpresaOption[]>;
	readonly invalidateSelectionSession: () => void;
}

export interface AuthProviderPermissionsRuntime {
	readonly loadMenuAndPermissionsFromAuthMenu: (
		user: UserData | null,
		uxOptions?: LoadMenuUxOptions,
	) => Promise<AuthMenuModulo[] | null>;
	readonly updateAccessLevels: (user: UserData | null) => void;
	readonly reloadMenuAndPermissions: () => Promise<void>;
	readonly hasRole: (...roles: string[]) => boolean;
	readonly shouldSkipErpMenuLoad: (user: UserData | null, token: string | null) => boolean;
	readonly determineUserType: (level: number, isSuper: boolean) => string;
	readonly buildRoutePermissionsFromMenu: (modulos: AuthMenuModulo[]) => UserPermissions;
}

export type AuthProviderAuthSyncEventType =
	| 'SESSION_LOGIN'
	| 'SESSION_REFRESHED'
	| 'EMPRESA_CHANGED';

export interface AuthProviderEmitAuthSyncSessionToken {
	(
		eventType: AuthProviderAuthSyncEventType,
		accessToken: string,
		priorSnapshot?: SessionClaimsSnapshot,
		refreshOutcome?: RefreshOutcome,
		impersonationExitSource?: ImpersonationExitSource,
	): void;
}

export interface AuthProviderAuthSyncRuntime {
	readonly emitAuthSyncSessionToken: AuthProviderEmitAuthSyncSessionToken;
	readonly getAuthSyncListenerDeps: () => ApplyInboundAuthSyncDeps;
}

export interface AuthProviderEmitSessionRefreshOutcomeTelemetry {
	(metadata: RefreshOutcomeMetadata, accessToken?: string | null): void;
}

export interface AuthProviderTelemetryUxRuntime {
	readonly composedTerminationEmitter: TerminationEventEmitter;
	readonly emitSessionRefreshOutcomeTelemetry: AuthProviderEmitSessionRefreshOutcomeTelemetry;
	readonly emitSessionRefreshFailureOutcomeTelemetry: (
		metadata: RefreshOutcomeMetadata,
	) => void;
	readonly emitSessionProbeCompletedTelemetry: (input: {
		result: 'ok' | 'error';
	}) => void;
	readonly emitSessionBootstrapCompletedTelemetry: (input: {
		path?: string;
		hydrateSkipped?: boolean;
	}) => void;
	readonly trackSessionBootstrapCorrelation: () => void;
	readonly trackSessionLoginCorrelation: () => void;
	readonly emitSessionImpersonationExitFromSource: (input: {
		source: ImpersonationExitSource;
		action: 'CONTROLLED_EXIT';
	}) => void;
}

/** Fase C — handlers expuestos vía context (post-effects). */
export interface AuthProviderPublicActionsRuntime {
	readonly applyFullSessionToken: (response: Token) => Promise<AuthLoginSession | null>;
	readonly setAuthFromLogin: AuthProviderContextValue['setAuthFromLogin'];
	readonly completeEmpresaSelection: AuthProviderContextValue['completeEmpresaSelection'];
	readonly cambiarEmpresaActiva: AuthProviderContextValue['cambiarEmpresaActiva'];
	readonly logout: AuthProviderContextValue['logout'];
	readonly startImpersonation: AuthProviderContextValue['startImpersonation'];
	readonly endImpersonation: AuthProviderContextValue['endImpersonation'];
	readonly completePasswordChange: AuthProviderContextValue['completePasswordChange'];
	readonly reloadMenuAndPermissions: AuthProviderContextValue['reloadMenuAndPermissions'];
	readonly hasRole: AuthProviderContextValue['hasRole'];
}

/** Derivados del context value (Fase C memos). */
export interface AuthProviderDerivedContextFlags {
	readonly requiresPasswordChange: boolean;
	readonly canAccessErp: boolean;
	readonly mustSelectEmpresa: boolean;
	readonly isAuthenticated: boolean;
	readonly hasEmpresaActivaFlag: boolean;
	readonly empresasDisponibles: EmpresaOption[];
}

// ---------------------------------------------------------------------------
// Phase payloads (DR-D02)
// ---------------------------------------------------------------------------

/** Runtime parcial disponible al cierre de Fase A (pre-effects). */
export interface AuthProviderPhaseAPayload {
	readonly phase: AuthProviderPhaseAId;
	readonly state: AuthProviderState;
	readonly setters: AuthProviderSetters;
	readonly refs: AuthProviderRefs;
	readonly queryClient: QueryClient;
	readonly refreshRuntime: AuthProviderRefreshRuntime;
	readonly cleanup: AuthProviderCleanupApi;
	readonly telemetryUx: AuthProviderTelemetryUxRuntime;
	readonly termination: AuthProviderTerminationRuntime;
	readonly permissions: AuthProviderPermissionsRuntime;
	readonly empresa: Pick<
		AuthProviderEmpresaRuntime,
		'syncEmpresaSession' | 'loadEmpresasElegiblesForSession'
	>;
	readonly impersonation: AuthProviderImpersonationRuntime;
	readonly bootstrap: AuthProviderBootstrapRuntime;
	readonly refresh: AuthProviderRefreshWiringRuntime;
	readonly authSync: Pick<AuthProviderAuthSyncRuntime, 'emitAuthSyncSessionToken'>;
}

/** Deps arrays congelados — monolito IMPL-01 §3. */
export interface AuthProviderRequestInterceptorEffectDeps {
	readonly skipsTokenRefresh: AuthProviderRefreshWiringRuntime['skipsTokenRefresh'];
	readonly isPublicEndpoint: AuthProviderRefreshWiringRuntime['isPublicEndpoint'];
}

export interface AuthProviderResponseInterceptorEffectDeps {
	readonly skipsTokenRefresh: AuthProviderRefreshWiringRuntime['skipsTokenRefresh'];
	readonly runTerminateSession: AuthProviderTerminationRuntime['runTerminateSession'];
	readonly legacyLogoutDeps: AuthProviderLegacyLogoutDeps;
	readonly isImpersonationActive: AuthProviderImpersonationRuntime['isImpersonationActive'];
	readonly restorePlatformSession: AuthProviderImpersonationRuntime['restorePlatformSession'];
	readonly runPostRefreshSession: AuthProviderRefreshWiringRuntime['runPostRefreshSession'];
	readonly emitAuthSyncSessionToken: AuthProviderEmitAuthSyncSessionToken;
	readonly queryClient: QueryClient;
	readonly runImpersonationControlledExit: AuthProviderImpersonationRuntime['runImpersonationControlledExit'];
}

export interface AuthProviderBootstrapEffectDeps {
	readonly runTerminateSession: AuthProviderTerminationRuntime['runTerminateSession'];
	readonly legacyLogoutDeps: AuthProviderLegacyLogoutDeps;
	readonly initializeAuth: AuthProviderBootstrapRuntime['initializeAuth'];
	readonly restorePlatformSession: AuthProviderImpersonationRuntime['restorePlatformSession'];
	readonly syncImpersonationFromToken: AuthProviderImpersonationRuntime['syncImpersonationFromToken'];
	readonly emitAuthSyncSessionToken: AuthProviderEmitAuthSyncSessionToken;
	readonly runImpersonationControlledExit: AuthProviderImpersonationRuntime['runImpersonationControlledExit'];
}

export interface AuthProviderPhaseBEffectsContract {
	readonly phase: AuthProviderPhaseBId;
	readonly registerRequestInterceptor: (
		deps: AuthProviderRequestInterceptorEffectDeps,
	) => () => void;
	readonly registerResponseInterceptor: (
		deps: AuthProviderResponseInterceptorEffectDeps,
	) => () => void;
	readonly registerBootstrapEffect: (deps: AuthProviderBootstrapEffectDeps) => void;
}

export interface AuthProviderPhaseCPayload {
	readonly phase: AuthProviderPhaseCId;
	readonly publicActions: AuthProviderPublicActionsRuntime;
	readonly empresa: Pick<AuthProviderEmpresaRuntime, 'invalidateSelectionSession'>;
	readonly authSync: Pick<AuthProviderAuthSyncRuntime, 'getAuthSyncListenerDeps'>;
	readonly derived: AuthProviderDerivedContextFlags;
	readonly contextValue: AuthProviderContextValue;
}

export interface AuthProviderRemoteProbeRuntimeState {
	readonly isAuthenticated: boolean;
	readonly isImpersonationActive: boolean;
	readonly isSelectionPending: boolean;
	readonly isTerminating: boolean;
}

export interface AuthProviderPhaseDBinderProps {
	readonly authSyncListener: {
		readonly enabled: boolean;
		readonly getDeps: AuthProviderAuthSyncRuntime['getAuthSyncListenerDeps'];
	};
	readonly remoteProbe: {
		readonly enabled: boolean;
		readonly getRuntimeState: () => AuthProviderRemoteProbeRuntimeState;
		readonly runSessionValidityProbe: AuthProviderTerminationRuntime['runSessionValidityProbeForSession'];
	};
	readonly telemetryAuthSyncEmitted: { readonly enabled: boolean };
	readonly telemetryAuthSync: { readonly enabled: boolean };
}

export interface AuthProviderPhaseDPayload {
	readonly phase: AuthProviderPhaseDId;
	readonly binders: AuthProviderPhaseDBinderProps;
	readonly children: ReactNode;
}

/** Ensamblaje completo post Fase D — input para AuthContext.Provider. */
export interface AuthProviderAssemblyResult {
	readonly phases: {
		readonly a: AuthProviderPhaseAPayload;
		readonly b: AuthProviderPhaseBEffectsContract;
		readonly c: AuthProviderPhaseCPayload;
		readonly d: AuthProviderPhaseDPayload;
	};
	readonly runtime: AuthProviderRuntime;
}

// ---------------------------------------------------------------------------
// AuthProviderRuntime — bus central (DR-P1-04: compositors reciben slices)
// ---------------------------------------------------------------------------

export interface AuthProviderRuntime {
	readonly state: AuthProviderState;
	readonly setters: AuthProviderSetters;
	readonly refs: AuthProviderRefs;
	readonly queryClient: QueryClient;
	readonly refreshRuntime: AuthProviderRefreshRuntime;
	readonly cleanup: AuthProviderCleanupApi;
	readonly telemetryUx: AuthProviderTelemetryUxRuntime;
	readonly termination: AuthProviderTerminationRuntime;
	readonly permissions: AuthProviderPermissionsRuntime;
	readonly empresa: AuthProviderEmpresaRuntime;
	readonly impersonation: AuthProviderImpersonationRuntime;
	readonly bootstrap: AuthProviderBootstrapRuntime;
	readonly refresh: AuthProviderRefreshWiringRuntime;
	readonly authSync: AuthProviderAuthSyncRuntime;
	readonly publicActions: AuthProviderPublicActionsRuntime;
	readonly derived: AuthProviderDerivedContextFlags;
	readonly contextValue: AuthProviderContextValue;
}

// ---------------------------------------------------------------------------
// Compositor factory contracts (DR-P1-04 — sin imports cruzados entre compositors)
// ---------------------------------------------------------------------------

export type AuthProviderCompositorId =
	| 'state'
	| 'cleanup'
	| 'telemetry-ux'
	| 'termination'
	| 'permissions'
	| 'empresa'
	| 'impersonation'
	| 'bootstrap'
	| 'refresh-wiring'
	| 'interceptors-effects'
	| 'auth-sync'
	| 'public-actions'
	| 'phase-d-binders';

/** Compositors MUST NOT import sibling compositor modules — only types + session. */
export interface AuthProviderCompositorFactoryContext {
	readonly partialRuntime: Readonly<Partial<AuthProviderRuntime>>;
	readonly phaseA: Readonly<Partial<AuthProviderPhaseAPayload>>;
}

export interface AuthProviderCompositorFactory<TSlice> {
	readonly id: AuthProviderCompositorId;
	readonly assemblyPhase: AuthProviderAssemblyPhase;
	create(context: AuthProviderCompositorFactoryContext): TSlice;
}

export type AuthProviderStateCompositorFactory =
	AuthProviderCompositorFactory<Pick<AuthProviderRuntime, 'state' | 'setters' | 'refs'>>;

export type AuthProviderTerminationCompositorFactory = AuthProviderCompositorFactory<
	Pick<AuthProviderRuntime, 'termination'>
>;

export type AuthProviderPublicActionsCompositorFactory = AuthProviderCompositorFactory<
	Pick<AuthProviderRuntime, 'publicActions'>
>;

// ---------------------------------------------------------------------------
// Import policy constants (anti-cycle verification)
// ---------------------------------------------------------------------------

/** Prefixes permitidos en módulos bajo provider/ (types + future compositors). */
export const AUTH_PROVIDER_ALLOWED_IMPORT_PREFIXES = [
	'@/core/api/',
	'@/core/auth/provider/',
	'@/core/auth/session/',
	'@/core/auth/types/',
	'@/core/auth/utils/',
	'@/core/services/',
	'@/features/',
	'@tanstack/react-query',
	'axios',
	'react',
	'react-hot-toast',
] as const;

/** Imports prohibidos desde provider/ hacia app shell. */
export const AUTH_PROVIDER_FORBIDDEN_IMPORT_PREFIXES = [
	'@/shared/context/AuthContext',
	'@/app/provider',
] as const;

/** Compositor modules MUST NOT import other *-compositor modules (IMPL-06+). */
export const AUTH_PROVIDER_COMPOSITOR_MODULE_PATTERN = /auth-provider-.*\.compositor\.(ts|tsx)$/;

export const AUTH_PROVIDER_FORBIDDEN_COMPOSITOR_TO_COMPOSITOR =
	/auth-provider-(?!types|import-policy)[\w-]+\.compositor/;
