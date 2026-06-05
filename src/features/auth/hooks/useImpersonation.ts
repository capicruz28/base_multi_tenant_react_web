import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/shared/context/AuthContext';
import {
  APP_SELECCIONAR_EMPRESA,
  resolvePostEmpresaSelectionPath,
} from '@/core/routing/post-login-path';
import { getErrorMessage } from '@/core/services/error.service';

export function useImpersonation() {
  const navigate = useNavigate();
  const { startImpersonation, endImpersonation, isImpersonation, auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);

  const enterClientErp = useCallback(
    async (clienteId: string, clienteLabel?: string) => {
      setLoading(true);
      try {
        const result = await startImpersonation(clienteId, { clienteLabel });
        if (result.requiresEmpresaSelection) {
          navigate(APP_SELECCIONAR_EMPRESA, { replace: true });
        } else {
          navigate(resolvePostEmpresaSelectionPath(auth.token, { isImpersonation: true }), {
            replace: true,
          });
        }
        toast.success('Modo soporte activo', { duration: 2500 });
      } catch (error) {
        const err = getErrorMessage(error);
        toast.error(err.message || 'No se pudo iniciar el modo soporte');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate, startImpersonation],
  );

  const exitSupportMode = useCallback(async () => {
    setExiting(true);
    try {
      await endImpersonation();
      navigate('/super-admin/dashboard', { replace: true });
      toast.success('Sesión de plataforma restaurada');
    } catch (error) {
      const err = getErrorMessage(error);
      toast.error(err.message || 'Error al salir del modo soporte');
    } finally {
      setExiting(false);
    }
  }, [endImpersonation, navigate]);

  return {
    isImpersonation,
    loading,
    exiting,
    enterClientErp,
    exitSupportMode,
  };
}
