import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { parseEmpresaScopeError } from '@/core/auth/utils/empresa-scope-errors';
import { getErrorMessage } from '@/core/services/error.service';
import { APP_SELECCIONAR_EMPRESA } from '@/core/routing/post-login-path';

/**
 * Manejo centralizado de 403 MISSING_SESSION_EMPRESA y EMPRESA_SCOPE_MISMATCH (Etapa A).
 * Devuelve true si el error fue consumido (no re-lanzar toast genérico).
 */
export function useOrgEmpresaScopeErrorHandler() {
  const navigate = useNavigate();

  return useCallback(
    (error: unknown, options?: { redirectOnMissingSession?: boolean }): boolean => {
      const scopeError = parseEmpresaScopeError(error);
      if (!scopeError) return false;

      toast.error(scopeError.message, { duration: 6000 });

      if (
        scopeError.code === 'MISSING_SESSION_EMPRESA' &&
        options?.redirectOnMissingSession !== false
      ) {
        navigate(APP_SELECCIONAR_EMPRESA, { replace: true });
      }

      return true;
    },
    [navigate],
  );
}

/** Para hooks: combina scope error + getErrorMessage. */
export function resolveOrgMutationErrorMessage(
  error: unknown,
  handleScopeError: (error: unknown) => boolean,
): string {
  if (handleScopeError(error)) {
    const scope = parseEmpresaScopeError(error);
    return scope?.message ?? 'Error de ámbito de empresa.';
  }
  return getErrorMessage(error).message;
}
