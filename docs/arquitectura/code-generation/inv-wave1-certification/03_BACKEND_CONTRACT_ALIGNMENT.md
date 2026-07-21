# 03 — Alineación Backend / OpenAPI / Contrato INV

**Fecha:** 2026-07-17  
**Resultado:** APROBADO  
**Fuente contractual:** `app/docs/arquitectura/code-generation/inv-wave1-frontend-contract/`  
**Contrato máquina:** OpenAPI Snapshot vigente del proyecto

---

## 1. Mapa contractual Wave 1

| Recurso | sequence_key | Campo Motor | Policy | CREATE FE | UPDATE FE |
|---------|--------------|-------------|--------|-----------|-----------|
| Categoría | inv_categoria_producto | codigo | AUTO_DEFAULT | opcional / omitible | ausente (BR-IMM) |
| Unidad de medida | inv_unidad_medida | codigo | AUTO_DEFAULT | opcional / omitible | ausente |
| Tipo de movimiento | inv_tipo_movimiento | codigo | AUTO_DEFAULT | opcional / omitible | ausente |
| Almacén | inv_almacen | codigo | AUTO_DEFAULT | opcional / omitible | ausente |
| Producto | inv_producto | codigo_sku | AUTO_DEFAULT | opcional / omitible | ausente (solo SKU) |
| Movimiento | inv_movimiento | numero_movimiento | AUTO_REQUIRED | ausente | ausente |
| Inventario físico | inv_inventario_fisico | numero_inventario | AUTO_REQUIRED | ausente | ausente |

---

## 2. Tipos TypeScript (`inv.types.ts`)

| Interfaz | Campo Motor | Estado certificado |
|----------|-------------|--------------------|
| `*Create` maestros | `codigo?` / `codigo_sku?` | Opcional |
| `ProductoUpdate` | `Omit<…, 'codigo_sku'>` | BR-IMM SKU |
| `MovimientoCreate` / `MovimientoConDetalleCreate` | sin `numero_movimiento` | AUTO_REQUIRED |
| `MovimientoUpdate` / `MovimientoConDetalleUpdate` | sin `numero_movimiento` | BR-IMM |
| `InventarioFisicoCreate` / `…ConDetalleCreate` | sin `numero_inventario` | AUTO_REQUIRED |
| `InventarioFisicoUpdate` / `…ConDetalleUpdate` | sin `numero_inventario` | BR-IMM |
| `*Read` | campo Motor `string` requerido | Intactos |

Códigos alternativos de Producto permanecen en Create/Update (fuera del Motor).

---

## 3. Serialización runtime

| Helper | Policy | Efecto |
|--------|--------|--------|
| `normalizeInvAutoDefaultCreateField` | AUTO_DEFAULT CREATE | omite vacío/null; trim si valor |
| `stripInvAutoRequiredField` | AUTO_REQUIRED | elimina clave siempre |
| `stripInvMotorFieldFromUpdate` | BR-IMM UPDATE | elimina clave siempre |
| `serializeMovimiento*Payload` | docs | mismo serializer simple y con-detalle |
| `serializeInventarioFisico*Payload` | docs | idem |

Los hooks documentales aplican serializers antes del service layer; los maestros aplican builders en la página + merge del Engine.

---

## 4. Compatibilidad Backend

Semántica esperada (Backend INV certificado):

- AUTO_DEFAULT: omitido/null/vacío → Backend genera; manual único → acepta.
- AUTO_REQUIRED: Frontend nunca envía número; Backend siempre genera.
- BR-IMM: identificador inmutable post-alta; no viaja en PUT.
- Response `201` / GET: identificador definitivo obligatorio.

Frontend INV:

- No consulta `cfg_codigo_secuencia`.
- No reserva ni calcula correlativos.
- No reenvía Motor en UPDATE.
- Toast CREATE usa el valor del response.

---

## 5. Checklist contractual (extracto cerrado)

Del paquete `05_IMPLEMENTATION_CHECKLIST.md` — gates Frontend relevantes:

- [x] Tipos Create/Update alineados
- [x] CREATE maestros sin required de código
- [x] CREATE docs sin número
- [x] UPDATE BR-IMM
- [x] Producto protege solo `codigo_sku`
- [x] Toasts con identificador del Backend
- [x] Sin generación local
- [x] Serializers compartidos con-detalle

---

## 6. Dictamen de contrato

**APROBADO.** El Frontend INV está alineado al contrato oficial Wave 1, al OpenAPI Snapshot vigente y a la semántica Backend del Motor de Códigos.
