import { toast } from 'react-hot-toast';
import { parseEmpresaScopeError } from '@/core/auth/utils/empresa-scope-errors';
import { getErrorMessage } from '@/core/services/error.service';

/** Mensaje de error ORG con prioridad a códigos de ámbito empresa. */
export function getOrgApiErrorMessage(error: unknown): string {
  const scope = parseEmpresaScopeError(error);
  if (scope) return scope.message;
  return getErrorMessage(error).message;
}

export function toastOrgApiError(error: unknown): void {
  toast.error(getOrgApiErrorMessage(error));
}
