# Auditoría Frontend — Auth: Cambio de Contraseña, Logout, Logout All

**Documento:** `docs/arquitectura/FRONTEND_AUTH_AUDIT.md`  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY (sin cambios de código)  
**Contrato de referencia:** `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` (única fuente de verdad Backend)  
**Alcance:** Cambio de contraseña, Logout, Logout All, Force Password Change y wiring AuthContext asociado  
**Excluido:** Auditoría Backend, Active Sessions admin (salvo relación con logout), Refresh Token interno

---

## 1. Resumen Ejecutivo

El Frontend **ya implementa los tres flujos certificados** del contrato Backend con un grado de madurez alto. La arquitectura post Phase-09 (Provider + Compositors) concentra la lógica en `core/auth/` y expone un shell estable en `shared/context/AuthContext.tsx`.

| Flujo | Estado global | Veredicto |
|-------|---------------|-----------|
| **Logout** (`POST /auth/logout/`) | **Completo** | Alineado con contrato §5 |
| **Logout All** (`POST /auth/logout_all/`) | **Parcial** | Funcional; gaps UX/contrato G3 |
| **Cambio de contraseña obligatorio** (`POST /auth/password/change/`) | **Completo** | Alineado con contrato §4 |
| **Cambio de contraseña voluntario (perfil)** | **No existe** | Fuera del MVP force-password; endpoint reutilizable |
| **Force Password Change (enforcement FE)** | **Completo** | Interceptor + rutas + guards |

**Conclusión:** El Frontend **no requiere implementación greenfield** de los tres endpoints. Los gaps son **ajustes menores** (guard logout_all en force-password, feedback de error, cambio voluntario/SSO opcional, consolidación de servicios). **AuthContext no necesita refactor estructural** — solo wiring puntual en compositors existentes.

---

## 2. Arquitectura Actual

### 2.1 Capas y responsabilidades

```
┌─────────────────────────────────────────────────────────────────┐
│  UI (Pages / Layout / Dialogs)                                  │
│  ChangePasswordPage, Header, LogoutAllConfirmDialog, Login      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ useAuth()
┌───────────────────────────▼─────────────────────────────────────┐
│  Shell público: shared/context/AuthContext.tsx                  │
│  Tipos + re-exports helpers; delega a useAuthProvider()           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Compositors (core/auth/provider/)                              │
│  • auth-provider-public-actions.ts  → logout, completePassword… │
│  • auth-provider-termination.compositor.ts → doLogout, logoutAll│
│  • auth-provider-interceptors.compositor.ts → 403 force-pwd     │
│  • auth-provider-cleanup.ts → wipe local state                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Orquestadores sesión (core/auth/session/)                      │
│  session-terminate.ts, session-logout-all.ts                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Services                                                       │
│  features/auth/services/auth.service.ts → login, logout, change │
│  features/admin/services/session.service.ts → logout_all ⚠      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  API: core/api/axios-instances.ts (withCredentials, X-Client-Type)│
│  Interceptors request/response en auth-provider-interceptors    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Feature flags relevantes

| Flag | Default | Efecto |
|------|---------|--------|
| `VITE_SESSION_TERMINATION_V2_ENABLED` | `true` | Logout vía `terminateSession` (Fase 2) |
| `VITE_SESSION_LOGOUT_V3_ENABLED` | `true` | UI y cuerpo `logoutAllSessions` (Fase 3) |
| `VITE_SESSION_REMOTE_PROBE_ENABLED` | `true` | Probe remoto (no alcance directo) |

### 2.3 Rutas Frontend vs Backend

| Concepto | Ruta FE | Endpoint BE certificado |
|----------|---------|-------------------------|
| Login | `/login` | `POST /api/v1/auth/login/` |
| Force password | `/change-password` | `POST /api/v1/auth/password/change/` |
| Logout | (acción, no ruta) | `POST /api/v1/auth/logout/` |
| Logout all | (acción + dialog) | `POST /api/v1/auth/logout_all/` |

> La ruta FE `/change-password` es pantalla; el servicio usa correctamente `/auth/password/change/` (contrato A1).

---

## 3. Estado AuthContext

### 3.1 Superficie pública (`AuthContextType`)

| Miembro | Estado | Descripción |
|---------|--------|-------------|
| `logout()` | **Completo** | Delega a `doLogout(true)` → `terminateSession` |
| `logoutAllSessions()` | **Completo** | Orquesta `executeLogoutAllFlow` |
| `completePasswordChange(payload)` | **Completo** | Llama `authService.changePassword` + `applyFullSessionToken` |
| `requiresPasswordChange` | **Completo** | Derivado de `user.requires_password_change`, selection preview, exclusiones impersonación/platform_admin/super_admin |
| `setAuthFromLogin` | **Completo** | Post-login; no requiere `/me` extra tras change |

### 3.2 Implementación real

- **Shell:** `src/shared/context/AuthContext.tsx` — no contiene lógica; delega a `useAuthProvider()`.
- **Acciones públicas:** `src/core/auth/provider/auth-provider-public-actions.ts`
- **Terminación:** `src/core/auth/provider/auth-provider-termination.compositor.ts`
- **Interceptors:** `src/core/auth/provider/auth-provider-interceptors.compositor.ts`
- **Cleanup:** `src/core/auth/provider/auth-provider-cleanup.ts`

### 3.3 Impacto sobre AuthContext para cerrar gaps

| Gap | ¿Requiere cambiar shell AuthContext? | Dónde actuar |
|-----|--------------------------------------|--------------|
| Guard logout_all + force-password | **No** | `Header.tsx` y/o `auth-provider-termination.compositor.ts` |
| Toast error logout_all | **No** | `Header.tsx` o compositor termination |
| SSO ocultar cambio contraseña | **No** | `UserData` + `ChangePasswordPage` / menú perfil |
| Mover `logout_all` a auth.service | **No** | `session.service.ts` → `auth.service.ts` + import en compositor |
| Cambio voluntario | **No** | Nueva página/hook; reutiliza `completePasswordChange` |

**Veredicto AuthContext:** La API pública ya expone todo lo necesario. **Impacto bajo** — cambios en compositors/UI, no en contrato del shell.

---

## 4. Estado Logout

### 4.1 Resumen

| Criterio | Estado |
|----------|--------|
| Endpoint correcto | ✅ `POST /auth/logout/` |
| `withCredentials: true` | ✅ `axios-instances.ts` |
| `X-Client-Type: web` | ✅ headers por defecto + `authHeaders()` |
| Bearer opcional (blacklist access) | ✅ interceptor request adjunta token si existe |
| Fail-soft (siempre limpiar local) | ✅ `authService.logout` catch + `invokeBestEffort` en terminate |
| Wipe AuthContext + RQ cache | ✅ `performLocalAuthCleanup` + `queryClient.clear()` |
| Redirect login | ✅ `terminateSession` → `redirectToLogin` |
| Whitelist force-password | ✅ `shouldSkipPasswordChangeRedirect` incluye `/auth/logout` |
| UI usuario | ✅ Header «Cerrar Sesión», ChangePasswordPage, impersonation exit |

### 4.2 Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `src/features/auth/services/auth.service.ts` | `logout()` — POST best-effort |
| `src/core/auth/provider/auth-provider-termination.compositor.ts` | `doLogout`, wiring legacy |
| `src/core/auth/session/session-terminate.ts` | Orquestador T0→T3 |
| `src/core/auth/provider/auth-provider-public-actions.ts` | `logout()` público; impersonation branch |
| `src/core/auth/provider/auth-provider-cleanup.ts` | Limpieza estado local |
| `src/core/auth/provider/auth-provider-interceptors.compositor.ts` | Bearer en request |
| `src/shared/components/layout/Header.tsx` | Botón logout menú usuario |

### 4.3 Qué hace actualmente

1. Usuario invoca `logout()` desde Header o ChangePasswordPage.
2. Si impersonación activa → `endImpersonationHandler()` (no llama logout BE del tenant impersonado en ese camino).
3. Si no → `doLogout(true)` con reason `MANUAL_LOGOUT`.
4. `terminateSession`: rechaza cola refresh, llama `authService.logout()` (best-effort), limpia auth/RQ/branding/selection store, toast opcional, redirect `/login`.
5. Interceptor adjunta `Authorization: Bearer` al logout si hay token en memoria.

### 4.4 Qué falta

| Item | Severidad | Notas |
|------|-----------|-------|
| Mobile `refresh_token` en body | N/A | Proyecto web; contrato §5.2 mobile no aplica |
| Eliminar redirect redundante | Baja | `ChangePasswordPage.handleLogout` hace `navigate('/login')` tras `logout()` que ya redirige |
| Documentar contrato `{ message }` | Baja | FE ignora body (correcto según §5.12) |

### 4.5 Backend que consume

Contrato §5: `POST /api/v1/auth/logout/`, body `{}`, cookie refresh automática, respuesta `{ "message": "Logout successful" }`.

### 4.6 Reutilizable / Modificar

- **Reutilizar:** `terminateSession`, `authService.logout`, `performLocalAuthCleanup`, interceptor request.
- **Modificar (opcional):** quitar `navigate` duplicado en `ChangePasswordPage`.

---

## 5. Estado Logout All

### 5.1 Resumen

| Criterio | Estado |
|----------|--------|
| Endpoint correcto (`logout_all` underscore) | ✅ |
| Bearer obligatorio | ✅ vía interceptor |
| Confirmación UX previa | ✅ `LogoutAllConfirmDialog` |
| POST → wipe local → redirect | ✅ `executeLogoutAllFlow` + `callServer: false` en terminate |
| No parsear conteo de `message` | ✅ |
| Bloqueo force-password (G3) | ⚠ **Parcial** — no oculta opción ni guard en runtime |
| Manejo 401/403/500 | ⚠ **Parcial** — error propagado; sin toast usuario en Header |
| Impersonación bloqueada | ✅ toast + early return |
| Selección empresa pendiente bloqueada | ✅ toast + early return |
| Flag rollback V3 | ✅ `SESSION_LOGOUT_V3_ENABLED` |

### 5.2 Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `src/features/admin/services/session.service.ts` | `logoutAllSessions()` HTTP ⚠ ubicación admin |
| `src/core/auth/session/session-logout-all.ts` | Orquestador puro |
| `src/core/auth/provider/auth-provider-termination.compositor.ts` | `logoutAllSessions` wiring |
| `src/core/auth/provider/auth-provider-termination.helpers.ts` | `buildLogoutAllTerminateInput`, DI factory |
| `src/features/auth/components/LogoutAllConfirmDialog.tsx` | ConfirmDialog destructivo |
| `src/shared/components/layout/Header.tsx` | Menú usuario + pending state |
| `src/shared/context/AuthContext.tsx` | Expone `logoutAllSessions` |

### 5.3 Qué hace actualmente

1. Header muestra «Cerrar sesión en todos los dispositivos» si `SESSION_LOGOUT_V3_ENABLED && isAuthenticated && !isImpersonation && !requiereSeleccionEmpresa`.
2. Usuario confirma en `LogoutAllConfirmDialog` (variant `danger`).
3. `logoutAllSessions()` → guard single-flight → `POST /auth/logout_all/` → `terminateSession` con `callServer: false` (evita doble logout).
4. Limpieza local agresiva + redirect login (access residual ignorado — alineado §6.12 R1).

### 5.4 Qué falta

| Item | Contrato | Acción FE pendiente |
|------|----------|---------------------|
| **No invocar con `requires_password_change=true`** | §6.13 G3, §7.3, checklist §11 | Añadir `!requiresPasswordChange` a `showLogoutAllOption`; guard en `logoutAllSessions` |
| Toast error en 403 `PASSWORD_CHANGE_REQUIRED` | §6.5 | Mensaje orientativo: «Use cerrar sesión simple» |
| Toast error genérico 401/500 | §6.4 | `getErrorMessage` + toast en Header catch |
| Consolidar servicio en auth layer | Arquitectura | Mover API call a `auth.service.ts` |
| Éxito opcional con `message` backend | §6.3 G2 | Toast info opcional (no parsear N) |

### 5.5 Backend que consume

Contrato §6: `POST /api/v1/auth/logout_all/`, sin body, Bearer obligatorio, respuesta `{ "message": "..." }`.

### 5.6 Reutilizable / Modificar

- **Reutilizar:** `executeLogoutAllFlow`, `LogoutAllConfirmDialog`, `ConfirmDialog`, `terminateSession`, guards impersonación/selección.
- **Modificar:** `Header.tsx` (visibilidad + error UX), `auth-provider-termination.compositor.ts` (guard force-password), opcionalmente ubicación del service.

---

## 6. Estado Cambio de Contraseña

### 6.1 Resumen por sub-flujo

| Sub-flujo | Estado |
|-----------|--------|
| Force password (obligatorio post-login) | **Completo** |
| Cambio voluntario desde perfil/configuración | **No existe** |
| SSO — ocultar UI | **No existe** |
| Validación complejidad FE | **Completo** (8+, mayúscula, minúscula, número) |
| Post-200 actualizar tokens sin `/me` | **Completo** vía `applyFullSessionToken` |
| Selection token (Schema A) | **Completo** — bearer fallback en `completePasswordChange` |
| Whitelist interceptor | **Completo** |

### 6.2 Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `src/features/auth/services/auth.service.ts` | `changePassword()` |
| `src/core/auth/provider/auth-provider-public-actions.ts` | `completePasswordChange`, `requiresPasswordChange` |
| `src/features/auth/pages/ChangePasswordPage.tsx` | Formulario force-password |
| `src/features/auth/pages/Login.tsx` | Redirect post-login |
| `src/shared/components/SmartRedirect.tsx` | Prioridad force-password en `/` |
| `src/shared/components/ProtectedRoute.tsx` | Redirect ERP → `/change-password` |
| `src/core/auth/provider/auth-provider-interceptors.compositor.ts` | 403 `PASSWORD_CHANGE_REQUIRED` |
| `src/core/api/auth-http.utils.ts` | Whitelist rutas |
| `src/core/services/error.service.ts` | `isPasswordChangeRequired`, `getErrorMessage` |
| `src/features/auth/types/auth.types.ts` | `PasswordChangeRequest`, `ERROR_CODE_PASSWORD_CHANGE_REQUIRED` |
| `src/features/auth/routes.tsx` | Ruta `/change-password` (sin ProtectedRoute padre) |

### 6.3 Qué hace actualmente

**Detección force-password:**
- Login Schema A/B → redirect `/change-password`
- `requiresPasswordChange` en AuthContext (user + selection preview)
- Interceptor 403 + `error_code: PASSWORD_CHANGE_REQUIRED` → sync flag + `window.location.assign('/change-password')`
- `ProtectedRoute` bloquea ERP si flag activo
- Menú ERP omitido (`shouldSkipErpMenuLoad` cuando flag true)

**Ejecución cambio:**
- Formulario con validación cliente alineada a Pydantic §4.7
- `completePasswordChange({ current_password, new_password })`
- `authService.changePassword` con Bearer explícito + `X-Client-Type: web`
- Respuesta `Token` → `applyFullSessionToken` → `requires_password_change: false`, refresh cookie web
- Post-éxito: navegación selección empresa / onboarding / home según estado

**Logout alternativo en force-password:**
- ChangePasswordPage ofrece «Cerrar sesión» → `logout()` (whitelist §7.3 ✅)

### 6.4 Qué falta

| Item | Contrato | Estado |
|------|----------|--------|
| Ocultar cambio para usuarios SSO | §4.5, §4.12.5 | **Falta** — `UserData` no incluye `proveedor_autenticacion` |
| Pantalla cambio voluntario | Implícito uso endpoint | **Falta** — menú «Configuraciones de la cuenta» sin handler |
| Hook dedicado `useChangePassword` | — | **No existe** (lógica en page + AuthContext) |
| Manejo explícito 400 SSO | §4.5 | Parcial — `getErrorMessage` muestra detail; sin prevención UI |
| `credentials: 'include'` explícito en changePassword | §4.8 | Cubierto por instancia global `withCredentials: true` |

### 6.5 Backend que consume

Contrato §4: `POST /api/v1/auth/password/change/`, body `{ current_password, new_password }`, Bearer, respuesta `Token` con `requires_password_change: false`.

### 6.6 Reutilizable / Modificar

- **Reutilizar:** `ChangePasswordPage` (extraer form), `validateNewPassword`, `completePasswordChange`, `getErrorMessage`, `ConfirmDialog` (no aplica), tokens Capa 1/2 en inputs.
- **Modificar:** `ChangePasswordPage` o nueva ruta para modo voluntario; `UserData` si BE expone `proveedor_autenticacion` en `/me`; Header menú perfil.

---

## 7. Servicios Existentes

| Servicio | Método | Ruta | Alineación contrato |
|----------|--------|------|---------------------|
| `authService.login` | POST | `/auth/login/` | Fuera alcance |
| `authService.logout` | POST | `/auth/logout/` | ✅ §5 |
| `authService.changePassword` | POST | `/auth/password/change/` | ✅ §4 |
| `authService.refreshToken` | POST | `/auth/refresh/` | Whitelist force-pwd |
| `authService.me` | GET | `/auth/me/` | Whitelist force-pwd |
| `logoutAllSessions` (session.service) | POST | `/auth/logout_all/` | ✅ §6 — ⚠ módulo admin |

**Axios:** `apiCentral` con `withCredentials: true`, timeout 30s, header `X-Client-Type: web`.

**Interceptors:**
- Request: inyecta Bearer si token presente y no es endpoint público/skip.
- Response: force-password redirect, refresh 401, impersonation exit, terminación clasificada.

**React Query:** `queryClient.clear()` en login/applyFullSessionToken y terminate; invalidación ORG/INV en login.

---

## 8. Componentes Reutilizables

| Componente / Utilidad | Ubicación | Reutilizable para |
|----------------------|-----------|-------------------|
| `ConfirmDialog` | `shared/components/ui/ConfirmDialog.tsx` | Confirmaciones destructivas (logout all ya lo usa) |
| `LogoutAllConfirmDialog` | `features/auth/components/LogoutAllConfirmDialog.tsx` | Logout all — listo |
| `ChangePasswordPage` form + `validateNewPassword` | `features/auth/pages/ChangePasswordPage.tsx` | Extraer a form compartido cambio voluntario |
| `getErrorMessage` / `isPasswordChangeRequired` | `core/services/error.service.ts` | Errores auth unificados |
| `shouldSkipPasswordChangeRedirect` | `core/api/auth-http.utils.ts` | Whitelist interceptor |
| `terminateSession` / `session-logout-all` | `core/auth/session/` | Cualquier terminación |
| `LoginBrandingHeader` | `features/auth/pages/LoginBrandingHeader.tsx` | Branding en pantallas auth |
| `toast` (react-hot-toast) | global | Feedback éxito/error |
| `LoadingSpinner` / `Loader` | shared | Estados loading |

---

## 9. Componentes Faltantes

| Componente | Prioridad | Notas |
|------------|-----------|-------|
| Formulario cambio contraseña voluntario | Media | Reutilizar lógica `ChangePasswordPage` sin gate `requiresPasswordChange` |
| Entrada menú perfil «Cambiar contraseña» | Media | Header tiene stub «Configuraciones de la cuenta» sin `onClick` |
| Guard UI logout_all + force-password | **Alta** | Contrato G3 — evitar 403 |
| Toast error logout_all | Media | UX §6.12 |
| Detección SSO en perfil auth | Media | Campo API o inferencia; ocultar cambio |
| Hook `useChangePassword` (opcional) | Baja | Encapsular mutation RQ si se añade cambio voluntario |
| Constantes centralizadas rutas auth | Baja | Parcialmente en `auth.types.ts` |

---

## 10. Impacto Arquitectónico

### 10.1 AuthContext

| Área | Impacto | Detalle |
|------|---------|---------|
| API pública | **Ninguno** | Métodos ya expuestos |
| Compositors | **Bajo** | Guard logout_all; opcional mover HTTP |
| Shell imports | **Ninguno** | Baseline V1 P-01 preservado |

### 10.2 Protected Routes

| Componente | Estado actual | Impacto |
|------------|---------------|---------|
| `ProtectedRoute` | Redirect force-password ✅ | Sin cambios |
| `/change-password` | Fuera de ProtectedRoute; guard interno ✅ | Sin cambios |
| `AuthGate` | Bootstrap only | Sin cambios |
| `PermissionGuard` | No aplica a auth routes | Sin cambios |

### 10.3 Interceptors

| Comportamiento | Alineación §7.3 |
|----------------|-----------------|
| Whitelist change, logout, me, refresh, seleccionar | ✅ |
| logout_all **no** en whitelist | ✅ Correcto (BE bloquea) |
| FE debe evitar llamar logout_all en force-pwd | ⚠ Pendiente guard UI |

### 10.4 React Query / Cache

- Logout y logout_all: `queryClient.clear()` vía terminate ✅
- Change password: clear en `applyFullSessionToken` ✅
- **Impacto adicional:** ninguno

### 10.5 Tokens

| Evento | Comportamiento |
|--------|----------------|
| Login | access memoria; refresh cookie |
| Change password | Nuevo access; refresh cookie actualizada |
| Logout | Wipe access; cookie refresh limpiada (BE + fallback FE) |
| Logout all | Wipe local; access residual ignorado |

### 10.6 User Menu / Configuración

- Logout y logout all: **implementados** en `Header.tsx`
- Perfil, bandeja, configuración: **stubs sin navegación**
- «Mis sesiones» → `/app/cuenta/sesiones` ✅

---

## 11. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación actual | Gap |
|----|--------|-------|---------|---------------------|-----|
| R-FE1 | Usuario en force-password invoca logout_all → 403 | Media | Bajo | Ninguna | Ocultar opción + guard |
| R-FE2 | Access válido post-logout_all | Alta (by design) | Medio | Redirect + wipe inmediato | ✅ Cubierto |
| R-FE3 | Errores auth sin `error_code` uniforme | Alta | Bajo | `getErrorMessage` lee `detail` | ✅ Cubierto |
| R-FE4 | SSO intenta cambiar contraseña → 400 | Media | Bajo | Error en formulario | Falta prevención UI |
| R-FE5 | logout_all API en módulo admin | Baja | Bajo | Funciona | Confusión mantenimiento |
| R-FE6 | Flag V3=false desactiva logout all silenciosamente | Baja | Medio | Documentado en flags | Operaciones deben conocer env |
| R-FE7 | Doble redirect logout en ChangePasswordPage | Baja | Muy bajo | Harmless race | Limpieza cosmética |

---

## 12. Recomendaciones

### 12.1 Prioridad alta (contrato)

1. **Ocultar y bloquear logout_all cuando `requiresPasswordChange === true`** (Header + compositor).
2. **Toast orientativo** si logout_all falla con 403 `PASSWORD_CHANGE_REQUIRED`.

### 12.2 Prioridad media (producto)

3. **Pantalla o modal cambio voluntario** reutilizando `completePasswordChange`.
4. **SSO:** ocultar entrada cambio contraseña cuando `proveedor_autenticacion !== 'local'` (requiere campo en `/me` o login).
5. **Mover `logoutAllSessions` HTTP** a `auth.service.ts` por cohesión dominio auth.

### 12.3 Prioridad baja (higiene)

6. Eliminar `navigate('/login')` redundante en `ChangePasswordPage.handleLogout`.
7. Toast éxito opcional post-logout_all con `message` backend (sin parsear número).
8. Constante compartida `AUTH_ROUTES` para paths servicio + whitelist.

### 12.4 No recomendado en esta fase

- Refactor estructural AuthContext / compositors (Baseline V1).
- Cambios de contrato API.
- Implementar flujo mobile `refresh_token` en body (fuera scope web).

---

## 13. Matriz

| Flujo | Estado | Reutilizable | Impacto AuthContext | Complejidad cierre gaps |
|-------|--------|--------------|---------------------|-------------------------|
| **Logout dispositivo actual** | Completo | `terminateSession`, `authService.logout`, Header | Ninguno | **Baja** |
| **Logout all dispositivos** | Parcial | `LogoutAllConfirmDialog`, `executeLogoutAllFlow`, Header | Bajo (guard compositor) | **Baja** |
| **Change password obligatorio** | Completo | `ChangePasswordPage`, `completePasswordChange`, interceptor | Ninguno | **N/A** |
| **Change password voluntario** | No existe | Form + `completePasswordChange` | Ninguno (nueva UI) | **Media** |
| **Force password enforcement** | Completo | `ProtectedRoute`, SmartRedirect, interceptor | Ninguno | **N/A** |
| **SSO hide change password** | No existe | `UserData`, Header | Bajo (tipo + UI) | **Media** (depende API) |

---

## 14. Dictamen Final

### 14.1 Checklist contrato (`AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` §11)

#### Cambio de contraseña

- [x] Ruta: `POST /api/v1/auth/password/change/`
- [x] Header `Authorization: Bearer`
- [x] Web: `credentials: 'include'` (instancia Axios)
- [x] Body: `{ current_password, new_password }`
- [x] Validar complejidad FE
- [x] Manejar 401/400/422 vía `getErrorMessage`
- [x] Tras 200: reemplazar tokens; `requires_password_change = false`
- [x] Excluir ruta del interceptor force-password
- [ ] Ocultar UI usuarios SSO

#### Logout

- [x] Ruta: `POST /api/v1/auth/logout/`
- [x] Web: cookie refresh + credentials
- [x] Bearer opcional vía interceptor
- [x] Limpiar AuthContext; redirect login
- [x] Whitelist force-password

#### Logout All

- [x] Ruta: `POST /api/v1/auth/logout_all/`
- [x] Bearer obligatorio
- [x] Confirmación UX previa
- [x] Tras 200: wipe + redirect
- [ ] **No invocar** si `requires_password_change=true`
- [x] Manejar 401/403/500 (propagación; falta UX toast)

#### AuthContext global

- [x] Interceptor 403 `PASSWORD_CHANGE_REQUIRED`
- [x] Whitelist rutas §7.3 (excepto logout_all — correcto no whitelist)
- [ ] SSO: ocultar cambio de contraseña
- [x] Impersonación: contexto y guards

### 14.2 Veredicto global

# **B) Requiere refactor menor**

**Justificación:**

Los tres flujos certificados por Backend **están implementados y operativos** en Frontend. Logout y cambio de contraseña obligatorio alcanzan estado **Completo** respecto al contrato. Logout All es **Parcial** únicamente por el gap contractual G3 (visibilidad/ejecución durante force-password) y feedback de error UX.

No se requiere:
- Reescritura de AuthContext
- Nuevo stack HTTP
- Cambios Backend

Sí se requiere:
- Ajustes puntuales en UI/compositors (estimación baja complejidad)
- Producto opcional: cambio voluntario y SSO (media complejidad, fuera del MVP force-password pero alineado §4.12)

**El Frontend está listo para consumo de los contratos certificados**, con observaciones menores documentadas en §12 antes de considerar el cierre de sprint auth.

---

*Auditoría READ ONLY — 2026-06-24.*  
*Evidencia: código en `src/features/auth/`, `src/core/auth/`, `src/shared/context/`, `src/shared/components/layout/`.*  
*Contrato: `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md`.*
