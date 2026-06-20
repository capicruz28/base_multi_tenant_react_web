import { useEffect, useState } from 'react';
import { getUsers } from '../services/usuario.service';

const USER_COUNT_THRESHOLD = 100;
const PAGE_SIZE = 100;

export interface UseRoleUserCountsResult {
  counts: Record<string, number>;
  loading: boolean;
  unavailable: boolean;
}

/**
 * Agrega usuarios por rol_id desde GET /usuarios/ (sin API nueva).
 * Si total_usuarios > 100, no calcula en cliente.
 */
export function useRoleUserCounts(enabled: boolean): UseRoleUserCountsResult {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCounts({});
      setUnavailable(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const firstPage = await getUsers({ page: 1, limit: 1, solo_activos: true });
        if (firstPage.total_usuarios > USER_COUNT_THRESHOLD) {
          if (!cancelled) {
            setUnavailable(true);
            setCounts({});
          }
          return;
        }

        const total = firstPage.total_usuarios;
        const aggregated = [...firstPage.usuarios];
        let page = 2;

        while (aggregated.length < total) {
          const next = await getUsers({ page, limit: PAGE_SIZE, solo_activos: true });
          aggregated.push(...next.usuarios);
          page += 1;
          if (next.usuarios.length === 0) break;
        }

        const map: Record<string, number> = {};
        for (const user of aggregated) {
          for (const role of user.roles) {
            map[role.rol_id] = (map[role.rol_id] ?? 0) + 1;
          }
        }

        if (!cancelled) {
          setCounts(map);
          setUnavailable(false);
        }
      } catch (err) {
        console.error('[useRoleUserCounts] Error aggregating user counts:', err);
        if (!cancelled) {
          setCounts({});
          setUnavailable(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { counts, loading, unavailable };
}
