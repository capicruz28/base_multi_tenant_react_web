/**
 * IAM-FE-PHASE-09 IMPL-08 — refresh wiring copy-first (monolito L661–682, L1075–1114).
 */
import { useCallback } from 'react';

import type {
	AuthProviderEarlyRefs,
	AuthProviderRefreshWiringRuntime,
	AuthProviderSetters,
} from '@/core/auth/provider/auth-provider.types';
import { shouldSkipTokenRefresh } from '@/core/api/auth-http.utils';
import { applyPostRefreshSession } from '@/core/auth/session/session-post-refresh';
import type { SessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import { getLoadMenuUxOptionsForMode, type LoadMenuUxOptions } from '@/core/auth/session/session-menu-ux';
import type { HydrateSessionCoreDeps } from '@/core/auth/session/session-refresh-hydrate';
import type { UserData } from '@/features/auth/types/auth.types';

export function useAuthProviderRefreshUrlPolicy(): Pick<
	AuthProviderRefreshWiringRuntime,
	'skipsTokenRefresh' | 'isPublicEndpoint'
> {
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

	return {
		skipsTokenRefresh,
		isPublicEndpoint,
	};
}

export interface UseAuthProviderRunPostRefreshSessionParams {
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef' | 'loadingRef'>;
	readonly setters: Pick<AuthProviderSetters, 'setAuth'>;
	readonly syncEmpresaSession: (user: UserData | null, token: string | null) => void;
	readonly syncImpersonationFromToken: (token: string | null) => void;
	readonly getHydrateSessionCoreDeps: (menuUx?: LoadMenuUxOptions) => HydrateSessionCoreDeps;
}

export function useAuthProviderRunPostRefreshSession(
	params: UseAuthProviderRunPostRefreshSessionParams,
): Pick<AuthProviderRefreshWiringRuntime, 'runPostRefreshSession'> {
	const {
		refs: { authRef, loadingRef },
		setters: { setAuth },
		syncEmpresaSession,
		syncImpersonationFromToken,
		getHydrateSessionCoreDeps,
	} = params;

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

	return {
		runPostRefreshSession,
	};
}
