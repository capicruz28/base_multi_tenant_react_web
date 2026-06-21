# IAM-FE-PHASE-08 — Diseño Técnico: Session Telemetry & Observability

**Ticket diseño:** IAM-FE-PHASE-08-DESIGN-01  
**Ticket implementación:** IAM-FE-PHASE-08-OBSERVABILITY  
**Versión:** 1.0  
**Estado:** DESIGN ONLY — sin implementación  
**Fecha:** 2026-06-19  
**Referencias normativas:**
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 — Fase 8, §8 V8.x, GAP-P3-01, H7
- `docs/arquitectura/IAM_FE_PHASE_07_TECHNICAL_DESIGN.md` v1.0 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_06_TECHNICAL_DESIGN.md` v1.0 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_05_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_04_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_03_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` — terminación, taxonomía reason
- `docs/arquitectura/IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` — hydrate, bootstrap
- `IAM_SESSION_MANAGEMENT_V2.md` — §5 auditoría BE, §6–7 logout, §19
- `docs/frontend/auditoria/PLATFORM_REFRESH_DIAGNOSTIC.md` — matriz diagnóstico refresh platform vs tenant
- Informe: IAM-FE-PHASE-08-KICKOFF-01
- Acta: IAM-FE-PHASE-07-SIGNOFF-01

> Este documento define **cómo** se implementará la Fase 8.  
> No contiene código, pseudocódigo, parches ni modificaciones a documentos existentes.  
> **Las Fases 1–7 quedan congeladas** salvo wiring mínimo autorizado en `AuthContext` y puntos de invocación pasiva.

---

## Declaraciones normativas (Fase 8)

1. **La telemetría es completamente pasiva** — observa eventos ya resueltos; no toma decisiones de sesión.
2. **No modifica el flujo de sesión** (refresh, terminación, probe, auth-sync, impersonación).
3. **No modifica UX** — Fase 7 congelada; sin modal, gate, banner ni pantalla nuevos.
4. **No modifica contratos OpenAPI** — sin endpoints nuevos ni campos API inventados.
5. **No crea endpoints, pantallas ni rutas.**
6. **No altera F1–F7** — cuerpos congelados; solo wiring mínimo de emisión.
7. **Toda información sensible debe pasar por la Redaction Policy** antes de cualquier sink.
8. **Los sinks DEV son el único destino MVP** — proveedores externos (Datadog, Sentry, etc.) **fuera de alcance**.

---

## Índice

1. [Objetivos](#1-objetivos)
2. [Alcance](#2-alcance)
3. [Arquitectura propuesta L8](#3-arquitectura-propuesta-l8)
4. [Componentes nuevos](#4-componentes-nuevos)
5. [Componentes reutilizados](#5-componentes-reutilizados)
6. [Política de redacción (Redaction Policy)](#6-política-de-redacción-redaction-policy)
7. [Taxonomía oficial de eventos de sesión](#7-taxonomía-oficial-de-eventos-de-sesión)
8. [Correlación Refresh, Termination, Auth Sync, Probe e Impersonation](#8-correlación-refresh-termination-auth-sync-probe-e-impersonation)
9. [Integración con Phase-01](#9-integración-con-phase-01)
10. [Integración con Phase-02](#10-integración-con-phase-02)
11. [Integración con Phase-03](#11-integración-con-phase-03)
12. [Integración con Phase-04](#12-integración-con-phase-04)
13. [Integración con Phase-05](#13-integración-con-phase-05)
14. [Integración con Phase-06](#14-integración-con-phase-06)
15. [Integración con Phase-07](#15-integración-con-phase-07)
16. [Feature flags](#16-feature-flags)
17. [Estrategia de rollback](#17-estrategia-de-rollback)
18. [Riesgos](#18-riesgos)
19. [Plan de implementación](#19-plan-de-implementación)
20. [Estrategia de validación](#20-estrategia-de-validación)
21. [GAPs cerrados al finalizar](#21-gaps-cerrados-al-finalizar)
22. [Criterios de aceptación](#22-criterios-de-aceptación)

---

## 1. Objetivos

### 1.1 Problema que resuelve

Tras SIGNOFF Phase-07, la **lógica y UX de sesión** están alineadas con §19 BE, pero la **observabilidad operativa FE** permanece **fragmentada**:

| Contexto | Comportamiento post-Fase 7 | Impacto |
|----------|---------------------------|---------|
| Refresh ok/fail | Outcomes F5 tipados; logs ad hoc `auth-debug` | Diagnóstico inconsistente; riesgo loguear datos sensibles |
| Terminación / logout | Reason F2 resuelto; sin trazabilidad unificada | Difícil distinguir manual vs remote vs refresh fail (V8.2) |
| Cross-tab | Auth-sync F4 emite payloads; sin consolidación | Eventos multi-tab no correlacionados |
| Platform refresh 401 | Runbook `PLATFORM_REFRESH_DIAGNOSTIC` manual | Sin instrumentación FE estructurada comparable |
| DEV ruido | `logAuthContext`, `post-login-diag` dispersos | GAP-P3-01 — higiene y ruido en rutas sesión |

**GAP principal:** **GAP-P3-01** (Alignment §3, §5 Fase 8).  
**GAP complementario:** soporte diagnóstico **PLATFORM_REFRESH_DIAGNOSTIC** y cierre componente **H7** (observabilidad junto a F7).

### 1.2 Objetivos funcionales (ticket)

| # | Objetivo |
|---|----------|
| 1 | Cerrar **GAP-P3-01** — consolidar logs sesión detrás de telemetría estructurada + flags |
| 2 | Emitir eventos refresh **sin token completo** — prefix/metadata (V8.1) |
| 3 | Correlacionar **logout reason** con origen lógico (V8.2) |
| 4 | Alinear semántica FE con auditoría BE (`token_refresh`, `logout`, `token_reuse_detected`, etc.) — **sin OpenAPI** |
| 5 | Instrumentar flujos cross-tab (F4) de forma pasiva |
| 6 | Soportar matriz **PLATFORM_REFRESH_DIAGNOSTIC** con campos comparables en DEV |
| 7 | Preservar cuerpos F1–F7 y UX F7 intactos |
| 8 | Completar **H7** (~98 % §19 UX + observabilidad) |

### 1.3 Objetivo técnico formal

Introducir una capa **Session Telemetry & Observability (L8)** que:

1. **Consuma** outcomes y reasons ya resueltos (F5, F2, F4, F3, F6) **sin alterar** orquestadores congelados.
2. **Redacte** todo payload antes de sink (Redaction Policy obligatoria).
3. **Emita** eventos estructurados tipados hacia sink DEV MVP.
4. **Correlacione** eventos por `correlationId` + `tabId` + categoría dominio.
5. **Consolide** gradualmente `auth-debug` / `post-login-diag` detrás de flag F8.
6. **No influya** en decisiones refresh, terminación, probe, impersonación ni presentación UX.

### 1.4 Criterios de aceptación (enlace plan)

Escenarios obligatorios: **V8.1–V8.2** (`IAM_SESSION_ALIGNMENT_PLAN_V1.md` §8).

Regresión obligatoria: **V1.1–V1.4** + **V2.1–V2.6** + **V3.1–V3.4** + **V4.1–V4.5** + **V5.1–V5.5** + **V6.1–V6.4** + **V7.1–V7.3** + smoke Platform impersonate → ERP → exit.

---

## 2. Alcance

### 2.1 Dentro de alcance (MVP Fase 8)

| Área | Detalle |
|------|---------|
| Capa L8 telemetry | Types, redaction, taxonomía, emitter, sink DEV |
| Eventos refresh | Outcome F5 + metadata (source, attempts, httpStatus) |
| Eventos terminación | Reason F2 + category + origen caller |
| Eventos auth-sync | Tipo F4 + tabId + rol leader/follower |
| Eventos probe / impersonation | Señales pasivas post-flujo F3/F6 |
| Correlación V8.2 | Cadena refresh fail → classify → terminate |
| Consolidación logs legacy | `auth-debug`, `auth-session-snapshot`, `post-login-diag` detrás flag |
| PLATFORM_REFRESH_DIAGNOSTIC | Campos FE alineados a matriz runbook |
| Flags + rollback | Master + sub-flags; silencio total L1 |
| Tests | Unit policy/emitter + regresión V1–V8 |

### 2.2 Fuera de alcance (explícito)

| Tema | Fase / norma |
|------|----------------|
| Modificación lógica sesión F1–F6 | **Prohibido** |
| Modificación UX F7 (modal, gates, banners) | **Prohibido** — F7 congelada |
| Extracción AuthContext | Fase 9 |
| Sinks producción externos (Datadog, Sentry, OpenTelemetry export) | Post-MVP |
| Nuevos endpoints / OpenAPI | **Prohibido** |
| Pantallas, rutas, componentes UI | **Prohibido** |
| Mobile `X-Client-Type: mobile` | Ticket separado |
| Instancias API hybrid sin refresh (GAP-P2-07) | Ticket separado |
| Modificar cuerpos `terminateSession`, `executeRefreshWithResilience`, auth-sync F4 | **Prohibido** |

### 2.3 Dependencias duras

| Dependencia | Estado requerido |
|-------------|------------------|
| Fase 1 cerrada (SIGNOFF) | Puntos hydrate/bootstrap observables |
| Fase 5 cerrada (SIGNOFF) | `RefreshOutcome`, `RefreshOutcomeMetadata` |
| Fases 2, 3, 4, 6, 7 cerradas (SIGNOFF) | Regresión; sin modificar cuerpos |
| Fase 7 congelada | Sin solapamiento archivos UX |

---

## 3. Arquitectura propuesta L8

### 3.1 Principio de diseño: telemetría pasiva + policy pura + wiring delgado

| Capa | Nombre | Responsabilidad Fase 8 |
|------|--------|------------------------|
| **L8-A** | Telemetry types | Eventos, envelopes, sinks, contexto correlación |
| **L8-B** | Redaction policy | Sanitización obligatoria pre-sink |
| **L8-C** | Events policy | Taxonomía, mapeo BE semántico, reglas emisión |
| **L8-D** | Telemetry flags | Master + sub-flags; rollback |
| **L8-E** | Telemetry emitter | Orquestador puro: input → redact → sink |
| **L8-F** | DEV sink | Consola estructurada (`console` agrupado) — **único MVP** |
| **L8-G** | Auth wiring | Factories invocación desde AuthContext / interceptor |

**Regla central:** F8 **no decide** sesión — solo **registra** resultados ya producidos por F1–F7.

### 3.2 Diagrama arquitectura objetivo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ F1–F7 congelados — lógica sesión + UX (sin cambios de cuerpo)               │
│  refresh (F1/F5) · terminate (F2) · probe (F3) · auth-sync (F4)             │
│  impersonation (F6) · UX present (F7)                                        │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │ resultados / metadata (solo lectura)
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ L8-G — session-telemetry-auth-wiring (wiring mínimo)                         │
│  onRefreshOutcome · onTermination · onAuthSyncEvent · onProbe · onSnapshot   │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ L8-E — session-telemetry.emitter                                             │
│  buildSessionTelemetryEvent (L8-C) → applyRedaction (L8-B) → sink (L8-F)     │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ L8-F — DEV sink único MVP                                                    │
│  [SessionTelemetry] structured console (solo DEV + flag ON)                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Qué cambia vs Fase 7

| Elemento | Cambio Fase 8 |
|----------|---------------|
| Logs sesión | De ad hoc → **eventos estructurados** redactados |
| Refresh fail/success | Observable con outcome F5 en telemetría |
| Logout / terminate | Reason correlacionado (V8.2) |
| auth-debug / post-login-diag | Delegados o guardados detrás flag F8 |
| UX / modal / gates F7 | **Sin cambio** |
| F1–F7 session logic | **Sin cambio** de cuerpos |

### 3.4 Qué permanece congelado (Fases 1–7)

| Artefacto | Estado |
|-----------|--------|
| `terminateSession` / `classifySessionTermination` | **Cuerpos congelados** |
| `executeRefreshWithResilience` / retry F5 | **Cuerpos congelados** |
| Módulos auth-sync F4 (emit/apply/channel) | **Cuerpos congelados** |
| `SessionRemoteProbe` / F3 logout flows | **Cuerpos congelados** |
| Módulos F6 impersonation | **Congelados** |
| Módulos L7-A…L7-F (session UX) | **Congelados** |
| OpenAPI / contratos BE | **Sin modificaciones** |

---

## 4. Componentes nuevos

| Artefacto | Ubicación propuesta | Responsabilidad |
|-----------|---------------------|-----------------|
| `session-telemetry.flags.ts` | `src/core/auth/session/` | Flags Fase 8 |
| `session-telemetry.types.ts` | `src/core/auth/session/` | Tipos eventos, envelope, sink contract |
| `session-telemetry-redaction.policy.ts` | `src/core/auth/session/` | Redaction Policy (L8-B) |
| `session-telemetry-events.policy.ts` | `src/core/auth/session/` | Taxonomía + mapeo BE (L8-C) |
| `session-telemetry.emitter.ts` | `src/core/auth/session/` | Emitter puro (L8-E) |
| `session-telemetry.sink.dev.ts` | `src/core/auth/session/` | Sink consola DEV (L8-F) |
| `session-telemetry-auth-wiring.ts` | `src/core/auth/session/` | Factories wiring (L8-G) |
| `session-telemetry-correlation.ts` | `src/core/auth/session/` | `correlationId`, helpers tab-scoped |
| Tests | `src/core/auth/session/__tests__/` | Unit + integración emitter mock |
| `auth-phase-08-regression.test.ts` | `src/shared/context/__tests__/` | Regresión V8 + manifesto V1–V7 |

**Nota:** sin componentes React; sin rutas; sin archivos en `features/auth/pages/`.

---

## 5. Componentes reutilizados

### 5.1 Stack congelado (solo invocación / consumo)

| Contrato | Uso Fase 8 |
|----------|------------|
| `RefreshOutcome` / `RefreshOutcomeMetadata` (F5) | Payload evento `SESSION_REFRESH_*` |
| `SessionTerminationReason` / `TerminateSessionEventPayload` (F2) | Payload evento `SESSION_TERMINATED` |
| `AuthSyncEventType` / envelopes F4 | Payload evento `AUTH_SYNC_*` |
| `SessionClaimsSnapshot` (F4) | Metadata claims redactada |
| `buildAuthSessionSnapshot` | Fuente campos PLATFORM_REFRESH_DIAGNOSTIC |
| `resolveFailureRefreshOutcome` / `resolveSuccessRefreshOutcome` | **Sin modificar** — consumir salida |
| `auth-debug.ts` | Facade legacy → delegar a emitter F8 cuando flag ON |
| `post-login-diag-log.ts` | Migración gradual a eventos `NAV_GATE_*` |

### 5.2 Wiring permitido (L8-G)

| Pieza | Descripción |
|-------|-------------|
| Post-`executeRefreshWithResilience` | Emitir outcome metadata existente |
| `emitTerminationEvent` dep F2 | Extender wiring hacia emitter (cuerpo F2 intacto) |
| Post emit auth-sync F4 | Wrapper listener — **sin modificar emit/apply** |
| Post probe F3 / exit F6 | Callback pasivo post-orchestrator |
| Bootstrap F1 | Evento `SESSION_BOOTSTRAP_*` tras hydrate conocido |

**Prohibido:** alterar firmas `useAuth()`; modificar cuerpos F1–F7; añadir campos OpenAPI.

---

## 6. Política de redacción (Redaction Policy)

### 6.1 Reglas obligatorias (RED-01…RED-06)

| ID | Regla |
|----|-------|
| **RED-01** | **Prohibido** loguear access token completo — máximo **prefix 28 chars** |
| **RED-02** | **Prohibido** loguear refresh token (cookie HttpOnly) — campo omitido o `(redacted)` |
| **RED-03** | **Prohibido** passwords, `Authorization` header completo, cookies raw |
| **RED-04** | `detail` HTTP: truncar 512 chars; eliminar patrones que parezcan JWT |
| **RED-05** | PII mínima: preferir `user_type`, `subdomain`, flags booleanos vs emails |
| **RED-06** | **Ningún sink** recibe payload sin pasar `applySessionTelemetryRedaction()` |

### 6.2 Campos permitidos (whitelist orientativa)

| Campo | Tratamiento |
|-------|-------------|
| `refreshOutcome` | Permitido (enum F5) |
| `terminationReason` | Permitido (enum F2) |
| `httpStatus` | Permitido |
| `source` | `interceptor` \| `bootstrap` \| `probe` \| `manual` \| … |
| `tabId` / `correlationId` | Permitido (UUID tab interno) |
| `accessTokenPrefix` | Máx 28 chars |
| `jwtClienteMatchesSuperadmin` | Permitido (diagnóstico platform) |
| `attemptCount`, `backoffMsApplied` | Permitido |

### 6.3 Campos prohibidos (blacklist)

`accessToken`, `refresh_token`, `password`, `selection_token`, `Authorization`, `Set-Cookie` body, refresh cookie value, tokens en query string.

---

## 7. Taxonomía oficial de eventos de sesión

### 7.1 Categorías dominio

| Categoría | Prefijo evento | Origen |
|-----------|----------------|--------|
| **Refresh** | `SESSION_REFRESH_` | F5 (+ F1 post-hydrate) |
| **Termination** | `SESSION_TERMINATE_` | F2 |
| **Auth Sync** | `AUTH_SYNC_` | F4 |
| **Probe** | `SESSION_PROBE_` | F3 |
| **Impersonation** | `SESSION_IMPERSONATION_` | F6 |
| **Bootstrap** | `SESSION_BOOTSTRAP_` | F1 |
| **Diagnostic** | `SESSION_DIAG_` | PLATFORM_REFRESH, snapshot |
| **Navigation gate** | `NAV_GATE_` | Consolidación post-login-diag (opcional MVP) |

### 7.2 Eventos MVP (catálogo normativo)

| Evento FE | Cuándo | Campos clave (post-redacción) |
|-----------|--------|-------------------------------|
| `SESSION_REFRESH_SUCCESS` | Refresh OK | `outcome`, `source`, `singleFlightRole`, `accessTokenPrefix` |
| `SESSION_REFRESH_FAILURE` | Refresh fail final | `outcome`, `httpStatus`, `attemptCount`, `source` |
| `SESSION_TERMINATED` | Post `terminateSession` | `reason`, `category`, `caller`, `isSecurityTermination` |
| `AUTH_SYNC_EMITTED` | Post emit F4 | `type`, `tabId`, `eventId`, `refreshOutcome?` |
| `AUTH_SYNC_RECEIVED` | Post apply inbound F4 | `type`, `tabId`, `eventId` |
| `SESSION_PROBE_COMPLETED` | Post probe F3 | `result`, `skippedReason?` |
| `SESSION_IMPERSONATION_EXIT` | Post F6 orchestrator | `source`, `action` — **sin UX channel** |
| `SESSION_BOOTSTRAP_COMPLETED` | Post bootstrap F1 | `path`, `hydrateSkipped?` |
| `SESSION_DIAG_PLATFORM_REFRESH` | Login/refresh platform vs tenant | Campos matriz PLATFORM_REFRESH_DIAGNOSTIC |

### 7.3 Mapeo semántico BE (referencia — sin contrato nuevo)

| Evento FE | Evento auditoría BE (`IAM_SESSION_MANAGEMENT_V2.md` §5) |
|-----------|--------------------------------------------------------|
| `SESSION_REFRESH_SUCCESS` | `token_refresh` |
| `SESSION_REFRESH_FAILURE` (reuse) | `token_reuse_detected` / `token_invalid_or_revoked` |
| `SESSION_TERMINATED` (manual) | `logout` |
| `SESSION_TERMINATED` (logout all) | `logout_forced` |
| Login (fuera F8 MVP salvo diag) | `login_success` / `login_failed` |

Mapeo **informativo** para correlación manual DEV — FE no consume API auditoría.

---

## 8. Correlación Refresh, Termination, Auth Sync, Probe e Impersonation

### 8.1 Identificadores correlación

| Campo | Alcance | Generación |
|-------|---------|------------|
| `correlationId` | Ciclo sesión tab | UUID al login/bootstrap; persiste hasta terminate |
| `tabId` | Pestaña | Reutilizar `tabId` auth-sync F4 |
| `eventId` | Evento único | UUID por emisión |
| `parentEventId` | Cadena causal | Opcional — refresh fail → terminate |

### 8.2 Cadena V8.2 (logout reason)

```
executeRefreshWithResilience (F5)
  → SESSION_REFRESH_FAILURE { outcome, correlationId }
  → classifySessionTermination (F2) [sin modificar]
  → terminateSession (F2)
  → SESSION_TERMINATED { reason, caller: 'refresh_fail' }
  → [F7 UX present — sin telemetría UX duplicada]
```

| Origen lógico `caller` | Reason típico F2 |
|------------------------|------------------|
| `refresh_fail` | `REFRESH_UNAUTHORIZED`, `TOKEN_REUSE`, … |
| `manual_logout` | `MANUAL_LOGOUT` |
| `probe_remote` | `REFRESH_REVOKED`, `SESSION_EXPIRED` |
| `auth_sync_follower` | Mismo reason inbound F4 |
| `impersonation_exit` | `IMPERSONATION_END` |
| `bootstrap_fail` | `BOOTSTRAP_FAILED`, `HYDRATE_FAILED` |

### 8.3 Diagrama correlación multi-dominio

```
                    correlationId (tab session)
                              │
     ┌────────────────────────┼────────────────────────┐
     │                        │                        │
 SESSION_REFRESH_*    AUTH_SYNC_*              SESSION_PROBE_*
     │                        │                        │
     └───────────► SESSION_TERMINATED ◄─────────────────┘
                              │
                   SESSION_IMPERSONATION_* (F6 bypass F7 modal)
```

---

## 9. Integración con Phase-01

| Aspecto | Regla F8 |
|---------|----------|
| `hydrateSessionCore` / `applyPostRefreshSession` | **Cuerpos congelados** |
| Post-hydrate exitoso | Wiring: `SESSION_BOOTSTRAP_COMPLETED` / refresh success metadata |
| Bootstrap refresh fail | Wiring: cadena hacia F2 terminate — telemetría **post** terminate |
| `/auth/me` skip policy | Evento metadata `hydrateSkipped: true` — sin extra requests |

---

## 10. Integración con Phase-02

| Aspecto | Regla F8 |
|---------|----------|
| `terminateSession` cuerpo | **Sin modificación** |
| `emitTerminationEvent` dep | **Wiring F8** — emitter recibe `TerminateSessionEventPayload` |
| `SessionTerminationReason` | Campo canónico evento `SESSION_TERMINATED` |
| Perfiles UX F2 | **No loguear** copy toast/modal — solo reason + category |
| F7 presenter | Telemetría **no registra** canal UX (modal/toast) — evitar duplicar F7 |

---

## 11. Integración con Phase-03

| Aspecto | Regla F8 |
|---------|----------|
| `SessionRemoteProbe` cuerpo | **Sin modificación** |
| Post-probe | `SESSION_PROBE_COMPLETED` con result skip/terminate |
| Probe → terminate | Correlación V8.2 `caller: probe_remote` |
| `AUTH_SYNC_TERMINATION_PROBE_SKIP_MS` | Metadata `skippedReason` en evento |

---

## 12. Integración con Phase-04

| Aspecto | Regla F8 |
|---------|----------|
| emit/apply/channel cuerpos | **Congelados** |
| Post-emit | `AUTH_SYNC_EMITTED` — type, tabId, refreshOutcome opcional |
| Post-apply inbound | `AUTH_SYNC_RECEIVED` — follower context |
| `SESSION_TERMINATED` BC | Correlacionar terminate cross-tab |
| Anti-loop R1–R7 | Telemetría **no emite** BC — solo observa |

---

## 13. Integración con Phase-05

| Aspecto | Regla F8 |
|---------|----------|
| `executeRefreshWithResilience` cuerpo | **Sin modificación** |
| Post-resilience | Wiring emite `RefreshOutcomeMetadata` completo |
| Outcomes | Consumir enum F5 tal cual — no redefinir |
| Retry intermedios | **No emitir** eventos terminate — solo outcome **final** |
| Single-flight | Metadata `singleFlightRole` en evento |

---

## 14. Integración con Phase-06

| Aspecto | Regla F8 |
|---------|----------|
| Módulos F6 impersonation | **Congelados** |
| `IMPERSONATION_END` | Telemetría `SESSION_IMPERSONATION_EXIT` — **sin** canal UX |
| Controlled exit | Evento con `source` F6 (`interceptor`, `manual`, `bootstrap`, …) |
| IM-01…IM-08 | Preservados — F8 no altera políticas |

---

## 15. Integración con Phase-07

| Aspecto | Regla F8 |
|---------|----------|
| Módulos L7 congelados | **Prohibido modificar** |
| Session UX presenter | **Sin telemetría** de modal/banner/gate |
| Flags F7 | Ortogonales a `VITE_SESSION_TELEMETRY_V8_*` |
| Terminate wiring | F7 intercepta presentación; F8 observa **mismo** `emitTerminationEvent` / deps — orden: terminate → telemetry → present F7 |

---

## 16. Feature flags

### 16.1 Flags Fase 8

| Flag | Default diseño | Env | Alcance |
|------|----------------|-----|---------|
| `SESSION_TELEMETRY_V8_ENABLED` | `true` | `VITE_SESSION_TELEMETRY_V8_ENABLED` | Master — emitter + sinks |
| `SESSION_TELEMETRY_DEV_V8_ENABLED` | `true` | `VITE_SESSION_TELEMETRY_DEV_V8_ENABLED` | Sub — sink consola DEV |
| `SESSION_TELEMETRY_REFRESH_V8_ENABLED` | `true` | `VITE_SESSION_TELEMETRY_REFRESH_V8_ENABLED` | Sub — eventos refresh |
| `SESSION_TELEMETRY_TERMINATION_V8_ENABLED` | `true` | `VITE_SESSION_TELEMETRY_TERMINATION_V8_ENABLED` | Sub — terminación |
| `SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED` | `true` | `VITE_SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED` | Sub — cross-tab |

### 16.2 Ortogonalidad

Independientes de: F1–F7 flags, `VITE_SESSION_UX_V7_*`, `VITE_SESSION_TERMINATION_V2_*`, F4/F5/F6 flags.

### 16.3 Matriz combinada (producción objetivo)

| F1–F7 | F8 | Comportamiento |
|-------|-----|----------------|
| ON | ON | Telemetría DEV estructurada (MVP) |
| ON | OFF | Comportamiento post-F7; logs legacy silenciados o mínimos |
| OFF | ON | No aplicable — F8 requiere F1+F5 SIGNOFF |

---

## 17. Estrategia de rollback

| Nivel | Procedimiento | Efecto |
|-------|---------------|--------|
| L1 Runtime master | `VITE_SESSION_TELEMETRY_V8_ENABLED=false` | Silencio total telemetría F8 |
| L2 Runtime DEV sink | Sub-flag DEV OFF | Emitter activo sin consola (no-op sink) |
| L3 Runtime refresh | Sub-flag refresh OFF | Sin eventos refresh |
| L4 Runtime termination | Sub-flag termination OFF | Sin eventos terminate |
| L5 Código | Revert commits Fase 8 | Post-Phase-7 intacto |

**Criterio activación rollback:** regresión V1–V7, fuga datos post-redaction, overhead perceptible en DEV.

---

## 18. Riesgos

### 18.1 Arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación |
|--------|-------|-----------|------------|
| Fuga token/PII en sink | Media | **Alta** | RED-01…RED-06; tests redaction |
| Acoplar lógica a telemetría | Baja | Alta | Emitter puro; wiring side-effect only |
| Duplicar logs legacy + F8 | Alta | Baja | Consolidación IMPL-10; flag guard |
| Regresión F1–V7 | Baja | Alta | Regresión obligatoria; wiring mínimo |

### 18.2 Operativos

| Riesgo | Mitigación |
|--------|------------|
| Ruido DEV excesivo (GAP-P3-01 persiste) | Sub-flags; niveles evento |
| Correlación manual BE↔FE | Documentar mapeo §7.3; V8.2 playbook |

### 18.3 Seguridad

| Riesgo | Mitigación |
|--------|------------|
| Telemetría activa en build producción | Sink DEV gated: `import.meta.env.DEV` **y** flag |
| PLATFORM_REFRESH datos sensibles | Solo campos matriz runbook redactados |

---

## 19. Plan de implementación

| Orden | ID | Entregable | Depende de |
|-------|-----|------------|------------|
| 1 | IMPL-01 | `session-telemetry.flags.ts` | — |
| 2 | IMPL-02 | `session-telemetry.types.ts` | 1 |
| 3 | IMPL-03 | `session-telemetry-redaction.policy.ts` | 2 |
| 4 | IMPL-04 | `session-telemetry-events.policy.ts` | 2 |
| 5 | IMPL-05 | `session-telemetry-correlation.ts` | 2 |
| 6 | IMPL-06 | `session-telemetry.emitter.ts` | 3–5 |
| 7 | IMPL-07 | `session-telemetry.sink.dev.ts` | 6 |
| 8 | IMPL-08 | Wiring refresh F5 → emitter | 6–7 |
| 9 | IMPL-09 | Wiring termination F2 → emitter | 6–7 |
| 10 | IMPL-10 | Wiring auth-sync F4 + consolidación auth-debug | 6–7 |
| 11 | IMPL-11 | Wiring probe F3 + impersonation F6 + bootstrap F1 | 6–7 |
| 12 | IMPL-12 | PLATFORM_REFRESH_DIAGNOSTIC fields + snapshot | 3, 6 |
| 13 | IMPL-13 | Tests unit + `auth-phase-08-regression.test.ts` | 8–12 |
| 14 | IMPL-14 | Regresión V1–V8 completa | 13 |
| 15 | VALIDATION | Manual DEV V8.1–V8.2 + PLATFORM_REFRESH smoke | 14 |
| 16 | CLOSURE | Informe cierre + SignOff Fase 8 | VALIDATION |

---

## 20. Estrategia de validación

### 20.1 Escenarios V8.x (Alignment §8)

| ID | Escenario | Criterio éxito | Automatizado | Manual |
|----|-----------|----------------|--------------|--------|
| **V8.1** | DEV: eventos refresh logged sin token completo | Solo prefix/metadata; RED-01 verificado | Sí — redaction tests | **Requerido** smoke DEV |
| **V8.2** | Correlación logout reason | Cadena refresh fail → terminate con mismo `correlationId` | Sí — emitter mock | **Requerido** |

### 20.2 Regresión obligatoria

V1.1–V1.4 · V2.1–V2.6 · V3.1–V3.4 · V4.1–V4.5 · V5.1–V5.5 · V6.1–V6.4 · V7.1–V7.3 · smoke §8 Platform impersonate → ERP → exit.

### 20.3 Playbook manual V8.1

1. Login DEV → forzar refresh (F5) → inspeccionar consola `[SessionTelemetry]`.
2. Verificar: **sin** access token completo; `accessTokenPrefix` ≤ 28 chars.
3. Verificar: outcome F5 presente.

### 20.4 Playbook manual V8.2

1. Provocar refresh 401 → terminación.
2. Verificar: `SESSION_REFRESH_FAILURE` seguido de `SESSION_TERMINATED` con mismo `correlationId`.
3. Verificar: `reason` coherente con classify F2.

### 20.5 Playbook PLATFORM_REFRESH_DIAGNOSTIC

1. Login tenant vs platform (matriz runbook).
2. Verificar evento `SESSION_DIAG_PLATFORM_REFRESH` con campos comparables (`jwtClienteMatchesSuperadmin`, cookie notes).
3. F5 refresh — comparar status en evento vs Network.

### 20.6 Evidencia cierre

CI verde · regresión V1–V8 · manual V8.1/V8.2 · tabla GAPs §21.

---

## 21. GAPs cerrados al finalizar

| GAP | Verificación | Matriz Alignment |
|-----|--------------|------------------|
| **GAP-P3-01** | V8.1 + consolidación logs | Diagnóstico FE → **A** |
| **PLATFORM_REFRESH_DIAGNOSTIC** | IMPL-12 + playbook §20.5 | Soporte operativo → **A** |
| **H7 (componente observabilidad)** | F7 + F8 conjunto | ~98 % §19 |

**Fuera de cierre F8 (sin reclasificar):** GAP-P1-05 (F9), GAP-P2-02/03 (F9), GAP-P2-07, GAP-P3-04 mobile, sinks externos.

---

## 22. Criterios de aceptación

### 22.1 Escenarios obligatorios

| ID | Criterio |
|----|----------|
| V8.1 | Refresh events DEV sin token completo; redaction policy verificada |
| V8.2 | Correlación terminate reason con origen refresh/manual/probe/sync |
| V7 regresión | Sin regresión UX F7 |
| V6.4 regresión | Impersonación telemetría sin alterar toast-only |

### 22.2 Criterios técnicos de cierre

| Criterio | Requerido |
|----------|-----------|
| IMPL-01–14 completados | Sí |
| Regresión V1–V8 verde | Sí |
| Cuerpos F1–F7 sin modificación | Sí |
| RED-01…RED-06 preservados | Sí |
| OpenAPI sin cambios | Sí |
| Sin rutas/pantallas/componentes UX nuevos | Sí |
| Sink MVP solo DEV | Sí |
| Rollback flag verificado | Sí |

### 22.3 Criterios REJECTED

- Modificación cuerpo `terminateSession` / `executeRefreshWithResilience` / auth-sync F4
- Modificación módulos L7 F7
- Token completo en cualquier sink
- Sink producción externo en MVP
- Nuevo endpoint OpenAPI
- Telemetría que altere flujo sesión o UX
- Regresión V1–V7

---

## Declaraciones normativas finales

1. **F1–F7 permanecen congeladas.**
2. **La telemetría es completamente pasiva** y no modifica el flujo de sesión ni UX.
3. **OpenAPI permanece sin modificaciones** — sin endpoints ni campos nuevos.
4. **No se crean pantallas, rutas ni componentes UX.**
5. **Toda información sensible pasa por Redaction Policy** antes de sink.
6. **Sinks DEV son el único destino MVP** — Datadog/Sentry/etc. fuera de alcance.
7. **VALIDATION manual** pertenece al despliegue — no bloquea aprobación del diseño.
8. Fase 9 (AuthContext decomposition) **requiere** F8 cerrada previamente.

---

## Referencias cruzadas

| Documento | Sección |
|-----------|---------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 | §5 Fase 8, §8 V8.x, §10 H7 |
| `IAM_FE_PHASE_07_TECHNICAL_DESIGN.md` v1.0 | Fuera alcance UX; F7 congelada |
| `IAM_FE_PHASE_05_TECHNICAL_DESIGN.md` v1.1 | RefreshOutcome — fuente telemetría refresh |
| `IAM_SESSION_MANAGEMENT_V2.md` | §5 auditoría BE |
| `PLATFORM_REFRESH_DIAGNOSTIC.md` | Matriz diagnóstico platform vs tenant |

---

## Tickets derivados (plantilla)

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-08-DESIGN-01 | Este documento |
| IAM-FE-PHASE-08-OBSERVABILITY | Epic implementación |
| IAM-FE-PHASE-08-IMPL-* | Pasos 1–14 |
| IAM-FE-PHASE-08-VALIDATION | Paso 15 |
| IAM-FE-PHASE-08-CLOSURE-REPORT | Paso 16 |

---

**Fin del diseño IAM-FE-PHASE-08 — Session Telemetry & Observability**

PHASE-08 DESIGN COMPLETE
