# IAM Session Management — Documentación Oficial Frontend V1

**Ticket:** IAM-FE-DOCS-SESSION-V1  
**Versión arquitectónica:** V1  
**Estado del dominio:** Documentado según código desplegado  
**Fecha:** 2026-06-19  
**Fase del proyecto:** IAM Session Management Frontend — documentación de referencia  
**Audiencia:** Desarrollo frontend, integradores, soporte técnico  

> Este documento describe **únicamente** el comportamiento implementado en el código actual del frontend.  
> No incluye propuestas de cambio, TODOs ni comportamiento aspiracional.  
> Fuente normativa backend de referencia: `IAM_SESSION_MANAGEMENT_V2.md`.

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura general](#2-arquitectura-general)
3. [Componentes del dominio](#3-componentes-del-dominio)
4. [Flujo Login](#4-flujo-login)
5. [Flujo Refresh](#5-flujo-refresh)
6. [Flujo Logout](#6-flujo-logout)
7. [Logout All](#7-logout-all)
8. [Session Expired e Idle Timeout](#8-session-expired-e-idle-timeout)
9. [Cambiar Empresa](#9-cambiar-empresa)
10. [Seleccionar Empresa](#10-seleccionar-empresa)
11. [Tenant](#11-tenant)
12. [Subdominios](#12-subdominios)
13. [Almacenamiento](#13-almacenamiento)
14. [React Query](#14-react-query)
15. [Interceptores Axios](#15-interceptores-axios)
16. [Sincronización entre pestañas](#16-sincronización-entre-pestañas)
17. [UX actual](#17-ux-actual)
18. [Contrato con Backend](#18-contrato-con-backend)
19. [Limitaciones conocidas](#19-limitaciones-conocidas)
20. [Diagramas](#20-diagramas)
21. [Glosario](#21-glosario)
22. [Estado del dominio](#22-estado-del-dominio)

---

## 1. Introducción

### Objetivo

El dominio **Session Management Frontend** del ERP CAXIS gestiona en el cliente web:

- Ciclo de vida de la sesión de usuario (login, bootstrap, refresh, logout).
- Almacenamiento y transporte de tokens (access en memoria, refresh en cookie HttpOnly).
- Derivación de contexto operativo: tenant (`cliente_id`), empresa activa (`empresa_id`), permisos y menú.
- Integración con React Query, branding dinámico e impersonación Platform Admin.
- Protección de rutas y gates de arranque.

### Problemas que resuelve

| Problema | Mecanismo frontend |
|----------|-------------------|
| Persistencia de sesión sin re-login en F5 | Bootstrap `POST /auth/refresh/` + cookie HttpOnly |
| Requests autenticados | Interceptor request → `Authorization: Bearer` |
| Access expirado durante uso | Interceptor response 401 → refresh single-flight + cola |
| Multi-empresa post-login | Schema A: selection token en localStorage + `POST /auth/empresa/seleccionar/` |
| Cambio de empresa sin recargar | `POST /auth/empresa/cambiar/` → `applyFullSessionToken` |
| Multi-tenant por subdominio | `tenantResolver` + `TenantProvider` |
| Platform Admin → ERP soporte | `platform_parent_session` + impersonación |
| Datos obsoletos tras cambio sesión | `queryClient.clear()` + invalidación ORG/INV |

### Qué garantiza (frontend)

- Access token **solo en memoria** React (`AuthContext` state + `authRef`).
- Refresh token **solo vía cookie** HttpOnly (`withCredentials: true`); borrado client-side en logout.
- Usuario operativo derivado de **`GET /auth/me`** tras sesión completa (no del body de login como fuente primaria).
- Un único refresh concurrente global (`isRefreshingPromise` module-level) con cola de requests.
- Transiciones de sesión completa invalidan caché React Query agresivamente.
- `X-Client-Type: web` en todos los endpoints de auth del servicio canónico.

### Qué NO garantiza (frontend)

- Sincronización de access token entre pestañas del mismo origen.
- Re-hidratación de usuario/empresa tras refresh interceptor (solo actualiza token y `requires_password_change`).
- UI de logout all para el usuario final (servicio HTTP existe; sin consumidor en componentes).
- Detección proactiva de idle timeout (transparente vía 401 del backend).
- Soporte cliente mobile (`X-Client-Type: mobile` + refresh en body).
- Manejo global de HTTP 429.
- Redirect explícito a `/login` desde `doLogout` (delegado a `ProtectedRoute`).

---

## 2. Arquitectura general

### Stack

| Tecnología | Rol en sesión |
|------------|---------------|
| React 18 + TypeScript | UI y providers |
| Axios (`apiCentral`) | HTTP central; auth siempre por instancia central |
| React Query (`@tanstack/react-query`) | Server state; invalidación en transiciones |
| Zustand + persist | Selection token multi-empresa (localStorage) |
| React Context | Auth, Tenant, Permission, Theme |

### Diagrama ASCII — arquitectura completa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AppProviders (provider.tsx)                        │
│  QueryClientProvider                                                         │
│    └─ ThemeProvider                                                          │
│         └─ AuthProvider ───────────── interceptores + bootstrap + sesión    │
│              └─ AuthGate ──────────── bloquea hasta isBootstrapped          │
│                   └─ TenantProvider ─ tenantId, subdomain, BC sync          │
│                        └─ PermissionProvider ─ GET /auth/permissions/me     │
│                             └─ AppReadyGate ─ auth + permission loading     │
│                                  └─ BrandingInitializer                     │
│                                       └─ Router / páginas                   │
└─────────────────────────────────────────────────────────────────────────────┘

         ┌──────────────┐     Bearer access      ┌──────────────────┐
         │  Componentes │ ─────────────────────► │  apiCentral      │
         │  + hooks RQ  │                        │  (axios-instances)│
         └──────┬───────┘                        └────────┬─────────┘
                │                                         │
                │ useAuth()                               │ withCredentials
                ▼                                         ▼
         ┌──────────────┐     cookie refresh      ┌──────────────────┐
         │ AuthContext  │ ◄────────────────────── │  Backend IAM     │
         │ token+user   │   POST /auth/refresh/   │  /api/v1/auth/*  │
         └──────────────┘                         └──────────────────┘
```

### Orden de providers (canónico)

Archivo: `src/app/provider.tsx`

```
QueryClientProvider
  → ThemeProvider
    → AuthProvider          (registra interceptores; ejecuta bootstrap)
      → AuthGate            (isBootstrapped)
        → TenantProvider    (tenantId desde JWT/user)
          → PermissionProvider
            → AppReadyGate    (authLoading + permissionLoading)
              → BrandingInitializer
                → App
```

**Regla:** Auth → Tenant → Permission. Sin `key` en providers para evitar desmontaje accidental.

### Modelo de tokens (implementado)

| Token | Almacenamiento | Transporte |
|-------|----------------|------------|
| Access JWT | Memoria (`AuthContext` state + `authRef`) | Header `Authorization: Bearer` |
| Refresh JWT | Cookie HttpOnly `refresh_token` | Automático `withCredentials` |
| Selection token (Schema A) | localStorage vía Zustand persist | Header explícito en `apiSelection` |
| Platform parent access | sessionStorage `platform_parent_session` | Restauración local |
| Impersonation support access | sessionStorage `impersonation_support_session` | Rehidratación F5 |

---

## 3. Componentes del dominio

### 3.1 AuthContext / AuthProvider

**Archivo:** `src/shared/context/AuthContext.tsx` (~1768 líneas)

| Export | Rol |
|--------|-----|
| `AuthProvider` | Provider raíz de sesión |
| `useAuth()` | Hook consumidor; lanza error fuera del provider |

**Estado principal:**

| Estado | Tipo | Fuente |
|--------|------|--------|
| `auth.token` | `string \| null` | Login, refresh, bootstrap, applyFullSessionToken |
| `auth.user` | `UserData \| null` | `GET /auth/me` vía `initializeAuth` |
| `empresaActivaId` | `string \| null` | `syncEmpresaSession` (user + JWT claims) |
| `menuModulos` | `AuthMenuModulo[] \| null` | `GET /auth/menu` |
| `permissions` | `UserPermissions \| null` | Indexado desde menú |
| `menuPermissionsReady` | `boolean` | Gate para `PermissionGuard` |
| `clienteInfo` | `ClienteInfo \| null` | `user.cliente` |
| Flags impersonación | boolean + strings | JWT claims `is_impersonation` |

**Funciones públicas clave:**

| Función | Endpoint / acción |
|---------|-------------------|
| `setAuthFromLogin` | Login Schema B → `applyFullSessionToken` |
| `completeEmpresaSelection` | `POST /auth/empresa/seleccionar/` |
| `cambiarEmpresaActiva` | `POST /auth/empresa/cambiar/` |
| `logout` | `POST /auth/logout/` o `endImpersonation` |
| `completePasswordChange` | `POST /auth/password/change/` |
| `startImpersonation` | `POST /auth/impersonate/{cliente_id}/` |
| `endImpersonation` | `POST /auth/impersonate/end/` + restore parent |
| `reloadMenuAndPermissions` | Re-fetch `GET /auth/menu` |

**Concurrencia global (module-level):**

```typescript
let isRefreshingPromise: Promise<string> | null = null;
const failedQueueRef = useRef<Array<{ resolve; reject }>>([]);
```

### 3.2 AuthGate

**Archivo:** `src/core/auth/AuthGate.tsx`

Bloquea el árbol de router hasta `isBootstrapped === true`. Muestra `LoadingSpinner` con mensaje "Verificando sesión...".

### 3.3 authService (canónico)

**Archivo:** `src/features/auth/services/auth.service.ts`

| Método | HTTP | Instancia | Notas |
|--------|------|-----------|-------|
| `login` | `POST /auth/login/` | `api` | form-urlencoded; `X-Client-Type: web` |
| `me` | `GET /auth/me/` | `api` | Normaliza `UserData` |
| `logout` | `POST /auth/logout/` | `api` | Idempotente; errores logueados |
| `refreshToken` | `POST /auth/refresh/` | `api` | Retorna `access_token` string |
| `seleccionarEmpresa` | `POST /auth/empresa/seleccionar/` | `apiSelection` | Bearer selection_token |
| `cambiarEmpresa` | `POST /auth/empresa/cambiar/` | `api` | Body `{ empresa_id }`; cookie refresh |
| `startImpersonation` | `POST /auth/impersonate/{id}/` | `api` | Schema A o B |
| `endImpersonation` | `POST /auth/impersonate/end/` | `api` | Bearer token impersonado |
| `changePassword` | `POST /auth/password/change/` | `api` | Bearer access o selection |

**Legacy (no usado por AuthContext):** `src/services/auth.service.ts`, `src/services/api.ts`.

### 3.4 Axios

| Archivo | Export | Interceptores auth |
|---------|--------|-------------------|
| `src/core/api/api.ts` | `api` (= `apiCentral`) | Registrados por AuthContext |
| `src/core/api/axios-instances.ts` | `apiCentral`, `apiSelection`, `createLocalApi` | Solo 5xx/timeout toast en locales |
| `src/core/api/auth-http.utils.ts` | Utilidades skip/bypass | Sin interceptores |

**Configuración `apiCentral`:**

- `baseURL`: `DEFAULT_API_BASE_URL`
- `withCredentials: true`
- `timeout: 30000`
- Headers default: `Content-Type: application/json`, `X-Client-Type: web`

### 3.5 Hooks de sesión

| Hook | Archivo | Rol |
|------|---------|-----|
| `useAuth` | `AuthContext.tsx` | Sesión completa |
| `useEmpresaActiva` | `features/auth/hooks/useEmpresaActiva.ts` | Thin wrapper empresa |
| `useOrgSessionScope` | `features/org/hooks/useOrgSessionScope.ts` | `scopeEmpresaId` + invalidación ORG |
| `useInvSessionScope` | `features/inv/hooks/useInvSessionScope.ts` | `scopeEmpresaId` + invalidación INV |
| `useImpersonation` | `features/auth/hooks/useImpersonation.ts` | UI enter/exit soporte |
| `usePermissions` | `core/auth/hooks/usePermissions.ts` | `can()` desde menú AuthContext |
| `usePermission` | `PermissionContext.tsx` | `hasPermission()` códigos string |
| `useTenant` | `TenantContext.tsx` | `tenantId`, `subdomain` |
| `useBranding` | `features/tenant/hooks/useBranding.ts` | Branding runtime |

### 3.6 Gates de query (company-scoped)

| Gate | Archivo |
|------|---------|
| `useOrgCompanyQueryGate` | `features/org/hooks/org-company-query-gate.ts` |
| `useInvCompanyQueryGate` | `features/inv/hooks/inv-company-query-gate.ts` |

Patrón: `enabled = canQueryCompanyScoped && !!scopeEmpresaId`.

### 3.7 Rutas protegidas

| Componente | Archivo | Rol |
|------------|---------|-----|
| `ProtectedRoute` | `shared/components/ProtectedRoute.tsx` | Auth, password, empresa, roles |
| `PermissionGuard` | `app/router/guards/PermissionGuard.tsx` | LBAC vía `menuPermissionsReady` |
| `OrgCompanyRouteGuard` | `features/org/components/guards/OrgCompanyRouteGuard.tsx` | Scope empresa ORG |
| `SmartRedirect` | `shared/components/SmartRedirect.tsx` | Redirect raíz `/` |

### 3.8 Empresa — stores y utilidades

| Componente | Archivo |
|------------|---------|
| `useEmpresaSelectionStore` | `features/auth/stores/empresa-selection.store.ts` |
| `waitForEmpresaSelectionHydration` | `features/auth/stores/empresa-selection-hydration.ts` |
| `empresa-access.ts` | `canAccessErp`, `shouldSelectEmpresa`, `shouldOnboardEmpresa` |
| `empresa-eligibles.ts` | Normalización listas empresa |
| `session-token.ts` | `isSelectionPendingToken`, `canInitializeFullSession` |
| `decodeAccessToken.ts` | Lectura claims JWT client-side |
| `EmpresaSelector` | `shared/components/layout/EmpresaSelector.tsx` |

### 3.9 Tenant

| Componente | Archivo |
|------------|---------|
| `TenantProvider` (activo) | `features/tenant/components/TenantContext.tsx` |
| `TenantProvider` (legacy) | `src/context/TenantContext.tsx` — **no usado** por `provider.tsx` |
| `tenantResolver` | `core/services/tenant-resolver.service.ts` |
| `tenantStoreSync` | `core/stores/tenant-store-sync.ts` |
| `storeRegistry` | `core/stores/store-registry.ts` |

### 3.10 Permisos (dual)

| Sistema | Fuente | Consumidor |
|---------|--------|------------|
| Permisos de ruta (módulo/acción) | `GET /auth/menu` → indexado | `PermissionGuard`, sidebar |
| Permisos granulares (códigos) | `GET /auth/permissions/me` | `usePermission().hasPermission()` |

### 3.11 Branding

| Componente | Archivo | Trigger |
|------------|---------|---------|
| `BrandingInitializer` | `shared/components/BrandingInitializer.tsx` | Pre-login: subdominio; post-login: tenantId |
| `branding.store.ts` | `features/tenant/stores/branding.store.ts` | Cache por tenant + subdominio |
| `branding.utils.ts` | `utils/branding.utils.ts` | CSS runtime Capa 2 |

Branding depende de **tenant** (`cliente_id`), no de `empresa_id`.

### 3.12 Impersonación

| Utilidad | Archivo | Storage |
|----------|---------|---------|
| `platform-parent-session` | `core/auth/utils/platform-parent-session.ts` | sessionStorage |
| `impersonation-support-session` | `core/auth/utils/impersonation-support-session.ts` | sessionStorage |
| `impersonation-session.ts` | `isImpersonationToken()` | JWT claim |
| `ImpersonationSupportBanner` | `shared/components/layout/ImpersonationSupportBanner.tsx` | UI |

### 3.13 Admin sesiones (IAM)

| Componente | Archivo |
|------------|---------|
| `session.service.ts` | `getAdminSessions`, `revokeSessionById`, `getCurrentUserSessions`, `logoutAllSessions` |
| `ActiveSessionsPage.tsx` | UI listado/revocación admin |

---

## 4. Flujo Login

**Página:** `src/features/auth/pages/Login.tsx`  
**Servicio:** `authService.login` → `POST /auth/login/`

### Pasos

```
1. Usuario envía username + password (form-urlencoded)
2. authService.login → POST /auth/login/ (X-Client-Type: web, withCredentials)
3. Backend responde Schema A o Schema B

   Schema A (multi-empresa):
   ├─ LoginEmpresaSelectionResponse (selection_token, empresas_disponibles, user_data)
   ├─ NO hay access_token de sesión completa
   ├─ NO se llama /auth/me ni refresh
   ├─ setPendingSelection → localStorage (Zustand persist)
   ├─ Si requires_password_change → /change-password
   └─ Si no → /app/seleccionar-empresa

   Schema B (sesión completa):
   ├─ Token (access_token + Set-Cookie refresh_token)
   ├─ setAuthFromLogin → applyFullSessionToken
   │    ├─ queryClient.clear() + invalidateOrg/Inv
   │    ├─ token en memoria
   │    ├─ initializeAuth → GET /auth/me
   │    ├─ loadMenuAndPermissionsFromAuthMenu → GET /auth/menu
   │    └─ loadEmpresasElegiblesForSession
   ├─ Routing post-login:
   │    ├─ requires_password_change → /change-password
   │    ├─ onboarding admin sin empresa → /app/onboarding
   │    └─ resolvePostLoginPath → destino ERP o from
   └─ toast "¡Bienvenido!"
```

### Tabla — responsables por paso

| Paso | Componente | Evidencia |
|------|------------|-----------|
| Form submit | `Login.tsx` `handleSubmit` | L72–166 |
| HTTP login | `auth.service.ts` `login` | L100–142 |
| Schema A store | `empresa-selection.store.ts` | key `caxis-empresa-selection-pending` |
| Schema B sesión | `AuthContext.applyFullSessionToken` | L1361–1414 |
| Usuario | `initializeAuth` → `authService.me` | L654–768 |
| Navegación | `resolvePostLoginPath` | `core/routing/post-login-path.ts` |

### Diagrama — Login Schema B

```
[Usuario] → Login.tsx
              │
              ├─► POST /auth/login/
              ├─► Set-Cookie refresh_token (browser)
              ├─► applyFullSessionToken(access_token)
              │       ├─ queryClient.clear()
              │       ├─ token → memoria
              │       ├─ GET /auth/me
              │       └─ GET /auth/menu
              └─► navigate(destino)
```

### Diagrama — Login Schema A

```
[Usuario] → Login.tsx
              │
              ├─► POST /auth/login/
              ├─► selection_token → localStorage
              └─► navigate(/app/seleccionar-empresa)
                  (sin refresh, sin /auth/me)
```

---

## 5. Flujo Refresh

**Endpoint:** `POST /auth/refresh/`  
**Servicio:** `authService.refreshToken`  
**Cookie:** enviada automáticamente (`withCredentials`)

### Dos contextos de refresh

| Contexto | Disparador | Post-refresh |
|----------|------------|--------------|
| **Bootstrap** | Mount AuthProvider (salvo excepciones) | `initializeAuth()` → `/auth/me` + menú |
| **Interceptor 401** | Cualquier request ERP con 401 | Solo actualiza token + `requires_password_change` en user |

### Bootstrap — excepciones (no llama refresh)

| Condición | Comportamiento |
|-----------|----------------|
| Ruta `/login` | `isBootstrapped=true`; sin refresh |
| `hasPendingSelection()` | Sin refresh ni `/auth/me` |
| `hasPlatformParentSession()` + soporte | Rehidrata desde sessionStorage; valida `/auth/me` |
| Modo soporte activo en memoria | Sin refresh cookie plataforma |

### Interceptor 401 — secuencia completa

```
1. Response interceptor captura error.status === 401
2. Verificaciones previas:
   ├─ originalRequest existe
   ├─ URL NO está en shouldSkipTokenRefresh
   ├─ NO es modo soporte (isImpersonationSupportMode)
   └─ originalRequest._retry !== true (anti-loop)
3. Si isRefreshingPromise activo:
   ├─ Encolar en failedQueueRef
   ├─ Esperar nuevo token
   └─ Reintentar request original con Bearer actualizado
4. Si no hay refresh en curso:
   ├─ isRefreshingPromise = authService.refreshToken()
   ├─ Éxito:
   │    ├─ decodeAccessToken → requires_password_change
   │    ├─ setAuth({ token, user parcial })
   │    ├─ processQueue(null, newToken)
   │    └─ Reintentar request original
   └─ Fallo:
        ├─ processQueue(error)
        ├─ doLogout(false)
        └─ reject
5. finally: isRefreshingPromise = null
```

### Single-flight y cola

| Elemento | Scope | Archivo |
|----------|-------|---------|
| `isRefreshingPromise` | Module-level (global al bundle) | `AuthContext.tsx` L89–90 |
| `failedQueueRef` | Por instancia AuthProvider | `AuthContext.tsx` L223–226 |
| `processQueue` | Resuelve/rechaza cola | L524–533 |

### Skip-list (sin refresh automático)

`auth-http.utils.ts` → `shouldSkipTokenRefresh`:

- `/auth/login`
- `/auth/refresh`
- `/auth/empresa/seleccionar`
- `/auth/impersonate`

Adicional en AuthContext: `/auth/password/change`.

### Retry

| Tipo | Comportamiento |
|------|----------------|
| Request original tras refresh OK | `_retry = true`; un reintento con nuevo Bearer |
| Refresh HTTP 500 | Sin retry dedicado; falla → `doLogout(false)` |
| React Query global | `retry: 1` en queries (no en refresh auth) |

### Estados tras refresh interceptor

| Campo | Actualizado |
|-------|-------------|
| `auth.token` | Sí |
| `auth.user.requires_password_change` | Sí (desde JWT) |
| `auth.user` completo | No |
| `empresaActivaId` | No |
| `menuModulos` / `permissions` | No |
| Cookie refresh | Automático (browser Set-Cookie) |
| React Query | No invalida |

### Diagrama — Refresh concurrente (N requests)

```
Request A ──401──► inicia isRefreshingPromise
Request B ──401──► encola en failedQueueRef
Request C ──401──► encola en failedQueueRef
         refresh OK
Request A ◄──newToken── reintenta
Request B ◄──newToken── reintenta (desde cola)
Request C ◄──newToken── reintenta (desde cola)
```

---

## 6. Flujo Logout

**Endpoint:** `POST /auth/logout/`  
**Función interna:** `doLogout(callServer?: boolean)`

### Pasos — `doLogout`

```
1. Si callServer=true → POST /auth/logout/ (errores no bloquean limpieza)
2. document.cookie = 'refresh_token=; expires=...' (borrado client-side)
3. Reset estado:
   ├─ auth → initialAuth
   ├─ accessLevel, userType, clienteInfo → defaults
   ├─ permissions, menuModulos → null
   ├─ empresaActivaId, empresasElegibles → vacío
   ├─ impersonación → clear
   ├─ clearImpersonationSupportSession()
   ├─ clearPlatformParentSession()
   ├─ useEmpresaSelectionStore.clearPendingSelection()
   └─ branding: clearAll(preserveSubdomainCache si pre-login)
4. isRefreshingPromise = null
5. processQueue(new Error('Session expired'))
6. NO navega a /login (ProtectedRoute reacciona a isAuthenticated=false)
```

### Logout público — `logout()`

```
Si impersonación activa O hasPlatformParentSession:
  → endImpersonationHandler() (restore platform)
Si no:
  → doLogout(true)
```

### Impersonación — end

```
1. POST /auth/impersonate/end/ (best-effort)
2. restorePlatformSession():
   ├─ Lee platform_parent_session de sessionStorage
   ├─ queryClient.clear()
   ├─ token + user restaurados
   ├─ initializeAuth()
   └─ Opcional redirect /super-admin/dashboard
```

---

## 7. Logout All

**Endpoint:** `POST /auth/logout_all/`  
**Servicio:** `session.service.ts` → `logoutAllSessions()`

### Estado implementado

| Aspecto | Estado |
|---------|--------|
| Servicio HTTP | Implementado |
| UI consumidora | **No existe** en componentes |
| Post-200 redirect login | **No implementado** |
| Limpieza local tras logout all | **No hay flujo** |

El backend documenta que el access usado en la llamada sigue válido hasta expiración natural; el frontend no tiene flujo que consuma este endpoint.

---

## 8. Session Expired e Idle Timeout

### Session Expired (frontend)

| Trigger | Acción |
|---------|--------|
| Bootstrap refresh 401 | `doLogout(false)` + borrar cookie |
| Interceptor refresh falla | `doLogout(false)` |
| `/auth/me` retorna null en `initializeAuth` | `doLogout(false)` |
| Selection 401/403/409 | `invalidateSelectionSession` o redirect login |
| Support JWT expirado (bootstrap) | Toast + `restorePlatformSession` |

**Sin** modal, página ni mensaje dedicado "Sesión expirada". La redirección a `/login` ocurre cuando `ProtectedRoute` detecta `!isAuthenticated`.

### Idle Timeout

| Aspecto | Frontend |
|---------|----------|
| Timer cliente | **No implementado** |
| Detección | Transparente: backend revoca → refresh 401 |
| UX diferenciada | **No** — mismo flujo que session expired |

---

## 9. Cambiar Empresa

**Endpoint:** `POST /auth/empresa/cambiar/`  
**UI:** `EmpresaSelector` → `cambiarEmpresaActiva`

### Pasos

```
1. Usuario selecciona empresa en EmpresaSelector
2. cambiarEmpresaActiva(empresaId)
3. authService.cambiarEmpresa(empresaId)
   ├─ Body: { empresa_id }
   ├─ Cookie refresh viaja automáticamente (web)
   └─ NO envía refresh_token en body (solo mobile lo haría)
4. applyFullSessionToken(response)
   ├─ queryClient.clear()
   ├─ invalidateOrgQueries + invalidateInvQueries
   ├─ Nuevo access en memoria
   ├─ initializeAuth → /auth/me + /auth/menu
   └─ clearPendingSelection
5. PermissionContext re-fetch por cambio empresaActivaId
6. useOrgSessionScope / useInvSessionScope invalidan por scopeEmpresaId
7. Toast éxito con nombre empresa
8. Sin recarga de página (window.location)
```

### Branding y menú

- **Menú:** recargado vía `loadMenuAndPermissionsFromAuthMenu`.
- **Branding:** sin cambio (ligado a `tenantId`, no `empresa_id`).

---

## 10. Seleccionar Empresa

**Endpoint:** `POST /auth/empresa/seleccionar/`  
**Página:** `SeleccionarEmpresaPage.tsx`  
**Instancia:** `apiSelection` (sin interceptores ERP)

### Pasos

```
1. Login Schema A → selection_token en localStorage
2. navigate(/app/seleccionar-empresa)
3. Bootstrap detecta hasPendingSelection → omite refresh y /auth/me
4. Usuario elige empresa
5. completeEmpresaSelection(empresaId)
   ├─ Bearer: selection_token (header explícito)
   ├─ POST /auth/empresa/seleccionar/ { empresa_id }
   └─ applyFullSessionToken → sesión completa
6. navigate(resolvePostEmpresaSelectionPath)
```

### Errores de selección

| Status | Acción |
|--------|--------|
| 401, 403, 409 | `invalidateSelectionSession` o `restorePlatformSession` (impersonación) → `/login` |
| Otros | Toast error; mensaje en página |

### Rehidratación

`waitForEmpresaSelectionHydration()` bloquea bootstrap hasta que Zustand persist termine de leer localStorage.

---

## 11. Tenant

**Provider:** `features/tenant/components/TenantContext.tsx`

### Derivación de `tenantId`

Prioridad (post `authInitialized`):

```
1. JWT is_impersonation → claims.cliente_id
2. user.cliente_id / user.cliente.cliente_id / clienteInfo.cliente_id
3. JWT claims.cliente_id
4. null
```

**Regla:** Tenant = `cliente_id`. **No** depende de `empresa_activa`.

### Cambio de tenant

```
derivedTenantId cambia
  ├─ invalidatePreviousTenantCache (predicate por tenantId en queryKey)
  ├─ resetStores(tenantId) vía storeRegistry
  ├─ tenantStoreSync.notifyTenantChange (BroadcastChannel)
  ├─ ensureBrandingLoaded(tenantId)
  └─ setTenantIdState
```

### Logout

Cuando `auth.token` → null y no hay tenant derivado:

```
storeRegistry.clearAll()
queryClient.clear()
tenantStoreSync.notifyTenantChange(null)
```

---

## 12. Subdominios

**Servicio:** `core/services/tenant-resolver.service.ts`

### Resolución

| Prioridad | Fuente | Ejemplo |
|-----------|--------|---------|
| 1 | Query param `?subdomain=` | `localhost:5173?subdomain=acme` |
| 2 | Hostname primera parte | `acme.tuapp.com` → `acme` |
| 3 | null | `localhost`, `127.0.0.1`, IPs locales |

### Validación

RFC 1035 simplificado: `[a-z0-9]([a-z0-9-]*[a-z0-9])?`, 3–63 chars.

### Uso

| Contexto | Consumidor |
|----------|------------|
| Pre-login branding | `BrandingInitializer` → `loadBrandingBySubdomain` |
| Login UI contextual | `Login.tsx` + `PLATFORM_LOGIN_SUBDOMAIN` flag |
| Headers auth opcionales | `buildAuthTenantContextHeaders()` si `VITE_AUTH_TENANT_HEADERS=true` |

### Headers tenant (opcionales, desactivados por defecto)

`core/auth/utils/auth-tenant-context.ts`:

- `X-Forwarded-Host`
- `X-Forwarded-Proto`
- `X-Client-Origin`
- `X-Tenant-Subdomain` (si hay subdominio)

---

## 13. Almacenamiento

### Memoria (React state + refs)

| Dato | Componente |
|------|------------|
| `access_token` | `AuthContext` `auth.token` + `authRef` |
| `user` (UserData) | `AuthContext` `auth.user` |
| Menú módulos | `menuModulos` |
| Permisos ruta indexados | `permissions` |
| `empresaActivaId` | state dedicado |
| `empresasElegibles` | state dedicado |
| Flags sesión | `requiereSeleccionEmpresa`, `esAdminCliente`, impersonación |
| `isRefreshingPromise` | Variable module-level |

### Cookies

| Cookie | Gestión |
|--------|---------|
| `refresh_token` | HttpOnly; Set-Cookie del backend; `withCredentials`; borrado manual en logout: `document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970...'` |

El frontend **no lee** el valor del refresh token (HttpOnly).

### localStorage

| Key | Contenido | Mecanismo |
|-----|-----------|-----------|
| `caxis-empresa-selection-pending` | `selectionToken`, `empresasDisponibles`, `userPreview` | Zustand persist |
| `theme` | Modo claro/oscuro | ThemeContext (no sesión) |
| Preferencias UI varias | View modes, paginación | Páginas admin (no sesión) |

### sessionStorage

| Key | Contenido | Ciclo |
|-----|-----------|-------|
| `platform_parent_session` | `{ accessToken, userData, tenantContext? }` | Impersonación: guardar antes de entrar soporte |
| `impersonation_support_session` | `{ accessToken, savedAt }` | Rehidratación F5 en modo soporte |

### IndexedDB

**No utilizado** para session management.

### secureStorage (preparado, no conectado)

`core/utils/secureStorage.ts` — wrapper AES sobre localStorage. Comentario explícito: tokens permanecen en memoria; utilidad para futura persistencia opcional.

---

## 14. React Query

### Configuración global

Archivo: `src/app/provider.tsx`

| Opción | Valor |
|--------|-------|
| `staleTime` | 5 minutos |
| `gcTime` | 10 minutos |
| `retry` (queries) | 1 |
| `refetchOnWindowFocus` | false |
| `retry` (mutations) | 0 |

### Invalidación por evento de sesión

| Evento | Acción |
|--------|--------|
| `applyFullSessionToken` | `queryClient.clear()` + `invalidateOrgQueries` + `invalidateInvQueries` |
| Cambio `scopeEmpresaId` | `useOrgSessionScope` / `useInvSessionScope` → invalidación módulo |
| Cambio `tenantId` | `TenantContext` → predicate invalidate/remove queries con tenantId anterior |
| Logout (`auth.token` null) | `TenantContext` → `storeRegistry.clearAll()` + `queryClient.clear()` |
| `restorePlatformSession` | `queryClient.clear()` |

### Prefijos de módulo

| Módulo | Helper | Prefix |
|--------|--------|--------|
| ORG | `invalidate-org-queries.ts` | `['org']` |
| INV | `invalidate-inv-queries.ts` | `['inv']` |

### Dependencia de empresa en queries

Patrón company-scoped:

```typescript
// org-company-query-gate.ts
enabled = (options?.enabled ?? true) && canQueryCompanyScoped && !!scopeEmpresaId
```

`scopeEmpresaId` proviene de `empresaActivaId` en sesión JWT/AuthContext.

### Dependencia de tenant

Queries que incluyen `tenantId` en `queryKey` se invalidan/remueven al cambiar tenant vía predicate en `TenantContext.invalidatePreviousTenantCache`.

### PermissionContext y React Query

`PermissionProvider` usa `api.get('/auth/permissions/me')` directamente (no React Query hook dedicado en el provider); re-fetch por `auth.token`, `empresaActivaId`, `requiereSeleccionEmpresa`.

---

## 15. Interceptores Axios

Registrados **únicamente** en `AuthContext` sobre `api` (`apiCentral`).  
Instancias locales (`createLocalApi`) y `apiSelection` **no** tienen interceptor de refresh.

### Request interceptor

```
1. Log DEV: method + url
2. Si headers.Authorization ya existe → no pisar
3. Si authRef.current.token && !skip && !público → Bearer token
4. Retorna config (sin modificar baseURL)
```

Endpoints públicos (sin token): `/clientes/branding` (pre-login).

### Response interceptor — árbol de decisión

```
response OK → return response

error:
├─ 403 + PASSWORD_CHANGE_REQUIRED
│    ├─ sync user.requires_password_change
│    └─ window.location.assign('/change-password') (salvo bypass/skip)
├─ 401 en /auth/refresh → reject (sin log duplicado)
├─ skip URL (auth endpoints) → reject
├─ modo soporte + 401/403 → reject (sin refresh plataforma)
├─ 401 + !_retry
│    ├─ cola o single-flight refresh
│    ├─ éxito → retry request
│    └─ fallo → doLogout(false)
└─ 5xx / timeout → showServerErrorToast → reject
```

### Códigos HTTP — resumen

| Código | Handler global |
|--------|----------------|
| 401 | Refresh + retry (salvo skip/soporte) |
| 403 PASSWORD_CHANGE_REQUIRED | Redirect change-password |
| 403 otros | Reject al caller |
| 429 | **Sin handler** |
| 5xx | Toast error global |
| ECONNABORTED | Toast timeout |

---

## 16. Sincronización entre pestañas

### Implementado

| Mecanismo | Canal | Alcance |
|-----------|-------|---------|
| `BroadcastChannel` | `'tenant-sync'` | Cambio de `tenantId` |

Archivo: `core/stores/tenant-store-sync.ts`

```
notifyTenantChange(tenantId) → postMessage { type: 'tenant-changed', tenantId }
onTenantChange(callback) → reset stores + invalidate RQ cache tenant anterior
```

`TenantContext` suscribe `onTenantChange` al montar.

### No implementado

| Mecanismo | Estado |
|-----------|--------|
| `window.storage` event para auth | Ausente |
| BroadcastChannel login/logout/token | Ausente |
| Sync access token entre pestañas | Ausente |
| `visibilitychange` / `focus` para revalidar sesión | Ausente |
| `online`/`offline` handlers | Ausente |
| Service Worker / SharedWorker | Ausente |

### Comportamiento multi-tab verificado

| Recurso | Compartido entre pestañas |
|---------|--------------------------|
| Cookie `refresh_token` | Sí (mismo origen) |
| Access token (memoria) | No — por pestaña |
| `caxis-empresa-selection-pending` (localStorage) | Sí — sin handler sync explícito |
| `platform_parent_session` (sessionStorage) | No — por pestaña |
| Tenant BroadcastChannel | Sí — solo tenantId |

**Efecto:** refresh en pestaña A puede rotar cookie; pestaña B conserva access viejo hasta próximo 401.

---

## 17. UX actual

### Por escenario

| Escenario | Comportamiento UX |
|-----------|-------------------|
| Login exitoso Schema B | Toast "¡Bienvenido!"; navigate destino |
| Login Schema A | Toast "Seleccione su empresa"; navigate selección |
| Credenciales inválidas | Toast error con `getErrorMessage` |
| Cambio empresa | Toast con nombre empresa; selector loading |
| Logout manual | Limpieza estado; ProtectedRoute → login |
| Sesión expirada | Logout silencioso; redirect login sin mensaje dedicado |
| Refresh falla | Igual que sesión expirada |
| Password change requerido | Redirect `/change-password` (login o interceptor 403) |
| TOKEN_REUSE (backend) | Tratado como 401 genérico; sin mensaje seguridad |
| Idle timeout | Igual que sesión expirada |
| Logout remoto (admin revoke) | Sin efecto inmediato; logout en próximo 401 |
| Impersonación expirada | Toast "sesión de soporte expiró"; retorno Platform |
| Entrar modo soporte | Toast "Modo soporte activo" |
| Salir modo soporte | Toast "Sesión de plataforma restaurada" |
| Selección empresa expirada | Toast + redirect login |
| Bootstrap / gates | Spinners: "Verificando sesión...", "Inicializando sesión..." |

### Spinners de carga

| Gate | Mensaje |
|------|---------|
| `AuthGate` | "Verificando sesión..." |
| `AppReadyGate` | "Inicializando sesión..." |
| `ProtectedRoute` | "Verificando sesión..." |

---

## 18. Contrato con Backend

Referencia: `IAM_SESSION_MANAGEMENT_V2.md`  
Esta sección documenta **cómo el frontend consume hoy** el contrato backend, sin proponer cambios.

### Identificación de cliente

| Header | Valor FE | Alineación |
|--------|----------|------------|
| `X-Client-Type` | Siempre `web` en `auth.service.ts` | Alineado (web) |
| Refresh en body | No enviado | Alineado (web cookie) |
| `withCredentials` | `true` en apiCentral | Alineado |

### Access token

| Regla backend | Implementación FE |
|---------------|-------------------|
| Bearer en requests autenticados | Request interceptor |
| Reemplazar tras refresh OK | Sí — memoria actualizada |
| No almacenar en cookie para API | Cumplido — solo memoria |

### Refresh

| Regla backend | Implementación FE |
|---------------|-------------------|
| POST /auth/refresh/ con cookie | `authService.refreshToken` |
| 401 → login, no bucle | `doLogout(false)` tras fallo |
| No múltiples refresh intencionales | Single-flight |
| ALREADY_ROTATED: usar nuevo access | Usa `access_token` de response (no distingue outcome) |
| Impersonación 403 en refresh | FE omite refresh en modo soporte |
| Post-refresh: empresa desde BD | **No re-hidrata** user/empresa en interceptor |

### Logout

| Regla backend | Implementación FE |
|---------------|-------------------|
| POST /auth/logout/ idempotente | `doLogout(true)`; errores no bloquean |
| Limpiar cliente aunque backend borró cookies | Cookie manual + reset estado |
| Bearer opcional para blacklist | Envía cookie; Bearer si hay token en interceptor previo |

### Logout All

| Regla backend | Implementación FE |
|---------------|-------------------|
| POST /auth/logout_all/ con Bearer | Servicio existe |
| Redirect login inmediato tras 200 | **No implementado** (sin UI) |

### Cambiar Empresa

| Regla backend | Implementación FE |
|---------------|-------------------|
| POST con Bearer + empresa_id | `cambiarEmpresa` |
| Web: cookie refresh viaja | `withCredentials` |
| Tras 200: reemplazar access, user | `applyFullSessionToken` + `initializeAuth` |
| 401 → login | Error propagado; sin handler global dedicado |

### Seleccionar Empresa

| Regla backend | Implementación FE |
|---------------|-------------------|
| Bearer selection_token | `apiSelection` + header explícito |
| Tras 200: sesión completa con refresh | `applyFullSessionToken` |
| No refresh en fase selección | Bootstrap omite refresh si pending |

### Password Change

| Regla backend | Implementación FE |
|---------------|-------------------|
| Bearer access o selection | `changePassword(payload, bearer)` |
| Nueva sesión tras cambio | `applyFullSessionToken` |

### Session Expired / Idle / TOKEN_REUSE

| Regla backend | Implementación FE |
|---------------|-------------------|
| 401 mensaje unificado | No muestra mensaje backend al usuario en logout silencioso |
| Limpiar tokens + login | Limpia estado; redirect vía ProtectedRoute |
| Idle transparente | Cumplido — mismo tratamiento 401 |
| TOKEN_REUSE cierra todas sesiones | Logout local; sin mensaje específico |

### Reintentos (contrato backend vs FE)

| Situación | Backend spec | FE actual |
|-----------|--------------|-----------|
| Refresh 401 | No reintentar | `doLogout` — alineado |
| Refresh 500 | Máx. 1 retry backoff | Sin retry dedicado |
| Logout | Safe retry | Un intento; finally limpia |
| ALREADY_ROTATED | No retry refresh inmediato | Usa access; alineado implícito |

---

## 19. Limitaciones conocidas

Solo deudas certificadas en código. **Sin propuestas de solución.**

### P0

| ID | Descripción |
|----|-------------|
| FE-P0-01 | Access token no sincronizado entre pestañas; cookie refresh compartida puede invalidar sesión en otras pestañas sin aviso |
| FE-P0-02 | Refresh interceptor no re-hidrata `empresaActivaId` ni usuario desde `/auth/me`; desalineado con fuente BD del backend en refresh |
| FE-P0-03 | `logoutAllSessions` sin UI ni flujo post-200 → login |
| FE-P0-04 | Session expired sin redirect explícito ni mensaje UX dedicado |

### P1

| ID | Descripción |
|----|-------------|
| FE-P1-01 | `AuthContext.tsx` monolito (~1768 líneas) con ≥10 responsabilidades |
| FE-P1-02 | Sin manejo HTTP 429 |
| FE-P1-03 | Sin retry con backoff en refresh HTTP 500 |
| FE-P1-04 | Dual sistema permisos: `/auth/menu` + `/auth/permissions/me` |
| FE-P1-05 | `src/services/auth.service.ts` legacy duplicado |
| FE-P1-06 | Modo soporte: 401 en operación no siempre dispara salida controlada (solo bootstrap) |
| FE-P1-07 | `buildAuthTenantContextHeaders` desactivado por defecto (`VITE_AUTH_TENANT_HEADERS`) |

### P2

| ID | Descripción |
|----|-------------|
| FE-P2-01 | `secureStorage` preparado pero no conectado a tokens |
| FE-P2-02 | `src/context/TenantContext.tsx` legacy coexistiendo con versión activa |
| FE-P2-03 | Logs `console.log` extensos (parcialmente guardados por `import.meta.env.DEV`) |
| FE-P2-04 | No distingue explícitamente `ROTATED` vs `ALREADY_ROTATED` en refresh (funciona vía `access_token`) |
| FE-P2-05 | Revocación admin de sesión propia: logout diferido hasta próximo 401 |

### P3

| ID | Descripción |
|----|-------------|
| FE-P3-01 | Preferencias UI en localStorage no relacionadas con sesión |
| FE-P3-02 | Utilidades diagnóstico DEV (`auth-debug`, `auth-session-snapshot`) |
| FE-P3-03 | Selection store en localStorage sin handler `storage` event cross-tab |

---

## 20. Diagramas

### 20.1 Session Lifecycle (frontend)

```
┌────────┐   login Schema B    ┌────────────┐   bootstrap/401    ┌────────────┐
│  none  │ ──────────────────► │ AUTENTICADO │ ────────────────► │ AUTENTICADO │
│        │   access+user mem   │ token+user  │   refresh OK      │ token nuevo │
└────────┘                     └──────┬─────┘                   └──────┬─────┘
                                      │                                  │
                         logout / refresh fail / me fail                 │
                                      ▼                                  │
                               ┌────────────┐                            │
                               │  ANÓNIMO   │◄───────────────────────────┘
                               │ sin token  │     refresh fail
                               └────────────┘

┌────────┐   login Schema A    ┌────────────────┐   seleccionar    ┌────────────┐
│  none  │ ──────────────────► │ SELECCIÓN      │ ───────────────► │ AUTENTICADO │
│        │   selection local  │ PENDIENTE      │   empresa        │ sesión full │
└────────┘                     └────────────────┘                  └────────────┘
```

### 20.2 Bootstrap decision tree

```
runBootstrap
├─ pathname === '/login' → bootstrapped, sin refresh
├─ hasPendingSelection() → bootstrapped, sin refresh/me
├─ hasPlatformParentSession()
│    ├─ supportToken en sessionStorage → rehidratar + /auth/me
│    ├─ memToken impersonación válido → initializeAuth
│    └─ sin token impersonado → restorePlatformSession
└─ default
     ├─ POST /auth/refresh/ OK
     │    ├─ selection token? → doLogout
     │    └─ initializeAuth
     └─ refresh 401 → doLogout(false)
```

### 20.3 Provider dependency graph

```
                    ┌─────────────────┐
                    │ QueryClient     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ AuthProvider    │◄──── api interceptors
                    │ (token, user)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐ ┌───▼────┐ ┌───────▼────────┐
     │ TenantProvider  │ │ AuthGate│ │ PermissionProv │
     │ (tenantId)      │ └────────┘ │ (/perm/me)     │
     └────────┬────────┘            └────────────────┘
              │
     ┌────────▼────────┐
     │ BrandingInit    │
     │ (subdomain/     │
     │  tenantId)      │
     └─────────────────┘
```

### 20.4 Impersonación Platform → ERP

```
platform_admin autenticado
        │
        ├─ savePlatformParentSession (sessionStorage)
        ├─ POST /auth/impersonate/{cliente_id}/
        │
        ├─ Schema A → selection store → /seleccionar-empresa
        └─ Schema B → applyFullSessionToken
                ├─ saveImpersonationSupportSession
                └─ ERP con is_impersonation=true

Salir:
        ├─ POST /auth/impersonate/end/
        └─ restorePlatformSession → parent token + initializeAuth
```

### 20.5 Interceptor 401 flow

```
[API Request] ──401──► [Interceptor]
                            │
                   ¿skip URL? ──yes──► reject
                            │no
                   ¿modo soporte? ──yes──► reject
                            │no
                   ¿refresh activo? ──yes──► [Queue] ──token──► retry
                            │no
                   [Start refresh] ──OK──► update token ──► retry
                            │
                           fail
                            ▼
                      [doLogout false]
```

---

## 21. Glosario

| Término | Definición |
|---------|------------|
| **Access token** | JWT corta duración en memoria; enviado como Bearer |
| **Refresh token** | JWT larga duración en cookie HttpOnly; renovación vía POST /auth/refresh/ |
| **Schema A** | Login multi-empresa: `LoginEmpresaSelectionResponse` con `selection_token` |
| **Schema B** | Login sesión completa: `Token` con `access_token` + cookie refresh |
| **Selection token** | Access JWT temporal con `empresa_selection_pending: true` |
| **Bootstrap** | Inicialización al mount: refresh + /auth/me o rutas alternativas |
| **Single-flight** | Un único refresh concurrente global (`isRefreshingPromise`) |
| **Failed queue** | Cola de requests 401 esperando resultado del refresh activo |
| **applyFullSessionToken** | Transición a sesión completa: clear RQ + token + initializeAuth |
| **initializeAuth** | GET /auth/me + menú + empresas elegibles + flags |
| **scopeEmpresaId** | Empresa operativa de sesión JWT; fuente para queries company-scoped |
| **tenantId** | `cliente_id` del tenant; distinto de empresa activa |
| **apiCentral** | Instancia Axios central con interceptores auth |
| **apiSelection** | Instancia Axios sin interceptores ERP; solo seleccionar empresa |
| **Platform parent session** | Snapshot sesión platform_admin antes de impersonar |
| **Support session** | Token impersonación en sessionStorage para F5 |
| **menuPermissionsReady** | Flag: GET /auth/menu terminó; PermissionGuard puede evaluar |
| **BroadcastChannel tenant-sync** | Sync de cambio tenantId entre pestañas |
| **doLogout** | Limpieza local (+ opcional POST logout) |
| **ProtectedRoute** | Gate que redirige a /login cuando !isAuthenticated |

---

## 22. Estado del dominio

| Atributo | Valor |
|----------|-------|
| **Versión arquitectónica** | IAM Session Management Frontend V1 |
| **Estado** | Documentado — comportamiento según código actual |
| **Fecha documento** | 2026-06-19 |
| **Ticket** | IAM-FE-DOCS-SESSION-V1 |
| **Fuente de verdad código** | `src/shared/context/AuthContext.tsx`, `src/features/auth/`, `src/core/api/`, `src/features/tenant/components/TenantContext.tsx` |
| **Contrato backend referencia** | `IAM_SESSION_MANAGEMENT_V2.md` |
| **Madurez estimada** | 3.0 / 5 — operativo web single-tab; gaps multi-tab y logout all |
| **Cliente soportado** | Web (`X-Client-Type: web`) |
| **Cliente no soportado** | Mobile (`X-Client-Type: mobile`) |

### Capacidades verificadas

| Capacidad | Estado |
|-----------|--------|
| Login Schema A / B | Implementado |
| Bootstrap con refresh | Implementado |
| Refresh single-flight + cola | Implementado |
| Logout idempotente | Implementado |
| Cambio empresa sin reload | Implementado |
| Selección empresa post-login | Implementado |
| Password change con nueva sesión | Implementado |
| Impersonación Platform ↔ ERP | Implementado |
| Tenant por subdominio + JWT | Implementado |
| Branding pre/post login | Implementado |
| Logout all UI | No implementado |
| Auth sync multi-tab | No implementado |
| Idle timeout UX | No implementado |
| Mobile refresh body | No implementado |

---

*Generado bajo IAM-FE-DOCS-SESSION-V1 — DOCUMENTATION ONLY.*
