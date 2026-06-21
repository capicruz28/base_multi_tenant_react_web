import { describe, expect, it, vi } from 'vitest';

import { terminateSession } from '@/core/auth/session/session-terminate';
import {
	buildTerminationClearQueryCache,
	executeInterceptorRefreshTermination,
	getTerminateSessionDeps,
	LEGACY_SESSION_QUEUE_ERROR_MESSAGE,
	performLegacySessionLogout,
	type LegacySessionLogoutDeps,
} from '@/shared/context/AuthContext';

function createLegacyDeps(overrides?: Partial<LegacySessionLogoutDeps>) {
	const order: string[] = [];
	const deps: LegacySessionLogoutDeps = {
		clearRefreshingPromise: () => {
			order.push('clearRefreshingPromise');
		},
		processQueue: (error) => {
			order.push(`processQueue:${error?.message ?? 'null'}`);
		},
		callLogoutEndpoint: async () => {
			order.push('callLogoutEndpoint');
		},
		clearLocalAuthState: () => {
			order.push('clearLocalAuthState');
		},
		getHadAuthenticatedUser: () => true,
		...overrides,
	};
	return { deps, order };
}

describe('buildTerminationClearQueryCache', () => {
	it('flag ON ejecuta queryClient.clear', () => {
		const clear = vi.fn();
		const handler = buildTerminationClearQueryCache(true, clear);
		handler();
		expect(clear).toHaveBeenCalledTimes(1);
	});

	it('flag OFF es noop', () => {
		const clear = vi.fn();
		const handler = buildTerminationClearQueryCache(false, clear);
		handler();
		expect(clear).not.toHaveBeenCalled();
	});
});

describe('performLegacySessionLogout', () => {
	it('rechaza cola con mensaje legacy y limpia estado sin servidor', async () => {
		const { deps, order } = createLegacyDeps();

		await performLegacySessionLogout(deps, false);

		expect(order).toEqual([
			'clearRefreshingPromise',
			`processQueue:${LEGACY_SESSION_QUEUE_ERROR_MESSAGE}`,
			'clearLocalAuthState',
		]);
	});

	it('callServer true invoca logout servidor best-effort', async () => {
		const { deps, order } = createLegacyDeps();

		await performLegacySessionLogout(deps, true);

		expect(order).toContain('callLogoutEndpoint');
	});

	it('preserva branding pre-login sin token', async () => {
		const clearLocalAuthState = vi.fn();
		const { deps } = createLegacyDeps({
			getHadAuthenticatedUser: () => false,
			clearLocalAuthState,
		});

		await performLegacySessionLogout(deps, false);

		expect(clearLocalAuthState).toHaveBeenCalledWith(true);
	});

	it('no usa terminateSession V2 (sin isTerminatingRef ni redirect)', async () => {
		const redirectToLogin = vi.fn();
		const showTerminationToast = vi.fn();
		const isTerminatingRef = { current: false };
		const { deps, order } = createLegacyDeps();

		await performLegacySessionLogout(deps, false);

		expect(isTerminatingRef.current).toBe(false);
		expect(redirectToLogin).not.toHaveBeenCalled();
		expect(showTerminationToast).not.toHaveBeenCalled();
		expect(order).not.toContain('clearQueryCache');
	});
});

describe('terminateSession deps — flag ON activa RQ clear', () => {
	it('clearQueryCache wired con flag ON invoca queryClient.clear', async () => {
		const order: string[] = [];
		const isTerminatingRef = { current: false };
		const clearQueryCache = vi.fn(() => {
			order.push('clearQueryCache');
		});

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
			clearQueryCache: buildTerminationClearQueryCache(true, clearQueryCache),
			showTerminationToast: () => undefined,
			redirectToLogin: () => undefined,
		});

		await terminateSession(
			{ reason: 'REFRESH_UNAUTHORIZED', callServer: false, skipRedirect: true },
			deps,
		);

		expect(order).toContain('clearQueryCache');
		expect(clearQueryCache).toHaveBeenCalledTimes(1);
	});

	it('clearQueryCache wired con flag OFF no invoca clear', async () => {
		const clearQueryCache = vi.fn();
		const isTerminatingRef = { current: false };

		const deps = getTerminateSessionDeps({
			isTerminatingRef,
			processQueue: () => undefined,
			clearLocalAuthState: () => undefined,
			getHadAuthenticatedUser: () => false,
			callLogoutEndpoint: async () => undefined,
			clearQueryCache: buildTerminationClearQueryCache(false, clearQueryCache),
			showTerminationToast: () => undefined,
			redirectToLogin: () => undefined,
		});

		await terminateSession(
			{ reason: 'SILENT_CLEANUP', callServer: false, skipRedirect: true },
			deps,
		);

		expect(clearQueryCache).not.toHaveBeenCalled();
	});
});

describe('rama interceptor — flag OFF vs ON (contrato)', () => {
	it('flag OFF: legacy logout sin classify ni redirect', async () => {
		const { deps, order } = createLegacyDeps();
		const runTerminateSession = vi.fn();

		await performLegacySessionLogout(deps, false);

		expect(runTerminateSession).not.toHaveBeenCalled();
		expect(order).toContain(`processQueue:${LEGACY_SESSION_QUEUE_ERROR_MESSAGE}`);
	});

	it('flag ON: executeInterceptorRefreshTermination delega terminateSession', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);
		const error = {
			response: { status: 401 },
			config: { url: '/api/v1/auth/refresh/' },
		};

		await executeInterceptorRefreshTermination(runTerminateSession, error);

		expect(runTerminateSession).toHaveBeenCalledTimes(1);
		expect(runTerminateSession.mock.calls[0][0].reason).toBe('REFRESH_UNAUTHORIZED');
		expect(runTerminateSession.mock.calls[0][0].skipRedirect).toBe(false);
	});
});
