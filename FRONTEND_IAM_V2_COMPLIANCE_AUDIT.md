# FRONTEND IAM V2 — Auditoría de Cumplimiento

**Documento:** `FRONTEND_IAM_V2_COMPLIANCE_AUDIT.md`  
**Versión:** 1.0.0  
**Fecha:** 2026-06-23  
**Estado:** AUDITORÍA COMPLETADA — **SIN IMPLEMENTACIÓN**  
**Fuente normativa:** `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` v1.0.0  
**Alcance:** Frontend React — Password Authentication IAM V2  
**Excluido:** Backend, Azure AD, Google Login, OAuth/SSO, F15, Legacy  

---

## 1. Resumen ejecutivo

Se auditó el Frontend React del ERP CAXIS contra el contrato funcional oficial del Backend IAM Session Management V2 (checklist **FE-01 … FE-25**).

**Veredicto general:** el núcleo de autenticación (login, refresh con single-flight, logout, multi-empresa, impersonación, interceptores 401) está **maduro y alineado** con la mayoría de reglas de transporte y ciclo de vida de la especificación §8. Sin embargo, la capa de **identificación de sesión V2** (`session_id`, `current_session_id`) **no está implementada** en tipos, auth pipeline ni UI de sesiones. El frontend opera hoy como cliente **RC1** (`token_id` / `current_token_id`), lo que constituye la deuda contractual principal frente a V2.

| Métrica | Valor |
|---------|-------|
| Criterios evaluados | 25 (FE-01 … FE-25) |
| ✅ Cumple | 17 |
| ⚠️ Parcial | 4 |
| ❌ No cumple | 4 |
| N/A (cliente web) | 1 (FE-07) |
| **Cumplimiento pleno estimado** | **68 %** (17/25) |
| **Cumplimiento con parciales ponderados** | **~76 %** |

**Bloqueadores para declarar cumplimiento V2:** FE-01, FE-02, FE-09 (primario), FE-10, FE-24.

**Sin cambios de código realizados en esta auditoría.**

---

## 2. Estado general

### 2.1 Fortalezas identificadas

| Área | Estado | Evidencia principal |
|------|--------|---------------------|
| Transporte web | ✅ | `X-Client-Type: web` global y en login (`auth.service.ts`, `axios-instances.ts`) |
| Refresh HttpOnly | ✅ | `withCredentials: true`; refresh no leído en JS |
| Single-flight refresh | ✅ | `getRefreshingPromise` / cola en interceptor (`auth-provider-interceptors.compositor.ts`) |
| Access post-refresh | ✅ | `setAuth` / `applyPostRefreshSession` → `swapAccessToken` |
| 401 refresh → login | ✅ | `executeInterceptorRefreshTermination` + `runSessionTerminationExit` |
| Login multi-empresa | ✅ | Schema A: `selection_token` sin refresh; navegación a selección |
| Empresa seleccionar | ✅ | `apiSelection` + Bearer selection; `applyFullSessionToken` post-OK |
| Guard `/me/` selection | ✅ | Bootstrap e `hydrateSessionCore` omiten `/me/` con selection pendiente |
| Cambio de empresa | ✅ | Cookie refresh + `applyFullSessionToken` |
| Password change | ✅ | `applyFullSessionToken` reemplaza sesión local completa |
| Logout / logout_all | ✅ | Limpieza access local; redirect inmediato post logout_all (flags V3) |
| Impersonación | ✅ | Refresh y cambiar empresa bloqueados; `/impersonate/end/` implementado |
| Display sesiones | ✅ | `expires_at`, `device.*`, `status` server-side; sin UUIDs visibles |
| SSO out of scope | ✅ | Sin flujos Azure/Google/OAuth en módulo auth |

### 2.2 Deuda contractual V2 (crítica)

| Área | Estado | Impacto |
|------|--------|---------|
| `session_id` en tipos y UI | ❌ | 0 ocurrencias en `src/**` |
| `current_session_id` en `/me/` | ❌ | Solo `current_token_id` en `UserData` |
| Revoke remoto | ❌ | Path param = `token_id`, no `session_id` |
| `is_current` fallback | ⚠️ | Compara `token_id` ↔ `current_token_id`; ignora `session_id` |
| Re-login post activación V2 | ❌ | Sin documentación ni banner operativo (FE-24) |
| Tipos sesión | ⚠️ | Contrato RC1 explícito en `session.types.ts` |

### 2.3 Arquitectura revisada

```
src/
├── core/auth/
│   ├── provider/          ← AuthContext compositors (bootstrap, interceptors, termination)
│   └── session/           ← refresh, logout_all, impersonation, terminate
├── features/auth/         ← auth.service, Login, ChangePassword, MySessionsPage
├── features/admin/        ← session.service, hooks, utils, ActiveSessionsPage
└── shared/context/        ← AuthContext shell público
```

**AuthContext:** ensamblado vía `useAuthProvider` con compositors (Baseline V1). Features consumen `@/shared/context/AuthContext` — patrón correcto.

**SessionContext:** no existe contexto separado; estado de sesión vive en AuthContext (`authRef`, `useState` access token).

**Interceptores:** request Bearer + response 401 con refresh single-flight en `auth-provider-interceptors.compositor.ts`.

**Almacenamiento:**

| Artefacto | Ubicación | ¿Conforme V2? |
|-----------|-----------|---------------|
| Access token ERP | Memoria (`authRef` / React state) | ✅ |
| Refresh token | Cookie HttpOnly (servidor) | ✅ |
| Selection token | Zustand persist → localStorage | ✅ (fase transitoria) |
| Impersonation access | sessionStorage | ✅ (access, no refresh) |

---

## 3. Matriz FE-01 … FE-25

| ID | Requisito | Estado | Evidencia / gap |
|----|-----------|--------|-----------------|
| **FE-01** | Usa `session_id` como identificador en UI y revoke | ❌ **No cumple** | Grep `session_id` en `src/**` → 0 matches. Keys React, revoke y tipos usan `token_id`. |
| **FE-02** | No usa `token_id` como ID de sesión en V2 | ❌ **No cumple** | `UserSessionRead.token_id` obligatorio; `isCurrentSession` compara `token_id`; comentarios RC1 en `iam-current-session.ts`. |
| **FE-03** | Reemplaza access tras refresh 200 | ✅ **Cumple** | Interceptor actualiza `authRef` / `setAuth`; `session-post-refresh.ts` → `swapAccessToken`. |
| **FE-04** | Refresh concurrente: access nuevo sin asumir refresh nuevo | ✅ **Cumple** | Single-flight + cola; followers reciben access del líder; cookie no re-leída en JS. |
| **FE-05** | 401 refresh → login sin bucle | ✅ **Cumple** | Early reject en `/auth/refresh` 401; `executeInterceptorRefreshTermination`. |
| **FE-06** | Web: `X-Client-Type: web`; no lee refresh de cookie | ✅ **Cumple** | `WEB_HEADERS` en `auth.service.ts`; `withCredentials` en axios; sin lectura JS de refresh. |
| **FE-07** | Mobile: `X-Client-Type: mobile`; refresh en body | **N/A** | Cliente web SPA. `cambiarEmpresa` expone param `refresh_token` opcional (mobile path) pero no aplica a este despliegue. |
| **FE-08** | Bearer access en llamadas autenticadas | ✅ **Cumple** | Interceptor request: `Authorization: Bearer ${currentToken}`. |
| **FE-09** | `is_current` vía `current_session_id` (/me/, fallback `current_token_id`) | ⚠️ **Parcial** | Prioriza `is_current` del backend ✅; fallback solo `current_token_id === token_id` ❌; `current_session_id` ausente en `UserData`. |
| **FE-10** | Revoke remoto usa `session_id` del listado | ❌ **No cumple** | `revokeSessionSelf(target.token_id)`, `revokeSessionById(target.token_id)` en `iam-session-revoke.utils.ts`. |
| **FE-11** | Tras logout: limpia access local (HTTP 200) | ✅ **Cumple** | `clearLocalAuthState` siempre en terminate/logout. |
| **FE-12** | Tras logout_all: redirige a login inmediatamente | ✅ **Cumple** | `executeLogoutAllFlow` → terminate sin segundo logout server; redirect vía termination pipeline. *Condicionado a `SESSION_LOGOUT_V3_ENABLED=true` (default true).* |
| **FE-13** | `LoginEmpresaSelectionResponse` sin asumir refresh | ✅ **Cumple** | Login Schema A: `setPendingSelection`, sin `setAuthFromLogin`, sin refresh. |
| **FE-14** | Completa flujo `/empresa/seleccionar/` antes de ERP | ✅ **Cumple** | `completeEmpresaSelection` → `applyFullSessionToken` → hydrate. |
| **FE-15** | No llama `/me/` con selection token activo | ✅ **Cumple** | Guards en bootstrap, `hydrateSessionCore`, `applyFullSessionToken`, Login Schema A. |
| **FE-16** | Cambio empresa envía refresh y actualiza access + user_data | ✅ **Cumple** | `POST /empresa/cambiar/` body `{ empresa_id }`; cookie refresh; `applyFullSessionToken`. |
| **FE-17** | Password change reemplaza todos los tokens locales | ✅ **Cumple** | `completePasswordChange` → `applyFullSessionToken`. |
| **FE-18** | No invoca refresh durante impersonación | ✅ **Cumple** | Interceptor: impersonation 401/403 → exit controlado, sin platform refresh. |
| **FE-19** | No invoca cambiar empresa durante impersonación | ✅ **Cumple** | Precheck + handler 403 → `runImpersonationControlledExit`. |
| **FE-20** | Implementa flujo `/impersonate/end/` | ✅ **Cumple** | `auth.service.endImpersonation`; orchestrator `session-impersonation-exit.ts`. |
| **FE-21** | Tolera superset JSON V2 | ⚠️ **Parcial** | `normalizeUserData` spread `...raw` ✅; tipos RC1 sin `session_id`/`login_ip` ❌; código no consume campos V2 aunque lleguen. |
| **FE-22** | `expires_at` = expiración de sesión | ✅ **Cumple** | UI columna "Expira" usa `session.expires_at` directo; `SessionStatusBadge` usa `status` server-side. |
| **FE-23** | `login_ip` solo auditoría/display histórico | ⚠️ **Parcial** | IP mostrada = `device.ip_address` (última conocida) ✅; `login_ip` no modelado ni mostrado (aceptable si no se requiere columna audit). |
| **FE-24** | Documenta re-login obligatorio post activación V2 | ❌ **No cumple** | Sin release note, banner ni flag de migración local documentado para operadores/usuarios. |
| **FE-25** | No implementa flujos SSO | ✅ **Cumple** | Sin login Azure/Google/OAuth. Referencias `sso` solo en catálogos super-admin (`modo_autenticacion`), fuera del flujo auth. |

---

## 4. Hallazgos

### H-01 — Identificador de sesión V2 ausente (CRÍTICO)

**Reglas afectadas:** FE-01, FE-02, FE-09, FE-10  
**Descripción:** El frontend no declara ni consume `session_id` en ningún módulo. Toda la cadena de sesiones (tipos → hooks → revoke → React keys) usa `token_id` como identificador estable.  
**Riesgo V2:** Tras rotación RTR, `token_id` cambia; `session_id` permanece. Revoke, detección de sesión actual y keys pueden desincronizarse o apuntar a credencial obsoleta.  
**Archivos clave:**

- `src/features/admin/types/session.types.ts` — contrato RC1, solo `token_id`
- `src/features/auth/types/auth.types.ts` — `current_token_id`, sin `current_session_id`
- `src/features/admin/utils/iam-current-session.ts` — match por `token_id`
- `src/features/admin/services/session.service.ts` — path `{tokenId}`

### H-02 — Auth pipeline sin `current_session_id` (CRÍTICO)

**Reglas afectadas:** FE-09  
**Descripción:** `normalizeUserData` en `auth.service.ts` normaliza únicamente `current_token_id`. JWT decoder (`decodeAccessToken.ts`) no expone claim `sid`.  
**Impacto:** Fallback client-side de `is_current` no puede usar la fuente primaria V2 (`current_session_id === session.session_id`).

### H-03 — Revoke remoto por `token_id` (ALTO)

**Reglas afectadas:** FE-10  
**Descripción:** Self-revoke y admin-revoke envían `token_id` en path. Backend V2 acepta alias de compatibilidad, pero la spec FE exige preferir `session_id`.  
**Evidencia:** Tests (`ActiveSessionsPage.post-revoke.test.ts`) assert `revokeSessionById(CURRENT_TOKEN_ID)`.

### H-04 — Tipos atados a contrato RC1 (MEDIO)

**Reglas afectadas:** FE-21  
**Descripción:** `session.types.ts` referencia explícitamente `ERP-IAM-SESSIONS-API-CONTRACT-V1`. Campos V2 (`session_id`, `login_ip`) no están tipados; el código no los lee aunque el runtime JSON los tolere.

### H-05 — FE-24 sin documentación operativa (MEDIO)

**Reglas afectadas:** FE-24  
**Descripción:** Spec §8.1(15) exige re-login forzado tras activación V2 en entorno. No hay documento de despliegue, banner in-app ni procedimiento operativo en el repositorio orientado a usuarios finales.

### H-06 — Feature flags de rollback en logout (BAJO)

**Reglas afectadas:** FE-12 (condicional)  
**Descripción:** `SESSION_LOGOUT_V3_ENABLED` y `SESSION_TERMINATION_V2_ENABLED` pueden desactivar logout_all y terminación V2 vía env compile-time. Defaults = `true`, pero `.env.example` no documenta estos flags. Si se despliegan en `false`, FE-11/FE-12 quedarían incumplidos en runtime.

### H-07 — Comportamientos conformes verificados (POSITIVO)

| Flujo | Conformidad |
|-------|-------------|
| Login password + session limit (BE) | FE delega evicción al backend |
| Refresh RTR + idle/TTL 401 | Interceptor termina sesión; mensaje unificado BE |
| Replay attack | FE no paraleliza refresh; 401 → login en dispositivo afectado |
| Logout idempotente | Limpieza local siempre |
| Logout all access residual | Redirect inmediato; no confía en access |
| Password change reset sesiones | Tokens locales reemplazados |
| Selection token 409 en `/me/` | Evitado por guards |
| Impersonación sin refresh BD | Refresh/cambiar empresa bloqueados; end flow OK |
| Session listing display | Device enriquecido, fechas, status; paginación admin ERP |
| Session expiration UI | `expires_at` + `expiring_soon` badge |

---

## 5. Riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación propuesta |
|----|--------|--------------|---------|----------------------|
| R-01 | Revoke falla o revoca sesión incorrecta tras RTR porque path usa `token_id` obsoleto | Media | Alto | Migrar a `session_id` en revoke (FE-10) |
| R-02 | UI marca sesión incorrecta como "actual" si backend envía `is_current: false` y hubo rotación | Media | Medio | Implementar fallback `current_session_id` (FE-09) |
| R-03 | React keys duplicadas o filas fantasma tras rotación concurrente | Baja | Medio | Keys por `session_id` (FE-01) |
| R-04 | Usuarios mantienen sesiones pre-V2 inválidas sin re-login tras activación backend | Alta | Medio | Documentar + banner one-shot (FE-24) |
| R-05 | Despliegue con flags V3/termination en false rompe logout_all | Baja | Alto | Documentar env; prohibir false en prod V2 |
| R-06 | Campos V2 ignorados silenciosamente → regresión no detectada en QA | Media | Medio | Extender tipos + tests superset V2 (FE-21) |

---

## 6. Incumplimientos

### 6.1 Bloqueantes (❌)

1. **FE-01** — Sin `session_id` en UI ni revoke.
2. **FE-02** — `token_id` usado como identificador de sesión en toda la stack.
3. **FE-10** — Revoke remoto no usa `session_id` del listado.
4. **FE-24** — Sin documentación de re-login obligatorio post activación V2.

### 6.2 Parciales (⚠️)

1. **FE-09** — Fallback `is_current` incompleto (falta `current_session_id`).
2. **FE-21** — Superset tolerado en runtime pero no modelado ni consumido.
3. **FE-23** — Semántica IP correcta en display; `login_ip` no disponible para auditoría UI.
4. **FE-07** — N/A web; mobile no evaluado en este repositorio.

---

## 7. Prioridad de remediación

| Prioridad | Ítems | Justificación |
|-----------|-------|---------------|
| **P0 — Bloqueante V2** | FE-01, FE-02, FE-09, FE-10 | Identidad de sesión es eje central del contrato V2; afecta revoke, UI y auth sync |
| **P1 — Operacional** | FE-24 | Requisito de despliegue al activar V2 en tenant/entorno |
| **P2 — Robustez** | FE-21, FE-23 | Tipado superset, helper `resolveSessionId`, columna opcional IP login |
| **P3 — Hardening** | Flags env documentados | Prevenir rollback accidental en producción |
| **N/A** | FE-07 | Proyecto mobile separado si aplica |

---

## 8. Plan de remediación

> **Nota:** Plan propuesto para fase de implementación posterior. **No ejecutado en esta auditoría.**

### Fase A — Identidad de sesión (P0)

1. Extender `UserData` con `current_session_id?: string | null`.
2. Extender `UserSessionRead` / `AdminSessionRead` con `session_id: string` (+ `login_ip?` opcional).
3. Normalizar en `auth.service.ts`: `current_session_id` desde `/me/`.
4. Crear `resolveSessionId(session): string` → `session.session_id ?? session.token_id` (transición).
5. Refactorizar `isCurrentSession`:
   - Primario: `session.is_current === true`
   - Fallback 1: `session.session_id === current_session_id`
   - Fallback 2: `session.token_id === current_token_id` (compat RC1)
6. Actualizar hooks: `useMySessionsList`, `useRevokeSession`, `useActiveSessionsList`.

### Fase B — Revoke y UI (P0)

1. Cambiar `revokeSessionSelf` / `revokeSessionById` a parámetro `sessionId`.
2. Path: `POST /auth/sessions/{sessionId}/revoke/` y `revoke_admin/`.
3. React keys en table/cards: `session.session_id`.
4. Migrar tests a fixtures V2 con rotación RTR.

### Fase C — Auth claims (P0)

1. Opcional: decodificar JWT `sid` en `decodeAccessToken` para diagnóstico/cross-check.
2. Propagar `current_session_id` en auth-sync y post-refresh hydrate.

### Fase D — Operaciones y tipos (P1–P2)

1. Documento/banner FE-24: re-login tras activación `IAM_SESSION_MANAGEMENT_V2_ENABLED`.
2. Actualizar comentario de contrato en `session.types.ts` → V2 superset.
3. Documentar flags en `.env.example`.
4. (Opcional producto) Columna "IP de login" con `login_ip`.

### Fase E — Validación

1. Tests unitarios: `isCurrentSession` V2, `resolveSessionId`, revoke path.
2. Tests integración auth-phase con `current_session_id`.
3. QA manual: listado, self-revoke, admin-revoke, RTR concurrente, logout_all, password change.

---

## 9. Estimación de impacto

| Fase | Archivos estimados | Esfuerzo | Riesgo regresión |
|------|-------------------|----------|------------------|
| A — Identidad | ~8–10 | 1–2 días | Medio |
| B — Revoke/UI | ~12–15 | 1–2 días | Medio |
| C — Auth claims | ~3–5 | 0.5 día | Bajo |
| D — Ops/tipos | ~2–4 | 0.5 día | Bajo |
| E — Tests/QA | ~10–12 | 1–2 días | — |
| **Total** | **~35–45 archivos** | **4–7 días dev + QA** | **Medio** |

**Impacto funcional para usuarios:** ninguno visible si backend sigue enviando alias `token_id` durante transición; beneficio principal en estabilidad post-RTR y alineación contractual.

**Impacto arquitectónico:** bajo — cambios localizados en capa auth types, session utils/hooks/services; sin modificar contratos API.

---

## 10. Declaración final de cumplimiento

| Declaración | Valor |
|-------------|-------|
| **¿Cumple 100 % IAM Session Management V2?** | **NO** |
| **Cumplimiento pleno (✅)** | 17 / 25 (68 %) |
| **Con parciales resueltos** | 21 / 25 (84 % estimado post-remediación P0–P2) |
| **Backend modificado** | No (fuera de alcance) |
| **Código modificado en esta auditoría** | No |
| **Fecha auditoría** | 2026-06-23 |
| **Próximo paso recomendado** | Ejecutar Fase A–B (P0) antes de declarar conformidad V2 en producción |

### Conclusión normativa

El Frontend React **no puede declararse conforme al 100 %** con `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` en su estado actual. La infraestructura de autenticación (transporte, refresh, logout, multi-empresa, impersonación) **sí cumple** la mayoría de obligaciones de ciclo de vida §8. La brecha principal es **semántica de identificación de sesión V2**: el cliente permanece anclado al modelo RC1 (`token_id` / `current_token_id`) en lugar del modelo canónico (`session_id` / `current_session_id` / claim JWT `sid`).

Hasta completar la remediación P0 (FE-01, FE-02, FE-09, FE-10) y P1 (FE-24), el Frontend debe considerarse **parcialmente alineado — RC1-compatible con backend V2 vía alias**, no **certificado V2**.

---

**Fin del documento — FRONTEND IAM V2 Compliance Audit v1.0.0**
