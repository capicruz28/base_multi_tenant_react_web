import { describe, expect, it, vi } from 'vitest';

import { terminateSession } from '@/core/auth/session/session-terminate';
import { executeLogoutAllFlow } from '@/core/auth/session/session-logout-all';
import {
	buildLogoutAllTerminateInput,
	executeLogoutAllTermination,
	getLogoutAllFlowDeps,
	getTerminateSessionDeps,
	type LegacySessionLogoutDeps,
} from '@/shared/context/AuthContext';

describe('buildLogoutAllTerminateInput (IMPL-04)', () => {
	it('construye MANUAL_LOGOUT con callServer false', () => {
		expect(buildLogoutAllTerminateInput({})).toEqual({
			reason: 'MANUAL_LOGOUT',
			callServer: false,
			preservePreLoginBranding: true,
			skipRedirect: false,
		});
	});

	it('respeta preservePreLoginBranding y skipRedirect del input', () => {
		expect(
			buildLogoutAllTerminateInput({
				preservePreLoginBranding: false,
				skipRedirect: true,
			}),
		).toEqual({
			reason: 'MANUAL_LOGOUT',
			callServer: false,
			preservePreLoginBranding: false,
			skipRedirect: true,
		});
	});
});

describe('getLogoutAllFlowDeps (IMPL-04)', () => {
	it('inyecta getIsTerminating desde isTerminatingRef', () => {
		const isTerminatingRef = { current: false };
		const deps = getLogoutAllFlowDeps({
			isTerminatingRef,
			callLogoutAllEndpoint: async () => undefined,
			runTerminateAfterLogoutAll: async () => undefined,
		});

		expect(deps.getIsTerminating()).toBe(false);
		isTerminatingRef.current = true;
		expect(deps.getIsTerminating()).toBe(true);
	});

	it('propaga onLogoutAllRejected opcional', async () => {
		const onRejected = vi.fn();
		const deps = getLogoutAllFlowDeps({
			isTerminatingRef: { current: false },
			callLogoutAllEndpoint: async () => {
				throw new Error('fail');
			},
			runTerminateAfterLogoutAll: async () => undefined,
			onLogoutAllRejected: onRejected,
		});

		await expect(
			executeLogoutAllFlow({}, deps),
		).rejects.toThrow('fail');

		expect(onRejected).toHaveBeenCalledTimes(1);
	});
});

describe('executeLogoutAllTermination (IMPL-04)', () => {
	const legacyDeps: LegacySessionLogoutDeps = {
		processQueue: vi.fn(),
		callLogoutEndpoint: vi.fn(),
		clearLocalAuthState: vi.fn(),
		getHadAuthenticatedUser: () => true,
	};

	it('delega en runTerminateSession con callServer false', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);

		await executeLogoutAllTermination(runTerminateSession, legacyDeps, {
			preservePreLoginBranding: true,
		});

		expect(runTerminateSession).toHaveBeenCalledTimes(1);
		expect(runTerminateSession).toHaveBeenCalledWith(
			buildLogoutAllTerminateInput({ preservePreLoginBranding: true }),
		);
		expect(runTerminateSession.mock.calls[0][0].callServer).toBe(false);
		expect(runTerminateSession.mock.calls[0][0].reason).toBe('MANUAL_LOGOUT');
	});

	it('invoca redirect explícito cuando V2 OFF y se provee redirectToLogin', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);
		const redirectToLogin = vi.fn();

		await executeLogoutAllTermination(
			runTerminateSession,
			legacyDeps,
			{},
			redirectToLogin,
		);

		if (process.env.VITE_SESSION_TERMINATION_V2_ENABLED === 'false') {
			expect(redirectToLogin).toHaveBeenCalledWith('/login');
		}
	});
});

describe('logout all single-flight (IMPL-04 / AUDIT-A A2-02)', () => {
	it('executeLogoutAllFlow no-op cuando isTerminatingRef activo', async () => {
		const callLogoutAllEndpoint = vi.fn();
		const runTerminateAfterLogoutAll = vi.fn();

		await executeLogoutAllFlow(
			{},
			getLogoutAllFlowDeps({
				isTerminatingRef: { current: true },
				callLogoutAllEndpoint,
				runTerminateAfterLogoutAll,
			}),
		);

		expect(callLogoutAllEndpoint).not.toHaveBeenCalled();
		expect(runTerminateAfterLogoutAll).not.toHaveBeenCalled();
	});

	it('segunda terminate concurrente es no-op vía isTerminatingRef', async () => {
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
			callLogoutEndpoint: async () => {
				order.push('callLogoutEndpoint');
			},
			clearQueryCache: () => {
				order.push('clearQueryCache');
			},
			showTerminationToast: () => undefined,
			redirectToLogin: () => undefined,
		});

		const input = buildLogoutAllTerminateInput({ preservePreLoginBranding: true });
		const first = terminateSession(input, deps);
		const second = terminateSession(input, deps);

		await Promise.resolve();
		expect(order.filter((step) => step === 'processQueue')).toHaveLength(1);

		releaseCleanup?.();
		await first;
		await second;
	});
});
