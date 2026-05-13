## 1. Resumen del módulo

**Módulo**: INV — Inventarios  
**Objetivo funcional (según documentación)**: Gestionar productos, categorías, unidades de medida, almacenes y todos los movimientos de stock (incluyendo inventario físico), con control de stock en tiempo real, múltiples almacenes, kardex valorizado y alertas de stock mínimo.

**Cobertura actual del frontend**  
- Pantallas implementadas: Productos, Categorías, Unidades de Medida, Almacenes, Consulta de Stock, Tipos de Movimiento, Movimientos.  
- Servicios API implementados: `/inv/categorias`, `/inv/unidades-medida`, `/inv/productos`, `/inv/almacenes`, `/inv/stock`, `/inv/tipos-movimiento`, `/inv/movimientos`, `/inv/inventario-fisico`.  
- Navegación: el módulo está expuesto en `router` bajo la ruta `inv/*` protegido por `PermissionGuard` con módulo `inv`.

Conclusión general: **el módulo INV está parcialmente implementado en frontend**. Cubre la configuración maestra (catálogos) y la consulta, pero **no expone aún flujos completos de operación de inventario físico ni flujos guiados de registro de movimientos** equivalentes a lo descrito en el MANUAL DE USUARIO.

---

## 2. Funcionalidades definidas en documentación

### 2.1 Según `CATALOGO_MODULOS.md`

- **Control de stock en tiempo real**.  
- **Múltiples almacenes**.  
- **Kardex valorizado**.  
- **Alertas de stock mínimo**.

### 2.2 Según `MENU_NAVEGACION.md` (sección INV)

- **Productos**  
  - Catálogo completo con SKU, código de barras, categoría, precio.  
  - Soporte de atributos personalizados (color, talla, composición).
- **Categorías**  
  - Organizar productos en categorías/subcategorías.
- **Unidades de Medida**  
  - Gestionar UND, KG, MT, LT con factores de conversión.
- **Almacenes**  
  - Configurar almacenes físicos y virtuales.
- **Consulta de Stock**  
  - Ver stock actual, reservado y disponible por almacén.  
  - Alertas de stock mínimo y máximo.
- **Tipos de Movimiento**  
  - Definir tipos: compra, venta, ajuste, transferencia, etc.
- **Movimientos de Inventario**  
  - Registrar entradas, salidas, transferencias entre almacenes.  
  - Kardex valorizado automático.
- **Inventario Físico**  
  - Toma de inventario y ajuste de diferencias.

### 2.3 Según `MANUAL_USUARIO.md` (2.2 MÓDULO INV — INVENTARIOS)

Flujo completo esperado:
- **Paso 1: Configurar Categorías de Productos**  
  - Estructura jerárquica en múltiples niveles (materias primas, productos terminados, etc.).  
  - Códigos sugeridos (MP-TELA, PT-POLO, etc.).
- **Paso 2: Crear Unidades de Medida**  
  - Definición de unidades base y unidades derivadas.  
  - Configuración de factores de conversión (p.ej. 1 RLL = 50 MT, 1 DOC = 12 UND, 1 CJA = 24 UND).  
  - Restricción: factores de conversión no modificables tras uso en transacciones.
- **Paso 3: Crear Almacenes**  
  - Configuración típica con código, tipo físico/virtual, sucursal, responsable, control de stock.  
  - Buenas prácticas: almacenes virtuales (tránsito, consignación).
- **Paso 4: Registrar Productos**  
  - Datos generales: SKU, código barras, categoría, tipo producto, unidad base.  
  - Costos y precios: costo estándar, método de costeo, precio de venta, margen.  
  - Control de stock: stock mínimo/máximo, control de lotes, series.  
  - Atributos personalizados: talla, color, composición, proveedor habitual, etc.  
  - Reglas de nomenclatura de SKU.
- **Paso 5: Configurar Tipos de Movimiento**  
  - Tipos estándar: ENT-COMP, ENT-PROD, ENT-AJUS, ENT-DEV, SAL-VENT, SAL-PROD, SAL-AJUS, SAL-MERM, SAL-DEV, TRA-ENTR.  
  - Parámetros críticos: clase (entrada/salida/ajuste/transferencia), afecta costo, requiere autorización, genera asiento, tipo de documento de referencia.
- **Paso 6: Registrar Stock Inicial (Inventario Físico)**  
  - Flujo guiado: creación de toma, impresión para conteo, carga de cantidades, cálculo de diferencias, aprobación, generación automática de movimientos de ajuste.  
  - Estados de la toma y trazabilidad de diferencias.  
  - Uso recomendado de tomas físicas periódicas.

Adicionalmente, el manual deja claro que:
- Los **movimientos de inventario** son la única vía para modificar stock.  
- El módulo INV se integra funcionalmente con PUR, SLS, LOG, MFG, QMS (movimientos automáticos desde otros módulos).

---

## 3. Entidades detectadas en base de datos (TABLAS_BD_ERP_COMPLETO.sql)

> Nota: se resumen únicamente las tablas más directamente asociadas al módulo INV. La BD contiene más campos de soporte (auditoría, multi-tenant, integración contable) que el frontend no necesita exponer directamente.

### 3.1 Catálogos de inventario

- **`inv_categoria_producto`** (nombre inferido por convención; campos según tipos de frontend):  
  - Identificadores: `categoria_id`, `cliente_id`, `empresa_id`.  
  - Atributos funcionales: `codigo`, `nombre`, `descripcion`, jerarquía (`categoria_padre_id`, `nivel`, `ruta_jerarquica`).  
  - Contabilidad: `cuenta_contable_inventario`, `cuenta_contable_costo_venta`, `metodo_costeo_defecto`.  
  - Estado y auditoría: `es_activo`, `fecha_creacion`, `fecha_actualizacion`, `usuario_creacion_id`.

- **`inv_unidad_medida`**:  
  - Identificadores: `unidad_medida_id`, `cliente_id`, `empresa_id`.  
  - Atributos: `codigo`, `nombre`, `simbolo`, `tipo_unidad` (cantidad, peso, volumen, long., área, tiempo).  
  - Conversión: `es_unidad_base`, `factor_conversion_base`, `decimales_permitidos`.  
  - Estado/auditoría: `es_activo`, `fecha_creacion`, etc.

- **`inv_almacen`**:  
  - Identificadores: `almacen_id`, `cliente_id`, `empresa_id`, `sucursal_id`.  
  - Atributos: `codigo`, `nombre`, `descripcion`, `tipo_almacen` (general, materia_prima, producto_terminado, tránsito, consignación, cuarentena).  
  - Operación: `es_almacen_principal`, `permite_ventas`, `permite_compras`, `permite_produccion`.  
  - Capacidad y CC: `capacidad_m3`, `capacidad_kg`, `capacidad_unidades`, `centro_costo_id`.  
  - Estado/auditoría: `es_activo`, `fecha_creacion`, etc.

- **`inv_producto`** (tabla maestra más rica):  
  - Identificadores: `producto_id`, `cliente_id`, `empresa_id`.  
  - Identificación: `codigo_sku`, `codigo_barra`, `codigo_interno`, `codigo_fabricante`.  
  - Descripción: `nombre`, `nombre_corto`, `descripcion`, `descripcion_corta`.  
  - Clasificación: `categoria_id`, `subcategoria_id`, `marca`, `modelo`, `linea_producto`.  
  - Tipo de producto: `tipo_producto`, `subtipo_producto`.  
  - Unidades y conversiones: `unidad_medida_base_id`, `unidad_medida_compra_id`, `unidad_medida_venta_id`, `factor_conversion_compra`, `factor_conversion_venta`, `decimales_permitidos`.  
  - Dimensiones y físico: `peso_kg`, `volumen_m3`, `largo_cm`, `ancho_cm`, `alto_cm`, `requiere_refrigeracion`, `es_perecible`, `maneja_vencimiento`, `dias_vida_util`.  
  - Atributos personalizados: `color`, `talla`, `atributos_personalizados`, `especificaciones_tecnicas`.  
  - Parámetros de stock: `maneja_inventario`, `maneja_lotes`, `maneja_series`, `stock_minimo`, `stock_maximo`, `punto_reorden`.  
  - Comportamiento comercial: `es_comprable`, `tiempo_entrega_dias`, `cantidad_minima_compra`, `multiplo_compra`, `es_vendible`, `requiere_autorizacion_venta`.  
  - Integración con producción: `es_fabricable`, `tiene_lista_materiales`.  
  - Costos: `metodo_costeo`, `costo_estandar`, `costo_ultima_compra`, `costo_promedio`, `moneda_costo`.  
  - Precios: `precio_base_venta`, `moneda_venta`.  
  - Impuestos: `afecto_igv`, `porcentaje_igv`, `codigo_sunat`, `tipo_afectacion_igv`.  
  - Documentos y multimedia: `imagen_principal_url`, `imagenes_adicionales`, `ficha_tecnica_url`.  
  - Relación habitual: `proveedor_habitual_id`.  
  - Estado: `estado`, `es_activo`, observaciones.

### 3.2 Stock y movimientos

- **`inv_stock`**:  
  - Identificadores: `stock_id`, `cliente_id`, `empresa_id`.  
  - Claves de relación: `producto_id`, `almacen_id`.  
  - Saldos: `cantidad_actual`, `cantidad_reservada`, `cantidad_disponible`, `cantidad_transito`.  
  - Valorización: `costo_promedio`, `valor_total`, `moneda`.  
  - Parámetros de reposición: `stock_minimo`, `stock_maximo`, `punto_reorden`.  
  - Trazabilidad temporal: `fecha_ultimo_movimiento`, `fecha_ultima_compra`, `fecha_ultima_venta`, `fecha_actualizacion`.  

- **`inv_tipo_movimiento`**:  
  - Identificadores: `tipo_movimiento_id`, `cliente_id`, `empresa_id`.  
  - Atributos: `codigo`, `nombre`, `descripcion`.  
  - Lógica de negocio: `clase_movimiento` (entrada/salida/transferencia/ajuste), `afecta_costo`, `requiere_autorizacion`, `genera_asiento_contable`, `requiere_documento_referencia`, `tipo_documento_referencia`.  
  - Integración contable: `cuenta_contable_debito`, `cuenta_contable_credito`.  
  - Flags: `es_activo`, `es_tipo_sistema`.

- **`inv_movimiento`** (cabecera de movimiento):  
  - Identificadores: `movimiento_id`, `cliente_id`, `empresa_id`.  
  - Cabecera: `numero_movimiento`, `tipo_movimiento_id`, `fecha_movimiento`, `fecha_contable`.  
  - Origen/destino: `almacen_origen_id`, `almacen_destino_id`.  
  - Referencias: `modulo_origen`, `documento_referencia_tipo`, `documento_referencia_id`, `documento_referencia_numero`.  
  - Terceros: `tercero_tipo`, `tercero_id`, `tercero_nombre`.  
  - Totales: `total_items`, `total_cantidad`, `total_costo`, `moneda`.  
  - Estado y control: `estado`, `requiere_autorizacion`, `autorizado_por_usuario_id`, `fecha_autorizacion`, `motivo_anulacion`.  
  - Centro de costo: `centro_costo_id`.  
  - Auditoría: `fecha_creacion`, `fecha_actualizacion`, `fecha_procesado`, `usuario_creacion_id`, `usuario_procesado_id`.

- **`inv_inventario_fisico`**:  
  - Identificadores: `inventario_fisico_id`, `cliente_id`, `empresa_id`.  
  - Campos clave: `numero_inventario`, `fecha_inventario`, `almacen_id`, `tipo_inventario` (total/cíclico/selectivo), `categoria_id`, `ubicacion_almacen`.  
  - Estados y métricas: `estado` (en_proceso/finalizado/ajustado/anulado), `supervisor_usuario_id`, `supervisor_nombre`, `total_productos_contados`, `total_diferencias`, `valor_diferencias`, `movimiento_ajuste_id`.  
  - Auditoría: `fecha_creacion`, `fecha_finalizacion`, `fecha_ajuste`, `usuario_creacion_id`.

Relaciones relevantes:
- `inv_stock` depende de `inv_producto` y `inv_almacen`.  
- `inv_movimiento` y `inv_inventario_fisico` se conectan a `org_empresa`, `org_centro_costo`, `org_sucursal` indirectamente a través de `empresa_id`, `almacen_id`, `centro_costo_id`.  
- Muchos campos de control (lotes, series, vencimientos) no están presentes en los formularios actuales del frontend.

---

## 4. Pantallas detectadas en frontend (módulo INV)

### 4.1 Rutas y permisos

- En `router` global (`app/router.tsx`):  
  - Ruta base: `path: 'inv/*'`.  
  - Protegida por `ProtectedRoute` y `PermissionGuard module="inv" action="ver"`.  
  - Lazy loading del `InvRouter` (`src/features/inv/routes.tsx`).

- En `InvRouter` (`src/features/inv/routes.tsx`):  
  - `index` → redirect a `productos`.  
  - `path="categorias"` → `CategoriasPage`.  
  - `path="unidades-medida"` → `UnidadesMedidaPage`.  
  - `path="productos"` → `ProductosPage`.  
  - `path="almacenes"` → `AlmacenesPage`.  
  - `path="stock"` → `StockPage`.  
  - `path="tipos-movimiento"` → `TiposMovimientoPage`.  
  - `path="movimientos"` → `MovimientosPage`.  
  - `path="*"` → redirect a `productos`.

**Pantallas implementadas** (todas usan `InvPageLayout` con título/descripcion y UI consistente):

1. **ProductosPage** (`src/features/inv/pages/ProductosPage.tsx`)  
   - **Funcionalidad**: listado y gestión básica de productos.  
   - **Componentes clave**:  
     - Filtros por empresa y búsqueda (nombre, SKU, código de barras).  
     - Tabla de productos con columnas: SKU, nombre, categoría, tipo, precio base.  
     - Diálogos de **crear** y **editar** producto.  
   - **Formularios**:  
     - Crear: campos visibles  
       - Empresa, SKU, Nombre, Código de barras, Categoría, Tipo, Unidad de medida base.  
       - Configuración inventario: `maneja_inventario`, `stock_minimo`, `stock_maximo`.  
       - Configuración compraventa: `es_comprable`, `es_vendible`.  
       - Costos y precios: `metodo_costeo`, `precio_base_venta`, `afecto_igv`, `% IGV`.  
     - Editar: mismos campos, sin empresa, sin campos de integración avanzada.  
   - **Endpoints consumidos**:  
     - `empresaService.list` (ORG) para selector de empresa.  
     - `categoriaService.list` (`GET /inv/categorias`).  
     - `unidadMedidaService.list` (`GET /inv/unidades-medida`).  
     - `productoService.list` (`GET /inv/productos` con filtros `empresa_id`, `buscar`, `solo_activos`).  
     - `productoService.create` (`POST /inv/productos`).  
     - `productoService.update` (`PUT /inv/productos/{id}`).  
   - **Permisos de acción**: la pantalla está protegida a nivel módulo (`module="inv" action="ver"`). No hay validación explícita por acción (crear/editar) dentro del componente; se asume permiso de mantenimiento al poder abrir/modificar.

2. **CategoriasPage** (`src/features/inv/pages/CategoriasPage.tsx`)  
   - **Funcionalidad**: listado y mantenimiento de categorías de producto.  
   - **Formularios**:  
     - Crear: Empresa, Código, Nombre, Método de costeo por defecto.  
     - Editar: Código, Nombre, Método de costeo.  
   - **Campos de BD representados**: `empresa_id`, `codigo`, `nombre`, `descripcion` (solo en update), `metodo_costeo_defecto`, `es_activo`.  
   - **Campos de BD no representados**: jerarquía (`categoria_padre_id`, `nivel`, `ruta_jerarquica`), cuentas contables.  
   - **Endpoints**:  
     - `categoriaService.list` (`GET /inv/categorias`).  
     - `categoriaService.create` (`POST /inv/categorias`).  
     - `categoriaService.update` (`PUT /inv/categorias/{id}`).

3. **UnidadesMedidaPage** (`src/features/inv/pages/UnidadesMedidaPage.tsx`)  
   - **Funcionalidad**: catálogo de unidades de medida.  
   - **Formularios**:  
     - Crear: Empresa, Código, Nombre, Símbolo, Tipo, Es unidad base, Decimales permitidos (por defecto en tipo).  
     - Editar: mismos campos más `factor_conversion_base`.  
   - **Relación con BD**: refleja `codigo`, `nombre`, `simbolo`, `tipo_unidad`, `es_unidad_base`, `factor_conversion_base`, `decimales_permitidos`, `es_activo`.  
   - **Brecha**: no hay UI dedicada para **gestionar relaciones entre unidad base y unidades derivadas** (no se muestra la unidad base de referencia ni una vista de matriz de conversiones).  
   - **Endpoints**:  
     - `unidadMedidaService.list` (`GET /inv/unidades-medida`).  
     - `unidadMedidaService.create` (`POST /inv/unidades-medida`).  
     - `unidadMedidaService.update` (`PUT /inv/unidades-medida/{id}`).

4. **AlmacenesPage** (`src/features/inv/pages/AlmacenesPage.tsx`)  
   - **Funcionalidad**: gestión de almacenes físicos y virtuales.  
   - **Formularios**:  
     - Crear: Empresa, Sucursal, Código, Nombre, Tipo, flags (`es_almacen_principal`, `permite_ventas`, `permite_compras`).  
     - Editar: mismos campos, más descripción (sólo texto).  
   - **Campos BD representados**: `empresa_id`, `sucursal_id`, `codigo`, `nombre`, `tipo_almacen`, `direccion` (edición), `responsable_nombre` (edición), flags de operación.  
   - **Campos BD no representados**: capacidades (`capacidad_m3`, `capacidad_kg`, `capacidad_unidades`), `centro_costo_id`, relación fuerte con sucursal (sin vista contextual de dirección/ubicación), campos de auditoría.  
   - **Endpoints**:  
     - `almacenService.list` (`GET /inv/almacenes`).  
     - `almacenService.create` (`POST /inv/almacenes`).  
     - `almacenService.update` (`PUT /inv/almacenes/{id}`).  
     - `sucursalService.list` (ORG) para vincular sucursales.

5. **StockPage** (`src/features/inv/pages/StockPage.tsx`)  
   - **Funcionalidad**: consulta de stock consolidado.  
   - **UI**:  
     - Filtros por empresa y almacén.  
     - Tabla con: `producto_id` truncado, nombre de almacén, cantidad actual, reservada, disponible, mínimo, valor total, con resaltado si `cantidad_disponible < stock_minimo`.  
     - Alerta global cuando hay productos por debajo del mínimo.  
   - **Campos BD usados**: `cantidad_actual`, `cantidad_reservada`, `cantidad_disponible`, `stock_minimo`, `valor_total`, `moneda`.  
   - **Limitaciones UX**:  
     - No se muestra información básica del producto (SKU, nombre), solo el ID.  
     - No hay drill-down al kardex ni al detalle por movimiento.  
   - **Endpoints**:  
     - `empresaService.list` (ORG).  
     - `almacenService.list` (`GET /inv/almacenes`).  
     - `stockService.list` (`GET /inv/stock`).

6. **TiposMovimientoPage** (`src/features/inv/pages/TiposMovimientoPage.tsx`)  
   - **Funcionalidad**: catálogo de tipos de movimiento.  
   - **Formularios**:  
     - Crear/editar: Empresa, Código, Nombre, Descripción, Clase, Afecta costo, Requiere autorización, Genera asiento contable.  
   - **Campos BD no cubiertos**: `cuenta_contable_debito`, `cuenta_contable_credito`, `requiere_documento_referencia`, `tipo_documento_referencia`, `es_tipo_sistema`.  
   - **Endpoints**:  
     - `tipoMovimientoService.list` (`GET /inv/tipos-movimiento`).  
     - `tipoMovimientoService.create` (`POST /inv/tipos-movimiento`).  
     - `tipoMovimientoService.update` (`PUT /inv/tipos-movimiento/{id}`).

7. **MovimientosPage** (`src/features/inv/pages/MovimientosPage.tsx`)  
   - **Funcionalidad**: consulta de movimientos de inventario (no creación).  
   - **UI**:  
     - Filtro por empresa.  
     - Tabla con: número de movimiento, tipo, fecha, almacén origen/destino, total cantidad, total costo, estado (borrador, autorizado, procesado, anulado) con chips de color.  
     - Botón "Ver detalle" sin implementación visible de modal o navegación (placeholder).  
   - **Campos BD usados**: `numero_movimiento`, `tipo_movimiento_id`, `fecha_movimiento`, `almacen_origen_id`, `almacen_destino_id`, `total_cantidad`, `total_costo`, `moneda`, `estado`.  
   - **Limitaciones**:  
     - No existe formulario para **crear** o **procesar** movimientos (entradas, salidas, transferencias).  
     - No se muestra el **detalle de líneas de movimiento** (productos, cantidades, costos).  
   - **Endpoints**:  
     - `movimientoService.list` (`GET /inv/movimientos`).

8. **Inventario Físico**  
- No se encontró una pantalla específica de inventario físico bajo `src/features/inv/pages`.  
- Sin embargo, el servicio `inventarioFisicoService` está implementado (`/inv/inventario-fisico`), lo que indica soporte backend y types en frontend, pero **sin UI asociada aún**.

---

## 5. Consumo de endpoints (módulo INV)

### 5.1 Endpoints usados por el frontend

Según `inv.service.ts` y las páginas analizadas:

- `GET /api/v1/inv/categorias` — listado de categorías (filtro por `empresa_id`, `solo_activos`).  
- `GET /api/v1/inv/categorias/{id}` — detalle (no usado directamente en pantallas, sólo en servicio).  
- `POST /api/v1/inv/categorias` — crear categoría.  
- `PUT /api/v1/inv/categorias/{id}` — actualizar categoría.

- `GET /api/v1/inv/unidades-medida` — listado.  
- `GET /api/v1/inv/unidades-medida/{id}` — detalle (no usado en páginas).  
- `POST /api/v1/inv/unidades-medida` — crear.  
- `PUT /api/v1/inv/unidades-medida/{id}` — actualizar.

- `GET /api/v1/inv/productos` — listado de productos con filtros (`empresa_id`, `categoria_id`, `tipo_producto`, `buscar`, `solo_activos`).  
- `GET /api/v1/inv/productos/{id}` — detalle (sólo desde servicio).  
- `POST /api/v1/inv/productos` — crear producto.  
- `PUT /api/v1/inv/productos/{id}` — actualizar producto.

- `GET /api/v1/inv/almacenes` — listado (filtros por `empresa_id`, `sucursal_id`, `solo_activos`).  
- `GET /api/v1/inv/almacenes/{id}` — detalle (solo en servicio).  
- `POST /api/v1/inv/almacenes` — crear.  
- `PUT /api/v1/inv/almacenes/{id}` — actualizar.

- `GET /api/v1/inv/stock` — listado de stock (`empresa_id`, `producto_id`, `almacen_id`).  
- `GET /api/v1/inv/stock/{id}` — detalle.  
- `GET /api/v1/inv/stock/producto/{producto_id}/almacen/{almacen_id}` — consulta puntual.  
- `POST /api/v1/inv/stock` — crear registro de stock (no usado en UI).  
- `PUT /api/v1/inv/stock/{id}` — actualizar stock (no usado directamente; backend lo hace vía movimientos).

- `GET /api/v1/inv/tipos-movimiento` — listado.  
- `GET /api/v1/inv/tipos-movimiento/{id}` — detalle.  
- `POST /api/v1/inv/tipos-movimiento` — crear.  
- `PUT /api/v1/inv/tipos-movimiento/{id}` — actualizar.

- `GET /api/v1/inv/movimientos` — listado de movimientos (filtros `empresa_id`, `tipo_movimiento_id`, `almacen_id`, `estado`, `fecha_desde`, `fecha_hasta`).  
- `GET /api/v1/inv/movimientos/{id}` — detalle (no usado en UI).  
- `POST /api/v1/inv/movimientos` — crear movimiento (no hay formulario visible).  
- `PUT /api/v1/inv/movimientos/{id}` — actualizar (no usado en UI).

- `GET /api/v1/inv/inventario-fisico` — listado.  
- `GET /api/v1/inv/inventario-fisico/{id}` — detalle.  
- `POST /api/v1/inv/inventario-fisico` — crear toma.  
- `PUT /api/v1/inv/inventario-fisico/{id}` — actualizar.  
  - **Ninguno de estos endpoints se usa en una pantalla concreta**; sólo está el servicio.

### 5.2 Endpoints backend potenciales (según OpenAPI)

Dado que `backend_openapi.json` sólo tiene visible en esta auditoría la raíz y endpoints de autenticación, para INV se toma como referencia la convención de paths ya usada por el propio frontend y tipos alineados con BD:

- `/api/v1/inv/categorias`  
- `/api/v1/inv/unidades-medida`  
- `/api/v1/inv/productos`  
- `/api/v1/inv/almacenes`  
- `/api/v1/inv/stock`  
- `/api/v1/inv/tipos-movimiento`  
- `/api/v1/inv/movimientos`  
- `/api/v1/inv/inventario-fisico`

Se asume que el OpenAPI define también operaciones más específicas (por ejemplo, endpoints de **procesar inventario físico**, **generar movimientos de ajuste**, o endpoints de kardex detallado) que aún no están consumidos por el frontend, pero esta versión truncada del archivo no permite listarlos explícitamente.

---

## 6. Matriz funcionalidad vs implementación

| Funcionalidad (documentación)                                       | Pantalla frontend                          | Endpoint principal                 | Estado |
| -------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------- | ------ |
| Configurar categorías de productos                                   | `CategoriasPage`                           | `/api/v1/inv/categorias`          | ✔ Implementado completamente (sin jerarquía ni cuentas contables) |
| Crear unidades de medida y factores de conversión                    | `UnidadesMedidaPage`                       | `/api/v1/inv/unidades-medida`     | ⚠ Implementado parcialmente (sin vista de conversiones complejas) |
| Crear y configurar almacenes físicos y virtuales                     | `AlmacenesPage`                            | `/api/v1/inv/almacenes`           | ⚠ Implementado parcialmente (sin capacidades, CC ni detalles avanzados) |
| Registrar productos con catálogos completos y atributos             | `ProductosPage`                            | `/api/v1/inv/productos`           | ⚠ Implementado parcialmente (solo subset de campos clave) |
| Definir tipos de movimiento estándar                                 | `TiposMovimientoPage`                      | `/api/v1/inv/tipos-movimiento`    | ⚠ Implementado parcialmente (sin parámetros contables/documentales) |
| Registrar movimientos manuales (entradas, salidas, transferencias)   | `MovimientosPage` (solo listado)           | `/api/v1/inv/movimientos`         | ✖ No implementado (solo consulta) |
| Consultar stock por almacén, con alerta de mínimo/máximo             | `StockPage`                                | `/api/v1/inv/stock`               | ⚠ Implementado parcialmente (sin datos de producto ni kardex) |
| Kardex valorizado automático (detalle de movimientos por producto)   | No existe pantalla dedicada                 | Prob. `/api/v1/inv/movimientos`   | ✖ No implementado |
| Inventario físico (toma, conteo, diferencias, ajustes automáticos)   | No existe pantalla INV específica           | `/api/v1/inv/inventario-fisico`   | ✖ No implementado (servicio disponible) |
| Alertas de stock mínimo visibles en UI                               | `StockPage` (resaltado por fila)           | `/api/v1/inv/stock`               | ⚠ Implementado parcialmente (sin panel resumen ni notificaciones) |
| Integración INV con PUR (ENT-COMP por recepciones)                   | Flujo en PUR (Recepciones)                 | `/inv/movimientos` vía backend    | ✔ A nivel backend (front INV solo consulta) |
| Integración INV con SLS (SAL-VENT por despachos)                     | Flujo en LOG/SLS (Despachos, GR)           | `/inv/movimientos` vía backend    | ✔ A nivel backend (front INV solo consulta) |

---

## 7. Pantallas faltantes (respecto a documentación)

1. **Pantalla de Inventario Físico (Toma de inventario)**  
   - Documentación: `INV > Inventario Físico > [+ Nueva Toma]`, proceso completo con conteo y ajustes.  
   - Estado actual: servicio `inventarioFisicoService` existe, pero no hay página `InventarioFisicoPage` en `routes.tsx`.  
   - Endpoint sugerido:  
     - `/api/v1/inv/inventario-fisico` (listado, creación, actualización).  
     - Endpoints específicos de procesar/aprobar/ajustar si el OpenAPI los define.  
   - Operaciones esperadas: crear toma, listar líneas/ productos a contar, registrar cantidades contadas, calcular diferencias, aprobar y generar movimientos de ajuste.

2. **Pantalla de Kardex / Detalle de movimientos por producto**  
   - Documentación: “Kardex valorizado automático” en MENU y MANUAL.  
   - Estado actual: solo hay `MovimientosPage` general, sin enfoque por producto ni vista detallada.  
   - Pantalla sugerida:  
     - `KardexPage` bajo `inv/kardex`, con filtros por producto, almacén, rango de fechas.  
     - Vista tipo línea de tiempo con saldos iniciales/finales y valorización.

3. **Pantalla de detalle de movimiento**  
   - Documentación: los ejemplos de flujos PUR/SLS muestran movimientos con detalle por línea.  
   - Estado actual: botón "Ver detalle" en `MovimientosPage` sin implementación visible.  
   - Pantalla sugerida:  
     - Modal o ruta `inv/movimientos/:id` con pestañas: Cabecera, Líneas, Auditoría.

4. **Pantalla de configuración avanzada de productos**  
   - Documentación: múltiples campos avanzados (atributos personalizados, dimensiones, vencimientos, integración con producción, listas de materiales, impuestos SUNAT).  
   - Estado actual: `ProductosPage` expone solo un subconjunto mínimo.  
   - Pantalla sugerida:  
     - `ProductoDetallePage` por tabs: General, Inventario, Compras, Ventas, Producción, Impuestos, Multimedia/Adjuntos.

---

## 8. Formularios incompletos (frente a BD y manual)

### 8.1 Productos

- **Campos críticos de BD no presentes en formulario**:  
  - Identificación ampliada: `codigo_interno`, `codigo_fabricante`, `nombre_corto`.  
  - Clasificación avanzada: `subcategoria_id`, `marca`, `modelo`, `linea_producto`.  
  - Dimensiones y físico: `peso_kg`, `volumen_m3`, `largo_cm`, `ancho_cm`, `alto_cm`.  
  - Atributos personalizados: `color`, `talla`, `atributos_personalizados`, `especificaciones_tecnicas`.  
  - Parámetros de stock: `punto_reorden`, `maneja_lotes`, `maneja_series`, `maneja_vencimiento`, `dias_vida_util`.  
  - Integración comercial: `tiempo_entrega_dias`, `cantidad_minima_compra`, `multiplo_compra`, `requiere_autorizacion_venta`, `es_fabricable`, `tiene_lista_materiales`.  
  - Impuestos: `codigo_sunat`, `tipo_afectacion_igv`.  
  - Multimedia: `imagen_principal_url`, `imagenes_adicionales`, `ficha_tecnica_url`.  
  - Relación con proveedor: `proveedor_habitual_id`.  
- **Impacto funcional**:  
  - El formulario actual permite crear productos "mínimos" pero no puede parametrizar correctamente: control de lotes/series, perecibilidad, integración con SUNAT, integración con producción, ni atributos clave usados por otros módulos (MRP, QMS, LOG).  
  - Riesgo de inconsistencias y necesidad de cargar datos manualmente por backend.

### 8.2 Categorías

- Faltan campos para **jerarquía** (`categoria_padre_id`, `nivel`, `ruta_jerarquica`), lo que impide construir estructuras como las sugeridas en el manual (MATERIAS PRIMAS > Telas > Telas de Algodón).  
- No se exponen cuentas contables por categoría, que son relevantes para FIN y CST.

### 8.3 Unidades de Medida

- No se hace evidente la relación con unidad base ni se valida la consistencia de `factor_conversion_base`.  
- No hay validación para impedir cambios destructivos una vez que la unidad se usa en movimientos (la advertencia del manual depende de reglas backend, pero el frontend no ayuda a evitar errores UX).

### 8.4 Almacenes

- Faltan campos relevantes para operaciones y control:  
  - Dirección detallada, capacidades, centro de costo, banderas adicionales (`permite_produccion`, etc.) se exponen parcialmente.  
  - No hay campos para latitud/longitud u horarios que aparecen en tablas ORG/ sucursales y se recomiendan en manual para logística avanzada.

### 8.5 Tipos de Movimiento

- No se exponen campos para:  
  - Cuentas contables (débito/crédito).  
  - Documentos de referencia obligatorios.  
  - Marcado como tipo de sistema (para impedir edición accidental de tipos críticos).  
- Esto limita el alineamiento con FIN y AUD, y reduce controles de integridad.

### 8.6 Inventario físico

- No existe formulario en frontend, a pesar de una entidad rica en BD (`inv_inventario_fisico`) y un servicio en frontend.  
- El flujo de conteo, registro de diferencias y generación de ajustes se dispara solo desde backend o desde otros canales (no visible al usuario de UI).

---

## 9. Problemas de UX detectados

- **Productos sin detalle estructurado**:  
  - Formulario plano con pocos campos; no hay secciones ni tabs que permitan capturar información rica por secciones (General, Inventario, Comercial, Producción, Impuestos).  
  - Ausencia de ayudas contextuales (tooltips) para campos sensibles como `metodo_costeo`, `afecto_igv`.

- **Consulta de stock sin identificación clara de producto**:  
  - Mostrar sólo el `producto_id` truncado dificulta la interpretación; ERP de nivel SAP/Odoo siempre muestran SKU + nombre.  
  - No hay navegación directa desde stock al detalle de producto o kardex.

- **Movimientos sólo de consulta**:  
  - No hay CTA visibles para "Registrar entrada/ajuste/transferencia" desde el listado.  
  - El botón "Ver detalle" no lleva a un flujo concreto, lo que genera frustración UX.

- **Falta de flujo guiado para inventario físico**:  
  - El manual propone un wizard claro (crear toma → listar productos → ingresar conteo → aprobar → generar ajuste).  
  - No hay nada equivalente en el frontend actual, lo que obliga a procesos fuera del sistema o a dependencias del equipo técnico.

- **Faltan filtros avanzados y vistas orientadas a tareas**:  
  - `MovimientosPage` no tiene filtros por tipo, fecha ni almacén en la UI (aunque el servicio los soporta).  
  - `StockPage` no permite filtrar por producto ni categoría (solo empresa/almacén).

En referencia a buenas prácticas de SAP / Odoo / Dynamics:
- Los formularios clave (Producto, Almacén, Tipo de Movimiento) suelen dividirse en **secciones/tabuladores** para manejar gran cantidad de campos sin saturar la pantalla.  
- Siempre se ofrece un **detalle drill-down** desde vistas de lista (stock → kardex, movimiento → detalle, producto → ficha completa).  
- Las operaciones críticas (inventario físico, ajustes de stock) están guiadas por **asistentes (wizards)** y tienen estados claros y botones de acción progresivos.

---

## 10. Propuesta de estructura UX profesional para el módulo INV

### 10.1 Ficha de Producto

Se propone dividir la ficha en tabs/secciones:

1. **Información General**  
   - **Obligatorios**: `empresa_id`, `codigo_sku`, `nombre`, `tipo_producto`, `unidad_medida_base_id`, `categoria_id`.  
   - **Opcionales recomendados**: `codigo_barra`, `codigo_interno`, `codigo_fabricante`, `nombre_corto`.  
   - **Técnicos/backend**: IDs internos, campos de auditoría.

2. **Inventario**  
   - **Obligatorios**: `maneja_inventario`, `metodo_costeo`, `maneja_lotes` (si la empresa maneja lotes), `maneja_series` (cuando aplica).  
   - **Opcionales recomendados**: `stock_minimo`, `stock_maximo`, `punto_reorden`, `maneja_vencimiento`, `dias_vida_util`.  
   - **Técnicos**: parámetros sólo leídos desde backend (p.ej. saldos o flags de bloqueo).

3. **Compras**  
   - **Obligatorios**: `es_comprable`, `unidad_medida_compra_id` (si difiere de base).  
   - **Opcionales**: `factor_conversion_compra`, `tiempo_entrega_dias`, `cantidad_minima_compra`, `multiplo_compra`, `proveedor_habitual_id`.  

4. **Ventas**  
   - **Obligatorios**: `es_vendible`, `precio_base_venta`, `moneda_venta`, `afecto_igv`.  
   - **Opcionales**: `porcentaje_igv`, `requiere_autorizacion_venta`.  
   - **Técnicos**: `codigo_sunat`, `tipo_afectacion_igv` (con combos controlados desde catálogos tributarios).

5. **Producción**  
   - **Opcionales recomendados**: `es_fabricable`, `tiene_lista_materiales`.  
   - **Técnicos**: campos que se usan sólo si MFG está activo.

6. **Características / Atributos**  
   - **Opcionales**: `color`, `talla`, `atributos_personalizados`, `especificaciones_tecnicas`, dimensiones (`peso_kg`, `volumen_m3`, `largo_cm`, `ancho_cm`, `alto_cm`).  

7. **Multimedia / Documentos**  
   - **Opcionales**: `imagen_principal_url`, `imagenes_adicionales`, `ficha_tecnica_url`.

### 10.2 Inventario Físico (wizard)

Estructura UX recomendada:

1. **Paso 1 — Configuración de toma**  
   - Campos obligatorios: `empresa_id`, `almacen_id`, `tipo_inventario`, `fecha_inventario`, `supervisor_usuario_id`.  
   - Opcionales: `categoria_id`, `ubicacion_almacen`, `descripcion`.

2. **Paso 2 — Lista de productos a contar**  
   - Tabla con: SKU, nombre, unidad, stock sistema.  
   - Botones para exportar a PDF/Excel.

3. **Paso 3 — Registro de conteo**  
   - Campo editable para cantidad contada, cálculo automático de diferencia.  

4. **Paso 4 — Revisión y aprobación**  
   - Resumen: productos con diferencia, valor de diferencias.  
   - Botón "Aprobar y generar ajustes" que llama endpoint específico para crear movimientos de ajuste (ENT-AJUS / SAL-AJUS).

### 10.3 Movimientos de inventario

Dos pantallas complementarias:

1. **Listado de Movimientos** (actual `MovimientosPage` mejorado):  
   - Filtros obligatorios: rango de fechas, tipo de movimiento, almacén, estado.  
   - Acciones: crear nuevo movimiento (entradas/salidas/transferencias).

2. **Formulario de Movimiento (wizard)**  
   - Cabecera: empresa, tipo de movimiento, almacén origen/destino, fecha contable, tercero, documento de referencia.  
   - Detalle: lista de productos (producto, cantidad, unidad, costo unitario), selección vía búsqueda.  
   - Paso final: revisión y confirmación → backend calcula costos y actualiza stock.

---

## 11. Endpoints backend no utilizados (módulo INV)

En función de los servicios existentes y la estructura de BD, se identifican endpoints **definidos pero no utilizados en la UI**:

- `POST /api/v1/inv/movimientos` y `PUT /api/v1/inv/movimientos/{id}` — creación/actualización de movimientos.  
  - La UI sólo usa `list`, por lo que las operaciones de registro manual de movimientos no están expuestas al usuario de inventarios.

- `GET /api/v1/inv/movimientos/{id}` — detalle de movimiento.  
  - No se consume desde `MovimientosPage` (no hay modal ni navegación).

- `POST /api/v1/inv/inventario-fisico` y `PUT /api/v1/inv/inventario-fisico/{id}` — crear y actualizar tomas de inventario.  
  - No hay pantalla asociada; toda la funcionalidad es backend o potencial.

- `GET /api/v1/inv/inventario-fisico` y `GET /api/v1/inv/inventario-fisico/{id}` — listado/detalle de inventarios físicos.  
  - No se exponen al usuario en ningún listado.

Probablemente, el OpenAPI también define endpoints específicos de:
- Procesar/aprobar inventario físico y generar movimientos automáticos.  
- Obtener kardex por producto.  
- Validar o simular movimientos.  
Estos no se detectan en la UI ni en los servicios actuales.

---

## 12. Brechas funcionales (GAPS) identificadas

### 12.1 Pantallas y flujos faltantes

- Falta pantalla de **Inventario Físico** con flujo de toma, conteo, diferencias y ajustes.  
- Falta pantalla de **Kardex** por producto y almacén.  
- Falta pantalla/flujo para **registro manual de movimientos** (entradas/salidas/transferencias/ajustes), pese a existir endpoints.  
- Falta detalle de **movimientos individuales** (cabecera + líneas).

### 12.2 Formularios incompletos

- Formulario de producto cubre sólo ~30–40% de los campos relevantes de BD/documentación.  
- Formularios de categorías y tipos de movimiento no permiten configurar jerarquías ni parámetros contables/documentales críticos.  
- Formularios de almacenes carecen de capacidades, centro de costo y otros metadatos que conectan con FIN/LOG/QMS.

### 12.3 Inconsistencias con documentación

- El manual y menú presentan **Inventario Físico** como paso central para carga inicial de stock; el frontend no permite al usuario ejecutar este flujo.  
- El concepto de **kardex valorizado** existe en documentación pero no en UI.  
- La advertencia de no modificar stock manualmente y usar siempre movimientos se apoya en procesos guiados que actualmente la UI no provee (no hay wizard de movimientos ni de inventario físico).

### 12.4 UX

- Vista de stock sin nombres de productos ni acceso rápido a ficha o kardex.  
- Listado de movimientos sin filtros avanzados ni detalle.  
- Formularios complejos tratados como diálogos planos sin estructura por secciones, lo que dificulta su futura ampliación con más campos.

---

## 13. Propuesta de mejoras

> Todas las mejoras son exclusivamente funcionales/UX y se orientan a alinear el frontend con la documentación oficial, estructura de BD y endpoints ya disponibles. No implican cambios de negocio, sólo exposición correcta.

### 13.1 Nuevas pantallas

1. **Pantalla `InventarioFisicoPage` (INV > Inventario Físico)**  
   - **Endpoint**: `/api/v1/inv/inventario-fisico` (+ endpoints de proceso).  
   - **Funciones**:  
     - Listar tomas existentes con filtros por empresa, almacén, tipo, estado, fecha.  
     - Crear nueva toma con formulario de configuración.  
     - Acceder al detalle de toma (productos, cantidades sistema vs contadas, diferencias).  
     - Aprobar toma y disparar movimientos de ajuste vía backend.

2. **Pantalla `KardexPage` (INV > Kardex)**  
   - **Endpoints**: basados en `/api/v1/inv/movimientos` con filtros por producto/almacén/fecha.  
   - **Funciones**: mostrar saldos iniciales y movimientos (entrada/salida) por producto, con columnas de cantidad, costo unitario, costo total, saldo acumulado.

3. **Pantalla `MovimientoDetallePage` (INV > Movimientos > Detalle)**  
   - **Endpoint**: `GET /api/v1/inv/movimientos/{id}` (y potencialmente `/detalles`).  
   - **Funciones**: visualizar cabecera y líneas, estados, observaciones, referencias, con posibilidad de reimpresiones o exportaciones (según lineamientos generales).

4. **Pantalla `MovimientoEditPage` o wizard para registrar movimientos manuales**  
   - **Endpoints**: `POST /api/v1/inv/movimientos`, `PUT /api/v1/inv/movimientos/{id}`.  
   - **Funciones**: permitir registrar entradas por ajuste, devoluciones, salidas por merma, transferencias entre almacenes, etc., con validaciones de stock.

### 13.2 Ampliación de formularios existentes

1. **Productos**  
   - Añadir secciones/tabs y exponer campos clave de BD como: atributos, dimensiones, control de lotes/series, parámetros de vencimiento, datos de compras/ventas y producción.  
   - Reorganizar el diálogo actual en una ficha con varias secciones (ver propuesta UX en sección 10).

2. **Categorías**  
   - Permitir seleccionar categoría padre y mostrar una vista jerárquica (árbol).  
   - Añadir campos de cuentas contables según BD (`cuenta_contable_inventario`, `cuenta_contable_costo_venta`).

3. **Unidades de Medida**  
   - Incluir una vista o sección para definir claramente **unidad base** y **factores de conversión** hacia otras unidades.  
   - Bloquear cambios estructurales (tipo, factor) cuando existan movimientos históricos (según respuesta backend), mostrando mensajes claros.

4. **Almacenes**  
   - Ampliar formulario para incluir capacidades y centro de costo.  
   - Opcionalmente, relacionar con datos de sucursal (mostrar dirección, ubigeo, etc. en modo lectura).

5. **Tipos de movimiento**  
   - Exponer configuración contable y documental: cuentas contables, requerimiento y tipo de documento de referencia, flag de tipo sistema en modo sólo lectura (para evitar ediciones).

### 13.3 Mejoras de UX en listados

- **StockPage**:  
  - Mostrar SKU y nombre de producto (se puede resolver consultando productos o ampliando endpoint).  
  - Enlazar a ficha de producto y a kardex del producto/almacén.  

- **MovimientosPage**:  
  - Añadir filtros por tipo, almacén, estado y rango de fechas.  
  - Conectar botón "Ver detalle" con `MovimientoDetallePage`.

---

## 14. Plan de implementación (priorizado)

### Prioridad Alta

1. **Implementar flujo completo de Inventario Físico (UI)**  
   - **Pantallas**: `InventarioFisicoPage` (listado + detalle/wizard).  
   - **Endpoints**: `/api/v1/inv/inventario-fisico` (+ endpoints de proceso definidos en OpenAPI).  
   - **Impacto funcional**: permite carga inicial de stock y ajustes periódicos acorde al manual; cierra una brecha crítica de operación.

2. **Exponer registro detallado de movimientos de inventario**  
   - **Pantallas**:  
     - Mejora de `MovimientosPage` con filtros avanzados.  
     - `MovimientoDetallePage` para ver cabecera + líneas.  
     - Wizard para registro manual de movimientos (ENT-AJUS, SAL-AJUS, transferencias).  
   - **Endpoints**: `GET/POST/PUT /api/v1/inv/movimientos`.  
   - **Impacto**: alinea el sistema con la regla “no modificar stock manualmente, sólo por movimientos”.

3. **Mejorar `StockPage` para identificación y análisis**  
   - **Pantalla**: `StockPage` actual ampliada con SKU/nombre y acceso a kardex.  
   - **Endpoints**: `/api/v1/inv/stock`, `/api/v1/inv/movimientos` (para link a kardex).  
   - **Impacto**: mejora inmediata de usabilidad para usuarios de inventario.

### Prioridad Media

4. **Reestructurar formulario de Producto en secciones/tabs**  
   - **Pantalla**: nueva ficha de producto (o ampliación del diálogo actual).  
   - **Endpoints**: mismos `/api/v1/inv/productos`.  
   - **Impacto**: permite registrar productos completos para operaciones avanzadas (lotes, vencimientos, producción, integración SUNAT).

5. **Agregar jerarquía y cuentas contables a Categorías**  
   - **Pantalla**: `CategoriasPage` extendida.  
   - **Endpoints**: `/api/v1/inv/categorias`.  
   - **Impacto**: mejora clasificación de productos y alineación contable.

6. **Ampliar Tipos de Movimiento con configuración contable/documental**  
   - **Pantalla**: `TiposMovimientoPage`.  
   - **Endpoints**: `/api/v1/inv/tipos-movimiento`.  
   - **Impacto**: asegura integridad entre INV y FIN, y mejora trazabilidad para AUD.

7. **Vista de Kardex por producto/almacén**  
   - **Pantalla**: `KardexPage`.  
   - **Endpoints**: basados en `/api/v1/inv/movimientos` o endpoints específicos de kardex.  
   - **Impacto**: clave para auditorías de stock y análisis de movimientos.

### Prioridad Baja

8. **Optimizar formularios de Almacenes y Unidades de Medida**  
   - **Pantallas**: `AlmacenesPage`, `UnidadesMedidaPage`.  
   - **Endpoints**: `/api/v1/inv/almacenes`, `/api/v1/inv/unidades-medida`.  
   - **Impacto**: mejora de precisión de datos, pero no bloquea operaciones actuales.

9. **Enriquecer listados con columnas adicionales y acciones rápidas**  
   - **Pantallas**: todas las listas de INV (Productos, Categorías, Stock, Movimientos, Tipos de movimiento).  
   - **Impacto**: refinamiento UX, alineado con prácticas de ERPs de clase mundial.

---

## 15. Conclusión

El módulo INV en el frontend ya ofrece una **base sólida para la configuración de catálogos e integración con otros módulos**, pero presenta brechas importantes respecto a los flujos operativos descritos en la documentación (especialmente inventario físico, kardex y registro de movimientos manuales), así como formularios simplificados que no exponen la riqueza de la estructura de BD.  

La implementación de las mejoras priorizadas permitirá **alinear plenamente el frontend con la funcionalidad oficial del ERP**, mejorar la experiencia de usuario al nivel de plataformas como SAP/Odoo/Dynamics y reducir la dependencia de intervenciones manuales en backend.

