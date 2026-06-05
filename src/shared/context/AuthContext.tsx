// src/shared/context/AuthContext.tsx
import React, { 
	createContext, 
	useContext, 
	useEffect, 
	useMemo, 
	useState, 
	useRef, 
	ReactNode,
	useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../core/api/api';
import { authService } from '../../features/auth/services/auth.service';
import type {
	AxiosResponse,
	AxiosError,
	InternalAxiosRequestConfig,
	AxiosRequestHeaders,
} from 'axios';
import type {
	Token,
	UserData,
	ClienteInfo,
	EmpresaOption,
	LoginResponse,
	AuthLoginSession,
} from '../../features/auth/types/auth.types';
import { isLoginEmpresaSelectionResponse } from '../../features/auth/types/auth.types';
import { useBrandingStore } from '../../features/tenant/stores/branding.store';
import type { UserPermissions } from '../../core/auth/types/permission.types';
import type { AuthMenuModulo } from '../../core/auth/types/auth-menu.types';
import { menuService } from '../../features/admin/services/menu.service';
import { empresaService } from '../../features/org/services/org.service';
import { showServerErrorToast } from '../../core/api/axios-instances';
import {
	hasExplicitAuthorization,
	shouldSkipTokenRefresh,
	isSelectionSessionErrorStatus,
	isImpersonationAuthErrorStatus,
} from '@/core/api/auth-http.utils';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import {
	savePlatformParentSession,
	getPlatformParentSession,
	clearPlatformParentSession,
	hasPlatformParentSession,
} from '@/core/auth/utils/platform-parent-session';
import { canInitializeFullSession, isSelectionPendingToken } from '@/core/auth/utils/session-token';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { invalidateOrgQueries } from '@/features/org/utils/invalidate-org-queries';
import { invalidateInvQueries } from '@/features/inv/utils/invalidate-inv-queries';
import { waitForEmpresaSelectionHydration } from '@/features/auth/stores/empresa-selection-hydration';
import { logAuthContext } from '@/core/auth/utils/auth-debug';
import { logAuthSessionSnapshot } from '@/core/auth/utils/auth-session-snapshot';
import {
	logImpersonationFe,
	isImpersonationSupportMode,
} from '@/core/auth/utils/impersonation-fe-log';
import {
	clearImpersonationSupportSession,
	getImpersonationSupportAccessToken,
	saveImpersonationSupportSession,
} from '@/core/auth/utils/impersonation-support-session';
import {
	canAccessErp as computeCanAccessErp,
	mustSelectEmpresa as computeMustSelectEmpresa,
	hasEmpresaActiva,
} from '@/core/auth/utils/empresa-access';
import {
	mapOrgEmpresaToOption,
	normalizeEmpresasElegibles,
	normalizeEmpresaId,
} from '@/core/auth/utils/empresa-eligibles';
import { indexRoutePermissionsFromMenu } from '@/core/auth/utils/index-route-permissions-from-menu';
import { toast } from 'react-hot-toast';

// ============================================================================
// BLOQUEO DE CONCURRENCIA GLOBAL (CRÍTICO)
// ============================================================================
type RefreshPromise = Promise<string> | null;
let isRefreshingPromise: RefreshPromise = null;

// ============================================================================
// TIPOS
// ============================================================================
type AuthState = { 
	user: UserData | null; 
	token: string | null;
};

interface AuthContextType {
	auth: AuthState;
	setAuthFromLogin: (response: Token) => Promise<AuthLoginSession | null>;
	completeEmpresaSelection: (empresaId: string) => Promise<UserData | null>;
	cambiarEmpresaActiva: (empresaId: string) => Promise<UserData | null>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
	loading: boolean;
	authInitialized: boolean;
	isBootstrapped: boolean;
	hasRole: (...roles: string[]) => boolean;
	accessLevel: number;
	isSuperAdmin: boolean;
	userType: string;
	clienteInfo: ClienteInfo | null;
	permissions: UserPermissions | null;
	menuModulos: AuthMenuModulo[] | null;
	/** true cuando GET /auth/menu terminó y permisos de ruta están listos para PermissionGuard */
	menuPermissionsReady: boolean;
	empresaActivaId: string | null;
	empresasElegibles: EmpresaOption[];
	/** @deprecated Alias de empresasElegibles */
	empresasDisponibles: EmpresaOption[];
	requiereSeleccionEmpresa: boolean;
	esAdminCliente: boolean;
	hasEmpresaActivaFlag: boolean;
	canAccessErp: boolean;
	mustSelectEmpresa: boolean;
	reloadMenuAndPermissions: () => Promise<void>;
	isImpersonation: boolean;
	impersonatedBy: string | null;
	impersonatedByUsername: string | null;
	impersonationClienteLabel: string | null;
	startImpersonation: (
		clienteId: string,
		options?: { clienteLabel?: string },
	) => Promise<{ requiresEmpresaSelection: boolean }>;
	endImpersonation: () => Promise<void>;
}

// ============================================================================
// CONSTANTES
// ============================================================================
const initialAuth: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextType>({
	auth: initialAuth,
	setAuthFromLogin: async () => null as AuthLoginSession | null,
	completeEmpresaSelection: async () => null,
	cambiarEmpresaActiva: async () => null,
	logout: async () => {},
	isAuthenticated: false,
	loading: true,
	authInitialized: false,
	isBootstrapped: false,
	hasRole: () => false,
	accessLevel: 0,
	isSuperAdmin: false,
	userType: 'user',
	clienteInfo: null,
	permissions: null,
	menuModulos: null,
	menuPermissionsReady: false,
	empresaActivaId: null,
	empresasElegibles: [],
	empresasDisponibles: [],
	requiereSeleccionEmpresa: false,
	esAdminCliente: false,
	hasEmpresaActivaFlag: false,
	canAccessErp: false,
	mustSelectEmpresa: false,
	reloadMenuAndPermissions: async () => {},
	isImpersonation: false,
	impersonatedBy: null,
	impersonatedByUsername: null,
	impersonationClienteLabel: null,
	startImpersonation: async () => ({ requiresEmpresaSelection: false }),
	endImpersonation: async () => {},
});

// ============================================================================
// PROVIDER
// ============================================================================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const queryClient = useQueryClient();
	const [auth, setAuth] = useState<AuthState>(initialAuth);
	const [loading, setLoading] = useState(true);
	const [authInitialized, setAuthInitialized] = useState(false);
	const [isBootstrapped, setIsBootstrapped] = useState(false);
	
	// ✅ Estados para información de niveles de acceso
	const [accessLevel, setAccessLevel] = useState<number>(0);
	const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
	const [userType, setUserType] = useState<string>('user');
	const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
	// ✅ Estado para permisos granulares (derivados desde /auth/menu)
	const [permissions, setPermissions] = useState<UserPermissions | null>(null);
	// ✅ Estado para menú del usuario (desde GET /auth/menu)
	const [menuModulos, setMenuModulos] = useState<AuthMenuModulo[] | null>(null);
	const [menuPermissionsReady, setMenuPermissionsReady] = useState(false);
	const sessionMenuSnapshotRef = useRef<AuthMenuModulo[] | null>(null);
	const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(null);
	const [empresasElegibles, setEmpresasElegibles] = useState<EmpresaOption[]>([]);
	const [requiereSeleccionEmpresa, setRequiereSeleccionEmpresa] = useState(false);
	const [esAdminCliente, setEsAdminCliente] = useState(false);
	const [isImpersonation, setIsImpersonation] = useState(false);
	const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null);
	const [impersonatedByUsername, setImpersonatedByUsername] = useState<string | null>(null);
	const [impersonationClienteLabel, setImpersonationClienteLabel] = useState<string | null>(null);

	// Refs para acceder al estado más reciente sin re-renders
	const authRef = useRef(auth);
	const loadingRef = useRef(loading);
	const isInitializedRef = useRef(false);
	
	const failedQueueRef = useRef<Array<{
		resolve: (value: string) => void;
		reject: (reason?: Error) => void;
	}>>([]);

	// Sincronizar refs
	useEffect(() => {
		authRef.current = auth;
	}, [auth]);

	useEffect(() => {
		loadingRef.current = loading;
	}, [loading]);

	// Logs temporales: mount/unmount para diagnosticar reinicialización
	useEffect(() => {
		console.log('🟢 [AuthContext] MOUNT');
		return () => {
			console.log('🔴 [AuthContext] UNMOUNT');
		};
	}, []);

	// ============================================================================
	// HELPERS
	// ============================================================================

	/**
	 * ✅ CORREGIDO: Determina el tipo de usuario basado en nivel de acceso
	 */
	const determineUserType = useCallback((level: number, isSuper: boolean): string => {
		if (isSuper) return 'super_admin';
		if (level >= 4) return 'tenant_admin';
		return 'user';
	}, []);

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

	const shouldSkipErpMenuLoad = useCallback(
		(userData: UserData | null, token: string | null): boolean => {
			const claims = decodeAccessToken(token);
			if (claims?.empresa_selection_pending) {
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
	): Promise<AuthMenuModulo[] | null> => {
		if (!userData) {
			setPermissions(null);
			setMenuModulos(null);
			setMenuPermissionsReady(false);
			return null;
		}

		setMenuPermissionsReady(false);

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

	/** Login, refresh y selección de empresa: sin refresh automático ni retry ERP. */
	const skipsTokenRefresh = useCallback((url?: string): boolean => {
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

	/**
	 * Procesa la cola de peticiones fallidas después de un refresh exitoso
	 */
	const processQueue = useCallback((error: Error | null = null, token: string | null = null) => {
		failedQueueRef.current.forEach(promise => {
			if (error) {
				promise.reject(error);
			} else if (token) {
				promise.resolve(token);
			}
		});
		failedQueueRef.current = [];
	}, []);

	/**
	 * Realiza el logout (local y servidor)
	 */
	const doLogout = useCallback(async (callServer = true) => {
		try {
			if (callServer) {
				await authService.logout();
			}
		} catch (error) {
			const axiosError = error as AxiosError;
			console.error('❌ [Logout] Error:', axiosError.message);
		} finally {
			// Solo log en desarrollo
		if (import.meta.env.DEV) {
			console.log('🚪 [Logout] Limpiando estado...');
		}
			
			// ✅ CORRECCIÓN CRÍTICA: Eliminar cookie del navegador SIEMPRE
			document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
			
			// Verificar si había un usuario autenticado antes de limpiar
			// Si no había token, estamos en modo pre-login, así que preservamos el cache por subdominio
			const hadAuthenticatedUser = !!authRef.current.token;
			
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
			isRefreshingPromise = null;
			processQueue(new Error('Session expired'), null);
			
			// ✅ CORRECCIÓN: Solo limpiar branding completo si había un usuario autenticado
			// Si no había token (modo pre-login), preservar el cache por subdominio
			// para que el branding por subdominio persista después del refresh
			useBrandingStore.getState().clearAll(!hadAuthenticatedUser);
			useEmpresaSelectionStore.getState().clearPendingSelection();
		}
	}, [processQueue, clearImpersonationState]);

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

	/**
	 * Obtiene el usuario desde /auth/me y actualiza el estado.
	 * El usuario SOLO proviene de /auth/me, nunca de la respuesta de login.
	 */
	const initializeAuth = useCallback(async (): Promise<UserData | null> => {
		console.log('[initializeAuth] iniciando', {
			tokenPresent: Boolean(authRef.current.token),
			tokenPrefix: authRef.current.token?.slice(0, 20),
		});
		const token = authRef.current.token;
		const claimsForInit = decodeAccessToken(token);
		console.log('[initializeAuth] canInitializeFullSession check', {
			canInitialize: canInitializeFullSession(token),
			empresa_selection_pending: claimsForInit?.empresa_selection_pending,
			empresa_id: claimsForInit?.empresa_id,
		});
		if (!canInitializeFullSession(token)) {
			if (import.meta.env.DEV) {
				console.warn('[AuthContext] initializeAuth omitido: token no es sesión completa');
			}
			return null;
		}
		console.log('[initializeAuth] llamando /auth/me');
		const me = await authService.me();
		if (!me) {
			await doLogout(false);
			return null;
		}

		const claims = decodeAccessToken(authRef.current.token);
		const tokenUser = authRef.current.user;
		const mergedUser: UserData = {
			...me,
			usuario_id: me.usuario_id || claims?.sub || '',
			cliente_id: me.cliente_id || claims?.cliente_id || '',
			es_admin_cliente: me.es_admin_cliente || Boolean(claims?.es_admin_cliente),
			empresa_activa: me.empresa_activa || claims?.empresa_id || null,
		};

		let sessionUser = mergedUser;
		if (!mergedUser.usuario_id?.trim()) {
			if (import.meta.env.DEV) {
				console.warn(
					'[initializeAuth] usuario_id vacío tras /auth/me; manteniendo user_data del token',
					{ meUsuarioId: me.usuario_id, tokenUsuarioId: tokenUser?.usuario_id, sub: claims?.sub },
				);
			}
			if (tokenUser) {
				sessionUser = {
					...tokenUser,
					...mergedUser,
					usuario_id:
						mergedUser.usuario_id ||
						tokenUser.usuario_id ||
						claims?.sub ||
						'',
					cliente_id:
						mergedUser.cliente_id ||
						tokenUser.cliente_id ||
						claims?.cliente_id ||
						'',
					es_admin_cliente:
						mergedUser.es_admin_cliente ||
						tokenUser.es_admin_cliente ||
						Boolean(claims?.es_admin_cliente),
					empresa_activa:
						mergedUser.empresa_activa ||
						tokenUser.empresa_activa ||
						claims?.empresa_id ||
						null,
				};
			}
		}

		setAuth((prev) => ({ ...prev, user: sessionUser }));
		authRef.current = { ...authRef.current, user: sessionUser };
		syncEmpresaSession(sessionUser, authRef.current.token);

		if (claims?.empresa_selection_pending) {
			setRequiereSeleccionEmpresa(true);
			setMenuModulos(null);
			setPermissions(null);
			setMenuPermissionsReady(false);
			if (import.meta.env.DEV) {
				console.log('[AuthContext] JWT empresa_selection_pending: sesión requiere selección de empresa');
			}
		}

		updateAccessLevels(sessionUser);

		if (!claims?.empresa_selection_pending) {
			const modulos = await loadMenuAndPermissionsFromAuthMenu(sessionUser);
			sessionMenuSnapshotRef.current = modulos;
		}

		const type =
			sessionUser.user_type ??
			determineUserType(sessionUser.access_level ?? 0, !!sessionUser.is_super_admin);
		const isOnboardingAdmin =
			Boolean(sessionUser.es_admin_cliente) && !hasEmpresaActiva(sessionUser.empresa_activa);

		if (type === 'platform_admin' || isOnboardingAdmin) {
			setEmpresasElegibles([]);
		} else {
			try {
				const elegibles = await loadEmpresasElegiblesForSession(sessionUser);
				setEmpresasElegibles(elegibles);
			} catch {
				// mantener lista previa (p. ej. desde login selection)
			}
		}

		syncImpersonationFromToken(authRef.current.token);

		setAuthInitialized(true);
		setIsBootstrapped(true);
		return sessionUser;
	}, [updateAccessLevels, doLogout, syncEmpresaSession, determineUserType, syncImpersonationFromToken, loadEmpresasElegiblesForSession]);

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

			isRefreshingPromise = null;
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

	// ============================================================================
	// INTERCEPTORES
	// ============================================================================

	/**
	 * ✅ INTERCEPTOR DE REQUEST
	 * 
	 * ✅ FASE 2: Solo agrega tokens a las requests
	 * Ya no modifica baseURL para evitar race conditions.
	 * Los servicios deben usar useApi() o getApiInstance() para obtener la instancia correcta.
	 */
	useEffect(() => {
		if (import.meta.env.DEV) {
			console.log('🔧 [AuthContext] Registrando interceptor de request...');
		}
		const requestInterceptor = api.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				// Solo log detallado en desarrollo
				if (import.meta.env.DEV) {
					console.log(`📡 [Request] ${config.method?.toUpperCase()} ${config.url}`);
				}
				
				// Asegurar que headers existe
				if (!config.headers) {
					config.headers = {} as AxiosRequestHeaders;
				}
				const headers = config.headers as AxiosRequestHeaders;
				const currentToken = authRef.current.token;
				
				// ✅ FASE 2: Agregar token a la request
				// NOTA: Ya no modificamos baseURL aquí para evitar race conditions.
				// Los servicios deben usar useApi() o getApiInstance() para obtener la instancia correcta.
				const isPublic = isPublicEndpoint(config.url);
				const skipRefresh = skipsTokenRefresh(config.url);
				const explicitAuth = hasExplicitAuthorization(headers);
				
				// No pisar Authorization (p. ej. selection_token en otros flujos)
				if (explicitAuth) {
					config.headers = headers;
					return config;
				}
				
				// Solo agregar access ERP si hay token y no es público ni endpoint sin sesión ERP
				if (currentToken && !skipRefresh && !isPublic) {
					headers.Authorization = `Bearer ${currentToken}`;
					// Solo log en desarrollo
					if (import.meta.env.DEV) {
						console.log(`🔑 [Request] Token agregado para ${config.url}`);
					}
				} else if (!currentToken && !skipRefresh && !isPublic && import.meta.env.DEV) {
					// Solo mostrar warning si NO es endpoint público ni de auth
					// Los endpoints públicos no requieren token, es normal
					console.warn(`⚠️ [Request] No hay token para ${config.url}`);
				}
				
				// ✅ FASE 2: Ya no modificamos baseURL aquí
				// La instancia de Axios ya está configurada correctamente (central o local)
				// según el servicio que la use (useApi() selecciona la correcta)
				
				// Asegurar que los headers se asignen correctamente
				config.headers = headers;
				return config;
			},
			(error: AxiosError) => {
				console.error('❌ [Request Interceptor] Error:', error.message);
				return Promise.reject(error);
			}
		);
		
		if (import.meta.env.DEV) {
			console.log('✅ [AuthContext] Interceptor de request registrado');
		}
		
		return () => {
			if (import.meta.env.DEV) {
				console.log('🧹 [AuthContext] Desregistrando interceptor de request...');
			}
			api.interceptors.request.eject(requestInterceptor);
		};
	}, [skipsTokenRefresh, isPublicEndpoint]);

	/**
	 * ✅ INTERCEPTOR DE RESPONSE
	 */
	useEffect(() => {
		console.log('🔧 [AuthContext] Registrando interceptor de response...');
		const responseInterceptor = api.interceptors.response.use(
			(response: AxiosResponse) => {
				// Solo log en desarrollo para reducir ruido
				if (import.meta.env.DEV) {
					console.log(`✅ [Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
				}
				return response;
			},
			async (error: AxiosError) => {
				const originalRequest = error.config as (InternalAxiosRequestConfig & { 
					_retry?: boolean 
				}) | undefined;
				
				const status = error.response?.status;
				const url = originalRequest?.url || 'unknown';
				
				// Ignorar logs de errores esperados (401 en refresh, 404 en branding)
				if (status === 401 && url.includes('/auth/refresh')) {
					// Ya se maneja en auth.service.ts, no loguear aquí
					return Promise.reject(error);
				}
				
				if (!originalRequest || skipsTokenRefresh(originalRequest.url)) {
					if (import.meta.env.DEV) {
						console.log(`⏭️ [Response] Sin refresh automático: ${url}`);
					}
					return Promise.reject(error);
				}
				
				// Solo log errores no críticos en desarrollo
				if (import.meta.env.DEV) {
					console.log(`❌ [Response] ${status || 'Network'} - ${url}`);
				}

				// Modo soporte: no usar refresh cookie de plataforma ni restaurar parent en 401 genérico
				if (
					isImpersonationSupportMode(authRef.current.token) &&
					isImpersonationAuthErrorStatus(error.response?.status)
				) {
					if (import.meta.env.DEV) {
						console.warn(
							'[Response] 401/403 en modo soporte — sin refresh plataforma ni restore parent automático',
							originalRequest.url,
						);
					}
					return Promise.reject(error);
				}

				if (error.response?.status === 401 && !originalRequest._retry) {
					if (isImpersonationSupportMode(authRef.current.token)) {
						if (import.meta.env.DEV) {
							console.warn(
								'[Response] 401 en modo soporte — omitiendo refresh cookie plataforma',
								originalRequest.url,
							);
						}
						return Promise.reject(error);
					}

					console.warn(`🚨 [Response Interceptor] 401 capturado en ${originalRequest.url}`);

					// Control de concurrencia
					if (isRefreshingPromise) {
						console.log('🔄 [Response Interceptor] Refresh en curso, encolando...');
						return new Promise<string>((resolve, reject) => {
							failedQueueRef.current.push({ resolve, reject });
						})
							.then(token => {
								// ✅ CORRECCIÓN: Asegurar que headers existe
								if (!originalRequest.headers) {
									originalRequest.headers = {} as AxiosRequestHeaders;
								}
								const headers = originalRequest.headers as AxiosRequestHeaders;
								headers.Authorization = `Bearer ${token}`;
								originalRequest.headers = headers;
								
								// ✅ FASE 2: Ya no modificamos baseURL aquí
								// La instancia ya está configurada correctamente
								
								originalRequest._retry = true;
								console.log(`🔄 [Response Interceptor] Reintentando petición encolada con nuevo token: ${originalRequest.url}`);
								return api(originalRequest);
							})
							.catch(err => {
								console.error('❌ [Response Interceptor] Error en cola:', err);
								return Promise.reject(err);
							});
					}

					originalRequest._retry = true;
					
					isRefreshingPromise = (async () => {
						try {
							console.log('🔄 [Response Interceptor] Iniciando refresh...');
							
							const newToken = await authService.refreshToken();
							
							console.log('✅ [Response Interceptor] Token refrescado');

							const newAuth = { ...authRef.current, token: newToken };
							
							if (!loadingRef.current) { 
								setAuth(newAuth);
							}
							authRef.current = newAuth;

							processQueue(null, newToken);

							return newToken; 
						} catch (refreshError) {
							const axiosError = refreshError as AxiosError;
							console.error('❌ [Response Interceptor] Refresh falló:', axiosError.message);
							
							processQueue(new Error('Token refresh failed'), null);
							await doLogout(false);
							
							throw refreshError;
						} finally {
							if (isRefreshingPromise !== null) {
								isRefreshingPromise = null;
							}
						}
					})();
					
					try {
						const newToken = await isRefreshingPromise;
						
						// ✅ CORRECCIÓN: Asegurar que headers existe antes de modificar
						if (!originalRequest.headers) {
							originalRequest.headers = {} as AxiosRequestHeaders;
						}
						const headers = originalRequest.headers as AxiosRequestHeaders;
						headers.Authorization = `Bearer ${newToken}`;
						originalRequest.headers = headers;
						
						// ✅ FASE 2: Ya no modificamos baseURL aquí
						// La instancia ya está configurada correctamente
						
						console.log(`🔄 [Response Interceptor] Reintentando petición con nuevo token: ${originalRequest.url}`);
						return api(originalRequest);
					} catch (e) {
						console.error('❌ [Response Interceptor] Error al reintentar petición:', e);
						return Promise.reject(error);
					}
				}

				// ✅ Corrección crítica: manejo global de 5xx y timeout
				showServerErrorToast(error);

				return Promise.reject(error);
			}
		);

		if (import.meta.env.DEV) {
			console.log('✅ [AuthContext] Interceptor de response registrado');
		}
		
		return () => {
			if (import.meta.env.DEV) {
				console.log('🧹 [AuthContext] Desregistrando interceptor de response...');
			}
			api.interceptors.response.eject(responseInterceptor);
		};
	}, [skipsTokenRefresh, processQueue, doLogout, isImpersonationActive, restorePlatformSession]);

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

			if (window.location.pathname === '/login') {
				setLoading(false);
				setAuthInitialized(true);
				setIsBootstrapped(true);
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
							console.log('✅ [Bootstrap] Sesión impersonada rehidratada desde token en memoria');
						}
					} catch {
						/* sin refresh plataforma en modo soporte */
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
				const newToken = await authService.refreshToken();
				if (import.meta.env.DEV) {
					console.log('✅ [Bootstrap] refresh OK, token prefix:', newToken?.slice(0, 24));
				}
				logAuthSessionSnapshot('post-refresh (bootstrap OK)', newToken, null);
				if (isSelectionPendingToken(newToken)) {
					if (import.meta.env.DEV) {
						console.warn(
							'[Bootstrap] refresh devolvió selection token; no se llama /auth/me',
						);
					}
					await doLogout(false);
					return;
				}

				// Solo guardar token; usuario vendrá de /auth/me
				setAuth({ token: newToken, user: null });
				authRef.current = { token: newToken, user: null };
				const me = await initializeAuth();
				if (me && import.meta.env.DEV) {
					console.log('✅ [Bootstrap] Perfil obtenido:', { usuario: me.nombre_usuario, user_type: me.user_type });
				}
			} catch (error) {
				const axiosError = error as AxiosError;
				const statusCode = axiosError.response?.status;
				logAuthContext('bootstrap refresh FAILED → doLogout(false)', {
					status: statusCode,
					detail: (axiosError.response?.data as { detail?: string })?.detail,
					subdomain: typeof window !== 'undefined' ? window.location.hostname.split('.')[0] : null,
				});
				if (statusCode === 401 && import.meta.env.DEV) {
					console.warn(
						'[Bootstrap] refresh 401 — abrir Network: comparar login vs refresh (Cookie request header, Set-Cookie response). Ver docs/frontend/auditoria/PLATFORM_REFRESH_DIAGNOSTIC.md',
					);
					logAuthSessionSnapshot('bootstrap refresh FAILED (sin token nuevo)', null, null);
				}
				document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
				await doLogout(false);
			} finally {
				setLoading(false);
				setAuthInitialized(true);
				setIsBootstrapped(true);
				console.log('🏁 [Bootstrap] Inicialización finalizada');
			}
		}

		runBootstrap();
	}, [doLogout, initializeAuth, restorePlatformSession, syncImpersonationFromToken]);

	// ============================================================================
	// FUNCIONES PÚBLICAS
	// ============================================================================

	const applyFullSessionToken = useCallback(
		async (response: Token): Promise<AuthLoginSession | null> => {
			console.log('[applyFullSessionToken] inicio', {
				hasAccessToken: Boolean(response?.access_token),
				accessTokenPrefix: response?.access_token?.slice(0, 20),
				hasUserData: Boolean(response?.user_data),
			});
			if (!response?.access_token) {
				console.log('[applyFullSessionToken] abort: sin access_token');
				return null;
			}
			const previousTokenPrefix = authRef.current.token?.slice(0, 20) ?? null;
			const claimsIncoming = decodeAccessToken(response.access_token);
			const canInit = canInitializeFullSession(response.access_token);
			console.log('[applyFullSessionToken] token evaluado', {
				canInitializeFullSession: canInit,
				empresa_selection_pending: claimsIncoming?.empresa_selection_pending,
				empresa_id: claimsIncoming?.empresa_id,
				rawPendingClaim: claimsIncoming?.empresa_selection_pending,
			});
			if (!canInit) {
				console.error('❌ [AuthContext] access_token con empresa_selection_pending; no es sesión completa');
				return null;
			}
			setMenuPermissionsReady(false);
			// Limpiar caché de la empresa anterior antes de hidratar la nueva sesión
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
				previous_token_prefix: previousTokenPrefix,
			});
			const me = await initializeAuth();
			useEmpresaSelectionStore.getState().clearPendingSelection();
			logAuthSessionSnapshot('post-login (applyFullSessionToken)', authRef.current.token, me);
			console.log('[applyFullSessionToken] initializeAuth resultado', {
				meReceived: Boolean(me),
				usuarioId: me?.usuario_id,
			});
			if (!me) return null;
			return { user: me, menuModulos: sessionMenuSnapshotRef.current };
		},
		[initializeAuth, queryClient, syncImpersonationFromToken],
	);

	/**
	 * Establece la autenticación después del login (Token completo).
	 */
	const setAuthFromLogin = useCallback(
		async (response: Token): Promise<AuthLoginSession | null> => {
			if (!response?.access_token) {
				console.error('❌ [Login] Respuesta inválida: falta access_token');
				setAuth(initialAuth);
				authRef.current = initialAuth;
				updateAccessLevels(null);
				return null;
			}
			return applyFullSessionToken(response);
		},
		[updateAccessLevels, applyFullSessionToken],
	);

	const invalidateSelectionSession = useCallback(() => {
		useEmpresaSelectionStore.getState().clearPendingSelection();
		setAuth(initialAuth);
		authRef.current = initialAuth;
		clearImpersonationSupportSession();
		document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
	}, []);

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
						await restorePlatformSession({ redirectToSuperAdmin: true });
						return null;
					}
					invalidateSelectionSession();
				}
				throw error;
			}
		},
		[applyFullSessionToken, invalidateSelectionSession, restorePlatformSession],
	);

	const cambiarEmpresaActiva = useCallback(
		async (empresaId: string): Promise<UserData | null> => {
			const tokenResponse = await authService.cambiarEmpresa(empresaId);
			const session = await applyFullSessionToken(tokenResponse);
			return session?.user ?? null;
		},
		[applyFullSessionToken],
	);

	const reloadMenuAndPermissions = useCallback(async () => {
		const user = authRef.current.user;
		if (user) {
			await loadMenuAndPermissionsFromAuthMenu(user);
		}
	}, [loadMenuAndPermissionsFromAuthMenu]);

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
			return { requiresEmpresaSelection: false };
		},
		[
			clienteInfo,
			isImpersonationActive,
			syncImpersonationFromToken,
			applyFullSessionToken,
			clearImpersonationState,
		],
	);

	const endImpersonationHandler = useCallback(async () => {
		if (!isImpersonationActive() && !hasPlatformParentSession()) {
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
	}, [isImpersonationActive, restorePlatformSession]);

	/**
	 * Cierra la sesión del usuario
	 */
	const logout = useCallback(async () => {
		if (isImpersonationActive() || hasPlatformParentSession()) {
			await endImpersonationHandler();
			return;
		}
		console.log('🚪 [Logout] Cerrando sesión...');
		await doLogout(true);
		console.log('✅ [Logout] Sesión cerrada');
	}, [doLogout, isImpersonationActive, endImpersonationHandler]);

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

	// ============================================================================
	// CONTEXT VALUE
	// ============================================================================
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

	const value = useMemo<AuthContextType>(
		() => ({
			auth,
			setAuthFromLogin,
			completeEmpresaSelection,
			cambiarEmpresaActiva,
			logout,
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
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
};

