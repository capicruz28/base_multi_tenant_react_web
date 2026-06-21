# IAM-FE-PHASE-04 — Diseño Técnico: Cross-Tab Authentication Sync

**Ticket diseño:** IAM-FE-PHASE-04-DESIGN-01  
**Ticket implementación:** IAM-FE-PHASE-04-CROSS-TAB-AUTH  
**Versión:** 1.1  
**Estado:** IMPLEMENTADO — IAM-FE-PHASE-04-IMPLEMENTATION-01  
**Fecha diseño:** 2026-06-19  
**Fecha implementación:** 2026-06-19  
**Referencias normativas:**
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 — Fase 4, §8 V4.x, GAP-P0-02, GAP-P2-04
- `docs/arquitectura/IAM_FE_PHASE_03_TECHNICAL_DESIGN.md` v1.1 — congelada (SIGNOFF-01)
- `docs/arquitectura/IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` — terminación, `emitTerminationEvent`
- `docs/arquitectura/IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` — hydrate post-refresh
- `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` — §16 sincronización, `tenant-sync`
- `IAM_SESSION_MANAGEMENT_V2.md` — §16 concurrencia F5, §19
- Informes: IAM-FE-PHASE-03-CLOSURE-REPORT-01 · IAM-FE-PHASE-03-SIGNOFF-01

> Este documento define **cómo** se implementó la Fase 4 (v1.1 alineado a código).  
> Las Fases 1–3 quedan **congeladas** salvo wiring mínimo en `AuthContext` e invocaciones de hooks preparados (`emitTerminationEvent`).

---

## Índice

1. [Objetivos](#1-objetivos)
2. [Alcance](#2-alcance)
3. [Arquitectura propuesta](#3-arquitectura-propuesta)
4. [Componentes nuevos](#4-componentes-nuevos)
5. [Componentes reutilizados](#5-componentes-reutilizados)
6. [Flujo de eventos cross-tab](#6-flujo-de-eventos-cross-tab)
7. [Integración con Phase-03](#7-integración-con-phase-03)
8. [Feature flags](#8-feature-flags)
9. [Riesgos](#9-riesgos)
10. [Estrategia de rollback](#10-estrategia-de-rollback)
11. [Plan de implementación](#11-plan-de-implementación)
12. [Estrategia de validación](#12-estrategia-de-validación)
13. [GAPs cerrados al finalizar](#13-gaps-cerrados-al-finalizar)
14. [Criterios de aceptación](#14-criterios-de-aceptación)

---

## 1. Objetivos

### 1.1 Problema que resuelve

Tras SIGNOFF Phase-03, cada pestaña del mismo origen mantiene **access token en memoria aislada** mientras la **cookie refresh es compartida** (Architecture V1 §16). Efectos verificables:

| Contexto | Comportamiento post-Fase 3 | Impacto |
|----------|---------------------------|---------|
| Refresh OK en pestaña A | Pestaña B conserva access obsoleto | 401 evitables · desalineación operativa |
| Logout / logout_all en A | B permanece autenticada en UI | Ventana de sesión fantasma |
| Terminación por probe/remoto en A | B hasta focus + probe (≤ 5 s + RTT) | Latencia UX evitable same-origin |
| Cambio empresa en A | B con `scopeEmpresaId` stale | Datos ERP incorrectos |
| Schema A selection en A | `localStorage` compartido sin handler | Estado selection inconsistente |

**GAP principal:** **GAP-P0-02** — cookie refresh compartida sin sync access token (Alignment §3, matriz §2 fila 34 → **N**).

### 1.2 Objetivos funcionales (ticket)

| # | Objetivo |
|---|----------|
| 1 | Cerrar **GAP-P0-02** — propagar sesión autenticada coherente entre pestañas mismo origen |
| 2 | Cerrar **GAP-P2-04** — sync selection store Schema A cross-tab |
| 3 | Sincronizar: **login**, **logout**, **logout_all**, **revocación remota**, **expiración de sesión** |
| 4 | Mantener **SessionRemoteProbe** (Phase-03) como complemento, no sustituto |
| 5 | Evitar loops, tormentas de eventos y carreras con rotación BE (F5) |
| 6 | Compatibilidad con `terminateSession()`, `executeLogoutAllFlow()`, `AuthContext` |
| 7 | **Sin** modificar contratos backend |

### 1.3 Objetivo técnico formal

Introducir una capa **Cross-Tab Authentication Sync** que:

1. **Emite** eventos de sesión normalizados tras transiciones auth locales (login, refresh OK, terminación, cambio empresa).
2. **Recibe** eventos en pestañas seguidoras y aplica **rehidratación** (Fase 1) o **terminación** (Fase 2) sin duplicar llamadas HTTP destructivas.
3. **Reutilice** `emitTerminationEvent` (hook preparado Fase 2) como punto de emisión único post-terminación.
4. **Coexist** con `tenant-sync` (`BroadcastChannel` separado) sin mezclar responsabilidades.
5. **Preserve** íntegramente contratos congelados Fases 1–3 (§5.2).
6. **No introduzca** endpoints nuevos ni cambios OpenAPI.

### 1.4 Criterios de aceptación (enlace plan)

Escenarios obligatorios: **V4.1–V4.5** (`IAM_SESSION_ALIGNMENT_PLAN_V1.md` §8).

Regresión obligatoria: **V1.1–V1.4** + **V2.1–V2.6** + **V3.1–V3.4**.

---

## 2. Alcance

### 2.1 Dentro de alcance (MVP Fase 4)

| Área | Detalle |
|------|---------|
| Canal cross-tab | `BroadcastChannel` `'auth-sync'` (patrón análogo `tenant-sync`) |
| Eventos sesión | `SESSION_LOGIN`, `SESSION_REFRESHED`, `SESSION_TERMINATED`, `EMPRESA_CHANGED` |
| Selection Schema A | Sync `caxis-empresa-selection-pending` vía evento dedicado o `storage` listener acotado |
| Emisión | Tras login completo, refresh interceptor/bootstrap OK, `terminateSession`, `executeLogoutAllFlow` post-200 |
| Recepción | Aplicar token + hydrate ligero (F1) o terminación local `callServer: false` (F2) |
| Anti-loop | `tabId`, `eventId`, deduplicación token, suppress re-broadcast |
| Flags | Master + sub-flag; rollback runtime |
| Tests | Unit policy + integración multi-tab simulada + regresión V1–V3 |

### 2.2 Fuera de alcance (fases posteriores)

| Tema | Fase responsable |
|------|------------------|
| Retry refresh 500 / HTTP 429 | Fase 5 |
| Estrategia ALREADY_ROTATED cambiar empresa (L-02) | Fase 5 |
| Impersonación Platform sync complejo | Fase 6 (depende parcialmente F4 parent session) |
| Observabilidad estructurada cross-tab | Fase 8 |
| Refactor AuthContext | Fase 9 |
| Multi-sesión independiente mismo navegador/origin | **No soportado** — F4 sincroniza **una** sesión compartida por cookie |
| Mobile `X-Client-Type: mobile` | Ticket separado |
| SharedWorker / Service Worker auth | Fuera MVP |
| Sustituir SessionRemoteProbe | Prohibido — complementario |

### 2.3 Dependencias duras

| Dependencia | Estado requerido |
|-------------|------------------|
| Fase 1 cerrada | `applyPostRefreshSession` / `hydrateSessionCore` |
| Fase 2 cerrada | `terminateSession`, `emitTerminationEvent` hook |
| Fase 3 cerrada (SIGNOFF) | Probe, logout all, post-revoke |
| `tenant-sync` existente | Ortogonal — no fusionar canales |

---

## 3. Arquitectura propuesta

### 3.1 Principio de diseño: eventos sobre estado compartido

| Capa | Nombre | Responsabilidad Fase 4 |
|------|--------|------------------------|
| **L4-A** | Auth sync envelope | Tipos, versionado, validación payload |
| **L4-B** | Channel transport | `BroadcastChannel` + fallback degradado |
| **L4-C** | Emit policy | Cuándo y qué emitir; anti-tormenta |
| **L4-D** | Inbound apply | Traducir evento → F1 hydrate o F2 terminate |
| **L4-E** | AuthContext binder | Suscripción lifecycle; wiring emit hooks |

**Regla central:** la pestaña **origen** ejecuta el flujo HTTP/canónico; las **seguidoras** aplican efecto local **sin** repetir POST logout/logout_all/refresh salvo rehidratación read-only (`/auth/me` vía F1 existente cuando el payload lo exija).

### 3.2 Diagrama arquitectura objetivo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AuthProvider (AuthContext) — composition root                               │
│  ├─ [F1] refresh OK → applyPostRefreshSession → emit SESSION_REFRESHED      │
│  ├─ [F2] terminateSession → emitTerminationEvent → SESSION_TERMINATED       │
│  ├─ [F3] logoutAll / probe terminate → mismo emit                         │
│  ├─ [F4] AuthSyncListenerBinder (onMessage)                                 │
│  └─ login / cambiarEmpresa → emit SESSION_LOGIN / EMPRESA_CHANGED           │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                    BroadcastChannel 'auth-sync'
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
   Tab A (leader)          Tab B (follower)        Tab C (follower)
   emite evento            applyInboundAuthEvent    applyInboundAuthEvent
                           ├─ REFRESHED → F1       ├─ TERMINATED → F2
                           └─ no re-emit           └─ callServer: false
```

### 3.3 Qué cambia vs Fase 3

| Elemento | Cambio Fase 4 |
|----------|---------------|
| `emitTerminationEvent` | De no-op → emisor BC |
| Interceptor refresh OK | + emit `SESSION_REFRESHED` |
| Login / cambiarEmpresa | + emit eventos |
| `AuthProvider` | + listener binder |
| Selection store | + sync handler |
| SessionRemoteProbe | Sin cambio cuerpo; skip si terminación reciente vía BC |

### 3.4 Qué permanece congelado (Fases 1–3)

Ver §5.2 — mismos artefactos que Phase-03 §1.6 más módulos Phase-3 `session-logout-*`, `session-remote-probe*`.

---

## 4. Componentes nuevos

| Artefacto | Ubicación propuesta | Responsabilidad |
|-----------|---------------------|-----------------|
| `session-auth-sync.flags.ts` | `src/core/auth/session/` | Flags Fase 4 |
| `session-auth-sync.types.ts` | `src/core/auth/session/` | Envelope, event types, payload |
| `session-auth-sync-channel.ts` | `src/core/auth/session/` | Wrapper BC: post, subscribe, close |
| `session-auth-sync-emit.ts` | `src/core/auth/session/` | Política emisión; anti-loop guards |
| `session-auth-sync-apply.ts` | `src/core/auth/session/` | `applyInboundAuthSyncEvent` puro |
| `session-auth-sync-selection.ts` | `src/core/auth/session/` | GAP-P2-04 selection sync |
| `useAuthSyncListener.ts` | `src/core/auth/session/` | Hook lifecycle listener |
| Tests | `src/core/auth/session/__tests__/` | Unit + channel mocks |

**Canal:** `BroadcastChannel` nombre **`auth-sync`** — distinto de **`tenant-sync`**.

---

## 5. Componentes reutilizados

### 5.1 Stack congelado (solo invocación)

| Contrato | Uso Fase 4 |
|----------|------------|
| `applyPostRefreshSession` / `hydrateSessionCore` | Follower tab tras `SESSION_REFRESHED` / `SESSION_LOGIN` |
| `terminateSession` | Follower tab tras `SESSION_TERMINATED` (`callServer: false`) |
| `runSessionTerminationExit` | Sin cambio firma |
| `executeLogoutAllFlow` | Leader only; followers vía evento |
| `session-remote-probe.ts` | Complementario — ver §7 |
| `session-logout-all.ts` | Sin cambio cuerpo |
| `REFRESH_HYDRATE_ENABLED` | Follower debe respetar flag F1 |
| `SESSION_TERMINATION_V2_ENABLED` | Follower terminate path |
| `SESSION_LOGOUT_V3_*` | Sin cambio |

### 5.2 Referencia patrón existente

| Patrón | Archivo referencia | Reutilización F4 |
|--------|-------------------|------------------|
| Tenant BC | `core/stores/tenant-store-sync.ts` | Estructura postMessage + subscribe |
| Termination hook | `TerminateSessionDeps.emitTerminationEvent` | Punto emisión único |

### 5.3 AuthContext (wiring permitido)

| Pieza | Descripción |
|-------|-------------|
| Implementar `emitTerminationEvent` en deps F2 | Serializa `TerminateSessionEventPayload` → BC |
| Post-refresh emit | Tras F1 apply OK en interceptor/bootstrap |
| Post-login emit | Tras sesión completa Schema A/B |
| `AuthSyncListenerBinder` | Monta `useAuthSyncListener` |

**Prohibido:** alterar firmas públicas `useAuth()`; modificar cuerpo `terminateSession` / `hydrateSessionCore`.

---

## 6. Flujo de eventos cross-tab

### 6.1 Envelope común

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `v` | `1` | Versión protocolo |
| `eventId` | `string` (uuid) | Dedup |
| `tabId` | `string` | Emisor — ignorar self-echo |
| `type` | enum | Ver §6.2 |
| `issuedAtMs` | `number` | Timestamp emisión |
| `payload` | objeto | Según tipo |

### 6.2 Tipos de evento

| Type | Emisor típico | Payload mínimo (implementado) | Acción follower |
|------|---------------|-------------------------------|-----------------|
| `SESSION_LOGIN` | Tab post-login / completeEmpresaSelection / impersonation OK | `accessToken`, `claimsSnapshot`, `empresaActivaId` | F1 `applyPostRefreshSession` o `applyFullSessionToken` vía DI |
| `SESSION_REFRESHED` | Tab post-interceptor refresh OK o bootstrap refresh OK | `accessToken`, `claimsSnapshot`, `empresaActivaId` | F1 `applyPostRefreshSession`; abort refresh local (V4.4) |
| `SESSION_TERMINATED` | Tab post-terminateSession | `reason`, `redirectPath?`, `preservePreLoginBranding?` | F2 `terminateSession({ callServer: false })`; `skipRedirect` si pestaña no visible |
| `EMPRESA_CHANGED` | Tab post-cambiarEmpresa | `accessToken`, `empresaActivaId`, `claimsSnapshot` | F1 hydrate + `invalidateOrgQueries` / `invalidateInvQueries` |
| `SELECTION_SYNC` | Tab Schema A (Login, impersonation selection) o clear | `selectionToken`, `empresasDisponibles`, `userPreview`, `cleared` | Actualizar `useEmpresaSelectionStore` (GAP-P2-04) |

### 6.3 Flujo login (V4.5 parcial)

```
Tab A: login OK → sesión completa
    → emit SESSION_LOGIN
Tab B: recibe → applyInbound (F1 path)
    → isAuthenticated true coherente
    → no POST login en B
```

### 6.4 Flujo refresh (V4.1, V4.4)

```
Tab A: 401 → refresh OK → applyPostRefreshSession
    → emit SESSION_REFRESHED { accessToken, ... }
Tab B: recibe → si token distinto → applyPostRefreshSession
    → requests posteriores usan access nuevo
    → NO dispara refresh en B
```

**Regla F5 / V4.4:** si B recibe REFRESHED mientras refresh in-flight en B, **`clearRefreshingPromise()`** aborta refresh local y aplica token leader (single-flight coordination).

**Redirect follower TERMINATED:** `skipRedirect: true` cuando `document.visibilityState !== 'visible'`; pestaña visible aplica redirect F2 estándar por `reason` (no reutiliza `redirectPath` del envelope como override).

### 6.5 Flujo logout / logout_all (V4.2)

```
Tab A: logout() o executeLogoutAllFlow 200
    → terminateSession local (leader)
    → emit SESSION_TERMINATED { reason: MANUAL_LOGOUT, ... }
Tab B: recibe → terminateSession({
          reason,
          callServer: false,
          error: undefined
        })
    → redirect login (solo tab visible activa) o estado anónimo
```

**Invariante:** follower **nunca** POST `/auth/logout/` ni `/auth/logout_all/` por evento BC.

### 6.6 Flujo expiración / revocación remota (objetivo funcional 3)

```
Tab A: probe o interceptor → terminateSession(REFRESH_REVOKED | ...)
    → emit SESSION_TERMINATED
Tab B: recibe → terminateSession mismo reason, callServer: false
    → UX F2 profile (banner login)
```

SessionRemoteProbe en B puede **omitirse** si terminación BC reciente (`lastAuthSyncTerminatedAt` guard).

### 6.7 Flujo cambio empresa (V4.3)

```
Tab A: cambiarEmpresa OK → applyFullSessionToken / F1
    → emit EMPRESA_CHANGED
Tab B: recibe → F1 hydrate + invalidate ORG/INV según gates existentes
```

### 6.8 Política anti-loop / anti-tormenta

| Regla | Descripción |
|-------|-------------|
| **R1** | Ignorar mensajes con `tabId === selfTabId` |
| **R2** | Dedup `eventId` en ventana 30 s |
| **R3** | No re-emitir eventos recibidos (flag `inboundApply`) |
| **R4** | Debounce emisión REFRESHED: máx 1 / 2 s por tab |
| **R5** | Ignorar REFRESHED si `accessToken` igual al actual |
| **R6** | Cola single-flight inbound apply |
| **R7** | Si `getIsTerminating()` → skip inbound except TERMINATED dedup |

### 6.9 Degradación sin BroadcastChannel

| Entorno | Comportamiento |
|---------|----------------|
| BC no disponible | Flag detecta; F4 OFF efectivo; Phase-3 probe sigue operativo |
| Safari privado edge | Documentado — mismo fallback |

---

## 7. Integración con Phase-03

### 7.1 SessionRemoteProbe — complementario

| Aspecto | Regla Fase 4 |
|---------|--------------|
| Rol | Red de seguridad cuando BC falla o tab dormida sin mensaje |
| Coexistencia | Probe **permanece** montado con flags V3 |
| Skip probe | Si `SESSION_TERMINATED` BC aplicado en últimos N s (p. ej. 10 s) |
| Latencia | BC → terminación **inmediata** cross-tab; probe ya no es path primario same-origin |
| Parámetros probe | `minIntervalMs` 5 s **sin cambio** |

### 7.2 executeLogoutAllFlow

| Paso | Leader | Follower |
|------|--------|----------|
| POST logout_all | Sí | No |
| terminateSession | Sí | Sí vía BC |
| emit | Tras 200 + terminate | No |

### 7.3 emitTerminationEvent (Fase 2 → Fase 4)

Implementación propuesta en `getTerminateSessionDeps`:

```
emitTerminationEvent(payload) {
  if (!SESSION_AUTH_SYNC_V4_ENABLED) return;
  postAuthSyncEvent({
    type: 'SESSION_TERMINATED',
    payload: { reason, redirectPath, ... }
  });
}
```

Aplica a: logout manual, logout_all, probe terminate, interceptor terminate.

### 7.4 Feature flags combinados (producción objetivo)

| RH | ST V2 | LV3 | Probe | L4 Sync | Comportamiento |
|----|-------|-----|-------|---------|----------------|
| ON | ON | ON | ON | ON | **Objetivo producción** |
| ON | ON | ON | ON | OFF | Phase-3 actual |
| ON | ON | OFF | * | ON | Sync sin logout all UI |

---

## 8. Feature flags

### 8.1 Flags Fase 4

| Flag | Default diseño | Env | Alcance |
|------|----------------|-----|---------|
| `SESSION_AUTH_SYNC_V4_ENABLED` | `true` | `VITE_SESSION_AUTH_SYNC_V4_ENABLED` | Master — canal + apply |
| `SESSION_AUTH_SYNC_SELECTION_ENABLED` | `true` | `VITE_SESSION_AUTH_SYNC_SELECTION_ENABLED` | Sub — GAP-P2-04 only |

### 8.2 Ortogonalidad

Independientes de: `REFRESH_HYDRATE_ENABLED`, `SESSION_TERMINATION_V2_ENABLED`, `SESSION_LOGOUT_V3_ENABLED`, `SESSION_REMOTE_PROBE_ENABLED`.

### 8.3 Rollback runtime

`VITE_SESSION_AUTH_SYNC_V4_ENABLED=false` → comportamiento idéntico a post-Phase-03 single-tab effective.

---

## 9. Riesgos

### 9.1 Arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación |
|--------|-------|-----------|------------|
| Race refresh multi-tab vs rotación BE (F5) | Alta | Alta | V4.4; leader wins; follower abort refresh; aplicar token leader |
| Loop BC infinito | Media | Alta | R1–R7 anti-loop |
| Doble terminate / doble redirect | Media | Media | Idempotencia F2 `isTerminating`; redirect solo tab focused opcional |
| Payload token en BC — superficie XSS | Baja | Alta | No loguear token; mismo origin; payload mínimo |
| Regresión F1 hydrate follower | Media | Alta | Tests apply inbound; regresión V1 |
| Regresión F2/F3 terminate | Media | Alta | Regresión V2/V3 CI |

### 9.2 Operativos

| Riesgo | Mitigación |
|--------|------------|
| Despliegue F4 sin F1/F2/F3 | Orden roadmap; guards deps |
| BC bloqueado por policy browser | Fallback documentado; probe V3 |
| Tormenta REFRESHED en ERP activo | Debounce R4 |

### 9.3 BE (L-09, L-02)

| Limitación | Mitigación F4 |
|------------|---------------|
| L-09 perdedor F5 access temporal | Aplicar token leader; Fase 5 refina outcomes |
| L-02 ALREADY_ROTATED cambiar empresa | EMPRESA_CHANGED + doc F5 |

---

## 10. Estrategia de rollback

| Nivel | Procedimiento | Efecto |
|-------|---------------|--------|
| L1 Runtime | `VITE_SESSION_AUTH_SYNC_V4_ENABLED=false` | Single-tab; Phase-3 intacta |
| L2 Runtime selection | Sub-flag selection OFF | GAP-P2-04 abierto; resto sync ON |
| L3 Código | Revert commits Fase 4 | Post-Phase-03 |
| L4 Staging parcial | Sync OFF prod ON staging | Validación incremental |

**Criterio activación rollback:** loops BC, regresión V1–V3, TOKEN_REUSE falso positivo V4.4.

---

## 11. Plan de implementación

| Orden | ID | Entregable | Estado |
|-------|-----|------------|--------|
| 1 | IMPL-01 | `session-auth-sync.flags.ts` | ✅ |
| 2 | IMPL-02 | `session-auth-sync.types.ts` — envelope v1 | ✅ |
| 3 | IMPL-03 | `session-auth-sync-channel.ts` | ✅ |
| 4 | IMPL-04 | `session-auth-sync-emit.ts` — policy R1–R7 | ✅ |
| 5 | IMPL-05 | `session-auth-sync-apply.ts` — inbound pure | ✅ |
| 6 | IMPL-06 | Wire `emitTerminationEvent` → BC | ✅ |
| 7 | IMPL-07 | Wire post-refresh emit (interceptor + bootstrap) | ✅ |
| 8 | IMPL-08 | Wire login + cambiarEmpresa emit | ✅ |
| 9 | IMPL-09 | Wire logout_all leader emit post-200 | ✅ |
| 10 | IMPL-10 | `useAuthSyncListener` + AuthContext binder | ✅ |
| 11 | IMPL-11 | `session-auth-sync-selection.ts` (GAP-P2-04) | ✅ |
| 12 | IMPL-12 | Probe skip guard post-BC (`evaluateSessionRemoteProbe`) | ✅ |
| 13 | IMPL-13 | Tests unit + integration BC mocks | ✅ |
| 14 | IMPL-14 | Regresión V1–V3 + escenarios V4 | ✅ |
| 15 | VALIDATION | Manual multi-tab staging V4.1–V4.5 | ⏳ Pendiente operativo |
| 16 | CLOSURE | Informe cierre Fase 4 | ⏳ Post-VALIDATION |

---

## 12. Estrategia de validación

### 12.1 Escenarios V4.x (Alignment §8)

| ID | Escenario | Criterio éxito | Automatizado | Manual |
|----|-----------|----------------|--------------|--------|
| **V4.1** | Dos pestañas; refresh en A | B recibe access actualizado sin 401 | Parcial — mock BC | **Requerido** |
| **V4.2** | Logout en A | B termina sesión | Sí — terminate mock | Smoke |
| **V4.3** | Cambio empresa en A | B refleja empresa + invalida RQ | Parcial | **Requerido** |
| **V4.4** | F5 concurrente dos pestañas | ≥1 operativa; sin TOKEN_REUSE UX falso | Parcial | **Requerido** |
| **V4.5** | Schema A selection A; login B | Sin estado corrupto localStorage | Sí — store (`session-auth-sync-selection.test.ts`) | Smoke multi-tab |

**Suites CI Phase-04:** `session-auth-sync.*.test.ts`, `auth-phase-04-regression.test.ts` (manifesto ampliado en `auth-phase-03-regression.test.ts`).

### 12.2 Regresión obligatoria

V1.1–V1.4 · V2.1–V2.6 · V3.1–V3.4 · smoke §8 Alignment.

### 12.3 Playbook manual V4.1

1. Login mismo usuario en Tab A y Tab B (mismo origen).
2. Forzar 401 en Tab A (token expirado simulado o espera).
3. Verificar request OK en A tras refresh.
4. En B, disparar request ERP sin reload manual.
5. Assert: B no 401; access coherente.

### 12.4 Evidencia cierre

CI verde · nota operativa V4.4 · tabla GAPs §13 · captura opcional V4.3.

---

## 13. GAPs cerrados al finalizar

| GAP | Verificación | Matriz Alignment |
|-----|--------------|------------------|
| **GAP-P0-02** | V4.1, V4.4 | Fila 34 → **A** |
| **GAP-P2-04** | V4.5 | Selection sync |

**Hito:** H4 — Multi-tab estable (~92 % §19 estimado).

**Fuera de cierre F4 (sin reclasificar):** GAP-P0-01, P0-04 residual, P0-05, P1-xx, etc.

---

## 14. Criterios de aceptación

### 14.1 Escenarios obligatorios

| ID | Criterio |
|----|----------|
| V4.1 | Refresh en A → B operativo sin 401 innecesario |
| V4.2 | Logout/logout_all A → B anónimo |
| V4.3 | Cambio empresa A → B mismo `scopeEmpresaId` |
| V4.4 | F5 concurrente → sin UX TOKEN_REUSE espurio |
| V4.5 | Schema A multi-tab → localStorage coherente |

### 14.2 Criterios técnicos de cierre

| Criterio | Requerido |
|----------|-----------|
| IMPL-01–14 completados | Sí |
| Regresión V1–V3 verde | Sí |
| Contratos F1–F3 sin modificación cuerpo | Sí |
| `callServer: false` en terminate follower | Sí |
| Sin POST logout_all en followers | Sí |
| SessionRemoteProbe operativo con flag V3 | Sí |
| Rollback flag verificado | Sí |
| Documentación Phase-04 + Alignment actualizada | Parcial — este doc v1.1; Alignment v1.1 pendiente ticket post-audit |

### 14.3 Criterios REJECTED

- Loop BC observado en staging
- Regresión V1, V2 o V3
- Follower ejecuta POST logout por evento
- P0 auditoría abierta

---

## Referencias cruzadas

| Documento | Sección |
|-----------|---------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 | §5 Fase 4, §8 V4.x, §6 deps, §9 riesgos |
| `IAM_FE_PHASE_03_TECHNICAL_DESIGN.md` v1.1 | §30.2 habilitación F4, §12.4 emitTerminationEvent |
| `IAM_FE_PHASE_02_TECHNICAL_DESIGN.md` | §8.3 emitTerminationEvent, TerminateSessionDeps |
| `IAM_FE_PHASE_01_TECHNICAL_DESIGN.md` | Hydrate post-refresh follower |
| `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | §16 multi-tab baseline |

---

## Tickets derivados (plantilla)

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-04-DESIGN-01 | Este documento |
| IAM-FE-PHASE-04-CROSS-TAB-AUTH | Epic implementación |
| IAM-FE-PHASE-04-IMPL-* | Pasos 1–14 |
| IAM-FE-PHASE-04-VALIDATION | Paso 15 |
| IAM-FE-PHASE-04-CLOSURE-REPORT | Paso 16 |

---

**Fin del diseño IAM-FE-PHASE-04 — Cross-Tab Authentication Sync**

PHASE-04 DESIGN COMPLETE · v1.1 IMPLEMENTADO
