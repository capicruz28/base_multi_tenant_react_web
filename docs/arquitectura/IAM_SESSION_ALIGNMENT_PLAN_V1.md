# IAM Session Management — Plan de Alineación Frontend V1

**Ticket:** IAM-FE-BE-ALIGNMENT-PLAN-01  
**Versión del plan:** V1.1  
**Estado:** Hoja de ruta oficial — Fases 1–3 implementadas; Fases 4–9 planificadas  
**Fecha:** 2026-06-19  
**Actualización doc:** 2026-06-19 — IAM-FE-PHASE-03-DOCUMENTATION-PATCH-02  
**Audiencia:** Desarrollo frontend, arquitectura, QA, soporte técnico  

> Este documento compara y alinea dos fuentes normativas documentadas:  
> - Backend: `IAM_SESSION_MANAGEMENT_V2.md` (Production Ready, P1-04)  
> - Frontend: `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` (código actual)  
>
> **Carácter histórico preservado:** las secciones redactadas como plan original conservan el baseline pre-implementación; las actualizaciones post-Fase 3 están indicadas en §1, §2 (filas 25–26, 35), §3 y §5 Fase 3.  
> Cada fase del roadmap está diseñada para convertirse posteriormente en un ticket independiente.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Matriz Backend vs Frontend](#2-matriz-backend-vs-frontend)
3. [GAP Analysis](#3-gap-analysis)
4. [Plan de implementación](#4-plan-de-implementación)
5. [Fases propuestas](#5-fases-propuestas)
6. [Mapa de dependencias](#6-mapa-de-dependencias)
7. [Impacto esperado](#7-impacto-esperado)
8. [Plan de validación](#8-plan-de-validación)
9. [Riesgos](#9-riesgos)
10. [Roadmap final](#10-roadmap-final)

---

## 1. Resumen ejecutivo

### Estado Backend

| Atributo | Valor (fuente: `IAM_SESSION_MANAGEMENT_V2.md`) |
|----------|------------------------------------------------|
| Versión | IAM Session Management V2 (post P1-04) |
| Estado | **Production Ready** |
| Fases cerradas | P1-01 reuse, P1-02 idle, P1-03 session limit, P1-04 rotación atómica, HOTFIX-01, CLEANUP-01 |
| Fuente de verdad refresh | Tabla `refresh_tokens` (SQL Server) |
| Concurrencia | UPDLOCK + UnitOfWork; F5 concurrente con `suppress_session_rotated_reuse` |
| Contrato FE | Sección 19 — contrato explícito para frontend web y mobile |
| Madurez estimada | **5.0 / 5** (dominio certificado en alcance documentado) |

### Estado Frontend

| Atributo | Valor (fuente: `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md`) |
|----------|----------------------------------------------------------|
| Versión | IAM Session Management Frontend V1 |
| Estado | Documentado según código desplegado |
| Orquestador | `AuthContext.tsx` (~1768 líneas) — monolito funcional |
| Cliente soportado | Web (`X-Client-Type: web`) |
| Cliente no soportado | Mobile |
| Madurez estimada | **3.0 / 5** (operativo web single-tab) |

### Nivel de alineación global

| Dimensión | Alineación | Nota |
|-----------|------------|------|
| Modelo tokens web (access memoria + refresh cookie) | **Alineado** | `withCredentials`, `X-Client-Type: web` |
| Login Schema A / B | **Alineado** | Selection + sesión completa |
| Bootstrap refresh + `/auth/me` | **Alineado** | Excepciones documentadas (login, selection, impersonación) |
| Refresh single-flight + cola 401 | **Alineado** | `isRefreshingPromise` + `failedQueueRef` |
| Refresh post-hidratación (interceptor) | **No alineado** | Solo actualiza token; no `/auth/me` ni `empresa_id` BD |
| Logout idempotente | **Alineado** | `doLogout` limpia siempre |
| Logout All | **Alineado** (post-Fase 3) | Header + `executeLogoutAllFlow`; redirect post-200 |
| Cambiar / seleccionar empresa | **Alineado** | Rotación vía backend; FE usa `applyFullSessionToken` |
| Password change | **Alineado** | Nueva sesión vía `applyFullSessionToken` |
| Session expired / idle (tratamiento 401) | **Parcial** | Limpia estado; sin redirect explícito ni mensaje |
| TOKEN_REUSE | **Parcial** | Mismo flujo que 401 genérico |
| Impersonación refresh 403 | **Parcial** | FE omite refresh; no finaliza flujo soporte en interceptor |
| Multi-tab auth | **No alineado** | Cookie compartida; access por pestaña sin sync |
| Refresh 500 retry | **No alineado** | Sin retry con backoff |
| HTTP 429 | **No alineado** | Sin handler |
| Mobile client | **Fuera de alcance FE actual** | Backend soporta; FE no implementa |

**Alineación global estimada: ~68 %** en flujos web core (login, bootstrap, cambio empresa, password).  
**~45 %** en garantías transversales (multi-tab, post-refresh sync, UX contrato §19). Logout All y revocación remota proactiva **alineados post-Fase 3**.

### Madurez post-migración (objetivo del plan)

Tras ejecutar las 8 fases del roadmap (§10), el objetivo documental es alcanzar **≥ 4.5 / 5** de alineación con `IAM_SESSION_MANAGEMENT_V2.md` §19 para cliente web, sin modificar el contrato backend.

---

## 2. Matriz Backend vs Frontend

Leyenda de estado: **A** = Alineado · **P** = Parcial · **N** = No alineado · **NA** = No aplica (FE web)

| # | Capacidad | Backend (V2) | Frontend (V1) | Estado | Impacto |
|---|-----------|--------------|---------------|--------|---------|
| 1 | Identificación `X-Client-Type: web` | Cookie refresh HttpOnly | `auth.service.ts` envía `web` | **A** | Bajo |
| 2 | Identificación `X-Client-Type: mobile` | Refresh en body JSON | No implementado | **NA** | N/A web |
| 3 | Cookie `refresh_token` HttpOnly | Set-Cookie en login/refresh/rotate | `withCredentials: true`; borrado manual logout | **A** | Bajo |
| 4 | Access Bearer en requests | Obligatorio autenticado | Request interceptor | **A** | Alto |
| 5 | Access solo en memoria (web) | No cookie para API | React state + `authRef` | **A** | Medio |
| 6 | Login sesión directa (Schema B) | access + refresh + `user_data` | `setAuthFromLogin` → `applyFullSessionToken` | **A** | Alto |
| 7 | Login multi-empresa (Schema A) | `selection_token`; sin refresh | Zustand localStorage; sin `/auth/me` | **A** | Alto |
| 8 | Session limit en login | `enforce_max_active_sessions` | Transparente; sin awareness FE | **P** | Bajo |
| 9 | Bootstrap `POST /auth/refresh/` | Valida BD + rota o 401 | `runBootstrap` default path | **A** | Alto |
| 10 | Bootstrap → `initializeAuth` | Implícito en contrato (sesión completa) | Sí tras refresh OK | **A** | Alto |
| 11 | Refresh interceptor 401 | Single refresh; no bucle | `isRefreshingPromise` + cola | **A** | Alto |
| 12 | Outcome `ROTATED` | Cookie actualizada + access nuevo | Usa `access_token`; cookie automática | **A** | Medio |
| 13 | Outcome `ALREADY_ROTATED` | Access nuevo; cookie puede no cambiar (web) | Usa `access_token`; no distingue outcome | **P** | Medio |
| 14 | Post-refresh reemplazar access | Inmediato en memoria | Sí en interceptor | **A** | Alto |
| 15 | Post-refresh `empresa_id` desde BD | `refresh_tokens.empresa_id` > JWT | Interceptor no re-hidrata empresa/user | **N** | **Crítico** |
| 16 | Refresh 401 → login | No reintentar refresh | `doLogout(false)` | **P** | Alto |
| 17 | Refresh 401 → redirect login | Redirigir explícito | Delegado a `ProtectedRoute` | **P** | Medio |
| 18 | Refresh 500 → 1 retry backoff | Máx. 1 retry; luego login | Sin retry dedicado | **N** | Medio |
| 19 | Refresh impersonación 403 | Finalizar impersonación | Omite refresh; reject al caller | **P** | Alto |
| 20 | Idle timeout | Revoca refresh → 401 transparente | Mismo 401; sin UX idle | **P** | Medio |
| 21 | TOKEN_REUSE | 401 seguridad; revoca todas sesiones | Logout silencioso genérico | **P** | **Crítico** |
| 22 | Logout `POST /auth/logout/` | HTTP 200 idempotente | `doLogout(true)` | **A** | Alto |
| 23 | Logout limpiar cliente | access + refresh aunque BE borró cookies | Cookie manual + reset estado | **A** | Alto |
| 24 | Logout Bearer opcional (blacklist) | Opcional para blacklist `jti` | Cookie enviada; Bearer si hay token | **P** | Bajo |
| 25 | Logout All `POST /auth/logout_all/` | Bearer; redirect login tras 200 | Header + `executeLogoutAllFlow`; redirect post-200 | **A** | Alto |
| 26 | Logout All access válido hasta exp | Documentado L-08 | `terminateSession` callServer:false post-200 (L-08 mitigado) | **A** | Medio |
| 27 | Password change nueva sesión | revoke_all + nueva sesión única | `applyFullSessionToken` | **A** | Alto |
| 28 | Seleccionar empresa | selection_token; nueva sesión + refresh | `apiSelection` + `applyFullSessionToken` | **A** | Alto |
| 29 | Cambiar empresa con cookie refresh | Rotate atómico; web cookie | `cambiarEmpresa` + cookie | **A** | Alto |
| 30 | Cambiar empresa ALREADY_ROTATED (L-02) | 200 con refresh no persistido | Sin manejo específico; riesgo 401 siguiente refresh | **P** | Medio |
| 31 | Cambiar empresa sin refresh (L-03) | Fallback legacy store | Web usa cookie; entra camino principal | **A** | Bajo |
| 32 | `empresa_selection_pending` bloquea cambiar | 409 si pending | `ProtectedRoute` + gates | **A** | Medio |
| 33 | Concurrencia F5 refresh | 1× ROTATED; N-1× ALREADY_ROTATED | Single-flight alineado con BE | **A** | Alto |
| 34 | Multi-tab cookie refresh compartida | Rotación en una pestaña afecta otras | Access stale en otras pestañas | **N** | **Crítico** |
| 35 | Revocación admin sesión remota | Refresh → 401 en cliente | `SessionRemoteProbe` focus/visibility + post-revoke; latencia ≤ 5 s + RTT | **A** | Medio |
| 36 | Admin listar/revocar sesiones | Endpoints admin | `ActiveSessionsPage` | **A** | Bajo |
| 37 | Impersonación Platform → ERP | Bloqueo refresh 403; cambiar empresa 403 | Implementado con sessionStorage parent | **P** | Alto |
| 38 | Tenant `cliente_id` vs `empresa_id` | Separados en JWT/BD | `TenantProvider` + `scopeEmpresaId` | **A** | Alto |
| 39 | Subdominio pre-login | Resolución tenant | `tenantResolver` | **A** | Medio |
| 40 | React Query invalidación sesión | Implícito en cambio contexto | `clear()` + ORG/INV en transiciones | **A** | Alto |
| 41 | HTTP 429 | No documentado en §19 BE | Sin handler FE | **N** | Bajo |
| 42 | Mensaje 401 unificado BE | Texto fijo en refresh inválido | No mostrado al usuario en logout silencioso | **P** | Medio |
| 43 | SSO Azure/Google | Login equivalente; sin `link_session_access_jti` (L-04) | Mismo flujo login FE si endpoints usados | **P** | Bajo |
| 44 | Redis fail-soft blacklist | Access puede seguir válido (L-07) | FE no distingue; refresh maneja | **P** | Bajo |
| 45 | Headers tenant opcionales | No en §19 | `VITE_AUTH_TENANT_HEADERS` desactivado | **P** | Bajo |

---

## 3. GAP Analysis

Gaps derivados exclusivamente de la comparación entre `IAM_SESSION_MANAGEMENT_V2.md` §19, §18 (limitaciones BE) y `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` §18–§19.

### P0 — Bloquean alineación contractual o integridad operativa

| ID | Gap | Fuente BE | Fuente FE | Impacto |
|----|-----|-----------|-----------|---------|
| **GAP-P0-01** | Post-refresh interceptor no re-hidrata sesión (`/auth/me`, `empresa_id` BD, menú) | §19 Refresh; §9 empresa_id BD en refresh | §5 Refresh interceptor; FE-P0-02 | Datos operativos obsoletos tras 401→refresh; desalineación `scopeEmpresaId` |
| **GAP-P0-02** | Multi-tab: cookie refresh compartida sin sync access token | §16 Concurrencia F5; §19 | §16 Sincronización pestañas; FE-P0-01 | Pestaña B con access inválido; rotación silenciosa en A |
| **GAP-P0-03** | Logout All sin UI ni redirect post-200 | §7 Logout All; §19 | §7 Logout All FE; FE-P0-03 | **CERRADO Fase 3** — UI Header + `executeLogoutAllFlow` (V3.2) |
| **GAP-P0-04** | Session expired: sin redirect explícito ni mensaje contrato §19 | §19 Session Expired (3 pasos) | §8 Session Expired; §17 UX; FE-P0-04 | **Parcial Fase 3** — redirect post logout_all vía `terminateSession` (V3.2); session expired general según Fase 2 |
| **GAP-P0-05** | TOKEN_REUSE sin tratamiento diferenciado | §13 Token Reuse; §19 | §17 UX TOKEN_REUSE | Incidente de seguridad indistinguible de expiración normal |

### P1 — Deuda arquitectónica significativa

| ID | Gap | Fuente BE | Fuente FE | Impacto |
|----|-----|-----------|-----------|---------|
| **GAP-P1-01** | Refresh HTTP 500 sin retry con backoff | §19 Reintentos | §18 Reintentos; FE-P1-03 | Mayor tasa de logout innecesario en fallos transitorios |
| **GAP-P1-02** | Impersonación: 403 refresh no finaliza soporte en interceptor | §19 403 impersonación | §5 Skip soporte; FE-P1-06 | Requests fallan sin salida controlada fuera de bootstrap |
| **GAP-P1-03** | `doLogout` no invalida RQ directamente (depende TenantContext) | §19 limpiar tokens | §6 Logout; §14 RQ | Ventana breve de datos stale si orden effects falla |
| **GAP-P1-04** | Sin detección proactiva logout remoto (admin revoke) | §6 perform_logout; admin revoke | §17 Logout remoto; FE-P2-05 | **CERRADO Fase 3** — `SessionRemoteProbe` + post-revoke admin (V3.3) |
| **GAP-P1-05** | `AuthContext` monolito dificulta evolución segura | — | §3.1; FE-P1-01 | Riesgo regresión en cada cambio de sesión |
| **GAP-P1-06** | Sin manejo HTTP 429 | — (no §19) | §15 Interceptores; FE-P1-02 | Degradación sin feedback en rate limit |
| **GAP-P1-07** | Dual permisos `/auth/menu` + `/auth/permissions/me` | — | §3.10; FE-P1-04 | Complejidad gates; posible race en cambio empresa |
| **GAP-P1-08** | Cambiar empresa ALREADY_ROTATED (BE L-02) sin estrategia FE | §18 L-02 | §18 Contrato; FE-P2-04 | Siguiente refresh puede 401 tras cambio empresa concurrente |

### P2 — Mejoras de robustez y mantenibilidad

| ID | Gap | Fuente BE | Fuente FE | Impacto |
|----|-----|-----------|-----------|---------|
| **GAP-P2-01** | Outcome refresh no modelado (`ROTATED` vs `ALREADY_ROTATED`) | §5 Outcomes tabla | §5 Estados tras refresh; FE-P2-04 | Observabilidad y debugging limitados |
| **GAP-P2-02** | `auth.service.ts` legacy duplicado | — | §3.3; FE-P1-05 | Confusión mantenimiento |
| **GAP-P2-03** | `TenantContext` legacy coexistiendo | — | §3.9; FE-P2-02 | Riesgo import incorrecto |
| **GAP-P2-04** | Selection store localStorage sin sync cross-tab | — | §16; FE-P3-03 | Inconsistencia Schema A multi-tab |
| **GAP-P2-05** | Headers tenant auth desactivados | — | §12; FE-P1-07 | Multi-tenant hostname edge cases |
| **GAP-P2-06** | `secureStorage` no conectado | — | §13; FE-P2-01 | Sin impacto actual (tokens en memoria es correcto) |
| **GAP-P2-07** | Instancias API locales sin refresh | — | §15; axios locales | On-premise/hybrid: 401 sin refresh central |

### P3 — Menor impacto / higiene

| ID | Gap | Fuente BE | Fuente FE | Impacto |
|----|-----|-----------|-----------|---------|
| **GAP-P3-01** | Logs diagnóstico extensos en rutas sesión | — | §19 FE-P3-02 | Ruido DEV |
| **GAP-P3-02** | Session limit sin feedback usuario | §11 Session Limit | — | Usuario no sabe que sesión antigua fue revocada |
| **GAP-P3-03** | SSO sin `link_session_access_jti` (BE L-04) | §18 L-04 | — | Solo afecta blacklist access vía Redis en SSO |
| **GAP-P3-04** | Mobile client no implementado | §19 mobile | §22 Estado dominio | Fuera alcance web ERP actual |

---

## 4. Plan de implementación

### Principios del plan

1. **Orden por dependencias arquitectónicas**, no por dificultad técnica.
2. **Comportamiento estable antes de refactor estructural** — `AuthContext` se descompone al final.
3. **Cada fase = un ticket** con criterios de aceptación verificables (§8).
4. **Rollback** siempre posible: fases incrementales con feature flags o switches de comportamiento donde el riesgo lo exija.
5. **Sin cambios de contrato API** — solo consumo alineado del contrato BE existente.

### Metodología por fase

Cada fase del §5 incluye obligatoriamente:

| Campo | Descripción |
|-------|-------------|
| **Objetivo** | Qué gap(s) cierra respecto a §19 BE |
| **Riesgo** | Regresión, seguridad, UX |
| **Dependencias** | Fases o gaps prerequisito |
| **Rollback** | Cómo revertir sin dejar sesión inconsistente |
| **Validación** | Escenarios §8 asociados |

---

## 5. Fases propuestas

La organización prioriza: **correctitud de sesión → terminación de sesión → sincronización → resiliencia → dominios especiales → UX → observabilidad → refactor**.

---

### Fase 1 — Post-Refresh Session Alignment

**Ticket sugerido:** `IAM-FE-PHASE-01-REFRESH-HYDRATE`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar GAP-P0-01: tras refresh exitoso en interceptor 401, alinear estado FE con fuente BE (`empresa_id` BD vía JWT actualizado + `/auth/me`) |
| **Gaps** | GAP-P0-01, parcial GAP-P1-07 |
| **Alcance** | Unificar post-refresh interceptor con semántica bootstrap: re-hidratar user, `empresaActivaId`, menú/permisos cuando claims o política lo requieran; evitar `/auth/me` en cada refresh si claims JWT suficientes y sin cambio detectado |
| **Riesgo** | Medio — más requests post-refresh; posible flicker UI si no se gestiona `loading` |
| **Dependencias** | Ninguna (fase fundacional) |
| **Rollback** | Flag de comportamiento: "refresh legacy" (solo token) vs "refresh hydrate"; revertir flag |
| **Validación** | Escenarios V1.1–V1.4 (§8) |

---

### Fase 2 — Session Termination Contract

**Ticket sugerido:** `IAM-FE-PHASE-02-SESSION-TERMINATION`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar GAP-P0-04, GAP-P0-05: cumplir §19 pasos 1–3 en expiración (limpiar, redirect login, no reintentar); mensaje diferenciado TOKEN_REUSE |
| **Gaps** | GAP-P0-04, GAP-P0-05, parcial GAP-P1-03 |
| **Alcance** | Centralizar terminación de sesión: `doLogout`/`sessionExpired` con redirect explícito a `/login`, mensaje UX (toast o query param), `queryClient.clear()` determinista, rechazo cola refresh |
| **Riesgo** | Bajo–Medio — cambio en todos los flujos de salida |
| **Dependencias** | **Fase 1** (terminación tras refresh fallido debe coexistir con hydrate OK) |
| **Rollback** | Mantener redirect delegado a `ProtectedRoute` detrás de flag |
| **Validación** | Escenarios V2.1–V2.6 (§8) |

---

### Fase 3 — Logout & Remote Revocation

**Ticket sugerido:** `IAM-FE-PHASE-03-LOGOUT-IMPROVEMENTS`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar GAP-P0-03, GAP-P1-04: Logout All UI + flujo post-200; mejorar respuesta a revocación remota |
| **Gaps** | GAP-P0-03, GAP-P1-04 **cerrados**; GAP-P0-04 **parcial** (redirect logout_all — V3.2) |
| **Alcance** | UI self-service `logoutAllSessions`; redirect inmediato post-200 sin confiar en access residual (§19 L-08); opcional: polling ligero o focus handler para detectar 401 temprano tras revoke admin de sesión propia |
| **Riesgo** | Medio — logout all afecta todos los dispositivos del usuario |
| **Dependencias** | **Fase 2** (terminación centralizada) |
| **Rollback** | Ocultar UI logout all; mantener solo admin revoke existente |
| **Validación** | Escenarios V3.1–V3.4 (§8) |

> **Estado implementado (2026-06-19):** IMPL-01–10 completos; GAP-P0-03, GAP-P1-04 cerrados; GAP-P0-04 parcial (V3.2); cierre formal CLOSURE-REPORT pendiente.

---

### Fase 4 — Cross-Tab Authentication Sync

**Ticket sugerido:** `IAM-FE-PHASE-04-CROSS-TAB-AUTH`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar GAP-P0-02, GAP-P2-04: sincronizar access token y eventos auth entre pestañas del mismo origen |
| **Gaps** | GAP-P0-02, GAP-P2-04 |
| **Alcance** | Extender patrón `BroadcastChannel` (análogo a `tenant-sync`) o `storage` event para: refresh OK, logout, login, cambio empresa; pestaña líder vs seguidoras; selection store sync |
| **Riesgo** | **Alto** — race conditions con rotación cookie BE (§16 F5) |
| **Dependencias** | **Fase 1** (pestañas deben propagar sesión hidratada, no solo token crudo) · **Fase 2** (logout sync) |
| **Rollback** | Desactivar canal auth; comportamiento single-tab actual |
| **Validación** | Escenarios V4.1–V4.5 (§8) |

---

### Fase 5 — Refresh Resilience & Error Taxonomy

**Ticket sugerido:** `IAM-FE-PHASE-05-REFRESH-RESILIENCE`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar GAP-P1-01, GAP-P1-06, GAP-P2-01, GAP-P1-08: retry 500, 429, modelar outcomes, manejar L-02 cambiar empresa |
| **Gaps** | GAP-P1-01, GAP-P1-06, GAP-P2-01, GAP-P1-08 |
| **Alcance** | Retry refresh 500 (1× backoff); handler 429; tipado/documentación outcomes `ROTATED`/`ALREADY_ROTATED`; estrategia post-`cambiarEmpresa` concurrente (detectar 401 en siguiente refresh → re-login según §19) |
| **Riesgo** | Medio — retries mal implementados pueden amplificar carga |
| **Dependencias** | **Fase 1** · **Fase 2** |
| **Paralelo posible con Fase 4** | Sí, si equipos separados; coordinar en interceptor |
| **Rollback** | Desactivar retry; volver a fail-fast en 500 |
| **Validación** | Escenarios V5.1–V5.5 (§8) |

---

### Fase 6 — Impersonation & Platform Admin Hardening

**Ticket sugerido:** `IAM-FE-PHASE-06-IMPERSONATION`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar GAP-P1-02: alinear impersonación con §19 403 refresh y §9 cambiar empresa 403 |
| **Gaps** | GAP-P1-02 |
| **Alcance** | Interceptor 401/403 en modo soporte → salida controlada (`restorePlatformSession` o flujo documentado); no intentar refresh cookie plataforma; mensajes UX diferenciados |
| **Riesgo** | Medio — regresión en flujo Platform Admin |
| **Dependencias** | **Fase 2** · **Fase 4** (sync parent session entre pestañas platform) |
| **Rollback** | Comportamiento actual reject-al-caller |
| **Validación** | Escenarios V6.1–V6.4 (§8) |

---

### Fase 7 — UX Session Management

**Ticket sugerido:** `IAM-FE-PHASE-07-SESSION-UX`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar gaps UX residuales: mensajes §19, session limit awareness (P3-02), gates de carga |
| **Gaps** | GAP-P3-02, mejoras §17 UX |
| **Alcance** | Pantalla o modal sesión expirada; mensaje backend cuando disponible; feedback session limit (login desplazado); unificar spinners gates |
| **Riesgo** | Bajo |
| **Dependencias** | **Fase 2** · **Fase 3** |
| **Rollback** | Revertir a toast-only / silencioso |
| **Validación** | Escenarios V7.1–V7.3 (§8) |

---

### Fase 8 — Observability & Session Diagnostics

**Ticket sugerido:** `IAM-FE-PHASE-08-OBSERVABILITY`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Visibilidad operativa de sesión sin exponer tokens; alinear con auditoría BE |
| **Gaps** | GAP-P3-01; soporte diagnóstico PLATFORM_REFRESH_DIAGNOSTIC |
| **Alcance** | Eventos estructurados (refresh ok/fail, outcome, logout reason, cross-tab); consolidar `auth-debug` detrás de flag DEV; correlación con eventos BE (`token_refresh`, `logout`, etc.) |
| **Riesgo** | Bajo — fuga de datos si se loguean tokens |
| **Dependencias** | **Fase 1** · **Fase 5** (outcomes tipados) |
| **Paralelo posible con Fase 7** | Sí |
| **Rollback** | Desactivar telemetría |
| **Validación** | Escenarios V8.1–V8.2 (§8) |

---

### Fase 9 — AuthContext Decomposition (Refactor estructural)

**Ticket sugerido:** `IAM-FE-PHASE-09-AUTH-REFACTOR`

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cerrar GAP-P1-05, GAP-P2-02, GAP-P2-03: modularizar sin cambiar contrato externo |
| **Gaps** | GAP-P1-05, GAP-P2-02, GAP-P2-03 |
| **Alcance** | Extraer módulos: `session-refresh`, `session-bootstrap`, `session-termination`, `session-impersonation`, `session-empresa`; `AuthProvider` como compositor; eliminar legacy auth service y TenantContext legacy |
| **Riesgo** | **Alto** — superficie de regresión amplia |
| **Dependencias** | **Todas las fases 1–8** (comportamiento congelado y validado) |
| **Rollback** | Mantener exports `useAuth` idénticos; revertir split interno |
| **Validación** | Regresión completa §8 + tests existentes ProtectedRoute |

---

## 6. Mapa de dependencias

### Diagrama de dependencias entre fases

```
Fase 1 (Refresh Hydrate)
    │
    ├──► Fase 2 (Session Termination)
    │         │
    │         ├──► Fase 3 (Logout & Remote Revocation)
    │         │         │
    │         │         └──► Fase 7 (UX Session) ──► Fase 9 (Refactor)
    │         │
    │         └──► Fase 6 (Impersonation)
    │
    ├──► Fase 4 (Cross-Tab Auth) ──► Fase 6
    │
    └──► Fase 5 (Refresh Resilience) ──► Fase 8 (Observability)
                                              │
                                              └──► Fase 9 (Refactor)
```

### Matriz de bloqueo

| Fase | Bloqueada por | Bloquea a |
|------|---------------|-----------|
| 1 | — | 2, 4, 5, 6, 8, 9 |
| 2 | 1 | 3, 6, 7, 9 |
| 3 | 2 | 7, 9 |
| 4 | 1, 2 | 6, 9 |
| 5 | 1, 2 | 8, 9 |
| 6 | 2, 4 | 9 |
| 7 | 2, 3 | 9 |
| 8 | 1, 5 | 9 |
| 9 | 1–8 | — |

### Paralelización segura

| Paralelo | Condición |
|----------|-----------|
| Fase 4 + Fase 5 | Equipos distintos; acordar contrato interno del interceptor |
| Fase 7 + Fase 8 | Sin solapamiento en archivos de terminación |
| Fase 3 + Fase 5 | Posible si Fase 2 cerrada; evitar editar mismo bloque interceptor simultáneamente |

### Fuera del plan (alcance explícito)

| Tema | Razón |
|------|-------|
| Cliente mobile (`X-Client-Type: mobile`) | FE V1 documenta solo web; requiere ticket separado |
| Cambios contrato API backend | Prohibido por normas ERP |
| Headers tenant (`VITE_AUTH_TENANT_HEADERS`) | Depende CORS backend; ticket infra separado |
| Redis fail-soft (L-07) | Comportamiento BE; FE no puede cerrar |

---

## 7. Impacto esperado

> **Nota histórica:** la columna «Estado actual» refleja el baseline al redactar el plan. Post-Fase 3, Logout All ya no está ausente (ver §1, filas 25–26).

### Por dimensión (post Fase 9)

| Dimensión | Estado actual | Impacto esperado |
|-----------|---------------|------------------|
| **Arquitectura** | Monolito AuthContext; sync parcial | Módulos sesión desacoplados; contrato interno claro; cross-tab auth |
| **Seguridad** | TOKEN_REUSE silencioso; logout all operativo post-Fase 3 | Mensajes seguridad; cierre todas sesiones; menor ventana access post-revoke |
| **UX** | Logout silencioso; sin feedback session limit | Mensajes §19; flujos predecibles; menos confusión multi-tab |
| **Multiempresa** | `empresa_id` stale post-refresh interceptor | `scopeEmpresaId` siempre coherente con BD post-refresh |
| **Tenant** | Alineado | Sin cambio estructural; BC auth complementa tenant-sync |
| **Platform Admin** | Impersonación funcional | Salida controlada 403; sync parent cross-tab |
| **Impersonación** | Parcial en interceptor | Alineado §19 403 |
| **React Query** | Clear en transiciones; gap en logout | Clear determinista en toda terminación |
| **Branding** | Por tenantId | Sin impacto directo (correcto por diseño) |
| **Performance** | `/auth/me` solo bootstrap | Posible +1 `/auth/me` o sync claims en refresh; mitigar con diff claims |

---

## 8. Plan de validación

### Convenciones

- **V{x}.{n}** = escenario de validación fase x.
- Cada fase **no se cierra** sin pasar sus escenarios + regresión smoke de fases anteriores.
- Pruebas manuales multi-tab requieren mismo origen (mismo subdominio/host).

---

### Fase 1 — Post-Refresh Session Alignment

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V1.1 | Request ERP con access expirado → 401 → refresh OK | Token actualizado; request original exitoso |
| V1.2 | Tras refresh interceptor, `empresa_id` en JWT difiere de state previo | `empresaActivaId` y `scopeEmpresaId` actualizados |
| V1.3 | Refresh OK sin cambio empresa en claims | No flicker innecesario; menú coherente |
| V1.4 | Bootstrap refresh OK (regresión) | `/auth/me` + menú cargados como hoy |

---

### Fase 2 — Session Termination Contract

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V2.1 | Refresh 401 en interceptor | Limpieza completa; redirect `/login`; sin reintento refresh |
| V2.2 | Refresh 401 en bootstrap | Igual V2.1 |
| V2.3 | Mensaje backend §19 presente en body | Usuario ve mensaje coherente (no silencioso) |
| V2.4 | TOKEN_REUSE simulado (401 seguridad backend) | Mensaje diferenciado de expiración normal |
| V2.5 | Cola de requests tras refresh fail | Todas rechazadas; sin requests colgadas |
| V2.6 | `queryClient` tras terminación | Cache limpio; sin datos autenticados |

---

### Fase 3 — Logout & Remote Revocation

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V3.1 | Logout manual header | POST logout + limpieza + login |
| V3.2 | Logout All desde UI nueva | POST logout_all 200 → redirect login inmediato |
| V3.3 | Admin revoke sesión propia (otra pestaña) | Detección y terminación ≤ 5 s + RTT tras focus/visibility |
| V3.4 | Logout idempotente doble click | Sin error visible; estado anónimo |

---

### Fase 4 — Cross-Tab Authentication Sync

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V4.1 | Dos pestañas autenticadas; refresh en pestaña A | Pestaña B recibe access actualizado sin 401 |
| V4.2 | Logout en pestaña A | Pestaña B termina sesión |
| V4.3 | Cambio empresa en pestaña A | Pestaña B refleja empresa y invalida RQ |
| V4.4 | F5 concurrente dos pestañas (BE F5) | Al menos una pestaña operativa; sin TOKEN_REUSE falso positivo UX |
| V4.5 | Schema A selection en pestaña A; login en B | Sin estado corrupto en localStorage |

---

### Fase 5 — Refresh Resilience

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V5.1 | Refresh 500 transitorio | 1 retry backoff; éxito o terminación §19 |
| V5.2 | Refresh 500 persistente | Terminación sesión tras retry |
| V5.3 | HTTP 429 en API | Feedback UX; sin tormenta de refresh |
| V5.4 | Cambiar empresa concurrente (BE L-02) | Comportamiento documentado; no estado corrupto |
| V5.5 | Outcome ALREADY_ROTATED en refresh | Access usable; sin segundo refresh inmediato |

---

### Fase 6 — Impersonation

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V6.1 | 401 en modo soporte durante operación ERP | Salida controlada a Platform (no refresh plataforma) |
| V6.2 | F5 en modo soporte | Rehidratación sessionStorage válida |
| V6.3 | Support JWT expirado | Toast + restore parent |
| V6.4 | endImpersonation manual | Parent restaurado; ERP inaccessible |

---

### Fase 7 — UX Session Management

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V7.1 | Sesión expirada idle (backend config) | Mismo UX que revoke; mensaje claro |
| V7.2 | Session limit desplaza sesión antigua | Usuario informado al re-login si aplica |
| V7.3 | Gates carga bootstrap | Sin flash contenido protegido |

---

### Fase 8 — Observability

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V8.1 | DEV: eventos refresh logged sin token completo | Solo prefix/metadata |
| V8.2 | Correlación logout reason | Trazabilidad refresh fail vs manual vs remote |

---

### Fase 9 — AuthContext Refactor

| ID | Escenario | Criterio de éxito |
|----|-----------|-------------------|
| V9.1 | API pública `useAuth` sin cambios | Mismos campos y semántica |
| V9.2 | Regresión completa V1–V8 | Todos pasan |
| V9.3 | Tests `ProtectedRoute` existentes | Verde |

---

### Smoke regression (todas las fases)

| Flujo | Verificar |
|-------|-----------|
| Login Schema B → ERP home | OK |
| Login Schema A → selección → ERP | OK |
| F5 en sesión activa | OK |
| Cambio empresa header | OK sin reload |
| Password change obligatorio | OK |
| Platform impersonate → ERP → exit | OK |

---

## 9. Riesgos

### Arquitectónicos

| Riesgo | Probabilidad | Severidad | Mitigación en plan |
|--------|--------------|-----------|-------------------|
| Race refresh multi-tab vs rotación BE | Alta | Alta | Fase 4 después de Fase 1–2; escenarios V4.4 |
| Regresión por monolito AuthContext | Alta | Alta | Fase 9 al final; flags rollback por fase |
| Doble `/auth/me` post-refresh degrada perf | Media | Media | Diff claims antes de hydrate (Fase 1 diseño) |
| Cross-tab sync loop infinito | Media | Alta | Ignorar mismo token; debounce en canal auth |

### Operativos

| Riesgo | Probabilidad | Severidad | Mitigación |
|--------|--------------|-----------|------------|
| Logout all cierra sesiones productivas | Media | Alta | ConfirmDialog; copy claro; RBAC |
| Despliegue parcial (solo Fase 4 sin Fase 1) | Media | Crítica | Orden roadmap obligatorio |
| On-premise API local sin refresh | Media | Media | Documentar en Fase 5 alcance hybrid |

### UX

| Riesgo | Probabilidad | Severidad | Mitigación |
|--------|--------------|-----------|------------|
| Mensajes TOKEN_REUSE alarman sin causa real | Baja | Media | Solo cuando BE confirma mensaje seguridad |
| Flicker loading en refresh hydrate | Media | Baja | No elevar `loading` global en refresh background |

### Compatibilidad

| Riesgo | Probabilidad | Severidad | Mitigación |
|--------|--------------|-----------|------------|
| BE L-02 cambiar empresa ALREADY_ROTATED | Media | Media | Fase 5 estrategia 401 siguiente refresh |
| BE L-09 perdedor F5 access temporal | Alta | Baja | Aceptado por contrato; Fase 4 reduce impacto multi-tab |
| Cookies third-party / SameSite | Baja | Alta | Verificar dominio cookie en staging antes Fase 4 |

---

## 10. Roadmap final

### Orden exacto recomendado

| Orden | Fase | Ticket ID | Gaps principales | Duración relativa |
|-------|------|-----------|------------------|-------------------|
| **1** | Post-Refresh Session Alignment | IAM-FE-PHASE-01-REFRESH-HYDRATE | GAP-P0-01 | M |
| **2** | Session Termination Contract | IAM-FE-PHASE-02-SESSION-TERMINATION | GAP-P0-04, GAP-P0-05 | M |
| **3** | Logout & Remote Revocation | IAM-FE-PHASE-03-LOGOUT-IMPROVEMENTS | GAP-P0-03, GAP-P1-04 | M |
| **4** | Cross-Tab Authentication Sync | IAM-FE-PHASE-04-CROSS-TAB-AUTH | GAP-P0-02 | L |
| **5** | Refresh Resilience & Error Taxonomy | IAM-FE-PHASE-05-REFRESH-RESILIENCE | GAP-P1-01, GAP-P1-06, GAP-P1-08 | M |
| **6** | Impersonation & Platform Admin | IAM-FE-PHASE-06-IMPERSONATION | GAP-P1-02 | M |
| **7** | UX Session Management | IAM-FE-PHASE-07-SESSION-UX | GAP-P3-02, UX §17 | S |
| **8** | Observability & Diagnostics | IAM-FE-PHASE-08-OBSERVABILITY | GAP-P3-01 | S |
| **9** | AuthContext Decomposition | IAM-FE-PHASE-09-AUTH-REFACTOR | GAP-P1-05, GAP-P2-02/03 | L |

*S = pequeña · M = media · L = grande (esfuerzo relativo, no estimación temporal)*

### Hitos de alineación

| Hito | Tras fase | Alineación §19 estimada |
|------|-----------|-------------------------|
| H1 — Sesión coherente | Fase 1 | ~75 % |
| H2 — Terminación contractual | Fase 2 | ~82 % |
| H3 — Logout completo | Fase 3 | ~88 % |
| H4 — Multi-tab estable | Fase 4 | ~92 % |
| H5 — Resiliencia producción | Fase 5 | ~94 % |
| H6 — Platform/impersonación | Fase 6 | ~96 % |
| H7 — UX + observabilidad | Fases 7–8 | ~98 % |
| H8 — Mantenibilidad | Fase 9 | **≥ 98 %** web core |

### Criterio de cierre del programa

El programa **IAM Session Alignment** se considera cerrado cuando:

1. Matriz §2 muestra **A** o **P** aceptable en todas las filas aplicables a web (sin **N** en capacidades §19).
2. Todos los GAP **P0** y **P1** están cerrados o aceptados formalmente con excepción documentada.
3. Escenarios V1–V9 pasan en staging multi-tab.
4. `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` puede actualizarse a **V2** reflejando el nuevo estado (ticket separado de documentación).

### Tickets derivados (plantilla)

Cada ticket de fase debe incluir:

- Referencia a este plan: `IAM_SESSION_ALIGNMENT_PLAN_V1.md` §5 Fase N
- Gaps cerrados (IDs §3)
- Escenarios validación (IDs §8)
- Criterio rollback (§5 fase N)
- Dependencias bloqueantes (§6)

---

## Referencias

| Documento | Ruta |
|-----------|------|
| Backend Session Management V2 | `IAM_SESSION_MANAGEMENT_V2.md` |
| Frontend Session Architecture V1 | `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` |
| Diagnóstico refresh Platform | `docs/frontend/auditoria/PLATFORM_REFRESH_DIAGNOSTIC.md` |
| Flujo auth multiempresa | `docs/FLUJO_AUTH_MULTIEMPRESA_FE.md` |

---

*Generado bajo IAM-FE-BE-ALIGNMENT-PLAN-01. Actualizado post-Fase 3 (DOCUMENTATION-PATCH-01/02).*
