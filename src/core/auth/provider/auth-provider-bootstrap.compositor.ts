/**
 * IAM-FE-PHASE-09 IMPL-07 — bootstrap copy-first (monolito L1507–1575, L2164–2464).
 */
import { useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import type {
	AuthProviderAuthState,
	AuthProviderBootstrapEffectDeps,
	AuthProviderBootstrapRuntime,
	AuthProviderEarlyRefs,
	AuthProviderLegacyLogoutDeps,
	AuthProviderSetters,
} from '@/core/auth/provider/auth-provider.types';
import {
	createHydrateFetchMeWithErrorCapture,
	executeBootstrapRefreshTermination,
	executeClassifiedTermination,
	executeHydrateFailureTermination,
	runSessionTerminationExit,
} from '@/core/auth/provider/auth-provider-termination.helpers';
import { authService } from '@/features/auth/services/auth.service';
import { waitForEmpresaSelectionHydration } from '@/features/auth/stores/empresa-selection-hydration';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import type { UserData } from '@/features/auth/types/auth.types';
import { logAuthContext } from '@/core/auth/utils/auth-debug';
import { logAuthSessionSnapshot } from '@/core/auth/utils/auth-session-snapshot';
import { logAuthSessionDiag, runLegacySessionDevLog } from '@/core/auth/utils/auth-session-log';
import { logImpersonationFe } from '@/core/auth/utils/impersonation-fe-log';
import { clearImpersonationSupportSession, getImpersonationSupportAccessToken } from '@/core/auth/utils/impersonation-support-session';
import { hasPlatformParentSession } from '@/core/auth/utils/platform-parent-session';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import { canInitializeFullSession } from '@/core/auth/utils/session-token';
import { hydrateSessionCore, type HydrateSessionCoreDeps } from '@/core/auth/session/session-refresh-hydrate';
import {
	getLoadMenuUxOptionsForMode,
	type LoadMenuUxOptions,
} from '@/core/auth/session/session-menu-ux';
import { SESSION_TERMINATION_V2_ENABLED } from '@/core/auth/session/session-termination.flags';
import { executeRefreshWithResilience, getRefreshFailureOutcomeMetadata } from '@/core/auth/session/session-refresh-resilience';
import { isSelectionPendingToken } from '@/core/auth/utils/session-token';
import {
	emitSessionBootstrapCompletedTelemetry,
	emitSessionRefreshFailureOutcomeTelemetry,
	emitSessionRefreshOutcomeTelemetry,
	trackSessionBootstrapCorrelation,
} from '@/core/auth/session/session-telemetry-auth-wiring';
import { resolveImpersonationExitPolicy } from '@/core/auth/session/session-impersonation-exit.policy';
import type { AuthProviderEmitAuthSyncSessionToken } from '@/core/auth/provider/auth-provider.types';
import type { AuthProviderImpersonationControlledExitInput } from '@/core/auth/provider/auth-provider.types';

export interface UseAuthProviderBootstrapHydrateParams {
	readonly hydrateFetchMeErrorRef: MutableRefObject<unknown>;
	readonly terminateFromHydrateFailure: (callServer: boolean) => Promise<void>;
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef' | 'sessionMenuSnapshotRef'>;
	readonly setters: Pick<
		AuthProviderSetters,
		| 'setAuth'
		| 'setRequiereSeleccionEmpresa'
		| 'setMenuModulos'
		| 'setPermissions'
		| 'setMenuPermissionsReady'
		| 'setEmpresasElegibles'
		| 'setAuthInitialized'
		| 'setIsBootstrapped'
	>;
	readonly syncEmpresaSession: (user: UserData | null, token: string | null) => void;
	readonly syncImpersonationFromToken: (token: string | null) => void;
	readonly updateAccessLevels: (user: UserData | null) => void;
	readonly loadMenuAndPermissionsFromAuthMenu: (
		user: UserData | null,
		uxOptions?: LoadMenuUxOptions,
	) => Promise<unknown>;
	readonly loadEmpresasElegiblesForSession: (user: UserData) => Promise<unknown>;
	readonly determineUserType: (level: number, isSuper: boolean) => string;
	readonly runTerminateSession: (input: unknown) => Promise<void>;
	readonly legacyLogoutDeps: AuthProviderLegacyLogoutDeps;
}

export interface UseAuthProviderBootstrapEffectParams extends AuthProviderBootstrapEffectDeps {
	readonly initialAuth: AuthProviderAuthState;
	readonly refs: Pick<
		AuthProviderEarlyRefs,
		'authRef' | 'isInitializedRef' | 'terminationCallerHintRef'
	>;
	readonly setters: Pick<
		AuthProviderSetters,
		'setAuth' | 'setLoading' | 'setAuthInitialized' | 'setIsBootstrapped'
	>;
}

export function useAuthProviderBootstrapHydrate(
	params: UseAuthProviderBootstrapHydrateParams,
): Pick<
	AuthProviderBootstrapRuntime,
	'initializeAuth' | 'runHydrateSessionCore' | 'hydrateFetchMe' | 'getHydrateSessionCoreDeps'
> {
	const {
		hydrateFetchMeErrorRef,
		terminateFromHydrateFailure,
		refs: { authRef, sessionMenuSnapshotRef },
		setters: {
			setAuth,
			setRequiereSeleccionEmpresa,
			setMenuModulos,
			setPermissions,
			setMenuPermissionsReady,
			setEmpresasElegibles,
			setAuthInitialized,
			setIsBootstrapped,
		},
		syncEmpresaSession,
		syncImpersonationFromToken,
		updateAccessLevels,
		loadMenuAndPermissionsFromAuthMenu,
		loadEmpresasElegiblesForSession,
		determineUserType,
		runTerminateSession,
		legacyLogoutDeps,
	} = params;

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

	const initializeAuth = useCallback(async (): Promise<UserData | null> => {
		return runHydrateSessionCore('bootstrap');
	}, [runHydrateSessionCore]);

	return {
		hydrateFetchMe,
		getHydrateSessionCoreDeps,
		runHydrateSessionCore,
		initializeAuth,
	};
}

export function useAuthProviderBootstrapEffect(
	params: UseAuthProviderBootstrapEffectParams,
): void {
	const {
		initialAuth,
		refs: { authRef, isInitializedRef, terminationCallerHintRef },
		setters: { setAuth, setLoading, setAuthInitialized, setIsBootstrapped },
		runTerminateSession,
		legacyLogoutDeps,
		initializeAuth,
		restorePlatformSession,
		syncImpersonationFromToken,
		emitAuthSyncSessionToken,
		runImpersonationControlledExit,
	} = params;

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
}
