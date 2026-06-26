# Auditoría Frontend — Reset administrativo de contraseña

**Documento:** `docs/arquitectura/ADMIN_PASSWORD_RESET_FRONTEND_AUDIT.md`  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — sin cambios de código (salvo este informe)  
**Alcance:** Estado actual del Frontend para **reset administrativo de contraseña** desde **Gestión de Usuarios** (`/admin/usuarios`)  
**Contexto:** Flujos auth ya implementados (login, force-password, cambio voluntario Mi Cuenta, logout, logout all)

**Referencias cruzadas (solo lectura):**
- `docs/arquitectura/FRONTEND_AUTH_AUDIT.md` — auth self-service
- `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` — `POST /auth/password/change/` (usuario autenticado)
- `IAM_UX_FOUNDATION_IMPLEMENTATION_PLAN.md` — reset explícitamente **out of scope** FE-1
- `docs/backend_openapi.json` — contrato HTTP commitado en repo

---

## 1. Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe acción «Reset password» en Gestión de Usuarios? | **No** |
| ¿Existe servicio/hook FE para reset administrativo? | **No** |
| ¿Existe ruta dedicada reset/force-password admin? | **No** |
| ¿Existe consumo de endpoint admin reset en FE? | **No** |
| ¿Hay UX parcial o stub? | **No** — solo piezas **adyacentes** (crear usuario con contraseña inicial, revelación credenciales super-admin) |
| ¿El flujo force-password del **usuario afectado** está listo? | **Sí** — `requiresPasswordChange` + `/change-password` |
| ¿Conviene greenfield total? | **No** — reutilización parcial de infraestructura IAM/auth |

**Veredicto:** El Frontend **no implementa** reset administrativo de contraseña. El panel tenant admin (`UserManagementPage`) solo ofrece **Crear**, **Editar**, **Desactivar** y **Reactivar** usuario. No hay botón, menú contextual, acción masiva ni servicio HTTP para reset.

**Brecha de contrato en repo:** El snapshot `docs/backend_openapi.json` **no expone** un endpoint dedicado tipo `POST /usuarios/{id}/reset-password/` (ni variantes con `password`, `reset` o `temporary` en paths de usuarios). Sí documenta campos `requiere_cambio_contrasena` y `proveedor_autenticacion` en `UsuarioReadWithRoles`, coherente con force-password en login del usuario afectado. **Antes de implementar FE** hay que alinear el contrato OpenAPI real del Backend (el contexto del proyecto indica que la funcionalidad BE ya existe).

**Decisión recomendada:** **B) Reutilización parcial** — ver §10 y §11.

---

## 2. Inventario de código existente

### 2.1 Gestión de Usuarios (`src/features/admin/`)

| Artefacto | Rol respecto a reset admin |
|-----------|----------------------------|
| `pages/UserManagementPage.tsx` | Listado Tier B/C; acciones fila: Editar, Desactivar / Reactivar. **Sin reset.** |
| `components/iam/UserCreateDialog.tsx` | Creación con campo `contrasena` — **contraseña inicial**, no reset. |
| `components/iam/PasswordFieldWithGenerate.tsx` | Input + generar + toggle visibilidad — **reutilizable** en reset manual. |
| `utils/generate-secure-password.ts` | Generador client-side — **reutilizable** si BE no genera la temporal. |
| `components/iam/UserEditDialog.tsx` | Edición perfil/roles/estado — **sin** campo contraseña. |
| `services/usuario.service.ts` | CRUD + roles + deactivate/reactivate — **sin** reset password. |
| `types/usuario.types.ts` | `UserFormData.contrasena` solo create; `UserUpdateData` **sin** contraseña. No tipa `requiere_cambio_contrasena` ni `proveedor_autenticacion` (presentes en OpenAPI `UsuarioReadWithRoles`). |
| `hooks/useUsersList.ts` | Listado paginado — sin filtro/acción password. |

### 2.2 Auth / force-password (usuario afectado — no admin)

| Artefacto | Rol |
|-----------|-----|
| `features/auth/pages/ChangePasswordPage.tsx` | Cambio **obligatorio** self-service (`requiresPasswordChange`) |
| `features/account/components/security/AccountChangePasswordForm.tsx` | Cambio **voluntario** Mi Cuenta |
| `features/auth/utils/password-validation.utils.ts` | Reglas 8+/mayúsc/minúsc/número + `isExternalPasswordAuth` |
| `features/auth/services/auth.service.ts` | `changePassword` → `POST /auth/password/change/` (**solo sesión del propio usuario**) |
| `core/auth/provider/auth-provider-public-actions.ts` | `requiresPasswordChange`, `completePasswordChange` |
| `shared/components/ProtectedRoute.tsx` | Redirect global a `/change-password` si `requiresPasswordChange` |
| `shared/components/SmartRedirect.tsx` | Prioridad force-password en `/` |
| `features/auth/pages/Login.tsx` | Redirect post-login si `requires_password_change` |

### 2.3 Patrón «contraseña temporal una sola vez» (super-admin, no tenant admin)

| Artefacto | Rol |
|-----------|-----|
| `features/super-admin/clientes/components/ClientCredentialsRevealModal.tsx` | Modal post-creación tenant: muestra usuario + contraseña temporal, copy, ack obligatorio, `ConfirmDialog` al cerrar sin ack |
| `shared/utils/copy-to-clipboard.ts` | Util copia portapapeles |

### 2.4 Routing

| Ruta | Relación |
|------|----------|
| `/admin/usuarios` | Gestión usuarios tenant — **punto de integración natural** |
| `/change-password` | Force-password **del usuario logueado** — no admin |
| `/app/cuenta/seguridad` | Cambio voluntario propio — no admin |
| **Ninguna** | `reset-password`, `temporary-password`, `force-password` admin |

Registro: `src/features/admin/routes.tsx` → `path: 'usuarios'` bajo `ProtectedRoute requireTenantAdmin`.

### 2.5 Búsqueda exhaustiva de términos (repo `src/`)

| Término | Resultado en FE productivo |
|---------|---------------------------|
| `resetPassword`, `adminResetPassword`, `passwordReset` | **0** usos |
| `forgotPassword`, `recoverPassword` | **0** usos |
| `Reset Password`, `Restablecer contraseña`, `Temporary Password` | **0** en UI admin |
| `reset` en admin | Solo sort presets, auto-refresh, form reset — **no** password |

---

## 3. Componentes reutilizables

Clasificación para implementación futura:

| Componente / util | Origen | Clasificación | Uso en reset admin |
|-------------------|--------|---------------|-------------------|
| `ConfirmDialog` | `shared/components/ui/ConfirmDialog.tsx` | **Reutilización directa** | Confirmar reset destructivo (`variant="warning"` o `danger` según UX) |
| `PasswordFieldWithGenerate` | `admin/components/iam/` | **Reutilización directa** | Si BE acepta contraseña en body (admin la define o genera) |
| `generateSecurePassword` | `admin/utils/` | **Reutilización directa** | Generación client-side |
| `validateNewPasswordRules` | `auth/utils/password-validation.utils.ts` | **Reutilización directa** | Validación si admin ingresa contraseña |
| `validatePasswordChangeForm` | mismo | **No reutilizable** tal cual | Requiere contraseña actual — no aplica admin |
| `isExternalPasswordAuth` | mismo | **Reutilización directa** | Ocultar acción si `proveedor_autenticacion != local` |
| `getErrorMessage` | `core/services/error.service.ts` | **Reutilización directa** | ER-01 |
| `toast` (react-hot-toast) | varios | **Reutilización directa** | Éxito/error en mutación |
| `ClientCredentialsRevealModal` | super-admin | **Requiere refactor menor** | Extraer patrón «reveal once» genérico (`UserPasswordRevealDialog`) |
| `LogoutAllConfirmDialog` | auth | **No reutilizable** | Dominio distinto (cerrar sesiones propias) |
| `ChangePasswordPage` / `AccountChangePasswordForm` | auth / account | **No reutilizable** | Self-service con `completePasswordChange` |
| `InvPageLayout`, `ConfirmDialog` baja/reactivar | UserManagementPage | **Reutilización directa** | Patrón acción fila + confirm ya establecido |

---

## 4. Servicios existentes

### 4.1 `usuario.service.ts` — métodos actuales

| Método | Endpoint | ¿Sirve para reset? |
|--------|----------|-------------------|
| `getUsers` | `GET /usuarios/` | No (listado) |
| `getUserById` | `GET /usuarios/{id}/` | Lectura previa / post-reset |
| `createUser` | `POST /usuarios/` | Solo **creación** con `contrasena` inicial |
| `updateUser` | `PUT /usuarios/{id}/` | **No** — `UsuarioUpdate` OpenAPI sin campo `contrasena` |
| `deactivateUser` / `reactivateUser` | PUT / POST reactivate | No |
| `assignRoleToUser` / `revokeRoleFromUser` | roles | No |

**Estado:** **No existe** `resetPassword`, `adminResetPassword`, ni equivalente.

### 4.2 `auth.service.ts`

| Método | Endpoint | Alcance |
|--------|----------|---------|
| `changePassword` | `POST /auth/password/change/` | **Solo** usuario autenticado (Bearer propio) |

**No reutilizable** para reset administrativo sobre otro `usuario_id`.

### 4.3 Contrato OpenAPI commitado (`docs/backend_openapi.json`)

**Paths `/usuarios/` relevantes:**

- `GET/POST /api/v1/usuarios/`
- `GET/PUT/DELETE /api/v1/usuarios/{usuario_id}/`
- `GET/POST/DELETE /api/v1/usuarios/{usuario_id}/roles/...`

**Ausentes en snapshot:**

- Endpoint dedicado reset/restablecer contraseña administrativa
- `POST /api/v1/usuarios/{usuario_id}/reactivate/` (FE ya lo consume — **desfase OpenAPI** vs `BACKEND_PLATFORM_API_CONTRACT_V2.md`)
- `POST /api/v1/auth/password/change/` (FE lo consume — **desfase OpenAPI**)

**Campos útiles en `UsuarioReadWithRoles` (BE sí los expone):**

- `requiere_cambio_contrasena` — alinea con `requires_password_change` en login/JWT
- `proveedor_autenticacion` — SSO vs local
- `fecha_ultimo_cambio_contrasena`

**Conclusión integración:** Frontend **no consume** reset admin. Contrato en repo **incompleto/desactualizado** respecto a auth y reactivate; el endpoint de reset admin debe **confirmarse en OpenAPI vigente** antes de tipar servicio.

---

## 5. Estado de Gestión de Usuarios

### 5.1 Acciones UI actuales

| Ubicación | Acciones |
|-----------|----------|
| Toolbar | «Crear usuario» |
| Fila activa | Editar (`Edit3`), Desactivar (`Trash2`) |
| Fila inactiva | Reactivar (`RotateCcw`) |
| Masivas | **Ninguna** |
| Dropdown / menú contextual | **Ninguno** |

**No existe:** Reset password, Restablecer contraseña, Force password, Temporary password.

### 5.2 Flujo contraseña en creación (único touchpoint password)

1. `UserCreateDialog` → `PasswordFieldWithGenerate`
2. Admin define o genera contraseña
3. `POST /usuarios/` con `contrasena` + `cliente_id`
4. Toast éxito — **no** modal reveal one-time (contraste con super-admin provisioning)
5. Validación create: solo `length >= 8` — **más laxa** que `validateNewPasswordRules` (duplicación/inconsistencia)

### 5.3 Documentación previa

`IAM_UX_FOUNDATION_IMPLEMENTATION_PLAN.md` §4.2 lista explícitamente **«Invitación por email / reset contraseña»** como **out of scope FE-1**. `TENANT_ADMIN_IAM_UX_AUDIT.md` P1-1: sin reset ni invitación (generador añadido después en create).

### 5.4 Permisos y guards

| Capa | Comportamiento |
|------|----------------|
| `ProtectedRoute requireTenantAdmin` | Acceso a `/admin/*` por `user_type` |
| `PermissionGuard` | **No** envuelve rutas admin IAM |
| RBAC fila | **No** hay `can(modulo, accion)` en `UserManagementPage` |
| OpenAPI `PUT /usuarios/{id}/` | Documenta rol «Administrador» en BE |

No existe permiso FE granular tipo `admin.usuario.reset_password` (los códigos `permisos[]` en OpenAPI son informativos; no se usan para esta acción).

---

## 6. Estado Auth

### 6.1 Qué **sí** reutiliza el ecosistema post-reset (lado usuario afectado)

Cuando el Backend establece contraseña temporal + `requiere_cambio_contrasena=true`:

```
Admin reset (BE) → usuario login → requires_password_change=true
  → Login / SmartRedirect / ProtectedRoute
  → /change-password
  → completePasswordChange (POST /auth/password/change/)
  → requires_password_change=false → ERP
```

Archivos ya operativos: `Login.tsx`, `ProtectedRoute.tsx`, `ChangePasswordPage.tsx`, interceptores 403 `PASSWORD_CHANGE_REQUIRED`, sincronización JWT/`auth.user`.

### 6.2 Qué **no** debe reutilizarse para la acción admin

| API / UI | Motivo |
|----------|--------|
| `completePasswordChange` | Actúa sobre sesión del **operador** admin, no del usuario target |
| `ChangePasswordPage` | UX force-password del **propio** usuario |
| `AccountChangePasswordForm` | Cambio voluntario Mi Cuenta |
| `logoutAllSessions` | Cierra sesiones del operador; no es reset password (salvo efecto colateral BE al resetear target — transparente para FE admin) |

### 6.3 SSO

`isExternalPasswordAuth` + contrato auth `400` SSO — la acción admin debe **ocultarse o deshabilitarse** para usuarios no locales (mismo criterio que Mi Cuenta / auth audit).

---

## 7. Estado UX

| Área | Estado |
|------|--------|
| Acción «Resetear contraseña» en tabla usuarios | **Inexistente** |
| Modal confirmación reset | **Inexistente** |
| Modal reveal contraseña temporal (tenant admin) | **Inexistente** — patrón existe solo en super-admin `ClientCredentialsRevealModal` |
| Badge «Debe cambiar contraseña» en tabla | **Inexistente** (campo BE disponible pero no tipado/mostrado en FE) |
| Empty / error / loading reset | **N/A** |
| Copy seguridad «comparta por canal seguro» | Existe en `PasswordFieldWithGenerate` hint — reutilizable |

---

## 8. Riesgos

| ID | Riesgo | Sev. | Notas |
|----|--------|------|-------|
| R1 | **OpenAPI repo desactualizado** — sin endpoint reset documentado | Alta | Bloquea tipado y certificación API-01 hasta refresh |
| R2 | Implementar reset vía `PUT /usuarios/` con contraseña | Alta | `UsuarioUpdate` OpenAPI **no** incluye `contrasena` — violaría contrato |
| R3 | Reutilizar `completePasswordChange` para admin | Alta | Semántica incorrecta; operaría sobre admin logueado |
| R4 | Validación create vs reset inconsistente | Media | Create: min 8; auth utils: complejidad completa |
| R5 | Tipos FE omiten `requiere_cambio_contrasena` / `proveedor_autenticacion` | Media | Impide guards UI SSO y feedback post-reset |
| R6 | Sin RBAC granular en fila | Media | Cualquier `tenant_admin` en panel podría resetear (si BE lo permite) |
| R7 | Contraseña temporal sin modal «una sola vez» | Alta | Fuga de credenciales si solo toast |
| R8 | `IAM_UX_FOUNDATION` marcó reset out-of-scope | Baja | Deuda conocida; no bloquea si hay mandato producto |

---

## 9. Recomendaciones

1. **Obtener contrato OpenAPI oficial** del endpoint admin reset (path, método, body, response, errores 400 SSO/403) y actualizar snapshot repo antes de código FE.
2. **Implementar como acción de fila** en `UserManagementPage` (usuarios activos, `proveedor_autenticacion=local`), siguiendo patrón Desactivar/Reactivar + `ConfirmDialog`.
3. **Nuevo método** en `usuario.service.ts` (o módulo auth admin si el path es `/auth/admin/...`) — **no** extender `changePassword` self-service.
4. **Revelación one-time:** adaptar patrón `ClientCredentialsRevealModal` (ack + copy + no persistir en estado global).
5. **Reutilizar** `validateNewPasswordRules` / `PasswordFieldWithGenerate` si el contrato permite contraseña admin-definida; si BE genera temporal, solo reveal.
6. **Tipar** `requiere_cambio_contrasena` y `proveedor_autenticacion` en `UserWithRoles` para UI condicional.
7. **No** crear ruta dedicada salvo que el flujo lo exija — acción modal inline es suficiente (alineado IAM UX).
8. **Toast error** solo en `onError` del hook mutación (ER-02); confirmación éxito + modal reveal.
9. **Extender tests** `usuario.service` + componente confirm/reveal cuando exista implementación.
10. **No reutilizar** `ChangePasswordPage` ni `LogoutAllConfirmDialog` para el flujo admin.

---

## 10. Arquitectura recomendada

### 10.1 Flujo propuesto (conceptual — no es diseño UX)

```
UserManagementPage
  → acción fila «Restablecer contraseña» (solo activo + local)
  → ConfirmDialog (warning/danger)
  → useMutation → adminResetPassword(usuario_id, payload?)
  → 200 con contraseña temporal (si BE la devuelve)
  → UserPasswordRevealModal (patrón ClientCredentialsRevealModal)
  → invalidateUsersListQueries

Usuario afectado (sin cambios FE auth):
  → login con temporal → requiresPasswordChange → /change-password
```

### 10.2 Respuestas explícitas

| Pregunta | Respuesta |
|----------|-----------|
| ¿Reutilizar **completamente** el flujo Change Password obligatorio? | **No** para la acción admin. **Sí** para el **usuario afectado** tras el reset (mismo `requiresPasswordChange` / `/change-password` / `completePasswordChange`). |
| ¿Reutilizar **ConfirmDialog**? | **Sí** — confirmación previa al reset. |
| ¿Reutilizar **Logout All**? | **No** — dominio distinto. Si BE revoca sesiones del usuario al resetear, es efecto servidor; no invocar `logoutAllSessions` desde Gestión de Usuarios. |
| ¿Implementar como acción en Gestión de Usuarios? | **Sí** — acción por fila en `UserManagementPage` (icono + `sr-only`), coherente con Editar/Desactivar. |
| ¿Mostrar contraseña temporal **una sola vez**? | **Sí** — obligatorio si BE devuelve plaintext temporal; patrón `ClientCredentialsRevealModal`. |
| ¿Reutilizar flujo `requiresPasswordChange`? | **Sí** en el **target user** — flag BE + pipeline auth existente; el admin no pasa por ese flujo. |

### 10.3 Clasificación reutilización

| Pieza | Clasificación |
|-------|---------------|
| Pipeline force-password (login → change-password) | **Reutilización directa** (target) |
| `ConfirmDialog`, `getErrorMessage`, toasts, `InvPageLayout` | **Reutilización directa** |
| `PasswordFieldWithGenerate`, `generateSecurePassword`, `validateNewPasswordRules` | **Reutilización directa** (si contrato lo permite) |
| `ClientCredentialsRevealModal` | **Refactor menor** → componente IAM genérico reveal |
| `usuario.service` CRUD | **Refactor menor** — añadir método reset |
| `UserWithRoles` types | **Refactor menor** — campos security |
| `ChangePasswordPage`, `completePasswordChange` | **No reutilizable** (admin action) |
| `LogoutAllConfirmDialog` / `logoutAllSessions` | **No reutilizable** |

### 10.4 Ubicación módulo

Mantener en `src/features/admin/` (Gestión de Usuarios):

- Servicio: `usuario.service.ts` (si endpoint bajo `/usuarios/`) o `auth-admin.service.ts` solo si path es `/auth/admin/...`
- UI: `components/iam/UserResetPasswordDialog.tsx` + opcional `UserPasswordRevealModal.tsx`
- Hook: `useAdminResetPassword.ts` (React Query mutation)

**No** mover a `features/account/` ni extender `AuthContext` salvo defecto real.

---

## 11. Decisión

# **B) Reutilización parcial**

| Opción | Aplica | Justificación |
|--------|--------|---------------|
| **A) Reutilización completa** | No | No existe flujo admin; `completePasswordChange` y `ChangePasswordPage` son self-service exclusivos. |
| **B) Reutilización parcial** | **Sí** | Infraestructura confirmación, validación, generación, reveal one-time, y pipeline force-password del usuario afectado ya existen; falta acción admin + servicio + tipos. |
| **C) Implementación nueva** | No | Sería duplicar auth, validación y modales sin necesidad. |

**Prerrequisito bloqueante:** contrato OpenAPI del endpoint administrativo de reset (ausente en snapshot actual del repo).

---

*Auditoría READ ONLY — ADMIN_PASSWORD_RESET_FRONTEND_AUDIT — 2026-06-24.*
