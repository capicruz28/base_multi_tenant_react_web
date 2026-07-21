import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CfgSecuenciaFormatoFields } from '../CfgSecuenciaFormatoFields';
import type { CfgSecuenciaFormatoForm } from '../../types/cfg-list.types';

const baseline: CfgSecuenciaFormatoForm = {
  prefijo: 'EMP',
  separador: '-',
  longitud_numero: 4,
  numero_inicial: 1,
  generation_policy: 'AUTO_DEFAULT',
};

describe('CfgSecuenciaFormatoFields', () => {
  it('normaliza prefijo a uppercase en onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = React.useState(baseline);
      return (
        <CfgSecuenciaFormatoFields
          idPrefix="test"
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
          errors={{}}
          disabled={false}
        />
      );
    }

    render(<Harness />);

    const input = screen.getByLabelText('Prefijo');
    await user.clear(input);
    await user.type(input, 'dep');

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)?.[0] as CfgSecuenciaFormatoForm;
    expect(last.prefijo).toBe('DEP');
  });

  it('disabled no permite editar', () => {
    render(
      <CfgSecuenciaFormatoFields
        idPrefix="test"
        value={baseline}
        onChange={vi.fn()}
        errors={{}}
        disabled
      />,
    );
    expect(screen.getByLabelText('Prefijo')).toBeDisabled();
    expect(screen.getByLabelText('Separador')).toBeDisabled();
    expect(screen.getByLabelText('Política de generación')).toBeDisabled();
  });

  it('muestra selector de generation_policy con labels de negocio', () => {
    render(
      <CfgSecuenciaFormatoFields
        idPrefix="test"
        value={baseline}
        onChange={vi.fn()}
        errors={{}}
        disabled={false}
      />,
    );
    const policy = screen.getByLabelText('Política de generación');
    expect(policy).toHaveValue('AUTO_DEFAULT');
    expect(screen.getByRole('option', { name: 'Automático obligatorio' })).toHaveValue(
      'AUTO_REQUIRED',
    );
    expect(screen.getByRole('option', { name: 'Automático sugerido' })).toHaveValue(
      'AUTO_DEFAULT',
    );
    expect(screen.getByRole('option', { name: 'Solo manual' })).toHaveValue(
      'MANUAL_ONLY',
    );
  });

  it('muestra labels de separador y ejemplo local', () => {
    render(
      <CfgSecuenciaFormatoFields
        idPrefix="test"
        value={baseline}
        onChange={vi.fn()}
        errors={{}}
        disabled={false}
      />,
    );
    expect(screen.getByRole('option', { name: 'Sin separador' })).toHaveValue(
      '',
    );
    expect(screen.getByRole('option', { name: 'Guion (-)' })).toHaveValue('-');
    expect(screen.getByText('Ejemplo')).toBeInTheDocument();
    expect(screen.getByText('EMP-0001')).toBeInTheDocument();
  });

  it('actualiza ejemplo al cambiar formato', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = React.useState(baseline);
      return (
        <CfgSecuenciaFormatoFields
          idPrefix="test"
          value={value}
          onChange={setValue}
          errors={{}}
          disabled={false}
        />
      );
    }

    render(<Harness />);
    expect(screen.getByText('EMP-0001')).toBeInTheDocument();

    const prefijo = screen.getByLabelText('Prefijo');
    await user.clear(prefijo);
    await user.type(prefijo, 'ALM');
    expect(screen.getByText('ALM-0001')).toBeInTheDocument();
  });

  it('muestra errores de campo', () => {
    render(
      <CfgSecuenciaFormatoFields
        idPrefix="test"
        value={baseline}
        onChange={vi.fn()}
        errors={{ prefijo: 'El prefijo no es válido.' }}
        disabled={false}
      />,
    );
    expect(screen.getByText('El prefijo no es válido.')).toBeInTheDocument();
  });
});
