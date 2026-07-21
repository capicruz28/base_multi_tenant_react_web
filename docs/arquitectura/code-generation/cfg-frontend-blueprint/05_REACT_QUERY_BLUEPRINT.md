# CFG — React Query Blueprint

**Versión:** 1.0  
**Archivo keys:** `src/features/cfg/hooks/cfg-query-keys.ts`

---

## 1. Prefijo y factory (oficial)

```text
CFG_QUERY_KEY_PREFIX = ['cfg'] as const

cfgQueryKeys = {
  all: ['cfg'],
  secuencias: () => ['cfg', 'secuencias'],
  secuenciasList: () => ['cfg', 'secuencias', 'list'],
  // list key real la compone useErpListQuery:
  // queryKeyPrefix: ['cfg', 'secuencias', 'list', filterSignature]
  secuencia: (id: string) => ['cfg', 'secuencia', id],
}
```

`useTenantQuery` / ErpList añaden `tenantId` al final.

**Filter signature** (estable): serializar `modulo_codigo`, `es_activo`, `scope_type` (valores activos).  
`buscar` debounced entra vía ErpList params en la key interna.

---

## 2. Defaults

| Constante | Valor sugerido |
|-----------|----------------|
| `CFG_LIST_STALE_TIME_MS` | 45_000 |
| `CFG_DETAIL_STALE_TIME_MS` | 30_000 |
| List `refetchOnWindowFocus` | true (default RQ ok) |
| Preview | sin query persistente |

---

## 3. Queries oficiales

### `useCfgSecuenciasErpList`

| Item | Spec |
|------|------|
| Base | `useErpListQuery` |
| Config | `SECUENCIAS_LIST_CONFIG` |
| fetcher | `(params) => cfgSecuenciaService.list(params)` |
| baseFilters | `{ modulo_codigo?, es_activo?, scope_type? }` |
| debouncedBuscar | desde página |
| enabled | tenant valid (ErpList/useTenantQuery) |
| Efecto | `setPage(1)` al cambiar filtros/buscar |
| Sort default | `sequence_key` / `asc` |

### `useCfgSecuencia(secuenciaId, { enabled })`

| Item | Spec |
|------|------|
| Base | `useTenantQuery` |
| queryKey | `cfgQueryKeys.secuencia(id)` |
| queryFn | `cfgSecuenciaService.getById` |
| enabled | `enabled && !!id` |

---

## 4. Mutations oficiales

### `useUpdateCfgSecuencia`

- `mutationFn: ({ id, body }) => service.update(id, body)`
- `onSuccess`: toast “Configuración actualizada.”; `setQueryData` detail; `invalidateQueries` list prefix
- `onError`: toast `getErrorMessage`; retornar/parse field errors vía `cfg-error.utils` si el caller lo necesita

### `useDesactivarCfgSecuencia`

- `mutationFn: (id) => service.desactivar(id)`
- `onSuccess`: toast “Secuencia desactivada.”; invalidate list + detail
- `onError`: toast

### `useReactivarCfgSecuencia`

- Análogo; toast “Secuencia reactivada.”

### `usePreviewCfgSecuencia`

- `mutationFn: (id) => service.preview(id)`
- `onSuccess`: **no** invalidate list/detail; devolver data
- `onError`: toast; caller marca preview disabled si `PREVIEW_NOT_ALLOWED`

---

## 5. Invalidaciones oficiales

| Helper | Acción |
|--------|--------|
| `invalidateCfgQueries(qc)` | `invalidateQueries({ queryKey: ['cfg'] })` |
| `invalidateCfgSecuenciasList(qc)` | `['cfg','secuencias','list']` |
| `invalidateCfgSecuenciaDetail(qc, id)` | `['cfg','secuencia', id]` |
| `removeCfgSecuenciaDetail(qc, id)` | removeQueries detail |
| `removeCfgQueries(qc)` | remove all cfg (logout/tenant change) |

### Matriz evento → acción

| Evento | List | Detail |
|--------|------|--------|
| PATCH 200 | invalidate | setQueryData (preferido) + opcional invalidate |
| DELETE 200 | invalidate | invalidate o set con response |
| Reactivar 200 | invalidate | invalidate o set |
| Preview 200 | — | — |
| Detail 404 | invalidate | remove |
| Locked 422 | — | invalidate detail |
| Empresa JWT change | invalidate all cfg | idem |
| Logout | remove all cfg | idem |

---

## 6. Strategy de cache

| Recurso | Strategy |
|---------|----------|
| List | stale 45s; invalidate tras mutaciones escritura |
| Detail | stale 30s; fresh on dialog open (`refetchOnMount: 'always'` recomendado) |
| Preview | estado local del dialog / data de mutation; gc inmediato |

No usar `placeholderData` que oculte loading inicial de listado como “definitivo” sin `isFetching` indicator (diseño funcional).

---

## 7. Integración cambio de sesión

Si el proyecto tiene hooks tipo `useOrgScopeEmpresaReset` / invalidación global:

- Registrar invalidación `['cfg']` en el mismo punto que ORG/INV cuando cambie empresa o tenant.
- Wave de cableado: documentar en Spec de Implementación el archivo exacto tras grep.

---

## 8. Testing hooks (contrato)

- Mock service.
- Assert invalidate calls con queryKey prefix correcto.
- Preview mutation **no** llama invalidate list.
