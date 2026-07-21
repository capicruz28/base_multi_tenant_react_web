import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import CreateConnectionModal from '../CreateConnectionModal';
import { DEDICATED_CONNECTION_REPAIR_WARNING } from '../../utils/cliente-connection-governance.utils';

vi.mock('../../services/conexion.service', () => ({
  conexionService: {
    testConexion: vi.fn(),
    createConexion: vi.fn(),
  },
}));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  clienteId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  tipoInstalacion: 'dedicated' as const,
};

describe('CreateConnectionModal — modo repair PR-E', () => {
  it('modo standard no muestra advertencia repair', () => {
    render(<CreateConnectionModal {...baseProps} mode="standard" />);

    expect(screen.getByRole('heading', { name: /crear nueva conexión/i })).toBeInTheDocument();
    expect(screen.queryByText(DEDICATED_CONNECTION_REPAIR_WARNING)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^crear conexión$/i })).toBeInTheDocument();
  });

  it('modo repair muestra advertencia y copy ops', () => {
    render(<CreateConnectionModal {...baseProps} mode="repair" />);

    expect(
      screen.getByRole('heading', { name: /reparar conexión principal/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(DEDICATED_CONNECTION_REPAIR_WARNING)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /registrar conexión \(repair\)/i }),
    ).toBeInTheDocument();
  });
});
