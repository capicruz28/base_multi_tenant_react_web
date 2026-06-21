# IAM-FE-PHASE-06 — Diseño Técnico: Impersonation & Platform Admin Hardening

**Ticket diseño:** IAM-FE-PHASE-06-DESIGN-01  
**Ticket implementación:** IAM-FE-PHASE-06-IMPERSONATION  
**Versión:** 1.0  
**Estado:** DESIGN ONLY — sin implementación  
**Fecha:** 2026-06-19  
**Referencias normativas:**
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 — Fase 6, §8 V6.x, GAP-P1-02, H6
- `docs/arquitectura/IAM_FE_PHASE_05_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_04_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_03_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` — terminación, `IMPERSONATION_END`
- `docs/arquitectura/IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` — hydrate post-restore
- `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` — impersonation, platform parent session
- `IAM_SESSION_MANAGEMENT_V2.md` — §9 impersonación, §19 403 refresh, cambiar empresa 403
- Informe: IAM-FE-PHASE-06-KICKOFF-01

> Este documento define **cómo** se implementará la Fase 6.  
> No contiene código, pseudocódigo, parches ni modificaciones a documentos existentes.  
> Las Fases 1–5 quedan **congeladas** salvo wiring mínimo en `AuthContext` e invocaciones autorizadas de módulos existentes.

---

## Índice

1. [Objetivos](#1-objetivos)
2. [Alcance](#2-alcance)
3. [Arquitectura propuesta](#3-arquitectura-propuesta)
4. [Componentes nuevos](#4-componentes-nuevos)
5. [Componentes reutilizados](#5-componentes-reutilizados)
6. [Política de impersonación](#6-política-de-impersonación)
7. [Estrategia 401 vs 403](#7-estrategia-401-vs-403)
8. [Estrategia restorePlatformSession](#8-estrategia-restoreplatformsession)
9. [Integración con Phase-04 (auth-sync)](#9-integración-con-phase-04-auth-sync)
10. [Integración con Phase-02 (SessionTermination)](#10-integración-con-phase-02-sessiontermination)
11. [Integración con Phase-05 (Refresh Resilience)](#11-integración-con-phase-05-refresh-resilience)
12. [Integración multiempresa y multitenant](#12-integración-multiempresa-y-multitenant)
13. [Feature flags](#13-feature-flags)
14. [Estrategia de rollback](#14-estrategia-de-rollback)
15. [Riesgos](#15-riesgos)
16. [Plan de implementación](#16-plan-de-implementación)
17. [Estrategia de validación](#17-estrategia-de-validación)
18. [GAPs cerrados al finalizar](#18-gaps-cerrados-al-finalizar)
19. [Criterios de aceptación](#19-criterios-de-aceptación)

---

## 1. Objetivos

### 1.1 Problema que resuelve

Tras SIGNOFF Phase-05, el refresh en sesión ERP está endurecido (retry, outcomes, L-02), pero el **modo soporte (impersonación Platform Admin)** mantiene comportamiento **incompleto** en el interceptor:

| Contexto | Comportamiento post-Fase 5 | Impacto |
|----------|---------------------------|---------|
| 401/403 ERP en modo soporte | `Promise.reject` al caller — **sin** salida controlada | Usuario atrapado en ERP con JWT inválido |
| Refresh 403 impersonación (§19 BE) | No finaliza soporte en interceptor | Requests fallan sin retorno a Platform |
| `cambiarEmpresa` en impersonación (BE 403) | Sin handler FE dedicado | Error opaco; posible estado inconsistente |
| Bootstrap F5 soporte | Rehidratación + exit parcialmente implementado | V6.2/V6.3 cubiertos; falta alinear con política unificada |
| Cross-tab exit soporte | Parent session no propagada sistemáticamente | Follower puede quedar en ERP inválido |

**GAP principal:** **GAP-P1-02** (Alignment §3, §5 Fase 6).

### 1.2 Objetivos funcionales (ticket)

| # | Objetivo |
|---|----------|
| 1 | Cerrar **GAP-P1-02** — interceptor 401/403 en modo soporte → salida controlada a Platform |
| 2 | Alinear con **§19 BE**: refresh impersonación → **403**; FE **no** intenta refresh cookie plataforma |
| 3 | Alinear con **§9 BE**: `POST /empresa/cambiar/` → **403** en impersonación; FE → exit controlado |
| 4 | Unificar política exit bajo módulo declarativo (policy + orchestrator) |
| 5 | Propagar restore parent vía **auth-sync** Phase-04 (cross-tab) |
| 6 | Mensajes UX diferenciados vía perfil F2 `IMPERSONATION_END` (sin modal V7) |
| 7 | Preservar flujos existentes: `endImpersonation` manual, bootstrap F5, `completeEmpresaSelection` |
| 8 | **Sin** modificar contratos backend ni OpenAPI |

### 1.3 Objetivo técnico formal

Introducir una capa **Impersonation Exit Policy & Orchestration** que:

1. **Detecte** modo soporte (`isImpersonationSupportMode`) antes de cualquier refresh ERP.
2. **Decida** acción pura: reject legacy vs controlled exit vs delegar manual.
3. **Ejecute** salida controlada invocando `restorePlatformSession` (existente) + UX F2.
4. **Coordine** con F4 emit post-restore para followers.
5. **Preserve** single-flight, F5 resilience, F2 terminate bodies, F3 probe skip.
6. **No sustituya** `terminateSession` en exit normal soporte (parent sigue válido).

### 1.4 Criterios de aceptación (enlace plan)

Escenarios obligatorios: **V6.1–V6.4** (`IAM_SESSION_ALIGNMENT_PLAN_V1.md` §8).

Regresión obligatoria: **V1.1–V1.4** + **V2.1–V2.6** + **V3.1–V3.4** + **V4.1–V4.5** + **V5.1–V5.5** + smoke Platform impersonate → ERP → exit.

---

## 2. Alcance

### 2.1 Dentro de alcance (MVP Fase 6)

| Área | Detalle |
|------|---------|
| Interceptor ERP 401/403 soporte | Salida controlada → `restorePlatformSession` + redirect Platform |
| Short-circuit refresh soporte | **Antes** de single-flight / F5 — sin POST `/auth/refresh/` plataforma |
| Handler `cambiarEmpresaActiva` impersonación | Pre-check FE + catch 403 → exit controlado |
| Bootstrap soporte | Verificar/alinear V6.2/V6.3 bajo política unificada (sin reescribir flujo) |
| `endImpersonation` manual | Verificar V6.4; wiring mínimo si falta emit F4 |
| auth-sync post-restore | Emit `SESSION_LOGIN` parent token (extensión wiring, sin nuevo evento obligatorio) |
| UX toast | Perfil `IMPERSONATION_END` F2 — mensajes diferenciados 401 vs 403 vs expired |
| Flags | Master + sub-flags; rollback reject-al-caller |
| Tests | Unit policy + integración interceptor mock + regresión V1–V5 |

### 2.2 Fuera de alcance (fases posteriores)

| Tema | Fase responsable |
|------|------------------|
| Modal/pantalla sesión expirada dedicada | Fase 7 |
| Telemetría estructurada impersonation events | Fase 8 |
| Extracción `session-impersonation` de AuthContext | Fase 9 |
| Mobile `X-Client-Type: mobile` | Ticket separado |
| Cambios contrato OpenAPI / nuevos endpoints | Prohibido |
| Modificar cuerpo `terminateSession` / `hydrateSessionCore` / F5 modules | Prohibido |
| Modificar cuerpo módulos Phase-4 auth-sync | Prohibido |
| Session limit feedback (P3-02) | Fase 7 |
| Guard L-02 cambiar empresa (F5) en impersonación | N/A — BE bloquea cambiar empresa |
| Instancias API locales sin refresh (GAP-P2-07) | Ticket hybrid |

### 2.3 Dependencias duras

| Dependencia | Estado requerido |
|-------------|------------------|
| Fase 1 cerrada (SIGNOFF) | `hydrateSessionCore` / `initializeAuth` post-restore |
| Fase 2 cerrada (SIGNOFF) | Perfil UX `IMPERSONATION_END`; terminación congelada |
| Fase 3 cerrada (SIGNOFF) | Probe skip impersonación; logoutAll guard |
| Fase 4 cerrada (SIGNOFF) | auth-sync emit/apply; anti-loop R1–R7 |
| Fase 5 cerrada (SIGNOFF) | Refresh resilience; short-circuit soporte preservado |
| Contrato BE §19 impersonación 403 | Production Ready — sin cambios |

---

## 3. Arquitectura propuesta

### 3.1 Principio de diseño: política pura + orquestador delgado

| Capa | Nombre | Responsabilidad Fase 6 |
|------|--------|------------------------|
| **L6-A** | Exit types | Fuentes exit, contexto HTTP, metadata |
| **L6-B** | Exit policy | Decisión pura: reject / controlled-exit / no-op |
| **L6-C** | Exit orchestrator | Ejecutar restore + UX + emit; sin React |
| **L6-D** | Auth-sync emit helper | Post-restore cross-tab (wiring F4) |
| **L6-E** | Cambiar empresa guard | Pre-check impersonación activa |
| **L6-F** | AuthContext wiring | Interceptor + handlers mínimos |

**Regla central:** en modo soporte, **ninguna** ruta ERP 401/403 debe intentar refresh plataforma ni dejar al usuario en ERP sin salida. La pestaña origen ejecuta restore; followers aplican vía F4 **sin** repetir `endImpersonation` HTTP.

### 3.2 Diagrama arquitectura objetivo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AuthContext — interceptor response / cambiarEmpresa / bootstrap (soporte)    │
│  ├─ isImpersonationSupportMode? ──► [F6] resolveImpersonationExitPolicy       │
│  │                                      ├─ REJECT (rollback flag OFF)        │
│  │                                      └─ CONTROLLED_EXIT                    │
│  ├─ [F6] executeImpersonationControlledExit()                                │
│  │      ├─ toast IMPERSONATION_END (F2 UX profile)                           │
│  │      ├─ restorePlatformSession (EXISTENTE — sin cambio cuerpo)            │
│  │      ├─ initializeAuth post-restore (F1)                                  │
│  │      └─ emit SESSION_LOGIN parent (F4 wiring)                             │
│  ├─ NO executeRefreshWithResilience en soporte (F5 congelado — pre-check)   │
│  └─ endImpersonation manual → mismo orchestrator (V6.4)                     │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
              restorePlatformSession → platform-parent-session (sessionStorage)
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ BroadcastChannel auth-sync — SESSION_LOGIN (parent access)                   │
│ Follower tabs: applyInbound → F1 hydrate — NO re-emit                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Qué cambia vs Fase 5

| Elemento | Cambio Fase 6 |
|----------|---------------|
| Interceptor 401/403 soporte | De reject → **controlled exit** (flag ON) |
| `cambiarEmpresaActiva` | Guard impersonación + handler 403 |
| Bootstrap soporte | Política unificada bajo F6 (verificación V6.2/V6.3) |
| auth-sync | Emit post-restore parent (wiring) |
| F5 refresh path | **Sin cambio** — short-circuit soporte **antes** de F5 |
| SessionRemoteProbe | Sin cambio |
| `useAuth()` API | Sin cambio firma |

### 3.4 Qué permanece congelado (Fases 1–5)

| Artefacto | Estado |
|-----------|--------|
| `terminateSession` / `classifySessionTermination` | Cuerpo congelado |
| `applyPostRefreshSession` / `hydrateSessionCore` | Cuerpo congelado |
| `executeRefreshWithResilience` / retry policy F5 | Cuerpo congelado |
| Módulos auth-sync F4 (emit/apply/channel) | Cuerpos congelados |
| `SessionRemoteProbe` / `executeLogoutAllFlow` | Cuerpos congelados |
| `restorePlatformSession` (AuthContext) | **Cuerpo congelado** — solo invocación vía orchestrator |
| `platform-parent-session` utils | Sin cambio contrato |

---

## 4. Componentes nuevos

| Artefacto | Ubicación propuesta | Responsabilidad |
|-----------|---------------------|-----------------|
| `session-impersonation.flags.ts` | `src/core/auth/session/` | Flags Fase 6 |
| `session-impersonation.types.ts` | `src/core/auth/session/` | Tipos exit source, HTTP context, decision |
| `session-impersonation-exit.policy.ts` | `src/core/auth/session/` | Política pura 401/403/reject vs exit |
| `session-impersonation-exit.ts` | `src/core/auth/session/` | `executeImpersonationControlledExit` orquestador |
| `session-impersonation-auth-sync.ts` | `src/core/auth/session/` | Helper emit post-restore (delega F4 emit) |
| Tests | `src/core/auth/session/__tests__/` | Unit policy + integration mocks |
| `auth-phase-06-regression.test.ts` | `src/shared/context/__tests__/` | Regresión V6 + manifesto V1–V5 |

**Nota normativa:** no se crean endpoints ni se alteran contratos OpenAPI. La política es **derivada** del contexto FE + HTTP status.

---

## 5. Componentes reutilizados

### 5.1 Stack congelado (solo invocación)

| Contrato | Uso Fase 6 |
|----------|------------|
| `isImpersonationSupportMode` | Detección modo soporte |
| `isImpersonationAuthErrorStatus` | 401/403 en interceptor |
| `shouldSkipTokenRefresh` | `/auth/refresh/` excluido de retry loop |
| `restorePlatformSession` | Núcleo salida controlada |
| `savePlatformParentSession` / `getPlatformParentSession` | Parent token persistence |
| `impersonation-support-session` | F5 rehidratación sessionStorage |
| `resolveTerminationUx('IMPERSONATION_END')` | Copy toast F2 |
| `emitSessionLoginSync` / `emitAuthSyncSessionToken` | Post-restore F4 |
| `authService.endImpersonation` | Exit manual API best-effort |
| `initializeAuth` / `hydrateSessionCore` | Post-restore F1 |
| `executeRefreshWithResilience` | **No invocado** en soporte |
| `SessionRemoteProbe` | Skip impersonación — sin cambio |

### 5.2 AuthContext (wiring permitido)

| Pieza | Descripción |
|-------|-------------|
| Interceptor response | Sustituir reject plano por policy F6 + orchestrator |
| `cambiarEmpresaActiva` | Pre-check + catch 403 → orchestrator |
| Bootstrap soporte | Delegar exit paths existentes a orchestrator unificado |
| `endImpersonationHandler` | Invocar orchestrator compartido |
| Emit F4 post-restore | Tras `restorePlatformSession` OK |

**Prohibido:** alterar firmas públicas `useAuth()`; modificar cuerpos congelados F1–F5.

---

## 6. Política de impersonación

### 6.1 Modos de sesión (detección FE)

| Modo | Condición | Refresh plataforma | Cambiar empresa |
|------|-----------|-------------------|-----------------|
| **ERP normal** | No soporte | Permitido vía F5 | Permitido (+ L-02 F5) |
| **Modo soporte** | `hasPlatformParentSession()` OR `isImpersonationToken(token)` | **Prohibido** §19 | **Prohibido** BE 403 |
| **Platform admin** | `platform_admin` sin impersonación | Permitido | N/A ERP |

Función canónica existente: `isImpersonationSupportMode(token)`.

### 6.2 Acciones de política

| Acción | Semántica | Cuándo |
|--------|-----------|--------|
| `NO_OP` | Flujo ERP normal continúa | No modo soporte |
| `REJECT_LEGACY` | `Promise.reject(error)` — rollback F6 OFF | Flag master OFF |
| `CONTROLLED_EXIT` | Orchestrator → restore parent + UX + F4 emit | Flag ON + 401/403 ERP en soporte |
| `DELEGATE_MANUAL` | Solo log DEV; caller maneja | Tests / edge skipRedirect |

### 6.3 Fuentes de exit (ImpersonationExitSource)

| Source | Trigger | Redirect default |
|--------|---------|------------------|
| `INTERCEPTOR_ERP_401` | 401 request ERP en soporte | `/super-admin/dashboard` si path `/app` o `/admin` |
| `INTERCEPTOR_ERP_403` | 403 request ERP en soporte | Idem |
| `CAMBIAR_EMPRESA_FORBIDDEN` | Pre-check o 403 API cambiar empresa | Idem |
| `BOOTSTRAP_SUPPORT_EXPIRED` | JWT soporte expirado F5 | Idem |
| `BOOTSTRAP_SUPPORT_INVALID` | Token inválido post-F5 | Idem |
| `MANUAL_END` | `endImpersonation` usuario | `/super-admin/dashboard` (UI hook) |
| `SELECTION_FAILED` | `completeEmpresaSelection` impersonada falla | Ya implementado — alinear orchestrator |

### 6.4 Invariantes impersonación (IM-xx)

| ID | Regla |
|----|-------|
| **IM-01** | Modo soporte → **cero** POST `/auth/refresh/` plataforma |
| **IM-02** | Modo soporte → **cero** invocación `executeRefreshWithResilience` |
| **IM-03** | Controlled exit → **siempre** `restorePlatformSession` si parent existe |
| **IM-04** | Sin parent → `doLogout(false)` existente — no inventar parent |
| **IM-05** | Exit soporte ≠ `terminateSession` ERP (parent permanece válido) |
| **IM-06** | Follower F4 → apply restore — **no** re-emit, **no** `endImpersonation` HTTP |
| **IM-07** | `logoutAll` en soporte → bloqueado F3 — preservar |
| **IM-08** | SessionRemoteProbe → skip soporte F3 — preservar |

---

## 7. Estrategia 401 vs 403

### 7.1 Semántica BE (`IAM_SESSION_MANAGEMENT_V2.md` §19)

| Código | En modo soporte — significado típico |
|--------|--------------------------------------|
| **401** | Access ERP impersonado expirado/revocado; refresh idle; sesión inválida |
| **403** | Operación prohibida: refresh impersonación; cambiar empresa; token otro tenant |

### 7.2 Decisión FE unificada Fase 6

| Contexto | 401 | 403 | Acción F6 (flag ON) |
|----------|-----|-----|---------------------|
| Request ERP genérico en soporte | ✓ | ✓ | `CONTROLLED_EXIT` |
| `POST /auth/refresh/` en soporte | N/A — excluido `shouldSkipTokenRefresh` | 403 si alcanzado | `CONTROLLED_EXIT` |
| `POST /auth/empresa/cambiar/` | — | 403 BE | `CONTROLLED_EXIT` |
| Password change enforcement | Bypass F2 existente en soporte | — | Sin cambio |
| Platform admin sin soporte | Flujo F2/F5 normal | Flujo F2/F5 normal | `NO_OP` |

### 7.3 UX diferenciada (F2 — no F7)

| Situación | Perfil F2 | Mensaje toast (default) | Variante opcional |
|-----------|---------|-------------------------|-------------------|
| Exit genérico interceptor | `IMPERSONATION_END` | "Modo soporte finalizado." | — |
| Support JWT expirado bootstrap | `IMPERSONATION_END` | "Tu sesión de soporte expiró… Retornando a Platform Admin…" | Existente V6.3 |
| 403 cambiar empresa | `IMPERSONATION_END` | "Cambio de empresa no permitido en modo soporte." | Sub-flag copy |
| 401 ERP operación | `IMPERSONATION_END` | "La sesión de soporte ya no es válida. Retornando a Platform Admin…" | Sub-flag copy |

**Regla:** usar `resolveTerminationUx('IMPERSONATION_END')` — **no** crear modal (Fase 7).

### 7.4 Orden interceptor (crítico)

```
1. shouldSkipTokenRefresh(url)? → return reject
2. PASSWORD_CHANGE redirect? → existing
3. isImpersonationSupportMode AND isImpersonationAuthErrorStatus?
   → [F6] CONTROLLED_EXIT (ANTES de single-flight / F5)
4. isImpersonationSupportMode AND 401 AND !_retry?
   → [F6] CONTROLLED_EXIT (ANTES de refresh — reemplaza reject plano actual)
5. Flujo ERP normal 401 → F5 single-flight → F1 → F4
```

---

## 8. Estrategia restorePlatformSession

### 8.1 Rol en Fase 6

`restorePlatformSession` (AuthContext existente) es el **único mecanismo** de salida controlada. Fase 6 **no modifica su cuerpo** — lo envuelve con:

1. Policy decision previa.
2. Toast UX F2.
3. Emit F4 post-restore.
4. Single-flight cleanup (`isRefreshingPromise = null`, `processQueue` reject) — **ya existente**.

### 8.2 Secuencia controlled exit (normativa)

| Paso | Acción | Fase |
|------|--------|------|
| 1 | Resolver policy → `CONTROLLED_EXIT` | F6 |
| 2 | Mostrar toast `IMPERSONATION_END` | F2 UX |
| 3 | Best-effort `authService.endImpersonation` si token impersonado | Existente manual path |
| 4 | `restorePlatformSession({ redirectToSuperAdmin })` | Existente |
| 5 | `initializeAuth` dentro restore | F1 |
| 6 | Emit `SESSION_LOGIN` parent access (F4 wiring) | F4 |
| 7 | Redirect `/super-admin/dashboard` si aplica | Existente |

### 8.3 Sin parent session

Si `getPlatformParentSession()` vacío → flujo existente `doLogout(false)` — **IM-04**. No inventar parent.

### 8.4 Relación con terminateSession F2

| Escenario | Mecanismo |
|-----------|-----------|
| Exit soporte normal | `restorePlatformSession` — **no** `terminateSession` |
| Parent inválido / corrupto | `doLogout` legacy |
| TOKEN_REUSE ERP (no soporte) | F2 terminate — sin cambio |
| Remote revoke admin | F3 probe → F2 terminate — sin cambio |

---

## 9. Integración con Phase-04 (auth-sync)

### 9.1 Reglas Fase 6 sobre F4 congelado

| Aspecto | Regla |
|---------|-------|
| Evento post-restore | Reutilizar **`SESSION_LOGIN`** con parent `accessToken` — backward-compatible |
| Payload | `accessToken`, `claimsSnapshot`, `empresaActivaId` — sin campos nuevos obligatorios |
| Extensión opcional | Campo `impersonationExitSource?` en payload — consumidores ignoran si ausente (patrón F5 `refreshOutcome`) |
| Follower apply | `applySessionTokenEvent` existente — F1 hydrate |
| Anti-loop | Política R1–R7 F4 — **no** re-emit en inbound |
| Leader | Única pestaña ejecuta restore HTTP; followers solo apply |
| `SELECTION_SYNC` | Sin cambio — ortogonal |

### 9.2 Escenario cross-tab V6.1

1. Tab A (soporte) recibe 401 ERP → controlled exit → emit `SESSION_LOGIN` parent.
2. Tab B (soporte follower) recibe BC → apply parent → sale de ERP inválido.
3. Tab B **no** llama `endImpersonation` ni refresh.

### 9.3 Qué no cambia F4

Cuerpos `session-auth-sync-emit.ts`, `session-auth-sync-apply.ts`, `session-auth-sync-channel.ts` — **congelados**. Solo extensión tipos opcional + wiring AuthContext.

---

## 10. Integración con Phase-02 (SessionTermination)

### 10.1 Uso F2 en F6

| Artefacto F2 | Uso F6 | Modificación |
|--------------|--------|--------------|
| `IMPERSONATION_END` reason | Copy toast | **Ninguna** |
| `resolveTerminationUx` | Mensaje + severity | **Ninguna** |
| `terminateSession` | **No** en exit normal soporte | **Cuerpo congelado** |
| `classifySessionTermination` | **No** en exit normal soporte | **Cuerpo congelado** |
| `runSessionTerminationExit` | **No** en exit normal soporte | Invocación existente solo ERP |

### 10.2 Cuándo sí F2 terminate en contexto impersonación

| Caso | Mecanismo |
|------|-----------|
| ERP token reuse real (no soporte) | F2 existente |
| Probe remoto post-revoke | F3 → F2 |
| Parent session corrupto → doLogout | Legacy path |

---

## 11. Integración con Phase-05 (Refresh Resilience)

### 11.1 Reglas de convivencia

| Aspecto | Regla F6 sobre F5 |
|---------|-------------------|
| Short-circuit soporte | **Antes** de `executeRefreshWithResilience` — preservar IM-02 |
| `REFRESH_FAILED_403` outcome | Documentado F5 como "delegar F6" — F6 implementa handler |
| Retry 500/429 | **Nunca** en soporte |
| L-02 guard cambiar empresa | **No registrar** si impersonación activa — pre-check F6 |
| Single-flight | Preservado — exit F6 limpia promise existente vía restore |
| Failure metadata F5 | No aplicable en soporte (no entra orchestrator F5) |

### 11.2 Diagrama convivencia interceptor

```
401 ERP
  ├─ soporte? → F6 exit (STOP)
  └─ normal → F5 resilience → F1 → F4
```

---

## 12. Integración multiempresa y multitenant

### 12.1 Multiempresa JWT (ME-xx)

| Regla | Fase 6 |
|-------|--------|
| ME-01 | `scopeEmpresaId` en ERP soporte = empresa impersonada — sin selector local |
| ME-02 | **Prohibido** `cambiarEmpresaActiva` en soporte — pre-check F6 |
| ME-03 | Post-restore parent → `empresaActivaId` platform — F1 hydrate |
| ME-05 | L-02 guard F5 **no aplica** en impersonación |

### 12.2 Multitenant

| Dimensión | Regla F6 |
|-----------|----------|
| **Tenant ERP** | Token impersonado scoped al cliente impersonado |
| **Parent restore** | `platform-parent-session.tenantContext` restaurado — existente |
| **Branding** | `clearAll(false)` en restore — existente |
| **tenant-sync BC** | Ortogonal — no fusionar con auth-sync |

### 12.3 RBAC

| Regla | Preservar |
|-------|-----------|
| `platform_admin` permisos | Post-restore vía `initializeAuth` |
| Bypass password change soporte | Existente — sin cambio |
| `logoutAll` bloqueado soporte | F3 — sin cambio |
| Acciones ERP post-exit | Parent RBAC platform — no ERP tenant |

---

## 13. Feature flags

### 13.1 Flags Fase 6

| Flag | Default diseño | Env | Alcance |
|------|----------------|-----|---------|
| `SESSION_IMPERSONATION_V6_ENABLED` | `true` | `VITE_SESSION_IMPERSONATION_V6_ENABLED` | Master — policy + orchestrator |
| `SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED` | `true` | `VITE_SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED` | Sub — interceptor 401/403 |
| `SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED` | `true` | `VITE_SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED` | Sub — guard cambiar empresa |
| `SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED` | `true` | `VITE_SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED` | Sub — emit post-restore F4 |

### 13.2 Ortogonalidad

Independientes de: F1–F5 flags, `SESSION_AUTH_SYNC_V4_*`, `SESSION_TERMINATION_V2_*`, `SESSION_LOGOUT_V3_*`.

### 13.3 Matriz combinada (producción objetivo)

| F1–F5 | F6 | Comportamiento |
|-------|-----|----------------|
| ON | ON | **Objetivo producción** — exit controlado soporte |
| ON | OFF | Legacy reject-al-caller (pre-F6) |
| OFF | ON | No aplicable — F6 requiere F1–F5 SIGNOFF |

---

## 14. Estrategia de rollback

| Nivel | Procedimiento | Efecto |
|-------|---------------|--------|
| L1 Runtime master | `VITE_SESSION_IMPERSONATION_V6_ENABLED=false` | Reject-al-caller legacy |
| L2 Runtime interceptor | Sub-flag interceptor OFF | 401/403 soporte reject sin auto-restore |
| L3 Runtime cambiar empresa | Sub-flag cambiar empresa OFF | 403 propagado al caller |
| L4 Runtime auth-sync | Sub-flag F4 OFF | Restore solo local tab |
| L5 Código | Revert commits Fase 6 | Post-Phase-5 intacto |

**Criterio activación rollback:** regresión Platform Admin smoke, loop restore cross-tab, regresión V1–V5.

---

## 15. Riesgos

### 15.1 Arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación |
|--------|-------|-----------|------------|
| Regresión Platform Admin login/exit | Media | Alta | Smoke §8; regresión V6.4 |
| Loop restore ↔ auth-sync | Media | Alta | R1–R7 F4; dedup token |
| Conflicto orden interceptor F5/F6 | Baja | Alta | Short-circuit soporte **antes** F5 |
| Doble toast exit | Media | Baja | Idempotency guard orchestrator |
| Follower sin parent en sessionStorage | Media | Media | BC propaga parent login |

### 15.2 Operativos

| Riesgo | Mitigación |
|--------|------------|
| Despliegue F6 sin F4 | Orden roadmap; guard deps |
| Staging sin usuario platform_admin | Fixture test + manual V6 |
| Cookie plataforma confundida con ERP | IM-01/IM-02 enforcement |

### 15.3 BE (limitaciones existentes)

| Limitación | Mitigación F6 |
|------------|---------------|
| Refresh impersonación 403 | Exit controlado — no retry |
| Cambiar empresa 403 | Pre-check + exit |
| Parent session solo sessionStorage | F4 sync cross-tab |

---

## 16. Plan de implementación

| Orden | ID | Entregable | Depende de |
|-------|-----|------------|------------|
| 1 | IMPL-01 | `session-impersonation.flags.ts` | — |
| 2 | IMPL-02 | `session-impersonation.types.ts` | 1 |
| 3 | IMPL-03 | `session-impersonation-exit.policy.ts` | 2 |
| 4 | IMPL-04 | `session-impersonation-exit.ts` — orchestrator | 3 |
| 5 | IMPL-05 | `session-impersonation-auth-sync.ts` — emit helper | 2, 4 |
| 6 | IMPL-06 | Wire interceptor 401/403 soporte | 4, 5 |
| 7 | IMPL-07 | Wire `cambiarEmpresaActiva` guard + 403 | 4 |
| 8 | IMPL-08 | Alinear bootstrap soporte bajo orchestrator | 4 |
| 9 | IMPL-09 | Verificar/alinear `endImpersonation` + emit F4 | 4, 5 |
| 10 | IMPL-10 | Extensión opcional payload F4 `impersonationExitSource?` | 5 |
| 11 | IMPL-11 | Tests unit policy + orchestrator | 3–5 |
| 12 | IMPL-12 | Tests integración interceptor mock | 6–9 |
| 13 | IMPL-13 | Regresión V1–V5 + escenarios V6 | 11, 12 |
| 14 | IMPL-14 | Documentación Phase-06 + Alignment patch (ticket doc) | 13 |
| 15 | VALIDATION | Manual staging V6.1–V6.4 | 13 |
| 16 | CLOSURE | Informe cierre Fase 6 | VALIDATION |

---

## 17. Estrategia de validación

### 17.1 Escenarios V6.x (Alignment §8)

| ID | Escenario | Criterio éxito | Automatizado | Manual |
|----|-----------|----------------|--------------|--------|
| **V6.1** | 401 ERP en modo soporte | Salida controlada Platform; **no** refresh plataforma | Sí — mock interceptor | **Requerido** |
| **V6.2** | F5 en modo soporte | Rehidratación sessionStorage válida | Sí — bootstrap mock | Smoke |
| **V6.3** | Support JWT expirado | Toast + restore parent | Sí — bootstrap mock | Smoke |
| **V6.4** | `endImpersonation` manual | Parent restaurado; ERP inaccessible | Sí — handler mock | **Requerido** |

### 17.2 Regresión obligatoria

V1.1–V1.4 · V2.1–V2.6 · V3.1–V3.4 · V4.1–V4.5 · V5.1–V5.5 · smoke §8 Platform impersonate → ERP → exit.

### 17.3 Playbook manual V6.1

1. Platform admin → impersonate cliente → operar ERP.
2. Forzar 401 (expirar access o endpoint protegido).
3. Verificar: toast exit, redirect Platform, **sin** POST refresh plataforma en Network.
4. Verificar tab follower (si aplica) sincroniza parent.

### 17.4 Playbook manual V6.4

1. Entrar modo soporte → ERP.
2. Click "Salir modo soporte" UI.
3. Verificar: parent restaurado, menú platform, sin acceso ERP tenant.

### 17.5 Evidencia cierre

CI verde · regresión V1–V5 · manual V6.1/V6.4 · tabla GAPs §18.

---

## 18. GAPs cerrados al finalizar

| GAP | Verificación | Matriz Alignment |
|-----|--------------|------------------|
| **GAP-P1-02** | V6.1, V6.3, V6.4 | Fila 17 → **A** |

**Hito:** H6 — Platform/impersonación (~96 % §19 estimado).

**Fuera de cierre F6 (sin reclasificar):** GAP-P1-05 (F9), GAP-P1-07, GAP-P3-02 (F7), GAP-P3-01 (F8), GAP-P2-07, etc.

---

## 19. Criterios de aceptación

### 19.1 Escenarios obligatorios

| ID | Criterio |
|----|----------|
| V6.1 | 401 ERP soporte → controlled exit; no refresh plataforma |
| V6.2 | F5 soporte → rehidratación sessionStorage OK |
| V6.3 | JWT soporte expirado → toast + restore parent |
| V6.4 | endImpersonation manual → parent OK; ERP blocked |

### 19.2 Criterios técnicos de cierre

| Criterio | Requerido |
|----------|-----------|
| IMPL-01–13 completados | Sí |
| Regresión V1–V5 verde | Sí |
| Contratos F1–F5 sin modificación cuerpo | Sí |
| IM-01/IM-02 preservados | Sí |
| OpenAPI sin cambios | Sí |
| Rollback flag verificado | Sí |
| Documentación Phase-06 + Alignment | Sí (IMPL-14) |

### 19.3 Criterios REJECTED

- Refresh plataforma observado en modo soporte (Network)
- Regresión V1, V2, V3, V4 o V5
- Modificación cuerpo `restorePlatformSession` / `terminateSession` / F5 modules
- Modificación contrato OpenAPI
- Modal UX sesión (invade F7)
- Refactor AuthContext estructural (invade F9)
- Loop restore cross-tab observado en staging

---

## Referencias cruzadas

| Documento | Sección |
|-----------|---------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 | §5 Fase 6, §8 V6.x, §6 deps, §10 H6 |
| `IAM_FE_PHASE_05_TECHNICAL_DESIGN.md` v1.1 | REFRESH_FAILED_403 delegación F6 |
| `IAM_FE_PHASE_04_TECHNICAL_DESIGN.md` v1.1 | §2.2 impersonación Platform sync |
| `IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` | IMPERSONATION_END, modo soporte defer |
| `IAM_SESSION_MANAGEMENT_V2.md` | §9 impersonación, §19 403 |
| `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | impersonation flows, platform parent |

---

## Tickets derivados (plantilla)

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-06-DESIGN-01 | Este documento |
| IAM-FE-PHASE-06-IMPERSONATION | Epic implementación |
| IAM-FE-PHASE-06-IMPL-* | Pasos 1–14 |
| IAM-FE-PHASE-06-VALIDATION | Paso 15 |
| IAM-FE-PHASE-06-CLOSURE-REPORT | Paso 16 |

---

**Fin del diseño IAM-FE-PHASE-06 — Impersonation & Platform Admin Hardening**

PHASE-06 DESIGN COMPLETE
