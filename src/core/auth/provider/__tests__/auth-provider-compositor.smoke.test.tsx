/**
 * IAM-FE-PHASE-09 IMPL-14 — Smoke compositor L9 (render AuthProvider + ensamblaje).
 */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthGate } from '@/core/auth/AuthGate';
import { AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS } from '@/core/auth/provider/auth-provider.types';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { AuthProvider, useAuth } from '@/shared/context/AuthContext';

function AuthConsumerProbe(): JSX.Element {
	const auth = useAuth();
	return (
		<div
			data-testid="auth-consumer"
			data-key-count={String(Object.keys(auth).length)}
			data-authenticated={String(auth.isAuthenticated)}
			data-bootstrapped={String(auth.isBootstrapped)}
			data-loading={String(auth.loading)}
		>
			consumer-ready
		</div>
	);
}

function renderAuthProviderTree(): ReturnType<typeof render> {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<AuthConsumerProbe />
			</AuthProvider>
		</QueryClientProvider>,
	);
}

describe('IAM-FE-PHASE-09 IMPL-14 — auth-provider-compositor smoke', () => {
	const originalPathname = window.location.pathname;

	beforeEach(() => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, pathname: '/login' },
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, pathname: originalPathname },
			writable: true,
			configurable: true,
		});
		vi.restoreAllMocks();
	});

	it('monta AuthProvider y expone useAuth() con 36 keys', async () => {
		renderAuthProviderTree();

		await waitFor(() => {
			expect(screen.getByTestId('auth-consumer')).toHaveTextContent('consumer-ready');
		});

		const consumer = screen.getByTestId('auth-consumer');
		expect(consumer.getAttribute('data-key-count')).toBe('36');
		expect(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).toHaveLength(36);
	});

	it('bootstrap /login completa isBootstrapped sin autenticar', async () => {
		renderAuthProviderTree();

		await waitFor(() => {
			expect(screen.getByTestId('auth-consumer')).toHaveAttribute('data-bootstrapped', 'true');
		});

		expect(screen.getByTestId('auth-consumer')).toHaveAttribute('data-authenticated', 'false');
		expect(screen.getByTestId('auth-consumer')).toHaveAttribute('data-loading', 'false');
	});

	it('desmontaje limpio sin errores', async () => {
		const { unmount } = renderAuthProviderTree();

		await waitFor(() => {
			expect(screen.getByTestId('auth-consumer')).toBeInTheDocument();
		});

		expect(() => unmount()).not.toThrow();
	});

	it('AuthProvider renderiza children tras binders Fase D', async () => {
		renderAuthProviderTree();

		await waitFor(() => {
			expect(screen.getByTestId('auth-consumer')).toBeInTheDocument();
		});
	});

	it('callbacks públicos principales son funciones en contexto', async () => {
		let captured: ReturnType<typeof useAuth> | null = null;

		function CaptureAuth(): JSX.Element {
			captured = useAuth();
			return <div data-testid="capture">ok</div>;
		}

		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
		});

		render(
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<CaptureAuth />
				</AuthProvider>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('capture')).toBeInTheDocument();
		});

		expect(typeof captured?.logout).toBe('function');
		expect(typeof captured?.setAuthFromLogin).toBe('function');
		expect(typeof captured?.reloadMenuAndPermissions).toBe('function');
		expect(typeof captured?.hasRole).toBe('function');
		expect(typeof captured?.startImpersonation).toBe('function');
		expect(typeof captured?.runSessionValidityProbe).toBe('function');
	});
});

describe('IAM-FE-PHASE-09 IMPL-14 — V9.3 smoke (AuthGate + ProtectedRoute)', () => {
	const originalPathname = window.location.pathname;

	function renderWithAuthProvider(ui: ReactNode): ReturnType<typeof render> {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
		});

		return render(
			<QueryClientProvider client={queryClient}>
				<AuthProvider>{ui}</AuthProvider>
			</QueryClientProvider>,
		);
	}

	beforeEach(() => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, pathname: '/login' },
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, pathname: originalPathname },
			writable: true,
			configurable: true,
		});
		vi.restoreAllMocks();
	});

	it('AuthGate renderiza children tras bootstrap AuthProvider', async () => {
		renderWithAuthProvider(
			<AuthGate>
				<div data-testid="gate-child">App</div>
			</AuthGate>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('gate-child')).toBeInTheDocument();
		});
	});

	it('ProtectedRoute oculta children sin sesión activa', async () => {
		render(
			<QueryClientProvider
				client={
					new QueryClient({
						defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
					})
				}
			>
				<MemoryRouter initialEntries={['/app/dashboard']}>
					<AuthProvider>
						<ProtectedRoute>
							<div data-testid="protected-child">Secreto</div>
						</ProtectedRoute>
					</AuthProvider>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument();
		});
	});
});
