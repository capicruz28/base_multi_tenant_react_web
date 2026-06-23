# ERP-IAM-SESSIONS-FE-IMPLEMENTATION-PLAN-01

**Ticket:** ERP-IAM-SESSIONS-FE-IMPLEMENTATION-PLAN-01  
**Versión:** 1.0  
**Fecha:** 2026-06-19  
**Estado:** **OFICIAL — Plan definitivo de implementación**  
**Precedencia normativa:** `ERP-IAM-SESSIONS-FE-GATE-01` > `ERP-IAM-SESSIONS-FE-DESIGN-01` (solo donde no contradiga Gate)

**Contrato Backend:** `ERP-IAM-SESSIONS-API-CONTRACT-V1.md` (RC1 congelado)  
**Estándares:** `ERP_FRONTEND_STANDARDS_V2.md` v2.4 · `ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` v1.2

---

## 1. Resumen ejecutivo

### 1.1 Qué se implementará

| Entrega | Descripción |
|---------|-------------|
| **Fundación RC1** | Tipos OpenAPI (`SessionDeviceRead`, `UserSessionRead`, `AdminSessionRead`), service extendido, normalizer dual envelope (`items`/`total` + legacy). |
| **Admin Sesiones Activas** | Evolución in-place de `/admin/sesiones` — consume `device.*`, `status`, `is_current`; elimina parseo UA en display; mantiene paginación, sort, filtros, auto-refresh, revoke admin, probe post-revoke. |
| **My Sessions (usuario)** | Nueva página self-service — listado `GET /sessions/`, self-revoke idempotente `POST …/revoke/`, reutiliza Table/Cards con `variant="self"`. |
| **Hooks** | `useActiveSessionsList` (extend), `useMySessionsList` (nuevo), `useRevokeSession({ mode })` (único hook mutación). |
| **Componentes nuevos** | Solo `SessionDeviceCell` y `SessionStatusBadge`. |
| **Validación** | Tests unitarios + regresión existente + acta QA. |

### 1.2 Qué NO se implementará

| Excluido | Motivo |
|----------|--------|
| Módulo `src/features/iam-sessions/` | Rechazado por Gate |
| Renombrar `ActiveSessionsPage`, hooks o views | Gate — cero churn |
| `AdminSessionsPage`, `useAdminSessionsErpList` | Invalidado |
| `SessionActionMenu`, `SessionExpirationCell`, `SessionClientTypeIcon` (archivo) | Innecesarios |
| `MySessionsTableView`, `MySessionsCardsView` | Reemplazados por `variant` |
| `SessionDetailDrawer` | Fuera alcance V1 |
| UI `logoutAllSessions` | RB-01 — fuera V1 |
| Filtro UI `usuario_id` admin | RB-02 — API ready, UI backlog |
| Re-exports deprecated / strangler sprint | Gate — edit in-place |
| `session-query-keys.ts`, `session-display.types.ts` | Gate — eliminados |
| Cambios Backend / OpenAPI | Restricción proyecto |
| Cambios Auth Provider / compositors L9 | Restricción explícita |
| Cambios `core/auth/session/*` | Fuera alcance |

---

## 2. Inventario definitivo de archivos

### 2.1 Crear

| Archivo | Fase |
|---------|------|
| `src/features/admin/components/iam/sessions/SessionDeviceCell.tsx` | FE-IMPL-02 |
| `src/features/admin/components/iam/sessions/SessionStatusBadge.tsx` | FE-IMPL-02 |
| `src/features/admin/hooks/useMySessionsList.ts` | FE-IMPL-03 |
| `src/features/admin/hooks/useRevokeSession.ts` | FE-IMPL-03 |
| `src/features/admin/utils/iam-session-revoke.utils.ts` | FE-IMPL-03 |
| `src/features/auth/pages/MySessionsPage.tsx` | FE-IMPL-03 |
| `src/features/admin/utils/__tests__/iam-session-list-normalize.test.ts` | FE-IMPL-01 |
| `src/features/admin/hooks/__tests__/useMySessionsList.test.ts` | FE-IMPL-04 |
| `src/features/admin/hooks/__tests__/useRevokeSession.test.ts` | FE-IMPL-04 |
| `docs/arquitectura/ERP-IAM-SESSIONS-FE-VALIDATION-01.md` | FE-IMPL-04 |

### 2.2 Modificar

| Archivo | Fase | Alcance |
|---------|------|---------|
| `src/features/admin/types/session.types.ts` | FE-IMPL-01 | DTOs RC1 completos |
| `src/features/admin/services/session.service.ts` | FE-IMPL-01 | `getMySessions`, `revokeSessionSelf`; tipos RC1; mantener `revokeSessionById`, `getCurrentUserSessions` |
| `src/features/admin/utils/iam-session-list-normalize.ts` | FE-IMPL-01 | Dual envelope `items`/`total` |
| `src/features/admin/utils/iam-session-display.utils.ts` | FE-IMPL-02 | RC1 fields; deprecar paths UA; badge usa `status` |
| `src/features/admin/utils/iam-current-session.ts` | FE-IMPL-02 | Preferir `session.is_current`; fallback `current_token_id` |
| `src/features/admin/utils/iam-session-user-agent.utils.ts` | FE-IMPL-02 | Comentario DEPRECATED display; sin uso en Table/Cards |
| `src/features/admin/components/iam/sessions/ActiveSessionsTableView.tsx` | FE-IMPL-02 | RC1 cells + prop `variant` preparada |
| `src/features/admin/components/iam/sessions/ActiveSessionsCardsView.tsx` | FE-IMPL-02 | Idem |
| `src/features/admin/pages/ActiveSessionsPage.tsx` | FE-IMPL-02, FE-IMPL-03 | RC1 wiring; import revoke utils; re-export `executeActiveSessionRevoke` |
| `src/features/admin/hooks/useActiveSessionsList.ts` | FE-IMPL-01 | Tipos RC1; sin rename exports |
| `src/features/admin/utils/__tests__/iam-current-session.utils.test.ts` | FE-IMPL-02 | Casos `is_current` |
| `src/features/admin/pages/__tests__/ActiveSessionsPage.post-revoke.test.ts` | FE-IMPL-03 | Import revoke utils si se extrae |
| `src/app/router/app-route-tree.tsx` | FE-IMPL-03 | Ruta `/app/cuenta/sesiones` |
| `src/shared/components/layout/Header.tsx` | FE-IMPL-03 | Enlace navegación «Mis sesiones» (mínimo) |

### 2.3 No tocar

| Archivo / área | Motivo |
|----------------|--------|
| `src/features/admin/routes.tsx` | Ruta `/admin/sesiones` y lazy import sin cambio |
| `src/core/auth/provider/**` | Restricción explícita — incluye `auth-provider-termination.compositor.ts` |
| `src/core/auth/session/**` | Dominio congelado Phase-09 |
| `src/shared/context/AuthContext.tsx` | Sin cambios contrato `useAuth()` |
| `src/app/provider.tsx` | Provider tree invariante |
| `src/core/list/**` | Sin adaptadores globales nuevos |
| `ERP-IAM-SESSIONS-API-CONTRACT-V1.md` | Backend congelado |
| OpenAPI / `docs/api/*` | Restricción |
| Todo `src/features/iam-sessions/**` | No crear |
| `src/features/auth/services/auth.service.ts` | Sin duplicar HTTP sesiones |
| Regresiones auth Phase-01…09 (paths) | Solo ejecutar; no editar salvo import roto |

---

## 3. Roadmap definitivo (4 fases)

### FE-IMPL-01 — Fundación RC1

**Objetivo:** Tipos, service y normalizer alineados RC1. **Cero cambios visibles en UI.**

| Campo | Detalle |
|-------|---------|
| **Archivos** | `session.types.ts`, `session.service.ts`, `iam-session-list-normalize.ts`, `useActiveSessionsList.ts` (solo tipos/queryFn si compile exige), `iam-session-list-normalize.test.ts` |
| **Dependencias** | RC1 congelado; Gate-01 aprobado |
| **Riesgos** | RC-02 (tipos sin UI), RA-02 (dual envelope) |
| **Pruebas** | Unit: normalizer (`items`/`total`, `sessions`/`total_sesiones`, array legacy). `tsc --noEmit`. Suite existente sin regresión. |
| **Rollback** | Revert commit FE-IMPL-01; UI intacta |
| **Definition of Done** | D01-1: `SessionDeviceRead`, `UserSessionRead`, `AdminSessionRead` tipados RC1. D01-2: `getMySessions()`, `revokeSessionSelf()` en service. D01-3: `revokeSessionById`, `getCurrentUserSessions`, `logoutAllSessions` sin cambio de firma export. D01-4: Normalizer dual envelope verde. D01-5: `npx tsc --noEmit` PASS. D01-6: Sin cambios Table/Cards/Page. |

---

### FE-IMPL-02 — Admin alignment RC1

**Objetivo:** Pantalla admin existente consume campos RC1; elimina violaciones contrato §9 en display.

| Campo | Detalle |
|-------|---------|
| **Archivos** | `iam-session-display.utils.ts`, `iam-current-session.ts`, `iam-session-user-agent.utils.ts`, `SessionDeviceCell.tsx`, `SessionStatusBadge.tsx`, `ActiveSessionsTableView.tsx`, `ActiveSessionsCardsView.tsx`, `ActiveSessionsPage.tsx`, `iam-current-session.utils.test.ts` |
| **Dependencias** | FE-IMPL-01 completo |
| **Riesgos** | RC-02, RC-04, RA-03, RA-04 |
| **Pruebas** | Unit: current session (`is_current` + fallback). `ActiveSessionsPage.post-revoke.test.ts` PASS sin cambio semántico. Manual QA admin checklist §7.1. |
| **Rollback** | Revert FE-IMPL-02; FE-IMPL-01 types/service permanecen compatibles |
| **Definition of Done** | D02-1: Columnas dispositivo/navegador usan `device.device_label`, `device.browser`, `device.os`. D02-2: Badge usa `status` Backend. D02-3: Marcador sesión actual usa `is_current` (fallback token). D02-4: Sin `formatBrowserLabel(user_agent)` en Table/Cards. D02-5: Copy columnas: «Emitida» (`issued_at`), «Último refresh» (`last_refresh_at`). D02-6: `empresa_nombre` visible admin si columna aplica. D02-7: Auto-refresh 30s, paginación, sort, filtros, ConfirmDialog revoke intactos. D02-8: `executeActiveSessionRevoke` export page intacto. D02-9: `variant?: 'admin' \| 'self'` en views (default `'admin'`) preparado para FE-IMPL-03. |

---

### FE-IMPL-03 — My Sessions + self-revoke

**Objetivo:** Vista usuario autenticado; self-revoke idempotente; reutilización views existentes.

| Campo | Detalle |
|-------|---------|
| **Archivos** | `useMySessionsList.ts`, `useRevokeSession.ts`, `iam-session-revoke.utils.ts`, `MySessionsPage.tsx`, `app-route-tree.tsx`, `Header.tsx`, `ActiveSessionsPage.tsx` (import utils), `ActiveSessionsTableView/CardsView` (`variant="self"`), `post-revoke.test.ts` (imports) |
| **Dependencias** | FE-IMPL-01, FE-IMPL-02 |
| **Riesgos** | RC-03, RC-04, RM-01, RM-02 |
| **Pruebas** | Unit hooks revoke/list. Manual QA user. Post-revoke probe si cierra sesión actual. |
| **Rollback** | Revert FE-IMPL-03; admin FE-IMPL-02 operativo |
| **Definition of Done** | D03-1: Ruta **`/app/cuenta/sesiones`** registrada bajo `ProtectedRoute requireOperationalUser`. D03-2: `MySessionsPage` lista sesiones propias. D03-3: Self-revoke vía `useRevokeSession({ mode: 'self' })`. D03-4: Idempotencia 200 confiada al Backend. D03-5: Sin columnas admin (`nombre_usuario`, etc.). D03-6: Loading/error/empty (IamTableEmptyState / skeleton patrón admin). D03-7: `executeActiveSessionRevoke` movido a `iam-session-revoke.utils.ts`; page re-exporta para tests Phase-03. D03-8: Probe post-revoke sesión actual en flujo self. D03-9: Enlace Header «Mis sesiones». |

---

### FE-IMPL-04 — Validación y cierre

**Objetivo:** Evidencia formal; suite verde; acta QA.

| Campo | Detalle |
|-------|---------|
| **Archivos** | Tests hooks; `ERP-IAM-SESSIONS-FE-VALIDATION-01.md`; ajustes menores tests regresión si imports |
| **Dependencias** | FE-IMPL-02, FE-IMPL-03 |
| **Riesgos** | RM-01 |
| **Pruebas** | `npx tsc --noEmit`; `npx vitest run` admin session + auth phase-03 paths; checklist QA §7 |
| **Rollback** | N/A — fase documental |
| **Definition of Done** | D04-1: Acta validation publicada. D04-2: 100% tests sesiones PASS. D04-3: QA manual admin + user PASS. D04-4: Grep confirma 0 referencias display a `parseUserAgentSummary` en Table/Cards. D04-5: Grep confirma 0 path `features/iam-sessions`. D04-6: Compositor L9 import `logoutAllSessions` path unchanged. |

---

## 4. Orden exacto de implementación

> **Regla:** completar cada fase y su DoD antes de iniciar la siguiente. Dentro de fase, respetar orden de archivo.

### FE-IMPL-01 (orden obligatorio)

1. `src/features/admin/types/session.types.ts`
2. `src/features/admin/utils/iam-session-list-normalize.ts`
3. `src/features/admin/utils/__tests__/iam-session-list-normalize.test.ts` → ejecutar tests
4. `src/features/admin/services/session.service.ts`
5. `src/features/admin/hooks/useActiveSessionsList.ts` (ajustes compile mínimos)
6. `npx tsc --noEmit`
7. `npx vitest run src/features/admin/utils/__tests__/iam-session-list-normalize.test.ts`

### FE-IMPL-02 (orden obligatorio)

1. `src/features/admin/utils/iam-current-session.ts`
2. `src/features/admin/utils/__tests__/iam-current-session.utils.test.ts` → tests
3. `src/features/admin/utils/iam-session-display.utils.ts`
4. `src/features/admin/utils/iam-session-user-agent.utils.ts` (solo DEPRECATED comment)
5. `src/features/admin/components/iam/sessions/SessionStatusBadge.tsx`
6. `src/features/admin/components/iam/sessions/SessionDeviceCell.tsx`
7. `src/features/admin/components/iam/sessions/ActiveSessionsTableView.tsx`
8. `src/features/admin/components/iam/sessions/ActiveSessionsCardsView.tsx`
9. `src/features/admin/pages/ActiveSessionsPage.tsx`
10. `npx tsc --noEmit`
11. `npx vitest run src/features/admin`
12. QA manual admin (checklist §7.1)

### FE-IMPL-03 (orden obligatorio)

1. `src/features/admin/utils/iam-session-revoke.utils.ts` (mover lógica desde page)
2. `src/features/admin/pages/ActiveSessionsPage.tsx` (import utils + re-export)
3. `src/features/admin/pages/__tests__/ActiveSessionsPage.post-revoke.test.ts` (ajustar import si necesario)
4. `src/features/admin/hooks/useRevokeSession.ts`
5. `src/features/admin/hooks/useMySessionsList.ts`
6. `ActiveSessionsTableView.tsx` + `ActiveSessionsCardsView.tsx` (`variant="self"`, columnas ocultas)
7. `src/features/auth/pages/MySessionsPage.tsx`
8. `src/app/router/app-route-tree.tsx`
9. `src/shared/components/layout/Header.tsx`
10. `npx tsc --noEmit`
11. `npx vitest run src/features/admin/pages/__tests__/ActiveSessionsPage.post-revoke.test.ts`
12. QA manual user (checklist §7.2)

### FE-IMPL-04 (orden obligatorio)

1. `src/features/admin/hooks/__tests__/useRevokeSession.test.ts`
2. `src/features/admin/hooks/__tests__/useMySessionsList.test.ts`
3. `npx vitest run src/features/admin src/shared/context/__tests__/auth-phase-03-regression.test.ts src/shared/context/__tests__/auth-phase-03-integration.test.ts`
4. Grep validaciones §8
5. `docs/arquitectura/ERP-IAM-SESSIONS-FE-VALIDATION-01.md`
6. Sign-off implementación

---

## 5. Compatibilidad

| Elemento | Estrategia | Estado post-plan |
|----------|------------|------------------|
| **ActiveSessionsPage** | Mismo path, nombre, export `executeActiveSessionRevoke` (re-export) | ✅ Compatible |
| **Ruta `/admin/sesiones`** | `admin/routes.tsx` sin editar | ✅ Compatible |
| **Ruta `/app/cuenta/sesiones`** | Nueva — no colisiona | ✅ Aditiva |
| **useActiveSessionsList** | Mismos exports: query key, constants, hook signature extendida | ✅ Compatible |
| **Auth Provider / compositors** | No editar; `logoutAllSessions` import path fijo | ✅ Compatible |
| **Tests post-revoke** | Re-export o import utils; paths test sin cambio | ✅ Compatible |
| **auth-phase-03-regression** | Paths fuente inalterados | ✅ Compatible |
| **Auto-refresh 30s** | Lógica permanece en `ActiveSessionsPage` | ✅ Compatible |
| **Permisos** | Admin: `requireTenantAdmin` sin cambio; User: `ProtectedRoute` operativo | ✅ Compatible |
| **Navegación admin** | Menú admin existente a sesiones | ✅ Compatible |
| **ErpPagination / debounce** | Sin cambio hook contract | ✅ Compatible |

---

## 6. Matriz de riesgos (post-Gate)

### Crítico

| ID | Riesgo | Mitigación | Fase |
|----|--------|------------|------|
| **RC-01** | Tocar compositor L9 / mover service | No mover `session.service.ts` | Todas |
| **RC-02** | UA parsing persiste en UI | FE-IMPL-02 obligatorio; grep D04-4 | FE-IMPL-02, 04 |
| **RC-03** | Self-revoke ausente | `revokeSessionSelf` FE-IMPL-01; hook FE-IMPL-03 | 01, 03 |
| **RC-04** | Pérdida probe post-revoke | `iam-session-revoke.utils.ts` preserva IMPL-08 | 02, 03 |

### Alto

| ID | Riesgo | Mitigación | Fase |
|----|--------|------------|------|
| **RA-01** | Renombrados | Plan prohíbe renombrar | — |
| **RA-02** | Dual envelope roto | Tests normalizer FE-IMPL-01 | 01 |
| **RA-03** | Copy semántico incorrecto | DoD D02-5 copy review | 02 |
| **RA-04** | Scope creep componentes | Máximo 2 componentes nuevos | 02 |

### Medio

| ID | Riesgo | Mitigación | Fase |
|----|--------|------------|------|
| **RM-01** | `auth → admin` imports MySessions | Precedente compositor L9 | 03 |
| **RM-02** | Ruta user no descubierta | Header link FE-IMPL-03 | 03 |
| **RM-03** | Admin revoke 404 reintento | Mensaje error claro; no idempotencia admin | 02 |

### Bajo

| ID | Riesgo | Notas |
|----|--------|-------|
| **RB-01** | logoutAll UI | Fuera V1 |
| **RB-02** | Filtro usuario_id | Backlog |
| **RB-03** | SessionDetailDrawer | V1.1 |

---

## 7. Validaciones QA por fase

### FE-IMPL-01

- [ ] `tsc --noEmit` PASS
- [ ] Tests normalizer PASS (3 modos respuesta)
- [ ] `/admin/sesiones` carga igual que antes (smoke visual)
- [ ] Network: admin list sigue llamando `/auth/sessions/admin/?page=…`

### FE-IMPL-02

- [ ] Admin listado muestra `device.device_label` (no UUID — E-ME4)
- [ ] Badge «Expira pronto» coincide con `status: expiring_soon` Backend
- [ ] «Tu sesión» aparece en fila con `is_current: true`
- [ ] Revoke admin + ConfirmDialog danger funciona
- [ ] Revoke sesión propia dispara probe (consola limpia / redirect esperado)
- [ ] Auto-refresh 30s operativo
- [ ] Paginación, búsqueda, filtro client_type, sort operativos
- [ ] Empty / skeleton / error + reintentar
- [ ] Tests `post-revoke` PASS

### FE-IMPL-03

- [ ] `/app/cuenta/sesiones` accesible usuario operativo autenticado
- [ ] Listado solo sesiones propias
- [ ] Self-revoke cierra sesión remota; reintento idempotente sin error usuario
- [ ] Revocar sesión actual → probe / logout coherente
- [ ] Sin columnas admin visibles
- [ ] Enlace Header funcional

### FE-IMPL-04

- [ ] Suite vitest admin + phase-03 PASS
- [ ] Acta `ERP-IAM-SESSIONS-FE-VALIDATION-01.md` completa
- [ ] Checklist RC1 §9 prohibiciones verificado (sin UA parse display, sin calcular status)
- [ ] Import compositor: `@/features/admin/services/session.service` intacto

---

## 8. Restricciones confirmadas

| Restricción | Confirmación |
|-------------|--------------|
| No mover archivos | ✅ Solo crear nuevos listados §2.1; edit in-place §2.2 |
| No crear módulo `iam-sessions` | ✅ Prohibido |
| No romper imports existentes | ✅ Re-export `executeActiveSessionRevoke`; service path fijo |
| No modificar Backend | ✅ |
| No modificar OpenAPI | ✅ |
| No modificar Auth Provider | ✅ |
| No modificar compositors L9 | ✅ |
| No modificar infraestructura compartida | ✅ `core/list`, `core/api`, providers intactos |
| No re-exports sprint | ✅ |
| No wrappers HTTP adicionales | ✅ |
| Toast error solo hook onError (ER-02) | ✅ `useRevokeSession` |
| Single source types `admin/types/session.types.ts` | ✅ |

---

## 9. Contrato service — referencia única

| Función export | Endpoint | Consumidor |
|----------------|----------|------------|
| `getAdminSessions` | GET `/auth/sessions/admin/` | `useActiveSessionsList` |
| `getMySessions` | GET `/auth/sessions/` | `useMySessionsList` |
| `getCurrentUserSessions` | alias → `getMySessions` | Deprecated comment inline |
| `revokeSessionById` | POST `…/revoke_admin/` | `useRevokeSession({ mode: 'admin' })` |
| `revokeSessionSelf` | POST `…/revoke/` | `useRevokeSession({ mode: 'self' })` |
| `logoutAllSessions` | POST `/auth/logout_all/` | compositor L9 — **no modificar** |

---

## 10. Prop `variant` en views (contrato UI)

| `variant` | Columnas visibles | Acción revoke |
|-----------|-------------------|---------------|
| `'admin'` (default) | Usuario, tipo, dispositivo, navegador, IP, fechas, expira, acciones | `revoke_admin` |
| `'self'` | Dispositivo, empresa, tipo, fechas, expira, acciones | `revoke` self |

Implementar ocultación por configuración columnas — **un solo par Table/Cards**, no duplicar archivos.

---

## 11. Criterios de inicio FE-IMPL-01

| # | Criterio | Estado requerido |
|---|----------|------------------|
| 1 | Gate-01 aprobado | ✅ Este plan lo implementa |
| 2 | RC1 Backend congelado | Confirmar con BE |
| 3 | Alcance V1 acotado §1.2 | ✅ |
| 4 | Inventario archivos §2 | ✅ |
| 5 | Sin work in progress en `features/admin` sesiones | Confirmar branch |

---

## 12. Diagrama de dependencias

```
FE-IMPL-01 (types + service + normalizer)
        │
        ▼
FE-IMPL-02 (admin UI RC1 + 2 componentes)
        │
        ├──────────────────┐
        ▼                  ▼
FE-IMPL-03 (MySessions)   (admin ya en prod-like)
        │
        ▼
FE-IMPL-04 (validación + acta)
```

---

## 13. Control de versiones

| Versión | Fecha | Cambio |
|---------|-------|--------|
| **1.0** | 2026-06-19 | Plan definitivo post Gate-01 — único camino autorizado |

**Supersede:** decisiones contradictorias en `ERP-IAM-SESSIONS-FE-DESIGN-01` (módulo nuevo, 7 fases, renombrados).

---

**Fin — ERP-IAM-SESSIONS-FE-IMPLEMENTATION-PLAN-01**
