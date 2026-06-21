/**
 * IAM-FE-PHASE-09 IMPL-12 — telemetry UX runtime + Fase D binders (monolito L3035–3054).
 */
import { Fragment, createElement, type ReactNode } from 'react';

import type { AuthProviderPhaseDBinderProps } from '@/core/auth/provider/auth-provider.types';
import { AuthSyncListenerBinder } from '@/core/auth/session/useAuthSyncListener';
import { SessionRemoteProbeBinder } from '@/core/auth/session/useSessionRemoteProbe';
import {
	SessionTelemetryAuthSyncBinder,
	SessionTelemetryAuthSyncEmittedBinder,
} from '@/core/auth/session/session-telemetry-auth-wiring';

export {
	trackSessionLoginCorrelation,
	trackSessionBootstrapCorrelation,
	emitSessionRefreshOutcomeTelemetry,
	emitSessionRefreshFailureOutcomeTelemetry,
	emitSessionProbeCompletedTelemetry,
	emitSessionBootstrapCompletedTelemetry,
	emitSessionImpersonationExitFromSource,
} from '@/core/auth/session/session-telemetry-auth-wiring';

export function AuthProviderPhaseDBinders(props: {
	readonly binders: AuthProviderPhaseDBinderProps;
	readonly children: ReactNode;
}): ReactNode {
	const { binders, children } = props;

	return createElement(
		Fragment,
		null,
		createElement(AuthSyncListenerBinder, {
			enabled: binders.authSyncListener.enabled,
			getDeps: binders.authSyncListener.getDeps,
		}),
		createElement(SessionRemoteProbeBinder, {
			enabled: binders.remoteProbe.enabled,
			getRuntimeState: binders.remoteProbe.getRuntimeState,
			runSessionValidityProbe: binders.remoteProbe.runSessionValidityProbe,
		}),
		createElement(SessionTelemetryAuthSyncEmittedBinder, {
			enabled: binders.telemetryAuthSyncEmitted.enabled,
		}),
		createElement(SessionTelemetryAuthSyncBinder, {
			enabled: binders.telemetryAuthSync.enabled,
		}),
		children,
	);
}
