import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  CheckCircle,
  Loader,
  RefreshCw,
  StopCircle,
} from 'lucide-react';

import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { clienteService } from '../services/cliente.service';
import type { Cliente } from '../types/cliente.types';
import type { ClientProvisioningLocationState } from '../types/provisioning-page.types';
import { useProvisioningPoll } from '../hooks/useProvisioningPoll';
import { useRetryProvisioning } from '../hooks/useRetryProvisioning';
import { useAbortProvisioning } from '../hooks/useAbortProvisioning';
import { ProvisioningStatusBadge } from '../components/provisioning/ProvisioningStatusBadge';
import { ProvisioningTimeline } from '../components/provisioning/ProvisioningTimeline';
import { ProvisioningFailedPanel } from '../components/provisioning/ProvisioningFailedPanel';
import { ProvisioningAbortDialog } from '../components/provisioning/ProvisioningAbortDialog';
import { ProvisioningCredentialsPanel } from '../components/provisioning/ProvisioningCredentialsPanel';

const ClientProvisioningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state ?? null) as ClientProvisioningLocationState | null;
  const { isSuperAdmin } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clienteLoading, setClienteLoading] = useState(true);
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [abortDialogOpen, setAbortDialogOpen] = useState(false);

  const retryMutation = useRetryProvisioning();
  const abortMutation = useAbortProvisioning();

  const {
    status,
    isPolling,
    isTimedOut,
    pollConnectionError,
    fatalError,
    refresh,
  } = useProvisioningPoll({
    clienteId: id,
    enabled: Boolean(id) && isSuperAdmin,
    statusUrl: locationState?.statusUrl,
  });

  useEffect(() => {
    if (!isSuperAdmin || !id) {
      setClienteLoading(false);
      return;
    }

    let cancelled = false;
    setClienteLoading(true);
    setClienteError(null);

    void clienteService
      .getClienteById(id)
      .then((data) => {
        if (!cancelled) {
          setCliente(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setClienteError(getErrorMessage(err).message || 'Error al cargar el cliente');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setClienteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isSuperAdmin]);

  const handleBack = useCallback(() => {
    navigate('/super-admin/clientes');
  }, [navigate]);

  const handleGoToDetail = useCallback(() => {
    if (!id) return;
    navigate(`/super-admin/clientes/${id}`);
  }, [id, navigate]);

  const handleRetry = useCallback(async () => {
    if (!id) return;
    await retryMutation.mutateAsync(id);
    await refresh();
  }, [id, refresh, retryMutation]);

  const handleAbortConfirm = useCallback(
    async (reason?: string) => {
      if (!id) return;
      await abortMutation.mutateAsync({ clienteId: id, reason });
      setAbortDialogOpen(false);
      await refresh();
    },
    [abortMutation, id, refresh],
  );

  const clienteLabel =
    locationState?.clienteLabel ||
    cliente?.nombre_comercial ||
    cliente?.razon_social ||
    undefined;

  const credenciales = locationState?.credenciales;
  const provisioningState = status?.provisioning_state;

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">
            No tienes permisos para consultar el provisioning de este tenant.
          </p>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="text-center py-8">
        <p className="text-error bg-error/10 p-4 rounded-lg max-w-md mx-auto">
          Identificador de cliente no válido.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const showInitialLoading = !status && isPolling && !fatalError && !isTimedOut;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-text-soft hover:text-text-base hover:bg-overlay rounded-lg transition-colors"
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-text-base">Provisioning del tenant</h1>
              <ProvisioningStatusBadge state={provisioningState} />
            </div>
            {clienteLabel ? (
              <p className="text-sm text-text-soft mt-1">{clienteLabel}</p>
            ) : null}
            {clienteLoading ? (
              <p className="text-xs text-text-faint mt-1">Cargando datos del cliente…</p>
            ) : null}
            {clienteError ? (
              <p className="text-xs text-warning mt-1">{clienteError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {provisioningState === 'provisioning' && status?.abort_allowed ? (
            <button
              type="button"
              onClick={() => setAbortDialogOpen(true)}
              disabled={abortMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-error text-error rounded-lg hover:bg-error/10 disabled:opacity-50"
            >
              <StopCircle className="h-4 w-4" />
              Abortar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isPolling && !isTimedOut && !pollConnectionError}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border-base rounded-lg hover:bg-overlay disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
            Refrescar estado
          </button>
        </div>
      </div>

      {showInitialLoading ? (
        <div className="flex items-center justify-center py-16 text-text-soft">
          <Loader className="h-8 w-8 animate-spin text-brand-primary mr-3" />
          Consultando estado del provisioning…
        </div>
      ) : null}

      {fatalError ? (
        <div className="mb-6 rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-text-base">
          {getErrorMessage(fatalError).message || 'No se pudo consultar el estado del provisioning.'}
        </div>
      ) : null}

      {pollConnectionError ? (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-text-base">
          Error de conexión al consultar el estado. El provisioning puede continuar en segundo plano.
        </div>
      ) : null}

      {isTimedOut ? (
        <div className="mb-6 rounded-lg border border-border-base bg-subtle p-4 text-sm text-text-base">
          El provisioning continúa en segundo plano. Puede verificar el estado más tarde con
          «Refrescar estado».
        </div>
      ) : null}

      {provisioningState === 'provisioning' && !showInitialLoading ? (
        <p className="mb-4 text-sm text-text-soft">Provisionando tenant dedicated…</p>
      ) : null}

      {credenciales ? (
        <div className="mb-6">
          <ProvisioningCredentialsPanel
            credenciales={credenciales}
            clienteLabel={clienteLabel}
            loginBlocked={provisioningState !== 'ready'}
          />
        </div>
      ) : null}

      {status && provisioningState !== 'failed' ? (
        <div className="mb-6">
          <ProvisioningTimeline status={status} />
        </div>
      ) : null}

      {status && provisioningState === 'ready' ? (
        <section className="rounded-lg border border-success/30 bg-success/10 p-5 mb-6">
          <div className="flex gap-3">
            <CheckCircle className="h-6 w-6 text-success shrink-0" aria-hidden />
            <div>
              <h2 className="text-base font-semibold text-text-base">Tenant dedicated operativo</h2>
              <p className="mt-1 text-sm text-text-soft">
                El provisioning finalizó correctamente. El tenant está listo para operación.
              </p>
              <button
                type="button"
                onClick={handleGoToDetail}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-hover"
              >
                Ir al detalle del cliente
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {status && provisioningState === 'failed' ? (
        <div className="mb-6">
          <ProvisioningFailedPanel
            lastErrorCode={status.last_error_code}
            lastErrorMessage={status.last_error_message}
            retryAllowed={status.retry_allowed}
            onRetry={() => void handleRetry()}
            isRetrying={retryMutation.isPending}
          />
        </div>
      ) : null}

      <ProvisioningAbortDialog
        isOpen={abortDialogOpen}
        onClose={() => setAbortDialogOpen(false)}
        onConfirm={(reason) => void handleAbortConfirm(reason)}
        loading={abortMutation.isPending}
      />
    </div>
  );
};

export default ClientProvisioningPage;
