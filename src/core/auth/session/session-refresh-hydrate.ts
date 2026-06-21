import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { hasEmpresaActiva } from '@/core/auth/utils/empresa-access';
import { canInitializeFullSession } from '@/core/auth/utils/session-token';
import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import type { UserPermissions } from '@/core/auth/types/permission.types';
import type { EmpresaOption, UserData } from '@/features/auth/types/auth.types';

/**
 * Modo de ejecución del núcleo L2 (IAM-FE-PHASE-01 Paso 3).
 * - bootstrap: flujo initializeAuth / runBootstrap
 * - interceptor: reservado Paso 4 (post-refresh L2)
 * - full-session-token: reservado applyFullSessionToken directo
 */
export type HydrateSessionMode = 'bootstrap' | 'interceptor' | 'full-session-token';

export interface HydrateSessionCoreInput {
  mode: HydrateSessionMode;
  /** Omite carga de menú/permisos (Paso 4 L2 condicional). */
  skipMenu?: boolean;
  /** Omite setAuthInitialized/setIsBootstrapped (interceptor background). */
  skipBootstrapFlags?: boolean;
}

export interface HydrateSessionCoreDeps {
  getToken: () => string | null;
  getTokenUser: () => UserData | null;
  setAuthUser: (user: UserData) => void;
  fetchMe: () => Promise<UserData | null>;
  doLogout: (callServer: boolean) => Promise<void>;
  syncEmpresaSession: (user: UserData | null, token: string | null) => void;
  syncImpersonationFromToken: (token: string | null) => void;
  updateAccessLevels: (userData: UserData | null) => void;
  loadMenuAndPermissionsFromAuthMenu: (
    userData: UserData | null,
  ) => Promise<AuthMenuModulo[] | null>;
  loadEmpresasElegiblesForSession: (sessionUser: UserData) => Promise<EmpresaOption[]>;
  determineUserType: (accessLevel: number, isSuperAdmin: boolean) => string;
  setRequiereSeleccionEmpresa: (pending: boolean) => void;
  setMenuModulos: (modulos: AuthMenuModulo[] | null) => void;
  setPermissions: (permissions: UserPermissions | null) => void;
  setMenuPermissionsReady: (ready: boolean) => void;
  setEmpresasElegibles: (elegibles: EmpresaOption[]) => void;
  setAuthInitialized: (initialized: boolean) => void;
  setIsBootstrapped: (bootstrapped: boolean) => void;
  setSessionMenuSnapshot: (modulos: AuthMenuModulo[] | null) => void;
}

/**
 * Merge de UserData desde GET /auth/me + claims JWT + user previo en memoria.
 * Lógica pura extraída de initializeAuth (sin cambio de comportamiento).
 */
export function mergeSessionUserFromMe(
  me: UserData,
  token: string | null,
  tokenUser: UserData | null,
): UserData {
  const claims = decodeAccessToken(token);
  const mergedUser: UserData = {
    ...me,
    usuario_id: me.usuario_id || claims?.sub || '',
    cliente_id: me.cliente_id || claims?.cliente_id || '',
    es_admin_cliente: me.es_admin_cliente || Boolean(claims?.es_admin_cliente),
    empresa_activa: me.empresa_activa || claims?.empresa_id || null,
    requires_password_change:
      me.requires_password_change ?? Boolean(claims?.requires_password_change),
  };

  if (!mergedUser.usuario_id?.trim()) {
    if (import.meta.env.DEV) {
      console.warn(
        '[initializeAuth] usuario_id vacío tras /auth/me; manteniendo user_data del token',
        { meUsuarioId: me.usuario_id, tokenUsuarioId: tokenUser?.usuario_id, sub: claims?.sub },
      );
    }
    if (tokenUser) {
      return {
        ...tokenUser,
        ...mergedUser,
        usuario_id:
          mergedUser.usuario_id ||
          tokenUser.usuario_id ||
          claims?.sub ||
          '',
        cliente_id:
          mergedUser.cliente_id ||
          tokenUser.cliente_id ||
          claims?.cliente_id ||
          '',
        es_admin_cliente:
          mergedUser.es_admin_cliente ||
          tokenUser.es_admin_cliente ||
          Boolean(claims?.es_admin_cliente),
        empresa_activa:
          mergedUser.empresa_activa ||
          tokenUser.empresa_activa ||
          claims?.empresa_id ||
          null,
      };
    }
  }

  return mergedUser;
}

function shouldRunBootstrapGuard(mode: HydrateSessionMode): boolean {
  return mode === 'bootstrap';
}

/**
 * Núcleo L2 reutilizable: /auth/me, merge, access levels, menú, empresas elegibles.
 * Efectos de estado vía deps inyectados desde AuthContext (IAM-FE-PHASE-01 Paso 3).
 */
export async function hydrateSessionCore(
  input: HydrateSessionCoreInput,
  deps: HydrateSessionCoreDeps,
): Promise<UserData | null> {
  const { mode, skipMenu = false, skipBootstrapFlags = false } = input;

  if (mode === 'bootstrap') {
    console.log('[initializeAuth] iniciando', {
      tokenPresent: Boolean(deps.getToken()),
      tokenPrefix: deps.getToken()?.slice(0, 20),
    });
  }

  const token = deps.getToken();
  const claimsForInit = decodeAccessToken(token);

  if (mode === 'bootstrap') {
    console.log('[initializeAuth] canInitializeFullSession check', {
      canInitialize: canInitializeFullSession(token),
      empresa_selection_pending: claimsForInit?.empresa_selection_pending,
      empresa_id: claimsForInit?.empresa_id,
    });
  }

  if (shouldRunBootstrapGuard(mode) && !canInitializeFullSession(token)) {
    if (import.meta.env.DEV) {
      console.warn('[AuthContext] initializeAuth omitido: token no es sesión completa');
    }
    return null;
  }

  if (mode === 'bootstrap') {
    console.log('[initializeAuth] llamando /auth/me');
  }

  const me = await deps.fetchMe();
  if (!me) {
    await deps.doLogout(false);
    return null;
  }

  const claims = decodeAccessToken(deps.getToken());
  const tokenUser = deps.getTokenUser();
  const sessionUser = mergeSessionUserFromMe(me, deps.getToken(), tokenUser);

  deps.setAuthUser(sessionUser);
  deps.syncEmpresaSession(sessionUser, deps.getToken());

  if (claims?.empresa_selection_pending) {
    deps.setRequiereSeleccionEmpresa(true);
    deps.setMenuModulos(null);
    deps.setPermissions(null);
    deps.setMenuPermissionsReady(false);
    if (import.meta.env.DEV) {
      console.log('[AuthContext] JWT empresa_selection_pending: sesión requiere selección de empresa');
    }
  }

  deps.updateAccessLevels(sessionUser);

  if (!skipMenu && !claims?.empresa_selection_pending) {
    const modulos = await deps.loadMenuAndPermissionsFromAuthMenu(sessionUser);
    deps.setSessionMenuSnapshot(modulos);
  }

  const type =
    sessionUser.user_type ??
    deps.determineUserType(sessionUser.access_level ?? 0, !!sessionUser.is_super_admin);
  const isOnboardingAdmin =
    Boolean(sessionUser.es_admin_cliente) && !hasEmpresaActiva(sessionUser.empresa_activa);

  if (type === 'platform_admin' || isOnboardingAdmin) {
    deps.setEmpresasElegibles([]);
  } else {
    try {
      const elegibles = await deps.loadEmpresasElegiblesForSession(sessionUser);
      deps.setEmpresasElegibles(elegibles);
    } catch {
      // mantener lista previa (p. ej. desde login selection)
    }
  }

  deps.syncImpersonationFromToken(deps.getToken());

  if (!skipBootstrapFlags) {
    deps.setAuthInitialized(true);
    deps.setIsBootstrapped(true);
  }

  return sessionUser;
}
