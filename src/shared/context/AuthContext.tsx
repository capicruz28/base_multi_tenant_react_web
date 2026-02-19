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
import { getUserPermissions } from '../../core/auth/services/permission.service';
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
	setAuthFromLogin: (response: AuthResponse) => UserData | null;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
	loading: boolean;
	hasRole: (...roles: string[]) => boolean;
	// ✅ CORREGIDO: Campos alineados con el backend
	accessLevel: number;
	isSuperAdmin: boolean;
	userType: string;
	clienteInfo: ClienteInfo | null;
	// ✅ NUEVO: Permisos granulares del usuario
	permissions: UserPermissions | null;
}

// ============================================================================
// CONSTANTES
// ============================================================================
const initialAuth: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextType>({
	auth: initialAuth,
	setAuthFromLogin: () => null,
	logout: async () => {},
	isAuthenticated: false,
	loading: true,
	hasRole: () => false,
	accessLevel: 0,
	isSuperAdmin: false,
	userType: 'user',
	clienteInfo: null,
	permissions: null,
});

// ============================================================================
// PROVIDER
// ============================================================================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [auth, setAuth] = useState<AuthState>(initialAuth);
	const [loading, setLoading] = useState(true);
	
	// ✅ Estados para información de niveles de acceso
	const [accessLevel, setAccessLevel] = useState<number>(0);
	const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
	const [userType, setUserType] = useState<string>('user');
	const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
	// ✅ NUEVO: Estado para permisos granulares
	const [permissions, setPermissions] = useState<UserPermissions | null>(null);
	
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
	 * ✅ NUEVO: Carga permisos granulares del usuario desde sus roles
	 */
	const loadUserPermissions = useCallback(async (userData: UserData | null) => {
		if (!userData || !userData.roles || userData.roles.length === 0) {
			setPermissions(null);
			return;
		}

		// Super admin no necesita permisos (tiene todos)
		if (userData.is_super_admin) {
			setPermissions(null); // null indica que tiene todos los permisos
			return;
		}

		try {
			// Solo log en desarrollo
			if (import.meta.env.DEV) {
				console.log('🔐 [AuthContext] Cargando permisos del usuario...');
			}
			// Convertir roles a array de strings (pueden venir como objetos o strings)
			const roleIds = userData.roles.map((r: any) => {
				if (typeof r === 'string') return r;
				if (r && typeof r === 'object' && 'rol_id' in r) return r.rol_id;
				return String(r);
			}).filter(Boolean);

			if (roleIds.length === 0) {
				console.warn('⚠️ [AuthContext] Usuario sin roles asignados');
				setPermissions({});
				return;
			}

			const userPermissions = await getUserPermissions(roleIds, userData.cliente ?? undefined);
			setPermissions(userPermissions);
			const moduleCount = Object.keys(userPermissions).length;
			if (moduleCount > 0) {
				// Solo log en desarrollo
			if (import.meta.env.DEV) {
				console.log(`✅ [AuthContext] Permisos cargados: ${moduleCount} módulo(s)`);
			}
			} else {
				console.warn('⚠️ [AuthContext] No se pudieron cargar permisos granulares. El sistema usará permisos basados en roles (RBAC).');
			}
		} catch (error) {
			console.error('❌ [AuthContext] Error cargando permisos:', error);
			// En caso de error, establecer permisos vacíos (no null) para que el sistema funcione
			setPermissions({});
		}
	}, []);

	/**
	 * ✅ CORREGIDO: Actualiza estados de nivel de acceso desde datos de usuario
	 */
	const updateAccessLevels = useCallback((userData: UserData | null) => {
		if (!userData) {
			setAccessLevel(0);
			setIsSuperAdmin(false);
			setUserType('user');
			setClienteInfo(null);
			setPermissions(null);
			// Resetear branding cuando no hay usuario
			useBrandingStore.getState().resetBranding(null);
			return;
		}

		// ✅ CORRECCIÓN CRÍTICA: Leer directamente del usuario
		const level = userData.access_level || 0;
		const isSuper = userData.is_super_admin || false;
		const type = determineUserType(level, isSuper);
		
		console.log('🔍 [AuthContext] Actualizando niveles de acceso:', {
			level,
			isSuper,
			type,
			hasCliente: !!userData.cliente
		});
		
		setAccessLevel(level);
		setIsSuperAdmin(isSuper);
		setUserType(type);
		
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
		
		// ✅ NUEVO: Cargar permisos granulares del usuario
		loadUserPermissions(userData);
		
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
	}, [determineUserType, loadUserPermissions]);

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
	// BOOTSTRAP - ✅ CORRECCIÓN CRÍTICA
	// ============================================================================
	useEffect(() => {
		if (isInitializedRef.current) {
			return;
		}
		isInitializedRef.current = true;
		
		const initializeAuth = async () => {
			try {
				console.log('🔍 [Bootstrap] Verificando sesión existente...');
				
					// ✅ CORRECCIÓN CRÍTICA: Obtener token primero
					const newToken = await authService.refreshToken();
					if (import.meta.env.DEV) {
						console.log('✅ [Bootstrap] Token obtenido, actualizando ref...');
					}
					
					// ✅ CORRECCIÓN CRÍTICA: Actualizar ref ANTES de llamar a /me/
					authRef.current = { ...authRef.current, token: newToken };
					
					// ✅ CORRECCIÓN: Ahora el interceptor puede leer el token correctamente
					if (import.meta.env.DEV) {
						console.log('➡️ [Bootstrap] Obteniendo perfil de usuario...');
					}
				const { data: userData } = await api.get<UserData>('/auth/me/');
				
				if (userData) {
					console.log('✅ [Bootstrap] Perfil obtenido:', {
						usuario: userData.nombre_usuario,
						accessLevel: userData.access_level,
						isSuperAdmin: userData.is_super_admin,
						tipo: determineUserType(userData.access_level || 0, userData.is_super_admin || false)
					});
					
					const newAuth = { token: newToken, user: userData };
					setAuth(newAuth);
					authRef.current = newAuth;
					
					updateAccessLevels(userData);
				} else {
					if (import.meta.env.DEV) {
						console.log('❌ [Bootstrap] No se pudo obtener perfil');
					}
					await doLogout(false);
				}
			} catch (error) {
				const axiosError = error as AxiosError;
				const errorMessage = error instanceof Error ? error.message : axiosError.message;
				const statusCode = axiosError.response?.status;
				
				// ✅ CORRECCIÓN CRÍTICA: Distinguir entre errores 401 (token inválido) y otros errores
				if (statusCode === 401) {
					// 401 es normal si no hay sesión activa, solo log en desarrollo
					if (import.meta.env.DEV) {
						console.log('ℹ️ [Bootstrap] No hay sesión activa (401) - Normal si no hay cookie');
					}
					// ✅ IMPORTANTE: Limpiar la cookie del navegador también
					document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
				} else {
					console.log('ℹ️ [Bootstrap] Error en inicialización:', errorMessage);
				}
				
				await doLogout(false);
			} finally {
				setLoading(false);
				console.log('🏁 [Bootstrap] Inicialización finalizada');
			}
		};

		initializeAuth();
		
	}, [doLogout, determineUserType, updateAccessLevels]);

	// ============================================================================
	// FUNCIONES PÚBLICAS
	// ============================================================================

	/**
	 * ✅ Establece la autenticación después del login
	 */
	const setAuthFromLogin = useCallback((response: AuthResponse): UserData | null => {
		if (!response?.access_token || !response?.user_data) {
			console.error('❌ [Login] Respuesta inválida');
			setAuth(initialAuth);
			authRef.current = initialAuth;
			updateAccessLevels(null);
			return null;
		}
		
		// Solo log en desarrollo
		if (import.meta.env.DEV) {
			console.log('✅ [Login] Configurando autenticación:', {
				usuario: response.user_data.nombre_usuario,
				accessLevel: response.user_data.access_level,
				isSuperAdmin: response.user_data.is_super_admin
			});
		}
		
		const newAuth = { token: response.access_token, user: response.user_data };
		setAuth(newAuth);
		authRef.current = newAuth;
		
		updateAccessLevels(response.user_data);
		
		return response.user_data;
	}, [updateAccessLevels]);

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
			hasRole,
			accessLevel,
			isSuperAdmin,
			userType,
			clienteInfo,
			permissions,
		}),
		[auth, loading, setAuthFromLogin, logout, hasRole, accessLevel, isSuperAdmin, userType, clienteInfo, permissions]
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

