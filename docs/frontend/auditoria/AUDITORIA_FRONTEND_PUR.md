# AUDITORÍA FRONTEND — Módulo PUR (Compras y Abastecimiento)

**Fecha:** 2026-05-09  
**Contrato API:** `docs/api/PUR_API.json`  
**Módulo:** `src/features/pur/`

---

## 1. Endpoints del Contrato API

| # | Método | Ruta | empresa_id | Paginación |
|---|--------|------|-----------|------------|
| 1 | GET | `/api/v1/pur/proveedores` | query (opt) | YES |
| 2 | POST | `/api/v1/pur/proveedores` | en body* | — |
| 3 | GET | `/api/v1/pur/proveedores/{id}` | — | — |
| 4 | PUT | `/api/v1/pur/proveedores/{id}` | — | — |
| 5 | POST | `/api/v1/pur/proveedores/{id}/reactivar` | — | — |
| 6 | GET | `/api/v1/pur/contactos` | — | — |
| 7 | POST | `/api/v1/pur/contactos` | — | — |
| 8 | GET | `/api/v1/pur/contactos/{id}` | — | — |
| 9 | PUT | `/api/v1/pur/contactos/{id}` | — | — |
| 10 | POST | `/api/v1/pur/contactos/{id}/reactivar` | — | — |
| 11 | GET | `/api/v1/pur/productos-proveedor` | — | — |
| 12 | POST | `/api/v1/pur/productos-proveedor` | — | — |
| 13 | GET | `/api/v1/pur/productos-proveedor/{id}` | — | — |
| 14 | PUT | `/api/v1/pur/productos-proveedor/{id}` | — | — |
| 15 | POST | `/api/v1/pur/productos-proveedor/{id}/reactivar` | — | — |
| 16 | GET | `/api/v1/pur/solicitudes` | query* | YES |
| 17 | POST | `/api/v1/pur/solicitudes` | en body* | — |
| 18 | GET | `/api/v1/pur/solicitudes/{id}` | — | — |
| 19 | PUT | `/api/v1/pur/solicitudes/{id}` | — | — |
| 20 | POST | `/api/v1/pur/solicitudes/{id}/aprobar` | — | — |
| 21 | POST | `/api/v1/pur/solicitudes/{id}/rechazar` | — | — |
| 22 | POST | `/api/v1/pur/solicitudes/{id}/anular` | — | — |
| 23 | POST | `/api/v1/pur/solicitudes/{id}/marcar-procesada` | — | — |
| 24 | POST | `/api/v1/pur/solicitudes/transaccional` | en body* | — |
| 25 | GET | `/api/v1/pur/solicitudes-detalle` | query* | — |
| 26 | POST | `/api/v1/pur/solicitudes-detalle` | en body* | — |
| 27 | GET | `/api/v1/pur/solicitudes-detalle/{id}` | — | — |
| 28 | PUT | `/api/v1/pur/solicitudes-detalle/{id}` | — | — |
| 29 | GET | `/api/v1/pur/cotizaciones` | query* | YES |
| 30 | POST | `/api/v1/pur/cotizaciones` | en body* | — |
| 31 | GET | `/api/v1/pur/cotizaciones/{id}` | — | — |
| 32 | PUT | `/api/v1/pur/cotizaciones/{id}` | — | — |
| 33 | POST | `/api/v1/pur/cotizaciones/{id}/aceptar` | — | — |
| 34 | POST | `/api/v1/pur/cotizaciones/{id}/rechazar` | — | — |
| 35 | POST | `/api/v1/pur/cotizaciones/{id}/marcar-ganadora` | — | — |
| 36 | POST | `/api/v1/pur/cotizaciones/transaccional` | en body* | — |
| 37 | GET | `/api/v1/pur/cotizaciones-detalle` | query* | — |
| 38 | POST | `/api/v1/pur/cotizaciones-detalle` | en body* | — |
| 39 | GET | `/api/v1/pur/cotizaciones-detalle/{id}` | — | — |
| 40 | PUT | `/api/v1/pur/cotizaciones-detalle/{id}` | — | — |
| 41 | GET | `/api/v1/pur/ordenes-compra` | query* | YES |
| 42 | POST | `/api/v1/pur/ordenes-compra` | en body* | — |
| 43 | GET | `/api/v1/pur/ordenes-compra/{id}` | — | — |
| 44 | PUT | `/api/v1/pur/ordenes-compra/{id}` | — | — |
| 45 | POST | `/api/v1/pur/ordenes-compra/{id}/aprobar` | — | — |
| 46 | POST | `/api/v1/pur/ordenes-compra/{id}/emitir` | — | — |
| 47 | POST | `/api/v1/pur/ordenes-compra/{id}/anular` | — | — |
| 48 | POST | `/api/v1/pur/ordenes-compra/transaccional` | en body* | — |
| 49 | GET | `/api/v1/pur/ordenes-compra-detalle` | query* | — |
| 50 | POST | `/api/v1/pur/ordenes-compra-detalle` | en body* | — |
| 51 | GET | `/api/v1/pur/ordenes-compra-detalle/{id}` | — | — |
| 52 | PUT | `/api/v1/pur/ordenes-compra-detalle/{id}` | — | — |
| 53 | GET | `/api/v1/pur/recepciones` | query* | YES |
| 54 | POST | `/api/v1/pur/recepciones` | en body* | — |
| 55 | GET | `/api/v1/pur/recepciones/{id}` | — | — |
| 56 | PUT | `/api/v1/pur/recepciones/{id}` | — | — |
| 57 | POST | `/api/v1/pur/recepciones/{id}/anular` | — | — |
| 58 | POST | `/api/v1/pur/recepciones/{id}/aprobar` | — | — |
| 59 | POST | `/api/v1/pur/recepciones/{id}/procesar` | — | — |
| 60 | POST | `/api/v1/pur/recepciones/transaccional` | en body* | — |
| 61 | GET | `/api/v1/pur/recepciones-detalle` | query* | — |
| 62 | POST | `/api/v1/pur/recepciones-detalle` | en body* | — |
| 63 | GET | `/api/v1/pur/recepciones-detalle/{id}` | — | — |
| 64 | PUT | `/api/v1/pur/recepciones-detalle/{id}` | — | — |

---

## 2. Inventario de Implementación Actual

### Archivos existentes

```
src/features/pur/
├── components/
│   └── PurPageLayout.tsx          ✔ Existe
├── hooks/                         ✖ VACÍO — no existe ningún hook
├── pages/
│   ├── ProveedoresPage.tsx        ✔ Existe
│   ├── ContactosPage.tsx          ✔ Existe
│   ├── ProductosProveedorPage.tsx ✔ Existe
│   ├── SolicitudesPage.tsx        ✔ Existe
│   ├── CotizacionesPage.tsx       ✔ Existe
│   ├── OrdenesCompraPage.tsx      ✔ Existe
│   └── RecepcionesPage.tsx        ✔ Existe
├── services/
│   └── pur.service.ts             ⚠ Parcial (faltan métodos y hay métodos desalineados)
├── types/
│   └── pur.types.ts               ⚠ Parcial (campos incorrectos, interfaces incompletas)
└── routes.tsx                     ✔ Existe
```

---

## 3. Evaluación por Endpoint

| Endpoint | Método | Service | Hook | Componente | Estado |
|----------|--------|---------|------|------------|--------|
| GET /proveedores | GET | ✔ `proveedorService.list` | ✖ | ✔ ProveedoresPage | ⚠ Parcial |
| POST /proveedores | POST | ✔ `proveedorService.create` | ✖ | ✔ ProveedoresPage | ⚠ Parcial |
| GET /proveedores/{id} | GET | ✔ `proveedorService.getById` | ✖ | ✖ No usado en UI | ✖ Faltante |
| PUT /proveedores/{id} | PUT | ✔ `proveedorService.update` | ✖ | ✔ ProveedoresPage | ⚠ Parcial |
| POST /proveedores/{id}/reactivar | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| GET /contactos | GET | ✔ `contactoProveedorService.list` | ✖ | ✔ ContactosPage | ⚠ Parcial |
| POST /contactos | POST | ✔ `contactoProveedorService.create` | ✖ | ✔ ContactosPage | ⚠ Parcial |
| GET /contactos/{id} | GET | ✔ `contactoProveedorService.getById` | ✖ | ✖ No usado en UI | ✖ Faltante |
| PUT /contactos/{id} | PUT | ✔ `contactoProveedorService.update` | ✖ | ✔ ContactosPage | ⚠ Parcial |
| POST /contactos/{id}/reactivar | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| GET /productos-proveedor | GET | ✔ `productoProveedorService.list` | ✖ | ✔ ProductosProveedorPage | ⚠ Parcial |
| POST /productos-proveedor | POST | ✔ `productoProveedorService.create` | ✖ | ✔ ProductosProveedorPage | ⚠ Parcial |
| GET /productos-proveedor/{id} | GET | ✔ `productoProveedorService.getById` | ✖ | ✖ No usado en UI | ✖ Faltante |
| PUT /productos-proveedor/{id} | PUT | ✔ `productoProveedorService.update` | ✖ | ✔ ProductosProveedorPage | ⚠ Parcial |
| POST /productos-proveedor/{id}/reactivar | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| GET /solicitudes | GET | ✔ `solicitudCompraService.list` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| POST /solicitudes | POST | ✔ `solicitudCompraService.create` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| GET /solicitudes/{id} | GET | ✔ `solicitudCompraService.getById` | ✖ | ✖ No usado directamente | ⚠ Parcial |
| PUT /solicitudes/{id} | PUT | ✔ `solicitudCompraService.update` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| POST /solicitudes/{id}/aprobar | POST | ✔ `solicitudCompraService.aprobar` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| POST /solicitudes/{id}/rechazar | POST | ✔ `solicitudCompraService.rechazar` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| POST /solicitudes/{id}/anular | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| POST /solicitudes/{id}/marcar-procesada | POST | ✔ `solicitudCompraService.marcarProcesada` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| POST /solicitudes/transaccional | POST | ✖ **FALTANTE** | ✖ | ✖ (usa creación secuencial) | ✖ Faltante |
| GET /solicitudes-detalle | GET | ✔ `solicitudCompraDetalleService.listBySolicitud` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| POST /solicitudes-detalle | POST | ✔ `solicitudCompraDetalleService.create` | ✖ | ✔ SolicitudesPage | ⚠ Parcial |
| GET /solicitudes-detalle/{id} | GET | ✔ `solicitudCompraDetalleService.getById` | ✖ | ✖ No usado en UI | ✖ Faltante |
| PUT /solicitudes-detalle/{id} | PUT | ✔ `solicitudCompraDetalleService.update` | ✖ | ✖ No usado en UI | ✖ Faltante |
| GET /cotizaciones | GET | ✔ `cotizacionService.list` | ✖ | ✔ CotizacionesPage | ⚠ Parcial |
| POST /cotizaciones | POST | ✔ `cotizacionService.create` | ✖ | ✔ CotizacionesPage | ⚠ Parcial |
| GET /cotizaciones/{id} | GET | ✔ `cotizacionService.getById` | ✖ | ✖ No usado directamente | ⚠ Parcial |
| PUT /cotizaciones/{id} | PUT | ✔ `cotizacionService.update` | ✖ | ✔ CotizacionesPage | ⚠ Parcial |
| POST /cotizaciones/{id}/aceptar | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| POST /cotizaciones/{id}/rechazar | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| POST /cotizaciones/{id}/marcar-ganadora | POST | ✔ `cotizacionService.marcarGanadora` | ✖ | ✔ CotizacionesPage | ⚠ Parcial |
| POST /cotizaciones/transaccional | POST | ✖ **FALTANTE** | ✖ | ✖ (usa creación secuencial) | ✖ Faltante |
| GET /cotizaciones-detalle | GET | ✔ `cotizacionDetalleService.listByCotizacion` | ✖ | ✔ CotizacionesPage | ⚠ Parcial |
| POST /cotizaciones-detalle | POST | ✔ `cotizacionDetalleService.create` | ✖ | ✔ CotizacionesPage | ⚠ Parcial |
| GET /cotizaciones-detalle/{id} | GET | ✔ `cotizacionDetalleService.getById` | ✖ | ✖ No usado en UI | ✖ Faltante |
| PUT /cotizaciones-detalle/{id} | PUT | ✔ `cotizacionDetalleService.update` | ✖ | ✖ No usado en UI | ✖ Faltante |
| GET /ordenes-compra | GET | ✔ `ordenCompraService.list` | ✖ | ✔ OrdenesCompraPage | ⚠ Parcial |
| POST /ordenes-compra | POST | ✔ `ordenCompraService.create` | ✖ | ✔ OrdenesCompraPage | ⚠ Parcial |
| GET /ordenes-compra/{id} | GET | ✔ `ordenCompraService.getById` | ✖ | ✖ No usado directamente | ⚠ Parcial |
| PUT /ordenes-compra/{id} | PUT | ✔ `ordenCompraService.update` | ✖ | ✔ OrdenesCompraPage | ⚠ Parcial |
| POST /ordenes-compra/{id}/aprobar | POST | ✔ `ordenCompraService.aprobar` | ✖ | ✔ OrdenesCompraPage | ⚠ Parcial |
| POST /ordenes-compra/{id}/emitir | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| POST /ordenes-compra/{id}/anular | POST | ✔ `ordenCompraService.anular` | ✖ | ✔ OrdenesCompraPage | ⚠ Parcial |
| POST /ordenes-compra/transaccional | POST | ✖ **FALTANTE** | ✖ | ✖ (usa creación secuencial) | ✖ Faltante |
| GET /ordenes-compra-detalle | GET | ✔ `ordenCompraDetalleService.listByOrdenCompra` | ✖ | ✔ OrdenesCompraPage | ⚠ Parcial |
| POST /ordenes-compra-detalle | POST | ✔ `ordenCompraDetalleService.create` | ✖ | ✔ OrdenesCompraPage | ⚠ Parcial |
| GET /ordenes-compra-detalle/{id} | GET | ✔ `ordenCompraDetalleService.getById` | ✖ | ✖ No usado en UI | ✖ Faltante |
| PUT /ordenes-compra-detalle/{id} | PUT | ✔ `ordenCompraDetalleService.update` | ✖ | ✖ No usado en UI | ✖ Faltante |
| GET /recepciones | GET | ✔ `recepcionService.list` | ✖ | ✔ RecepcionesPage | ⚠ Parcial |
| POST /recepciones | POST | ✔ `recepcionService.create` | ✖ | ✔ RecepcionesPage | ⚠ Parcial |
| GET /recepciones/{id} | GET | ✔ `recepcionService.getById` | ✖ | ✖ No usado directamente | ⚠ Parcial |
| PUT /recepciones/{id} | PUT | ✔ `recepcionService.update` | ✖ | ✔ RecepcionesPage | ⚠ Parcial |
| POST /recepciones/{id}/anular | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| POST /recepciones/{id}/aprobar | POST | ✖ **FALTANTE** | ✖ | ✖ | ✖ Faltante |
| POST /recepciones/{id}/procesar | POST | ✔ `recepcionService.procesar` | ✖ | ✔ RecepcionesPage | ⚠ Parcial |
| POST /recepciones/transaccional | POST | ✖ **FALTANTE** | ✖ | ✖ (usa creación secuencial) | ✖ Faltante |
| GET /recepciones-detalle | GET | ✔ `recepcionDetalleService.listByRecepcion` | ✖ | ✔ RecepcionesPage | ⚠ Parcial |
| POST /recepciones-detalle | POST | ✔ `recepcionDetalleService.create` | ✖ | ✔ RecepcionesPage | ⚠ Parcial |
| GET /recepciones-detalle/{id} | GET | ✔ `recepcionDetalleService.getById` | ✖ | ✖ No usado en UI | ✖ Faltante |
| PUT /recepciones-detalle/{id} | PUT | ✔ `recepcionDetalleService.update` | ✖ | ✖ No usado en UI | ✖ Faltante |

**Resumen:** 0 ✔ Completos / 38 ⚠ Parciales / 26 ✖ Faltantes

---

## 4. Brechas por Endpoint — Service Layer

### 4.1 Métodos faltantes en pur.service.ts

| Servicio | Método faltante | Endpoint |
|----------|----------------|----------|
| `proveedorService` | `reactivar(id)` | POST /proveedores/{id}/reactivar |
| `contactoProveedorService` | `reactivar(id)` | POST /contactos/{id}/reactivar |
| `productoProveedorService` | `reactivar(id)` | POST /productos-proveedor/{id}/reactivar |
| `solicitudCompraService` | `anular(id, motivo?)` | POST /solicitudes/{id}/anular |
| `cotizacionService` | `aceptar(id)` | POST /cotizaciones/{id}/aceptar |
| `cotizacionService` | `rechazar(id, motivo?)` | POST /cotizaciones/{id}/rechazar |
| `ordenCompraService` | `emitir(id)` | POST /ordenes-compra/{id}/emitir |
| `recepcionService` | `anular(id)` | POST /recepciones/{id}/anular |
| `recepcionService` | `aprobar(id)` | POST /recepciones/{id}/aprobar |
| — | `solicitudTransaccionalService.create(payload)` | POST /solicitudes/transaccional |
| — | `cotizacionTransaccionalService.create(payload)` | POST /cotizaciones/transaccional |
| — | `ordenCompraTransaccionalService.create(payload)` | POST /ordenes-compra/transaccional |
| — | `recepcionTransaccionalService.create(payload)` | POST /recepciones/transaccional |

### 4.2 Hooks — Ausencia total

**El módulo PUR no tiene ningún archivo en `src/features/pur/hooks/`.**

Todas las páginas usan `useState` + `useEffect` + llamadas directas al servicio. Se debe crear:

| Hook a crear | Entidad |
|-------------|---------|
| `useProveedores.ts` | Proveedor |
| `useContactosProveedor.ts` | ContactoProveedor |
| `useProductosProveedor.ts` | ProductoProveedor |
| `useSolicitudesCompra.ts` | SolicitudCompra + Detalle |
| `useCotizaciones.ts` | Cotización + Detalle |
| `useOrdenesCompra.ts` | OrdenCompra + Detalle |
| `useRecepciones.ts` | Recepción + Detalle |

---

## 5. Campos Faltantes en Formularios y Vistas

### 5.1 ProveedoresPage

**Lista (columnas no mostradas del response):**
- `estado` — no se muestra en tabla ni hay filtro visual de activos/inactivos
- `es_activo` — no hay indicador visual de estado activo/inactivo en filas
- `tipo_proveedor` / `categoria_proveedor` — sin columna en tabla

**Formulario (campos del contrato no incluidos en form):**
- `saldo_pendiente` — campo presente en contrato, no en formulario (aceptable como solo lectura)
- `motivo_bloqueo` — no incluido (necesario para bloquear proveedor)
- `estado` (enum activo/bloqueado) — no editable en formulario de edición

**Acciones faltantes:**
- Botón **Reactivar** (para proveedores inactivos)
- Filtro `tipo_proveedor` y `categoria_proveedor` en lista

### 5.2 ContactosPage

**Lista (columnas no mostradas):**
- `es_contacto_principal` — no visible en tabla
- `es_activo` — no hay indicador ni acción de reactivar

**Formulario:**
- Edición no incluye `telefono_movil` (presente en create pero omitido en edit form)

**Acciones faltantes:**
- Botón **Reactivar**

### 5.3 ProductosProveedorPage

**Formulario:**
- `moneda: 'PEN'` hardcodeado como código en lugar de `moneda_id` (UUID requerido por API)
- `unidad_medida_id: null` en DEFAULT (campo requerido `*` en contrato)
- Campos de vigencia (`fecha_vigencia_desde`, `fecha_vigencia_hasta`) presentes pero sin validación de rango

**Acciones faltantes:**
- Botón **Reactivar**

### 5.4 SolicitudesPage

**Lista (columnas no mostradas):**
- `tipo_solicitud` — no visible en tabla
- `motivo_solicitud` — no visible
- `orden_compra_generada` — no visible

**Formulario:**
- Crea ítems con `cliente_id` extra en payload (campo no requerido por el contrato)
- Paginación no implementada (API soporta `page`/`page_size`)

**Acciones faltantes en vista detalle:**
- Botón **Anular** (POST /solicitudes/{id}/anular)
- Los campos calculados del detalle (`total_referencial`, `cantidad_pendiente`) no se muestran en la tabla de ítems

### 5.5 CotizacionesPage

**Formulario:**
- `moneda: 'PEN'` hardcodeado como código en lugar de `moneda_id`

**Acciones faltantes en vista detalle:**
- Botón **Aceptar** (POST /cotizaciones/{id}/aceptar) — solo marcar-ganadora implementado
- Botón **Rechazar** (POST /cotizaciones/{id}/rechazar)

**Campos de detalle no mostrados:**
- `precio_neto` y `total` (calculados por el backend) no aparecen en tabla de ítems

### 5.6 OrdenesCompraPage

**Formulario:**
- `moneda: 'PEN'` hardcodeado en lugar de `moneda_id`
- `especificaciones` en detalle de líneas no incluido en formulario

**Acciones faltantes:**
- Botón **Emitir** (POST /ordenes-compra/{id}/emitir)

**Campos de detalle no mostrados:**
- `precio_neto`, `subtotal`, `igv`, `total`, `cantidad_pendiente` no se muestran en tabla de ítems
- `porcentaje_recepcion` e `items_recepcionados` en cabecera no visible

### 5.7 RecepcionesPage

**Acciones faltantes:**
- Botón **Anular** (POST /recepciones/{id}/anular)
- Botón **Aprobar** tras inspección (POST /recepciones/{id}/aprobar)

**Campos en formulario:**
- `lote`, `fecha_vencimiento`, `ubicacion_almacen`, `motivo_diferencia` del detalle de recepción no incluidos en el formulario

**Campos de detalle no mostrados:**
- `diferencia`, `total` (calculados) no visibles en tabla de ítems

---

## 6. Componentes Desalineados

| Archivo | Problema | Clasificación |
|---------|----------|---------------|
| `pur.types.ts` · `ProductoProveedor` | Campo `moneda?: string\|null` — API usa `moneda_id: string*` (UUID). El tipo usa código de moneda en lugar del ID. | ⚠ Desalineado |
| `pur.types.ts` · `ProductoProveedorCreate` | `moneda?: string\|null` en lugar de `moneda_id: string*` | ⚠ Desalineado |
| `pur.types.ts` · `OrdenCompraCreate` | Tiene `moneda?: string\|null` Y `moneda_id?: string\|null`. API solo requiere `moneda_id*`. El campo `moneda` es un artefacto antiguo. | ⚠ Desalineado |
| `pur.types.ts` · `CotizacionCreate` | Mismo problema: tiene `moneda?: string\|null` Y `moneda_id?: string\|null` | ⚠ Desalineado |
| `pur.types.ts` · `SolicitudCompra` | Campo `moneda?: string\|null` anotado como "Compat: algunos endpoints aún devuelven código" pero el contrato solo devuelve `moneda_id*` | ⚠ Desalineado |
| `pur.types.ts` · `Cotizacion` | Mismo campo `moneda?: string\|null` extra | ⚠ Desalineado |
| `pur.types.ts` · `OrdenCompra` | Mismo campo `moneda?: string\|null` extra | ⚠ Desalineado |
| `pur.service.ts` · `solicitudCompraDetalleService.delete` | Llama a `api.delete(...)` pero el contrato API **no tiene DELETE** para solicitudes-detalle | ⚠ Desalineado |
| `pur.service.ts` · `cotizacionDetalleService.delete` | Mismo problema — no existe DELETE en contrato | ⚠ Desalineado |
| `pur.service.ts` · `ordenCompraDetalleService.delete` | Mismo problema — no existe DELETE en contrato | ⚠ Desalineado |
| `pur.service.ts` · `recepcionDetalleService.delete` | Mismo problema — no existe DELETE en contrato | ⚠ Desalineado |
| `ProductosProveedorPage.tsx` | Usa `moneda: 'PEN'` (código) en DEFAULT y en el form. API requiere `moneda_id` (UUID). | ⚠ Desalineado |
| `OrdenesCompraPage.tsx` | Usa `moneda: 'PEN'` en DEFAULT. API requiere `moneda_id*`. | ⚠ Desalineado |
| `CotizacionesPage.tsx` | Usa `moneda: 'PEN'` en DEFAULT. API requiere `moneda_id*`. | ⚠ Desalineado |
| `SolicitudesPage.tsx` | `solicitudCompraDetalleService.create` recibe `cliente_id` en el payload, campo **no aceptado** por el contrato API (`SolicitudCompraDetalleCreate` no tiene `cliente_id`) | ⚠ Desalineado |

---

## 7. Problemas de Tipado

| Archivo | Línea/Campo | Problema |
|---------|-------------|---------|
| `ProveedoresPage.tsx` | `const params: any = { ... }` (línea 82) | Uso de `any` — viola regla absoluta |
| `ContactosPage.tsx` | `const params: any = { ... }` (línea 57) | Uso de `any` — viola regla absoluta |
| `pur.types.ts` · `SolicitudCompraDetalle` | Faltan campos del response: `total_referencial: string\|null`, `cantidad_pendiente: string\|null` | Tipado incompleto |
| `pur.types.ts` · `CotizacionDetalle` | Faltan campos del response: `precio_neto: string\|null`, `total: string\|null` | Tipado incompleto |
| `pur.types.ts` · `OrdenCompraDetalle` | Faltan campos del response: `precio_neto`, `subtotal`, `igv`, `total`, `cantidad_pendiente` | Tipado incompleto |
| `pur.types.ts` · `RecepcionDetalle` | Faltan campos del response: `diferencia: string\|null`, `total: string\|null`, `ubicacion_almacen: string\|null` | Tipado incompleto |
| `pur.types.ts` | Ausencia total de tipos transaccionales: `SolicitudCompraTransaccionalCreate`, `CotizacionTransaccionalCreate`, `OrdenCompraTransaccionalCreate`, `RecepcionTransaccionalCreate` | Tipado faltante |
| `pur.types.ts` · `ProductoProveedor` | `precio_unitario: number` — pero API devuelve `precio_unitario: string` (Decimal serializado). Debería ser `string` en Read o `number\|string`. | Tipado incorrecto |
| `pur.types.ts` · `SolicitudCompra` | `total_estimado?: number\|null` — API devuelve `total_estimado: string\|null` (Decimal). Inconsistencia. | Tipado incorrecto |
| `pur.types.ts` · `Cotizacion` | Campos `subtotal`, `descuento`, `igv`, `total`, `tipo_cambio` tipados como `number\|null` en Create pero como `string\|null` en Read (el API devuelve Decimal serializado). | Tipado inconsistente |
| `pur.types.ts` · `OrdenCompra` | Misma inconsistencia `number` vs `string` para campos monetarios | Tipado inconsistente |
| `PurListParams` | No incluye `page`, `page_size` para endpoints con paginación | Tipado incompleto |

---

## 8. Problemas de RBAC y Tenant

| Archivo | Problema |
|---------|---------|
| `ProveedoresPage.tsx` | `usePermissions` **no importado**. Botón "Crear proveedor" visible para todos los roles. |
| `ContactosPage.tsx` | `usePermissions` **no importado**. Sin protección de acciones. |
| `ProductosProveedorPage.tsx` | `usePermissions` **no importado**. Sin protección de acciones. |
| `SolicitudesPage.tsx` | `usePermissions` **no importado**. Usa `useAuth` de `@/shared/context/AuthContext` — diferente al patrón estándar del proyecto (`usePermissions` de `@/core/auth/hooks/usePermissions`). Botones Aprobar/Rechazar solo condicionan por estado, no por permiso RBAC. |
| `CotizacionesPage.tsx` | `usePermissions` **no importado**. Sin protección de acciones. |
| `OrdenesCompraPage.tsx` | `usePermissions` **no importado**. Sin protección de acciones. |
| `RecepcionesPage.tsx` | `usePermissions` **no importado**. Sin protección de acciones. |
| `SolicitudesPage.tsx` | Paginación no implementada — `empresa_id` como query requerido en GET /solicitudes, páginas con grandes volúmenes de datos retornarán todo sin paginación. |

---

## 9. Resumen de Acciones Requeridas en Fase 3

### Bloque 1 — Types (ALTA prioridad)
- Corregir `moneda_id` vs `moneda` en todas las interfaces de Create/Update
- Agregar campos calculados faltantes en interfaces de Read (detalles)
- Corregir tipos `number` → `string` para campos Decimal del backend
- Agregar `page`/`page_size` a `PurListParams`
- Crear tipos transaccionales (4 entidades)
- Renombrar `Proveedor` → `ProveedorRead` y alinear con `*Read` del contrato (mantener retrocompatibilidad)

### Bloque 2 — Service (ALTA prioridad)
- Agregar 9 métodos de acción faltantes (reactivar x3, anular x3, aceptar, rechazar, emitir)
- Agregar 4 funciones transaccionales
- Eliminar o marcar los 4 métodos `delete` que no existen en el contrato
- Eliminar campo `cliente_id` del payload de `solicitudCompraDetalleService.create`
- Corregir `moneda` → `moneda_id` en `productoProveedorService`

### Bloque 3 — Hooks (ALTA prioridad — ausencia total)
- Crear 7 archivos de hooks bajo `src/features/pur/hooks/`
- Migrar manejo de state a React Query (`useTenantQuery` + `useMutation`)

### Bloque 4 — Componentes (MEDIA prioridad)
- Agregar RBAC (`usePermissions`) a todas las páginas
- Reemplazar `params: any` por tipos explícitos
- Agregar botones de acciones faltantes: Reactivar (x3), Anular (x3), Aceptar, Rechazar, Emitir, Aprobar-Recepcion
- Corregir `moneda: 'PEN'` → selector de `moneda_id` en ProductosProveedor, Cotizaciones y OC
- Mostrar campos calculados en tablas de detalle
- Agregar indicador `es_activo`/`estado` en tablas de lista
