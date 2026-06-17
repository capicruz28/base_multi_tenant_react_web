# Reporte de implementación P1 — Force Password Change

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Contrato:** `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md`  
**Plan:** `P1_FORCE_PASSWORD_CHANGE_PRE_IMPLEMENTATION_REVIEW.md`  
**Estado:** Implementación completada

---

## 1. Resumen

Se implementó Historia B P1: interceptor reactivo 403 `PASSWORD_CHANGE_REQUIRED`, gate en `SmartRedirect` para F5 en `/`, y paridad de branding en `ChangePasswordPage` reutilizando el patrón de `Login`.

**No se modificó:** Historia A, `super-admin/clientes/**`, ERP, `axios-instances.ts`, `Login.tsx`, `ProtectedRoute.tsx`, `BrandingInitializer.tsx`.

---

## 2. Archivos modificados (P1)

| Archivo | Cambios |
|---------|---------|
| `src/features/auth/types/auth.types.ts` | +`ERROR_CODE_PASSWORD_CHANGE_REQUIRED` |
| `src/core/services/error.service.ts` | +`getApiErrorCode()`, +`isPasswordChangeRequired()` |
| `src/core/api/auth-http.utils.ts` | +`shouldSkipPasswordChangeRedirect()`, +`shouldBypassPasswordChangeEnforcement()` |
| `src/shared/context/AuthContext.tsx` | Interceptor 403 → sync flag + `window.location.assign('/change-password')` |
| `src/shared/components/SmartRedirect.tsx` | Gate `requiresPasswordChange` antes de selección/onboarding/ERP |
| `src/features/auth/pages/ChangePasswordPage.tsx` | `useBranding(false)` + `LoginBrandingHeader` + `LoginPoweredBy` |

### Archivos nuevos (tests)

| Archivo | Propósito |
|---------|-----------|
| `src/core/services/__tests__/password-change-error.test.ts` | Tests `getApiErrorCode` / `isPasswordChangeRequired` |
| `src/core/api/__tests__/auth-http-password-change.test.ts` | Tests whitelist y exclusiones |

---

## 3. Decisiones de implementación (alineadas al contrato)

### 3.1 Interceptor 403 (`AuthContext`)

| Regla contrato | Implementación |
|----------------|----------------|
| `403` + `error_code: "PASSWORD_CHANGE_REQUIRED"` | `isPasswordChangeRequired(error)` |
| Whitelist auth | `shouldSkipPasswordChangeRedirect(url)` |
| Excluir `platform_admin` | `shouldBypassPasswordChangeEnforcement()` |
| Excluir `is_impersonation` | JWT claim + `isImpersonationToken` + support mode |
| Redirect | `window.location.assign(APP_CHANGE_PASSWORD)` |
| Sin toast 403 genérico | `return Promise.reject(error)` antes de `showServerErrorToast` |
| Sync flag stale | `auth.user.requires_password_change = true` |

Ubicación en interceptor: **después** de extraer `status`/`url`, **antes** del bloque 401 refresh.

### 3.2 SmartRedirect

Prioridad actualizada:

```text
loading → requiresPasswordChange → selección → onboarding → ERP
```

Cubre F5 en `/` con flag activo (hueco P0).

### 3.3 Branding ChangePasswordPage

Patrón idéntico a `Login.tsx`:

- `useBranding(false)` — aplica CSS sin auto-fetch duplicado (`BrandingInitializer` carga store)
- `LoginBrandingHeader` / `LoginLegacyHeader` según `ENABLE_CONTEXTUAL_LOGIN_UI`
- `LoginPoweredBy` en tenants (no platform)
- `document.title` contextual
- Usuario visible desde `auth.user` o `selectionUserPreview` (Schema A)

---

## 4. Hallazgo durante implementación (corregido)

### Bug en matching whitelist `/auth/me`

La primera implementación usaba `path.includes('/auth/me')`, lo que hacía match incorrecto con **`/auth/menu`** (subcadena `me` dentro de `menu`).

**Corrección:** matching por sufijo de segmento (`pathEndsWithSegment`) + normalización de path. Los tests unitarios detectaron el fallo antes de QA manual.

**No es contradicción con el contrato** — era un defecto de implementación FE.

---

## 5. Contradicciones contrato vs código

**Ninguna detectada** que impida la implementación. El contrato `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md` fue respetado en:

- Estructura JSON 403
- Whitelist de rutas
- Exclusiones platform_admin / impersonación
- Campo `error_code` (no `internal_code`)

---

## 6. Riesgos residuales

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| `window.location.assign` recarga SPA | Baja | Patrón ya usado en AuthContext; estado se rehidrata |
| Múltiples 403 concurrentes → redirects repetidos | Baja | Guard `pathname.startsWith('/change-password')` |
| 403 permisos ERP legítimo (no password) | Baja | Solo actúa si `error_code` exacto |
| Branding flash en carga lenta | Baja | Skeleton en `LoginBrandingHeader` |
| QA E2E manual pendiente | Media | Requiere tenant con flag en entorno `*.app.local` |

---

## 7. Casos de prueba ejecutados

### Unitarios (vitest) — ✅ 4/4 passed

```text
npx vitest run \
  src/core/services/__tests__/password-change-error.test.ts \
  src/core/api/__tests__/auth-http-password-change.test.ts
```

| Test | Resultado |
|------|-----------|
| `getApiErrorCode` extrae `PASSWORD_CHANGE_REQUIRED` | ✅ |
| `isPasswordChangeRequired` true/false según código | ✅ |
| Whitelist oficial (password/change, me, logout, refresh, seleccionar, impersonate) | ✅ |
| `/auth/menu` NO está en whitelist | ✅ |
| `platform_admin` bypass enforcement | ✅ |

### Estático

| Verificación | Resultado |
|--------------|-----------|
| Linter archivos P1 | Sin errores |
| TypeScript archivos P1 | Sin errores nuevos |

---

## 8. Checklist QA manual (pendiente en entorno)

### Interceptor 403

- [ ] Tenant con flag + `GET /auth/menu` → redirect `/change-password` (sin toast 403 genérico)
- [ ] `POST /auth/password/change/` credencial incorrecta → error en formulario, sin redirect
- [ ] Impersonación → sin redirect a change-password
- [ ] Platform admin → sin redirect

### SmartRedirect

- [ ] F5 en `/` con flag → `/change-password`
- [ ] F5 en `/` sin flag → flujo normal

### Branding

- [ ] `http://{tenant}.app.local:5173/change-password` → logo y colores tenant
- [ ] F5 directo en change-password → branding aplicado
- [ ] Schema A (selection pendiente) → branding por subdominio

### Regresión

- [ ] Historia A provisionamiento sin cambios
- [ ] Login → change → ERP (P0 intacto)
- [ ] ProtectedRoute sin regresión

---

## 9. Confirmación Historia A

| Criterio | Estado |
|----------|--------|
| `super-admin/clientes/**` | Sin cambios en esta fase P1 |
| Provisionamiento + clipboard | Sin cambios |

---

**Fin del reporte P1.**
