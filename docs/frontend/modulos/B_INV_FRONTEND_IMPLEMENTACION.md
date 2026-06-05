# INV — Implementación Frontend (Fase 4: verificación final)

Fecha: 2026-05-09  
Módulo: Inventarios y Almacenes (`INV`)  
Contrato: `docs/api/INV_API.json` (paths bajo `/api/v1/inv/...`; **excluye** `/api/v1/inv-bill/...`, cubierto por otro feature)

---

## 1) Archivos creados o modificados (alcance INV)

### Creados

- `docs/frontend/auditoria/AUDITORIA_FRONTEND_INV.md` (Fase 2)
- `docs/frontend/modulos/INV_FRONTEND_IMPLEMENTACION.md` (este archivo, Fase 4)
- `src/features/inv/hooks/categorias.hooks.ts`
- `src/features/inv/hooks/unidades-medida.hooks.ts`
- `src/features/inv/hooks/productos.hooks.ts`
- `src/features/inv/hooks/almacenes.hooks.ts`
- `src/features/inv/hooks/tipos-movimiento.hooks.ts`
- `src/features/inv/hooks/stock.hooks.ts`
- `src/features/inv/hooks/movimientos.hooks.ts`
- `src/features/inv/hooks/movimientos-detalle.hooks.ts`
- `src/features/inv/hooks/inventario-fisico.hooks.ts`
- `src/features/inv/hooks/inventario-fisico-detalle.hooks.ts`
- `src/features/inv/hooks/kardex.hooks.ts`

### Modificados

- `src/features/inv/types/inv.types.ts` (tipos detalle líneas + requests de flujo/aprobación)
- `src/features/inv/services/inv.service.ts` (funciones REST añadidas en Fase 3; corrección tipado `unknown` en `getByProductoAlmacen`)
- `src/features/inv/pages/CategoriasPage.tsx`
- `src/features/inv/pages/UnidadesMedidaPage.tsx`
- `src/features/inv/pages/ProductosPage.tsx`
- `src/features/inv/pages/AlmacenesPage.tsx`
- `src/features/inv/pages/TiposMovimientoPage.tsx`
- `src/features/inv/pages/StockPage.tsx`
- `src/features/inv/pages/KardexPage.tsx`
- `src/features/inv/pages/MovimientosPage.tsx`
- `src/features/inv/pages/InventarioFisicoPage.tsx`

### Sin eliminación de componentes de ruta

- **Layout**: `src/features/inv/components/InvPageLayout.tsx` permanece registrado por `routes.tsx`.
- **Router**: `src/features/inv/routes.tsx` mantiene las **9 rutas** de página (lazy) + redirección a `productos`.
- Las **nueve páginas** listadas en la auditoría siguen existiendo; no se sustituyeron por placeholders ni se borró ninguna.

---

## 2) Cobertura por endpoint (types / service / hook / UI)

**Total operaciones INV en contrato**: 58 (`/api/v1/inv/...`).

Convención aplicada:

- **Types**: `src/features/inv/types/inv.types.ts`
- **Services**: `src/features/inv/services/inv.service.ts`
- **Hooks**: `src/features/inv/hooks/*.hooks.ts`
- **UI**: `src/features/inv/pages/*Page.tsx`

Leyenda de columna **UI**:

- **Sí**: la pantalla del módulo invoca la operación (directa o vía hook).
- **Parcial**: existe service (+ hook donde Fase 3 lo definió) pero la pantalla actual **no** expone ese flujo.
- **N/A**: reservado (no usado aquí).

### Categorías

| Método | Path (relativo `/api/v1/inv`) | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/categorias` | `Categoria` | `categoriaService.list` | `useCategorias` | `CategoriasPage` |
| POST | `/categorias` | `CategoriaCreate` → `Categoria` | `categoriaService.create` | `useCreateCategoria` | `CategoriasPage` |
| GET | `/categorias/{categoria_id}` | `Categoria` | `categoriaService.getById` | `useCategoria` | Parcial (lista/modal sin pantalla solo-detalle) |
| PUT | `/categorias/{categoria_id}` | `CategoriaUpdate` | `categoriaService.update` | `useUpdateCategoria` | `CategoriasPage` |
| DELETE | `/categorias/{categoria_id}` | — | `categoriaService.delete` | `useDeleteCategoria` | `CategoriasPage` |
| POST | `/categorias/{categoria_id}/reactivar` | `Categoria` | `categoriaService.reactivar` | `useReactivarCategoria` | `CategoriasPage` |

### Unidades de medida

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/unidades-medida` | `UnidadMedida` | `unidadMedidaService.list` | `useUnidadesMedida` | `UnidadesMedidaPage` |
| POST | `/unidades-medida` | `UnidadMedidaCreate` | `unidadMedidaService.create` | `useCreateUnidadMedida` | `UnidadesMedidaPage` |
| GET | `/unidades-medida/{unidad_medida_id}` | `UnidadMedida` | `unidadMedidaService.getById` | `useUnidadMedida` | Parcial |
| PUT | `/unidades-medida/{unidad_medida_id}` | `UnidadMedidaUpdate` | `unidadMedidaService.update` | `useUpdateUnidadMedida` | `UnidadesMedidaPage` |
| DELETE | `/unidades-medida/{unidad_medida_id}` | — | `unidadMedidaService.delete` | `useDeleteUnidadMedida` | `UnidadesMedidaPage` |
| POST | `/unidades-medida/{unidad_medida_id}/reactivar` | `UnidadMedida` | `unidadMedidaService.reactivar` | `useReactivarUnidadMedida` | `UnidadesMedidaPage` |

### Productos

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/productos` | `Producto` | `productoService.list` | `useProductos` | `ProductosPage`; lookup en `KardexPage` vía service |
| POST | `/productos` | `ProductoCreate` | `productoService.create` | `useCreateProducto` | `ProductosPage` |
| GET | `/productos/{producto_id}` | `Producto` | `productoService.getById` | `useProducto` | Parcial (`KardexPage`/`otros`: uso directo de service según código) |
| PUT | `/productos/{producto_id}` | `ProductoUpdate` | `productoService.update` | `useUpdateProducto` | `ProductosPage` |
| DELETE | `/productos/{producto_id}` | — | `productoService.delete` | `useDeleteProducto` | `ProductosPage` |
| POST | `/productos/{producto_id}/reactivar` | `Producto` | `productoService.reactivar` | `useReactivarProducto` | `ProductosPage` |

### Almacenes

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/almacenes` | `Almacen` | `almacenService.list` | `useAlmacenes` | `AlmacenesPage`; filtros en `Stock`, `Kardex`, `Movimientos`, `InventarioFisico` |
| POST | `/almacenes` | `AlmacenCreate` | `almacenService.create` | `useCreateAlmacen` | `AlmacenesPage` |
| GET | `/almacenes/{almacen_id}` | `Almacen` | `almacenService.getById` | `useAlmacen` | Parcial |
| PUT | `/almacenes/{almacen_id}` | `AlmacenUpdate` | `almacenService.update` | `useUpdateAlmacen` | `AlmacenesPage` |
| DELETE | `/almacenes/{almacen_id}` | — | `almacenService.delete` | `useDeleteAlmacen` | `AlmacenesPage` |
| POST | `/almacenes/{almacen_id}/reactivar` | `Almacen` | `almacenService.reactivar` | `useReactivarAlmacen` | `AlmacenesPage` |

### Stock

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/stock` | `Stock` | `stockService.list` | `useStocks` | `StockPage` |
| POST | `/stock` | `StockCreate` | `stockService.create` | — | Parcial (sin hook de mutación ni pantalla dedicada) |
| GET | `/stock/{stock_id}` | `Stock` | `stockService.getById` | `useStock` | Parcial (hook sin uso en páginas actuales) |
| PUT | `/stock/{stock_id}` | `StockUpdate` | `stockService.update` | — | Parcial |
| GET | `/stock/producto/{producto_id}/almacen/{almacen_id}` | `Stock` \| null | `stockService.getByProductoAlmacen` | `useStockPorProductoAlmacen` | Parcial (hook sin uso en páginas actuales) |
| GET | `/stock/alertas` | `Stock[]` | `stockService.alertas` | `useStockAlertas` | `StockPage` (modo alertas) |

### Tipos de movimiento

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/tipos-movimiento` | `TipoMovimiento` | `tipoMovimientoService.list` | `useTiposMovimiento` | `TiposMovimientoPage`; selector en `MovimientosPage`, `InventarioFisicoPage` |
| POST | `/tipos-movimiento` | `TipoMovimientoCreate` | `tipoMovimientoService.create` | `useCreateTipoMovimiento` | `TiposMovimientoPage` |
| GET | `/tipos-movimiento/{tipo_movimiento_id}` | `TipoMovimiento` | `tipoMovimientoService.getById` | `useTipoMovimiento` | Parcial |
| PUT | `/tipos-movimiento/{tipo_movimiento_id}` | `TipoMovimientoUpdate` | `tipoMovimientoService.update` | `useUpdateTipoMovimiento` | `TiposMovimientoPage` |
| DELETE | `/tipos-movimiento/{tipo_movimiento_id}` | — | `tipoMovimientoService.delete` | `useDeleteTipoMovimiento` | `TiposMovimientoPage` |
| POST | `/tipos-movimiento/{tipo_movimiento_id}/reactivar` | `TipoMovimiento` | `tipoMovimientoService.reactivar` | `useReactivarTipoMovimiento` | `TiposMovimientoPage` |

### Movimientos

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/movimientos` | `Movimiento` | `movimientoService.list` | `useMovimientos` | `MovimientosPage` |
| POST | `/movimientos` | `MovimientoCreate` | `movimientoService.create` | `useCreateMovimiento` | Parcial (hook disponible; **sin** formulario crear en página) |
| GET | `/movimientos/{movimiento_id}` | `Movimiento` | `movimientoService.getById` | `useMovimiento` | `MovimientosPage` (detalle/modal) |
| PUT | `/movimientos/{movimiento_id}` | `MovimientoUpdate` | `movimientoService.update` | `useUpdateMovimiento` | Parcial |
| POST | `/{movimiento_id}/autorizar` | `AutorizarMovimientoRequest` (vacío en contrato) | `movimientoService.autorizar` | `useAutorizarMovimiento` | `MovimientosPage` |
| POST | `/{movimiento_id}/procesar` | — | `movimientoService.procesar` | `useProcesarMovimiento` | `MovimientosPage` |
| POST | `/{movimiento_id}/anular` | `AnularMovimientoRequest` | `movimientoService.anular` | `useAnularMovimiento` | `MovimientosPage` |

### Movimientos — detalle (líneas)

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/movimientos-detalle` | `MovimientoDetalleRead[]` | `movimientoDetalleService.list` | `useMovimientosDetalle` | `MovimientosPage` (tabla embebida en modal) |
| POST | `/movimientos-detalle` | `MovimientoDetalleCreate` | `movimientoDetalleService.create` | `useCreateMovimientoDetalle` | Parcial |
| GET | `/movimientos-detalle/{movimiento_detalle_id}` | `MovimientoDetalleRead` | `movimientoDetalleService.getById` | `useMovimientoDetalle` | Parcial |
| PUT | `/movimientos-detalle/{movimiento_detalle_id}` | `MovimientoDetalleUpdate` | `movimientoDetalleService.update` | `useUpdateMovimientoDetalle` | Parcial |

### Inventario físico

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/inventario-fisico` | `InventarioFisico` | `inventarioFisicoService.list` | `useInventariosFisicos` | `InventarioFisicoPage` |
| POST | `/inventario-fisico` | `InventarioFisicoCreate` | `inventarioFisicoService.create` | `useCreateInventarioFisico` | `InventarioFisicoPage` |
| GET | `/inventario-fisico/{inventario_fisico_id}` | `InventarioFisico` | `inventarioFisicoService.getById` | `useInventarioFisico` | `InventarioFisicoPage` (detalle/modal) |
| PUT | `/inventario-fisico/{inventario_fisico_id}` | `InventarioFisicoUpdate` | `inventarioFisicoService.update` | `useUpdateInventarioFisico` | Parcial |
| POST | `/inventario-fisico/{inventario_fisico_id}/anular` | — | `inventarioFisicoService.anular` | `useAnularInventarioFisico` | `InventarioFisicoPage` |
| POST | `/inventario-fisico/{inventario_fisico_id}/aprobar` | `AprobarInventarioFisicoRequest` | `inventarioFisicoService.aprobar` | `useAprobarInventarioFisico` | `InventarioFisicoPage` |

### Inventario físico — detalle (líneas)

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/inventario-fisico-detalle` | `InventarioFisicoDetalleRead[]` | `inventarioFisicoDetalleService.list` | `useInventariosFisicosDetalle` | `InventarioFisicoPage` (tabla embebida) |
| POST | `/inventario-fisico-detalle` | `InventarioFisicoDetalleCreate` | `inventarioFisicoDetalleService.create` | `useCreateInventarioFisicoDetalle` | Parcial |
| GET | `/inventario-fisico-detalle/{inventario_fisico_detalle_id}` | `InventarioFisicoDetalleRead` | `inventarioFisicoDetalleService.getById` | `useInventarioFisicoDetalle` | Parcial |
| PUT | `/inventario-fisico-detalle/{inventario_fisico_detalle_id}` | `InventarioFisicoDetalleUpdate` | `inventarioFisicoDetalleService.update` | `useUpdateInventarioFisicoDetalle` | Parcial |

### Kardex

| Método | Path | Types | Service | Hook | UI |
|---|---|---|---|---|---|
| GET | `/kardex` | `KardexLineaRead` | `kardexService.list` | `useKardex` | `KardexPage` |

---

## 3) Confirmaciones (requisitos Fase 4)

### Componentes eliminados

- **No** se eliminaron páginas, layout ni entradas de `routes.tsx` del módulo INV.

### Uso de `any`

- Verificación sobre `src/features/inv/**/*.{ts,tsx}`: **sin** coincidencias de `any` tras tipar el `catch` de `stockService.getByProductoAlmacen` como `unknown` y comprobar con `axios.isAxiosError`.

### Cadena Types → Service → Hook → Pantalla **por cada endpoint del contrato**

- **Types + Service**: presentes para las 58 operaciones INV cubiertas en `INV_API.json` correspondientes al prefijo `/inv/` (los DTO están repartidos en `inv.types.ts` según entidad/request).
- **Hooks React Query**: implementados por entidad en Fase 3 para lista/detalle/mutaciones acordadas; **excepción**: no se añadieron mutaciones React Query para `POST/PUT /stock` (solo service).
- **Pantalla consumidora**: **todas** las operaciones tienen al menos types + service; **no todas** tienen botón/formulario dedicado — los huecos conscientes están marcados como **Parcial** en la tabla anterior (principalmente: alta/edición cabecera de movimiento, edición cabecera inventario físico, CRUD de líneas en UI, alta/edición manual de stock, y consultas auxiliares de stock por id / producto-almacén vía hooks sin uso).

### RBAC y estados UX

- Fase 3/4 incorporó chequeos `can('inv', …)` en acciones de maestros, flujo de movimientos e inventario físico, y manejo de loading/error/lista vacía en las páginas migradas — detalle granular por archivo ya cubierto en la auditoría y en el código de cada `*Page.tsx`.

### Nota técnica (persistente desde auditoría)

- El service INV sigue usando la instancia `api` central (`@/core/api/api`). El proyecto también expone API híbrida (`useApi` / `getApiInstance`). Si el despliegue exige empresa on-premise para INV, habría que alinear esa capa **fuera del alcance** de esta Fase 4 descriptiva.

---

## 4) Resumen

Implementación INV al cierre de Fase 3 + verificación Fase 4:

- Cobertura **completa** en frontend para maestros (CRUD + baja/reactivación + React Query), listados transaccionales con **detalle embebido y acciones de flujo** donde se solicitó en Fase 3, kardex, stock por listado **y alertas**.
- Pendientes funcionales opcionales (no bloquean la verificación documental honesta): formularios de **crear/editar movimiento**, **editar inventario físico**, **mantenimiento de líneas** desde UI y **mantenimiento directo de saldos** vía endpoints de stock POST/PUT.
