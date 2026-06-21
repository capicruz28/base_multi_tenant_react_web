/**
 * IAM-FE-PHASE-09 IMPL-05 — singleton refresh promise (DR-P1-03).
 * Única ubicación module-level de isRefreshingPromise.
 */
import type { AuthProviderRefreshPromise } from '@/core/auth/provider/auth-provider.types';

let isRefreshingPromise: AuthProviderRefreshPromise = null;

export function getRefreshingPromise(): AuthProviderRefreshPromise {
	return isRefreshingPromise;
}

export function setRefreshingPromise(promise: AuthProviderRefreshPromise): void {
	isRefreshingPromise = promise;
}

export function clearRefreshingPromise(): void {
	isRefreshingPromise = null;
}
