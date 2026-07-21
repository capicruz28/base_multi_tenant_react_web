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
      { sequence_key: 'inv_producto', generation_policy: 'AUTO_DEFAULT' },
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
import { buildProductoCreateBasePayload } from '../producto-codigo.payload';

function CreateProductoCodigoHarness({
  onPayload,
}: {
  onPayload: (payload: Record<string, unknown>) => void;
}) {
  const codigo = useCodigoFieldController({
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.producto,
    mode: 'create',
    allowManualOverride: true,
    label: 'SKU',
  });

  return (
    <div>
      <CodigoField
        sequenceKey={INV_CODIGO_SEQUENCE_KEYS.producto}
        mode="create"
        controller={codigo}
      />
      <label>
        Código de barras
        <input
          aria-label="Código de barras"
          defaultValue="775"
          data-testid="negocio-codigo-barra"
        />
      </label>
      <label>
        Código interno
        <input aria-label="Código interno" defaultValue="INT" data-testid="negocio-codigo-interno" />
      </label>
      <label>
        Código fabricante
        <input
          aria-label="Código fabricante"
          defaultValue="FAB"
          data-testid="negocio-codigo-fabricante"
        />
      </label>
      <label>
        Código SUNAT
        <input aria-label="Código SUNAT" defaultValue="1512" data-testid="negocio-codigo-sunat" />
      </label>
      <button
        type="button"
        data-testid="build-create-payload"
        onClick={() => {
          const base = buildProductoCreateBasePayload(
            {
              empresa_id: '',
              nombre: 'Nuevo',
              tipo_producto: 'bien',
              unidad_medida_base_id: 'um-1',
              moneda_costo: 'm1',
              moneda_venta: 'm1',
              codigo_barra: '775',
              codigo_interno: 'INT',
              codigo_fabricante: 'FAB',
              codigo_sunat: '1512',
              es_activo: true,
            },
            'emp-1',
          );
          onPayload(
            mergeCodigoIntoPayload(base as Record<string, unknown>, codigo.payloadSlice),
          );
        }}
      >
        Build
      </button>
    </div>
  );
}

describe('Producto × Engine — integración formulario CREATE', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('inv', INV_CODIGO_MANIFEST);
  });

  it('codigo_sku usa Engine (auto) y códigos de negocio permanecen editables', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;

    render(
      <CreateProductoCodigoHarness
        onPayload={(p) => {
          captured = p;
        }}
      />,
    );

    expect(screen.getByTestId('codigo-auto-panel')).toBeInTheDocument();
    expect(screen.getByTestId('codigo-manual-toggle')).toBeInTheDocument();

    expect(screen.getByTestId('negocio-codigo-barra')).not.toBeDisabled();
    expect(screen.getByTestId('negocio-codigo-interno')).not.toBeDisabled();
    expect(screen.getByTestId('negocio-codigo-fabricante')).not.toBeDisabled();
    expect(screen.getByTestId('negocio-codigo-sunat')).not.toBeDisabled();

    await user.click(screen.getByTestId('build-create-payload'));
    expect('codigo_sku' in captured!).toBe(false);
    expect(captured!.codigo_barra).toBe('775');
    expect(captured!.codigo_interno).toBe('INT');
    expect(captured!.codigo_fabricante).toBe('FAB');
    expect(captured!.codigo_sunat).toBe('1512');
  });

  it('modo manual: codigo_sku del Engine sin alterar códigos de negocio', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;

    render(
      <CreateProductoCodigoHarness
        onPayload={(p) => {
          captured = p;
        }}
      />,
    );

    await user.click(screen.getByTestId('codigo-manual-toggle'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const skuInput = document.getElementById('codigo-field-inv_producto') as HTMLInputElement;
    expect(skuInput).toBeTruthy();
    await user.clear(skuInput);
    await user.type(skuInput, 'P00050');
    await user.click(screen.getByTestId('build-create-payload'));

    expect(captured?.codigo_sku).toBe('P00050');
    expect(captured?.codigo_barra).toBe('775');
    expect(captured?.codigo_interno).toBe('INT');
    expect(captured?.codigo_fabricante).toBe('FAB');
    expect(captured?.codigo_sunat).toBe('1512');
  });
});
