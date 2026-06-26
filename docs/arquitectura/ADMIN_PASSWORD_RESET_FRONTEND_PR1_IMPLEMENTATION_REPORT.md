# ADMIN_PASSWORD_RESET — Informe de implementación PR1 (Frontend)

**Documento:** `docs/arquitectura/ADMIN_PASSWORD_RESET_FRONTEND_PR1_IMPLEMENTATION_REPORT.md`  
**Fecha:** 2026-06-24  
**Épica:** ADMIN_PASSWORD_RESET — PR1  
**Fuentes:** `ADMIN_PASSWORD_RESET_FRONTEND_SPEC.md`, `ADMIN_PASSWORD_RESET_FRONTEND_CONTRACT_CERTIFICATION.md`

---

## 1. Resumen

PR1 implementa el reset administrativo de contraseña en **Gestión de Usuarios** (`/admin/usuarios`): acción por fila, confirmación, `POST` sin body, modal de revelación única con copia al portapapeles y wipe de memoria al cerrar.

**Alcance respetado:** solo `features/admin/`. Sin cambios en Auth, Account Center, super-admin ni Backend.

---

## 2. Archivos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/features/admin/constants/admin-usuario.permissions.ts` | Constante `ADMIN_USUARIO_PERMISSIONS.RESET_PASSWORD` |
| `src/features/admin/utils/iam-user-password-reset.utils.ts` | Gates, mensajes, bloque copy, redacción log, helpers error |
| `src/features/admin/hooks/useResetUserPassword.ts` | Mutación React Query + toast error (ER-02) |
| `src/features/admin/components/iam/UserPasswordResetRevealDialog.tsx` | Modal entrega única post-200 |
| `src/features/admin/utils/__tests__/iam-user-password-reset.utils.test.ts` | Tests utils |
| `src/features/admin/hooks/__tests__/useResetUserPassword.test.ts` | Tests hook |
| `src/features/admin/components/iam/__tests__/UserPasswordResetRevealDialog.test.tsx` | Tests reveal dialog |
| `src/features/admin/pages/__tests__/UserManagementPage.password-reset.test.tsx` | Tests integración visibilidad en página |

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/admin/types/usuario.types.ts` | `proveedor_autenticacion`, `CredencialesTemporalesRead`, `AdminPasswordResetResponse` |
| `src/features/admin/services/usuario.service.ts` | `resetUserPassword(usuarioId)` → `POST .../reset-password/` sin body |
| `src/features/admin/utils/iam-user-operation-log.ts` | Operación `RESET_PASSWORD` |
| `src/features/admin/pages/UserManagementPage.tsx` | Botón, estado, ConfirmDialog, RevealDialog, aviso auto-reset |
| `src/features/admin/components/iam/index.ts` | Export `UserPasswordResetRevealDialog` |

---

## 4. Componentes reutilizados

| Componente / util | Uso |
|-------------------|-----|
| `ConfirmDialog` | Pre-POST + cierre sin ack en reveal |
| `copyTextToClipboard` | Copiar usuario, contraseña y bloque |
| `getErrorMessage` | Parser errores HTTP (hook) |
| `toast` | Copia OK (reveal); error mutación (hook) |
| `usePermission` | Gate `admin.usuario.reset_password` |
| `useAuth` | Gate auto-reset (`usuario_id`) |
| `invalidateUsersListQueries` | 404 / 400 SSO (hook) |
| `Link` (react-router) | Aviso inline `/app/cuenta/seguridad` |
| Iconos Lucide | `KeyRound`, `Edit3`, `Trash2`, `RotateCcw` |
| Patrón UX `ClientCredentialsRevealModal` | Estructura del reveal (código nuevo, sin import) |

---

## 5. Componentes nuevos

| Componente | Descripción |
|------------|-------------|
| `UserPasswordResetRevealDialog` | Modal overlay `z-[60]`, ack, copy, confirm cierre |
| `useResetUserPassword` | `gcTime: 0`, `onError` único con toast |
| Utils `iam-user-password-reset.*` | Lógica de visibilidad y copy normativo |

---

## 6. Validaciones ejecutadas

| Validación | Resultado |
|------------|-----------|
| TypeScript (archivos PR1, `tsc --noEmit --skipLibCheck` filtrado) | ✅ Sin errores en archivos del PR |
| `tsc -b` proyecto completo | ⚠️ Errores preexistentes en `core/auth` (fuera de alcance PR1) |
| ESLint archivos nuevos/modificados del PR | ✅ 0 errores (excl. `any` preexistentes en `assignRole`/`revokeRole` del service) |
| Tests PR1 (26 tests, 4 archivos) | ✅ 26/26 passed |

### Comando tests

```bash
npx vitest run \
  src/features/admin/utils/__tests__/iam-user-password-reset.utils.test.ts \
  src/features/admin/hooks/__tests__/useResetUserPassword.test.ts \
  src/features/admin/components/iam/__tests__/UserPasswordResetRevealDialog.test.tsx \
  src/features/admin/pages/__tests__/UserManagementPage.password-reset.test.tsx
```

---

## 7. Riesgos encontrados

| ID | Riesgo | Mitigación en PR1 |
|----|--------|-------------------|
| R1 | `proveedor_autenticacion` ausente en listado API | `isLocalAuthUser` trata ausente como `local`; invalidación listado en 400 SSO |
| R2 | Log accidental de contraseña | `redactPasswordResetResponseForLog` en éxito; `{ redacted: true }` en error |
| R3 | Admin cierra reveal sin ack | Segundo `ConfirmDialog` + checkbox obligatorio para Finalizar |
| R4 | Permiso no asignado (403) | Gate UI `hasPermission`; toast con `detail` del hook |
| R5 | `tsc -b` global rojo | Deuda preexistente auth; archivos PR1 compilan aisladamente |

---

## 8. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿POST sin body? | ✅ `api.post(url)` sin segundo argumento |
| ¿Trailing slash? | ✅ `/usuarios/{id}/reset-password/` |
| ¿Contraseña en storage? | ✅ No — solo estado React; `null` en `onComplete` |
| ¿Toast error duplicado? | ✅ Solo en `useResetUserPassword.onError` |
| ¿Doble overlay confirm+reveal? | ✅ `resetTarget = null` antes de `setResetReveal` |
| ¿Import super-admin? | ✅ No |
| ¿PasswordFieldWithGenerate? | ✅ No usado |
| ¿Modificó Auth/Account/super-admin? | ✅ No |

---

## 9. Checklist vs `ADMIN_PASSWORD_RESET_FRONTEND_SPEC.md`

### §1 Ubicación

- [x] Botón `KeyRound` en columna Acciones
- [x] Orden activo: Editar → Reset → Desactivar
- [x] Orden inactivo: Reactivar → Reset
- [x] `title` / `sr-only`: «Restablecer contraseña»
- [x] Color `text-warning`

### §2 Visibilidad

- [x] `canShowAdminPasswordReset` centralizado
- [x] Gate permiso `admin.usuario.reset_password`
- [x] Gate SSO (`proveedor_autenticacion !== 'local'`)
- [x] Gate auto-reset (`usuario_id === current`)
- [x] Usuario inactivo: botón visible
- [x] `pageActionsLocked` incluye `isResetPending`

### §3 Flujo UX

- [x] Clic → ConfirmDialog → POST → cierre confirm → RevealDialog
- [x] Error: cierre confirm + toast hook
- [x] `onComplete` → wipe `resetReveal`

### §4 ConfirmDialog

- [x] Título, variant `warning`, copy normativo
- [x] Párrafo inactivo condicional
- [x] `panelClassName="max-w-lg"`
- [x] `loading={isResetPending}`

### §5 Reveal Dialog

- [x] Layout según spec (banners, credenciales, copy, ack, footer)
- [x] Toggle mostrar/ocultar contraseña
- [x] `sesiones_revocadas` informativo
- [x] Segundo confirm al cerrar sin ack
- [x] `autoComplete="off"` en display contraseña
- [x] z-index `z-[60]`

### §6 Usuario inactivo

- [x] Mensajes en confirm, reveal y bloque copy

### §7 SSO

- [x] Botón no renderizado
- [x] 400 SSO: toast + `invalidateUsersListQueries`

### §8 Auto-reset

- [x] Botón no renderizado en fila propia
- [x] 400: toast + aviso inline con enlace Mi cuenta → Seguridad (8 s)

### §9 Seguridad

- [x] Sin persistencia / storage / logs de contraseña
- [x] `gcTime: 0` en mutación
- [x] Redacción en `logIamUserOperation`

### §11 Componentes

- [x] Nuevos según spec
- [x] Reutilizados según spec
- [x] NO reutilizados excluidos

### §12 Un único PR

- [x] Implementación completa en este PR

---

## 10. Dictamen

# **A) Implementación correcta**

PR1 cumple la especificación funcional y el contrato certificado. Tests unitarios e integración de visibilidad pasan. TypeScript y ESLint limpios en el alcance del PR. QA manual end-to-end (POST real contra Backend) queda para PR2 de certificación, fuera de alcance de este informe.

---

*PR1 — ADMIN_PASSWORD_RESET — Frontend — 2026-06-24.*
