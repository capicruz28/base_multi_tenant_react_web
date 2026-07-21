import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockCodigoRuntimeSnapshotSuccess } = vi.hoisted(() => {
  function mockCodigoRuntimeSnapshotSuccess(
    items: Array<{
      sequence_key: string;
      generation_policy: 'AUTO_DEFAULT' | 'AUTO_REQUIRED' | 'MANUAL_ONLY';
    }>,
  ) {
    return {
      data: {
        schema_version: '1.0',
        generated_at: '2026-07-20T00:00:00.000000',
        content_revision: 'test',
        items: items.map((row) => ({
          sequence_key: row.sequence_key,
          modulo_codigo: 'TEST',
          scope_type: 'TENANT' as const,
          empresa_id: null,
          almacen_id: null,
          punto_venta_id: null,
          generation_policy: row.generation_policy,
          es_activo: true,
          prefijo: 'X',
          separador: '',
          longitud_numero: 3,
          supports_preview: true,
          allow_manual: true,
          normalize_case: 'UPPER' as const,
          max_output_length: 20,
        })),
      },
      isLoading: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
    };
  }
  return { mockCodigoRuntimeSnapshotSuccess };
});

vi.mock('@/core/codigo/hooks/useCodigoRuntimeSnapshot', () => ({
  useCodigoRuntimeSnapshot: () =>
    mockCodigoRuntimeSnapshotSuccess([
      {
        sequence_key: 'inv_categoria_producto',
        generation_policy: 'AUTO_DEFAULT',
      },
    ]),
}));

import {
  clearCodigoRegistryForTests,
  mergeCodigoIntoPayload,
  registerCodigoManifest,
  useCodigoFieldController,
} from '@/core/codigo';
import { CodigoField } from '@/shared/components/codigo';

import { INV_CODIGO_MANIFEST, INV_CODIGO_SEQUENCE_KEYS } from '../inv.codigo.manifest';
import { buildCategoriaCreateBasePayload } from '../categoria-codigo.payload';

function CreateCategoriaCodigoHarness({
  onPayload,
}: {
  onPayload: (payload: Record<string, unknown>) => void;
}) {
  const codigo = useCodigoFieldController({
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.categoria,
    mode: 'create',
    allowManualOverride: true,
  });

  return (
    <div>
      <CodigoField
        sequenceKey={INV_CODIGO_SEQUENCE_KEYS.categoria}
        mode="create"
        controller={codigo}
      />
      <button
        type="button"
        data-testid="build-create-payload"
        onClick={() => {
          const base = buildCategoriaCreateBasePayload(
            {
              empresa_id: '',
              nombre: 'Nueva',
              metodo_costeo_defecto: 'promedio',
              es_activo: true,
            },
            'emp-1',
          );
          onPayload(
            mergeCodigoIntoPayload(
              base as Record<string, unknown>,
              codigo.payloadSlice,
            ),
          );
        }}
      >
        Build
      </button>
    </div>
  );
}

describe('Categoría × Engine — integración formulario CREATE', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  it('modo auto: panel Engine y payload sin codigo', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;

    render(
      <CreateCategoriaCodigoHarness
        onPayload={(p) => {
          captured = p;
        }}
      />,
    );

    expect(screen.getByTestId('codigo-auto-panel')).toBeInTheDocument();
    expect(screen.getByTestId('codigo-manual-toggle')).toBeInTheDocument();

    await user.click(screen.getByTestId('build-create-payload'));
    expect(captured).not.toBeNull();
    expect('codigo' in captured!).toBe(false);
    expect(captured!.nombre).toBe('Nueva');
    expect(captured!.empresa_id).toBe('emp-1');
  });

  it('modo manual: payload incluye codigo del Engine', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;

    render(
      <CreateCategoriaCodigoHarness
        onPayload={(p) => {
          captured = p;
        }}
      />,
    );

    await user.click(screen.getByTestId('codigo-manual-toggle'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'CAT050');
    await user.click(screen.getByTestId('build-create-payload'));

    expect(captured?.codigo).toBe('CAT050');
  });
});
