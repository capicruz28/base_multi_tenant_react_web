import { describe, expect, it } from 'vitest';

import type {
  AdminSessionRead,
  PaginatedAdminSessionsResponse,
} from '@/features/admin/types/session.types';
import {
  isPaginatedAdminSessionsResponse,
  normalizeAdminSessionsResponse,
} from '@/features/admin/utils/iam-session-list-normalize';

function createSession(tokenId: string): AdminSessionRead {
  return {
    token_id: tokenId,
    usuario_id: 'user-1',
    cliente_id: 'client-1',
    empresa_id: null,
    empresa_nombre: null,
    issued_at: '2026-06-18T10:00:00Z',
    created_at: '2026-06-18T10:00:00Z',
    last_refresh_at: '2026-06-21T08:30:00Z',
    last_used_at: '2026-06-21T08:30:00Z',
    expires_at: '2026-06-25T10:00:00Z',
    is_current: false,
    status: 'active',
    duration_seconds: 259200,
    device: {
      client_type: 'web',
      browser: 'Chrome',
      browser_version: '120.0.0.0',
      os: 'Windows',
      platform: 'desktop',
      device_label: 'Chrome en Windows',
      ip_address: '192.168.1.10',
      device_id: null,
    },
    client_type: 'web',
    ip_address: '192.168.1.10',
    device_name: null,
    device_id: null,
    nombre_usuario: 'jperez',
    nombre: 'Juan',
    apellido: 'Pérez',
    user_agent: 'Mozilla/5.0 Chrome',
  };
}

describe('iam-session-list-normalize', () => {
  const sessionA = createSession('token-a');
  const sessionB = createSession('token-b');
  const sessionC = createSession('token-c');

  it('isPaginatedAdminSessionsResponse detecta envelope items o sessions', () => {
    expect(isPaginatedAdminSessionsResponse({ items: [], total: 0 })).toBe(true);
    expect(isPaginatedAdminSessionsResponse({ sessions: [], total_sesiones: 0 })).toBe(true);
    expect(isPaginatedAdminSessionsResponse([sessionA])).toBe(false);
    expect(isPaginatedAdminSessionsResponse(null)).toBe(false);
  });

  it('normalizeAdminSessionsResponse — envelope canónico items/total', () => {
    const envelope: PaginatedAdminSessionsResponse = {
      items: [sessionA, sessionB],
      total: 42,
      sessions: [sessionA, sessionB],
      total_sesiones: 42,
      pagina_actual: 1,
      total_paginas: 5,
      limit: 10,
    };

    const result = normalizeAdminSessionsResponse(envelope, 1, 10);

    expect(result).toEqual({
      items: [sessionA, sessionB],
      total: 42,
      pagina_actual: 1,
      total_paginas: 5,
      limit: 10,
    });
  });

  it('normalizeAdminSessionsResponse — envelope legacy sessions/total_sesiones', () => {
    const envelope: PaginatedAdminSessionsResponse = {
      sessions: [sessionA],
      total_sesiones: 15,
      pagina_actual: 2,
      total_paginas: 2,
      limit: 10,
    };

    const result = normalizeAdminSessionsResponse(envelope, 2, 10);

    expect(result).toEqual({
      items: [sessionA],
      total: 15,
      pagina_actual: 2,
      total_paginas: 2,
      limit: 10,
    });
  });

  it('normalizeAdminSessionsResponse — array legacy con slice client-side', () => {
    const legacyArray = [sessionA, sessionB, sessionC];

    const page1 = normalizeAdminSessionsResponse(legacyArray, 1, 2);
    expect(page1.items).toEqual([sessionA, sessionB]);
    expect(page1.total).toBe(3);
    expect(page1.pagina_actual).toBe(1);
    expect(page1.total_paginas).toBe(2);
    expect(page1.limit).toBe(2);

    const page2 = normalizeAdminSessionsResponse(legacyArray, 2, 2);
    expect(page2.items).toEqual([sessionC]);
    expect(page2.total).toBe(3);
    expect(page2.pagina_actual).toBe(2);
    expect(page2.total_paginas).toBe(2);
    expect(page2.limit).toBe(2);
  });
});
