# AUDITORIA FRONTEND — Módulo INV (Inventarios y Almacenes)

Fuente de verdad: `docs/api/INV_API.json` (paths bajo `/api/v1/inv/...`).

## Resumen ejecutivo

- **Contrato INV**: 58 operaciones (`/api/v1/inv/...`).
- **Implementación frontend detectada**: existe estructura base del módulo en `src/features/inv/` con:
  - **Rutas**: `src/features/inv/routes.tsx`
  - **Páginas**: 9 páginas (categorías, unidades, productos, almacenes, stock, tipos movimiento, movimientos, inventario físico, kardex)
  - **Service layer**: `src/features/inv/services/inv.service.ts` (Axios)
  - **Types**: `src/features/inv/types/inv.types.ts`
- **React Query hooks (por entidad)**: **no se detectaron** en INV (las páginas hacen llamadas directas desde componentes).
- **RBAC**:
  - Guard de ruta a nivel módulo: `PermissionGuard module="inv" action="ver"` en `src/app/router.tsx`.
  - **Acciones** (crear/editar/eliminar/etc.) dentro de páginas: **sin** validación granular detectada.

## Inventario de implementación actual detectada

### Archivos principales

- **Rutas**: `src/features/inv/routes.tsx`
- **Páginas**:
  - `src/features/inv/pages/CategoriasPage.tsx`
  - `src/features/inv/pages/UnidadesMedidaPage.tsx`
  - `src/features/inv/pages/ProductosPage.tsx`
  - `src/features/inv/pages/AlmacenesPage.tsx`
  - `src/features/inv/pages/StockPage.tsx`
  - `src/features/inv/pages/TiposMovimientoPage.tsx`
  - `src/features/inv/pages/MovimientosPage.tsx`
  - `src/features/inv/pages/InventarioFisicoPage.tsx`
  - `src/features/inv/pages/KardexPage.tsx`
- **Servicios (Axios)**: `src/features/inv/services/inv.service.ts`
- **Tipos**: `src/features/inv/types/inv.types.ts`
- **Layout**: `src/features/inv/components/InvPageLayout.tsx`

### Observación técnica relevante (multi-tenant / API híbrida)

- El service `src/features/inv/services/inv.service.ts` usa `api` desde `src/core/api/api.ts` (instancia central).
- En el proyecto existe `useApi()` y `getApiInstance()` para seleccionar instancia central vs local (hybrid). INV aún no usa ese patrón en su service.

## Evaluación por endpoint (contrato vs implementación)

Leyenda:
- **✔ Completo**: existe service + consumo en UI (y types razonables)
- **⚠ Parcial**: existe parcialmente (ej. falta delete/reactivar/acciones, falta hooks React Query, o no hay UI aunque exista service)
- **✖ Faltante**: no se detectó implementación en service/ UI

| Endpoint | Método | Service | Hook | Componente | Estado |
|---|---:|---|---|---|---|
| `/api/v1/inv/categorias` | GET | `categoriaService.list` | ✖ | `CategoriasPage` | ⚠ |
| `/api/v1/inv/categorias` | POST | `categoriaService.create` | ✖ | `CategoriasPage` | ⚠ |
| `/api/v1/inv/categorias/{categoria_id}` | GET | `categoriaService.getById` | ✖ | `CategoriasPage` (solo lista; no vista detalle) | ⚠ |
| `/api/v1/inv/categorias/{categoria_id}` | PUT | `categoriaService.update` | ✖ | `CategoriasPage` | ⚠ |
| `/api/v1/inv/categorias/{categoria_id}` | DELETE | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/categorias/{categoria_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/unidades-medida` | GET | `unidadMedidaService.list` | ✖ | `UnidadesMedidaPage` | ⚠ |
| `/api/v1/inv/unidades-medida` | POST | `unidadMedidaService.create` | ✖ | `UnidadesMedidaPage` | ⚠ |
| `/api/v1/inv/unidades-medida/{unidad_medida_id}` | GET | `unidadMedidaService.getById` | ✖ | `UnidadesMedidaPage` (solo lista) | ⚠ |
| `/api/v1/inv/unidades-medida/{unidad_medida_id}` | PUT | `unidadMedidaService.update` | ✖ | `UnidadesMedidaPage` | ⚠ |
| `/api/v1/inv/unidades-medida/{unidad_medida_id}` | DELETE | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/unidades-medida/{unidad_medida_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/productos` | GET | `productoService.list` | ✖ | `ProductosPage` | ⚠ |
| `/api/v1/inv/productos` | POST | `productoService.create` | ✖ | `ProductosPage` | ⚠ |
| `/api/v1/inv/productos/{producto_id}` | GET | `productoService.getById` | ✖ | `KardexPage`, `StockPage` (lookup), `MovimientosPage` (detalle movimiento usa getById de movimiento, no de producto) | ⚠ |
| `/api/v1/inv/productos/{producto_id}` | PUT | `productoService.update` | ✖ | `ProductosPage` | ⚠ |
| `/api/v1/inv/productos/{producto_id}` | DELETE | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/productos/{producto_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/almacenes` | GET | `almacenService.list` | ✖ | `AlmacenesPage`, (filtros en otras páginas) | ⚠ |
| `/api/v1/inv/almacenes` | POST | `almacenService.create` | ✖ | `AlmacenesPage` | ⚠ |
| `/api/v1/inv/almacenes/{almacen_id}` | GET | `almacenService.getById` | ✖ | `AlmacenesPage` (no vista detalle) | ⚠ |
| `/api/v1/inv/almacenes/{almacen_id}` | PUT | `almacenService.update` | ✖ | `AlmacenesPage` | ⚠ |
| `/api/v1/inv/almacenes/{almacen_id}` | DELETE | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/almacenes/{almacen_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/stock` | GET | `stockService.list` | ✖ | `StockPage` | ⚠ |
| `/api/v1/inv/stock` | POST | `stockService.create` | ✖ | ✖ | ⚠ |
| `/api/v1/inv/stock/{stock_id}` | GET | `stockService.getById` | ✖ | ✖ | ⚠ |
| `/api/v1/inv/stock/{stock_id}` | PUT | `stockService.update` | ✖ | ✖ | ⚠ |
| `/api/v1/inv/stock/producto/{producto_id}/almacen/{almacen_id}` | GET | `stockService.getByProductoAlmacen` | ✖ | ✖ | ⚠ |
| `/api/v1/inv/stock/alertas` | GET | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/tipos-movimiento` | GET | `tipoMovimientoService.list` | ✖ | `TiposMovimientoPage` | ⚠ |
| `/api/v1/inv/tipos-movimiento` | POST | `tipoMovimientoService.create` | ✖ | `TiposMovimientoPage` | ⚠ |
| `/api/v1/inv/tipos-movimiento/{tipo_movimiento_id}` | GET | `tipoMovimientoService.getById` | ✖ | `TiposMovimientoPage` (no vista detalle) | ⚠ |
| `/api/v1/inv/tipos-movimiento/{tipo_movimiento_id}` | PUT | `tipoMovimientoService.update` | ✖ | `TiposMovimientoPage` | ⚠ |
| `/api/v1/inv/tipos-movimiento/{tipo_movimiento_id}` | DELETE | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/tipos-movimiento/{tipo_movimiento_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/movimientos` | GET | `movimientoService.list` | ✖ | `MovimientosPage` | ⚠ |
| `/api/v1/inv/movimientos` | POST | `movimientoService.create` | ✖ | ✖ (no UI creación detectada en lectura parcial) | ⚠ |
| `/api/v1/inv/movimientos/{movimiento_id}` | GET | `movimientoService.getById` | ✖ | `MovimientosPage` (modal detalle) | ⚠ |
| `/api/v1/inv/movimientos/{movimiento_id}` | PUT | `movimientoService.update` | ✖ | ✖ (no UI edición detectada en lectura parcial) | ⚠ |
| `/api/v1/inv/{movimiento_id}/autorizar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/{movimiento_id}/procesar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/{movimiento_id}/anular` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/inventario-fisico` | GET | `inventarioFisicoService.list` | ✖ | `InventarioFisicoPage` | ⚠ |
| `/api/v1/inv/inventario-fisico` | POST | `inventarioFisicoService.create` | ✖ | `InventarioFisicoPage` (crear cabecera) | ⚠ |
| `/api/v1/inv/inventario-fisico/{inventario_fisico_id}` | GET | `inventarioFisicoService.getById` | ✖ | ✖ (no vista detalle detectada en lectura parcial) | ⚠ |
| `/api/v1/inv/inventario-fisico/{inventario_fisico_id}` | PUT | `inventarioFisicoService.update` | ✖ | ✖ | ⚠ |
| `/api/v1/inv/inventario-fisico/{inventario_fisico_id}/anular` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/inventario-fisico/{inventario_fisico_id}/aprobar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/movimientos-detalle` | GET | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/movimientos-detalle` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/movimientos-detalle/{movimiento_detalle_id}` | GET | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/movimientos-detalle/{movimiento_detalle_id}` | PUT | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/inventario-fisico-detalle` | GET | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/inventario-fisico-detalle` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/inventario-fisico-detalle/{inventario_fisico_detalle_id}` | GET | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/inventario-fisico-detalle/{inventario_fisico_detalle_id}` | PUT | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/inv/kardex` | GET | `kardexService.list` | ✖ | `KardexPage` | ⚠ |

## Brechas detectadas (principales)

### Brechas de services (endpoints sin función)

- **Baja lógica y reactivación (maestros)**: faltan en service y UI:
  - `DELETE /categorias/{id}`, `POST /categorias/{id}/reactivar`
  - `DELETE /unidades-medida/{id}`, `POST /unidades-medida/{id}/reactivar`
  - `DELETE /productos/{id}`, `POST /productos/{id}/reactivar`
  - `DELETE /almacenes/{id}`, `POST /almacenes/{id}/reactivar`
  - `DELETE /tipos-movimiento/{id}`, `POST /tipos-movimiento/{id}/reactivar`
- **Acciones de flujo (movimientos / inventario físico)**: faltan:
  - Movimientos: `POST /inv/{movimiento_id}/autorizar`, `POST /inv/{movimiento_id}/procesar`, `POST /inv/{movimiento_id}/anular`
  - Inventario físico: `POST /inventario-fisico/{id}/anular`, `POST /inventario-fisico/{id}/aprobar`
- **Detalle (líneas)**: falta todo el conjunto:
  - Movimientos detalle: GET/POST + GET/PUT por id
  - Inventario físico detalle: GET/POST + GET/PUT por id
- **Stock**:
  - Falta `GET /stock/alertas`
  - Existen endpoints “internos” (create/update/getById/getByProductoAlmacen) pero **sin UI** detectada.

### Brechas de hooks (React Query)

- No se detectaron hooks tipo `useQuery/useMutation/useTenantQuery` en `src/features/inv`.
- Las páginas usan `useEffect + service` con estado local; esto incumple la regla del prompt maestro (**usar React Query para server state**).

### Brechas de tipado

- Se detectó uso de **`any`** en INV:
  - En páginas (params para filtros) y en `inv.service.ts` (catch).
- No se detectaron types para:
  - `MovimientoDetalle*` (Create/Read/Update)
  - `InventarioFisicoDetalle*` (Create/Read/Update)
  - `AprobarInventarioFisicoRequest` (existe en OpenAPI, no en types INV)
- No se validó aquí el alineamiento 1:1 de campos vs OpenAPI (la auditoría de campos se hace en Fase 3 por bloque de Types).

### Brechas de RBAC / tenant

- Existe guard a nivel ruta del módulo (ver), pero no se detectó:
  - protección granular de botones/acciones (crear/editar/anular/procesar/reactivar)
- `empresa_id` se usa como filtro en listados (OK), pero al estar en estado local debe vigilarse consistencia en todas las operaciones.

## Componentes potencialmente desalineados

- No se detectaron rutas/endpoints hardcodeados fuera del service; las páginas consumen `*Service` del módulo.
- El archivo `docs/api/INV_API.json` contiene también `/api/v1/inv-bill/...`; INV frontend no debería implementar esos endpoints (hay módulo `inv-bill` separado).

## Recomendación de priorización (para Fase 3)

- **Bloque 1 (Types)**: agregar types faltantes para detalles y requests de acciones.
- **Bloque 2 (Services)**: completar endpoints faltantes (delete/reactivar, acciones de flujo, detalle líneas, stock alertas).
- **Bloque 3 (Hooks)**: migrar consumo a React Query por entidad (patrón ORG).
- **Bloque 4 (UI)**: agregar vistas/acciones que faltan (detalle + líneas, autorizar/procesar/anular/aprobar, reactivar/baja lógica) y RBAC granular.

