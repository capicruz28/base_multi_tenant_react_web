# CFG — Especificación de la página de listado

**Versión:** 1.0  
**Página:** `SecuenciasPage`  
**Ruta:** `/app/cfg/secuencias`  
**Plantilla:** A / A+ · **Tier listado:** B · **forcePagination:** sí

---

## 1. Toolbar completa

### Estructura (`ErpListToolbar`)

| Zona | Contenido |
|------|-----------|
| Izquierda | Filtros de dominio + búsqueda |
| Derecha | Botón **Limpiar filtros** (si hay filtros activos). **Sin** CTA Crear |

### Controles

| Control | Tipo UI | Query param | Default |
|---------|---------|-------------|---------|
| Buscar | `ErpSearchInput` / `OrgToolbarSearch` (debounce 350 ms) | `buscar` | vacío |
| Módulo | `<select>` nativo | `modulo_codigo` | Todos (omitir param) |
| Estado | Segmento o select: Activas / Inactivas / Todas | `es_activo` | Activas (`true`) |
| Ámbito | `<select>`: Todos / TENANT / EMPRESA / ALMACEN / PUNTO_VENTA | `scope_type` | Todos |
| Limpiar | Botón outline | — | limpia buscar + selects + page=1 |

### Filtros **no** incluidos en MVP toolbar

| Param API | Decisión |
|-----------|----------|
| `empresa_id` | **Omitido** en UI MVP (D8). Evita selector UUID / “Todas las empresas”. Scope se filtra con `scope_type`. Empresa se muestra en detalle si el API enriquece label. |
| `sequence_key` exacto | Cubierto por `buscar` (contrato busca en `sequence_key` / `prefijo`) |

### Reglas toolbar

- Al cambiar cualquier filtro o `buscar` debounced → `page = 1`.
- Sin selector de empresa de sesión (ME-02).
- Toolbar deshabilitada si `discardPending !== null` (B11-03).

---

## 2. Columnas del listado

| # | Columna | Campo | Sortable | Notas UI |
|---|---------|-------|:--------:|----------|
| 1 | Clave | `sequence_key` | Sí | Texto mono/soft; principal |
| 2 | Módulo | `modulo_codigo` | No* | Badge/texto (ORG, INV, …) |
| 3 | Ámbito | `scope_type` | Sí | Label humanizado |
| 4 | Prefijo | `prefijo` | Sí | Uppercase visual |
| 5 | Último N.º | `ultimo_numero` | Sí | Readonly numérico |
| 6 | Estado | `es_activo` + flags | Sí (`es_activo`) | Badges compuestos |
| 7 | Acciones | — | No | Botones según RB-ROW + RBAC |

\*Si `modulo_codigo` no está en whitelist sort del API, no sortable. Whitelist oficial:

`sequence_key`, `scope_type`, `prefijo`, `ultimo_numero`, `es_activo`, `fecha_creacion`, `fecha_actualizacion`.

**Columnas opcionales (si espacio desktop):** `fecha_actualizacion` (sortable).

**Nunca mostrar:** `secuencia_id`, `cliente_id`, ni otros UUID como texto de celda (E-ME4). IDs solo en keys React / llamadas API.

### Columna Estado — badges por fila

| Condición | Badge | Estilo |
|-----------|-------|--------|
| `es_activo === true` | Activa | `bg-success/10 text-success` |
| `es_activo === false` | Inactiva | `bg-error/10 text-error` o muted |
| `config_locked === true` | Bloqueada | `bg-warning/10 text-warning` |
| `policy_drift === true` | Drift | `bg-info/10 text-info` + tooltip explicativo corto |

Varios badges pueden coexistir (ej. Activa + Bloqueada + Drift).

---

## 3. Ordenamiento

| Atributo | Valor |
|----------|-------|
| UI | `ErpSortableHeader` en columnas whitelist |
| Params | `sort_by`, `sort_dir` (`asc`\|`desc`) |
| Default inicial | `sort_by=sequence_key`, `sort_dir=asc` |
| Ciclo click | none→asc→desc→none (patrón ErpList) o asc↔desc según stack INV |
| Error 422 `INVALID_SORT_COLUMN` | Limpiar sort + toast; no romper tabla |

---

## 4. Paginación

| Atributo | Valor |
|----------|-------|
| Modo | **Siempre** enviar `page` (nunca mezclar array legacy en esta UI) |
| Componente | `ErpPagination` |
| `limit` default | 50 |
| `limit` opciones | 25 / 50 / 100 |
| Metadatos | `total`, `pagina_actual`, `total_paginas`, `limit` |
| Normalize | `normalizeListResponse` |

---

## 5. Acciones de fila (RB-ROW-01)

### Rama `es_activo === true`

| Botón | Visible si | Acción |
|-------|------------|--------|
| Ver / Editar | `consultar` | Abre Edit Dialog (título/ícono Eye o Pencil según `actualizar`) |
| Preview | `consultar` y `supports_preview !== false` | Abre Preview Dialog |
| Desactivar | `actualizar` y `!config_locked` | Confirm danger → DELETE |

### Rama `es_activo === false`

| Botón | Visible si | Acción |
|-------|------------|--------|
| Ver | `consultar` | Abre Edit Dialog solo lectura (o lectura+reactivar) |
| Preview | `consultar` y `supports_preview !== false` | Preview Dialog |
| Reactivar | `actualizar` y `!config_locked` | Confirm info → POST reactivar |

### Locked

- Sin Desactivar / Reactivar / Guardar.
- Ver + Preview permitidos.

**Iconografía sugerida:** Eye/Pencil, Play/Scan (preview), Ban (desactivar), RotateCcw (reactivar). Tooltips accesibles; no UUID en `title`.

---

## 6. Loading states

| Momento | UI |
|---------|-----|
| Carga inicial / cambio page-sort-filtros | `ErpListTableShell` → `InvTableSkeleton` (colSpan = N columnas) |
| Refetch en background | Skeleton o overlay sutil; no presentar stale como definitivo sin indicador (`isFetching`) |
| Paginación | Mantener estructura tabla |

Estado lógico: `loading_list`.

---

## 7. Empty states

| Condición | Título | Descripción | CTA |
|-----------|--------|-------------|-----|
| Sin filas y sin filtros/búsqueda | “No hay secuencias” | “Aún no hay secuencias de código en este tenant.” | Ninguno (no crear) |
| Sin filas y `hasSearch` o filtros | “Sin resultados para la búsqueda” | “Prueba otros filtros o limpia la búsqueda.” | Limpiar filtros (opcional) |

Componente: `IamTableEmptyState` dentro de `<tbody>`.

---

## 8. Error states (listado)

| Caso | UI |
|------|-----|
| Error red / 5xx | Mensaje en shell de tabla + botón **Reintentar** |
| 403 | Mensaje permiso; sin datos |
| 422 sort | Toast + reset sort |

Usar `getErrorMessage`. No `console.error` solo.

---

## 9. Estados visuales de página (resumen)

| Estado | Comportamiento |
|--------|----------------|
| `idle` | Tabla interactiva |
| `loading_list` | Skeleton |
| Dialog open | Fila sigue visible detrás |
| `discardPending` | Toolbar/acciones disabled |
| Mutación fila | Deshabilitar acciones de esa secuencia |

---

## 10. Flujo GET List (contrato → UX)

| Paso | Detalle |
|------|---------|
| Trigger | Mount, filtros, page, sort, focus refetch |
| Request | `GET /api/v1/cfg/secuencias` + params activos |
| operationId | `list_cfg_codigo_secuencias` |
| Success | Render `items` |
| Refresh | Automático por React Query; tras mutaciones vía invalidación |

---

## 11. Consistencia V2 (listado)

| ID | Cumplimiento |
|----|--------------|
| TB-01 | Sin H1 body |
| TB-02 | Toolbar justify-between |
| SR-01/02/03 | Search debounce + empty hasSearch |
| SK-01/02 | Skeleton colSpan |
| ES-01 | Empty en tbody |
| LR-01, LR-N01 | ErpList + normalize |
| PR-01 | ErpPagination |
| RB-ROW-01…03 | Ternario activo/inactivo |
| ME-02 | Sin selector todas empresas |
| UX-01 | Desactivar/Reactivar |
