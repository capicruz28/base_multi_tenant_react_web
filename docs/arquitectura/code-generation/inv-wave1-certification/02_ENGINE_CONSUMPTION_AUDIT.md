# 02 — Auditoría de consumo del Engine

**Fecha:** 2026-07-17  
**Resultado:** APROBADO (25/25 criterios cubiertos)

---

## Matriz de verificación

| # | Criterio | Evidencia | Veredicto |
|---|----------|-----------|-----------|
| 1 | Infraestructura Fase 0 | `src/features/inv/codigo/*` | Cumple |
| 2 | Manifest INV | 7 entradas canónicas | Cumple |
| 3 | Registro del manifest | `routes.tsx` → `register-inv-codigo-manifest` | Cumple |
| 4 | Payload builders | `categoria|unidad|tipo|almacen|producto-codigo.payload.ts` | Cumple |
| 5 | Serializers | `inv-codigo-serialize.utils.ts` + `documento-codigo.payload.ts` | Cumple |
| 6 | CodigoField | CREATE maestros/docs; ReadOnly en UPDATE maestros/docs | Cumple |
| 7 | useCodigoFieldController | 5 maestros + 2 docs (`mode: 'create'`) | Cumple |
| 8 | BR-IMM | UPDATE omite campo Motor; UI readonly | Cumple |
| 9 | AUTO_DEFAULT | 5 maestros; omit/trim vía normalize | Cumple |
| 10 | AUTO_REQUIRED | Movimiento + Inventario Físico; strip en hooks | Cumple |
| 11 | Tipos TS | Create opcionales / sin número; Update sin Motor | Cumple |
| 12 | Hooks | Toasts con response; serializers en mutate documental | Cumple |
| 13 | Formularios | Sin input editable de Motor en CREATE estándar | Cumple |
| 14 | Dirty state | Campo Motor fuera del snapshot de negocio | Cumple |
| 15 | Toasts | Código/SKU/número del `201` | Cumple |
| 16 | Servicios | Solo HTTP; sin generación local | Cumple |
| 17 | Backend | Compatible con contrato Wave 1 certificado | Cumple |
| 18 | OpenAPI Snapshot | Tipos alineados a Create/Update vigentes | Cumple |
| 19 | inv-wave1-frontend-contract | sequenceKeys, policies, BR-IMM | Cumple |
| 20 | Consistencia ORG | Misma config UX AUTO_DEFAULT (sin override permanente) | Cumple |
| 21 | Sin lógica manual de códigos | No required/generación/payload ad hoc de Motor | Cumple |
| 22 | Reutilización Engine | mergeCodigo / controller / CodigoField | Cumple |
| 23 | Sin duplicación | Adaptadores de módulo, no reimplementación | Cumple |
| 24 | Calidad arquitectura | Capas claras; serializers compartidos docs | Cumple |
| 25 | Calidad pruebas | 53 tests PASS en `inv/codigo/__tests__` | Cumple |

---

## Detalle por familia

### AUTO_DEFAULT (maestros)

Consumidores:

- `CategoriasPage`, `UnidadesMedidaPage`, `TiposMovimientoPage`, `AlmacenesPage`, `ProductosPage`

Configuración controller (alineada ORG):

```ts
useCodigoFieldController({
  sequenceKey: INV_CODIGO_SEQUENCE_KEYS.*,
  mode: 'create',
  disabled: formSubmitting,
  // allowManualOverride omitido → default false
});
```

Flujo CREATE:

1. `build*CreateBasePayload` (sin campo Motor / normalizado)
2. `mutateInvCreateWithCodigo` → `mergeCodigoIntoPayload`
3. Hook toast con `data.codigo` / `data.codigo_sku`

Flujo UPDATE:

1. `CodigoFieldReadOnly` con valor del registro
2. `build*UpdatePayload` → `stripInvMotorFieldFromUpdate`

### AUTO_REQUIRED (documentos)

Consumidores:

- `MovimientoFormPage`, `InventarioFisicoFormPage`

CREATE: `CodigoField` locked (policy AUTO_REQUIRED); payload **sin** `numero_*`.  
UPDATE: `CodigoFieldReadOnly`; serializers omiten Motor.  
Hooks simple y `con-detalle` reutilizan el mismo serializer.

### Producto (caso híbrido)

| Campo | Motor FCE | Editable negocio |
|-------|-----------|------------------|
| `codigo_sku` | Sí (AUTO_DEFAULT + BR-IMM) | No en UPDATE |
| `codigo_barra` | No | Sí |
| `codigo_interno` | No | Sí |
| `codigo_fabricante` | No | Sí |
| `codigo_sunat` | No | Sí |

---

## Consistencia con ORG (Golden Reference UX)

| Aspecto | ORG | INV maestros | Alineado |
|---------|-----|--------------|----------|
| AutoPanel CREATE | Sí | Sí | Sí |
| `allowManualOverride` permanente | No | No | Sí |
| `mutate*CreateWithCodigo` | Sí | Sí | Sí |
| Manifest por módulo | Sí | Sí | Sí |

INV aporta además el patrón documental AUTO_REQUIRED + BR-IMM, ausente en ORG Wave 1, por lo que se eleva a **Golden Reference ERP operativo**.

---

## Observaciones no bloqueantes

1. Harnesses de prueba habilitan `allowManualOverride: true` solo para validar capacidad del Engine; las páginas productivas no lo solicitan.
2. Warnings `act(...)` en tests de modo manual: ruido de RTL, no fallo funcional (suite PASS).
3. Certificación E2E staging no forma parte de este cierre documental.
