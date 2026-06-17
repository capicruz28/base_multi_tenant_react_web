# ERP Frontend Standards V2 — Propuesta de reglas modales (MD-*)

**Fecha:** 10 junio 2026  
**Estado:** Propuesta — **no incorporada** a `ERP_FRONTEND_STANDARDS_V2.md`, `.cursorrules` ni `PROMPT_FRONTEND_MAESTRO.md`  
**Origen:** `ERP_MODAL_AND_WORKFLOW_UX_AUDIT.md` + implementación P1 (`ERP_MODAL_STANDARDIZATION_P1_REPORT.md`)

---

## Propósito

Documentar reglas candidatas para un futuro capítulo **§MD — Modales y confirmaciones** en V2, basadas en evidencia consolidada en módulos referencia **ORG** e **INV**.

---

## MD-STACK-01

### Descripción

> **MUST NOT** tener `Dialog` Radix con `open={true}` y `ConfirmDialog` con `isOpen={true}` al mismo tiempo.

### Problema que resuelve

Coexistencia de dos overlays (`Radix DialogOverlay` portal + `ConfirmDialog` inline, ambos `z-50`) produce pantalla negra, confirm invisible detrás del portal Radix, y riesgo de body lock / focus trap corrupto (histórico IAM Sprint B.1.1).

### Evidencia ORG

- **Correcto hoy:** `createOrgDiscardHandlers` cierra Radix (`setCreateOpen(false)` / `setEditOpen(false)`) **antes** de `setDiscardPending('create'|'edit')`.
- **Correcto hoy:** `ConfirmDialog` desactivar usa `isOpen={!!deleteTarget && discardPending === null}` — no se abre con CRUD modal abierto.

```31:37:src/features/org/utils/org-discard-handlers.ts
    if (isCreateDirty) {
      setCreateOpen(false);
      setDiscardPending('create');
      scheduleModalStackValidation(`${contextPrefix}-create-request-close-dirty`);
```

### Evidencia INV

- **Bug histórico (corregido):** `InventarioFisicoPage` / `MovimientosPage` abrían confirm workflow con `detailOpen=true`.
- **Fix P0:** cerrar detalle antes del confirm; patrón `workflowConfirmOpen`.

```162:163:src/features/inv/pages/InventarioFisicoPage.tsx
  const workflowConfirmOpen = aprobarOpen || anularOpen || finalizarOpen;
  const detailDialogOpen = detailOpen && !workflowConfirmOpen;
```

- **Catálogos INV:** mismo patrón ORG en discard; confirms baja/reactivar con guard `discardPending === null`.

### Beneficios

- Elimina overlay negro y clicks fantasma.
- Alineación con patrón IAM probado en producción.
- Un solo overlay activo por interacción.

### Riesgos

- Requiere disciplina en cada nueva pantalla; la primitiva `ConfirmDialog` no enforcea la regla.
- Orden de `setState` en React batch puede requerir expresión compuesta en `open` (ver MD-STACK-03).

### Recomendación de adopción

**MUST** en V2 §7 (B.1.1) y §6.3 (B-L). Referencia cruzada a `INV_MODAL_STACKING_AUDIT.md` como caso de estudio.

---

## MD-STACK-02

### Descripción

> En pantallas **B-L**, al iniciar un workflow desde el modal de detalle (Aprobar, Autorizar, Procesar, Finalizar, Anular), **MUST** `setDetailOpen(false)` (o equivalente) **antes** de abrir el `ConfirmDialog`.

### Problema que resuelve

Implementación operativa de MD-STACK-01 en el flujo usuario: botón en detalle → confirm de negocio.

### Evidencia ORG

- N/A directo (ORG no tiene B-L transaccional con detalle + workflow).
- Patrón análogo: cierre Radix antes de discard confirm en CRUD.

### Evidencia INV

- **Antes del fix:** `onClick={() => setAprobarOpen(true)}` sin cerrar detalle.
- **Después del fix:**

```tsx
setDetailOpen(false);
setAprobarOpen(true);
```

Aplicado en Aprobar, Finalizar, Anular (IF) y Autorizar, Procesar, Anular (Movimientos).

### Beneficios

- Confirm visible de inmediato.
- `selectedId` / `selectedMovimientoId` se conservan para la mutación.

### Riesgos

- Query `conDetalle` se deshabilita brevemente (`enabled: detailOpen && !!id`); mitigado por cache React Query.
- Label del confirm depende de cache si detalle estaba cargando.

### Recomendación de adopción

**MUST** en V2 §6.3 PB-08 (extender con procedimiento explícito). Incluir en checklist QA B-L.

---

## MD-STACK-03

### Descripción

> **MUST** defensa en profundidad en `Dialog` de detalle B-L: `open={detailOpen && !workflowConfirmOpen}` y `onOpenChange` que no cierre detalle mientras `workflowConfirmOpen === true`.

### Problema que resuelve

Race conditions si Radix intenta cerrar/abrir en el mismo tick; protección si un handler olvida `setDetailOpen(false)`.

### Evidencia ORG

- N/A (sin B-L).

### Evidencia INV

```331:335:src/features/inv/pages/InventarioFisicoPage.tsx
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          if (!open && !workflowConfirmOpen) setDetailOpen(false);
        }}
```

### Beneficios

- Segunda barrera ante regresiones de MD-STACK-02.
- Evita reapertura accidental del detalle durante confirm.

### Riesgos

- Bajo si `workflowConfirmOpen` se deriva de flags booleanos locales bien nombrados.

### Recomendación de adopción

**SHOULD** en V2 §6.3; **MUST** en módulos transaccionales nuevos que copien INV B-L.

---

## MD-SEM-01

### Descripción

> **MUST NOT** usar `variant="danger"` en `ConfirmDialog` para acciones de workflow **positivas**: Aprobar, Autorizar, Procesar, Finalizar.

### Problema que resuelve

Semántica visual incorrecta: rojo asociado a error/destrucción confunde al usuario en acciones que avanzan el documento en el flujo normal.

### Evidencia ORG

- ORG no tiene estos workflows transaccionales.
- ORG desactivar usa `danger` correctamente.

### Evidencia INV

- **Antes P1:** Aprobar, Autorizar, Procesar, Finalizar con `variant="danger"`.
- **Después P1:** `variant="warning"` (primitiva existente).
- Anular mantiene `danger`.

### Beneficios

- Distinción clara positivo (warning/brand) vs destructivo (danger).
- Sin cambiar `ConfirmDialog` global.

### Riesgos

- Usuarios habituados al rojo como “confirmación fuerte” pueden notar el cambio.
- `warning` usa icono `AlertTriangle` igual que danger — diferenciación solo por color (ver MD-SEM backlog iconos).

### Recomendación de adopción

**MUST** en V2 §8.4 o nuevo §MD-SEM. Tabla de mapeo acción → variant.

---

## MD-SEM-02

### Descripción

> **MUST** `variant="danger"` en Desactivar, Anular y operaciones irreversibles o de pérdida de datos.

### Problema que resuelve

Reserva el rojo para acciones que requieren máxima cautela.

### Evidencia ORG

- 6 pantallas CRUD: `ConfirmDialog` desactivar `variant="danger"`.
- Mensaje incluye nombre legible y “Podrá reactivarlo después.”

### Evidencia INV

- Catálogos: desactivar `danger`.
- IF / Movimientos: anular `danger`.
- Botón anular en detalle: `variant="destructive"`.

### Beneficios

- Consistencia ORG ↔ INV en baja lógica.
- Cumple vocabulario UX-01 (Desactivar, no Eliminar).

### Riesgos

- Ninguno significativo si MD-SEM-01 se aplica en paralelo.

### Recomendación de adopción

**MUST** — ya alineado con práctica actual; formalizar en V2.

---

## MD-SEM-03

### Descripción

> **MUST** `variant="info"` en `ConfirmDialog` de **Reactivar**, con confirmación obligatoria antes de la mutación.

### Problema que resuelve

- ORG ejecutaba reactivar sin barrera (clic accidental).
- INV ya tenía el patrón correcto; ORG desalineado.

### Evidencia ORG

- **Antes P1:** `handleReactivar` → `mutateAsync` directo en 6 pantallas.
- **Después P1:** `reactivarTarget` + `ConfirmDialog` `variant="info"` (paridad INV).

### Evidencia INV

- 6 catálogos: `reactivarTarget`, mensaje `'… Volverá a estar disponible.'`, `variant="info"`.

```480:488:src/features/inv/pages/AlmacenesPage.tsx
        isOpen={!!reactivarTarget && discardPending === null}
        ...
        variant="info"
        loading={reactivarMutation.isPending}
```

### Beneficios

- Paridad ORG ↔ INV.
- Reduce reactivaciones accidentales.
- Icono/info coherente con acción restaurativa.

### Riesgos

- Un paso adicional en flujo de administración (aceptable).

### Recomendación de adopción

**MUST** en V2 §8.4 y §7.1 B11-02 (confirm reactivar independiente de discard).

---

## MD-SEM-04

### Descripción

> **MUST** `variant="warning"` en `ConfirmDialog` de **descarte de cambios** (B.1.1 dirty), con textos “Seguir editando” / “Sí, descartar”.

### Problema que resuelve

Diferenciar discard de formulario (reversible, sin persistir) de confirm de negocio (desactivar, anular, workflow).

### Evidencia ORG

- `OrgDiscardConfirmDialog` envuelve `ConfirmDialog` con `variant="warning"` fijo.
- 6 pantallas CRUD lo usan vía `discardPending`.

```17:33:src/features/org/components/OrgDiscardConfirmDialog.tsx
    <ConfirmDialog
      ...
      variant="warning"
    />
```

### Evidencia INV

- Catálogos: mismo `OrgDiscardConfirmDialog`.
- B-F: `useInvTransactionalFormGuard` + `OrgDiscardConfirmDialog` en formularios página.

### Beneficios

- Tres familias visuales claras: warning (discard), info (reactivar), danger (baja/anular), warning (workflow positivo post-P1).
- Cumple B11-04 V2.

### Riesgos

- Colisión semántica: workflow positivo y discard usan ambos `warning` post-P1 — distinguibles por copy y contexto, no solo por color.

### Recomendación de adopción

**MUST** — ya implementado; documentar que workflow positivo comparte `warning` con discard pero **nunca** con `danger`.

---

## Resumen de adopción recomendada

| Regla | Severidad propuesta | Estado código ORG+INV post-P1 |
|-------|---------------------|-------------------------------|
| MD-STACK-01 | MUST | Cumplido en CRUD; cumplido en B-L post-fix |
| MD-STACK-02 | MUST | Cumplido en B-L |
| MD-STACK-03 | SHOULD / MUST B-L nuevos | Cumplido en B-L |
| MD-SEM-01 | MUST | Cumplido post-P1 INV |
| MD-SEM-02 | MUST | Ya cumplido |
| MD-SEM-03 | MUST | Cumplido post-P1 ORG + INV |
| MD-SEM-04 | MUST | Ya cumplido |

---

## Próximos pasos (fuera de este documento)

1. Revisión producto/UX de la tabla MD-SEM completa.
2. Incorporación selectiva a `ERP_FRONTEND_STANDARDS_V2.md` §6–§8.
3. Extracto operativo a `.cursorrules` y `PROMPT_FRONTEND_MAESTRO.md` cuando V2 se congele.
4. Backlog: variant/icono dedicado workflow positivo; portal/focus en `ConfirmDialog` (evaluación separada).

---

*Propuesta generada tras P1 ORG+INV. No normativa hasta merge explícito en V2.*
