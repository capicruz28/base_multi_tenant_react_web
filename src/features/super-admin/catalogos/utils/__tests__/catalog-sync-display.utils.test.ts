import { describe, it, expect } from 'vitest';
import {
  formatCatalogSyncDurationMs,
  getCatalogTitleByApiSegment,
  isCatalogSyncFailedEstado,
  resolveCatalogSyncTenantLabel,
} from '../catalog-sync-display.utils';

describe('catalog-sync-display.utils', () => {
  it('resolveCatalogSyncTenantLabel prioriza razon_social', () => {
    expect(
      resolveCatalogSyncTenantLabel({
        razon_social: 'Empresa Demo SAC',
        nombre_comercial: 'Demo',
        codigo_cliente: 'CLI001',
      }),
    ).toBe('Empresa Demo SAC');
  });

  it('formatCatalogSyncDurationMs formatea segundos', () => {
    expect(formatCatalogSyncDurationMs(2500)).toBe('2.50 s');
  });

  it('getCatalogTitleByApiSegment resuelve título del registry', () => {
    expect(getCatalogTitleByApiSegment('distritos')).toBe('Distritos');
  });

  it('isCatalogSyncFailedEstado detecta fallidos', () => {
    expect(isCatalogSyncFailedEstado('fallido')).toBe(true);
    expect(isCatalogSyncFailedEstado('completado')).toBe(false);
  });
});
