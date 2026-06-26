import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AccountPreferencesPage from '@/features/account/pages/AccountPreferencesPage';

const setThemeModeMock = vi.fn();
const setNavModeMock = vi.fn();

vi.mock('@/shared/context/ThemeContext', () => ({
  useTheme: () => ({
    themeMode: 'light',
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    setThemeMode: setThemeModeMock,
  }),
}));

vi.mock('@/shared/context/NavModeContext', () => ({
  useNavMode: () => ({
    navMode: 'sidebar',
    toggleNavMode: vi.fn(),
    setNavMode: setNavModeMock,
  }),
}));

describe('AccountPreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza cards Apariencia y Navegación', () => {
    render(<AccountPreferencesPage />);

    expect(screen.getByTestId('account-preferences-page')).toBeInTheDocument();
    expect(screen.getByText('Apariencia')).toBeInTheDocument();
    expect(screen.getByText('Navegación')).toBeInTheDocument();
    expect(screen.getByText(/Los cambios de tema se aplican inmediatamente/i)).toBeInTheDocument();
    expect(screen.getByText(/se guarda en este navegador/i)).toBeInTheDocument();
    expect(screen.getByText(/Estas preferencias se guardan solo en este navegador/i)).toBeInTheDocument();
  });

  it('llama setThemeMode al cambiar tema', () => {
    render(<AccountPreferencesPage />);

    fireEvent.click(screen.getByLabelText('Oscuro'));

    expect(setThemeModeMock).toHaveBeenCalledWith('dark');
  });

  it('llama setNavMode al cambiar navegación', () => {
    render(<AccountPreferencesPage />);

    fireEvent.click(screen.getByLabelText('Barra superior'));

    expect(setNavModeMock).toHaveBeenCalledWith('navbar');
  });
});
