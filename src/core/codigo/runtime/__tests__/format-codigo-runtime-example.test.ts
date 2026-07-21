import { describe, it, expect } from 'vitest';
import { formatCodigoRuntimeExample } from '../format-codigo-runtime-example';

describe('formatCodigoRuntimeExample', () => {
  it('arma ejemplo con guion y padding', () => {
    expect(
      formatCodigoRuntimeExample({
        prefijo: 'SUC',
        separador: '-',
        longitud_numero: 3,
      }),
    ).toBe('SUC-001');
  });

  it('sin separador', () => {
    expect(
      formatCodigoRuntimeExample({
        prefijo: 'EMP',
        separador: '',
        longitud_numero: 3,
      }),
    ).toBe('EMP001');
  });
});
