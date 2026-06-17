# Reporte de implementación P0 — Force Password Change (Frontend)

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Alcance ejecutado:** Historia B — P0 únicamente  
**Estado:** Implementación completa; validación manual pendiente contra backend

---

## 1. Resumen

Se implementó el flujo de **cambio obligatorio de contraseña** alineado al contrato backend (`FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md`), sin tocar provisionamiento (Historia A), módulos ERP, `ClientManagementPage`, `useCreateCliente` ni `axios-instances.ts`.

El flag `requiresPasswordChange` se deriva **exclusivamente** en `AuthContext`. No se añadió Zustand nuevo, React Query nuevo, interceptor 403 ni SmartRedirect (reservados para P1).

---

## 2. Archivos modificados

| Archivo | Tipo | Cambios principales |
|---------|------|---------------------|
| `src/features/auth/types/auth.types.ts` | Modificado | `requires_password_change` en `UserData`; `PasswordChangeRequest`; `APP_CHANGE_PASSWORD`; fix cast en `isLoginEmpresaSelectionResponse` |
| `src/core/auth/utils/decodeAccessToken.ts` | Modificado | Claim JWT `requires_password_change` + helper `readPasswordChangeFlag` |
| `src/features/auth/services/auth.service.ts` | Modificado | `normalizeUserData` mapea flag; `changePassword(payload, bearer)` → `POST /auth/password/change/` |
| `src/shared/context/AuthContext.tsx` | Modificado | `requiresPasswordChange` (computed); `completePasswordChange`; `shouldSkipErpMenuLoad` con flag; sync JWT tras refresh; skip refresh en `/auth/password/change`; merge flag desde `/auth/me` |
| `src/shared/components/ProtectedRoute.tsx` | Modificado | Redirect temprano a `/change-password` si `requiresPasswordChange` |
| `src/features/auth/pages/Login.tsx` | Modificado | Schema A y B redirigen a `/change-password` antes de selección/onboarding/ERP |
| `src/features/auth/pages/ChangePasswordPage.tsx` | **Nuevo** | Formulario, validación local, logout, navegación post-éxito |
| `src/features/auth/routes.tsx` | Modificado | Ruta `change-password` hermana de `login` |

### Documentación (sin cambios de código)

| Archivo | Estado |
|---------|--------|
| `FORCE_PASSWORD_CHANGE_FRONTEND_IMPLEMENTATION_PLAN_P0.md` | Creado pre-implementación |
| `FORCE_PASSWORD_CHANGE_FRONTEND_IMPLEMENTATION_REPORT.md` | Este documento |

### Archivos explícitamente NO modificados (según restricciones)

- `src/core/api/axios-instances.ts`
- `src/features/super-admin/clientes/**`
- `src/core/hooks/useClienteMutations.ts`
- Módulos ERP bajo `src/features/*` (excepto `auth`)
- `SmartRedirect.tsx` (sin cambios P0)

---

## 3. Decisiones tomadas

### 3.1 Fuente única del flag en UI

`requiresPasswordChange` es un `useMemo` en `AuthContext` que considera:

1. `auth.user.requires_password_change` (sesión Schema B o post-cambio)
2. `selectionUserPreview.requires_password_change` (Schema A con selección pendiente)
3. Exclusiones: `platform_admin`, `isSuperAdmin` sin impersonación, `isImpersonation`

No hay store paralelo ni lectura directa del JWT en componentes de UI.

### 3.2 Schema A (multi-empresa)

Tras login con `selection_token` y flag `true`:

- Se persiste selección pendiente (`setPendingSelection`)
- Redirect a `/change-password` **antes** de `/app/seleccionar-empresa`
- `completePasswordChange` usa `selection_token` como Bearer si no hay `access_token`

### 3.3 Evitar regresiones en ProtectedRoute

Con flag activo, `shouldSkipErpMenuLoad` retorna `true` → no se llama `GET /auth/menu` → `menuPermissionsReady = true` sin spinner infinito.

### 3.4 Constante de ruta centralizada

`APP_CHANGE_PASSWORD = '/change-password'` en `auth.types.ts` (importada en Login, ProtectedRoute y ChangePasswordPage). No se modificó `post-login-path.ts` en P0.

### 3.5 Validación de contraseña en cliente

Reglas mínimas en `ChangePasswordPage`: ≥8 caracteres, mayúscula, minúscula, número, confirmación coincidente, distinta a la actual. El backend sigue siendo autoridad para reglas adicionales (422).

### 3.6 Navegación post-cambio

Orden respetado:

```text
cambio exitoso → selección empresa (si pending) → onboarding (si aplica) → resolvePostLoginPath
```

---

## 4. Diferencias respecto al plan original

| Tema | Plan inicial (`TENANT_PROVISIONING_AND_FORCE_PASSWORD_CHANGE_FRONTEND_PLAN.md`) | P0 implementado |
|------|--------------------------------------------------------------------------------|-----------------|
| Historia A (credenciales) | Modal + tipos `ClienteCreateResponse` | **No implementado** |
| Interceptor 403 `PASSWORD_CHANGE_REQUIRED` | Incluido | **Diferido P1** |
| SmartRedirect | Actualizar prioridad guards | **Diferido P1** |
| Constante ruta | Opción en `post-login-path.ts` | Centralizada en `auth.types.ts` |
| PDF / clipboard credenciales | P1 en revisión | **No implementado** |
| `useProvisionCliente` | Feature hook | **No implementado** |
| Orden implementación | B antes que A | **Cumplido** (solo B) |

Alineado con `TENANT_PROVISIONING_AND_FORCE_PASSWORD_CHANGE_FINAL_ARCHITECTURE_REVIEW.md` y `FORCE_PASSWORD_CHANGE_FRONTEND_IMPLEMENTATION_PLAN_P0.md`.

---

## 5. Riesgos remanentes

| Riesgo | Severidad | Mitigación actual | Acción P1 |
|--------|-----------|-------------------|-----------|
| API devuelve 403 `PASSWORD_CHANGE_REQUIRED` en rutas ERP con sesión stale | Media | Guards + skip menú reducen exposición | Interceptor 403 global |
| Deep links complejos (`SmartRedirect`) no contemplan flag | Baja | `ProtectedRoute` redirige en `/app/*` | Actualizar `SmartRedirect` |
| Schema A: `applyFullSessionToken` tras change podría no limpiar selection store automáticamente | Media | Navegación explícita a selección si `hasPendingSelection` | Validar en QA multi-empresa |
| Reglas de contraseña solo parciales en FE | Baja | Backend valida 422 | Opcional: alinear mensajes con OpenAPI |
| Usuario recarga `/change-password` sin sesión ni selection | Baja | Redirect a `/login` | QA manual |
| Build global del repo falla por errores TS preexistentes en otros módulos | Info | Archivos P0 compilan sin errores nuevos | Fuera de alcance P0 |

---

## 6. Checklist de pruebas

### 6.1 Verificación estática ejecutada

| Prueba | Resultado |
|--------|-----------|
| Linter en archivos P0 (`AuthContext`, `ChangePasswordPage`, `Login`, `ProtectedRoute`) | Sin errores |
| `tsc -b` filtrado — archivos P0 | Sin errores nuevos |
| `npm run build` completo | Falla por errores TS **preexistentes** en otros módulos (ERP, layout, etc.); ninguno en archivos P0 |
| Restricciones de alcance (no ERP, no ClientManagement, no axios-instances) | Cumplidas |

### 6.2 Validación manual pendiente (requiere backend + usuario con flag)

#### Login y cambio

- [ ] Admin tenant con password temporal → login → `/change-password` (no ERP)
- [ ] Cambio exitoso → redirect onboarding (sin empresa) o home/selección
- [ ] Contraseña actual incorrecta → mensaje 401
- [ ] Nueva contraseña débil → mensaje 422
- [ ] Nueva ≠ confirmación → validación local
- [ ] Logout desde pantalla change funciona

#### Guards

- [ ] F5 en `/app/home` con flag → `/change-password`
- [ ] F5 en `/change-password` con flag → permanece
- [ ] Tras cambio, `/app/home` accesible
- [ ] Sin spinner eterno "Verificando sesión..."

#### Exclusiones

- [ ] Platform admin login → super-admin (sin change)
- [ ] Impersonación soporte → ERP sin change

#### Multi-empresa (Schema A)

- [ ] Login multi-empresa + flag → `/change-password` (no selección primero)
- [ ] Tras change → `/app/seleccionar-empresa` si aplica

#### Regresión

- [ ] Usuario normal sin flag → flujo login actual intacto
- [ ] Onboarding admin sin flag → `/app/onboarding`

---

## 7. Próximos pasos (fuera de P0 — requieren aprobación)

1. **P1:** Interceptor 403 `PASSWORD_CHANGE_REQUIRED` en capa HTTP
2. **P1:** `SmartRedirect` con prioridad `requiresPasswordChange`
3. **Historia A:** Modal credenciales, `useProvisionCliente`, tipos `ClienteCreateResponse` (aprobación explícita pendiente)

---

**Fin del reporte P0.**
