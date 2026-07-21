# CFG — React Query (concepto)

**Versión:** 1.0  
**Alcance:** especificación conceptual (no hooks reales)

---

## 1. Principios

1. Server state solo con React Query.
2. Keys con prefijo `cfg` + `tenantId` vía `useTenantQuery` / ErpList.
3. **Tenant-first:** sin `useInvCompanyQueryGate` / `useOrgCompanyQueryGate`.
4. Listado Tier B: siempre `page` en el fetcher.
5. Toasts de error API en `onError` de mutations; éxito en `onSuccess`.
6. Preview no invalida listado/detail por consumo (no hay consumo).

---

## 2. Query keys conceptuales

| Key | Datos |
|-----|-------|
| `['cfg','secuencias','list', filters, page, limit, sort, tenantId]` | Listado (ErpList compone parte) |
| `['cfg','secuencia', secuenciaId, tenantId]` | Detalle |
| `['cfg','preview', secuenciaId]` | Opcional; preferible no persistir |

Prefijo de invalidación modular: `['cfg']`.

Filtros en key: `buscar`, `modulo_codigo`, `es_activo`, `scope_type` (los activos).

---

## 3. Queries

### Listado

| Aspecto | Spec |
|---------|------|
| Hook conceptual | `useCfgSecuenciasErpList` |
| Base | `useErpListQuery` + `normalizeListResponse` |
| Config | `tier: 'B'`, `forcePagination: true`, sortableColumns = whitelist contrato |
| staleTime | 30–60 s |
| enabled | tenant válido + permiso consultar (opcional) |
| Reset page | al cambiar filtros/buscar |

### Detalle

| Aspecto | Spec |
|---------|------|
| Hook conceptual | `useCfgSecuencia(secuenciaId)` |
| Base | `useTenantQuery` |
| enabled | dialog open && !!id |
| staleTime | corto; refetch on mount al abrir dialog |

---

## 4. Mutations

| Mutation | API | onSuccess | onError |
|----------|-----|-----------|---------|
| `useUpdateCfgSecuencia` | PATCH | toast éxito; set detail data; `invalidateQueries` list (+ detail) | toast `getErrorMessage`; field errors si 422 |
| `useDesactivarCfgSecuencia` | DELETE | toast; invalidate list+detail | toast |
| `useReactivarCfgSecuencia` | POST reactivar | toast; invalidate list+detail | toast |
| `usePreviewCfgSecuencia` | POST preview | devolver data al dialog; **no** invalidate list/detail | toast / UI 422 |

Concurrentes: una mutación de escritura a la vez por `secuencia_id` (disable UI).

---

## 5. Flujo por endpoint → cache

### GET List

- Fetch automático por key.
- Refetch: filtros, page, sort, invalidate, window focus (opcional).

### GET Detail

- Al abrir dialog.
- Tras PATCH: preferir **setQueryData** con body 200 + invalidate list.
- Tras locked 422: invalidate detail.

### PATCH

- Invalidar `['cfg','secuencias']` (list).
- Actualizar detail cache.

### DELETE / Reactivar

- Invalidar list + detail.
- Cerrar confirms; no dejar detail stale de estado activo.

### Preview

- Sin invalidate list/detail.
- Resultado efímero en estado del dialog.

---

## 6. UX de refresco

| Situación | UX |
|-----------|-----|
| Usuario en listado tras PATCH (dialog abierto) | Listado se refresca en background; dialog muestra response |
| Usuario cierra dialog | Ve listado ya invalidado/actualizado |
| Cambio empresa JWT sesión | Invalidar todo `['cfg']` (por si labels/scope cambian) |
| Logout / cambio tenant | `removeQueries` prefijo `cfg` |
| Solo Preview | Sin refresh de contador en UI de listado |

---

## 7. Invalidación conceptual (tabla)

| Evento | List | Detail | Preview cache |
|--------|:----:|:------:|:-------------:|
| PATCH 200 | ✓ | ✓ (set o invalidate) | — |
| DELETE 200 | ✓ | ✓ | clear |
| Reactivar 200 | ✓ | ✓ | clear |
| Preview 200 | — | — | discard |
| 404 detail | ✓ refetch | remove | — |
| Cambio filtros | nueva key | — | — |
| Sesión cambia | remove all cfg | remove | remove |

---

## 8. Errores y reintento

| Tipo | Reintento RQ automático | UI |
|------|:-----------------------:|-----|
| 4xx negocio | No | Mensaje / field |
| 401 | Tras auth | Relogin |
| Red / 5xx | 1 retry opcional o botón Reintentar | Sí |

---

## 9. Anti-patrones (diseño)

- Fetch manual en `useEffect` tipo WMS legacy.
- Full-load sin `page`.
- Invalidar listado en Preview.
- Incluir `empresa_id` de sesión como gate enabled obligatorio.
- Toast error duplicado en componente + hook.
