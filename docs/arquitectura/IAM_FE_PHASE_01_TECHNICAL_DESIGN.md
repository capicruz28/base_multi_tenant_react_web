# IAM-FE-PHASE-01 — Diseño Técnico: Post-Refresh Session Alignment

**Ticket diseño:** IAM-FE-PHASE-01-DESIGN-01  
**Ticket implementación:** IAM-FE-PHASE-01-REFRESH-HYDRATE  
**Versión:** 1.0  
**Estado:** DESIGN ONLY — sin implementación  
**Fecha:** 2026-06-19  
**Referencias normativas:**
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` — Fase 1
- `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` — estado actual
- `IAM_SESSION_MANAGEMENT_V2.md` — contrato backend §5, §9, §19

> Este documento define **cómo** se implementará la Fase 1.  
> No contiene código, pseudocódigo, parches ni modificaciones a documentos existentes.

---

## Índice

1. [Objetivo técnico](#1-objetivo-técnico)
2. [Arquitectura actual](#2-arquitectura-actual)
3. [Arquitectura objetivo](#3-arquitectura-objetivo)
4. [Secuencia completa del refresh](#4-secuencia-completa-del-refresh)
5. [Cambios de flujo](#5-cambios-de-flujo)
6. [Máquina de estados](#6-máquina-de-estados)
7. [Impacto por componente](#7-impacto-por-componente)
8. [Contratos internos](#8-contratos-internos)
9. [Plan de implementación](#9-plan-de-implementación)
10. [Plan de pruebas](#10-plan-de-pruebas)
11. [Riesgos, mitigación y rollback](#11-riesgos-mitigación-y-rollback)

---

## 1. Objetivo técnico

### 1.1 Problema que resuelve

Hoy existen **dos semánticas distintas** de post-refresh en el frontend:

| Contexto | Post-refresh actual | Fuente sesión |
|----------|---------------------|---------------|
| **Bootstrap** (`runBootstrap`) | `initializeAuth()` → `GET /auth/me` + menú + empresa | Alineado con BE |
| **Interceptor 401** | Solo `auth.token` + `user.requires_password_change` desde JWT | **Desalineado** |

El backend, tras refresh exitoso, emite un **nuevo access JWT** cuyo `empresa_id` refleja la fuente de verdad de BD (`refresh_tokens.empresa_id` > claim JWT anterior). El interceptor **no propaga** ese valor ni re-sincroniza user, menú, permisos ni `scopeEmpresaId`.

**Consecuencia verificable:** un usuario puede operar en módulos company-scoped (`useOrgSessionScope`, `useInvSessionScope`) con `empresaActivaId` obsoleto tras un 401→refresh, mientras el Bearer enviado ya lleva la empresa correcta.

### 1.2 GAP que cierra

| ID | Descripción | Cierre Fase 1 |
|----|-------------|---------------|
| **GAP-P0-01** | Post-refresh interceptor no re-hidrata sesión (`/auth/me`, `empresa_id` BD, menú) | **Cierre completo** |
| **GAP-P1-07** (parcial) | Dual permisos puede desincronizarse tras refresh sin reload menú | **Cierre parcial** — menú se recarga solo si política FULL |

### 1.3 Comportamiento backend relevante (evidencia V2)

El diseño FE debe consumir sin alterar el contrato API:

| Aspecto BE | Implicación para Fase 1 FE |
|------------|---------------------------|
| `empresa_id` en refresh desde **BD** (`refresh_tokens.empresa_id`) | Nuevo access JWT puede traer `empresa_id` distinto al state FE previo |
| Outcomes `ROTATED` / `ALREADY_ROTATED` → HTTP 200 + nuevo `access_token` | FE recibe siempre nuevo access en 200; cookie puede o no rotar (web) |
| `suppress_session_rotated_reuse` en endpoint refresh | F5 concurrente seguro; FE no debe disparar segundo refresh inmediato |
| Impersonación → refresh **403** | Fuera de alcance Fase 1 — interceptor sigue omitiendo refresh en modo soporte |
| Refresh 401 unificado | Sin cambio Fase 1 — sigue `doLogout(false)` (Fase 2 mejorará UX) |
| Refresh 500 | Sin retry Fase 1 — sigue fail-fast (Fase 5) |

### 1.4 Objetivo técnico formal

Introducir una capa **Post-Refresh Session Hydration** que, tras todo refresh exitoso disparado por el interceptor 401:

1. **Siempre** sincronice claims críticos del nuevo access JWT al estado React.
2. **Condicionalmente** ejecute hidratación completa (`/auth/me` + menú + invalidación RQ) según diff de contexto de sesión.
3. **Nunca** eleve `loading` global ni `menuPermissionsReady=false` en refreshes silenciosos sin cambio de contexto.
4. **Garantice** que `processQueue` libere requests encolados solo cuando el token **y** el contexto mínimo requerido estén listos.

### 1.5 Criterios de aceptación (enlace plan)

Escenarios obligatorios del plan de alineación: **V1.1, V1.2, V1.3, V1.4**.

---

## 2. Arquitectura actual

### 2.1 Componentes involucrados en refresh

```
┌─────────────────────────────────────────────────────────────────┐
│ AuthProvider (AuthContext.tsx)                                    │
│  ├─ isRefreshingPromise (module-level)                           │
│  ├─ failedQueueRef                                               │
│  ├─ processQueue / doLogout                                      │
│  ├─ response interceptor (401 branch)                              │
│  ├─ initializeAuth (solo bootstrap / applyFullSessionToken)      │
│  ├─ syncEmpresaSession                                           │
│  └─ loadMenuAndPermissionsFromAuthMenu                           │
└───────────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬──────────────────┐
    ▼           ▼           ▼                  ▼
auth.service  decodeAccessToken  api (apiCentral)  useQueryClient
refreshToken  session-token.ts   interceptors      invalidateOrg/Inv
```

### 2.2 Hooks y consumers downstream

| Hook / Consumer | Dependencia de sesión post-refresh |
|-----------------|----------------------------------|
| `useAuth` | `auth.token`, `auth.user`, `empresaActivaId`, `menuModulos`, `menuPermissionsReady` |
| `useEmpresaActiva` | Wrapper de `empresaActivaId` |
| `useOrgSessionScope` | `scopeEmpresaId` ← `empresaActivaId`; invalida ORG al cambiar |
| `useInvSessionScope` | Idem INV |
| `usePermissions` | Permisos ruta desde menú AuthContext |
| `usePermission` | `GET /auth/permissions/me`; refetch en `empresaActivaId` |
| `useTenant` | `tenantId` desde JWT/user — independiente de refresh interceptor hoy |

### 2.3 Providers en cadena

| Provider | Relación con refresh interceptor actual |
|----------|----------------------------------------|
| `AuthProvider` | Único que ejecuta refresh y actualiza token |
| `TenantProvider` | Reacciona a `auth.token` / user vía `derivedTenantId` — no recibe sync empresa |
| `PermissionProvider` | Re-fetch `/auth/permissions/me` si `empresaActivaId` cambia — **no cambia hoy** en interceptor |
| `BrandingInitializer` | Por `tenantId` — sin impacto refresh normal |

### 2.4 Servicios HTTP

| Servicio | Rol en refresh |
|----------|----------------|
| `authService.refreshToken()` | `POST /auth/refresh/` → retorna `access_token` string |
| `authService.me()` | Solo en `initializeAuth` — no en interceptor |
| `menuService.getAuthMenu()` | Solo en `loadMenuAndPermissionsFromAuthMenu` |

### 2.5 Interceptor — comportamiento actual (401)

Archivo: `src/shared/context/AuthContext.tsx` (response interceptor, rama 401).

Secuencia actual tras `authService.refreshToken()` exitoso:

1. `decodeAccessToken(newToken)` → solo `requires_password_change`
2. Merge parcial en `auth.user`
3. `setAuth` + `authRef.current` actualizados
4. `processQueue(null, newToken)` — libera cola
5. Reintento `originalRequest` con nuevo Bearer

**No invoca:** `syncEmpresaSession`, `initializeAuth`, `loadMenuAndPermissionsFromAuthMenu`, invalidación RQ.

### 2.6 React Query — comportamiento actual

| Evento | Invalidación |
|--------|--------------|
| Refresh interceptor OK | **Ninguna** |
| `applyFullSessionToken` | `queryClient.clear()` + ORG/INV |
| Cambio `scopeEmpresaId` | `invalidateOrgQueries` / `invalidateInvQueries` vía hooks scope |

**Implicación:** si `empresaActivaId` no se actualiza en interceptor, los hooks scope **no invalidan** aunque el JWT ya tenga empresa nueva.

### 2.7 Bootstrap — comportamiento actual (referencia)

Tras `refreshToken()` OK en `runBootstrap`:

1. Guarda token en memoria
2. Llama `initializeAuth()` — hidratación completa
3. Establece `isBootstrapped`, `authInitialized`

**Fase 1 no modifica bootstrap** salvo extracción de lógica compartida interna.

---

## 3. Arquitectura objetivo

### 3.1 Principio de diseño: hidratación en dos niveles

| Nivel | Nombre | Cuándo | Coste red | Alcance |
|-------|--------|--------|-----------|---------|
| **L0** | Token swap | Siempre tras refresh OK | 0 | `auth.token`, `authRef` |
| **L1** | Claims sync | Siempre tras refresh OK | 0 | Claims JWT → state derivado |
| **L2** | Full hydrate | Si diff de contexto lo exige | 1–2 requests | `/auth/me` + menú condicional + RQ |

**Regla:** L1 es síncrono y barato. L2 es async y solo cuando el diff lo marca necesario.

### 3.2 Qué cambia

| Elemento | Cambio |
|----------|--------|
| Rama éxito interceptor 401 | Insertar orquestador post-refresh entre `refreshToken()` y `processQueue()` |
| Estado AuthContext | Posible ref `sessionHydrationPhase` interno (no expuesto en `useAuth`) |
| Módulo utilidad nuevo | Política diff + aplicación L1/L2 |
| `initializeAuth` | Refactor interno: extraer núcleo reutilizable por bootstrap y L2 |
| Cola `failedQueueRef` | Liberación **después** de L1; si L2 requerido, después de L2 completar |
| Invalidación RQ | Condicional en L2 cuando `empresa_id` o `cliente_id` cambian |

### 3.3 Qué NO cambia

| Elemento | Razón |
|----------|-------|
| `authService.refreshToken` contrato HTTP | Sin cambio API |
| `isRefreshingPromise` single-flight | Patrón correcto; solo extender trabajo interno |
| Skip-list `shouldSkipTokenRefresh` | Sin cambio |
| Modo soporte — omitir refresh | Fase 6 |
| `doLogout` en refresh fail | Fase 2 mejora UX |
| Bootstrap paths y excepciones | Regresión V1.4 |
| `applyFullSessionToken` | Ya hace L2 completo |
| `cambiarEmpresaActiva` / `completeEmpresaSelection` | Flujos propios |
| Request interceptor | Solo Bearer; sin cambio |
| Providers orden Auth→Tenant→Permission | Sin cambio estructural |
| `ProtectedRoute` API pública | Sin nuevos props |

### 3.4 Componentes que permanecen

- `AuthProvider` / `useAuth` — mismo contrato público
- `authService`, `menuService`, `apiCentral`
- `decodeAccessToken`, `session-token.ts`, `empresa-access.ts`
- `useOrgSessionScope`, `useInvSessionScope` — reaccionarán automáticamente si `empresaActivaId` se actualiza
- `PermissionProvider` — efecto existente en `empresaActivaId`
- `TenantProvider` — efecto existente en `auth.token` / user

### 3.5 Componentes nuevos (solo diseño)

| Artefacto | Ubicación propuesta | Responsabilidad |
|-----------|---------------------|-----------------|
| `session-claims-snapshot.ts` | `src/core/auth/session/` | Tipos y construcción snapshot pre/post refresh |
| `session-refresh-diff.ts` | `src/core/auth/session/` | Política diff → nivel hidratación requerido |
| `session-claims-sync.ts` | `src/core/auth/session/` | Aplicar L1 a state vía callbacks inyectados |
| `session-refresh-hydrate.ts` | `src/core/auth/session/` | Orquestador L2; delega en núcleo extraído de `initializeAuth` |
| `refresh-hydrate.flags.ts` | `src/core/auth/session/` | Feature flag rollback `REFRESH_HYDRATE_ENABLED` |

**Nota:** La carpeta `session/` es propuesta de diseño para Fase 9 refactor; en Fase 1 puede vivir como módulos sin mover `AuthContext` aún.

### 3.6 Diagrama arquitectura objetivo

```
                    ┌──────────────────────────────┐
                    │   Response Interceptor 401    │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  runRefreshSingleFlight()     │  ← existente, extendido
                    │  authService.refreshToken()   │
                    └──────────────┬───────────────┘
                                   │ access_token
                    ┌──────────────▼───────────────┐
                    │  applyPostRefreshSession()    │  ← NUEVO orquestador
                    │   ├─ L0 token swap            │
                    │   ├─ L1 claims sync           │
                    │   └─ L2 full hydrate (opt.)   │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
      syncEmpresaSession    hydrateSessionCore     invalidate RQ
      (existente)           (extraído initialize)   (condicional)
                                   │
                    ┌──────────────▼───────────────┐
                    │  processQueue(newToken)       │
                    │  retry originalRequest          │
                    └──────────────────────────────┘
```

---

## 4. Secuencia completa del refresh

### 4.1 ANTES (interceptor 401 — estado actual)

```
Request ERP
    │
    ▼ 401
Interceptor verifica skip / soporte / _retry
    │
    ├─ isRefreshingPromise activo? ──► encolar ──► esperar token ──► retry
    │
    └─ iniciar isRefreshingPromise
            │
            ▼
        POST /auth/refresh/ (cookie)
            │
            ├─ 401 ──► processQueue(error) ──► doLogout(false)
            │
            └─ 200 access_token
                    │
                    ├─ merge requires_password_change
                    ├─ setAuth(token, user parcial)
                    ├─ processQueue(token)
                    └─ retry originalRequest
```

**Estado final:** token nuevo; user/empresa/menú potencialmente obsoletos.

### 4.2 DESPUÉS (interceptor 401 — objetivo Fase 1)

```
Request ERP
    │
    ▼ 401
Interceptor verifica skip / soporte / _retry
    │
    ├─ isRefreshingPromise activo? ──► encolar ──► esperar hydrate completo ──► retry
    │
    └─ iniciar isRefreshingPromise
            │
            ▼
        POST /auth/refresh/ (cookie)
            │
            ├─ 401 ──► [sin cambio] processQueue(error) ──► doLogout(false)
            │
            └─ 200 access_token
                    │
                    ▼
            applyPostRefreshSession({ newToken, priorSnapshot })
                    │
                    ├─ L0: authRef.token = newToken
                    │
                    ├─ L1: sync claims → empresaActivaId, flags, impersonación
                    │       syncEmpresaSession(partialUser, newToken)
                    │
                    ├─ diff → NONE | FULL
                    │
                    ├─ NONE: fin (sin /auth/me)
                    │
                    └─ FULL:
                            ├─ hydrateSessionCore (authService.me + merge)
                            ├─ loadMenu si política menú
                            ├─ loadEmpresasElegibles si empresa cambió
                            ├─ invalidateOrg/Inv o clear según diff tenant/empresa
                            └─ menuPermissionsReady = true
                    │
                    ▼
            processQueue(newToken)
            retry originalRequest
```

### 4.3 Estados de datos tras cada nivel

| Campo | L0 | L1 | L2 (FULL) |
|-------|----|----|-----------|
| `auth.token` | ✅ | ✅ | ✅ |
| `empresaActivaId` | — | ✅ desde JWT | ✅ confirmado `/auth/me` |
| `auth.user` | — | parcial claims | ✅ merge `/auth/me` |
| `menuModulos` | — | — | ✅ si menú recargado |
| `permissions` (ruta) | — | — | ✅ si menú recargado |
| `menuPermissionsReady` | — | sin cambio | true al final |
| `empresasElegibles` | — | — | ✅ si empresa cambió |
| React Query cache | — | — | invalidación condicional |

### 4.4 Diagrama de secuencia — refresh concurrente (después)

```
Tab/Pestaña única (single-flight global)

Req-A ──401──► inicia refresh
Req-B ──401──► encola (espera Promise completa, no solo token)
Req-C ──401──► encola

         POST /auth/refresh/  (una sola vez)
         applyPostRefreshSession (L1 + L2 si aplica)
         processQueue

Req-A ◄── retry OK
Req-B ◄── retry OK  (mismo token + mismo contexto hidratado)
Req-C ◄── retry OK
```

**Invariante Fase 1:** ningún request encolado se reintenta hasta que `applyPostRefreshSession` termine. Evita race donde retry usa token nuevo con `empresaActivaId` viejo.

### 4.5 Bootstrap — sin cambio de secuencia externa

```
runBootstrap (default)
    POST /auth/refresh/
    setAuth({ token })
    initializeAuth()  ──► internamente puede delegar en hydrateSessionCore
    isBootstrapped = true
```

Refactor interno permitido: `initializeAuth` llama `hydrateSessionCore({ mode: 'bootstrap' })` para DRY. Comportamiento observable idéntico (V1.4).

---

## 5. Cambios de flujo

### 5.1 Refresh OK — sin cambio de contexto (V1.3)

**Condición:** diff evalúa `HydrationLevel.NONE` — claims críticos idénticos al snapshot previo.

| Aspecto | Antes | Después |
|---------|-------|---------|
| Token | Actualizado | Actualizado |
| `/auth/me` | No | **No** |
| Menú | No | **No** |
| `loading` global | No | **No** |
| `menuPermissionsReady` | Sin cambio | **Sin cambio** (no falsear) |
| UI | Sin flicker | Sin flicker |

**Claims comparados para diff (mínimo):**

| Claim / campo | Comparación |
|---------------|-------------|
| `empresa_id` | Normalizado string trim |
| `cliente_id` | Normalizado |
| `sub` | vs `user.usuario_id` |
| `user_type` | vs `user.user_type` |
| `es_admin_cliente` | boolean |
| `requires_password_change` | boolean |
| `empresa_selection_pending` | boolean |
| `is_impersonation` | boolean |

### 5.2 Refresh OK — con cambio `empresa_id` (V1.2)

**Condición:** diff evalúa `HydrationLevel.FULL` por `empresa_id` distinto.

| Aspecto | Después |
|---------|---------|
| L1 inmediato | `empresaActivaId` provisional desde JWT |
| L2 | `authService.me()` + merge + `syncEmpresaSession` |
| Menú | `loadMenuAndPermissionsFromAuthMenu` |
| RQ | `invalidateOrgQueries` + `invalidateInvQueries` (no `clear()` total salvo cambio tenant) |
| `useOrgSessionScope` | Detecta cambio `scopeEmpresaId` → invalidación adicional |
| `PermissionProvider` | Re-fetch `/auth/permissions/me` por cambio `empresaActivaId` |
| UI | Sin `loading` global; posible breve re-fetch datos en pantalla activa |

### 5.3 Refresh OK — ROTATED vs ALREADY_ROTATED

**Backend:** ambos retornan HTTP 200 + nuevo `access_token`. Cookie puede actualizarse solo en `ROTATED` (web).

**Frontend Fase 1:**

| Outcome BE | Detección FE | Acción |
|------------|--------------|--------|
| `ROTATED` | No expuesto en API response actual | Tratar como refresh OK estándar — aplicar L1 + diff |
| `ALREADY_ROTATED` | Idem | **Mismo tratamiento** — usar nuevo access; **no** segundo refresh |

**Decisión diseño:** Fase 1 **no** exige que el backend exponga `RotateOutcome` en body. La política diff opera sobre claims del nuevo access, no sobre outcome. Fase 5 podrá añadir tipado outcome si el API lo expone.

**Restricción BE L-09:** perdedor F5 recibe access temporal sin cookie renovada — FE acepta; siguiente refresh puede 401. Sin mitigación adicional Fase 1.

### 5.4 Refresh 401

**Sin cambio Fase 1.**

Secuencia preservada: `processQueue(error)` → `doLogout(false)` → reject.

Fase 2 añadirá redirect y mensaje UX.

### 5.5 Refresh 500

**Sin cambio Fase 1.**

Fail-fast → `doLogout(false)`. Retry backoff es Fase 5.

### 5.6 Cambio empresa (`cambiarEmpresaActiva`)

**Sin cambio Fase 1.**

Sigue `applyFullSessionToken` → `initializeAuth` — ya es L2 completo.

El diseño L2 debe **reutilizar el mismo núcleo** que `applyFullSessionToken` para coherencia, sin duplicar merge `/auth/me`.

### 5.7 Bootstrap

**Sin cambio observable.**

Opcional internamente: `initializeAuth` delega en `hydrateSessionCore({ mode: 'bootstrap' })`.

Regresión obligatoria: V1.4.

### 5.8 Modo soporte (impersonación)

**Sin cambio Fase 1.**

Interceptor sigue sin refresh en `isImpersonationSupportMode`. L2 no aplica en esa rama.

---

## 6. Máquina de estados

### 6.1 Estados del ciclo refresh (interceptor)

```
                    ┌──────────┐
                    │   IDLE   │  (no hay refresh en curso)
                    └────┬─────┘
                         │ 401 en request ERP
                         ▼
                 ┌───────────────┐
                 │  REFRESHING   │  isRefreshingPromise activo
                 │  POST /refresh│
                 └───────┬───────┘
                         │
            ┌────────────┼────────────┐
            │ fail       │            │ OK
            ▼            │            ▼
     ┌────────────┐      │     ┌──────────────┐
     │  FAILED    │      │     │ TOKEN_SWAP   │ L0
     │ doLogout   │      │     └──────┬───────┘
     └────────────┘      │            │
                         │            ▼
                         │     ┌──────────────┐
                         │     │ CLAIMS_SYNC  │ L1 (sync)
                         │     └──────┬───────┘
                         │            │
                         │     ┌──────┴───────┐
                         │     │ diff         │
                         │     ▼              ▼
                         │ ┌────────┐   ┌───────────┐
                         │ │ READY  │   │ HYDRATING │ L2 async
                         │ │ (NONE) │   │ /auth/me  │
                         │ └───┬────┘   └─────┬─────┘
                         │     │              │
                         │     │         ┌────┴────┐
                         │     │         │ OK      │ fail
                         │     │         ▼         ▼
                         │     │    ┌────────┐ ┌────────┐
                         │     │    │ READY  │ │ FAILED │
                         │     │    │ (FULL) │ │logout  │
                         │     │    └───┬────┘ └────────┘
                         │     └────────┤
                         │              │
                         ▼              ▼
                 ┌───────────────────────┐
                 │  QUEUE_RELEASE        │
                 │  processQueue(token)  │
                 │  retry requests       │
                 └───────────┬───────────┘
                             ▼
                         ┌──────────┐
                         │   IDLE   │
                         └──────────┘
```

### 6.2 Tabla de transiciones

| Desde | Evento | Hacia | Acción |
|-------|--------|-------|--------|
| IDLE | 401 request | REFRESHING | Crear `isRefreshingPromise` |
| IDLE | 401 + refresh activo | (espera) | Encolar en `failedQueueRef` |
| REFRESHING | refresh 401/403 fail | FAILED | `doLogout(false)`, reject queue |
| REFRESHING | refresh 200 | TOKEN_SWAP | Guardar token en `authRef` |
| TOKEN_SWAP | — | CLAIMS_SYNC | L1 sync claims |
| CLAIMS_SYNC | diff NONE | READY | — |
| CLAIMS_SYNC | diff FULL | HYDRATING | Iniciar L2 |
| HYDRATING | me OK | READY | Menú + RQ según política |
| HYDRATING | me fail | FAILED | `doLogout(false)` |
| READY | — | QUEUE_RELEASE | `processQueue`, retries |
| QUEUE_RELEASE | — | IDLE | `isRefreshingPromise = null` |
| FAILED | — | IDLE | `isRefreshingPromise = null` |

### 6.3 Estados de hidratación de sesión (persistente en sesión autenticada)

Independiente del ciclo refresh — estado lógico de la sesión:

| Estado sesión | Condición |
|---------------|-----------|
| `UNINITIALIZED` | Bootstrapping; `!isBootstrapped` |
| `SELECTION_PENDING` | Schema A; sin sesión completa |
| `AUTHENTICATED_MINIMAL` | Token + user; menú no requerido (password change, etc.) |
| `AUTHENTICATED_FULL` | Token + user + menú listo (`menuPermissionsReady`) |
| `ANONYMOUS` | Post-logout |

**Fase 1:** refresh interceptor en `AUTHENTICATED_FULL` con diff NONE permanece en `AUTHENTICATED_FULL` sin pasar por estado intermedio visible.

### 6.4 Invariantes

1. `isRefreshingPromise` resuelve solo cuando `applyPostRefreshSession` terminó (éxito o fallo controlado).
2. `menuPermissionsReady` no pasa a `false` en L1 ni en diff NONE.
3. En diff FULL, `menuPermissionsReady` puede pasar a `false` **solo** si se recarga menú; restaurar `true` al completar L2.
4. `isBootstrapped` no se modifica durante refresh interceptor.
5. `loading` (auth loading inicial) no se activa en refresh interceptor.

---

## 7. Impacto por componente

### 7.1 AuthContext

| Aspecto | Impacto |
|---------|---------|
| Tamaño | Crece levemente en interceptor; lógica pesada delegada a módulos `session/` |
| Response interceptor | Rama éxito reemplazada por llamada a `applyPostRefreshSession` |
| `initializeAuth` | Refactor interno — extrae `hydrateSessionCore` |
| `syncEmpresaSession` | Invocado también post L1 |
| Refs nuevos | `priorRefreshSnapshotRef` opcional para diff |
| API `useAuth` | **Sin cambios** en shape del contexto |
| `isRefreshingPromise` | Trabajo interno más largo; semántica externa igual |

### 7.2 TenantProvider

| Aspecto | Impacto |
|---------|---------|
| Cambio habitual refresh | **Ninguno** — `cliente_id` rara vez cambia en refresh |
| Si `cliente_id` cambia en JWT (diff FULL) | `derivedTenantId` actualiza → efecto existente invalida cache tenant + branding |
| Diseño | L2 con cambio `cliente_id` debe disparar misma invalidación que cambio tenant manual |

### 7.3 PermissionProvider

| Aspecto | Impacto |
|---------|---------|
| Cambio `empresaActivaId` tras L2 | Efecto existente `useEffect([empresaActivaId])` → re-fetch `/auth/permissions/me` |
| diff NONE | Sin re-fetch adicional |
| `permissionsInitialized` | Breve reset si `empresaActivaId` cambia — comportamiento ya existente en cambio empresa |

### 7.4 Empresa (`empresaActivaId`, scope)

| Aspecto | Impacto |
|---------|---------|
| `empresaActivaId` | Actualizado en L1 (JWT) y confirmado en L2 (`/auth/me`) |
| `useOrgSessionScope` / `useInvSessionScope` | Invalidación ORG/INV al cambiar `scopeEmpresaId` — **automático** |
| `EmpresaSelector` | Reflejará empresa correcta sin reload página |
| Gates `canQueryCompanyScoped` | Habilitados/deshabilitados coherentes con JWT |

### 7.5 Branding

| Aspecto | Impacto |
|---------|---------|
| Refresh normal | **Sin impacto** — branding por `tenantId` |
| Refresh con cambio `cliente_id` (edge) | `TenantProvider` recarga branding — comportamiento existente |

### 7.6 React Query

| Escenario | Acción Fase 1 |
|-----------|---------------|
| diff NONE | Sin invalidación |
| diff FULL — solo `empresa_id` cambió | `invalidateOrgQueries` + `invalidateInvQueries` |
| diff FULL — `cliente_id` cambió | `queryClient.clear()` + invalidación tenant (vía TenantContext effect) |
| `applyFullSessionToken` | Sin cambio — sigue `clear()` |

**Decisión:** no usar `clear()` global en refresh salvo cambio de tenant — evita destruir cache innecesariamente (V1.3).

### 7.7 ProtectedRoute

| Aspecto | Impacto |
|---------|---------|
| `sessionGatesPending` | Riesgo si `menuPermissionsReady` false durante L2 FULL |
| Mitigación | Solo falsear `menuPermissionsReady` cuando menú se recarga; pantalla ya montada no debe mostrar spinner full-page |
| `isAuthenticated` | Sigue `!!token && !!user` — user parcial L1 mantiene autenticado |

### 7.8 PermissionGuard

| Aspecto | Impacto |
|---------|---------|
| Evaluación permisos | Tras L2 FULL con menú recargado, permisos ruta actualizados |
| diff NONE | Sin re-evaluación forzada — correcto |

---

## 8. Contratos internos

### 8.1 Funciones nuevas

| Función | Responsabilidad | Entrada | Salida |
|---------|-----------------|---------|--------|
| `buildSessionClaimsSnapshot` | Captura estado pre-refresh | `token`, `user`, `empresaActivaId` | `SessionClaimsSnapshot` |
| `resolveHydrationLevel` | Política diff | `prior`, `newToken` | `NONE` \| `FULL` |
| `applyClaimsSync` | L1 | `newToken`, `currentUser` | `Partial<UserData>` + side effects via injected setters |
| `hydrateSessionCore` | L2 núcleo | `{ mode, skipMenu?, skipBootstrapFlags? }` | `UserData \| null` |
| `applyPostRefreshSession` | Orquestador interceptor | `{ newToken, priorSnapshot, deps }` | `Promise<void>` — throw si fail |
| `shouldReloadMenuAfterHydrate` | Sub-política menú | diff + `user` | `boolean` |

### 8.2 Tipos nuevos (conceptuales)

| Tipo | Campos clave |
|------|--------------|
| `SessionClaimsSnapshot` | `empresaId`, `clienteId`, `usuarioId`, `userType`, `esAdminCliente`, `requiresPasswordChange`, `selectionPending`, `isImpersonation` |
| `HydrationLevel` | `'NONE'` \| `'FULL'` |
| `HydrateSessionMode` | `'bootstrap'` \| `'interceptor'` \| `'full-session-token'` |
| `PostRefreshDeps` | Inyección setters/refs/queryClient para testabilidad |

### 8.3 Funciones que cambian (comportamiento interno)

| Función | Cambio |
|---------|--------|
| Response interceptor 401 — bloque éxito | Delega en `applyPostRefreshSession` antes de `processQueue` |
| `initializeAuth` | Delega cuerpo en `hydrateSessionCore({ mode: 'bootstrap' })` |
| `syncEmpresaSession` | Puede invocarse con user parcial post L1 |

### 8.4 Funciones que permanecen sin cambio

| Función | Notas |
|---------|-------|
| `authService.refreshToken` | HTTP sin cambio |
| `authService.me` | Sin cambio |
| `processQueue` | Misma firma; llamada diferida post-hydrate |
| `doLogout` | Sin cambio Fase 1 |
| `applyFullSessionToken` | Sin cambio observable; puede usar `hydrateSessionCore` internamente |
| `cambiarEmpresaActiva` | Sin cambio |
| `completeEmpresaSelection` | Sin cambio |
| `shouldSkipTokenRefresh` | Sin cambio |
| `loadMenuAndPermissionsFromAuthMenu` | Sin cambio de contrato; invocación condicional desde L2 |
| `loadEmpresasElegiblesForSession` | Invocación condicional desde L2 |

### 8.5 Feature flag rollback

| Flag | Default | Efecto cuando `false` |
|------|---------|----------------------|
| `REFRESH_HYDRATE_ENABLED` | `true` en implementación | Interceptor vuelve a comportamiento legacy: solo token + `requires_password_change` |

Ubicación propuesta: `src/core/auth/session/refresh-hydrate.flags.ts`  
Activación: constante compilación o `import.meta.env.VITE_REFRESH_HYDRATE_ENABLED`.

### 8.6 Política diff — reglas de decisión

| Condición | `HydrationLevel` |
|-----------|------------------|
| `empresa_id` JWT ≠ `empresaActivaId` state | **FULL** |
| `cliente_id` JWT ≠ `user.cliente_id` | **FULL** |
| `sub` ≠ `user.usuario_id` | **FULL** |
| `user_type` cambió | **FULL** |
| `empresa_selection_pending` true en nuevo JWT | **FULL** (+ gates selección) |
| `requires_password_change` false→true | **FULL** (menú puede skip vía `shouldSkipErpMenuLoad`) |
| `is_impersonation` cambió | **FULL** |
| Solo rotación exp/iat; campos anteriores iguales | **NONE** |
| `auth.user` es null con token válido | **FULL** |

---

## 9. Plan de implementación

Orden por dependencias internas. Sin código en este documento.

### Paso 1 — Módulos de snapshot y diff

**Entregable:** `session-claims-snapshot.ts`, `session-refresh-diff.ts`

- Definir `SessionClaimsSnapshot` y `buildSessionClaimsSnapshot`
- Definir `resolveHydrationLevel(prior, newToken)`
- Tests unitarios puros de diff (sin React)

**Depende de:** nada  
**Habilita:** Pasos 2–4

---

### Paso 2 — Claims sync L1

**Entregable:** `session-claims-sync.ts`

- `applyClaimsSync` actualiza: `requires_password_change`, campos mergeables en user, invoca `syncEmpresaSession`
- No toca menú ni `menuPermissionsReady`

**Depende de:** Paso 1  
**Habilita:** Paso 4

---

### Paso 3 — Extracción `hydrateSessionCore`

**Entregable:** refactor interno `AuthContext` + `session-refresh-hydrate.ts`

- Extraer de `initializeAuth` el núcleo: `/auth/me`, merge, `updateAccessLevels`, menú condicional, empresas elegibles
- Parámetro `mode` para distinguir bootstrap vs interceptor
- Bootstrap delega en este núcleo — verificar V1.4 antes de continuar

**Depende de:** nada (puede paralelizarse con 1–2)  
**Habilita:** Paso 4

---

### Paso 4 — Orquestador `applyPostRefreshSession`

**Entregable:** `session-refresh-hydrate.ts` completo

- Secuencia L0 → L1 → diff → L2 opcional → invalidación RQ condicional
- Inyección de dependencias desde AuthContext (setters, queryClient, callbacks existentes)
- Feature flag `REFRESH_HYDRATE_ENABLED`

**Depende de:** Pasos 1, 2, 3  
**Habilita:** Paso 5

---

### Paso 5 — Integración interceptor 401

**Entregable:** modificación rama éxito en `AuthContext` response interceptor

- Capturar `priorSnapshot` al inicio de `isRefreshingPromise` (antes de `refreshToken`)
- Reemplazar bloque merge manual por `await applyPostRefreshSession(...)`
- Mover `processQueue` después de hydrate completo
- Requests encolados esperan Promise completa (ya ocurre si await dentro de promise)

**Depende de:** Paso 4  
**Habilita:** Paso 6

---

### Paso 6 — Política React Query post-refresh

**Entregable:** lógica en orquestador o helper `session-rq-invalidation.ts`

- Matriz: cambio empresa → ORG/INV invalidate; cambio tenant → clear
- Verificar que `useOrgSessionScope` no duplique invalidación excesiva (idempotente)

**Depende de:** Paso 5  
**Habilita:** Paso 7

---

### Paso 7 — Salvaguardas UX (gates)

**Entregable:** ajustes en orquestador L2

- No setear `loading=true`
- `menuPermissionsReady`: solo false si menú se recarga; true al terminar
- Verificar `ProtectedRoute` no muestra spinner en refresh background (V1.3)

**Depende de:** Paso 5  
**Habilita:** Paso 8

---

### Paso 8 — Flag rollback y documentación de operación

**Entregable:** `refresh-hydrate.flags.ts`, entrada en runbook interno (ticket docs separado)

- Documentar activación/desactivación flag en staging
- Procedimiento rollback sin redeploy (env var)

**Depende de:** Paso 5  
**Habilita:** cierre fase

---

### Paso 9 — Validación y cierre

**Entregable:** ejecución plan pruebas §10, sign-off Fase 1

**Depende de:** Pasos 1–8

---

## 10. Plan de pruebas

### 10.1 Escenarios obligatorios (plan alineación)

| ID | Escenario | Precondición | Pasos | Criterio éxito |
|----|-----------|--------------|-------|----------------|
| **V1.1** | 401 → refresh OK → retry | Sesión activa; access expirado simulado | Request ERP cualquiera | Token nuevo; request original 200; usuario sigue autenticado |
| **V1.2** | Empresa en JWT cambia tras refresh | Backend con `empresa_id` BD ≠ state FE (simular vía admin cambio en BD o refresh tras operación externa) | Provocar 401→refresh | `empresaActivaId` y `scopeEmpresaId` = JWT; ORG/INV invalidados; selector empresa correcto |
| **V1.3** | Refresh sin cambio contexto | Sesión estable | Provocar 401→refresh | Sin llamada `/auth/me` observable (network tab); sin spinner full-page; menú estable |
| **V1.4** | Bootstrap regresión | Cookie válida; F5 | Recargar app | `/auth/me` + menú; destino correcto; `isBootstrapped` OK |

### 10.2 Escenarios adicionales Fase 1

| ID | Escenario | Criterio |
|----|-----------|----------|
| **E1.1** | N requests concurrentes 401 | Un solo `POST /auth/refresh/`; todos retries OK; contexto hidratado antes de retries |
| **E1.2** | Refresh OK + `/auth/me` falla en L2 FULL | `doLogout(false)`; cola rechazada |
| **E1.3** | `requires_password_change` true en nuevo JWT | L2 o L1 lleva flag; redirect change-password sigue funcionando |
| **E1.4** | `empresa_selection_pending` en token post-refresh | Tratado como FULL; gates selección activos |
| **E1.5** | Flag `REFRESH_HYDRATE_ENABLED=false` | Comportamiento idéntico a pre-Fase 1 |
| **E1.6** | Cambio empresa vía header (regresión) | `applyFullSessionToken` sin regresión |
| **E1.7** | Login Schema A/B (regresión) | Sin regresión |
| **E1.8** | Modo soporte 401 (regresión) | Sin refresh plataforma; sin hydrate |

### 10.3 Tests unitarios recomendados

| Módulo | Casos |
|--------|-------|
| `resolveHydrationLevel` | Todos los campos diff; normalización UUID; null user |
| `buildSessionClaimsSnapshot` | Token inválido; user null |
| `applyClaimsSync` | Merge parcial; `syncEmpresaSession` invocado |

### 10.4 Smoke regression (post-implementación)

Ejecutar checklist smoke del plan alineación §8:

- Login Schema B → ERP home
- Login Schema A → selección → ERP
- F5 sesión activa
- Cambio empresa header
- Password change obligatorio
- Platform impersonate → ERP → exit

### 10.5 Edge cases

| Caso | Comportamiento esperado |
|------|-------------------------|
| Refresh durante `cambiarEmpresaActiva` en vuelo | Single-flight serializa; estado final coherente con última operación completada |
| Refresh con user null (solo token en memoria) | L2 FULL |
| JWT decode falla post-refresh | Tratar como fallo → `doLogout(false)` |
| `loadMenu` 409 en L2 | `requiereSeleccionEmpresa=true` — comportamiento existente `loadMenuAndPermissionsFromAuthMenu` |
| Platform_admin en ERP vía impersonación | Fuera alcance — sin refresh interceptor |

### 10.6 Evidencia de prueba

Por cada escenario V1.x:

- Captura Network: orden `refresh` → (opcional) `me` → `menu` → retry original
- Estado DevTools: `empresaActivaId` en React components vía `useAuth`
- Log DEV flag: hydration level NONE vs FULL (Fase 8 formalizará; Fase 1 puede usar log temporal DEV)

---

## 11. Riesgos, mitigación y rollback

### 11.1 Riesgos arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación |
|--------|-------|-----------|------------|
| Cola liberada antes de L2 completo — retries con contexto viejo | Media | Alta | Invariante §6.4: `processQueue` solo post `applyPostRefreshSession` |
| Doble invalidación RQ (orquestador + scope hooks) | Media | Baja | Invalidación idempotente; preferir hooks scope como fuente secundaria |
| `initializeAuth` refactor rompe bootstrap | Media | Alta | Paso 3 con V1.4 antes de interceptor; tests regresión |
| Flicker `menuPermissionsReady` en FULL | Media | Media | Paso 7 — política no falsear en NONE |
| `/auth/me` extra en cada refresh (perf) | Baja | Media | Política diff NONE evita L2 en rotación rutinaria |

### 11.2 Riesgos operativos

| Riesgo | Mitigación |
|--------|------------|
| Despliegue sin flag rollback probado | Paso 8 — verificar `REFRESH_HYDRATE_ENABLED=false` en staging |
| Comportamiento distinto staging/prod cookies | V1.1 en ambos entornos antes de prod |

### 11.3 Riesgos UX

| Riesgo | Mitigación |
|--------|------------|
| Spinner full-page en refresh background | No tocar `loading`; V1.3 criterio bloqueante |
| Datos tabla obsoletos brevemente post FULL | Invalidación ORG/INV inmediata; RQ refetch |

### 11.4 Rollback

| Nivel | Procedimiento | Tiempo |
|-------|---------------|--------|
| **L1 — Runtime** | `VITE_REFRESH_HYDRATE_ENABLED=false` + redeploy o runtime config | Minutos |
| **L2 — Código** | Revert commit Fase 1 | Pipeline CI/CD |
| **L3 — Parcial** | Flag off en prod; investigar en staging con flag on | Horas |

**Criterio activación rollback:** V1.2 o V1.3 fallan en staging; o aumento significativo de latencia percibida en refresh.

**Estado post-rollback:** Comportamiento idéntico a `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` pre-Fase 1 (documentado como legacy en flag).

### 11.5 Criterios de done Fase 1

- [ ] V1.1, V1.2, V1.3, V1.4 pasan en staging
- [ ] Smoke regression §10.4 verde
- [ ] Flag rollback verificado
- [ ] Sin cambios contrato API
- [ ] `useAuth` API pública sin breaking changes
- [ ] Listo para Fase 2 (Session Termination) sobre base hydrate estable

---

## Referencias cruzadas

| Documento | Sección relevante |
|-----------|-------------------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` | §5 Fase 1, §8 V1.x, §6 dependencias |
| `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | §5 Flujo Refresh, §19 Limitaciones FE-P0-02 |
| `IAM_SESSION_MANAGEMENT_V2.md` | §5 Refresh, §16 Concurrencia, §19 Contrato FE |

---

## Tickets derivados previstos

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-01-IMPL-SNAPSHOT | Pasos 1–2 |
| IAM-FE-PHASE-01-IMPL-HYDRATE-CORE | Paso 3 |
| IAM-FE-PHASE-01-IMPL-ORCHESTRATOR | Pasos 4–6 |
| IAM-FE-PHASE-01-IMPL-INTERCEPTOR | Paso 5–7 |
| IAM-FE-PHASE-01-VALIDATION | Paso 9 |

---

*Generado bajo IAM-FE-PHASE-01-DESIGN-01 — DESIGN ONLY.*
