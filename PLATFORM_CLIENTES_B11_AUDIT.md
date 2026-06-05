# PLATFORM_CLIENTES_B11_AUDIT.md

**Ticket:** UX-PLAT-P1-01  
**Alcance:** B.1.1 (protección de descarte de cambios) en `CreateClientModal` y `EditClientModal`  
**Fecha:** 2026-06-02  
**Repositorio:** Frontend únicamente  
**Normativa:** `ERP_FRONTEND_STANDARDS_V2.md` §7.1 (B11-xx), §9.4 (PL-03), referencia IAM/ORG

---

## 1. Resumen ejecutivo

Los modales de Clientes Platform son formularios **multi-sección** (~900–1000 LOC cada uno), con estado **encapsulado dentro del componente modal** y cierre directo vía `onClose()` **sin** detección de cambios ni confirmación de descarte.

En el repositorio existe un **patrón B.1.1 maduro** (ORG, INV, IAM) basado en:

- utilidades `form-dirty/*`
- estado `discardPending: 'create' | 'edit' | null`
- `OrgDiscardConfirmDialog` + `ConfirmDialog`
- handlers (`createOrgDiscardHandlers` o equivalente inline en IAM)

**Recomendación:** reutilizar piezas compartidas (`OrgDiscardConfirmDialog`, helpers de normalización, patrón `onRequestClose`) **sin** migrar obligatoriamente a Radix `Dialog` en esta fase. Implementar dirty + discard **dentro de cada modal** y elevar a `ClientManagementPage` solo lo necesario para deshabilitar la página (B11-03, recomendado).

**Estimación total:** 2.5–4 días (desarrollo + QA manual).

---

## 2. Estado actual — CreateClientModal

**Archivo:** `src/features/super-admin/clientes/components/CreateClientModal.tsx`

### 2.1 Arquitectura UI

| Aspecto | Implementación actual |
|---------|------------------------|
| Contenedor | Modal **custom**: `fixed inset-0` + overlay `bg-black/50`, **no** usa `@/shared/components/ui/dialog` (Radix) |
| Tamaño | `max-w-4xl`, `max-h-[90vh]`, scroll interno en `<form>` |
| Secciones | 4 tabs: `basic`, `config`, `branding`, `subscription` (`activeSection`) |
| Progreso | Barra de progreso + indicadores `getSectionCompletion()` (validación UX, no dirty) |
| Props | `isOpen`, `onClose`, `onSuccess` |

### 2.2 Estado y datos

| Estado | Propósito |
|--------|-----------|
| `formData: ClienteCreate` | ~20+ campos editables |
| `errors` | Validación local por campo |
| `loading` | Submit create |
| `validatingSubdomain`, `subdomainAvailable`, `subdomainMessage` | Validación async debounced (500 ms) — **no** forma parte del payload hasta submit |
| `activeSection` | Navegación interna wizard |

**Reset al abrir:** `useEffect` cuando `isOpen === true` reinicia `formData`, `errors`, subdominio y `activeSection = 'basic'`.

### 2.3 Cierre actual (sin B.1.1)

Todos los caminos invocan **`onClose()` directamente**:

- Botón **X** (header): `onClick={onClose}`
- Botón **Cancelar** (footer): `onClick={onClose}`
- Tras **submit OK**: `onSuccess(); onClose()`

**No implementado:**

- `isDirty` / snapshot / baseline
- `discardPending`
- `ConfirmDialog` de descarte
- Bloqueo de cierre si `loading`
- Cierre por clic en overlay (el backdrop **no** tiene `onClick`; solo cierra por controles explícitos)
- Cierre por **ESC** (no hay listener; comportamiento distinto a modales Radix)

### 2.4 Detección de cambios

**No existe.** Cualquier edición se pierde al cerrar sin aviso.

### 2.5 Particularidades que afectan dirty

1. **Inconsistencia baseline vs reset** (riesgo para implementación):
   - Estado inicial `useState`: `plan_suscripcion: SubscriptionPlan.TRIAL`, `estado_suscripcion: SubscriptionStatus.TRIAL`
   - Reset en `useEffect` (open): `plan_suscripcion: 'trial'`, `estado_suscripcion: 'trial'` (strings literales)
   - Si el baseline dirty usa solo el estado inicial, un open→close sin editar podría marcar dirty falso según orden de ejecución.

2. **Inputs de color** con `onChange` custom en el `<input type="text">` sin `name`; el `color` picker sí usa `name`. La comparación dirty debe normalizar por **valores de `formData`**, no por eventos.

3. **`subdomainAvailable` / mensajes de validación** no deben considerarse “cambios del formulario” (son estado derivado/async).

4. **Navegación entre secciones** (`activeSection`) no debe disparar confirmación de descarte (no es salida del modal).

---

## 3. Estado actual — EditClientModal

**Archivo:** `src/features/super-admin/clientes/components/EditClientModal.tsx`

### 3.1 Arquitectura UI

Misma estructura que Create: modal custom, 4 secciones, `max-w-4xl`, sin Radix Dialog.

### 3.2 Estado y datos

| Estado | Propósito |
|--------|-----------|
| `formData: ClienteUpdate` | Inicializado desde prop `cliente` |
| `errors` | Validación local |
| `updateMutation` (`useUpdateCliente`) | `loading = isPending` |
| `activeSection` | Tabs internos |

**Hidratación:** `useEffect([isOpen, cliente])` rellena `formData` cuando abre, normalizando fechas con `.split('T')[0]`.

### 3.3 Cierre actual

Igual que Create: **X**, **Cancelar** → `onClose()`; éxito → `onSuccess(); onClose()`.

### 3.4 Detección de cambios

**No existe.**

### 3.5 Particularidades edit

1. **Snapshot edit** debe capturarse **al abrir** (B11-08), con la misma normalización que la comparación (fechas `YYYY-MM-DD`, `null` vs `''`, trim strings).

2. Campo **`es_activo`** solo en edit (sección subscription) — incluir en snapshot.

3. Campo **solo lectura** `ultima_sincronizacion` (desde `cliente`, no en `formData`) — **excluir** de dirty (B11-09: solo campos UI del modal).

4. Tras save OK la mutación cierra vía callback; no debe mostrarse discard (B11-07).

---

## 4. Integración en página padre

**Archivo:** `src/features/super-admin/clientes/pages/ClientManagementPage.tsx`

```tsx
// Cierre directo — sin capa B.1.1
<CreateClientModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSuccess={handleCreateSuccess}
/>

<EditClientModal
  isOpen={isEditModalOpen}
  onClose={() => { setIsEditModalOpen(false); setSelectedCliente(null); }}
  onSuccess={handleEditSuccess}
  cliente={selectedCliente}
/>
```

| Observación | Impacto |
|-------------|---------|
| No hay `discardPending` en página | Toolbar/búsqueda/paginación **no** se deshabilitan durante confirm discard (B11-03) |
| `window.confirm` en desactivar cliente | Hallazgo separado (UX-PLAT-P1-02); **independiente** de B.1.1 (B11-02) |
| Modales solo usados aquí | No hay segundo punto de entrada (p. ej. `ClientDetailPage` no monta Edit modal) |

---

## 5. Patrones B.1.1 reutilizables en el repositorio

### 5.1 Piezas compartidas (recomendadas para Platform Clientes)

| Pieza | Ubicación | Uso en Clientes |
|-------|-----------|-----------------|
| `OrgDiscardConfirmDialog` | `src/features/org/components/OrgDiscardConfirmDialog.tsx` | Confirmación estándar: “Seguir editando” / “Sí, descartar”, `variant="warning"` |
| `OrgDiscardPending` | `src/features/org/types/org-discard.types.ts` | Tipo `'create' \| 'edit' \| null` |
| `createOrgDiscardHandlers` | `src/features/org/utils/org-discard-handlers.ts` | Orquestación close → hide modal → `discardPending` → resume/confirm |
| Helpers normalización | `src/features/org/utils/org-form-dirty.helpers.ts` | `str`, `optStr`, `bool` para comparar formularios |
| `ConfirmDialog` | `src/shared/components/ui/ConfirmDialog.tsx` | Base visual (ya usada por `OrgDiscardConfirmDialog`) |

### 5.2 Patrón “form-dirty” (canónico ORG/INV)

Ejemplo referencia: `src/features/org/utils/form-dirty/departamento-form-dirty.ts`

- **Create:** `CREATE_BASELINE` constante + `isCreateXDirty(form)` vía `JSON.stringify(normalize(form))`.
- **Edit:** `buildEditXFormSnapshot(form)` al abrir + `isEditXDirty(form, snapshot)`.

IAM equivalente: `src/features/admin/utils/iam-user-form.utils.ts` (comparación campo a campo para usuarios).

### 5.3 Patrón página + Dialog Radix (ORG / IAM)

Flujo típico en `DepartamentosPage` / `UserManagementPage`:

1. `isCreateDialogDirty` / `isEditDialogDirty` (`useMemo`)
2. `handleRequestCloseCreate` → si dirty: cerrar modal visual + `setDiscardPending('create')`
3. `OrgDiscardConfirmDialog` en página
4. `handleDiscardCancel` → reabre modal
5. `handleDiscardConfirm` → `closeCreate` / `closeEdit` (reset form)
6. `orgDialogGuardProps` en `DialogContent`: previene overlay/ESC **sin** pasar por `onRequestClose`

**UserCreateDialog:** `onOpenChange` → si `!next` llama `onRequestClose()`; guard props inline en `DialogContent`.

### 5.4 Qué NO aplica tal cual a Clientes

| Pieza | Motivo |
|-------|--------|
| `orgDialogGuardProps` | Requiere Radix `DialogContent`; modales Clientes son custom |
| `useInvTransactionalFormGuard` | B-F página completa; PA-06 prohíbe en Plantilla A platform listados |
| `scheduleModalStackValidation` | Orientado a stack Radix IAM; modales custom no dejan overlay Radix |
| `createInvPageDiscardHandlers` | Navegación `useBlocker` — no aplica a modal sobre listado |

### 5.5 Cobertura Platform actual

`grep discardPending src/features/super-admin` → **0 resultados**.  
Platform **no** tiene B.1.1 implementado hoy; Clientes sería la **primera** adopción en super-admin.

---

## 6. Normativa V2 aplicable

| ID | Regla | Aplicación Clientes |
|----|-------|---------------------|
| **PL-03** | SHOULD B.1.1 en modales CRUD platform multi-campo | **Motiva** este sprint; no bloqueante legal, sí operativo |
| **B11-01** | MUST confirm si dirty al cerrar (X, ESC, overlay, Cancelar) | Objetivo del ticket |
| **B11-02** | Confirm desactivar **independiente** de discard | No mezclar con P1-02 |
| **B11-03** | MUST deshabilitar toolbar si `discardPending !== null` | **Recomendado** en `ClientManagementPage` |
| **B11-04** | Textos “Seguir editando” / “Sí, descartar” | Vía `OrgDiscardConfirmDialog` |
| **B11-05** | MUST NOT cerrar si submitting | `loading` / `updateMutation.isPending` |
| **B11-06** | `onInteractOutside` / ESC → prevent si dirty | Requiere implementación custom o migración a Dialog |
| **B11-07** | Cerrar sin discard tras save OK | Ya parcialmente OK; asegurar no abrir discard post-mutación |
| **B11-08** | Snapshot edit al abrir; baseline create en open | **Crítico** para Edit; Create alinear reset único |
| **B11-09** | Dirty solo campos UI del modal | Excluir `ultima_sincronizacion`, estado subdominio async |

**QA referencia:** matriz 9 casos `INV_M3_B11_CATALOGS_AUDIT.md` §8 (adaptar a wizard multi-sección).

---

## 7. Diseño recomendado

### 7.1 Enfoque: “Modal-encapsulado + piezas ORG compartidas”

**No** elevar todo el estado del formulario a `ClientManagementPage` (refactor masivo, alto riesgo).  
**Sí** implementar en cada modal:

1. Utilidad `cliente-form-dirty.ts` (normalización + funciones dirty).
2. Estado local `discardPending` + `OrgDiscardConfirmDialog` **dentro del modal** (o en página si se prefiere un solo dialog — ver §7.2).
3. Reemplazar llamadas directas a `onClose` por `handleRequestClose()` en X, Cancelar y (si se añade) overlay/ESC.
4. Prop opcional `onDiscardPendingChange?: (pending: OrgDiscardPending) => void` hacia la página para B11-03.

**Ventajas:** diff acotado, lógica de validación/subdominio intacta, alineado a complejidad del wizard.  
**Desventaja:** duplica orquestación respecto a ORG (mitigable extrayendo un `createPlatformModalDiscardHandlers` fino).

### 7.2 Alternativa evaluada — Migrar a Radix Dialog

| Criterio | Modal custom + B.1.1 | Migrar a `Dialog` |
|----------|----------------------|-------------------|
| Alineación ORG/IAM | Media | Alta |
| Riesgo regresión UI | Bajo | Medio-alto (layout wizard, scroll, z-index) |
| B11-06 (overlay/ESC) | Implementar manual | `orgDialogGuardProps` nativo |
| Esfuerzo | 2.5–4 d | 4–6 d |

**Recomendación:** Fase 1 = B.1.1 sobre modal actual; Fase 2 opcional = migración a `Dialog` (deuda UX Platform).

### 7.3 Contrato de props propuesto (mínimo)

```ts
// CreateClientModal / EditClientModal
interface Props {
  isOpen: boolean;
  onClose: () => void;           // cierre “limpio” (post-confirm o sin dirty)
  onRequestClose?: () => void;    // opcional: si padre orquesta discard (no necesario fase 1)
  onSuccess: () => void;
  onDiscardPendingChange?: (p: OrgDiscardPending) => void;
  // Edit: cliente
}
```

Fase 1: mantener `onClose` como callback final; internamente `handleRequestClose` decide si mostrar discard.

### 7.4 Utilidad dirty — campos en scope

**Create (`ClienteCreate`):** todos los campos de `formData` en UI (~22 campos), normalizados:

- strings: `trim`, `''` → coherente con baseline
- opcionales: `null` / `''` equivalentes
- booleanos: `es_demo`, `sincronizacion_habilitada`
- enums: `tipo_instalacion`, `modo_autenticacion`, `plan_suscripcion`, `estado_suscripcion`
- fechas: `fecha_*` como string `YYYY-MM-DD` o `''`

**Edit (`ClienteUpdate`):** mismos campos editables + `es_activo`; snapshot desde `cliente` al abrir con **misma** normalización que `formData` hidratado.

**Excluidos:** `validatingSubdomain`, `subdomainAvailable`, `subdomainMessage`, `activeSection`, `errors`, `ultima_sincronizacion`.

### 7.5 Flujo de cierre (diagrama)

```mermaid
flowchart TD
  A[Usuario intenta cerrar] --> B{submitting?}
  B -->|Sí| Z[Bloquear - B11-05]
  B -->|No| C{isDirty?}
  C -->|No| D[onClose + reset]
  C -->|Sí| E[Ocultar modal / mantener estado]
  E --> F[discardPending = create|edit]
  F --> G[OrgDiscardConfirmDialog]
  G --> H{Usuario elige}
  H -->|Seguir editando| I[Re-mostrar modal]
  H -->|Sí, descartar| D
```

### 7.6 Overlay y ESC (B11-06)

Modal custom actual **no** cierra por overlay ni ESC. Opciones:

1. **Mínimo (aceptable fase 1):** proteger solo **X** y **Cancelar** (cumple espíritu B11-01 para controles explícitos; gap en ESC/overlay).
2. **Completo:** `onClick` en backdrop → `handleRequestClose`; `useEffect` keydown Escape → `handleRequestClose` si dirty, si no dirty → close directo.
3. **Ideal largo plazo:** migrar a `Dialog` + `orgDialogGuardProps` + `onOpenChange`.

**Recomendación fase 1:** opción **2** (bajo costo, cierra gap B11-06 sin migración Radix).

---

## 8. Estrategia de implementación

### Fase 0 — Preparación (0.5 d)

1. Crear `src/features/super-admin/clientes/utils/form-dirty/cliente-form-dirty.ts`:
   - `CREATE_CLIENT_BASELINE` (única fuente de verdad, alineada al reset en `useEffect`)
   - `isCreateClienteDirty(form)`
   - `buildEditClienteFormSnapshot(cliente | form)`
   - `isEditClienteDirty(form, snapshot)`
2. Corregir inconsistencia `SubscriptionPlan.TRIAL` vs `'trial'` en reset de Create (pre-requisito para dirty fiable).

### Fase 1 — CreateClientModal (1–1.5 d)

1. `useMemo` → `isDirty = isCreateClienteDirty(formData)`
2. Estado `discardPending` local
3. `handleRequestClose`, `handleDiscardCancel`, `handleDiscardConfirm` (patrón IAM/ORG)
4. Sustituir `onClick={onClose}` en X y Cancelar por `handleRequestClose`
5. Backdrop click + ESC (opción 2 §7.6)
6. Render `<OrgDiscardConfirmDialog entityLabel="el cliente" ... />`
7. `useEffect` notificar `onDiscardPendingChange?.(discardPending)`
8. Tras submit OK: cerrar sin pasar por discard (`onSuccess` + reset)

### Fase 2 — EditClientModal (0.5–1 d)

1. `editSnapshot` en `useRef` o state, set al abrir (`isOpen && cliente`)
2. `isDirty` con `isEditClienteDirty`
3. Misma orquestación discard que Create
4. Verificar fechas y `es_activo` en snapshot

### Fase 3 — ClientManagementPage (0.25–0.5 d)

1. Estado `clienteDiscardPending` agregado desde callbacks de ambos modales (OR tomar el máximo de dos — solo uno abierto a la vez)
2. Deshabilitar: búsqueda, filtros, paginación, “Nuevo cliente”, acciones fila si `clienteDiscardPending !== null` (B11-03 recomendado)
3. Mantener `window.confirm` de desactivar **separado** (P1-02)

### Fase 4 — QA manual (0.5 d)

Matriz mínima (adaptada de INV M3):

| # | Caso | Esperado |
|---|------|----------|
| 1 | Abrir create, cerrar sin editar | Cierra sin confirm |
| 2 | Editar un campo, Cancelar | Confirm discard |
| 3 | Discard → Seguir editando | Modal vuelve, datos intactos |
| 4 | Discard → Sí, descartar | Cierra, datos perdidos |
| 5 | Submit OK create/edit | Cierra sin confirm |
| 6 | Submit en curso, intentar cerrar | Bloqueado |
| 7 | Cambiar sección con dirty | Sin confirm (solo navegación interna) |
| 8 | Edit: abrir, sin cambios, cerrar | Sin confirm |
| 9 | Con discard abierto, página | Toolbar deshabilitada (si Fase 3) |

---

## 9. Riesgos de regresión

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Falso dirty por baseline/reset distintos (`trial` vs enum) | Alta | Unificar constantes en `cliente-form-dirty.ts` + un solo reset |
| Falso dirty por `null` vs `''` en opcionales | Media | Normalizers `str` / `optStr` compartidos |
| Fechas edit ISO vs `YYYY-MM-DD` | Media | Snapshot con misma transformación que `useEffect` hidratación |
| Subdominio async dispara re-render sin dirty real | Baja | No incluir estado async en compare |
| Doble modal confirm (discard + desactivar cliente) | Baja | No combinar P1-01 y P1-02 en mismo handler |
| Wizard “Siguiente” confundido con salida | Baja | Solo `handleRequestClose` en salidas reales |
| Color picker/text desincronizados | Media | Comparar `formData.color_*` únicamente |
| `onDiscardPendingChange` desincronizado al desmontar | Baja | Limpiar pending en `close`/`useEffect` cleanup |
| Migración accidental a Dialog rompe layout | Alta | Evitar en P1-01; sprint aparte |

---

## 10. Archivos exactos a modificar

### Obligatorios (implementación P1-01)

| Archivo | Cambio |
|---------|--------|
| `src/features/super-admin/clientes/utils/form-dirty/cliente-form-dirty.ts` | **Nuevo** — baseline, snapshot, `isCreate*Dirty`, `isEdit*Dirty` |
| `src/features/super-admin/clientes/components/CreateClientModal.tsx` | Dirty, discard flow, `OrgDiscardConfirmDialog`, `handleRequestClose`, overlay/ESC |
| `src/features/super-admin/clientes/components/EditClientModal.tsx` | Idem edit + snapshot |
| `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` | `discardPending` agregado, deshabilitar controles (B11-03) |

### Reutilizados sin modificación (import)

| Archivo | Rol |
|---------|--------|
| `src/features/org/components/OrgDiscardConfirmDialog.tsx` | UI confirmación discard |
| `src/features/org/types/org-discard.types.ts` | Tipo `OrgDiscardPending` |
| `src/features/org/utils/org-form-dirty.helpers.ts` | Normalización campos |

### Opcionales (no requeridos P1-01)

| Archivo | Cuándo |
|---------|--------|
| `src/features/super-admin/clientes/utils/platform-discard-handlers.ts` | Si se quiere DRY entre Create/Edit (wrapper de `createOrgDiscardHandlers`) |
| `src/features/super-admin/clientes/components/CreateClientModal.tsx` → split a `Dialog` | Fase 2 deuda UX |
| Tests unitarios `cliente-form-dirty.test.ts` | Si el equipo exige cobertura en utils |

### Fuera de alcance

- `ClientDetailPage.tsx` (no monta estos modales hoy)
- Modales Módulos / Conexiones Platform
- UX-PLAT-P1-02 (`window.confirm` desactivar)

---

## 11. Estimación

| Bloque | Días persona |
|--------|----------------|
| Utils dirty + fix baseline create | 0.5 |
| CreateClientModal B.1.1 | 1 – 1.5 |
| EditClientModal B.1.1 | 0.5 – 1 |
| ClientManagementPage (B11-03) | 0.25 – 0.5 |
| QA manual matriz 9 casos | 0.5 |
| **Total** | **2.75 – 4** |

**Complejidad drivers:** volumen de campos, wizard 4 secciones, validación subdominio async, modal custom (no Radix).

---

## 12. Decisiones abiertas (para aprobación pre-implementación)

1. **¿Fase 1 incluye overlay + ESC** (§7.6 opción 2) o solo X/Cancelar?
2. **¿B11-03 en página** (deshabilitar listado con discard abierto) en el mismo sprint o follow-up?
3. **¿Unificar reset Create** con `SubscriptionPlan` / `SubscriptionStatus` en el mismo PR?
4. **¿Tests unitarios** de `cliente-form-dirty` obligatorios o solo QA manual?

---

## 13. Referencias de código

| Referencia | Ruta |
|------------|------|
| Modales objetivo | `src/features/super-admin/clientes/components/CreateClientModal.tsx`, `EditClientModal.tsx` |
| Página padre | `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` |
| Tipos | `src/features/super-admin/clientes/types/cliente.types.ts` |
| Patrón ORG página | `src/features/org/pages/DepartamentosPage.tsx` |
| Handlers ORG | `src/features/org/utils/org-discard-handlers.ts` |
| Dialog discard UI | `src/features/org/components/OrgDiscardConfirmDialog.tsx` |
| Patrón IAM | `src/features/admin/pages/UserManagementPage.tsx`, `UserCreateDialog.tsx` |
| Dirty ejemplo | `src/features/org/utils/form-dirty/departamento-form-dirty.ts` |
| Hallazgo UX previo | `PLATFORM_ACTIVE_UX_REVIEW.md` (UX-PLAT-ACT-02) |
| Normativa | `ERP_FRONTEND_STANDARDS_V2.md` §7.1, §9.4 PL-03 |

---

*Documento generado para gate de diseño UX-PLAT-P1-01. Sin implementación de código.*
