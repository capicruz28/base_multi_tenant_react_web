import axios from 'axios';
import { describe, it, expect } from 'vitest';

import { mapCodigoFieldError } from '../error-mapper';

describe('error-mapper', () => {
  it('mapea 409 a mensaje de conflicto inline', () => {
    const error = new axios.AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: { headers: {} } as never,
        data: { detail: 'Duplicate key' },
      },
    );

    const mapped = mapCodigoFieldError(error, 'codigo');
    expect(mapped.kind).toBe('field');
    expect(mapped.httpStatus).toBe(409);
    expect(mapped.message).toMatch(/ya existe/i);
  });

  it('extrae fieldErrors Pydantic para fieldKey', () => {
    const error = new axios.AxiosError(
      'Validation',
      '422',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: {} } as never,
        data: {
          detail: [{ type: 'value_error', loc: ['body', 'codigo'], msg: 'Invalid code' }],
        },
      },
    );

    const mapped = mapCodigoFieldError(error, 'codigo');
    expect(mapped.kind).toBe('field');
    expect(mapped.httpStatus).toBe(422);
    expect(mapped.message).toBeTruthy();
  });
});
