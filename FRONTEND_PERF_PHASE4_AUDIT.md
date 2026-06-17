# FRONTEND_PERF — Auditoría post Fase 4 (IF + Stock + Alertas Tier C)

**Fecha:** 15 junio 2026  
**Alcance:** `InventarioFisicoPage`, `StockPage` (Stock + Alertas)  
**Patrón referencia:** `MovimientosPage` (Fase 3)  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md`

---

## 1. Veredicto

| Criterio | Estado |
|----------|--------|
| PERF-01 paginación Tier C obligatoria | ✅ |
| PERF-04 sort server whitelist | ✅ |
| Filtros dominio + reset `page=1` | ✅ |
| Full-load histórico eliminado | ✅ |
| Workflows IF (aprobar/finalizar/anular) | ✅ Sin cambios |
| Stock → Kardex navegación | ✅ Sin cambios |
| Kardex | ✅ Sin migrar (Fase 5) |

**Fase 4: LISTA PARA VALIDACIÓN MANUAL.**

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/inv/hooks/inventario-fisico.hooks.ts` | `INVENTARIO_FISICO_LIST_CONFIG`, `useInventariosFisicosErpList` |
| `src/features/inv/hooks/stock.hooks.ts` | `STOCK_LIST_CONFIG`, `useStocksErpList`, `useStockAlertasErpList` |
| `src/features/inv/services/inv.service.ts` | `invFetchStockList` (normalize + paginado) |
| `src/features/inv/pages/InventarioFisicoPage.tsx` | Hook paginado, sort, paginador |
| `src/features/inv/pages/StockPage.tsx` | Dos modos paginados, sort, paginador |

**Legacy preservado:** `useInventariosFisicos`, `useStocks`, `useStockAlertas` (full-load unwrap).

---

## 3. Configuración por recurso

### Inventario físico

```typescript
INVENTARIO_FISICO_LIST_CONFIG = {
  tier: 'C',
  forcePagination: true,
  defaultLimit: 50,
  defaultSort: { sort_by: 'fecha_inventario', sort_dir: 'desc' },
  sortableColumns: ['numero_inventario', 'fecha_inventario', 'estado', 'fecha_creacion'],
}
```

**Filtros:** `almacen_id`, `estado`, `fecha_desde`, `fecha_hasta`

### Stock / Alertas

```typescript
STOCK_LIST_CONFIG = {
  tier: 'C',
  forcePagination: true,
  defaultLimit: 50,
  defaultSort: { sort_by: 'fecha_actualizacion', sort_dir: 'desc' },
  sortableColumns: ['cantidad_actual', 'stock_minimo', 'fecha_actualizacion'],
}
```

| Modo | Endpoint | Filtros |
|------|----------|---------|
| Stock | `GET /inv/stock` | `almacen_id` |
| Alertas | `GET /inv/stock/alertas` | `almacen_id` |

---

## 4. Requests esperados (DevTools)

**Inventario físico (mount):**
```
GET /api/v1/inv/inventario-fisico?page=1&limit=50&sort_by=fecha_inventario&sort_dir=desc
```

**Con filtros:**
```
GET /api/v1/inv/inventario-fisico?almacen_id={uuid}&estado=en_proceso&page=1&limit=50&sort_by=fecha_inventario&sort_dir=desc
```

**Stock:**
```
GET /api/v1/inv/stock?page=1&limit=50&sort_by=fecha_actualizacion&sort_dir=desc
```

**Alertas:**
```
GET /api/v1/inv/stock/alertas?page=1&limit=50&sort_by=fecha_actualizacion&sort_dir=desc
```

**Sin `page`:** no debe emitirse ningún request de listado en estas pantallas.

---

## 5. Reset `page=1`

| Evento | Inventario físico | Stock / Alertas |
|--------|-------------------|-----------------|
| Cambio `almacen_id` | ✅ | ✅ |
| Cambio `estado` / fechas | ✅ | — |
| Toggle Stock ↔ Alertas | — | ✅ ambos hooks |
| Cambio empresa sesión | ✅ + `resetSortState` | ✅ + `resetSortState` |

---

## 6. Sort UI

### InventarioFisicoPage

| Columna | `sort_by` |
|---------|-----------|
| Número | `numero_inventario` |
| Fecha | `fecha_inventario` |
| Estado | `estado` |

### StockPage

| Columna | `sort_by` |
|---------|-----------|
| Actual | `cantidad_actual` |
| Mínimo | `stock_minimo` |

---

## 7. Evidencia manual — checklist QA

### 7.1 InventarioFisicoPage

- [ ] Mount con `page=1&limit=50`
- [ ] Paginación «Siguiente» funciona
- [ ] Filtro almacén/estado/fecha → `page=1`
- [ ] Sort Número/Fecha/Estado → params server
- [ ] Workflow detalle/aprobar/finalizar/anular sin regresión
- [ ] Solo `Eye` en acciones fila

### 7.2 StockPage — modo Stock

- [ ] Mount `GET /inv/stock?page=1&limit=50`
- [ ] Filtro almacén → `page=1`
- [ ] Sort Actual/Mínimo server-side
- [ ] Enriquecimiento producto por página (no full catálogo)

### 7.3 StockPage — modo Alertas

- [ ] Toggle Alertas → `GET /inv/stock/alertas?page=1&limit=50`
- [ ] `page=1` al cambiar de tab
- [ ] Paginación + sort operativos

### 7.4 Ausencia full-load

- [ ] Ningún listado IF/Stock/Alertas sin `page` en Network

---

## 8. Evidencia automatizada

```bash
npx tsc --noEmit   # exit 0 (archivos Fase 4)
npx vitest run src/core/list/__tests__  # 16/16 passed
```

---

## 9. Orden de fases actualizado

| Fase | Alcance | Estado |
|------|---------|--------|
| F4 | IF + Stock + Alertas | ✅ Esta entrega |
| **F5** | **Kardex** (`producto_id` obligatorio) | Pendiente |

---

## 10. Próximo paso — Fase 5 Kardex

- Gate `producto_id` antes de fetch
- Combobox producto paginado (no `useProductos` full-load)
- Patrón Tier C validado en F3 + F4

---

*Auditoría Fase 4 — Tier C extendido a inventario físico y stock.*
