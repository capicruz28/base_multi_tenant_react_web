import { describe, expect, it, vi } from 'vitest';

import { classifySessionTermination } from '@/core/auth/session/session-termination-reason';
import type { SessionTerminationUxProfile } from '@/core/auth/session/session-termination-ux';
import {
	AUTH_REFRESH_TERMINATION_URL,
	buildBootstrapTerminationClassifyInput,
	buildInterceptorRefreshTerminationClassifyInput,
	buildTerminateSessionInput,
	createAuthTerminateRedirectToLogin,
	extractTerminationHttpContextFromError,
	getTerminateSessionDeps,
} from '@/shared/context/AuthContext';

describe('getTerminateSessionDeps', () => {
	it('conecta guard idempotencia al ref', () => {
		const isTerminatingRef = { current: false };
		const deps = getTerminateSessionDeps(createMinimalParams({ isTerminatingRef }));

		expect(deps.getIsTerminating()).toBe(false);
		deps.setIsTerminating(true);
		expect(isTerminatingRef.current).toBe(true);
	});

	it('delega processQueue sin envolver', () => {
		const processQueue = vi.fn();
		const deps = getTerminateSessionDeps(createMinimalParams({ processQueue }));

		const error = new Error('Session terminated');
		deps.processQueue(error, null);

		expect(processQueue).toHaveBeenCalledWith(error, null);
	});

	it('clearAuthState deriva preservePreLoginBranding desde token activo', () => {
		const clearLocalAuthState = vi.fn();
		const deps = getTerminateSessionDeps(
			createMinimalParams({
				clearLocalAuthState,
				getHadAuthenticatedUser: () => true,
			}),
		);

		deps.clearAuthState({});

		expect(clearLocalAuthState).toHaveBeenCalledWith(false);
	});

	it('clearAuthState respeta preservePreLoginBranding explícito', () => {
		const clearLocalAuthState = vi.fn();
		const deps = getTerminateSessionDeps(
			createMinimalParams({
				clearLocalAuthState,
				getHadAuthenticatedUser: () => true,
			}),
		);

		deps.clearAuthState({ preservePreLoginBranding: true });

		expect(clearLocalAuthState).toHaveBeenCalledWith(true);
	});

	it('clearAuthState preserva branding en pre-login sin token', () => {
		const clearLocalAuthState = vi.fn();
		const deps = getTerminateSessionDeps(
			createMinimalParams({
				clearLocalAuthState,
				getHadAuthenticatedUser: () => false,
			}),
		);

		deps.clearAuthState({});

		expect(clearLocalAuthState).toHaveBeenCalledWith(true);
	});

	it('usa clearRefreshingPromise inyectado cuando se provee', () => {
		const clearRefreshingPromise = vi.fn();
		const deps = getTerminateSessionDeps(
			createMinimalParams({ clearRefreshingPromise }),
		);

		deps.clearRefreshingPromise?.();

		expect(clearRefreshingPromise).toHaveBeenCalledTimes(1);
	});

	it('propaga redirectToLogin y showTerminationToast', () => {
		const redirectToLogin = vi.fn();
		const showTerminationToast = vi.fn();
		const profile = {
			reason: 'SESSION_EXPIRED',
			toastMessage: 'Sesión expirada',
			severity: 'error',
			redirectPath: '/login?session=expired',
		} as SessionTerminationUxProfile;

		const deps = getTerminateSessionDeps(
			createMinimalParams({ redirectToLogin, showTerminationToast }),
		);

		deps.redirectToLogin('/login?session=expired');
		deps.showTerminationToast(profile);

		expect(redirectToLogin).toHaveBeenCalledWith('/login?session=expired');
		expect(showTerminationToast).toHaveBeenCalledWith(profile);
	});

	it('omite emitTerminationEvent cuando no se inyecta', () => {
		const deps = getTerminateSessionDeps(createMinimalParams());

		expect(deps.emitTerminationEvent).toBeUndefined();
	});

	it('incluye emitTerminationEvent cuando se inyecta', () => {
		const emitTerminationEvent = vi.fn();
		const deps = getTerminateSessionDeps(
			createMinimalParams({ emitTerminationEvent }),
		);

		expect(deps.emitTerminationEvent).toBe(emitTerminationEvent);
	});
});

describe('extractTerminationHttpContextFromError', () => {
	it('extrae status, detail y url desde AxiosError', () => {
		const context = extractTerminationHttpContextFromError({
			response: { status: 401, data: { detail: 'Sesión expirada' } },
			config: { url: '/api/v1/auth/refresh/' },
		});

		expect(context).toEqual({
			httpStatus: 401,
			detail: 'Sesión expirada',
			url: '/api/v1/auth/refresh/',
		});
	});

	it('usa fallback refresh url cuando no hay config.url', () => {
		const context = extractTerminationHttpContextFromError({ response: { status: 500 } });

		expect(context.url).toBe(AUTH_REFRESH_TERMINATION_URL);
	});
});

describe('buildBootstrapTerminationClassifyInput', () => {
	it('incluye context bootstrap y url refresh para classify (P1-02)', () => {
		const error = {
			response: { status: 401, data: { detail: 'Unauthorized' } },
			config: { url: '/api/v1/auth/refresh/' },
		};

		const input = buildBootstrapTerminationClassifyInput(error);
		const classification = classifySessionTermination(input);

		expect(input.context).toBe('bootstrap');
		expect(input.url).toBe('/api/v1/auth/refresh/');
		expect(classification.reason).toBe('BOOTSTRAP_FAILED');
	});
});

describe('buildInterceptorRefreshTerminationClassifyInput', () => {
	it('incluye context refresh y url para classify interceptor', () => {
		const input = buildInterceptorRefreshTerminationClassifyInput({
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		});

		expect(input.context).toBe('refresh');
		expect(input.url).toBe('/api/v1/auth/refresh/');
	});
});

describe('buildTerminateSessionInput', () => {
	it('preserva siempre el error original junto al reason (P1-01)', () => {
		const error = {
			response: { status: 401, data: { detail: 'token_reuse' } },
			config: { url: '/api/v1/auth/refresh/' },
		};
		const classification = classifySessionTermination(
			buildInterceptorRefreshTerminationClassifyInput(error),
		);

		const input = buildTerminateSessionInput(classification, {
			error,
			callServer: false,
		});

		expect(input.reason).toBe(classification.reason);
		expect(input.error).toBe(error);
		expect(input.callServer).toBe(false);
	});
});

describe('createAuthTerminateRedirectToLogin', () => {
	it('retorna callback invocable sin lanzar', () => {
		const redirect = createAuthTerminateRedirectToLogin();

		expect(typeof redirect).toBe('function');
		expect(() => redirect('/login?session=expired')).not.toThrow();
	});
});

function createMinimalParams(
	overrides?: Partial<Parameters<typeof getTerminateSessionDeps>[0]>,
): Parameters<typeof getTerminateSessionDeps>[0] {
	return {
		isTerminatingRef: { current: false },
		processQueue: vi.fn(),
		clearLocalAuthState: vi.fn(),
		getHadAuthenticatedUser: () => false,
		callLogoutEndpoint: vi.fn(),
		clearQueryCache: vi.fn(),
		showTerminationToast: vi.fn(),
		redirectToLogin: vi.fn(),
		...overrides,
	};
}
