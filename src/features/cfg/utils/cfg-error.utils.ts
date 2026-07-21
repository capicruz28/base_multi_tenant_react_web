/**
 * Mapa de errores funcionales CFG — docs/frontend-contracts/cfg/03_ERROR_HANDLING.md
 */

import axios from 'axios';
import type { CfgSecuenciaFieldErrors } from '../types/cfg-list.types';

export const CFG_ERROR_CODES = {
  ORG_EMPRESA_CFG_LOCKED: 'ORG_EMPRESA_CFG_LOCKED',
  CFG_PREFIX_INVALID: 'CFG_PREFIX_INVALID',
  CFG_SEPARATOR_INVALID: 'CFG_SEPARATOR_INVALID',
  CFG_PADDING_INVALID: 'CFG_PADDING_INVALID',
  CFG_NUMERO_INICIAL_INVALID: 'CFG_NUMERO_INICIAL_INVALID',
  PREVIEW_NOT_ALLOWED: 'PREVIEW_NOT_ALLOWED',
  INVALID_SORT_COLUMN: 'INVALID_SORT_COLUMN',
} as const;

export type CfgErrorCode =
  (typeof CFG_ERROR_CODES)[keyof typeof CFG_ERROR_CODES];

const USER_MESSAGES: Record<CfgErrorCode, string> = {
  ORG_EMPRESA_CFG_LOCKED:
    'Esta secuencia está bloqueada y no se puede modificar ni desactivar.',
  CFG_PREFIX_INVALID:
    'El prefijo no es válido. Use hasta 10 caracteres alfanuméricos.',
  CFG_SEPARATOR_INVALID: "El separador solo puede estar vacío o ser '-'.",
  CFG_PADDING_INVALID:
    'La longitud del número debe ser un entero mayor o igual a 1.',
  CFG_NUMERO_INICIAL_INVALID:
    'El número inicial debe ser mayor o igual a 1.',
  PREVIEW_NOT_ALLOWED:
    'La previsualización no está disponible para esta secuencia.',
  INVALID_SORT_COLUMN: 'Columna de orden no válida.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readInternalCodeFromData(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const direct = data.internal_code ?? data.code;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const detail = data.detail;
  if (isRecord(detail)) {
    const nested = detail.internal_code ?? detail.code;
    if (typeof nested === 'string' && nested.trim()) {
      return nested.trim();
    }
  }

  if (typeof detail === 'string') {
    for (const code of Object.values(CFG_ERROR_CODES)) {
      if (detail.includes(code)) return code;
    }
  }

  return null;
}

export function extractCfgInternalCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    return readInternalCodeFromData(error.response?.data);
  }
  if (isRecord(error)) {
    return readInternalCodeFromData(error);
  }
  return null;
}

export function mapCfgErrorToFieldErrors(error: unknown): CfgSecuenciaFieldErrors {
  const code = extractCfgInternalCode(error);
  switch (code) {
    case CFG_ERROR_CODES.CFG_PREFIX_INVALID:
      return { prefijo: USER_MESSAGES.CFG_PREFIX_INVALID };
    case CFG_ERROR_CODES.CFG_SEPARATOR_INVALID:
      return { separador: USER_MESSAGES.CFG_SEPARATOR_INVALID };
    case CFG_ERROR_CODES.CFG_PADDING_INVALID:
      return { longitud_numero: USER_MESSAGES.CFG_PADDING_INVALID };
    case CFG_ERROR_CODES.CFG_NUMERO_INICIAL_INVALID:
      return { numero_inicial: USER_MESSAGES.CFG_NUMERO_INICIAL_INVALID };
    default:
      return {};
  }
}

export function isCfgLockedError(error: unknown): boolean {
  return extractCfgInternalCode(error) === CFG_ERROR_CODES.ORG_EMPRESA_CFG_LOCKED;
}

export function isCfgPreviewNotAllowed(error: unknown): boolean {
  return extractCfgInternalCode(error) === CFG_ERROR_CODES.PREVIEW_NOT_ALLOWED;
}

export function getCfgUserMessage(error: unknown): string {
  const code = extractCfgInternalCode(error);
  if (code && code in USER_MESSAGES) {
    return USER_MESSAGES[code as CfgErrorCode];
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (isRecord(data) && typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail.trim();
    }
    const status = error.response?.status;
    if (status === 403) return 'No tiene permiso para esta acción.';
    if (status === 404) {
      return 'La secuencia no existe o no está disponible.';
    }
    if (status === 401) return 'Sesión expirada. Vuelva a iniciar sesión.';
    if (status !== undefined && status >= 500) {
      return 'No se pudo completar la operación. Intente de nuevo.';
    }
  }

  return 'No se pudo completar la operación. Intente de nuevo.';
}
