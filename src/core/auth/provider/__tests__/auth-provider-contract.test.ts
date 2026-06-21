/**
 * IAM-FE-PHASE-09 IMPL-04 — V9.1 contract tests (baseline monolito pre-refactor).
 *
 * Contratos puramente estructurales: sin render, sin mocks de AuthProvider, sin wiring L9.
 * Fuente canónica: IMPL-01 §2 (40 exports) y §12 (36 keys useAuth).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS } from '@/core/auth/provider/auth-provider.types';
import * as AuthContextModule from '@/shared/context/AuthContext';

const ROOT = process.cwd();
const AUTH_CONTEXT_PATH = path.join(ROOT, 'src/shared/context/AuthContext.tsx');
const USE_AUTH_PROVIDER_PATH = path.join(ROOT, 'src/core/auth/provider/useAuthProvider.ts');
const PUBLIC_ACTIONS_PATH = path.join(ROOT, 'src/core/auth/provider/auth-provider-public-actions.ts');

/** Lista canónica IMPL-01 §12 — orden interface AuthContextType L676–721. */
export const AUTH_CONTEXT_PUBLIC_KEYS_V9 = [
	'auth',
	'setAuthFromLogin',
	'completeEmpresaSelection',
	'cambiarEmpresaActiva',
	'logout',
	'logoutAllSessions',
	'runSessionValidityProbe',
	'isAuthenticated',
	'loading',
	'authInitialized',
	'isBootstrapped',
	'hasRole',
	'accessLevel',
	'isSuperAdmin',
	'userType',
	'clienteInfo',
	'permissions',
	'menuModulos',
	'menuPermissionsReady',
	'empresaActivaId',
	'empresasElegibles',
	'empresasDisponibles',
	'requiereSeleccionEmpresa',
	'esAdminCliente',
	'hasEmpresaActivaFlag',
	'canAccessErp',
	'mustSelectEmpresa',
	'reloadMenuAndPermissions',
	'isImpersonation',
	'impersonatedBy',
	'impersonatedByUsername',
	'impersonationClienteLabel',
	'startImpersonation',
	'endImpersonation',
	'requiresPasswordChange',
	'completePasswordChange',
] as const;

/** Allowlist IMPL-01 §2 — 39 declaraciones `export` en fuente (2+10+25+2; IMPL-01 nota 39 símbolos). */
export const AUTH_CONTEXT_EXPORT_ALLOWLIST_V9 = [
	'AUTH_REFRESH_TERMINATION_URL',
	'GetTerminateSessionDepsParams',
	'getTerminateSessionDeps',
	'createAuthTerminateRedirectToLogin',
	'AuthTerminationToastApi',
	'createAuthShowTerminationToast',
	'LEGACY_SESSION_QUEUE_ERROR_MESSAGE',
	'LegacySessionLogoutDeps',
	'performLegacySessionLogout',
	'buildTerminationClearQueryCache',
	'RunSessionTerminationExitOptions',
	'runSessionTerminationExit',
	'extractTerminationHttpContextFromError',
	'buildBootstrapTerminationClassifyInput',
	'buildInterceptorRefreshTerminationClassifyInput',
	'buildTerminateSessionInput',
	'buildDoLogoutTerminateInput',
	'executeDoLogoutTermination',
	'buildLogoutAllTerminateInput',
	'GetLogoutAllFlowDepsParams',
	'getLogoutAllFlowDeps',
	'executeLogoutAllTermination',
	'SessionValidityProbeDeps',
	'GetSessionValidityProbeDepsParams',
	'getSessionValidityProbeDeps',
	'runSessionValidityProbe',
	'buildInterceptorTerminationClassifyInput',
	'ExecuteClassifiedTerminationOptions',
	'executeClassifiedTermination',
	'executeBootstrapRefreshTermination',
	'executeInterceptorRefreshTermination',
	'buildHydrateFailureClassifyInput',
	'executeHydrateFailureTermination',
	'HydrateFetchMeErrorRef',
	'createHydrateFetchMeWithErrorCapture',
	'CreateTerminateFromHydrateFailureOptions',
	'createTerminateFromHydrateFailure',
	'AuthProvider',
	'useAuth',
] as const;

/** Interfaces exportadas — presentes en fuente; no importables en runtime ESM. */
export const AUTH_CONTEXT_EXPORT_TYPE_ALLOWLIST_V9 = [
	'GetTerminateSessionDepsParams',
	'AuthTerminationToastApi',
	'LegacySessionLogoutDeps',
	'RunSessionTerminationExitOptions',
	'GetLogoutAllFlowDepsParams',
	'SessionValidityProbeDeps',
	'GetSessionValidityProbeDepsParams',
	'ExecuteClassifiedTerminationOptions',
	'HydrateFetchMeErrorRef',
	'CreateTerminateFromHydrateFailureOptions',
] as const;

/** Valores runtime importables desde @/shared/context/AuthContext (39 − 10 interfaces). */
export const AUTH_CONTEXT_EXPORT_VALUE_ALLOWLIST_V9 = [
	'AUTH_REFRESH_TERMINATION_URL',
	'getTerminateSessionDeps',
	'createAuthTerminateRedirectToLogin',
	'createAuthShowTerminationToast',
	'LEGACY_SESSION_QUEUE_ERROR_MESSAGE',
	'performLegacySessionLogout',
	'buildTerminationClearQueryCache',
	'runSessionTerminationExit',
	'extractTerminationHttpContextFromError',
	'buildBootstrapTerminationClassifyInput',
	'buildInterceptorRefreshTerminationClassifyInput',
	'buildTerminateSessionInput',
	'buildDoLogoutTerminateInput',
	'executeDoLogoutTermination',
	'buildLogoutAllTerminateInput',
	'getLogoutAllFlowDeps',
	'executeLogoutAllTermination',
	'getSessionValidityProbeDeps',
	'runSessionValidityProbe',
	'buildInterceptorTerminationClassifyInput',
	'executeClassifiedTermination',
	'executeBootstrapRefreshTermination',
	'executeInterceptorRefreshTermination',
	'buildHydrateFailureClassifyInput',
	'executeHydrateFailureTermination',
	'createHydrateFetchMeWithErrorCapture',
	'createTerminateFromHydrateFailure',
	'AuthProvider',
	'useAuth',
] as const;

/** Callbacks públicos expuestos vía context value — IMPL-01 §7. */
export const AUTH_CONTEXT_PUBLIC_CALLBACK_KEYS_V9 = [
	'setAuthFromLogin',
	'completeEmpresaSelection',
	'cambiarEmpresaActiva',
	'logout',
	'logoutAllSessions',
	'runSessionValidityProbe',
	'hasRole',
	'reloadMenuAndPermissions',
	'startImpersonation',
	'endImpersonation',
	'completePasswordChange',
] as const;

/** Defaults createContext L728–765 — IMPL-01 + plan §13. */
export const AUTH_CONTEXT_DEFAULT_SCALAR_SNAPSHOT_V9 = {
	isAuthenticated: false,
	loading: true,
	authInitialized: false,
	isBootstrapped: false,
	accessLevel: 0,
	isSuperAdmin: false,
	userType: 'user',
	menuPermissionsReady: false,
	empresaActivaId: null,
	requiereSeleccionEmpresa: false,
	esAdminCliente: false,
	hasEmpresaActivaFlag: false,
	canAccessErp: false,
	mustSelectEmpresa: false,
	isImpersonation: false,
	impersonatedBy: null,
	impersonatedByUsername: null,
	impersonationClienteLabel: null,
	requiresPasswordChange: false,
} as const;

function readAuthContextSource(): string {
	return readFileSync(AUTH_CONTEXT_PATH, 'utf8');
}

function readUseAuthProviderSource(): string {
	return readFileSync(USE_AUTH_PROVIDER_PATH, 'utf8');
}

function readPublicActionsSource(): string {
	return readFileSync(PUBLIC_ACTIONS_PATH, 'utf8');
}

function readContextValueAssemblySource(): string {
	const authContext = readAuthContextSource();
	if (authContext.includes('const value = useMemo<AuthContextType>')) {
		return authContext;
	}
	return readPublicActionsSource();
}

function extractInterfacePropertyKeys(source: string, interfaceName: string): string[] {
	const startMarker = `interface ${interfaceName} {`;
	const start = source.indexOf(startMarker);
	if (start === -1) {
		throw new Error(`interface ${interfaceName} not found in AuthContext.tsx`);
	}

	const bodyStart = start + startMarker.length;
	let depth = 1;
	let bodyEnd = bodyStart;

	for (let i = bodyStart; i < source.length; i += 1) {
		const char = source[i];
		if (char === '{') {
			depth += 1;
		} else if (char === '}') {
			depth -= 1;
			if (depth === 0) {
				bodyEnd = i;
				break;
			}
		}
	}

	const body = source.slice(bodyStart, bodyEnd);
	const keys: string[] = [];
	const keyRegex = /^\t(\w+):/gm;
	let match: RegExpExecArray | null = keyRegex.exec(body);
	while (match !== null) {
		keys.push(match[1]);
		match = keyRegex.exec(body);
	}

	return keys;
}

function extractReExportSymbols(source: string): string[] {
	const symbols: string[] = [];
	const reExportRegex = /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/gs;
	let match: RegExpExecArray | null = reExportRegex.exec(source);
	while (match !== null) {
		for (const part of match[1].split(',')) {
			const cleaned = part.trim().replace(/^type\s+/, '');
			const name = cleaned.split(/\s+as\s+/)[0]?.trim();
			if (name) {
				symbols.push(name);
			}
		}
		match = reExportRegex.exec(source);
	}
	return symbols;
}

function extractNamedExportSymbols(source: string): string[] {
	const symbols: string[] = [];
	const patterns = [
		/^export const (\w+)/gm,
		/^export function (\w+)/gm,
		/^export async function (\w+)/gm,
		/^export interface (\w+)/gm,
	];

	for (const pattern of patterns) {
		let match: RegExpExecArray | null = pattern.exec(source);
		while (match !== null) {
			symbols.push(match[1]);
			match = pattern.exec(source);
		}
	}

	return [...symbols, ...extractReExportSymbols(source)];
}

function extractCreateContextDefaultBlock(source: string): string {
	const marker = 'createContext<AuthContextType>({';
	const start = source.indexOf(marker);
	if (start === -1) {
		throw new Error('createContext<AuthContextType> default block not found');
	}

	const blockStart = start + marker.length;
	let depth = 1;
	let blockEnd = blockStart;

	for (let i = blockStart; i < source.length; i += 1) {
		const char = source[i];
		if (char === '{') {
			depth += 1;
		} else if (char === '}') {
			depth -= 1;
			if (depth === 0) {
				blockEnd = i;
				break;
			}
		}
	}

	return source.slice(blockStart, blockEnd);
}

function extractContextValueBlock(source: string): string {
	const match = source.match(
		/const contextValue = useMemo<AuthProviderContextValue>\(\s*\(\) => \(\{/,
	);
	const altMatch = source.match(/const value = useMemo<AuthContextType>\(\s*\(\) => \(\{/);
	const startMatch = match ?? altMatch;
	if (!startMatch || startMatch.index === undefined) {
		throw new Error('context value useMemo block not found');
	}

	const blockStart = startMatch.index + startMatch[0].length;
	let depth = 1;
	let blockEnd = blockStart;

	for (let i = blockStart; i < source.length; i += 1) {
		const char = source[i];
		if (char === '{') {
			depth += 1;
		} else if (char === '}') {
			depth -= 1;
			if (depth === 0) {
				blockEnd = i;
				break;
			}
		}
	}

	return source.slice(blockStart, blockEnd);
}

function arraysEqual<T>(left: readonly T[], right: readonly T[]): boolean {
	return left.length === right.length && left.every((value, index) => value === right[index]);
}

describe('IAM-FE-PHASE-09 IMPL-04 — V9.1 contract baseline', () => {
	const source = readAuthContextSource();
	const assemblySource = readContextValueAssemblySource();
	const authContextTypeKeys = extractInterfacePropertyKeys(source, 'AuthContextType');
	const exportSymbols = extractNamedExportSymbols(source);
	const createContextDefaults = extractCreateContextDefaultBlock(source);
	const contextValueBlock = extractContextValueBlock(assemblySource);

	describe('V9.1.a — AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS (36 keys useAuth)', () => {
		it('tiene exactamente 36 keys únicas', () => {
			expect(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).toHaveLength(36);
			expect(new Set(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).size).toBe(36);
		});

		it('coincide byte-a-byte con lista canónica IMPL-01 §12', () => {
			expect([...AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS]).toEqual([
				...AUTH_CONTEXT_PUBLIC_KEYS_V9,
			]);
		});

		it('coincide en orden y contenido con interface AuthContextType del monolito', () => {
			expect(authContextTypeKeys).toHaveLength(36);
			expect(arraysEqual(authContextTypeKeys, AUTH_CONTEXT_PUBLIC_KEYS_V9)).toBe(true);
			expect(arraysEqual(authContextTypeKeys, AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS)).toBe(
				true,
			);
		});
	});

	describe('V9.1.b — AuthContextType keys vs types L9', () => {
		it('falla si el monolito pierde o agrega una key pública', () => {
			const canonicalSet = new Set(AUTH_CONTEXT_PUBLIC_KEYS_V9);
			const monolithSet = new Set(authContextTypeKeys);

			const added = authContextTypeKeys.filter((key) => !canonicalSet.has(key));
			const removed = AUTH_CONTEXT_PUBLIC_KEYS_V9.filter((key) => !monolithSet.has(key));

			expect(added, `keys nuevas no permitidas: ${added.join(', ')}`).toEqual([]);
			expect(removed, `keys eliminadas: ${removed.join(', ')}`).toEqual([]);
		});
	});

	describe('V9.1.c — superficie export AuthContext (39 declaraciones fuente)', () => {
		it('allowlist IMPL-01 tiene exactamente 39 símbolos en fuente', () => {
			expect(AUTH_CONTEXT_EXPORT_ALLOWLIST_V9).toHaveLength(39);
			expect(new Set(AUTH_CONTEXT_EXPORT_ALLOWLIST_V9).size).toBe(39);
		});

		it('monolito expone exactamente 39 exports nombrados en fuente', () => {
			expect(exportSymbols).toHaveLength(39);
			expect(new Set(exportSymbols).size).toBe(39);
		});

		it('exports del monolito coinciden con allowlist verificada (sin altas/bajas)', () => {
			expect([...exportSymbols].sort()).toEqual(
				[...AUTH_CONTEXT_EXPORT_ALLOWLIST_V9].sort(),
			);
		});

		it('10 interfaces exportadas existen en helpers + re-export AuthContext', () => {
			const helpersPath = path.join(
				ROOT,
				'src/core/auth/provider/auth-provider-termination.helpers.ts',
			);
			const helpersSource = readFileSync(helpersPath, 'utf8');

			for (const typeName of AUTH_CONTEXT_EXPORT_TYPE_ALLOWLIST_V9) {
				expect(helpersSource).toMatch(new RegExp(`export interface ${typeName}\\b`));
				expect(source).toMatch(new RegExp(`\\b${typeName}\\b`));
			}
		});

		it('29 valores runtime son importables desde @/shared/context/AuthContext', () => {
			expect(AUTH_CONTEXT_EXPORT_VALUE_ALLOWLIST_V9).toHaveLength(29);
			const moduleRecord = AuthContextModule as Record<string, unknown>;

			for (const symbol of AUTH_CONTEXT_EXPORT_VALUE_ALLOWLIST_V9) {
				expect(moduleRecord[symbol], `missing export: ${symbol}`).toBeDefined();
			}

			const moduleKeys = Object.keys(moduleRecord).sort();
			expect(moduleKeys).toEqual([...AUTH_CONTEXT_EXPORT_VALUE_ALLOWLIST_V9].sort());
		});

		it('clasificación estructural de exports runtime vs helpers', () => {
			expect(typeof AuthContextModule.AuthProvider).toBe('function');
			expect(typeof AuthContextModule.useAuth).toBe('function');
			expect(typeof AuthContextModule.getTerminateSessionDeps).toBe('function');
			expect(typeof AuthContextModule.AUTH_REFRESH_TERMINATION_URL).toBe('string');
			expect(typeof AuthContextModule.LEGACY_SESSION_QUEUE_ERROR_MESSAGE).toBe('string');
		});
	});

	describe('V9.1.d — callbacks públicos del contexto', () => {
		it('los 11 callbacks públicos están en las 36 keys', () => {
			for (const callbackKey of AUTH_CONTEXT_PUBLIC_CALLBACK_KEYS_V9) {
				expect(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).toContain(callbackKey);
				expect(authContextTypeKeys).toContain(callbackKey);
			}
		});

		it('callbacks públicos cubren los 11 handlers IMPL-01 §7', () => {
			expect(AUTH_CONTEXT_PUBLIC_CALLBACK_KEYS_V9).toHaveLength(11);
			const callbackSource = `${source}\n${readPublicActionsSource()}`;
			for (const callbackKey of AUTH_CONTEXT_PUBLIC_CALLBACK_KEYS_V9) {
				expect(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).toContain(callbackKey);
				expect(authContextTypeKeys).toContain(callbackKey);
				expect(callbackSource).toMatch(new RegExp(`\\b${callbackKey}:`));
			}
		});
	});

	describe('V9.1.e — isAuthenticated derivado', () => {
		it('context value usa !!auth.token && !!auth.user (IMPL-01 §12)', () => {
			expect(contextValueBlock).toMatch(
				/isAuthenticated:\s*!!auth\.token\s*&&\s*!!auth\.user/,
			);
		});

		it('default createContext isAuthenticated es false', () => {
			expect(createContextDefaults).toMatch(/isAuthenticated:\s*false/);
		});
	});

	describe('V9.1.f — empresasDisponibles alias', () => {
		it('context value asigna empresasDisponibles: empresasElegibles', () => {
			expect(contextValueBlock).toMatch(/empresasDisponibles:\s*empresasElegibles/);
		});

		it('AuthContextType declara empresasDisponibles como alias deprecated', () => {
			expect(source).toMatch(
				/\/\*\* @deprecated Alias de empresasElegibles \*\/\s*\n\tempresasDisponibles:/,
			);
		});

		it('default createContext inicializa ambos arrays vacíos', () => {
			expect(createContextDefaults).toMatch(/empresasElegibles:\s*\[\]/);
			expect(createContextDefaults).toMatch(/empresasDisponibles:\s*\[\]/);
		});
	});

	describe('V9.1.g — defaults createContext (stubs L728–765)', () => {
		it('auth inicial { user: null, token: null }', () => {
			expect(createContextDefaults).toMatch(/auth:\s*initialAuth/);
			expect(source).toMatch(/const initialAuth:\s*AuthState\s*=\s*\{\s*user:\s*null,\s*token:\s*null\s*\}/);
		});

		it('scalars con defaults congelados', () => {
			for (const [key, expected] of Object.entries(
				AUTH_CONTEXT_DEFAULT_SCALAR_SNAPSHOT_V9,
			)) {
				if (expected === null) {
					expect(createContextDefaults).toMatch(new RegExp(`${key}:\\s*null`));
				} else if (typeof expected === 'boolean') {
					expect(createContextDefaults).toMatch(
						new RegExp(`${key}:\\s*${String(expected)}`),
					);
				} else if (typeof expected === 'number') {
					expect(createContextDefaults).toMatch(
						new RegExp(`${key}:\\s*${expected}`),
					);
				} else if (typeof expected === 'string') {
					expect(createContextDefaults).toMatch(
						new RegExp(`${key}:\\s*'${expected}'`),
					);
				}
			}
		});

		it('nullable collections inician en null', () => {
			for (const key of [
				'clienteInfo',
				'permissions',
				'menuModulos',
			] as const) {
				expect(createContextDefaults).toMatch(new RegExp(`${key}:\\s*null`));
			}
		});

		it('stubs de callbacks async en default context (hasRole es sync stub)', () => {
			const asyncCallbacks = AUTH_CONTEXT_PUBLIC_CALLBACK_KEYS_V9.filter(
				(key) => key !== 'hasRole',
			);
			for (const callbackKey of asyncCallbacks) {
				expect(createContextDefaults).toMatch(
					new RegExp(`${callbackKey}:\\s*async`),
				);
			}
			expect(createContextDefaults).toMatch(/hasRole:\s*\(\)\s*=>\s*false/);
		});

		it('startImpersonation default retorna { requiresEmpresaSelection: false }', () => {
			expect(createContextDefaults).toMatch(
				/startImpersonation:\s*async\s*\(\)\s*=>\s*\(\{\s*requiresEmpresaSelection:\s*false\s*\}\)/,
			);
		});
	});

	describe('V9.1.h — wiring estructural context value', () => {
		it('runSessionValidityProbe mapea a runSessionValidityProbeForSession', () => {
			expect(contextValueBlock).toMatch(
				/runSessionValidityProbe:\s*runSessionValidityProbeForSession/,
			);
		});

		it('handlers impersonation mantienen alias público', () => {
			expect(contextValueBlock).toMatch(
				/startImpersonation:\s*startImpersonationHandler/,
			);
			expect(contextValueBlock).toMatch(/endImpersonation:\s*endImpersonationHandler/);
		});

		it('derivados hasEmpresaActivaFlag, canAccessErp, mustSelectEmpresa presentes', () => {
			expect(contextValueBlock).toMatch(
				/hasEmpresaActivaFlag:\s*hasEmpresaActiva\(empresaActivaId\)/,
			);
			expect(contextValueBlock).toMatch(/canAccessErp:\s*canAccessErpFlag/);
			expect(contextValueBlock).toMatch(/mustSelectEmpresa:\s*mustSelectEmpresaFlag/);
		});
	});
});
