import { describe, expect, it, vi } from 'vitest';

import { classifySessionTermination } from '@/core/auth/session/session-termination-reason';
import { resolveTerminationUx } from '@/core/auth/session/session-termination-ux';
import { terminateSession } from '@/core/auth/session/session-terminate';
import {
	buildDoLogoutTerminateInput,
	createAuthShowTerminationToast,
	createAuthTerminateRedirectToLogin,
	executeBootstrapRefreshTermination,
	executeInterceptorRefreshTermination,
	getTerminateSessionDeps,
} from '@/shared/context/AuthContext';
import {
	parseSessionLoginQueryParam,
	resolveLoginBannerFromSessionQuery,
} from '@/features/auth/utils/login-session-termination';
import {
	TOKEN_REUSE_CANONICAL_MESSAGE,
	SESSION_EXPIRED_CANONICAL_MESSAGE,
} from '@/core/auth/session/session-termination-ux';

describe('createAuthShowTerminationToast', () => {
	it('omite toast cuando el perfil incluye loginQueryParam (banner en Login)', () => {
		const toastApi = { error: vi.fn(), success: vi.fn() };
		const handler = createAuthShowTerminationToast(toastApi);
		const profile = resolveTerminationUx('TOKEN_REUSE');

		handler(profile);

		expect(toastApi.error).not.toHaveBeenCalled();
		expect(toastApi.success).not.toHaveBeenCalled();
	});

	it('muestra toast error para MANUAL_LOGOUT sin query param', () => {
		const toastApi = { error: vi.fn(), success: vi.fn() };
		const handler = createAuthShowTerminationToast(toastApi);
		const profile = resolveTerminationUx('MANUAL_LOGOUT');

		handler(profile);

		expect(toastApi.success).toHaveBeenCalledWith(
			'Sesión cerrada.',
			expect.objectContaining({ duration: 3000, position: 'top-right' }),
		);
	});

	it('muestra toast error para severidad error sin query param en perfil custom', () => {
		const toastApi = { error: vi.fn(), success: vi.fn() };
		const handler = createAuthShowTerminationToast(toastApi);

		handler({
			reason: 'UNKNOWN',
			toastMessage: 'Mensaje custom',
			severity: 'error',
			redirectPath: '/login?session=error',
			loginQueryParam: undefined,
		});

		expect(toastApi.error).toHaveBeenCalledWith(
			'Mensaje custom',
			expect.objectContaining({ duration: 5000, position: 'top-right' }),
		);
	});
});

describe('createAuthTerminateRedirectToLogin', () => {
	it('retorna callback invocable sin lanzar', () => {
		const redirect = createAuthTerminateRedirectToLogin();
		expect(() => redirect('/login?session=expired')).not.toThrow();
	});
});

describe('buildDoLogoutTerminateInput — Paso 8 redirect', () => {
	it('MANUAL_LOGOUT habilita redirect', () => {
		expect(buildDoLogoutTerminateInput({ callServer: true }).skipRedirect).toBe(false);
	});

	it('SILENT_CLEANUP mantiene skipRedirect', () => {
		expect(buildDoLogoutTerminateInput({ callServer: false }).skipRedirect).toBe(true);
	});
});

describe('terminateSession UX wiring — Paso 8', () => {
	function createUxTrackingDeps() {
		const order: string[] = [];
		const isTerminatingRef = { current: false };
		const redirectToLogin = vi.fn((path: string) => {
			order.push(`redirect:${path}`);
		});
		const toastApi = { error: vi.fn(), success: vi.fn() };

		const deps = getTerminateSessionDeps({
			isTerminatingRef,
			processQueue: () => {
				order.push('processQueue');
			},
			clearLocalAuthState: () => {
				order.push('clearLocalAuthState');
			},
			getHadAuthenticatedUser: () => true,
			callLogoutEndpoint: async () => undefined,
			clearQueryCache: () => undefined,
			showTerminationToast: createAuthShowTerminationToast(toastApi),
			redirectToLogin,
		});

		return { order, deps, redirectToLogin, toastApi };
	}

	it('refresh 401 interceptor activa redirect con query expired y sin toast duplicado', async () => {
		const { order, deps, redirectToLogin, toastApi } = createUxTrackingDeps();
		const error = {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		};
		const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
			terminateSession(input, deps);

		await executeInterceptorRefreshTermination(runTerminateSession, error);

		expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
		expect(toastApi.error).not.toHaveBeenCalled();
		expect(order).toContain('redirect:/login?session=expired');
	});

	it('bootstrap refresh fail activa redirect expired', async () => {
		const { redirectToLogin, deps } = createUxTrackingDeps();
		const error = {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		};
		const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
			terminateSession(input, deps);

		await executeBootstrapRefreshTermination(runTerminateSession, error);

		expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
	});

	it('logout manual activa toast y redirect sin query param', async () => {
		const { redirectToLogin, deps, toastApi } = createUxTrackingDeps();

		await terminateSession(buildDoLogoutTerminateInput({ callServer: true }), deps);

		expect(redirectToLogin).toHaveBeenCalledWith('/login');
		expect(toastApi.success).toHaveBeenCalledWith(
			'Sesión cerrada.',
			expect.objectContaining({ position: 'top-right' }),
		);
	});
});

describe('resolveLoginBannerFromSessionQuery', () => {
	it('?session=security muestra mensaje TOKEN_REUSE', () => {
		const banner = resolveLoginBannerFromSessionQuery('security');
		expect(banner?.message).toBe(TOKEN_REUSE_CANONICAL_MESSAGE);
		expect(banner?.severity).toBe('error');
	});

	it('?session=expired muestra mensaje §19', () => {
		const banner = resolveLoginBannerFromSessionQuery('expired');
		expect(banner?.message).toBe(SESSION_EXPIRED_CANONICAL_MESSAGE);
	});

	it('parseSessionLoginQueryParam rechaza valores desconocidos', () => {
		expect(parseSessionLoginQueryParam('invalid')).toBeNull();
		expect(parseSessionLoginQueryParam('security')).toBe('security');
	});
});

describe('classify + UX coherencia redirect', () => {
	it('TOKEN_REUSE genera redirect security alineado con banner', () => {
		const classification = classifySessionTermination({
			context: 'refresh',
			httpStatus: 401,
			detail: 'token_reuse detected',
			url: '/api/v1/auth/refresh/',
		});
		const profile = resolveTerminationUx(classification.reason, {
			backendDetail: classification.detail,
		});
		expect(profile.redirectPath).toBe('/login?session=security');
	});
});
