/**
 * IAM-FE-PHASE-09 IMPL-11 — empresa runtime copy-first (monolito L876–1427, L2547).
 */
import { useCallback } from 'react';

import type {
	AuthProviderAuthState,
	AuthProviderEarlyRefs,
	AuthProviderEmpresaRuntime,
	AuthProviderPermissionsRuntime,
	AuthProviderSetters,
} from '@/core/auth/provider/auth-provider.types';
import { empresaService } from '@/features/org/services/org.service';
import type { EmpresaOption, UserData } from '@/features/auth/types/auth.types';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import {
	mapOrgEmpresaToOption,
	normalizeEmpresasElegibles,
	normalizeEmpresaId,
} from '@/core/auth/utils/empresa-eligibles';
import { emitSelectionSyncCleared } from '@/core/auth/session/session-auth-sync-selection';
import { clearImpersonationSupportSession } from '@/core/auth/utils/impersonation-support-session';

export interface UseAuthProviderEmpresaSessionSyncParams {
	readonly setters: Pick<
		AuthProviderSetters,
		'setEmpresaActivaId' | 'setRequiereSeleccionEmpresa' | 'setEsAdminCliente'
	>;
}

export function useAuthProviderEmpresaSessionSync(
	params: UseAuthProviderEmpresaSessionSyncParams,
): Pick<AuthProviderEmpresaRuntime, 'syncEmpresaSession'> {
	const {
		setters: { setEmpresaActivaId, setRequiereSeleccionEmpresa, setEsAdminCliente },
	} = params;

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

	return {
		syncEmpresaSession,
	};
}

export interface UseAuthProviderEmpresaElegiblesLoaderParams {
	readonly determineUserType: AuthProviderPermissionsRuntime['determineUserType'];
}

export function useAuthProviderEmpresaElegiblesLoader(
	params: UseAuthProviderEmpresaElegiblesLoaderParams,
): Pick<AuthProviderEmpresaRuntime, 'loadEmpresasElegiblesForSession'> {
	const { determineUserType } = params;

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

	return {
		loadEmpresasElegiblesForSession,
	};
}

export interface UseAuthProviderEmpresaInvalidateSelectionParams {
	readonly initialAuth: AuthProviderAuthState;
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef'>;
	readonly setters: Pick<AuthProviderSetters, 'setAuth'>;
}

export function useAuthProviderEmpresaInvalidateSelection(
	params: UseAuthProviderEmpresaInvalidateSelectionParams,
): Pick<AuthProviderEmpresaRuntime, 'invalidateSelectionSession'> {
	const {
		initialAuth,
		refs: { authRef },
		setters: { setAuth },
	} = params;

	const invalidateSelectionSession = useCallback(() => {
		useEmpresaSelectionStore.getState().clearPendingSelection();
		emitSelectionSyncCleared();
		setAuth(initialAuth);
		authRef.current = initialAuth;
		clearImpersonationSupportSession();
		document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
	}, []);

	return {
		invalidateSelectionSession,
	};
}
