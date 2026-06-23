# ERP-IAM-SESSIONS-FE-DESIGN-01

**Ticket:** ERP-IAM-SESSIONS-FE-DESIGN-01  
**Versión:** 1.0  
**Fecha:** 2026-06-19  
**Estado:** **DISEÑO — Gate arquitectónico previo a implementación**  
**Modo:** READ ONLY → documento de diseño (sin código)

**Entradas normativas:**

| Documento | Rol |
|-----------|-----|
| `ERP-IAM-SESSIONS-API-CONTRACT-V1.md` | Contrato Backend RC1 (única fuente endpoints/DTOs) |
| `ERP_FRONTEND_STANDARDS_V2.md` v2.4 | UX, plantillas, listados §5.11, IAM Admin §9.1 |
| `ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` v1.2 | Patrón estructural (no aplica refactor provider en V1) |
| `ERP-IAM-SESSIONS-FE-AUDIT-01` | **No localizado en repo** — hallazgos sustitutos en §0 |

**Backend congelado:** ERP-IAM-SESSIONS-BE-RC1-STABILIZATION — sin cambios funcionales previstos en V1.

---

## 0. Resumen ejecutivo y contexto de auditoría

### 0.1 Objetivo V1 Frontend

Evolucionar el módulo **Sesiones Activas Enterprise V1** para consumir el contrato RC1 enriquecido (`UserSessionRead`, `AdminSessionRead`, `SessionDeviceRead`), manteniendo la pantalla admin existente (`ActiveSessionsPage`) y añadiendo la vista usuario **My Sessions** con self-revoke idempotente.

### 0.2 Hallazgos sustitutos (código actual vs RC1)

> El documento `ERP-IAM-SESSIONS-FE-AUDIT-01` no está presente en el repositorio. Los siguientes hallazgos se derivan del análisis del código desplegado y del contrato RC1.

| ID | Hallazgo | Severidad | Ubicación actual |
|----|----------|-----------|------------------|
| **GAP-T01** | `AdminSessionRead` FE es subset legacy — faltan `device`, `is_current`, `status`, `issued_at`, `empresa_*`, aliases RC1 | P0 | `features/admin/types/session.types.ts` |
| **GAP-T02** | `getCurrentUserSessions` tipado como `AdminSessionRead[]` — debe ser `UserSessionRead[]` | P0 | `session.service.ts` |
| **GAP-S01** | No existe `revokeSessionSelf` (`POST …/revoke/`) | P0 | `session.service.ts` |
| **GAP-S02** | Normalizador solo lee `sessions`/`total_sesiones`; RC1 expone también `items`/`total` | P1 | `iam-session-list-normalize.ts` |
| **GAP-U01** | `parseUserAgentSummary` deriva browser/OS en FE — **prohibido** contrato §9 | P0 | `iam-session-user-agent.utils.ts` |
| **GAP-U02** | `getSessionExpirationStatus` calcula expiración client-side — RC1 entrega `status` | P1 | `iam-session-display.utils.ts` |
| **GAP-U03** | `isCurrentSession` usa `current_token_id` de `/auth/me` — RC1 entrega `is_current` server-side | P1 | `iam-current-session.ts` |
| **GAP-P01** | No existe `MySessionsPage` ni ruta usuario | P1 | — |
| **GAP-P02** | UI usa `device_name`, `user_agent`, `created_at`/`last_used_at` como semántica principal | P1 | Table/Cards views |
| **GAP-P03** | `logoutAllSessions` en service sin consumidor UI usuario (documentado en IAM_SESSION_FRONTEND_ARCHITECTURE_V1) | P2 | Fuera alcance V1 salvo hook-up opcional |

### 0.3 Decisiones arquitectónicas de alto nivel

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Ubicación módulo | **`src/features/iam-sessions/`** (nuevo dominio transversal) | Evita dependencia `auth → admin`; comparte UI admin + usuario |
| Pantalla admin | Evolucionar `ActiveSessionsPage` → `AdminSessionsPage` (misma ruta `/admin/sesiones`) | Compatibilidad rutas/layouts existentes |
| Pantalla usuario | Nueva `MySessionsPage` bajo ruta perfil/cuenta | Separación clara admin vs self-service |
| Service layer | **Un solo** `session.service.ts` en el módulo | Cero duplicación HTTP; admin y user consumen mismo servicio |
| Normalización listado admin | Adaptador módulo → `ErpPaginatedResponse` | RC1 dual envelope no coincide con `normalizeListResponse` genérico (campos `sessions`/`items`) |
| Parseo UA | **Eliminar** para display; opcional literal admin diagnóstico | Contrato §9 prohibido |
| Plantilla V2 Admin | **Admin** + listado Tier **C** §5.11 (paginación server) | Patrón ya implementado en `useActiveSessionsList` |
| Plantilla V2 Usuario | Vista **usuario autenticado** — listado full-load (API sin `page`) | Tier A transitorio; array completo server-side |

---

## 1. Arquitectura del módulo

### 1.1 Estructura objetivo

```
src/features/iam-sessions/
├── pages/
│   ├── AdminSessionsPage.tsx      # Evolución ActiveSessionsPage (ruta /admin/sesiones)
│   └── MySessionsPage.tsx         # Nueva — sesiones propias
├── hooks/
│   ├── useAdminSessionsErpList.ts # Evolución useActiveSessionsList
│   ├── useMySessionsList.ts       # GET /sessions/ — array completo
│   ├── useRevokeSessionAdmin.ts   # Mutación admin
│   ├── useRevokeSessionSelf.ts    # Mutación self (idempotente)
│   └── session-query-keys.ts      # Query keys centralizadas
├── services/
│   └── session.service.ts         # Migrado desde admin/services
├── types/
│   ├── session.types.ts           # DTOs OpenAPI + params + responses
│   └── session-display.types.ts   # Props UI tipadas (opcional, sin lógica)
├── components/
│   ├── shared/                    # Compartidos admin + user
│   │   ├── SessionDeviceCell.tsx
│   │   ├── SessionStatusBadge.tsx
│   │   ├── SessionCurrentMarker.tsx
│   │   ├── SessionClientTypeIcon.tsx
│   │   ├── SessionExpirationCell.tsx
│   │   └── SessionActionMenu.tsx
│   ├── admin/
│   │   ├── AdminSessionsTableView.tsx   # Evolución ActiveSessionsTableView
│   │   ├── AdminSessionsCardsView.tsx   # Evolución ActiveSessionsCardsView
│   │   └── AdminSessionUserCell.tsx     # Columna usuario (solo admin)
│   └── user/
│       ├── MySessionsTableView.tsx      # Listado simplificado usuario
│       └── MySessionsCardsView.tsx      # Reutiliza layout cards con props user
├── utils/
│   ├── session-list-normalize.ts        # Dual envelope RC1 → ErpPaginatedResponse
│   ├── session-display.utils.ts         # Formateo fechas/labels — sin UA parse
│   ├── session-current.utils.ts         # is_current + fallback current_token_id
│   └── session-revoke-orchestration.ts  # executeActiveSessionRevoke (extraído de page)
└── __tests__/                           # Tests unitarios por capa
```

### 1.2 Justificación por carpeta

| Carpeta | Justificación |
|---------|---------------|
| **`pages/`** | Orquestación toolbar, estados loading/error/empty, ConfirmDialog, wiring hooks. Sin lógica HTTP. Admin mantiene auto-refresh, view-mode, paginación. |
| **`hooks/`** | Server state React Query; toast en `onError` (ER-02). Separación list vs mutaciones. Admin: paginación + filtros. User: query simple. |
| **`services/`** | Única capa Axios del módulo. Sin UI. Sin parseo UA. Sin recálculo `status`. |
| **`components/shared/`** | DRY entre admin/user — celdas puramente presentacionales reciben DTOs ya tipados. |
| **`components/admin/`** | Columnas exclusivas admin (`nombre_usuario`, revoke ajena, filtros tenant). |
| **`components/user/`** | Layout sin columnas de terceros; acciones self-revoke; sin `user_agent` diagnóstico por defecto. |
| **`utils/`** | Normalización envelope, formateo locale, orquestación revoke+probe (comportamiento legacy preservado). |
| **`types/`** | Fuente única alineada OpenAPI; alias legacy documentados. |

### 1.3 Rutas y clasificación V2

| Ruta | Página | Plantilla V2 | Scope | Guard |
|------|--------|--------------|-------|-------|
| `/admin/sesiones` | `AdminSessionsPage` | **Admin** | Tenant-wide (sin empresa operativa) | `requireTenantAdmin` (existente) |
| `/cuenta/sesiones` *(propuesta)* | `MySessionsPage` | Usuario autenticado | Self-service PATH A | `ProtectedRoute` |

> **Nota ruta usuario:** la ruta exacta se confirma en Gate UX; candidatos: `/cuenta/sesiones`, `/perfil/sesiones`. Debe registrarse en router sin alterar `/admin/*`.

### 1.4 Dependencias externas (sin duplicar)

| Dependencia | Uso |
|-------------|-----|
| `@/core/api/api` | Cliente Axios |
| `@/core/hooks/useTenantQuery` | Query keys tenant (ME-10) — admin list |
| `@/core/list` | `useDebouncedSearch`, tipos `ErpPaginatedResponse` |
| `@/shared/components/erp-list` | `ErpPagination` (admin) |
| `@/features/admin/components/iam` | `IamTableEmptyState`, `IamSearchInput` vía `OrgToolbarSearch` |
| `@/features/org/components` | `OrgCompanyToolbar`, `OrgToolbarSearch` |
| `@/features/inv/components` | `InvPageLayout`, `InvTableSkeleton` |
| `@/shared/context/AuthContext` | `runSessionValidityProbe` post-revoke sesión propia |
| `@/core/services/error.service` | `getErrorMessage` |

**Prohibido:** importar compositors L9 auth; no mover lógica a `core/auth/session/` (dominio congelado Phase-09).

---

## 2. Componentes reutilizables

### 2.1 Matriz shared vs exclusivos

| Componente | Shared | Admin only | User only | Justificación |
|------------|--------|------------|-----------|---------------|
| **SessionDeviceCell** | ✅ | | | Renderiza `device.device_label` + icono `client_type`/`platform`. Misma fuente RC1 en ambas vistas. |
| **SessionStatusBadge** | ✅ | | | Usa `status` del Backend (`active` \| `expiring_soon`). Elimina cálculo client-side. |
| **SessionCurrentMarker** | ✅ | | | Usa `is_current` del DTO. Texto «Esta sesión» / «Tu sesión». |
| **SessionClientTypeIcon** | ✅ | | | Iconografía web/mobile — extraído de Table/Cards actuales. |
| **SessionExpirationCell** | ✅ | | | Muestra `expires_at` formateado + `SessionStatusBadge`. |
| **SessionActionMenu** | ✅ * | | | Props `mode: 'admin' \| 'self'` — admin llama revoke_admin; self llama revoke. Misma UX ConfirmDialog externa. |
| **SessionDetailDrawer** | ⚠️ V1.1 | | | **Fuera alcance V1 inicial** — opcional si Gate UX lo aprueba. Evita scope creep. |
| **AdminSessionUserCell** | | ✅ | | `nombre_usuario` + nombre/apellido — solo admin. |
| **AdminSessionsTableView** | | ✅ | | Columnas admin completas + sort server. |
| **AdminSessionsCardsView** | | ✅ | | Grid admin con celda usuario. |
| **MySessionsTableView** | | | ✅ | Sin columna usuario ajeno; columna empresa opcional (`empresa_nombre`). |
| **MySessionsCardsView** | | | ⚠️ | Puede reutilizar `AdminSessionsCardsView` con `variant="self"` omitiendo user cell — preferir wrapper delgado. |

### 2.2 Props contract (shared — diseño, no código)

**SessionDeviceCell:** `{ device: SessionDeviceRead; clientType: string }`  
**SessionStatusBadge:** `{ status: 'active' | 'expiring_soon' }`  
**SessionCurrentMarker:** `{ isCurrent: boolean; label?: string }`  
**SessionActionMenu:** `{ session: UserSessionRead; mode: 'admin' | 'self'; onRevokeRequest: (session) => void; disabled?: boolean }`

### 2.3 Evolución vs componentes actuales

| Actual | Acción V1 |
|--------|-----------|
| `ActiveSessionsTableView` | Migrar → `AdminSessionsTableView`; reemplazar UA/device_name por shared cells |
| `ActiveSessionsCardsView` | Migrar → `AdminSessionsCardsView` |
| Inline `ClientTypeIcon`, `ExpirationBadge` en views | Extraer a shared |
| `ConfirmDialog` en page | Permanece en page (patrón V2 B11 / UX-06 revoke) |

---

## 3. Hooks

### 3.1 `useAdminSessionsErpList`

**Origen:** evolución de `useActiveSessionsList`.

| Responsabilidad | Detalle |
|-----------------|--------|
| Query | `useTenantQuery<ErpPaginatedResponse<AdminSessionRead>>` |
| Service | `getAdminSessions({ page, limit, search, sort_by, sort_order, client_type, usuario_id })` |
| Normalización | `normalizeAdminSessionsResponse` — preferir `items`/`total`, fallback `sessions`/`total_sesiones`, fallback array legacy |
| Estado UI | `page`, `limit`, reset page en cambio filtros |
| Debounce | Consumido desde page vía `useDebouncedSearch` (SR-03 350 ms) |
| Invalidación | `invalidateAdminSessionsQueries(queryClient)` |
| **No hace** | Revoke, toast, parseo UA, cálculo status |

**Query key:** `['iam-sessions', 'admin', 'list', tenantId, page, limit, search, clientType, usuarioId, sortBy, sortOrder]`

**Alias export (compat migración):** re-export temporal `useActiveSessionsList` → `useAdminSessionsErpList` deprecado 1 sprint.

### 3.2 `useMySessionsList`

| Responsabilidad | Detalle |
|-----------------|--------|
| Query | `useTenantQuery<UserSessionRead[]>` |
| Service | `getMySessions()` → `GET /auth/sessions/` |
| Paginación | **Ninguna** — API retorna array completo ordenado `last_used_at DESC` |
| Enabled | `isAuthenticated && !authLoading` |
| Invalidación | `invalidateMySessionsQueries` + compartir invalidate admin si revoke cross-list necesario |
| **No hace** | Filtros server (no existen en PATH A V1) |

**Query key:** `['iam-sessions', 'my', 'list', tenantId]`

### 3.3 Mutaciones

| Hook | Endpoint | Comportamiento |
|------|----------|----------------|
| `useRevokeSessionAdmin` | `POST /sessions/{token_id}/revoke_admin/` | onSuccess: invalidate admin list; si sesión propia → `runSessionValidityProbe` (preservar IMPL-08) |
| `useRevokeSessionSelf` | `POST /sessions/{token_id}/revoke/` | Idempotente RC1; onSuccess: invalidate my list; si `is_current` → probe o redirect según respuesta |

Toast error **solo** en `onError` del hook (ER-02). Page no duplica toast.

### 3.4 Evitar duplicación

- Lógica `executeActiveSessionRevoke` → **`session-revoke-orchestration.ts`** compartida por admin page y hook admin.
- Self-revoke: variante `executeSelfSessionRevoke` con misma invalidación/probe pattern.
- **No** segundo hook de listado admin.

---

## 4. Servicios

### 4.1 `session.service.ts` — API surface V1

| Función | Método | Path | Response | Notas |
|---------|--------|------|----------|-------|
| `getMySessions` | GET | `/auth/sessions/` | `UserSessionRead[]` | Renombre semántico de `getCurrentUserSessions` |
| `getAdminSessions` | GET | `/auth/sessions/admin/` | `AdminSessionRead[]` \| `PaginatedAdminSessionsResponse` | Siempre envía `page` (modo paginado) |
| `revokeSessionSelf` | POST | `/auth/sessions/{token_id}/revoke/` | `RevokeSessionResponse` | Nuevo |
| `revokeSessionAdmin` | POST | `/auth/sessions/{token_id}/revoke_admin/` | `{ message: string }` | Renombre de `revokeSessionById` |
| `logoutAllSessions` | POST | `/auth/logout_all/` | `LogoutAllSessionsResponse` | Permanece; fuera pantalla V1 salvo extensión |

### 4.2 Reglas de capa service

| Permitido | Prohibido |
|-----------|-----------|
| Construir query params whitelist RC1 | Parsear `user_agent` |
| Tipar responses OpenAPI | Derivar `device_label`, `browser`, `status` |
| Propagar errores Axios | Toast / ConfirmDialog |
| Alias export legacy (`getCurrentUserSessions`, `revokeSessionById`) temporal | Lógica `is_current` client-side |

### 4.3 Normalización (utils, invocada desde hook)

```
PaginatedAdminSessionsResponse
  → items: data.items ?? data.sessions
  → total: data.total ?? data.total_sesiones
  → pagina_actual, total_paginas, limit (directos)
```

Array legacy sin `page` en response → slice client-side solo en transición (comportamiento actual preservado).

---

## 5. DTOs y tipos Frontend

### 5.1 Tipos canónicos (alineados OpenAPI RC1)

```typescript
// Diseño — no implementar aquí

interface SessionDeviceRead {
  client_type: string;
  browser: string;
  browser_version: string | null;
  os: string;
  platform: 'desktop' | 'mobile' | 'tablet' | 'unknown' | string;
  device_label: string;
  ip_address: string | null;
  device_id: string | null;
}

interface UserSessionRead {
  token_id: string;
  usuario_id: string;
  cliente_id: string;
  empresa_id: string | null;
  empresa_nombre: string | null;
  issued_at: string;
  created_at: string;           // legacy alias
  last_refresh_at: string | null;
  last_used_at: string | null;  // legacy alias
  expires_at: string;
  is_current: boolean;
  status: 'active' | 'expiring_soon';
  duration_seconds: number;
  device: SessionDeviceRead;
  client_type: string;
  ip_address: string | null;    // legacy alias → prefer device.ip_address en UI nueva
  device_name: string | null;   // legacy
  device_id: string | null;     // legacy
}

interface AdminSessionRead extends UserSessionRead {
  nombre_usuario: string | null;
  nombre: string | null;
  apellido: string | null;
  user_agent: string | null;    // solo admin — diagnóstico; no parsear para display
}
```

### 5.2 Envelope paginado admin

```typescript
interface PaginatedAdminSessionsResponse {
  items: AdminSessionRead[];
  total: number;
  sessions: AdminSessionRead[];   // legacy dual
  total_sesiones: number;         // legacy dual
  pagina_actual: number;
  total_paginas: number;
  limit: number;
}
```

### 5.3 Alias y compatibilidad temporal

| Alias legacy FE | Acción migración |
|-----------------|------------------|
| `AdminSessionRead` (tipo actual reducido) | Renombrar a `AdminSessionReadLegacy` → deprecar; reemplazar por tipo RC1 |
| `getCurrentUserSessions` | Alias → `getMySessions` (1 sprint) |
| `revokeSessionById` | Alias → `revokeSessionAdmin` |
| `ACTIVE_SESSIONS_LIST_QUERY_KEY` | Migrar a `session-query-keys.ts` |
| `isCurrentSession(session, currentTokenId)` | Mantener como **fallback** si `is_current` ausente; preferir `session.is_current` RC1 |
| `formatBrowserLabel(user_agent)` | **Deprecar** display path; admin puede mostrar `device.browser` |
| `parseUserAgentSummary` | **Deprecar** para UI; reservar solo test migración o panel diagnóstico admin opcional (UA crudo truncado) |

### 5.4 Reglas display (utils, no types)

| Campo UI | Fuente canónica |
|----------|-----------------|
| Dispositivo | `device.device_label` |
| Navegador | `device.browser` (+ version opcional) |
| SO | `device.os` |
| IP | `device.ip_address ?? ip_address` (fallback legacy) |
| Estado | `status` |
| Sesión actual | `is_current` |
| Empresa | `empresa_nombre` (fallback `—`, nunca UUID — E-ME4) |
| Última actividad label | `last_refresh_at` (copy: «Último refresh» — no «última actividad app») |
| Emitida | `issued_at` (copy: «Emitida» — no «Creada/login») |

---

## 6. Estrategia de migración

### 6.1 Enfoque: strangler incremental (mínimo riesgo)

1. Crear módulo `iam-sessions` **en paralelo** sin romper imports.
2. Re-exportar desde rutas antiguas durante transición.
3. Sustituir internals de `ActiveSessionsPage` por wrappers al nuevo módulo.
4. Eliminar archivos legacy admin al final con grep 0.

### 6.2 Matriz componentes

| Artefacto actual | Acción V1 | Destino |
|------------------|-----------|---------|
| `features/admin/pages/ActiveSessionsPage.tsx` | **Reemplazar** (wrapper → `AdminSessionsPage`) | `iam-sessions/pages/AdminSessionsPage.tsx` |
| `features/admin/hooks/useActiveSessionsList.ts` | **Reemplazar** | `useAdminSessionsErpList.ts` |
| `features/admin/services/session.service.ts` | **Migrar** | `iam-sessions/services/session.service.ts` |
| `features/admin/types/session.types.ts` | **Reemplazar** | `iam-sessions/types/session.types.ts` |
| `ActiveSessionsTableView/CardsView` | **Reemplazar** | `components/admin/*` + shared |
| `iam-session-display.utils.ts` | **Refactor** (eliminar UA/expiry calc) | `iam-sessions/utils/session-display.utils.ts` |
| `iam-session-user-agent.utils.ts` | **Deprecar** UI | Eliminar uso display; archivo marcado deprecated |
| `iam-session-list-normalize.ts` | **Migrar + extender** dual envelope | `session-list-normalize.ts` |
| `iam-current-session.ts` | **Migrar** con preferencia `is_current` | `session-current.utils.ts` |
| `admin/routes.tsx` lazy import | **Actualizar path** | Import desde `iam-sessions/pages/AdminSessionsPage` |
| Tests post-revoke, current-session | **Migrar** paths | `iam-sessions/__tests__/` |

### 6.3 Compatibilidad de imports (transición)

Durante **1 sprint** mantener re-exports en paths legacy:

```
features/admin/services/session.service.ts  → re-export from iam-sessions
features/admin/hooks/useActiveSessionsList.ts → re-export useAdminSessionsErpList
```

Marcar `// DEPRECATED: usar @/features/iam-sessions/...`

### 6.4 Orden seguro

Ver §9 roadmap FE-IMPL-01…07.

---

## 7. Compatibilidad — comportamiento que debe permanecer igual

| Comportamiento | Detalle |
|----------------|---------|
| Ruta admin | `/admin/sesiones` sin cambio |
| Guard tenant admin | Sin cambio |
| Paginación server admin | `page` + `limit` siempre enviados |
| Búsqueda debounce 350 ms | Preservar |
| Filtro `client_type` web/mobile/all | Preservar |
| Sort server whitelist | Preservar columnas actuales + extender `ip_address`, `device_name` si UI los expone |
| Vista tabla / grid + localStorage | Preservar key `iam-active-sessions-view-mode` |
| Auto-refresh 30 s opcional | Preservar (admin) |
| ConfirmDialog revoke `variant="danger"` | UX-06 — preservar |
| Post-revoke admin sesión propia | `runSessionValidityProbe` si `SESSION_LOGOUT_V3_ENABLED` + sesión actual |
| Toast éxito/error | Hook onError; mensajes equivalentes |
| Skeleton / empty / error banner | InvTableSkeleton + IamTableEmptyState + retry |
| `executeActiveSessionRevoke` semantics | Preservar en utils (tests IMPL-08) |
| No mostrar UUID en UI | `token_id` solo key interna / revoke — E-ME4 |
| Multiempresa admin | Tenant-wide — **sin** selector empresa toolbar (ME-02) |

### 7.1 Cambios intencionales (no regresión — alineación RC1)

| Antes | Después | Motivo |
|-------|---------|--------|
| Browser desde UA parse | `device.browser` | Contrato §9 |
| «Última actividad» | «Último refresh» + tooltip opcional | Semántica RC1 |
| «Creada» | «Emitida» | `issued_at` |
| Expiración calculada FE | Badge desde `status` | RC1 |
| `current_token_id` match | `is_current` primario | RC1 |
| `device_name` columna | `device.device_label` | RC1 |

---

## 8. Riesgos

### P0 — Bloqueantes pre-producción

| ID | Riesgo | Mitigación |
|----|--------|------------|
| **R-P0-01** | Tipos legacy omiten campos RC1 → runtime undefined en UI | FE-IMPL-01 types antes de cualquier UI |
| **R-P0-02** | UA parsing activo viola contrato y diverge de Backend | Eliminar en FE-IMPL-03; code review gate |
| **R-P0-03** | Self-revoke no implementado bloquea MySessionsPage | FE-IMPL-02 service + hook antes de page user |
| **R-P0-04** | Revoke sesión actual sin probe → usuario en estado zombie | Preservar orchestration IMPL-08 en ambos flujos |

### P1 — Alto impacto

| ID | Riesgo | Mitigación |
|----|--------|------------|
| **R-P1-01** | Dual envelope mal normalizado → paginación incorrecta | Tests unitarios normalize; prefer `items`/`total` |
| **R-P1-02** | Copy «última actividad» confunde usuarios | Ajuste copy + nota tooltip RC1 |
| **R-P1-03** | Admin revoke no idempotente → error 404 en reintento | Mantener manejo error claro; no asumir idempotencia admin |
| **R-P1-04** | Migración imports rompe lazy routes admin | Re-export sprint transición |
| **R-P1-05** | `sort_by` inválido → 422 | Tipado whitelist + UI solo columnas válidas |

### P2 — Medio / post-V1

| ID | Riesgo | Mitigación |
|----|--------|------------|
| **R-P2-01** | SessionDetailDrawer scope creep | Defer V1.1 |
| **R-P2-02** | logoutAll UI usuario no entregada | Backlog; service ya existe |
| **R-P2-03** | Filtro `usuario_id` admin sin UI | API ready; UI backlog |
| **R-P2-04** | Full-load user list performance | Monitorear; V2 paginación user si BE lo expone |

---

## 9. Roadmap de implementación

> Solo fases. Sin código. Cada fase = PR reviewable independiente.

### FE-IMPL-01 — Types + normalizer + query keys

| Campo | Valor |
|-------|-------|
| **Archivos** | `iam-sessions/types/*`, `session-list-normalize.ts`, `session-query-keys.ts`, tests normalize |
| **Dependencias** | Contrato RC1 / OpenAPI |
| **Riesgos** | R-P0-01, R-P1-01 |
| **Done** | Tipos RC1 completos; normalizer dual envelope verde; 0 cambios UI |

### FE-IMPL-02 — Service layer + aliases legacy

| Campo | Valor |
|-------|-------|
| **Archivos** | `iam-sessions/services/session.service.ts`, re-exports deprecated admin path |
| **Dependencias** | FE-IMPL-01 |
| **Riesgos** | R-P0-03 |
| **Done** | 5 funciones service; tests HTTP mock; aliases legacy exportados |

### FE-IMPL-03 — Display utils + shared components

| Campo | Valor |
|-------|-------|
| **Archivos** | `session-display.utils.ts`, `session-current.utils.ts`, `components/shared/*` |
| **Dependencias** | FE-IMPL-01 |
| **Riesgos** | R-P0-02, R-P1-02 |
| **Done** | Shared cells renderizan DTO RC1 mock; sin UA parser en display path |

### FE-IMPL-04 — Hooks list + mutations

| Campo | Valor |
|-------|-------|
| **Archivos** | `useAdminSessionsErpList`, `useMySessionsList`, `useRevokeSession*`, `session-revoke-orchestration.ts` |
| **Dependencias** | FE-IMPL-02, FE-IMPL-03 |
| **Riesgos** | R-P0-04, R-P1-03 |
| **Done** | Tests hooks; orchestration post-revoke; invalidate queries |

### FE-IMPL-05 — AdminSessionsPage migration

| Campo | Valor |
|-------|-------|
| **Archivos** | `pages/AdminSessionsPage.tsx`, `components/admin/*`, `admin/routes.tsx`, tests post-revoke migrados |
| **Dependencias** | FE-IMPL-04 |
| **Riesgos** | R-P1-04, R-P1-05 |
| **Done** | `/admin/sesiones` funcional paridad+RC1; QA manual admin; Gates V2 Admin listado |

### FE-IMPL-06 — MySessionsPage (nueva)

| Campo | Valor |
|-------|-------|
| **Archivos** | `pages/MySessionsPage.tsx`, `components/user/*`, ruta cuenta/perfil, nav link |
| **Dependencias** | FE-IMPL-04 |
| **Riesgos** | R-P0-03, R-P0-04 |
| **Done** | Self-revoke idempotente; empty/loading/error; sin columnas admin |

### FE-IMPL-07 — Cleanup legacy + documentación

| Campo | Valor |
|-------|-------|
| **Archivos** | Eliminar deprecated admin duplicates (grep 0); actualizar `IAM_SESSION_FRONTEND_ARCHITECTURE_V1` pointer; validation report |
| **Dependencias** | FE-IMPL-05, FE-IMPL-06 |
| **Riesgos** | R-P1-04 |
| **Done** | 0 imports legacy; tsc + tests verdes; acta validación módulo |

### Diagrama dependencias

```
FE-IMPL-01 (types)
    ├── FE-IMPL-02 (services)
    │       └── FE-IMPL-04 (hooks)
    │               ├── FE-IMPL-05 (admin page)
    │               └── FE-IMPL-06 (my page)
    └── FE-IMPL-03 (shared UI)
            └── FE-IMPL-04

FE-IMPL-05 + FE-IMPL-06 → FE-IMPL-07 (cleanup)
```

---

## 10. Alineación ERP_FRONTEND_STANDARDS_V2

| Regla | Aplicación módulo |
|-------|-------------------|
| **Admin §9.1** | Reutilizar `IamSearchInput`, `IamTableEmptyState`, patrón IAM |
| **§5.11 LR-*** | Admin listado Tier C — `useAdminSessionsErpList` + `ErpPagination` + normalizer módulo |
| **ME-02** | Sin selector empresa en toolbar admin |
| **E-ME4** | Mostrar `empresa_nombre`, `nombre_usuario` — nunca UUID |
| **ER-02** | Toast error solo en hooks mutación/list onError |
| **UX-06** | ConfirmDialog `danger` en revoke |
| **SK-01 / ES-01** | InvTableSkeleton + IamTableEmptyState |
| **SR-03** | Debounce 350 ms búsqueda admin |
| **RB-01** | No renderizar revoke sin permiso admin |
| **API-01** | Solo endpoints RC1 activos |

**No aplica:** Plantilla B-F/B-L, company scope gates, `useInvRbacFormAccess`.

---

## 11. Criterios Gate arquitectónico (este documento)

| # | Criterio | Estado diseño |
|---|----------|---------------|
| G1 | Estructura módulo definida sin duplicar admin/auth | ✅ §1 |
| G2 | Shared vs exclusivo justificado | ✅ §2 |
| G3 | Hooks sin solapamiento | ✅ §3 |
| G4 | Service sin lógica UI ni UA parse | ✅ §4 |
| G5 | DTOs alineados RC1 + alias legacy | ✅ §5 |
| G6 | Migración sin ruptura ruta admin | ✅ §6 |
| G7 | Compatibilidad comportamiento crítico | ✅ §7 |
| G8 | Riesgos clasificados | ✅ §8 |
| G9 | Roadmap implementable por fases | ✅ §9 |
| G10 | Write-once — reglas en contrato/V2, diseño referencia | ✅ |

**Pendiente Gate UX (fuera alcance diseño técnico):** ruta exacta `MySessionsPage`, SessionDetailDrawer V1 vs V1.1.

---

## 12. Referencias

| Documento | Uso |
|-----------|-----|
| `ERP-IAM-SESSIONS-API-CONTRACT-V1.md` | DTOs, endpoints, prohibiciones FE |
| `ERP_FRONTEND_STANDARDS_V2.md` §5.11, §9.1 | Listados admin, componentes IAM |
| `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | Dominio auth/sesión global (no listados RC1) |
| Código referencia actual | `ActiveSessionsPage`, `useActiveSessionsList`, `session.service.ts` |

---

## Control de versiones

| Versión | Fecha | Cambio |
|---------|-------|--------|
| **1.0** | 2026-06-19 | Diseño inicial ERP-IAM-SESSIONS-FE-DESIGN-01 |

---

**Fin — ERP-IAM-SESSIONS-FE-DESIGN-01**
