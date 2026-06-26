import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import { AccountCenterSidebar } from '@/features/account/components/AccountCenterSidebar';

describe('AccountCenterSidebar', () => {
  it('renderiza 4 ítems de navegación', () => {
    render(
      <MemoryRouter initialEntries={['/app/cuenta/informacion']}>
        <AccountCenterSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('complementary', { name: 'Navegación Mi cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Información personal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Seguridad/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sesiones/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Preferencias/i })).toBeInTheDocument();
  });
});
