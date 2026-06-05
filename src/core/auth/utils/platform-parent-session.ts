import type { ClienteInfo, UserData } from '@/features/auth/types/auth.types';

export const PLATFORM_PARENT_SESSION_KEY = 'platform_parent_session';

export interface PlatformParentTenantContext {
  tenantId: string | null;
  subdomain: string | null;
  clienteInfo: ClienteInfo | null;
}

export interface PlatformParentSession {
  accessToken: string;
  userData: UserData;
  tenantContext?: PlatformParentTenantContext;
}

export function savePlatformParentSession(session: PlatformParentSession): void {
  try {
    sessionStorage.setItem(PLATFORM_PARENT_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[platform_parent_session] No se pudo guardar:', e);
    }
  }
}

export function getPlatformParentSession(): PlatformParentSession | null {
  try {
    const raw = sessionStorage.getItem(PLATFORM_PARENT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlatformParentSession;
    if (!parsed?.accessToken?.trim() || !parsed?.userData) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlatformParentSession(): void {
  try {
    sessionStorage.removeItem(PLATFORM_PARENT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function hasPlatformParentSession(): boolean {
  return getPlatformParentSession() !== null;
}
