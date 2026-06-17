# Plan de implementación P0 — Force Password Change (Frontend)

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Alcance:** Historia B — P0 únicamente  
**Excluido:** Historia A, interceptor 403, SmartRedirect, PDF, Zustand nuevo, React Query nuevo

---

## 1. Flujo final validado

```text
[Tenant admin — contraseña temporal en BD]

POST /auth/login/  → 200
  user_data.requires_password_change: true
        │
        ├─ Schema B (access_token)
        │     → setAuthFromLogin (sin /auth/menu si flag true)
        │     → /change-password
        │
        └─ Schema A (selection_token)
              → setPendingSelection (userPreview con flag)
              → /change-password (NO /app/seleccionar-empresa aún)

/change-password (authRoutes, sin AppLayout)
  → formulario: actual + nueva + confirmar
  → POST /auth/password/change/  (Bearer: access_token o selection_token)
  → applyFullSessionToken (tokens nuevos, flag false)
        │
        ├─ pending selection / mustSelectEmpresa  → /app/seleccionar-empresa
        ├─ shouldOnboardEmpresa                 → /app/onboarding
        └─ else                                 → resolvePostLoginPath

[F5 / deep link /app/* con flag true]
  → ProtectedRoute redirect → /change-password
  → shouldSkipErpMenuLoad: no GET /auth/menu
  → menuPermissionsReady = true (sin spinner)
```

### Prioridad de guards

```text
1. isAuthenticated (o selection pendiente en /change-password)
2. requiresPasswordChange → /change-password
3. selección empresa
4. onboarding
5. ERP
```

### Exclusiones

| Actor | requiresPasswordChange efectivo |
|-------|-------------------------------|
| `platform_admin` | `false` |
| `is_impersonation` | `false` |
| SSO (`requires_password_change` ausente/false en backend) | `false` |

---

## 2. Archivos exactos a modificar

| # | Archivo | Cambios |
|---|---------|---------|
| 1 | `src/features/auth/types/auth.types.ts` | `requires_password_change` en `UserData`; `PasswordChangeRequest` |
| 2 | `src/features/auth/services/auth.service.ts` | `normalizeUserData`; `changePassword(token, payload)` |
| 3 | `src/core/auth/utils/decodeAccessToken.ts` | Claim `requires_password_change` |
| 4 | `src/shared/context/AuthContext.tsx` | Getter `requiresPasswordChange`; `completePasswordChange`; extender `shouldSkipErpMenuLoad`; sync JWT en refresh; skip refresh en `/auth/password/change` |
| 5 | `src/shared/components/ProtectedRoute.tsx` | Redirect `/change-password` antes de ERP/onboarding/selección |
| 6 | `src/features/auth/pages/Login.tsx` | Redirect post-login Schema A y B |
| 7 | `src/features/auth/pages/ChangePasswordPage.tsx` | **Nuevo** |
| 8 | `src/features/auth/routes.tsx` | Ruta `/change-password` |

**Constante de ruta:** `APP_CHANGE_PASSWORD = '/change-password'` definida en `ChangePasswordPage` export o duplicada mínimamente en Login/ProtectedRoute (sin tocar `post-login-path.ts` en P0).

---

## 3. Dependencias entre archivos

```text
auth.types.ts
    ├── auth.service.ts
    │       └── AuthContext.completePasswordChange
    ├── decodeAccessToken.ts
    │       └── AuthContext (refresh sync, shouldSkipErpMenuLoad)
    └── AuthContext.requiresPasswordChange (computed)

AuthContext
    ├── ProtectedRoute (requiresPasswordChange)
    ├── Login (indirecto vía setAuthFromLogin)
    └── ChangePasswordPage (completePasswordChange, logout, requiresPasswordChange)

auth/routes.tsx → ChangePasswordPage
```

**Orden de implementación:**

1. `auth.types.ts` + `decodeAccessToken.ts`
2. `auth.service.ts`
3. `AuthContext.tsx`
4. `ChangePasswordPage.tsx` + `auth/routes.tsx`
5. `Login.tsx` + `ProtectedRoute.tsx`

---

## 4. Estrategia anti-regresión

| Riesgo | Mitigación P0 |
|--------|----------------|
| Spinner infinito en ProtectedRoute | `shouldSkipErpMenuLoad` retorna `true` si flag; `menuPermissionsReady = true` sin llamar menú |
| Login Schema A salta password | Login redirige a `/change-password` si `user_data.requires_password_change` |
| platform_admin forzado | Excluido en getter `requiresPasswordChange` |
| Impersonación bloqueada | Excluido por `isImpersonation` |
| `/auth/menu` 403 | No se invoca con flag true |
| Refresh deja flag stale | Merge claim JWT → `auth.user.requires_password_change` tras refresh |
| 401 en change dispara refresh loop | `skipsTokenRefresh` local incluye `/auth/password/change` |
| ERP modules tocados | Ningún cambio bajo `features/*` excepto `auth` |

---

## 5. Checklist de validación manual

### Login y cambio

- [ ] Admin tenant con password temporal → login → `/change-password` (no ERP)
- [ ] Cambio exitoso → redirect onboarding (sin empresa) o home/selección
- [ ] Contraseña actual incorrecta → mensaje 401
- [ ] Nueva contraseña débil → mensaje 422
- [ ] Nueva ≠ confirmación → validación local
- [ ] Logout desde pantalla change funciona

### Guards

- [ ] F5 en `/app/home` con flag → `/change-password`
- [ ] F5 en `/change-password` con flag → permanece
- [ ] Tras cambio, `/app/home` accesible
- [ ] Sin spinner eterno "Verificando sesión..."

### Exclusiones

- [ ] Platform admin login → super-admin (sin change)
- [ ] Impersonación soporte → ERP sin change

### Multi-empresa (Schema A)

- [ ] Login multi-empresa + flag → `/change-password` (no selección primero)
- [ ] Tras change → `/app/seleccionar-empresa` si aplica

### Regresión

- [ ] Usuario normal sin flag → flujo login actual intacto
- [ ] Onboarding admin sin flag → `/app/onboarding`

---

**Fin del plan P0.** Proceder a implementación.
