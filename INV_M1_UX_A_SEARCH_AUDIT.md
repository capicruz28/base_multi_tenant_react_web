# Auditoría búsqueda catálogos INV — Complemento INV-M1-UX-A

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — sin implementación, sin commit  
**Motivo:** Corrección de criterio UX — la ausencia de parámetro `buscar` en API **no implica** ausencia de buscador en UI.  
**Referencias:** [`docs/api/INV_API.json`](./docs/api/INV_API.json) · [`docs/api/ORG_API.json`](./docs/api/ORG_API.json) · [`ERP_FRONTEND_STANDARDS_V1.md`](./ERP_FRONTEND_STANDARDS_V1.md) · [`INV_M1_UX_A_AUDIT.md`](./INV_M1_UX_A_AUDIT.md)

---

## 1. Criterio corregido

| Concepto | Definición | Implica buscador en UI |
|----------|------------|------------------------|
| **Búsqueda server-side** | Parámetro `buscar` (u otro) en GET list; filtra en backend | **Sí** — enviar término al hook/query |
| **Búsqueda client-side** | Filtrar en memoria sobre el array ya cargado por `useQuery` | **Sí** — mismo `OrgToolbarSearch`; filtro local con `useMemo` |
| **Sin búsqueda** | Ni server ni client | Solo si el catálogo es trivialmente pequeño **y** se decide explícitamente no homogeneizar (no aplica aquí) |

**Principio INV-M1-UX-A:** homogeneizar toolbar E-UX.1 en los 5 catálogos. ORG maestros muestran siempre `[OrgToolbarSearch] [Ver inactivos] … [Crear]`. INV debe replicar **el mismo layout visual**, adaptando solo la capa de datos (server vs client).

---

## 2. Fuente de verdad API (`INV_API.json`)

Verificado en contrato OpenAPI del repo (GET list por entidad):

| Entidad | Ruta | Parámetros query list | `buscar` server-side |
|---------|------|----------------------|----------------------|
| Categorías | `GET /api/v1/inv/categorias` | `solo_activos` | **No** |
| Unidades de medida | `GET /api/v1/inv/unidades-medida` | `solo_activos` | **No** |
| Tipos de movimiento | `GET /api/v1/inv/tipos-movimiento` | `solo_activos` | **No** |
| Almacenes | `GET /api/v1/inv/almacenes` | `sucursal_id`, `solo_activos` | **No** |
| Productos | `GET /api/v1/inv/productos` | `categoria_id`, `tipo_producto`, `solo_activos`, **`buscar`** | **Sí** — *"Búsqueda por nombre, SKU o código de barras"* |

**Contraste ORG:** todos los maestros company-scoped en `ORG_API.json` (departamentos, centros de costo, cargos, sucursales, etc.) exponen `buscar`. INV solo lo expone en **productos**.

---

## 3. Tabla comparativa por pantalla

| Pantalla | Server-side (`INV_API`) | Client-side hoy | `OrgToolbarSearch` hoy | Volumen típico esperado | Campos filtrables recomendados (client) | Recomendación UX final |
|----------|-------------------------|-----------------|------------------------|-------------------------|----------------------------------------|------------------------|
| **Categorías** | ❌ | ❌ | ❌ | **Pequeño–medio** — 5–150 registros/empresa; árboles de retail hasta ~500 | `codigo`, `nombre`, `descripcion`, `metodo_costeo_defecto` | **Mostrar buscador** — client-side sobre lista cargada |
| **Unidades de medida** | ❌ | ❌ | ❌ | **Muy pequeño** — 5–30; catálogo estándar ~10–20 | `codigo`, `nombre`, `simbolo`, `tipo_unidad` | **Mostrar buscador** — client-side; utilidad alta en empresas con muchas UM |
| **Tipos de movimiento** | ❌ | ❌ | ❌ | **Pequeño** — 8–50; plantillas + custom | `codigo`, `nombre`, `clase_movimiento`, cuentas contables visibles en tabla | **Mostrar buscador** — client-side |
| **Almacenes** | ❌ (`sucursal_id` solo) | ❌ | ❌ | **Pequeño** — 3–40/empresa | `codigo`, `nombre`, `tipo_almacen`, nombre sucursal (resuelto en página) | **Mostrar buscador** — client-side |
| **Productos** | ✅ `buscar` | N/A (usa server) | ✅ | **Grande** — 100–10 000+ | Backend: nombre, SKU, código barras (contrato) | **Mantener buscador** — server-side vía hook existente |

### 3.1 Estado post-implementación M1 (brecha restante)

Tras el sprint UX reciente:

| Pantalla | Toolbar ORG | Empty IAM | Buscador |
|----------|:-----------:|:---------:|:--------:|
| Categorías | ✅ | ✅ | ❌ **falta** |
| Unidades | ✅ | ✅ | ❌ **falta** |
| Tipos mov. | ✅ | ✅ | ❌ **falta** |
| Almacenes | ✅ | ✅ | ❌ **falta** |
| Productos | ✅ | ✅ | ✅ server-side |

**Brecha de cierre:** 4 pantallas sin `OrgToolbarSearch` → inconsistencia visual vs ORG E-UX.1 y vs Productos.

---

## 4. Recomendación final

### 4.1 Veredicto

**Sí — las 5 pantallas catálogo deben mostrar `OrgToolbarSearch`** en la misma posición que ORG (`DepartamentosPage`, `CentrosCostoPage`):

```
[ OrgToolbarSearch ] [ Ver inactivos ]              [ Crear … ]
```

- **Productos:** sin cambio de estrategia (server-side); opcional debounce 500ms en fase posterior.
- **Categorías, Unidades, Tipos, Almacenes:** añadir **búsqueda client-side** sobre `list` del hook, **sin modificar** servicios, hooks ni contratos API.

### 4.2 Patrón client-side (normativo para M1 cierre)

| Aspecto | Estándar |
|---------|----------|
| UI | `OrgToolbarSearch` + `IamSearchInput` (ancho acotado, sin `flex-1` en contenedor) |
| Estado | `useState('')` → `buscar` local; reset en `useInvScopeEmpresaReset` |
| Datos | `const rawList = query.data ?? []` → `const list = useMemo(() => filter..., [rawList, buscar])` |
| Empty | `hasSearch = buscar.trim().length > 0` → variantes `IamTableEmptyState` (sin CTA Crear si hay búsqueda activa) |
| Query key | **No** incluir `buscar` (no hay round-trip API) |
| Normalización | `trim().toLowerCase()`; match parcial en campos visibles de tabla |
| Debounce | **Opcional** en client-side (respuesta instantánea aceptable en volúmenes pequeños) |

### 4.3 Qué NO hacer

- No omitir buscador “porque la API no tiene `buscar`”.
- No ampliar `inv.service.ts` ni hooks con parámetro `buscar` inventado.
- No usar `flex-1` / ancho completo en el wrapper de búsqueda.
- No mover el banner UM de Productos dentro de la toolbar.
- No tocar multiempresa, modales, B.1.1 ni contratos.

### 4.4 Ticket backend (fuera de M1-UX-A)

Si en el futuro categorías/almacenes superan ~500 registros por empresa, valorar `buscar` en API (paridad ORG). Hasta entonces, client-side es **adecuado y alineado** al volumen esperado.

---

## 5. Impacto técnico

| Área | Impacto | Notas |
|------|---------|-------|
| **API / servicios** | Ninguno | Sin cambios en `inv.service.ts` |
| **Hooks React Query** | Ninguno | Keys y `queryFn` intactos |
| **Multiempresa** | Bajo | Añadir `setBuscar('')` en `resetPageFilters` existente |
| **Páginas listado** | **Medio** — 4 archivos | Lógica `useMemo` + toolbar + empty `hasSearch` |
| **Util compartido** | Opcional | `filterInvCatalogByTerm(rows, term, fields)` en `src/features/inv/utils/` — reduce duplicación; no obligatorio para cierre |
| **Productos** | Ninguno / mínimo | Ya cumple; solo verificar empty `hasSearch` (hecho) |
| **Performance** | Despreciable | Listas <500 filas; filtro O(n) en cliente |
| **Tests** | Ninguno requerido M1 | Manual QA suficiente |

**Estimación:** ~30–50 líneas por pantalla (4 pantallas) = cambio acotado, riesgo bajo.

---

## 6. Archivos afectados

### 6.1 Modificar (cierre M1-UX-A búsqueda)

| Archivo | Cambios previstos |
|---------|-------------------|
| `src/features/inv/pages/CategoriasPage.tsx` | `OrgToolbarSearch`, `buscar`, `useMemo` filter, `hasSearch` en empty, reset filtros |
| `src/features/inv/pages/UnidadesMedidaPage.tsx` | Idem |
| `src/features/inv/pages/TiposMovimientoPage.tsx` | Idem |
| `src/features/inv/pages/AlmacenesPage.tsx` | Idem + incluir nombre sucursal en filtro |

### 6.2 Sin modificar

| Archivo / área | Motivo |
|----------------|--------|
| `src/features/inv/hooks/*.hooks.ts` | Sin contrato `buscar` en API |
| `src/features/inv/services/inv.service.ts` | Sin cambio contrato |
| `src/features/inv/pages/ProductosPage.tsx` | Búsqueda server-side ya implementada |
| Modales / formularios | Fuera alcance |
| `docs/api/INV_API.json` | Fuente de verdad; no editar en sprint UX |

### 6.3 Opcional (recomendado, no bloqueante)

| Archivo | Propósito |
|---------|-----------|
| `src/features/inv/utils/inv-catalog-client-search.ts` | Helper reutilizable `matchCatalogTerm(row, term, keys)` |
| `INV_M1_UX_A_AUDIT.md` §4 | Actualizar criterio “sin API = omitir buscador” → obsoleto |

---

## 7. Checklist QA (post-corrección búsqueda)

Aplicar a **Categorías, Unidades, Tipos, Almacenes** (client-side) y revalidar **Productos** (server-side).

### Toolbar y layout

- [ ] `OrgToolbarSearch` visible a la izquierda de “Ver inactivos”
- [ ] Ancho acotado (`w-52` / `max-w-md`); no ocupa fila completa
- [ ] Una sola fila de toolbar (+ banner UM solo en Productos, fuera)
- [ ] CTA Crear permanece a la derecha

### Búsqueda client-side (4 pantallas)

- [ ] Escribir término filtra filas sin nueva petición HTTP (Network tab)
- [ ] Match en código y nombre (y campos acordados por pantalla)
- [ ] Limpiar input restaura lista completa
- [ ] Cambio de empresa resetea término de búsqueda

### Empty state

- [ ] Lista vacía sin búsqueda → mensaje activos/registrados + CTA Crear (si permiso)
- [ ] Búsqueda sin resultados → título “No se encontraron … que coincidan con la búsqueda” + description; **sin** CTA Crear
- [ ] `colSpan` consistente con `TABLE_COLSPAN`

### Productos (regresión)

- [ ] Búsqueda sigue enviando `buscar` al API
- [ ] Banner UM, tooltip Crear, enlace Unidades intactos
- [ ] Empty con variante `hasSearch` correcta

### Multiempresa (regresión M0-b)

- [ ] Sin selector empresa local
- [ ] Scope change invalida y resetea filtros

---

## 8. Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Todas las pantallas deben tener `OrgToolbarSearch`? | **Sí**, por consistencia E-UX.1 |
| ¿Sin `buscar` en API implica sin buscador? | **No** — usar client-side |
| ¿Cuántas pantallas requieren trabajo adicional? | **4** (Categorías, UM, Tipos, Almacenes) |
| ¿Productos cambia? | **No** (ya server-side) |
| ¿Impacto en contratos? | **Ninguno** |

**Acción para cerrar INV-M1-UX-A:** implementar búsqueda client-side + `OrgToolbarSearch` en las 4 pantallas restantes, manteniendo el resto del trabajo M1 ya entregado.

---

*Auditoría generada sin código, sin repair, sin commit.*
