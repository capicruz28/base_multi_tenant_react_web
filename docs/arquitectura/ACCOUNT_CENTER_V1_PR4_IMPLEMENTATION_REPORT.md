# ACCOUNT_CENTER_V1 — Informe de implementación PR4 (Seguridad)

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_PR4_IMPLEMENTATION_REPORT.md`  
**Épica:** `ACCOUNT_CENTER_V1` (Mi Cuenta)  
**Alcance:** PR4 — Sección Seguridad (password voluntario + logout all)  
**Fecha:** 2026-06-24  
**Prerequisitos:** PR1–PR3 completados

---

## 1. Resumen

Se implementó **`AccountSecurityPage`** con dos cards read-only de acción: **Seguridad** (cambio voluntario de contraseña) y **Sesión global** (logout all). Toda la lógica reutiliza contratos auth existentes: `completePasswordChange`, `logoutAllSessions`, `LogoutAllConfirmDialog`, `getErrorMessage`, validación compartida extraída de `ChangePasswordPage`.

**No se avanzó a PR5** (Preferencias).

---

## 2. Archivos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/features/auth/utils/password-validation.utils.ts` | Validación cliente compartida force + voluntario; `isExternalPasswordAuth` |
| `src/features/auth/utils/__tests__/password-validation.utils.test.ts` | Tests validación / SSO |
| `src/features/account/components/security/AccountChangePasswordForm.tsx` | Card Seguridad — form voluntario |
| `src/features/account/components/security/AccountSecuritySessionGlobalCard.tsx` | Card Sesión global — logout all |
| `src/features/account/components/security/__tests__/AccountChangePasswordForm.test.tsx` | Test submit password |
| `src/features/account/pages/__tests__/AccountSecurityPage.test.tsx` | Tests integración página |

**Total:** 6 archivos nuevos.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/account/pages/AccountSecurityPage.tsx` | Reemplazo stub por orquestación 2 cards |
| `src/features/auth/pages/ChangePasswordPage.tsx` | Import validación compartida — sin cambio de comportamiento force |

**Total:** 2 archivos modificados.

---

## 4. Componentes reutilizados

| Componente / API | Origen |
|------------------|--------|
| `completePasswordChange` | `AuthContext` |
| `logoutAllSessions` | `AuthContext` |
| `LogoutAllConfirmDialog` | `features/auth/components` |
| `getErrorMessage` | `core/services/error.service` |
| `SESSION_LOGOUT_V3_ENABLED` | `session-logout-v3.flags` |
| `AccountProfileCard` | PR3 — layout cards Capa 1 |
| `ConfirmDialog` (vía LogoutAll) | `shared/components/ui` |
| `toast` | `react-hot-toast` |

---

## 5. Lógica reutilizada

### 5.1 Cambio de contraseña

| Capa | Reutilización |
|------|---------------|
| Validación cliente | `validatePasswordChangeForm` + `validateNewPasswordRules` (extraídas de `ChangePasswordPage`) |
| HTTP / sesión | `completePasswordChange()` — compositor existente |
| Errores API | `getErrorMessage` + banner `role="alert"` + `toast.error` (paridad force flow) |
| Éxito | `toast.success` + limpieza form; **permanece** en `/app/cuenta/seguridad` (sin redirect post-login) |

### 5.2 Logout All

| Capa | Reutilización |
|------|---------------|
| Dialog | `LogoutAllConfirmDialog` |
| Terminación | `logoutAllSessions()` |
| Guards UI | `SESSION_LOGOUT_V3_ENABLED`, `!isImpersonation`, `!requiereSeleccionEmpresa`, `!requiresPasswordChange` (paridad Header PR2) |
| Error API | `toast.error(getErrorMessage)` en card Seguridad (gap FRONTEND_AUTH_AUDIT — solo UI, sin compositor) |

### 5.3 SSO (condicional)

Si `proveedor_autenticacion` / `tipo_autenticacion` ≠ `local`: card Seguridad muestra mensaje SSO sin formulario (UX §7.2.1 / SPEC AC-C1).

---

## 6. UX implementada

| Card | Contenido |
|------|-----------|
| **Seguridad** | Form 3 campos + hint reglas + aviso cierre sesiones remotas + botón primario «Actualizar contraseña» |
| **Sesión global** | Icono Shield + descripción + botón danger «Cerrar todas las sesiones» + nota logout Header |

Sin H1, sin modales propios (solo dialog reutilizado), tokens Capa 1.

---

## 7. Restricciones verificadas

| Restricción | Cumplida |
|-------------|----------|
| Sin cambios AuthContext API | ✅ |
| Sin compositors / interceptors | ✅ |
| Sin cambios `auth.service.ts` | ✅ |
| Sin endpoints nuevos | ✅ |
| Sin duplicar validación (DRY util) | ✅ |
| Sin MFA / passkeys / edición perfil | ✅ |
| Header sin modificar | ✅ |
| MySessionsPage / Preferencias sin tocar | ✅ |

---

## 8. Validaciones

| Validación | Resultado |
|------------|-----------|
| Flujo force sigue usando misma validación | ✅ `ChangePasswordPage` refactor import |
| `LogoutAllConfirmDialog` reutilizado | ✅ Test page |
| Guards `requiresPasswordChange` | ✅ Card oculta CTA (ProtectedRoute bloquea hub) |
| `npx tsc --noEmit` | ✅ PASS |
| Tests unitarios render/submit | ✅ PASS |

---

## 9. Pruebas ejecutadas

```text
npx tsc --noEmit  →  PASS

npx vitest run features/account  →  PASS (18 tests)

npx vitest run features/auth/utils/__tests__/password-validation.utils.test.ts  →  PASS (3 tests)
```

| Suite PR4 | Tests |
|-----------|-------|
| `password-validation.utils.test.ts` | 3/3 |
| `AccountChangePasswordForm.test.tsx` | 1/1 |
| `AccountSecurityPage.test.tsx` | 3/3 |

---

## 10. Riesgos

| ID | Riesgo | Sev. | Notas |
|----|--------|------|-------|
| R1 | Toast duplicado error password (banner + toast) | Baja | Paridad `ChangePasswordPage` existente — ER-02 legacy |
| R2 | SSO sin campo BE → form visible | Baja | Mismo fallback SPEC §5.4 |
| R3 | Logout all error solo toast en Seguridad, no Header | Baja | Header sin cambio por alcance PR4 |
| R4 | Dos botones mismo label en dialog test | Baja | Mitigado en tests con `getAllByRole` |

---

## 11. Checklist de aceptación PR4

### Seguridad (AC-03)

- [x] Cambio voluntario password vía `completePasswordChange`
- [x] Validación cliente alineada BE (util compartida)
- [x] Aviso cierre sesiones remotas post-cambio
- [x] Logout all desde card Sesión global + dialog
- [x] Hint logout dispositivo actual → Header
- [x] Logout all oculto si impersonación / flags / guards
- [x] Toast error logout all en fallo API (card)
- [x] SSO: form oculto si proveedor externo

### Restricciones

- [x] Sin cambios Auth/compositors/interceptors/auth.service
- [x] Sin MFA / passkeys / cambio correo
- [x] Header atajo logout all intacto

---

## 12. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Solo PR4 implementado? | **Sí** |
| ¿Validación DRY sin cambiar force flow? | **Sí** |
| ¿Logout all reutilizado? | **Sí** |
| ¿Documentación funcional nueva? | **No** — solo este informe |
| ¿Tests PASS? | **Sí** |

---

## 13. Dictamen final

# **A) PR4 implementado correctamente**

La sección Seguridad está operativa con reutilización completa de contratos auth, validación compartida sin regresión en `/change-password`, logout all integrado con guards UI y tests PASS. Listo para PR5 (Preferencias).

---

*Informe PR4 ACCOUNT_CENTER_V1 — 2026-06-24.*
