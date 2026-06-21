/**
 * IAM-FE-PHASE-09 IMPL-05 — helpers exportados pre-Provider (copy-first monolito L171–666).
 */
import type { AxiosError } from 'axios';
import type { UserData } from '@/features/auth/types/auth.types';
import type {
	ClassifySessionTerminationInput,
	SessionTerminationClassification,
} from '@/core/auth/session/session-termination-reason';
import { classifySessionTermination } from '@/core/auth/session/session-termination-reason';
import type { SessionTerminationUxProfile } from '@/core/auth/session/session-termination-ux';
import {
	type TerminateSessionDeps,
	type TerminateSessionInput,
} from '@/core/auth/session/session-terminate';
import { SESSION_TERMINATION_V2_ENABLED } from '@/core/auth/session/session-termination.flags';
import {
	type LogoutAllFlowDeps,
	type LogoutAllFlowInput,
} from '@/core/auth/session/session-logout-all';
import {
	applyL02GuardToRefreshClassifyInput,
	clearCambiarEmpresaL02Guard,
} from '@/core/auth/session/session-cambiar-empresa-l02';
import { clearRefreshingPromise as clearAuthRefreshingPromise } from './auth-provider-runtime.refs';
import { toast } from 'react-hot-toast';

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
			params.clearRefreshingPromise ?? clearAuthRefreshingPromise,
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