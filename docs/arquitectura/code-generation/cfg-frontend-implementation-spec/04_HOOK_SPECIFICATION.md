# CFG — Hook Specification

**Versión:** 1.0  
**Directorio:** `src/features/cfg/hooks/`

---

## 1. `cfg-query-keys.ts`

**Export:** `cfgQueryKeys`

| Key factory | Valor |
|-------------|-------|
| `all` | `['cfg']` |
| `secuencias` | `['cfg','secuencias']` |
| `secuenciasList` | `['cfg','secuencias','list']` |
| `secuencia(id)` | `['cfg','secuencia', id]` |

DoD: objeto congelado/as const; sin tenantId (lo añade useTenantQuery).

---

## 2. `cfg-query-defaults.ts`

**Exports:**

- `CFG_LIST_STALE_TIME_MS = 45_000`
- `CFG_DETAIL_STALE_TIME_MS = 30_000`

---

## 3. `useCfgSecuenciasErpList`

**Wave:** 2  
**Export:** named hook

### Signature conceptual

```text
useCfgSecuenciasErpList(options: {
  modulo_codigo?: string
  es_activo?: boolean
  scope_type?: CfgScopeType
  debouncedBuscar?: string
  enabled?: boolean
})
```

### Internals

- `queryKeyPrefix`: `['cfg','secuencias','list', filterSignature]`
- `fetcher`: `cfgSecuenciaService.list`
- `config`: `SECUENCIAS_LIST_CONFIG`
- `staleTime`: list default
- `useEffect` reset page on filter/buscar change

### Return

Lo que expone `useErpListQuery` (items, pagination, sort, isLoading, isFetching, isError, error, setPage, setLimit, …).

### Tests

- enabled false → no fetch
- filter change → setPage 1 (spy)

---

## 4. `useCfgSecuencia`

**Wave:** 2

### Signature

```text
useCfgSecuencia(secuenciaId: string | null | undefined, options?: { enabled?: boolean })
```

### Query

- key: `cfgQueryKeys.secuencia(id ?? '')`
- fn: `getById`
- enabled: `!!id && (options.enabled !== false)`
- staleTime: detail
- `refetchOnMount: 'always'` recomendado

### Tests

enabled sin id → no fetch.

---

## 5. `useUpdateCfgSecuencia`

**Wave:** 2

### Variables

`{ id: string, body: CfgSecuenciaUpdate }`

### onSuccess

1. toast “Configuración actualizada.”
2. `setQueryData(cfgQueryKeys.secuencia(id), data)` (+ tenant aware: usar mismo key shape que useTenantQuery — **Spec:** invalidar detail si setQueryData tenant key es frágil; preferido: `setQueryData` con predicate o `invalidateCfgSecuenciaDetail` + set local en dialog. **Oficial:** `invalidateCfgSecuenciaDetail` + `invalidateCfgSecuenciasList`; dialog usa response del mutate).
3. `invalidateCfgSecuenciasList`

**Ajuste Spec vs Blueprint (sin cambiar arquitectura):** para evitar mismatch de tenantId en setQueryData, la Spec fija:

- `onSuccess`: toast + `invalidateCfgSecuenciasList` + `invalidateCfgSecuenciaDetail(id)`
- Dialog aplica `mutation.data` / onSuccess callback al form

### onError

toast `getErrorMessage`; no throw swallow.

### Tests

invalidate list llamado; toast success.

---

## 6. `useDesactivarCfgSecuencia` / `useReactivarCfgSecuencia`

**Wave:** 2

- mutate `(id: string)`
- toasts: “Secuencia desactivada.” / “Secuencia reactivada.”
- invalidate list + detail
- onError toast

### Tests

invalidate ambos prefixes.

---

## 7. `usePreviewCfgSecuencia`

**Wave:** 2 (usable W5)

- mutate `(id: string)` → Preview response
- onSuccess: **no** `invalidateCfg*`
- onError: toast; dialog interpreta PREVIEW_NOT_ALLOWED via `cfg-error.utils`

### Tests P0

`invalidateQueries` **not** called for list key.

---

## 8. Invalidaciones (utils + auth)

Ver `07_UTILS_SPECIFICATION` + plan 01 §2.10.

Hooks **no** importan auth compositors.

---

## 9. Dependencias entre hooks

```text
cfg-query-keys / defaults
    ↑
useCfgSecuencia / useCfgSecuenciasErpList / mutations
    ↑
invalidate-cfg-queries (mutations only)
```

Ningún hook importa components/pages.
