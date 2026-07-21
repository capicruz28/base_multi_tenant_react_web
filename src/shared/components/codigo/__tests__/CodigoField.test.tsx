import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockCodigoRuntimeSnapshotSuccess } = vi.hoisted(() => {
  function mockCodigoRuntimeSnapshotSuccess(
    items: Array<{
      sequence_key: string;
      generation_policy: 'AUTO_DEFAULT' | 'AUTO_REQUIRED' | 'MANUAL_ONLY';
      prefijo?: string;
      separador?: string;
      longitud_numero?: number;
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
          prefijo: row.prefijo ?? 'SUC',
          separador: row.separador ?? '-',
          longitud_numero: row.longitud_numero ?? 4,
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
        sequence_key: 'org_sucursal',
        generation_policy: 'AUTO_DEFAULT',
        prefijo: 'SUC',
        separador: '-',
        longitud_numero: 3,
      },
      { sequence_key: 'org_cargo', generation_policy: 'MANUAL_ONLY' },
    ]),
}));

import {
  clearCodigoRegistryForTests,
  registerCodigoManifest,
} from '@/core/codigo';
import { useCodigoFieldController } from '@/core/codigo/hooks/useCodigoFieldController';
import { CodigoField } from '@/shared/components/codigo';

function renderWithController(
  sequenceKey: string,
  mode: 'create' | 'update' | 'read' = 'create',
  options?: { allowManualOverride?: boolean },
) {
  function Harness() {
    const controller = useCodigoFieldController({
      sequenceKey,
      mode,
      allowManualOverride: options?.allowManualOverride,
    });
    return <CodigoField sequenceKey={sequenceKey} mode={mode} controller={controller} />;
  }

  return render(<Harness />);
}

describe('CodigoField', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('org', [
      {
        sequenceKey: 'org_sucursal',
        moduleCode: 'org',
        entityKey: 'sucursal',
        fieldKey: 'codigo',
        policy: 'AUTO_DEFAULT',
        meta: { entityLabel: 'sucursal' },
      },
      {
        sequenceKey: 'org_cargo',
        moduleCode: 'org',
        entityKey: 'cargo',
        fieldKey: 'codigo',
        policy: 'MANUAL_ONLY',
        meta: { entityLabel: 'cargo' },
      },
    ]);
  });

  it('AUTO_DEFAULT: panel + ejemplo + Modificar código (sin input inicial)', async () => {
    renderWithController('org_sucursal', 'create');
    expect(await screen.findByTestId('codigo-auto-panel')).toBeInTheDocument();
    expect(screen.getByTestId('codigo-format-example')).toHaveTextContent('SUC-001');
    expect(screen.getByTestId('codigo-manual-toggle')).toHaveTextContent(
      'Modificar código',
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('AUTO_DEFAULT: confirma antes de mostrar input manual', async () => {
    const user = userEvent.setup();
    renderWithController('org_sucursal', 'create');

    await screen.findByTestId('codigo-manual-toggle');
    await user.click(screen.getByTestId('codigo-manual-toggle'));
    expect(screen.getByText(/no lo asignará de forma automática/i)).toBeInTheDocument();
    expect(screen.queryByTestId('codigo-manual-section')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByTestId('codigo-manual-section')).toBeInTheDocument();
    expect(screen.getByText('Volver al automático')).toBeInTheDocument();
  });

  it('MANUAL_ONLY CREATE muestra input requerido (sin panel auto ni revert)', async () => {
    renderWithController('org_cargo', 'create');
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/\*/)).toBeInTheDocument();
    expect(screen.queryByTestId('codigo-auto-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Volver al automático')).not.toBeInTheDocument();
    expect(screen.queryByTestId('codigo-manual-toggle')).not.toBeInTheDocument();
  });
});
