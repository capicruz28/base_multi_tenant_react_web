/**
 * IAM-FE-PHASE-09 IMPL-12 — ensamblador único L9 (monolito AuthProvider body).
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type {
	AuthProviderContextValue,
	AuthProviderPhaseDBinderProps,
} from '@/core/auth/provider/auth-provider.types';
import {
	useAuthProviderAuthSyncListenerDeps,
	useAuthProviderEmitAuthSyncSessionToken,
} from '@/core/auth/provider/auth-provider-auth-sync.compositor';
import {
	useAuthProviderBootstrapEffect,
	useAuthProviderBootstrapHydrate,
} from '@/core/auth/provider/auth-provider-bootstrap.compositor';
import { useAuthProviderCleanup } from '@/core/auth/provider/auth-provider-cleanup';
import {
	useAuthProviderEmpresaElegiblesLoader,
	useAuthProviderEmpresaSessionSync,
} from '@/core/auth/provider/auth-provider-empresa.compositor';
import {
	useAuthProviderImpersonationEarlyRuntime,
	useAuthProviderImpersonationLateRuntime,
} from '@/core/auth/provider/auth-provider-impersonation.compositor';
import {
	useAuthProviderRequestInterceptorEffect,
	useAuthProviderResponseInterceptorEffect,
} from '@/core/auth/provider/auth-provider-interceptors.compositor';
import {
	useAuthProviderPermissionsDetermineUserType,
	useAuthProviderPermissionsMenuRuntime,
} from '@/core/auth/provider/auth-provider-permissions.compositor';
import { useAuthProviderPublicActions } from '@/core/auth/provider/auth-provider-public-actions';
import {
	useAuthProviderRefreshUrlPolicy,
	useAuthProviderRunPostRefreshSession,
} from '@/core/auth/provider/auth-provider-refresh.compositor';
import { AuthProviderPhaseDBinders } from '@/core/auth/provider/auth-provider-telemetry-ux.compositor';
import { useAuthProviderTerminationRuntime } from '@/core/auth/provider/auth-provider-termination.compositor';
import {
	AUTH_PROVIDER_INITIAL_AUTH,
	useAuthProviderState,
} from '@/core/auth/provider/auth-provider-state';
import {
	executeDoLogoutTermination,
	executeHydrateFailureTermination,
	runSessionTerminationExit,
} from '@/core/auth/provider/auth-provider-termination.helpers';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { SESSION_REMOTE_PROBE_ENABLED } from '@/core/auth/session/session-logout-v3.flags';
import { SESSION_AUTH_SYNC_V4_ENABLED } from '@/core/auth/session/session-auth-sync.flags';
import { SESSION_TELEMETRY_V8_ENABLED } from '@/core/auth/session/session-telemetry.flags';
import { SESSION_TERMINATION_V2_ENABLED } from '@/core/auth/session/session-termination.flags';

const initialAuth = AUTH_PROVIDER_INITIAL_AUTH;

export interface UseAuthProviderResult {
	readonly contextValue: AuthProviderContextValue;
	readonly renderProviderTree: (children: ReactNode) => ReactNode;
}

export function useAuthProvider(): UseAuthProviderResult {
	const queryClient = useQueryClient();
	const { state, setters, refs } = useAuthProviderState();

	const { requiereSeleccionEmpresa, isImpersonation } = state;

	const {
		setAuth,
		setLoading,
		setAuthInitialized,
		setIsBootstrapped,
		setAccessLevel,
		setIsSuperAdmin,
		setUserType,
		setClienteInfo,
		setPermissions,
		setMenuModulos,
		setMenuPermissionsReady,
		setEmpresaActivaId,
		setEmpresasElegibles,
		setRequiereSeleccionEmpresa,
		setEsAdminCliente,
		setIsImpersonation,
		setImpersonatedBy,
		setImpersonatedByUsername,
		setImpersonationClienteLabel,
	} = setters;

	const {
		authRef,
		loadingRef,
		empresaActivaIdRef,
		isInitializedRef,
		failedQueueRef,
		isTerminatingRef,
		isLogoutAllInFlightRef,
		isSessionValidityProbeInFlightRef,
		terminationCallerHintRef,
		sessionMenuSnapshotRef,
	} = refs;

	const selectionUserPreview = useEmpresaSelectionStore((s) => s.userPreview);
	const hasPendingSelectionStore = useEmpresaSelectionStore((s) => s.hasPendingSelection());

	useEffect(() => {
		console.log('🟢 [AuthContext] MOUNT');
		return () => {
			console.log('🔴 [AuthContext] UNMOUNT');
		};
	}, []);

	const { determineUserType } = useAuthProviderPermissionsDetermineUserType();

	const { clearImpersonationState, syncImpersonationFromToken, isImpersonationActive } =
		useAuthProviderImpersonationEarlyRuntime({
			isImpersonation,
			setters: {
				setIsImpersonation,
				setImpersonatedBy,
				setImpersonatedByUsername,
				setImpersonationClienteLabel,
			},
			refs: { authRef },
		});

	const { syncEmpresaSession } = useAuthProviderEmpresaSessionSync({
		setters: {
			setEmpresaActivaId,
			setRequiereSeleccionEmpresa,
			setEsAdminCliente,
		},
	});

	const { loadMenuAndPermissionsFromAuthMenu, updateAccessLevels } =
		useAuthProviderPermissionsMenuRuntime({
			determineUserType,
			syncEmpresaSession,
			clearImpersonationState,
			refs: { authRef },
			setters: {
				setAccessLevel,
				setIsSuperAdmin,
				setUserType,
				setClienteInfo,
				setPermissions,
				setMenuModulos,
				setMenuPermissionsReady,
				setEmpresaActivaId,
				setEmpresasElegibles,
				setRequiereSeleccionEmpresa,
				setEsAdminCliente,
			},
		});

	const { skipsTokenRefresh, isPublicEndpoint } = useAuthProviderRefreshUrlPolicy();

	const { processQueue, performLocalAuthCleanup } = useAuthProviderCleanup({
		initialAuth: AUTH_PROVIDER_INITIAL_AUTH,
		setters: {
			setAuth,
			setAccessLevel,
			setIsSuperAdmin,
			setUserType,
			setClienteInfo,
			setPermissions,
			setMenuModulos,
			setMenuPermissionsReady,
			setEmpresaActivaId,
			setEmpresasElegibles,
			setRequiereSeleccionEmpresa,
			setEsAdminCliente,
		},
		refs: { authRef, failedQueueRef },
		clearImpersonationState,
	});

	const {
		runTerminateSession,
		doLogout,
		logoutAllSessions,
		runSessionValidityProbeForSession,
		legacyLogoutDeps,
	} = useAuthProviderTerminationRuntime({
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
	});

	const { emitAuthSyncSessionToken } = useAuthProviderEmitAuthSyncSessionToken({
		refs: { authRef, empresaActivaIdRef },
	});

	const { loadEmpresasElegiblesForSession } = useAuthProviderEmpresaElegiblesLoader({
		determineUserType,
	});

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

	const { getHydrateSessionCoreDeps, initializeAuth } = useAuthProviderBootstrapHydrate({
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
	});

	const { runPostRefreshSession } = useAuthProviderRunPostRefreshSession({
		refs: { authRef, loadingRef },
		setters: { setAuth },
		syncEmpresaSession,
		syncImpersonationFromToken,
		getHydrateSessionCoreDeps,
	});

	const {
		restorePlatformSession,
		runImpersonationControlledExit,
		applyInboundImpersonationExitStorageCleanup,
	} = useAuthProviderImpersonationLateRuntime({
		clearImpersonationState,
		syncImpersonationFromToken,
		queryClient,
		processQueue,
		doLogout,
		initializeAuth,
		refs: { authRef, empresaActivaIdRef },
		setters: { setAuth },
	});

	useAuthProviderRequestInterceptorEffect({
		skipsTokenRefresh,
		isPublicEndpoint,
		refs: { authRef },
	});

	useAuthProviderResponseInterceptorEffect({
		skipsTokenRefresh,
		runTerminateSession,
		legacyLogoutDeps,
		isImpersonationActive,
		restorePlatformSession,
		runPostRefreshSession,
		emitAuthSyncSessionToken,
		queryClient,
		runImpersonationControlledExit,
		refs: {
			authRef,
			loadingRef,
			failedQueueRef,
			empresaActivaIdRef,
			terminationCallerHintRef,
		},
		setters: { setAuth },
		processQueue,
	});

	useAuthProviderBootstrapEffect({
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
	});

	const { contextValue, applyFullSessionToken } = useAuthProviderPublicActions({
		initialAuth,
		queryClient,
		state,
		setters: {
			setAuth,
			setMenuPermissionsReady,
			setRequiereSeleccionEmpresa,
			setImpersonationClienteLabel,
		},
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
	});

	const { getAuthSyncListenerDeps } = useAuthProviderAuthSyncListenerDeps({
		refs: { authRef, empresaActivaIdRef, isTerminatingRef, terminationCallerHintRef },
		queryClient,
		runPostRefreshSession,
		applyFullSessionToken,
		runTerminateSession,
		applyInboundImpersonationExitStorageCleanup,
	});

	const binders = useMemo<AuthProviderPhaseDBinderProps>(
		() => ({
			authSyncListener: {
				enabled: SESSION_AUTH_SYNC_V4_ENABLED,
				getDeps: getAuthSyncListenerDeps,
			},
			remoteProbe: {
				enabled: SESSION_REMOTE_PROBE_ENABLED,
				getRuntimeState: () => ({
					isAuthenticated: Boolean(authRef.current.token && authRef.current.user),
					isImpersonationActive: isImpersonationActive(),
					isSelectionPending: requiereSeleccionEmpresa,
					isTerminating: isTerminatingRef.current,
				}),
				runSessionValidityProbe: runSessionValidityProbeForSession,
			},
			telemetryAuthSyncEmitted: { enabled: SESSION_TELEMETRY_V8_ENABLED },
			telemetryAuthSync: { enabled: SESSION_TELEMETRY_V8_ENABLED },
		}),
		[
			getAuthSyncListenerDeps,
			isImpersonationActive,
			requiereSeleccionEmpresa,
			runSessionValidityProbeForSession,
		],
	);

	const renderProviderTree = (children: ReactNode): ReactNode =>
		AuthProviderPhaseDBinders({ binders, children });

	return {
		contextValue,
		renderProviderTree,
	};
}
