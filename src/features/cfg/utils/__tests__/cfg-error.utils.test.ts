import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import {
  CFG_ERROR_CODES,
  extractCfgInternalCode,
  getCfgUserMessage,
  isCfgLockedError,
  isCfgPreviewNotAllowed,
  mapCfgErrorToFieldErrors,
} from '../cfg-error.utils';

function axiosErrorWithCode(code: string, status = 422): AxiosError {
  return new AxiosError(
    'Request failed',
    undefined,
    undefined,
    undefined,
    {
      status,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: { internal_code: code, detail: code },
    },
  );
}

describe('cfg-error.utils', () => {
  it('extractCfgInternalCode lee internal_code', () => {
    expect(
      extractCfgInternalCode(
        axiosErrorWithCode(CFG_ERROR_CODES.CFG_PREFIX_INVALID),
      ),
    ).toBe(CFG_ERROR_CODES.CFG_PREFIX_INVALID);
  });

  it('mapCfgErrorToFieldErrors por código', () => {
    expect(
      mapCfgErrorToFieldErrors(
        axiosErrorWithCode(CFG_ERROR_CODES.CFG_PREFIX_INVALID),
      ),
    ).toEqual({
      prefijo:
        'El prefijo no es válido. Use hasta 10 caracteres alfanuméricos.',
    });
    expect(
      mapCfgErrorToFieldErrors(
        axiosErrorWithCode(CFG_ERROR_CODES.CFG_SEPARATOR_INVALID),
      ),
    ).toHaveProperty('separador');
    expect(
      mapCfgErrorToFieldErrors(
        axiosErrorWithCode(CFG_ERROR_CODES.CFG_PADDING_INVALID),
      ),
    ).toHaveProperty('longitud_numero');
    expect(
      mapCfgErrorToFieldErrors(
        axiosErrorWithCode(CFG_ERROR_CODES.CFG_NUMERO_INICIAL_INVALID),
      ),
    ).toHaveProperty('numero_inicial');
  });

  it('isCfgLockedError / isCfgPreviewNotAllowed', () => {
    expect(
      isCfgLockedError(
        axiosErrorWithCode(CFG_ERROR_CODES.ORG_EMPRESA_CFG_LOCKED),
      ),
    ).toBe(true);
    expect(
      isCfgPreviewNotAllowed(
        axiosErrorWithCode(CFG_ERROR_CODES.PREVIEW_NOT_ALLOWED),
      ),
    ).toBe(true);
    expect(isCfgLockedError(axiosErrorWithCode(CFG_ERROR_CODES.CFG_PREFIX_INVALID))).toBe(
      false,
    );
  });

  it('getCfgUserMessage usa mensaje de contrato', () => {
    expect(
      getCfgUserMessage(
        axiosErrorWithCode(CFG_ERROR_CODES.INVALID_SORT_COLUMN),
      ),
    ).toBe('Columna de orden no válida.');
  });
});
