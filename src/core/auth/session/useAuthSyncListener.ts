/**
 * Hook lifecycle listener auth-sync — IAM-FE-PHASE-04 IMPL-10.
 */

import { useEffect, useRef } from 'react';

import { SESSION_AUTH_SYNC_V4_ENABLED } from './session-auth-sync.flags';
import {
  applyInboundAuthSyncEvent,
  type ApplyInboundAuthSyncDeps,
} from './session-auth-sync-apply';
import { sessionAuthSyncChannel } from './session-auth-sync-channel';
import type { AuthSyncEnvelope } from './session-auth-sync.types';

export interface UseAuthSyncListenerOptions {
  /** Master flag compile-time; default SESSION_AUTH_SYNC_V4_ENABLED. */
  enabled?: boolean;
  getDeps: () => ApplyInboundAuthSyncDeps;
}

export function useAuthSyncListener(options: UseAuthSyncListenerOptions): void {
  const enabled = options.enabled ?? SESSION_AUTH_SYNC_V4_ENABLED;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!sessionAuthSyncChannel.isAvailable()) {
      return;
    }

    const handleMessage = (envelope: AuthSyncEnvelope): void => {
      const deps = optionsRef.current.getDeps();
      void applyInboundAuthSyncEvent(envelope, deps);
    };

    return sessionAuthSyncChannel.subscribe(handleMessage);
  }, [enabled]);
}

/** Binder nulo para montar dentro de AuthProvider (IMPL-10). */
export function AuthSyncListenerBinder(options: UseAuthSyncListenerOptions): null {
  useAuthSyncListener(options);
  return null;
}
