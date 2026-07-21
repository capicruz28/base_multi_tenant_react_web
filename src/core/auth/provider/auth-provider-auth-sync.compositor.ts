/**
 * IAM-FE-PHASE-09 IMPL-12 — auth-sync runtime copy-first (monolito L1451–1499, L3085–3149).
 */
import { useCallback } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import type {
	AuthProviderAuthSyncRuntime,
	AuthProviderEarlyRefs,
	AuthProviderImpersonationRuntime,
	AuthProviderRefreshWiringRuntime,
	AuthProviderTerminationRuntime,
} from '@/core/auth/provider/auth-provider.types';
import { clearRefreshingPromise } from '@/core/auth/provider/auth-provider-runtime.refs';
import type { Token } from '@/features/auth/types/auth.types';
import { buildSessionClaimsSnapshot, type SessionClaimsSnapshot } from '@/core/auth/session/session-claims-snapshot';
import {
	applyPostRefreshRqInvalidation,
	resolvePostRefreshRqAction,
} from '@/core/auth/session/session-rq-invalidation';
import { emitEmpresaChangedSync, emitSessionLoginSync, emitSessionRefreshedSync } from '@/core/auth/session/session-auth-sync-emit';
import { SESSION_AUTH_SYNC_V4_ENABLED } from '@/core/auth/session/session-auth-sync.flags';
import { applySelectionSyncFromEnvelope } from '@/core/auth/session/session-auth-sync-selection';
import type { ApplyInboundAuthSyncDeps } from '@/core/auth/session/session-auth-sync-apply';
import type { RefreshOutcome } from '@/core/auth/session/session-refresh-outcome.types';
import type { ImpersonationExitSource } from '@/core/auth/session/session-impersonation.types';
import { invalidateOrgQueries } from '@/features/org/utils/invalidate-org-queries';
import { invalidateInvQueries } from '@/features/inv/utils/invalidate-inv-queries';
import { invalidateCfgQueries } from '@/features/cfg/utils/invalidate-cfg-queries';

export interface UseAuthProviderEmitAuthSyncSessionTokenParams {
	readonly refs: Pick<AuthProviderEarlyRefs, 'authRef' | 'empresaActivaIdRef'>;
}

export function useAuthProviderEmitAuthSyncSessionToken(
	params: UseAuthProviderEmitAuthSyncSessionTokenParams,
): Pick<AuthProviderAuthSyncRuntime, 'emitAuthSyncSessionToken'> {
	const {
		refs: { authRef, empresaActivaIdRef },
	} = params;

	const emitAuthSyncSessionToken = useCallback(
		(
			eventType: 'SESSION_LOGIN' | 'SESSION_REFRESHED' | 'EMPRESA_CHANGED',
			accessToken: string,
			priorSnapshot?: SessionClaimsSnapshot,
			refreshOutcome?: RefreshOutcome,
			impersonationExitSource?: ImpersonationExitSource,
		) => {
			if (!SESSION_AUTH_SYNC_V4_ENABLED) {
				return;
			}

			const snapshot =
				priorSnapshot ??
				buildSessionClaimsSnapshot(
					accessToken,
					authRef.current.user,
					empresaActivaIdRef.current,
				);

			const payload = {
				accessToken,
				claimsSnapshot: snapshot,
				empresaActivaId: empresaActivaIdRef.current,
			};

			switch (eventType) {
				case 'SESSION_LOGIN':
					emitSessionLoginSync({
						...payload,
						...(impersonationExitSource !== undefined
							? { impersonationExitSource }
							: {}),
					});
					break;
				case 'SESSION_REFRESHED':
					emitSessionRefreshedSync({
						...payload,
						...(refreshOutcome !== undefined ? { refreshOutcome } : {}),
					});
					break;
				case 'EMPRESA_CHANGED':
					emitEmpresaChangedSync(payload);
					break;
				default:
					break;
			}
		},
		[],
	);

	return {
		emitAuthSyncSessionToken,
	};
}

export interface UseAuthProviderAuthSyncListenerDepsParams {
	readonly refs: Pick<
		AuthProviderEarlyRefs,
		'authRef' | 'empresaActivaIdRef' | 'isTerminatingRef' | 'terminationCallerHintRef'
	>;
	readonly queryClient: QueryClient;
	readonly runPostRefreshSession: AuthProviderRefreshWiringRuntime['runPostRefreshSession'];
	readonly applyFullSessionToken: (response: Token) => Promise<unknown>;
	readonly runTerminateSession: AuthProviderTerminationRuntime['runTerminateSession'];
	readonly applyInboundImpersonationExitStorageCleanup: AuthProviderImpersonationRuntime['applyInboundImpersonationExitStorageCleanup'];
}

export function useAuthProviderAuthSyncListenerDeps(
	params: UseAuthProviderAuthSyncListenerDepsParams,
): Pick<AuthProviderAuthSyncRuntime, 'getAuthSyncListenerDeps'> {
	const {
		refs: { authRef, empresaActivaIdRef, isTerminatingRef, terminationCallerHintRef },
		queryClient,
		runPostRefreshSession,
		applyFullSessionToken,
		runTerminateSession,
		applyInboundImpersonationExitStorageCleanup,
	} = params;

	const getAuthSyncListenerDeps = useCallback(
		(): ApplyInboundAuthSyncDeps => ({
			getCurrentAccessToken: () => authRef.current.token,
			getIsTerminating: () => isTerminatingRef.current,
			clearRefreshingPromise,
			buildPriorSnapshot: () =>
				buildSessionClaimsSnapshot(
					authRef.current.token,
					authRef.current.user,
					empresaActivaIdRef.current,
				),
			runPostRefreshFromSync: async (newToken, priorSnapshot) => {
				const postRefreshResult = await runPostRefreshSession(newToken, priorSnapshot);
				applyPostRefreshRqInvalidation(
					resolvePostRefreshRqAction(
						priorSnapshot,
						postRefreshResult.hydrationLevel,
						{
							empresaId: empresaActivaIdRef.current,
							clienteId: authRef.current.user?.cliente_id ?? null,
						},
					),
					queryClient,
				);
				applyInboundImpersonationExitStorageCleanup(newToken);
			},
			applyFullSessionFromSync: async (accessToken) => {
				const session = await applyFullSessionToken({
					access_token: accessToken,
					user_data: authRef.current.user ?? undefined,
				});
				if (session) {
					applyInboundImpersonationExitStorageCleanup(accessToken);
				}
				return Boolean(session);
			},
			runTerminateFromSync: async (input) => {
				const skipRedirect =
					typeof document !== 'undefined' && document.visibilityState !== 'visible';
				terminationCallerHintRef.current = 'auth_sync_follower';
				try {
					await runTerminateSession({
						reason: input.reason,
						callServer: false,
						skipRedirect,
						preservePreLoginBranding: input.preservePreLoginBranding,
					});
				} finally {
					terminationCallerHintRef.current = undefined;
				}
			},
			applySelectionFromSync: applySelectionSyncFromEnvelope,
			invalidateModulesAfterEmpresaChange: () => {
				invalidateOrgQueries(queryClient);
				invalidateInvQueries(queryClient);
				invalidateCfgQueries(queryClient);
			},
		}),
		[
			runPostRefreshSession,
			applyFullSessionToken,
			runTerminateSession,
			queryClient,
			applyInboundImpersonationExitStorageCleanup,
		],
	);

	return {
		getAuthSyncListenerDeps,
	};
}
