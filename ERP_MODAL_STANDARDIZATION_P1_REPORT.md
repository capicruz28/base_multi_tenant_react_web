# ERP — Reporte implementación P1 estandarización modales (ORG + INV)

**Fecha:** 10 junio 2026  
**Estado:** Implementado — pendiente QA navegador por usuario  
**Referencias:** `ERP_MODAL_AND_WORKFLOW_UX_AUDIT.md`, `INV_MODAL_STACKING_FIX_REPORT.md`

---

## 1. Resumen

| Entregable | Estado |
|------------|--------|
| ORG — ConfirmDialog reactivar (6 pantallas) | **Implementado** |
| INV — Semántica workflow positivo (`warning`) | **Implementado** |
| `ERP_V2_STANDARDS_PROPOSAL.md` | **Generado** |
| Estándares maestros (V2, .cursorrules, PROMPT) | **No modificados** (según restricción) |

**Validación previa:** No existe componente reutilizable compartido para reactivar. El patrón canónico vive **por página** en INV (`reactivarTarget` + `confirmarReactivar` + `ConfirmDialog` `variant="info"`). Se replicó ese patrón en ORG.

---

## 2. Archivos modificados (lista exacta)

### ORG — Reactivar con confirmación

| Archivo | Cambio |
|---------|--------|
| `src/features/org/pages/EmpresaPage.tsx` | `reactivarTarget`, `confirmarReactivar`, `ConfirmDialog` info |
| `src/features/org/pages/SucursalesPage.tsx` | Idem |
| `src/features/org/pages/DepartamentosPage.tsx` | Idem |
| `src/features/org/pages/CargosPage.tsx` | Idem |
| `src/features/org/pages/CentrosCostoPage.tsx` | Idem |
| `src/features/org/pages/ParametrosPage.tsx` | Idem |

### INV — Semántica workflow positivo

| Archivo | Cambio |
|---------|--------|
| `src/features/inv/pages/InventarioFisicoPage.tsx` | Aprobar, Finalizar → `variant="warning"` |
| `src/features/inv/pages/MovimientosPage.tsx` | Autorizar, Procesar → `variant="warning"` |

**Total:** 8 archivos de código productivo.

**No modificados:** `ConfirmDialog.tsx`, `dialog.tsx`, IAM, Platform, estándares maestros, backend.

---

## 3. Detalle de implementación

### 3.1 ORG — Patrón reactivar (paridad INV)

Por pantalla:

1. Estado `reactivarTarget: Entity | null`
2. Reset en `resetLocalFilters` (donde aplica): `setReactivarTarget(null)`
3. Botón fila inactiva: `onClick={() => setReactivarTarget(row)}`
4. `disabled={reactivarMutation.isPending || discardPending !== null}`
5. `confirmarReactivar()` ejecuta mutación solo tras confirmar
6. `ConfirmDialog`:
   - `isOpen={!!reactivarTarget && discardPending === null}` (B11-02)
   - `variant="info"`
   - Mensaje con nombre legible (nunca UUID)
   - `loading={reactivarMutation.isPending}`

| Pantalla | Campo en mensaje |
|----------|------------------|
| Empresas | `razon_social` |
| Sucursales | `nombre` |
| Departamentos | `nombre` |
| Cargos | `nombre` |
| Centros de costo | `nombre` |
| Parámetros | `nombre_parametro` |

**Desactivar:** sin cambios (`variant="danger"`, `deleteTarget`).

### 3.2 INV — Variants workflow

| Acción | Antes | Después |
|--------|-------|---------|
| Aprobar inventario físico | `danger` | `warning` |
| Finalizar inventario físico | `danger` | `warning` |
| Autorizar movimiento | `danger` | `warning` |
| Procesar movimiento | `danger` | `warning` |
| Anular (IF y Movimientos) | `danger` | `danger` (sin cambio) |

Variant `warning` ya existía en `ConfirmDialog` — sin modificar primitiva global.

---

## 4. Evidencia de compilación

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` (archivos modificados) | **PASS** — sin errores en rutas ORG/INV tocadas |
| Linter IDE (8 archivos) | **PASS** — sin diagnósticos |

---

## 5. Checklist QA manual

Ejecutar con permisos `org.editar` / `org.eliminar` y `inv.editar`:

### ORG — Reactivar

| # | Pantalla | Pasos | Esperado | Estado |
|---|----------|-------|----------|--------|
| QA-O1 | Empresas | Ver inactivos → Reactivar | Confirm info con `razon_social`; mutación solo al confirmar | ☐ |
| QA-O2 | Sucursales | Idem | Confirm con `nombre` | ☐ |
| QA-O3 | Departamentos | Idem | Confirm con `nombre` | ☐ |
| QA-O4 | Cargos | Idem | Confirm con `nombre` | ☐ |
| QA-O5 | Centros de costo | Idem | Confirm con `nombre` | ☐ |
| QA-O6 | Parámetros | Idem | Confirm con `nombre_parametro` | ☐ |
| QA-O7 | Cualquier ORG | Cancelar confirm reactivar | No muta; fila sigue inactiva | ☐ |
| QA-O8 | Cualquier ORG | Desactivar registro | Sigue `variant="danger"` — sin regresión | ☐ |
| QA-O9 | Cualquier ORG | `discardPending` activo | Confirm reactivar no visible (`discardPending === null` guard) | ☐ |

### INV — Workflow semántica

| # | Flujo | Esperado | Estado |
|---|-------|----------|--------|
| QA-I1 | IF → Aprobar | Confirm con botón/ícono **warning** (amarillo), no rojo | ☐ |
| QA-I2 | IF → Finalizar | Idem warning | ☐ |
| QA-I3 | IF → Anular | Confirm **danger** (rojo) — sin cambio | ☐ |
| QA-I4 | Movimientos → Autorizar | Warning | ☐ |
| QA-I5 | Movimientos → Procesar | Warning | ☐ |
| QA-I6 | Movimientos → Anular | Danger | ☐ |
| QA-I7 | IF/Mov workflow | Confirm visible de inmediato (stacking P0 previo) | ☐ |

---

## 6. Riesgos residuales

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Fricción extra al reactivar en ORG | Baja | Intencional — paridad INV y menor riesgo de clic accidental |
| Usuarios asociaban rojo = “acción importante” en workflow INV | Baja | Warning sigue siendo confirmación visible; comunicar en release |
| `ConfirmDialog` sin focus trap / portal | Media (preexistente) | Fuera alcance P1 |
| Dirty en campos de confirm Aprobar/Anular motivo | Baja (backlog) | No implementado por restricción |
| EmpresaPage sin `resetLocalFilters` para `reactivarTarget` | Baja | Lista tenant-wide; target se limpia al cerrar confirm |

---

## 7. Veredicto

| Pregunta | Respuesta |
|----------|-----------|
| ¿ORG alineado con INV en reactivar? | **Sí** |
| ¿Rojo eliminado de acciones positivas INV? | **Sí** (`warning`) |
| ¿Desactivar intacto? | **Sí** |
| ¿Listo para QA navegador? | **Sí** |

---

*Reporte P1 — sin commit automático.*
