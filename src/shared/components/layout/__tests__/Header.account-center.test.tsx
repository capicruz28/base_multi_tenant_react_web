import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Header from '@/shared/components/layout/Header';
import {
  ACCOUNT_CENTER_BASE_PATH,
  ACCOUNT_CENTER_SESSIONS_PATH,
} from '@/features/account/account.routes';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const logoutAllSessionsMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('@/core/auth/session/session-logout-v3.flags', () => ({
  SESSION_LOGOUT_V3_ENABLED: true,
}));

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    auth: {
      user: {
        nombre: 'Ana',
        apellido: 'Pérez',
        correo: 'ana@example.com',
      },
      token: 'token-1',
    },
    logout: logoutMock,
    logoutAllSessions: logoutAllSessionsMock,
    menuModulos: [],
    isAuthenticated: true,
    isImpersonation: false,
    requiereSeleccionEmpresa: false,
    requiresPasswordChange: false,
  }),
}));

vi.mock('@/shared/context/BreadcrumbContext', () => ({
  useBreadcrumb: () => ({
    breadcrumbs: [],
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock('@/shared/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
  }),
}));

vi.mock('@/shared/context/NavModeContext', () => ({
  useNavMode: () => ({
    navMode: 'sidebar',
    toggleNavMode: vi.fn(),
  }),
}));

vi.mock('@/shared/components/layout/LayoutShellContext', () => ({
  useLayoutShell: () => 'app',
}));

vi.mock('@/core/hooks/useUserType', () => ({
  default: () => ({
    isSuperAdminUser: false,
    isTenantAdminUser: true,
    accessLevel: 2,
    clienteInfo: {
      razon_social: 'Cliente Demo',
      nombre_comercial: 'Demo',
      subdominio: 'demo',
    },
  }),
}));

vi.mock('@/shared/components/layout/MenuSelector', () => ({
  useAdminMenuItems: () => ({ items: [] }),
}));

vi.mock('@/shared/components/layout/useShellBreadcrumbs', () => ({
  useShellBreadcrumbs: () => [],
}));

vi.mock('@/shared/components/layout/GlobalSearch', () => ({
  default: () => <div data-testid="global-search" />,
}));

vi.mock('@/shared/components/layout/EmpresaSelector', () => ({
  default: () => <div data-testid="empresa-selector" />,
}));

vi.mock('@/shared/components/layout/ShellCrossNav', () => ({
  default: () => null,
}));

function LocationProbe(): null {
  useLocation();
  return null;
}

function renderHeader(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <LocationProbe />
      <Header />
    </MemoryRouter>,
  );
}

function openUserMenu(): void {
  fireEvent.click(screen.getByRole('button', { name: /Ana/i }));
}

describe('Header account center (PR2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra Mi cuenta y elimina placeholders', () => {
    renderHeader();
    openUserMenu();

    expect(screen.getByRole('button', { name: 'Mi cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mis sesiones' })).toBeInTheDocument();
    expect(screen.queryByText('Mi perfil')).toBeNull();
    expect(screen.queryByText('Bandeja de entrada')).toBeNull();
    expect(screen.queryByText('Configuraciones de la cuenta')).toBeNull();
  });

  it('navega a /app/cuenta al seleccionar Mi cuenta', () => {
    renderHeader();
    openUserMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Mi cuenta' }));

    expect(navigateMock).toHaveBeenCalledWith(ACCOUNT_CENTER_BASE_PATH);
  });

  it('navega a sesiones con path SSOT', () => {
    renderHeader();
    openUserMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Mis sesiones' }));

    expect(navigateMock).toHaveBeenCalledWith(ACCOUNT_CENTER_SESSIONS_PATH);
  });
});
