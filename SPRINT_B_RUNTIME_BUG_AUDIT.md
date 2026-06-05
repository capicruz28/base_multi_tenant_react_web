# Sprint B — Auditoría de regresiones runtime (QA manual)

**Fecha:** 31 mayo 2026  
**Estado:** Análisis completado — **sin implementación**  
**Alcance:** Bloqueantes reportados en QA de `UserManagementPage` (Sprint B)  
**Referencias:** `IAM_UX_FOUNDATION_IMPLEMENTATION_PLAN.md`, `docs/backend_openapi.json`, diff git vs `HEAD`

---

## Resumen ejecutivo

| # | Síntoma | Severidad | ¿Regresión introducida por Sprint B? | Conclusión |
|---|---------|-----------|--------------------------------------|------------|
| 1 | POST `/usuarios/` → 422 `body.cliente_id: Field required` | **Bloqueante** | **No en el payload** (idéntico a pre-Sprint B) | Gap de contrato **preexistente**; Sprint B lo **expuso** al re-testear crear usuario |
| 2 | PUT `/usuarios/{id}` → 500 | **Bloqueante** | **No detectada en código** (payload idéntico) | Requiere evidencia de red; probable **backend** o dato específico |
| 3 | Dialog se cierra al click externo / Escape | **Bloqueante UX** | **Sí** | Migración a Radix `Dialog` sin guardas de cierre |

---

## Metodología

1. Lectura del código actual (`UserManagementPage`, dialogs IAM, servicios, tipos).
2. Comparación con versión pre-Sprint B: `git show HEAD:src/features/admin/pages/UserManagementPage.tsx`.
3. Contrato backend: `docs/backend_openapi.json` → schemas `UsuarioCreate`, `UsuarioUpdate`.
4. Patrón de referencia en el mismo módulo admin: `AreaManagementPage.tsx` (inyección de `cliente_id` desde auth).

**Limitación:** No hay captura HAR/DevTools adjunta del entorno QA. Las secciones 2 y evidencia de red indican qué falta capturar.

---

## Bloqueante 1 — Crear usuario (422 `cliente_id`)

### Síntoma QA

```
POST /api/v1/usuarios/
HTTP 422 Unprocessable Entity
body.cliente_id: Field required
```

### Payload enviado actualmente (Sprint B)

Construido en `handleCreateUserSubmit` → `createUser(dataToSend)` → `api.post('/usuarios/', userData)`.

```json
{
  "nombre_usuario": "<trimmed string, min 3 en validación FE>",
  "correo": "<trimmed string>",
  "contrasena": "<string, min 8 en validación FE>",
  "nombre": "<trimmed string | omitido si vacío>",
  "apellido": "<trimmed string | omitido si vacío>"
}
```

**Campos ausentes respecto al contrato:** `cliente_id` (y opcionales no usados: `es_activo`, `dni`, `telefono`, etc.).

**Código fuente:**

```220:226:src/features/admin/pages/UserManagementPage.tsx
      const dataToSend: UserFormData = {
        nombre_usuario: newUserFormData.nombre_usuario.trim(),
        correo: newUserFormData.correo.trim(),
        contrasena: newUserFormData.contrasena,
        nombre: newUserFormData.nombre?.trim() || undefined,
        apellido: newUserFormData.apellido?.trim() || undefined,
      };
```

**Tipo FE (`UserFormData`)** — no incluye `cliente_id`:

```37:44:src/features/admin/types/usuario.types.ts
  export interface UserFormData {
      nombre_usuario: string;
      correo: string;
      nombre?: string;
      apellido?: string;
      contrasena?: string; // Solo para creación
      es_activo?: boolean;
  }
```

### Payload esperado por el backend (OpenAPI)

Schema `UsuarioCreate` en `POST /api/v1/usuarios/`:

| Campo | Requerido | Tipo | Notas |
|-------|-----------|------|-------|
| `cliente_id` | **Sí** | UUID | Tenant al que pertenece el usuario |
| `nombre_usuario` | **Sí** | string (3–100) | |
| `contrasena` | **Sí** | string (8–100) | Reglas de complejidad en backend |
| `correo` | No | string \| null | FE lo envía siempre |
| `nombre`, `apellido` | No | string \| null | |
| `es_activo` | No | boolean (default true) | |

Ejemplo mínimo válido:

```json
{
  "cliente_id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre_usuario": "juan_perez",
  "contrasena": "MiContraseñaSegura123"
}
```

### Payload anterior (pre-Sprint B)

Diff git (`HEAD` vs working tree) en `dataToSend`: **sin cambios estructurales**. La versión commiteada enviaba exactamente los mismos campos, sin `cliente_id`:

```typescript
const dataToSend: UserFormData = {
  nombre_usuario: newUserFormData.nombre_usuario.trim(),
  correo: newUserFormData.correo.trim(),
  contrasena: newUserFormData.contrasena,
  nombre: newUserFormData.nombre?.trim() || undefined,
  apellido: newUserFormData.apellido?.trim() || undefined,
};
```

### ¿Qué cambio de Sprint B provocó la omisión de `cliente_id`?

**Ningún cambio de Sprint B eliminó `cliente_id`.** El campo **nunca estuvo** en `UserManagementPage` ni en `UserFormData`.

| Factor | Detalle |
|--------|---------|
| Objetivo Sprint B | “Mantener exactamente los mismos payloads” → se preservó un payload ya incompleto |
| Refactor UI | Modales, validaciones y mensajes cambiaron; **la construcción de `dataToSend` no añadió ni quitó campos** |
| Tipo desalineado | `UserWithRoles` documenta `cliente_id` en lectura, pero `UserFormData` no lo incluye en escritura |
| Patrón existente ignorado | `AreaManagementPage` **sí** inyecta `cliente_id` desde auth al crear |

Referencia del patrón correcto (mismo dominio admin, sin tocar AuthContext):

```131:143:src/features/admin/pages/AreaManagementPage.tsx
    if (!clienteInfo?.cliente_id) {
      toast.error('No se pudo obtener el ID del cliente.');
      return;
    }
    // ...
      const dataToSend: AreaCreateData = {
        cliente_id: clienteInfo.cliente_id,
        nombre: newAreaFormData.nombre.trim(),
        // ...
      };
```

### Interpretación del 422

- Es una respuesta de **validación Pydantic** (422), no un error de auth (401/403).
- El backend exige `cliente_id` en el **body** según OpenAPI vigente en el repo.
- Si en el pasado “crear usuario” funcionó en algún entorno, hipótesis posibles (requieren confirmación backend/ops):
  1. Usuarios creados por otro flujo (super-admin, seeds, scripts).
  2. Versión anterior del API infería tenant desde JWT y dejó de hacerlo.
  3. El flujo tenant admin **nunca fue probado de punta a punta** hasta Sprint B.

### Propuesta de corrección (sin implementar)

**Objetivo:** Cumplir `UsuarioCreate` sin cambiar APIs ni contratos.

1. **En submit de creación** (solo `UserManagementPage`, sin modificar `usuario.service.ts`):
   - Obtener tenant id desde sesión: `useAuth().clienteInfo?.cliente_id` o fallback `auth.user?.cliente_id`.
   - Guard clause: si falta → toast “No se pudo obtener el tenant” y **no** llamar API.
   - Añadir al payload: `cliente_id: <uuid>`.

2. **Tipo `UserFormData`** (opcional pero recomendado):
   - Añadir `cliente_id?: string` **solo para el objeto enviado al servicio**, no como campo de formulario visible.

3. **Payload resultante esperado:**

```json
{
  "cliente_id": "<uuid del tenant en sesión>",
  "nombre_usuario": "...",
  "correo": "...",
  "contrasena": "...",
  "nombre": "...",
  "apellido": "..."
}
```

4. **Restricciones respetadas:** Sin cambios en AuthContext, PermissionGuard, servicios API, multiempresa avanzada.

5. **Validación post-fix:** POST debe retornar 200/201; asignación de roles posterior sin cambios.

---

## Bloqueante 2 — Editar usuario (500)

### Síntoma QA

```
PUT /api/v1/usuarios/{usuario_id}/
HTTP 500 Internal Server Error
```

### Payload enviado actualmente (Sprint B)

```json
{
  "correo": "<trimmed string>",
  "nombre": "<trimmed string | null si vacío>",
  "apellido": "<trimmed string | null si vacío>",
  "es_activo": true
}
```

**Código fuente:**

```318:324:src/features/admin/pages/UserManagementPage.tsx
      const dataToUpdate: UserUpdateData = {
        correo: editFormData.correo.trim(),
        nombre: editFormData.nombre?.trim() || null,
        apellido: editFormData.apellido?.trim() || null,
        es_activo: editFormData.es_activo,
      };
      await updateUser(userId, dataToUpdate);
```

**Servicio:** `api.put(\`/usuarios/${userId}/\`, userData)` — sin transformación intermedia.

### Payload anterior (pre-Sprint B)

**Idéntico** en estructura y semántica (confirmado por diff git):

```typescript
const dataToUpdate: UserUpdateData = {
  correo: editFormData.correo.trim(),
  nombre: editFormData.nombre?.trim() || null,
  apellido: editFormData.apellido?.trim() || null,
  es_activo: editFormData.es_activo,
};
await updateUser(userId, dataToUpdate);
```

### Diferencia exacta Sprint B vs anterior

| Aspecto | Pre-Sprint B | Sprint B | ¿Impacto en PUT? |
|---------|--------------|----------|------------------|
| Campos del body | correo, nombre, apellido, es_activo | Igual | No |
| Valores null vs undefined | `null` para nombre/apellido vacíos | Igual | No |
| Control `es_activo` | `<input type="checkbox">` + handler con `.checked` | Radix `Checkbox` + `handleEditActiveChange(boolean)` | No (mismo boolean en state) |
| Orden post-PUT | updateUser → roles add/remove | Igual | No |
| Endpoint / método | PUT `/usuarios/{id}/` | Igual | No |

**Conclusión de diff:** No hay diferencia de payload atribuible al refactor Sprint B.

### Contrato backend (OpenAPI)

Schema `UsuarioUpdate` — **todos los campos opcionales**; no hay `required`.

Documentación del schema: *“actualización parcial (PATCH)”* aunque el endpoint expuesto es **PUT**.

Respuestas documentadas: **200**, **422**. **500 no está documentado** → excepción no controlada en servidor.

### ¿Frontend o backend?

| Indicador | Interpretación |
|-----------|----------------|
| HTTP 500 | Típico de **error interno del servidor** (excepción no capturada, SQL, etc.) |
| 422 sería validación | FE enviaría campos inválidos → no es el caso reportado |
| Payload sin cambios vs HEAD | **No soporta** atribución a Sprint B en capa FE |
| OpenAPI sin 500 | Bug o condición de datos en **backend** hasta demostrar lo contrario |

**Veredicto provisional:** **Probable backend** (o interacción backend + dato concreto del usuario editado). El refactor Sprint B **no alteró** el body del PUT.

### Evidencia requerida (pendiente de QA / DevTools)

Para cerrar el bloqueante hace falta capturar en Network:

**Request esperado:**
```
PUT /api/v1/usuarios/{uuid}/
Authorization: Bearer <token>
Content-Type: application/json

{ "correo": "...", "nombre": "...", "apellido": "...", "es_activo": true }
```

**Response a documentar:**
- Status: 500
- Body (`detail`, stack trace si FastAPI debug, `Internal Server Error`)
- Headers (`x-request-id` si existe)
- `usuario_id` probado
- Si el error ocurre **solo** al cambiar roles, **solo** al cambiar correo, o en cualquier guardado

**Plantilla de evidencia:**

| Campo | Valor |
|-------|-------|
| usuario_id | |
| Request body (JSON) | |
| Response status | |
| Response body | |
| ¿Cambió correo? | |
| ¿Cambió es_activo? | |
| ¿Cambió roles? | |
| Usuario creado en tenant vía UI o seed | |

### Hipótesis backend (para equipo API, no implementadas)

1. Excepción al persistir `nombre`/`apellido` `null` (constraint, trigger).
2. Unicidad de `correo` dentro del tenant → debería ser 409/422, pero handlers rotos pueden devolver 500.
3. Regresión en endpoint PUT reciente (migración, soft-delete, auditoría).
4. Confusión QA: 500 en **asignación de roles** (`POST/DELETE .../roles/...`) reportado como PUT — verificar URL exacta en Network.

### Acciones FE recomendadas (post-evidencia)

- Si el body confirma payload correcto y 500 persiste → **ticket backend** (no parche FE).
- Si el 500 ocurre solo con `nombre: null` / `apellido: null` → probar **omitir claves** en lugar de enviar `null` (cambio mínimo, alineado a PATCH parcial).
- Mejorar logging en catch: `console.error` con `err.response?.data` (ya parcialmente presente).

---

## Bloqueante 3 — Dialogs (pérdida de trabajo)

### Síntoma QA

En **Crear usuario** y **Editar usuario**:

- Click fuera del modal → cierra y pierde datos.
- Tecla Escape → cierra y pierde datos.
- No hay confirmación de cambios pendientes.

### Causa raíz (regresión Sprint B)

| Pre-Sprint B | Sprint B |
|--------------|----------|
| Modal manual: `{isCreateModalOpen && <div fixed ...>}` | Radix `@radix-ui/react-dialog` |
| Overlay **sin** `onClick` para cerrar | Comportamiento **por defecto** Radix: cierra en overlay click |
| Escape **no** manejado → no cerraba | Radix cierra en **Escape** por defecto |
| Cierre solo vía botón Cancelar o éxito | `onOpenChange` en `UserCreateDialog` / `UserEditDialog` propaga cierre |

**Código actual:**

```55:55:src/features/admin/components/iam/UserCreateDialog.tsx
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
```

`DialogContent` no define `onInteractOutside` ni `onEscapeKeyDown`:

```36:42:src/shared/components/ui/dialog.tsx
    <DialogPrimitive.Content
      ref={ref}
      className={cn(/* ... */)}
      {...props}
    >
```

El botón X integrado en `DialogContent` también dispara cierre vía Radix Close.

**Conclusión:** Regresión UX **introducida por Sprint B** al migrar a Dialog sin política de cierre seguro.

### Comportamiento deseado (requisitos QA)

1. **No cerrar** por click en overlay (outside).
2. **No cerrar** por Escape si hay cambios sin guardar.
3. **Confirmación** si el usuario intenta cerrar (X, Cancelar, Escape con dirty state) con cambios pendientes.

### Propuesta de corrección (sin implementar)

**A. Bloqueo de cierre accidental (mínimo)**

En `UserCreateDialog` / `UserEditDialog`, en `DialogContent`:

```tsx
<DialogContent
  onInteractOutside={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
  // Escape: condicional según dirty (ver B)
>
```

**B. Estado “dirty” (padre o dialog)**

| Dialog | Condiciones dirty |
|--------|-------------------|
| Crear | Cualquier campo ≠ inicial **o** `selectedRoleIds.length > 0` |
| Editar | Diff vs snapshot al abrir (form + roles + es_activo) |

**C. Escape y onOpenChange unificados**

```tsx
const handleRequestClose = () => {
  if (isSubmitting) return;
  if (isDirty) {
    setShowDiscardConfirm(true);
    return;
  }
  onOpenChange(false);
};
```

- Escape: `onEscapeKeyDown={(e) => { if (isDirty) e.preventDefault(); else handleRequestClose(); }}`
- Botón Cancelar / X: llamar `handleRequestClose` en lugar de cerrar directo.

**D. Confirmación**

Reutilizar `ConfirmDialog` existente:

- Título: “Descartar cambios”
- Mensaje: “Hay cambios sin guardar. ¿Desea cerrar sin guardar?”
- Confirmar → cerrar y resetear formulario.

**E. Alcance de cambios**

- Archivos: `UserCreateDialog.tsx`, `UserEditDialog.tsx`, posiblemente `UserManagementPage.tsx` (snapshots / callbacks).
- **No** modificar `dialog.tsx` global (evitar efecto en otros módulos).

---

## Matriz de regresiones vs Sprint B

| Hallazgo | Introducido por Sprint B | Acción prioritaria |
|----------|--------------------------|-------------------|
| Falta `cliente_id` en POST | No (preexistente) | Inyectar desde auth en submit |
| PUT 500 | No evidenciado en diff | Capturar red; ticket backend si aplica |
| Cierre dialog overlay/Escape | **Sí** | Guardas Radix + dirty + ConfirmDialog |

---

## Riesgos adicionales detectados en análisis

1. **Contraseña generada:** cumple longitud FE (8+) pero OpenAPI exige mayúscula, minúscula y número — posible 422 posterior a fix de `cliente_id` si backend valida estrictamente.
2. **Mensaje Sprint B “mismos payloads”:** correcto vs git, pero **incorrecto vs OpenAPI** para creación.
3. **Edit 500 sin HAR:** riesgo de parchear FE innecesariamente; priorizar evidencia.
4. **Botón X del Dialog:** también debe pasar por flujo de confirmación dirty.

---

## Checklist pre-reaprobación Sprint B

- [ ] POST crear usuario con `cliente_id` → 200
- [ ] PUT editar sin cambios → 200
- [ ] PUT editar cambiando correo/nombre/activo → 200
- [ ] Asignación/revocación roles post-edit → 200
- [ ] Click fuera del dialog → **no cierra**
- [ ] Escape con form dirty → **no cierra**; con confirmación si se fuerza cierre
- [ ] Cancelar/X con dirty → ConfirmDialog
- [ ] Evidencia HAR adjunta para cualquier 500 residual

---

## Archivos analizados

| Archivo | Rol en auditoría |
|---------|------------------|
| `src/features/admin/pages/UserManagementPage.tsx` | Payloads create/update |
| `src/features/admin/types/usuario.types.ts` | Tipos FE vs backend |
| `src/features/admin/services/usuario.service.ts` | Transporte HTTP |
| `src/features/admin/components/iam/UserCreateDialog.tsx` | Comportamiento Dialog crear |
| `src/features/admin/components/iam/UserEditDialog.tsx` | Comportamiento Dialog editar |
| `src/shared/components/ui/dialog.tsx` | Defaults Radix |
| `src/features/admin/pages/AreaManagementPage.tsx` | Patrón `cliente_id` |
| `docs/backend_openapi.json` | Contrato `UsuarioCreate` / `UsuarioUpdate` |

---

*Documento generado para decisión de fix antes de re-validar Sprint B. Sin commit asociado.*
