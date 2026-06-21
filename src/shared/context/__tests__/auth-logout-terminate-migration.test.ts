import { describe, expect, it, vi } from 'vitest';

import { terminateSession, SESSION_TERMINATED_ERROR_MESSAGE } from '@/core/auth/session/session-terminate';
import { getTerminateSessionDeps } from '@/shared/context/AuthContext';
import {
	buildDoLogoutTerminateInput,
	executeDoLogoutTermination,
} from '@/shared/context/AuthContext';

describe('buildDoLogoutTerminateInput', () => {
	it('doLogout(false) mapea a SILENT_CLEANUP sin callServer', () => {
		const input = buildDoLogoutTerminateInput({ callServer: false });

		expect(input).toEqual({
			reason: 'SILENT_CLEANUP',
			callServer: false,
			error: undefined,
			skipRedirect: true,
		});
	});

	it('doLogout(true) mapea a MANUAL_LOGOUT con callServer y redirect', () => {
		const input = buildDoLogoutTerminateInput({ callServer: true });

		expect(input).toEqual({
			reason: 'MANUAL_LOGOUT',
			callServer: true,
			error: undefined,
			skipRedirect: false,
		});
	});

	it('preserva error original cuando se provee (AUDIT-A P1-01)', () => {
		const error = { response: { status: 401, data: { detail: 'expired' } } };
		const input = buildDoLogoutTerminateInput({ callServer: false, error });

		expect(input.error).toBe(error);
	});
});

describe('executeDoLogoutTermination', () => {
	it('delega únicamente en runTerminateSession', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);

		await executeDoLogoutTermination(runTerminateSession, { callServer: true });

		expect(runTerminateSession).toHaveBeenCalledTimes(1);
		expect(runTerminateSession).toHaveBeenCalledWith(
			buildDoLogoutTerminateInput({ callServer: true }),
		);
	});

	it('logout manual usa MANUAL_LOGOUT vía callServer true', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);

		await executeDoLogoutTermination(runTerminateSession, { callServer: true });

		const input = runTerminateSession.mock.calls[0][0];
		expect(input.reason).toBe('MANUAL_LOGOUT');
		expect(input.callServer).toBe(true);
	});

	it('segunda llamada concurrente durante terminación es no-op', async () => {
		const isTerminatingRef = { current: false };
		const order: string[] = [];
		let releaseCleanup: (() => void) | null = null;
		const cleanupGate = new Promise<void>((resolve) => {
			releaseCleanup = resolve;
		});

		const deps = getTerminateSessionDeps({
			isTerminatingRef,
			processQueue: () => {
				order.push('processQueue');
			},
			clearLocalAuthState: async () => {
				order.push('clearLocalAuthState');
				await cleanupGate;
			},
			getHadAuthenticatedUser: () => true,
			callLogoutEndpoint: async () => undefined,
			clearQueryCache: () => undefined,
			showTerminationToast: () => undefined,
			redirectToLogin: () => undefined,
		});

		const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
			terminateSession(input, deps);

		const first = executeDoLogoutTermination(runTerminateSession, { callServer: false });
		await Promise.resolve();
		await executeDoLogoutTermination(runTerminateSession, { callServer: false });

		releaseCleanup?.();
		await first;

		expect(order.filter((step) => step === 'processQueue')).toHaveLength(1);
	});

	it('ejecuta secuencia terminateSession para doLogout(false) sin UX legacy', async () => {
		const order: string[] = [];
		const isTerminatingRef = { current: false };

		const deps = getTerminateSessionDeps({
			isTerminatingRef,
			processQueue: (error) => {
				order.push(`processQueue:${error?.message ?? 'null'}`);
			},
			clearLocalAuthState: () => {
				order.push('clearLocalAuthState');
			},
			getHadAuthenticatedUser: () => false,
			callLogoutEndpoint: async () => {
				order.push('callLogoutEndpoint');
			},
			clearQueryCache: () => {
				order.push('clearQueryCache');
			},
			showTerminationToast: () => {
				order.push('showTerminationToast');
			},
			redirectToLogin: () => {
				order.push('redirectToLogin');
			},
		});

		await terminateSession(buildDoLogoutTerminateInput({ callServer: false }), deps);

		expect(order).toEqual([
			`processQueue:${SESSION_TERMINATED_ERROR_MESSAGE}`,
			'clearLocalAuthState',
			'clearQueryCache',
		]);
		expect(order).not.toContain('callLogoutEndpoint');
		expect(order).not.toContain('showTerminationToast');
		expect(order).not.toContain('redirectToLogin');
	});

	it('doLogout(true) invoca callLogoutEndpoint, toast y redirect vía terminateSession', async () => {
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
			callLogoutEndpoint: async () => {
				order.push('callLogoutEndpoint');
			},
			clearQueryCache: () => undefined,
			showTerminationToast: (profile) => {
				if (profile.loginQueryParam === undefined && profile.toastMessage) {
					order.push('showTerminationToast');
				}
			},
			redirectToLogin,
		});

		await terminateSession(buildDoLogoutTerminateInput({ callServer: true }), deps);

		expect(order).toEqual([
			'processQueue',
			'callLogoutEndpoint',
			'clearLocalAuthState',
			'showTerminationToast',
			'redirect:/login',
		]);
	});
});
