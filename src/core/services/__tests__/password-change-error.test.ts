import { describe, it, expect } from 'vitest';
import axios from 'axios';
import {
  getApiErrorCode,
  isPasswordChangeRequired,
} from '@/core/services/error.service';
import { ERROR_CODE_PASSWORD_CHANGE_REQUIRED } from '@/features/auth/types/auth.types';

function makeAxios403(errorCode?: string) {
  return new axios.AxiosError(
    'Forbidden',
    '403',
    undefined,
    undefined,
    {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: {
        detail: 'Debe cambiar su contraseña antes de acceder a este recurso.',
        error_code: errorCode,
      },
    },
  );
}

describe('password change error helpers', () => {
  it('getApiErrorCode extrae error_code del body', () => {
    const error = makeAxios403(ERROR_CODE_PASSWORD_CHANGE_REQUIRED);
    expect(getApiErrorCode(error)).toBe(ERROR_CODE_PASSWORD_CHANGE_REQUIRED);
  });

  it('isPasswordChangeRequired es true solo para 403 + código oficial', () => {
    expect(isPasswordChangeRequired(makeAxios403(ERROR_CODE_PASSWORD_CHANGE_REQUIRED))).toBe(
      true,
    );
    expect(isPasswordChangeRequired(makeAxios403('OTHER_CODE'))).toBe(false);
    expect(isPasswordChangeRequired(new Error('x'))).toBe(false);
  });
});
