/**
 * IAM-FE-PHASE-09 IMPL-06 — cleanup copy-first (monolito L680–716).
 */
import { useCallback } from 'react';

import type {
	AuthProviderAuthState,
	AuthProviderCleanupApi,
	AuthProviderEarlyRefs,
	AuthProviderSetters,
} from '@/core/auth/provider/auth-provider.types';
import { runLegacySessionDevLog } from '@/core/auth/utils/auth-session-log';
import {
	clearPlatformParentSession,
} from '@/core/auth/utils/platform-parent-session';
import { clearImpersonationSupportSession } from '@/core/auth/utils/impersonation-support-session';
import { useBrandingStore } from '@/features/tenant/stores/branding.store';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';

export interface UseAuthProviderCleanupParams {
	readonly initialAuth: AuthProviderAuthState;
	readonly setters: Pick<
		AuthProviderSetters,
		| 'setAuth'
		| 'setAccessLevel'
		| 'setIsSuperAdmin'
		| 'setUserType'
		| 'setClienteInfo'
		| 'setPermissions'
		| 'setMenuModulos'
		| 'setMenuPermissionsReady'
		| 'setEmpresaActivaId'
		| 'setEmpresasElegibles'
		| 'setRequiereSeleccionEmpresa'
		| 'setEsAdminCliente'
	>;
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef' | 'failedQueueRef'>;
	readonly clearImpersonationState: () => void;
}

export function useAuthProviderCleanup(
	params: UseAuthProviderCleanupParams,
): AuthProviderCleanupApi {
	const {
		initialAuth,
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
	} = params;

	/**
	 * Procesa la cola de peticiones fallidas después de un refresh exitoso
	 */
	const processQueue = useCallback((error: Error | null = null, token: string | null = null) => {
		failedQueueRef.current.forEach((promise) => {
			if (error) {
				promise.reject(error);
			} else if (token) {
				promise.resolve(token);
			}
		});
		failedQueueRef.current = [];
	}, [failedQueueRef]);

	const performLocalAuthCleanup = useCallback(
		(preservePreLoginBranding: boolean) => {
			runLegacySessionDevLog(() => {
				console.log('🚪 [Logout] Limpiando estado...');
			});

			document.cookie =
				'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

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
		},
		[clearImpersonationState],
	);

	return {
		processQueue,
		performLocalAuthCleanup,
	};
}
