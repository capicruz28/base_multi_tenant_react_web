import { describe, expect, it, vi } from 'vitest';

import { buildSessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import { parseRefreshHydrateEnabled } from '@/core/auth/session/refresh-hydrate.flags';
import { applyPostRefreshSession } from '@/core/auth/session/session-post-refresh';
import { parseSessionTerminationEnabled } from '@/core/auth/session/session-termination.flags';
import {
	SESSION_EXPIRED_CANONICAL_MESSAGE,
	TOKEN_REUSE_CANONICAL_MESSAGE,
	resolveTerminationUx,
} from '@/core/auth/session/session-termination-ux';
import {
	SESSION_TERMINATED_ERROR_MESSAGE,
	terminateSession,
} from '@/core/auth/session/session-terminate';
import type { UserData } from '@/features/auth/types/auth.types';
import { resolveLoginBannerFromSessionQuery } from '@/features/auth/utils/login-session-termination';
import {
	buildTerminationClearQueryCache,
	executeBootstrapRefreshTermination,
	executeInterceptorRefreshTermination,
	getTerminateSessionDeps,
	runSessionTerminationExit,
} from '@/shared/context/AuthContext';

function encodeBase64Url(value: string): string {
	const base64 =
		typeof btoa !== 'undefined'
			? btoa(value)
			: Buffer.from(value, 'utf8').toString('base64');
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createMockAccessToken(payload: Record<string, unknown>): string {
	const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = encodeBase64Url(JSON.stringify(payload));
	return `${header}.${body}.mock-signature`;
}

const BASE_PAYLOAD = {
	sub: 'user-11111111-1111-1111-1111-111111111111',
	cliente_id: 'client-22222222-2222-2222-2222-222222222222',
	empresa_id: 'empresa-33333333-3333-3333-3333-333333333333',
	user_type: 'user',
	es_admin_cliente: false,
	requires_password_change: false,
	empresa_selection_pending: false,
	is_impersonation: false,
} as const;

const BACKEND_DETAIL_19 =
	'Sesión expirada o cerrada remotamente. Por favor, vuelva a iniciar sesión.';

function createTerminateHarness() {
	const order: string[] = [];
	const isTerminatingRef = { current: false };
	const redirectToLogin = vi.fn((path: string) => {
		order.push(`redirect:${path}`);
	});
	const clearQueryCache = vi.fn(() => {
		order.push('clearQueryCache');
	});
	const processQueue = vi.fn(() => {
		order.push('processQueue');
	});

	const deps = getTerminateSessionDeps({
		isTerminatingRef,
		processQueue,
		clearLocalAuthState: () => {
			order.push('clearLocalAuthState');
		},
		getHadAuthenticatedUser: () => true,
		callLogoutEndpoint: async () => undefined,
		clearQueryCache: buildTerminationClearQueryCache(true, clearQueryCache),
		showTerminationToast: () => undefined,
		redirectToLogin,
	});

	const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
		terminateSession(input, deps);

	return { order, runTerminateSession, redirectToLogin, clearQueryCache, processQueue, deps };
}

describe('IAM-FE-PHASE-02 Paso 10 — V2.x contrato', () => {
	it('V2.1 refresh 401 interceptor: cleanup + redirect /login sin segundo refresh', async () => {
		const { order, runTerminateSession, redirectToLogin } = createTerminateHarness();
		const error = {
			response: { status: 401, data: { detail: BACKEND_DETAIL_19 } },
			config: { url: '/api/v1/auth/refresh/' },
		};

		await executeInterceptorRefreshTermination(runTerminateSession, error);

		expect(order).toEqual([
			'processQueue',
			'clearLocalAuthState',
			'clearQueryCache',
			'redirect:/login?session=expired',
		]);
		expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
	});

	it('V2.2 bootstrap refresh 401: cleanup + redirect /login', async () => {
		const { order, runTerminateSession, redirectToLogin } = createTerminateHarness();
		const error = {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		};

		await executeBootstrapRefreshTermination(runTerminateSession, error);

		expect(order).toContain('clearLocalAuthState');
		expect(order).toContain('clearQueryCache');
		expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
	});

	it('V2.3 mensaje backend §19 priorizado en perfil UX', () => {
		const profile = resolveTerminationUx('SESSION_EXPIRED', {
			backendDetail: BACKEND_DETAIL_19,
		});
		const banner = resolveLoginBannerFromSessionQuery('expired');

		expect(profile.toastMessage).toBe(BACKEND_DETAIL_19);
		expect(banner?.message).toBe(SESSION_EXPIRED_CANONICAL_MESSAGE);
	});

	it('V2.4 TOKEN_REUSE mensaje diferenciado de expiración normal', () => {
		const expired = resolveTerminationUx('SESSION_EXPIRED');
		const reuse = resolveTerminationUx('TOKEN_REUSE');
		const securityBanner = resolveLoginBannerFromSessionQuery('security');

		expect(reuse.toastMessage).toBe(TOKEN_REUSE_CANONICAL_MESSAGE);
		expect(reuse.toastMessage).not.toBe(expired.toastMessage);
		expect(securityBanner?.message).toBe(TOKEN_REUSE_CANONICAL_MESSAGE);
	});

	it('V2.5 cola rechazada tras refresh fail con error estable', async () => {
		const rejected: Error[] = [];
		const isTerminatingRef = { current: false };

		const deps = getTerminateSessionDeps({
			isTerminatingRef,
			processQueue: (error) => {
				if (error) {
					rejected.push(error);
				}
			},
			clearLocalAuthState: () => undefined,
			getHadAuthenticatedUser: () => true,
			callLogoutEndpoint: async () => undefined,
			clearQueryCache: () => undefined,
			showTerminationToast: () => undefined,
			redirectToLogin: () => undefined,
		});

		const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
			terminateSession(input, deps);

		await executeInterceptorRefreshTermination(runTerminateSession, {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		});

		expect(rejected).toHaveLength(1);
		expect(rejected[0]?.message).toBe(SESSION_TERMINATED_ERROR_MESSAGE);
	});

	it('V2.6 queryClient.clear en toda terminación flag ON', async () => {
		const { clearQueryCache, runTerminateSession } = createTerminateHarness();

		await executeInterceptorRefreshTermination(runTerminateSession, {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		});

		expect(clearQueryCache).toHaveBeenCalledTimes(1);
	});
});

describe('IAM-FE-PHASE-02 Paso 10 — regresión Fase 1 (V1.x)', () => {
	const BASE_USER: UserData = {
		usuario_id: 'user-11111111-1111-1111-1111-111111111111',
		cliente_id: 'client-22222222-2222-2222-2222-222222222222',
		nombre_usuario: 'jdoe',
		correo: 'jdoe@example.com',
		nombre: 'John',
		apellido: 'Doe',
		es_activo: true,
		roles: ['operativo'],
		empresa_activa: 'empresa-33333333-3333-3333-3333-333333333333',
		es_admin_cliente: false,
		requires_password_change: false,
	};

	it('V1.1–V1.4 post-refresh hydrate éxito completa sin terminación', async () => {
		const token = createMockAccessToken({ ...BASE_PAYLOAD });
		const priorSnapshot = buildSessionClaimsSnapshot(
			token,
			BASE_USER,
			BASE_USER.empresa_activa ?? null,
		);

		const result = await applyPostRefreshSession(
			{ newToken: token, priorSnapshot, currentUser: BASE_USER, mode: 'interceptor' },
			{
				swapAccessToken: vi.fn(),
				applyAuthUserAfterClaimsSync: vi.fn(),
				hydrateDeps: {
					getToken: () => token,
					getTokenUser: () => BASE_USER,
					setAuthUser: vi.fn(),
					fetchMe: async () => BASE_USER,
					doLogout: vi.fn(),
					syncEmpresaSession: vi.fn(),
					syncImpersonationFromToken: vi.fn(),
					updateAccessLevels: vi.fn(),
					loadMenuAndPermissionsFromAuthMenu: async () => [],
					loadEmpresasElegiblesForSession: async () => [],
					determineUserType: () => 'user',
					setRequiereSeleccionEmpresa: vi.fn(),
					setMenuModulos: vi.fn(),
					setPermissions: vi.fn(),
					setMenuPermissionsReady: vi.fn(),
					setEmpresasElegibles: vi.fn(),
					setAuthInitialized: vi.fn(),
					setIsBootstrapped: vi.fn(),
					setSessionMenuSnapshot: vi.fn(),
				},
			},
		);

		expect(result.hydrationLevel).toBe('NONE');
	});

	it('E1.5 flags Fase 1 y Fase 2 son ortogonales', () => {
		expect(parseRefreshHydrateEnabled('false')).toBe(false);
		expect(parseSessionTerminationEnabled('true')).toBe(true);
		expect(parseRefreshHydrateEnabled('true')).toBe(true);
		expect(parseSessionTerminationEnabled('false')).toBe(false);
	});
});

describe('IAM-FE-PHASE-02 Paso 10 — E2.x adicionales', () => {
	it('E2.1 logout manual doble click es idempotente', async () => {
		const { deps } = createTerminateHarness();
		const input = {
			reason: 'MANUAL_LOGOUT' as const,
			callServer: true,
			skipRedirect: false,
		};

		await terminateSession(input, deps);
		await terminateSession(input, deps);

		expect(deps.getIsTerminating()).toBe(false);
	});

	it('E2.5 login ?session=security muestra banner seguridad', () => {
		const banner = resolveLoginBannerFromSessionQuery('security');
		expect(banner?.message).toBe(TOKEN_REUSE_CANONICAL_MESSAGE);
		expect(banner?.severity).toBe('error');
	});
});

describe('IAM-FE-PHASE-02 Paso 10 — runSessionTerminationExit', () => {
	it('delega V2 cuando flag ON', async () => {
		const v2Action = vi.fn().mockResolvedValue(undefined);
		const legacyDeps = {
			processQueue: vi.fn(),
			clearLocalAuthState: vi.fn(),
			getHadAuthenticatedUser: () => false,
			callLogoutEndpoint: vi.fn(),
		};

		await runSessionTerminationExit({
			v2Enabled: true,
			legacyDeps,
			v2Action,
		});

		expect(v2Action).toHaveBeenCalledTimes(1);
		expect(legacyDeps.processQueue).not.toHaveBeenCalled();
	});

	it('delega legacy cuando flag OFF', async () => {
		const v2Action = vi.fn();
		const order: string[] = [];
		const legacyDeps = {
			processQueue: () => {
				order.push('processQueue');
			},
			clearLocalAuthState: () => {
				order.push('clearLocalAuthState');
			},
			getHadAuthenticatedUser: () => true,
			callLogoutEndpoint: vi.fn(),
		};

		await runSessionTerminationExit({
			v2Enabled: false,
			legacyDeps,
			v2Action,
		});

		expect(v2Action).not.toHaveBeenCalled();
		expect(order).toContain('processQueue');
		expect(order).toContain('clearLocalAuthState');
	});
});
