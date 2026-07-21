import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProvisioningFailedPanel } from '../ProvisioningFailedPanel';

describe('ProvisioningFailedPanel', () => {
  it('muestra mensaje mapeado para código saga conocido', () => {
    render(
      <ProvisioningFailedPanel
        lastErrorCode="PROVISIONING_SCHEMA_FAILED"
        lastErrorMessage="detalle sanitizado"
        retryAllowed={false}
      />,
    );

    expect(screen.getByText('Error al aplicar esquema')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('muestra botón reintentar solo si retry_allowed', () => {
    const onRetry = vi.fn();
    render(
      <ProvisioningFailedPanel
        lastErrorCode="PROVISIONING_CREATE_DATABASE_FAILED"
        lastErrorMessage={null}
        retryAllowed
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /reintentar provisioning/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
