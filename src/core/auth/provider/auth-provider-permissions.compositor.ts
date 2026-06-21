/**
 * IAM-FE-PHASE-09 IMPL-11 — permissions runtime copy-first (monolito L843–1450, L2843).
 */
import { useCallback } from 'react';
import type { AxiosError } from 'axios';

import type {
	AuthProviderEarlyRefs,
	AuthProviderImpersonationRuntime,
	AuthProviderPermissionsRuntime,
	AuthProviderSetters,
} from '@/core/auth/provider/auth-provider.types';
import { menuService } from '@/features/admin/services/menu.service';
import type { UserData } from '@/features/auth/types/auth.types';
import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import type { UserPermissions } from '@/core/auth/types/permission.types';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import { hasEmpresaActiva } from '@/core/auth/utils/empresa-access';
import { indexRoutePermissionsFromMenu } from '@/core/auth/utils/index-route-permissions-from-menu';
import { type LoadMenuUxOptions } from '@/core/auth/session/session-menu-ux';
import { useBrandingStore } from '@/features/tenant/stores/branding.store';

export function useAuthProviderPermissionsDetermineUserType(): Pick<
	AuthProviderPermissionsRuntime,
	'determineUserType'
> {
	/**
	 * ✅ CORREGIDO: Determina el tipo de usuario basado en nivel de acceso
	 */
	const determineUserType = useCallback((level: number, isSuper: boolean): string => {
		if (isSuper) return 'super_admin';
		if (level >= 4) return 'tenant_admin';
		return 'user';
	}, []);

	return {
		determineUserType,
	};
}

export interface UseAuthProviderPermissionsMenuRuntimeParams {
	readonly determineUserType: AuthProviderPermissionsRuntime['determineUserType'];
	readonly syncEmpresaSession: (user: UserData | null, token: string | null) => void;
	readonly clearImpersonationState: AuthProviderImpersonationRuntime['clearImpersonationState'];
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef'>;
	readonly setters: Pick<
		AuthProviderSetters,
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
}

export function useAuthProviderPermissionsMenuRuntime(
	params: UseAuthProviderPermissionsMenuRuntimeParams,
): Pick<
	AuthProviderPermissionsRuntime,
	| 'shouldSkipErpMenuLoad'
	| 'buildRoutePermissionsFromMenu'
	| 'loadMenuAndPermissionsFromAuthMenu'
	| 'updateAccessLevels'
> {
	const {
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
	} = params;

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

	return {
		shouldSkipErpMenuLoad,
		buildRoutePermissionsFromMenu,
		loadMenuAndPermissionsFromAuthMenu,
		updateAccessLevels,
	};
}

export interface UseAuthProviderPermissionsPublicRuntimeParams {
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef'>;
	readonly loadMenuAndPermissionsFromAuthMenu: AuthProviderPermissionsRuntime['loadMenuAndPermissionsFromAuthMenu'];
}

export function useAuthProviderPermissionsReloadMenu(
	params: UseAuthProviderPermissionsPublicRuntimeParams,
): Pick<AuthProviderPermissionsRuntime, 'reloadMenuAndPermissions'> {
	const {
		refs: { authRef },
		loadMenuAndPermissionsFromAuthMenu,
	} = params;

	const reloadMenuAndPermissions = useCallback(async () => {
		const user = authRef.current.user;
		if (user) {
			await loadMenuAndPermissionsFromAuthMenu(user);
		}
	}, [loadMenuAndPermissionsFromAuthMenu]);

	return {
		reloadMenuAndPermissions,
	};
}

export function useAuthProviderPermissionsHasRole(
	params: Pick<UseAuthProviderPermissionsPublicRuntimeParams, 'refs'>,
): Pick<AuthProviderPermissionsRuntime, 'hasRole'> {
	const {
		refs: { authRef },
	} = params;

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

	return {
		hasRole,
	};
}
