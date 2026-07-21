import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
      { sequence_key: 'inv_movimiento', generation_policy: 'AUTO_REQUIRED' },
      {
        sequence_key: 'inv_inventario_fisico',
        generation_policy: 'AUTO_REQUIRED',
      },
    ]),
}));

import {
  clearCodigoRegistryForTests,
  registerCodigoManifest,
  useCodigoFieldController,
} from '@/core/codigo';
import { CodigoField } from '@/shared/components/codigo';

import { INV_CODIGO_MANIFEST, INV_CODIGO_SEQUENCE_KEYS } from '../inv.codigo.manifest';

function AutoRequiredHarness({
  sequenceKey,
}: {
  sequenceKey: string;
}) {
  const controller = useCodigoFieldController({
    sequenceKey,
    mode: 'create',
  });

  return <CodigoField sequenceKey={sequenceKey} mode="create" controller={controller} />;
}

describe('Documentos INV × Engine — AUTO_REQUIRED CREATE', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  it('movimiento: panel auto locked (sin toggle manual)', async () => {
    render(
      <AutoRequiredHarness sequenceKey={INV_CODIGO_SEQUENCE_KEYS.movimiento} />,
    );
    expect(await screen.findByTestId('codigo-auto-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('codigo-manual-toggle')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('inventario físico: panel auto locked', async () => {
    render(
      <AutoRequiredHarness
        sequenceKey={INV_CODIGO_SEQUENCE_KEYS.inventarioFisico}
      />,
    );
    expect(await screen.findByTestId('codigo-auto-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('codigo-manual-toggle')).not.toBeInTheDocument();
  });
});
