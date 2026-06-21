/**
 * IAM-FE-PHASE-09 IMPL-08 — interceptors copy-first (monolito L1245–1648).
 */
import { useEffect } from 'react';
import type {
	AxiosError,
	AxiosResponse,
	InternalAxiosRequestConfig,
	AxiosRequestHeaders,
} from 'axios';

import api from '@/core/api/api';
import { showServerErrorToast } from '@/core/api/axios-instances';
import {
	hasExplicitAuthorization,
	isImpersonationAuthErrorStatus,
	shouldBypassPasswordChangeEnforcement,
	shouldSkipPasswordChangeRedirect,
} from '@/core/api/auth-http.utils';
import type {
	AuthProviderCleanupApi,
	AuthProviderEarlyRefs,
	AuthProviderRequestInterceptorEffectDeps,
	AuthProviderResponseInterceptorEffectDeps,
	AuthProviderSetters,
} from '@/core/auth/provider/auth-provider.types';
import {
	clearRefreshingPromise,
	getRefreshingPromise,
	setRefreshingPromise,
} from '@/core/auth/provider/auth-provider-runtime.refs';
import {
	executeInterceptorRefreshTermination,
	runSessionTerminationExit,
} from '@/core/auth/provider/auth-provider-termination.helpers';
import { authService } from '@/features/auth/services/auth.service';
import type { UserData } from '@/features/auth/types/auth.types';
import { APP_CHANGE_PASSWORD } from '@/features/auth/types/auth.types';
import { isPasswordChangeRequired } from '@/core/services/error.service';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { runLegacySessionDevLog } from '@/core/auth/utils/auth-session-log';
import { isImpersonationSupportMode } from '@/core/auth/utils/impersonation-fe-log';
import { buildSessionClaimsSnapshot, type SessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import {
	applyPostRefreshRqInvalidation,
	resolvePostRefreshRqAction,
} from '@/core/auth/session/session-rq-invalidation';
import { REFRESH_HYDRATE_ENABLED } from '@/core/auth/session/refresh-hydrate.flags';
import { SESSION_TERMINATION_V2_ENABLED } from '@/core/auth/session/session-termination.flags';
import { executeRefreshWithResilience, getRefreshFailureOutcomeMetadata } from '@/core/auth/session/session-refresh-resilience';
import {
	resolveImpersonationExitPolicy,
	shouldRedirectToSuperAdminAfterImpersonationExit,
} from '@/core/auth/session/session-impersonation-exit.policy';
import {
	emitSessionRefreshFailureOutcomeTelemetry,
	emitSessionRefreshOutcomeTelemetry,
} from '@/core/auth/session/session-telemetry-auth-wiring';

export interface UseAuthProviderRequestInterceptorEffectParams
	extends AuthProviderRequestInterceptorEffectDeps {
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef'>;
}

export function useAuthProviderRequestInterceptorEffect(
	params: UseAuthProviderRequestInterceptorEffectParams,
): void {
	const {
		skipsTokenRefresh,
		isPublicEndpoint,
		refs: { authRef },
	} = params;

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
					runLegacySessionDevLog(() => {
						console.log(`🔑 [Request] Token agregado para ${config.url}`);
					});
				} else if (!currentToken && !skipRefresh && !isPublic) {
					runLegacySessionDevLog(() => {
						console.warn(`⚠️ [Request] No hay token para ${config.url}`);
					});
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
}

export interface UseAuthProviderResponseInterceptorEffectParams
	extends AuthProviderResponseInterceptorEffectDeps {
	readonly refs: Pick<
		AuthProviderEarlyRefs,
		| 'authRef'
		| 'loadingRef'
		| 'failedQueueRef'
		| 'empresaActivaIdRef'
		| 'terminationCallerHintRef'
	>;
	readonly setters: Pick<AuthProviderSetters, 'setAuth'>;
	readonly processQueue: AuthProviderCleanupApi['processQueue'];
}

export function useAuthProviderResponseInterceptorEffect(
	params: UseAuthProviderResponseInterceptorEffectParams,
): void {
	const {
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
	} = params;

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

				if (status === 403 && isPasswordChangeRequired(error)) {
					const requestUrl = originalRequest?.url ?? url;
					if (
						!shouldSkipPasswordChangeRedirect(requestUrl) &&
						!shouldBypassPasswordChangeEnforcement(
							authRef.current.token,
							authRef.current.user,
						)
					) {
						const currentUser = authRef.current.user;
						if (currentUser && !currentUser.requires_password_change) {
							const syncedUser: UserData = {
								...currentUser,
								requires_password_change: true,
							};
							const syncedAuth = {
								...authRef.current,
								user: syncedUser,
							};
							if (!loadingRef.current) {
								setAuth(syncedAuth);
							}
							authRef.current = syncedAuth;
						}
						if (
							typeof window !== 'undefined' &&
							!window.location.pathname.startsWith(APP_CHANGE_PASSWORD)
						) {
							if (import.meta.env.DEV) {
								console.warn(
									'[Response] 403 PASSWORD_CHANGE_REQUIRED → redirect',
									requestUrl,
								);
							}
							window.location.assign(APP_CHANGE_PASSWORD);
						}
					}
					return Promise.reject(error);
				}
				
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

				// Modo soporte: salida controlada F6 antes de refresh plataforma / F5
				if (
					isImpersonationSupportMode(authRef.current.token) &&
					isImpersonationAuthErrorStatus(error.response?.status)
				) {
					const status = error.response?.status;
					const decision = resolveImpersonationExitPolicy({
						isSupportMode: true,
						context: 'interceptor',
						httpStatus: status,
					});

					if (decision.action === 'CONTROLLED_EXIT' && decision.source) {
						const redirectToSuperAdmin = shouldRedirectToSuperAdminAfterImpersonationExit(
							window.location.pathname,
							decision.source,
						);
						void runImpersonationControlledExit({
							source: decision.source,
							redirectToSuperAdmin,
							skipEndImpersonationApi: true,
						}).catch((exitError) => {
							if (import.meta.env.DEV) {
								console.error(
									'[Response] controlled exit impersonation falló',
									exitError,
								);
							}
						});
						return Promise.reject(error);
					}

					if (import.meta.env.DEV) {
						console.warn(
							'[Response] 401/403 en modo soporte — sin refresh plataforma (legacy reject)',
							originalRequest.url,
						);
					}
					return Promise.reject(error);
				}

				if (error.response?.status === 401 && !originalRequest._retry) {
					console.warn(`🚨 [Response Interceptor] 401 capturado en ${originalRequest.url}`);

					// Control de concurrencia
					if (getRefreshingPromise()) {
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
							runLegacySessionDevLog(() => {
								console.log(`🔄 [Response Interceptor] Reintentando petición encolada con nuevo token: ${originalRequest.url}`);
							});
								return api(originalRequest);
							})
							.catch(err => {
								console.error('❌ [Response Interceptor] Error en cola:', err);
								return Promise.reject(err);
							});
					}

					originalRequest._retry = true;
					
					setRefreshingPromise((async () => {
						try {
							runLegacySessionDevLog(() => {
								console.log('🔄 [Response Interceptor] Iniciando refresh...');
							});

							let priorSnapshot: SessionClaimsSnapshot | undefined;
							if (REFRESH_HYDRATE_ENABLED) {
								priorSnapshot = buildSessionClaimsSnapshot(
									authRef.current.token,
									authRef.current.user,
									empresaActivaIdRef.current,
								);
							}

							const refreshResult = await executeRefreshWithResilience(
								{ source: 'interceptor', singleFlightRole: 'leader' },
								{ callRefresh: () => authService.refreshToken() },
							);
							const newToken = refreshResult.accessToken;
							const refreshOutcome = refreshResult.metadata.outcome;

							emitSessionRefreshOutcomeTelemetry(
								refreshResult.metadata,
								newToken,
							);

							runLegacySessionDevLog(() => {
								console.log('✅ [Response Interceptor] Token refrescado');
							});

							if (REFRESH_HYDRATE_ENABLED && priorSnapshot) {
								const postRefreshResult = await runPostRefreshSession(
									newToken,
									priorSnapshot,
								);

								applyPostRefreshRqInvalidation(
									resolvePostRefreshRqAction(
										priorSnapshot,
										postRefreshResult.hydrationLevel,
										{
											empresaId: empresaActivaIdRef.current,
											clienteId: authRef.current.user?.cliente_id ?? null,
										},
									),
									queryClient,
								);

								emitAuthSyncSessionToken(
									'SESSION_REFRESHED',
									newToken,
									priorSnapshot,
									refreshOutcome,
								);
							} else {
								const refreshClaims = decodeAccessToken(newToken);
								const refreshedUser = authRef.current.user
									? {
											...authRef.current.user,
											requires_password_change: Boolean(
												refreshClaims?.requires_password_change,
											),
										}
									: authRef.current.user;
								const newAuth = {
									...authRef.current,
									token: newToken,
									user: refreshedUser,
								};

								if (!loadingRef.current) {
									setAuth(newAuth);
								}
								authRef.current = newAuth;

								emitAuthSyncSessionToken(
									'SESSION_REFRESHED',
									newToken,
									undefined,
									refreshOutcome,
								);
							}

							processQueue(null, newToken);

							return newToken;
						} catch (refreshError) {
							const axiosError = refreshError as AxiosError;
							console.error('❌ [Response Interceptor] Refresh falló:', axiosError.message);

							const failureOutcomeMetadata =
								getRefreshFailureOutcomeMetadata(refreshError);
							if (failureOutcomeMetadata) {
								emitSessionRefreshFailureOutcomeTelemetry(failureOutcomeMetadata);
								if (import.meta.env.DEV) {
									console.debug(
										'[Response Interceptor] Refresh failure outcome:',
										failureOutcomeMetadata,
									);
								}
							}

							terminationCallerHintRef.current = 'refresh_fail';
							try {
								await runSessionTerminationExit({
									v2Enabled: SESSION_TERMINATION_V2_ENABLED,
									legacyDeps: legacyLogoutDeps,
									legacyCallServer: false,
									v2Action: () =>
										executeInterceptorRefreshTermination(
											runTerminateSession,
											refreshError,
										),
								});

								throw refreshError;
							} finally {
								terminationCallerHintRef.current = undefined;
							}
						} finally {
							if (getRefreshingPromise() !== null) {
								clearRefreshingPromise();
							}
						}
					})());
					
					try {
						const newToken = await getRefreshingPromise();
						
						// ✅ CORRECCIÓN: Asegurar que headers existe antes de modificar
						if (!originalRequest.headers) {
							originalRequest.headers = {} as AxiosRequestHeaders;
						}
						const headers = originalRequest.headers as AxiosRequestHeaders;
						headers.Authorization = `Bearer ${newToken}`;
						originalRequest.headers = headers;
						
						// ✅ FASE 2: Ya no modificamos baseURL aquí
						// La instancia ya está configurada correctamente
						
					runLegacySessionDevLog(() => {
						console.log(`🔄 [Response Interceptor] Reintentando petición con nuevo token: ${originalRequest.url}`);
					});
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
	}, [skipsTokenRefresh, runTerminateSession, legacyLogoutDeps, isImpersonationActive, restorePlatformSession, runPostRefreshSession, emitAuthSyncSessionToken, queryClient, runImpersonationControlledExit]);
}
