import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogSyncResultDialog } from '../CatalogSyncResultDialog';
import type { CatalogSyncBulkResponse } from '../../types/platform-catalog-sync.types';

const bulkResult: CatalogSyncBulkResponse = {
  catalogo: 'monedas',
  estado: 'completado_parcial',
  duracion_ms: 3200,
  insertados: 4,
  actualizados: 2,
  desactivados: 1,
  omitidos: 0,
  tenants_procesados: 2,
  completados: 1,
  fallidos: 1,
  resultados: [
    {
      cliente_id: '11111111-1111-1111-1111-111111111111',
      razon_social: 'Dedicated Uno SAC',
      catalogo: 'monedas',
      estado: 'completado',
      duracion_ms: 900,
      insertados: 4,
      actualizados: 2,
      desactivados: 1,
      omitidos: 0,
      mensaje_error: null,
    },
    {
      cliente_id: '22222222-2222-2222-2222-222222222222',
      razon_social: 'Dedicated Dos SAC',
      catalogo: 'monedas',
      estado: 'fallido',
      duracion_ms: 400,
      insertados: 0,
      actualizados: 0,
      desactivados: 0,
      omitidos: 0,
      mensaje_error: 'Timeout de conexión',
    },
  ],
};

describe('CatalogSyncResultDialog', () => {
  it('muestra métricas agregadas y tabla por tenant sin UUID visible', () => {
    render(
      <CatalogSyncResultDialog
        isOpen
        onClose={vi.fn()}
        result={bulkResult}
      />,
    );

    expect(screen.getByText('Resultado de sincronización — Monedas')).toBeInTheDocument();
    expect(screen.getByText('Tenants procesados')).toBeInTheDocument();
    expect(screen.getByText('Dedicated Uno SAC')).toBeInTheDocument();
    expect(screen.getByText('Dedicated Dos SAC')).toBeInTheDocument();
    expect(screen.getByText('Timeout de conexión')).toBeInTheDocument();
    expect(screen.queryByText('11111111-1111-1111-1111-111111111111')).not.toBeInTheDocument();
  });
});
