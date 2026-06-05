import axios, { AxiosError } from 'axios';

/** Códigos de ámbito empresa alineados al backend multiempresa. */
export type EmpresaScopeErrorCode =
  | 'MISSING_SESSION_EMPRESA'
  | 'EMPRESA_SCOPE_MISMATCH'
  | 'GLOBAL_PARAM_FORBIDDEN';

export interface EmpresaScopeErrorInfo {
  code: EmpresaScopeErrorCode;
  message: string;
  status: number;
}

const CODE_MESSAGES: Record<EmpresaScopeErrorCode, string> = {
  MISSING_SESSION_EMPRESA:
    'Debe seleccionar una empresa activa para continuar. Use el selector del encabezado o complete la selección de empresa.',
  EMPRESA_SCOPE_MISMATCH:
    'La operación no corresponde a la empresa activa de su sesión. Cambie de empresa en el encabezado e intente de nuevo.',
  GLOBAL_PARAM_FORBIDDEN:
    'No tiene permiso para administrar parámetros globales del tenant. Solo puede crear o editar overrides de la empresa activa.',
};

function extractDetailString(detail: unknown): string | null {
  if (typeof detail === 'string') {
    const t = detail.trim();
    return t.length > 0 ? t : null;
  }
  if (detail && typeof detail === 'object') {
    const record = detail as Record<string, unknown>;
    const code = record.code ?? record.error_code ?? record.error;
    if (typeof code === 'string' && code.trim()) return code.trim();
    const msg = record.message ?? record.msg;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return null;
}

function resolveScopeCode(text: string): EmpresaScopeErrorCode | null {
  const upper = text.toUpperCase();
  if (upper.includes('MISSING_SESSION_EMPRESA')) return 'MISSING_SESSION_EMPRESA';
  if (upper.includes('EMPRESA_SCOPE_MISMATCH')) return 'EMPRESA_SCOPE_MISMATCH';
  if (upper.includes('GLOBAL_PARAM_FORBIDDEN')) return 'GLOBAL_PARAM_FORBIDDEN';
  return null;
}

/**
 * Detecta errores 403 de ámbito empresa (JWT/session) en respuestas FastAPI.
 */
export function parseEmpresaScopeError(error: unknown): EmpresaScopeErrorInfo | null {
  if (!axios.isAxiosError(error) || !error.response) return null;
  const status = error.response.status;
  if (status !== 403) return null;

  const data = error.response.data;
  let detail: unknown = data;
  if (typeof data === 'string') {
    try {
      detail = JSON.parse(data) as unknown;
    } catch {
      detail = data;
    }
  }

  const detailStr =
    detail && typeof detail === 'object' && 'detail' in detail
      ? extractDetailString((detail as { detail: unknown }).detail)
      : extractDetailString(detail);

  if (!detailStr) return null;

  const code = resolveScopeCode(detailStr);
  if (!code) return null;

  return {
    code,
    message: CODE_MESSAGES[code],
    status,
  };
}

export function isEmpresaScopeAxiosError(error: unknown): error is AxiosError {
  return parseEmpresaScopeError(error) !== null;
}
