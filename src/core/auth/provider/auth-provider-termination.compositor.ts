/**
 * IAM-FE-PHASE-09 IMPL-09 — termination runtime copy-first (monolito L1170–1404).
 */
import { useCallback, useMemo } from 'react';
import type { AxiosError } from 'axios';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import type {
	AuthProviderCleanupApi,
	AuthProviderEarlyRefs,
	AuthProviderTerminationRuntime,
} from '@/core/auth/provider/auth-provider.types';
import { clearRefreshingPromise } from '@/core/auth/provider/auth-provider-runtime.refs';
import {
	buildTerminationClearQueryCache,
	createAuthShowTerminationToast,
	createAuthTerminateRedirectToLogin,
	executeDoLogoutTermination,
	executeLogoutAllTermination,
	getLogoutAllFlowDeps,
	getSessionValidityProbeDeps,
	getTerminateSessionDeps,
	runSessionTerminationExit,
	runSessionValidityProbe,
	type LegacySessionLogoutDeps,
} from '@/core/auth/provider/auth-provider-termination.helpers';
import { authService } from '@/features/auth/services/auth.service';
import { logoutAllSessions as callLogoutAllSessionsApi } from '@/features/admin/services/session.service';
import { createAuthSyncTerminationEmitter } from '@/core/auth/session/session-auth-sync-emit';
import { createSessionUxTerminationWiring } from '@/core/auth/session/session-ux-auth-wiring';
import { SESSION_UX_V7_ENABLED } from '@/core/auth/session/session-ux.flags';
import { SESSION_LOGOUT_V3_ENABLED } from '@/core/auth/session/session-logout-v3.flags';
import {
	executeLogoutAllFlow,
	type LogoutAllFlowInput,
} from '@/core/auth/session/session-logout-all';
import {
	terminateSession,
	type TerminateSessionInput,
} from '@/core/auth/session/session-terminate';
import { SESSION_TERMINATION_V2_ENABLED } from '@/core/auth/session/session-termination.flags';
import {
	composeTerminationEventEmitters,
	createSessionTelemetryTerminationEmitter,
	emitSessionProbeCompletedTelemetry,
} from '@/core/auth/session/session-telemetry-auth-wiring';
import { resolveTerminationCaller } from '@/core/auth/session/session-telemetry-events.policy';

export interface UseAuthProviderTerminationRuntimeParams {
	readonly processQueue: AuthProviderCleanupApi['processQueue'];
	readonly performLocalAuthCleanup: AuthProviderCleanupApi['performLocalAuthCleanup'];
	readonly queryClient: QueryClient;
	readonly refs: Pick<
		AuthProviderEarlyRefs,
		| 'authRef'
		| 'isTerminatingRef'
		| 'terminationCallerHintRef'
		| 'isLogoutAllInFlightRef'
		| 'isSessionValidityProbeInFlightRef'
	>;
	readonly isImpersonationActive: () => boolean;
	readonly requiereSeleccionEmpresa: boolean;
}

export function useAuthProviderTerminationRuntime(
	params: UseAuthProviderTerminationRuntimeParams,
): AuthProviderTerminationRuntime {
	const {
		processQueue,
		performLocalAuthCleanup,
		queryClient,
		refs: {
			authRef,
			isTerminatingRef,
			terminationCallerHintRef,
			isLogoutAllInFlightRef,
			isSessionValidityProbeInFlightRef,
		},
		isImpersonationActive,
		requiereSeleccionEmpresa,
	} = params;

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
			clearRefreshingPromise,
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

	return {
		runTerminateSession,
		doLogout,
		logoutAllSessions,
		runSessionValidityProbeForSession,
		legacyLogoutDeps,
		redirectToLoginAfterTermination,
		showTerminationToastAfterTermination,
	};
}
