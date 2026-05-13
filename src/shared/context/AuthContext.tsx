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
import api from '../../core/api/api';
import { authService } from '../../features/auth/services/auth.service';
import type {
	AxiosResponse,
	AxiosError,
	InternalAxiosRequestConfig,
	AxiosRequestHeaders,
} from 'axios';
import type { AuthResponse, UserData, ClienteInfo } from '../../features/auth/types/auth.types';
import { useBrandingStore } from '../../features/tenant/stores/branding.store';
import type { UserPermissions } from '../../core/auth/types/permission.types';
import type { AuthMenuModulo, AuthMenuItem } from '../../core/auth/types/auth-menu.types';
import { menuService } from '../../features/admin/services/menu.service';
import { showServerErrorToast } from '../../core/api/axios-instances';

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
	setAuthFromLogin: (response: AuthResponse) => Promise<UserData | null>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
	loading: boolean;
	/** true cuando bootstrap (/auth/me) terminó (éxito o error). Evita race condition. */
	authInitialized: boolean;
	/** true cuando /auth/me terminó; el router no debe renderizar rutas hasta entonces. */
	isBootstrapped: boolean;
	hasRole: (...roles: string[]) => boolean;
	// ✅ CORREGIDO: Campos alineados con el backend
	accessLevel: number;
	isSuperAdmin: boolean;
	userType: string;
	clienteInfo: ClienteInfo | null;
	// ✅ Permisos granulares del usuario (derivados desde /auth/menu)
	permissions: UserPermissions | null;
	// ✅ Menú del usuario (desde GET /auth/menu)
	menuModulos: AuthMenuModulo[] | null;
}

// ============================================================================
// CONSTANTES
// ============================================================================
const initialAuth: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextType>({
	auth: initialAuth,
	setAuthFromLogin: async () => null,
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
});

// ============================================================================
// PROVIDER
// ============================================================================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

	/**
	 * Deriva permissions[module][action] desde response.modulos (OR de todos los menús/submenús).
	 * Clave del módulo: modulo.codigo.toLowerCase().
	 */
	const derivePermissionsFromModulos = useCallback((modulos: AuthMenuModulo[]): UserPermissions => {
		const result: UserPermissions = {};
		for (const modulo of modulos) {
			const key = modulo.codigo.toLowerCase();
			const agg = {
				ver: false,
				crear: false,
				editar: false,
				eliminar: false,
				exportar: false,
				imprimir: false,
			};
			const aggregateMenu = (menu: AuthMenuItem) => {
				if (menu.permisos) {
					agg.ver = agg.ver || menu.permisos.ver;
					agg.crear = agg.crear || menu.permisos.crear;
					agg.editar = agg.editar || menu.permisos.editar;
					agg.eliminar = agg.eliminar || menu.permisos.eliminar;
					agg.exportar = agg.exportar || (menu.permisos.exportar ?? false);
					agg.imprimir = agg.imprimir || (menu.permisos.imprimir ?? false);
				}
				(menu.submenus || []).forEach(aggregateMenu);
			};
			for (const seccion of modulo.secciones || []) {
				for (const menu of seccion.menus || []) {
					aggregateMenu(menu);
				}
			}
			result[key] = agg;
		}
		return result;
	}, []);

	/**
	 * Carga menú y permisos desde GET /auth/menu (fuente única).
	 */
	const loadMenuAndPermissionsFromAuthMenu = useCallback(async (userData: UserData | null) => {
		if (!userData) {
			setPermissions(null);
			setMenuModulos(null);
			return;
		}

		// platform_admin: tiene todos los permisos (null); menú se carga igual desde backend
		if (userData.user_type === 'platform_admin') {
			try {
				const response = await menuService.getAuthMenu();
				setMenuModulos(response.modulos || []);
				setPermissions(null);
			} catch (error) {
				console.error('❌ [AuthContext] Error cargando menú (super admin):', error);
				setMenuModulos([]);
				setPermissions(null);
			}
			return;
		}

		// Usuario sin roles: sin menú ni permisos granulares
		if (!userData.roles || userData.roles.length === 0) {
			setMenuModulos(null);
			setPermissions({});
			return;
		}

		try {
			if (import.meta.env.DEV) {
				console.log('🔐 [AuthContext] Cargando menú y permisos desde /auth/menu...');
			}
			const response = await menuService.getAuthMenu();
			const modulos = response.modulos || [];
			setMenuModulos(modulos);

			const derived = derivePermissionsFromModulos(modulos);
			if (import.meta.env.DEV) {
				console.debug('permissions derived', derived);
			}
			setPermissions(derived);

			const moduleCount = Object.keys(derived).length;
			if (import.meta.env.DEV && moduleCount > 0) {
				console.log(`✅ [AuthContext] Menú y permisos cargados: ${moduleCount} módulo(s)`);
			}
		} catch (error) {
			console.error('❌ [AuthContext] Error cargando /auth/menu:', error);
			setMenuModulos([]);
			setPermissions({});
		}
	}, [derivePermissionsFromModulos]);

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
			useBrandingStore.getState().resetBranding(null);
			return;
		}

		// Prioridad: user_type del backend (/auth/me)
		const type =
			typeof userData.user_type === 'string' && userData.user_type.trim()
				? userData.user_type
				: determineUserType(userData.access_level || 0, !!userData.is_super_admin);

		setAccessLevel(userData.access_level ?? 0);
		setIsSuperAdmin(type === 'platform_admin');
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
		
		// ✅ Cargar menú y permisos desde GET /auth/menu (fuente única)
		loadMenuAndPermissionsFromAuthMenu(userData);
		
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
	}, [determineUserType, loadMenuAndPermissionsFromAuthMenu]);

	/**
	 * Detecta si la URL es de autenticación (login/refresh)
	 */
	const isAuthEndpoint = useCallback((url?: string): boolean => {
		if (!url) return false;
		const cleanUrl = url.toLowerCase();
		return cleanUrl.includes('/auth/refresh') || 
			cleanUrl.includes('/auth/login');
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
			isRefreshingPromise = null;
			processQueue(new Error('Session expired'), null);
			
			// ✅ CORRECCIÓN: Solo limpiar branding completo si había un usuario autenticado
			// Si no había token (modo pre-login), preservar el cache por subdominio
			// para que el branding por subdominio persista después del refresh
			useBrandingStore.getState().clearAll(!hadAuthenticatedUser);
		}
	}, [processQueue]);

	/**
	 * Obtiene el usuario desde /auth/me y actualiza el estado.
	 * El usuario SOLO proviene de /auth/me, nunca de la respuesta de login.
	 */
	const initializeAuth = useCallback(async (): Promise<UserData | null> => {
		const me = await authService.me();
		if (!me) {
			await doLogout(false);
			return null;
		}
		setAuth((prev) => ({ ...prev, user: me }));
		authRef.current = { ...authRef.current, user: me };
		updateAccessLevels(me);
		setAuthInitialized(true);
		setIsBootstrapped(true);
		return me;
	}, [updateAccessLevels, doLogout]);

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
				const isAuth = isAuthEndpoint(config.url);
				
				// Solo agregar token si hay token y no es endpoint público ni de auth
				if (currentToken && !isAuth && !isPublic) {
					headers.Authorization = `Bearer ${currentToken}`;
					// Solo log en desarrollo
					if (import.meta.env.DEV) {
						console.log(`🔑 [Request] Token agregado para ${config.url}`);
					}
				} else if (!currentToken && !isAuth && !isPublic && import.meta.env.DEV) {
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
	}, [isAuthEndpoint, isPublicEndpoint]);

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
				
				if (!originalRequest || isAuthEndpoint(originalRequest.url)) {
					// Solo log en desarrollo
					if (import.meta.env.DEV) {
						console.log(`⏭️ [Response] Ignorando error de auth: ${url}`);
					}
					return Promise.reject(error);
				}
				
				// Solo log errores no críticos en desarrollo
				if (import.meta.env.DEV) {
					console.log(`❌ [Response] ${status || 'Network'} - ${url}`);
				}

				if (error.response?.status === 401 && !originalRequest._retry) {
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
	}, [isAuthEndpoint, processQueue, doLogout]);

	// ============================================================================
	// BOOTSTRAP - Usuario SOLO desde /auth/me
	// ============================================================================
	useEffect(() => {
		if (isInitializedRef.current) {
			return;
		}
		isInitializedRef.current = true;

		async function runBootstrap() {
			try {
				console.log('🔍 [Bootstrap] Verificando sesión existente...');
				const newToken = await authService.refreshToken();
				if (import.meta.env.DEV) {
					console.log('✅ [Bootstrap] Token obtenido');
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
				if (statusCode === 401 && import.meta.env.DEV) {
					console.log('ℹ️ [Bootstrap] No hay sesión activa (401)');
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
	}, [doLogout, initializeAuth]);

	// ============================================================================
	// FUNCIONES PÚBLICAS
	// ============================================================================

	/**
	 * Establece la autenticación después del login.
	 * Login SOLO guarda tokens; el usuario proviene de /auth/me.
	 */
	const setAuthFromLogin = useCallback(async (response: AuthResponse): Promise<UserData | null> => {
		if (!response?.access_token) {
			console.error('❌ [Login] Respuesta inválida: falta access_token');
			setAuth(initialAuth);
			authRef.current = initialAuth;
			updateAccessLevels(null);
			return null;
		}
		// Solo guardar token; NO usar user_data de la respuesta
		const newAuth = { token: response.access_token, user: null };
		setAuth(newAuth);
		authRef.current = newAuth;
		return initializeAuth();
	}, [updateAccessLevels, initializeAuth]);

	/**
	 * Cierra la sesión del usuario
	 */
	const logout = useCallback(async () => {
		console.log('🚪 [Logout] Cerrando sesión...');
		await doLogout(true);
		console.log('✅ [Logout] Sesión cerrada');
	}, [doLogout]);

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
	const value = useMemo<AuthContextType>(
		() => ({
			auth,
			setAuthFromLogin,
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
		}),
		[auth, loading, authInitialized, isBootstrapped, setAuthFromLogin, logout, hasRole, accessLevel, isSuperAdmin, userType, clienteInfo, permissions, menuModulos]
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

