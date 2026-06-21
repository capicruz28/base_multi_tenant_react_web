/**
 * DEV sink — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-07).
 */

import { isSessionTelemetryDevSinkActive } from './session-telemetry.flags';
import type { SessionTelemetryEnvelope, SessionTelemetrySink } from './session-telemetry.types';

const SINK_LABEL = '[SessionTelemetry]';

export function createSessionTelemetryDevSink(): SessionTelemetrySink {
  return {
    emit(envelope: SessionTelemetryEnvelope): void {
      if (!isSessionTelemetryDevSinkActive()) {
        return;
      }

      console.group(`${SINK_LABEL} ${envelope.eventName}`);
      console.log('correlationId', envelope.correlationId);
      console.log('tabId', envelope.tabId);
      console.log('eventId', envelope.eventId);
      if (envelope.parentEventId) {
        console.log('parentEventId', envelope.parentEventId);
      }
      console.log('issuedAtMs', envelope.issuedAtMs);
      console.log('payload', envelope.payload);
      console.groupEnd();
    },
  };
}

/** Sink singleton MVP. */
let devSinkInstance: SessionTelemetrySink | null = null;

export function getSessionTelemetryDevSink(): SessionTelemetrySink {
  if (!devSinkInstance) {
    devSinkInstance = createSessionTelemetryDevSink();
  }
  return devSinkInstance;
}

export function resetSessionTelemetryDevSinkForTests(): void {
  devSinkInstance = null;
}
