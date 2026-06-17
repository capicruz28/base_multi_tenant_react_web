# FRONTEND_PERF — Auditoría post Fase 7 (ORG Tier B)

**Fecha:** 13 junio 2026  
**Alcance:** Parte A `CentrosCostoPage` · Parte B spike `ParametrosPage` (sin migración)  
**Patrón referencia:** `ProductosPage` (F2), `CategoriasPage` (F6)  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md` §4 ORG centros-costo

---

## 1. Veredicto

| Parte | Criterio | Estado |
|-------|----------|--------|
| **A** | `useCentrosCostoErpList` + `useErpListQuery` | ✅ |
| **A** | Paginación Tier B `page=1&limit=50` | ✅ |
| **A** | Sort server whitelist | ✅ |
| **A** | Búsqueda server `buscar` + debounce | ✅ |
| **A** | Reset `page=1` al cambiar búsqueda / inactivos | ✅ |
| **A** | Sin full-load en tabla | ✅ |
| **A** | Modales CRUD, RBAC | ✅ Sin cambios |
| **B** | Spike `GET /org/parametros` documentado | ✅ |
| **B** | Migración `ParametrosPage` (`useParametrosErpList`) | ✅ |
| **B** | Fallback híbrido legacy conservado | ✅ Marcado candidato limpieza |

**Fase 7: LISTA PARA VALIDACIÓN MANUAL (CentrosCosto + Parametros).**

---

## 2. Archivos modificados

### Parte A — CentrosCosto

| Archivo | Cambio |
|---------|--------|
| `src/features/org/hooks/centro-costo.hooks.ts` | `CENTROS_COSTO_LIST_CONFIG`, `useCentrosCostoErpList` |
| `src/features/org/pages/CentrosCostoPage.tsx` | Listado paginado, sort, `ErpPagination` |

### Parte B — Parametros

| Archivo | Cambio |
|---------|--------|
| `src/features/org/services/org.service.ts` | `buildOrgParametroListQuery` exportado |
| `src/features/org/hooks/parametro.hooks.ts` | `PARAMETROS_LIST_CONFIG`, `useParametrosErpList`; `useParametrosForTab` → ErpList |
| `src/features/org/hooks/parametro-query-keys.ts` | `hybridTabToParametroVista` (`effective` → `efectivo`) |
| `src/features/org/pages/ParametrosPage.tsx` | Paginación, sort, debounce; tabs sin cambio UX |
| `src/features/org/utils/org-parametro-resolve.ts` | Comentarios candidato limpieza (sin eliminar código) |

**Legacy conservado (no eliminado):** `fetchParametrosEfectivos`, `resolveParametrosEfectivos`, `filterParametrosByVista`, hooks `@deprecated` full-load.

---

## 3. Configuración Tier B — centros de costo

```typescript
CENTROS_COSTO_LIST_CONFIG = {
  tier: 'B',
  forcePagination: true,
  defaultLimit: 50,
  sortableColumns: ['codigo', 'nombre', 'tipo_centro_costo', 'nivel', 'fecha_creacion'],
}
```

Endpoint: `GET /api/v1/org/centros-costo` (ámbito JWT; sin `empresa_id` en query).

---

## 4. Hooks legacy preservados

| Hook | Uso post-F7A |
|------|----------------|
| `useCentrosCosto` | Selector padre en modales (`enabled: createOpen \|\| editOpen`); `SucursalesPage` |
| `useCentrosCostoErpList` | Tabla `CentrosCostoPage` |

---

## 5. Parte B — ParametrosPage migrada

Documento spike: **`FRONTEND_PARAMETROS_PAGINATION_SPIKE.md`**

Implementación conservadora:

- `useParametrosErpList` → `orgFetchList` + `normalizeListResponse` (vía `useErpListQuery`)
- Tabs `effective` / `global` / `override` → `vista=efectivo|global|override`
- `page=1&limit=50`, sort whitelist, búsqueda debounced
- Inferencia ligera `alcance_efectivo` en tab efectivo (sin dual-fetch)
- **No eliminado:** `resolveParametrosEfectivos`, `filterParametrosByVista`, hooks legacy `@deprecated`

---

## 6. Verificación automática

```bash
npx tsc --noEmit          # ✅
npx vitest run src/core/list/__tests__   # ✅ 16/16
```

---

## 7. Evidencia manual — CentrosCostoPage

Ruta: `/app/org/centros-costo` (o equivalente tenant).

### 7.1 Búsqueda server-side

| Paso | Esperado |
|------|----------|
| Carga inicial | `GET …/centros-costo?page=1&limit=50&solo_activos=true` |
| Búsqueda (~350 ms) | `buscar=<término>` |
| Limpiar | `page=1`, sin `buscar` |

### 7.2 Paginación

| Paso | Esperado |
|------|----------|
| >50 centros | `ErpPagination`; `total_paginas` > 1 |
| Página 2 | `page=2&limit=50` |

### 7.3 Sort

| Paso | Esperado |
|------|----------|
| Click Código / Nombre / Tipo | `sort_by` + `sort_dir` |
| Responsable | Sin sort (no whitelist) |

### 7.4 Sin full-load

| Paso | Esperado |
|------|----------|
| Network | Siempre `page` + `limit` en listado tabla |

### 7.5 Regresión modales / RBAC

| Paso | Esperado |
|------|----------|
| Crear / Editar / Desactivar / Reactivar | Igual pre-F7 |
| Selector padre | Carga al abrir modal (legacy full-list) |

### 7.6 Reset filtros

| Paso | Esperado |
|------|----------|
| Página 2 + «Ver inactivos» | `page=1`, `solo_activos=false` |
| Cambio empresa header | Reset vía `useOrgScopeEmpresaReset` |

---

## 8. Evidencia manual — ParametrosPage

Ruta: `/app/org/parametros`. Repetir por tab (Valores efectivos / Globales / Overrides).

| Paso | Esperado |
|------|----------|
| Carga tab efectivo | `GET …/parametros?vista=efectivo&page=1&limit=50` |
| Tab global | `vista=global&page=1&limit=50` |
| Tab override | `vista=override&page=1&limit=50` |
| Búsqueda | `buscar=` tras debounce |
| Sort Módulo/Código/Nombre | `sort_by` + `sort_dir` |
| Filtro módulo | `modulo_codigo=ORG` + `page=1` |
| Ver inactivos | `solo_activos=false` + `page=1` |
| Un solo request por tab | Sin dual-fetch global+override en Network |
| RBAC / modales / badges alcance | Sin regresión |

---

## 9. Siguiente paso

1. QA manual CentrosCosto (§7).
2. QA manual ParametrosPage (§8).
3. Tras validación: evaluar eliminación hooks/fallback legacy marcados `@deprecated`.
4. Fase 8: URL sync, chips, toast 422 sort.
