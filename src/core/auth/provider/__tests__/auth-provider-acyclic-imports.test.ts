/**
 * IAM-FE-PHASE-09 IMPL-02 — Validación anti-ciclos e imports permitidos en provider/.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
	AUTH_PROVIDER_ALLOWED_IMPORT_PREFIXES,
	AUTH_PROVIDER_ASSEMBLY_PHASE_ORDER,
	AUTH_PROVIDER_COMPOSITOR_MODULE_PATTERN,
	AUTH_PROVIDER_FORBIDDEN_IMPORT_PREFIXES,
	AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS,
} from '@/core/auth/provider/auth-provider.types';

const ROOT = process.cwd();
const PROVIDER_DIR = path.join(ROOT, 'src/core/auth/provider');

function listProviderSourceFiles(dir: string): string[] {
	const entries = readdirSync(dir);
	const files: string[] = [];

	for (const entry of entries) {
		const full = path.join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) {
			if (entry === '__tests__') {
				continue;
			}
			files.push(...listProviderSourceFiles(full));
			continue;
		}
		if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
			files.push(full);
		}
	}

	return files;
}

function extractImportSources(fileContent: string): string[] {
	const sources: string[] = [];
	const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+from\s+)?['"]([^'"]+)['"]/g;
	let match: RegExpExecArray | null = importRegex.exec(fileContent);
	while (match !== null) {
		sources.push(match[1]);
		match = importRegex.exec(fileContent);
	}
	return sources;
}

function isAllowedImport(source: string): boolean {
	if (source.startsWith('.')) {
		return source.includes('/provider/') || source.startsWith('./') || source.startsWith('../');
	}
	return AUTH_PROVIDER_ALLOWED_IMPORT_PREFIXES.some((prefix) => source.startsWith(prefix));
}

describe('IAM-FE-PHASE-09 IMPL-02 — provider import policy', () => {
	it('AUTH_PROVIDER_ASSEMBLY_PHASE_ORDER respeta DR-D02 A→B→C→D', () => {
		expect(AUTH_PROVIDER_ASSEMBLY_PHASE_ORDER).toEqual(['A', 'B', 'C', 'D']);
	});

	it('AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS tiene exactamente 36 keys', () => {
		expect(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).toHaveLength(36);
		expect(new Set(AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS).size).toBe(36);
	});

	it('archivos provider/ no importan AuthContext ni provider.tsx', () => {
		const files = listProviderSourceFiles(PROVIDER_DIR);
		expect(files.length).toBeGreaterThan(0);

		for (const file of files) {
			const content = readFileSync(file, 'utf8');
			const imports = extractImportSources(content);

			for (const source of imports) {
				for (const forbidden of AUTH_PROVIDER_FORBIDDEN_IMPORT_PREFIXES) {
					expect(
						source.startsWith(forbidden),
						`${path.relative(ROOT, file)} must not import ${forbidden}, got ${source}`,
					).toBe(false);
				}
			}
		}
	});

	it('archivos provider/ solo usan imports permitidos (externos)', () => {
		const files = listProviderSourceFiles(PROVIDER_DIR);

		for (const file of files) {
			const content = readFileSync(file, 'utf8');
			const imports = extractImportSources(content);

			for (const source of imports) {
				if (source.startsWith('.')) {
					continue;
				}
				expect(
					isAllowedImport(source),
					`${path.relative(ROOT, file)}: import no permitido → ${source}`,
				).toBe(true);
			}
		}
	});

	it('compositor modules (future) no deben importar sibling compositors — policy regex', () => {
		const compositorPattern = AUTH_PROVIDER_COMPOSITOR_MODULE_PATTERN;
		expect('auth-provider-bootstrap.compositor.ts').toMatch(compositorPattern);
		expect('auth-provider-interceptors.compositor.ts').toMatch(compositorPattern);
		expect('auth-provider-refresh.compositor.ts').toMatch(compositorPattern);
		expect('auth-provider-termination.compositor.ts').toMatch(compositorPattern);
		expect('auth-provider-impersonation.compositor.ts').toMatch(compositorPattern);
		expect('auth-provider-empresa.compositor.ts').toMatch(compositorPattern);
		expect('auth-provider-permissions.compositor.ts').toMatch(compositorPattern);
		expect('auth-provider.types.ts').not.toMatch(compositorPattern);
	});

	it('provider/ no contiene useAuthProvider ni compositors fuera de IMPL-12 scope', () => {
		const allowedCompositors = new Set([
			'auth-provider-bootstrap.compositor.ts',
			'auth-provider-interceptors.compositor.ts',
			'auth-provider-refresh.compositor.ts',
			'auth-provider-termination.compositor.ts',
			'auth-provider-impersonation.compositor.ts',
			'auth-provider-empresa.compositor.ts',
			'auth-provider-permissions.compositor.ts',
			'auth-provider-auth-sync.compositor.ts',
			'auth-provider-telemetry-ux.compositor.tsx',
		]);
		const files = listProviderSourceFiles(PROVIDER_DIR);
		const relativePaths = files.map((f) => path.relative(PROVIDER_DIR, f));

		expect(relativePaths).toContain('auth-provider.types.ts');
		expect(relativePaths).not.toContain('auth-provider.flags.ts');
		expect(relativePaths).not.toContain('AuthContext.monolith.snapshot.ts');
		expect(relativePaths).toContain('auth-provider-runtime.refs.ts');
		expect(relativePaths).toContain('auth-provider-termination.helpers.ts');
		expect(relativePaths).toContain('auth-provider-state.ts');
		expect(relativePaths).toContain('auth-provider-cleanup.ts');
		for (const compositor of allowedCompositors) {
			expect(relativePaths).toContain(compositor);
		}
		expect(relativePaths).toContain('index.ts');
		expect(relativePaths).toContain('useAuthProvider.ts');
		expect(relativePaths).toContain('auth-provider-public-actions.ts');
		expect(
			relativePaths.filter((p) => p.includes('compositor') && !allowedCompositors.has(p)),
		).toEqual([]);
	});
});
