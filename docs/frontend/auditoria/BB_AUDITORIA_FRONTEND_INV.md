# AUDITORÍA FRONTEND — MÓDULO INV (Inventarios y Almacenes)

**Fecha:** 2026-05-13
**Módulo:** Inventarios y Almacenes
**Código:** INV
**Contrato API base:** `/api/v1/inv/`
**Archivos auditados:** 24 (types, service, hooks, pages, components, routes)

---

## DIAGNÓSTICO GENERAL

🔴 **PROBLEMAS** — El módulo tiene errores graves en múltiples dimensiones.

1. **Endpoints deprecated en service layer:** `stockService.create/update`, `movimientoDetalleService.create/update` e `inventarioFisicoDetalleService.create/update` llaman a 6 endpoints marcados como `deprecated: true` en el contrato.
2. **UUIDs en UI:** `producto_id` (UUID crudo) se muestra en la columna "Producto" de las líneas de `MovimientosPage` e `InventarioFisicoPage`. `KardexPage` tiene un input de texto con `placeholder="Pega aquí el ID de producto"` que obliga al usuario a ingresar un UUID para filtrar.
3. **Tipo `KardexLineaRead` completamente roto:** usa ~8 campos que no existen en el contrato (`kardex_linea_id`, `tipo_movimiento_codigo/nombre`, `documento_referencia_*`, `cantidad_entrada/salida`, `saldo_cantidad/valorizado`). Las columnas de entrada, salida y saldo de la tabla Kardex nunca muestran datos reales.
4. **Flujos cabecera+detalle rotos:** `MovimientosPage` e `InventarioFisicoPage` cargan detalle con 2 queries separadas (`cabecera` + `detalle`) en lugar de usar el único endpoint `con-detalle`. Además, no existe formulario de creación de movimientos con líneas inline.
5. **Toast duplicado en todas las páginas:** cada `mutateAsync` en try/catch dentro de los componentes repite el `toast.error` que ya dispara el `onError` del hook — doble toast en cada error de mutación.
6. **`InvPageLayout` renderiza `<h1>` en el body:** viola la regla de layout del prompt maestro (el breadcrumb global ya identifica la página).

---

## ENDPOINTS DEPRECATED CONSUMIDOS ACTUALMENTE

| Endpoint deprecated | Archivo que lo consume | Endpoint correcto a usar |
|--------------------|-----------------------|--------------------------|
| `POST /api/v1/inv/stock` | `services/inv.service.ts` → `stockService.create()` | El stock no se gestiona directamente; se actualiza mediante `POST /inv/movimientos/con-detalle` |
| `PUT /api/v1/inv/stock/{stock_id}` | `services/inv.service.ts` → `stockService.update()` | Ídem — stock derivado de movimientos |
| `POST /api/v1/inv/movimientos-detalle` | `services/inv.service.ts` → `movimientoDetalleService.create()` + `hooks/movimientos-detalle.hooks.ts` → `useCreateMovimientoDetalle` | `POST /api/v1/inv/movimientos/con-detalle` |
| `PUT /api/v1/inv/movimientos-detalle/{id}` | `services/inv.service.ts` → `movimientoDetalleService.update()` + `hooks/movimientos-detalle.hooks.ts` → `useUpdateMovimientoDetalle` | `PUT /api/v1/inv/movimientos/{id}/con-detalle` |
| `POST /api/v1/inv/inventario-fisico-detalle` | `services/inv.service.ts` → `inventarioFisicoDetalleService.create()` + `hooks/inventario-fisico-detalle.hooks.ts` → `useCreateInventarioFisicoDetalle` | `POST /api/v1/inv/inventario-fisico/con-detalle` |
| `PUT /api/v1/inv/inventario-fisico-detalle/{id}` | `services/inv.service.ts` → `inventarioFisicoDetalleService.update()` + `hooks/inventario-fisico-detalle.hooks.ts` → `useUpdateInventarioFisicoDetalle` | `PUT /api/v1/inv/inventario-fisico/{id}/con-detalle` |

---

## UUIDs EXPUESTOS EN UI

| Campo UUID | Vista donde aparece | Qué debería mostrar en su lugar |
|-----------|--------------------|---------------------------------|
| `ln.producto_id` | `MovimientosPage` — columna "Producto" en tabla de líneas del modal de detalle | `Producto.nombre` (enriquecido desde respuesta `con-detalle` o desde listado de productos) |
| `ln.producto_id` | `InventarioFisicoPage` — columna "Producto" en tabla de líneas del modal de detalle | `Producto.nombre` |
| `productoFilter` (input text) | `KardexPage` — filtro "Producto (ID)" con `placeholder="Pega aquí el ID de producto"` | Select/combobox que muestre `codigo_sku — nombre` y envíe el ID internamente |

---

## FLUJOS CABECERA+DETALLE MAL IMPLEMENTADOS

| Flujo | Implementación actual | Corrección requerida |
|-------|-----------------------|----------------------|
| Ver detalle de movimiento | `useMovimiento(id)` + `useMovimientosDetalle({movimiento_id: id})` = 2 queries simultáneas | `GET /api/v1/inv/movimientos/{id}/con-detalle` — 1 sola query que devuelve cabecera + líneas |
| Crear movimiento con líneas | No existe formulario de creación con líneas inline | `POST /api/v1/inv/movimientos/con-detalle` — cabecera + `detalle: []` en una sola llamada |
| Editar movimiento con líneas | No existe formulario de edición | `PUT /api/v1/inv/movimientos/{id}/con-detalle` |
| Ver detalle de inventario físico | `useInventarioFisico(id)` + `useInventariosFisicosDetalle({inventario_fisico_id: id})` = 2 queries | `GET /api/v1/inv/inventario-fisico/{id}/con-detalle` — 1 sola query |
| Crear inventario físico con líneas | `useCreateInventarioFisico` solo crea cabecera; líneas no implementadas | `POST /api/v1/inv/inventario-fisico/con-detalle` |
| Editar inventario físico con líneas | No existe formulario de edición | `PUT /api/v1/inv/inventario-fisico/{id}/con-detalle` |

---

## AUDITORÍA POR ENDPOINT

### Categorías

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/categorias` | GET | ✅ | ✅ | ✅ CategoriasPage | ✅ | ✅ | ✅ |
| `/inv/categorias` | POST | ✅ | ✅ | ✅ CategoriasPage | ✅ | ✅ | ✅ |
| `/inv/categorias/{id}` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/categorias/{id}` | PUT | ✅ | ✅ | ✅ CategoriasPage | ✅ | ✅ | ✅ |
| `/inv/categorias/{id}` | DELETE | ✅ | ✅ | ✅ CategoriasPage | ✅ | ✅ | ✅ |
| `/inv/categorias/{id}/reactivar` | POST | ✅ | ✅ | ✅ CategoriasPage | ✅ | ✅ | ✅ |

### Unidades de Medida

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/unidades-medida` | GET | ✅ | ✅ | ✅ UnidadesMedidaPage | ✅ | ✅ | ✅ |
| `/inv/unidades-medida` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/unidades-medida/{id}` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/unidades-medida/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/unidades-medida/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/unidades-medida/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Productos

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/productos` | GET | ✅ | ✅ | ✅ ProductosPage | ✅ | ✅ | ✅ |
| `/inv/productos` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/productos/{id}` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/productos/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/productos/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/productos/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Almacenes

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/almacenes` | GET | ✅ | ✅ | ✅ AlmacenesPage | ✅ | ✅ | ✅ |
| `/inv/almacenes` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/almacenes/{id}` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/almacenes/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/almacenes/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/almacenes/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Stock (solo lectura activa; create/update son deprecated)

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/stock` | GET | ✅ | ✅ | ✅ StockPage | ✅ resuelve a nombre | ✅ | ❌ sin RBAC (lectura) |
| `/inv/stock/{id}` | GET | ✅ | ✅ | ❌ sin vista | — | — | — |
| `/inv/stock/producto/{pid}/almacen/{aid}` | GET | ✅ | ✅ | ❌ sin vista | — | — | — |
| `/inv/stock/alertas` | GET | ✅ | ✅ | ✅ StockPage toggle | ✅ | ✅ | ❌ sin RBAC |

### Tipos de Movimiento

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/tipos-movimiento` | GET | ✅ | ✅ | ✅ TiposMovimientoPage | ✅ | ✅ | ✅ |
| `/inv/tipos-movimiento` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/tipos-movimiento/{id}` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/tipos-movimiento/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/tipos-movimiento/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inv/tipos-movimiento/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Movimientos

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/movimientos` | GET | ✅ | ✅ | ✅ MovimientosPage | ✅ tipo/almacén resueltos | ✅ | ✅ |
| `/inv/movimientos` | POST | ✅ | ✅ | ❌ sin formulario de creación | — | — | — |
| `/inv/movimientos/{id}` | GET | ✅ | ✅ | ✅ modal detalle | ✅ | ✅ | ✅ |
| `/inv/movimientos/{id}` | PUT | ✅ | ✅ | ❌ sin formulario edición | — | — | — |
| `/inv/movimientos/{id}/con-detalle` | GET | ❌ falta | ❌ falta | ❌ falta | — | — | — |
| `/inv/movimientos/{id}/con-detalle` | PUT | ❌ falta | ❌ falta | ❌ falta | — | — | — |
| `/inv/movimientos/con-detalle` | POST | ❌ falta | ❌ falta | ❌ falta | — | — | — |
| `/inv/movimientos-detalle` | GET | ✅ | ✅ | ✅ modal detalle | ❌ producto_id crudo | ✅ | ❌ sin RBAC |
| `/inv/movimientos-detalle/{id}` | GET | ✅ | ✅ | ❌ sin vista | — | — | — |
| `/inv/{id}/autorizar` | POST | ✅ | ✅ | ✅ modal detalle | ✅ | ✅ | ✅ canEditar |
| `/inv/{id}/procesar` | POST | ✅ | ✅ | ✅ modal detalle | ✅ | ✅ | ✅ canEditar |
| `/inv/{id}/anular` | POST | ✅ | ✅ | ✅ modal detalle | ✅ | ✅ | ✅ canEditar |

### Inventario Físico

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/inventario-fisico` | GET | ✅ | ✅ | ✅ InventarioFisicoPage | ✅ almacén resuelto | ✅ | ❌ sin RBAC en lista |
| `/inv/inventario-fisico` | POST | ✅ | ✅ | ✅ modal crear | ✅ | ✅ | ✅ |
| `/inv/inventario-fisico/{id}` | GET | ✅ | ✅ | ✅ modal detalle | ✅ | ✅ | ✅ |
| `/inv/inventario-fisico/{id}` | PUT | ✅ | ✅ | ❌ sin UI de edición | — | — | — |
| `/inv/inventario-fisico/{id}/anular` | POST | ✅ | ✅ | ✅ modal detalle | ✅ | ✅ | ✅ |
| `/inv/inventario-fisico/{id}/finalizar` | POST | ❌ falta | ❌ falta | ❌ falta | — | — | — |
| `/inv/inventario-fisico/{id}/con-detalle` | GET | ❌ falta | ❌ falta | ❌ falta | — | — | — |
| `/inv/inventario-fisico/{id}/con-detalle` | PUT | ❌ falta | ❌ falta | ❌ falta | — | — | — |
| `/inv/inventario-fisico/con-detalle` | POST | ❌ falta | ❌ falta | ❌ falta | — | — | — |
| `/inv/inventario-fisico/{id}/aprobar` | POST | ✅ | ✅ | ✅ modal aprobar | ✅ | ✅ | ✅ |
| `/inv/inventario-fisico-detalle` | GET | ✅ | ✅ | ✅ modal detalle (2 llamadas) | ❌ producto_id crudo | ✅ | ❌ sin RBAC |
| `/inv/inventario-fisico-detalle/{id}` | GET | ✅ | ✅ | ❌ sin vista | — | — | — |

### Kardex

| Endpoint | Método | Service | Hook | Componente | IDs en UI | Loading/Error | RBAC |
|----------|--------|---------|------|-----------|----------|--------------|------|
| `/inv/kardex` | GET | ✅ | ✅ | ✅ KardexPage (roto) | ❌ filtro UUID input; columnas vacías por campos inexistentes en tipo | ✅ | ❌ sin RBAC |

---

## AUDITORÍA DE VISTAS UX/UI

| Vista | Existe | Paginación | Filtros | Empty state | Toast | Confirmación modal | Badge estado |
|-------|--------|-----------|---------|------------|-------|-------------------|-------------|
| Categorías — lista | ✅ | ❌ | ✅ empresa, activos | ✅ | ✅ | ✅ Dialog | ✅ |
| Categorías — formulario | ✅ modal | — | — | — | ✅ | — | — |
| Unidades de Medida — lista | ✅ | ❌ | ✅ empresa, activos | ✅ | ✅ | ✅ Dialog | ✅ |
| Unidades de Medida — formulario | ✅ modal | — | — | — | ✅ | — | — |
| Productos — lista | ✅ | ❌ | ✅ empresa, categoría, tipo, búsqueda, activos | ✅ | ✅ | ✅ Dialog | ✅ |
| Productos — formulario crear/editar | ✅ modal completo | — | — | — | ✅ | — | — |
| Almacenes — lista | ✅ | ❌ | ✅ empresa, activos | ✅ | ✅ | ✅ Dialog | ✅ |
| Almacenes — formulario | ✅ modal | — | — | — | ✅ | — | — |
| Tipos de Movimiento — lista | ✅ | ❌ | ✅ empresa, activos | ✅ | ✅ | ✅ Dialog | ✅ |
| Tipos de Movimiento — formulario | ✅ modal | — | — | — | ✅ | — | — |
| Stock — lista | ✅ analítico | ❌ | ✅ empresa, almacén, toggle alertas | ✅ | — | — | ❌ sin badge |
| Movimientos — lista | ✅ | ❌ | ✅ empresa, almacén, tipo, estado, fechas | ✅ | ✅ | ❌ `window.confirm` | ✅ |
| Movimientos — crear con líneas | ❌ NO EXISTE | — | — | — | — | — | — |
| Movimientos — detalle/acciones | ✅ modal | — | — | ✅ | ✅ | ❌ `window.confirm` | ✅ |
| Inventario Físico — lista | ✅ | ❌ | ✅ empresa, almacén, estado, fechas | ✅ | ✅ | ⚠ Dialog aprobar / ❌ `window.confirm` anular | ✅ |
| Inventario Físico — crear | ✅ modal (solo cabecera) | — | — | — | ✅ | — | — |
| Inventario Físico — detalle/acciones | ✅ modal | — | — | ✅ | ✅ | ⚠ Dialog aprobar / ❌ `window.confirm` anular | ✅ |
| Kardex — lista analítica | ✅ (roto) | ❌ | ❌ filtro producto por UUID | ✅ | — | — | — |

---

## CAMPOS FALTANTES EN UI

### MovimientosPage — lista

| Campo | Prioridad | Motivo |
|-------|----------|--------|
| `tercero_nombre` | ⚠ IMPORTANTE | Identifica la contraparte del movimiento (proveedor, cliente) |
| `modulo_origen` | ➕ MENOR | Útil en auditoría pero no operativo en lista |

### MovimientosPage — detalle (modal)

| Campo | Prioridad | Motivo |
|-------|----------|--------|
| `centro_costo_id` → nombre | ⚠ IMPORTANTE | Imputación contable del movimiento |
| `requiere_autorizacion` | ⚠ IMPORTANTE | Indica flujo de aprobación requerido |
| `fecha_autorizacion` | ⚠ IMPORTANTE | Trazabilidad de aprobaciones |
| `fecha_procesado` | ⚠ IMPORTANTE | Auditoría de cuándo impactó el stock |
| Nombre de producto en líneas | 🔴 CRÍTICO | Actualmente muestra UUID crudo |

### InventarioFisicoPage — lista

| Campo | Prioridad | Motivo |
|-------|----------|--------|
| `supervisor_nombre` | ⚠ IMPORTANTE | Responsable de la toma de inventario |
| `total_diferencias` (count) | ⚠ IMPORTANTE | Cuántos productos tienen diferencia |

### InventarioFisicoPage — detalle (modal)

| Campo | Prioridad | Motivo |
|-------|----------|--------|
| Nombre de producto en líneas | 🔴 CRÍTICO | Actualmente muestra UUID crudo |
| `supervisor_nombre` | ⚠ IMPORTANTE | Trazabilidad del responsable |
| `valor_diferencias` | ⚠ IMPORTANTE | Impacto económico de las diferencias |
| `total_diferencias` | ⚠ IMPORTANTE | Cuántos ítems difieren del sistema |
| Acción "Finalizar" | 🔴 CRÍTICO | Endpoint `/finalizar` existe pero no hay botón en UI |

### AlmacenesPage — lista

| Campo | Prioridad | Motivo |
|-------|----------|--------|
| `tipo_almacen` | 🔴 CRÍTICO | No aparece en tabla; es la clasificación principal del almacén |
| `es_almacen_principal` | ⚠ IMPORTANTE | Flag para identificar almacén principal visualmente |
| Sucursal (nombre, no ID) | ⚠ IMPORTANTE | Ubica el almacén dentro de la empresa |

### StockPage — lista

| Campo | Prioridad | Motivo |
|-------|----------|--------|
| `cantidad_disponible` | 🔴 CRÍTICO | Stock real disponible (actual − reservada) |
| `cantidad_reservada` | ⚠ IMPORTANTE | Cuánto está comprometido |
| `stock_minimo` | ⚠ IMPORTANTE | Referencia para alertas de reposición |
| `valor_total` | ⚠ IMPORTANTE | Valorización del stock por ítem |

### KardexPage — lista

| Campo / Columna | Prioridad | Situación actual |
|-----------------|----------|------------------|
| Tipo de movimiento (nombre) | 🔴 CRÍTICO | Columna muestra `undefined`/vacío; campo `tipo_movimiento_id` existe en API pero `tipo_movimiento_nombre` no. **Decisión de diseño:** enriquecer cargando `useTiposMovimiento` y resolviendo por `tipo_movimiento_id` (mismo patrón que almacenes/productos). |
| `cantidad_base` | 🔴 CRÍTICO | Único campo de cantidad disponible en API; no se muestra (tabla usa campos inexistentes) |
| `almacen_origen_id` → nombre | 🔴 CRÍTICO | API retorna `almacen_origen_id` y `almacen_destino_id`, no `almacen_id`; tabla siempre muestra '-' |
| `lote` / `numero_serie` | ➕ MENOR | Trazabilidad extendida |
| Filtro "Producto" | 🔴 CRÍTICO | Input UUID crudo; debe ser Select con nombre de producto |

---

## ARCHIVOS A REESCRIBIR

| Archivo | Motivo |
|---------|--------|
| `types/inv.types.ts` | `KardexLineaRead` usa ~8 campos inexistentes en el contrato. Faltan tipos: `MovimientoConDetalle`, `MovimientoConDetalleCreate`, `InventarioFisicoConDetalle`, `InventarioFisicoConDetalleCreate`. |
| `services/inv.service.ts` | 6 métodos llaman endpoints deprecated. Faltan métodos `con-detalle` para movimientos e inventario físico. Falta `inventarioFisicoService.finalizar`. Eliminar `stockService.create/update`, `movimientoDetalleService.create/update`, `inventarioFisicoDetalleService.create/update`. |
| `hooks/movimientos-detalle.hooks.ts` | `useCreateMovimientoDetalle` y `useUpdateMovimientoDetalle` llaman a deprecated. Reemplazar con hooks `con-detalle`. |
| `hooks/inventario-fisico-detalle.hooks.ts` | `useCreateInventarioFisicoDetalle` y `useUpdateInventarioFisicoDetalle` llaman a deprecated. Reemplazar con hooks `con-detalle`. |
| `hooks/inventario-fisico.hooks.ts` | Agregar `useFinalizar`, `useCreateInventarioFisicoConDetalle`, `useInventarioFisicoConDetalle`, `useUpdateInventarioFisicoConDetalle`. |
| `pages/MovimientosPage.tsx` | UUID en UI, flujo cabecera+detalle roto (2 llamadas), sin formulario creación/edición con líneas inline, `window.confirm/prompt` en lugar de modales Dialog, toast duplicado en catch. |
| `pages/InventarioFisicoPage.tsx` | UUID en UI, flujo cabecera+detalle roto, sin acción "Finalizar", sin edición con líneas inline, `window.confirm` en anular, toast duplicado. |
| `pages/KardexPage.tsx` | Usa campos inexistentes del tipo roto, filtro de producto por UUID input, columnas de entrada/salida/saldo siempre vacías. Reescribir completamente con tipo correcto y enriquecimiento de `tipo_movimiento` por lista. |
| `components/InvPageLayout.tsx` | Renderiza `<h1>` en body. Eliminar título del body; la página debe comenzar directamente con la barra de acciones. |

---

## ARCHIVOS NUEVOS A CREAR

| Archivo | Descripción funcional |
|---------|----------------------|
| `hooks/movimientos.hooks.ts` (ampliar) | Agregar `useMovimientoConDetalle`, `useCreateMovimientoConDetalle`, `useUpdateMovimientoConDetalle` |
| `pages/MovimientoFormPage.tsx` | Página completa para crear/editar un movimiento con tabla de líneas inline. Usa `POST /con-detalle` y `PUT /{id}/con-detalle`. Acciones Guardar/Cancelar en header compacto. |

---

## NOTAS DE DISEÑO

- **Kardex — enriquecimiento de `tipo_movimiento`:** El endpoint `GET /inv/kardex` retorna `tipo_movimiento_id` (UUID). Para mostrar el nombre del tipo de movimiento en la tabla, se carga `useTiposMovimiento` en la misma vista y se resuelve por `tipo_movimiento_id`. Esta es la estrategia correcta y equivalente a cómo se resuelven almacenes y productos en otras vistas. No es deuda técnica sino una decisión de diseño intencional para evitar N+1 queries.

- **Stock — sin creación/edición directa:** Los endpoints `POST /inv/stock` y `PUT /inv/stock/{id}` están deprecated. El stock se gestiona exclusivamente a través de movimientos de inventario. `StockPage` es correctamente una vista de solo lectura.

- **`movimientoService.autorizar` — ruta sin prefijo `/movimientos/`:** La ruta real del endpoint es `/api/v1/inv/{movimiento_id}/autorizar` (sin el prefijo `/movimientos/`). El servicio actual lo llama correctamente como `${BASE}/${movimientoId}/autorizar`.
