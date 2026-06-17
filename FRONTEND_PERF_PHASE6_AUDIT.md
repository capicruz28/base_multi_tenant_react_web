# FRONTEND_PERF — Auditoría post Fase 6 (Maestros INV Tier B)

**Fecha:** 13 junio 2026  
**Alcance:** `CategoriasPage`, `UnidadesMedidaPage`, `AlmacenesPage`, `TiposMovimientoPage`  
**Patrón referencia:** `ProductosPage` (F2)  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md` §4 (whitelist sort Tier B)

---

## 1. Veredicto

| Criterio | Estado |
|----------|--------|
| `use*ErpList` + `useErpListQuery` en 4/4 pantallas | ✅ |
| Paginación Tier B `page=1&limit=50` (`forcePagination`) | ✅ |
| Sort server whitelist por recurso | ✅ |
| Búsqueda server `buscar` + debounce 350 ms | ✅ |
| Reset `page=1` al cambiar búsqueda o `solo_activos` | ✅ |
| Sin `matchesInvCatalogSearch` en listados | ✅ |
| Sin full-load en tabla (legacy hooks preservados para FK/selects) | ✅ |
| Modales CRUD, RBAC, workflows | ✅ Sin cambios |
| URL sync / chips / toast 422 sort | ✅ Fuera de alcance (F8) |

**Fase 6: LISTA PARA VALIDACIÓN MANUAL.**

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/inv/hooks/categorias.hooks.ts` | `CATEGORIAS_LIST_CONFIG`, `useCategoriasErpList` |
| `src/features/inv/hooks/unidades-medida.hooks.ts` | `UNIDADES_MEDIDA_LIST_CONFIG`, `useUnidadesMedidaErpList` |
| `src/features/inv/hooks/almacenes.hooks.ts` | `ALMACENES_LIST_CONFIG`, `useAlmacenesErpList` |
| `src/features/inv/hooks/tipos-movimiento.hooks.ts` | `TIPOS_MOVIMIENTO_LIST_CONFIG`, `useTiposMovimientoErpList` |
| `src/features/inv/pages/CategoriasPage.tsx` | Listado paginado, sort, debounce; `useCategorias` solo para padre en modales |
| `src/features/inv/pages/UnidadesMedidaPage.tsx` | Listado paginado, sort, debounce |
| `src/features/inv/pages/AlmacenesPage.tsx` | Listado paginado, sort, debounce |
| `src/features/inv/pages/TiposMovimientoPage.tsx` | Listado paginado, sort, debounce |
| `src/features/inv/utils/inv-catalog-client-search.ts` | Comentario DEPRECATED (sin consumidores) |

**Sin tocar:** `ProductosPage`, Kardex, IF, Stock, Alertas, `ParametrosPage`.

---

## 3. Configuración Tier B por recurso

| Recurso | Endpoint | `sortableColumns` |
|---------|----------|-------------------|
| Categorías | `GET /inv/categorias` | `codigo`, `nombre`, `nivel`, `fecha_creacion` |
| Unidades medida | `GET /inv/unidades-medida` | `codigo`, `nombre`, `tipo_unidad`, `fecha_creacion` |
| Almacenes | `GET /inv/almacenes` | `codigo`, `nombre`, `tipo_almacen`, `fecha_creacion` |
| Tipos movimiento | `GET /inv/tipos-movimiento` | `codigo`, `nombre`, `clase_movimiento`, `fecha_creacion` |

Todas comparten:

```typescript
{
  tier: 'B',
  defaultLimit: 50,
  forcePagination: true,
}
```

---

## 4. Eliminación de filtrado client-side

| Pantalla | Antes | Después |
|----------|-------|---------|
| CategoriasPage | `rawList` + `matchesInvCatalogSearch` + `useMemo` filter | `categoriasList.items` (server) |
| UnidadesMedidaPage | idem | `unidadesList.items` |
| AlmacenesPage | idem (+ búsqueda nombre sucursal client) | `almacenesList.items`; sucursal solo display |
| TiposMovimientoPage | idem | `tiposList.items` |

`matchesInvCatalogSearch`: **0 importaciones** en páginas; util marcada DEPRECATED.

---

## 5. Hooks legacy preservados

| Hook legacy | Consumidores listado F6 | Otros consumidores |
|-------------|-------------------------|-------------------|
| `useCategorias` | Solo padre en modales (`enabled: createOpen \|\| editOpen`) | `ProductosPage`, formularios |
| `useUnidadesMedida` | — | `ProductosPage`, formularios |
| `useAlmacenes` | — | Movimientos, IF, Stock, formularios |
| `useTiposMovimiento` | — | Movimientos, IF, Kardex, formularios |

---

## 6. Notas de implementación

### CategoriasPage — columna Padre

`categoriasById` se construye desde la **página actual** del listado. Si el padre no está en la misma página → muestra «—» (aceptable; mismo trade-off que enriquecimiento FK paginado).

### AlmacenesPage — sucursal

`sucursalService.list` se mantiene para modales y columna Sucursal (display). La búsqueda por nombre de sucursal ya no es client-side; depende del contrato server `buscar`.

---

## 7. Verificación automática

```bash
npx tsc --noEmit          # ✅ sin errores
npx vitest run src/core/list/__tests__   # ✅ 16/16
```

---

## 8. Evidencia manual (checklist)

Ejecutar en cada una de las 4 rutas con DevTools → Network filtrado por el endpoint del recurso.

### 8.1 Búsqueda server-side

| Paso | Esperado |
|------|----------|
| Abrir listado | `GET …?page=1&limit=50&solo_activos=true&empresa_id=…` |
| Escribir en búsqueda (esperar ~350 ms) | Request con `buscar=<término>`; **sin** filtrar filas en memoria |
| Limpiar búsqueda | `buscar` ausente; `page=1` |

### 8.2 Paginación

| Paso | Esperado |
|------|----------|
| Dataset > 50 registros | `ErpPagination` visible; `total_paginas` > 1 |
| Ir a página 2 | `page=2&limit=50` |
| Cambiar límite (si UI lo expone) | Nuevo request con `limit` actualizado y `page=1` |

### 8.3 Sort server-side

| Paso | Esperado |
|------|----------|
| Click header sortable (ej. Código) | `sort_by=codigo&sort_dir=asc` |
| Segundo click | `sort_dir=desc` |
| Columna no whitelist (ej. Padre, Símbolo) | Sin control sort |

### 8.4 Ausencia filtrado client-side

| Paso | Esperado |
|------|----------|
| Buscar en código de registro en página 2+ | Resultados vienen del API; no depender de filas cargadas previamente |
| Código fuente | Sin `matchesInvCatalogSearch`, sin `.filter(` sobre listado en página |

### 8.5 Ausencia full-load en listado

| Paso | Esperado |
|------|----------|
| Abrir tabla | Request con `page` y `limit`; **no** `limit` omitido ni respuesta masiva sin paginación |
| Ver inactivos | `solo_activos=false`; sigue paginado |

### 8.6 Reset filtros

| Paso | Esperado |
|------|----------|
| Página 2 + marcar «Ver inactivos» | `page=1` en nuevo request |
| Cambiar empresa en header | Lista resetea (hook `useInvScopeEmpresaReset`) |

### 8.7 RBAC / modales (regresión)

| Paso | Esperado |
|------|----------|
| Crear / Editar / Desactivar / Reactivar | Flujo idéntico a pre-F6 |
| Categorías — selector padre en modal | Carga `useCategorias` al abrir modal |

---

## 9. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| Padre categoría «—» si fuera de página | Aceptado F6; enriquecimiento batch futuro |
| `buscar` server no incluye campos que antes filtraba client (símbolo UM, sucursal almacén) | Validar contra OpenAPI; ajustar placeholder UX si aplica |
| 422 `INVALID_SORT_COLUMN` | Fase 8 |

---

## 10. Siguiente fase

**Fase 7:** `CentrosCostoPage` + `ParametrosPage` (ORG Tier B; spike API Parametros).
