# IAM-FE-PHASE-02 — Diseño Técnico: Session Termination Contract

**Ticket diseño:** IAM-FE-PHASE-02-DESIGN-01  
**Ticket implementación:** IAM-FE-PHASE-02-SESSION-TERMINATION  
**Versión:** 1.0  
**Estado:** DESIGN ONLY — sin implementación  
**Fecha:** 2026-06-19  
**Referencias normativas:**
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` — Fase 2, §8 V2.x
- `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` — estado actual post-Fase 1
- `docs/arquitectura/IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` — Fase 1 cerrada (base hydrate)
- `IAM_SESSION_MANAGEMENT_V2.md` — contrato backend §6, §7, §19

> Este documento define **cómo** se implementará la Fase 2.  
> No contiene código, pseudocódigo, parches ni modificaciones a la Fase 1.  
> La Fase 1 (`src/core/auth/session/*` hydrate) queda **congelada** salvo wiring mínimo en puntos de terminación.

---

## Índice

1. [Objetivos de la Fase](#1-objetivos-de-la-fase)
2. [Problemas actuales](#2-problemas-actuales)
3. [Arquitectura propuesta](#3-arquitectura-propuesta)
4. [Nuevos módulos](#4-nuevos-módulos)
5. [Responsabilidades](#5-responsabilidades)
6. [Flujo completo](#6-flujo-completo)
7. [Diagramas](#7-diagramas)
8. [Contratos](#8-contratos)
9. [Integración con AuthContext](#9-integración-con-authcontext)
10. [Integración con interceptor](#10-integración-con-interceptor)
11. [Integración con applyPostRefreshSession](#11-integración-con-applypostrefreshsession)
12. [Integración con hydrateSessionCore](#12-integración-con-hydratesessioncore)
13. [Integración con processQueue](#13-integración-con-processqueue)
14. [Integración con React Query](#14-integración-con-react-query)
15. [Integración con TenantProvider](#15-integración-con-tenantprovider)
16. [Integración con PermissionProvider](#16-integración-con-permissionprovider)
17. [Integración con ProtectedRoute](#17-integración-con-protectedroute)
18. [Integración con PermissionGuard](#18-integración-con-permissionguard)
19. [Estados de terminación](#19-estados-de-terminación)
20. [UX](#20-ux)
21. [Rollback](#21-rollback)
22. [Riesgos](#22-riesgos)
23. [Plan de implementación](#23-plan-de-implementación)
24. [División por pasos](#24-división-por-pasos)
25. [Criterios de aceptación](#25-criterios-de-aceptación)
26. [Estrategia de pruebas](#26-estrategia-de-pruebas)
27. [Estrategia de auditoría](#27-estrategia-de-auditoría)
28. [Criterios de cierre](#28-criterios-de-cierre)

---

## 1. Objetivos de la Fase

### 1.1 Problema que resuelve

Tras la Fase 1, el interceptor 401 re-hidrata correctamente la sesión cuando el refresh es **exitoso**. Sin embargo, todos los caminos de **salida de sesión** siguen usando `doLogout(false|true)` con semántica heterogénea:

| Contexto | Comportamiento actual | Alineación §19 BE |
|----------|----------------------|-------------------|
| Refresh 401 interceptor | `doLogout(false)` silencioso | **Desalineado** — sin mensaje, sin redirect explícito |
| Refresh 401 bootstrap | `doLogout(false)` silencioso | **Desalineado** |
| TOKEN_REUSE (401 seguridad) | Tratado como 401 genérico | **Desalineado** — sin mensaje diferenciado |
| Idle / expiración absoluta | Transparente vía 401 refresh | **Parcial** — sin UX unificada |
| Logout manual | `doLogout(true)` + limpieza | **Parcial** — sin `queryClient.clear()` determinista |
| Revocación remota | Diferida hasta próximo 401 | **Parcial** — Fase 3 profundiza detección proactiva |
| Cola `failedQueueRef` tras refresh fail | `processQueue(error)` | **Alineado** |
| Redirect login | Delegado a `ProtectedRoute` | **Desalineado** — §19 exige redirect explícito |

**Consecuencia verificable:** el usuario puede ver pantallas intermedias, datos cacheados de sesión anterior en React Query, o quedarse en ruta protegida sin mensaje tras expiración — incumpliendo GAP-P0-04 y GAP-P0-05.

### 1.2 GAPs que cierra

| ID | Descripción | Cierre Fase 2 |
|----|-------------|---------------|
| **GAP-P0-04** | Session expired sin redirect/mensaje contrato §19 | **Cierre completo** |
| **GAP-P0-05** | TOKEN_REUSE indistinguible de expiración normal | **Cierre completo** (taxonomía + UX) |
| **GAP-P1-03** (parcial) | `doLogout` no invalida RQ directamente | **Cierre parcial** — `queryClient.clear()` en terminación |

### 1.3 GAPs explícitamente fuera de alcance Fase 2

| ID | Fase responsable |
|----|------------------|
| GAP-P0-03 Logout All UI | Fase 3 |
| GAP-P1-04 Detección proactiva revoke remoto | Fase 3 |
| GAP-P0-02 Cross-tab sync | Fase 4 |
| GAP-P1-01 Retry refresh 500 | Fase 5 |
| GAP-P1-02 Impersonación 403 refresh | Fase 6 |

Fase 2 **prepara contratos** (`SessionTerminationReason`, hook de emisión) que Fases 3–4 consumirán, sin implementar sync cross-tab ni logout all UI.

### 1.4 Objetivo técnico formal

Introducir una capa **Session Termination** centralizada que, ante cualquier fin de sesión (backend o frontend):

1. **Clasifique** el motivo (`SessionTerminationReason`) desde contexto HTTP, flujo o acción usuario.
2. **Ejecute** limpieza determinística: estado React, cookie refresh, cola refresh, React Query.
3. **Comunique** UX coherente con §19: mensaje visible + redirect explícito a `/login`.
4. **Nunca** reintente refresh tras 401 de terminación.
5. **Coexista** con Fase 1: refresh exitoso → hydrate sin cambios; solo rutas de **fallo/salida** evolucionan.

### 1.5 Criterios de aceptación (enlace plan)

Escenarios obligatorios: **V2.1–V2.6** (`IAM_SESSION_ALIGNMENT_PLAN_V1.md` §8).

---

## 2. Problemas actuales

### 2.1 `doLogout` — semántica actual

Archivo: `src/shared/context/AuthContext.tsx` — función `doLogout(callServer?)`.

| Aspecto | Estado actual | Problema |
|---------|---------------|----------|
| POST `/auth/logout/` | Solo si `callServer=true` | OK para logout manual |
| Limpieza estado React | Completa | OK |
| Cookie refresh | Borrado manual `document.cookie` | OK |
| `processQueue(error)` | Siempre | OK |
| `isRefreshingPromise` | Reset a `null` | OK |
| `queryClient.clear()` | **No invoca** | Cache autenticado puede persistir (V2.6) |
| Redirect `/login` | **No** | Depende de `ProtectedRoute` |
| Mensaje usuario | **No** (salvo logout manual implícito) | Incumple §19 V2.3 |
| Taxonomía motivo | **No** | Imposible TOKEN_REUSE vs expired (V2.4) |
| Idempotencia | Parcial | Múltiples llamadas concurrentes posibles |

### 2.2 Puntos de terminación dispersos

| Origen | Trigger actual | `callServer` |
|--------|----------------|--------------|
| Interceptor refresh fail | `doLogout(false)` | false |
| Bootstrap refresh 401 | `doLogout(false)` | false |
| `initializeAuth` / `hydrateSessionCore` me null | `doLogout(false)` vía DI | false |
| `applyPostRefreshSession` throw | Interceptor catch → `doLogout(false)` | false |
| Logout header | `doLogout(true)` | true |
| Selection invalid | `invalidateSelectionSession` | parcial |
| Impersonation end | Flujos propios + `doLogout` | mixto |

**Problema:** misma función para semánticas distintas sin clasificación ni UX diferenciada.

### 2.3 Interceptor 401 — post Fase 1

| Escenario | Comportamiento Fase 1 | Gap Fase 2 |
|-----------|----------------------|------------|
| Refresh 200 + hydrate OK | Orquestador Fase 1 | Sin cambio |
| Refresh 401 | `doLogout(false)` silencioso | Terminación contractual |
| Refresh 500 | `doLogout(false)` fail-fast | Mensaje genérico (retry = Fase 5) |
| Post-refresh hydrate fail | `doLogout(false)` | Terminación con reason HYDRATE_FAILED |

### 2.4 Backend §19 — contrato FE relevante

| Evento BE | Respuesta típica | Acción FE requerida |
|-----------|------------------|---------------------|
| Refresh inválido/revocado/expirado | HTTP 401 + `detail` string | Limpiar, redirect login, no retry |
| Idle timeout | HTTP 401 (mismo mensaje) | Igual session expired |
| Expiración absoluta (`expires_at`) | HTTP 401 | Igual session expired |
| TOKEN_REUSE | HTTP 401 + mensaje seguridad | Mensaje diferenciado; todas sesiones revocadas |
| Logout remoto (admin revoke) | Próximo refresh/API 401 | Terminación al detectar 401 (Fase 3: proactivo) |
| Logout manual FE | `POST /auth/logout/` | Idempotente; limpieza local siempre |

Mensaje canónico refresh 401:
> "Sesión expirada o cerrada remotamente. Por favor, vuelva a iniciar sesión."

### 2.5 React Query — GAP-P1-03

| Evento | `queryClient.clear()` hoy |
|--------|---------------------------|
| `applyFullSessionToken` | Sí |
| `restorePlatformSession` | Sí |
| Post-refresh FULL cambio tenant | Sí (vía `session-rq-invalidation`) |
| `doLogout` | **No** — depende de `TenantContext` effect |

**Riesgo:** ventana con datos ERP en cache tras terminación silenciosa.

### 2.6 UX y gates

| Componente | Comportamiento actual |
|------------|----------------------|
| `ProtectedRoute` | Redirect a `/login` cuando `!isAuthenticated` tras limpieza |
| `PermissionGuard` | Spinner si `!menuPermissionsReady` |
| Login page | Sin lectura de `?session=` / mensaje expiración |

**Problema:** entre `doLogout` y re-render de `ProtectedRoute`, el usuario puede ver contenido stale o spinner sin mensaje.

---

## 3. Arquitectura propuesta

### 3.1 Principio de diseño: terminación centralizada

| Capa | Nombre | Responsabilidad |
|------|--------|-----------------|
| **T0** | Reason classification | HTTP error / contexto → `SessionTerminationReason` |
| **T1** | Session cleanup | Estado React, refs, cookie, cola, single-flight |
| **T2** | Cache cleanup | `queryClient.clear()` determinista |
| **T3** | UX delivery | Toast + redirect `/login` + query param opcional |
| **T4** | Emission hook | Punto extensible para Fase 4 cross-tab (sin implementar canal) |

**Regla:** T0–T3 son síncronos/async puros vía DI; `AuthContext` solo cablea.

### 3.2 Qué cambia vs Fase 1

| Elemento | Cambio Fase 2 |
|----------|---------------|
| `doLogout` | Delega en `terminateSession` (wrapper retrocompatible) |
| Interceptor catch refresh | Clasifica error → `terminateSession` |
| Bootstrap refresh fail | Idem |
| `hydrateSessionCore` DI `doLogout` | Invoca `terminateSession` con reason |
| Login page | Lee mensaje expiración (query param / state) |
| Módulos Fase 1 hydrate | **Sin cambio de lógica** |

### 3.3 Qué permanece sin cambio

| Elemento | Notas |
|----------|-------|
| `applyPostRefreshSession` (éxito) | Flujo L0→L1→diff→L2 intacto |
| `resolveHydrationLevel` | Sin cambio |
| `applyClaimsSync` | Sin cambio |
| `hydrateSessionCore` (cuerpo) | Sin cambio; solo callback logout |
| `session-rq-invalidation` | Sin cambio |
| `session-menu-ux` | Sin cambio |
| `REFRESH_HYDRATE_ENABLED` | Sin cambio |
| `processQueue` (firma) | Sin cambio |
| API pública `useAuth` | Sin breaking changes |
| Single-flight refresh | Sin cambio en éxito |

### 3.4 Componentes nuevos (diseño)

| Artefacto | Ubicación | Responsabilidad |
|-----------|-----------|-----------------|
| `session-termination-reason.ts` | `src/core/auth/session/` | Enum razones + parser HTTP |
| `session-terminate.ts` | `src/core/auth/session/` | Orquestador T0→T3 |
| `session-termination-ux.ts` | `src/core/auth/session/` | Mensajes, redirect, query params |
| `session-termination.flags.ts` | `src/core/auth/session/` | Feature flag rollback Fase 2 |

**Nota:** Convive con módulos Fase 1 en la misma carpeta `session/` sin fusionar responsabilidades.

### 3.5 Diagrama arquitectura objetivo

```
┌─────────────────────────────────────────────────────────────────┐
│ AuthProvider (AuthContext.tsx) — composition root               │
│  ├─ interceptor 401 (éxito → Fase 1 sin cambio)                 │
│  ├─ interceptor 401 (fallo → terminateSession)                   │
│  ├─ bootstrap refresh fail → terminateSession                     │
│  ├─ logout() → terminateSession(MANUAL)                          │
│  └─ doLogout → wrapper terminateSession (retrocompat)           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │  terminateSession(input, deps)         │  ← NUEVO orquestador
         │   ├─ T0 classify / normalize reason    │
         │   ├─ T1 cleanup state + cookie + queue  │
         │   ├─ T2 queryClient.clear()           │
         │   └─ T3 UX message + redirect login   │
         └──────────────────┬──────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     ▼                      ▼                      ▼
 processQueue(error)   queryClient.clear()   navigate(/login?reason=)
 branding/selection    TenantContext effect   Login toast/message
```

---

## 4. Nuevos módulos

### 4.1 `session-termination-reason.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `SessionTerminationReason` | union enum | Taxonomía canónica de fin de sesión |
| `SessionTerminationSource` | union | `backend` \| `frontend` \| `unknown` |
| `SessionTerminationClassification` | interface | `{ reason, source, httpStatus?, detail? }` |
| `classifySessionTermination` | función pura | AxiosError / contexto → clasificación |
| `isSecurityTermination` | función pura | `true` si TOKEN_REUSE |

### 4.2 `session-terminate.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `TerminateSessionInput` | interface | Entrada orquestador |
| `TerminateSessionDeps` | interface | DI desde AuthContext |
| `terminateSession` | async función | Orquestador T0→T3 |

### 4.3 `session-termination-ux.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `SessionTerminationUxProfile` | interface | `{ toastMessage, loginQueryParam?, severity }` |
| `resolveTerminationUx` | función pura | reason → perfil UX |
| `buildLoginRedirectPath` | función pura | `/login?session=expired` etc. |

### 4.4 `session-termination.flags.ts`

| Export | Descripción |
|--------|-------------|
| `SESSION_TERMINATION_V2_ENABLED` | Default `true`; `false` → comportamiento legacy `doLogout` |
| `VITE_SESSION_TERMINATION_V2_ENABLED` | Env Vite compile-time |

---

## 5. Responsabilidades

### 5.1 Matriz módulo → responsabilidad

| Módulo | Responsabilidad | NO hace |
|--------|-----------------|---------|
| `session-termination-reason` | Clasificar motivo desde HTTP/contexto | Limpieza estado |
| `session-terminate` | Orquestar cleanup + UX | Parsear JWT |
| `session-termination-ux` | Mensajes y rutas login | HTTP |
| `session-termination.flags` | Rollback Fase 2 | Lógica terminación |
| `AuthContext` | DI, wiring, navigate | Lógica clasificación |
| Módulos Fase 1 | Hydrate post-refresh OK | Terminación |

### 5.2 Taxonomía `SessionTerminationReason`

| Reason | Origen | Trigger típico |
|--------|--------|----------------|
| `MANUAL_LOGOUT` | Frontend | Usuario click logout; `callServer=true` |
| `REFRESH_UNAUTHORIZED` | Backend | `POST /auth/refresh/` → 401 genérico |
| `SESSION_EXPIRED` | Backend | 401 con mensaje §19 estándar |
| `TOKEN_REUSE` | Backend | 401 con mensaje seguridad / reuse |
| `REFRESH_REVOKED` | Backend | 401 refresh; sesión revocada (admin/logout remoto) |
| `IDLE_TIMEOUT` | Backend | 401; clasificado si `detail` menciona idle (opcional) o alias SESSION_EXPIRED |
| `ABSOLUTE_EXPIRY` | Backend | 401; `expires_at` — UX igual SESSION_EXPIRED |
| `REFRESH_INVALID` | Backend | 401 refresh; token malformado / NOT_FOUND |
| `HYDRATE_FAILED` | Frontend | `/auth/me` null o throw post-refresh L2 |
| `BOOTSTRAP_FAILED` | Frontend | Bootstrap refresh 401/500 sin sesión |
| `SELECTION_INVALID` | Frontend | Schema A token inválido |
| `IMPERSONATION_END` | Frontend | Salida modo soporte controlada |
| `SILENT_CLEANUP` | Frontend | Limpieza interna sin UX (solo flag OFF legacy) |

**Decisión:** `IDLE_TIMEOUT` y `ABSOLUTE_EXPIRY` comparten UX con `SESSION_EXPIRED` salvo que el backend exponga discriminador explícito en `detail` (parser extensible).

### 5.3 Cobertura requerimientos usuario

| Requerimiento usuario | Reason(es) | Fase |
|----------------------|------------|------|
| Session Expired | `SESSION_EXPIRED`, `REFRESH_UNAUTHORIZED` | 2 |
| Refresh fallido | `REFRESH_UNAUTHORIZED`, `BOOTSTRAP_FAILED` | 2 |
| Refresh inválido | `REFRESH_INVALID` | 2 |
| Refresh revocado | `REFRESH_REVOKED` | 2 |
| TOKEN_REUSE | `TOKEN_REUSE` | 2 |
| Logout remoto | `REFRESH_REVOKED` / 401 API | 2 (detección); 3 (proactivo) |
| Logout otra pestaña | Emisión hook | 4 (sync); 2 prepara contrato |
| Expiración absoluta | `ABSOLUTE_EXPIRY` → UX expired | 2 |
| Expiración inactividad | `IDLE_TIMEOUT` → UX expired | 2 |
| Terminación backend | Reasons `backend` | 2 |
| Terminación frontend | `MANUAL_LOGOUT`, `HYDRATE_FAILED`, etc. | 2 |

---

## 6. Flujo completo

### 6.1 Terminación estándar (contrato §19)

```
Evento terminación (401 refresh, logout manual, hydrate fail, ...)
        │
        ▼
classifySessionTermination(context)
        │
        ▼
terminateSession({ reason, callServer?, error? }, deps)
        │
        ├─ Guard idempotencia (isTerminatingRef)
        ├─ isRefreshingPromise = null
        ├─ processQueue(Error('Session terminated'), null)
        ├─ Si callServer → POST /auth/logout/ (best-effort, no bloquea)
        ├─ Limpiar auth state (equivalente doLogout today)
        ├─ Cookie refresh = expired
        ├─ clearImpersonation* + selection store
        ├─ brandingStore.clearAll(preservePreLogin)
        ├─ queryClient.clear()                    ← NUEVO determinista
        ├─ resolveTerminationUx(reason) → toast
        └─ navigate(buildLoginRedirectPath(reason))
```

### 6.2 Coexistencia con refresh exitoso (Fase 1)

```
401 → refresh OK
  → [REFRESH_HYDRATE_ENABLED=true]
       applyPostRefreshSession → éxito
       applyPostRefreshRqInvalidation
       processQueue(null, token)
       retry
  → [Sin invocar terminateSession]
```

**Invariante Fase 2:** `terminateSession` **nunca** se invoca en refresh 200.

### 6.3 Refresh fallido en interceptor

```
401 request → single-flight refresh
  → POST /auth/refresh/ → 401
  → classifySessionTermination(axiosError)
  → terminateSession({ reason: REFRESH_UNAUTHORIZED | TOKEN_REUSE | ... })
  → NO segundo refresh
  → requests encolados rechazados
```

### 6.4 Post-refresh hydrate fallido (Fase 1 + Fase 2)

```
refresh 200 → applyPostRefreshSession
  → hydrateSessionCore → fetchMe null / throw
  → throw 'Post-refresh full hydration failed'
  → interceptor catch
  → classify → HYDRATE_FAILED
  → terminateSession
```

### 6.5 Logout manual

```
logout() → terminateSession({ reason: MANUAL_LOGOUT, callServer: true })
  → POST /auth/logout/ (idempotente)
  → cleanup + RQ clear
  → redirect /login (sin mensaje error — opcional toast "Sesión cerrada")
```

### 6.6 Bootstrap refresh 401

```
runBootstrap → refreshToken() throw 401
  → classify → BOOTSTRAP_FAILED o REFRESH_UNAUTHORIZED
  → terminateSession
  → isBootstrapped=true, authInitialized=true (gates login, no spinner infinito)
```

---

## 7. Diagramas

### 7.1 Diagrama de secuencia — refresh 401 terminación

```
Usuario          Interceptor        authService       terminateSession       Login
   │                 │                  │                    │                │
   │── ERP request ─►│                  │                    │                │
   │                 │── 401 ──────────►│                    │                │
   │                 │── refresh() ────►│                    │                │
   │                 │◄── 401 ──────────│                    │                │
   │                 │── classify ──────────────────────────►│                │
   │                 │                  │    cleanup+RQ clear  │                │
   │                 │◄── processQueue rejected ─────────────│                │
   │                 │                  │    toast + navigate ────────────────►│
   │◄── login page ─────────────────────────────────────────────────────────────│
```

### 7.2 Diagrama de estados — sesión autenticada

```
                    ┌──────────────┐
                    │ ANONYMOUS    │
                    └──────┬───────┘
                           │ login / bootstrap OK
                           ▼
                    ┌──────────────┐
              ┌────►│ AUTHENTICATED│◄────┐
              │     │ _FULL/MIN    │     │ refresh OK (Fase 1)
              │     └──────┬───────┘     │
              │            │ 401 refresh fail / logout / hydrate fail
              │            ▼
              │     ┌──────────────┐
              └─────│ TERMINATING  │ (nuevo estado transitorio)
                    └──────┬───────┘
                           │ cleanup complete
                           ▼
                    ┌──────────────┐
                    │ ANONYMOUS    │ + redirect /login
                    └──────────────┘
```

### 7.3 Diagrama — decisión classify refresh 401

```
AxiosError 401 from /auth/refresh/
        │
        ├─ detail contiene indicadores TOKEN_REUSE / seguridad / "todas las sesiones"
        │       → TOKEN_REUSE
        ├─ detail contiene "cerrada remotamente" / §19 estándar
        │       → SESSION_EXPIRED (o REFRESH_REVOKED si discriminable)
        ├─ sin detail / genérico
        │       → REFRESH_UNAUTHORIZED
        └─ fallback
                → REFRESH_UNAUTHORIZED
```

---

## 8. Contratos

### 8.1 Funciones nuevas

| Función | Entrada | Salida |
|---------|---------|--------|
| `classifySessionTermination` | `{ httpStatus?, detail?, url?, context? }` | `SessionTerminationClassification` |
| `terminateSession` | `TerminateSessionInput`, `TerminateSessionDeps` | `Promise<void>` |
| `resolveTerminationUx` | `SessionTerminationReason` | `SessionTerminationUxProfile` |
| `buildLoginRedirectPath` | `reason`, `options?` | `string` |

### 8.2 `TerminateSessionInput` (conceptual)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `reason` | `SessionTerminationReason` | Motivo canónico (requerido) |
| `callServer` | `boolean` | POST `/auth/logout/` best-effort |
| `error` | `unknown` opcional | Error original para logs DEV |
| `skipRedirect` | `boolean` opcional | Solo limpieza (tests / impersonation edge) |
| `preservePreLoginBranding` | `boolean` | Hereda lógica `hadAuthenticatedUser` |

### 8.3 `TerminateSessionDeps` (conceptual)

| Dep | Responsabilidad |
|-----|-----------------|
| `clearAuthState` | Equivalente bloque limpieza `doLogout` |
| `processQueue` | Rechazar cola |
| `callLogoutEndpoint` | `authService.logout()` |
| `clearQueryCache` | `queryClient.clear()` |
| `showTerminationToast` | `toast.error` / `toast.success` según reason |
| `redirectToLogin` | `navigate(path, { replace: true })` |
| `emitTerminationEvent` | Hook vacío Fase 4 (no-op default) |
| `getIsTerminating` / `setIsTerminating` | Guard idempotencia |

### 8.4 Parser TOKEN_REUSE — reglas

Sin `error_code` estructurado en API actual. Clasificación por `detail` string (case-insensitive):

| Patrón en `detail` | Reason |
|--------------------|--------|
| `token_reuse`, `reutilización`, `seguridad`, `todas sus sesiones`, `all sessions` | `TOKEN_REUSE` |
| `cerrada remotamente`, `expirada`, `vuelva a iniciar` | `SESSION_EXPIRED` |
| `idle`, `inactividad` | `IDLE_TIMEOUT` |
| default 401 refresh | `REFRESH_UNAUTHORIZED` |

**Extensibilidad:** si BE expone `error_code` en futuro, parser prioriza código sobre heurística texto.

### 8.5 Funciones que cambian (comportamiento)

| Función | Cambio |
|---------|--------|
| `doLogout` | Wrapper → `terminateSession` cuando flag ON |
| `logout` | Usa `terminateSession(MANUAL_LOGOUT)` |
| Interceptor catch | Clasifica + `terminateSession` |
| Bootstrap catch | Clasifica + `terminateSession` |
| `hydrateSessionCore` DI `doLogout` | Recibe terminator con reason |

### 8.6 Funciones congeladas (Fase 1)

| Función | Notas |
|---------|-------|
| `applyPostRefreshSession` | Sin cambio en éxito |
| `hydrateSessionCore` | Sin cambio cuerpo |
| `applyClaimsSync` | Sin cambio |
| `resolveHydrationLevel` | Sin cambio |
| `session-rq-invalidation` | Sin cambio |
| `processQueue` | Misma firma |

---

## 9. Integración con AuthContext

| Aspecto | Integración |
|---------|-------------|
| Nuevo ref | `isTerminatingRef` — evita doble terminación |
| `doLogout` | Delega en `terminateSession` si `SESSION_TERMINATION_V2_ENABLED` |
| `logout` | `terminateSession({ reason: MANUAL_LOGOUT, callServer: true })` |
| `queryClient` | Pasado a deps `clearQueryCache` |
| `useNavigate` | Pasado a deps `redirectToLogin` |
| API `useAuth` | **Sin nuevos campos públicos** |
| `isBootstrapped` / `loading` | Bootstrap fail: mantener gates true para mostrar login |

**Wiring mínimo:** AuthContext crece solo en puntos de salida; bloque refresh éxito Fase 1 intacto.

---

## 10. Integración con interceptor

| Rama | Fase 1 | Fase 2 |
|------|--------|--------|
| 401 + refresh OK + hydrate | Orquestador Fase 1 | **Sin cambio** |
| 401 + refresh fail | `doLogout(false)` | `classify` + `terminateSession` |
| 401 + post-refresh throw | `doLogout(false)` | `terminateSession(HYDRATE_FAILED)` |
| Modo soporte 401 | `reject` sin refresh | **Sin cambio** (Fase 6) |
| Cola concurrente | Await promise completa | Rechazo con error al terminar |

**Orden en catch refresh fail:**

1. `terminateSession` (incluye `processQueue`)
2. **No** llamar `doLogout` adicional (evitar doble cleanup)

---

## 11. Integración con applyPostRefreshSession

| Escenario | Acción Fase 2 |
|-----------|---------------|
| Éxito NONE/FULL | **Sin cambio** |
| `applyClaimsSync` throw (token inválido) | Propaga → interceptor → `terminateSession` |
| `hydrateSessionCore` return null | Throw existente → `HYDRATE_FAILED` |
| `hydrateSessionCore` throw | Propaga → `terminateSession` |

**No modificar** el orquestador Fase 1; solo el **caller** (interceptor) cambia el manejo del catch.

---

## 12. Integración con hydrateSessionCore

| Modo | Integración |
|------|-------------|
| `bootstrap` | `fetchMe` null → DI `doLogout` → `terminateSession(BOOTSTRAP_FAILED\|HYDRATE_FAILED)` |
| `interceptor` | Idem vía throw al orquestador |
| `full-session-token` | Sin cambio semántica; usa mismo DI |

**Cambio:** sustituir DI `doLogout: () => terminateSession(...)` con reason apropiado. Cuerpo `hydrateSessionCore` **sin edición**.

---

## 13. Integración con processQueue

| Evento | Comportamiento |
|--------|----------------|
| Pre-terminación | `isRefreshingPromise` anulado |
| Terminación | `processQueue(new Error('Session terminated'), null)` — mensaje estable |
| Requests encolados | Reciben reject; **no** retry con token viejo |
| Post-terminación | `isRefreshingPromise = null` (ya en finally interceptor) |

**Firma `processQueue`:** sin cambio (requisito explícito).

---

## 14. Integración con React Query

| Evento | Acción Fase 2 |
|--------|---------------|
| Cualquier `terminateSession` | `queryClient.clear()` **siempre** |
| Refresh OK NONE | Sin invalidación (Fase 1) |
| Refresh OK FULL | Matriz Fase 1 (`org-inv` / `clear-all`) |
| `applyFullSessionToken` | Sin cambio (ya clear) |

**Decisión:** terminación es más fuerte que invalidación parcial — clear global garantiza V2.6.

**Orden:** clear RQ **después** de rechazar cola, **antes** de redirect (evita fetch en rutas protegidas durante navegación).

---

## 15. Integración con TenantProvider

| Aspecto | Impacto Fase 2 |
|---------|----------------|
| `queryClient.clear()` en terminación | Dispara refetch tenant/branding vía effects existentes |
| `auth.token = null` | `derivedTenantId` → estado pre-login |
| Branding | `brandingStore.clearAll` ya en cleanup — sin cambio |

**Diseño:** efecto TenantContext post-clear es **idempotente**; no requiere cambios en TenantProvider.

---

## 16. Integración con PermissionProvider

| Aspecto | Impacto Fase 2 |
|---------|----------------|
| `!isAuthenticated` tras terminación | Effect resetea permisos vacíos + `permissionsInitialized=true` |
| Redirect login antes de mount ERP | Usuario no ve evaluación RBAC stale |

**Sin cambios** en PermissionProvider; beneficiario de cleanup determinista.

---

## 17. Integración con ProtectedRoute

| Aspecto | Antes | Después Fase 2 |
|---------|-------|----------------|
| Redirect login | Primario vía `!isAuthenticated` | **Secundario** — redirect explícito en `terminateSession` |
| Spinner gates | Durante bootstrap | Sin cambio |
| Flash contenido | Posible entre logout y re-render | Mitigado por redirect inmediato + RQ clear |

**Sin modificar** ProtectedRoute en Fase 2 — actúa como red de seguridad si redirect explícito falla.

---

## 18. Integración con PermissionGuard

| Aspecto | Impacto |
|---------|---------|
| Rutas `/app/*` con terminación en vuelo | Redirect login ocurre antes de evaluar `can()` |
| `menuPermissionsReady` tras terminación | Estado limpiado; guard no montado en login |

**Sin cambios** en PermissionGuard.

---

## 19. Estados de terminación

### 19.1 Estado persistente sesión (post Fase 2)

| Estado | Condición |
|--------|-----------|
| `ANONYMOUS` | Sin token/user; post-terminación o pre-login |
| `AUTHENTICATED_MINIMAL` | Token + user parcial |
| `AUTHENTICATED_FULL` | Token + user + menú ready |
| `TERMINATING` | Transitorio durante `terminateSession` (ref interno, no público) |

### 19.2 Ciclo terminación (transitorio)

| Desde | Evento | Hacia |
|-------|--------|-------|
| AUTHENTICATED_* | refresh 401 / logout / hydrate fail | TERMINATING |
| TERMINATING | cleanup OK | ANONYMOUS + redirect |
| TERMINATING | segunda llamada terminate | TERMINATING (no-op idempotente) |

### 19.3 Invariantes Fase 2

1. Tras `terminateSession`, no existe token en `authRef`.
2. Ningún request encolado en `failedQueueRef` queda pendiente.
3. `isRefreshingPromise === null` al finalizar.
4. `queryClient` no contiene queries autenticadas activas.
5. Usuario termina en `/login` (salvo `skipRedirect` tests).
6. Refresh 401 **nunca** dispara segundo `POST /auth/refresh/`.
7. Fase 1 hydrate **no se invoca** en caminos de terminación.

---

## 20. UX

### 20.1 Matriz mensajes

| Reason | Toast | Query param login | Severidad |
|--------|-------|-------------------|-----------|
| `MANUAL_LOGOUT` | Opcional: "Sesión cerrada" | — | info |
| `SESSION_EXPIRED` | §19 estándar o `detail` BE | `?session=expired` | error |
| `REFRESH_UNAUTHORIZED` | Igual SESSION_EXPIRED | `?session=expired` | error |
| `TOKEN_REUSE` | Mensaje seguridad diferenciado | `?session=security` | error |
| `IDLE_TIMEOUT` | "Sesión cerrada por inactividad" | `?session=idle` | warning |
| `HYDRATE_FAILED` | "No se pudo restaurar la sesión" | `?session=error` | error |
| `BOOTSTRAP_FAILED` | §19 estándar | `?session=expired` | error |
| `MANUAL_LOGOUT` silent legacy | Ninguno (flag OFF) | — | — |

### 20.2 Mensaje TOKEN_REUSE (FE)

Texto propuesto (si BE no envía detail específico):
> "Por seguridad, tu sesión fue cerrada en todos los dispositivos. Inicia sesión nuevamente."

Prioridad: `detail` del backend > copy FE.

### 20.3 Redirect

| Regla | Valor |
|-------|-------|
| Ruta destino | `/login` |
| Método | `navigate(path, { replace: true })` |
| Preservar `from` | **No** en terminación por seguridad (evita loop) |
| Login page | Lee `searchParams.get('session')` → muestra banner |

### 20.4 Lo que NO hace Fase 2

- Modal full-page "sesión expirada" (Fase 7)
- Polling revoke remoto (Fase 3)
- Sync mensaje entre pestañas (Fase 4)

---

## 21. Rollback

### 21.1 Feature flag

| Flag | Default | Ubicación |
|------|---------|-----------|
| `SESSION_TERMINATION_V2_ENABLED` | `true` | `session-termination.flags.ts` |
| Env | `VITE_SESSION_TERMINATION_V2_ENABLED` | Compile-time Vite |

### 21.2 Comportamiento flag OFF

| Aspecto | Comportamiento |
|---------|----------------|
| `doLogout` | Implementación legacy actual (sin redirect, sin toast, sin RQ clear) |
| Interceptor catch | `doLogout(false)` directo |
| Fase 1 hydrate | **Sin cambio** — independiente del flag Fase 2 |

### 21.3 Niveles rollback (§11.4 plan)

| Nivel | Procedimiento |
|-------|---------------|
| L1 Runtime | `VITE_SESSION_TERMINATION_V2_ENABLED=false` + redeploy |
| L2 Código | Revert commits Fase 2 |
| L3 Parcial | Flag OFF prod; staging con flag ON |

**Independencia:** `REFRESH_HYDRATE_ENABLED` (Fase 1) y `SESSION_TERMINATION_V2_ENABLED` (Fase 2) son ortogonales.

---

## 22. Riesgos

### 22.1 Riesgos arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación |
|--------|-------|-----------|------------|
| Doble redirect (`terminateSession` + ProtectedRoute) | Media | Baja | `replace: true`; login route fuera de ProtectedRoute |
| `queryClient.clear()` agresivo en logout manual | Baja | Media | Aceptado — V2.6; branding pre-login preservado vía store |
| Parser TOKEN_REUSE falso positivo por texto | Baja | Alta | Lista patrones conservadora; tests con fixtures BE |
| Idempotencia terminate vs logout concurrente | Media | Media | `isTerminatingRef` guard |
| Regresión Fase 1 refresh OK | Baja | Alta | Tests regresión V1.x + flag Fase 1 ON |

### 22.2 Riesgos UX

| Riesgo | Mitigación |
|--------|------------|
| Flash login banner duplicado (toast + banner) | Toast OR banner en login, no ambos para mismo evento |
| Spinner infinito bootstrap fail | Mantener `isBootstrapped=true` en finally bootstrap |

### 22.3 Riesgos operativos

| Riesgo | Mitigación |
|--------|------------|
| Staging sin probar TOKEN_REUSE real | Simular 401 con detail BE en mock/staging |
| Flag OFF accidental en prod | Default true; documentar en runbook |

---

## 23. Plan de implementación

Orden por dependencias. Sin código en este documento.

| Orden | Entregable | Depende de |
|-------|------------|------------|
| 1 | `session-termination-reason.ts` + tests parser | — |
| 2 | `session-termination-ux.ts` + tests mensajes | 1 |
| 3 | `session-terminate.ts` + tests orquestador puro | 1, 2 |
| 4 | Wiring `AuthContext` — `terminateSession` deps | 3 |
| 5 | Migrar `doLogout` / `logout` | 4 |
| 6 | Interceptor catch + bootstrap catch | 4, 5 |
| 7 | DI hydrate `doLogout` → terminator | 4 |
| 8 | Login page query param banner | 2 |
| 9 | `session-termination.flags.ts` + rollback | 4 |
| 10 | Tests integración + regresión V1.x | 1–9 |
| 11 | Validación V2.x staging | 10 |

---

## 24. División por pasos

### Paso 1 — Taxonomía y clasificación

**Entregable:** `session-termination-reason.ts`

- Definir `SessionTerminationReason`, `classifySessionTermination`
- Tests: 401 genérico, §19 detail, TOKEN_REUSE patterns, hydrate context

**Habilita:** Pasos 2–3

---

### Paso 2 — Perfiles UX

**Entregable:** `session-termination-ux.ts`

- `resolveTerminationUx`, `buildLoginRedirectPath`
- Tests: cada reason → mensaje + query param

**Habilita:** Paso 3

---

### Paso 3 — Orquestador terminación

**Entregable:** `session-terminate.ts`

- `terminateSession` con DI completa
- Tests: orden cleanup, idempotencia, processQueue, skipRedirect

**Habilita:** Pasos 4–7

---

### Paso 4 — Wiring AuthContext base

**Entregable:** deps + `isTerminatingRef`

- Factory `getTerminateSessionDeps`
- Sin migrar call sites aún (feature flag interno)

**Habilita:** Pasos 5–7

---

### Paso 5 — Migración doLogout / logout

**Entregable:** wrapper retrocompatible

- Flag ON: `doLogout` → `terminateSession`
- Flag OFF: comportamiento legacy

**Habilita:** Paso 6

---

### Paso 6 — Interceptor y bootstrap

**Entregable:** catch paths clasificados

- Interceptor refresh fail
- Bootstrap refresh fail
- Verificar coexistencia Fase 1 éxito

**Habilita:** Paso 7

---

### Paso 7 — hydrateSessionCore DI

**Entregable:** callback logout con reason

- `HYDRATE_FAILED` en me null
- Sin editar `session-refresh-hydrate.ts` cuerpo

**Habilita:** Paso 8

---

### Paso 8 — Login UX

**Entregable:** banner/query param en Login page

- Leer `?session=expired|security|idle|error`
- Sin duplicar toast si ya mostrado (sessionStorage flag opcional)

**Habilita:** Paso 9

---

### Paso 9 — Feature flag rollback

**Entregable:** `session-termination.flags.ts`

- `VITE_SESSION_TERMINATION_V2_ENABLED`
- Tests flag ON/OFF

**Habilita:** Paso 10

---

### Paso 10 — Validación y cierre

**Entregable:** V2.1–V2.6 + regresión V1.x

**Depende de:** Pasos 1–9

---

## 25. Criterios de aceptación

### 25.1 Escenarios obligatorios V2.x

| ID | Escenario | Criterio éxito |
|----|-----------|----------------|
| **V2.1** | Refresh 401 interceptor | Limpieza completa; redirect `/login`; sin reintento refresh |
| **V2.2** | Refresh 401 bootstrap | Igual V2.1 |
| **V2.3** | Mensaje backend §19 en body | Usuario ve mensaje (toast o login banner) |
| **V2.4** | TOKEN_REUSE simulado | Mensaje **diferente** de expiración normal |
| **V2.5** | Cola tras refresh fail | Todas rechazadas; sin requests colgadas |
| **V2.6** | `queryClient` tras terminación | Cache limpio; sin datos autenticados |

### 25.2 Regresión Fase 1 obligatoria

| ID | Escenario | Criterio |
|----|-----------|----------|
| V1.1–V1.4 | Post-refresh hydrate | Sin regresión con flag Fase 2 ON |
| E1.5 | `REFRESH_HYDRATE_ENABLED=false` | Sin regresión |

### 25.3 Criterios done §11.5 (extensión Fase 2)

- [ ] V2.1–V2.6 pasan en staging
- [ ] Regresión V1.x verde con ambos flags ON
- [ ] Flag rollback Fase 2 verificado
- [ ] Sin cambios contrato API
- [ ] `useAuth` sin breaking changes

---

## 26. Estrategia de pruebas

### 26.1 Tests unitarios (módulos puros)

| Módulo | Casos mínimos |
|--------|---------------|
| `classifySessionTermination` | 401 sin detail; §19 detail; TOKEN_REUSE patterns; non-refresh context |
| `resolveTerminationUx` | Cada reason; TOKEN_REUSE ≠ SESSION_EXPIRED |
| `terminateSession` | Orden: queue → state → RQ → UX; idempotencia; skipRedirect |
| Flags | Default true; false → legacy path |

### 26.2 Tests integración (contrato)

| Contrato | Verificación |
|----------|--------------|
| Interceptor fail | classify → terminate; no second refresh |
| Fase 1 success path | `applyPostRefreshSession` no llama terminate |
| processQueue | Reject con error estable |
| Bootstrap 401 | terminate + bootstrapped true |

### 26.3 Escenarios adicionales E2.x (Fase 2)

| ID | Escenario | Criterio |
|----|-----------|----------|
| E2.1 | Logout manual doble click | Idempotente; sin error |
| E2.2 | terminate durante refresh in-flight | Cola rechazada; sin hang |
| E2.3 | HYDRATE_FAILED post-refresh FULL | Terminación con mensaje |
| E2.4 | Flag SESSION_TERMINATION OFF | Legacy idéntico pre-Fase 2 |
| E2.5 | Login con `?session=security` | Banner seguridad visible |

### 26.4 Smoke regression

Re-ejecutar checklist §10.4 plan tras Fase 2:

- Login Schema B → ERP → forzar expiración → login con mensaje
- F5 cookie inválida → login con mensaje
- Logout manual → login sin datos stale en DevTools RQ

### 26.5 Evidencia staging

Por cada V2.x:

- Network: `refresh` 401 → sin segundo refresh
- Pantalla: redirect `/login` < 500ms percibido
- React Query DevTools: cache vacío post-terminación
- Captura mensaje TOKEN_REUSE vs expired

---

## 27. Estrategia de auditoría

### 27.1 Auditorías por paso (recomendado)

| Paso | Ticket auditoría | Foco |
|------|------------------|------|
| 1–3 | AUDIT-02-01 | Módulos puros, parser, orden terminate |
| 4–7 | AUDIT-02-02 | Wiring AuthContext, no regresión Fase 1 |
| 8–9 | AUDIT-02-03 | UX login, flags, rollback |
| 10 | AUDIT-02-04 | Validación V2.x + cierre |

### 27.2 Checklist auditoría transversal

| # | Pregunta |
|---|----------|
| A1 | ¿`applyPostRefreshSession` éxito sin cambios? |
| A2 | ¿`hydrateSessionCore` cuerpo sin cambios? |
| A3 | ¿`processQueue` firma sin cambios? |
| A4 | ¿Refresh 401 nunca reintenta? |
| A5 | ¿`queryClient.clear()` en toda terminación flag ON? |
| A6 | ¿TOKEN_REUSE UX diferenciado? |
| A7 | ¿API `useAuth` intacta? |
| A8 | ¿Flags Fase 1 y Fase 2 independientes? |

### 27.3 Clasificación hallazgos

Igual que Fase 1: P0 bloqueante, P1 significativo, P2 residual, P3 menor.

---

## 28. Criterios de cierre

### 28.1 Cierre Fase 2 — técnico

| Criterio | Requerido |
|----------|-----------|
| Pasos 1–10 implementados | Sí |
| AUDIT-02-04 APPROVED | Sí |
| V2.1–V2.6 staging documentados | Sí |
| V1.1–V1.4 regresión verde | Sí |
| GAP-P0-04, GAP-P0-05 cerrados | Sí |
| Rollback flag verificado | Sí |

### 28.2 Habilitación Fase 3

Tras cierre Fase 2:

- `terminateSession` es el **único punto** de salida de sesión
- Fase 3 añade Logout All UI llamando `terminateSession(MANUAL_LOGOUT)` post `logout_all` 200
- Fase 3 añade detección proactiva revoke sin modificar parser Fase 2

### 28.3 Habilitación Fase 4

- `emitTerminationEvent` en deps (no-op Fase 2) recibe implementación BroadcastChannel
- Pestaña B escucha → `terminateSession` local con reason `REMOTE_LOGOUT` / `CROSS_TAB_LOGOUT`

### 28.4 Documentos derivados previstos

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-02-IMPL-REASON | Paso 1 |
| IAM-FE-PHASE-02-IMPL-TERMINATE | Pasos 2–3 |
| IAM-FE-PHASE-02-IMPL-WIRING | Pasos 4–7 |
| IAM-FE-PHASE-02-IMPL-UX-FLAG | Pasos 8–9 |
| IAM-FE-PHASE-02-VALIDATION | Paso 10 |

---

## Referencias cruzadas

| Documento | Sección relevante |
|-----------|-------------------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` | §5 Fase 2, §8 V2.x, GAP-P0-04/05 |
| `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | §6 Logout, §19 Limitaciones, FE-P0-04 |
| `IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` | Orquestador hydrate — base congelada |
| `IAM_SESSION_MANAGEMENT_V2.md` | §19 Contrato FE, TOKEN_REUSE, Session Expired |
| `ERP_FRONTEND_STANDARDS_V2.md` | ER-01 errores, UX toast |

---

## Tickets derivados

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-02-DESIGN-01 | Este documento |
| IAM-FE-PHASE-02-IMPL-* | Pasos 1–10 |
| IAM-FE-PHASE-02-AUDIT-* | Auditorías por bloque |
| IAM-FE-PHASE-02-VALIDATION | Cierre operativo |

---

**Fin del diseño IAM-FE-PHASE-02 — Session Termination Contract**
