import type { SessionTerminationReason } from '@/core/auth/session/session-termination-reason';
import {
	resolveLoginBannerMessage,
	resolveTerminationUxSeverity,
	shouldShowLoginBanner,
	type SessionLoginQueryParam,
} from '@/core/auth/session/session-termination-ux';
import type { SessionLoginQueryParamV7 } from '@/core/auth/session/session-ux.types';
import {
	isSessionLimitLoginQuery,
	resolveLoginSessionLimitBanner,
} from '@/features/auth/utils/login-session-limit';

/** Mapeo query param login → reason representativo para copy UX (Paso 8). */
const SESSION_QUERY_TO_REASON: Readonly<
	Record<SessionLoginQueryParam, SessionTerminationReason>
> = {
	expired: 'SESSION_EXPIRED',
	security: 'TOKEN_REUSE',
	idle: 'IDLE_TIMEOUT',
	error: 'UNKNOWN',
};

export function parseSessionLoginQueryParam(
	value: string | null,
): SessionLoginQueryParamV7 | null {
	if (
		value === 'expired' ||
		value === 'security' ||
		value === 'idle' ||
		value === 'error' ||
		isSessionLimitLoginQuery(value)
	) {
		return value;
	}
	return null;
}

export interface LoginSessionTerminationBannerModel {
	readonly message: string;
	readonly severity: ReturnType<typeof resolveTerminationUxSeverity>;
}

/**
 * Resuelve banner de login desde `?session=` usando helpers UX puros (Paso 8).
 */
export function resolveLoginBannerFromSessionQuery(
	queryParam: SessionLoginQueryParamV7,
): LoginSessionTerminationBannerModel | null {
	if (isSessionLimitLoginQuery(queryParam)) {
		return resolveLoginSessionLimitBanner();
	}

	const reason = SESSION_QUERY_TO_REASON[queryParam];
	if (!shouldShowLoginBanner(reason)) {
		return null;
	}

	const message = resolveLoginBannerMessage(reason);
	if (!message) {
		return null;
	}

	return {
		message,
		severity: resolveTerminationUxSeverity(reason),
	};
}
