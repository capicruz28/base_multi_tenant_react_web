# UX-004 — Revisión pre-implementación arquitectónica

**Estado:** Validación final antes de implementación — **sin cambios de código**.

**Referencias:** `UX_004_IMPLEMENTATION_PLAN.md`, `UX_004_ANULAR_MOVIMIENTOS_AUDIT.md`, implementación real UX-003 en `InventarioFisicoPage.tsx`, `UX_003_PRE_IMPLEMENTATION_REVIEW.md`, `ERP_FRONTEND_STANDARDS_V2.md` v2.1.

**Veredicto anticipado:** ✅ **APTO para implementación definitiva** — paridad estructural con UX-003 implementado; sin desviaciones arquitectónicas; helper compartido **no obligatorio** en este ticket.

---

## 1. Paridad con patrón UX-003 (implementación real)

La referencia normativa de esta revisión es el código **ya mergeado/implementado** en UX-003, no el plan original.

### 1.1 Comparación handler a handler

| Pieza | UX-003 implementado (`InventarioFisicoPage`) | UX-004 propuesto (`MovimientosPage`) | Paridad |
|-------|---------------------------------------------|--------------------------------------|---------|
| Estado discard | `discardPending: OrgDiscardPending` | Idem | ✅ |
| Baseline | `aprobarBaseline` | `anularBaseline` | ✅ (nombre adaptado) |
| Dirty derivado | `isAprobarConfirmDirty` (`useMemo`) | `isAnularConfirmDirty` | ✅ |
| Abrir workflow | `handleOpenAprobar` | `handleOpenAnular` | ✅ |
| Request close | `handleRequestCloseAprobar` | `handleRequestCloseAnular` | ✅ |
| Discard cancel | `handleAprobarDiscardCancel` | `handleAnularDiscardCancel` | ✅ |
| Discard confirm | `handleAprobarDiscardConfirm` | `handleAnularDiscardConfirm` | ✅ |
| Cierre completo | `cerrarAprobar` (+ baseline/discard) | `cerrarAnular` (+ baseline/discard) | ✅ |
| Guard pending | `aprobarMutation.isPending` | `anularMutation.isPending` | ✅ |
| Secuencia dirty close | `setPrimaryOpen(false)` → `setDiscardPending('edit')` | Idem con `anularOpen` | ✅ B11-10/11 |
| DEV stack validation | `scheduleModalStackValidation(...)` × 3 | Idem prefijo `inv-movimientos-anular-*` | ✅ |
| OrgDiscard | `discardPending='edit'`, handlers wired | Idem | ✅ |
| `detailDialogOpen` | `&& discardPending === null` | Idem | ✅ |
| `Dialog.onOpenChange` | `&& discardPending === null` | Idem (a añadir) | ✅ |
| Reset empresa | Inline en `resetPageFilters` | Inline en `resetPageFilters` | ✅ |
| Botón workflow `disabled` | `discardPending !== null` en Aprobar | Recomendado en Anular | ✅ paridad |

### 1.2 Evidencia UX-003 implementado (plantilla de referencia)

```238:259:src/features/inv/pages/InventarioFisicoPage.tsx
  const handleRequestCloseAprobar = () => {
    if (aprobarMutation.isPending) return;
    if (isAprobarConfirmDirty) {
      setAprobarOpen(false);
      setDiscardPending('edit');
      scheduleModalStackValidation('inv-inventario-fisico-aprobar-request-close-dirty');
      return;
    }
    cerrarAprobar(true);
  };

  const handleAprobarDiscardCancel = () => {
    setDiscardPending(null);
    setAprobarOpen(true);
    scheduleModalStackValidation('inv-inventario-fisico-aprobar-discard-cancel-resume');
  };

  const handleAprobarDiscardConfirm = () => {
    setDiscardPending(null);
    cerrarAprobar(true);
    scheduleModalStackValidation('inv-inventario-fisico-aprobar-discard-confirmed');
  };
```

```209:210:src/features/inv/pages/InventarioFisicoPage.tsx
  const workflowConfirmOpen = aprobarOpen || anularOpen || finalizarOpen;
  const detailDialogOpen = detailOpen && !workflowConfirmOpen && discardPending === null;
```

**UX-004 debe replicar esta estructura** sustituyendo `aprobarOpen` → `anularOpen` y eliminando piezas no aplicables (§5).

### 1.3 ¿Mantiene exactamente el patrón UX-003?

**Sí, estructuralmente idéntico.** Las únicas diferencias son **adaptaciones documentadas** (baseline síncrono, un campo, variant primario `danger`) — no variantes arquitectónicas.

**No reutilizar:**
- `createOrgDiscardHandlers` — acoplado a Radix CRUD ORG.
- `createInvPageDiscardHandlers` — acoplado a navegación B-F.

---

## 2. Stacking — demostración formal

### 2.1 Overlays en juego (MovimientosPage post UX-004)

| ID | Componente | Variable de visibilidad |
|----|------------|-------------------------|
| O1 | `Dialog` detalle | `detailDialogOpen` |
| O2 | `ConfirmDialog` Autorizar | `autorizarOpen` |
| O3 | `ConfirmDialog` Procesar | `procesarOpen` |
| O4 | `ConfirmDialog` Anular | `anularOpen` |
| O5 | `OrgDiscardConfirmDialog` | `discardPending !== null` |

### 2.2 Fórmulas propuestas

```typescript
const workflowConfirmOpen = autorizarOpen || procesarOpen || anularOpen;
const detailDialogOpen = detailOpen && !workflowConfirmOpen && discardPending === null;
```

**Invariante obligatoria (implementación):**

```typescript
!(anularOpen && discardPending !== null)
```

**Propiedades derivadas:**

| Propiedad | Demostración |
|-----------|--------------|
| `discardPending !== null` → `anularOpen === false` | Enforced en `handleRequestCloseAnular` antes de `setDiscardPending('edit')` |
| `discardPending !== null` → `autorizarOpen === false` ∧ `procesarOpen === false` | Discard solo se activa desde Anular; Anular no coexiste con otros workflow en UI |
| `workflowConfirmOpen === true` → `discardPending === null` | Si algún confirm workflow abierto, no hay discard activo |
| `detailDialogOpen === true` → todos los overlays O2–O5 off | Por definición de `detailDialogOpen` |

### 2.3 Combos prohibidos solicitados

#### A. Detalle (O1) + Anular (O4)

| Mecanismo | Conclusión |
|-----------|------------|
| `handleOpenAnular` ejecuta `setDetailOpen(false)` | Sesión detalle cerrada lógicamente al abrir Anular |
| `detailDialogOpen = detailOpen && !workflowConfirmOpen && …` | Si `anularOpen=true` → `workflowConfirmOpen=true` → **O1 no renderiza** |
| Incluso si `detailOpen` quedara `true` por bug | **O1 suprimido** mientras O4 activo |

**Imposible coexistencia visible O1 + O4.**

#### B. Anular (O4) + Discard (O5)

| Mecanismo | Conclusión |
|-----------|------------|
| Invariante `!(anularOpen && discardPending !== null)` | Mutuamente excluyentes en estado estable |
| Transición cancel dirty | `anularOpen=false` → luego `discardPending='edit'`; nunca ambos `true` en mismo commit React |
| `handleAnularDiscardCancel` | `discardPending=null` → `anularOpen=true` (secuencia inversa) |

**Imposible coexistencia visible O4 + O5.**

#### C. Detalle (O1) + Discard (O5)

| Mecanismo | Conclusión |
|-----------|------------|
| `detailDialogOpen` requiere `discardPending === null` | Con O5 activo → **O1 no renderiza** |
| Flujo nominal: discard tras cerrar Anular con `detailOpen=false` | Detalle ya oculto antes de O5 |
| `onOpenChange` con guard `discardPending === null` | Evita cerrar sesión detalle erróneamente durante O5 |

**Imposible coexistencia visible O1 + O5.**

#### D. Autorizar (O2) / Procesar (O3) + Discard (O5)

| Mecanismo | Conclusión |
|-----------|------------|
| `discardPending='edit'` solo desde `handleRequestCloseAnular` | O5 implica que el usuario estaba en flujo Anular |
| Al activar O5: `anularOpen=false`; Autorizar/Procesar nunca estuvieron abiertos simultáneamente con Anular en UI | Botones en detalle mutuamente excluyentes por flujo usuario |
| `handleAnularDiscardCancel` reabre **solo** `anularOpen`, no autorizar/procesar | O2/O3 permanecen `false` |
| No existe otro entry point a `setDiscardPending('edit')` | O5 acoplado exclusivamente a Anular |

**Imposible coexistencia visible (O2 ∨ O3) + O5.**

### 2.4 Tabla de estados completa

Leyenda: **V** = visible · **—** = no · `d`=detailOpen · `D`=detailDialogOpen · `au`=autorizar · `pr`=procesar · `an`=anular · `dp`=discardPending

| # | Escenario | d | au | pr | an | dp | D | O1 | O2 | O3 | O4 | O5 | Total |
|---|-----------|---|----|----|----|----|---|----|----|----|----|-----|-------|
| S0 | Listado | F | F | F | F | null | F | — | — | — | — | — | 0 |
| S1 | Detalle | T | F | F | F | null | T | V | — | — | — | — | **1** |
| S2 | Autorizar | F | T | F | F | null | F | — | V | — | — | — | **1** |
| S3 | Procesar | F | F | T | F | null | F | — | — | V | — | — | **1** |
| S4 | Anular editando | F | F | F | T | null | F | — | — | — | V | — | **1** |
| S5 | Cancel dirty (frame) | F | F | F | F | null | F | — | — | — | — | — | **0** |
| S6 | Discard pending | F | F | F | F | edit | F | — | — | — | — | V | **1** |
| S7 | Seguir editando | F | F | F | T | null | F | — | — | — | V | — | **1** |
| S8 | Descartar → detalle | T | F | F | F | null | T | V | — | — | — | — | **1** |
| S9 | Anular OK | F | F | F | F | null | F | — | — | — | — | — | **0** |
| ⛔ | Detalle + Anular | T | F | F | T | null | F | — | — | — | V | — | **1** O1 off |
| ⛔ | Anular + Discard | * | F | F | T | edit | F | — | — | — | V | V | **BLOQUEADO** |
| ⛔ | Detalle + Discard | T | F | F | F | edit | F | — | — | — | — | V | **1** O1 off |
| ⛔ | Autorizar + Discard | F | T | F | F | edit | F | — | V | — | — | V | **BLOQUEADO** |

**Máximo overlays en estados válidos alcanzables: 1** → **MD-04** cumplido.

### 2.5 Ajuste obligatorio `Dialog.onOpenChange`

Estado actual en `MovimientosPage.tsx`:

```379:381:src/features/inv/pages/MovimientosPage.tsx
        onOpenChange={(open) => {
          if (!open && !workflowConfirmOpen) setDetailOpen(false);
        }}
```

**Debe alinearse con UX-003 implementado:**

```typescript
if (!open && !workflowConfirmOpen && discardPending === null) {
  setDetailOpen(false);
}
```

---

## 3. Cumplimiento normativo V2.1 (fórmulas)

| ID | Requisito | Cómo lo cumplen las fórmulas + handlers |
|----|-----------|----------------------------------------|
| **MD-04** | Máximo un overlay modal activo | `detailDialogOpen` y confirms mutuamente excluyentes; invariante O4+O5; §2.4 máx=1 |
| **B11-10** | No apilar primario + discard | `setAnularOpen(false)` **antes** de `setDiscardPending('edit')`; detalle cierra antes de O4 |
| **B11-11** | Discard secundario tras cerrar primario | Secuencia idéntica UX-003; O5 solo cuando O4 off |
| **PB-13** | Defensa stacking workflow B-L | `workflowConfirmOpen` deriva flags; un confirm workflow visible (O2/O3/O4) |
| **PB-14** | `detailDialogOpen` + `onOpenChange` defensivos | Fórmula extendida con `discardPending`; guard en `onOpenChange` §2.5 |

**Nota PB-13:** durante O5, `workflowConfirmOpen=false` — correcto; el overlay activo es discard, no workflow confirm. PB-13 regula workflow confirms; el discard es capa B11 separada (como UX-003 implementado).

---

## 4. Reset empresa

### 4.1 Comportamiento actual

`resetMovimientosListUiState` (helper) ya resetea:

- `detailOpen`, `selectedMovimientoId`
- `autorizarOpen`, `procesarOpen`, `anularOpen`, `anularMotivo`

### 4.2 Estados nuevos UX-004

| Estado | Riesgo sin reset | Helper resetea |
|--------|------------------|----------------|
| `anularBaseline` | Bajo (huérfano en memoria) | ❌ |
| `discardPending` | **Alto** — O5 visible sin contexto | ❌ |

### 4.3 Verificación de callers

```
resetMovimientosListUiState → único uso: MovimientosPage.tsx
```

### 4.4 Conclusión

| Pregunta | Respuesta |
|----------|-----------|
| ¿Basta `resetPageFilters`? | **Sí** — añadir `setAnularBaseline(null)` y `setDiscardPending(null)` después del helper |
| ¿Modificar `inv-list-empresa-reset.ts`? | **No** — criterio idéntico UX-003 revisión §3 |

```typescript
// Patrón recomendado (post helper existente):
setAnularBaseline(null);
setDiscardPending(null);
```

Coherente con implementación UX-003 real (líneas 78–80 `InventarioFisicoPage.tsx`).

---

## 5. Comparativa UX-003 implementado vs UX-004 planificado

### 5.1 Piezas reutilizadas (copiar estructura)

| Pieza |
|-------|
| Imports: `OrgDiscardConfirmDialog`, `OrgDiscardPending`, `scheduleModalStackValidation` |
| Estado `discardPending` + modo `'edit'` |
| Patrón `handleRequestClose*` → dirty → close primary → discard |
| Patrón `handle*DiscardCancel` / `handle*DiscardConfirm` |
| `useMemo` dirty vs baseline |
| Fórmula `detailDialogOpen` con `discardPending === null` |
| Guard `onOpenChange` detalle |
| `<OrgDiscardConfirmDialog />` sin props nuevas |
| Reset inline en `resetPageFilters` |
| `disabled={discardPending !== null}` en botón del workflow afectado |
| Invariante `!(primaryOpen && discardPending !== null)` |

### 5.2 Piezas adaptadas

| UX-003 | UX-004 |
|--------|--------|
| `AprobarConfirmBaseline { tipoMovimientoId, obs }` | `AnularConfirmBaseline { motivo }` |
| `aprobarOpen` / `cerrarAprobar` | `anularOpen` / `cerrarAnular` |
| `isAprobarConfirmDirty` (2 campos) | `isAnularConfirmDirty` (1 campo, `trim`) |
| `handleOpenAprobar` resetea 2 campos | `handleOpenAnular` resetea `anularMotivo` |
| `entityLabel="la aprobación"` | `entityLabel="la anulación"` |
| Context DEV `inv-inventario-fisico-aprobar-*` | `inv-movimientos-anular-*` |
| Confirm primario `variant="warning"` (UX-05) | Confirm primario `variant="danger"` (**UX-06**) |
| Toast validación tipo requerido | Sin validación (motivo opcional) |
| `workflowConfirmOpen` incluye aprobar/anular/finalizar | Incluye autorizar/procesar/anular |

### 5.3 Piezas eliminadas (no aplican en UX-004)

| Pieza UX-003 | Motivo omisión UX-004 |
|--------------|---------------------|
| `useEffect` baseline post-fetch tipos | Sin prefill async; motivo inicia `''` |
| `aprobarBaselineCapturedRef` | Baseline síncrono en `handleOpenAnular` |
| `useTiposMovimiento({ enabled: aprobarOpen })` | No interviene en Anular |
| Prefill `tiposAjuste[0]` | N/A |
| Segundo campo dirty (`aprobarTipoMovimientoId`) | Solo textarea motivo |
| `toast.error` pre-mutación | Motivo opcional |

---

## 6. Verificación UX-06 y primitivas compartidas

### 6.1 UX-06 — `variant="danger"` en Anular

Estado actual (preservar):

```545:554:src/features/inv/pages/MovimientosPage.tsx
      <ConfirmDialog
        isOpen={anularOpen}
        onClose={() => cerrarAnular()}
        ...
        variant="danger"
        loading={anularMutation.isPending}
```

**Plan UX-004:** solo cambia `onClose` → `handleRequestCloseAnular`. **`variant="danger"` no se modifica.**

Dirty guard intercepta **cancel**, no altera semántica destructiva del confirm principal → **UX-06 intacto**.

### 6.2 OrgDiscardConfirmDialog — `warning`

```32:32:src/features/org/components/OrgDiscardConfirmDialog.tsx
      variant="warning"
```

El discard es confirmación de **descarte de borrador**, no la acción destructiva Anular. Patrón idéntico UX-003: primario workflow + discard `warning`.

**No requiere cambios** en `OrgDiscardConfirmDialog.tsx`.

### 6.3 ConfirmDialog.tsx

UX-004 consume `ConfirmDialog` como UX-003:

- Anular: `isOpen`, `onClose`, `onConfirm`, `variant`, `loading`, children textarea.
- Discard: vía `OrgDiscardConfirmDialog` (wrapper existente).

**No requiere cambios** en `ConfirmDialog.tsx`.

---

## 7. Evaluación helper futuro `createInvWorkflowConfirmDiscardHandlers`

### 7.1 Inventario post UX-004

| Caso | Pantalla | Workflow | Campos | Patrón inline |
|------|----------|----------|--------|---------------|
| UX-003 ✅ | `InventarioFisicoPage` | Aprobar | 2 (+ async) | Implementado |
| UX-004 📋 | `MovimientosPage` | Anular | 1 (sync) | Planificado |
| — | `InventarioFisicoPage` | Anular/Finalizar | 0 | No aplica |
| — | `MovimientosPage` | Autorizar/Procesar | 0 | No aplica |

**Total casos B-L con campos editables en confirms: 2.**

### 7.2 Argumentos

| A favor del helper (P3 futuro) | En contra (mantener inline en UX-004) |
|--------------------------------|---------------------------------------|
| Dos implementaciones estructuralmente iguales | Solo 2 casos — duplicación ~50–70 LOC aceptable |
| Reduce drift entre IF y Mov | Diferencias reales: baseline sync vs async, variants, validación, nombres estado |
| Centraliza invariante B11 | Extraer obligaría refactor UX-003 ya estable — **fuera alcance UX-004** |
| | YAGNI — helper añade config object sin tercer consumidor |
| | `createOrgDiscardHandlers` ya cubre otro dominio (Radix CRUD) |

### 7.3 Criterio de decisión propuesto

| Umbral | Acción |
|--------|--------|
| **2 casos** (post UX-004) | **Inline OK** — helper **opcional P3**, no bloqueante |
| **3.er caso** B-L con campos en confirm | **Recomendar extracción** + refactor retroactivo UX-003/004 |
| Refactor DRY explícito en sprint | Ticket separado `INV-WF-DISCARD-01` — no mezclar con UX-004 |

### 7.4 Conclusión §7

**Después de UX-004 existen 2 casos** — suficientes para **considerar** un helper en el futuro, **insuficientes para justificar su creación dentro de UX-004**. Implementación **debe permanecer inline**, replicando UX-003.

---

## 8. Riesgos arquitectónicos residuales

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Divergencia handlers Mov vs IF | Baja | Esta revisión + copy estructural UX-003 |
| Invariante O4+O5 olvidada | Media | QA Q10; `scheduleModalStackValidation` |
| `onOpenChange` sin guard discard | Baja | §2.5 obligatorio |
| Reset empresa O5 huérfano | Media | `resetPageFilters` §4 |
| Regresión Autorizar/Procesar | Baja | No modificar sus handlers |
| Confundir UX-06 con variant discard | Baja | Documentado §6 — primario `danger`, discard `warning` |

**Ningún riesgo bloquea implementación.**

---

## 9. Ajustes al plan UX-004 (micro-refinamientos)

| # | Plan UX-004 | Ajuste tras revisión |
|---|-------------|----------------------|
| 1 | — | Confirmar `disabled={discardPending !== null}` en botón Anular (paridad UX-003 línea 442) |
| 2 | — | Verificar orden setState en `handleOpenAnular`: baseline **antes** de `setAnularOpen(true)` |
| 3 | — | No crear helper en mismo PR |

Sin cambios sustantivos al plan aprobado.

---

## 10. Matriz QA adicional (stacking + reset)

| # | Caso | Esperado |
|---|------|----------|
| R1 | Cancel dirty Anular → DOM | Un solo `[role="dialog"]` |
| R2 | Seguir editando | Solo Confirm Anular (O4) |
| R3 | Cambiar empresa con O5 visible | Sin dialog residual |
| R4 | Cambiar empresa con O4 abierto | Sin discard huérfano |
| R5 | Abrir Anular → detalle | O1 no visible |
| R6 | Autorizar cancel (sin campos) | Sin OrgDiscard |
| R7 | Confirm Anular inspección | `variant="danger"` |
| R8 | OrgDiscard inspección | `variant="warning"` |

---

## 11. Veredicto final

| Criterio | Resultado |
|----------|-----------|
| Paridad patrón UX-003 implementado | ✅ Confirmada — adaptación mecánica |
| Detalle + Anular | ✅ Imposible visible |
| Anular + Discard | ✅ Imposible visible |
| Detalle + Discard | ✅ Imposible visible |
| Autorizar/Procesar + Discard | ✅ Imposible visible |
| MD-04, B11-10, B11-11, PB-13, PB-14 | ✅ Demostrado §2–§3 |
| Reset empresa solo en página | ✅ Confirmado §4 |
| No modificar `inv-list-empresa-reset.ts` | ✅ Confirmado |
| UX-06 preservado | ✅ Confirmado §6 |
| Primitivas sin cambios | ✅ Confirmado §6 |
| Helper compartido en UX-004 | ❌ No procede — inline |
| Riesgos arquitectura | ✅ Ninguno bloqueante |

### Autorización arquitectónica

**UX-004 queda autorizado para implementación definitiva de código**, incorporando micro-ajustes §9.

| Artefacto | Estado |
|-----------|--------|
| Auditoría UX-004 | ✅ Aprobada |
| Plan UX-004 | ✅ Aprobado preliminar |
| Revisión pre-implementación (este doc) | ✅ Completa |
| **Implementación código** | ✅ **Autorizada** |

---

*Generado: 2026-06-10 — Revisión arquitectónica UX-004, sin cambios de código.*
