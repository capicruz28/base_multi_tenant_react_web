import { decodeAccessToken } from './decodeAccessToken';
import { tenantResolver } from '@/core/services/tenant-resolver.service';
import type { UserData } from '@/features/auth/types/auth.types';

export const PLATFORM_SUPERADMIN_CLIENTE_ID = '00000000-0000-0000-0000-000000000001';

export interface AuthSessionSnapshot {
  label: string;
  feHost: string;
  feOrigin: string;
  feSubdomain: string | null;
  apiBaseUrl: string;
  accessTokenPrefix: string | null;
  jwt: ReturnType<typeof decodeAccessToken>;
  userData: {
    usuario_id?: string;
    cliente_id?: string;
    user_type?: string;
    is_super_admin?: boolean;
  } | null;
  expectedSuperadminClienteId: string;
  jwtClienteMatchesSuperadmin: boolean | null;
  userClienteMatchesSuperadmin: boolean | null;
}

export function buildAuthSessionSnapshot(
  label: string,
  accessToken: string | null | undefined,
  user: UserData | null | undefined,
): AuthSessionSnapshot {
  const jwt = decodeAccessToken(accessToken);
  const feSubdomain = tenantResolver.getSubdomain();
  const userClienteId = user?.cliente_id ?? user?.cliente?.cliente_id ?? null;

  return {
    label,
    feHost: typeof window !== 'undefined' ? window.location.host : '',
    feOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    feSubdomain,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
    accessTokenPrefix: accessToken?.slice(0, 28) ?? null,
    jwt,
    userData: user
      ? {
          usuario_id: user.usuario_id,
          cliente_id: userClienteId ?? undefined,
          user_type: user.user_type,
          is_super_admin: user.is_super_admin,
        }
      : null,
    expectedSuperadminClienteId: PLATFORM_SUPERADMIN_CLIENTE_ID,
    jwtClienteMatchesSuperadmin:
      feSubdomain === 'platform' && jwt?.cliente_id
        ? String(jwt.cliente_id) === PLATFORM_SUPERADMIN_CLIENTE_ID
        : null,
    userClienteMatchesSuperadmin:
      feSubdomain === 'platform' && userClienteId
        ? String(userClienteId) === PLATFORM_SUPERADMIN_CLIENTE_ID
        : null,
  };
}

export function logAuthSessionSnapshot(
  label: string,
  accessToken: string | null | undefined,
  user: UserData | null | undefined,
): void {
  if (!import.meta.env.DEV) return;
  const snap = buildAuthSessionSnapshot(label, accessToken, user);
  console.group(`[AuthSnapshot] ${label}`);
  console.table(snap);
  if (snap.feSubdomain === 'platform') {
    if (snap.jwtClienteMatchesSuperadmin === false) {
      console.warn(
        '[AuthSnapshot] JWT cliente_id ≠ SUPERADMIN esperado — refresh puede fallar si BD valida cliente_id',
      );
    }
    if (snap.userClienteMatchesSuperadmin === false) {
      console.warn('[AuthSnapshot] user_data.cliente_id ≠ SUPERADMIN esperado');
    }
  }
  console.log(
    'Network checklist: login Set-Cookie → F5 refresh Request Headers debe incluir Cookie: refresh_token=...',
  );
  console.groupEnd();
}
