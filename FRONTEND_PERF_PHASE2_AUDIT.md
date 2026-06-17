# FRONTEND_PERF — Auditoría post Fase 2 (ProductosPage piloto)

**Fecha:** 15 junio 2026  
**Alcance:** `ProductosPage` únicamente — PERF-01, PERF-02 (mantenido), PERF-04  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md`  
**Infra:** Fase 0 (`useErpListQuery`, `normalizeListResponse`, `ErpPagination`, `ErpSortableHeader`)

---

## 1. Veredicto

| Criterio | Estado |
|----------|--------|
| Paginación server `page` + `limit` | ✅ |
| Normalización `list[]` / envelope | ✅ |
| Sort server `sort_by` + `sort_dir` | ✅ |
| Debounce Fase 1 (350 ms) | ✅ |
| `ErpPagination` | ✅ |
| `useErpListQuery` en ProductosPage | ✅ |
| Otras pantallas INV/ORG | ✅ Sin migrar |
| Workflows / RBAC / modales | ✅ Sin cambios |

**Fase 2: LISTA PARA VALIDACIÓN MANUAL** en entorno con API.

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/inv/hooks/productos.hooks.ts` | `PRODUCTOS_LIST_CONFIG`, `useProductosErpList` |
| `src/features/inv/pages/ProductosPage.tsx` | Hook paginado, sort headers, `ErpPagination` |

**Sin cambios:** `useProductos` (legacy full-load para Kardex, MovimientoForm, InventarioFisicoForm), services, contratos API.

---

## 3. Arquitectura Fase 2

```
ProductosPage
  ├── useDebouncedSearch()          → input inmediato + debouncedValue (Fase 1)
  └── useProductosErpList()
        └── useErpListQuery()
              ├── fetcher: invFetchList('/productos', buildInvListQuery)
              ├── normalizeListResponse() → envelope UI único
              ├── page / limit / sort state
              └── queryKey: tenant + empresa + filtros + page + sort + buscar
```

### Config recurso

```typescript
PRODUCTOS_LIST_CONFIG = {
  tier: 'B',
  sortableColumns: ['codigo_sku', 'nombre', 'tipo_producto', 'fecha_creacion'],
  defaultLimit: 50,
  forcePagination: true,
}
```

---

## 4. Cumplimiento PERF-01 — ProductosPage

| ID | Requisito contrato | Implementación | Estado |
|----|-------------------|----------------|--------|
| 1.1 | `page`/`limit` opt-in Tier B | `forcePagination: true` → siempre `page` + `limit` | ✅ |
| 1.2 | Normalizar `list[]` vs envelope | `normalizeListResponse` en `useErpListQuery` | ✅ |
| 1.3 | UI `pagina_actual` / `total_paginas` / `total` | `ErpPagination` | ✅ |
| 1.5 | Sin `has_next`/`has_prev` backend | `derivePaginationMeta` local | ✅ |

### Requests esperados (DevTools → Network)

**Paginación página 2, limit 50:**
```
GET /api/v1/inv/productos?solo_activos=true&page=2&limit=50
```

**Con envelope (backend paginado):**
```json
{
  "items": [ ... ],
  "total": 120,
  "pagina_actual": 2,
  "total_paginas": 3,
  "limit": 50
}
```

**Legacy `list[]` (transición):** array plano → UI muestra página 1 sintética (`total = items.length`, `pagina_actual = 1`). Sin crash; paginador refleja metadatos sintéticos.

---

## 5. Cumplimiento PERF-04 — ProductosPage

| ID | Requisito contrato | Implementación | Estado |
|----|-------------------|----------------|--------|
| 4.1 | Cabeceras solo whitelist §4 | `ErpSortableHeader` en SKU, Nombre, Tipo | ✅ |
| 4.2 | `sort_by` + `sort_dir`; reset `page=1` | `toggleSort` + `setPage(1)` en hook | ✅ |
| 4.4 | `sort_dir` solo con `sort_by` | `appendErpListPaginationSort` | ✅ |

### Ciclo sort (columna sortable)

| Click | Request query |
|-------|---------------|
| 1º | `sort_by=codigo_sku&sort_dir=asc&page=1&limit=50` |
| 2º | `sort_by=codigo_sku&sort_dir=desc&page=1&limit=50` |
| 3º | Sin sort (solo `page` + `limit`) |

**Columnas no sortables en UI:** Categoría, Precio, Estado (no están en whitelist).

---

## 6. PERF-02 mantenido (Fase 1)

| Comportamiento | Estado |
|----------------|--------|
| Debounce 350 ms en toolbar | ✅ `useDebouncedSearch` |
| Reset `page=1` al cambiar búsqueda debounced | ✅ `useEffect` en `useProductosErpList` |
| Reset `page=1` al togglear «Ver inactivos» | ✅ mismo effect (`solo_activos`) |

**Búsqueda + paginación combinadas:**
```
GET /api/v1/inv/productos?solo_activos=true&buscar=aceite&page=1&limit=50
```
Al escribir nuevo término → debounce → `page` vuelve a 1 automáticamente.

---

## 7. Evidencia manual — checklist QA

Completar en entorno con datos (>50 productos recomendado).

### 7.1 Paginación

- [ ] Abrir `/inv/productos` con empresa activa
- [ ] Verificar request inicial: `page=1&limit=50`
- [ ] Clic «Siguiente» → `page=2`; tabla muestra otros registros
- [ ] Footer: «Mostrando X a Y de Z» coherente con `total` API
- [ ] Cambiar «Por página» a 25 → `limit=25`, `page=1`

### 7.2 Sort server-side

- [ ] Clic cabecera **SKU** → request con `sort_by=codigo_sku&sort_dir=asc`
- [ ] Segundo clic → `sort_dir=desc`
- [ ] Tercer clic → sin `sort_by`/`sort_dir`
- [ ] Orden visual coherente con respuesta API (no reorden local)

### 7.3 Búsqueda + paginación

- [ ] Ir a página 2 sin búsqueda
- [ ] Escribir término en búsqueda; tras 350 ms → `page=1` + `buscar=...`
- [ ] Empty state correcto si 0 resultados con `hasSearch`

### 7.4 Normalización `list[]` vs envelope

| Escenario | Verificación |
|-----------|--------------|
| API devuelve envelope | Tabla = `items`; paginador usa `total`/`pagina_actual` del API |
| API devuelve `list[]` legacy | Tabla renderiza; sin error; paginador muestra 1 página (`total = len`) |

### 7.5 Regresiones

- [ ] Crear / editar / desactivar / reactivar producto → invalidación lista OK
- [ ] Modales dirty guard sin cambios
- [ ] RBAC acciones fila sin cambios
- [ ] Cambio empresa sesión → reset búsqueda + página 1

---

## 8. Evidencia automatizada

```bash
npx tsc --noEmit
# exit 0 (archivos Fase 2)

npx vitest run src/core/list/__tests__
# Test Files  2 passed (2)
# Tests       15 passed (15)
```

Tests relevantes para normalización dual:
- `normalizeListResponse preserva envelope`
- `normalizeListResponse convierte list[] legacy a envelope sintético`
- `appendErpListPaginationSort` — `limit` solo con `page`, `sort_dir` solo con `sort_by`

---

## 9. Fuera de alcance Fase 2 (intencional)

| Ítem | Fase destino |
|------|--------------|
| Filtros toolbar `categoria_id`, `tipo_producto` | Posterior / F6 |
| `ErpListTableShell` | Opcional; se mantiene patrón InvTableSkeleton actual |
| URL sync | F8 |
| Toast 422 `INVALID_SORT_COLUMN` | F8 |
| Categorías, UM, Almacenes, Tipos movimiento | F6 |
| Movimientos, Kardex, Stock, IF | F3–F5 |
| ParametrosPage | F7 |

---

## 10. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| Backend legacy solo `list[]` con muchos registros | Envelope sintético = 1 página; paginación real requiere envelope API |
| `useProductos` legacy en formularios | Sin cambio; full-load para comboboxes |
| Página > total tras mutación | Invalidación refetch; usuario puede volver a pág. 1 manualmente |

---

*Auditoría Fase 2 — ProductosPage piloto PERF listados v1.*
