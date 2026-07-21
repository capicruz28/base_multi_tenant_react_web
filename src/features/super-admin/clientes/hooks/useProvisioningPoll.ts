import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import { provisioningService } from '../services/provisioning.service';
import type { DedicatedProvisioningStatusRead } from '../types/provisioning.types';
import {
  getProvisioningPollIntervalMs,
  isProvisioningPollTimedOut,
  isTerminalProvisioningState,
  PROVISIONING_MAX_CONSECUTIVE_POLL_ERRORS,
} from '../utils/provisioning-poll.utils';

export interface UseProvisioningPollOptions {
  clienteId: string | undefined;
  enabled?: boolean;
  /** URL del 201 — prioridad sobre URL canónica. */
  statusUrl?: string;
}

export interface UseProvisioningPollResult {
  status: DedicatedProvisioningStatusRead | null;
  isPolling: boolean;
  isTimedOut: boolean;
  pollConnectionError: boolean;
  fatalError: Error | null;
  refresh: () => Promise<void>;
}

function isPollFatalHttpStatus(status: number | undefined): boolean {
  return status === 401 || status === 403 || status === 404;
}

function isPollRetryableHttpStatus(status: number | undefined): boolean {
  return status === undefined || status >= 500;
}

/**
 * Polling GET provisioning-status con backoff §10 y timeout UI 30 min.
 * Sin UI — consumo en PR-B.
 */
export function useProvisioningPoll(
  options: UseProvisioningPollOptions,
): UseProvisioningPollResult {
  const { clienteId, enabled = true, statusUrl } = options;

  const [status, setStatus] = useState<DedicatedProvisioningStatusRead | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [pollConnectionError, setPollConnectionError] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const pollStartedAtRef = useRef<number | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const activeRef = useRef(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScheduledPoll = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    activeRef.current = false;
    setIsPolling(false);
    clearScheduledPoll();
  }, [clearScheduledPoll]);

  const executePoll = useCallback(async (): Promise<boolean> => {
    if (!clienteId || !activeRef.current) {
      return false;
    }

    const startedAt = pollStartedAtRef.current ?? Date.now();
    pollStartedAtRef.current = startedAt;

    if (isProvisioningPollTimedOut(startedAt, Date.now())) {
      setIsTimedOut(true);
      stopPolling();
      return false;
    }

    try {
      const nextStatus = await provisioningService.getProvisioningStatus(clienteId, {
        statusUrl,
      });
      consecutiveErrorsRef.current = 0;
      setPollConnectionError(false);
      setStatus(nextStatus);

      if (isTerminalProvisioningState(nextStatus.provisioning_state)) {
        stopPolling();
        return false;
      }

      return true;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const httpStatus = error.response?.status;
        if (isPollFatalHttpStatus(httpStatus)) {
          setFatalError(
            error instanceof Error ? error : new Error('Error al consultar el provisioning.'),
          );
          stopPolling();
          return false;
        }
        if (isPollRetryableHttpStatus(httpStatus)) {
          consecutiveErrorsRef.current += 1;
          if (consecutiveErrorsRef.current >= PROVISIONING_MAX_CONSECUTIVE_POLL_ERRORS) {
            setPollConnectionError(true);
          }
          return true;
        }
      }

      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current >= PROVISIONING_MAX_CONSECUTIVE_POLL_ERRORS) {
        setPollConnectionError(true);
      }
      return true;
    }
  }, [clienteId, statusUrl, stopPolling]);

  const scheduleNextPoll = useCallback(() => {
    clearScheduledPoll();
    if (!activeRef.current || !pollStartedAtRef.current) {
      return;
    }

    const elapsed = Date.now() - pollStartedAtRef.current;
    const delayMs = getProvisioningPollIntervalMs(elapsed);

    timeoutIdRef.current = setTimeout(() => {
      void (async () => {
        const shouldContinue = await executePoll();
        if (shouldContinue && activeRef.current) {
          scheduleNextPoll();
        }
      })();
    }, delayMs);
  }, [clearScheduledPoll, executePoll]);

  const refresh = useCallback(async () => {
    if (!clienteId) {
      return;
    }
    clearScheduledPoll();
    activeRef.current = true;
    setIsPolling(true);
    setIsTimedOut(false);
    setFatalError(null);
    setPollConnectionError(false);
    consecutiveErrorsRef.current = 0;
    pollStartedAtRef.current = Date.now();

    const shouldContinue = await executePoll();
    if (shouldContinue && activeRef.current) {
      scheduleNextPoll();
    }
  }, [clienteId, clearScheduledPoll, executePoll, scheduleNextPoll]);

  useEffect(() => {
    if (!clienteId || !enabled) {
      stopPolling();
      return;
    }

    activeRef.current = true;
    setIsPolling(true);
    setIsTimedOut(false);
    setFatalError(null);
    setPollConnectionError(false);
    consecutiveErrorsRef.current = 0;
    pollStartedAtRef.current = Date.now();

    void (async () => {
      const shouldContinue = await executePoll();
      if (shouldContinue && activeRef.current) {
        scheduleNextPoll();
      }
    })();

    return () => {
      stopPolling();
    };
  }, [clienteId, enabled, statusUrl, executePoll, scheduleNextPoll, stopPolling]);

  return {
    status,
    isPolling,
    isTimedOut,
    pollConnectionError,
    fatalError,
    refresh,
  };
}
