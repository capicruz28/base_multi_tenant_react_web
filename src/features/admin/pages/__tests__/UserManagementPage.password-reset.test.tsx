import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import UserManagementPage from '@/features/admin/pages/UserManagementPage';

vi.mock('@/features/inv/components/InvPageLayout', () => ({
  InvPageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/org/components/OrgCompanyToolbar', () => ({
  OrgCompanyToolbar: ({
    children,
    actions,
  }: {
    children?: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
}));

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    clienteInfo: { cliente_id: 'client-1' },
    auth: { user: { usuario_id: 'admin-1', cliente_id: 'client-1' } },
  }),
}));

vi.mock('@/core/auth/PermissionContext', () => ({
  usePermission: () => ({
    hasPermission: (code: string) => code === 'admin.usuario.reset_password',
    permissions: ['admin.usuario.reset_password'],
    loading: false,
    permissionsInitialized: true,
  }),
}));

vi.mock('@/features/admin/hooks/useUsersList', () => ({
  useUsersList: () => ({
    items: [
      {
        usuario_id: 'user-target',
        cliente_id: 'client-1',
        nombre_usuario: 'jperez',
        correo: 'jperez@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        es_activo: true,
        correo_confirmado: true,
        proveedor_autenticacion: 'local',
        fecha_creacion: '2026-01-01T00:00:00Z',
        roles: [],
      },
      {
        usuario_id: 'admin-1',
        cliente_id: 'client-1',
        nombre_usuario: 'admin',
        correo: 'admin@example.com',
        es_activo: true,
        correo_confirmado: true,
        proveedor_autenticacion: 'local',
        fecha_creacion: '2026-01-01T00:00:00Z',
        roles: [],
      },
      {
        usuario_id: 'sso-user',
        cliente_id: 'client-1',
        nombre_usuario: 'sso',
        correo: 'sso@example.com',
        es_activo: true,
        correo_confirmado: true,
        proveedor_autenticacion: 'azure',
        fecha_creacion: '2026-01-01T00:00:00Z',
        roles: [],
      },
    ],
    pagination: {
      total: 3,
      pagina_actual: 1,
      total_paginas: 1,
      limit: 25,
    },
    page: 1,
    setPage: vi.fn(),
    limit: 25,
    setLimit: vi.fn(),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  invalidateUsersListQueries: vi.fn(),
  DEFAULT_USERS_LIST_LIMIT: 25,
  USERS_LIST_QUERY_KEY: ['admin', 'users', 'list'],
}));

vi.mock('@/features/admin/hooks/useResetUserPassword', () => ({
  useResetUserPassword: () => ({
    resetPassword: vi.fn(),
    isResetPending: false,
  }),
}));

vi.mock('@/features/admin/services/rol.service', () => ({
  getAllActiveRoles: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/core/list', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/list')>();
  return {
    ...actual,
    useDebouncedSearch: () => ({
      inputValue: '',
      setInputValue: vi.fn(),
      debouncedValue: '',
      hasSearch: false,
    }),
  };
});

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserManagementPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UserManagementPage — password reset integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra botón reset solo para usuario local ajeno con permiso', () => {
    renderPage();

    const resetButtons = screen.getAllByRole('button', { name: 'Restablecer contraseña' });
    expect(resetButtons).toHaveLength(1);
  });

  it('no muestra reset para fila del admin autenticado ni SSO', () => {
    renderPage();

    const rows = screen.getAllByRole('row');
    const adminRow = rows.find((row) => row.textContent?.includes('admin@example.com'));
    const ssoRow = rows.find((row) => row.textContent?.includes('sso@example.com'));

    expect(adminRow?.querySelector('[title="Restablecer contraseña"]')).toBeNull();
    expect(ssoRow?.querySelector('[title="Restablecer contraseña"]')).toBeNull();
  });
});
