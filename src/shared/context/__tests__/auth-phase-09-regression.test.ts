/**
 * IAM-FE-PHASE-09 IMPL-14 — Regresión V9.x (L9 compositor vs monolito).
 *
 * Valida ensamblaje useAuthProvider, compositors integrados y contrato público
 * sin modificar comportamiento runtime (tests estructurales + manifesto).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
	AUTH_PROVIDER_ASSEMBLY_PHASE_ORDER,
	AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS,
} from '@/core/auth/provider/auth-provider.types';

const ROOT = process.cwd();

export const PHASE_09_REGRESSION_SUITE_MANIFEST = {
	phase09Regression: 'src/shared/context/__tests__/auth-phase-09-regression.test.ts',
	phase09Smoke: 'src/core/auth/provider/__tests__/auth-provider-compositor.smoke.test.tsx',
	phase09Contract: 'src/core/auth/provider/__tests__/auth-provider-contract.test.ts',
	phase09Acyclic: 'src/core/auth/provider/__tests__/auth-provider-acyclic-imports.test.ts',
	phase08Regression: 'src/shared/context/__tests__/auth-phase-08-regression.test.ts',
	phase07Regression: 'src/shared/context/__tests__/auth-phase-07-regression.test.ts',
	phase06Regression: 'src/shared/context/__tests__/auth-phase-06-regression.test.ts',
	phase05Regression: 'src/shared/context/__tests__/auth-phase-05-regression.test.ts',
	phase04Regression: 'src/shared/context/__tests__/auth-phase-04-regression.test.ts',
	phase03Regression: 'src/shared/context/__tests__/auth-phase-03-regression.test.ts',
	phase02Closure: 'src/shared/context/__tests__/auth-phase-02-closure.test.ts',
} as const;

function readSource(relativePath: string): string {
	return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readUseAuthProviderSource(): string {
	return readSource('src/core/auth/provider/useAuthProvider.ts');
}

function readAuthContextShellSource(): string {
	return readSource('src/shared/context/AuthContext.tsx');
}

function readProviderSource(): string {
	return readSource('src/app/provider.tsx');
}

const L9_COMPOSITOR_HOOKS = [
	'useAuthProviderState',
	'useAuthProviderPermissionsDetermineUserType',
	'useAuthProviderImpersonationEarlyRuntime',
	'useAuthProviderEmpresaSessionSync',
	'useAuthProviderPermissionsMenuRuntime',
	'useAuthProviderRefreshUrlPolicy',
	'useAuthProviderCleanup',
	'useAuthProviderTerminationRuntime',
	'useAuthProviderEmitAuthSyncSessionToken',
	'useAuthProviderEmpresaElegiblesLoader',
	'useAuthProviderBootstrapHydrate',
	'useAuthProviderRunPostRefreshSession',
	'useAuthProviderImpersonationLateRuntime',
	'useAuthProviderRequestInterceptorEffect',
	'useAuthProviderResponseInterceptorEffect',
	'useAuthProviderBootstrapEffect',
	'useAuthProviderPublicActions',
	'useAuthProviderAuthSyncListenerDeps',
] as const;

describe('IAM-FE-PHASE-09 regression (IMPL-14) — V9.2 L9 assembly', () => {
	it('V9.2.a — AuthContext shell delega a useAuthProvider (≤250 líneas, sin session/*)', () => {
		const shell = readAuthContextShellSource();
		const lineCount = shell.split('\n').length;

		expect(lineCount).toBeLessThanOrEqual(250);
		expect(shell).toContain('useAuthProvider');
		expect(shell).toContain('<AuthContext.Provider value={contextValue}>');
		expect(shell).toContain('{renderProviderTree(children)}');
		expect(shell).not.toMatch(/from\s+['"]@\/core\/auth\/session\//);
		expect(shell).not.toMatch(/from\s+['"].*\/session\//);
	});

	it('V9.2.b — useAuthProvider es ensamblador único de compositors L9', () => {
		const assembly = readUseAuthProviderSource();

		for (const hook of L9_COMPOSITOR_HOOKS) {
			expect(assembly).toContain(hook);
		}

		expect(assembly).toContain('AuthProviderPhaseDBinders');
		expect(assembly).toMatch(/return\s*\{\s*contextValue,\s*renderProviderTree,/);
	});

	it('V9.2.c — orden ensamblaje Fase A→B→C→D (types L9)', () => {
		expect(AUTH_PROVIDER_ASSEMBLY_PHASE_ORDER).toEqual(['A', 'B', 'C', 'D']);
	});

	it('V9.2.d — refresh compositor cableado (E5/E6 + post-refresh)', () => {
		const assembly = readUseAuthProviderSource();
		const interceptors = readSource('src/core/auth/provider/auth-provider-interceptors.compositor.ts');
		const refresh = readSource('src/core/auth/provider/auth-provider-refresh.compositor.ts');

		expect(assembly).toContain('useAuthProviderRunPostRefreshSession');
		expect(interceptors).toContain('useAuthProviderRequestInterceptorEffect');
		expect(interceptors).toContain('useAuthProviderResponseInterceptorEffect');
		expect(refresh).toContain('runPostRefreshSession');
	});

	it('V9.2.e — termination compositor runtime (V2 + legacy deps)', () => {
		const assembly = readUseAuthProviderSource();
		const termination = readSource('src/core/auth/provider/auth-provider-termination.compositor.ts');

		expect(assembly).toContain('useAuthProviderTerminationRuntime');
		expect(termination).toContain('runTerminateSession');
		expect(termination).toContain('runSessionValidityProbeForSession');
	});

	it('V9.2.f — bootstrap compositor E7 (hydrate + effect)', () => {
		const assembly = readUseAuthProviderSource();
		const bootstrap = readSource('src/core/auth/provider/auth-provider-bootstrap.compositor.ts');

		expect(assembly).toContain('useAuthProviderBootstrapHydrate');
		expect(assembly).toContain('useAuthProviderBootstrapEffect');
		expect(bootstrap).toContain('initializeAuth');
		expect(bootstrap).toContain('runBootstrap');
	});

	it('V9.2.g — impersonation compositors early + late', () => {
		const assembly = readUseAuthProviderSource();
		const impersonation = readSource('src/core/auth/provider/auth-provider-impersonation.compositor.ts');

		expect(assembly).toContain('useAuthProviderImpersonationEarlyRuntime');
		expect(assembly).toContain('useAuthProviderImpersonationLateRuntime');
		expect(impersonation).toContain('runImpersonationControlledExit');
		expect(impersonation).toContain('restorePlatformSession');
	});

	it('V9.2.h — empresa compositor (sync + elegibles loader)', () => {
		const assembly = readUseAuthProviderSource();
		const empresa = readSource('src/core/auth/provider/auth-provider-empresa.compositor.ts');
		const publicActions = readSource('src/core/auth/provider/auth-provider-public-actions.ts');

		expect(assembly).toContain('useAuthProviderEmpresaSessionSync');
		expect(assembly).toContain('useAuthProviderEmpresaElegiblesLoader');
		expect(empresa).toContain('syncEmpresaSession');
		expect(publicActions).toContain('completeEmpresaSelection');
		expect(publicActions).toContain('cambiarEmpresaActiva');
	});

	it('V9.2.i — permissions compositor (determineUserType + menu runtime)', () => {
		const assembly = readUseAuthProviderSource();
		const permissions = readSource('src/core/auth/provider/auth-provider-permissions.compositor.ts');
		const publicActions = readSource('src/core/auth/provider/auth-provider-public-actions.ts');

		expect(assembly).toContain('useAuthProviderPermissionsDetermineUserType');
		expect(assembly).toContain('useAuthProviderPermissionsMenuRuntime');
		expect(permissions).toContain('loadMenuAndPermissionsFromAuthMenu');
		expect(publicActions).toContain('reloadMenuAndPermissions');
		expect(publicActions).toContain('hasRole');
	});

	it('V9.2.j — auth-sync compositor (emit + listener deps)', () => {
		const assembly = readUseAuthProviderSource();
		const authSync = readSource('src/core/auth/provider/auth-provider-auth-sync.compositor.ts');
		const telemetry = readSource('src/core/auth/provider/auth-provider-telemetry-ux.compositor.tsx');

		expect(assembly).toContain('useAuthProviderEmitAuthSyncSessionToken');
		expect(assembly).toContain('useAuthProviderAuthSyncListenerDeps');
		expect(authSync).toContain('getAuthSyncListenerDeps');
		expect(telemetry).toContain('AuthSyncListenerBinder');
	});

	it('V9.2.k — public-actions construye contextValue (36 keys)', () => {
		const publicActions = readSource('src/core/auth/provider/auth-provider-public-actions.ts');

		expect(publicActions).toContain('useAuthProviderPublicActions');
		expect(publicActions).toMatch(/useMemo\s*<\s*AuthProviderContextValue\s*>/);
		expect(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).toHaveLength(36);
		expect(new Set(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).size).toBe(36);
	});

	it('V9.2.l — legacy huérfanos eliminados (IMPL-13)', () => {
		expect(() => readSource('src/services/auth.service.ts')).toThrow();
		expect(() => readSource('src/context/TenantContext.tsx')).toThrow();
	});

	it('V9.2.m — artefactos rollback F9 eliminados (SIGNOFF-02 §22.2 #4)', () => {
		expect(() => readSource('src/core/auth/provider/AuthContext.monolith.snapshot.ts')).toThrow();
		expect(() => readSource('src/core/auth/provider/auth-provider.flags.ts')).toThrow();
		expect(() => readSource('src/core/auth/provider/__tests__/auth-provider.flags.test.ts')).toThrow();
	});

	it('manifesto — suites Phase 09 definidas', () => {
		expect(PHASE_09_REGRESSION_SUITE_MANIFEST.phase09Regression).toContain('auth-phase-09-regression');
		expect(PHASE_09_REGRESSION_SUITE_MANIFEST.phase09Smoke).toContain('auth-provider-compositor.smoke');
		expect(PHASE_09_REGRESSION_SUITE_MANIFEST.phase08Regression).toContain('auth-phase-08-regression');
	});
});

describe('IAM-FE-PHASE-09 regression (IMPL-14) — V9.3 Provider tree (estructural)', () => {
	it('V9.3.a — ProtectedRoute consume useAuth del shell AuthContext', () => {
		const source = readSource('src/shared/components/ProtectedRoute.tsx');
		expect(source).toContain("from '../context/AuthContext'");
		expect(source).toContain('useAuth()');
		expect(source).toContain('isAuthenticated');
	});

	it('V9.3.b — AuthGate consume isBootstrapped de useAuth', () => {
		const source = readSource('src/core/auth/AuthGate.tsx');
		expect(source).toContain('useAuth');
		expect(source).toContain('isBootstrapped');
		expect(source).toContain('isSessionBootstrapGateActive');
	});

	it('V9.3.c — provider.tsx orden invariante Auth → SessionUxBinder → AuthGate → Tenant → Permission', () => {
		const source = readProviderSource();
		const authIdx = source.indexOf('<AuthProvider>');
		const uxIdx = source.indexOf('<SessionUxBinder>');
		const gateIdx = source.indexOf('<AuthGate>');
		const tenantIdx = source.indexOf('<TenantProvider>');
		const permissionIdx = source.indexOf('<PermissionProvider>');

		expect(authIdx).toBeGreaterThan(-1);
		expect(uxIdx).toBeGreaterThan(authIdx);
		expect(gateIdx).toBeGreaterThan(uxIdx);
		expect(tenantIdx).toBeGreaterThan(gateIdx);
		expect(permissionIdx).toBeGreaterThan(tenantIdx);
	});

	it('V9.3.d — AppReadyGate respeta loading auth + permission', () => {
		const source = readProviderSource();
		expect(source).toContain('function AppReadyGate');
		expect(source).toContain('authLoading');
		expect(source).toContain('permissionLoading');
		expect(source).toContain('isSessionBootstrapGateActive');
	});

	it('V9.3.e — SessionUxBinder es sibling bajo AuthProvider (no dentro compositor)', () => {
		const provider = readProviderSource();
		const assembly = readUseAuthProviderSource();

		expect(provider).toContain('<AuthProvider>');
		expect(provider).toContain('<SessionUxBinder>');
		expect(assembly).not.toContain('SessionUxBinder');
	});
});
