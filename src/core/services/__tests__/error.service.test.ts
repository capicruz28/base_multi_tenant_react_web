import { describe, it, expect } from 'vitest';
import axios, { AxiosError } from 'axios';
import {
  getErrorMessage,
  getValidationErrors,
  sanitizeFieldMessage,
  FORM_VALIDATION_TOAST_MESSAGE,
} from '../error.service';

function axiosErrorWith(
  status: number,
  data: { detail?: string | { msg: string; type?: string; loc?: (string | number)[] }[] },
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

const QA_EMAIL_PYDANTIC_MSG =
  'body.contacto_email: value is not a valid email address: The part after the @-sign is a special-use or reserved name that cannot be used with email.';

describe('getErrorMessage', () => {
  it('resuelve detail string de conflicto 409 (Axios)', () => {
    const err = axiosErrorWith(409, { detail: 'El subdominio ya está registrado' });
    expect(getErrorMessage(err).message).toBe('El subdominio ya está registrado');
  });

  it('422 con fieldErrors mapeados devuelve toast genérico, no Pydantic', () => {
    const err = axiosErrorWith(422, {
      detail: [{ msg: QA_EMAIL_PYDANTIC_MSG, loc: ['body', 'contacto_email'] }],
    });
    const message = getErrorMessage(err).message;
    expect(message).toBe(FORM_VALIDATION_TOAST_MESSAGE);
    expect(message).not.toContain('body.');
    expect(message).not.toContain('valid email address');
  });

  it('concatena detail array 422 legible cuando no hay loc mapeable', () => {
    const err = axiosErrorWith(422, {
      detail: [{ msg: 'Email inválido', loc: ['body'] }],
    });
    expect(getErrorMessage(err).message).toBe('Email inválido');
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
});

describe('sanitizeFieldMessage', () => {
  it('caso QA: contacto_email inválido sin prefijos técnicos', () => {
    const result = sanitizeFieldMessage(QA_EMAIL_PYDANTIC_MSG, 'contacto_email');
    expect(result).toBe('El email de contacto no es válido.');
    expect(result).not.toContain('body.');
    expect(result).not.toContain('valid email address');
  });

  it('elimina prefijo body.campo:', () => {
    const result = sanitizeFieldMessage('body.razon_social: field required', 'razon_social');
    expect(result).toBe('Este campo es obligatorio.');
    expect(result).not.toContain('body.');
  });
});

describe('getValidationErrors', () => {
  it('caso QA: mapea contacto_email con mensaje amigable', () => {
    const err = axiosErrorWith(422, {
      detail: [{ msg: QA_EMAIL_PYDANTIC_MSG, loc: ['body', 'contacto_email'] }],
    });
    const result = getValidationErrors(err);
    expect(result.fieldErrors.contacto_email).toBe('El email de contacto no es válido.');
    expect(result.message).toBe(FORM_VALIDATION_TOAST_MESSAGE);
    expect(result.status).toBe(422);
  });

  it('usa mensaje genérico 422 sin fieldErrors mapeables', () => {
    const err = axiosErrorWith(422, {});
    const result = getValidationErrors(err);
    expect(result.fieldErrors).toEqual({});
    expect(result.message).toBe('Los datos enviados no son válidos.');
  });

  it('sanitiza razon_social required', () => {
    const err = axiosErrorWith(422, {
      detail: [{ msg: 'Field required', type: 'missing', loc: ['body', 'razon_social'] }],
    });
    const result = getValidationErrors(err);
    expect(result.fieldErrors.razon_social).toBe('Este campo es obligatorio.');
    expect(result.message).toBe(FORM_VALIDATION_TOAST_MESSAGE);
  });

  it('fallback 400 sin fieldErrors', () => {
    const err = axiosErrorWith(400, {});
    expect(getValidationErrors(err).message).toBe('Los datos enviados son incorrectos.');
  });

  it('parsea detail string con prefijo body.campo:', () => {
    const err = axiosErrorWith(422, { detail: QA_EMAIL_PYDANTIC_MSG });
    const result = getValidationErrors(err);
    expect(result.fieldErrors.contacto_email).toBe('El email de contacto no es válido.');
  });
});
