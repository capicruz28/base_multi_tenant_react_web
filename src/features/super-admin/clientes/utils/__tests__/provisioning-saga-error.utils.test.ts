import { describe, expect, it } from 'vitest';

import { getProvisioningSagaErrorMessage } from '../provisioning-saga-error.utils';

describe('provisioning-saga-error.utils', () => {
  it('mapea códigos saga del contrato UI', () => {
    expect(getProvisioningSagaErrorMessage('PROVISIONING_ABORTED', null)).toBe(
      'Provisioning cancelado por operador',
    );
  });

  it('usa fallback sanitizado cuando el código es desconocido', () => {
    expect(getProvisioningSagaErrorMessage('OTHER', 'Mensaje del backend')).toBe(
      'Mensaje del backend',
    );
  });
});
