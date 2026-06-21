/**
 * IAM-FE-PHASE-09 IMPL-12 — public actions + context value (monolito L2471–2967).
 */
import { useCallback, useMemo } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import type {
	AuthProviderAuthState,
	AuthProviderBootstrapRuntime,
	AuthProviderContextValue,
	AuthProviderEarlyRefs,
	AuthProviderEmitAuthSyncSessionToken,
	AuthProviderImpersonationRuntime,
	AuthProviderPermissionsRuntime,
	AuthProviderSetters,
	AuthProviderState,
	AuthProviderTerminationRuntime,
} from '@/core/auth/provider/auth-provider.types';
import { useAuthProviderEmpresaInvalidateSelection } from '@/core/auth/provider/auth-provider-empresa.compositor';
import {
	useAuthProviderPermissionsHasRole,
	useAuthProviderPermissionsReloadMenu,
} from '@/core/auth/provider/auth-provider-permissions.compositor';
import { trackSessionLoginCorrelation } from '@/core/auth/provider/auth-provider-telemetry-ux.compositor';
import { authService } from '@/features/auth/services/auth.service';
import type {
	AuthLoginSession,
	PasswordChangeRequest,
	Token,
	UserData,
	LoginResponse,
} from '@/features/auth/types/auth.types';
import { isLoginEmpresaSelectionResponse } from '@/features/auth/types/auth.types';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { isSelectionSessionErrorStatus } from '@/core/api/auth-http.utils';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import {
	savePlatformParentSession,
	clearPlatformParentSession,
	hasPlatformParentSession,
} from '@/core/auth/utils/platform-parent-session';
import { canInitializeFullSession } from '@/core/auth/utils/session-token';
import { invalidateOrgQueries } from '@/features/org/utils/invalidate-org-queries';
import { invalidateInvQueries } from '@/features/inv/utils/invalidate-inv-queries';
import { logAuthSessionSnapshot } from '@/core/auth/utils/auth-session-snapshot';
import {
	logAuthSessionDiag,
	runLegacySessionDevLog,
} from '@/core/auth/utils/auth-session-log';
import { logImpersonationFe, isImpersonationSupportMode } from '@/core/auth/utils/impersonation-fe-log';
import {
	clearImpersonationSupportSession,
	saveImpersonationSupportSession,
} from '@/core/auth/utils/impersonation-support-session';
import {
	canAccessErp as computeCanAccessErp,
	mustSelectEmpresa as computeMustSelectEmpresa,
	hasEmpresaActiva,
} from '@/core/auth/utils/empresa-access';
import { emitSelectionSyncCleared, emitSelectionSyncFromResponse } from '@/core/auth/session/session-auth-sync-selection';
import {
	resolveImpersonationExitPolicy,
	shouldRedirectToSuperAdminAfterImpersonationExit,
} from '@/core/auth/session/session-impersonation-exit.policy';
import { registerCambiarEmpresaL02Guard } from '@/core/auth/session/session-cambiar-empresa-l02';

export interface UseAuthProviderPublicActionsParams {
	readonly initialAuth: AuthProviderAuthState;
	readonly queryClient: QueryClient;
	readonly state: AuthProviderState;
	readonly setters: Pick<
		AuthProviderSetters,
		| 'setAuth'
		| 'setMenuPermissionsReady'
		| 'setRequiereSeleccionEmpresa'
		| 'setImpersonationClienteLabel'
	>;
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef' | 'sessionMenuSnapshotRef'>;
	readonly initializeAuth: AuthProviderBootstrapRuntime['initializeAuth'];
	readonly updateAccessLevels: AuthProviderPermissionsRuntime['updateAccessLevels'];
	readonly loadMenuAndPermissionsFromAuthMenu: AuthProviderPermissionsRuntime['loadMenuAndPermissionsFromAuthMenu'];
	readonly syncImpersonationFromToken: AuthProviderImpersonationRuntime['syncImpersonationFromToken'];
	readonly clearImpersonationState: AuthProviderImpersonationRuntime['clearImpersonationState'];
	readonly isImpersonationActive: AuthProviderImpersonationRuntime['isImpersonationActive'];
	readonly restorePlatformSession: AuthProviderImpersonationRuntime['restorePlatformSession'];
	readonly runImpersonationControlledExit: AuthProviderImpersonationRuntime['runImpersonationControlledExit'];
	readonly doLogout: AuthProviderTerminationRuntime['doLogout'];
	readonly logoutAllSessions: AuthProviderTerminationRuntime['logoutAllSessions'];
	readonly runSessionValidityProbeForSession: AuthProviderTerminationRuntime['runSessionValidityProbeForSession'];
	readonly emitAuthSyncSessionToken: AuthProviderEmitAuthSyncSessionToken;
	readonly selectionUserPreview: UserData | null;
	readonly hasPendingSelectionStore: boolean;
}

export interface UseAuthProviderPublicActionsResult {
	readonly contextValue: AuthProviderContextValue;
	readonly applyFullSessionToken: (response: Token) => Promise<AuthLoginSession | null>;
}

export function useAuthProviderPublicActions(
	params: UseAuthProviderPublicActionsParams,
): UseAuthProviderPublicActionsResult {
	const {
		initialAuth,
		queryClient,
		state: {
			auth,
			loading,
			authInitialized,
			isBootstrapped,
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
			isImpersonation,
			impersonatedBy,
			impersonatedByUsername,
			impersonationClienteLabel,
		},
		setters: { setAuth, setMenuPermissionsReady, setRequiereSeleccionEmpresa, setImpersonationClienteLabel },
		refs: { authRef, sessionMenuSnapshotRef },
		initializeAuth,
		updateAccessLevels,
		loadMenuAndPermissionsFromAuthMenu,
		syncImpersonationFromToken,
		clearImpersonationState,
		isImpersonationActive,
		restorePlatformSession,
		runImpersonationControlledExit,
		doLogout,
		logoutAllSessions,
		runSessionValidityProbeForSession,
		emitAuthSyncSessionToken,
		selectionUserPreview,
		hasPendingSelectionStore,
	} = params;

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

	const { invalidateSelectionSession } = useAuthProviderEmpresaInvalidateSelection({
		initialAuth,
		refs: { authRef },
		setters: { setAuth },
	});

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

	const { reloadMenuAndPermissions } = useAuthProviderPermissionsReloadMenu({
		refs: { authRef },
		loadMenuAndPermissionsFromAuthMenu,
	});

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

	const { hasRole } = useAuthProviderPermissionsHasRole({
		refs: { authRef },
	});

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

	const contextValue = useMemo<AuthProviderContextValue>(
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

	return {
		contextValue,
		applyFullSessionToken,
	};
}
