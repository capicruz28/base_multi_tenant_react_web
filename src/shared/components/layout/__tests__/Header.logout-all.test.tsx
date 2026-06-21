import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Header from '@/shared/components/layout/Header';
import { LOGOUT_ALL_DIALOG_TITLE } from '@/features/auth/components/LogoutAllConfirmDialog';

const logoutAllSessionsMock = vi.fn();
const logoutMock = vi.fn();

let sessionLogoutV3Enabled = true;

vi.mock('@/core/auth/session/session-logout-v3.flags', () => ({
  get SESSION_LOGOUT_V3_ENABLED() {
    return sessionLogoutV3Enabled;
  },
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

function renderHeader(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

function openUserMenu(): void {
  fireEvent.click(screen.getByRole('button', { name: /Ana/i }));
}

describe('Header logout all UI (IMPL-07)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionLogoutV3Enabled = true;
    logoutAllSessionsMock.mockResolvedValue(undefined);
  });

  it('renderiza la opción cuando SESSION_LOGOUT_V3_ENABLED está ON', () => {
    renderHeader();
    openUserMenu();

    expect(
      screen.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }),
    ).toBeTruthy();
  });

  it('no renderiza la opción cuando SESSION_LOGOUT_V3_ENABLED está OFF', () => {
    sessionLogoutV3Enabled = false;

    renderHeader();
    openUserMenu();

    expect(
      screen.queryByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }),
    ).toBeNull();
  });

  it('abre LogoutAllConfirmDialog al seleccionar la acción', () => {
    renderHeader();
    openUserMenu();

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }),
    );

    expect(screen.getByRole('heading', { name: LOGOUT_ALL_DIALOG_TITLE })).toBeTruthy();
  });

  it('cierra el diálogo al cancelar', () => {
    renderHeader();
    openUserMenu();
    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('heading', { name: LOGOUT_ALL_DIALOG_TITLE })).toBeNull();
  });

  it('confirma y llama logoutAllSessions una sola vez', async () => {
    renderHeader();
    openUserMenu();
    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar todas las sesiones' }));

    await waitFor(() => {
      expect(logoutAllSessionsMock).toHaveBeenCalledTimes(1);
    });
  });

  it('deshabilita acciones de salida durante pending', async () => {
    let releaseLogoutAll: (() => void) | null = null;
    logoutAllSessionsMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseLogoutAll = resolve;
        }),
    );

    renderHeader();
    openUserMenu();
    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar todas las sesiones' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cerrar todas las sesiones' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });

    openUserMenu();
    expect(screen.getByRole('button', { name: 'Cerrar Sesión' })).toBeDisabled();

    releaseLogoutAll?.();
    await waitFor(() => {
      expect(logoutAllSessionsMock).toHaveBeenCalledTimes(1);
    });
  });

  it('expone aria-label accesible en la acción del menú', () => {
    renderHeader();
    openUserMenu();

    expect(
      screen.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }),
    ).toHaveAttribute('aria-label', 'Cerrar sesión en todos los dispositivos');
  });
});
