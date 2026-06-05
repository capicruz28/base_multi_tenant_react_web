import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PermissionGuard } from '../PermissionGuard';

const mockCan = vi.fn();
const mockUsePermissions = vi.fn();

vi.mock('@/core/auth/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

function renderGuard(menuPermissionsReady: boolean, canResult: boolean) {
  mockCan.mockReturnValue(canResult);
  mockUsePermissions.mockReturnValue({
    can: mockCan,
    menuPermissionsReady,
  });

  return render(
    <MemoryRouter initialEntries={['/app/inv']}>
      <Routes>
        <Route
          path="/app/inv"
          element={
            <PermissionGuard module="inv" action="ver">
              <div data-testid="protected-content">OK</div>
            </PermissionGuard>
          }
        />
        <Route path="/unauthorized" element={<div data-testid="unauthorized">Denied</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PermissionGuard — menuPermissionsReady gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows spinner while menuPermissionsReady is false (no redirect to /unauthorized)', () => {
    renderGuard(false, false);

    expect(screen.getByText('Verificando permisos...')).toBeInTheDocument();
    expect(screen.queryByTestId('unauthorized')).not.toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockCan).not.toHaveBeenCalled();
  });

  it('allows access when menuPermissionsReady and can() is true', () => {
    renderGuard(true, true);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockCan).toHaveBeenCalledWith('inv', 'ver');
    expect(screen.queryByTestId('unauthorized')).not.toBeInTheDocument();
  });

  it('redirects to /unauthorized only after menuPermissionsReady when can() is false', () => {
    renderGuard(true, false);

    expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
    expect(mockCan).toHaveBeenCalledWith('inv', 'ver');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
