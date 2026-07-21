# CFG Frontend Audit — React Query (AS-IS)

**Fecha:** 2026-07-17  
**Guía contrato:** `docs/frontend-contracts/cfg/05_FRONTEND_INTEGRATION_GUIDE.md`

---

## 1. Stack de server state

| Pieza | Path / uso |
|-------|------------|
| Librería | `@tanstack/react-query` |
| Queries tenant-aware | `useTenantQuery` (`src/core/hooks/useTenantQuery.ts`) |
| Listados Tier B/C | `useErpListQuery` (`src/core/list/useErpListQuery.ts`) |
| Mutations | `useMutation` en hooks de feature |
| Toasts error API | `onError` del mutation/hook (`getErrorMessage`) — ER-02 |
| Invalidación modular | Helpers `invalidate*Queries` por feature |

Zustand se reserva a auth/tenant/UI global — no a listas CFG.

---

## 2. Query keys — patrón actual

Cada feature define un objeto `qk` local o prefijos en el hook:

```ts
// Ejemplo INV categorías (AS-IS)
['inv', 'categoria', 'list', scopeEmpresaId, soloActivos]
['inv', 'categoria', 'detail', categoriaId, scopeEmpresaId]
```

`useTenantQuery` **añade** `tenantId` al final de la key.

Invalidación por prefijo de módulo:

```ts
// ORG AS-IS
ORG_QUERY_KEY_PREFIX = ['org']
invalidateQueries({ queryKey: ['org'] })
```

### Keys sugeridas por el contrato CFG (documental)

| Key | Contenido |
|-----|-----------|
| `['cfg','secuencias', filters]` | Listado |
| `['cfg','secuencia', secuenciaId]` | Detalle |
| `['cfg','preview', secuenciaId]` | Preview opcional |

El FE AS-IS no las tiene; son la guía de integración a respetar en diseño.

---

## 3. Queries (list + detail)

### Listado Tier B (referencia INV)

`useCategoriasErpList` (`src/features/inv/hooks/categorias.hooks.ts`):

1. Gate de scope (`useInvCompanyQueryGate`) — **específico company**; no copiar ciegamente a CFG.
2. `baseFilters` de dominio.
3. `useErpListQuery` con `fetcher`, `config` (tier, sortableColumns, forcePagination).
4. `useDebouncedSearch` → `debouncedBuscar`.
5. `useEffect` → `setPage(1)` al cambiar filtros/búsqueda.
6. `staleTime` modular (`INV_LIST_STALE_TIME_MS`).

### Detalle

`useTenantQuery` + `service.getById` + `enabled: !!id`.

### Full-load legacy

Hooks `useXxx` sin ErpList existen para selects/FK (LR-08).  
**No** deben alimentar tablas Tier B/C. CFG con paginación debe usar ErpList.

---

## 4. Mutations e invalidación (patrón AS-IS)

Ciclo típico ORG/INV:

1. `useMutation` → método del service.
2. `onSuccess`:
   - toast éxito
   - `invalidateQueries` list (+ detail si aplica)
3. `onError`:
   - toast vía `getErrorMessage` / helper módulo
4. El componente **no** duplica toast de error API.

### Mapa contrato CFG → invalidación

| Evento | Invalidar (contrato) | Alineación con patrón FE |
|--------|----------------------|---------------------------|
| PATCH 200 | Detalle + listado | Sí — invalidate list+detail |
| DELETE 200 | Detalle + listado | Sí |
| Reactivar 200 | Detalle + listado | Sí |
| Preview 200 | Nada obligatorio | Sí — mutation sin invalidate list |
| Cambio filtros | Nueva key / refetch | Sí — keys incluyen filters |
| 404 detalle | Remover detail; refetch list | `removeQueries` / invalidate |
| Cambio sesión / logout | Limpiar cache `cfg` | Prefijo `['cfg']` + clear auth |

---

## 5. Cache / staleTime

| Recurso | Sugerencia contrato | Práctica AS-IS en módulos |
|---------|---------------------|---------------------------|
| Listado | 30–60 s o refetch on focus | Constantes por módulo (`staleTime`) |
| Detalle | Corto; refetch antes de editar | Idem |
| Preview | No cachear o TTL segundos | Mutations one-shot; a veces sin query |

`useErpListQuery` acepta `staleTime` opcional.

---

## 6. Gates de enabled

| Gate | Uso AS-IS | ¿Aplica a CFG por defecto? |
|------|-----------|----------------------------|
| `useTenantQuery` requireTenant | Queries con tenant válido | **Sí** |
| `useOrgCompanyQueryGate` / `useInvCompanyQueryGate` | Exigen `scopeEmpresaId` | **Solo si** la pantalla es company-scoped |
| `useOrgHybridQueryGate` | Parámetros hybrid | No por defecto |

CFG es administración de secuencias del **tenant**; muchas filas pueden no depender de la empresa activa. Usar un company gate como INV categorías **sin análisis** sería un riesgo de diseño (queries `enabled: false` sin empresa).

---

## 7. Estados de UI vs React Query

El contrato define estados lógicos (`loading_list`, `saving`, `previewing`, …). En AS-IS se mapean así:

| Estado contrato | Fuente típica FE |
|-----------------|------------------|
| `loading_list` | `isLoading` / `isFetching` de ErpList |
| `loading_detail` | `isLoading` detail query |
| `saving` | `mutation.isPending` PATCH |
| `toggling_active` | `isPending` DELETE/reactivar |
| `previewing` | `isPending` preview mutation |
| `error` | `isError` + mensaje `getErrorMessage` |

Evitar mutaciones concurrentes: deshabilitar botones con `isPending` (ya se hace en catálogos).

---

## 8. Anti-patrones presentes en el repo (a no copiar para CFG)

| Anti-patrón | Ejemplo AS-IS | Por qué evitar en CFG |
|-------------|---------------|------------------------|
| `useState` + `fetch` manual en página | Varias páginas WMS (`ZonasPage`) | Pierde cache, invalidación y tenant keys |
| Full-load en tabla paginable | Legacy hooks | Viola LR-08 / contrato page envelope |
| Toast error en catch del componente | — | Viola ER-02 |
| Invalidar listado en Preview | — | Contrato lo prohíbe como obligatorio |

---

## 9. Resumen React Query

| Tema | Hallazgo |
|------|----------|
| Patrón canónico listado | `useDebouncedSearch` + `useErpListQuery` + `normalizeListResponse` |
| Patrón detalle | `useTenantQuery` |
| Patrón mutación | `useMutation` + invalidate prefijo |
| Prefijo CFG | No existe aún; contrato sugiere `['cfg', …]` |
| Company gate | No asumir; CFG es tenant-first |
| Preview | Mutation sin invalidar listado |
| Deuda | Algunos módulos (WMS) aún en local-state — no son referencia CFG |
