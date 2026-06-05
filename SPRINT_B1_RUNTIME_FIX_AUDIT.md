# Sprint B.1 — Auditoría runtime post-QA (fix pendiente)

**Fecha:** 31 mayo 2026  
**Estado:** Análisis completado — **sin implementación**  
**Referencias:** `SPRINT_B_RUNTIME_BUG_AUDIT.md`, QA Sprint B.1 parcial  
**Restricciones:** Solo frontend; sin cambios backend; sin commit

---

## Resumen ejecutivo

| Ítem | QA | Conclusión auditoría |
|------|-----|----------------------|
| Crear USER_TENANT / MANAGER_TENANT | OK | Fix `cliente_id` validado |
| Dialog: click externo / Escape | OK | Guardas Radix correctas |
| Validación nombre/contraseña backend | Observación | No bug FE; sin acción P0 |
| **P0: overlay negro tras ConfirmDialog discard** | **Falla** | **Bug FE introducido en B.1** — conflicto Radix Dialog + `ConfirmDialog` anidado |
| **Editar usuario 500** | **Falla** | Instrumentación lista; **evidencia de consola pendiente de pegado por QA** — ver §4 |

---

## 1. QA validado (sin acción inmediata)

### 1.1 Creación de usuarios

- `cliente_id` inyectado desde sesión → POST exitoso (USER_TENANT, MANAGER_TENANT).
- Payload alineado con `UsuarioCreate` (OpenAPI).

### 1.2 Protección Dialog (Sprint B.1)

- `onInteractOutside` / `onPointerDownOutside` → click externo bloqueado.
- `onEscapeKeyDown` → Escape bloqueado.

### 1.3 Validaciones backend al crear (no bug)

| Regla backend | Comportamiento | Acción |
|---------------|----------------|--------|
| Nombre sin números | 422 esperado | Documentar en ayuda FE (P2) |
| Contraseña con mayúscula | 422 esperado | `generateSecurePassword` puede no cumplir siempre (P2) |

No requiere corrección inmediata para reaprobación del P0 de overlay.

---

## 2. P0 — Overlay negro / usuario atrapado (ConfirmDialog + Dialog)

### 2.1 Síntoma reproducido

1. Abrir **Crear** o **Editar** usuario.
2. Modificar cualquier campo (formulario dirty).
3. Click **Cancelar** (o X del Dialog Radix).
4. Aparece `ConfirmDialog` (“Descartar cambios”).
5. **Confirmar descartar** o **Seguir editando** (o interactuar con el diálogo).
6. Pantalla queda con **overlay negro**; UI no responde. Solo **F5** recupera.

### 2.2 Arquitectura actual (dos sistemas de modal superpuestos)

```
UserCreateDialog / UserEditDialog
├── <Dialog open={open}>                    ← Radix (@radix-ui/react-dialog)
│   ├── Portal → document.body
│   │   ├── DialogOverlay   z-50  bg-black/80   ← bloquea página + scroll lock
│   │   └── DialogContent   z-50  focus trap
│   └── open sigue en TRUE mientras ConfirmDialog está visible
│
└── <ConfirmDialog isOpen={discardConfirmOpen}>   ← componente custom (NO Radix)
    └── <div fixed inset-0 z-50 bg-black/50>      ← segundo overlay, mismo z-index
```

| Capa | Componente | Portal | z-index | Body scroll lock | Focus trap |
|------|------------|--------|---------|------------------|------------|
| A | Radix `DialogOverlay` | Sí (body) | 50 | Sí (Radix / RemoveScroll) | Sí |
| B | `ConfirmDialog` overlay | **No** (árbol React del padre) | 50 | **No gestiona** | **No** |

**Problema estructural:** Se apilan **dos overlays** con el **Radix Dialog aún `open={true}`** mientras `ConfirmDialog` está abierto. El segundo modal no participa del ciclo de vida de Radix (focus scope, `pointer-events` en `body`, `inert`, desmontaje del portal).

### 2.3 Flujo de estado que dispara el bug

**Cancelar con dirty** (`UserCreateDialog.tsx` / `UserEditDialog.tsx`):

```ts
requestClose() → setDiscardConfirmOpen(true)   // Radix open NO cambia
```

**Confirmar descartar** (`handleConfirmDiscard`):

```ts
setDiscardConfirmOpen(false);   // 1. Quita ConfirmDialog
onOpenChange(false);            // 2. Padre cierra Radix
```

**Padre** (`UserManagementPage.tsx`):

```ts
// Crear
onOpenChange={(open) => (open ? setIsCreateModalOpen(true) : handleCloseCreateModal())}

// Editar — peor caso
{editingUser ? <UserEditDialog ... /> : null}
handleCloseEditModal() → setEditingUser(null)  // DESMONTA todo el subárbol
```

### 2.4 Causas raíz identificadas (orden de impacto)

#### Causa A — Desmontaje abrupto en **Editar** (alta probabilidad)

Al confirmar descarte en edición:

1. `onOpenChange(false)` → `handleCloseEditModal()`.
2. `setEditingUser(null)` → **`UserEditDialog` se desmonta de inmediato** (condicional `{editingUser ? ...}`).
3. El `Dialog` Radix dentro pierde el ciclo de cierre animado (`data-state=closed`) y la limpieza del portal.
4. Puede quedar en `document.body`:
   - `[data-radix-dialog-overlay]` huérfano, o
   - `body { overflow: hidden; pointer-events: none }` sin restaurar.

**Evidencia en código:**

```717:735:src/features/admin/pages/UserManagementPage.tsx
      {editingUser ? (
        <UserEditDialog
          open={isEditModalOpen}
          onOpenChange={(open) => (open ? setIsEditModalOpen(true) : handleCloseEditModal())}
          ...
        />
      ) : null}
```

```332:340:src/features/admin/pages/UserManagementPage.tsx
  const handleCloseEditModal = () => {
    if (!isSubmittingEdit) {
      setIsEditModalOpen(false);
      setEditingUser(null);   // ← unmount inmediato del Dialog + ConfirmDialog
      ...
    }
  };
```

#### Causa B — Focus trap / body lock de Radix con modal hijo no-Radix (alta probabilidad)

Mientras `ConfirmDialog` está abierto:

- El foco se mueve a botones del `ConfirmDialog` **fuera** del `FocusScope` de Radix.
- Radix sigue considerando el Dialog “abierto” y mantiene bloqueo de scroll/pointer-events.
- Al cerrar ambos en el **mismo tick** de React, la librería puede **no ejecutar** el teardown de `RemoveScroll` / restauración de foco.

Afecta **Crear** y **Editar** (en Crear el componente no se desmonta, pero el body lock puede quedar igual).

#### Causa C — Overlays duplicados mismo `z-50` (media)

- Radix overlay: `bg-black/80`
- ConfirmDialog: `bg-black/50` (`ConfirmDialog.tsx` línea 62)

Al quitar `ConfirmDialog`, puede persistir el overlay Radix invisible pero interceptando eventos (`pointer-events: auto` en overlay con contenido ya cerrado).

#### Causa D — `ConfirmDialog` no usa Portal (media)

Otros usos en el repo (INV, catálogos) montan `ConfirmDialog` a **nivel página**, sin Radix Dialog debajo. En IAM es el **único** patrón que anida confirmación custom **encima** de Radix Dialog.

### 2.5 Por qué afecta “Confirmar” y “Seguir editando”

| Acción | Qué ocurre | Riesgo overlay |
|--------|------------|----------------|
| **Sí, descartar** | Cierra confirm + Radix + (en edit) unmount completo | **Alto** — doble cierre + unmount |
| **Seguir editando** | Solo `setDiscardConfirmOpen(false)` | **Medio** — Radix sigue abierto; body lock puede quedar corrupto tras haber abierto segundo modal |
| **X del ConfirmDialog** | `onClose` → `setDiscardConfirmOpen(false)` | **Medio** — mismo que Seguir editando |

El síntoma “overlay negro con página bloqueada” coincide con **`pointer-events: none` en `body`** o **overlay Radix huérfano**, no con `ConfirmDialog` visible (este hace `return null` cuando `isOpen=false`).

### 2.6 Verificación en DevTools (protocolo para QA/desarrollo)

Tras reproducir el bug **sin F5**, en Elements/Console:

| Check | Esperado sano | Estado bug |
|-------|---------------|------------|
| `document.body.style.overflow` | `""` o visible | `hidden` |
| `document.body.style.pointerEvents` | `""` | `none` |
| Nodos `[data-radix-dialog-overlay]` | 0 | ≥ 1 |
| `data-state` del overlay | — | `open` o `closed` sin remover del DOM |
| Overlays `fixed.inset-0` | 0–1 | > 1 o 1 invisible bloqueando |

### 2.7 Propuestas de corrección (B.1.1 — no implementadas)

**Opción 1 — Recomendada: confirmación a nivel página (sin anidar)**

- Mover `discardConfirmOpen` + `ConfirmDialog` a `UserManagementPage`.
- Hijos llaman `onRequestClose()` → padre abre confirm.
- Al confirmar: **primero** `setIsCreateModalOpen(false)` / cerrar edit **sin** `setEditingUser(null)` hasta `onOpenChange`/`setTimeout(0)` o callback post-cierre.
- **Editar:** retrasar `setEditingUser(null)` hasta que Radix haya cerrado (ej. 300 ms o `onAnimationEnd`).

**Opción 2 — Radix `AlertDialog`**

- Sustituir `ConfirmDialog` anidado por `@radix-ui/react-alert-dialog` dentro del mismo stack Radix, o como hermano con z-index coordinado.

**Opción 3 — Cierre ordenado (mínimo)**

```ts
// Pseudocódigo
const handleConfirmDiscard = () => {
  setDiscardConfirmOpen(false);
  requestAnimationFrame(() => {
    onOpenChange(false);
  });
};
```

+ en padre edit: no hacer `setEditingUser(null)` en el mismo frame que `setIsEditModalOpen(false)`.

**Opción 4 — `modal={false}` en Dialog mientras confirm está abierto**

- Reducir conflicto de body lock; requiere estado `confirmOpen` elevado al padre.

**No recomendado:** `window.confirm` (rompe UX IAM); modificar `ConfirmDialog` global sin revisar blast radius.

### 2.8 Clasificación

| | |
|---|---|
| **Tipo** | Regresión FE Sprint B.1 |
| **Severidad** | P0 — bloquea administración de usuarios tras un cancel |
| **Componentes** | `UserCreateDialog`, `UserEditDialog`, `ConfirmDialog`, `dialog.tsx` (Radix), `UserManagementPage` |

---

## 3. Instrumentación UPDATE_USER (estado actual)

### 3.1 Implementación existente

Archivo: `src/features/admin/utils/iam-user-operation-log.ts`  
Punto de llamada: `handleEditUserSubmit` en `UserManagementPage.tsx`.

En **error** del PUT:

```ts
logIamUserOperation({
  operation: 'UPDATE_USER',
  usuario_id: userId,
  requestBody: dataToUpdate,
  statusCode: evidence.statusCode,
  responseBody: evidence.responseBody,
});
```

En **éxito** (limitación menor): `statusCode: 200` y `responseBody: { success: true }` — no es el body real del API; **suficiente para distinguir fallo PUT** (el 500 cae en rama `catch` con body real).

### 3.2 Protocolo de captura para QA

1. Abrir DevTools → pestaña **Console** (nivel Info visible).
2. Filtrar por: `IAM UserManagement`
3. Editar un usuario existente → cambiar un campo → **Guardar cambios**.
4. Expandir el grupo: **`[IAM UserManagement] UPDATE_USER`**
5. Copiar **completo** y pegar en ticket:

```
operación: UPDATE_USER
usuario_id: <uuid>
statusCode: <number>
requestBody: <objeto>
responseBody: <objeto o string>
timestamp: <ISO>
```

6. En **Network**, verificar que el log corresponde a:
   - `PUT /api/v1/usuarios/{usuario_id}/`
   - No confundir con `POST .../roles/` ni `DELETE .../roles/`

Si hay 500 en roles pero PUT OK, aparecerán grupos `ASSIGN_ROLE` o `REVOKE_ROLE` con `statusCode: 500`, no `UPDATE_USER`.

### 3.3 Plantilla de evidencia (completar en QA)

```markdown
### Evidencia UPDATE_USER — [fecha]

**Entorno:** [local/staging]
**Usuario editado (login):** [nombre_usuario]
**Operación:** Guardar cambios (sin cambio roles / con cambio roles)

#### Console — [IAM UserManagement] UPDATE_USER
- usuario_id:
- statusCode:
- requestBody:
- responseBody:
- timestamp:

#### Network — PUT /usuarios/{id}/
- URL completa:
- Request payload (raw):
- Response status:
- Response body (raw):

#### ¿Hubo ASSIGN_ROLE / REVOKE_ROLE después?
- [ ] No hubo más requests
- [ ] Sí — pegar status de cada uno
```

### 3.4 Ejemplo de log esperado si el 500 es del PUT (hipótesis QA)

> **Nota:** Valores ilustrativos; reemplazar con captura real.

```
▼ [IAM UserManagement] UPDATE_USER
  operación: UPDATE_USER
  usuario_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  statusCode: 500
  requestBody: {
    correo: "manager@tenant.com",
    nombre: "Juan",
    apellido: "Pérez",
    es_activo: true
  }
  responseBody: {
    detail: "Internal Server Error"
  }
  timestamp: 2026-05-31T18:45:00.123Z
```

**Interpretación:** Request FE válido según `UsuarioUpdate` (OpenAPI); 500 sin `detail` estructurado → **backend issue** en endpoint PUT.

### 3.5 Ejemplo si el PUT OK y falla asignación de roles

```
▼ [IAM UserManagement] UPDATE_USER
  statusCode: 200
  ...

▼ [IAM UserManagement] ASSIGN_ROLE
  statusCode: 500
  requestBody: { rol_id: "..." }
```

**Interpretación:** Edición de datos OK; fallo en **rol**, no en UPDATE_USER.

### 3.6 Conclusión técnica UPDATE_USER (pendiente evidencia pegada)

| Escenario | Conclusión |
|-----------|------------|
| Log `UPDATE_USER` + `statusCode: 500` + PUT en Network 500 | **Backend issue** en `PUT /usuarios/{id}/` |
| Log `UPDATE_USER` + `200` y otro grupo con 500 | **Backend issue** en roles (o contrato rol) |
| Log no aparece; Network 500 sin console | Revisar filtros consola / error previo a axios |
| QA reporta 500 pero no adjunta log | **Pendiente de evidencia** — no cerrar como backend sin pegar |

**Estado actual según QA:** “Sigue respondiendo 500” → se mantiene **pendiente de evidencia formal** hasta pegar el bloque `UPDATE_USER` completo. Por análisis de código B.1, el **payload PUT no cambió** respecto a Sprint B (misma forma: `correo`, `nombre`, `apellido`, `es_activo`).

---

## 4. Matriz de reaprobación Sprint B

| Criterio | Estado |
|----------|--------|
| Crear usuario con `cliente_id` | ✅ QA OK |
| Dialog click externo / Escape | ✅ QA OK |
| Cancelar con dirty sin trap overlay | ❌ P0 abierto |
| Editar usuario sin 500 | ❌ + evidencia consola pendiente |
| Sin commit / sin Sprint C | ✅ |

---

## 5. Plan de trabajo sugerido (B.1.1)

| Prioridad | Tarea | Archivos probables |
|-----------|-------|-------------------|
| P0 | Corregir stack modal discard (orden cierre + no unmount edit prematuro) | `UserManagementPage`, `UserCreateDialog`, `UserEditDialog` |
| P0 | QA pegar log `UPDATE_USER` completo | — |
| P1 | Tras log: ticket backend si PUT 500 confirmado | Repo backend separado |
| P2 | Mensajes ayuda validación nombre/contraseña | `UserCreateDialog` |

---

## 6. Archivos analizados

| Archivo | Rol |
|---------|-----|
| `src/features/admin/components/iam/UserCreateDialog.tsx` | Radix + ConfirmDialog anidado |
| `src/features/admin/components/iam/UserEditDialog.tsx` | Idem |
| `src/features/admin/pages/UserManagementPage.tsx` | Unmount edit, handlers `onOpenChange` |
| `src/shared/components/ui/ConfirmDialog.tsx` | Overlay custom z-50 |
| `src/shared/components/ui/dialog.tsx` | Radix portal + overlay |
| `src/features/admin/utils/iam-user-operation-log.ts` | Instrumentación UPDATE_USER |

---

*Documento para decisión de implementación B.1.1. Sin commit. No iniciar Sprint C.*
