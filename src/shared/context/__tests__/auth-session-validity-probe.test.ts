import { describe, expect, it, vi } from 'vitest';

import type { UserData } from '@/features/auth/types/auth.types';
import {
	getSessionValidityProbeDeps,
	runSessionValidityProbe,
} from '@/shared/context/AuthContext';

const mockUser: UserData = {
	usuario_id: 'user-1',
	cliente_id: 'client-1',
	access_level: 1,
	is_super_admin: false,
	user_type: 'user',
	cliente: null,
	empresa_activa: null,
	empresas_disponibles: [],
	es_admin_cliente: false,
	requires_password_change: false,
};

function createDeps(overrides?: {
	fetchMe?: () => Promise<UserData | null>;
	isProbeInFlightRef?: { current: boolean };
}) {
	const isProbeInFlightRef = overrides?.isProbeInFlightRef ?? { current: false };
	return getSessionValidityProbeDeps({
		isProbeInFlightRef,
		fetchMe:
			overrides?.fetchMe ??
			(async () => {
				return mockUser;
			}),
	});
}

describe('runSessionValidityProbe (IMPL-05)', () => {
	describe('single-flight', () => {
		it('retorna inmediatamente si ya hay probe en ejecución', async () => {
			const fetchMe = vi.fn(
				() =>
					new Promise<UserData | null>((resolve) => {
						setTimeout(() => resolve(mockUser), 50);
					}),
			);
			const isProbeInFlightRef = { current: false };
			const deps = createDeps({ fetchMe, isProbeInFlightRef });

			const first = runSessionValidityProbe(deps);
			expect(isProbeInFlightRef.current).toBe(true);

			await runSessionValidityProbe(deps);

			await first;

			expect(fetchMe).toHaveBeenCalledTimes(1);
		});
	});

	describe('éxito 200', () => {
		it('invoca fetchMe y completa sin error', async () => {
			const fetchMe = vi.fn().mockResolvedValue(mockUser);
			const deps = createDeps({ fetchMe });

			await expect(runSessionValidityProbe(deps)).resolves.toBeUndefined();

			expect(fetchMe).toHaveBeenCalledTimes(1);
		});

		it('descarta resultado de fetchMe sin efectos colaterales en el orquestador', async () => {
			const fetchMe = vi.fn().mockResolvedValue(mockUser);
			const deps = createDeps({ fetchMe });

			const result = await runSessionValidityProbe(deps);

			expect(result).toBeUndefined();
			expect(fetchMe).toHaveBeenCalledTimes(1);
		});
	});

	describe('401 delega al interceptor', () => {
		it('no envuelve fetchMe en catch — propaga rechazo del caller HTTP', async () => {
			const axios401 = {
				response: { status: 401, data: { detail: 'Sesión expirada' } },
				config: { url: '/auth/me/' },
			};
			const fetchMe = vi.fn().mockRejectedValue(axios401);
			const deps = createDeps({ fetchMe });

			await expect(runSessionValidityProbe(deps)).rejects.toEqual(axios401);
			expect(fetchMe).toHaveBeenCalledTimes(1);
		});

		it('acepta null de authService.me tras 401 sin invocar terminate local', async () => {
			const fetchMe = vi.fn().mockResolvedValue(null);
			const deps = createDeps({ fetchMe });

			await expect(runSessionValidityProbe(deps)).resolves.toBeUndefined();

			expect(fetchMe).toHaveBeenCalledTimes(1);
		});
	});

	describe('limpieza del ref en finally', () => {
		it('restablece isProbeInFlightRef tras éxito', async () => {
			const isProbeInFlightRef = { current: false };
			const deps = createDeps({ isProbeInFlightRef });

			await runSessionValidityProbe(deps);

			expect(isProbeInFlightRef.current).toBe(false);
		});

		it('restablece isProbeInFlightRef tras error', async () => {
			const isProbeInFlightRef = { current: false };
			const fetchMe = vi.fn().mockRejectedValue(new Error('network'));
			const deps = createDeps({ fetchMe, isProbeInFlightRef });

			await expect(runSessionValidityProbe(deps)).rejects.toThrow('network');

			expect(isProbeInFlightRef.current).toBe(false);
		});
	});
});

describe('getSessionValidityProbeDeps (IMPL-05)', () => {
	it('expone isProbeInFlightRef y fetchMe sin transformación', () => {
		const isProbeInFlightRef = { current: false };
		const fetchMe = vi.fn().mockResolvedValue(null);

		const deps = getSessionValidityProbeDeps({ isProbeInFlightRef, fetchMe });

		expect(deps.isProbeInFlightRef).toBe(isProbeInFlightRef);
		expect(deps.fetchMe).toBe(fetchMe);
	});
});
