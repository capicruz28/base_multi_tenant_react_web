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
      { sequence_key: 'inv_unidad_medida', generation_policy: 'AUTO_DEFAULT' },
      { sequence_key: 'inv_tipo_movimiento', generation_policy: 'AUTO_DEFAULT' },
      { sequence_key: 'inv_almacen', generation_policy: 'AUTO_DEFAULT' },
    ]),
}));

import {
  clearCodigoRegistryForTests,
  mergeCodigoIntoPayload,
  registerCodigoManifest,
  useCodigoFieldController,
} from '@/core/codigo';
import { CodigoField } from '@/shared/components/codigo';

import { buildAlmacenCreateBasePayload } from '../almacen-codigo.payload';
import { INV_CODIGO_MANIFEST, INV_CODIGO_SEQUENCE_KEYS } from '../inv.codigo.manifest';
import { buildTipoMovimientoCreateBasePayload } from '../tipo-movimiento-codigo.payload';
import { buildUnidadMedidaCreateBasePayload } from '../unidad-medida-codigo.payload';

type SequenceCase = {
  label: string;
  sequenceKey: string;
  buildBase: () => Record<string, unknown>;
  manualCode: string;
};

const CASES: SequenceCase[] = [
  {
    label: 'Unidad de Medida',
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.unidadMedida,
    buildBase: () =>
      buildUnidadMedidaCreateBasePayload(
        {
          empresa_id: '',
          nombre: 'Nueva UM',
          tipo_unidad: 'cantidad',
          es_activo: true,
        },
        'emp-1',
      ) as Record<string, unknown>,
    manualCode: 'UM050',
  },
  {
    label: 'Tipo de Movimiento',
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.tipoMovimiento,
    buildBase: () =>
      buildTipoMovimientoCreateBasePayload(
        {
          empresa_id: '',
          nombre: 'Nuevo TM',
          clase_movimiento: 'ENTRADA',
          es_activo: true,
        },
        'emp-1',
      ) as Record<string, unknown>,
    manualCode: 'TM050',
  },
  {
    label: 'Almacén',
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.almacen,
    buildBase: () =>
      buildAlmacenCreateBasePayload(
        {
          empresa_id: '',
          nombre: 'Nuevo ALM',
          tipo_almacen: 'general',
          es_activo: true,
        },
        'emp-1',
      ) as Record<string, unknown>,
    manualCode: 'ALM050',
  },
];

function CreateHarness({
  sequenceKey,
  buildBase,
  onPayload,
}: {
  sequenceKey: string;
  buildBase: () => Record<string, unknown>;
  onPayload: (payload: Record<string, unknown>) => void;
}) {
  const codigo = useCodigoFieldController({
    sequenceKey,
    mode: 'create',
    allowManualOverride: true,
  });

  return (
    <div>
      <CodigoField sequenceKey={sequenceKey} mode="create" controller={codigo} />
      <button
        type="button"
        data-testid="build-create-payload"
        onClick={() => {
          onPayload(mergeCodigoIntoPayload(buildBase(), codigo.payloadSlice));
        }}
      >
        Build
      </button>
    </div>
  );
}

describe.each(CASES)('$label × Engine — integración formulario CREATE', (c) => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  it('modo auto: panel Engine y payload sin codigo', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;

    render(
      <CreateHarness
        sequenceKey={c.sequenceKey}
        buildBase={c.buildBase}
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
    expect(captured!.empresa_id).toBe('emp-1');
  });

  it('modo manual: payload incluye codigo del Engine', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;

    render(
      <CreateHarness
        sequenceKey={c.sequenceKey}
        buildBase={c.buildBase}
        onPayload={(p) => {
          captured = p;
        }}
      />,
    );

    await user.click(screen.getByTestId('codigo-manual-toggle'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, c.manualCode);
    await user.click(screen.getByTestId('build-create-payload'));

    expect(captured?.codigo).toBe(c.manualCode);
  });
});
