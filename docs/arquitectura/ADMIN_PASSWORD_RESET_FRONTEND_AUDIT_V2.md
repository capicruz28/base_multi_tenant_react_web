# ADMIN_PASSWORD_RESET — Auditoría Frontend V2

**Documento:** `docs/arquitectura/ADMIN_PASSWORD_RESET_FRONTEND_AUDIT_V2.md`  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — sin cambios de código  
**Contrato único de verdad:** [`ADMIN_PASSWORD_RESET_FRONTEND_CONTRACT_CERTIFICATION.md`](../../ADMIN_PASSWORD_RESET_FRONTEND_CONTRACT_CERTIFICATION.md)  
**Auditoría previa:** `docs/arquitectura/ADMIN_PASSWORD_RESET_FRONTEND_AUDIT.md` (V1 — pre-contrato)

---

## 1. Estado actual

| Área | Estado |
|------|--------|
| Acción «Restablecer contraseña» en Gestión de Usuarios | **No implementada** |
| Servicio HTTP `POST .../reset-password/` | **No existe** en FE |
| Tipos `AdminPasswordResetResponse` | **No existen** |
| Hook / mutación React Query | **No existe** |
| Modal revelación credenciales (tenant admin) | **No existe** |
| Permiso `admin.usuario.reset_password` en UI | **No evaluado** (página sin gate granular) |
| Flujo force-password usuario afectado | **Implementado** (Auth + `/change-password`) |

**Pantalla canónica:** `UserManagementPage` (`/admin/usuarios`) — listado Tier B/C con acciones fila **Editar**, **Desactivar** (activos) o **Reactivar** (inactivos). Sin menú contextual, sin acciones masivas, sin dropdown.

**Conclusión:** Cero implementación del reset admin. Infraestructura IAM, auth y super-admin provisioning aportan **patrones reutilizables** alineados al contrato certificado.

---

## 2. Inventario

### 2.1 Gestión de Usuarios — archivos relevantes

| Archivo | Rol actual | Relación reset admin |
|---------|------------|----------------------|
| `pages/UserManagementPage.tsx` | Orquestación listado, modales create/edit, confirm desactivar/reactivar | **Punto de integración** acción fila + estado modales |
| `services/usuario.service.ts` | CRUD, deactivate, reactivate, roles | Falta `resetUserPassword` |
| `types/usuario.types.ts` | `UserWithRoles`, form types | Falta response types; falta `proveedor_autenticacion` |
| `hooks/useUsersList.ts` | Listado paginado `useTenantQuery` | Sin cambio funcional; invalidar tras reset opcional |
| `components/iam/UserCreateDialog.tsx` | Crear usuario + contraseña inicial | **No** aplica a reset (BE genera temporal) |
| `components/iam/UserEditDialog.tsx` | Editar perfil/roles | Sin contraseña |
| `components/iam/PasswordFieldWithGenerate.tsx` | Input + generar en create | **No** usar en reset v1 (sin body) |
| `utils/generate-secure-password.ts` | Generador client-side | **No** usar — contrato prohíbe enviar contraseña |
| `utils/iam-usuario-list-normalize.ts` | Adapter listado | Sin cambio |
| `utils/iam-user-operation-log.ts` | Log operaciones IAM | Extender con cuidado — **no** loguear `contrasena` |
| `utils/iam-modal-stack-validation.ts` | QA modal stack | Aplicable si se usan Dialog Radix |
| `components/iam/index.ts` | Barrel exports | Exportar nuevos componentes |

### 2.2 Componentes buscados explícitamente

| Componente solicitado | ¿Existe en admin? | Notas |
|----------------------|-------------------|-------|
| `UserActions` | **No** | Acciones inline en `UserManagementPage` |
| `DataTable` | **No** | Tabla HTML + `InvTableSkeleton` |
| `PermissionGuard` | En rutas ERP (`app-route-tree`) | **No** en `/admin/*` — solo `ProtectedRoute requireTenantAdmin` |
| `ConfirmDialog` | **Sí** — `shared/components/ui/ConfirmDialog.tsx` | Ya usado desactivar/reactivar/discard |

### 2.3 Auth / force-password (sin trabajo en esta épica)

| Artefacto | Estado |
|-----------|--------|
| `Login.tsx`, `ProtectedRoute`, `SmartRedirect` | Redirect `requires_password_change` |
| `ChangePasswordPage` + `completePasswordChange` | Force + voluntario |
| `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` | Contrato post-login del **usuario afectado** |

### 2.4 Super-admin (patrón UX, no import directo)

| Artefacto | Rol |
|-----------|-----|
| `ClientCredentialsRevealModal.tsx` | Revelación única + copy + ack + confirm cierre |
| `copyTextToClipboard` | Util portapapeles |

---

## 3. Reutilización

### 3.1 Reutilización directa

| Pieza | Uso en reset admin |
|-------|-------------------|
| `ConfirmDialog` | Confirmación **previa** al POST (`variant="warning"`) — sesiones cerradas, entrega única |
| `getErrorMessage` | Parser errores HTTP + `detail` (O1: sin depender de `error_code` salvo 422) |
| `toast` (`react-hot-toast`) | Éxito informativo; **error solo en `onError` del hook** (ER-02) |
| `usePermission().hasPermission` | Gate `admin.usuario.reset_password` |
| `useAuth()` | `auth.user.usuario_id` para ocultar auto-reset |
| `copyTextToClipboard` | Copiar usuario / contraseña / bloque |
| Patrón `pageActionsLocked` | Bloquear filas durante mutación |
| `invalidateUsersListQueries` | Tras 404 o éxito si se desea refrescar listado |
| `InvPageLayout`, `IamTableEmptyState`, iconos Lucide | Consistencia visual IAM |

### 3.2 Reutilización con refactor menor (recomendado)

| Pieza | Acción |
|-------|--------|
| `ClientCredentialsRevealModal` | **No importar desde `super-admin`** (acoplamiento cross-módulo). Extraer patrón a componente admin-local, p. ej. `UserPasswordResetRevealDialog`, con props alineadas a `AdminPasswordResetResponse` |
| Lógica SSO | Reutilizar criterio de `isExternalPasswordAuth` (`auth/utils/password-validation.utils.ts`) adaptado a `UserWithRoles` vía `proveedor_autenticacion` |

### 3.3 NO reutilizable

| Pieza | Motivo |
|-------|--------|
| `PasswordFieldWithGenerate` | Contrato v1: **sin body**; BE genera temporal |
| `generateSecurePassword` | Idem — admin no define contraseña |
| `validatePasswordChangeForm` | Self-service con contraseña actual |
| `ChangePasswordPage` / `AccountChangePasswordForm` | Usuario autenticado, no admin sobre otro usuario |
| `completePasswordChange` | Opera sobre sesión del operador |
| `LogoutAllConfirmDialog` | Dominio distinto |
| `ClientCredentialsRevealModal` (import directo) | Tipos `ClienteCreateResult`; copy tenant provisioning |
| `PermissionGuard` en ruta | Admin ya protegido por `requireTenantAdmin`; permiso es **acción**, no ruta |

---

## 4. Gaps

### 4.1 Funcionales (implementación obligatoria)

| # | Gap | Contrato |
|---|-----|----------|
| G1 | Método `resetUserPassword(usuarioId)` → `POST /usuarios/{id}/reset-password/` | §2–§4 |
| G2 | Tipos `AdminPasswordResetResponse`, `CredencialesTemporalesRead` | §4 |
| G3 | Acción fila «Restablecer contraseña» | §7 |
| G4 | `ConfirmDialog` pre-reset | §6, §9 |
| G5 | Modal post-200 con credenciales temporales | §4, §7 |
| G6 | Gate `hasPermission('admin.usuario.reset_password')` | §2 RBAC |
| G7 | Ocultar si `proveedor_autenticacion !== 'local'` | §2, §5.2 |
| G8 | Ocultar si `usuario_id === auth.user.usuario_id` | §2 |
| G9 | Advertencia si `es_activo === false` tras éxito | O4, §5.3 |
| G10 | Wipe estado contraseña al cerrar modal (sin storage) | §7, §8 |

### 4.2 Tipado / datos

| # | Gap | Impacto |
|---|-----|---------|
| G11 | `UserWithRoles` sin `proveedor_autenticacion` | Gate SSO requiere ampliar tipo (campo viene en OpenAPI `UsuarioReadWithRoles`) |
| G12 | Sin constante permiso `admin.usuario.reset_password` | Copiar patrón `INV_PERMISSIONS` → constante IAM admin |

### 4.3 UX / stack modales

| # | Gap | Mitigación |
|---|-----|------------|
| G13 | Flujo Confirm → POST → Reveal (dos overlays) | Cerrar confirm **antes** de abrir reveal (B11-10 / AP-13) |
| G14 | `ClientCredentialsRevealModal` usa overlay custom; IAM usa Radix `Dialog` | Elegir uno: overlay custom (paridad provisioning) o `Dialog` shadcn (paridad UserEdit) |

### 4.4 Seguridad

| # | Gap |
|---|-----|
| G15 | `logIamUserOperation` hoy puede serializar `responseBody` — **prohibido** incluir `credenciales_temporales.contrasena` |
| G16 | `usuario.service` usa `console.error` con error completo — evitar loguear response 200 con contraseña |

### 4.5 No es gap (ya cubierto)

| Item | Estado |
|------|--------|
| Force password usuario afectado | Auth implementado |
| Cambio voluntario admin (auto-reset) | Account Center — redirigir en 400 |
| Recuperar contraseña por email | Fuera de alcance (`allow_password_reset` es config tenant) |

---

## 5. Arquitectura propuesta

### 5.1 Principios

1. **Mínimo diff** — extender módulo `features/admin/` existente; sin nuevo feature package.
2. **Contrato estricto** — POST sin body; tipar response según certificación.
3. **Seguridad** — contraseña solo en estado React local del modal reveal; wipe en unmount/close.
4. **Sin AuthContext changes** — salvo consumo `useAuth` / `usePermission` ya expuestos.
5. **ER-02** — toast error en hook mutación, no en catch del page handler duplicado.

### 5.2 Archivos nuevos (propuesta)

| Archivo | Responsabilidad |
|---------|-----------------|
| `types/admin-password-reset.types.ts` o ampliar `usuario.types.ts` | `AdminPasswordResetResponse`, `CredencialesTemporalesRead` |
| `utils/iam-user-password-reset.utils.ts` | `canShowAdminPasswordReset(user, ctx)`, `isLocalAuthUser(user)`, formateo bloque copy |
| `hooks/useResetUserPassword.ts` | `useMutation` + `onError` toast + tipado |
| `components/iam/UserPasswordResetConfirmDialog.tsx` | Wrapper `ConfirmDialog` con copy contrato (opcional — puede ser inline en page) |
| `components/iam/UserPasswordResetRevealDialog.tsx` | Modal entrega única (patrón `ClientCredentialsRevealModal`) |
| `components/iam/__tests__/UserPasswordResetRevealDialog.test.tsx` | Opcional — ack, copy, wipe state |
| `hooks/__tests__/useResetUserPassword.test.ts` | Opcional — llama service mock |

### 5.3 Archivos modificados (propuesta)

| Archivo | Cambio |
|---------|--------|
| `services/usuario.service.ts` | `resetUserPassword(usuarioId: string): Promise<AdminPasswordResetResponse>` |
| `types/usuario.types.ts` | `proveedor_autenticacion?: string` en `UserWithRoles` |
| `pages/UserManagementPage.tsx` | Estado `resetTarget`, `resetReveal`, handlers, botón fila, wire dialogs |
| `components/iam/index.ts` | Export nuevos componentes |
| `utils/iam-user-operation-log.ts` | Tipo operación `RESET_PASSWORD` con redacción de contraseña en log |

### 5.4 Servicio (contrato)

```typescript
// POST /usuarios/{usuario_id}/reset-password/ — sin body
export const resetUserPassword = async (
  usuarioId: string,
): Promise<AdminPasswordResetResponse> => {
  const { data } = await api.post<AdminPasswordResetResponse>(
    `${BASE_URL}/${usuarioId}/reset-password/`,
  );
  return data;
};
```

### 5.5 Ubicación de la acción en UI

```
Columna Acciones (fila activa):
  [Editar] [Restablecer contraseña*] [Desactivar]

Columna Acciones (fila inactiva):
  [Reactivar] [Restablecer contraseña*]   ← contrato permite 200; mostrar con advertencia post-reset

* Visible solo si:
  - hasPermission('admin.usuario.reset_password')
  - proveedor_autenticacion === 'local' (o ausente → tratar como local)
  - usuario_id !== auth.user.usuario_id
  - !pageActionsLocked
```

Icono sugerido: `KeyRound` (coherente con `ClientCredentialsRevealModal`). `title` / `sr-only`: «Restablecer contraseña».

**No** añadir ruta nueva. **No** menú masivo en v1.

### 5.6 Flujo de estado (page)

```
resetTarget: UserWithRoles | null     → ConfirmDialog abierto
isResetPending: boolean               → loading confirm
resetResult: AdminPasswordResetResponse | null → RevealDialog
  → on confirm: POST → cerrar confirm → set resetResult → abrir reveal
  → on reveal close: resetResult = null (wipe contraseña)
```

---

## 6. UX propuesta

Alineada a certificación §6–§7.

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dónde aparece la acción? | Columna **Acciones** de `UserManagementPage`, icono junto a Editar/Desactivar (activos) o junto a Reactivar (inactivos) |
| ¿Confirmación previa? | **Sí** — `ConfirmDialog` warning: cierre de sesiones del usuario, contraseña nueva generada por el sistema, entrega única |
| ¿Cómo mostrar contraseña temporal? | Modal dedicado post-200 con `credenciales_temporales.nombre_usuario` + `contrasena` (toggle mostrar/ocultar opcional) |
| ¿Copiar? | **Sí** — botones copiar usuario, contraseña y bloque (reutilizar `copyTextToClipboard`) |
| ¿Cuándo desaparece? | Al cerrar modal o navegar fuera; **nunca** reconsultar |
| ¿Reutilizar `ClientCredentialsRevealModal`? | **No** import directo — **nuevo** `UserPasswordResetRevealDialog` con mismo patrón UX (ack checkbox, confirm si cierra sin ack) |
| ¿Modal nuevo? | **Sí** — reveal específico admin; confirm puede ser inline `ConfirmDialog` existente |

**Copy post-éxito:** mostrar `message` del Backend tal cual.

**Inactivo:** tras 200, banner adicional: «El usuario está inactivo. Debe reactivarlo antes de que pueda iniciar sesión.»

**SSO:** no renderizar botón; si 400 SSO por race, toast con `detail`.

**Auto-reset 400:** toast con `detail`; opcional link texto a `/app/cuenta/seguridad` (sin cambiar contrato).

**Opcional informativo:** `sesiones_revocadas` en modal reveal.

**Prohibido en UX:** campo para que admin escriba contraseña; «ver de nuevo»; persistencia en storage.

---

## 7. Seguridad

| Requisito contrato | Estado FE actual | Acción implementación |
|--------------------|------------------|----------------------|
| No persistir contraseña | N/A | Estado local modal; `null` al cerrar |
| No localStorage / sessionStorage | N/A | No usar |
| No logs de contraseña | `console.error` en services | Redactar en reset; no `logIamUserOperation` con body completo |
| Limpiar estado al cerrar | Patrón ack en provisioning | `useEffect` reset al `isOpen=false` |
| Ocultar SSO | Tipo sin campo | Ampliar tipo + gate UI |
| Ocultar auto-reset | No implementado | Comparar `usuario_id` |
| Ocultar sin permiso | No gate granular | `hasPermission` |
| `autoComplete="off"` en campos display | N/A | En inputs read-only de reveal |

---

## 8. Validación contrato Backend

| Requisito certificación | ¿FE puede consumir? | Notas |
|-------------------------|---------------------|-------|
| `POST /api/v1/usuarios/{uuid}/reset-password/` | **Sí** | Trailing slash — patrón `usuario.service` existente |
| Sin body | **Sí** | `api.post(url)` sin segundo argumento |
| `Authorization` Bearer | **Sí** | Interceptor Axios global |
| Response `AdminPasswordResetResponse` | **Sí** | Tipar manualmente |
| Errores por `detail` + status | **Sí** | `getErrorMessage` |
| Permiso `admin.usuario.reset_password` | **Sí** | `usePermission` |
| Force password downstream | **Sí** | Sin cambios — Auth existente |

**No se requieren cambios Backend** según contrato certificado (dictamen B con observaciones O1–O2 absorbidas en diseño FE).

---

## 9. Riesgos

| ID | Riesgo | Sev. | Mitigación |
|----|--------|------|------------|
| R1 | Admin cierra reveal sin copiar | Alta | Ack obligatorio; confirm al cerrar sin ack (patrón provisioning) |
| R2 | Log accidental de contraseña | Alta | Redacción en `logIamUserOperation`; no log 200 body |
| R3 | `proveedor_autenticacion` ausente en listado API | Media | Fallback `local` si undefined; o GET detalle antes de mostrar acción |
| R4 | Permiso no asignado tenant legacy (403) | Media | Gate UI + mensaje `detail` |
| R5 | Confundir create password con reset | Media | Copy distinto; sin `PasswordFieldWithGenerate` |
| R6 | Doble overlay Confirm + Reveal | Media | Secuencia cerrar → abrir |
| R7 | Reset en inactivo sin reactivar | Media | Advertencia explícita post-200 |
| R8 | Import `ClientCredentialsRevealModal` desde super-admin | Baja | Componente admin-local |

---

## 10. Recomendaciones

1. **Implementar en un solo PR** acotado: service + types + utils gate + page wire + reveal dialog + tests mínimos.
2. **Constante** `ADMIN_USUARIO_PERMISSIONS.RESET_PASSWORD = 'admin.usuario.reset_password'`.
3. **Util** `canShowAdminPasswordReset` centralizado — unit testeable.
4. **No** extender `PasswordFieldWithGenerate` ni `generateSecurePassword` al flujo reset.
5. **Extraer** `UserPasswordResetRevealDialog` copiando estructura de provisioning, no dependencia cross-feature.
6. **Toast éxito** ligero tras cerrar reveal (opcional); mensaje principal en modal.
7. **Invalidar listado** solo en 404 o si se muestra estado derivado; reset no cambia filas visibles salvo edge cases.
8. **Tests:** gate SSO/self/permission; mutación llama URL correcta; reveal no deja contraseña tras unmount.
9. **Force password:** cero trabajo — verificar regresión login existente en QA manual.
10. **OpenAPI repo:** actualizar `docs/backend_openapi.json` en bloque separado si aplica — fuera de este feature salvo tipos.

---

## 11. Componentes reutilizables

| Componente / util | Reutilizar |
|-------------------|------------|
| `ConfirmDialog` | ✅ Sí |
| `copyTextToClipboard` | ✅ Sí |
| `getErrorMessage` | ✅ Sí |
| `toast` | ✅ Sí |
| `usePermission` | ✅ Sí |
| `useAuth` | ✅ Sí |
| `Button`, `InvPageLayout`, skeletons | ✅ Sí |
| Patrón UX `ClientCredentialsRevealModal` | ✅ Sí (nuevo componente admin) |
| `isExternalPasswordAuth` (criterio) | ✅ Adaptar |
| `PasswordFieldWithGenerate` | ❌ No |
| `generateSecurePassword` | ❌ No |
| `ChangePasswordPage` / `completePasswordChange` | ❌ No |
| `LogoutAllConfirmDialog` | ❌ No |
| `PermissionGuard` | ❌ No (acción, no ruta) |
| `UserActions` / `DataTable` | ❌ N/A (no existen) |

---

## 12. Componentes NO reutilizables

Ver §3.3. Resumen: todo lo que asume contraseña ingresada por admin, self-service auth, logout all, o import directo super-admin.

---

## 13. Dictamen final

| Criterio | Evaluación |
|----------|------------|
| Contrato Backend certificado e implementable | **Sí** |
| FE sin implementación previa | **Sí** — greenfield acotado |
| Arquitectura clara sin ambigüedad conceptual | **Sí** |
| Cambios Backend requeridos | **No** |
| Bloqueos conceptuales mayores | **No** |

# **A) Listo para implementación**

El contrato en `ADMIN_PASSWORD_RESET_FRONTEND_CONTRACT_CERTIFICATION.md` es completo y consumible. El Frontend dispone de patrones IAM (confirm destructivo/warning), provisioning (reveal one-time) y Auth (force-password downstream). Los gaps son **implementación acotada** en `features/admin/` sin refactor arquitectónico ni cambios Backend.

**Orden sugerido:** types → service → utils gate → hook → reveal dialog → wire `UserManagementPage` → tests.

---

*Auditoría READ ONLY V2 — ADMIN_PASSWORD_RESET — 2026-06-24.*
