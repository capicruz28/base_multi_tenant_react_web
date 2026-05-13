# Auditoría Funcional y UX — Módulo PUR (Compras)

**Fecha:** 2026-03-16  
**Alcance:** Frontend del módulo PUR. Solo análisis; no se modifica código.  
**Fuentes:** CATALOGO_MODULOS.md, MENU_NAVEGACION.md, MANUAL_USUARIO.md, backend_openapi.json, TABLAS_BD_ERP_COMPLETO.sql, código en `src/features/pur` y referencias en el proyecto.

---

## 1. Resumen del módulo

**Módulo:** PUR — Compras  
**Objetivo funcional (según documentación):** Gestionar proveedores, cotizaciones, órdenes de compra y recepciones de mercadería; control de pagos. Prerrequisitos: ORG e INV completados.

**Cobertura actual del frontend**
- **Pantallas implementadas:** Proveedores, Contactos de Proveedor, Productos por Proveedor, Solicitudes de Compra, Cotizaciones, Órdenes de Compra, Recepciones (7 páginas).
- **Servicios API:** Consumo de `/pur/proveedores`, `/pur/contactos`, `/pur/productos-proveedor`, `/pur/solicitudes`, `/pur/cotizaciones`, `/pur/ordenes-compra`, `/pur/recepciones` (solo cabeceras; no se consumen endpoints de detalle ni acciones específicas).
- **Navegación:** Módulo bajo ruta `pur/*` con `PermissionGuard` módulo `pur` acción `ver`.

**Conclusión general:** El módulo PUR está **parcialmente implementado**. Existen las 7 pantallas definidas en MENU_NAVEGACION.md y se consumen los CRUD de cabecera, pero **no hay manejo de líneas/detalle** (solicitud detalle, cotización detalle, orden de compra detalle, recepción detalle), **no se usan acciones de flujo** (aprobar/rechazar solicitud, marcar cotización ganadora, aprobar/anular OC, procesar recepción) y varios **formularios no cubren todos los campos ni la estructura UX recomendada** por el manual. El flujo documentado (Solicitud → Cotización → OC → Recepción con ítems) no está operativo de punta a punta en el frontend.

---

## 2. Funcionalidades definidas en documentación

### 2.1 Según CATALOGO_MODULOS.md

- Gestión de Compras: Proveedores y cotizaciones.
- Órdenes de compra.
- Recepción de mercadería.
- Control de pagos.

### 2.2 Según MENU_NAVEGACION.md (sección 05. PUR — COMPRAS)

| Opción | Descripción |
|--------|-------------|
| Proveedores | Catálogo con RUC, contactos, condiciones de pago |
| Contactos de Proveedor | Gestionar vendedores y contactos del proveedor |
| Productos por Proveedor | Qué productos vende cada proveedor con sus precios |
| Solicitudes de Compra | Requisiciones internas (departamento solicita materiales) |
| Cotizaciones | Solicitar cotizaciones a varios proveedores |
| Órdenes de Compra | Generar OC con numeración automática; estados borrador, aprobada, enviada |
| Recepción de Mercadería | Registrar cantidades recibidas vs ordenadas; genera movimiento de inventario automático |

### 2.3 Según MANUAL_USUARIO.md (2.3 MÓDULO PUR — COMPRAS)

Flujo esperado en 7 pasos:

1. **Registrar Proveedores** — Datos generales (RUC, razón social, nombre comercial, tipo nacional/extranjero), contacto (dirección, teléfono, email, web), condiciones comerciales (condición pago, moneda, categoría A/B/C, límite crédito), datos bancarios (banco, cuenta, CCI).
2. **Agregar Contactos del Proveedor** — Por proveedor: nombre, cargo, email, teléfono, “Es principal”; uso para envío de OC por email.
3. **Definir Productos por Proveedor** — Proveedor, producto, código proveedor, precio, unidad compra, tiempo entrega, cantidad mínima, “Es proveedor principal”.
4. **Crear Solicitud de Compra (opcional)** — Número, solicitante, departamento, fecha necesidad, prioridad; **detalle:** producto, cantidad, justificación; estados y acciones [Aprobar] [Rechazar].
5. **Solicitar Cotizaciones** — Número, fechas, **proveedores invitados**, **productos solicitados** (producto, cantidad, entrega deseada); [Enviar Cotización por Email]; registro de ofertas por proveedor con **detalle** (producto, cantidad, precio unit, total, entrega); comparación lado a lado.
6. **Generar Orden de Compra** — Cabecera (número, fecha, proveedor, moneda, tipo cambio, contacto); condiciones (forma pago, lugar entrega, fecha entrega); **detalle:** producto, cant, UM, precio, subtotal, almacén; subtotal/IGV/total; estados Borrador → Aprobada → Enviada → Recepcionada → Cerrada; [Aprobar] [Enviar Email].
7. **Recepcionar Mercadería** — Número, fecha, OC relacionada, proveedor, guía remisión, almacén destino; **detalle:** producto, ordenado, recibido, diferencia, estado; observaciones; opción “Generar inspección de calidad (QMS)”; [Procesar Recepción]. Efectos: movimiento INV, actualización stock, costo promedio, cierre OC cuando corresponda; recepciones parciales soportadas.

**Entidades y operaciones clave documentadas:** Proveedor (completo con datos bancarios y categoría), Contacto, Producto-Proveedor, Solicitud de Compra **con detalle de ítems**, Cotización **con múltiples proveedores y detalle de ítems**, Orden de Compra **con detalle de ítems y flujo de estados**, Recepción **con detalle por ítem y procesar**.

---

## 3. Entidades detectadas en base de datos

Resumen de tablas PUR en `TABLAS_BD_ERP_COMPLETO.sql`:

### 3.1 pur_proveedor

- **Identificación:** proveedor_id, cliente_id, empresa_id, codigo_proveedor, razon_social, nombre_comercial, tipo_documento, numero_documento.
- **Clasificación:** tipo_proveedor, categoria_proveedor.
- **Dirección:** direccion, pais, departamento, provincia, distrito, ubigeo.
- **Contacto principal:** contacto_nombre, contacto_cargo, telefono_principal, telefono_secundario, email_principal, email_cotizaciones, sitio_web.
- **Comercial:** condicion_pago_defecto, dias_credito_defecto, moneda_preferida.
- **Bancarios:** banco, numero_cuenta, tipo_cuenta, cci.
- **Evaluación:** calificacion, nivel_confianza, es_proveedor_homologado, fecha_homologacion.
- **Límites:** limite_credito, saldo_pendiente.
- **Estado:** estado, motivo_bloqueo, es_activo, observaciones, auditoría.

### 3.2 pur_proveedor_contacto

- contacto_id, proveedor_id, nombre_completo, cargo, area, telefono, telefono_movil, email, es_contacto_principal, es_contacto_cotizaciones, es_contacto_cobranzas, es_activo.

### 3.3 pur_producto_proveedor

- producto_proveedor_id, proveedor_id, producto_id, codigo_proveedor, descripcion_proveedor, precio_unitario, moneda, **unidad_medida_id NOT NULL**, cantidad_minima, multiplo_compra, tiempo_entrega_dias, fecha_vigencia_desde/hasta, es_proveedor_preferido, prioridad, es_activo.

### 3.4 pur_solicitud_compra

- solicitud_id, empresa_id, numero_solicitud, fecha_solicitud, fecha_requerida, departamento_solicitante_id, usuario_solicitante_id, solicitante_nombre, almacen_destino_id, centro_costo_id, tipo_solicitud, motivo_solicitud, total_items, total_estimado, moneda, estado, requiere_aprobacion, aprobado_por_usuario_id, fecha_aprobacion, orden_compra_generada, observaciones, motivo_rechazo.

### 3.5 pur_solicitud_compra_detalle

- solicitud_detalle_id, solicitud_id, producto_id, cantidad_solicitada, unidad_medida_id, precio_referencial, cantidad_atendida, observaciones.

### 3.6 pur_cotizacion

- cotizacion_id, empresa_id, numero_cotizacion, fecha_cotizacion, fecha_vencimiento, proveedor_id, solicitud_compra_id, condicion_pago, dias_credito, tiempo_entrega_dias, lugar_entrega, **moneda_id** (FK cat_moneda), tipo_cambio, subtotal, descuento, igv, total, estado, es_ganadora, observaciones, motivo_rechazo.

### 3.7 pur_cotizacion_detalle

- cotizacion_detalle_id, cotizacion_id, producto_id, cantidad, unidad_medida_id, precio_unitario, descuento_porcentaje, tiempo_entrega_dias, observaciones.

### 3.8 pur_orden_compra

- orden_compra_id, empresa_id, numero_oc, fecha_emision, fecha_requerida, proveedor_id, proveedor_razon_social, proveedor_ruc, almacen_destino_id, direccion_entrega, solicitud_compra_id, cotizacion_id, condicion_pago, dias_credito, **moneda_id**, tipo_cambio, subtotal, descuento_global, igv, total, total_items, items_recepcionados, porcentaje_recepcion, estado, requiere_aprobacion, aprobado_por_usuario_id, fecha_aprobacion, centro_costo_id, observaciones, terminos_condiciones, motivo_anulacion, auditoría.

### 3.9 pur_orden_compra_detalle

- orden_compra_detalle_id, orden_compra_id, producto_id, cantidad_ordenada, unidad_medida_id, precio_unitario, descuento_porcentaje, cantidad_recepcionada, observaciones, especificaciones.

### 3.10 pur_recepcion

- recepcion_id, empresa_id, numero_recepcion, fecha_recepcion, orden_compra_id, proveedor_id, almacen_id, guia_remision_numero/fecha, transportista, placa_vehiculo, recepcionado_por_*, total_items, total_cantidad, estado, requiere_inspeccion, inspeccion_id, movimiento_inventario_id, observaciones, incidencias.

### 3.11 pur_recepcion_detalle

- recepcion_detalle_id, recepcion_id, orden_compra_detalle_id, producto_id, cantidad_ordenada, cantidad_recepcionada, unidad_medida_id, lote, fecha_vencimiento, precio_unitario, ubicacion_almacen, observaciones, motivo_diferencia.

---

## 4. Pantallas detectadas en frontend

| Pantalla | Archivo | Componentes principales | Hooks / estado | Endpoints consumidos | Permisos |
|----------|---------|-------------------------|---------------|---------------------|----------|
| Proveedores | `pages/ProveedoresPage.tsx` | PurPageLayout, Dialog create/edit, tabla | useState, useEffect, useCallback; empresaService (ORG), proveedorService | GET/POST/PUT /pur/proveedores | pur (ver) |
| Contactos de Proveedor | `pages/ContactosPage.tsx` | PurPageLayout, Dialog create/edit, tabla | Idem; proveedorService, contactoProveedorService | GET/POST/PUT /pur/contactos | pur (ver) |
| Productos por Proveedor | `pages/ProductosProveedorPage.tsx` | PurPageLayout, Dialog create/edit, tabla | proveedorService, productoProveedorService, productoService, unidadMedidaService (INV) | GET/POST/PUT /pur/productos-proveedor | pur (ver) |
| Solicitudes de Compra | `pages/SolicitudesPage.tsx` | PurPageLayout, Dialog create/edit, tabla | empresaService, departamentoService, centroCostoService (ORG), almacenService (INV), solicitudCompraService | GET/POST/PUT /pur/solicitudes | pur (ver) |
| Cotizaciones | `pages/CotizacionesPage.tsx` | PurPageLayout, Dialog create/edit, tabla | empresaService, proveedorService, solicitudCompraService, cotizacionService | GET/POST/PUT /pur/cotizaciones | pur (ver) |
| Órdenes de Compra | `pages/OrdenesCompraPage.tsx` | PurPageLayout, Dialog create/edit, tabla | empresaService, centroCostoService, almacenService, proveedorService, solicitudCompraService, cotizacionService, ordenCompraService | GET/POST/PUT /pur/ordenes-compra | pur (ver) |
| Recepciones | `pages/RecepcionesPage.tsx` | PurPageLayout, Dialog create/edit, tabla | empresaService, almacenService, proveedorService, ordenCompraService, recepcionService | GET/POST/PUT /pur/recepciones | pur (ver) |

**Layout común:** `PurPageLayout.tsx` (título, descripción, acción opcional, children).  
**Rutas:** Definidas en `routes.tsx`: `/pur` → redirect a `proveedores`; `proveedores`, `contactos`, `productos-proveedor`, `solicitudes`, `cotizaciones`, `ordenes-compra`, `recepciones`.  
**Tipos:** `pur.types.ts` — Proveedor, ContactoProveedor, ProductoProveedor, SolicitudCompra, Cotizacion, OrdenCompra, Recepcion (y Create/Update); **no existen tipos para ningún *_detalle**.

---

## 5. Consumo de endpoints

### 5.1 Endpoints utilizados por el frontend

| Método | Endpoint | Archivo que lo usa | Función / servicio |
|--------|----------|--------------------|---------------------|
| GET | /api/v1/pur/proveedores | pur.service.ts | proveedorService.list, getById |
| POST | /api/v1/pur/proveedores | pur.service.ts | proveedorService.create |
| PUT | /api/v1/pur/proveedores/{id} | pur.service.ts | proveedorService.update |
| GET | /api/v1/pur/contactos | pur.service.ts | contactoProveedorService.list, getById |
| POST | /api/v1/pur/contactos | pur.service.ts | contactoProveedorService.create |
| PUT | /api/v1/pur/contactos/{id} | pur.service.ts | contactoProveedorService.update |
| GET | /api/v1/pur/productos-proveedor | pur.service.ts | productoProveedorService.list, getById |
| POST | /api/v1/pur/productos-proveedor | pur.service.ts | productoProveedorService.create |
| PUT | /api/v1/pur/productos-proveedor/{id} | pur.service.ts | productoProveedorService.update |
| GET | /api/v1/pur/solicitudes | pur.service.ts | solicitudCompraService.list, getById |
| POST | /api/v1/pur/solicitudes | pur.service.ts | solicitudCompraService.create |
| PUT | /api/v1/pur/solicitudes/{id} | pur.service.ts | solicitudCompraService.update |
| GET | /api/v1/pur/cotizaciones | pur.service.ts | cotizacionService.list, getById |
| POST | /api/v1/pur/cotizaciones | pur.service.ts | cotizacionService.create |
| PUT | /api/v1/pur/cotizaciones/{id} | pur.service.ts | cotizacionService.update |
| GET | /api/v1/pur/ordenes-compra | pur.service.ts | ordenCompraService.list, getById |
| POST | /api/v1/pur/ordenes-compra | pur.service.ts | ordenCompraService.create |
| PUT | /api/v1/pur/ordenes-compra/{id} | pur.service.ts | ordenCompraService.update |
| GET | /api/v1/pur/recepciones | pur.service.ts | recepcionService.list, getById |
| POST | /api/v1/pur/recepciones | pur.service.ts | recepcionService.create |
| PUT | /api/v1/pur/recepciones/{id} | pur.service.ts | recepcionService.update |

Base URL usada: instancia `api` (axios) con prefijo según config; el servicio usa `BASE = '/pur'` y paths relativos (proveedores, contactos, etc.), por lo que la URL final depende del baseURL de la instancia (típicamente incluye `/api/v1`).

### 5.2 Resumen

- Solo se consumen **CRUD de cabecera** (list, getById, create, update) para las 7 entidades.
- **No se consumen:** endpoints de detalle (solicitudes-detalle, cotizaciones-detalle, ordenes-compra-detalle, recepciones-detalle) ni acciones de flujo (aprobar/rechazar/marcar-procesada, marcar-ganadora, aprobar/anular OC, procesar recepción).

---

## 6. Matriz funcionalidad vs implementación

| Funcionalidad | Pantalla | Endpoint(s) relevante(s) | Estado |
|---------------|----------|---------------------------|--------|
| Catálogo Proveedores (listar/crear/editar) | Proveedores | GET/POST/PUT proveedores | ✔ Implementado completamente (cabecera) |
| Contactos por proveedor (listar/crear/editar) | Contactos | GET/POST/PUT contactos | ✔ Implementado completamente |
| Productos por proveedor (listar/crear/editar) | Productos por Proveedor | GET/POST/PUT productos-proveedor | ✔ Implementado completamente |
| Solicitud de Compra cabecera (listar/crear/editar) | Solicitudes | GET/POST/PUT solicitudes | ✔ Implementado completamente |
| Solicitud de Compra con ítems (detalle) | — | solicitudes-detalle | ✖ No implementado |
| Aprobar / Rechazar / Marcar procesada solicitud | — | POST solicitudes/{id}/aprobar, rechazar, marcar-procesada | ✖ No implementado |
| Cotización cabecera (listar/crear/editar) | Cotizaciones | GET/POST/PUT cotizaciones | ✔ Implementado completamente |
| Cotización con ítems por proveedor | — | cotizaciones-detalle | ✖ No implementado |
| Marcar cotización ganadora | — | POST cotizaciones/{id}/marcar-ganadora | ✖ No implementado |
| Orden de Compra cabecera (listar/crear/editar) | Órdenes de Compra | GET/POST/PUT ordenes-compra | ✔ Implementado completamente |
| Orden de Compra con ítems (detalle) | — | ordenes-compra-detalle | ✖ No implementado |
| Aprobar / Anular OC | — | POST ordenes-compra/{id}/aprobar, anular | ✖ No implementado |
| Recepción cabecera (listar/crear/editar) | Recepciones | GET/POST/PUT recepciones | ✔ Implementado completamente |
| Recepción con ítems (cantidades recibidas por línea) | — | recepciones-detalle, POST recepciones/{id}/procesar | ✖ No implementado |
| Procesar recepción (generar movimiento INV) | — | POST recepciones/{id}/procesar | ✖ No implementado |
| Envío de cotización/OC por email (manual) | — | (no verificado en OpenAPI) | ✖ No implementado / no verificado |
| Comparación de cotizaciones lado a lado | — | (varias cotizaciones) | ✖ No implementado |
| Vista detalle de OC con líneas y % recepción | — | GET ordenes-compra/{id} + detalle | ⚠ Parcial (solo listado; no vista detalle con líneas) |

---

## 7. Pantallas faltantes

No faltan pantallas de menú según MENU_NAVEGACION.md; las 7 opciones tienen página. Lo que falta es **vista detalle / flujo por documento**:

- **Vista detalle de Solicitud de Compra** con ítems (producto, cantidad, UM, justificación), estado y acciones Aprobar/Rechazar/Marcar procesada. Podría ser modal o ruta `/pur/solicitudes/:id`.
- **Vista detalle de Cotización** con ítems (producto, cantidad, precio, total) y acción “Marcar ganadora”. Posible comparador de varias cotizaciones (misma solicitud o mismo conjunto de ítems).
- **Vista detalle de Orden de Compra** con líneas (producto, cantidad, precio, almacén, cantidad recepcionada) y acciones Aprobar/Anular. Ruta sugerida `/pur/ordenes-compra/:id`.
- **Vista detalle de Recepción** con líneas (producto, ordenado, recibido, diferencia) y botón [Procesar Recepción]. Ruta sugerida `/pur/recepciones/:id`.

Endpoints que deberían consumirse en cada caso: los CRUD de *-detalle correspondientes y los POST de acción (aprobar, rechazar, marcar-procesada, marcar-ganadora, aprobar, anular, procesar).

---

## 8. Formularios incompletos

### 8.1 Proveedor

- **Crear:** Incluye empresa, código, razón social, nombre comercial, tipo/numero documento, dirección, teléfono, email, contacto nombre, condición pago, días crédito, moneda, límite crédito.  
- **Faltan en formulario:** pais/departamento/provincia/distrito/ubigeo (BD y manual), tipo_proveedor, categoria_proveedor (manual: A/B/C), telefono_secundario, email_cotizaciones, sitio_web, contacto_cargo, **datos bancarios** (banco, numero_cuenta, tipo_cuenta, cci), calificacion, nivel_confianza, es_proveedor_homologado, observaciones.  
- **Editar:** No incluye nombre comercial, tipo_proveedor, categoria_proveedor, datos bancarios, ni moneda en el formulario de edición.

### 8.2 Contacto de Proveedor

- Formularios cubren nombre, cargo, área, teléfono, móvil, email y flags (principal, cotizaciones, cobranzas). Coincide con BD. **Completo** para los campos de la tabla.

### 8.3 Producto por Proveedor

- **BD:** unidad_medida_id es NOT NULL; en frontend es opcional. Crear/editar pueden enviar null y fallar si el backend exige FK.  
- Formularios tienen código proveedor, descripción, precio, moneda, unidad medida, cantidad mínima, múltiplo, tiempo entrega, vigencia, prioridad, es preferido. Falta validación explícita de unidad obligatoria según BD.

### 8.4 Solicitud de Compra

- **Cabecera:** Se envían empresa, número, fechas, departamento, almacén, centro costo, tipo, motivo, total estimado, moneda, observaciones.  
- **Faltan:** solicitante_nombre / usuario_solicitante_id no se muestran como selector de usuario (si el backend lo requiere).  
- **Crítico:** No hay **ningún ítem (detalle)**. La BD y el manual exigen líneas: producto, cantidad_solicitada, unidad_medida_id, precio_referencial, observaciones. Sin detalle la solicitud no es utilizable para generar OC con ítems.

### 8.5 Cotización

- **Cabecera:** Empresa, proveedor, fechas, solicitud compra, condición pago, días crédito, tiempo entrega, lugar entrega, moneda, subtotal/descuento/igv/total, observaciones.  
- **BD:** cotizacion usa moneda_id (FK), no string moneda; el frontend usa `moneda` string — posible desalineación.  
- **Crítico:** No hay **ítems**. La BD tiene pur_cotizacion_detalle (producto, cantidad, unidad_medida_id, precio_unitario, descuento_porcentaje, tiempo_entrega_dias). Sin detalle no se puede registrar la oferta por producto.

### 8.6 Orden de Compra

- **Cabecera:** Empresa, proveedor, fechas, solicitud, cotización, almacén destino, centro costo, condición pago, días crédito, moneda, tipo cambio, subtotal/descuento/igv/total, dirección entrega, observaciones.  
- **BD:** orden_compra tiene moneda_id (FK); frontend usa `moneda` string — verificar compatibilidad con backend.  
- **Crítico:** No hay **líneas**. pur_orden_compra_detalle (producto, cantidad_ordenada, unidad_medida_id, precio_unitario, descuento_porcentaje, almacén por línea si aplica). Sin detalle la OC no tiene ítems para recepcionar.

### 8.7 Recepción

- **Cabecera:** Empresa, orden de compra, proveedor, almacén, fecha, guía remisión, transportista, placa, observaciones.  
- **Crítico:** No hay **líneas de recepción**. pur_recepcion_detalle enlaza recepcion_id, orden_compra_detalle_id, cantidad_ordenada, cantidad_recepcionada. Sin detalle no se puede indicar qué se recibió por ítem ni llamar a “procesar” con datos válidos. Falta checkbox “Generar inspección de calidad (QMS)” y acción [Procesar Recepción] que llame a POST recepciones/{id}/procesar.

---

## 9. Endpoints backend no utilizados

Según `backend_openapi.json` (paths que contienen pur):

| Método | Endpoint | Uso recomendado |
|--------|----------|------------------|
| POST | /api/v1/pur/solicitudes/{solicitud_id}/aprobar | Botón Aprobar en vista detalle solicitud |
| POST | /api/v1/pur/solicitudes/{solicitud_id}/rechazar | Botón Rechazar + motivo |
| POST | /api/v1/pur/solicitudes/{solicitud_id}/marcar-procesada | Marcar como procesada cuando ya hay OC |
| GET/POST/PUT/DELETE | /api/v1/pur/solicitudes-detalle, /{solicitud_detalle_id} | CRUD ítems de la solicitud |
| POST | /api/v1/pur/cotizaciones/{cotizacion_id}/marcar-ganadora | Marcar cotización ganadora en comparador |
| GET/POST/PUT/DELETE | /api/v1/pur/cotizaciones-detalle, /{cotizacion_detalle_id} | CRUD ítems de la cotización |
| POST | /api/v1/pur/ordenes-compra/{orden_compra_id}/aprobar | Aprobar OC |
| POST | /api/v1/pur/ordenes-compra/{orden_compra_id}/anular | Anular OC + motivo |
| GET/POST/PUT/DELETE | /api/v1/pur/ordenes-compra-detalle, /{orden_compra_detalle_id} | CRUD líneas de la OC |
| POST | /api/v1/pur/recepciones/{recepcion_id}/procesar | Procesar recepción (generar movimiento INV) |
| GET/POST/PUT/DELETE | /api/v1/pur/recepciones-detalle, /{recepcion_detalle_id} | CRUD líneas de la recepción |

Todos los anteriores están **disponibles en backend y no utilizados** en el frontend.

---

## 10. Problemas de UX

- **Formularios planos:** Proveedor y otros concentran muchos campos en un solo formulario sin pestañas o secciones (Información general, Dirección, Contacto, Condiciones comerciales, Datos bancarios, etc.), lo que dificulta el uso en ERP tipo SAP/Odoo.
- **Sin vista detalle:** No hay pantalla de “ver documento completo” para Solicitud, Cotización, OC o Recepción (cabecera + ítems + estado). El usuario solo ve listas y modales de edición de cabecera.
- **Sin flujo guiado:** No están expuestos los botones de acción (Aprobar, Rechazar, Marcar ganadora, Procesar recepción), por lo que el flujo documentado no es ejecutable desde la UI.
- **Sin detalle en tablas:** Las tablas de listado no muestran resumen de ítems (por ejemplo “3 ítems” o total de líneas); no hay enlace “Ver” a detalle.
- **Recepción:** No se distingue claramente “crear recepción” vs “procesar recepción” (acción que actualiza stock). Falta opción “Requerir inspección QMS” y mensaje claro de consecuencias al procesar.
- **Cotización:** No hay comparador de cotizaciones por producto ni indicador visual de “ganadora”.
- **Órdenes de compra:** No se muestra contacto de proveedor en cabecera (manual sugiere “Contacto: Carlos Mendoza”); moneda/tipo cambio podrían ir en sección “Condiciones”.
- **Validaciones:** No se documentan validaciones de negocio en frontend (por ejemplo total = suma de líneas, cantidad recibida ≤ ordenada). Dependencia fuerte del backend.
- **Mensajes de error:** Se usa getErrorMessage(err); no se analiza si hay códigos específicos del backend para mostrar mensajes más claros (ej. “OC ya recepcionada”, “Solicitud ya aprobada”).

---

## 11. Brechas funcionales detectadas

1. **Detalle de documentos inexistente:** Solicitud, Cotización, OC y Recepción se gestionan solo como cabecera. No se pueden agregar/editar ítems en el frontend. El flujo compras (solicitud → cotización → OC → recepción) no es operativo.
2. **Acciones de flujo no usadas:** Aprobar/rechazar/marcar procesada (solicitud), marcar ganadora (cotización), aprobar/anular (OC), procesar (recepción) no están disponibles en la UI.
3. **Proveedor:** Faltan en formularios: tipo/categoría, datos bancarios, ubicación geográfica, email cotizaciones, sitio web, homologación y varios campos opcionales; edición más limitada que creación.
4. **Producto por proveedor:** unidad_medida_id es obligatorio en BD pero opcional en tipos/formulario; riesgo de error al crear.
5. **Moneda:** Cotización y OC en BD usan moneda_id (FK); en frontend se usa string `moneda` — posible inconsistencia o necesidad de mapeo.
6. **Recepción:** No se capturan líneas (cantidad recibida por ítem); no existe botón “Procesar recepción” ni opción de inspección QMS.
7. **Navegación:** Las 7 pantallas están en rutas y se asume que el menú lateral las muestra (según configuración de menú por tenant); no se verificó en código la definición de ítems de menú PUR (pueden venir de backend/modulos-menus).
8. **Control de pagos:** El catálogo menciona “Control de pagos”; no hay pantalla ni flujo específico de pagos a proveedores en el frontend analizado (puede estar en módulo FIN).

---

## 12. Propuesta de mejoras

### 12.1 Pantallas / vistas

- Añadir **vista detalle** para Solicitud, Cotización, OC y Recepción (ruta o modal con cabecera + tabla de ítems + acciones según estado).
- En listados, añadir columna o badge de “N ítems” y botón “Ver” que abra la vista detalle.
- Implementar **comparador de cotizaciones** (misma solicitud o mismos ítems) con opción “Marcar ganadora”.

### 12.2 Formularios

- **Proveedor:** Reorganizar en secciones (Datos generales, Dirección, Contacto, Condiciones comerciales, Datos bancarios, Clasificación/Evaluación). Incluir todos los campos de la BD necesarios para facturación y pagos; en edición permitir modificar los mismos bloques.
- **Producto por proveedor:** Hacer obligatoria la unidad de medida en UI y tipos (alineado con BD).
- **Solicitud:** Formulario cabecera + **grid/lista de ítems** (producto, cantidad, UM, precio referencial, justificación) con agregar/quitar línea; persistir vía API solicitudes-detalle.
- **Cotización:** Cabecera + **ítems** (producto, cantidad, UM, precio unitario, descuento %, tiempo entrega); consumir cotizaciones-detalle.
- **Orden de Compra:** Cabecera + **líneas** (producto, cantidad, UM, precio, descuento %, almacén); consumir ordenes-compra-detalle; opción “Cargar desde cotización ganadora” si el backend lo soporta.
- **Recepción:** Cabecera + **líneas** (desde OC: producto, cantidad ordenada, cantidad recibida, diferencia); checkbox “Requerir inspección QMS”; botón [Procesar recepción] que llame a POST recepciones/{id}/procesar.

### 12.3 Endpoints

- Consumir todos los CRUD de *-detalle (solicitudes-detalle, cotizaciones-detalle, ordenes-compra-detalle, recepciones-detalle).
- Consumir POST de acciones: aprobar, rechazar, marcar-procesada (solicitud); marcar-ganadora (cotización); aprobar, anular (OC); procesar (recepción).
- Definir en tipos (y en servicio si aplica) moneda_id vs moneda string según respuesta real del backend para cotización y OC.

### 12.4 UX

- Aplicar estructura por secciones/pestañas en formularios largos (Proveedor, y en detalle de OC/Cotización si se añaden más campos).
- Mostrar estados con badges y deshabilitar/habilitar botones según estado (ej. “Aprobar” solo en pendiente).
- Después de “Procesar recepción”, mostrar mensaje de éxito e indicar que se generó movimiento de inventario; opcionalmente enlace a movimiento o a stock.
- En recepción, mostrar advertencia si cantidad recibida > ordenada (si el negocio lo permite o no).

### 12.5 Validación y errores

- Validar en frontend que totales coincidan con suma de líneas cuando se calculen en cliente.
- Mostrar mensajes específicos para errores de negocio (ej. “La OC ya está cerrada”, “Solicitud ya aprobada”) si el backend los devuelve con código o clave.

---

## 13. Plan de implementación

### Prioridad alta

| # | Qué implementar | Pantalla/área afectada | Endpoint(s) | Impacto funcional |
|---|------------------|-------------------------|-------------|-------------------|
| 1 | Ítems de Solicitud de Compra (alta/edición/borrado de líneas) | Solicitudes | solicitudes-detalle (GET/POST/PUT/DELETE) | Permite crear solicitudes con ítems y usarlas como base para cotización/OC |
| 2 | Ítems de Orden de Compra (líneas con producto, cantidad, precio, UM) | Órdenes de Compra | ordenes-compra-detalle | OC con ítems; prerequisito para recepcionar por línea |
| 3 | Ítems de Recepción (cantidad recibida por línea) + botón Procesar | Recepciones | recepciones-detalle, POST recepciones/{id}/procesar | Cierra el flujo: recepción real y actualización de inventario |
| 4 | Acciones Aprobar / Rechazar / Marcar procesada en Solicitud | Solicitudes (vista detalle) | POST solicitudes/{id}/aprobar, rechazar, marcar-procesada | Flujo de aprobación de requisiciones |

### Prioridad media

| # | Qué implementar | Pantalla/área afectada | Endpoint(s) | Impacto funcional |
|---|------------------|-------------------------|-------------|-------------------|
| 5 | Ítems de Cotización (líneas por producto/precio) | Cotizaciones | cotizaciones-detalle | Registrar ofertas por ítem y comparar |
| 6 | Marcar cotización ganadora | Cotizaciones (vista detalle o comparador) | POST cotizaciones/{id}/marcar-ganadora | Definir ganadora para generar OC |
| 7 | Aprobar / Anular Orden de Compra | Órdenes de Compra (vista detalle) | POST ordenes-compra/{id}/aprobar, anular | Flujo de estados de la OC |
| 8 | Vista detalle para OC y Recepción (cabecera + ítems) | Órdenes de Compra, Recepciones | GET ordenes-compra/{id}, ordenes-compra-detalle; GET recepciones/{id}, recepciones-detalle | Consulta y edición por documento completo |
| 9 | Formulario Proveedor completo (secciones, datos bancarios, categoría, ubicación) | Proveedores | Mismos PUT/POST | Alineación con BD y manual; mejor UX |

### Prioridad baja

| # | Qué implementar | Pantalla/área afectada | Endpoint(s) | Impacto funcional |
|---|------------------|-------------------------|-------------|-------------------|
| 10 | Vista detalle Solicitud y Cotización (cabecera + ítems) | Solicitudes, Cotizaciones | GET solicitudes/{id}, solicitudes-detalle; GET cotizaciones/{id}, cotizaciones-detalle | Consistencia y flujo claro |
| 11 | Comparador de cotizaciones (varias cotizaciones lado a lado) | Cotizaciones | GET cotizaciones (filtro por solicitud o ítems) | Mejor decisión de compra |
| 12 | Producto por proveedor: unidad de medida obligatoria | Productos por Proveedor | Mismos | Evitar errores por null en BD |
| 13 | Moneda: alinear moneda_id (FK) en Cotización y OC si el backend lo exige | Cotizaciones, Órdenes de Compra | GET catálogo monedas si existe; POST/PUT con moneda_id | Consistencia con esquema de BD |
| 14 | Opción “Requerir inspección QMS” en recepción | Recepciones | Incluir en payload create/update o en procesar | Trazabilidad con módulo QMS |

---

**Fin del documento.**  
Para cualquier implementación posterior, usar este documento como referencia de brechas y prioridades sin modificar código hasta que se autorice la implementación.
