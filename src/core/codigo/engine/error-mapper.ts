import axios from 'axios';

import { getErrorMessage, getValidationErrors } from '@/core/services/error.service';

import type { CodigoFieldError } from './codigo-engine.types';

const CODIGO_CONFLICT_MESSAGE = 'El código ya existe. Ingresa uno diferente.';
const CODIGO_INVALID_MESSAGE = 'El código no es válido.';

function isDuplicateDetail(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('already exists') ||
    lower.includes('duplicate') ||
    lower.includes('ya existe') ||
    lower.includes('unique constraint')
  );
}

function isCodigoFieldKey(fieldKey: string, candidate: string): boolean {
  return candidate === fieldKey || candidate === 'codigo' || candidate === 'codigo_empresa';
}

/**
 * Mapea errores Axios relacionados con el campo código.
 * Prepara 400/409 y mensajes inline sin alterar UX de módulos consumidores.
 */
export function mapCodigoFieldError(error: unknown, fieldKey: string): CodigoFieldError {
  if (!axios.isAxiosError(error) || !error.response) {
    const fallback = getErrorMessage(error);
    return {
      fieldKey,
      message: fallback.message,
      httpStatus: fallback.status || undefined,
      kind: 'technical',
    };
  }

  const status = error.response.status;
  const validation = getValidationErrors(error);

  const directFieldMessage = validation.fieldErrors[fieldKey];
  if (directFieldMessage) {
    return {
      fieldKey,
      message: directFieldMessage,
      httpStatus: status,
      kind: 'field',
    };
  }

  for (const [key, message] of Object.entries(validation.fieldErrors)) {
    if (isCodigoFieldKey(fieldKey, key)) {
      return {
        fieldKey,
        message,
        httpStatus: status,
        kind: 'field',
      };
    }
  }

  if (status === 409) {
    return {
      fieldKey,
      message: CODIGO_CONFLICT_MESSAGE,
      httpStatus: status,
      kind: 'field',
    };
  }

  if (status === 400 || status === 422) {
    const detailMessage = validation.message;
    if (isDuplicateDetail(detailMessage)) {
      return {
        fieldKey,
        message: CODIGO_CONFLICT_MESSAGE,
        httpStatus: status,
        kind: 'field',
      };
    }

    return {
      fieldKey,
      message: detailMessage || CODIGO_INVALID_MESSAGE,
      httpStatus: status,
      kind: 'field',
    };
  }

  const simplified = getErrorMessage(error);
  return {
    fieldKey,
    message: simplified.message,
    httpStatus: status,
    kind: 'technical',
  };
}

export function applyCodigoFieldErrorToController(
  mapped: CodigoFieldError,
): { errorMessage: string; uiPhase: 'error' } {
  return {
    errorMessage: mapped.message,
    uiPhase: 'error',
  };
}
