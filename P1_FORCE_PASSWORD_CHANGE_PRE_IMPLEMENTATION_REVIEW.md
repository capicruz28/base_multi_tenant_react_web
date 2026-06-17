# Revisión pre-implementación P1 — Force Password Change + Branding ChangePasswordPage

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Referencias:** `TENANT_PROVISIONING_AND_FORCE_PASSWORD_CHANGE_FINAL_ARCHITECTURE_REVIEW.md`, `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md`  
**Estado:** Auditoría y plan — **sin implementación**

---

## 1. Veredicto ejecutivo

| Bloque | Viabilidad | Alcance |
|--------|------------|---------|
| **Historia B P1** — interceptor 403 + SmartRedirect | ✅ Viable con cambios acotados en auth/core/shared | 4–5 archivos |
| **Branding ChangePasswordPage** | ✅ Viable reutilizando patrón Login existente | 1 archivo |
| **Historia A P0** | ✅ No afectada | 0 archivos super-admin |

**Autorización pendiente** para implementar tras aprobación de este documento.

---

## 2. Contexto P0 vs P1

### P0 (cerrado funcionalmente)

```text
Capas proactivas:
  Login → /change-password
  ProtectedRoute → /change-password (antes ERP/onboarding/selección)
  AuthContext.shouldSkipErpMenuLoad → no GET /auth/menu con flag
  ChangePasswordPage + auth/routes
```

### P1 (pendiente aprobado)

```text
Capas reactivas / completitud:
  AuthContext interceptor 403 PASSWORD_CHANGE_REQUIRED
  SmartRedirect → /change-password en F5 raíz (/)
  ChangePasswordPage → branding tenant (paridad visual con Login)
  Helpers error/HTTP (legibilidad + anti-bucle)
```

### Diferencia funcional

| Escenario | P0 | P1 |
|-----------|----|----|
| Login con flag → change-password | ✅ | — |
| F5 en `/app/*` con flag | ✅ ProtectedRoute | — |
| F5 en `/` con flag | ❌ SmartRedirect salta a selección/onboarding/ERP | ✅ redirect change-password |
| Race: RQ dispara API ERP antes de redirect | ❌ error genérico 403 / toast | ✅ interceptor captura y redirige |
| `reloadMenuAndPermissions` tras refresh con flag stale | Parcial (skip menu en bootstrap) | ✅ interceptor como red de seguridad |
| Pantalla change-password con logo/colores tenant | ❌ icono Lock genérico | ✅ branding |

---

## 3. Historia B P1 — Interceptor 403

### 3.1 Estado actual

El interceptor de response en `AuthContext.tsx` (líneas ~905–1083) maneja:

- ✅ 401 → refresh + retry
- ✅ 5xx → `showServerErrorToast`
- ❌ 403 `PASSWORD_CHANGE_REQUIRED` → cae en toast genérico 403 sin redirect

`skipsTokenRefresh` ya incluye `/auth/password/change` localmente (línea 495).  
`shouldSkipTokenRefresh` en `auth-http.utils.ts` **no** incluye logout/me/password-change.

### 3.2 Contrato backend (confirmado)

```json
HTTP 403
{
  "detail": "Debe cambiar su contraseña antes de acceder a este recurso.",
  "error_code": "PASSWORD_CHANGE_REQUIRED"
}
```

Campo JSON: `error_code` (no `internal_code`).  
Login **nunca** devuelve este error; ocurre en APIs posteriores (`/auth/menu`, ERP, etc.).

### 3.3 Diseño del interceptor (mínimo)

Insertar **antes** del bloque 401 y **antes** de `showServerErrorToast`:

```text
if status === 403 AND isPasswordChangeRequired(error):
  if NOT shouldSkipPasswordChangeRedirect(url):
    if NOT already on /change-password:
      if NOT platform_admin AND NOT impersonation:
        sync auth.user.requires_password_change = true (si stale)
        window.location.assign('/change-password')  // patrón existente en AuthContext
  return Promise.reject(error)  // sin showServerErrorToast
```

**Navegación:** `window.location.assign` — coherente con líneas 777/808/1129 de `AuthContext` (no usa `useNavigate`).

**No crear store nuevo:** el flag ya vive en `auth.user` + getter `requiresPasswordChange`.

### 3.4 Reglas anti-bucle (whitelist URL)

No redirigir si la request es (según arquitectura + contrato):

| Ruta | Motivo |
|------|--------|
| `/auth/password/change/` | Pantalla activa / submit |
| `/auth/me/` | Bootstrap permitido |
| `/auth/logout/` | Salida |
| `/auth/refresh/` | Renovación |
| `/auth/empresa/seleccionar/` | Schema A post-change |
| `/auth/impersonate/*` | Impersonación |
| `/clientes/branding` | Branding público pre-login |

No redirigir si `window.location.pathname` ya empieza por `/change-password`.

### 3.5 Exclusiones (misma lógica que P0)

| Actor | Acción interceptor |
|-------|-------------------|
| `platform_admin` | Ignorar — no redirect |
| `is_impersonation` | Ignorar — operador no ve change |
| SSO (`requires_password_change` false) | N/A — backend no emite código |

---

## 4. Historia B P1 — SmartRedirect

### 4.1 Estado actual

`SmartRedirect.tsx` prioridad actual:

```text
1. loading / !authInitialized → spinner
2. hasPendingSelection || mustSelectEmpresa → selección
3. shouldOnboardEmpresa → onboarding
4. resolvePostLoginPath → ERP/super-admin
```

**Falta:** paso `requiresPasswordChange → /change-password` entre autenticación y selección.

### 4.2 Cambio mínimo

Tras el guard de loading, **antes** de selección:

```typescript
if (requiresPasswordChange) {
  return <Navigate to={APP_CHANGE_PASSWORD} replace />;
}
```

Importar `requiresPasswordChange` de `useAuth()` y `APP_CHANGE_PASSWORD` de `auth.types.ts`.

### 4.3 Contexto router

`SmartRedirect` vive bajo `ProtectedRoute` en `/` (`router.tsx` línea 27–28). Usuario debe estar autenticado; el getter de AuthContext aplica.

---

## 5. Auditoría branding — ChangePasswordPage

### 5.1 Síntoma

La pantalla muestra icono `Lock` genérico y textos estáticos. No aparece logo del tenant ni aplicación consistente de colores/título white-label.

### 5.2 Causa raíz (evidencia en código)

| Capa | Login | ChangePasswordPage |
|------|-------|-------------------|
| `useBranding(false)` | ✅ | ❌ |
| `LoginBrandingHeader` | ✅ | ❌ |
| `useTenant` / `useTheme` | ✅ | ❌ |
| `BrandingInitializer` (global) | Carga store | Carga store ✅ |
| `applyBranding()` vía `useBranding` | ✅ al montar Login | ❌ **nadie aplica CSS al montar page** |

**Diagnóstico en dos partes:**

1. **UI:** ChangePasswordPage no reutiliza `LoginBrandingHeader` — cabecera genérica.
2. **CSS variables:** `applyBranding()` solo se invoca desde el hook `useBranding` (`useBranding.ts` líneas 42–54). Sin montar ese hook en la página, tras F5 directo en `/change-password` o navegación sin pasar por Login, los tokens CSS del tenant pueden no aplicarse aunque `BrandingInitializer` haya poblado el store.

### 5.3 Patrón existente del proyecto (no duplicar)

```text
app/provider.tsx
  └── BrandingInitializer          → carga store (subdomain pre-login / tenantId post-login)

Login.tsx
  └── useBranding(false)           → lee store + applyBranding()
  └── LoginBrandingHeader          → logo, nombre cliente, skeleton
  └── LoginPoweredBy               → footer CAXIS (tenant, no platform)
```

**No se requiere** nuevo store, nuevo endpoint ni lógica de fetch duplicada.

### 5.4 Solución mínima propuesta (branding)

Modificar **solo** `ChangePasswordPage.tsx`:

| Añadir | Propósito |
|--------|-----------|
| `useBranding(false)` | Mismo contrato que Login — apply sin auto-fetch duplicado |
| `useTenant()`, `useTheme()` | Subdomain + dark mode para header |
| `LoginBrandingHeader` | Reutilizar componente existente |
| `LoginPoweredBy` | Paridad footer (si `ENABLE_CONTEXTUAL_LOGIN_UI`) |
| `resolveClientDisplayName` | Título documento opcional (mismo `useEffect` que Login) |

**Estructura visual propuesta:**

```text
[LoginBrandingHeader]        ← logo / nombre tenant
[h1] Cambio de contraseña obligatorio
[p]  Por seguridad, debe establecer...
[formulario campos]
[LoginPoweredBy]               ← si contextual UI activo
```

**No modificar** `LoginBrandingHeader.tsx` en P1 salvo necesidad de prop `tagline` — el subtítulo específico de cambio de contraseña puede ir **debajo** del header como hoy, sustituyendo el bloque `Lock`.

**Fallback** si `ENABLE_CONTEXTUAL_LOGIN_UI === false`: mantener cabecera actual con `Lock` (mismo criterio que `LoginLegacyHeader` en Login).

### 5.5 Casos Schema A / Schema B

| Caso | Branding source | Comportamiento esperado |
|------|-----------------|-------------------------|
| Schema B autenticado | `BrandingInitializer` + `tenantId` | `useBranding(false)` aplica branding tenant |
| Schema A selection pendiente | `subdomain` → `loadBrandingBySubdomain` | `useBrandingStoreWithTenant` lee `subdomainCache` |
| `platform.app.local` | `PLATFORM_LOGIN_SUBDOMAIN` | Header CAXIS platform (edge — admin platform no usa change) |

---

## 6. Archivos exactos a modificar

### 6.1 Historia B P1 (obligatorios según arquitectura)

| # | Archivo | Cambios |
|---|---------|---------|
| 1 | `src/shared/context/AuthContext.tsx` | Bloque 403 `PASSWORD_CHANGE_REQUIRED` en interceptor response; sync flag; redirect |
| 2 | `src/core/services/error.service.ts` | +`getApiErrorCode(error)`, +`isPasswordChangeRequired(error)` |
| 3 | `src/core/api/auth-http.utils.ts` | +`shouldSkipPasswordChangeRedirect(url)` (whitelist) |
| 4 | `src/shared/components/SmartRedirect.tsx` | Gate `requiresPasswordChange` antes de selección/onboarding |

### 6.2 Branding (auditoría + corrección)

| # | Archivo | Cambios |
|---|---------|---------|
| 5 | `src/features/auth/pages/ChangePasswordPage.tsx` | `useBranding(false)` + `LoginBrandingHeader` + paridad Login |

### 6.3 Constante error (opcional mínimo)

| # | Archivo | Cambios |
|---|---------|---------|
| 6 | `src/features/auth/types/auth.types.ts` | +`ERROR_CODE_PASSWORD_CHANGE_REQUIRED` (1 línea, co-localizado con `APP_CHANGE_PASSWORD`) |

### 6.4 Explícitamente NO modificados

| Archivo | Motivo |
|---------|--------|
| `axios-instances.ts`, `api.ts` | Arquitectura: interceptor vive en AuthContext |
| `ProtectedRoute.tsx`, `Login.tsx` | P0 cerrado — sin regresión |
| Módulos ERP | Restricción usuario |
| `post-login-path.ts` | `APP_CHANGE_PASSWORD` ya en `auth.types.ts` (P0) — mover es cosmético P2 |
| `BrandingInitializer.tsx`, `branding.store.ts` | Patrón actual suficiente |
| **Historia A** — `clientes/**`, `ClientCredentialsRevealModal`, `useProvisionCliente` | Fuera de alcance P1 |
| `ClientManagementPage.tsx` | Sin cambios |
| `app/router.tsx` | Sin cambios — SmartRedirect ya montado |

### 6.5 Opcional P1 (no bloqueante)

| Archivo | Motivo |
|---------|--------|
| `src/core/auth/utils/__tests__/menu-permissions-ready.test.ts` | Documentar caso flag → ready (arquitectura P1) |

**Total mínimo autorizado: 5–6 archivos**

---

## 7. Dependencias entre archivos

```text
auth.types.ts (constante error_code)
    ↓
error.service.ts (isPasswordChangeRequired)
    ↓
auth-http.utils.ts (shouldSkipPasswordChangeRedirect)
    ↓
AuthContext.tsx (interceptor 403)
    ↑
SmartRedirect.tsx (requiresPasswordChange de useAuth — sin dep directa)

BrandingInitializer (existente, sin cambios)
    ↓
useBranding hook (existente)
    ↓
ChangePasswordPage.tsx (+ LoginBrandingHeader import)
```

**Orden de implementación recomendado:**

1. `auth.types.ts` (constante) + `error.service.ts` + `auth-http.utils.ts`
2. `AuthContext.tsx` (interceptor)
3. `SmartRedirect.tsx`
4. `ChangePasswordPage.tsx` (branding)
5. Prueba manual integrada

---

## 8. Riesgos de regresión

| ID | Riesgo | Prob. | Mitigación |
|----|--------|-------|------------|
| P1-R1 | Bucle redirect 403 ↔ change-password | Media | Whitelist URL + skip si ya en `/change-password` |
| P1-R2 | 403 legítimo (permisos) confundido con password | Baja | Detectar solo `error_code === 'PASSWORD_CHANGE_REQUIRED'` |
| P1-R3 | Toast 403 genérico antes de redirect | Media | `return reject` sin `showServerErrorToast` en rama password |
| P1-R4 | Impersonación redirigida a change | Baja | Exclusión `isImpersonation` / support mode |
| P1-R5 | SmartRedirect rompe flujo normal sin flag | Baja | Guard solo si `requiresPasswordChange === true` |
| P1-R6 | `window.location.assign` pierde estado React | Baja | Aceptable — patrón ya usado en AuthContext; página re-bootstrap |
| P1-R7 | Branding flash sin skeleton | Baja | `LoginBrandingHeader` ya tiene skeleton `brandingLoading` |
| P1-R8 | Historia A regresión | Muy baja | Cero archivos super-admin/clientes |

---

## 9. Confirmación — Historia A no afectada

| Criterio | Confirmación |
|----------|--------------|
| Archivos `super-admin/clientes/**` | **Sin cambios** |
| `ClientCredentialsRevealModal`, `useProvisionCliente` | **Sin cambios** |
| `copy-to-clipboard.ts` | **Sin cambios** |
| Flujo provisionamiento POST /clientes/ | **Independiente** de interceptor 403 y SmartRedirect |
| Branding reveal modal credenciales | **Sin cambios** — scope platform super-admin |

Historia A P0 permanece cerrada. P1 de Historia A (PDF, tests service) **no** está en el alcance de esta fase.

---

## 10. Checklist de validación manual (post-implementación)

### Interceptor 403

- [ ] Admin tenant con flag + llamada manual API ERP → redirect `/change-password`
- [ ] `GET /auth/menu` con flag → redirect (no toast 403 genérico)
- [ ] `POST /auth/password/change/` con credencial incorrecta → **no** redirect (error formulario)
- [ ] Impersonación + 403 ERP → **no** redirect a change-password
- [ ] Platform admin → **no** redirect

### SmartRedirect

- [ ] F5 en `/` con flag true + sesión → `/change-password`
- [ ] F5 en `/` con flag false → flujo actual (selección/onboarding/ERP)

### Branding ChangePasswordPage

- [ ] `http://{tenant}.app.local:5173/change-password` → logo y colores tenant
- [ ] Schema A (selection pendiente) → branding por subdominio
- [ ] F5 directo en change-password → branding aplicado (no solo store poblado)
- [ ] `ENABLE_CONTEXTUAL_LOGIN_UI=false` → fallback Lock sin regresión

### Regresión Historia A

- [ ] Crear tenant + reveal credenciales + clipboard → sin cambios
- [ ] Login → change → ERP → flujo P0 intacto

---

## 11. Resumen de entregables (tras aprobación)

| Entregable | Descripción |
|------------|-------------|
| Código P1 | 5–6 archivos según §6 |
| `P1_FORCE_PASSWORD_CHANGE_IMPLEMENTATION_REPORT.md` | Reporte post-implementación (a generar después) |

---

**Fin de revisión pre-implementación P1. Esperando aprobación para implementar.**
