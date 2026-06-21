import { describe, expect, it, vi } from 'vitest';

import { classifySessionTermination } from '@/core/auth/session/session-termination-reason';
import { terminateSession } from '@/core/auth/session/session-terminate';
import {
	hydrateSessionCore,
	type HydrateSessionCoreDeps,
} from '@/core/auth/session/session-refresh-hydrate';
import type { UserData } from '@/features/auth/types/auth.types';
import {
	buildHydrateFailureClassifyInput,
	createHydrateFetchMeWithErrorCapture,
	createTerminateFromHydrateFailure,
	executeHydrateFailureTermination,
	getTerminateSessionDeps,
} from '@/shared/context/AuthContext';

const BASE_ME: UserData = {
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

function createMinimalHydrateDeps(
	overrides: Partial<HydrateSessionCoreDeps> = {},
): HydrateSessionCoreDeps {
	return {
		getToken: () => 'token',
		getTokenUser: () => null,
		setAuthUser: () => undefined,
		fetchMe: async () => BASE_ME,
		doLogout: async () => undefined,
		syncEmpresaSession: () => undefined,
		syncImpersonationFromToken: () => undefined,
		updateAccessLevels: () => undefined,
		loadMenuAndPermissionsFromAuthMenu: async () => [],
		loadEmpresasElegiblesForSession: async () => [],
		determineUserType: () => 'user',
		setRequiereSeleccionEmpresa: () => undefined,
		setMenuModulos: () => undefined,
		setPermissions: () => undefined,
		setMenuPermissionsReady: () => undefined,
		setEmpresasElegibles: () => undefined,
		setAuthInitialized: () => undefined,
		setIsBootstrapped: () => undefined,
		setSessionMenuSnapshot: () => undefined,
		...overrides,
	};
}

describe('buildHydrateFailureClassifyInput', () => {
	it('retorna context hydrate → HYDRATE_FAILED', () => {
		const input = buildHydrateFailureClassifyInput();
		expect(input).toEqual({ context: 'hydrate' });
		expect(classifySessionTermination(input).reason).toBe('HYDRATE_FAILED');
	});
});

describe('createTerminateFromHydrateFailure', () => {
	it('callServer false delega HYDRATE_FAILED sin servidor', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);
		const handler = createTerminateFromHydrateFailure(runTerminateSession);

		await handler(false);

		expect(runTerminateSession).toHaveBeenCalledTimes(1);
		expect(runTerminateSession.mock.calls[0][0].reason).toBe('HYDRATE_FAILED');
		expect(runTerminateSession.mock.calls[0][0].callServer).toBe(false);
		expect(runTerminateSession.mock.calls[0][0].skipRedirect).toBe(false);
	});

	it('callServer true delega MANUAL_LOGOUT (retrocompat)', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);
		const handler = createTerminateFromHydrateFailure(runTerminateSession);

		await handler(true);

		expect(runTerminateSession.mock.calls[0][0].reason).toBe('MANUAL_LOGOUT');
		expect(runTerminateSession.mock.calls[0][0].callServer).toBe(true);
	});

	it('consumeFetchMeError preserva error original en terminación', async () => {
		const error = { response: { status: 500, data: { detail: 'server error' } } };
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);
		const handler = createTerminateFromHydrateFailure(runTerminateSession, {
			consumeFetchMeError: () => error,
		});

		await handler(false);

		expect(runTerminateSession.mock.calls[0][0].error).toBe(error);
		expect(runTerminateSession.mock.calls[0][0].reason).toBe('HYDRATE_FAILED');
	});
});

describe('createHydrateFetchMeWithErrorCapture', () => {
	it('captura error en throw y lo expone vía ref', async () => {
		const error = new Error('fetchMe failed');
		const errorRef = { current: undefined as unknown };
		const wrapped = createHydrateFetchMeWithErrorCapture(async () => {
			throw error;
		}, errorRef);

		await expect(wrapped()).rejects.toBe(error);
		expect(errorRef.current).toBe(error);
	});

	it('limpia ref antes de cada invocación', async () => {
		const errorRef = { current: 'stale' as unknown };
		const wrapped = createHydrateFetchMeWithErrorCapture(async () => BASE_ME, errorRef);

		await wrapped();
		expect(errorRef.current).toBeUndefined();
	});
});

describe('hydrateSessionCore DI — me null → doLogout → HYDRATE_FAILED', () => {
	it('invoca doLogout(false) cuando fetchMe retorna null', async () => {
		const doLogout = vi.fn().mockResolvedValue(undefined);
		const deps = createMinimalHydrateDeps({
			fetchMe: async () => null,
			doLogout,
		});

		const result = await hydrateSessionCore({ mode: 'bootstrap' }, deps);

		expect(result).toBeNull();
		expect(doLogout).toHaveBeenCalledTimes(1);
		expect(doLogout).toHaveBeenCalledWith(false);
	});

	it('doLogout cableado a terminateSession produce HYDRATE_FAILED', async () => {
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
			callLogoutEndpoint: async () => undefined,
			clearQueryCache: () => undefined,
			showTerminationToast: () => undefined,
			redirectToLogin: () => undefined,
		});
		const runTerminateSession = (input: Parameters<typeof terminateSession>[0]) =>
			terminateSession(input, deps);
		const doLogout = createTerminateFromHydrateFailure(runTerminateSession);

		const hydrateDeps = createMinimalHydrateDeps({
			fetchMe: async () => null,
			doLogout,
		});

		await hydrateSessionCore({ mode: 'interceptor', skipBootstrapFlags: true }, hydrateDeps);

		expect(order).toEqual(['processQueue', 'clearLocalAuthState']);
	});
});

describe('executeHydrateFailureTermination', () => {
	it('preserva error original cuando se provee', async () => {
		const error = new Error('Post-refresh full hydration failed');
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);

		await executeHydrateFailureTermination(runTerminateSession, error);

		expect(runTerminateSession.mock.calls[0][0].error).toBe(error);
		expect(runTerminateSession.mock.calls[0][0].reason).toBe('HYDRATE_FAILED');
	});

	it('habilita redirect a login con query error', async () => {
		const runTerminateSession = vi.fn().mockResolvedValue(undefined);

		await executeHydrateFailureTermination(runTerminateSession);

		const input = runTerminateSession.mock.calls[0][0];
		expect(input.callServer).toBe(false);
		expect(input.skipRedirect).toBe(false);
	});
});

describe('regresión Fase 1 — hydrateSessionCore cuerpo congelado', () => {
	it('fetchMe OK no invoca doLogout', async () => {
		const doLogout = vi.fn();
		const deps = createMinimalHydrateDeps({ doLogout });

		await hydrateSessionCore({ mode: 'interceptor', skipBootstrapFlags: true }, deps);

		expect(doLogout).not.toHaveBeenCalled();
	});
});
