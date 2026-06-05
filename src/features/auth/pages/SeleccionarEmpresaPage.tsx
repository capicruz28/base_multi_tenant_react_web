import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useAuth } from '@/shared/context/AuthContext';
import { isSelectionSessionErrorStatus } from '@/core/api/auth-http.utils';
import { getErrorMessage } from '@/core/services/error.service';
import { resolvePostEmpresaSelectionPath } from '@/core/routing/post-login-path';
import { useEmpresaSelectionStore } from '../stores/empresa-selection.store';
import { useEmpresaSelectionHydrated } from '../stores/empresa-selection-hydration';

export default function SeleccionarEmpresaPage() {
  const navigate = useNavigate();
  const hydrated = useEmpresaSelectionHydrated();
  const { completeEmpresaSelection, auth, isImpersonation } = useAuth();
  const selectionToken = useEmpresaSelectionStore((s) => s.selectionToken);
  const empresasDisponibles = useEmpresaSelectionStore((s) => s.empresasDisponibles);
  const hasPendingSelection = useEmpresaSelectionStore((s) => s.hasPendingSelection);
  const clearPendingSelection = useEmpresaSelectionStore((s) => s.clearPendingSelection);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectInFlightRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasPendingSelection() || !selectionToken) {
      navigate('/login', { replace: true });
    }
  }, [hydrated, selectionToken, hasPendingSelection, navigate]);

  const handleSelect = async (empresaId: string) => {
    if (selectInFlightRef.current || loadingId || !selectionToken) return;
    selectInFlightRef.current = true;
    setLoadingId(empresaId);
    setErrorMessage(null);
    try {
      const user = await completeEmpresaSelection(empresaId);
      if (!user) {
        setErrorMessage('No se pudo completar la selección de empresa.');
        return;
      }
      toast.success('Empresa seleccionada');
      navigate(
        resolvePostEmpresaSelectionPath(auth.token, { isImpersonation }),
        { replace: true },
      );
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      if (isSelectionSessionErrorStatus(status)) {
        const msg =
          'La sesión de selección expiró o no es válida. Inicie sesión nuevamente.';
        clearPendingSelection();
        toast.error(msg);
        navigate('/login', { replace: true });
        return;
      }
      const err = getErrorMessage(error);
      const msg = err.message || 'Error al seleccionar empresa';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      selectInFlightRef.current = false;
      setLoadingId(null);
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-brand-primary" aria-label="Cargando sesión" />
      </div>
    );
  }

  if (!hasPendingSelection()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page flex flex-col items-center px-4 pb-12">
      <div className="bg-surface border border-border-base rounded-lg shadow-sm p-8 max-w-lg w-full mx-auto mt-20">
        <div className="text-center">
          <Building2
            className="mx-auto text-brand-primary"
            size={48}
            strokeWidth={1.5}
            aria-hidden
          />
          <h1 className="text-2xl font-semibold text-text-base mt-4">Selecciona tu empresa</h1>
          <p className="text-text-soft text-center mt-2">
            Tienes acceso a varias empresas. Elige con cuál deseas trabajar en esta sesión.
          </p>
        </div>

        {empresasDisponibles.length === 0 ? (
          <p className="text-sm text-text-soft text-center mt-6">
            No hay empresas disponibles para su usuario.
          </p>
        ) : (
          <div className="mt-6" role="listbox" aria-label="Empresas disponibles">
            {empresasDisponibles.map((empresa) => {
              const isLoading = loadingId === empresa.empresa_id;
              const isDisabled = loadingId !== null && !isLoading;
              return (
                <button
                  key={empresa.empresa_id}
                  type="button"
                  role="option"
                  disabled={isDisabled}
                  onClick={() => handleSelect(empresa.empresa_id)}
                  className="w-full text-left p-4 rounded-lg border border-border-base hover:border-brand-primary hover:bg-subtle cursor-pointer mt-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border-base disabled:hover:bg-transparent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-text-base font-medium">{empresa.razon_social}</p>
                      {empresa.nombre_comercial?.trim() ? (
                        <p className="text-text-soft text-sm mt-0.5">{empresa.nombre_comercial}</p>
                      ) : null}
                    </div>
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin text-brand-primary flex-shrink-0" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {errorMessage ? (
          <p className="text-error text-sm text-center mt-4" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
