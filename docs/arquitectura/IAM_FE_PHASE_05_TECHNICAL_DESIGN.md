# IAM-FE-PHASE-05 — Diseño Técnico: Refresh Resilience & Error Taxonomy

**Ticket diseño:** IAM-FE-PHASE-05-DESIGN-01  
**Ticket implementación:** IAM-FE-PHASE-05-REFRESH-RESILIENCE  
**Versión:** 1.1  
**Estado:** IMPLEMENTADO — IAM-FE-PHASE-05-IMPLEMENTATION-01  
**Fecha diseño:** 2026-06-19  
**Fecha implementación:** 2026-06-19  
**Referencias normativas:**
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 — Fase 5, §8 V5.x, GAP-P1-01, GAP-P1-06, GAP-P2-01, GAP-P1-08
- `docs/arquitectura/IAM_FE_PHASE_04_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_03_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` — terminación, clasificación TOKEN_REUSE
- `docs/arquitectura/IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` — hydrate post-refresh
- `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` — interceptor, refresh
- `IAM_SESSION_MANAGEMENT_V2.md` — §5 outcomes, §13 TOKEN_REUSE, §18 L-02, §19 Reintentos
- Informes: IAM-FE-PHASE-04-SIGNOFF-01 · IAM-FE-PHASE-04-CLOSURE-REPORT-01

> Este documento define **cómo** se implementó la Fase 5 (v1.1 alineado a código).  
> Las Fases 1–4 quedan **congeladas** salvo wiring mínimo en `AuthContext` e extensión opcional `refreshOutcome` en payload F4.

---

## Índice

1. [Objetivos](#1-objetivos)
2. [Alcance](#2-alcance)
3. [Arquitectura propuesta](#3-arquitectura-propuesta)
4. [Componentes nuevos](#4-componentes-nuevos)
5. [Componentes reutilizados](#5-componentes-reutilizados)
6. [Taxonomía Refresh Outcomes](#6-taxonomía-refresh-outcomes)
7. [Política de reintentos y errores HTTP](#7-política-de-reintentos-y-errores-http)
8. [Estrategia TOKEN_REUSE y ALREADY_ROTATED](#8-estrategia-token_reuse-y-already_rotated)
9. [Estrategia L-02 cambio empresa concurrente](#9-estrategia-l-02-cambio-empresa-concurrente)
10. [Integración con Phase-04 (auth-sync)](#10-integración-con-phase-04-auth-sync)
11. [Integración con Phase-03 (SessionRemoteProbe)](#11-integración-con-phase-03-sessionremoteprobe)
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

Tras SIGNOFF Phase-04, la sincronización cross-tab estabiliza el access token entre pestañas, pero el **interceptor de refresh** mantiene comportamiento **fail-fast** ante fallos transitorios y **opaco** respecto a outcomes backend:

| Contexto | Comportamiento post-Fase 4 | Impacto |
|----------|---------------------------|---------|
| Refresh HTTP 500 transitorio | Terminación inmediata vía F2 | Logout innecesario en fallos infra |
| HTTP 429 (rate limit) | Sin handler dedicado | Tormenta de refresh o UX silenciosa |
| Outcome `ALREADY_ROTATED` (F5) | Usa `access_token`; no modelado | Debugging limitado; política ad hoc |
| `TOKEN_REUSE` vs 401 genérico | F2 clasifica parcialmente | Riesgo UX incorrecta en edge cases |
| L-02 cambiar empresa concurrente | Sin guard post-`cambiarEmpresa` | 401 en refresh posterior sin estrategia |

**GAPs principales:** **GAP-P1-01**, **GAP-P1-06**, **GAP-P2-01**, **GAP-P1-08** (Alignment §3, §5 Fase 5).

### 1.2 Objetivos funcionales (ticket)

| # | Objetivo |
|---|----------|
| 1 | Cerrar **GAP-P1-01** — retry controlado refresh HTTP 500 (máx. 1 + backoff, §19 BE) |
| 2 | Cerrar **GAP-P1-06** — manejo HTTP 429 con backoff / anti-tormenta |
| 3 | Cerrar **GAP-P2-01** — taxonomía formal Refresh Outcomes (`ROTATED`, `ALREADY_ROTATED`, etc.) |
| 4 | Cerrar **GAP-P1-08** — estrategia FE post-`cambiarEmpresa` cuando BE retorna ALREADY_ROTATED (L-02) |
| 5 | Refinar clasificación **TOKEN_REUSE** sin alterar contrato F2 |
| 6 | Coordinar resiliencia con **auth-sync** Phase-04 (leader/follower) |
| 7 | Mantener **SessionRemoteProbe**, **terminateSession**, **applyPostRefreshSession** congelados |
| 8 | **Sin** modificar contratos backend ni OpenAPI |

### 1.3 Objetivo técnico formal

Introducir una capa **Refresh Resilience & Error Taxonomy** que:

1. **Envuelva** la llamada refresh existente (`authService.refreshToken`) con política de reintentos declarativa.
2. **Modele** outcomes refresh como tipos FE explícitos (derivados de HTTP + contexto single-flight, sin inventar campos API).
3. **Aplique** guard L-02 tras `cambiarEmpresaActiva` para el siguiente ciclo refresh.
4. **Preserve** single-flight global (`isRefreshingPromise`) y cola 401 existente.
5. **Propague** refresh OK enriquecido a F1 hydrate y F4 `SESSION_REFRESHED` sin cambiar sus contratos.
6. **Delegue** terminación fallida definitiva a F2 (`terminateSession` / `classifySessionTermination`).

### 1.4 Criterios de aceptación (enlace plan)

Escenarios obligatorios: **V5.1–V5.5** (`IAM_SESSION_ALIGNMENT_PLAN_V1.md` §8).

Regresión obligatoria: **V1.1–V1.4** + **V2.1–V2.6** + **V3.1–V3.4** + **V4.1–V4.5**.

---

## 2. Alcance

### 2.1 Dentro de alcance (MVP Fase 5)

| Área | Detalle |
|------|---------|
| Retry refresh 500 | Máx. **1** reintento con backoff configurable; luego terminación §19 |
| Handler 429 refresh | Backoff; respeto `Retry-After` si presente; anti-tormenta dentro de single-flight |
| Refresh Outcomes | Tipos FE + resolver contextual; observabilidad DEV |
| TOKEN_REUSE | Refinar inputs a `classifySessionTermination` (sin cambiar cuerpo F2) |
| L-02 cambiar empresa | Guard de estado post-`cambiarEmpresa`; estrategia 401 siguiente refresh |
| Coordinación F4 | Leader emite post-retry OK; follower no duplica retry HTTP |
| Flags | Master + sub-flags; rollback runtime |
| Tests | Unit policy + integración interceptor mock + regresión V1–V4 |

### 2.2 Fuera de alcance (fases posteriores)

| Tema | Fase responsable |
|------|------------------|
| Impersonación 403 refresh (GAP-P1-02) | Fase 6 |
| Observabilidad estructurada cross-tab / telemetría | Fase 8 |
| Refactor `AuthContext` | Fase 9 |
| Handler 429 global no-auth (API ERP genérica) | Ticket separado / Fase 8 |
| Mobile `X-Client-Type: mobile` | Ticket separado |
| Exponer `refresh_outcome` en OpenAPI | Prohibido — BE congelado |
| Modificar cuerpo `terminateSession` / `hydrateSessionCore` | Prohibido |
| Modificar cuerpo módulos Phase-4 auth-sync | Prohibido |
| Instancias API locales sin refresh (GAP-P2-07) | Ticket hybrid/on-premise |

### 2.3 Dependencias duras

| Dependencia | Estado requerido |
|-------------|------------------|
| Fase 1 cerrada (SIGNOFF) | `applyPostRefreshSession` / `hydrateSessionCore` |
| Fase 2 cerrada (SIGNOFF) | `terminateSession`, `classifySessionTermination` |
| Fase 3 cerrada (SIGNOFF) | `SessionRemoteProbe` |
| Fase 4 cerrada (SIGNOFF) | `auth-sync`, `SESSION_REFRESHED` emit |
| Contrato BE §19 | Production Ready — sin cambios |

---

## 3. Arquitectura propuesta

### 3.1 Principio de diseño: política pura + orquestador delgado

| Capa | Nombre | Responsabilidad Fase 5 |
|------|--------|------------------------|
| **L5-A** | Outcome taxonomy | Tipos, enums, metadata refresh |
| **L5-B** | Retry policy | Decisión pura: reintentar / abortar / backoff ms |
| **L5-C** | Outcome resolver | Derivar outcome desde HTTP + contexto single-flight |
| **L5-D** | Refresh resilience orchestrator | Ejecutar refresh con retry; sin React |
| **L5-E** | L-02 guard | Estado post-cambiarEmpresa; hints siguiente refresh |
| **L5-F** | AuthContext wiring | Sustituir llamada directa refresh en interceptor/bootstrap |

**Regla central:** la **pestaña líder** del single-flight ejecuta retries HTTP; las **seguidoras en cola** esperan el resultado del líder — **nunca** duplican POST `/auth/refresh/`. Tras éxito, F1 hydrate y F4 emit permanecen idénticos.

### 3.2 Diagrama arquitectura objetivo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AuthContext — interceptor 401 / bootstrap                                    │
│  ├─ single-flight isRefreshingPromise (CONGELADO)                            │
│  ├─ [F5] executeRefreshWithResilience()                                     │
│  │      ├─ policy 500 → 1× retry backoff                                   │
│  │      ├─ policy 429 → backoff / Retry-After                                │
│  │      ├─ resolveRefreshOutcome(context)                                    │
│  │      └─ on fail → classifySessionTermination → F2 terminate               │
│  ├─ [F1] applyPostRefreshSession (sin cambio cuerpo)                         │
│  └─ [F4] emit SESSION_REFRESHED (sin cambio cuerpo)                          │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
              authService.refreshToken (HTTP — sin cambio contrato)
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ Backend POST /auth/refresh/ — ROTATED | ALREADY_ROTATED | 401 | 500 | 429   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Qué cambia vs Fase 4

| Elemento | Cambio Fase 5 |
|----------|---------------|
| Interceptor refresh path | Envuelve refresh con resiliencia + outcome |
| Bootstrap refresh path | Misma envoltura |
| `authService.refreshToken` | Sin cambio firma; opcional metadata interna |
| `classifySessionTermination` inputs | Enriquecimiento contexto L-02 / TOKEN_REUSE |
| `SESSION_REFRESHED` payload | Opcional campo `refreshOutcome` en envelope (extensión backward-compatible v1) |
| SessionRemoteProbe | Sin cambio cuerpo |

### 3.4 Qué permanece congelado (Fases 1–4)

Ver §5.2 — mismos artefactos Phase-04 §5.2 más módulos F1–F3 listados en Phase-03 §1.6.

---

## 4. Componentes nuevos

| Artefacto | Ubicación propuesta | Responsabilidad |
|-----------|---------------------|-----------------|
| `session-refresh-resilience.flags.ts` | `src/core/auth/session/` | Flags Fase 5 |
| `session-refresh-outcome.types.ts` | `src/core/auth/session/` | Taxonomía outcomes + metadata |
| `session-refresh-retry.policy.ts` | `src/core/auth/session/` | Política 500/429 pura |
| `session-refresh-outcome.resolver.ts` | `src/core/auth/session/` | Resolver outcome contextual |
| `session-refresh-resilience.ts` | `src/core/auth/session/` | `executeRefreshWithResilience` orquestador |
| `session-cambiar-empresa-l02.ts` | `src/core/auth/session/` | Guard L-02 post-cambiarEmpresa |
| Tests | `src/core/auth/session/__tests__/` | Unit + interceptor integration mocks |

**Nota normativa:** no se crean nuevos endpoints ni se altera el body de respuesta refresh consumido por el FE. La taxonomía es **derivada**, no contractual con BE.

---

## 5. Componentes reutilizados

### 5.1 Stack congelado (solo invocación)

| Contrato | Uso Fase 5 |
|----------|------------|
| `authService.refreshToken()` | Única llamada HTTP refresh |
| `applyPostRefreshSession` / `hydrateSessionCore` | Post-refresh OK sin cambio |
| `terminateSession` / `runSessionTerminationExit` | Fallo definitivo |
| `classifySessionTermination` | Entrada enriquecida; cuerpo congelado |
| `buildSessionClaimsSnapshot` | Pre-retry snapshot F1 |
| `emitSessionRefreshedSync` / `emitAuthSyncSessionToken` | Post-OK F4 |
| `SessionRemoteProbe` | Complementario — sin cambio |
| `isRefreshingPromise` + `failedQueueRef` | Single-flight congelado |
| Flags F1–F4 | Ortogonales |

### 5.2 AuthContext (wiring permitido)

| Pieza | Descripción |
|-------|-------------|
| Sustituir `authService.refreshToken()` directo | Por `executeRefreshWithResilience` en interceptor y bootstrap |
| Pasar contexto L-02 | Tras `cambiarEmpresaActiva` → registrar guard |
| Enriquecer classify input | Outcome + L-02 hint en refresh fail |
| Extensión opcional envelope F4 | `refreshOutcome` en payload `SESSION_REFRESHED` |

**Prohibido:** alterar firmas públicas `useAuth()`; modificar cuerpos congelados F1–F4.

---

## 6. Taxonomía Refresh Outcomes

### 6.1 Tipos FE (GAP-P2-01)

| Outcome | Origen | Semántica FE | Acción |
|---------|--------|--------------|--------|
| `ROTATED` | 200 + contexto líder single-flight | Rotación completa; cookie puede actualizarse (web) | Aplicar access; F1 hydrate; F4 emit |
| `ALREADY_ROTATED` | 200 + contexto perdedor F5 / heurística | Access nuevo; refresh cookie **sin cambio** (web) | Aplicar access; **prohibido** segundo refresh inmediato |
| `REFRESH_FAILED_401` | 401 refresh | Sesión inválida / expirada / revocada | F2 classify → terminate |
| `REFRESH_FAILED_TOKEN_REUSE` | 401 + señales seguridad BE | Reuse malicioso | F2 `TOKEN_REUSE` profile |
| `REFRESH_FAILED_403` | 403 refresh | Impersonación u otro — **delegar Fase 6** | F2 o reject según contexto actual |
| `REFRESH_FAILED_500_EXHAUSTED` | 500 tras retry agotado | Infra persistente | F2 terminate §19 |
| `REFRESH_FAILED_429_EXHAUSTED` | 429 tras backoff agotado | Rate limit | F2 terminate o defer según política |
| `REFRESH_UNKNOWN` | Respuesta no clasificada | Fallback conservador | F2 terminate |

### 6.2 Resolución sin campo API

El contrato OpenAPI actual expone `access_token` en 200. **No se inventará** campo `refresh_outcome` en request/response.

El resolver usará:

| Señal | Peso |
|-------|------|
| HTTP status | Primario |
| Rol single-flight (líder vs cola) | Derivación ALREADY_ROTATED en F5 |
| Presencia/ausencia Set-Cookie (solo observación DEV) | Heurística secundaria web |
| Contexto post-`cambiarEmpresa` L-02 | Hint guard |
| Body `detail` / mensaje BE | TOKEN_REUSE vs expired |

### 6.3 Metadata outcome (observabilidad)

Estructura interna (no expuesta en UI):

| Campo | Descripción |
|-------|-------------|
| `outcome` | Enum §6.1 |
| `httpStatus` | Status última respuesta |
| `attemptCount` | 1 + retries |
| `backoffMsApplied` | Total espera |
| `source` | `interceptor` \| `bootstrap` |
| `l02GuardActive` | Boolean post-cambiarEmpresa |

---

## 7. Política de reintentos y errores HTTP

### 7.1 HTTP 500 — GAP-P1-01 (§19 BE)

| Regla | Valor diseño |
|-------|--------------|
| Máximo retries | **1** |
| Backoff inicial | **500 ms** (configurable flag) |
| Jitter | ±10 % opcional |
| Scope | Solo `POST /auth/refresh/` |
| Post-retry fail | Terminación F2 — no bucle |
| Single-flight | Retries **dentro** de la promesa líder |

### 7.2 HTTP 429 — GAP-P1-06

| Regla | Valor diseño |
|-------|--------------|
| Header `Retry-After` | Prioridad si presente (segundos o HTTP-date) |
| Backoff default | **1000 ms** (configurable) |
| Máximo retries refresh | **1** (MVP — evitar tormenta) |
| API ERP 429 (no refresh) | **Fuera MVP** — no interceptar globalmente en F5 |
| UX | Toast informativo opcional sub-flag; terminación si agotado |
| Coordination F4 | Follower **no** reintenta — espera líder |

### 7.3 Invariantes anti-tormenta

| ID | Regla |
|----|-------|
| **RT-01** | Un solo refresh HTTP activo por pestaña (single-flight existente) |
| **RT-02** | Retries no liberan cola hasta resultado final |
| **RT-03** | 401 refresh → **cero** retries |
| **RT-04** | ALREADY_ROTATED → **cero** refresh inmediato adicional |
| **RT-05** | Probe V3 no dispara refresh directo — usa `/auth/me` |

---

## 8. Estrategia TOKEN_REUSE y ALREADY_ROTATED

### 8.1 TOKEN_REUSE (§13 BE, §19 FE)

| Aspecto | Decisión Fase 5 |
|---------|-----------------|
| Detección | `classifySessionTermination` enriquecido con `detail` BE + URL refresh |
| Perfil UX | Existente F2 `TOKEN_REUSE` — sin cambio cuerpo |
| Falso positivo F5 | BE `suppress_session_rotated_reuse` — outcome ALREADY_ROTATED, **no** TOKEN_REUSE |
| Cross-tab | F4 propaga `SESSION_TERMINATED` con reason correcto |
| Probe | Complementario post-terminación |

### 8.2 ALREADY_ROTATED en refresh (§19, §16 F5)

| Aspecto | Decisión Fase 5 |
|---------|-----------------|
| Tratamiento 200 | Usar `access_token`; F1 hydrate; F4 emit |
| Prohibición | No encadenar segundo `POST /auth/refresh/` inmediato |
| L-09 perdedor F5 | Access temporal hasta exp TTL — documentado; F4 mitiga multi-tab |
| Observabilidad | Outcome tipado en metadata DEV |

---

## 9. Estrategia L-02 cambio empresa concurrente

### 9.1 Problema (BE L-02)

En `POST /auth/empresa/cambiar/`, outcome `ALREADY_ROTATED` retorna 200 con refresh JWT en cookie **sin persistir en BD**. El siguiente `POST /auth/refresh/` puede responder **401**.

### 9.2 Guard FE propuesto (GAP-P1-08)

| Paso | Acción |
|------|--------|
| 1 | Tras `cambiarEmpresaActiva` OK → registrar `CambiarEmpresaL02Guard` (timestamp, empresa destino) |
| 2 | Heurística: si cambiar concurrente (F5) → marcar `outcomeHint: ALREADY_ROTATED_L02` |
| 3 | Próximo refresh 401 con guard activo → classify **`SESSION_EXPIRED`** / re-login — **no** TOKEN_REUSE |
| 4 | Guard TTL | **60 s** o hasta refresh OK — lo que ocurra primero |
| 5 | Clear guard | Refresh OK o terminate exitoso |
| 6 | F4 coord | `EMPRESA_CHANGED` BC sincroniza follower; guard local por pestaña |

### 9.3 Flujo documentado usuario

```
cambiarEmpresa OK (posible L-02)
    → operar con nuevo access
    → si refresh posterior 401 dentro ventana L-02
        → mensaje §19 session expired
        → redirect login (F2)
        → NO interpretar como TOKEN_REUSE
```

---

## 10. Integración con Phase-04 (auth-sync)

| Aspecto | Regla Fase 5 |
|---------|--------------|
| Leader tab | Ejecuta retries; emite `SESSION_REFRESHED` solo tras éxito final |
| Follower tab | Recibe BC; **no** ejecuta retry HTTP propio |
| REFRESHED debounce F4 | Compatible — un emit por refresh resuelto |
| V4.4 F5 + retry | Leader gana; follower abort refresh local (F4 existente) + aplica token |
| Envelope extensión | Payload opcional `refreshOutcome` — consumidores ignoran si ausente |
| Módulos F4 | **Cuerpos congelados** — solo extensión payload opcional backward-compatible |

---

## 11. Integración con Phase-03 (SessionRemoteProbe)

| Aspecto | Regla Fase 5 |
|---------|--------------|
| Rol probe | Red de seguridad — sin cambio |
| Refresh retry | Probe **no** activa refresh; usa `/auth/me` |
| Post-BC skip | Mantener IMPL-12 F4 (10 s) |
| Post-revoke | Terminate vía F2; sin interacción retry |
| Throttle | `minIntervalMs` 5 s sin cambio |

---

## 12. Integración multiempresa y multitenant

| Dimensión | Regla Fase 5 |
|-----------|--------------|
| **Multiempresa JWT** | Refresh outcomes no alteran `scopeEmpresaId`; F1 hydrate post-OK |
| **cambiarEmpresa** | L-02 guard acoplado a `cambiarEmpresaActiva` |
| **Tenant** | `cliente_id` en JWT refresh — sin selector local (ME-02) |
| **tenant-sync** | Ortogonal — canal separado |
| **Invalidación RQ** | Post-cambiarEmpresa existente; sin cambio F5 |

---

## 13. Feature flags

### 13.1 Flags Fase 5

| Flag | Default diseño | Env | Alcance |
|------|----------------|-----|---------|
| `SESSION_REFRESH_RESILIENCE_V5_ENABLED` | `true` | `VITE_SESSION_REFRESH_RESILIENCE_V5_ENABLED` | Master — orquestador + outcomes |
| `SESSION_REFRESH_RETRY_500_V5_ENABLED` | `true` | `VITE_SESSION_REFRESH_RETRY_500_V5_ENABLED` | Sub — retry 500 |
| `SESSION_REFRESH_RETRY_429_V5_ENABLED` | `true` | `VITE_SESSION_REFRESH_RETRY_429_V5_ENABLED` | Sub — handler 429 |
| `SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED` | `true` | `VITE_SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED` | Sub — guard L-02 |

### 13.2 Ortogonalidad

Independientes de: `REFRESH_HYDRATE_ENABLED`, `SESSION_TERMINATION_V2_ENABLED`, `SESSION_LOGOUT_V3_*`, `SESSION_AUTH_SYNC_V4_*`.

### 13.3 Matriz combinada (producción objetivo)

| F1 | F2 | F3 | F4 | F5 | Comportamiento |
|----|----|----|----|-----|----------------|
| ON | ON | ON | ON | ON | **Objetivo producción** |
| ON | ON | ON | ON | OFF | Phase-4 + fail-fast refresh legacy |
| ON | ON | ON | OFF | ON | Resiliencia sin cross-tab |
| ON | ON | OFF | * | ON | Sin logout all UI; resiliencia activa |

---

## 14. Estrategia de rollback

| Nivel | Procedimiento | Efecto |
|-------|---------------|--------|
| L1 Runtime master | `VITE_SESSION_REFRESH_RESILIENCE_V5_ENABLED=false` | Refresh directo fail-fast (Phase-4 behavior) |
| L2 Runtime retry 500 | Sub-flag 500 OFF | Sin retry 500; resto outcomes |
| L3 Runtime 429 | Sub-flag 429 OFF | Sin handler 429 dedicado |
| L4 Runtime L-02 | Sub-flag L02 OFF | GAP-P1-08 abierto; resto activo |
| L5 Código | Revert commits Fase 5 | Post-Phase-4 intacto |

**Criterio activación rollback:** loops retry, regresión V1–V4, amplificación carga BE 500/429.

---

## 15. Riesgos

### 15.1 Arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación |
|--------|-------|-----------|------------|
| Retry amplifica carga BE en incidente | Media | Alta | Máx. 1 retry; backoff; flags OFF |
| Race retry + F4 BC | Media | Alta | Retries solo en líder single-flight |
| Outcome mal derivado sin campo API | Media | Media | Tests resolver; default conservador |
| L-02 guard TTL incorrecto | Baja | Media | TTL 60 s; telemetría DEV |
| Regresión F1 hydrate post-retry | Media | Alta | Regresión V1 obligatoria |

### 15.2 Operativos

| Riesgo | Mitigación |
|--------|------------|
| Despliegue F5 sin F1–F4 | Orden roadmap; guards deps |
| 429 Retry-After mal parseado | Fallback backoff fijo |
| On-premise API local sin refresh | Documentado fuera MVP (GAP-P2-07) |

### 15.3 BE (limitaciones existentes)

| Limitación | Mitigación F5 |
|------------|---------------|
| L-02 ALREADY_ROTATED cambiar empresa | Guard + estrategia re-login §9 |
| L-09 perdedor F5 access temporal | Outcome tipado; F4 sync |
| L-01 cliente_id divergencia multi | Terminación limpia; no retry |

---

## 16. Plan de implementación

| Orden | ID | Entregable | Depende de |
|-------|-----|------------|------------|
| 1 | IMPL-01 | `session-refresh-resilience.flags.ts` | — |
| 2 | IMPL-02 | `session-refresh-outcome.types.ts` | 1 |
| 3 | IMPL-03 | `session-refresh-retry.policy.ts` — 500/429 puro | 2 |
| 4 | IMPL-04 | `session-refresh-outcome.resolver.ts` | 2 |
| 5 | IMPL-05 | `session-refresh-resilience.ts` — orquestador | 3, 4 |
| 6 | IMPL-06 | `session-cambiar-empresa-l02.ts` — guard L-02 | 2 |
| 7 | IMPL-07 | Wire interceptor refresh → resilience | 5, 6 |
| 8 | IMPL-08 | Wire bootstrap refresh → resilience | 5, 6 |
| 9 | IMPL-09 | Enriquecer classify termination inputs (TOKEN_REUSE / L-02) | 4, 6 |
| 10 | IMPL-10 | Extensión opcional payload F4 `refreshOutcome` | 4, 7 |
| 11 | IMPL-11 | Tests unit policy + resolver | 3–6 |
| 12 | IMPL-12 | Tests integración interceptor + bootstrap mock | 7, 8 |
| 13 | IMPL-13 | Regresión V1–V4 + escenarios V5 | 11, 12 |
| 14 | IMPL-14 | Documentación Phase-05 + Alignment patch (ticket doc) | 13 |
| 15 | VALIDATION | Manual staging V5.1–V5.5 | 13 |
| 16 | CLOSURE | Informe cierre Fase 5 | VALIDATION |

---

## 17. Estrategia de validación

### 17.1 Escenarios V5.x (Alignment §8)

| ID | Escenario | Criterio éxito | Automatizado | Manual |
|----|-----------|----------------|--------------|--------|
| **V5.1** | Refresh 500 transitorio | 1 retry backoff; éxito o terminación §19 | Sí — mock HTTP | Smoke |
| **V5.2** | Refresh 500 persistente | Terminación tras retry agotado | Sí — mock HTTP | Smoke |
| **V5.3** | HTTP 429 en refresh | Backoff; sin tormenta; feedback o terminate | Parcial — mock | **Requerido** |
| **V5.4** | Cambiar empresa concurrente L-02 | Comportamiento documentado §9; no estado corrupto | Parcial | **Requerido** |
| **V5.5** | Outcome ALREADY_ROTATED refresh | Access usable; sin segundo refresh inmediato | Sí — resolver | Smoke |

### 17.2 Regresión obligatoria

V1.1–V1.4 · V2.1–V2.6 · V3.1–V3.4 · V4.1–V4.5 · smoke §8 Alignment.

### 17.3 Playbook manual V5.3

1. Simular 429 en refresh (staging throttle o mock proxy).
2. Verificar una sola cadena retry por pestaña.
3. Verificar ausencia de tormenta multi-request.
4. Verificar UX feedback o terminación limpia.

### 17.4 Playbook manual V5.4

1. Dos pestañas autenticadas mismo usuario.
2. Cambiar empresa concurrente en A y B.
3. Operar ERP; forzar refresh posterior.
4. Verificar: re-login limpio si 401 L-02; **no** TOKEN_REUSE espurio.

### 17.5 Evidencia cierre

CI verde · regresión V1–V4 · nota operativa V5.3/V5.4 · tabla GAPs §18.

---

## 18. GAPs cerrados al finalizar

| GAP | Verificación | Matriz Alignment |
|-----|--------------|------------------|
| **GAP-P1-01** | V5.1, V5.2 | Fila 18 → **A** |
| **GAP-P1-06** | V5.3 | Fila 41 → **A** o **P** aceptable |
| **GAP-P2-01** | V5.5 | Fila 13 → **A** |
| **GAP-P1-08** | V5.4 | Fila 30 → **A** |

**Hito:** H5 — Resiliencia producción (~94 % §19 estimado).

**Fuera de cierre F5 (sin reclasificar):** GAP-P1-02 (Fase 6), GAP-P2-07, GAP-P0-04 residual, etc.

---

## 19. Criterios de aceptación

### 19.1 Escenarios obligatorios

| ID | Criterio |
|----|----------|
| V5.1 | 500 transitorio → 1 retry → éxito o terminate |
| V5.2 | 500 persistente → terminate §19 |
| V5.3 | 429 → backoff controlado; sin tormenta |
| V5.4 | L-02 cambiar empresa → estrategia documentada; no corrupt state |
| V5.5 | ALREADY_ROTATED → access OK; no refresh encadenado |

### 19.2 Criterios técnicos de cierre

| Criterio | Requerido |
|----------|-----------|
| IMPL-01–13 completados | Sí |
| Regresión V1–V4 verde | Sí |
| Contratos F1–F4 sin modificación cuerpo | Sí |
| Máx. 1 retry 500 refresh (§19 BE) | Sí |
| Single-flight preservado | Sí |
| Follower F4 no duplica retry HTTP | Sí |
| SessionRemoteProbe operativo | Sí |
| Rollback flag verificado | Sí |
| Documentación Phase-05 + Alignment | Sí (IMPL-14) |

### 19.3 Criterios REJECTED

- Retry loop observado en staging
- Regresión V1, V2, V3 o V4
- Más de 1 retry 500 por refresh
- Follower ejecuta POST refresh por evento BC
- Modificación contrato OpenAPI refresh
- Alteración cuerpo `terminateSession` / `hydrateSessionCore` / módulos F4

---

## Referencias cruzadas

| Documento | Sección |
|-----------|---------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 | §5 Fase 5, §8 V5.x, §6 deps, §9 riesgos |
| `IAM_FE_PHASE_04_TECHNICAL_DESIGN.md` v1.1 | §6.4 F5 concurrente, §7.1 probe |
| `IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` | §5.3 ROTATED vs ALREADY_ROTATED |
| `IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` | classify, TOKEN_REUSE |
| `IAM_SESSION_MANAGEMENT_V2.md` | §19 Reintentos, §18 L-02, §13 TOKEN_REUSE |

---

## Tickets derivados (plantilla)

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-05-DESIGN-01 | Este documento |
| IAM-FE-PHASE-05-REFRESH-RESILIENCE | Epic implementación |
| IAM-FE-PHASE-05-IMPL-* | Pasos 1–14 |
| IAM-FE-PHASE-05-VALIDATION | Paso 15 |
| IAM-FE-PHASE-05-CLOSURE-REPORT | Paso 16 |

---

**Fin del diseño IAM-FE-PHASE-05 — Refresh Resilience & Error Taxonomy**

PHASE-05 DESIGN COMPLETE · v1.1 IMPLEMENTADO

### Registro implementación (IMPL-14)

| IMPL | Estado | Artefacto |
|------|--------|-----------|
| IMPL-01 | ✅ | `session-refresh-resilience.flags.ts` |
| IMPL-02 | ✅ | `session-refresh-outcome.types.ts` |
| IMPL-03 | ✅ | `session-refresh-retry.policy.ts` |
| IMPL-04 | ✅ | `session-refresh-outcome.resolver.ts` |
| IMPL-05 | ✅ | `session-refresh-resilience.ts` |
| IMPL-06 | ✅ | `session-cambiar-empresa-l02.ts` |
| IMPL-07 | ✅ | Wire interceptor → `executeRefreshWithResilience` |
| IMPL-08 | ✅ | Wire bootstrap → `executeRefreshWithResilience` |
| IMPL-09 | ✅ | L-02 enrich + clear guard en terminate |
| IMPL-10 | ✅ | `refreshOutcome?` en `AuthSyncSessionRefreshedPayload` |
| IMPL-11 | ✅ | Tests unit policy + resolver + L-02 + flags |
| IMPL-12 | ✅ | Tests integración `session-refresh-resilience.test.ts` |
| IMPL-13 | ✅ | `auth-phase-05-regression.test.ts` + regresión V1–V4 |
| IMPL-14 | ✅ | Este documento v1.1 |

**Suites CI:** ver `PHASE_05_REGRESSION_SUITE_MANIFEST` en `auth-phase-05-regression.test.ts`.

**Alignment patch:** Fase 5 implementada — GAP-P1-01, GAP-P1-06, GAP-P2-01, GAP-P1-08 cerrados en código (validación manual V5.3/V5.4 pendiente pre-deploy).
