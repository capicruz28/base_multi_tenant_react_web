import { describe, expect, it } from 'vitest';

import { resolveShellBreadcrumbs } from '@/shared/components/layout/useShellBreadcrumbs';
import { ACCOUNT_CENTER_HUB_LABEL } from '@/features/account/account.routes';

describe('resolveShellBreadcrumbs — Mi cuenta', () => {
  it('prioriza breadcrumbs account sobre fallback vacío en shell app', () => {
    const crumbs = resolveShellBreadcrumbs([], 'app', '/app/cuenta/seguridad', []);
    expect(crumbs).toEqual([
      { nombre: ACCOUNT_CENTER_HUB_LABEL, ruta: '/app/cuenta/informacion' },
      { nombre: 'Seguridad', ruta: '/app/cuenta/seguridad' },
    ]);
  });
});
