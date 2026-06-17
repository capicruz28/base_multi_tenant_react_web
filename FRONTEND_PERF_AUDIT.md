# FRONTEND_PERF_AUDIT.md

**Fecha:** 15 junio 2026  
**Alcance:** ORG + INV (referencia oficial ERP)  
**Fase:** Auditoría y diseño — **sin implementación**  
**Fuentes de verdad (orden):**

1. `FRONTEND_LISTADOS_CONTRACT_V1.md`
2. `docs/api/ORG_API.json`
3. `docs/api/INV_API.json`

**Normativa UX existente (no modificada en esta fase):** `ERP_FRONTEND_STANDARDS_V2.md` v2.2 — Plantilla A/B, SR-01…04, RB-ROW, ME-01…09.

---

## 1. Resumen ejecutivo

| Dimensión | ORG (6 listados) | INV (10 superficies) |
|-----------|------------------|----------------------|
| **PERF-01 Paginación** | ❌ 0/6 usan `page`/`limit` | ❌ 0/10 usan `page`/`limit` |
| **PERF-02 Debounce** | ❌ 0/6 | ❌ 0/10 (Productos: refetch por keystroke) |
| **PERF-03 Toolbar filtros** | ⚠️ Parcial (`solo_activos`, Parametros `modulo_codigo`) | ⚠️ Parcial (Tier C sí; sin chips/limpiar/URL) |
| **PERF-04 Sorting** | ❌ 0/6 | ❌ 0/10 |
| **PERF-05 Reutilización** | ⚠️ Toolbar/skeleton/empty; tablas inline 6× | ⚠️ Mismo patrón; 4× búsqueda client duplicada |
| **PERF-06 Escalabilidad** | 🔴 Tier B sin paginar; búsqueda sin debounce | 🔴 Tier C full-load; N+1 enriquecimiento producto |

**Veredicto:** El backend listados v1 está **listo y congelado**. El frontend ORG/INV opera en modo **legacy full-load** (`list[]` sin `page`). La brecha es **100% frontend** y concentrada en capa types → services → hooks → páginas.

**Referencia positiva en el repo (fuera ORG/INV):** IAM admin (`UserManagementPage`, `RoleManagementPage`) usa `useDebounce` 500 ms; Super-admin `AuthAuditLogPanel` implementa paginación con `page`/`limit`/`total_paginas`.

---

## 2. Contrato backend — estado de consumo

### 2.1 Parámetros comunes (contrato §1)

| Parámetro | Backend | Frontend ORG/INV |
|-----------|---------|------------------|
| `page` | Opt-in ≥ 1 → envelope | ❌ No tipado ni enviado |
| `limit` | 1–100, solo con `page` | ❌ |
| `buscar` | SQL ILIKE | ⚠️ ORG 6/6 server; INV 1/5 maestros server; 4/5 client |
| `sort_by` / `sort_dir` | Whitelist por recurso | ❌ |
| `solo_activos` | Default `true` | ✅ Maestros |

### 2.2 Modos de respuesta

| Modo | Condición | Frontend hoy |
|------|-----------|--------------|
| **A — `list[]`** | Sin `page` | ✅ Único modo consumido |
| **B — envelope** | Con `page` | ❌ Sin tipos `Paginated*Response`; services retornan `Entity[]` |

### 2.3 Tiers (contrato §5)

| Tier | Recursos | Recomendación contrato | Estado frontend |
|------|----------|------------------------|-----------------|
| **A** | ORG empresa, sucursales, deptos, cargos | `list[]` aceptable | ✅ Conforme volumen; falta debounce/sort |
| **B** | ORG centros-costo, parámetros; INV maestros | `page=1&limit=50` en grillas | ❌ Full-load en todos |
| **C** | INV movimientos, kardex, IF, stock, alertas | **`page` obligatorio** en producción | ❌ Full-load crítico |

---

## 3. Inventario tablas ORG

| Página | Ruta | Tier | Paginación | Búsqueda | Debounce | Filtros server | Sort | URL sync | Hook / queryKey | Componentes |
|--------|------|------|------------|----------|----------|----------------|------|----------|-----------------|-------------|
| **EmpresaPage** | `/org/empresa` | A | ❌ API sin `page` | Server `buscar` | ❌ | `solo_activos` | ❌ | Solo `?onboarding=true` | `useEmpresas` `['org','empresa','list', soloActivos, buscar]` | `OrgToolbarSearch`, `OrgTableSkeleton`, `IamTableEmptyState` |
| **SucursalesPage** | `/org/sucursales` | A | ❌ | Server `buscar` | ❌ | `solo_activos` | ❌ | ❌ | `useSucursales` + aux `useCentrosCosto` full (FK modal) | `OrgCompanyToolbar`, patrón company |
| **DepartamentosPage** | `/org/departamentos` | A | ❌ | Server `buscar` | ❌ | `solo_activos` | ❌ | ❌ | `useDepartamentos` + aux `useSucursales`, `useCentrosCosto` | Idem |
| **CargosPage** | `/org/cargos` | A | ❌ | Server `buscar` | ❌ | `solo_activos` | ❌ | ❌ | `useCargos` + 2× `useDepartamentos` + `listMonedas` | Idem |
| **CentrosCostoPage** | `/org/centros-costo` | **B** | ❌ (**API sí `page`**) | Server `buscar` | ❌ | `solo_activos` | ❌ | ❌ | `useCentrosCosto` full list | Idem |
| **ParametrosPage** | `/org/parametros` | **B** | ❌ (**API sí `page`**) | Server `buscar` | ❌ | `solo_activos`, `modulo_codigo`, `vista` (tabs hybrid) | ❌ (sort client en fallback) | ❌ | `useParametrosForTab` — hasta 3 GET en fallback effective | + `OrgParametroHybridTabs`, `OrgHybridPrecedenceHint` |

### 3.1 Detalle ORG — capa técnica

**Types** (`org.types.ts`):

- `OrgCompanyListParams`: solo `solo_activos`, `buscar`
- `OrgParametroListParams`: + `modulo_codigo`, `vista`
- **Ausentes:** `page`, `limit`, `sort_by`, `sort_dir`

**Service** (`org.service.ts`):

- `buildListQuery` envía `solo_activos`, `buscar`, `modulo_codigo`, `vista`
- Todos los `.list()` retornan `Promise<Entity[]>` — sin normalización envelope

**Patrón búsqueda (6 páginas):**

```tsx
const [buscar, setBuscar] = useState('');
<OrgToolbarSearch value={buscar} onChange={setBuscar} />
useXxx({ solo_activos: !includeInactive, buscar });
```

Cada keystroke → cambio `queryKey` → refetch inmediato (PERF-02 gap).

**ParametrosPage — riesgo adicional:**

- Tab `effective`: intento `vista=efectivo`; fallback = 2 GET + merge/sort **in-memory** (`resolveParametrosEfectivos`)
- Contrato: sort post-merge server-side; paginación debe ser post-merge, no full-load

---

## 4. Inventario tablas INV

| Página / superficie | Ruta | Tier | Paginación | Búsqueda | Debounce | Filtros server | Sort | URL sync | Hook principal | Notas |
|---------------------|------|------|------------|----------|----------|----------------|------|----------|----------------|-------|
| **CategoriasPage** | `/inv/categorias` | B | ❌ | **Client** `matchesInvCatalogSearch` | N/A (client) | `solo_activos` | ❌ | ❌ | `useCategorias` | API tiene `buscar`+`page` — no usados |
| **UnidadesMedidaPage** | `/inv/unidades-medida` | B | ❌ | **Client** | N/A | `solo_activos` | ❌ | ❌ | `useUnidadesMedida` | Idem |
| **AlmacenesPage** | `/inv/almacenes` | B | ❌ | **Client** + enrich sucursal | N/A | `solo_activos` (`sucursal_id` en hook, sin UI) | ❌ | ❌ | `useAlmacenes` + `sucursalService.list` full | Filtro sucursal no expuesto en toolbar |
| **TiposMovimientoPage** | `/inv/tipos-movimiento` | B | ❌ | **Client** | N/A | `solo_activos` | ❌ | ❌ | `useTiposMovimiento` | Idem |
| **ProductosPage** | `/inv/productos` | B | ❌ | **Server `buscar`** | ❌ **refetch/keystroke** | `solo_activos` (`categoria_id`/`tipo_producto` en hook, sin UI) | ❌ | ❌ | `useProductos` + full `useCategorias`, `useUnidadesMedida` | Mayor presión API hoy |
| **MovimientosPage** | `/inv/movimientos` | **C** | ❌ | N/A (API sin `buscar`) | — | `tipo_movimiento_id`, `almacen_id`, `estado`, fechas | ❌ | ❌ | `useMovimientos` | Toolbar custom (no `OrgCompanyToolbar`) |
| **KardexPage** | `/inv/kardex` | **C** | ❌ | N/A | — | `producto_id`, `almacen_id`, fechas | ❌ | **Lectura init** `producto_id`, `almacen_id` | `useKardex` **sin gate** `producto_id` + full `useProductos` para `<select>` | API exige `producto_id` |
| **InventarioFisicoPage** | `/inv/inventario-fisico` | **C** | ❌ | N/A | — | `almacen_id`, `estado`, fechas | ❌ | ❌ | `useInventariosFisicos` | B-L workflow intacto |
| **StockPage** | `/inv/stock` | **C** | ❌ | N/A | — | `almacen_id` | ❌ | Escribe URL kardex al navegar | `useStocks` / `useStockAlertas` | Toggle Stock/Alertas |
| **Alertas** (modo StockPage) | — | **C** | ❌ | N/A | — | `almacen_id` | ❌ | ❌ | `useStockAlertas` → `/inv/stock/alertas` | Sin página dedicada |

### 4.1 Detalle INV — capa técnica

**Types** (`inv.types.ts`):

- `InvListParams`: filtros dominio + `buscar` — **sin** `page`, `limit`, `sort_by`, `sort_dir`
- **Sin** tipos `Paginated*Response` ni `ErpPaginatedResponse<T>`

**Service** (`inv.service.ts`):

- 10 métodos `.list()` / `.alertas()` retornan arrays completos
- Ninguno pasa parámetros de paginación ni sort

**Búsqueda client** (`inv-catalog-client-search.ts`):

- Usado en 4 catálogos Tier B
- Documentado en V2 §5.3.1 como complemento SR-04
- **Desalineado con contrato v1:** contrato prohíbe filtrar in-memory; backend expone `buscar` SQL

**Cargas auxiliares ocultas (PERF-06):**

| Página | Queries extra full-load |
|--------|-------------------------|
| ProductosPage | `useCategorias`, `useUnidadesMedida` (modales) |
| AlmacenesPage | `sucursalService.list` (ORG) |
| MovimientosPage, IF | `useAlmacenes`, `useTiposMovimiento` |
| KardexPage | `useAlmacenes`, `useTiposMovimiento`, **`useProductos` catálogo completo** |
| StockPage | `useAlmacenes` + N× `productoService.getById` |
| Detalle B-L | N× `getById(producto)` por líneas visibles |

---

## 5. Componentes reutilizables existentes

### 5.1 Ya disponibles (usar como base PERF-05)

| Componente | Ubicación | Rol actual | Gap PERF |
|------------|-----------|------------|----------|
| `IamSearchInput` | `src/features/admin/components/iam/IamSearchInput.tsx` | Input búsqueda con icono | Sin debounce integrado |
| `OrgToolbarSearch` | `src/features/org/components/OrgToolbarSearch.tsx` | Wrapper ancho fijo sobre `IamSearchInput` | Sin debounce |
| `InvTableSkeleton` | `src/features/inv/components/InvTableSkeleton.tsx` | Skeleton tabla (SK-01) | OK |
| `OrgTableSkeleton` | Re-export INV | Skeleton ORG | OK |
| `IamTableEmptyState` | `src/features/admin/components/iam/IamTableEmptyState.tsx` | Empty ES-01 + `hasSearch` | OK |
| `OrgCompanyToolbar` | `src/features/org/components/OrgCompanyToolbar.tsx` | Layout toolbar company | Sin slots filtros/paginación |
| `InvPageLayout` / `OrgPageLayout` | Módulos | Contenedor página | OK |
| `useDebounce` | `src/core/utils/debounce.ts` | Hook genérico | **Existe; no usado en ORG/INV** |

### 5.2 No existen (PERF-05 gap)

| Componente sugerido contrato | Estado repo |
|------------------------------|-------------|
| `ErpDataTable` | ❌ No existe |
| `ErpPagination` | ❌ No existe (paginadores ad-hoc en IAM admin / super-admin) |
| `ErpSortableHeader` | ❌ No existe |
| `useErpList` | ❌ No existe |
| Tipos `ErpPaginatedResponse<T>` | ❌ No existe en ORG/INV |

### 5.3 Referencias de paginación fuera de alcance (patrón a copiar)

| Ubicación | Patrón |
|-----------|--------|
| `AuthAuditLogPanel.tsx` | `page`, `limit`, `total_paginas`, `useDebounce(400ms)` |
| `UserManagementPage.tsx` | `useDebounce(500ms)` + paginación server IAM |
| `ClientManagementPage.tsx` | `pagina_actual` / `total_paginas` |

---

## 6. Duplicaciones detectadas

### 6.1 ORG (6× repetición)

1. **Toolbar:** `OrgToolbarSearch` + checkbox «Ver inactivos» + botón Crear
2. **Tabla inline:** `<table>` con mismas clases Tailwind por página
3. **Estados:** skeleton → error → empty (`IamTableEmptyState`) → tbody
4. **Reset empresa:** `useOrgScopeEmpresaReset` + `resetLocalFilters` (5 páginas company)
5. **Catálogos geo:** `EmpresaPage` y `SucursalesPage` — mismo `useEffect` 4 requests geo

### 6.2 INV

1. **Plantilla A catálogos (5 páginas):** toolbar + tabla + modales B.1.1 — estructura casi idéntica
2. **Búsqueda client (4 páginas):** `matchesInvCatalogSearch` + `useMemo` — candidato a eliminar post-migración server `buscar`
3. **Tier C toolbars:** 4 páginas con toolbar custom `div` (no `OrgCompanyToolbar`)
4. **Enriquecimiento producto N+1:** patrón repetido Stock, Kardex, detalle B-L

### 6.3 Cross-módulo

- `OrgToolbarSearch` / `IamSearchInput` compartidos ORG+INV — punto único para debounce
- `InvTableSkeleton` / `IamTableEmptyState` — ya unificados; mantener en migración

---

## 7. Hallazgos por PERF-01..06

### PERF-01 — Paginación

| ID | Hallazgo | Severidad | Evidencia |
|----|----------|-----------|-----------|
| P01-01 | **0 listados** envían `page`/`limit` | Crítica | `OrgCompanyListParams`, `InvListParams` sin campos |
| P01-02 | Services retornan solo `Entity[]` | Crítica | `org.service.ts`, `inv.service.ts` |
| P01-03 | Tier C carga histórico completo | **Crítica** | Movimientos, Kardex, IF, Stock, Alertas |
| P01-04 | Tier B ORG (centros-costo, parámetros) sin paginar pese a API | Alta | OpenAPI + contrato §4 |
| P01-05 | Tier B INV maestros sin paginar | Alta | 5 catálogos + Productos |
| P01-06 | Sin normalización `list[]` → envelope para UI | Media | Contrato §2 modo A/B |
| P01-07 | Sin UI `pagina_actual`/`total_paginas`/`total` | Media | No hay `ErpPagination` |

**Migraciones necesarias:** extender types → services (union response) → hooks (queryKey con `page`/`limit`) → UI paginador → por página según tier.

---

### PERF-02 — Debounce búsquedas

| ID | Hallazgo | Severidad | Evidencia |
|----|----------|-----------|-----------|
| P02-01 | ORG: 6 buscadores server **sin debounce** | Alta | `OrgToolbarSearch` → refetch inmediato |
| P02-02 | INV Productos: server `buscar` **sin debounce** | **Alta** | `searchTerm` directo en `useProductos` queryKey |
| P02-03 | INV 4 catálogos: búsqueda client (no API) | Media | `matchesInvCatalogSearch` — sin presión API pero desalineado contrato |
| P02-04 | `useDebounce` existe en core, no usado ORG/INV | Info | `src/core/utils/debounce.ts` |
| P02-05 | Sin AbortController en búsquedas | Media | Contrato §7.1 recomienda cancelar request anterior |
| P02-06 | Sin reset `page=1` al buscar | Media | Aplica cuando se implemente paginación Tier B |

**Estrategia:** debounce 300–400 ms en capa toolbar (no en cada página); valor debounced al hook/service.

---

### PERF-03 — Toolbar filtros

| ID | Hallazgo | Severidad | Evidencia |
|----|----------|-----------|-----------|
| P03-01 | `solo_activos` implementado en maestros | OK | Checkbox «Ver inactivos» |
| P03-02 | Filtros dominio Tier C parcialmente implementados | OK | Movimientos, IF, Kardex, Stock |
| P03-03 | Filtros hook sin UI: `categoria_id`, `tipo_producto` (Productos), `sucursal_id` (Almacenes) | Media | Params en hook/service, no en toolbar |
| P03-04 | Sin chips filtros activos | Baja | Contrato §7.3 |
| P03-05 | Sin botón «Limpiar filtros» unificado | Baja | Reset local por página |
| P03-06 | Sin sync URL de filtros/página/sort | Media | Solo Kardex lee params init |
| P03-07 | Parametros: tabs hybrid + `modulo_codigo` | OK | Caso especial H — preservar en migración |

---

### PERF-04 — Sorting

| ID | Hallazgo | Severidad | Evidencia |
|----|----------|-----------|-----------|
| P04-01 | Ninguna tabla envía `sort_by`/`sort_dir` | Alta | Hooks/services |
| P04-02 | Sin cabeceras clickables | Alta | Todas las tablas |
| P04-03 | Parametros: sort in-memory en fallback | Media | `resolveParametrosEfectivos` |
| P04-04 | INV client sort implícito en `useMemo` (orden array API) | Baja | Desaparece con server sort |
| P04-05 | Sin manejo 422 `INVALID_SORT_COLUMN` | Media | Contrato §2 + §7.4 |
| P04-06 | Movimientos default recomendado `fecha_movimiento desc` no aplicado | Media | Tier C |

**Regla:** prohibido sort in-memory sobre datasets paginados (contrato §7.4, PERF-06).

---

### PERF-05 — Componentes reutilizables

| ID | Hallazgo | Severidad | Evidencia |
|----|----------|-----------|-----------|
| P05-01 | Infra lista ERP inexistente | Alta | No `useErpList`, `ErpPagination` |
| P05-02 | Tablas 100% inline por página | Media | 16 superficies listado |
| P05-03 | Toolbar duplicada 6× ORG, 5× INV A | Media | Copy-paste |
| P05-04 | Building blocks UX ya unificados (SK, ES, SR) | OK | V2 §10 |
| P05-05 | `matchesInvCatalogSearch` — util duplicación conceptual con server `buscar` | Media | Eliminar tras migración |
| P05-06 | Paginadores ad-hoc solo fuera ORG/INV | Info | Patrón reutilizable desde super-admin |

---

### PERF-06 — Escalabilidad

| ID | Hallazgo | Severidad | Evidencia |
|----|----------|-----------|-----------|
| P06-01 | Tier C unbounded growth | **Crítica** | Full-load histórico |
| P06-02 | Kardex: `useProductos` full para `<select>` | **Alta** | Catálogo crece con tenant |
| P06-03 | Kardex: query sin `producto_id` obligatorio | **Alta** | Hook `enabled` no gatea; API 422 |
| P06-04 | N+1 `productoService.getById` en listados | Alta | Stock, Kardex, detalle B-L |
| P06-05 | Keystroke → API storm (ORG + Productos) | Alta | Sin debounce |
| P06-06 | Queries auxiliares FK full-load en modales | Media | Aceptable Tier A; revisar Kardex |
| P06-07 | `staleTime: 30s` en INV — mitiga pero no sustituye paginación | Info | `inv-query-defaults.ts` |
| P06-08 | Parametros triple-fetch fallback | Media | Escalabilidad parámetros hybrid |
| P06-09 | Filtrado in-memory post-fetch (4 INV + Parametros) | Media | Contrato prohíbe para datasets grandes |

---

## 8. Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación propuesta |
|--------|--------------|---------|----------------------|
| Romper Plantilla A/B al extraer componentes | Media | Alto | Migración incremental; una página piloto; no tocar modales/workflow |
| Union `list[]` \| envelope mal tipada | Media | Alto | Capa normalización única en service + type guard |
| Parametros hybrid incompatible con paginación server | Media | Medio | Validar `vista=efectivo` estable; fase dedicada |
| Kardex sin producto picker async | Alta | Alto | Fase previa: gate `producto_id` + combobox `buscar` |
| RBAC/ME gates rotos por queryKey nueva | Baja | Alto | Incluir `scopeEmpresaId` + filtros en keys; tests hook |
| Regresión RB-ROW / empty `hasSearch` | Media | Medio | Mantener `hasSearch` con término debounced |
| V2 SR-04 vs contrato v1 (client search) | Baja | Bajo | Actualizar §5.3.1 post-migración (fase documental separada) |

---

## 9. Matriz resumen — brecha contrato vs código

| Recurso | Tier | page API | FE page | buscar API | FE buscar | sort API | FE sort |
|---------|------|:--------:|:-------:|:----------:|:---------:|:--------:|:-------:|
| org/empresa | A | — | — | ✅ | ✅ server | ✅ | ❌ |
| org/sucursales | A | — | — | ✅ | ✅ server | ✅ | ❌ |
| org/departamentos | A | — | — | ✅ | ✅ server | ✅ | ❌ |
| org/cargos | A | — | — | ✅ | ✅ server | ✅ | ❌ |
| org/centros-costo | B | ✅ | ❌ | ✅ | ✅ server | ✅ | ❌ |
| org/parametros | B | ✅ | ❌ | ✅ | ✅ server | ✅ | ❌ |
| inv/categorias | B | ✅ | ❌ | ✅ | ❌ client | ✅ | ❌ |
| inv/unidades-medida | B | ✅ | ❌ | ✅ | ❌ client | ✅ | ❌ |
| inv/almacenes | B | ✅ | ❌ | ✅ | ❌ client | ✅ | ❌ |
| inv/tipos-movimiento | B | ✅ | ❌ | ✅ | ❌ client | ✅ | ❌ |
| inv/productos | B | ✅ | ❌ | ✅ | ✅ server* | ✅ | ❌ |
| inv/movimientos | C | ✅ | ❌ | — | — | ✅ | ❌ |
| inv/kardex | C | ✅ | ❌ | — | — | ✅ | ❌ |
| inv/inventario-fisico | C | ✅ | ❌ | — | — | ✅ | ❌ |
| inv/stock | C | ✅ | ❌ | — | — | ✅ | ❌ |
| inv/stock/alertas | C | ✅ | ❌ | — | — | ✅ | ❌ |

\* Productos: server `buscar` sin debounce.

---

## 10. Conclusión de auditoría

ORG e INV están **funcionalmente completos** como referencia UX/RBAC (V2.2), pero **no conformes** al contrato de listados escalables v1 para PERF-01…06.

**Prioridad de cierre:**

1. **Infra compartida** (types, normalización, hook, paginador, debounce toolbar)
2. **Quick win:** debounce ORG + Productos
3. **Tier C INV** (riesgo escalabilidad máximo)
4. **Tier B INV** (migrar client → server `buscar` + paginación)
5. **Tier B ORG** (centros-costo, parámetros)
6. **Sort + URL sync** (cross-cutting)

**Siguiente paso:** revisar `FRONTEND_PERF_IMPLEMENTATION_PLAN.md` y aprobar antes de escribir código.

---

*Auditoría generada sin modificación de código fuente — 2026-06-15*
