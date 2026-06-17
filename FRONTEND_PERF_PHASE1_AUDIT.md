# FRONTEND_PERF — Auditoría post Fase 1 (PERF-02 Debounce)

**Fecha:** 15 junio 2026  
**Alcance:** Debounce 350 ms en 7 pantallas — **sin paginación, sort ni URL sync**  
**Contrato:** `FRONTEND_LISTADOS_CONTRACT_V1.md` (PERF-02)  
**Infra:** Fase 0 (`useDebouncedSearch`, `ERP_LIST_SEARCH_DEBOUNCE_MS=350`)

---

## 1. Veredicto

| Criterio | Estado |
|----------|--------|
| PERF-02 debounce 350 ms | ✅ |
| 7 pantallas migradas | ✅ |
| `useErpListQuery` en pantallas | ✅ **No usado** (restricción) |
| Paginación / sort / URL sync | ✅ **No implementado** |
| Contratos API / respuesta | ✅ Sin cambios |
| Hooks existentes intactos | ✅ Solo cambió origen de `buscar` |
| CategoriasPage / MovimientosPage | ✅ Sin tocar |
| ParametrosPage fallback hybrid | ✅ Sin tocar |

**Fase 1: APROBADA** — lista para **Fase 2** (Productos piloto page + buscar + sort).

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/org/pages/EmpresaPage.tsx` | `useDebouncedSearch` |
| `src/features/org/pages/SucursalesPage.tsx` | `useDebouncedSearch` + `search.clear()` en reset empresa |
| `src/features/org/pages/DepartamentosPage.tsx` | Idem |
| `src/features/org/pages/CargosPage.tsx` | Idem |
| `src/features/org/pages/CentrosCostoPage.tsx` | Idem |
| `src/features/org/pages/ParametrosPage.tsx` | Idem (tabs hybrid intactos) |
| `src/features/inv/pages/ProductosPage.tsx` | `useDebouncedSearch` + `search.clear()` en reset empresa |

**Sin cambios:** services, hooks React Query, `OrgToolbarSearch`, workflows, RBAC, layouts.

---

## 3. Patrón aplicado

```typescript
import { useDebouncedSearch } from '@/core/list';

const search = useDebouncedSearch();

// Query — valor debounced (API / queryKey)
useXxx({ buscar: search.debouncedValue, ... });

// Input — valor inmediato (UX)
<OrgToolbarSearch
  value={search.inputValue}
  onChange={search.setInputValue}
  ...
/>

// Empty state — alineado al filtro efectivo en API
const hasSearch = search.hasSearch;

// Reset empresa / scope
search.clear();
```

**ProductosPage** conserva `buscar: search.debouncedValue || undefined` (mismo contrato que antes con `searchTerm.trim() || undefined`).

---

## 4. Tabla comparativa antes / después

| Pantalla | Antes (F0) | Después (F1) | Refetch por keystroke |
|----------|------------|--------------|------------------------|
| EmpresaPage | `buscar` en `useState` → queryKey en cada tecla | `inputValue` UI + `debouncedValue` en `useEmpresas` | ❌ Eliminado |
| SucursalesPage | Idem → `useSucursales` | Idem + `search.clear()` en reset empresa | ❌ Eliminado |
| DepartamentosPage | Idem → `useDepartamentos` | Idem | ❌ Eliminado |
| CargosPage | Idem → `useCargos` | Idem | ❌ Eliminado |
| CentrosCostoPage | Idem → `useCentrosCosto` | Idem | ❌ Eliminado |
| ParametrosPage | Idem → `useParametrosForTab` (3 tabs) | Idem; hybrid/fallback sin cambios | ❌ Eliminado |
| ProductosPage | `searchTerm` → `useProductos` por tecla | `debouncedValue` → `useProductos` | ❌ Eliminado |

### Mecanismo

| Aspecto | Antes | Después |
|---------|-------|---------|
| Estado input | `useState('')` directo en queryKey | `inputValue` (inmediato) separado de `debouncedValue` |
| Delay API | 0 ms (1 request por tecla) | **350 ms** (`ERP_LIST_SEARCH_DEBOUNCE_MS`) |
| QueryKey `buscar` | Cambia en cada `onChange` | Cambia solo cuando estabiliza el texto debounced |
| `hasSearch` (empty state) | Valor inmediato del input | Valor debounced (coherente con datos mostrados) |
| Componente búsqueda | `OrgToolbarSearch` | **Sin cambio** (no `ErpSearchInput` aún) |

### Ejemplo cuantitativo

Usuario escribe `"producto"` (8 teclas):

| Métrica | Antes | Después |
|---------|-------|---------|
| Cambios de queryKey | 8 | 1 (tras 350 ms post última tecla) |
| Requests GET listado | 8 | 1 |

---

## 5. Restricciones verificadas

| Restricción | Cumplimiento |
|-------------|--------------|
| No paginación | ✅ Ningún `page`/`limit` añadido |
| No sorting | ✅ Sin `sort_by`/`ErpSortableHeader` en páginas |
| No URL sync | ✅ Sin `useSearchParams` para `buscar` |
| No `useErpListQuery` | ✅ Hooks legacy (`useEmpresas`, `useProductos`, etc.) |
| No `ErpDataTable` | ✅ Tablas actuales intactas |
| No CategoriasPage / MovimientosPage | ✅ Fuera de alcance |
| ParametrosPage hybrid | ✅ Tabs, fallback y `useParametrosForTab` sin alterar lógica |

---

## 6. Evidencia build y tests

```bash
# TypeScript (proyecto)
npx tsc --noEmit
# exit 0

# Tests infra Fase 0 (sin regresión)
npx vitest run src/core/list/__tests__
# Test Files  2 passed (2)
# Tests       15 passed (15)

# Build producción (baseline repo — errores preexistentes fuera de alcance F1)
npm run build
# Falla por TS en otros módulos (bdg, hcm, pur, layout, etc.)
# Ningún error en los 7 archivos Fase 1
```

**Archivos Fase 1 en `tsc --noEmit`:** sin errores.

---

## 7. Riesgos / notas UX

| Nota | Impacto |
|------|---------|
| Retardo 350 ms antes del filtro API | Esperado PERF-02; input sigue siendo inmediato |
| Lista visible durante escritura | Muestra resultado del último `debouncedValue` hasta nuevo fetch |
| `search.clear()` en reset empresa | Limpia input y dispara refetch sin `buscar` tras debounce |

---

## 8. Próximo paso — Fase 2

**ProductosPage** como piloto completo:

- `useErpListQuery` + `invFetchList`
- `page=1&limit=50`
- Sort server whitelist
- `ErpPagination` + `ErpListTableShell`

---

*Auditoría Fase 1 — PERF-02 debounce aplicado; listo para piloto paginado en Productos.*
