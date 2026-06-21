// src/shared/context/AuthContext.tsx
import React, { 
	createContext, 
	useContext, 
	useEffect, 
	useMemo, 
	useState, 
	useRef, 
	ReactNode,
	useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../core/api/api';
import { authService } from '../../features/auth/services/auth.service';
import type {
	AxiosResponse,
	AxiosError,
	InternalAxiosRequestConfig,
	AxiosRequestHeaders,
} from 'axios';
import type {
	Token,
	UserData,
	ClienteInfo,
	EmpresaOption,
	LoginResponse,
	AuthLoginSession,
	PasswordChangeRequest,
} from '../../features/auth/types/auth.types';
import {
	isLoginEmpresaSelectionResponse,
	APP_CHANGE_PASSWORD,
} from '../../features/auth/types/auth.types';
import { isPasswordChangeRequired } from '@/core/services/error.service';
import { useBrandingStore } from '../../features/tenant/stores/branding.store';
import type { UserPermissions } from '../../core/auth/types/permission.types';
import type { AuthMenuModulo } from '../../core/auth/types/auth-menu.types';
import { menuService } from '../../features/admin/services/menu.service';
import { empresaService } from '../../features/org/services/org.service';
import { showServerErrorToast } from '../../core/api/axios-instances';
import {
	hasExplicitAuthorization,
	shouldSkipTokenRefresh,
	shouldSkipPasswordChangeRedirect,
	shouldBypassPasswordChangeEnforcement,
	isSelectionSessionErrorStatus,
	isImpersonationAuthErrorStatus,
} from '@/core/api/auth-http.utils';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import {
	savePlatformParentSession,
	getPlatformParentSession,
	clearPlatformParentSession,
	hasPlatformParentSession,
} from '@/core/auth/utils/platform-parent-session';
import { canInitializeFullSession, isSelectionPendingToken } from '@/core/auth/utils/session-token';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { invalidateOrgQueries } from '@/features/org/utils/invalidate-org-queries';
import { invalidateInvQueries } from '@/features/inv/utils/invalidate-inv-queries';
import { waitForEmpresaSelectionHydration } from '@/features/auth/stores/empresa-selection-hydration';
import { logAuthContext } from '@/core/auth/utils/auth-debug';
import { logAuthSessionSnapshot } from '@/core/auth/utils/auth-session-snapshot';
import {
	logAuthSessionDiag,
	runLegacySessionDevLog,
} from '@/core/auth/utils/auth-session-log';
import {
	logImpersonationFe,
	isImpersonationSupportMode,
} from '@/core/auth/utils/impersonation-fe-log';
import {
	clearImpersonationSupportSession,
	getImpersonationSupportAccessToken,
	saveImpersonationSupportSession,
} from '@/core/auth/utils/impersonation-support-session';
import {
	canAccessErp as computeCanAccessErp,
	mustSelectEmpresa as computeMustSelectEmpresa,
	hasEmpresaActiva,
} from '@/core/auth/utils/empresa-access';
import {
	mapOrgEmpresaToOption,
	normalizeEmpresasElegibles,
	normalizeEmpresaId,
} from '@/core/auth/utils/empresa-eligibles';
import { indexRoutePermissionsFromMenu } from '@/core/auth/utils/index-route-permissions-from-menu';
import { hydrateSessionCore, type HydrateSessionCoreDeps } from '@/core/auth/session/session-refresh-hydrate';
import { buildSessionClaimsSnapshot, type SessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import { applyPostRefreshSession } from '@/core/auth/session/session-post-refresh';
import {
	applyPostRefreshRqInvalidation,
	resolvePostRefreshRqAction,
} from '@/core/auth/session/session-rq-invalidation';
import {
	getLoadMenuUxOptionsForMode,
	type LoadMenuUxOptions,
} from '@/core/auth/session/session-menu-ux';
import { REFRESH_HYDRATE_ENABLED } from '@/core/auth/session/refresh-hydrate.flags';
import { SESSION_TERMINATION_V2_ENABLED } from '@/core/auth/session/session-termination.flags';
import { createSessionUxTerminationWiring } from '@/core/auth/session/session-ux-auth-wiring';
import { SESSION_UX_V7_ENABLED } from '@/core/auth/session/session-ux.flags';
import { SESSION_LOGOUT_V3_ENABLED, SESSION_REMOTE_PROBE_ENABLED } from '@/core/auth/session/session-logout-v3.flags';
import {
	executeLogoutAllFlow,
	type LogoutAllFlowDeps,
	type LogoutAllFlowInput,
} from '@/core/auth/session/session-logout-all';
import { createAuthSyncTerminationEmitter, emitEmpresaChangedSync, emitSessionLoginSync, emitSessionRefreshedSync } from '@/core/auth/session/session-auth-sync-emit';
import { SESSION_AUTH_SYNC_V4_ENABLED } from '@/core/auth/session/session-auth-sync.flags';
import { applySelectionSyncFromEnvelope, emitSelectionSyncCleared, emitSelectionSyncFromResponse } from '@/core/auth/session/session-auth-sync-selection';
import type { ApplyInboundAuthSyncDeps } from '@/core/auth/session/session-auth-sync-apply';
import { AuthSyncListenerBinder } from '@/core/auth/session/useAuthSyncListener';
import { SessionRemoteProbeBinder } from '@/core/auth/session/useSessionRemoteProbe';
import {
	terminateSession,
	type TerminateSessionDeps,
	type TerminateSessionInput,
} from '@/core/auth/session/session-terminate';
import { logoutAllSessions as callLogoutAllSessionsApi } from '@/features/admin/services/session.service';
import type {
	ClassifySessionTerminationInput,
	SessionTerminationClassification,
} from '@/core/auth/session/session-termination-reason';
import { classifySessionTermination } from '@/core/auth/session/session-termination-reason';
import type { SessionTerminationUxProfile } from '@/core/auth/session/session-termination-ux';
import {
	applyL02GuardToRefreshClassifyInput,
	clearCambiarEmpresaL02Guard,
	registerCambiarEmpresaL02Guard,
} from '@/core/auth/session/session-cambiar-empresa-l02';
import type { RefreshOutcome } from '@/core/auth/session/session-refresh-outcome.types';
import { executeRefreshWithResilience, getRefreshFailureOutcomeMetadata } from '@/core/auth/session/session-refresh-resilience';
import { emitImpersonationPostRestoreSync } from '@/core/auth/session/session-impersonation-auth-sync';
import {
	executeImpersonationControlledExit,
	type ExecuteImpersonationControlledExitDeps,
} from '@/core/auth/session/session-impersonation-exit';
import {
	resolveImpersonationExitPolicy,
	shouldRedirectToSuperAdminAfterImpersonationExit,
} from '@/core/auth/session/session-impersonation-exit.policy';
import type { ImpersonationExitSource } from '@/core/auth/session/session-impersonation.types';
import {
	composeTerminationEventEmitters,
	createSessionTelemetryTerminationEmitter,
	emitSessionBootstrapCompletedTelemetry,
	emitSessionImpersonationExitFromSource,
	emitSessionProbeCompletedTelemetry,
	emitSessionRefreshFailureOutcomeTelemetry,
	emitSessionRefreshOutcomeTelemetry,
	SessionTelemetryAuthSyncBinder,
	SessionTelemetryAuthSyncEmittedBinder,
	trackSessionBootstrapCorrelation,
	trackSessionLoginCorrelation,
} from '@/core/auth/session/session-telemetry-auth-wiring';
import { resetCorrelationId } from '@/core/auth/session/session-telemetry-correlation';
import {
	SESSION_TELEMETRY_V8_ENABLED,
} from '@/core/auth/session/session-telemetry.flags';
import type { SessionTerminationCaller } from '@/core/auth/session/session-telemetry.types';
import { resolveTerminationCaller } from '@/core/auth/session/session-telemetry-events.policy';
import { toast } from 'react-hot-toast';

// ============================================================================
// BLOQUEO DE CONCURRENCIA GLOBAL (CRÍTICO)
// ============================================================================
type RefreshPromise = Promise<string> | null;
let isRefreshingPromise: RefreshPromise = null;

/** URL canónica refresh — requerida en classify bootstrap/interceptor (AUDIT-A P1-02). */
export const AUTH_REFRESH_TERMINATION_URL = '/auth/refresh/';

// ============================================================================
// IAM-FE-PHASE-02 — factory TerminateSessionDeps + salida de sesión
// ============================================================================

export interface GetTerminateSessionDepsParams {
	isTerminatingRef: { current: boolean };
	processQueue: TerminateSessionDeps['processQueue'];
	clearLocalAuthState: (preservePreLoginBranding: boolean) => void;
	getHadAuthenticatedUser: () => boolean;
	callLogoutEndpoint: () => void | Promise<void>;
	clearQueryCache: () => void | Promise<void>;
	showTerminationToast: TerminateSessionDeps['showTerminationToast'];
	redirectToLogin: TerminateSessionDeps['redirectToLogin'];
	clearRefreshingPromise?: () => void;
	emitTerminationEvent?: TerminateSessionDeps['emitTerminationEvent'];
}

export function getTerminateSessionDeps(
	params: GetTerminateSessionDepsParams,
): TerminateSessionDeps {
	return {
		getIsTerminating: () => params.isTerminatingRef.current,
		setIsTerminating: (value: boolean) => {
			params.isTerminatingRef.current = value;
		},
		clearRefreshingPromise:
			params.clearRefreshingPromise ??
			(() => {
				isRefreshingPromise = null;
			}),
		processQueue: params.processQueue,
		clearAuthState: (options) => {
			const preservePreLoginBranding =
				options.preservePreLoginBranding ?? !params.getHadAuthenticatedUser();
			params.clearLocalAuthState(preservePreLoginBranding);
		},
		callLogoutEndpoint: params.callLogoutEndpoint,
		clearQueryCache: params.clearQueryCache,
		showTerminationToast: params.showTerminationToast,
		redirectToLogin: params.redirectToLogin,
		...(params.emitTerminationEvent
			? { emitTerminationEvent: params.emitTerminationEvent }
			: {}),
	};
}

/** Redirect post-terminación con `replace: true` (Paso 8). AuthProvider está fuera del Router. */
export function createAuthTerminateRedirectToLogin(): (path: string) => void {
	return (path: string) => {
		void import('@/app/router').then(({ router }) => {
			void router.navigate(path, { replace: true });
		});
	};
}

export interface AuthTerminationToastApi {
	error: (message: string, options?: { duration?: number; position?: string }) => void;
	success: (message: string, options?: { duration?: number; position?: string }) => void;
}

/**
 * Toast post-terminación (Paso 8).
 * Toast OR banner: omite toast cuando el redirect lleva query param (banner en Login).
 */
export function createAuthShowTerminationToast(
	toastApi: AuthTerminationToastApi = toast,
): (profile: SessionTerminationUxProfile) => void {
	return (profile) => {
		if (profile.loginQueryParam !== undefined || profile.toastMessage === null) {
			return;
		}

		const options = { duration: 5000, position: 'top-right' as const };

		switch (profile.severity) {
			case 'info':
				toastApi.success(profile.toastMessage, { duration: 3000, position: 'top-right' });
				break;
			case 'warning':
				toastApi.error(profile.toastMessage, options);
				break;
			case 'error':
			default:
				toastApi.error(profile.toastMessage, options);
				break;
		}
	};
}

/** Mensaje estable de cola en salida legacy pre-Fase-2 (Paso 9). */
export const LEGACY_SESSION_QUEUE_ERROR_MESSAGE = 'Session expired';

export interface LegacySessionLogoutDeps {
	clearRefreshingPromise?: () => void;
	processQueue: (error: Error | null, token: string | null) => void;
	callLogoutEndpoint: () => void | Promise<void>;
	clearLocalAuthState: (preservePreLoginBranding: boolean) => void;
	getHadAuthenticatedUser: () => boolean;
}

/**
 * Salida de sesión legacy (flag OFF): cleanup local sin terminateSession V2 (§21.2).
 */
export async function performLegacySessionLogout(
	deps: LegacySessionLogoutDeps,
	callServer: boolean,
): Promise<void> {
	deps.clearRefreshingPromise?.();
	deps.processQueue(new Error(LEGACY_SESSION_QUEUE_ERROR_MESSAGE), null);

	if (callServer) {
		try {
			await deps.callLogoutEndpoint();
		} catch {
			// Best-effort — no bloquea limpieza local.
		}
	}

	const preservePreLoginBranding = !deps.getHadAuthenticatedUser();
	deps.clearLocalAuthState(preservePreLoginBranding);
}

/**
 * Factory clearQueryCache según flag Fase 2 (Paso 9).
 * ON → queryClient.clear(); OFF → noop.
 */
export function buildTerminationClearQueryCache(
	enabled: boolean,
	clearCache: () => void,
): () => void {
	return enabled ? clearCache : () => undefined;
}

export interface RunSessionTerminationExitOptions {
	v2Enabled: boolean;
	legacyDeps: LegacySessionLogoutDeps;
	legacyCallServer?: boolean;
	v2Action: () => Promise<void>;
}

/**
 * Dispatcher único V2 vs legacy (Paso 10 — estabilización wiring).
 */
export async function runSessionTerminationExit(
	options: RunSessionTerminationExitOptions,
): Promise<void> {
	if (options.v2Enabled) {
		await options.v2Action();
		return;
	}
	await performLegacySessionLogout(options.legacyDeps, options.legacyCallServer ?? false);
}

export function extractTerminationHttpContextFromError(
	error: unknown,
	options?: { fallbackUrl?: string },
): Pick<ClassifySessionTerminationInput, 'httpStatus' | 'detail' | 'url'> {
	const fallbackUrl = options?.fallbackUrl ?? AUTH_REFRESH_TERMINATION_URL;

	if (!error || typeof error !== 'object') {
		return { url: fallbackUrl };
	}

	const axiosError = error as AxiosError<{ detail?: unknown }>;
	const configUrl =
		typeof axiosError.config?.url === 'string' ? axiosError.config.url : undefined;

	return {
		httpStatus: axiosError.response?.status,
		detail: axiosError.response?.data?.detail,
		url: configUrl ?? fallbackUrl,
	};
}

/** Contexto classify para bootstrap refresh fail (Paso 6). */
export function buildBootstrapTerminationClassifyInput(
	error: unknown,
): ClassifySessionTerminationInput {
	return {
		context: 'bootstrap',
		...extractTerminationHttpContextFromError(error, {
			fallbackUrl: AUTH_REFRESH_TERMINATION_URL,
		}),
	};
}

/** Contexto classify para interceptor refresh fail (Paso 6). */
export function buildInterceptorRefreshTerminationClassifyInput(
	error: unknown,
): ClassifySessionTerminationInput {
	return {
		context: 'refresh',
		...extractTerminationHttpContextFromError(error, {
			fallbackUrl: AUTH_REFRESH_TERMINATION_URL,
		}),
	};
}

/**
 * Entrada terminateSession preservando siempre el error original (AUDIT-A P1-01).
 */
export function buildTerminateSessionInput(
	classification: SessionTerminationClassification,
	options: {
		error: unknown;
		callServer?: boolean;
		skipRedirect?: boolean;
		preservePreLoginBranding?: boolean;
	},
): TerminateSessionInput {
	return {
		reason: classification.reason,
		error: options.error,
		callServer: options.callServer,
		skipRedirect: options.skipRedirect,
		preservePreLoginBranding: options.preservePreLoginBranding,
	};
}

/**
 * Entrada terminateSession para doLogout/logout (Paso 5 + 8).
 * doLogout(false) → SILENT_CLEANUP sin redirect; doLogout(true)/logout → MANUAL_LOGOUT con redirect.
 */
export function buildDoLogoutTerminateInput(options: {
	callServer: boolean;
	error?: unknown;
}): TerminateSessionInput {
	return {
		reason: options.callServer ? 'MANUAL_LOGOUT' : 'SILENT_CLEANUP',
		callServer: options.callServer,
		error: options.error,
		skipRedirect: !options.callServer,
	};
}

/** Único camino de salida vía runTerminateSession (Paso 5). */
export async function executeDoLogoutTermination(
	runTerminateSession: (input: TerminateSessionInput) => Promise<void>,
	options: { callServer: boolean; error?: unknown },
): Promise<void> {
	await runTerminateSession(buildDoLogoutTerminateInput(options));
}

// ============================================================================
// IAM-FE-PHASE-03 — Logout All wiring (IMPL-04)
// ============================================================================

/**
 * Entrada terminateSession post logout_all 200 (§9.7, §13.3).
 * callServer: false — el backend ya revocó todas las sesiones.
 */
export function buildLogoutAllTerminateInput(input: LogoutAllFlowInput): TerminateSessionInput {
	return {
		reason: 'MANUAL_LOGOUT',
		callServer: false,
		preservePreLoginBranding: input.preservePreLoginBranding ?? true,
		skipRedirect: input.skipRedirect ?? false,
	};
}

export interface GetLogoutAllFlowDepsParams {
	isTerminatingRef: { current: boolean };
	callLogoutAllEndpoint: () => Promise<void>;
	runTerminateAfterLogoutAll: () => Promise<void>;
	onLogoutAllRejected?: LogoutAllFlowDeps['onLogoutAllRejected'];
}

/** Factory DI para executeLogoutAllFlow (§9.2, AUDIT-A A2-02). */
export function getLogoutAllFlowDeps(params: GetLogoutAllFlowDepsParams): LogoutAllFlowDeps {
	return {
		getIsTerminating: () => params.isTerminatingRef.current,
		callLogoutAllEndpoint: params.callLogoutAllEndpoint,
		runTerminateAfterLogoutAll: params.runTerminateAfterLogoutAll,
		...(params.onLogoutAllRejected
			? { onLogoutAllRejected: params.onLogoutAllRejected }
			: {}),
	};
}

/**
 * Terminación local tras logout_all 200 vía dispatcher Fase 2 congelado.
 * V2 OFF → legacy cleanup + redirect explícito (§12.5).
 */
export async function executeLogoutAllTermination(
	runTerminateSession: (input: TerminateSessionInput) => Promise<void>,
	legacyLogoutDeps: LegacySessionLogoutDeps,
	input: LogoutAllFlowInput,
	redirectToLogin?: (path: string) => void,
): Promise<void> {
	const v2Enabled = SESSION_TERMINATION_V2_ENABLED;

	await runSessionTerminationExit({
		v2Enabled,
		legacyDeps: legacyLogoutDeps,
		legacyCallServer: false,
		v2Action: () => runTerminateSession(buildLogoutAllTerminateInput(input)),
	});

	if (!v2Enabled && redirectToLogin) {
		redirectToLogin('/login');
	}
}

// ============================================================================
// IAM-FE-PHASE-03 — Session validity probe (IMPL-05)
// ============================================================================

export interface SessionValidityProbeDeps {
	isProbeInFlightRef: { current: boolean };
	fetchMe: () => Promise<UserData | null>;
}

export interface GetSessionValidityProbeDepsParams {
	isProbeInFlightRef: { current: boolean };
	fetchMe: () => Promise<UserData | null>;
}

/** Factory DI para runSessionValidityProbe (§9.6). */
export function getSessionValidityProbeDeps(
	params: GetSessionValidityProbeDepsParams,
): SessionValidityProbeDeps {
	return {
		isProbeInFlightRef: params.isProbeInFlightRef,
		fetchMe: params.fetchMe,
	};
}

/**
 * Probe de validez de sesión vía GET /auth/me (authService.me).
 * - Single-flight: retorno inmediato si hay probe en curso.
 * - Éxito: descarta resultado; sin mutación de estado.
 * - 401/terminación: delegado al interceptor Axios (sin capture local).
 */
export async function runSessionValidityProbe(
	deps: SessionValidityProbeDeps,
): Promise<void> {
	if (deps.isProbeInFlightRef.current) {
		return;
	}

	deps.isProbeInFlightRef.current = true;
	try {
		await deps.fetchMe();
	} finally {
		deps.isProbeInFlightRef.current = false;
	}
}

/** Errores post-refresh L2/L1 que deben clasificarse como HYDRATE_FAILED (Paso 6). */
const HYDRATE_TERMINATION_ERROR_MESSAGES = new Set([
	'Post-refresh full hydration failed',
	'Invalid access token for claims sync',
]);

/**
 * Classify input para fallo en interceptor: refresh 401 vs hydrate post-refresh (Paso 6).
 */
export function buildInterceptorTerminationClassifyInput(
	error: unknown,
): ClassifySessionTerminationInput {
	if (error instanceof Error && HYDRATE_TERMINATION_ERROR_MESSAGES.has(error.message)) {
		return { context: 'hydrate' };
	}
	return buildInterceptorRefreshTerminationClassifyInput(error);
}

export interface ExecuteClassifiedTerminationOptions {
	classifyInput: ClassifySessionTerminationInput;
	error: unknown;
	callServer?: boolean;
	skipRedirect?: boolean;
	preservePreLoginBranding?: boolean;
}

/**
 * classify → buildTerminateSessionInput → runTerminateSession (Paso 6).
 * Preserva siempre el error original en el input (AUDIT-A P1-01).
 */
export async function executeClassifiedTermination(
	runTerminateSession: (input: TerminateSessionInput) => Promise<void>,
	options: ExecuteClassifiedTerminationOptions,
): Promise<void> {
	const classification = classifySessionTermination(options.classifyInput);
	await runTerminateSession(
		buildTerminateSessionInput(classification, {
			error: options.error,
			callServer: options.callServer,
			skipRedirect: options.skipRedirect,
			preservePreLoginBranding: options.preservePreLoginBranding,
		}),
	);
}

/** Bootstrap refresh fail → classify con contexto refresh URL (AUDIT-A P1-02). */
export async function executeBootstrapRefreshTermination(
	runTerminateSession: (input: TerminateSessionInput) => Promise<void>,
	error: unknown,
): Promise<void> {
	try {
		await executeClassifiedTermination(runTerminateSession, {
			classifyInput: applyL02GuardToRefreshClassifyInput(
				buildBootstrapTerminationClassifyInput(error),
			),
			error,
			callServer: false,
			skipRedirect: false,
		});
	} finally {
		clearCambiarEmpresaL02Guard();
	}
}

/** Interceptor refresh/hydrate fail → classify + terminate (Paso 6). */
export async function executeInterceptorRefreshTermination(
	runTerminateSession: (input: TerminateSessionInput) => Promise<void>,
	error: unknown,
): Promise<void> {
	try {
		await executeClassifiedTermination(runTerminateSession, {
			classifyInput: applyL02GuardToRefreshClassifyInput(
				buildInterceptorTerminationClassifyInput(error),
			),
			error,
			callServer: false,
			skipRedirect: false,
		});
	} finally {
		clearCambiarEmpresaL02Guard();
	}
}

/** Classify input canónico para fallo hydrate (Paso 7). */
export function buildHydrateFailureClassifyInput(): ClassifySessionTerminationInput {
	return { context: 'hydrate' };
}

/** hydrateSessionCore me null / fallo L2 → HYDRATE_FAILED (Paso 7). */
export async function executeHydrateFailureTermination(
	runTerminateSession: (input: TerminateSessionInput) => Promise<void>,
	error?: unknown,
): Promise<void> {
	await executeClassifiedTermination(runTerminateSession, {
		classifyInput: buildHydrateFailureClassifyInput(),
		error,
		callServer: false,
		skipRedirect: false,
	});
}

export interface HydrateFetchMeErrorRef {
	current: unknown;
}

/**
 * Envuelve fetchMe para capturar el error original en throws (Paso 7).
 * /auth/me 401→null no expone error vía authService; solo aplica en throw.
 */
export function createHydrateFetchMeWithErrorCapture(
	fetchMe: () => Promise<UserData | null>,
	errorRef: HydrateFetchMeErrorRef,
): () => Promise<UserData | null> {
	return async () => {
		errorRef.current = undefined;
		try {
			return await fetchMe();
		} catch (error) {
			errorRef.current = error;
			throw error;
		}
	};
}

export interface CreateTerminateFromHydrateFailureOptions {
	consumeFetchMeError?: () => unknown;
}

/**
 * Callback DI para hydrateSessionCore.doLogout → terminateSession (Paso 7).
 * callServer=false → HYDRATE_FAILED; callServer=true → MANUAL_LOGOUT (retrocompat).
 */
export function createTerminateFromHydrateFailure(
	runTerminateSession: (input: TerminateSessionInput) => Promise<void>,
	options?: CreateTerminateFromHydrateFailureOptions,
): (callServer: boolean) => Promise<void> {
	return async (callServer: boolean) => {
		if (callServer) {
			await executeDoLogoutTermination(runTerminateSession, { callServer: true });
			return;
		}
		const error = options?.consumeFetchMeError?.();
		await executeHydrateFailureTermination(runTerminateSession, error);
	};
}

// ============================================================================
// TIPOS
// ============================================================================
type AuthState = { 
	user: UserData | null; 
	token: string | null;
};

interface AuthContextType {
	auth: AuthState;
	setAuthFromLogin: (response: Token) => Promise<AuthLoginSession | null>;
	completeEmpresaSelection: (empresaId: string) => Promise<UserData | null>;
	cambiarEmpresaActiva: (empresaId: string) => Promise<UserData | null>;
	logout: () => Promise<void>;
	/** POST /auth/logout_all/ + terminación local (IAM-FE-PHASE-03 IMPL-04). */
	logoutAllSessions: () => Promise<void>;
	/** GET /auth/me probe sin mutar estado (IAM-FE-PHASE-03 IMPL-05). */
	runSessionValidityProbe: () => Promise<void>;
	isAuthenticated: boolean;
	loading: boolean;
	authInitialized: boolean;
	isBootstrapped: boolean;
	hasRole: (...roles: string[]) => boolean;
	accessLevel: number;
	isSuperAdmin: boolean;
	userType: string;
	clienteInfo: ClienteInfo | null;
	permissions: UserPermissions | null;
	menuModulos: AuthMenuModulo[] | null;
	/** true cuando GET /auth/menu terminó y permisos de ruta están listos para PermissionGuard */
	menuPermissionsReady: boolean;
	empresaActivaId: string | null;
	empresasElegibles: EmpresaOption[];
	/** @deprecated Alias de empresasElegibles */
	empresasDisponibles: EmpresaOption[];
	requiereSeleccionEmpresa: boolean;
	esAdminCliente: boolean;
	hasEmpresaActivaFlag: boolean;
	canAccessErp: boolean;
	mustSelectEmpresa: boolean;
	reloadMenuAndPermissions: () => Promise<void>;
	isImpersonation: boolean;
	impersonatedBy: string | null;
	impersonatedByUsername: string | null;
	impersonationClienteLabel: string | null;
	startImpersonation: (
		clienteId: string,
		options?: { clienteLabel?: string },
	) => Promise<{ requiresEmpresaSelection: boolean }>;
	endImpersonation: () => Promise<void>;
	/** Cambio obligatorio antes de ERP (derivado de user / selection preview). */
	requiresPasswordChange: boolean;
	completePasswordChange: (payload: PasswordChangeRequest) => Promise<AuthLoginSession | null>;
}

// ============================================================================
// CONSTANTES
// ============================================================================
const initialAuth: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextType>({
	auth: initialAuth,
	setAuthFromLogin: async () => null as AuthLoginSession | null,
	completeEmpresaSelection: async () => null,
	cambiarEmpresaActiva: async () => null,
	logout: async () => {},
	logoutAllSessions: async () => {},
	runSessionValidityProbe: async () => {},
	isAuthenticated: false,
	loading: true,
	authInitialized: false,
	isBootstrapped: false,
	hasRole: () => false,
	accessLevel: 0,
	isSuperAdmin: false,
	userType: 'user',
	clienteInfo: null,
	permissions: null,
	menuModulos: null,
	menuPermissionsReady: false,
	empresaActivaId: null,
	empresasElegibles: [],
	empresasDisponibles: [],
	requiereSeleccionEmpresa: false,
	esAdminCliente: false,
	hasEmpresaActivaFlag: false,
	canAccessErp: false,
	mustSelectEmpresa: false,
	reloadMenuAndPermissions: async () => {},
	isImpersonation: false,
	impersonatedBy: null,
	impersonatedByUsername: null,
	impersonationClienteLabel: null,
	startImpersonation: async () => ({ requiresEmpresaSelection: false }),
	endImpersonation: async () => {},
	requiresPasswordChange: false,
	completePasswordChange: async () => null,
});

// ============================================================================
// PROVIDER
// ============================================================================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const queryClient = useQueryClient();
	const [auth, setAuth] = useState<AuthState>(initialAuth);
	const [loading, setLoading] = useState(true);
	const [authInitialized, setAuthInitialized] = useState(false);
	const [isBootstrapped, setIsBootstrapped] = useState(false);
	
	// ✅ Estados para información de niveles de acceso
	const [accessLevel, setAccessLevel] = useState<number>(0);
	const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
	const [userType, setUserType] = useState<string>('user');
	const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
	// ✅ Estado para permisos granulares (derivados desde /auth/menu)
	const [permissions, setPermissions] = useState<UserPermissions | null>(null);
	// ✅ Estado para menú del usuario (desde GET /auth/menu)
	const [menuModulos, setMenuModulos] = useState<AuthMenuModulo[] | null>(null);
	const [menuPermissionsReady, setMenuPermissionsReady] = useState(false);
	const sessionMenuSnapshotRef = useRef<AuthMenuModulo[] | null>(null);
	const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(null);
	const [empresasElegibles, setEmpresasElegibles] = useState<EmpresaOption[]>([]);
	const [requiereSeleccionEmpresa, setRequiereSeleccionEmpresa] = useState(false);
	const [esAdminCliente, setEsAdminCliente] = useState(false);
	const [isImpersonation, setIsImpersonation] = useState(false);
	const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null);
	const [impersonatedByUsername, setImpersonatedByUsername] = useState<string | null>(null);

	const selectionUserPreview = useEmpresaSelectionStore((s) => s.userPreview);
	const hasPendingSelectionStore = useEmpresaSelectionStore((s) => s.hasPendingSelection());
	const [impersonationClienteLabel, setImpersonationClienteLabel] = useState<string | null>(null);

	// Refs para acceder al estado más reciente sin re-renders
	const authRef = useRef(auth);
	const loadingRef = useRef(loading);
	const empresaActivaIdRef = useRef(empresaActivaId);
	const isInitializedRef = useRef(false);
	
	const failedQueueRef = useRef<Array<{
		resolve: (value: string) => void;
		reject: (reason?: Error) => void;
	}>>([]);
	const isTerminatingRef = useRef(false);
	const isLogoutAllInFlightRef = useRef(false);
	const isSessionValidityProbeInFlightRef = useRef(false);
	const terminationCallerHintRef = useRef<SessionTerminationCaller | undefined>(undefined);

	// Sincronizar refs
	useEffect(() => {
		authRef.current = auth;
	}, [auth]);

	useEffect(() => {
		loadingRef.current = loading;
	}, [loading]);

	useEffect(() => {
		empresaActivaIdRef.current = empresaActivaId;
	}, [empresaActivaId]);

	// Logs temporales: mount/unmount para diagnosticar reinicialización
	useEffect(() => {
		console.log('🟢 [AuthContext] MOUNT');
		return () => {
			console.log('🔴 [AuthContext] UNMOUNT');
		};
	}, []);

	// ============================================================================
	// HELPERS
	// ============================================================================

	/**
	 * ✅ CORREGIDO: Determina el tipo de usuario basado en nivel de acceso
	 */
	const determineUserType = useCallback((level: number, isSuper: boolean): string => {
		if (isSuper) return 'super_admin';
		if (level >= 4) return 'tenant_admin';
		return 'user';
	}, []);

	const clearImpersonationState = useCallback(() => {
		setIsImpersonation(false);
		setImpersonatedBy(null);
		setImpersonatedByUsername(null);
		setImpersonationClienteLabel(null);
	}, []);

	const syncImpersonationFromToken = useCallback(
		(token: string | null) => {
			const claims = decodeAccessToken(token);
			const active = Boolean(claims?.is_impersonation);
			setIsImpersonation(active);
			setImpersonatedBy(active ? claims?.impersonated_by ?? null : null);
			setImpersonatedByUsername(
				active ? claims?.impersonated_by_username ?? null : null,
			);
			if (!active) {
				setImpersonationClienteLabel(null);
			}
		},
		[],
	);

	const isImpersonationActive = useCallback((): boolean => {
		return isImpersonation || isImpersonationToken(authRef.current.token);
	}, [isImpersonation]);

	const syncEmpresaSession = useCallback((user: UserData | null, token: string | null) => {
		const claims = decodeAccessToken(token);
		const activaRaw = user?.empresa_activa ?? claims?.empresa_id ?? null;
		const activa =
			activaRaw !== null && activaRaw !== undefined && String(activaRaw).trim().length > 0
				? String(activaRaw).trim()
				: null;
		const pending = Boolean(claims?.empresa_selection_pending);
		const admin = Boolean(user?.es_admin_cliente) || Boolean(claims?.es_admin_cliente);
		setEmpresaActivaId(activa);
		setRequiereSeleccionEmpresa(pending);
		setEsAdminCliente(admin);
		if (import.meta.env.DEV) {
			console.log('[AuthContext] syncEmpresaSession', {
				empresa_activa_me: user?.empresa_activa,
				empresa_id_jwt: claims?.empresa_id,
				empresaActivaId: activa,
				es_admin_cliente_me: user?.es_admin_cliente,
				es_admin_cliente_jwt: claims?.es_admin_cliente,
				esAdminCliente: admin,
			});
		}
	}, []);

	const shouldSkipErpMenuLoad = useCallback(
		(userData: UserData | null, token: string | null): boolean => {
			const claims = decodeAccessToken(token);
			if (claims?.empresa_selection_pending) {
				return true;
			}
			if (
				Boolean(userData?.requires_password_change) ||
				Boolean(claims?.requires_password_change)
			) {
				return true;
			}
			const type =
				userData?.user_type ??
				claims?.user_type ??
				determineUserType(userData?.access_level ?? 0, !!userData?.is_super_admin);
			if (type === 'platform_admin' || type === 'tenant_admin') {
				return false;
			}
			const empresaId = userData?.empresa_activa ?? claims?.empresa_id ?? null;
			const admin = Boolean(userData?.es_admin_cliente ?? claims?.es_admin_cliente);
			return !hasEmpresaActiva(empresaId) && !admin;
		},
		[determineUserType],
	);

	/** Indexa permisos de ruta desde /auth/menu (payload; no recalcula RBAC). */
	const buildRoutePermissionsFromMenu = useCallback(
		(modulos: AuthMenuModulo[]) => indexRoutePermissionsFromMenu(modulos),
		[],
	);

	/**
	 * Carga menú y permisos desde GET /auth/menu (fuente única).
	 */
	const loadMenuAndPermissionsFromAuthMenu = useCallback(async (
		userData: UserData | null,
		uxOptions?: LoadMenuUxOptions,
	): Promise<AuthMenuModulo[] | null> => {
		const preserveVisibleMenu = uxOptions?.preserveVisibleMenuDuringReload === true;

		if (!userData) {
			setPermissions(null);
			setMenuModulos(null);
			setMenuPermissionsReady(false);
			return null;
		}

		if (!preserveVisibleMenu) {
			setMenuPermissionsReady(false);
		}

		const token = authRef.current.token;
		if (shouldSkipErpMenuLoad(userData, token)) {
			setPermissions(null);
			setMenuModulos(null);
			setMenuPermissionsReady(true);
			return null;
		}

		// platform_admin: tiene todos los permisos (null); menú se carga igual desde backend
		if (
			userData.user_type === 'platform_admin' &&
			!isImpersonationToken(authRef.current.token)
		) {
			try {
				const response = await menuService.getAuthMenu();
				const modulos = response.modulos || [];
				setMenuModulos(modulos);
				setPermissions(null);
				setMenuPermissionsReady(true);
				return modulos;
			} catch (error) {
				console.error('❌ [AuthContext] Error cargando menú (super admin):', error);
				setMenuModulos([]);
				setPermissions(null);
				setMenuPermissionsReady(true);
				return [];
			}
		}

		// Usuario sin roles: sin menú ni permisos granulares
		if (!userData.roles || userData.roles.length === 0) {
			setMenuModulos(null);
			setPermissions({});
			setMenuPermissionsReady(true);
			return null;
		}

		try {
			if (import.meta.env.DEV) {
				console.log('🔐 [AuthContext] Cargando menú y permisos desde /auth/menu...');
			}
			const response = await menuService.getAuthMenu();
			const modulos = response.modulos || [];
			setMenuModulos(modulos);

			const indexed = buildRoutePermissionsFromMenu(modulos);
			if (import.meta.env.DEV) {
				console.debug('[AuthContext] route permissions indexed from /auth/menu', indexed);
			}
			setPermissions(indexed);
			setMenuPermissionsReady(true);

			const moduleCount = Object.keys(indexed).length;
			if (import.meta.env.DEV && moduleCount > 0) {
				console.log(`✅ [AuthContext] Menú y permisos cargados: ${moduleCount} módulo(s)`);
			}
			return modulos;
		} catch (error) {
			const axiosError = error as AxiosError<{ detail?: string }>;
			if (axiosError.response?.status === 409) {
				setRequiereSeleccionEmpresa(true);
				setMenuModulos(null);
				setPermissions(null);
				setMenuPermissionsReady(false);
				return null;
			}
			console.error('❌ [AuthContext] Error cargando /auth/menu:', error);
			setMenuModulos([]);
			setPermissions({});
			setMenuPermissionsReady(true);
			return [];
		}
	}, [buildRoutePermissionsFromMenu, shouldSkipErpMenuLoad]);

	/**
	 * Actualiza estados de nivel de acceso desde datos de usuario.
	 * Fuente: user_type de /auth/me ("platform_admin" | "tenant_admin" | …).
	 */
	const updateAccessLevels = useCallback((userData: UserData | null) => {
		if (!userData) {
			setAccessLevel(0);
			setIsSuperAdmin(false);
			setUserType('user');
			setClienteInfo(null);
			setPermissions(null);
			setMenuModulos(null);
			setMenuPermissionsReady(false);
			setEmpresaActivaId(null);
			setEmpresasElegibles([]);
			setRequiereSeleccionEmpresa(false);
			setEsAdminCliente(false);
			clearImpersonationState();
			useBrandingStore.getState().resetBranding(null);
			return;
		}

		// Prioridad: user_type del backend (/auth/me)
		const type =
			typeof userData.user_type === 'string' && userData.user_type.trim()
				? userData.user_type
				: determineUserType(userData.access_level || 0, !!userData.is_super_admin);

		setAccessLevel(userData.access_level ?? 0);
		const impersonating = isImpersonationToken(authRef.current.token);
		setIsSuperAdmin(type === 'platform_admin' && !impersonating);
		setUserType(type);

		if (import.meta.env.DEV) {
			console.log('🔍 [AuthContext] user_type:', type, 'isSuperAdmin:', type === 'platform_admin', 'hasCliente:', !!userData.cliente);
		}
		
		// Actualizar información del cliente si está disponible
		if (userData.cliente) {
			setClienteInfo({
				cliente_id: userData.cliente.cliente_id,
				razon_social: userData.cliente.razon_social,
				subdominio: userData.cliente.subdominio,
				codigo_cliente: userData.cliente.codigo_cliente,
				nombre_comercial: userData.cliente.nombre_comercial,
				tipo_instalacion: userData.cliente.tipo_instalacion,
				servidor_api_local: (userData.cliente as any).servidor_api_local || null, // ✅ FASE 3: Incluir servidor_api_local
				estado_suscripcion: userData.cliente.estado_suscripcion,
			});
		} else {
			setClienteInfo(null);
		}

		syncEmpresaSession(userData, authRef.current.token);

		// ✅ IMPORTANTE: Cargar branding siempre que el usuario esté autenticado
		// El endpoint /tenant/branding usa el contexto del tenant (subdominio) del request,
		// no necesita cliente_id explícito. Funciona para tenant_admin y super_admin.
		// NOTA: El branding ahora se carga desde TenantContext cuando cambia el tenant
		// Este código se mantiene por compatibilidad pero el TenantContext maneja la carga
		if (userData && userData.cliente?.cliente_id) {
			console.log('🎨 [AuthContext] Tenant detectado, el TenantContext cargará el branding...');
		} else {
			// Solo resetear cuando no hay usuario
			useBrandingStore.getState().resetBranding(null);
		}
	}, [determineUserType, loadMenuAndPermissionsFromAuthMenu, syncEmpresaSession]);

	/** Login, refresh y selección de empresa: sin refresh automático ni retry ERP. */
	const skipsTokenRefresh = useCallback((url?: string): boolean => {
		if (!url) return false;
		if (url.toLowerCase().includes('/auth/password/change')) {
			return true;
		}
		return shouldSkipTokenRefresh(url);
	}, []);

	/**
	 * Identifica endpoints públicos que no requieren autenticación
	 * Estos endpoints pueden ser llamados sin token
	 */
	const isPublicEndpoint = useCallback((url?: string): boolean => {
		if (!url) return false;
		const cleanUrl = url.toLowerCase();
		// Endpoint público de branding por subdominio (pre-login)
		// El endpoint es /clientes/branding y puede tener query params como ?subdominio=xxx
		// Verificamos solo la ruta base, ya que el query string puede estar en config.params
		return cleanUrl.includes('/clientes/branding') && 
			!cleanUrl.includes('/clientes/tenant/branding'); // Excluir el endpoint autenticado
	}, []);

	/**
	 * Procesa la cola de peticiones fallidas después de un refresh exitoso
	 */
	const processQueue = useCallback((error: Error | null = null, token: string | null = null) => {
		failedQueueRef.current.forEach(promise => {
			if (error) {
				promise.reject(error);
			} else if (token) {
				promise.resolve(token);
			}
		});
		failedQueueRef.current = [];
	}, []);

	const performLocalAuthCleanup = useCallback((preservePreLoginBranding: boolean) => {
		runLegacySessionDevLog(() => {
			console.log('🚪 [Logout] Limpiando estado...');
		});

		document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

		setAuth(initialAuth);
		authRef.current = initialAuth;
		setAccessLevel(0);
		setIsSuperAdmin(false);
		setUserType('user');
		setClienteInfo(null);
		setPermissions(null);
		setMenuModulos(null);
		setMenuPermissionsReady(false);
		setEmpresaActivaId(null);
		setEmpresasElegibles([]);
		setRequiereSeleccionEmpresa(false);
		setEsAdminCliente(false);
		clearImpersonationState();
		clearImpersonationSupportSession();
		clearPlatformParentSession();
		useBrandingStore.getState().clearAll(preservePreLoginBranding);
		useEmpresaSelectionStore.getState().clearPendingSelection();
	}, [clearImpersonationState]);

	const sessionUxTerminationWiring = useMemo(() => {
		const legacyShowToast = createAuthShowTerminationToast();
		const legacyRedirect = createAuthTerminateRedirectToLogin();
		if (!SESSION_UX_V7_ENABLED) {
			return {
				showTerminationToast: legacyShowToast,
				redirectToLogin: legacyRedirect,
			};
		}
		return createSessionUxTerminationWiring({
			legacyShowToast,
			legacyRedirect,
		});
	}, []);

	const redirectToLoginAfterTermination = useMemo(
		() => sessionUxTerminationWiring.redirectToLogin,
		[sessionUxTerminationWiring],
	);
	const showTerminationToastAfterTermination = useMemo(
		() => sessionUxTerminationWiring.showTerminationToast,
		[sessionUxTerminationWiring],
	);

	const legacyLogoutDeps = useMemo(
		(): LegacySessionLogoutDeps => ({
			clearRefreshingPromise: () => {
				isRefreshingPromise = null;
			},
			processQueue,
			callLogoutEndpoint: async () => {
				try {
					await authService.logout();
				} catch (error) {
					const axiosError = error as AxiosError;
					console.error('❌ [Logout] Error:', axiosError.message);
				}
			},
			clearLocalAuthState: performLocalAuthCleanup,
			getHadAuthenticatedUser: () => Boolean(authRef.current.token),
		}),
		[processQueue, performLocalAuthCleanup],
	);

	const authSyncTerminationEmitter = useMemo(
		() => createAuthSyncTerminationEmitter(),
		[],
	);

	const sessionTelemetryTerminationEmitter = useMemo(
		() =>
			createSessionTelemetryTerminationEmitter({
				resolveCaller: (payload) =>
					terminationCallerHintRef.current ??
					resolveTerminationCaller(payload.reason),
			}),
		[],
	);

	const composedTerminationEmitter = useMemo(
		() =>
			composeTerminationEventEmitters(
				authSyncTerminationEmitter,
				sessionTelemetryTerminationEmitter,
			),
		[authSyncTerminationEmitter, sessionTelemetryTerminationEmitter],
	);

	const emitAuthSyncSessionToken = useCallback(
		(
			eventType: 'SESSION_LOGIN' | 'SESSION_REFRESHED' | 'EMPRESA_CHANGED',
			accessToken: string,
			priorSnapshot?: SessionClaimsSnapshot,
			refreshOutcome?: RefreshOutcome,
			impersonationExitSource?: ImpersonationExitSource,
		) => {
			if (!SESSION_AUTH_SYNC_V4_ENABLED) {
				return;
			}

			const snapshot =
				priorSnapshot ??
				buildSessionClaimsSnapshot(
					accessToken,
					authRef.current.user,
					empresaActivaIdRef.current,
				);

			const payload = {
				accessToken,
				claimsSnapshot: snapshot,
				empresaActivaId: empresaActivaIdRef.current,
			};

			switch (eventType) {
				case 'SESSION_LOGIN':
					emitSessionLoginSync({
						...payload,
						...(impersonationExitSource !== undefined
							? { impersonationExitSource }
							: {}),
					});
					break;
				case 'SESSION_REFRESHED':
					emitSessionRefreshedSync({
						...payload,
						...(refreshOutcome !== undefined ? { refreshOutcome } : {}),
					});
					break;
				case 'EMPRESA_CHANGED':
					emitEmpresaChangedSync(payload);
					break;
				default:
					break;
			}
		},
		[],
	);

	const terminateSessionDeps = useMemo(
		() =>
			getTerminateSessionDeps({
				isTerminatingRef,
				processQueue,
				clearLocalAuthState: performLocalAuthCleanup,
				getHadAuthenticatedUser: () => Boolean(authRef.current.token),
				callLogoutEndpoint: legacyLogoutDeps.callLogoutEndpoint,
				clearQueryCache: buildTerminationClearQueryCache(
					SESSION_TERMINATION_V2_ENABLED,
					() => queryClient.clear(),
				),
				showTerminationToast: SESSION_TERMINATION_V2_ENABLED
					? showTerminationToastAfterTermination
					: () => undefined,
				redirectToLogin: SESSION_TERMINATION_V2_ENABLED
					? redirectToLoginAfterTermination
					: () => undefined,
				emitTerminationEvent: composedTerminationEmitter,
			}),
		[
			processQueue,
			performLocalAuthCleanup,
			legacyLogoutDeps,
			queryClient,
			showTerminationToastAfterTermination,
			redirectToLoginAfterTermination,
			composedTerminationEmitter,
		],
	);

	const runTerminateSession = useCallback(
		async (input: TerminateSessionInput) => {
			if (!SESSION_TERMINATION_V2_ENABLED) {
				return;
			}
			await terminateSession(input, terminateSessionDeps);
		},
		[terminateSessionDeps],
	);

	/**
	 * Cierra todas las sesiones del usuario (logout_all + terminación local).
	 * Flag V3 OFF → no-op. Sin UI en IMPL-04.
	 */
	const logoutAllSessions = useCallback(async () => {
		if (!SESSION_LOGOUT_V3_ENABLED) {
			return;
		}

		if (!authRef.current.token) {
			return;
		}

		if (isImpersonationActive()) {
			toast.error('Finaliza el modo soporte antes de cerrar todas las sesiones.');
			return;
		}

		if (requiereSeleccionEmpresa) {
			toast.error('Completa la selección de empresa antes de continuar.');
			return;
		}

		if (isLogoutAllInFlightRef.current || isTerminatingRef.current) {
			return;
		}

		const flowInput: LogoutAllFlowInput = {
			preservePreLoginBranding: true,
		};

		isLogoutAllInFlightRef.current = true;
		try {
			await executeLogoutAllFlow(
				flowInput,
				getLogoutAllFlowDeps({
					isTerminatingRef,
					callLogoutAllEndpoint: callLogoutAllSessionsApi,
					runTerminateAfterLogoutAll: () =>
						executeLogoutAllTermination(
							runTerminateSession,
							legacyLogoutDeps,
							flowInput,
							redirectToLoginAfterTermination,
						),
					onLogoutAllRejected: (error) => {
						if (import.meta.env.DEV) {
							console.error('[logoutAll] POST /auth/logout_all/ rejected', error);
						}
					},
				}),
			);
		} finally {
			isLogoutAllInFlightRef.current = false;
		}
	}, [
		isImpersonationActive,
		requiereSeleccionEmpresa,
		runTerminateSession,
		legacyLogoutDeps,
		redirectToLoginAfterTermination,
	]);

	/**
	 * Probe de sesión vía authService.me — interceptor maneja 401/refresh/terminate.
	 * Sin mutación de estado en éxito. IMPL-06 conecta lifecycle DOM.
	 */
	const runSessionValidityProbeForSession = useCallback(async () => {
		try {
			await runSessionValidityProbe(
				getSessionValidityProbeDeps({
					isProbeInFlightRef: isSessionValidityProbeInFlightRef,
					fetchMe: () => authService.me(),
				}),
			);
			emitSessionProbeCompletedTelemetry({ result: 'ok' });
		} catch (error) {
			emitSessionProbeCompletedTelemetry({ result: 'error' });
			throw error;
		}
	}, []);

	/**
	 * Realiza el logout (local y servidor).
	 * Flag ON → terminateSession V2; Flag OFF → legacy (§21.2).
	 */
	const doLogout = useCallback(
		async (callServer = true) => {
			terminationCallerHintRef.current = 'manual_logout';
			try {
				await runSessionTerminationExit({
					v2Enabled: SESSION_TERMINATION_V2_ENABLED,
					legacyDeps: legacyLogoutDeps,
					legacyCallServer: callServer,
					v2Action: () => executeDoLogoutTermination(runTerminateSession, { callServer }),
				});
			} finally {
				terminationCallerHintRef.current = undefined;
			}
		},
		[runTerminateSession, legacyLogoutDeps],
	);

	/**
	 * Empresas elegibles para cambio de sesión (modelo congelado).
	 * Fuente primaria: GET /auth/me → empresas_disponibles (usuario_rol).
	 * Fallback tenant_admin: catálogo org tenant-wide.
	 * Fallback operativo: store selección login / GET org/empresa/{empresa_activa}.
	 */
	const loadEmpresasElegiblesForSession = useCallback(
		async (sessionUser: UserData): Promise<EmpresaOption[]> => {
			const type =
				sessionUser.user_type ??
				determineUserType(sessionUser.access_level ?? 0, !!sessionUser.is_super_admin);

			if (type === 'platform_admin') {
				return [];
			}

			const fromMe = normalizeEmpresasElegibles(sessionUser.empresas_disponibles);
			if (fromMe.length > 0) {
				return fromMe;
			}

			const fromSelection = normalizeEmpresasElegibles(
				useEmpresaSelectionStore.getState().empresasDisponibles,
			);
			if (fromSelection.length > 0) {
				return fromSelection;
			}

			if (type === 'tenant_admin') {
				try {
					const all = await empresaService.list({ solo_activos: true });
					return all.map(mapOrgEmpresaToOption);
				} catch {
					return [];
				}
			}

			const activaId = normalizeEmpresaId(sessionUser.empresa_activa);
			if (activaId) {
				try {
					const empresa = await empresaService.getById(activaId);
					const option = mapOrgEmpresaToOption(empresa);
					if (import.meta.env.DEV) {
						console.log('[AuthContext] loadEmpresasElegibles: getById operativo OK', {
							activaId,
							razon_social: option.razon_social,
						});
					}
					return [option];
				} catch (error) {
					if (import.meta.env.DEV) {
						console.warn(
							'[AuthContext] loadEmpresasElegibles: getById fallback operativo falló',
							{ activaId, error },
						);
					}
				}
			}

			return [];
		},
		[determineUserType],
	);

	const hydrateFetchMeErrorRef = useRef<unknown>(undefined);

	const terminateFromHydrateFailure = useMemo(
		() => async (callServer: boolean) => {
			await runSessionTerminationExit({
				v2Enabled: SESSION_TERMINATION_V2_ENABLED,
				legacyDeps: legacyLogoutDeps,
				legacyCallServer: callServer,
				v2Action: async () => {
					if (callServer) {
						await executeDoLogoutTermination(runTerminateSession, { callServer: true });
						return;
					}
					const error = hydrateFetchMeErrorRef.current;
					hydrateFetchMeErrorRef.current = undefined;
					await executeHydrateFailureTermination(runTerminateSession, error);
				},
			});
		},
		[runTerminateSession, legacyLogoutDeps],
	);

	const hydrateFetchMe = useCallback(
		() =>
			createHydrateFetchMeWithErrorCapture(
				() => authService.me(),
				hydrateFetchMeErrorRef,
			)(),
		[],
	);

	/**
	 * Obtiene el usuario desde /auth/me y actualiza el estado.
	 * El usuario SOLO proviene de /auth/me, nunca de la respuesta de login.
	 */
	const getHydrateSessionCoreDeps = useCallback(
		(menuUx?: LoadMenuUxOptions): HydrateSessionCoreDeps => ({
			getToken: () => authRef.current.token,
			getTokenUser: () => authRef.current.user,
			setAuthUser: (user) => {
				setAuth((prev) => ({ ...prev, user }));
				authRef.current = { ...authRef.current, user };
			},
			fetchMe: hydrateFetchMe,
			doLogout: terminateFromHydrateFailure,
			syncEmpresaSession,
			syncImpersonationFromToken,
			updateAccessLevels,
			loadMenuAndPermissionsFromAuthMenu: (userData) =>
				loadMenuAndPermissionsFromAuthMenu(userData, menuUx),
			loadEmpresasElegiblesForSession,
			determineUserType,
			setRequiereSeleccionEmpresa,
			setMenuModulos,
			setPermissions,
			setMenuPermissionsReady,
			setEmpresasElegibles,
			setAuthInitialized,
			setIsBootstrapped,
			setSessionMenuSnapshot: (modulos) => {
				sessionMenuSnapshotRef.current = modulos;
			},
		}),
		[
			terminateFromHydrateFailure,
			hydrateFetchMe,
			syncEmpresaSession,
			syncImpersonationFromToken,
			updateAccessLevels,
			loadMenuAndPermissionsFromAuthMenu,
			loadEmpresasElegiblesForSession,
			determineUserType,
		],
	);

	const runHydrateSessionCore = useCallback(
		async (
			mode: 'bootstrap' | 'interceptor' | 'full-session-token',
		): Promise<UserData | null> => {
			try {
				return await hydrateSessionCore(
					{ mode },
					getHydrateSessionCoreDeps(getLoadMenuUxOptionsForMode(mode)),
				);
			} catch (error) {
				await runSessionTerminationExit({
					v2Enabled: SESSION_TERMINATION_V2_ENABLED,
					legacyDeps: legacyLogoutDeps,
					legacyCallServer: false,
					v2Action: () => executeHydrateFailureTermination(runTerminateSession, error),
				});
				return null;
			}
		},
		[getHydrateSessionCoreDeps, runTerminateSession, legacyLogoutDeps],
	);

	const runPostRefreshSession = useCallback(
		async (newToken: string, priorSnapshot: SessionClaimsSnapshot) =>
			applyPostRefreshSession(
				{
					newToken,
					priorSnapshot,
					currentUser: authRef.current.user,
					mode: 'interceptor',
				},
				{
					swapAccessToken: (token) => {
						const newAuth = { ...authRef.current, token };
						if (!loadingRef.current) {
							setAuth(newAuth);
						}
						authRef.current = newAuth;
					},
					claimsSyncCallbacks: {
						syncEmpresaSession,
						syncImpersonationFromToken,
					},
					applyAuthUserAfterClaimsSync: (mergedUser, token) => {
						if (!mergedUser) {
							return;
						}
						const updated = {
							...authRef.current,
							token,
							user: mergedUser as UserData,
						};
						if (!loadingRef.current) {
							setAuth(updated);
						}
						authRef.current = updated;
					},
					hydrateDeps: getHydrateSessionCoreDeps(getLoadMenuUxOptionsForMode('interceptor')),
				},
			),
		[getHydrateSessionCoreDeps, syncEmpresaSession, syncImpersonationFromToken],
	);

	const initializeAuth = useCallback(async (): Promise<UserData | null> => {
		return runHydrateSessionCore('bootstrap');
	}, [runHydrateSessionCore]);

	/**
	 * Restaura la sesión platform_admin guardada antes de impersonar.
	 */
	const restorePlatformSession = useCallback(
		async (options?: { redirectToSuperAdmin?: boolean }) => {
			const parent = getPlatformParentSession();
			if (!parent?.accessToken?.trim()) {
				clearPlatformParentSession();
				clearImpersonationState();
				clearImpersonationSupportSession();
				await doLogout(false);
				if (options?.redirectToSuperAdmin) {
					window.location.assign('/super-admin/dashboard');
				}
				return;
			}

			if (import.meta.env.DEV) {
				console.log('[AuthContext] Restaurando sesión plataforma desde sessionStorage');
			}

			isRefreshingPromise = null;
			processQueue(new Error('Impersonation session ended'), null);

			queryClient.clear();
			useEmpresaSelectionStore.getState().clearPendingSelection();
			clearImpersonationState();
			clearImpersonationSupportSession();

			const restoredAuth = {
				token: parent.accessToken,
				user: parent.userData,
			};
			setAuth(restoredAuth);
			authRef.current = restoredAuth;
			clearPlatformParentSession();

			syncImpersonationFromToken(parent.accessToken);
			await initializeAuth();

			useBrandingStore.getState().clearAll(false);

			if (options?.redirectToSuperAdmin) {
				window.location.assign('/super-admin/dashboard');
			}
		},
		[
			queryClient,
			clearImpersonationState,
			syncImpersonationFromToken,
			processQueue,
			doLogout,
			initializeAuth,
		],
	);

	const getImpersonationExitDeps = useCallback((): ExecuteImpersonationControlledExitDeps => ({
		showToast: (message, severity) => {
			if (severity === 'error') {
				toast.error(message, { duration: 6000 });
				return;
			}
			toast(message, { duration: 6000 });
		},
		restorePlatformSession,
		emitPostRestoreAuthSync: emitImpersonationPostRestoreSync,
		getRestoredAccessToken: () => authRef.current.token,
		getCurrentUser: () => authRef.current.user,
		getEmpresaActivaId: () => empresaActivaIdRef.current,
		logDev: (message, extra) => {
			if (import.meta.env.DEV) {
				console.warn(message, extra);
			}
		},
	}), [restorePlatformSession]);

	const runImpersonationControlledExit = useCallback(
		async (input: {
			source: ImpersonationExitSource;
			redirectToSuperAdmin?: boolean;
			skipEndImpersonationApi?: boolean;
			includeEndImpersonationApi?: boolean;
		}) => {
			const deps = getImpersonationExitDeps();
			if (input.includeEndImpersonationApi) {
				deps.callEndImpersonationApi = async () => {
					const token = authRef.current.token;
					if (token && isImpersonationToken(token)) {
						await authService.endImpersonation(token);
					}
				};
			}
			await executeImpersonationControlledExit(
				{
					source: input.source,
					redirectToSuperAdmin: input.redirectToSuperAdmin,
					skipEndImpersonationApi: input.skipEndImpersonationApi,
				},
				deps,
			);
			emitSessionImpersonationExitFromSource({
				source: input.source,
				action: 'CONTROLLED_EXIT',
			});
			resetCorrelationId('impersonation_exit');
		},
		[getImpersonationExitDeps],
	);

	/**
	 * IM-06 follower: limpia sessionStorage impersonación tras SESSION_LOGIN parent (F4 wiring).
	 * Equivalente a la limpieza de restorePlatformSession — sin modificar módulos auth-sync.
	 */
	const applyInboundImpersonationExitStorageCleanup = useCallback(
		(accessToken: string) => {
			if (!hasPlatformParentSession()) {
				return;
			}
			if (isImpersonationToken(accessToken)) {
				return;
			}
			clearImpersonationState();
			clearImpersonationSupportSession();
			clearPlatformParentSession();
			syncImpersonationFromToken(accessToken);
		},
		[clearImpersonationState, syncImpersonationFromToken],
	);

	// ============================================================================
	// INTERCEPTORES
	// ============================================================================

	/**
	 * ✅ INTERCEPTOR DE REQUEST
	 * 
	 * ✅ FASE 2: Solo agrega tokens a las requests
	 * Ya no modifica baseURL para evitar race conditions.
	 * Los servicios deben usar useApi() o getApiInstance() para obtener la instancia correcta.
	 */
	useEffect(() => {
		if (import.meta.env.DEV) {
			console.log('🔧 [AuthContext] Registrando interceptor de request...');
		}
		const requestInterceptor = api.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				// Solo log detallado en desarrollo
				if (import.meta.env.DEV) {
					console.log(`📡 [Request] ${config.method?.toUpperCase()} ${config.url}`);
				}
				
				// Asegurar que headers existe
				if (!config.headers) {
					config.headers = {} as AxiosRequestHeaders;
				}
				const headers = config.headers as AxiosRequestHeaders;
				const currentToken = authRef.current.token;
				
				// ✅ FASE 2: Agregar token a la request
				// NOTA: Ya no modificamos baseURL aquí para evitar race conditions.
				// Los servicios deben usar useApi() o getApiInstance() para obtener la instancia correcta.
				const isPublic = isPublicEndpoint(config.url);
				const skipRefresh = skipsTokenRefresh(config.url);
				const explicitAuth = hasExplicitAuthorization(headers);
				
				// No pisar Authorization (p. ej. selection_token en otros flujos)
				if (explicitAuth) {
					config.headers = headers;
					return config;
				}
				
				// Solo agregar access ERP si hay token y no es público ni endpoint sin sesión ERP
				if (currentToken && !skipRefresh && !isPublic) {
					headers.Authorization = `Bearer ${currentToken}`;
					runLegacySessionDevLog(() => {
						console.log(`🔑 [Request] Token agregado para ${config.url}`);
					});
				} else if (!currentToken && !skipRefresh && !isPublic) {
					runLegacySessionDevLog(() => {
						console.warn(`⚠️ [Request] No hay token para ${config.url}`);
					});
				}
				
				// ✅ FASE 2: Ya no modificamos baseURL aquí
				// La instancia de Axios ya está configurada correctamente (central o local)
				// según el servicio que la use (useApi() selecciona la correcta)
				
				// Asegurar que los headers se asignen correctamente
				config.headers = headers;
				return config;
			},
			(error: AxiosError) => {
				console.error('❌ [Request Interceptor] Error:', error.message);
				return Promise.reject(error);
			}
		);
		
		if (import.meta.env.DEV) {
			console.log('✅ [AuthContext] Interceptor de request registrado');
		}
		
		return () => {
			if (import.meta.env.DEV) {
				console.log('🧹 [AuthContext] Desregistrando interceptor de request...');
			}
			api.interceptors.request.eject(requestInterceptor);
		};
	}, [skipsTokenRefresh, isPublicEndpoint]);

	/**
	 * ✅ INTERCEPTOR DE RESPONSE
	 */
	useEffect(() => {
		console.log('🔧 [AuthContext] Registrando interceptor de response...');
		const responseInterceptor = api.interceptors.response.use(
			(response: AxiosResponse) => {
				// Solo log en desarrollo para reducir ruido
				if (import.meta.env.DEV) {
					console.log(`✅ [Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
				}
				return response;
			},
			async (error: AxiosError) => {
				const originalRequest = error.config as (InternalAxiosRequestConfig & { 
					_retry?: boolean 
				}) | undefined;
				
				const status = error.response?.status;
				const url = originalRequest?.url || 'unknown';

				if (status === 403 && isPasswordChangeRequired(error)) {
					const requestUrl = originalRequest?.url ?? url;
					if (
						!shouldSkipPasswordChangeRedirect(requestUrl) &&
						!shouldBypassPasswordChangeEnforcement(
							authRef.current.token,
							authRef.current.user,
						)
					) {
						const currentUser = authRef.current.user;
						if (currentUser && !currentUser.requires_password_change) {
							const syncedUser: UserData = {
								...currentUser,
								requires_password_change: true,
							};
							const syncedAuth = {
								...authRef.current,
								user: syncedUser,
							};
							if (!loadingRef.current) {
								setAuth(syncedAuth);
							}
							authRef.current = syncedAuth;
						}
						if (
							typeof window !== 'undefined' &&
							!window.location.pathname.startsWith(APP_CHANGE_PASSWORD)
						) {
							if (import.meta.env.DEV) {
								console.warn(
									'[Response] 403 PASSWORD_CHANGE_REQUIRED → redirect',
									requestUrl,
								);
							}
							window.location.assign(APP_CHANGE_PASSWORD);
						}
					}
					return Promise.reject(error);
				}
				
				// Ignorar logs de errores esperados (401 en refresh, 404 en branding)
				if (status === 401 && url.includes('/auth/refresh')) {
					// Ya se maneja en auth.service.ts, no loguear aquí
					return Promise.reject(error);
				}
				
				if (!originalRequest || skipsTokenRefresh(originalRequest.url)) {
					if (import.meta.env.DEV) {
						console.log(`⏭️ [Response] Sin refresh automático: ${url}`);
					}
					return Promise.reject(error);
				}
				
				// Solo log errores no críticos en desarrollo
				if (import.meta.env.DEV) {
					console.log(`❌ [Response] ${status || 'Network'} - ${url}`);
				}

				// Modo soporte: salida controlada F6 antes de refresh plataforma / F5
				if (
					isImpersonationSupportMode(authRef.current.token) &&
					isImpersonationAuthErrorStatus(error.response?.status)
				) {
					const status = error.response?.status;
					const decision = resolveImpersonationExitPolicy({
						isSupportMode: true,
						context: 'interceptor',
						httpStatus: status,
					});

					if (decision.action === 'CONTROLLED_EXIT' && decision.source) {
						const redirectToSuperAdmin = shouldRedirectToSuperAdminAfterImpersonationExit(
							window.location.pathname,
							decision.source,
						);
						void runImpersonationControlledExit({
							source: decision.source,
							redirectToSuperAdmin,
							skipEndImpersonationApi: true,
						}).catch((exitError) => {
							if (import.meta.env.DEV) {
								console.error(
									'[Response] controlled exit impersonation falló',
									exitError,
								);
							}
						});
						return Promise.reject(error);
					}

					if (import.meta.env.DEV) {
						console.warn(
							'[Response] 401/403 en modo soporte — sin refresh plataforma (legacy reject)',
							originalRequest.url,
						);
					}
					return Promise.reject(error);
				}

				if (error.response?.status === 401 && !originalRequest._retry) {
					console.warn(`🚨 [Response Interceptor] 401 capturado en ${originalRequest.url}`);

					// Control de concurrencia
					if (isRefreshingPromise) {
						console.log('🔄 [Response Interceptor] Refresh en curso, encolando...');
						return new Promise<string>((resolve, reject) => {
							failedQueueRef.current.push({ resolve, reject });
						})
							.then(token => {
								// ✅ CORRECCIÓN: Asegurar que headers existe
								if (!originalRequest.headers) {
									originalRequest.headers = {} as AxiosRequestHeaders;
								}
								const headers = originalRequest.headers as AxiosRequestHeaders;
								headers.Authorization = `Bearer ${token}`;
								originalRequest.headers = headers;
								
								// ✅ FASE 2: Ya no modificamos baseURL aquí
								// La instancia ya está configurada correctamente
								
								originalRequest._retry = true;
							runLegacySessionDevLog(() => {
								console.log(`🔄 [Response Interceptor] Reintentando petición encolada con nuevo token: ${originalRequest.url}`);
							});
								return api(originalRequest);
							})
							.catch(err => {
								console.error('❌ [Response Interceptor] Error en cola:', err);
								return Promise.reject(err);
							});
					}

					originalRequest._retry = true;
					
					isRefreshingPromise = (async () => {
						try {
							runLegacySessionDevLog(() => {
								console.log('🔄 [Response Interceptor] Iniciando refresh...');
							});

							let priorSnapshot: SessionClaimsSnapshot | undefined;
							if (REFRESH_HYDRATE_ENABLED) {
								priorSnapshot = buildSessionClaimsSnapshot(
									authRef.current.token,
									authRef.current.user,
									empresaActivaIdRef.current,
								);
							}

							const refreshResult = await executeRefreshWithResilience(
								{ source: 'interceptor', singleFlightRole: 'leader' },
								{ callRefresh: () => authService.refreshToken() },
							);
							const newToken = refreshResult.accessToken;
							const refreshOutcome = refreshResult.metadata.outcome;

							emitSessionRefreshOutcomeTelemetry(
								refreshResult.metadata,
								newToken,
							);

							runLegacySessionDevLog(() => {
								console.log('✅ [Response Interceptor] Token refrescado');
							});

							if (REFRESH_HYDRATE_ENABLED && priorSnapshot) {
								const postRefreshResult = await runPostRefreshSession(
									newToken,
									priorSnapshot,
								);

								applyPostRefreshRqInvalidation(
									resolvePostRefreshRqAction(
										priorSnapshot,
										postRefreshResult.hydrationLevel,
										{
											empresaId: empresaActivaIdRef.current,
											clienteId: authRef.current.user?.cliente_id ?? null,
										},
									),
									queryClient,
								);

								emitAuthSyncSessionToken(
									'SESSION_REFRESHED',
									newToken,
									priorSnapshot,
									refreshOutcome,
								);
							} else {
								const refreshClaims = decodeAccessToken(newToken);
								const refreshedUser = authRef.current.user
									? {
											...authRef.current.user,
											requires_password_change: Boolean(
												refreshClaims?.requires_password_change,
											),
										}
									: authRef.current.user;
								const newAuth = {
									...authRef.current,
									token: newToken,
									user: refreshedUser,
								};

								if (!loadingRef.current) {
									setAuth(newAuth);
								}
								authRef.current = newAuth;

								emitAuthSyncSessionToken(
									'SESSION_REFRESHED',
									newToken,
									undefined,
									refreshOutcome,
								);
							}

							processQueue(null, newToken);

							return newToken;
						} catch (refreshError) {
							const axiosError = refreshError as AxiosError;
							console.error('❌ [Response Interceptor] Refresh falló:', axiosError.message);

							const failureOutcomeMetadata =
								getRefreshFailureOutcomeMetadata(refreshError);
							if (failureOutcomeMetadata) {
								emitSessionRefreshFailureOutcomeTelemetry(failureOutcomeMetadata);
								if (import.meta.env.DEV) {
									console.debug(
										'[Response Interceptor] Refresh failure outcome:',
										failureOutcomeMetadata,
									);
								}
							}

							terminationCallerHintRef.current = 'refresh_fail';
							try {
								await runSessionTerminationExit({
									v2Enabled: SESSION_TERMINATION_V2_ENABLED,
									legacyDeps: legacyLogoutDeps,
									legacyCallServer: false,
									v2Action: () =>
										executeInterceptorRefreshTermination(
											runTerminateSession,
											refreshError,
										),
								});

								throw refreshError;
							} finally {
								terminationCallerHintRef.current = undefined;
							}
						} finally {
							if (isRefreshingPromise !== null) {
								isRefreshingPromise = null;
							}
						}
					})();
					
					try {
						const newToken = await isRefreshingPromise;
						
						// ✅ CORRECCIÓN: Asegurar que headers existe antes de modificar
						if (!originalRequest.headers) {
							originalRequest.headers = {} as AxiosRequestHeaders;
						}
						const headers = originalRequest.headers as AxiosRequestHeaders;
						headers.Authorization = `Bearer ${newToken}`;
						originalRequest.headers = headers;
						
						// ✅ FASE 2: Ya no modificamos baseURL aquí
						// La instancia ya está configurada correctamente
						
					runLegacySessionDevLog(() => {
						console.log(`🔄 [Response Interceptor] Reintentando petición con nuevo token: ${originalRequest.url}`);
					});
						return api(originalRequest);
					} catch (e) {
						console.error('❌ [Response Interceptor] Error al reintentar petición:', e);
						return Promise.reject(error);
					}
				}

				// ✅ Corrección crítica: manejo global de 5xx y timeout
				showServerErrorToast(error);

				return Promise.reject(error);
			}
		);

		if (import.meta.env.DEV) {
			console.log('✅ [AuthContext] Interceptor de response registrado');
		}
		
		return () => {
			if (import.meta.env.DEV) {
				console.log('🧹 [AuthContext] Desregistrando interceptor de response...');
			}
			api.interceptors.response.eject(responseInterceptor);
		};
	}, [skipsTokenRefresh, runTerminateSession, legacyLogoutDeps, isImpersonationActive, restorePlatformSession, runPostRefreshSession, emitAuthSyncSessionToken, queryClient, runImpersonationControlledExit]);

	// ============================================================================
	// BOOTSTRAP - Usuario SOLO desde /auth/me
	// ============================================================================
	useEffect(() => {
		if (isInitializedRef.current) {
			return;
		}
		isInitializedRef.current = true;

		async function runBootstrap() {
			await waitForEmpresaSelectionHydration();

			logAuthContext('bootstrap START', {
				hasPlatformParentSession: hasPlatformParentSession(),
				hasPendingSelection: useEmpresaSelectionStore.getState().hasPendingSelection(),
			});
			trackSessionBootstrapCorrelation();

			if (window.location.pathname === '/login') {
				setLoading(false);
				setAuthInitialized(true);
				setIsBootstrapped(true);
				emitSessionBootstrapCompletedTelemetry({
					path: '/login',
					hydrateSkipped: true,
				});
				if (import.meta.env.DEV) {
					console.log('ℹ️ [Bootstrap] Ruta /login: omitiendo POST /auth/refresh');
				}
				return;
			}
			if (useEmpresaSelectionStore.getState().hasPendingSelection()) {
				setAuth(initialAuth);
				authRef.current = initialAuth;
				const pendingToken = useEmpresaSelectionStore.getState().selectionToken;
				syncImpersonationFromToken(pendingToken);
				setLoading(false);
				setAuthInitialized(true);
				setIsBootstrapped(true);
				if (import.meta.env.DEV) {
					console.log('ℹ️ [Bootstrap] Fase selección de empresa pendiente (sin /auth/me ni refresh)');
				}
				return;
			}
			if (hasPlatformParentSession()) {
				const supportToken = getImpersonationSupportAccessToken();
				const memToken = authRef.current.token;

				const redirectToSuperAdmin =
					window.location.pathname.startsWith('/app') ||
					window.location.pathname.startsWith('/admin');

				const controlledExitToPlatform = async (
					reason: 'expired' | 'invalid' | 'me_failed',
					extra?: Record<string, unknown>,
				) => {
					clearImpersonationSupportSession();
					logImpersonationFe('bootstrap-support-invalid', supportToken, {
						reason,
						...extra,
					});

					const decision = resolveImpersonationExitPolicy({
						isSupportMode: true,
						context: 'bootstrap',
						bootstrapReason: reason,
					});

					if (decision.action === 'CONTROLLED_EXIT' && decision.source) {
						await runImpersonationControlledExit({
							source: decision.source,
							redirectToSuperAdmin,
							skipEndImpersonationApi: true,
						});
						return;
					}

					toast.error(
						'Tu sesión de soporte expiró o ya no es válida. Retornando a Platform Admin…',
						{ duration: 6000 },
					);
					await restorePlatformSession({ redirectToSuperAdmin });
				};

				// Prioridad: rehidratar soporte desde sessionStorage (F5)
				if (supportToken?.trim()) {
					const claims = decodeAccessToken(supportToken);
					const expSeconds = typeof claims?.exp === 'number' ? claims.exp : null;
					const isExpired =
						expSeconds != null ? expSeconds * 1000 <= Date.now() : false;
					const isSupportToken = isImpersonationToken(supportToken);
					const canInit = canInitializeFullSession(supportToken);

					if (!isSupportToken || !canInit) {
						await controlledExitToPlatform('invalid', {
							is_impersonation: Boolean(claims?.is_impersonation),
							canInitializeFullSession: canInit,
						});
						setLoading(false);
						setAuthInitialized(true);
						setIsBootstrapped(true);
						return;
					}

					if (isExpired) {
						await controlledExitToPlatform('expired', { exp: expSeconds });
						setLoading(false);
						setAuthInitialized(true);
						setIsBootstrapped(true);
						return;
					}

					// Rehidratar token en memoria y validar obligatoriamente con /auth/me
					setAuth({ token: supportToken, user: null });
					authRef.current = { token: supportToken, user: null };
					syncImpersonationFromToken(supportToken);
					logImpersonationFe('bootstrap-support-rehydrate', supportToken, {
						validation: 'GET /auth/me',
					});

					try {
						const me = await initializeAuth();
						// Validación fuerte: debe seguir siendo impersonación real
						const isStillImpersonation = Boolean(
							decodeAccessToken(supportToken)?.is_impersonation,
						);
						const isTenantUser = me?.user_type !== 'platform_admin';
						if (!me || !isStillImpersonation || !isTenantUser) {
							await controlledExitToPlatform('me_failed', {
								meReceived: Boolean(me),
								me_user_type: me?.user_type ?? null,
								isStillImpersonation,
							});
							setLoading(false);
							setAuthInitialized(true);
							setIsBootstrapped(true);
							return;
						}
						if (import.meta.env.DEV) {
							console.log('✅ [Bootstrap] Soporte rehidratado desde sessionStorage (válido)');
						}
						setLoading(false);
						setAuthInitialized(true);
						setIsBootstrapped(true);
						return;
					} catch (e) {
						await controlledExitToPlatform('me_failed', {
							error: e instanceof Error ? e.message : String(e),
						});
						setLoading(false);
						setAuthInitialized(true);
						setIsBootstrapped(true);
						return;
					}
				}

				if (isImpersonationToken(memToken) && canInitializeFullSession(memToken)) {
					if (import.meta.env.DEV) {
						console.log(
							'ℹ️ [Bootstrap] Modo soporte activo en memoria — no restaurar parent',
						);
					}
					logImpersonationFe('bootstrap-skip-restore', memToken);
					try {
						const me = await initializeAuth();
						if (me && import.meta.env.DEV) {
						runLegacySessionDevLog(() => {
							console.log('✅ [Bootstrap] Sesión impersonada rehidratada desde token en memoria');
						});
						}
					} catch (e) {
						await controlledExitToPlatform('me_failed', {
							bootstrapPath: 'memory-rehydrate',
							error: e instanceof Error ? e.message : String(e),
						});
						setLoading(false);
						setAuthInitialized(true);
						setIsBootstrapped(true);
						return;
					}
					setLoading(false);
					setAuthInitialized(true);
					setIsBootstrapped(true);
					return;
				}
				if (!isImpersonationToken(memToken)) {
					if (import.meta.env.DEV) {
						console.log(
							'ℹ️ [Bootstrap] Sesión padre sin token impersonado en memoria; restaurando plataforma',
						);
					}
					await restorePlatformSession({ redirectToSuperAdmin });
					setLoading(false);
					setAuthInitialized(true);
					setIsBootstrapped(true);
					return;
				}
				if (import.meta.env.DEV) {
					console.log('ℹ️ [Bootstrap] Modo soporte — omitiendo refresh plataforma');
				}
				setLoading(false);
				setAuthInitialized(true);
				setIsBootstrapped(true);
				return;
			}
			try {
				console.log('🔍 [Bootstrap] Verificando sesión existente (POST /auth/refresh/)...');
				const refreshResult = await executeRefreshWithResilience(
					{ source: 'bootstrap', singleFlightRole: 'leader' },
					{ callRefresh: () => authService.refreshToken() },
				);
				const newToken = refreshResult.accessToken;
				const refreshOutcome = refreshResult.metadata.outcome;
				emitSessionRefreshOutcomeTelemetry(refreshResult.metadata, newToken);
				runLegacySessionDevLog(() => {
					console.log('✅ [Bootstrap] refresh OK');
				});
				logAuthSessionSnapshot('post-refresh (bootstrap OK)', newToken, null);
				if (isSelectionPendingToken(newToken)) {
					if (import.meta.env.DEV) {
						console.warn(
							'[Bootstrap] refresh devolvió selection token; no se llama /auth/me',
						);
					}
					await runSessionTerminationExit({
						v2Enabled: SESSION_TERMINATION_V2_ENABLED,
						legacyDeps: legacyLogoutDeps,
						legacyCallServer: false,
						v2Action: () =>
							executeClassifiedTermination(runTerminateSession, {
								classifyInput: { context: 'selection' },
								error: undefined,
								callServer: false,
								skipRedirect: false,
							}),
					});
					return;
				}

				// Solo guardar token; usuario vendrá de /auth/me
				setAuth({ token: newToken, user: null });
				authRef.current = { token: newToken, user: null };
				const me = await initializeAuth();
				if (me) {
					logAuthSessionDiag('Bootstrap perfil obtenido', {
						user_type: me.user_type,
					});
				}
				if (me) {
					emitAuthSyncSessionToken(
						'SESSION_REFRESHED',
						newToken,
						undefined,
						refreshOutcome,
					);
				}
			} catch (error) {
				const axiosError = error as AxiosError;
				const statusCode = axiosError.response?.status;
				const failureOutcomeMetadata = getRefreshFailureOutcomeMetadata(error);
				if (failureOutcomeMetadata) {
					emitSessionRefreshFailureOutcomeTelemetry(failureOutcomeMetadata);
					if (import.meta.env.DEV) {
						console.debug(
							'[Bootstrap] Refresh failure outcome:',
							failureOutcomeMetadata,
						);
					}
				}
				logAuthContext('bootstrap refresh FAILED → doLogout(false)', {
					status: statusCode,
					detail: (axiosError.response?.data as { detail?: string })?.detail,
					subdomain: typeof window !== 'undefined' ? window.location.hostname.split('.')[0] : null,
				});
				if (statusCode === 401 && import.meta.env.DEV) {
					console.warn(
						'[Bootstrap] refresh 401 — abrir Network: comparar login vs refresh (Cookie request header, Set-Cookie response). Ver docs/frontend/auditoria/PLATFORM_REFRESH_DIAGNOSTIC.md',
					);
					logAuthSessionSnapshot('bootstrap refresh FAILED (sin token nuevo)', null, null, statusCode);
				}
				document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
				terminationCallerHintRef.current = 'bootstrap_fail';
				try {
					await runSessionTerminationExit({
						v2Enabled: SESSION_TERMINATION_V2_ENABLED,
						legacyDeps: legacyLogoutDeps,
						legacyCallServer: false,
						v2Action: () => executeBootstrapRefreshTermination(runTerminateSession, error),
					});
				} finally {
					terminationCallerHintRef.current = undefined;
				}
			} finally {
				setLoading(false);
				setAuthInitialized(true);
				setIsBootstrapped(true);
				emitSessionBootstrapCompletedTelemetry({
					path: typeof window !== 'undefined' ? window.location.pathname : '',
				});
				console.log('🏁 [Bootstrap] Inicialización finalizada');
			}
		}

		runBootstrap();
	}, [runTerminateSession, legacyLogoutDeps, initializeAuth, restorePlatformSession, syncImpersonationFromToken, emitAuthSyncSessionToken, runImpersonationControlledExit]);

	// ============================================================================
	// FUNCIONES PÚBLICAS
	// ============================================================================

	const applyFullSessionToken = useCallback(
		async (response: Token): Promise<AuthLoginSession | null> => {
			logAuthSessionDiag('applyFullSessionToken inicio', {
				hasAccessToken: Boolean(response?.access_token),
				hasUserData: Boolean(response?.user_data),
			});
			if (!response?.access_token) {
				logAuthSessionDiag('applyFullSessionToken abort', { hasAccessToken: false });
				return null;
			}
			const claimsIncoming = decodeAccessToken(response.access_token);
			const canInit = canInitializeFullSession(response.access_token);
			logAuthSessionDiag('applyFullSessionToken token evaluado', {
				canInitializeFullSession: canInit,
				empresa_selection_pending: Boolean(claimsIncoming?.empresa_selection_pending),
				rawPendingClaim: Boolean(claimsIncoming?.empresa_selection_pending),
			});
			if (!canInit) {
				runLegacySessionDevLog(() => {
					console.error('❌ [AuthContext] access_token con empresa_selection_pending; no es sesión completa');
				});
				return null;
			}
			setMenuPermissionsReady(false);
			// Limpiar caché de la empresa anterior antes de hidratar la nueva sesión
			queryClient.clear();
			invalidateOrgQueries(queryClient);
			invalidateInvQueries(queryClient);
			const newAuth = { token: response.access_token, user: response.user_data ?? null };
			setAuth(newAuth);
			authRef.current = newAuth;
			setRequiereSeleccionEmpresa(false);
			syncImpersonationFromToken(response.access_token);
			if (isImpersonationToken(response.access_token)) {
				saveImpersonationSupportSession(response.access_token);
			} else {
				clearImpersonationSupportSession();
			}
			logImpersonationFe('applyFullSessionToken', response.access_token, {
				token_replaced: true,
			});
			const me = await initializeAuth();
			trackSessionLoginCorrelation();
			useEmpresaSelectionStore.getState().clearPendingSelection();
			emitSelectionSyncCleared();
			logAuthSessionSnapshot('post-login (applyFullSessionToken)', authRef.current.token, me);
			logAuthSessionDiag('applyFullSessionToken initializeAuth resultado', {
				meReceived: Boolean(me),
			});
			if (!me) return null;
			return { user: me, menuModulos: sessionMenuSnapshotRef.current };
		},
		[initializeAuth, queryClient, syncImpersonationFromToken],
	);

	/**
	 * Establece la autenticación después del login (Token completo).
	 */
	const setAuthFromLogin = useCallback(
		async (response: Token): Promise<AuthLoginSession | null> => {
			if (!response?.access_token) {
				console.error('❌ [Login] Respuesta inválida: falta access_token');
				setAuth(initialAuth);
				authRef.current = initialAuth;
				updateAccessLevels(null);
				return null;
			}
			const session = await applyFullSessionToken(response);
			if (session) {
				emitAuthSyncSessionToken('SESSION_LOGIN', response.access_token);
			}
			return session;
		},
		[updateAccessLevels, applyFullSessionToken, emitAuthSyncSessionToken],
	);

	const invalidateSelectionSession = useCallback(() => {
		useEmpresaSelectionStore.getState().clearPendingSelection();
		emitSelectionSyncCleared();
		setAuth(initialAuth);
		authRef.current = initialAuth;
		clearImpersonationSupportSession();
		document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
	}, []);

	const completeEmpresaSelection = useCallback(
		async (empresaId: string): Promise<UserData | null> => {
			const selectionToken = useEmpresaSelectionStore.getState().selectionToken;
			if (!selectionToken) return null;
			logImpersonationFe('completeEmpresaSelection-before', selectionToken, {
				empresa_id: empresaId,
			});
			try {
				const tokenResponse = await authService.seleccionarEmpresa(empresaId, selectionToken);
				logImpersonationFe('completeEmpresaSelection-response', tokenResponse.access_token, {
					empresa_id: empresaId,
				});
				const session = await applyFullSessionToken(tokenResponse);
				logImpersonationFe('completeEmpresaSelection-after', authRef.current.token, {
					user_type: session?.user.user_type,
					empresa_activa: session?.user.empresa_activa,
				});
				if (session && tokenResponse.access_token) {
					emitAuthSyncSessionToken('SESSION_LOGIN', tokenResponse.access_token);
				}
				return session?.user ?? null;
			} catch (error) {
				const axiosError = error as AxiosError;
				if (isSelectionSessionErrorStatus(axiosError.response?.status)) {
					if (isImpersonationToken(selectionToken)) {
						if (import.meta.env.DEV) {
							console.warn(
								'[completeEmpresaSelection] selección impersonada falló; saliendo modo soporte',
							);
						}
						const decision = resolveImpersonationExitPolicy({
							isSupportMode: true,
							context: 'selection_failed',
						});
						if (decision.action === 'CONTROLLED_EXIT' && decision.source) {
							await runImpersonationControlledExit({
								source: decision.source,
								redirectToSuperAdmin: true,
								skipEndImpersonationApi: true,
							});
							return null;
						}
						await restorePlatformSession({ redirectToSuperAdmin: true });
						return null;
					}
					invalidateSelectionSession();
				}
				throw error;
			}
		},
		[applyFullSessionToken, invalidateSelectionSession, restorePlatformSession, emitAuthSyncSessionToken, runImpersonationControlledExit],
	);

	const cambiarEmpresaActiva = useCallback(
		async (empresaId: string): Promise<UserData | null> => {
			if (isImpersonationSupportMode(authRef.current.token)) {
				const precheckDecision = resolveImpersonationExitPolicy({
					isSupportMode: true,
					context: 'cambiar_empresa_precheck',
				});
				if (
					precheckDecision.action === 'CONTROLLED_EXIT' &&
					precheckDecision.source
				) {
					const redirectToSuperAdmin = shouldRedirectToSuperAdminAfterImpersonationExit(
						window.location.pathname,
						precheckDecision.source,
					);
					await runImpersonationControlledExit({
						source: precheckDecision.source,
						redirectToSuperAdmin,
						skipEndImpersonationApi: true,
					});
					return null;
				}
			}

			try {
				const tokenResponse = await authService.cambiarEmpresa(empresaId);
				const session = await applyFullSessionToken(tokenResponse);
				if (session?.user && tokenResponse.access_token) {
					registerCambiarEmpresaL02Guard(empresaId);
					emitAuthSyncSessionToken('EMPRESA_CHANGED', tokenResponse.access_token);
				}
				return session?.user ?? null;
			} catch (error) {
				const axiosError = error as AxiosError;
				if (
					isImpersonationSupportMode(authRef.current.token) &&
					axiosError.response?.status === 403
				) {
					const forbiddenDecision = resolveImpersonationExitPolicy({
						isSupportMode: true,
						context: 'cambiar_empresa_forbidden',
						httpStatus: 403,
					});
					if (
						forbiddenDecision.action === 'CONTROLLED_EXIT' &&
						forbiddenDecision.source
					) {
						const redirectToSuperAdmin = shouldRedirectToSuperAdminAfterImpersonationExit(
							window.location.pathname,
							forbiddenDecision.source,
						);
						await runImpersonationControlledExit({
							source: forbiddenDecision.source,
							redirectToSuperAdmin,
							skipEndImpersonationApi: true,
						});
						return null;
					}
				}
				throw error;
			}
		},
		[applyFullSessionToken, emitAuthSyncSessionToken, runImpersonationControlledExit],
	);

	const reloadMenuAndPermissions = useCallback(async () => {
		const user = authRef.current.user;
		if (user) {
			await loadMenuAndPermissionsFromAuthMenu(user);
		}
	}, [loadMenuAndPermissionsFromAuthMenu]);

	const requiresPasswordChange = useMemo(() => {
		if (isImpersonation) {
			return false;
		}
		const effectiveType = userType;
		if (effectiveType === 'platform_admin') {
			return false;
		}
		if (isSuperAdmin && !isImpersonation) {
			return false;
		}
		if (Boolean(auth.user?.requires_password_change)) {
			return true;
		}
		if (
			hasPendingSelectionStore &&
			Boolean(selectionUserPreview?.requires_password_change)
		) {
			return true;
		}
		return false;
	}, [
		auth.user?.requires_password_change,
		hasPendingSelectionStore,
		selectionUserPreview?.requires_password_change,
		isImpersonation,
		isSuperAdmin,
		userType,
	]);

	const completePasswordChange = useCallback(
		async (payload: PasswordChangeRequest): Promise<AuthLoginSession | null> => {
			const sessionToken = authRef.current.token;
			const selectionToken = useEmpresaSelectionStore.getState().selectionToken;
			const bearer = sessionToken?.trim() || selectionToken?.trim();
			if (!bearer) {
				throw new Error('No hay sesión activa para cambiar la contraseña');
			}
			const tokenResponse = await authService.changePassword(payload, bearer);
			return applyFullSessionToken(tokenResponse);
		},
		[applyFullSessionToken],
	);

	const startImpersonationHandler = useCallback(
		async (
			clienteId: string,
			options?: { clienteLabel?: string },
		): Promise<{ requiresEmpresaSelection: boolean }> => {
			const current = authRef.current;
			if (!current.token?.trim() || !current.user) {
				throw new Error('Debe iniciar sesión como administrador de plataforma');
			}
			if (isImpersonationActive()) {
				throw new Error('Ya hay un modo soporte activo');
			}

			savePlatformParentSession({
				accessToken: current.token,
				userData: current.user,
				tenantContext: {
					tenantId: current.user.cliente_id ?? clienteInfo?.cliente_id ?? null,
					subdomain: clienteInfo?.subdominio ?? null,
					clienteInfo,
				},
			});

			if (options?.clienteLabel?.trim()) {
				setImpersonationClienteLabel(options.clienteLabel.trim());
			}

			const response: LoginResponse = await authService.startImpersonation(
				clienteId,
				current.token,
			);

			if (isLoginEmpresaSelectionResponse(response)) {
				useEmpresaSelectionStore.getState().setPendingSelection(response);
				emitSelectionSyncFromResponse(response);
				syncImpersonationFromToken(response.selection_token);
				setAuth(initialAuth);
				authRef.current = initialAuth;
				setRequiereSeleccionEmpresa(true);
				return { requiresEmpresaSelection: true };
			}

			const session = await applyFullSessionToken(response as Token);
			if (!session?.user) {
				clearPlatformParentSession();
				clearImpersonationState();
				throw new Error('No se pudo iniciar la sesión de soporte');
			}
			emitAuthSyncSessionToken('SESSION_LOGIN', (response as Token).access_token);
			return { requiresEmpresaSelection: false };
		},
		[
			clienteInfo,
			isImpersonationActive,
			syncImpersonationFromToken,
			applyFullSessionToken,
			clearImpersonationState,
			emitAuthSyncSessionToken,
		],
	);

	const endImpersonationHandler = useCallback(async () => {
		if (!isImpersonationActive() && !hasPlatformParentSession()) {
			return;
		}

		const decision = resolveImpersonationExitPolicy({
			isSupportMode:
				isImpersonationSupportMode(authRef.current.token) ||
				hasPlatformParentSession(),
			context: 'manual',
		});

		if (decision.action === 'CONTROLLED_EXIT' && decision.source) {
			await runImpersonationControlledExit({
				source: decision.source,
				includeEndImpersonationApi: true,
			});
			return;
		}

		try {
			const token = authRef.current.token;
			if (token && isImpersonationToken(token)) {
				await authService.endImpersonation(token);
			}
		} catch (error) {
			const axiosError = error as AxiosError;
			if (import.meta.env.DEV) {
				console.warn(
					'[endImpersonation] API falló; restaurando sesión local',
					axiosError.response?.status,
				);
			}
		}
		await restorePlatformSession();
	}, [isImpersonationActive, restorePlatformSession, runImpersonationControlledExit]);

	/**
	 * Cierra la sesión del usuario
	 */
	const logout = useCallback(async () => {
		if (isImpersonationActive() || hasPlatformParentSession()) {
			await endImpersonationHandler();
			return;
		}
		runLegacySessionDevLog(() => {
			console.log('🚪 [Logout] Cerrando sesión...');
		});
		await doLogout(true);
		runLegacySessionDevLog(() => {
			console.log('✅ [Logout] Sesión cerrada');
		});
	}, [doLogout, isImpersonationActive, endImpersonationHandler]);

	/**
	 * Verifica si el usuario tiene alguno de los roles especificados
	 */
	const hasRole = useCallback((...roles: string[]): boolean => {
		if (!authRef.current.user?.roles?.length) return false;
		
		// ✅ CORRECCIÓN: Convertir roles a string explícitamente
		const userRoles = new Set(
			authRef.current.user.roles.map((r: any) => {
				const roleStr = typeof r === 'string' ? r : String(r);
				return roleStr.toLowerCase();
			})
		);
		
		const getRoleSynonyms = (role: string): string[] => {
			const normalized = role.toLowerCase();
			if (normalized === 'admin' || normalized === 'super administrador') {
				return ['admin', 'super administrador'];
			}
			return [normalized];
		};
		
		return roles.some(role => 
			getRoleSynonyms(role).some(synonym => userRoles.has(synonym))
		);
	}, []);

	// ============================================================================
	// CONTEXT VALUE
	// ============================================================================
	const empresaFlowInput = useMemo(
		() => ({
			userType,
			empresaActivaId,
			esAdminCliente,
			requiereSeleccionEmpresa,
			empresasDisponiblesCount: empresasElegibles.length,
		}),
		[userType, empresaActivaId, esAdminCliente, requiereSeleccionEmpresa, empresasElegibles.length],
	);

	const canAccessErpFlag = useMemo(
		() => computeCanAccessErp(empresaFlowInput),
		[empresaFlowInput],
	);

	const mustSelectEmpresaFlag = useMemo(
		() => computeMustSelectEmpresa(empresaFlowInput),
		[empresaFlowInput],
	);

	const value = useMemo<AuthContextType>(
		() => ({
			auth,
			setAuthFromLogin,
			completeEmpresaSelection,
			cambiarEmpresaActiva,
			logout,
			logoutAllSessions,
			runSessionValidityProbe: runSessionValidityProbeForSession,
			isAuthenticated: !!auth.token && !!auth.user,
			loading,
			authInitialized,
			isBootstrapped,
			hasRole,
			accessLevel,
			isSuperAdmin,
			userType,
			clienteInfo,
			permissions,
			menuModulos,
			menuPermissionsReady,
			empresaActivaId,
			empresasElegibles,
			empresasDisponibles: empresasElegibles,
			requiereSeleccionEmpresa,
			esAdminCliente,
			hasEmpresaActivaFlag: hasEmpresaActiva(empresaActivaId),
			canAccessErp: canAccessErpFlag,
			mustSelectEmpresa: mustSelectEmpresaFlag,
			reloadMenuAndPermissions,
			isImpersonation,
			impersonatedBy,
			impersonatedByUsername,
			impersonationClienteLabel,
			startImpersonation: startImpersonationHandler,
			endImpersonation: endImpersonationHandler,
			requiresPasswordChange,
			completePasswordChange,
		}),
		[
			auth,
			loading,
			authInitialized,
			isBootstrapped,
			setAuthFromLogin,
			completeEmpresaSelection,
			cambiarEmpresaActiva,
			logout,
			logoutAllSessions,
			runSessionValidityProbeForSession,
			hasRole,
			accessLevel,
			isSuperAdmin,
			userType,
			clienteInfo,
			permissions,
			menuModulos,
			menuPermissionsReady,
			empresaActivaId,
			empresasElegibles,
			requiereSeleccionEmpresa,
			esAdminCliente,
			canAccessErpFlag,
			mustSelectEmpresaFlag,
			reloadMenuAndPermissions,
			isImpersonation,
			impersonatedBy,
			impersonatedByUsername,
			impersonationClienteLabel,
			startImpersonationHandler,
			endImpersonationHandler,
			requiresPasswordChange,
			completePasswordChange,
		],
	);

	const getAuthSyncListenerDeps = useCallback(
		(): ApplyInboundAuthSyncDeps => ({
			getCurrentAccessToken: () => authRef.current.token,
			getIsTerminating: () => isTerminatingRef.current,
			clearRefreshingPromise: () => {
				isRefreshingPromise = null;
			},
			buildPriorSnapshot: () =>
				buildSessionClaimsSnapshot(
					authRef.current.token,
					authRef.current.user,
					empresaActivaIdRef.current,
				),
			runPostRefreshFromSync: async (newToken, priorSnapshot) => {
				const postRefreshResult = await runPostRefreshSession(newToken, priorSnapshot);
				applyPostRefreshRqInvalidation(
					resolvePostRefreshRqAction(
						priorSnapshot,
						postRefreshResult.hydrationLevel,
						{
							empresaId: empresaActivaIdRef.current,
							clienteId: authRef.current.user?.cliente_id ?? null,
						},
					),
					queryClient,
				);
				applyInboundImpersonationExitStorageCleanup(newToken);
			},
			applyFullSessionFromSync: async (accessToken) => {
				const session = await applyFullSessionToken({
					access_token: accessToken,
					user_data: authRef.current.user ?? undefined,
				});
				if (session) {
					applyInboundImpersonationExitStorageCleanup(accessToken);
				}
				return Boolean(session);
			},
			runTerminateFromSync: async (input) => {
				const skipRedirect =
					typeof document !== 'undefined' && document.visibilityState !== 'visible';
				terminationCallerHintRef.current = 'auth_sync_follower';
				try {
					await runTerminateSession({
						reason: input.reason,
						callServer: false,
						skipRedirect,
						preservePreLoginBranding: input.preservePreLoginBranding,
					});
				} finally {
					terminationCallerHintRef.current = undefined;
				}
			},
			applySelectionFromSync: applySelectionSyncFromEnvelope,
			invalidateModulesAfterEmpresaChange: () => {
				invalidateOrgQueries(queryClient);
				invalidateInvQueries(queryClient);
			},
		}),
		[
			runPostRefreshSession,
			applyFullSessionToken,
			runTerminateSession,
			queryClient,
			applyInboundImpersonationExitStorageCleanup,
		],
	);

	return (
		<AuthContext.Provider value={value}>
			<AuthSyncListenerBinder
				enabled={SESSION_AUTH_SYNC_V4_ENABLED}
				getDeps={getAuthSyncListenerDeps}
			/>
			<SessionRemoteProbeBinder
				enabled={SESSION_REMOTE_PROBE_ENABLED}
				getRuntimeState={() => ({
					isAuthenticated: Boolean(authRef.current.token && authRef.current.user),
					isImpersonationActive: isImpersonationActive(),
					isSelectionPending: requiereSeleccionEmpresa,
					isTerminating: isTerminatingRef.current,
				})}
				runSessionValidityProbe={runSessionValidityProbeForSession}
			/>
			<SessionTelemetryAuthSyncEmittedBinder enabled={SESSION_TELEMETRY_V8_ENABLED} />
			<SessionTelemetryAuthSyncBinder enabled={SESSION_TELEMETRY_V8_ENABLED} />
			{children}
		</AuthContext.Provider>
	);
};

// ============================================================================
// HOOK
// ============================================================================
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
};

