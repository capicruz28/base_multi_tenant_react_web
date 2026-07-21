import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CfgSecuenciaPreviewDialog } from '../CfgSecuenciaPreviewDialog';
import {
  fixturePreviewOk,
  fixtureSecuenciaActiva,
  fixtureSecuenciaInactiva,
} from '../../__tests__/fixtures/cfg-secuencia.fixtures';
import { CFG_ERROR_CODES } from '../../utils/cfg-error.utils';

const mockPreview = vi.fn();

vi.mock('../../hooks/usePreviewCfgSecuencia', () => ({
  usePreviewCfgSecuencia: () => ({
    mutateAsync: mockPreview,
    isPending: false,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function axiosErrorWithCode(code: string, status = 422): AxiosError {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    statusText: 'Error',
    headers: {},
    config: {} as never,
    data: { internal_code: code, detail: code },
  });
}

function renderPreview(
  props: Partial<ComponentProps<typeof CfgSecuenciaPreviewDialog>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onPreviewNotAllowed = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <CfgSecuenciaPreviewDialog
        open
        secuenciaId={fixtureSecuenciaActiva.secuencia_id}
        onOpenChange={onOpenChange}
        onPreviewNotAllowed={onPreviewNotAllowed}
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onPreviewNotAllowed };
}

describe('CfgSecuenciaPreviewDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreview.mockResolvedValue(fixturePreviewOk);
  });

  it('auto-preview muestra codigo_estimado + disclaimer + no consume', async () => {
    renderPreview();

    await waitFor(() => {
      expect(screen.getByText('EMP-0011')).toBeInTheDocument();
    });
    expect(screen.getByText(fixturePreviewOk.disclaimer)).toBeInTheDocument();
    expect(
      screen.getByText('Esta estimación no consume el correlativo.'),
    ).toBeInTheDocument();
    expect(mockPreview).toHaveBeenCalledWith(
      fixtureSecuenciaActiva.secuencia_id,
    );
  });

  it('inactive hint visible', async () => {
    mockPreview.mockResolvedValue({
      ...fixturePreviewOk,
      es_activo: false,
    });
    renderPreview({
      secuenciaId: fixtureSecuenciaInactiva.secuencia_id,
      secuenciaInactivaHint: true,
    });

    await waitFor(() => {
      expect(
        screen.getByText('La secuencia está inactiva.'),
      ).toBeInTheDocument();
    });
  });

  it('PREVIEW_NOT_ALLOWED muestra mensaje y notifica', async () => {
    mockPreview.mockRejectedValue(
      axiosErrorWithCode(CFG_ERROR_CODES.PREVIEW_NOT_ALLOWED),
    );

    const { onPreviewNotAllowed } = renderPreview();

    await waitFor(() => {
      expect(
        screen.getByText(
          'La previsualización no está disponible para esta secuencia.',
        ),
      ).toBeInTheDocument();
    });
    expect(onPreviewNotAllowed).toHaveBeenCalledWith(
      fixtureSecuenciaActiva.secuencia_id,
    );
  });

  it('Cerrar limpia y cierra dialog', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderPreview();

    await waitFor(() => {
      expect(screen.getByText('EMP-0011')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
