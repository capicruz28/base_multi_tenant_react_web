# FRONTEND_PERF — Auditoría post Fase 3 (MovimientosPage Tier C)

**Fecha:** 15 junio 2026  
**Alcance:** `MovimientosPage` únicamente — validación oficial **Tier C**  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md`  
**Referencia piloto:** `ProductosPage` (Fase 2, Tier B)

---

## 1. Veredicto

| Criterio | Estado |
|----------|--------|
| PERF-01 paginación server Tier C | ✅ |
| PERF-04 sort server whitelist | ✅ |
| Default sort `fecha_movimiento desc` | ✅ |
| Filtros dominio preservados | ✅ |
| Reset `page=1` al cambiar filtros | ✅ |
| Sin full-load histórico | ✅ |
| Workflow B-L (detalle, autorizar, procesar, anular, estornar) | ✅ Sin cambios |
| ERP-BL-ACT-01 (solo Eye en fila) | ✅ Sin cambios |
| Otras pantallas INV/ORG | ✅ Sin migrar |

**Fase 3: LISTA PARA VALIDACIÓN MANUAL** en entorno con API.

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/inv/hooks/movimientos.hooks.ts` | `MOVIMIENTOS_LIST_CONFIG`, `useMovimientosErpList` |
| `src/features/inv/pages/MovimientosPage.tsx` | Hook paginado, sort headers, `ErpPagination` |
| `src/core/list/useErpListQuery.ts` | `resetSortState()` para restaurar `defaultSort` en reset empresa |

**Sin cambios:** `useMovimientos` legacy (disponible), Kardex, IF, Stock, maestros, ParametrosPage.

---

## 3. Configuración Tier C

```typescript
MOVIMIENTOS_LIST_CONFIG = {
  tier: 'C',
  forcePagination: true,
  defaultLimit: 50,
  defaultSort: { sort_by: 'fecha_movimiento', sort_dir: 'desc' },
  sortableColumns: [
    'numero_movimiento',
    'fecha_movimiento',
    'fecha_contable',
    'estado',
    'fecha_creacion',
  ],
}
```

### Fetcher

- `invFetchList('/movimientos', buildInvListQuery(..., { includeSoloActivosDefault: false }))`
- `normalizeListResponse` en `useErpListQuery` → envelope UI único

---

## 4. PERF-01 — MovimientosPage

| ID | Requisito | Implementación | Estado |
|----|-----------|----------------|--------|
| 1.1 | Tier C: `page` obligatorio | `tier: 'C'` + `forcePagination` | ✅ |
| 1.2 | Normalizar `list[]` / envelope | `normalizeListResponse` | ✅ |
| 1.3 | `ErpPagination` | Footer tabla | ✅ |
| 1.4 | Tier C mount `page=1` | `initialPage=1`, `limit=50` | ✅ |
| 1.5 | Sin `has_next` backend | `derivePaginationMeta` | ✅ |

### Request inicial esperado

```
GET /api/v1/inv/movimientos?page=1&limit=50&sort_by=fecha_movimiento&sort_dir=desc
```

**Ausencia de full-load:** sin `page` ya no se emite request legacy; siempre incluye `page` + `limit`.

---

## 5. PERF-04 — MovimientosPage

| ID | Requisito | Implementación | Estado |
|----|-----------|----------------|--------|
| 4.1 | Whitelist §4 movimientos | `ErpSortableHeader` en Número, Fecha, Estado | ✅ |
| 4.2 | `sort_by` + `sort_dir`; reset `page=1` al sort | `toggleSort` | ✅ |
| 4.5 | Default `fecha_movimiento desc` | `defaultSort` en config | ✅ |

### Cabeceras sortables en UI

| Columna UI | `sort_by` API |
|------------|---------------|
| Número | `numero_movimiento` |
| Fecha | `fecha_movimiento` |
| Estado | `estado` |

Tipo, Origen, Destino, Cantidad, Costo → no sortables (no en whitelist).

---

## 6. Filtros dominio + reset página

| Filtro | Parámetro API | Reset `page=1` |
|--------|---------------|----------------|
| Almacén | `almacen_id` | ✅ `useEffect` en hook |
| Tipo movimiento | `tipo_movimiento_id` | ✅ |
| Estado | `estado` | ✅ |
| Fecha desde | `fecha_desde` | ✅ |
| Fecha hasta | `fecha_hasta` | ✅ |

### Ejemplo filtros + paginación

```
GET /api/v1/inv/movimientos?almacen_id={uuid}&estado=procesado&fecha_desde=2026-01-01&page=1&limit=50&sort_by=fecha_movimiento&sort_dir=desc
```

Al cambiar cualquier filtro → `page` vuelve a **1** (sort se mantiene salvo reset empresa).

### Reset empresa (`useInvScopeEmpresaReset`)

- Limpia filtros UI
- `setPage(1)` + `resetSortState()` → restaura `fecha_movimiento desc`

---

## 7. Workflow B-L — verificación explícita

| Elemento | Estado post Fase 3 |
|----------|-------------------|
| Click fila → detalle | ❌ No existe (correcto ERP-BL-ACT-01) |
| Columna Acciones solo `Eye` | ✅ |
| Modal detalle + workflow | ✅ Sin cambios |
| Confirm anular/estornar dirty guard | ✅ Sin cambios |
| Radix Dialog + ConfirmDialog stacking | ✅ Sin cambios |
| Link «Nuevo movimiento» | ✅ Sin cambios |

---

## 8. Evidencia manual — checklist QA

### 8.1 Paginación

- [ ] Request mount: `page=1&limit=50`
- [ ] «Siguiente» → `page=2`; registros distintos
- [ ] Footer «Mostrando X a Y de Z» coherente
- [ ] **No** existe request sin `page` (full-load eliminado)

### 8.2 Filtros + paginación

- [ ] Ir a página 2
- [ ] Cambiar filtro estado → request con `page=1` + filtro nuevo
- [ ] Combinar almacén + fechas → params correctos en Network

### 8.3 Sort server-side

- [ ] Mount: `sort_by=fecha_movimiento&sort_dir=desc`
- [ ] Clic **Número** → `sort_by=numero_movimiento&sort_dir=asc&page=1`
- [ ] Orden no se aplica en cliente (verificar Network)

### 8.4 Reset page al filtrar

- [ ] Página 3 + cambio filtro → siempre `page=1` en siguiente request

### 8.5 Regresiones workflow

- [ ] Ver detalle, autorizar, procesar, anular, estornar
- [ ] Editar documento (link) si aplica

---

## 9. Evidencia automatizada

```bash
npx tsc --noEmit
# exit 0 (archivos Fase 3)

npx vitest run src/core/list/__tests__
# 16/16 passed
```

---

## 10. Comparativa antes / después

| Aspecto | Antes (F0–F2) | Después (F3) |
|---------|---------------|--------------|
| Hook listado | `useMovimientos` → `movimientoService.list()` unwrap | `useMovimientosErpList` → `invFetchList` + normalize |
| Request | Sin `page` → full dataset | Siempre `page` + `limit=50` |
| Sort | Ninguno | Server default + headers whitelist |
| Paginador UI | No | `ErpPagination` |
| Filtros | Sí (sin reset page) | Sí + reset `page=1` |
| Workflow | B-L completo | **Idéntico** |

---

## 11. Fuera de alcance (intencional)

| Ítem | Fase |
|------|------|
| URL sync, chips, toast 422 sort | F8 |
| Kardex, IF, Stock, Alertas | F4–F5 |
| Maestros INV, ParametrosPage | F6–F7 |
| Debounce búsqueda movimientos | N/A (sin `buscar` en contrato movimientos) |

---

## 12. Próximo paso

**Fase 4 — Kardex** (Tier C, gate `producto_id` obligatorio).

---

*Auditoría Fase 3 — MovimientosPage validación Tier C oficial.*
