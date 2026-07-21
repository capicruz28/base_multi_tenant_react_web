# 04 — Certificación de pruebas INV × FCE

**Fecha:** 2026-07-17  
**Suite:** `src/features/inv/codigo/__tests__`  
**Ejecución de cierre:** `npx vitest run src/features/inv/codigo/__tests__`  
**Resultado:** **10 archivos / 53 tests — PASS**

---

## 1. Inventario de suites

| Archivo | Cobertura | Tests |
|---------|-----------|-------|
| `inv.codigo.manifest.test.ts` | Registro, policies, fieldKeys | 4 |
| `inv-codigo-serialize.utils.test.ts` | AUTO_DEFAULT / AUTO_REQUIRED / BR-IMM | 11 |
| `categoria-codigo.payload.test.ts` | CREATE/UPDATE Categoría | 5 |
| `categoria-codigo.engine-form.test.tsx` | CodigoField × Categoría | 2 |
| `fase2-maestros-codigo.payload.test.ts` | UM / TipoMov / Almacén payloads | 9 |
| `fase2-maestros-codigo.engine-form.test.tsx` | CodigoField × 3 maestros | 6 |
| `producto-codigo.payload.test.ts` | SKU Motor vs códigos negocio | 5 |
| `producto-codigo.engine-form.test.tsx` | CodigoField × Producto híbrido | 2 |
| `documento-codigo.payload.test.ts` | Movimiento / Inventario serializers + workflows | 7 |
| `documento-codigo.engine-form.test.tsx` | AUTO_REQUIRED UI (sin input manual) | 2 |

---

## 2. Escenarios certificados

### Manifest e infraestructura

- Manifest INV registra las 7 entidades con policies correctas.
- fieldKeys: `codigo`, `codigo_sku`, `numero_movimiento`, `numero_inventario`.

### Serializers

- AUTO_DEFAULT omite vacío/null; conserva trim.
- AUTO_REQUIRED elimina número aunque venga forzado.
- BR-IMM elimina Motor en UPDATE.
- Documentos: CREATE/UPDATE simple y con-detalle usan el mismo serializer.
- Payloads de workflow (anular/estornar/aprobar) no se alteran indebidamente.

### Maestros AUTO_DEFAULT

- CREATE auto: payload sin código.
- CREATE manual (capacidad Engine vía harness): código del controller.
- UPDATE: código no viaja aunque se inyecte localmente.

### Producto

- Solo `codigo_sku` es Motor.
- Códigos de negocio se preservan en CREATE/UPDATE.

### Documentos AUTO_REQUIRED

- UI: AutoPanel locked; sin textbox ni toggle manual.
- Payload: sin `numero_movimiento` / `numero_inventario`.

---

## 3. Qué no cubre esta suite (no bloqueante)

| Área | Estado |
|------|--------|
| E2E browser contra Backend staging | Fuera de cierre documental |
| Snapshots React Query de páginas completas | No requerido para FCE |
| Regresión RBAC / listados Tier C | Fuera del alcance Motor |
| Warnings `act(...)` en tests manuales | Ruido RTL; suite PASS |

---

## 4. Calidad

- Pruebas enfocadas en contrato de payload y comportamiento Engine.
- Harnesses habilitan override solo para demostrar capacidad del Engine, no el UX productivo.
- Sin duplicar lógica del Engine: se ejercita el consumer INV.

---

## 5. Dictamen de pruebas

**APROBADO.** La calidad y cobertura unitaria del consumo INV del FCE son suficientes para el cierre oficial de Wave 1 Frontend.
