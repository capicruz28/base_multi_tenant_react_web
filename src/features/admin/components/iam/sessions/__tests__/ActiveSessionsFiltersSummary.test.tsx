import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActiveSessionsFiltersSummary } from '@/features/admin/components/iam/sessions/ActiveSessionsFiltersSummary';

describe('ActiveSessionsFiltersSummary', () => {
  it('muestra resumen de usuario, plataforma y orden', () => {
    render(
      <ActiveSessionsFiltersSummary
        usuarioLabel="jdoe — Juan Doe"
        clientTypeFilter="web"
        sortBy="expires_at"
        sortOrder="asc"
      />,
    );

    expect(screen.getByText('jdoe — Juan Doe')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.getByText('Próximas a expirar')).toBeInTheDocument();
  });

  it('usa valores por defecto cuando no hay filtros', () => {
    render(
      <ActiveSessionsFiltersSummary
        usuarioLabel={null}
        clientTypeFilter="all"
        sortBy={undefined}
        sortOrder="desc"
      />,
    );

    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Predeterminado')).toBeInTheDocument();
  });
});
