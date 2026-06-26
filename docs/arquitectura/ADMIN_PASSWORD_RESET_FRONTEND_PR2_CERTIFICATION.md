# ADMIN_PASSWORD_RESET — Certificación Frontend PR2

**Documento:** `docs/arquitectura/ADMIN_PASSWORD_RESET_FRONTEND_PR2_CERTIFICATION.md`  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — sin cambios de código  
**Épica:** ADMIN_PASSWORD_RESET — PR2 (certificación)  
**Implementación auditada:** PR1 (`ADMIN_PASSWORD_RESET_FRONTEND_PR1_IMPLEMENTATION_REPORT.md`)

**Fuentes normativas:**
- `docs/arquitectura/ADMIN_PASSWORD_RESET_FRONTEND_SPEC.md`
- `ADMIN_PASSWORD_RESET_FRONTEND_CONTRACT_CERTIFICATION.md`
- `ADMIN_PASSWORD_RESET_FRONTEND_PR1_IMPLEMENTATION_REPORT.md`

**Alcance auditado:** `src/features/admin/` — reset administrativo en `UserManagementPage`. Sin modificar Auth, Account Center, super-admin ni Backend.

---

## 1. Resumen ejecutivo

La implementación PR1 cumple el contrato HTTP certificado, la especificación UX y los requisitos de seguridad verificables por código y tests automatizados. El flujo downstream del usuario afectado (login → force password → cambio obligatorio) **no fue modificado** en PR1 y permanece integrado vía módulo Auth existente.

**Tests automatizados:** 26/26 passed.  
**TypeScript (archivos PR):** sin errores.  
**ESLint (archivos PR, líneas reset):** sin errores.  
**QA manual E2E contra Backend vivo:** no ejecutado en esta sesión (ver §8).

---

## 2. Auditoría completa

### 2.1 Contrato HTTP

| Requisito | Evidencia | Estado |
|-----------|-----------|--------|
| Método `POST` | `usuario.service.ts` → `api.post(...)` | ✅ |
| Ruta `/api/v1/usuarios/{usuario_id}/reset-password/` | `BASE_URL='/usuarios'` + `apiCentral` `DEFAULT_API_BASE_URL='/api/v1'` | ✅ |
| Trailing slash | `` `${BASE_URL}/${usuarioId}/reset-password/` `` | ✅ |
| Body vacío | `api.post<AdminPasswordResetResponse>(url)` — sin 2º argumento | ✅ |
| Auth Bearer | Interceptor global `apiCentral` | ✅ |
| Response tipada | `AdminPasswordResetResponse` + `CredencialesTemporalesRead` en `usuario.types.ts` | ✅ |
| Campos response | `success`, `message`, `usuario_id`, `credenciales_temporales`, `sesiones_revocadas` | ✅ |
| Errores por `detail` + status | `getErrorMessage` en `useResetUserPassword.onError` | ✅ |
| Sin depender de `error_code` | Helpers en `iam-user-password-reset.utils.ts` leen `detail` | ✅ |
| 404 → invalidar listado | `shouldInvalidateUsersListAfterResetError` → `invalidateUsersListQueries` | ✅ |
| 400 SSO → invalidar listado | Idem | ✅ |
| 400 auto-reset → hint | `isAdminPasswordSelfResetError` + aviso inline + enlace | ✅ |

### 2.2 UX

| Requisito SPEC | Evidencia | Estado |
|----------------|-----------|--------|
| Botón `KeyRound` en columna Acciones | `UserManagementPage.renderResetPasswordButton` | ✅ |
| Color `text-warning` | Clases en botón | ✅ |
| Orden activo: Editar → Reset → Desactivar | JSX fila activa L813–838 | ✅ |
| Orden inactivo: Reactivar → Reset | JSX fila inactiva L841–853 | ✅ |
| Gate permiso | `hasPermission(ADMIN_USUARIO_PERMISSIONS.RESET_PASSWORD)` | ✅ |
| Gate SSO | `isLocalAuthUser` / `canShowAdminPasswordReset` | ✅ |
| Gate auto-reset | `user.usuario_id === currentUsuarioId` | ✅ |
| Botón no en DOM si gate falla | `return null` en `renderResetPasswordButton` | ✅ |
| Usuario inactivo: botón visible | Test utils + integración | ✅ |
| ConfirmDialog pre-POST | `resetTarget` + `buildResetConfirmMessage` | ✅ |
| variant `warning`, `panelClassName="max-w-lg"` | ConfirmDialog props L980–997 | ✅ |
| Mensaje inactivo en confirm | `buildResetConfirmMessage(..., !es_activo)` | ✅ |
| Cierre confirm antes de reveal | `setResetTarget(null)` luego `setResetReveal(...)` en éxito | ✅ |
| RevealDialog post-200 | `UserPasswordResetRevealDialog` | ✅ |
| Copy usuario / contraseña / bloque | `copyTextToClipboard` + toasts | ✅ |
| Ack checkbox | Estado `acknowledged` | ✅ |
| Finalizar requiere ack | `disabled={!acknowledged}` | ✅ |
| Cierre sin ack → segundo ConfirmDialog | `closeConfirmOpen` + copy normativo | ✅ |
| Banner inactivo en reveal | `isInactiveUser` condicional | ✅ |
| `sesiones_revocadas` informativo | Texto si `> 0` | ✅ |
| Aviso auto-reset 8 s | `selfResetHintVisible` + `useEffect` timer | ✅ |
| Enlace `/app/cuenta/seguridad` | `Link` en toolbar zone | ✅ |

### 2.3 Seguridad

| Requisito | Evidencia | Estado |
|-----------|-----------|--------|
| Contraseña no en localStorage/sessionStorage | Grep en archivos PR: 0 usos | ✅ |
| Contraseña solo en estado React | `resetReveal` + estado modal | ✅ |
| Wipe al cerrar | `handleResetRevealComplete` → `setResetReveal(null)` | ✅ |
| Reset estado modal al abrir | `useEffect` en reveal al cambiar `isOpen`/`usuario_id` | ✅ |
| React Query `gcTime: 0` | `useResetUserPassword` mutación | ✅ |
| No query cache de listado con password | Mutación no escribe en query cache de users | ✅ |
| Log éxito redactado | `redactPasswordResetResponseForLog` | ✅ |
| Log error redactado | `responseBody: { redacted: true }` | ✅ |
| Sin analytics/Sentry en flujo reset | Grep admin reset: 0 referencias | ✅ |
| `autoComplete="off"` display contraseña | Input readOnly en reveal | ✅ |
| Toast error único (ER-02) | Solo `onError` del hook; page catch sin toast | ✅ |

**Observación O2:** `useResetUserPassword` exporta `resetPasswordResult` (`mutation.data`) que podría contener `contrasena` en memoria de mutación hasta garbage collection. **No es consumido** por `UserManagementPage`. Riesgo bajo; recomendación futura: no exportar o redactar en hook.

### 2.4 React — hooks, estados, invalidaciones

| Aspecto | Implementación | Estado |
|---------|----------------|--------|
| Hook mutación | `useResetUserPassword` | ✅ |
| Estado `resetTarget` | Confirm abierto | ✅ |
| Estado `resetReveal` | Reveal abierto | ✅ |
| `pageActionsLocked` | `discardPending \|\| isResetPending` | ✅ |
| `resetVisibilityCtx` memoizado | `useMemo` | ✅ |
| Invalidación 404/SSO | En hook `onError` | ✅ |
| Sin invalidación obligatoria en 200 | Conforme SPEC §5.12 | ✅ |
| Sin doble overlay | `resetTarget` null antes de reveal | ✅ |
| z-index confirm/reveal | Confirm `z-50` (shared); Reveal `z-[60]` | ✅ |

---

## 3. Checklist funcional

| # | Ítem | Estado |
|---|------|--------|
| F1 | Acción solo en `/admin/usuarios` | ✅ |
| F2 | POST sin body | ✅ |
| F3 | Permiso `admin.usuario.reset_password` | ✅ |
| F4 | Reset usuario local ajeno | ✅ |
| F5 | Reset permitido en inactivo (200 BE) | ✅ |
| F6 | No reset SSO | ✅ |
| F7 | No auto-reset | ✅ |
| F8 | Confirmación obligatoria | ✅ |
| F9 | Revelación única post-200 | ✅ |
| F10 | Operación `RESET_PASSWORD` en log IAM redactado | ✅ |
| F11 | Sin campo contraseña manual | ✅ |
| F12 | Sin ruta nueva | ✅ |

---

## 4. Checklist UX

| # | Ítem | Estado |
|---|------|--------|
| U1 | Icono + tooltip «Restablecer contraseña» | ✅ |
| U2 | Orden botones según SPEC §1.2 | ✅ |
| U3 | Copy ConfirmDialog activo/inactivo | ✅ |
| U4 | `result.message` sin reescritura en reveal | ✅ |
| U5 | Contraseña oculta por defecto (`••••••`) | ✅ |
| U6 | Toggle Eye/EyeOff | ✅ |
| U7 | Copiar bloque completo con notas | ✅ |
| U8 | Ack texto normativo | ✅ |
| U9 | «¿Cerrar sin confirmar?» al cerrar sin ack | ✅ |
| U10 | Sin toast éxito post-cierre reveal | ✅ |

---

## 5. Checklist seguridad

| # | Ítem | Estado |
|---|------|--------|
| S1 | No persistir contraseña | ✅ |
| S2 | No localStorage / sessionStorage | ✅ |
| S3 | No React Query cache persistente de response | ✅ |
| S4 | No log de `contrasena` en éxito | ✅ |
| S5 | No log de body 200 en error handler page | ✅ |
| S6 | Limpieza inmediata al `onComplete` | ✅ |
| S7 | Gates UI permiso/SSO/self | ✅ |

---

## 6. Checklist contrato Backend

Referencia: `ADMIN_PASSWORD_RESET_FRONTEND_CONTRACT_CERTIFICATION.md`

| # | Ítem contrato | Estado |
|---|---------------|--------|
| B1 | `operationId` `reset_usuario_password_admin` (consumo FE por URL) | ✅ |
| B2 | `CredencialesTemporalesRead` anidado | ✅ |
| B3 | `requiere_cambio: true` tipado | ✅ |
| B4 | Errores 400/403/404/422/500 vía `detail` | ✅ |
| B5 | Usuario inactivo → 200 + advertencia FE | ✅ |
| B6 | Sesión admin no afectada (sin lógica FE que la cierre) | ✅ |
| B7 | Force password del afectado fuera de este endpoint | ✅ (Auth) |

---

## 7. Checklist integración

### 7.1 Admin IAM (PR1)

| Integración | Estado |
|-------------|--------|
| `UserManagementPage` + `usePermission` | ✅ |
| `usuario.service.resetUserPassword` | ✅ |
| Export barrel `iam/index.ts` | ✅ |
| Tests unitarios + integración visibilidad | ✅ 26/26 |

### 7.2 Auth downstream (sin modificación — verificación estática)

| Paso flujo E2E | Componente / ruta | Estado |
|----------------|-------------------|--------|
| Login con temporal | `Login.tsx` → redirect si `requires_password_change` | ✅ Existente |
| Force password | `ProtectedRoute` → `/change-password` | ✅ Existente |
| Cambio obligatorio | `ChangePasswordPage` + `POST /auth/password/change/` | ✅ Existente |
| Post-cambio acceso normal | Auth provider + `completePasswordChange` | ✅ Existente |

**Trazado:** Admin reset (PR1) termina en entrega de credenciales. El usuario afectado ingresa por flujo Auth ya certificado (`AUTH_FRONTEND_CONTRACT_CERTIFICATION.md`). **No hay gap de integración FE** entre PR1 y Auth.

---

## 8. Resultados QA

### 8.1 Automatizados (ejecutados 2026-06-24)

```bash
npx vitest run \
  src/features/admin/utils/__tests__/iam-user-password-reset.utils.test.ts \
  src/features/admin/hooks/__tests__/useResetUserPassword.test.ts \
  src/features/admin/components/iam/__tests__/UserPasswordResetRevealDialog.test.tsx \
  src/features/admin/pages/__tests__/UserManagementPage.password-reset.test.tsx
```

| Suite | Tests | Resultado |
|-------|-------|-----------|
| `iam-user-password-reset.utils` | 16 | ✅ Pass |
| `useResetUserPassword` | 3 | ✅ Pass |
| `UserPasswordResetRevealDialog` | 5 | ✅ Pass |
| `UserManagementPage.password-reset` | 2 | ✅ Pass |
| **Total** | **26** | **✅ 26/26** |

Warnings no bloqueantes: `act(...)` en tests de reveal/page (cosmético).

### 8.2 TypeScript

| Alcance | Resultado |
|---------|-----------|
| Archivos PR (`tsc --noEmit --skipLibCheck` filtrado) | ✅ 0 errores |
| `tsc -b` proyecto completo | ⚠️ Errores preexistentes en `core/auth` (fuera alcance PR) |

### 8.3 ESLint

| Alcance | Resultado |
|---------|-----------|
| Archivos nuevos/modificados del PR (excepto `any` legacy) | ✅ 0 errores |
| `usuario.service.ts` L123/L134 (`assignRole`/`revokeRole`) | ⚠️ `any` preexistente, no introducido por reset |

### 8.4 QA manual E2E (protocolo y resultado)

**Protocolo esperado (SPEC + contrato):**

1. Admin con `admin.usuario.reset_password` abre `/admin/usuarios`.
2. Clic Reset en usuario local ajeno → ConfirmDialog → confirmar.
3. Verificar POST 200 y RevealDialog con credenciales.
4. Copiar credenciales; ack; cerrar reveal.
5. Usuario afectado: login con temporal.
6. Verificar redirect `/change-password` (`requires_password_change`).
7. Completar cambio obligatorio (`POST /auth/password/change/`).
8. Verificar acceso ERP normal.

| Paso | Ejecución en esta certificación | Resultado |
|------|----------------------------------|-----------|
| 1–4 Admin reset | No ejecutado contra Backend vivo | ⏸ Pendiente entorno |
| 5–8 Usuario afectado | No ejecutado contra Backend vivo | ⏸ Verificado por trazado estático Auth |

**Observación O1:** La certificación PR2 se realizó en modo READ ONLY sin entorno Backend disponible en sesión. El flujo admin (pasos 1–4) está cubierto por tests automatizados parciales; el flujo completo E2E requiere validación manual en tenant de staging antes de release.

---

## 9. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación actual |
|----|--------|-------|---------|-------------------|
| R1 | Admin cierra reveal sin copiar | Alta | Alta | Ack + confirm cierre sin ack |
| R2 | `proveedor_autenticacion` ausente en listado | Media | Media | Fallback `local`; invalidación en 400 SSO |
| R3 | Permiso no asignado tenant legacy | Media | Media | Gate UI + 403 toast |
| R4 | E2E no validado en vivo | Media | Media | Protocolo §8.4; Auth ya certificado |
| R5 | `mutation.data` con password en hook | Baja | Baja | No exportado a UI; `gcTime: 0` |

---

## 10. Observaciones

| # | Observación | Bloqueante |
|---|-------------|------------|
| O1 | QA manual E2E contra Backend no ejecutado en esta sesión | No |
| O2 | `resetPasswordResult` en hook expone `mutation.data` (no usado por página) | No |
| O3 | ESLint `any` preexistente en `assignRoleToUser`/`revokeRoleFromUser` | No |
| O4 | `tsc -b` global con deuda preexistente `core/auth` | No |
| O5 | Tests con warnings `act()` — no afectan comportamiento | No |

**Defectos reales que impidan certificar:** ninguno detectado. **No se requieren cambios de código** para PR2.

---

## 11. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se modificó código en PR2? | No |
| ¿Implementación alineada a SPEC? | Sí |
| ¿Contrato HTTP consumible? | Sí |
| ¿Auth/Account Center tocados? | No |
| ¿Seguridad contraseña cumplida? | Sí (con O2 menor) |
| ¿Tests pasan? | Sí (26/26) |
| ¿Listo para release tras E2E manual staging? | Sí, sujeto a O1 |

---

## 12. Dictamen final

La implementación PR1 de **ADMIN_PASSWORD_RESET** está **alineada** con la especificación, el contrato certificado y los requisitos de seguridad verificables. Los tests automatizados pasan íntegramente. La única brecha material es la **no ejecución de QA manual E2E contra Backend vivo** en esta certificación READ ONLY, mitigada por trazado estático del flujo Auth downstream ya existente.

# **B) Certificado con observaciones**

Observaciones no bloqueantes: **O1** (E2E manual vivo pendiente en staging), **O2** (export `resetPasswordResult`), **O3–O5** (deuda preexistente / cosmética tests).

Tras ejecutar el protocolo §8.4 en entorno con Backend certificado, el dictamen puede elevarse a **A) Certificado** sin cambios de código adicionales.

---

*Certificación READ ONLY — ADMIN_PASSWORD_RESET PR2 — 2026-06-24.*
