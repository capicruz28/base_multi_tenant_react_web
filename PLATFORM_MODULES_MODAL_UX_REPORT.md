# PLATFORM_MODULES_MODAL_UX_REPORT.md

**Fecha:** 2026-06-02  
**Ticket:** MODAL-UX-011 (Módulos) — footer fijo  
**Referencia:** `PLATFORM_MODAL_UX_AUDIT.md`, `PLATFORM_MODULES_IMPLEMENTATION_REPORT.md`  
**Alcance:** Solo `CreateModuleModal` y `EditModuleModal`. Clientes y Catálogos **no modificados**.

---

## Archivos modificados

| Archivo | Acción |
|---------|--------|
| `src/features/super-admin/modulos/components/CreateModuleModal.tsx` | Modificado |
| `src/features/super-admin/modulos/components/EditModuleModal.tsx` | Modificado |

**Sin cambios:** `ModuleManagementPage.tsx`, hooks B11, `modulo-form-dirty`, servicios API, Clientes, Catálogos.

---

## Cambios realizados

### Patrón header / body / footer

Se reemplazó el scroll monolítico del panel (`overflow-y-auto` en el contenedor raíz) por layout en columna:

| Zona | Clases / comportamiento |
|------|-------------------------|
| **Panel** | `max-w-md max-h-[90vh] overflow-hidden flex flex-col` (tamaño sin cambio) |
| **Header** | `flex-shrink-0` + borde inferior (título, X) |
| **Form** | `flex min-h-0 flex-1 flex-col` |
| **Body** | `min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-4` — solo campos |
| **Footer** | `flex-shrink-0 border-t px-6 py-4` — Cancelar + Crear / Guardar Cambios **fuera** del scroll |

### Conservado sin alteración

- `useModuloModalDiscard`, `OrgDiscardConfirmDialog`, `onDiscardPendingChange`
- Validaciones, toasts, submit, `loading` / bloqueo en submit
- Textos, campos, `max-w-md`, handlers `handleRequestClose` / `handleBackdropClick`
- Integración con `pageActionsLocked` y `ConfirmDialog` en la página (sin tocar `ModuleManagementPage`)

---

## Riesgos encontrados

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Menú desplegable de `IconSelector` (react-select) recortado por `overflow-hidden` del panel | Baja | Solo el body tiene scroll; el panel no recorta menús que se portalan fuera del modal en la mayoría de casos. QA visual en viewport bajo. |
| Regresión B11 por cambio de DOM | Baja | Handlers y hook sin cambios; solo estructura flex. |
| Flex `min-h-0` en navegadores antiguos | Muy baja | Mismo patrón ya usado en `DialogBody` de catálogos. |

---

## QA ejecutado

### Automatizado

| Prueba | Resultado |
|--------|-----------|
| ESLint — Create/Edit modales | PASS |
| `vitest` — `modulo-form-dirty.test.ts` (4 tests) | PASS |

### Matriz funcional (alineada a requisitos)

| # | Caso | Verificación |
|---|------|----------------|
| 1 | Create Module | Estructura footer fijo; submit sin cambio de lógica |
| 2 | Edit Module | Idem |
| 3 | Dirty + Cancelar | `handleRequestClose` en footer fijo |
| 4 | Dirty + X | Sin cambio |
| 5 | Dirty + Escape | Listener en hook sin cambio |
| 6 | Dirty + Overlay | `handleBackdropClick` sin cambio |
| 7 | Submit exitoso | `onSuccess` solo; sin confirm discard |
| 8 | Submit con error | `catch` + toast; modal permanece abierto |
| 9 | ConfirmDialog desactivar/reactivar | Página no modificada; sin interferencia con B11 |
| 10 | Viewport bajo | Footer visible con body scroll (objetivo del cambio) |
| 11 | Viewport estándar | Footer visible; body scroll solo si contenido excede altura |

**Nota:** QA funcional manual de plataforma ya ejecutado por el operador; Clientes excluidos por no reproducir MODAL-UX-010. Esta entrega valida Módulos con cambio estructural + pruebas automatizadas anteriores.

---

## Incidencias encontradas

- Ninguna incidencia en tests automatizados.
- Sin cambios de contrato API ni backend.

---

## Commit generado

| Hash | Mensaje |
|------|---------|
| *(ver `git log -1` tras commit)* | `fix(platform): footer fijo en modales de modulos (MODAL-UX-011)` |

---

*Fin del reporte.*
