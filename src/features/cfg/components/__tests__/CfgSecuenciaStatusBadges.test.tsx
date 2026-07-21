import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CfgSecuenciaStatusBadges } from '../CfgSecuenciaStatusBadges';

describe('CfgSecuenciaStatusBadges', () => {
  it('muestra Activa sin locked ni drift', () => {
    render(
      <CfgSecuenciaStatusBadges
        es_activo
        config_locked={false}
        policy_drift={false}
      />,
    );
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.queryByText('Inactiva')).not.toBeInTheDocument();
    expect(screen.queryByText('Bloqueada')).not.toBeInTheDocument();
    expect(screen.queryByText('Drift')).not.toBeInTheDocument();
  });

  it('muestra Inactiva', () => {
    render(
      <CfgSecuenciaStatusBadges
        es_activo={false}
        config_locked={false}
        policy_drift={false}
      />,
    );
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('combina Activa + Bloqueada + Drift', () => {
    render(
      <CfgSecuenciaStatusBadges
        es_activo
        config_locked
        policy_drift
      />,
    );
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Bloqueada')).toBeInTheDocument();
    expect(screen.getByText('Drift')).toBeInTheDocument();
  });
});
