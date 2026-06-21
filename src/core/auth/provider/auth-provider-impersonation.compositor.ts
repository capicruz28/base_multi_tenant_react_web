/**
 * IAM-FE-PHASE-09 IMPL-10 — impersonation runtime copy-first (monolito L849–1432).
 */
import { useCallback } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import type {
	AuthProviderBootstrapRuntime,
	AuthProviderCleanupApi,
	AuthProviderEarlyRefs,
	AuthProviderImpersonationRuntime,
	AuthProviderSetters,
	AuthProviderTerminationRuntime,
} from '@/core/auth/provider/auth-provider.types';
import { clearRefreshingPromise } from '@/core/auth/provider/auth-provider-runtime.refs';
import { authService } from '@/features/auth/services/auth.service';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { useBrandingStore } from '@/features/tenant/stores/branding.store';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import { clearImpersonationSupportSession } from '@/core/auth/utils/impersonation-support-session';
import {
	clearPlatformParentSession,
	getPlatformParentSession,
	hasPlatformParentSession,
} from '@/core/auth/utils/platform-parent-session';
import { emitImpersonationPostRestoreSync } from '@/core/auth/session/session-impersonation-auth-sync';
import {
	executeImpersonationControlledExit,
	type ExecuteImpersonationControlledExitDeps,
} from '@/core/auth/session/session-impersonation-exit';
import type { ImpersonationExitSource } from '@/core/auth/session/session-impersonation.types';
import {
	emitSessionImpersonationExitFromSource,
} from '@/core/auth/session/session-telemetry-auth-wiring';
import { resetCorrelationId } from '@/core/auth/session/session-telemetry-correlation';

export interface UseAuthProviderImpersonationEarlyRuntimeParams {
	readonly isImpersonation: boolean;
	readonly setters: Pick<
		AuthProviderSetters,
		| 'setIsImpersonation'
		| 'setImpersonatedBy'
		| 'setImpersonatedByUsername'
		| 'setImpersonationClienteLabel'
	>;
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef'>;
}

export function useAuthProviderImpersonationEarlyRuntime(
	params: UseAuthProviderImpersonationEarlyRuntimeParams,
): Pick<
	AuthProviderImpersonationRuntime,
	'clearImpersonationState' | 'syncImpersonationFromToken' | 'isImpersonationActive'
> {
	const {
		isImpersonation,
		setters: {
			setIsImpersonation,
			setImpersonatedBy,
			setImpersonatedByUsername,
			setImpersonationClienteLabel,
		},
		refs: { authRef },
	} = params;

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

	return {
		clearImpersonationState,
		syncImpersonationFromToken,
		isImpersonationActive,
	};
}

export interface UseAuthProviderImpersonationLateRuntimeParams {
	readonly clearImpersonationState: AuthProviderImpersonationRuntime['clearImpersonationState'];
	readonly syncImpersonationFromToken: AuthProviderImpersonationRuntime['syncImpersonationFromToken'];
	readonly queryClient: QueryClient;
	readonly processQueue: AuthProviderCleanupApi['processQueue'];
	readonly doLogout: AuthProviderTerminationRuntime['doLogout'];
	readonly initializeAuth: AuthProviderBootstrapRuntime['initializeAuth'];
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef' | 'empresaActivaIdRef'>;
	readonly setters: Pick<AuthProviderSetters, 'setAuth'>;
}

export function useAuthProviderImpersonationLateRuntime(
	params: UseAuthProviderImpersonationLateRuntimeParams,
): Pick<
	AuthProviderImpersonationRuntime,
	| 'restorePlatformSession'
	| 'runImpersonationControlledExit'
	| 'applyInboundImpersonationExitStorageCleanup'
> {
	const {
		clearImpersonationState,
		syncImpersonationFromToken,
		queryClient,
		processQueue,
		doLogout,
		initializeAuth,
		refs: { authRef, empresaActivaIdRef },
		setters: { setAuth },
	} = params;

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

			clearRefreshingPromise();
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

	return {
		restorePlatformSession,
		runImpersonationControlledExit,
		applyInboundImpersonationExitStorageCleanup,
	};
}
