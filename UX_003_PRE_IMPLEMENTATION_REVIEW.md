# UX-003 — Revisión pre-implementación arquitectónica

**Estado:** Validación final antes de implementación — **sin cambios de código**.

**Referencias:** `UX_003_IMPLEMENTATION_PLAN.md`, `UX_003_DIRTY_GUARD_APROBAR_IF_AUDIT.md`, `ERP_FRONTEND_STANDARDS_V2.md` v2.1, `createOrgDiscardHandlers`, `OrgDiscardConfirmDialog`.

**Veredicto anticipado:** ✅ **APTO para implementación** con ajustes menores al plan (reset empresa solo en página; `onOpenChange` del detalle; naming opcional).

---

## 1. Reutilización de `OrgDiscardConfirmDialog`

### 1.1 Comparación con patrón ORG (`createOrgDiscardHandlers`)

El patrón ORG canónico (ej. `DepartamentosPage`) sigue esta secuencia para **edit dirty**:

| Paso | ORG (`handleRequestCloseEdit`) | UX-003 propuesto (`handleRequestCloseAprobar`) |
|------|--------------------------------|------------------------------------------------|
| Guard submit | `if (isSubmitting) return` | `if (aprobarMutation.isPending) return` |
| Detectar dirty | `if (isEditDirty)` | `if (isAprobarConfirmDirty)` |
| Cerrar primario (B11-10) | `setEditOpen(false)` | `setAprobarOpen(false)` |
| Abrir discard (B11-11) | `setDiscardPending('edit')` | `setAprobarDiscardPending('edit')` |
| Cancel discard | `setDiscardPending(null)` + `setEditOpen(true)` | `setAprobarDiscardPending(null)` + `setAprobarOpen(true)` |
| Confirm discard | `setDiscardPending(null)` + `closeEdit()` | `setAprobarDiscardPending(null)` + `cerrarAprobar(true)` |
| Overlay discard | `OrgDiscardConfirmDialog` `discardPending='edit'` | Idéntico |

**Componente compartido:** mismo `OrgDiscardConfirmDialog`, mismo `OrgDiscardPending`, mismo mensaje en modo `'edit'`:

> *"Hay cambios sin guardar. ¿Desea cerrar sin guardar?"*

Mismos botones: **Seguir editando** / **Sí, descartar**. Mismo `variant="warning"`.

### 1.2 ¿Es el mismo flujo?

**Sí, semánticamente idéntico** al branch `edit` de `createOrgDiscardHandlers`:

```42:51:src/features/org/utils/org-discard-handlers.ts
  const handleRequestCloseEdit = () => {
    if (isSubmitting) return;
    if (isEditDirty) {
      setEditOpen(false);
      setDiscardPending('edit');
      scheduleModalStackValidation(`${contextPrefix}-edit-request-close-dirty`);
      return;
    }
    closeEdit();
  };
```

```53:73:src/features/org/utils/org-discard-handlers.ts
  const handleDiscardCancel = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      setCreateOpen(true);
    } else if (pending === 'edit') {
      setEditOpen(true);
    }
    scheduleModalStackValidation(`${contextPrefix}-discard-cancel-resume`);
  };

  const handleDiscardConfirm = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      closeCreate();
    } else if (pending === 'edit') {
      closeEdit();
    }
    scheduleModalStackValidation(`${contextPrefix}-discard-confirmed`);
  };
```

UX-003 replica esta lógica con nombres de estado locales (`aprobarOpen` ↔ `editOpen`, `cerrarAprobar` ↔ `closeEdit`).

### 1.3 Divergencias identificadas

| Aspecto | ORG | UX-003 propuesto | ¿Divergencia problemática? |
|---------|-----|------------------|----------------------------|
| Factory `createOrgDiscardHandlers` | Usado | Handlers inline equivalentes | **No** — la factory está acoplada a par Radix create/edit; el primario B-L es `ConfirmDialog`, no Radix CRUD |
| Modo `'create'` | Sí | No (solo `'edit'`) | **No** — no hay creación de entidad; campos editables en confirm = modo edit |
| Primario | Radix `Dialog` | `ConfirmDialog` | **No** — B11-10 exige cerrar primario antes de discard; el tipo de overlay primario puede diferir (PB-13 workflow B-L) |
| `scheduleModalStackValidation` | Sí (DEV) | No en plan | **Menor** — recomendable añadir en implementación para paridad diagnóstico DEV |
| Nombre estado | `discardPending` | `aprobarDiscardPending` | **No funcional** — renombrable a `discardPending` (la página no tiene modales CRUD ORG) |
| Deshabilitar acciones con discard activo | Toolbar/fila `disabled={discardPending !== null}` | No en plan | **Menor** — baja probabilidad de interacción paralela; opcional P2 |
| `onOpenChange` Radix | `handleEditDialogOpenChange` → request close | `ConfirmDialog.onClose` → request close | **Equivalente** — distinto API, mismo contrato UX |

### 1.4 Conclusión §1

**No introduce variante INV innecesaria.** Es una **adaptación mecánica** del branch `edit` de ORG al contexto B-L (workflow confirm con campos embebidos). El componente `OrgDiscardConfirmDialog` se reutiliza sin props nuevas ni fork.

**Recomendación de implementación:** mantener handlers inline (no forzar `createOrgDiscardHandlers`). Opcionalmente:

- Renombrar `aprobarDiscardPending` → `discardPending` (paridad nominal ORG).
- Añadir `scheduleModalStackValidation('inv-inventario-fisico-aprobar-…')` en los tres handlers.

**No reutilizar** `createInvPageDiscardHandlers` — ese helper es para navegación/blocker en formularios B-F (`useInvTransactionalFormGuard`), no para confirms workflow.

---

## 2. ConfirmDialog stacking — demostración explícita

### 2.1 Overlays en juego

| ID | Componente | Control de visibilidad |
|----|------------|------------------------|
| O1 | `Dialog` detalle | `open={detailDialogOpen}` |
| O2 | `ConfirmDialog` Aprobar | `isOpen={aprobarOpen}` |
| O3 | `OrgDiscardConfirmDialog` | `isOpen={aprobarDiscardPending !== null}` |
| O4 | `ConfirmDialog` Anular | `isOpen={anularOpen}` |
| O5 | `ConfirmDialog` Finalizar | `isOpen={finalizarOpen}` |

### 2.2 Fórmulas propuestas (post UX-003)

```typescript
const workflowConfirmOpen = aprobarOpen || anularOpen || finalizarOpen;
const detailDialogOpen = detailOpen && !workflowConfirmOpen && aprobarDiscardPending === null;
```

**Invariante de implementación (obligatoria):**

```typescript
// Nunca violar:
!(aprobarOpen && aprobarDiscardPending !== null)
```

Enforced en `handleRequestCloseAprobar` (cierra O2 antes de abrir O3) y en `handleAprobarDiscardCancel` (cierra O3 antes de reabrir O2).

### 2.3 Combos prohibidos — prueba directa

#### A. O2 (Aprobar) + O3 (OrgDiscard) simultáneos

| Condición | Resultado |
|-----------|-----------|
| `aprobarOpen=true` ∧ `aprobarDiscardPending='edit'` | Imposible si handlers respetan invariante |
| Transición cancel dirty | Frame `aprobarOpen=false` → luego `discardPending='edit'`; nunca ambos true en mismo commit React |

#### B. O1 (Detalle) + O2 (Aprobar) simultáneos

| Mecanismo | Efecto |
|-----------|--------|
| Al abrir Aprobar | `setDetailOpen(false)` (código actual, línea 361) |
| `detailDialogOpen` | `detailOpen && !workflowConfirmOpen` → si `aprobarOpen=true`, `workflowConfirmOpen=true` → **O1 no renderiza** |

Aunque `detailOpen` quedara `true` por bug, `detailDialogOpen` sería `false` mientras `aprobarOpen=true`.

#### C. O1 (Detalle) + O3 (OrgDiscard) simultáneos

| Mecanismo | Efecto |
|-----------|--------|
| Discard solo tras cerrar Aprobar | Usuario ya pasó por flujo con `detailOpen=false` |
| `detailDialogOpen` | Requiere `aprobarDiscardPending === null` → con discard activo, **O1 no renderiza** |

### 2.4 Tabla de estados completa

Leyenda: **V** = overlay visible · **—** = no visible · `d` = `detailOpen` · `D` = `detailDialogOpen` · `a` = `aprobarOpen` · `dp` = `aprobarDiscardPending` · `an` = `anularOpen` · `fi` = `finalizarOpen`

Estados operativos alcanzables (filas inválidas marcadas ⛔):

| # | Escenario | d | a | dp | an | fi | D | O1 | O2 | O3 | O4 | O5 | Overlays activos |
|---|-----------|---|---|----|----|----|----|----|----|----|----|-----|------------------|
| S0 | Listado solo | F | F | null | F | F | F | — | — | — | — | — | 0 |
| S1 | Detalle normal | T | F | null | F | F | T | V | — | — | — | — | **1** |
| S2 | Aprobar editando | F | T | null | F | F | F | — | V | — | — | — | **1** |
| S3 | Cancel dirty (transitorio) | F | F | null | F | F | F | — | — | — | — | — | **0** |
| S4 | Discard pending | F | F | edit | F | F | F | — | — | V | — | — | **1** |
| S5 | Seguir editando | F | T | null | F | F | F | — | V | — | — | — | **1** |
| S6 | Anular (sin campos dirty UX-003) | F | F | null | T | F | F | — | — | — | V | — | **1** |
| S7 | Finalizar | F | F | null | F | T | F | — | — | — | — | V | **1** |
| S8 | Descartar → detalle | T | F | null | F | F | T | V | — | — | — | — | **1** |
| S9 | Aprobar OK (post-mutación) | F | F | null | F | F | F | — | — | — | — | — | **0** |
| ⛔ | Aprobar + Discard | * | T | edit | * | * | F | — | V | V | * | * | **2 — BLOQUEADO** |
| ⛔ | Detalle + Aprobar | T | T | null | F | F | F | — | V | — | — | — | **1** (O1 suprimido) |
| ⛔ | Detalle + Discard | T | F | edit | F | F | F | — | — | V | — | — | **1** (O1 suprimido) |

`*` = cualquier valor; en filas ⛔ la invariante/handlers impiden que el usuario permanezca en ese estado.

**Máximo overlays simultáneos en estados válidos: 1** (MD-04, B11-10, PB-13).

### 2.5 Ajuste adicional requerido (no en plan original)

El `Dialog` detalle tiene:

```333:335:src/features/inv/pages/InventarioFisicoPage.tsx
        onOpenChange={(open) => {
          if (!open && !workflowConfirmOpen) setDetailOpen(false);
        }}
```

**Implementación debe extender a:**

```typescript
if (!open && !workflowConfirmOpen && aprobarDiscardPending === null) {
  setDetailOpen(false);
}
```

Evita edge case Escape/outside-click en detalle mientras discard está activo con `detailOpen=true` residual.

### 2.6 Conclusión §2

Los tres combos prohibidos solicitados **no pueden coexistir** en estado estable con las fórmulas e invariantes propuestas. Riesgo residual: solo bug de implementación (olvidar cerrar O2 antes de O3) — mitigado con invariante documentada y QA Q12.

---

## 3. Reset empresa — ¿modificar `inv-list-empresa-reset.ts`?

### 3.1 Comportamiento actual

`useInvScopeEmpresaReset(resetPageFilters)` invoca `resetPageFilters` al cambiar `scopeEmpresaId`.

Hoy `resetPageFilters` llama a `resetInventarioFisicoListUiState`, que resetea:

- `detailOpen`, `selectedId`
- `aprobarOpen`, `aprobarTipoMovimientoId`, `aprobarObs`
- `anularOpen`, `finalizarOpen`

### 3.2 Estados nuevos UX-003

| Estado | Riesgo si no se resetea al cambiar empresa |
|--------|---------------------------------------------|
| `aprobarBaseline` | Bajo — overlay cerrado; baseline huérfano en memoria |
| `aprobarDiscardPending` | **Alto** — si `'edit'` persiste con `aprobarOpen=false`, **O3 quedaría visible** tras cambio de empresa |

### 3.3 Análisis de alternativas

| Opción | Descripción | Pros | Contras |
|--------|-------------|------|---------|
| **A — Solo página** | En `resetPageFilters`, después del helper: `setAprobarBaseline(null); setAprobarDiscardPending(null);` | Cero cambios en helper compartido; suficiente porque el helper **solo se consume** desde `InventarioFisicoPage` | Nuevo estado no documentado en contrato O6 del helper |
| **B — Extender helper** | Añadir setters al interface `InventarioFisicoListUiSetters` | Contrato O6 explícito y centralizado | +8–12 líneas en archivo compartido; beneficio marginal (un solo caller) |

### 3.4 Verificación de callers

```
resetInventarioFisicoListUiState → único uso: InventarioFisicoPage.tsx
```

No hay otros consumidores. **Opción A es suficiente y preferible** según criterio de minimizar helpers compartidos.

### 3.5 Implementación recomendada

```typescript
const resetPageFilters = useCallback(() => {
  // ... filtros existentes ...
  resetInventarioFisicoListUiState({ /* setters existentes */ });
  setAprobarBaseline(null);
  setAprobarDiscardPending(null);
  aprobarBaselineCapturedRef.current = false;
}, []);
```

**No modificar** `inv-list-empresa-reset.ts` en UX-003.

### 3.6 Conclusión §3

El plan original que proponía extender el helper es **válido pero no necesario**. La limpieza completa se resuelve en la página sin riesgo funcional demostrable.

---

## 4. Paridad futura UX-004

### 4.1 Candidatos identificados

| Pantalla | Confirm | Campos editables | Gap dirty (hoy) | Prioridad UX-004 |
|----------|---------|------------------|-----------------|------------------|
| `MovimientosPage` | Anular | `anularMotivo` (textarea) | Sí — `cerrarAnular()` resetea sin aviso | **Alta** |
| `MovimientosPage` | Autorizar / Procesar | Ninguno | No aplica PB-14 | — |
| `InventarioFisicoPage` | Anular / Finalizar | Ninguno | No aplica PB-14 | — |
| Catálogos INV/ORG | CRUD modales | Form completo | Ya cubierto por `createOrgDiscardHandlers` | — |
| Formularios B-F | Página completa | Form + líneas | Ya cubierto por `useInvTransactionalFormGuard` | — |

### 4.2 Qué reutiliza UX-003 en UX-004

| Pieza | Reutilizable | Notas |
|-------|--------------|-------|
| Patrón handlers (request close → discard → cancel/confirm) | ✅ **100%** | Copy adaptado; misma secuencia B11-10/11 |
| `OrgDiscardConfirmDialog` modo `'edit'` | ✅ **100%** | Sin cambios |
| `detailDialogOpen && !discardPending` | ✅ **100%** | `MovimientosPage` ya tiene la misma fórmula base |
| `useMemo` dirty vs baseline | ✅ **Patrón** | Shape del baseline cambia por workflow |
| `useEffect` estabilización baseline | ⚠️ **Parcial** | Solo si hay prefill async (Aprobar sí; Anular motivo inicia `''` → baseline trivial en open) |
| Invariante `!(primaryOpen && discardPending)` | ✅ **100%** | Genérico |
| Reset en `resetPageFilters` | ✅ **Patrón** | Por página, no helper compartido |

### 4.3 Qué queda específico por pantalla/workflow

| Específico | Ejemplo Aprobar (UX-003) | Ejemplo Anular Movimientos (UX-004) |
|------------|--------------------------|--------------------------------------|
| Campos en baseline | `tipoMovimientoId`, `obs` | `motivo` |
| Prefill / async | `tiposAjuste[0]` post-query | Sin prefill; baseline `{ motivo: '' }` al abrir |
| Función close | `cerrarAprobar` limpia tipo + obs | `cerrarAnular` limpia motivo |
| Guard isPending | `aprobarMutation.isPending` | `anularMutation.isPending` |
| Primary state | `aprobarOpen` | `anularOpen` |
| Validación submit | Tipo requerido (toast cliente) | Motivo opcional |

### 4.4 Extracción futura (post UX-003 + UX-004)

Si UX-004 confirma el patrón en 2+ pantallas, valorar helper INV dedicado (no mezclar con ORG):

```typescript
// Propuesta futura — NO implementar en UX-003
createInvWorkflowConfirmDiscardHandlers({
  primaryOpen, setPrimaryOpen,
  discardPending, setDiscardPending,
  isDirty, isSubmitting,
  closePrimary, contextPrefix,
})
```

Retornaría: `handleRequestClose`, `handleDiscardCancel`, `handleDiscardConfirm`.

**UX-003 debe permanecer inline** — prematuro extraer con un solo caso. UX-004 validará si el helper merece existir.

### 4.5 Conclusión §4

La solución UX-003 es **plantilla arquitectónica reutilizable** para workflow confirms B-L con campos editables. El candidato natural UX-004 es **`MovimientosPage` → Anular** (misma estructura, baseline más simple). No compite ni duplica `createOrgDiscardHandlers` (CRUD Radix) ni `useInvTransactionalFormGuard` (B-F navegación).

---

## 5. Riesgos arquitectónicos residuales

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Handlers inline divergen de ORG en mantenimiento | Baja | Documentar equivalencia con branch `edit`; extraer helper solo tras UX-004 |
| Olvidar invariante O2+O3 | Media | QA Q12; assert DEV opcional con `scheduleModalStackValidation` |
| `onOpenChange` detalle sin guard discard | Baja | Ajuste §2.5 obligatorio en implementación |
| Reset empresa sin limpiar `discardPending` | Media | Reset inline en `resetPageFilters` §3.5 |
| Falso dirty por prefill async (Aprobar) | Media | `useEffect` baseline del plan — específico UX-003 |

**Ningún riesgo bloquea implementación** si se aplican las recomendaciones de esta revisión.

---

## 6. Ajustes al plan UX-003 (respecto a entregable anterior)

| # | Plan original | Ajuste tras revisión |
|---|---------------|----------------------|
| 1 | Extender `inv-list-empresa-reset.ts` | **Eliminar** — reset solo en `resetPageFilters` |
| 2 | — | **Añadir** guard `aprobarDiscardPending` en `Dialog.onOpenChange` |
| 3 | Opcional | Renombrar `aprobarDiscardPending` → `discardPending` |
| 4 | Opcional | `scheduleModalStackValidation` en handlers |

---

## 7. Matriz QA adicional (stacking + reset)

| # | Caso | Esperado |
|---|------|----------|
| R1 | Cancel dirty Aprobar → inspeccionar DOM | Un solo `[role="dialog"]` |
| R2 | Seguir editando | Un solo dialog (Aprobar) |
| R3 | Cambiar empresa con discard visible | Sin dialog residual; estado limpio |
| R4 | Cambiar empresa con Aprobar abierto dirty | Sin discard huérfano post-reset |
| R5 | Abrir Aprobar → verificar detalle | Detalle no visible (O1 off) |

---

## 8. Veredicto final

| Criterio | Resultado |
|----------|-----------|
| Paridad ORG (`OrgDiscardConfirmDialog` + flujo B11) | ✅ Confirmada — adaptación mecánica, no variante INV |
| Stacking (3 combos prohibidos) | ✅ Demostrado — máx. 1 overlay en estados válidos |
| Reset empresa | ✅ Resoluble solo en página — **no modificar helper** |
| Reutilización UX-004 | ✅ Patrón transferible; Anular Movimientos es siguiente caso |
| Riesgos arquitectura | ✅ Ninguno bloqueante |

### Autorización

**UX-003 queda autorizado para implementación definitiva**, incorporando los ajustes §6.

| Artefacto | Estado |
|-----------|--------|
| Auditoría UX-003 | ✅ Aprobada |
| Plan UX-003 | ✅ Aprobado (con micro-ajustes §6) |
| Revisión pre-implementación (este doc) | ✅ Completa |
| Implementación código | ⏳ Autorizada |

---

*Generado: 2026-06-10 — Revisión arquitectónica UX-003, sin cambios de código.*
