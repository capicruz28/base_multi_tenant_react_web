# INV-M2-SEC — Matriz de comportamiento UX para QA

**Fecha:** 31 mayo 2026  
**Estado:** Especificación QA — **sin código, sin commit**  
**Referencias:** [`INV_M2_SEC_AUDIT.md`](./INV_M2_SEC_AUDIT.md) · [`INV_M2_SEC_IMPLEMENTATION_PLAN.md`](./INV_M2_SEC_IMPLEMENTATION_PLAN.md)  
**Alcance:** Formularios B-F (`MovimientoFormPage`, `InventarioFisicoFormPage`) + comportamiento listas B-L al cambiar empresa (O6)

---

## 1. Propósito

Definir el **comportamiento esperado exacto** tras implementar M2-O1 … M2-O6, para que QA manual pueda validar sin ambigüedad:

- ¿Aparece **confirm discard** (`OrgDiscardConfirmDialog`)?
- ¿Aparece **toast**?
- ¿Hay **redirect** de ruta?
- ¿Hay **reset de formulario** (estado local cabecera + líneas)?

**Pantallas formulario:**

| Modo | Ruta movimiento | Ruta inventario físico |
|------|-----------------|------------------------|
| Create | `/app/inv/movimientos/nuevo` | `/app/inv/inventario-fisico/nuevo` |
| Edit | `/app/inv/movimientos/:id/editar` | `/app/inv/inventario-fisico/:id/editar` |

**Listado destino al salir / redirect edit:**

| Entidad | Ruta listado |
|---------|--------------|
| Movimiento | `/app/inv/movimientos` |
| Inventario físico | `/app/inv/inventario-fisico` |

---

## 2. Leyenda

| Símbolo | Significado |
|---------|-------------|
| **Sí** | Ocurre siempre en ese escenario |
| **No** | No debe ocurrir |
| **Sí\*** | Condicionado (ver nota de fila) |
| **N/A** | No aplica a ese escenario |
| **—** | Sin efecto / sin cambio relevante |

### 2.1 Confirm discard

Diálogo B.1.1 reutilizado de ORG:

- Título: *«Descartar cambios»*
- Cancelar del diálogo: *«Seguir editando»*
- Confirmar: *«Sí, descartar»*
- Create: mensaje con entidad (*«…sin crear el movimiento / la toma de inventario»*)
- Edit: *«…sin guardar?»*

### 2.2 Toasts

| Tipo | Origen | Texto orientativo |
|------|--------|-------------------|
| **Info empresa (edit)** | Hook guard O4 | *«La empresa activa cambió. Se cerró el documento en edición.»* |
| **Éxito guardado** | Hook mutation existente (pre-M2) | *«Movimiento creado/actualizado»* / equivalente IF — **no es nuevo M2** |
| **Error API** | Hook mutation existente | Sin cambio M2 |

M2-SEC **no introduce** toast en cambio empresa en create ni en listas.

### 2.3 Reset de formulario

| Tipo | Qué implica |
|------|-------------|
| **Reset completo** | Cabecera a valores iniciales create + una línea plantilla vacía; snapshot edit = null; formulario **no dirty** |
| **Reset por unmount** | Al redirect, el componente se desmonta; estado local desaparece (efecto equivalente a reset) |
| **Sin reset** | Estado local se conserva en pantalla |

### 2.4 Prioridad empresa vs dirty

**Regla global:** cambio de empresa en **edit** prevalece sobre confirm discard. Nunca se pregunta *«¿Descartar cambios?»* si el trigger fue cambio de empresa JWT.

---

## 3. Matriz principal — Formularios B-F

Filas = escenario base (estado del formulario + trigger).  
Columnas = efectos observables.

**Acciones de salida** incluidas en filas donde aplica: Cancelar, Volver, sidebar, botón atrás navegador — **mismo comportamiento** salvo nota.

| # | Escenario | Trigger / acción | Confirm discard | Toast | Redirect | Reset formulario |
|---|-----------|------------------|-----------------|-------|----------|------------------|
| **1** | **Create limpio** | Cancelar | No | No | Sí → listado | Reset por unmount |
| **1b** | **Create limpio** | Volver (←) | No | No | Sí → listado | Reset por unmount |
| **1c** | **Create limpio** | Sidebar → otra ruta | No | No | Sí → ruta elegida | Reset por unmount |
| **1d** | **Create limpio** | Botón atrás navegador | No | No | Sí → historial previo | Reset por unmount |
| **2** | **Create dirty** | Cancelar | **Sí** | No | Solo si confirma descarte → listado | Solo si confirma: reset completo antes de salir |
| **2b** | **Create dirty** | Volver (←) | **Sí** | No | Solo si confirma → listado | Solo si confirma: reset completo |
| **2c** | **Create dirty** | Sidebar → otra ruta | **Sí** | No | Solo si confirma → ruta destino | Solo si confirma: reset completo |
| **2d** | **Create dirty** | Botón atrás navegador | **Sí** | No | Solo si confirma → atrás | Solo si confirma: reset completo |
| **3** | **Edit limpio** | Cancelar | No | No | Sí → listado | Reset por unmount |
| **3b** | **Edit limpio** | Volver (←) | No | No | Sí → listado | Reset por unmount |
| **3c** | **Edit limpio** | Sidebar → otra ruta | No | No | Sí → ruta elegida | Reset por unmount |
| **3d** | **Edit limpio** | Botón atrás navegador | No | No | Sí → historial previo | Reset por unmount |
| **4** | **Edit dirty** | Cancelar | **Sí** | No | Solo si confirma → listado | Solo si confirma: reset completo |
| **4b** | **Edit dirty** | Volver (←) | **Sí** | No | Solo si confirma → listado | Solo si confirma: reset completo |
| **4c** | **Edit dirty** | Sidebar → otra ruta | **Sí** | No | Solo si confirma → ruta destino | Solo si confirma: reset completo |
| **4d** | **Edit dirty** | Botón atrás navegador | **Sí** | No | Solo si confirma → atrás | Solo si confirma: reset completo |
| **5** | **Cambio empresa en create** | Selector empresa header (cualquier estado limpio o dirty) | **No** | No | **No** — permanece en `/nuevo` | **Sí — reset completo** |
| **6** | **Cambio empresa en edit** | Selector empresa header (cualquier estado limpio o dirty) | **No** | **Sí — info empresa** | **Sí — inmediato → listado** | Reset por unmount |
| **7** | **Navegación sidebar** | Ver filas **1c–4c** según create/edit × limpio/dirty | (heredado) | (heredado) | (heredado) | (heredado) |
| **8** | **Botón atrás navegador** | Ver filas **1d–4d** según create/edit × limpio/dirty | (heredado) | (heredado) | (heredado) | (heredado) |
| **9** | **Cancelar** | Ver filas **1, 2, 3, 4** según modo y dirty | (heredado) | (heredado) | (heredado) | (heredado) |
| **10** | **Volver** | Ver filas **1b–4b** — **idéntico a Cancelar** | (heredado) | (heredado) | (heredado) | (heredado) |
| **11** | **Guardar exitoso** | Click Guardar (create o edit, limpio o dirty) | No | **Sí\*** — toast éxito mutation existente | Sí → listado | Reset por unmount |

**Nota fila 11:** El toast de éxito lo emite el hook de mutation ya existente; M2 no lo añade ni lo quita.

---

## 4. Matriz resumida por escenario (vista agrupada)

Vista compacta de los **11 escenarios** solicitados (promedio de acciones de salida equivalentes).

| Escenario | Confirm discard | Toast | Redirect | Reset formulario |
|-----------|-----------------|-------|----------|------------------|
| **Create limpio** | No | No | Sí (al salir → listado o ruta elegida) | Reset por unmount |
| **Create dirty** | **Sí** (al intentar salir) | No | Solo tras *«Sí, descartar»* | Solo tras confirmar descarte: reset completo; si *«Seguir editando»*: **sin reset** |
| **Edit limpio** | No | No | Sí (al salir) | Reset por unmount |
| **Edit dirty** | **Sí** (al intentar salir) | No | Solo tras *«Sí, descartar»* | Solo tras confirmar descarte: reset completo; si *«Seguir editando»*: **sin reset** |
| **Cambio empresa en create** | **No** (prevalencia tenant) | No | **No** — sigue en `/nuevo` | **Sí — reset completo**; formulario queda **no dirty** |
| **Cambio empresa en edit** | **No** (prevalencia tenant) | **Sí — info** | **Sí — inmediato → listado** | Reset por unmount |
| **Navegación sidebar** | Igual que create/edit limpio o dirty según estado | No* | Sí, destino = ruta del menú (si sale) | Según filas 1–4 |
| **Botón atrás navegador** | Igual que sidebar | No* | Sí, destino = historial (si sale) | Según filas 1–4 |
| **Cancelar** | Igual que escenario limpio/dirty del modo actual | No* | Sí → listado (si sale) | Según filas 1–4 |
| **Volver** | **Idéntico a Cancelar** | No* | Sí → listado (si sale) | Según filas 1–4 |
| **Guardar exitoso** | No | Sí* (mutation) | Sí → listado | Reset por unmount |

\*Excepto toast info empresa (solo fila cambio empresa edit) o éxito guardado (fila 11).

---

## 5. Desenlaces del confirm discard (Create/Edit dirty)

Aplica cuando filas 2, 2b–2d, 4, 4b–4d activan el diálogo.

| Acción usuario en diálogo | Confirm discard | Toast | Redirect | Reset formulario |
|---------------------------|-----------------|-------|----------|------------------|
| **Seguir editando** | Se cierra | No | **No** — permanece en formulario | **No** — datos intactos |
| **Sí, descartar** | Se cierra | No | **Sí** — listado o ruta bloqueada | **Sí — reset completo** (create) o abandonar edit (unmount) |
| **X / click fuera** del confirm | Equivalente a **Seguir editando** | No | No | No |

**Sidebar / atrás con blocker:** el destino tras *«Sí, descartar»* es la **ruta que el usuario intentó abrir**, no necesariamente el listado.

---

## 6. Guardar exitoso — detalle (escenario 11)

| Subcaso | Confirm discard | Toast | Redirect | Reset formulario |
|---------|-----------------|-------|----------|------------------|
| Create limpio → Guardar OK | No | Sí (mutation) | Sí → listado | Unmount |
| Create dirty → Guardar OK | No | Sí (mutation) | Sí → listado | Unmount |
| Edit limpio → Guardar OK | No | Sí (mutation) | Sí → listado | Unmount |
| Edit dirty → Guardar OK | No | Sí (mutation) | Sí → listado | Unmount |

**No** debe aparecer confirm discard antes del redirect post-éxito: el guardado exitoso **consume** los cambios.

---

## 7. Cambio de empresa — detalle ampliado

### 7.1 Create (`/nuevo`)

| Estado previo | Confirm discard | Toast | Redirect | Reset formulario |
|---------------|-----------------|-------|----------|------------------|
| Limpio | No | No | No | Sí — reset completo (efecto idempotente) |
| Dirty (cabecera y/o líneas) | **No** — no preguntar descarte | No | No | **Sí — reset completo** — pierde cambios **sin** confirm adicional |

**Post-condición QA:** tras cambio empresa en create, el formulario debe verse como recién abierto (fechas hoy, tipo IF = total, una línea vacía, selects de nueva empresa) y **no** debe considerarse dirty.

### 7.2 Edit (`/:id/editar`)

| Estado previo | Confirm discard | Toast | Redirect | Reset formulario |
|---------------|-----------------|-------|----------|------------------|
| Limpio | No | Sí — info | Sí → listado | Unmount |
| Dirty | **No** — prevalece tenant | Sí — info | Sí → listado | Unmount |

**Post-condición QA:** nunca debe mostrarse el documento de la empresa anterior en pantalla tras el cambio.

---

## 8. Listas transaccionales (O6) — cambio de empresa

Complemento QA para `MovimientosPage` e `InventarioFisicoPage`. **No** aplica confirm discard B.1.1 (modales detalle son lectura; fuera alcance M2).

| Estado UI al cambiar empresa | Confirm discard | Toast | Redirect | Reset / limpieza |
|------------------------------|-----------------|-------|----------|------------------|
| Solo listado visible | No | No | No | Filtros lista reset; `productosMap` vacío |
| Modal detalle abierto | No | No | No | Modal **cierra**; `selectedId` = null |
| Confirm workflow abierto (autorizar / procesar / anular / finalizar / aprobar) | No | No | No | Confirm **cierra** |
| IF — confirm aprobar con campos rellenados | No | No | No | Confirm cierra; `aprobarTipoMovimientoId` y `aprobarObs` = '' |
| Mov — confirm anular con motivo escrito | No | No | No | Confirm cierra; `anularMotivo` = '' |

**Post-condición QA:** tras cambio empresa, **ningún overlay** visible; tabla muestra datos de la nueva empresa (refetch vía invalidate M0).

---

## 9. Casos límite (fuera matriz principal, obligatorios QA)

| Caso | Confirm discard | Toast | Redirect | Reset formulario |
|------|-----------------|-------|----------|------------------|
| **Guardando…** (`submitting`) + Cancelar/Volver/sidebar/atrás | No — acción ignorada | No | No | No |
| **Guardando…** + cambio empresa edit | No | Sí — info* | Sí → listado* | Unmount |
| Discard abierto + **Seguir editando** | Se cierra | No | No | No |
| Create dirty + cambio empresa + luego Cancelar | No (ya reseteado) | No | Sí → listado | Unmount — form ya limpio |

\*Recomendación QA: si `submitting` y cambio empresa coinciden, prevalece redirect edit O4; mutation puede completar o fallar en background — **no es escenario nominal**; documentar si se observa en QA exploratorio.

---

## 10. Checklist QA por pantalla

### 10.1 MovimientoFormPage

- [ ] Create limpio: Cancelar → listado sin confirm
- [ ] Create dirty: Volver → confirm → Seguir editando → datos intactos
- [ ] Create dirty: sidebar → confirm → Sí descartar → sale
- [ ] Edit dirty: atrás navegador → confirm
- [ ] Edit dirty: cambio empresa → toast info + listado **sin** confirm previo
- [ ] Create dirty: cambio empresa → reset completo, sigue en `/nuevo`, sin confirm
- [ ] Guardar OK → listado + toast mutation, sin confirm discard

### 10.2 InventarioFisicoFormPage

- [ ] Misma batería que §10.1 adaptando rutas IF

### 10.3 MovimientosPage / InventarioFisicoPage

- [ ] Detalle abierto + cambio empresa → modal cerrado
- [ ] Confirm workflow abierto + cambio empresa → confirm cerrado, sin overlay huérfano

---

## 11. Fuera de alcance QA M2

No reportar como defecto M2-SEC:

| Comportamiento | Motivo |
|----------------|--------|
| Confirm discard en modal detalle lectura | Mantener — sin B.1.1 |
| Pérdida motivo anular / campos aprobar al cancelar confirm workflow | Recomendado audit — no implementado |
| `beforeunload` al cerrar pestaña con form dirty | Recomendado — no implementado |
| Toast al cambiar empresa en create | No especificado — no esperado |
| Empty states, TABLE_COLSPAN, toAppPath | Backlog M1-UX-B |

---

## 12. Veredicto

Esta matriz es la **fuente de verdad QA** para cierre INV-M2-SEC. Cualquier desviación en implementación debe actualizar este documento antes de sign-off.

---

*Especificación QA INV-M2-SEC. Sin código. Sin repair. Sin commit.*

---

## 13. Cobertura post-implementación (INV-M2-SEC)

**Fecha implementación:** 31 mayo 2026  
**Estado código:** Implementado — pendiente QA manual en runtime

| Caso matriz §4 / §10 | Cobertura código | Notas |
|----------------------|------------------|-------|
| Create limpio → Cancelar/Volver | ✅ M2-O1 | `handleRequestLeave` sin dirty |
| Create dirty → Cancelar/Volver/sidebar/atrás | ✅ M2-O1 + O3 | `useBlocker` + `OrgDiscardConfirmDialog` |
| Edit limpio → salir | ✅ M2-O1 | Idem create limpio |
| Edit dirty → salir | ✅ M2-O1 + O3 | Discard edit no resetea form (unmount) |
| Cambio empresa create | ✅ M2-O5 | `useInvTransactionalFormGuard` effect + reset completo |
| Cambio empresa edit | ✅ M2-O4 | Toast + redirect listado |
| Guardar exitoso | ✅ Sin cambio M2 | `navigate` directo post-mutation |
| Listas — cierre modals/confirms | ✅ M2-O6 | `resetMovimientosListUiState` / `resetInventarioFisicoListUiState` |
| Seguir editando / Sí descartar | ✅ M2-O3 | `createInvPageDiscardHandlers` |
| Guardando… bloquea salida | ✅ M2-O1 | `isSubmitting` gate en handlers |
| Dirty snapshot cabecera + líneas | ✅ M2-O2 | `form-dirty/*` por entidad |
| Auto-set moneda create baseline | ✅ M2-O2 | Sync `createBaseline` en effect monedas (Movimiento) |

**Pendiente QA manual:** validación runtime sidebar/back en navegador real (blocker RR).

**Fuera alcance (sin regresión esperada):** modales detalle, confirms workflow, catálogos.
