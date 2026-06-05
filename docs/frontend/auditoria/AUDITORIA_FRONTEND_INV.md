# Auditoría frontend — módulo INV (Inventarios y Almacenes)

**Contrato de referencia:** `docs/api/INV_API.json` (rutas `/api/v1/inv/`).  
**Código auditado:** `src/features/inv/**` (y consumo desde router bajo `/inv`).  
**Fecha de auditoría:** 2026-05-14.

---

### DIAGNÓSTICO GENERAL

**Semáforo: 🟡 AJUSTES**

El módulo cubre maestros, stock, kardex, movimientos e inventario físico con service layer alineado a endpoints activos, formularios transaccionales que envían **cabecera + detalle en una sola llamada** (`con-detalle`), y mutaciones con toast de éxito/error en hooks usando `getErrorMessage`. Quedan brechas de **UX corporativa** (confirmación antes de autorizar, skeletons frente a spinners genéricos), **RBAC ausente** en vistas solo lectura (Stock, Kardex), y **hooks/código muerto** (`useMovimiento`, `useStock`, `useMovimientosDetalle`, etc.) sin vista que los consuma. Tras esta sesión se unificaron fallbacks de FK a **"—"** (sin UUID en tablas) y se documentaron con `@deprecated` los hooks de cabecera sola de movimientos e inventario físico.

---

### ENDPOINTS DEPRECATED CONSUMIDOS ACTUALMENTE

**Ninguno detectado.**

`inv.service.ts` no invoca `POST/PUT` sobre `/inv/stock`, ni `POST/PUT` sobre `/inv/movimientos-detalle` ni `/inv/inventario-fisico-detalle` (métodos marcados `deprecated: true` en OpenAPI).

---

### UUIDs EXPUESTOS EN UI

**Estado tras correcciones en código (2026-05-14):**

- **Celdas de tabla y etiquetas de solo lectura:** no deben mostrarse UUID ni fragmentos; ante FK no resuelta se usa el texto neutro **"—"** en `StockPage`, `AlmacenesPage` (sucursal), `ProductosPage` (categoría), `MovimientosPage` (tipo, almacén, producto en detalle), `KardexPage` (producto mientras enriquece), `InventarioFisicoPage` (almacén, producto), `CategoriasPage` (empresa en listado si no hay match).
- **Controles `<select>`:** siguen usando `value={..._id}` como valor HTML interno; es correcto y no cuenta como “mostrar UUID al usuario” si el texto visible es el nombre (`razon_social`, `nombre`, etc.).

---

### FLUJOS CABECERA+DETALLE MAL IMPLEMENTADOS

**Ninguno detectado.**

- `MovimientoFormPage` usa `useCreateMovimientoConDetalle` / `useUpdateMovimientoConDetalle` (una llamada con detalle embebido).
- `InventarioFisicoFormPage` usa `useCreateInventarioFisicoConDetalle` / `useUpdateInventarioFisicoConDetalle`.

Los hooks `useCreateMovimiento`, `useUpdateMovimiento`, `useCreateInventarioFisico` y `useUpdateInventarioFisico` permanecen por compatibilidad pero están marcados con **`@deprecated`** en código, indicando preferencia por los hooks `*ConDetalle`.

---

### AUDITORÍA POR ENDPOINT

Leyenda: **Svc** = `inv.service.ts`; **Hook** = hook en `hooks/`; **UI** = página o flujo que dispara la petición; **IDs** = ausencia de UUID en columnas/labels visibles; **L/E** = loading y mensaje de error razonables; **RBAC** = acciones mutables acotadas con `usePermissions` donde aplica.

| Endpoint (activo) | Método | Svc | Hook | UI | IDs | L/E | RBAC |
|---------------------|--------|-----|------|----|-----|-----|------|
| `/inv/categorias` | GET | ✅ | ✅ `useCategorias` | `CategoriasPage` | ✅ | ✅ | ✅ |
| `/inv/categorias` | POST | ✅ | ✅ `useCreateCategoria` | `CategoriasPage` | — | ✅ | ✅ |
| `/inv/categorias/{id}` | GET | ✅ | — | — | — | — | — |
| `/inv/categorias/{id}` | PUT | ✅ | ✅ `useUpdateCategoria` | `CategoriasPage` | — | ✅ | ✅ |
| `/inv/categorias/{id}` | DELETE | ✅ | ✅ `useDeleteCategoria` | `CategoriasPage` | — | ✅ | ✅ |
| `/inv/categorias/{id}/reactivar` | POST | ✅ | ✅ `useReactivarCategoria` | `CategoriasPage` | — | ✅ | ✅ |
| `/inv/unidades-medida` | GET | ✅ | ✅ `useUnidadesMedida` | `UnidadesMedidaPage`, formularios | ✅ | ✅ | ✅ |
| `/inv/unidades-medida` | POST | ✅ | ✅ `useCreateUnidadMedida` | `UnidadesMedidaPage` | — | ✅ | ✅ |
| `/inv/unidades-medida/{id}` | GET | ✅ | — | — | — | — | — |
| `/inv/unidades-medida/{id}` | PUT | ✅ | ✅ `useUpdateUnidadMedida` | `UnidadesMedidaPage` | — | ✅ | ✅ |
| `/inv/unidades-medida/{id}` | DELETE | ✅ | ✅ `useDeleteUnidadMedida` | `UnidadesMedidaPage` | — | ✅ | ✅ |
| `/inv/unidades-medida/{id}/reactivar` | POST | ✅ | ✅ `useReactivarUnidadMedida` | `UnidadesMedidaPage` | — | ✅ | ✅ |
| `/inv/productos` | GET | ✅ | ✅ `useProductos` | `ProductosPage`, selects en formularios | ✅ | ✅ | ✅ |
| `/inv/productos` | POST | ✅ | ✅ `useCreateProducto` | `ProductosPage` | — | ✅ | ✅ |
| `/inv/productos/{id}` | GET | ✅ | — | Vía `productoService.getById` en páginas (enriquecimiento) | ✅ | ⚠ | — |
| `/inv/productos/{id}` | PUT | ✅ | ✅ `useUpdateProducto` | `ProductosPage` | — | ✅ | ✅ |
| `/inv/productos/{id}` | DELETE | ✅ | ✅ `useDeleteProducto` | `ProductosPage` | — | ✅ | ✅ |
| `/inv/productos/{id}/reactivar` | POST | ✅ | ✅ `useReactivarProducto` | `ProductosPage` | — | ✅ | ✅ |
| `/inv/almacenes` | GET | ✅ | ✅ `useAlmacenes` | Varias páginas | ✅ | ✅ | ✅ |
| `/inv/almacenes` | POST | ✅ | ✅ `useCreateAlmacen` | `AlmacenesPage` | — | ✅ | ✅ |
| `/inv/almacenes/{id}` | GET | ✅ | — | — | — | — | — |
| `/inv/almacenes/{id}` | PUT | ✅ | ✅ `useUpdateAlmacen` | `AlmacenesPage` | — | ✅ | ✅ |
| `/inv/almacenes/{id}` | DELETE | ✅ | ✅ `useDeleteAlmacen` | `AlmacenesPage` | — | ✅ | ✅ |
| `/inv/almacenes/{id}/reactivar` | POST | ✅ | ✅ `useReactivarAlmacen` | `AlmacenesPage` | — | ✅ | ✅ |
| `/inv/stock` | GET | ✅ | ✅ `useStocks` | `StockPage` | ✅ | ✅ | ⚠ |
| `/inv/stock/{stock_id}` | GET | ✅ | ✅ `useStock` | **Sin uso** | — | — | — |
| `/inv/stock/producto/{producto_id}/almacen/{almacen_id}` | GET | ✅ | ✅ `useStockPorProductoAlmacen` | **Sin uso** | — | — | — |
| `/inv/stock/alertas` | GET | ✅ | ✅ `useStockAlertas` | `StockPage` | ✅ | ✅ | ⚠ |
| `/inv/tipos-movimiento` | GET | ✅ | ✅ `useTiposMovimiento` | `TiposMovimientoPage`, filtros | ✅ | ✅ | ✅ |
| `/inv/tipos-movimiento` | POST | ✅ | ✅ `useCreateTipoMovimiento` | `TiposMovimientoPage` | — | ✅ | ✅ |
| `/inv/tipos-movimiento/{id}` | GET/PUT/DELETE | ✅ | PUT/DELETE vía hooks | `TiposMovimientoPage` | — | ✅ | ✅ |
| `/inv/tipos-movimiento/{id}/reactivar` | POST | ✅ | ✅ `useReactivarTipoMovimiento` | `TiposMovimientoPage` | — | ✅ | ✅ |
| `/inv/movimientos` | GET | ✅ | ✅ `useMovimientos` | `MovimientosPage` | ✅ | ✅ | parcial |
| `/inv/movimientos` | POST (cabecera) | ✅ | ✅ `useCreateMovimiento` **@deprecated** | **Sin uso en UI** | — | — | — |
| `/inv/movimientos/{id}` | GET | ✅ | ✅ `useMovimiento` | **Sin uso en UI** | — | — | — |
| `/inv/movimientos/{id}` | PUT (cabecera) | ✅ | ✅ `useUpdateMovimiento` **@deprecated** | **Sin uso en UI** | — | — | — |
| `/inv/movimientos/{id}/con-detalle` | GET | ✅ | ✅ `useMovimientoConDetalle` | `MovimientosPage`, `MovimientoFormPage` | ✅ | ✅ | parcial |
| `/inv/movimientos/{id}/con-detalle` | PUT | ✅ | ✅ `useUpdateMovimientoConDetalle` | `MovimientoFormPage` | — | ✅ | ✅ |
| `/inv/movimientos/con-detalle` | POST | ✅ | ✅ `useCreateMovimientoConDetalle` | `MovimientoFormPage` | — | ✅ | ✅ |
| `/inv/movimientos-detalle` | GET | ✅ | ✅ `useMovimientosDetalle` | **Sin uso** | — | — | — |
| `/inv/movimientos-detalle/{id}` | GET | ✅ | ✅ `useMovimientoDetalle` | **Sin uso** | — | — | — |
| `/inv/inventario-fisico` | GET | ✅ | ✅ `useInventariosFisicos` | `InventarioFisicoPage` | ✅ | ✅ | parcial |
| `/inv/inventario-fisico` | POST (cabecera) | ✅ | ✅ `useCreateInventarioFisico` **@deprecated** | **Sin uso** | — | — | — |
| `/inv/inventario-fisico/{id}` | GET | ✅ | ✅ `useInventarioFisico` | **Sin uso** | — | — | — |
| `/inv/inventario-fisico/{id}` | PUT (cabecera) | ✅ | ✅ `useUpdateInventarioFisico` **@deprecated** | **Sin uso** | — | — | — |
| `/inv/inventario-fisico/{id}/con-detalle` | GET | ✅ | ✅ `useInventarioFisicoConDetalle` | `InventarioFisicoPage`, `InventarioFisicoFormPage` | ✅ | ✅ | parcial |
| `/inv/inventario-fisico/{id}/con-detalle` | PUT | ✅ | ✅ `useUpdateInventarioFisicoConDetalle` | `InventarioFisicoFormPage` | — | ✅ | ✅ |
| `/inv/inventario-fisico/con-detalle` | POST | ✅ | ✅ `useCreateInventarioFisicoConDetalle` | `InventarioFisicoFormPage` | — | ✅ | ✅ |
| `/inv/inventario-fisico/{id}/anular` | POST | ✅ | ✅ `useAnularInventarioFisico` | `InventarioFisicoPage` | — | ✅ | ✅ |
| `/inv/inventario-fisico/{id}/finalizar` | POST | ✅ | ✅ `useFinalizarInventarioFisico` | `InventarioFisicoPage` | — | ✅ | ✅ |
| `/inv/inventario-fisico/{id}/aprobar` | POST | ✅ | ✅ `useAprobarInventarioFisico` | `InventarioFisicoPage` | — | ✅ | ✅ |
| `/inv/inventario-fisico-detalle` | GET | ✅ | ✅ `useInventariosFisicosDetalle` | **Sin uso** | — | — | — |
| `/inv/inventario-fisico-detalle/{id}` | GET | ✅ | ✅ `useInventarioFisicoDetalle` | **Sin uso** | — | — | — |
| `/inv/{movimiento_id}/procesar` | POST | ✅ | ✅ `useProcesarMovimiento` | `MovimientosPage` | — | ✅ | ✅ |
| `/inv/{movimiento_id}/autorizar` | POST | ✅ | ✅ `useAutorizarMovimiento` | `MovimientosPage` | — | ✅ | ✅ |
| `/inv/{movimiento_id}/anular` | POST | ✅ | ✅ `useAnularMovimiento` | `MovimientosPage` | — | ✅ | ✅ |
| `/inv/kardex` | GET | ✅ | ✅ `useKardex` | `KardexPage` | ✅ | ✅ | ⚠ |

**Notas rápidas**

- **RBAC “parcial”** en movimientos / inventario físico: existen permisos para crear/editar y acciones de flujo dependen de `can('inv','editar')`, pero no hay matriz explícita por permiso fino (p. ej. solo “procesar”).
- **RBAC “⚠”** en Stock y Kardex: vistas de consulta sin ocultar navegación o acciones según permiso de lectura (si el menú ya restringe acceso, puede ser aceptable; documentar decisión de producto).

---

### AUDITORÍA DE VISTAS UX/UI

| Vista | Existe | Paginación | Filtros | Empty state | Toast éxito/error | Confirmación modal | Badge estado |
|-------|--------|------------|---------|-------------|-------------------|--------------------|--------------|
| Categorías | ✅ | N/A (array) | Empresa, inactivos | ✅ | ✅ (hooks) | Baja/reactivar | ✅ |
| Unidades de medida | ✅ | N/A | Empresa, inactivos | ✅ | ✅ | Baja/reactivar | ✅ |
| Productos | ✅ | N/A | Empresa, búsqueda, inactivos | ✅ | ✅ | Baja/reactivar | ✅ |
| Almacenes | ✅ | N/A | Empresa, inactivos | ✅ | ✅ | Baja/reactivar | ✅ |
| Stock | ✅ | N/A | Empresa, almacén, toggle alertas | ✅ | ✅ queries / sin mutación | N/A | ⚠ (resalte filas bajo mínimo) |
| Tipos de movimiento | ✅ | N/A | Empresa, inactivos | ✅ | ✅ | Baja/reactivar | ✅ |
| Movimientos (lista) | ✅ | N/A | Empresa, almacén, tipo, estado, fechas | ✅ | ✅ | Procesar, anular | ✅ |
| Movimientos (detalle modal) | ✅ | — | — | ✅ líneas vacías | ✅ | ⚠ **Autorizar sin confirmación** | ✅ |
| Movimientos (formulario página) | ✅ | — | — | — | ✅ | Cancelar implícito | ✅ |
| Inventario físico (lista) | ✅ | N/A | Empresa, almacén, estado, fechas | ✅ | ✅ | Aprobar / anular / finalizar | ✅ |
| Inventario físico (formulario) | ✅ | — | — | — | ✅ | — | ✅ |
| Kardex | ✅ | N/A | Empresa, almacén, producto, fechas | ✅ | N/A (solo lectura) | N/A | N/A |

**Observaciones UX**

- Varias listas usan **spinner** centrado en lugar de **skeleton de tabla** (recomendación `.cursorrules`).
- **Reintentar** explícito ante error de query: no unificado (solo mensaje en rojo).

---

### CAMPOS FALTANTES EN UI

Resumen por prioridad (el contrato expone más campos de los que la tabla muestra; muchos son opcionales u operativos solo en módulos contables/compras).

| Prioridad | Vista / contexto | Campos del contrato no mostrados (ejemplos) | Comentario |
|-----------|------------------|---------------------------------------------|-------------|
| 🔴 CRÍTICO | — | — | No hay campo crítico de operación inventario completamente ausente en todas las vistas; los riesgos eran UUID (corregido) y flujos (OK). |
| ⚠ IMPORTANTE | Lista productos | `costo_promedio`, `stock_minimo` / `stock_maximo` en tabla | Útiles para compras/almacén sin abrir modal. |
| ⚠ IMPORTANTE | Lista movimientos | `observaciones` resumidas, `moneda` consistente en todas las filas | Ya aparece parcialmente en detalle. |
| ⚠ IMPORTANTE | Stock | `fecha_valoracion` u otros metadatos de `StockRead` si existen en API | Valorar según contrato exacto de `StockRead`. |
| ➕ MENOR | Maestros | Auditoría (`usuario_creacion_id`, fechas técnicas) | Correcto ocultar en tabla. |
| ➕ MENOR | Kardex | Columnas adicionales de `KardexLineaRead` no mapeadas | Solo si el negocio las necesita a primera vista. |

---

### ARCHIVOS A REESCRIBIR

**Ninguno que requiera reescritura total.** El alineamiento al contrato es bueno en service y formularios transaccionales. Mejoras incrementales: confirmación de autorización, skeletons, RBAC en consultas, y uso o eliminación documentada de hooks sin consumidor.

---

### ARCHIVOS NUEVOS A CREAR

| Archivo / ámbito | Descripción |
|-------------------|-------------|
| Opcional: vistas o widgets que usen `useStock` / `useStockPorProductoAlmacen` | Exponer en UI el detalle puntual de stock por producto/almacén si el negocio lo requiere. |
| Opcional: módulo `inv-bill` | Contrato bajo `/api/v1/inv-bill/` no está en `src/features/inv`; sería feature aparte. |
| Opcional: tests E2E o de contrato | No solicitados en esta auditoría. |

---

*Fin de la Fase 1 (auditoría). Esperando confirmación para Fase 2.*
