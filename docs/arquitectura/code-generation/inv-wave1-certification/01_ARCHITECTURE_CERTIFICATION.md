# 01 — Certificación de arquitectura INV × FCE

**Fecha:** 2026-07-17  
**Resultado:** APROBADO

---

## 1. Capas

```
┌─────────────────────────────────────────────────────────┐
│ Páginas INV (consumidores)                              │
│  Categorias / UM / TipoMov / Almacén / Producto         │
│  MovimientoForm / InventarioFisicoForm                  │
├─────────────────────────────────────────────────────────┤
│ hooks INV (toasts + serializers documentales)           │
├─────────────────────────────────────────────────────────┤
│ features/inv/codigo (adaptación de módulo)              │
│  manifest · register · create utils · serialize         │
│  payload builders por entidad                           │
├─────────────────────────────────────────────────────────┤
│ shared/components/codigo (CodigoField*)                 │
├─────────────────────────────────────────────────────────┤
│ core/codigo (Frontend Code Generation Engine)           │
└─────────────────────────────────────────────────────────┘
```

El Engine permanece en `src/core/codigo`. INV no lo modifica; solo lo consume.

---

## 2. Infraestructura Fase 0 — certificado

| Artefacto | Ruta | Responsabilidad |
|-----------|------|-----------------|
| Manifest | `inv.codigo.manifest.ts` | 7 entradas: policy, fieldKey, meta UX |
| Registro | `register-inv-codigo-manifest.ts` | `registerCodigoManifest('inv', …)` |
| Bootstrap | `inv/routes.tsx` | side-effect import del registro |
| Create helpers | `inv-codigo-create.utils.ts` | `mutateInvCreateWithCodigo` / `mutateInvCreateAutoRequired` |
| Serializers | `inv-codigo-serialize.utils.ts` | AUTO_DEFAULT / AUTO_REQUIRED / BR-IMM |
| Payload maestros | `*-codigo.payload.ts` | CREATE base + UPDATE strip Motor |
| Payload docs | `documento-codigo.payload.ts` | serializers compartidos simple/con-detalle |
| Barrel | `codigo/index.ts` | API pública del módulo |

Patrón espejo de ORG (`mutateOrgCreateWithCodigo` ↔ `mutateInvCreateWithCodigo`).

---

## 3. Manifest INV

| sequenceKey | entityKey | fieldKey | policy |
|-------------|-----------|----------|--------|
| `inv_categoria_producto` | categoria | codigo | AUTO_DEFAULT |
| `inv_unidad_medida` | unidad_medida | codigo | AUTO_DEFAULT |
| `inv_tipo_movimiento` | tipo_movimiento | codigo | AUTO_DEFAULT |
| `inv_almacen` | almacen | codigo | AUTO_DEFAULT |
| `inv_producto` | producto | codigo_sku | AUTO_DEFAULT |
| `inv_movimiento` | movimiento | numero_movimiento | AUTO_REQUIRED |
| `inv_inventario_fisico` | inventario_fisico | numero_inventario | AUTO_REQUIRED |

Coincide 1:1 con el contrato `inv-wave1-frontend-contract` §1.

---

## 4. Reutilización y no duplicación

| Capacidad | Ubicación | Duplicada en INV? |
|-----------|-----------|-------------------|
| Policy resolver / state machine / payload slice | Engine | No |
| UI CodigoField / AutoPanel / Manual / ReadOnly | shared | No |
| Manifest + serializers de módulo | `inv/codigo` | No (solo adaptación) |
| Generación local de correlativos | — | Ausente |

`Math.random` en `inv-transactional-form-init.ts` genera claves React de líneas, **no** números documentales.

---

## 5. Calidad arquitectónica

- Separación clara: Engine (core) / adaptación (feature) / UI (shared) / páginas.
- Un serializer documental por operación (CREATE/UPDATE), reutilizado por hooks simple y `con-detalle`.
- Producto híbrido: solo `codigo_sku` es Motor; `codigo_barra|interno|fabricante|sunat` permanecen de negocio.
- Workflows (procesar, autorizar, anular, estornar / aprobar, finalizar, anular) no tocan campos Motor.

---

## 6. Dictamen de arquitectura

**APROBADO.** La arquitectura INV × FCE es estable, trazable al patrón ORG y lista como referencia operativa para módulos ERP posteriores (incluyendo documentos AUTO_REQUIRED, no presentes en ORG Wave 1).
