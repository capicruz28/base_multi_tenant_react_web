import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ClienteInfo, UserData } from '@/features/auth/types/auth.types';
import AccountProfilePage from '@/features/account/pages/AccountProfilePage';
import { AccountProfilePageSkeleton } from '@/features/account/components/profile/AccountProfilePageSkeleton';

const mockUser: UserData = {
  usuario_id: '00000000-0000-0000-0000-000000000001',
  cliente_id: '00000000-0000-0000-0000-000000000002',
  nombre_usuario: 'ana',
  correo: 'ana@example.com',
  nombre: 'Ana',
  apellido: 'López',
  es_activo: true,
  roles: ['Admin'],
};

const mockCliente: ClienteInfo = {
  cliente_id: '00000000-0000-0000-0000-000000000002',
  razon_social: 'Cliente Test',
  subdominio: 'cliente-test',
  tipo_instalacion: 'cloud',
  estado_suscripcion: 'activa',
};

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    auth: { user: mockUser, token: 'token' },
    loading: false,
    clienteInfo: mockCliente,
    accessLevel: 3,
    empresaActivaId: '00000000-0000-0000-0000-000000000010',
    empresasElegibles: [
      {
        empresa_id: '00000000-0000-0000-0000-000000000010',
        razon_social: 'Mi Empresa SAC',
      },
    ],
  }),
}));

describe('AccountProfilePage', () => {
  it('renderiza cards read-only desde AuthContext', () => {
    render(<AccountProfilePage />);

    expect(screen.getByTestId('account-profile-page')).toBeInTheDocument();
    expect(screen.getByText('Cuenta')).toBeInTheDocument();
    expect(screen.getByText('Ana López')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Cliente Test')).toBeInTheDocument();
    expect(screen.getByText('Mi Empresa SAC')).toBeInTheDocument();
    expect(screen.getAllByText('Admin')).toHaveLength(2);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(
      screen.getByText(/Los datos personales son administrados por el Administrador del sistema/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull();
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('renderiza skeleton de carga', () => {
    render(<AccountProfilePageSkeleton />);
    expect(screen.getByLabelText('Cargando información personal')).toBeInTheDocument();
  });
});
