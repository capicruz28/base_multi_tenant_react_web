import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_CENTER_DEFAULT_PATH,
  ACCOUNT_CENTER_SECTIONS,
  isAccountCenterPath,
  resolveAccountCenterSection,
} from '@/features/account/account.routes';

describe('account.routes', () => {
  it('resuelve metadata por pathname de sección', () => {
    const section = resolveAccountCenterSection('/app/cuenta/sesiones');
    expect(section?.id).toBe('sesiones');
    expect(section?.contentVariant).toBe('full');
    expect(section?.title).toBe('Sesiones');
  });

  it('detecta rutas del hub Mi cuenta', () => {
    expect(isAccountCenterPath('/app/cuenta')).toBe(true);
    expect(isAccountCenterPath('/app/cuenta/informacion')).toBe(true);
    expect(isAccountCenterPath('/app/home')).toBe(false);
  });

  it('expone redirect default informacion', () => {
    expect(ACCOUNT_CENTER_DEFAULT_PATH).toBe('/app/cuenta/informacion');
    expect(ACCOUNT_CENTER_SECTIONS).toHaveLength(4);
  });
});
