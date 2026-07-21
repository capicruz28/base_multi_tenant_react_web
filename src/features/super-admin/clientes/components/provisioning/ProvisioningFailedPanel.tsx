import { AlertTriangle } from 'lucide-react';

import { getProvisioningSagaErrorMessage } from '../../utils/provisioning-saga-error.utils';

export interface ProvisioningFailedPanelProps {
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  retryAllowed: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ProvisioningFailedPanel({
  lastErrorCode,
  lastErrorMessage,
  retryAllowed,
  onRetry,
  isRetrying = false,
}: ProvisioningFailedPanelProps) {
  const message = getProvisioningSagaErrorMessage(lastErrorCode, lastErrorMessage);

  return (
    <section className="rounded-lg border border-error/30 bg-error/10 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-text-base">Provisioning falló</h2>
          <p className="mt-2 text-sm text-text-base">{message}</p>
          {lastErrorCode ? (
            <p className="mt-2 text-xs font-mono text-text-soft">Código: {lastErrorCode}</p>
          ) : null}
          <p className="mt-3 text-sm text-text-soft">
            El tenant no está operativo. Si el problema persiste, contacte a soporte.
          </p>
          {retryAllowed && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? 'Reintentando…' : 'Reintentar provisioning'}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
