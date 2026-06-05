# PLATFORM_MODULES_IMPLEMENTATION_REPORT

**Fecha:** 2026-06-02  
**Ruta:** `/super-admin/modulos`  
**Tickets:** PLAT-SURF-003, PLAT-SURF-004, PLAT-SURF-005

---

## Archivos modificados

| Archivo | Acción |
|---------|--------|
| `src/features/super-admin/modulos/pages/ModuleManagementPage.tsx` | Modificado |
| `src/features/super-admin/modulos/components/CreateModuleModal.tsx` | Modificado |
| `src/features/super-admin/modulos/components/EditModuleModal.tsx` | Modificado |
| `src/features/super-admin/modulos/utils/form-dirty/modulo-form-dirty.ts` | Creado |
| `src/features/super-admin/modulos/hooks/useModuloModalDiscard.ts` | Creado |
| `src/features/super-admin/modulos/utils/form-dirty/__tests__/modulo-form-dirty.test.ts` | Creado |

**Reutilizado (sin cambios):** `ConfirmDialog`, `OrgDiscardConfirmDialog`, `org-form-dirty.helpers`.

**Fuera de alcance (no tocado):** servicios API, otras páginas de `modulos/`, Clientes, Catálogos, Dashboard, Auditoría.

---

## Cambios realizados

### PLAT-SURF-003 — ConfirmDialog activar/desactivar

- Eliminado `handleToggleActivation` (mutación directa).
- Flujo `openActiveConfirm` → `ConfirmDialog` → `handleActiveConfirm` con `togglingActive` y guard `togglingActive` en confirm para evitar doble envío.
- Toasts: éxito desactivar / reactivar; error con mensaje del servicio.
- `ConfirmDialog` solo visible si `moduloDiscardPending === null` (no compite con descarte B11).

### PLAT-SURF-004 — Vocabulario Desactivar / Reactivar

- Tooltips de fila y grid: `Desactivar` / `Reactivar` (antes «Activar»).
- Títulos y textos del `ConfirmDialog`: «Desactivar módulo» / «Reactivar módulo».
- Toast de reactivación: «Módulo reactivado exitosamente» (antes «activado»).
- Mensajes de error: «desactivar» / «reactivar».
- Etiquetas de estado en tabla/grid («Activo» / «Inactivo») se mantienen como indicadores de estado, no como acciones.

### PLAT-SURF-005 — B.1.1 Descarte de cambios

- `modulo-form-dirty.ts`: baseline create, snapshot edit, normalización de campos.
- `useModuloModalDiscard.ts`: X, Cancelar, Escape, overlay → `OrgDiscardConfirmDialog` («Seguir editando» / «Sí, descartar»).
- Create/Edit modales: `shellVisible`, bloqueo de cierre durante submit, sin `onClose` en submit exitoso (solo `onSuccess`).
- `pageActionsLocked` cuando hay `moduloDiscardPending` o confirm de estado activo; toolbar, paginación, export, vistas tabla/grid y acciones de fila bloqueadas.
- Toast duplicado en create eliminado de la página (queda solo en el modal).
- `es_activo` en create excluido del dirty (checkbox no dispara descarte por sí solo).

---

## Riesgos encontrados

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| QA manual UI no automatizado en CI | Baja | Validación de modales/overlay requiere navegador. |
| `pageActionsLocked` bloquea toda la barra durante confirm de estado | Esperado | Mismo patrón que Clientes (B11-03). |
| ESLint `no-explicit-any` preexistente en `ModuleManagementPage` (filtros export) | Baja | No introducido por este cambio; sin modificar contratos. |

---

## QA ejecutado

### Automatizado

| Prueba | Resultado |
|--------|-----------|
| `vitest run` — `modulo-form-dirty.test.ts` (4 tests) | PASS |
| ESLint — archivos nuevos/modificados (modales, hook, dirty) | PASS |
| ESLint — `ModuleManagementPage.tsx` | Preexistente: 3× `no-explicit-any` en filtros export |

### Matriz manual (código / patrón alineado a Clientes)

| # | Caso | Verificación |
|---|------|----------------|
| 1 | Crear módulo | Submit → toast modal + `onSuccess` + refetch; sin doble toast en página |
| 2 | Editar módulo | Submit → toast modal + cierre sin confirm descarte |
| 3 | Dirty + Cancelar | `handleRequestClose` → `OrgDiscardConfirmDialog` |
| 4 | Dirty + X | Igual que Cancelar |
| 5 | Dirty + Escape | Listener en `useModuloModalDiscard` |
| 6 | Dirty + Overlay | `handleBackdropClick` |
| 7 | Submit exitoso | Sin confirm descarte; `loading` bloquea cierre |
| 8 | Desactivar módulo | `ConfirmDialog` danger + API deactivate |
| 9 | Reactivar módulo | `ConfirmDialog` info + API activate + copy «reactivado» |
| 10 | ConfirmDialog loading | `loading={togglingActive}` + guard en `handleActiveConfirm` |
| 11 | `pageActionsLocked` | `moduloDiscardPending \|\| activeTarget` |
| 12 | Vista tabla | Acciones con confirm y locks |
| 13 | Vista grid | Misma lógica que tabla |

*Nota: casos 3–13 requieren verificación en navegador por el operador si no se ejecutó sesión manual en esta entrega.*

---

## Incidencias encontradas

- Ninguna incidencia funcional detectada en tests automatizados.
- Sin cambios de backend ni contratos API.

---

## Commits generados

| Hash | Mensaje |
|------|---------|
| `3cbb05e` | `feat(platform): PLAT-SURF-003/004/005 en gestion de modulos` |
| `77a3f49` | `docs: actualizar hash de commit en reporte modulos PLAT-SURF` |

Cuerpo: ConfirmDialog para desactivar/reactivar, vocabulario unificado y descarte B11 en modales create/edit con `pageActionsLocked` alineado a Clientes.
