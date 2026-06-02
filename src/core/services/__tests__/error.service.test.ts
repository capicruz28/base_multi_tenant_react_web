import { describe, it, expect } from 'vitest';
import axios, { AxiosError } from 'axios';
import { getErrorMessage } from '../error.service';

function axiosErrorWith(
  status: number,
  data: { detail?: string | { msg: string; loc?: (string | number)[] }[] },
): AxiosError {
  return new AxiosError(
    'Request failed',
    AxiosError.ERR_BAD_REQUEST,
    undefined,
    undefined,
    {
      status,
      data,
      headers: {},
      statusText: 'Error',
      config: {} as never,
    },
  );
}

describe('getErrorMessage', () => {
  it('resuelve detail string de conflicto 409 (Axios)', () => {
    const err = axiosErrorWith(409, { detail: 'El subdominio ya está registrado' });
    expect(getErrorMessage(err).message).toBe('El subdominio ya está registrado');
  });

  it('concatena detail array 422 (Pydantic)', () => {
    const err = axiosErrorWith(422, {
      detail: [
        { msg: 'Email inválido', loc: ['body', 'contacto_email'] },
        { msg: 'Campo requerido', loc: ['body', 'razon_social'] },
      ],
    });
    expect(getErrorMessage(err).message).toBe('Email inválido; Campo requerido');
  });

  it('usa fallback 409 si no hay detail', () => {
    const err = axiosErrorWith(409, {});
    expect(getErrorMessage(err).message).toContain('conflicto de duplicidad');
  });

  it('propaga Error.message de contrato FE sin Axios', () => {
    expect(getErrorMessage(new Error('Respuesta del servidor sin datos del cliente')).message).toBe(
      'Respuesta del servidor sin datos del cliente',
    );
  });

  it('no pierde mensaje tras simular cadena antigua (Error plano con texto API)', () => {
    const wrapped = new Error('El subdominio ya está registrado');
    expect(getErrorMessage(wrapped).message).toBe('El subdominio ya está registrado');
    expect(getErrorMessage(wrapped).message).not.toBe('Ocurrió un error inesperado en la aplicación.');
  });
});
