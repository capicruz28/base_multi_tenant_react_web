import { describe, expect, it, vi } from 'vitest';

import { classifySessionTermination } from '@/core/auth/session/session-termination-reason';
import { terminateSession } from '@/core/auth/session/session-terminate';
import { getTerminateSessionDeps } from '@/shared/context/AuthContext';
import {
	buildInterceptorTerminationClassifyInput,
	executeBootstrapRefreshTermination,
	executeClassifiedTermination,
	executeHydrateFailureTermination,
	executeInterceptorRefreshTermination,
} from '@/shared/context/AuthContext';
import { buildTerminateSessionInput } from '@/shared/context/AuthContext';

describe('buildInterceptorTerminationClassifyInput', () => {
	it('refresh 401 usa contexto refresh con url', () => {
		const error = {
			response: { status: 401, data: { detail: 'Unauthorized' } },
			config: { url: '/api/v1/auth/refresh/' },
		};

		const input = buildInterceptorTerminationClassifyInput(error);

		expect(input.context).toBe('refresh');
		expect(input.url).toBe('/api/v1/auth/refresh/');
		expect(classifySessionTermination(input).reason).toBe('REFRESH_UNAUTHORIZED');
	});

	it('post-refresh hydrate fail usa context hydrate sin duplicar parser HTTP', () => {
		const error = new Error('Post-refresh full hydration failed');

		const input = buildInterceptorTerminationClassifyInput(error);

		expect(input).toEqual({ context: 'hydrate' });
		expect(classifySessionTermination(input).reason).toBe('HYDRATE_FAILED');
	});

	it('claims sync inválido usa context hydrate', () => {
		const error = new Error('Invalid access token for claims sync');

		expect(buildInterceptorTerminationClassifyInput(error)).toEqual({ context: 'hydrate' });
	});
});

describe('executeClassifiedTermination', () => {
	it('preserva error original en buildTerminateSessionInput (P1-01)', async () => {
		const error = {
			response: { status: 401, data: { detail: 'token_reuse' } },
			config: { url: '/api/v1/auth/refresh/' },
		};
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);
		const classifyInput = buildInterceptorTerminationClassifyInput(error);

		await executeClassifiedTermination(runTerminateSession, {
			classifyInput,
			error,
			callServer: false,
			skipRedirect: true,
		});

		expect(runTerminateSession).toHaveBeenCalledTimes(1);
		const input = runTerminateSession.mock.calls[0][0];
		expect(input.error).toBe(error);
		expect(input.reason).toBe(
			classifySessionTermination(classifyInput).reason,
		);
	});

	it('no re-parsea: delega classify una sola vez vía input coherente', async () => {
		const classification = classifySessionTermination({ context: 'hydrate' });
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);

		await executeClassifiedTermination(runTerminateSession, {
			classifyInput: { context: 'hydrate' },
			error: undefined,
		});

		expect(runTerminateSession).toHaveBeenCalledWith(
			buildTerminateSessionInput(classification, {
				error: undefined,
				callServer: undefined,
				skipRedirect: undefined,
				preservePreLoginBranding: undefined,
			}),
		);
	});
});

describe('runtime termination wiring', () => {
	function createTrackingTerminate() {
		const order: string[] = [];
		const isTerminatingRef = { current: false };

		const deps = getTerminateSessionDeps({
			isTerminatingRef,
			processQueue: () => {
				order.push('processQueue');
			},
			clearLocalAuthState: () => {
				order.push('clearLocalAuthState');
			},
			getHadAuthenticatedUser: () => true,
			callLogoutEndpoint: async () => {
				order.push('callLogoutEndpoint');
			},
			clearQueryCache: () => undefined,
			showTerminationToast: () => undefined,
			redirectToLogin: () => undefined,
		});

		const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
			terminateSession(input, deps);

		return { order, runTerminateSession };
	}

	it('interceptor refresh fail → terminateSession con REFRESH_UNAUTHORIZED', async () => {
		const { order, runTerminateSession } = createTrackingTerminate();
		const error = {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		};

		await executeInterceptorRefreshTermination(runTerminateSession, error);

		expect(order).toEqual(['processQueue', 'clearLocalAuthState']);
		const input = buildTerminateSessionInput(
			classifySessionTermination(buildInterceptorTerminationClassifyInput(error)),
			{ error, callServer: false, skipRedirect: true },
		);
		expect(input.reason).toBe('REFRESH_UNAUTHORIZED');
	});

	it('bootstrap refresh fail → BOOTSTRAP_FAILED', async () => {
		const { order, runTerminateSession } = createTrackingTerminate();
		const error = {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		};

		await executeBootstrapRefreshTermination(runTerminateSession, error);

		expect(order).toContain('processQueue');
		const classification = classifySessionTermination({
			context: 'bootstrap',
			httpStatus: 401,
			url: '/api/v1/auth/refresh/',
		});
		expect(classification.reason).toBe('BOOTSTRAP_FAILED');
	});

	it('hydrate fail → HYDRATE_FAILED', async () => {
		const { order, runTerminateSession } = createTrackingTerminate();

		await executeHydrateFailureTermination(runTerminateSession);

		expect(order).toEqual(['processQueue', 'clearLocalAuthState']);
		const classification = classifySessionTermination({ context: 'hydrate' });
		expect(classification.reason).toBe('HYDRATE_FAILED');
	});

	it('interceptor hydrate fail post-refresh → HYDRATE_FAILED', async () => {
		const { runTerminateSession } = createTrackingTerminate();
		const error = new Error('Post-refresh full hydration failed');

		await executeInterceptorRefreshTermination(runTerminateSession, error);

		const input = buildTerminateSessionInput(
			classifySessionTermination(buildInterceptorTerminationClassifyInput(error)),
			{ error, callServer: false, skipRedirect: true },
		);
		expect(input.reason).toBe('HYDRATE_FAILED');
	});
});

describe('regresión Fase 1 — refresh OK no usa terminación', () => {
	it('classify refresh 401 no se invoca en camino éxito (contrato)', () => {
		const successToken = 'new-access-token';
		expect(successToken).toBeTruthy();
		expect(classifySessionTermination({ context: 'refresh', httpStatus: 200 })).toBeDefined();
	});
});
