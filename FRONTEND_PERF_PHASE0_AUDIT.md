# FRONTEND_PERF — Auditoría post Fase 0 (infraestructura compartida)

**Fecha:** 15 junio 2026  
**Alcance:** Fase 0 únicamente — **sin migración de páginas**  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md`  
**Plan:** `FRONTEND_PERF_IMPLEMENTATION_PLAN.md` (orden F0→F8 aprobado)

---

## 1. Veredicto

| Criterio | Estado |
|----------|--------|
| Infra `core/list` implementada | ✅ |
| Componentes `shared/components/erp-list` | ✅ 5/5 |
| Types ORG/INV extendidos | ✅ |
| Services ORG/INV query builder + fetch raw | ✅ |
| Tests unitarios | ✅ 15/15 passed |
| `tsc --noEmit` | ✅ Sin errores |
| Páginas ORG/INV migradas | ✅ **0** (intencional) |
| `ErpDataTable` genérico | ✅ **No implementado** (aprobado) |
| Regresión hooks/páginas existentes | ✅ Comportamiento legacy preservado |

**Fase 0: APROBADA** — lista para iniciar **Fase 1** (debounce) tras tu OK.

---

## 2. Inventario de archivos creados

### 2.1 `src/core/list/`

| Archivo | Responsabilidad |
|---------|-----------------|
| `erp-list.types.ts` | `ErpPaginatedResponse<T>`, `ErpListQueryBase`, `ErpListResourceConfig`, tier |
| `erp-list.constants.ts` | `DEFAULT_LIMIT=50`, `MAX_LIMIT=100`, `DEBOUNCE_MS=350` |
| `erp-list-normalize.ts` | `isPaginated`, `normalizeListResponse`, `unwrapListItems`, `derivePaginationMeta` |
| `erp-list-query-params.ts` | `buildErpListQueryParams`, `appendErpListPaginationSort`, `resolveErpListFetchParams` |
| `useDebouncedSearch.ts` | Estado input + valor debounced para API |
| `useErpListQuery.ts` | Hook React Query + paginación/sort internos |
| `index.ts` | Barrel export |
| `__tests__/erp-list-normalize.test.ts` | 7 tests |
| `__tests__/erp-list-query-params.test.ts` | 8 tests |

### 2.2 `src/shared/components/erp-list/`

| Componente | PERF | Notas |
|------------|------|-------|
| `ErpSearchInput` | 02 | Debounce 350 ms; estilo `iamSearchInputClass` |
| `ErpPagination` | 01 | `pagina_actual`/`total_paginas`; sin `has_next` backend |
| `ErpSortableHeader` | 04 | Whitelist columnas; ciclo asc→desc→clear |
| `ErpListToolbar` | 03 | Slots + limpiar filtros; sin selector empresa |
| `ErpListTableShell` | 05 | `InvTableSkeleton` + `IamTableEmptyState` (SK-01, ES-01) |
| `index.ts` | — | Barrel export |

### 2.3 Archivos modificados (sin cambio de comportamiento UI)

| Archivo | Cambio |
|---------|--------|
| `src/features/org/types/org.types.ts` | `OrgCompanyListParams extends ErpListQueryBase` |
| `src/features/inv/types/inv.types.ts` | `InvListParams extends ErpListQueryBase` |
| `src/features/org/services/org.service.ts` | `buildListQuery` + `orgFetchList` + unwrap paginado |
| `src/features/inv/services/inv.service.ts` | `buildInvListQuery` + `invFetchList` + unwrap paginado |

---

## 3. Validación contrato `FRONTEND_LISTADOS_CONTRACT_V1`

| Regla contrato | Implementación F0 | Test |
|----------------|---------------------|------|
| `page` opt-in → envelope | `isPaginated` + `normalizeListResponse` | ✅ |
| `limit` solo con `page` | `appendErpListPaginationSort` | ✅ |
| `sort_dir` solo con `sort_by` | `appendErpListPaginationSort` | ✅ |
| `limit` max 100 | clamp en query builder | ✅ |
| Sin `has_next`/`has_prev` | `derivePaginationMeta` calcula local | ✅ |
| Tier C fuerza `page` | `resolveErpListFetchParams` + `forcePagination` | ✅ |
| Debounce 300–400 ms | `ERP_LIST_SEARCH_DEBOUNCE_MS = 350` | — |

---

## 4. Compatibilidad legacy (sin migración de páginas)

### 4.1 Services — patrón dual

| Función | Uso migración | Uso legacy |
|---------|---------------|------------|
| `orgFetchList` / `invFetchList` | Retorna `T[] \| ErpPaginatedResponse<T>` raw | — |
| `*.list()` existentes | — | `unwrapListItems` → siempre `T[]` |

**Efecto:** hooks actuales (`useCategorias`, `useEmpresas`, etc.) **sin cambios** siguen recibiendo arrays completos porque ninguna página envía `page` aún.

### 4.2 Verificación TypeScript

- `npx tsc --noEmit` — exit 0
- Pick types en services ampliados con `page` \| `limit` \| `sort_by` \| `sort_dir` opcionales

### 4.3 Transaccionales INV — `solo_activos`

`buildInvListQuery(..., { includeSoloActivosDefault: false })` en movimientos, kardex, IF, stock — evita enviar `solo_activos=true` donde el contrato no lo define.

---

## 5. `useErpListQuery` — contrato de uso (Fase 2+)

```typescript
const search = useDebouncedSearch();
const list = useErpListQuery({
  queryKeyPrefix: ['inv', 'producto', 'list', scopeEmpresaId],
  fetcher: (params) => invFetchList<Producto>('/productos', buildInvListQuery(params)),
  baseFilters: { solo_activos: !includeInactive, categoria_id, tipo_producto },
  debouncedBuscar: search.debouncedValue,
  config: {
    tier: 'B',
    sortableColumns: ['codigo_sku', 'nombre', 'tipo_producto', 'fecha_creacion'],
    defaultLimit: 50,
  },
  enabled: gateEnabled,
});
```

**Pendiente Fase 8:** `useErpListUrlState`, AbortController, toast 422.

---

## 6. Componentes UI — checklist pre-migración

| Componente | Tokens Capa 1 | Brand Capa 2 | Dependencias V2 |
|------------|---------------|--------------|-----------------|
| ErpSearchInput | ✅ `border-border-base`, `bg-surface` | ✅ `focus:ring-brand-primary` | SR-01 compatible |
| ErpPagination | ✅ `bg-subtle`, `border-border-base` | ✅ Button outline | — |
| ErpSortableHeader | ✅ `text-text-soft` | ✅ `text-brand-primary` activo | — |
| ErpListToolbar | ✅ layout TB-01 | — | ME-02 (sin empresa) |
| ErpListTableShell | ✅ | — | SK-01, ES-01 |

---

## 7. Brechas intencionales (fuera F0)

| Ítem | Fase destino |
|------|--------------|
| `useErpListUrlState` | F8 |
| AbortController en búsqueda | F8 |
| Toast 422 `INVALID_SORT_COLUMN` | F8 |
| `ErpDataTable` genérico | Post Productos+Movimientos+Kardex |
| Spike `vista=efectivo&page=1` Parametros | F7 |
| Cualquier página migrada | F1→F8 |

---

## 8. Riesgos residuales post F0

| Riesgo | Severidad | Mitigación en migración |
|--------|-----------|------------------------|
| Service `.list()` unwrap oculta metadata paginación | Baja | Fase 2+ usar `invFetchList` directo en `useErpListQuery` |
| `ErpSearchInput` `useEffect` + callback inline del padre | Baja | Memoizar `onDebouncedChange` o usar `useDebouncedSearch` |
| QueryKey `baseFilters` objeto por referencia | Media | Pasar filtros primitivos estables o `useMemo` en página |
| Parametros hybrid | Alta | No tocar hasta F7 + spike API |

---

## 9. Próximo paso recomendado

**Fase 1** — debounce sin paginación:

1. ORG ×6: `useDebouncedSearch` en estado `buscar` antes del hook
2. ProductosPage: separar `inputValue` / `buscarDebounced` en `useProductos` queryKey

Sin cambios en tablas ni workflows.

---

## 10. Comandos de verificación ejecutados

```bash
npx vitest run src/core/list/__tests__   # 15 passed
npx tsc --noEmit                          # exit 0
```

---

*Auditoría Fase 0 — infraestructura lista; migraciones de pantalla pendientes F1→F8.*
