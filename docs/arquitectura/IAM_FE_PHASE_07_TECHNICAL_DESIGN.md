# IAM-FE-PHASE-07 — Diseño Técnico: UX Session Management

**Ticket diseño:** IAM-FE-PHASE-07-DESIGN-01  
**Ticket implementación:** IAM-FE-PHASE-07-SESSION-UX  
**Versión:** 1.0  
**Estado:** DESIGN ONLY — sin implementación  
**Fecha:** 2026-06-19  
**Referencias normativas:**
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 — Fase 7, §8 V7.x, GAP-P3-02, H7
- `docs/arquitectura/IAM_FE_PHASE_06_TECHNICAL_DESIGN.md` v1.0 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_05_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_04_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_03_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` — terminación, perfiles UX §19
- `docs/arquitectura/IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` — hydrate, bootstrap
- `IAM_SESSION_MANAGEMENT_V2.md` — §11 Session Limit, §12 Idle Timeout, §19 UX
- Informe: IAM-FE-PHASE-07-KICKOFF-01
- Acta: IAM-FE-PHASE-06-SIGNOFF-01

> Este documento define **cómo** se implementará la Fase 7.  
> No contiene código, pseudocódigo, parches ni modificaciones a documentos existentes.  
> **Las Fases 1–6 quedan congeladas** salvo wiring mínimo autorizado en `AuthContext`, `App` y componentes globales de gate/modal.

---

## Índice

1. [Objetivos](#1-objetivos)
2. [Alcance](#2-alcance)
3. [Arquitectura propuesta](#3-arquitectura-propuesta)
4. [Componentes nuevos](#4-componentes-nuevos)
5. [Componentes reutilizados](#5-componentes-reutilizados)
6. [Política UX (modal, pantalla, banner, toast)](#6-política-ux-modal-pantalla-banner-toast)
7. [Session Limit UX](#7-session-limit-ux)
8. [Bootstrap Gates](#8-bootstrap-gates)
9. [Integración con Phase-02 (SessionTermination)](#9-integración-con-phase-02-sessiontermination)
10. [Integración con Phase-03 (SessionRemoteProbe)](#10-integración-con-phase-03-sessionremoteprobe)
11. [Integración con Phase-04 (auth-sync)](#11-integración-con-phase-04-auth-sync)
12. [Integración con Phase-05 (Refresh Resilience)](#12-integración-con-phase-05-refresh-resilience)
13. [Integración con Phase-06 (Impersonation)](#13-integración-con-phase-06-impersonation)
14. [Feature flags](#14-feature-flags)
15. [Estrategia de rollback](#15-estrategia-de-rollback)
16. [Riesgos](#16-riesgos)
17. [Plan de implementación](#17-plan-de-implementación)
18. [Estrategia de validación](#18-estrategia-de-validación)
19. [GAPs cerrados al finalizar](#19-gaps-cerrados-al-finalizar)
20. [Criterios de aceptación](#20-criterios-de-aceptación)

---

## 1. Objetivos

### 1.1 Problema que resuelve

Tras SIGNOFF Phase-06, la **lógica de sesión** (refresh, terminación, multi-tab, impersonación) está alineada con §19 BE, pero la **capa de presentación UX** permanece **incompleta**:

| Contexto | Comportamiento post-Fase 6 | Impacto |
|----------|---------------------------|---------|
| Sesión expirada / idle / revoke remoto | Toast + redirect login (F2); banner en login | Usuario pierde contexto sin modal in-app claro |
| Session limit (BE desplaza sesión antigua) | Transparente para FE | Usuario no comprende por qué fue desconectado (GAP-P3-02) |
| Bootstrap / gates de carga | `AuthGate` + spinners ad hoc en `ProtectedRoute` | Posible flash de contenido protegido (V7.3) |
| Impersonación exit | Toast `IMPERSONATION_END` (F6) | Correcto — **no** modal F7 |

**GAP principal:** **GAP-P3-02** (Alignment §3, §5 Fase 7).  
**GAP residual complementario:** mejoras **§17 UX** y cierre parcial **GAP-P0-04** (capa presentación §19).

### 1.2 Objetivos funcionales (ticket)

| # | Objetivo |
|---|----------|
| 1 | Cerrar **GAP-P3-02** — feedback session limit al usuario desplazado y en re-login |
| 2 | Completar UX §19 — modal/pantalla sesión expirada **in-app** antes de redirect login |
| 3 | Unificar **V7.1** idle/expired/revoke remoto bajo misma experiencia visual |
| 4 | Unificar **V7.3** gates bootstrap — sin flash contenido protegido |
| 5 | Preservar perfiles F2 (`resolveTerminationUx`) como fuente normativa de copy |
| 6 | **Preservar** toast-only `IMPERSONATION_END` (F6 congelado) |
| 7 | Implementar vía **componentes globales reutilizables** + wiring mínimo |
| 8 | **Sin** modificar contratos OpenAPI ni cuerpos F1–F6 congelados |

### 1.3 Objetivo técnico formal

Introducir una capa **Session UX Presentation** que:

1. **Consuma** el resultado de terminación F2 (reason, profile, redirectPath) **sin alterar** `terminateSession`.
2. **Decida** canal de presentación puro: modal in-app → redirect; banner login; toast suplementario.
3. **Presente** modal global reutilizable para terminaciones de seguridad/expiración.
4. **Informe** session limit con copy dedicado derivado de señales HTTP/detail existentes.
5. **Coordine** gates bootstrap en shell global sin reescribir RBAC de rutas.
6. **Preserve** impersonación F6, auth-sync F4, probe F3, refresh F5 intactos.

### 1.4 Criterios de aceptación (enlace plan)

Escenarios obligatorios: **V7.1–V7.3** (`IAM_SESSION_ALIGNMENT_PLAN_V1.md` §8).

Regresión obligatoria: **V1.1–V1.4** + **V2.1–V2.6** + **V3.1–V3.4** + **V4.1–V4.5** + **V5.1–V5.5** + **V6.1–V6.4** + smoke Platform impersonate → ERP → exit.

---

## 2. Alcance

### 2.1 Dentro de alcance (MVP Fase 7)

| Área | Detalle |
|------|---------|
| Modal/pantalla sesión expirada global | Pre-redirect in-app para reasons F2 elegibles |
| Política presenter | Modal vs toast vs banner-only — pura, sin React en policy |
| Session limit awareness | Copy dedicado víctima desplazada + banner login re-login |
| Bootstrap gates unificados | Shell global; eliminar flash V7.3 |
| Login banner | Extender `LoginSessionTerminationBanner` — variantes limit/expired/idle |
| Flags | Master + sub-flags; rollback toast-only |
| Tests | Unit policy + integración presenter mock + regresión V1–V6 |

### 2.2 Fuera de alcance (explícito)

| Tema | Fase / norma |
|------|----------------|
| Telemetría estructurada refresh/logout | Fase 8 |
| Extracción módulos de `AuthContext` | Fase 9 |
| Modal en exit impersonación (`IMPERSONATION_END`) | **Prohibido** — F6 congelado |
| **Nuevas rutas de administración** | **Prohibido** |
| **Modificar pantalla Sesiones Activas Tenant Admin** | **Prohibido** |
| Mobile `X-Client-Type: mobile` | Ticket separado |
| Cambios contrato OpenAPI / nuevos endpoints | **Prohibido** |
| Modificar cuerpos `terminateSession`, `classifySessionTermination`, F3–F6 modules | **Prohibido** |
| Modificar cuerpos auth-sync F4 | **Prohibido** |
| Instancias API locales sin refresh (GAP-P2-07) | Ticket hybrid |

### 2.3 Dependencias duras

| Dependencia | Estado requerido |
|-------------|------------------|
| Fase 2 cerrada (SIGNOFF) | Perfiles UX, redirect `?session=`, `terminateSession` |
| Fase 3 cerrada (SIGNOFF) | Probe remoto → terminación F2 |
| Fases 1, 4, 5, 6 cerradas (SIGNOFF) | Regresión obligatoria; sin modificar cuerpos |
| Contrato BE §11 Session Limit | Production Ready — sin cambios FE en API |

---

## 3. Arquitectura propuesta

### 3.1 Principio de diseño: presenter puro + UI global + wiring delgado

| Capa | Nombre | Responsabilidad Fase 7 |
|------|--------|------------------------|
| **L7-A** | UX types | Canales presentación, contexto terminación, gate state |
| **L7-B** | UX presenter policy | Decisión pura: modal / toast-only / banner-only / silent |
| **L7-C** | Session limit policy | Detección heurística limit + copy dedicado |
| **L7-D** | Bootstrap gate policy | Cuándo bloquear render hijos (V7.3) |
| **L7-E** | UI global | `SessionExpiredDialog`, gate shell, banners |
| **L7-F** | Wiring | AuthContext / App / AuthGate / Login — mínimo |

**Regla central:** F7 **no decide** terminación de sesión — solo **presenta** el resultado ya resuelto por F2. La terminación sigue fluyendo: classify (F2) → terminate (F2) → **present (F7)** → redirect (F2 wiring existente).

### 3.2 Diagrama arquitectura objetivo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ App shell — SessionUxBinder (L7-F)                                           │
│  ├─ SessionBootstrapGate (L7-E) ──► bloquea router hasta gates OK (V7.3)   │
│  └─ SessionExpiredDialog (L7-E) ◄── resolveSessionUxPresentation (L7-B)      │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ AuthContext — wiring mínimo (L7-F)                                           │
│  terminateSession deps:                                                       │
│    showTerminationToast ──► [F7] presenter (modal OR toast, no ambos)        │
│    redirectToLogin ──► tras cierre modal / ack usuario                       │
│  bootstrap: isBootstrapped + sessionGateReady (L7-D)                         │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ F2 congelado — terminateSession / classifySessionTermination               │
│ F3 congelado — SessionRemoteProbe → runTerminateSession                    │
│ F4 congelado — SESSION_TERMINATED inbound → runTerminateFromSync             │
│ F5 congelado — refresh fail → classify → terminate                         │
│ F6 congelado — IMPERSONATION_END toast-only (bypass modal F7)               │
└──────────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ Login — LoginSessionTerminationBanner (L7-E extensión)                       │
│  ?session=expired|security|idle|error|limit (limit = extensión FE query)     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Qué cambia vs Fase 6

| Elemento | Cambio Fase 7 |
|----------|---------------|
| Terminación ERP expirada/revoke/idle | De toast-only → **modal global** (flag ON) + redirect |
| Session limit víctima | De silencioso → copy dedicado + banner login |
| Bootstrap / ProtectedRoute gates | De spinners ad hoc → **gate shell unificado** |
| Impersonación exit | **Sin cambio** — toast F6 |
| F1–F6 session logic | **Sin cambio** de cuerpos |

### 3.4 Qué permanece congelado (Fases 1–6)

| Artefacto | Estado |
|-----------|--------|
| `terminateSession` / `classifySessionTermination` | **Cuerpos congelados** |
| `applyPostRefreshSession` / `hydrateSessionCore` | Cuerpos congelados |
| `executeRefreshWithResilience` / retry policy F5 | Cuerpos congelados |
| Módulos auth-sync F4 (emit/apply/channel) | **Cuerpos congelados** |
| `SessionRemoteProbe` / `executeLogoutAllFlow` | **Cuerpos congelados** |
| `restorePlatformSession` | Cuerpo congelado |
| Módulos F6 impersonation (policy, orchestrator, flags) | **Congelados** |
| `session-termination-ux.ts` perfiles canónicos | **Sin redefinir copy** — F7 consume |
| OpenAPI / contratos BE | **Sin modificaciones** |
| Pantalla Sesiones Activas Tenant Admin | **Sin modificaciones** |
| Rutas administración nuevas | **Prohibidas** |

> **Declaración normativa:** **F1–F6 permanecen congeladas.** No modificar cuerpos de `terminateSession`, `classifySessionTermination`, `SessionRemoteProbe`, `executeRefreshWithResilience`, `restorePlatformSession`, módulos Auth Sync ni OpenAPI.

---

## 4. Componentes nuevos

| Artefacto | Ubicación propuesta | Responsabilidad |
|-----------|---------------------|-----------------|
| `session-ux.flags.ts` | `src/core/auth/session/` | Flags Fase 7 |
| `session-ux.types.ts` | `src/core/auth/session/` | Tipos canal UX, gate state, presenter input |
| `session-ux-presenter.policy.ts` | `src/core/auth/session/` | Política pura modal vs toast vs banner |
| `session-limit-ux.policy.ts` | `src/core/auth/session/` | Heurística session limit + copy §11 BE |
| `session-bootstrap-gate.policy.ts` | `src/core/auth/session/` | Política V7.3 — cuándo mostrar gate |
| `session-ux-presenter.ts` | `src/core/auth/session/` | Orquestador presentación (sin React) |
| `SessionExpiredDialog.tsx` | `src/core/auth/session/components/` | Modal global Capa 1 tokens |
| `SessionBootstrapGate.tsx` | `src/core/auth/session/components/` | Shell gate unificado |
| `SessionUxBinder.tsx` | `src/core/auth/session/components/` | Montaje global modal + gate |
| `login-session-limit.ts` | `src/features/auth/utils/` | Helper banner limit en login (extensión FE query) |
| Tests | `src/core/auth/session/__tests__/` | Unit policy + presenter |
| `auth-phase-07-regression.test.ts` | `src/shared/context/__tests__/` | Regresión V7 + manifesto V1–V6 |

**Nota:** componentes UI en `src/core/auth/session/components/` — globales, reutilizables, sin acoplar a módulos ERP.

---

## 5. Componentes reutilizados

### 5.1 Stack congelado (solo invocación / consumo)

| Contrato | Uso Fase 7 |
|----------|------------|
| `resolveTerminationUx` / `session-termination-ux.ts` | Copy, severity, query param canónico |
| `classifySessionTermination` | Input al presenter — **sin modificar cuerpo** |
| `terminateSession` | Flujo terminación — **sin modificar cuerpo** |
| `LoginSessionTerminationBanner` | Banner login post-redirect |
| `login-session-termination.ts` | Parser `?session=` — extensión query `limit` en wiring F7 |
| `AuthGate` | Integración gate bootstrap |
| `ProtectedRoute` | Consumir `sessionGateReady` — reducir spinners duplicados |
| `LoadingSpinner` | Referencia visual gate unificado |
| `createAuthShowTerminationToast` / redirect deps | Reemplazo parcial vía wiring F7 |

### 5.2 Wiring permitido (L7-F)

| Pieza | Descripción |
|-------|-------------|
| `TerminateSessionDeps.showTerminationToast` | Delegar a presenter F7 en lugar de toast directo |
| `TerminateSessionDeps.redirectToLogin` | Invocar **después** de cierre modal (ack) |
| `App.tsx` / layout root | Montar `SessionUxBinder` |
| `AuthGate` | Componer `SessionBootstrapGate` |
| `Login.tsx` | Variante banner session limit |
| F6 impersonation paths | **Sin wiring F7** — bypass presenter modal |

**Prohibido:** alterar firmas públicas `useAuth()`; modificar cuerpos congelados F1–F6.

---

## 6. Política UX (modal, pantalla, banner, toast)

### 6.1 Canales de presentación

| Canal | Cuándo | Prioridad |
|-------|--------|-----------|
| **Modal in-app** (`SessionExpiredDialog`) | Terminación con redirect login programado; reason elegible | Primario (flag ON) |
| **Banner login** | Post-redirect en `/login?session=...` | Secundario — refuerzo |
| **Toast** | `SILENT_CLEANUP`; fallback rollback flag OFF; suplemento no duplicado | Terciario / fallback |
| **Pantalla full-screen** | **No MVP** — modal Radix Dialog suficiente; pantalla dedicada solo si modal insuficiente en VALIDATION |

### 6.2 Reasons elegibles para modal F7

| Reason F2 | Modal F7 | Query login | Notas |
|-----------|----------|-------------|-------|
| `SESSION_EXPIRED` | ✅ | `expired` | V7.1 |
| `REFRESH_UNAUTHORIZED` | ✅ | `expired` | Alias UX expired |
| `TOKEN_REUSE` | ✅ | `security` | Copy seguridad F2 |
| `IDLE_TIMEOUT` | ✅ | `idle` | V7.1 — mismo UX que revoke |
| `REFRESH_REVOKED` | ✅ | `expired` | Revoke remoto F3 |
| `REMOTE_REVOKE` / probe | ✅ | `expired` | V7.1 equivalencia |
| `MANUAL_LOGOUT` | ❌ | — | Sin modal — flujo usuario |
| `IMPERSONATION_END` | ❌ | — | **Toast-only F6 — prohibido modal** |
| `SILENT_CLEANUP` | ❌ | — | Sin feedback |
| `HYDRATE_FAILED` | ✅ | `error` | Opcional modal |
| `UNKNOWN` | ✅ | `error` | Fallback |

### 6.3 Secuencia modal → redirect (normativa)

| Paso | Acción | Fase |
|------|--------|------|
| 1 | F2 `terminateSession` limpia estado local | F2 congelado |
| 2 | F7 presenter recibe profile UX | F7 |
| 3 | Mostrar `SessionExpiredDialog` con copy F2 | F7 |
| 4 | Usuario confirma (botón «Ir a iniciar sesión») | F7 |
| 5 | `redirectToLogin(profile.redirectPath)` | F2 wiring |
| 6 | Banner login refuerza mensaje si `?session=` presente | F7 extensión |

### 6.4 Regla anti-duplicación (UX-01)

| ID | Regla |
|----|-------|
| **UX-01** | Modal ON → **no** toast paralelo para mismo evento terminación |
| **UX-02** | Modal OFF (rollback) → comportamiento F2 toast-only preservado |
| **UX-03** | `IMPERSONATION_END` → **exclusivamente toast** — presenter bypass |
| **UX-04** | Copy siempre desde `resolveTerminationUx` — F7 no inventa strings canónicos |
| **UX-05** | Capa 1 tokens semánticos — prohibido `gray-*` / `slate-*` estructural |

### 6.5 Convivencia con ConfirmDialog ERP (B11)

Modal sesión F7 es **global**, fuera de flujos transaccionales B-F/B-L. No abrir `SessionExpiredDialog` mientras Radix Dialog operativo ERP esté abierto — presenter encola o prioriza terminación (política L7-B).

---

## 7. Session Limit UX

### 7.1 Contexto BE (`IAM_SESSION_MANAGEMENT_V2.md` §11)

| Evento BE | Efecto FE hoy | Objetivo F7 |
|-----------|---------------|-------------|
| Login nuevo desplaza sesión antigua (`SESSION_LIMIT`) | 401 transparente en pestaña víctima | Informar víctima con copy claro |
| Usuario desplazado re-ingresa | Banner login genérico `expired` | Mensaje session limit si aplica (V7.2) |

### 7.2 Estrategia sin modificar OpenAPI

F7 **no añade** campos al contrato login. Detección vía señales existentes:

| Señal | Fuente | Acción F7 |
|-------|--------|-----------|
| `detail` HTTP con patrones session limit | classify input / error response | `session-limit-ux.policy.ts` heurística |
| Reason F2 post-classify | `SESSION_EXPIRED` + detail limit | Modal copy variant limit |
| Redirect login | Query FE `?session=limit` (extensión presenter) | Banner login dedicado |

**Patrones heurísticos (derivados §11 BE):** `session_limit`, `max_active`, `demasiados dispositivos`, `session limit`.

### 7.3 Flujos V7.2

| Actor | Flujo | Presentación |
|-------|-------|--------------|
| **Víctima** (sesión desplazada) | 401 → F5 fail → F2 terminate | Modal limit copy + redirect `?session=limit` |
| **Re-login víctima** | Llega a `/login?session=limit` | `LoginSessionTerminationBanner` variant limit |
| **Ganador** (nuevo login) | Login OK — sin señal BE | **Sin modal** — opcional toast info one-shot post-login desactivado en MVP (evitar ruido sin contrato) |

### 7.4 Copy normativo (propuesto — sujeto a validación UX)

| Contexto | Mensaje default |
|----------|-----------------|
| Modal víctima limit | «Tu sesión se cerró porque se alcanzó el límite de dispositivos activos. Inicia sesión nuevamente.» |
| Banner login `limit` | Mismo mensaje — severity `info` |

Copy definitivo en IMPL vía extensión `session-limit-ux.policy.ts` — **no** modificar `session-termination-ux.ts` perfiles F2 congelados; F7 usa override presenter cuando heurística limit activa.

---

## 8. Bootstrap Gates

### 8.1 Problema V7.3

Hoy coexisten:

- `AuthGate` — `isBootstrapped` + `LoadingSpinner`
- `ProtectedRoute` — `authInitialized`, `authLoading`, `sessionGatesPending`
- Spinners inline ad hoc (clases distintas)

**Riesgo:** render breve de layout/rutas antes de gates satisfechos.

### 8.2 Política gate unificada (L7-D)

| Gate | Condición | Bloquea |
|------|-----------|---------|
| **G1 Bootstrap** | `!isBootstrapped` | Router completo |
| **G2 Auth init** | `!authInitialized \|\| authLoading` | Contenido autenticado |
| **G3 Session ready** | autenticado && (`!permissionsInitialized \|\| !menuPermissionsReady`) | Contenido ERP operativo |

`sessionGateReady = f(isBootstrapped, authInitialized, authLoading, permissionsInitialized, menuPermissionsReady, isAuthenticated)`

### 8.3 Componente `SessionBootstrapGate`

- Envuelve `{children}` en `SessionUxBinder`.
- Un solo spinner semántico (`LoadingSpinner` o equivalente Capa 1).
- **No** elevar `loading` global en refresh background (F1/F5 — preservar).
- Rutas públicas (`/login`) — gate G1 solo; G2/G3 no aplican.

### 8.4 Cambios en ProtectedRoute (wiring mínimo)

- Eliminar spinner duplicado cuando `SessionBootstrapGate` activo (flag ON).
- Mantener lógica RBAC/redirect — **solo** presentación loading delegada a gate global.

---

## 9. Integración con Phase-02 (SessionTermination)

### 9.1 Reglas F7 sobre F2 congelado

| Aspecto | Regla |
|---------|-------|
| `terminateSession` cuerpo | **Sin modificación** |
| `classifySessionTermination` cuerpo | **Sin modificación** |
| `session-termination-ux.ts` | **Consumir** — no redefinir perfiles |
| `showTerminationToast` dep | **Wiring F7** — presenter intercepta |
| `redirectToLogin` dep | **Wiring F7** — post-modal ack |
| Reasons / query params | Reutilizar F2 — extensión `limit` solo en presenter redirect |

### 9.2 Diagrama convivencia

```
classifySessionTermination (F2)
  → terminateSession (F2)
  → executeSessionUxPresentation (F7)
       ├─ MODAL → SessionExpiredDialog → redirectToLogin
       ├─ TOAST_ONLY (rollback / IMPERSONATION_END bypass)
       └─ SILENT
```

---

## 10. Integración con Phase-03 (SessionRemoteProbe)

| Aspecto | Regla F7 |
|---------|----------|
| `SessionRemoteProbe` cuerpo | **Sin modificación** |
| Probe → `runTerminateSession` | Sin cambio flujo |
| Revoke remoto UX | V7.1 — **mismo modal** que expired/idle |
| Post-terminate probe skip | Preservar F3 `AUTH_SYNC_TERMINATION_PROBE_SKIP_MS` |

F7 solo cambia **presentación** post-terminación probe — no lógica probe.

---

## 11. Integración con Phase-04 (auth-sync)

| Aspecto | Regla F7 |
|---------|----------|
| Módulos emit/apply/channel | **Cuerpos congelados** |
| `SESSION_TERMINATED` inbound | Follower → `runTerminateFromSync` → **mismo presenter F7** |
| Anti-loop R1–R7 | Preservado — presenter no emite BC |
| Modal cross-tab | Follower muestra modal si terminación inbound visible |

Wiring: `runTerminateFromSync` deps comparten presenter con tab líder.

---

## 12. Integración con Phase-05 (Refresh Resilience)

| Aspecto | Regla F7 |
|---------|----------|
| `executeRefreshWithResilience` cuerpo | **Sin modificación** |
| Refresh fail → classify → terminate | Sin cambio |
| Outcomes F5 metadata | No aplicables a presenter — classify F2 decide reason |
| Retry path | Sin modal — usuario no ve refresh background |

F7 presenta solo **terminación final** tras agotar F5 — no estados intermedios retry.

---

## 13. Integración con Phase-06 (Impersonation)

| Aspecto | Regla F7 |
|---------|----------|
| Módulos F6 impersonation | **Congelados** |
| `IMPERSONATION_END` | **Toast-only — prohibido modal F7** |
| `executeImpersonationControlledExit` | Bypass presenter modal — invoca toast directo |
| IM-01…IM-08 | Preservados — F7 no toca lógica soporte |

**Declaración expresa:** **`IMPERSONATION_END` permanece exclusivamente toast (no modal).**

Presenter policy: reason/context `IMPERSONATION_END` o source F6 → canal `TOAST_ONLY` incondicional.

---

## 14. Feature flags

### 14.1 Flags Fase 7

| Flag | Default diseño | Env | Alcance |
|------|----------------|-----|---------|
| `SESSION_UX_V7_ENABLED` | `true` | `VITE_SESSION_UX_V7_ENABLED` | Master — presenter + componentes |
| `SESSION_EXPIRED_MODAL_V7_ENABLED` | `true` | `VITE_SESSION_EXPIRED_MODAL_V7_ENABLED` | Sub — modal pre-redirect |
| `SESSION_LIMIT_FEEDBACK_V7_ENABLED` | `true` | `VITE_SESSION_LIMIT_FEEDBACK_V7_ENABLED` | Sub — V7.2 copy limit |
| `SESSION_BOOTSTRAP_GATE_V7_ENABLED` | `true` | `VITE_SESSION_BOOTSTRAP_GATE_V7_ENABLED` | Sub — gate unificado V7.3 |

### 14.2 Ortogonalidad

Independientes de: F1–F6 flags, `SESSION_TERMINATION_V2_*`, `SESSION_AUTH_SYNC_V4_*`, `SESSION_IMPERSONATION_V6_*`.

### 14.3 Matriz combinada (producción objetivo)

| F1–F6 | F7 | Comportamiento |
|-------|-----|----------------|
| ON | ON | **Objetivo producción** — modal + gates + limit feedback |
| ON | OFF | Legacy F2 toast + banner login + spinners ad hoc |
| OFF | ON | No aplicable — F7 requiere F2 SIGNOFF |

---

## 15. Estrategia de rollback

| Nivel | Procedimiento | Efecto |
|-------|---------------|--------|
| L1 Runtime master | `VITE_SESSION_UX_V7_ENABLED=false` | Comportamiento post-F6 (toast-only F2) |
| L2 Runtime modal | Sub-flag modal OFF | Toast-only terminación |
| L3 Runtime limit | Sub-flag limit OFF | Sin copy limit dedicado |
| L4 Runtime gates | Sub-flag gate OFF | Spinners legacy ProtectedRoute |
| L5 Código | Revert commits Fase 7 | Post-Phase-6 intacto |

**Criterio activación rollback:** regresión V1–V6, modal bloquea logout manual, flash contenido empeora, conflicto ConfirmDialog ERP.

---

## 16. Riesgos

### 16.1 Arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación |
|--------|-------|-----------|------------|
| Doble feedback modal + toast | Media | Media | UX-01 presenter idempotency |
| Modal vs ConfirmDialog ERP simultáneo | Media | Alta | Política L7-B — no modal con Dialog ERP abierto |
| Flash contenido persiste post-gate | Media | Media | V7.3 tests; gate envuelve router |
| Regresión impersonación F6 | Baja | Alta | Bypass incondicional IMPERSONATION_END |
| Session limit sin señal BE explícita | Media | Media | Heurística detail; copy genérico fallback |

### 16.2 Operativos

| Riesgo | Mitigación |
|--------|------------|
| Despliegue F7 sin VALIDATION manual | Playbook V7.1–V7.3 staging |
| Copy limit incorrecto por locale | Copy FE único español — validación UX |

### 16.3 UX

| Riesgo | Mitigación |
|--------|------------|
| Modal interrumpe flujo usuario activo | Ack explícito — no auto-close agresivo |
| TOKEN_REUSE alarmante | Copy F2 `security` — severity error modal |

---

## 17. Plan de implementación

| Orden | ID | Entregable | Depende de |
|-------|-----|------------|------------|
| 1 | IMPL-01 | `session-ux.flags.ts` | — |
| 2 | IMPL-02 | `session-ux.types.ts` | 1 |
| 3 | IMPL-03 | `session-ux-presenter.policy.ts` | 2 |
| 4 | IMPL-04 | `session-limit-ux.policy.ts` | 2 |
| 5 | IMPL-05 | `session-bootstrap-gate.policy.ts` | 2 |
| 6 | IMPL-06 | `session-ux-presenter.ts` — orchestrator | 3–5 |
| 7 | IMPL-07 | `SessionExpiredDialog.tsx` | 2 |
| 8 | IMPL-08 | `SessionBootstrapGate.tsx` + `SessionUxBinder.tsx` | 5, 7 |
| 9 | IMPL-09 | Wire `showTerminationToast` / redirect deps AuthContext | 6, 8 |
| 10 | IMPL-10 | Wire `App` + `AuthGate` + `ProtectedRoute` gates | 8 |
| 11 | IMPL-11 | Extensión `login-session-termination.ts` + Login banner limit | 4 |
| 12 | IMPL-12 | Tests unit policy + presenter | 3–6 |
| 13 | IMPL-13 | Tests integración + `auth-phase-07-regression.test.ts` | 9–11 |
| 14 | IMPL-14 | Regresión V1–V6 + escenarios V7 | 12, 13 |
| 15 | VALIDATION | Manual staging V7.1–V7.3 | 14 |
| 16 | CLOSURE | Informe cierre + SignOff Fase 7 | VALIDATION |

---

## 18. Estrategia de validación

### 18.1 Escenarios V7.x (Alignment §8)

| ID | Escenario | Criterio éxito | Automatizado | Manual |
|----|-----------|----------------|--------------|--------|
| **V7.1** | Sesión expirada idle (BE config) | Mismo UX modal que revoke; mensaje claro | Sí — presenter mock | **Requerido** |
| **V7.2** | Session limit desplaza sesión antigua | Víctima informada; banner login `limit` | Sí — policy heurística | **Requerido** |
| **V7.3** | Gates carga bootstrap | Sin flash contenido protegido | Sí — gate policy | Smoke |

### 18.2 Regresión obligatoria

V1.1–V1.4 · V2.1–V2.6 · V3.1–V3.4 · V4.1–V4.5 · V5.1–V5.5 · V6.1–V6.4 · smoke §8 Platform impersonate → ERP → exit.

### 18.3 Playbook manual V7.1

1. Login ERP → esperar idle timeout BE (o forzar 401 refresh).
2. Verificar: modal in-app → ack → redirect login → banner coherente.
3. Verificar: **sin** toast duplicado.

### 18.4 Playbook manual V7.2

1. Configurar tenant `max_active_sessions=1`.
2. Login dispositivo A → login dispositivo B mismo usuario.
3. Dispositivo A: verificar modal/banner session limit.
4. Re-login A: verificar banner `?session=limit`.

### 18.5 Playbook manual V7.3

1. Hard refresh en ruta `/app/*` autenticado.
2. Verificar: solo gate unificado visible — **sin** flash tabla/contenido.
3. Repetir con selección empresa pendiente.

### 18.6 Playbook V6 regresión (impersonación)

1. Entrar modo soporte → forzar exit.
2. Verificar: **toast only** — **sin** `SessionExpiredDialog`.

### 18.7 Evidencia cierre

CI verde · regresión V1–V6 · manual V7.1/V7.2 · tabla GAPs §19.

---

## 19. GAPs cerrados al finalizar

| GAP | Verificación | Matriz Alignment |
|-----|--------------|------------------|
| **GAP-P3-02** | V7.2 | Session limit → **A** |
| **GAP-P0-04 (residual UX)** | V7.1 modal + redirect | Session expired → **A** |
| **§17 UX idle (#20)** | V7.1 equivalencia revoke | Idle → **A** |
| **§17 UX gates** | V7.3 | Bootstrap gates → **A** |

**Hito:** H7 — UX + observabilidad (conjunto con Fase 8) (~98 % §19 estimado en UX usuario).

**Fuera de cierre F7 (sin reclasificar):** GAP-P3-01 (F8), GAP-P1-05 (F9), GAP-P2-07, telemetría F8.

---

## 20. Criterios de aceptación

### 20.1 Escenarios obligatorios

| ID | Criterio |
|----|----------|
| V7.1 | Idle/expired/revoke → modal unificado; mensaje F2; redirect login |
| V7.2 | Session limit víctima informada; banner login limit |
| V7.3 | Bootstrap gates unificados; sin flash contenido protegido |
| V6.4 regresión | Impersonación exit → toast only — **sin modal** |

### 20.2 Criterios técnicos de cierre

| Criterio | Requerido |
|----------|-----------|
| IMPL-01–14 completados | Sí |
| Regresión V1–V6 verde | Sí |
| Cuerpos F1–F6 sin modificación | Sí |
| UX-01…UX-05 preservados | Sí |
| OpenAPI sin cambios | Sí |
| Sin rutas admin nuevas | Sí |
| Sesiones Activas Tenant Admin sin cambios | Sí |
| Rollback flag verificado | Sí |

### 20.3 Criterios REJECTED

- Modal en exit impersonación (viola F6)
- Modificación cuerpo `terminateSession` / `classifySessionTermination`
- Modificación contrato OpenAPI
- Nueva pantalla/ruta administración sesiones
- Modificación pantalla Sesiones Activas Tenant Admin
- Regresión V1–V6
- Doble toast + modal mismo evento
- Flash contenido protegido observable en staging

---

## Declaraciones normativas finales

1. **F1–F6 permanecen congeladas.**
2. **No modificar** cuerpos de `terminateSession`, `classifySessionTermination`, `SessionRemoteProbe`, `executeRefreshWithResilience`, `restorePlatformSession`, módulos Auth Sync ni **OpenAPI**.
3. **`IMPERSONATION_END` permanece exclusivamente toast (no modal).**
4. **No crear nuevas rutas de administración.**
5. **No modificar la pantalla de Sesiones Activas del Tenant Admin.**
6. La UX de Phase-07 se implementará mediante **componentes globales reutilizables** y **wiring mínimo autorizado**.
7. **VALIDATION manual** pertenece al despliegue — no bloquea aprobación del diseño.

---

## Referencias cruzadas

| Documento | Sección |
|-----------|---------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 | §5 Fase 7, §8 V7.x, §10 H7 |
| `IAM_FE_PHASE_06_TECHNICAL_DESIGN.md` v1.0 | Fuera alcance modal F6 |
| `IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` | Perfiles UX, terminación |
| `IAM_SESSION_MANAGEMENT_V2.md` | §11 Session Limit, §12 Idle, §19 |
| `ERP_FRONTEND_STANDARDS_V2.md` | Capa 1 tokens, ConfirmDialog B11 |

---

## Tickets derivados (plantilla)

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-07-DESIGN-01 | Este documento |
| IAM-FE-PHASE-07-SESSION-UX | Epic implementación |
| IAM-FE-PHASE-07-IMPL-* | Pasos 1–14 |
| IAM-FE-PHASE-07-VALIDATION | Paso 15 |
| IAM-FE-PHASE-07-CLOSURE-REPORT | Paso 16 |

---

**Fin del diseño IAM-FE-PHASE-07 — UX Session Management**

PHASE-07 DESIGN COMPLETE
