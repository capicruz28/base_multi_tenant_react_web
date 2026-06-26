import { describe, expect, it } from 'vitest';

import { resolveAccountCenterBreadcrumbs } from '@/features/account/utils/account-center-breadcrumbs.utils';
import {
  ACCOUNT_CENTER_DEFAULT_PATH,
  ACCOUNT_CENTER_HUB_LABEL,
} from '@/features/account/account.routes';

describe('resolveAccountCenterBreadcrumbs', () => {
  it('resuelve trail para sección sesiones desde SSOT', () => {
    const crumbs = resolveAccountCenterBreadcrumbs('/app/cuenta/sesiones');
    expect(crumbs).toEqual([
      { nombre: ACCOUNT_CENTER_HUB_LABEL, ruta: ACCOUNT_CENTER_DEFAULT_PATH },
      { nombre: 'Sesiones', ruta: '/app/cuenta/sesiones' },
    ]);
  });

  it('resuelve informacion para /app/cuenta base (redirect UX)', () => {
    const crumbs = resolveAccountCenterBreadcrumbs('/app/cuenta');
    expect(crumbs?.[1]?.nombre).toBe('Información personal');
  });

  it('retorna null fuera del hub', () => {
    expect(resolveAccountCenterBreadcrumbs('/app/home')).toBeNull();
  });

  it('cubre las 4 rutas de sección sin hardcode duplicado', () => {
    const paths = [
      '/app/cuenta/informacion',
      '/app/cuenta/seguridad',
      '/app/cuenta/sesiones',
      '/app/cuenta/preferencias',
    ] as const;

    for (const path of paths) {
      const crumbs = resolveAccountCenterBreadcrumbs(path);
      expect(crumbs).not.toBeNull();
      expect(crumbs?.[0]?.nombre).toBe(ACCOUNT_CENTER_HUB_LABEL);
      expect(crumbs?.[1]?.ruta).toBe(path);
    }
  });
});
