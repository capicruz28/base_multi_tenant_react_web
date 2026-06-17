# FRONTEND_PERF — Auditoría post Fase 5 (Kardex Tier C)

**Fecha:** 15 junio 2026  
**Alcance:** `KardexPage` — listado paginado con gate `producto_id`  
**Patrón referencia:** `MovimientosPage` (F3), IF/Stock (F4)  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md` §6.8

---

## 1. Veredicto

| Criterio | Estado |
|----------|--------|
| `useKardexErpList` + `useErpListQuery` | ✅ |
| Paginación Tier C `page=1&limit=50` | ✅ |
| Sort server whitelist | ✅ |
| Gate estricto `producto_id` | ✅ |
| Sin `GET /kardex?page=1` sin producto | ✅ |
| Navegación Stock → Kardex (query params) | ✅ Sin cambios |
| Selector producto | ✅ `useProductos` legacy (temporal) |

**Fase 5: LISTA PARA VALIDACIÓN MANUAL.**

---

## 2. Auditoría de impacto — `useProductos` en Kardex

| Uso | Archivo | Rol | Decisión F5 |
|-----|---------|-----|-------------|
| `useProductos({ solo_activos: true })` | `KardexPage.tsx` | Opciones `<select>` producto | **Mantener legacy** |
| `useKardex` (listado) | `KardexPage.tsx` | Tabla kardex | **Reemplazado** por `useKardexErpList` |
| `productoService.getById` | `KardexPage.tsx` | Enriquecer etiquetas filas | **Sin cambio** (por página) |

### Consumidores `useProductos` (referencia)

| Pantalla / hook | Uso |
|-----------------|-----|
| `ProductosPage` | Listado paginado (`useProductosErpList`) |
| `KardexPage` | **Solo selector** (full-load temporal) |
| `MovimientoFormPage` | Combobox líneas |
| `InventarioFisicoFormPage` | Combobox líneas |

**Conclusión:** migrar el selector a combobox paginado es **fuera de alcance F5**; no bloquea el listado Tier C. Riesgo aceptado: full-load solo en dropdown, no en `GET /kardex`.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/inv/hooks/kardex.hooks.ts` | `KARDEX_LIST_CONFIG`, `useKardexErpList`, gate en `useKardex` legacy |
| `src/features/inv/pages/KardexPage.tsx` | Listado paginado, sort, gate UI, `ErpPagination` |

---

## 4. Configuración Tier C

```typescript
KARDEX_LIST_CONFIG = {
  tier: 'C',
  forcePagination: true,
  defaultLimit: 50,
  defaultSort: { sort_by: 'fecha_movimiento', sort_dir: 'desc' },
  sortableColumns: ['fecha_movimiento', 'cantidad_base', 'costo_unitario'],
}
```

### Gate `producto_id`

```typescript
const productoId = (options?.producto_id ?? '').trim();
const enabled = gateEnabled && productoId.length > 0 && (options?.enabled ?? true);
```

- `useErpListQuery` con `enabled: false` → **cero requests** React Query
- `baseFilters.producto_id` solo cuando `hasProductoId`
- UI: panel «Seleccione un producto…» si no hay producto

---

## 5. Requests esperados

**Válido (producto seleccionado):**
```
GET /api/v1/inv/kardex?producto_id={uuid}&page=1&limit=50&sort_by=fecha_movimiento&sort_dir=desc
```

**Con filtros:**
```
GET /api/v1/inv/kardex?producto_id={uuid}&almacen_id={uuid}&fecha_desde=2026-01-01&page=1&limit=50&sort_by=fecha_movimiento&sort_dir=desc
```

**Inválido — NO debe emitirse:**
```
GET /api/v1/inv/kardex?page=1&limit=50
GET /api/v1/inv/kardex?page=1
GET /api/v1/inv/kardex
```

---

## 6. PERF-01 / PERF-04 — KardexPage

| PERF | Cumplimiento |
|------|--------------|
| PERF-01 | `page`+`limit` siempre con producto; `ErpPagination`; sin full-load listado |
| PERF-04 | Sort Fecha / Cant. base / Costo u.; default `fecha_movimiento desc` |
| Reset `page=1` | Al cambiar producto, almacén, fechas |

---

## 7. Evidencia manual — checklist QA

### 7.1 Gate `producto_id`

- [ ] Abrir Kardex sin producto → **ningún** request `GET /inv/kardex`
- [ ] Mensaje «Seleccione un producto para consultar el kardex»
- [ ] Elegir producto → primer request incluye `producto_id` + `page=1&limit=50`

### 7.2 Navegación desde Stock

- [ ] Botón Kardex en StockPage → URL con `producto_id` + `almacen_id`
- [ ] Kardex carga con producto preseleccionado y request válido

### 7.3 Paginación

- [ ] «Siguiente» → `page=2` con mismo `producto_id`
- [ ] Footer coherente con `total` API

### 7.4 Sort

- [ ] Mount: `sort_by=fecha_movimiento&sort_dir=desc`
- [ ] Clic Cant. base → `sort_by=cantidad_base&sort_dir=asc&page=1`

### 7.5 Filtros + reset page

- [ ] Página 2 → cambiar almacén → `page=1`
- [ ] Cambiar producto → `page=1` + nuevo `producto_id` en query

### 7.6 Ausencia full-load listado

- [ ] Ningún kardex list sin `page`
- [ ] Selector `useProductos` puede seguir full-load (conocido, fuera alcance listado)

---

## 8. Evidencia automatizada

```bash
npx tsc --noEmit   # exit 0
npx vitest run src/core/list/__tests__  # 16/16 passed
```

---

## 9. Pendiente post-Fase 5

| Ítem | Fase destino |
|------|--------------|
| Combobox producto paginado (`buscar`+`page`) | Mejora selector Kardex / formularios |
| URL sync query params persistentes | F8 |
| Chips, toast 422 sort | F8 |

---

## 10. Próximo paso

**Fase 6** — Maestros INV Tier B (Categorías, UM, Almacenes, Tipos movimiento).

---

*Auditoría Fase 5 — Kardex Tier C con gate producto_id obligatorio.*
