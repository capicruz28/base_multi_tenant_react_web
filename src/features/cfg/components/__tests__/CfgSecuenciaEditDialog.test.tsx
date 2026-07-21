import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CfgSecuenciaEditDialog } from '../CfgSecuenciaEditDialog';
import {
  fixtureSecuenciaActiva,
  fixtureSecuenciaLocked,
} from '../../__tests__/fixtures/cfg-secuencia.fixtures';
import type { CfgSecuencia } from '../../types/cfg.types';

let mockDetail: CfgSecuencia | undefined = fixtureSecuenciaActiva;
const mockUpdate = vi.fn();
const mockRefetch = vi.fn();

vi.mock('../../hooks/useCfgSecuencia', () => ({
  useCfgSecuencia: (
    id: string | null | undefined,
    options?: { enabled?: boolean },
  ) => {
    const enabled = !!id && options?.enabled !== false;
    return {
      data: enabled ? mockDetail : undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    };
  },
}));

vi.mock('../../hooks/useUpdateCfgSecuencia', () => ({
  useUpdateCfgSecuencia: () => ({
    mutateAsync: mockUpdate,
    isPending: false,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderDialog(
  props: Partial<ComponentProps<typeof CfgSecuenciaEditDialog>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onRequestDesactivar = vi.fn();
  const onOpenChange = vi.fn();
  const onSaveSuccess = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <CfgSecuenciaEditDialog
        open
        secuenciaId={fixtureSecuenciaActiva.secuencia_id}
        onOpenChange={onOpenChange}
        onSaveSuccess={onSaveSuccess}
        canUpdate
        onRequestDesactivar={onRequestDesactivar}
        onRequestReactivar={vi.fn()}
        onRequestPreview={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onRequestDesactivar, onOpenChange, onSaveSuccess };
}

describe('CfgSecuenciaEditDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetail = fixtureSecuenciaActiva;
    mockUpdate.mockResolvedValue({
      ...fixtureSecuenciaActiva,
      prefijo: 'DEP',
    });
  });

  it('readonly sin canUpdate: sin Guardar', async () => {
    renderDialog({ canUpdate: false });
    await waitFor(() => {
      expect(screen.getByText('Ver secuencia')).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: 'Guardar' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Prefijo')).toBeDisabled();
  });

  it('locked: banner y sin Guardar', async () => {
    mockDetail = fixtureSecuenciaLocked;
    renderDialog({
      secuenciaId: fixtureSecuenciaLocked.secuencia_id,
    });
    await waitFor(() => {
      expect(
        screen.getByText(
          'Esta secuencia está bloqueada y no se puede modificar.',
        ),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: 'Guardar' }),
    ).not.toBeInTheDocument();
  });

  it('Guardar llama update con payload dirty-only y cierra vía closeEdit', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaveSuccess } = renderDialog();
    await waitFor(() => {
      expect(screen.getByLabelText('Prefijo')).toHaveValue('EMP');
    });

    const prefijo = screen.getByLabelText('Prefijo');
    await user.clear(prefijo);
    await user.type(prefijo, 'DEP');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Guardar' }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: fixtureSecuenciaActiva.secuencia_id,
        body: { prefijo: 'DEP' },
      });
    });
    expect(onSaveSuccess).toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('Desactivar solicita callback y no llama service DELETE', async () => {
    const user = userEvent.setup();
    const { onRequestDesactivar } = renderDialog();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Desactivar' }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    expect(onRequestDesactivar).toHaveBeenCalledWith(
      fixtureSecuenciaActiva.secuencia_id,
    );
  });
});
