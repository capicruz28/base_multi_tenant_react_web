// src/context/AuthContext.tsx
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
import api from '../services/api';
import { authService } from '../services/auth.service';
import type {
	AxiosResponse,
	AxiosError,
	InternalAxiosRequestConfig,
	AxiosRequestHeaders,
} from 'axios';
import type { AuthResponse, UserData } from '../types/auth.types';
import { useBrandingStore } from '../stores/branding.store';

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
	clienteInfo: {
		id: number;
		nombre: string;
		subdominio: string;
	} | null;
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
	const [clienteInfo, setClienteInfo] = useState<{
		id: number;
		nombre: string;
		subdominio: string;
	} | null>(null);
	
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
	 * ✅ CORREGIDO: Actualiza estados de nivel de acceso desde datos de usuario
	 */
	const updateAccessLevels = useCallback((userData: UserData | null) => {
		if (!userData) {
			setAccessLevel(0);
			setIsSuperAdmin(false);
			setUserType('user');
			setClienteInfo(null);
			// Resetear branding cuando no hay usuario
			useBrandingStore.getState().resetBranding();
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
				id: userData.cliente.id,
				nombre: userData.cliente.nombre,
				subdominio: userData.cliente.subdominio,
			});
		} else {
			setClienteInfo(null);
		}
		
		// ✅ IMPORTANTE: Cargar branding siempre que el usuario esté autenticado
		// El endpoint /tenant/branding usa el contexto del tenant (subdominio) del request,
		// no necesita cliente_id explícito. Funciona para tenant_admin y super_admin.
		if (userData) {
			console.log('🎨 [AuthContext] Cargando branding (endpoint usa contexto de tenant)...');
			useBrandingStore.getState().loadBranding();
		} else {
			// Solo resetear cuando no hay usuario
			useBrandingStore.getState().resetBranding();
		}
	}, [determineUserType]);

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
			console.log('🚪 [Logout] Limpiando estado...');
			
			// ✅ CORRECCIÓN CRÍTICA: Eliminar cookie del navegador SIEMPRE
			document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
			
			setAuth(initialAuth);
			authRef.current = initialAuth;
			setAccessLevel(0);
			setIsSuperAdmin(false);
			setUserType('user');
			setClienteInfo(null);
			isRefreshingPromise = null;
			processQueue(new Error('Session expired'), null);
			// Resetear branding al hacer logout
			useBrandingStore.getState().resetBranding();
		}
	}, [processQueue]);

	// ============================================================================
	// INTERCEPTORES
	// ============================================================================

	/**
	 * ✅ INTERCEPTOR DE REQUEST
	 */
	useEffect(() => {
		const requestInterceptor = api.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				const headers = (config.headers ?? {}) as AxiosRequestHeaders;
				const currentToken = authRef.current.token;
				
				// ✅ CORRECCIÓN: Solo agregar token si existe y no es endpoint de auth
				if (currentToken && !isAuthEndpoint(config.url)) {
					headers.Authorization = `Bearer ${currentToken}`;
				}
				
				config.headers = headers;
				return config;
			},
			(error: AxiosError) => {
				console.error('❌ [Request Interceptor] Error:', error.message);
				return Promise.reject(error);
			}
		);

		return () => {
			api.interceptors.request.eject(requestInterceptor);
		};
	}, [isAuthEndpoint]);

	/**
	 * ✅ INTERCEPTOR DE RESPONSE
	 */
	useEffect(() => {
		const responseInterceptor = api.interceptors.response.use(
			(response: AxiosResponse) => response,
			async (error: AxiosError) => {
				const originalRequest = error.config as (InternalAxiosRequestConfig & { 
					_retry?: boolean 
				}) | undefined;
				
				if (!originalRequest || isAuthEndpoint(originalRequest.url)) {
					return Promise.reject(error);
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
								const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
								headers.Authorization = `Bearer ${token}`;
								originalRequest.headers = headers;
								originalRequest._retry = true;
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
						
						const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
						headers.Authorization = `Bearer ${newToken}`;
						originalRequest.headers = headers;
						
						return api(originalRequest);
					} catch (e) {
						return Promise.reject(error);
					}
				}

				return Promise.reject(error);
			}
		);

		return () => {
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
				console.log('✅ [Bootstrap] Token obtenido, actualizando ref...');
				
				// ✅ CORRECCIÓN CRÍTICA: Actualizar ref ANTES de llamar a /me/
				authRef.current = { ...authRef.current, token: newToken };
				
				// ✅ CORRECCIÓN: Ahora el interceptor puede leer el token correctamente
				console.log('➡️ [Bootstrap] Obteniendo perfil de usuario...');
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
					console.log('❌ [Bootstrap] No se pudo obtener perfil');
					await doLogout(false);
				}
			} catch (error) {
				const axiosError = error as AxiosError;
				const errorMessage = error instanceof Error ? error.message : axiosError.message;
				const statusCode = axiosError.response?.status;
				
				// ✅ CORRECCIÓN CRÍTICA: Distinguir entre errores 401 (token inválido) y otros errores
				if (statusCode === 401) {
					console.log('🚫 [Bootstrap] Token inválido o revocado (401), limpiando sesión...');
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
		
		console.log('✅ [Login] Configurando autenticación:', {
			usuario: response.user_data.nombre_usuario,
			accessLevel: response.user_data.access_level,
			isSuperAdmin: response.user_data.is_super_admin
		});
		
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
		}),
		[auth, loading, setAuthFromLogin, logout, hasRole, accessLevel, isSuperAdmin, userType, clienteInfo]
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