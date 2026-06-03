import { describe, it, expect } from 'vitest';
import axios, { AxiosError } from 'axios';
import { getErrorMessage, getValidationErrors } from '../error.service';

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

  it('fallback 400 sin detail no menciona campos en rojo', () => {
    const err = axiosErrorWith(400, {});
    const message = getErrorMessage(err).message;
    expect(message).toBe('Los datos enviados son incorrectos.');
    expect(message).not.toContain('rojo');
  });

  it('fallback 422 sin detail no menciona campos en rojo', () => {
    const err = axiosErrorWith(422, {});
    const message = getErrorMessage(err).message;
    expect(message).toBe('Los datos enviados no son válidos.');
    expect(message).not.toContain('rojo');
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

describe('getValidationErrors', () => {
  it('mapea fieldErrors desde detail 422 por loc', () => {
    const err = axiosErrorWith(422, {
      detail: [{ msg: 'Email inválido', loc: ['body', 'contacto_email'] }],
    });
    const result = getValidationErrors(err);
    expect(result.fieldErrors.contacto_email).toBe('Email inválido');
    expect(result.status).toBe(422);
  });

  it('usa mensaje genérico 422 sin fieldErrors mapeables', () => {
    const err = axiosErrorWith(422, {});
    const result = getValidationErrors(err);
    expect(result.fieldErrors).toEqual({});
    expect(result.message).toBe('Los datos enviados no son válidos.');
  });

  it('usa copy coherente con UI cuando hay fieldErrors sin detail string', () => {
    const err = axiosErrorWith(422, {
      detail: [{ msg: 'Campo requerido', loc: ['body', 'razon_social'] }],
    });
    const result = getValidationErrors(err);
    expect(result.fieldErrors.razon_social).toBe('Campo requerido');
    expect(result.message).toBe('Campo requerido');
  });

  it('fallback 400 sin fieldErrors', () => {
    const err = axiosErrorWith(400, {});
    expect(getValidationErrors(err).message).toBe('Los datos enviados son incorrectos.');
  });
});
