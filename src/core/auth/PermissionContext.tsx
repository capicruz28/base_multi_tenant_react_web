/**
 * WAVE 3A — Frontend Permission System (SaaS Pattern)
 *
 * Permission Provider global que consume GET /auth/permissions/me
 * y permite controlar la UI por permisos (string[]).
 *
 * Uso: envolver la app con <PermissionProvider> (dentro de AuthProvider).
 * Ejemplo: {hasPermission("wms.zona.crear") && <Button>Crear Zona</Button>}
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api from '@/core/api/api';
import { useAuth } from '@/shared/context/AuthContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionContextValue {
  /** Lista de códigos de permiso (ej: "wms.zona.crear") */
  permissions: string[];
  /** true mientras se cargan los permisos */
  loading: boolean;
  /** true solo cuando los permisos reales ya fueron calculados (evita race condition) */
  permissionsInitialized: boolean;
  /** Devuelve true si el usuario tiene el permiso indicado */
  hasPermission: (code: string) => boolean;
}

const defaultValue: PermissionContextValue = {
  permissions: [],
  loading: true,
  permissionsInitialized: false,
  hasPermission: () => false,
};

const PermissionContext = createContext<PermissionContextValue>(defaultValue);

// ---------------------------------------------------------------------------
// API response
// ---------------------------------------------------------------------------

interface PermissionsMeResponse {
  permissions: string[];
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { auth, isAuthenticated, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsInitialized, setPermissionsInitialized] = useState(false);

  // Reiniciar cuando cambie el usuario autenticado
  useEffect(() => {
    setPermissionsInitialized(false);
  }, [auth.user?.usuario_id]);

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PermissionsMeResponse>('/auth/permissions/me');
      const list = Array.isArray(data?.permissions) ? data.permissions : [];
      setPermissions(list);
    } catch {
      // Error silencioso: dejar permisos vacíos
      setPermissions([]);
    } finally {
      setLoading(false);
      setPermissionsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // ✅ WAVE 3: Esperar a que termine el bootstrap de AuthContext.
    if (authLoading) {
      setLoading(true);
      return;
    }

    // Si no hay sesión, permisos vacíos y ya están "calculados"
    if (!isAuthenticated) {
      setPermissions([]);
      setLoading(false);
      setPermissionsInitialized(true);
      return;
    }

    loadPermissions();
  }, [isAuthenticated, authLoading, loadPermissions]);

  const hasPermission = useCallback(
    (code: string): boolean => {
      if (!code || typeof code !== 'string') return false;
      return permissions.includes(code.trim());
    },
    [permissions]
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      permissions,
      loading,
      permissionsInitialized,
      hasPermission,
    }),
    [permissions, loading, permissionsInitialized, hasPermission]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook para controlar la UI por permisos.
 *
 * @example
 * const { hasPermission, permissions, loading } = usePermission();
 * {hasPermission("wms.zona.crear") && <Button>Crear Zona</Button>}
 */
export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
}
