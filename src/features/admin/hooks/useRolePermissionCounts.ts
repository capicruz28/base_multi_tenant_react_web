import { useEffect, useState } from 'react';
import { permissionService } from '../services/permission.service';
import { getPermisosNegocioByRol } from '../services/permisos-negocio.service';

export interface RolePermissionCounts {
  negocio: number;
  menu: number;
  total: number;
}

const cache = new Map<string, RolePermissionCounts>();

export function invalidateRolePermissionCountsCache(rolId?: string): void {
  if (rolId) {
    cache.delete(rolId);
  } else {
    cache.clear();
  }
}

export interface UseRolePermissionCountsResult {
  counts: Record<string, RolePermissionCounts | undefined>;
  loading: boolean;
}

/**
 * Conteos por rol: permisos negocio + menús con "ver" (máx. una página de roles).
 */
export function useRolePermissionCounts(
  rolIds: string[],
  enabled: boolean,
  /** Incrementar tras invalidar caché para forzar re-fetch (p. ej. al cerrar modal permisos). */
  refreshKey = 0,
): UseRolePermissionCountsResult {
  const [counts, setCounts] = useState<Record<string, RolePermissionCounts | undefined>>({});
  const [loading, setLoading] = useState(false);

  const rolIdsKey = rolIds.join(',');

  useEffect(() => {
    if (!enabled || rolIds.length === 0) {
      setCounts({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const next: Record<string, RolePermissionCounts | undefined> = {};

      await Promise.allSettled(
        rolIds.map(async (rolId) => {
          const cached = cache.get(rolId);
          if (cached) {
            next[rolId] = cached;
            return;
          }

          try {
            const [negocioData, menuPerms] = await Promise.all([
              getPermisosNegocioByRol(rolId),
              permissionService.getRolePermissions(rolId),
            ]);

            const negocio = Array.isArray(negocioData) ? negocioData.length : 0;
            const menu = Object.values(menuPerms).filter((p) => p.ver).length;
            const entry: RolePermissionCounts = {
              negocio,
              menu,
              total: negocio + menu,
            };
            cache.set(rolId, entry);
            next[rolId] = entry;
          } catch (err) {
            console.error(`[useRolePermissionCounts] Error for rol ${rolId}:`, err);
            next[rolId] = undefined;
          }
        }),
      );

      if (!cancelled) {
        setCounts((prev) => ({ ...prev, ...next }));
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [rolIdsKey, enabled, rolIds, refreshKey]);

  return { counts, loading };
}
