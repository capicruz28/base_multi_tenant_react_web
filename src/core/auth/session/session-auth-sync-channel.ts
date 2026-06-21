/**
 * BroadcastChannel wrapper auth-sync — IAM-FE-PHASE-04 IMPL-03.
 * Canal separado de tenant-sync.
 */

import type { AuthSyncEnvelope } from './session-auth-sync.types';
import { isAuthSyncEnvelope } from './session-auth-sync.types';

export type AuthSyncMessageHandler = (envelope: AuthSyncEnvelope) => void;

const CHANNEL_NAME = 'auth-sync';

class SessionAuthSyncChannel {
  private channel: BroadcastChannel | null = null;
  private callbacks: Set<AuthSyncMessageHandler> = new Set();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.setupListener();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[SessionAuthSyncChannel] Error al inicializar BroadcastChannel:', error);
        }
      }
    }
  }

  private setupListener(): void {
    if (!this.channel) {
      return;
    }

    this.channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!isAuthSyncEnvelope(event.data)) {
        return;
      }

      this.callbacks.forEach((callback) => {
        try {
          callback(event.data);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[SessionAuthSyncChannel] Error en callback:', error);
          }
        }
      });
    };
  }

  /** Registra listener; retorna unsubscribe. */
  subscribe(handler: AuthSyncMessageHandler): () => void {
    this.callbacks.add(handler);

    return () => {
      this.callbacks.delete(handler);
    };
  }

  /** Publica envelope en el canal (sin validar política anti-loop). */
  post(envelope: AuthSyncEnvelope): boolean {
    if (!this.channel) {
      return false;
    }

    try {
      this.channel.postMessage(envelope);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[SessionAuthSyncChannel] Error al postMessage:', error);
      }
      return false;
    }
  }

  isAvailable(): boolean {
    return this.channel !== null;
  }

  cleanup(): void {
    this.callbacks.clear();

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const sessionAuthSyncChannel = new SessionAuthSyncChannel();

export { CHANNEL_NAME as AUTH_SYNC_CHANNEL_NAME };
