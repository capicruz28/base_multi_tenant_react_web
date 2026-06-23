# ERP-IAM-SESSIONS-FE-GATE-01

**Ticket:** ERP-IAM-SESSIONS-FE-GATE-01  
**Versión:** 1.0  
**Fecha:** 2026-06-19  
**Modo:** Revisión arquitectónica crítica (READ ONLY)  
**Documento revisado:** `ERP-IAM-SESSIONS-FE-DESIGN-01` v1.0  
**Principio rector:** máxima mejora funcional · mínimo cambio arquitectónico · máxima reutilización

---

## 1. Veredicto

### **APROBADO CON AJUSTES OBLIGATORIOS**

El diseño identifica correctamente los gaps RC1 (tipos, UA parsing prohibido, self-revoke, `status`/`device`/`is_current`) y la separación admin vs usuario. Sin embargo, **sobreestima el coste estructural**: propone un módulo nuevo, renombrados masivos, micro-componentes y siete fases cuando el contrato RC1 puede cumplirse **evolucionando el árbol `features/admin/` existente** y añadiendo una sola página en `features/auth/`.

**No rechazado** — la dirección funcional es correcta.  
**No aprobado sin cambios** — la migración propuesta incrementa riesgo de regresión sin beneficio proporcional.

---

## 2. Resumen ejecutivo de ajustes

| Área | Diseño propuesto | Gate — mínimo necesario |
|------|------------------|-------------------------|
| Módulo | Nuevo `src/features/iam-sessions/` | **Rechazado** — extender in-place `features/admin/` + página en `features/auth/` |
| Página admin | Renombrar → `AdminSessionsPage` | **Mantener** `ActiveSessionsPage` |
| Hook listado admin | Renombrar → `useAdminSessionsErpList` | **Mantener** `useActiveSessionsList` (extender) |
| Hooks revoke | Dos hooks separados | **Uno:** `useRevokeSession({ mode })` |
| Componentes shared | 6+ archivos + carpetas admin/user | **2–3 extracciones** + props `variant` en views existentes |
| Fases | FE-IMPL-01…07 | **FE-IMPL-01…04** (4 fases) |
| Re-exports sprint | Obligatorio | **Eliminar** — edición in-place |
| `session-display.types.ts` | Archivo aparte | **Eliminar** |
| `session-query-keys.ts` | Archivo aparte | **Eliminar** — keys en hook existente |

---

## 3. Análisis por sección

### 3.1 Arquitectura — ¿necesario `src/features/iam-sessions/`?

**Veredicto: NO es necesario.**

**Evidencia de precedente en el repo:**

- `src/core/auth/provider/auth-provider-termination.compositor.ts` ya importa `logoutAllSessions` desde `@/features/admin/services/session.service`.
- El service de sesiones **ya es transversal** antes del diseño propuesto.
- V2 §9.1 concentra componentes IAM en `features/admin/components/iam`.
- Existe carpeta `features/admin/components/iam/sessions/` con Table/Cards operativos.

**Alternativa mínima (recomendada):**

```
src/features/admin/
├── types/session.types.ts              # Extender RC1
├── services/session.service.ts         # Extender RC1 (+ revoke self)
├── hooks/useActiveSessionsList.ts      # Extender normalizer dual envelope
├── hooks/useMySessionsList.ts          # Nuevo
├── hooks/useRevokeSession.ts           # Nuevo (único)
├── utils/iam-session-*.ts              # Refactor in-place
├── components/iam/sessions/            # Evolucionar Table/Cards (+ 2–3 shared)
└── pages/ActiveSessionsPage.tsx        # Evolucionar — mismo nombre/ruta

src/features/auth/
└── pages/MySessionsPage.tsx            # Nuevo — importa admin session layer
```

**Dependencia `auth → admin`:** aceptable y **ya establecida** en el proyecto para sesiones. Crear `iam-sessions` no elimina acoplamiento — solo lo relocaliza y obliga a migrar el import del compositor L9.

**Baseline V1:** no exige módulo nuevo; Phase-09 no aplica a este alcance.

---

### 3.2 Componentes — clasificación crítica

| Componente propuesto | Clasificación | Gate |
|---------------------|---------------|------|
| **SessionDeviceCell** | **Imprescindible** | Extraer — única fuente RC1 `device.device_label` (+ icono). Evita duplicar en Table/Cards. |
| **SessionStatusBadge** | **Imprescindible** | Extraer — reemplaza `getSessionExpirationStatus` client-side. |
| **SessionCurrentMarker** | **Conveniente** | Puede ser inline (10 líneas) en Table/Cards. Extraer solo si se usa en ≥2 sitios. |
| **SessionClientTypeIcon** | **Innecesario** (archivo aparte) | Ya existe inline en Table/Cards — mantener inline o fusionar dentro de `SessionDeviceCell`. |
| **SessionExpirationCell** | **Innecesario** | Fusionar en columna existente: fecha + `SessionStatusBadge`. |
| **SessionActionMenu** | **Innecesario** | Hoy es un botón `LogOut` — no hay menú. Mantener botón en views. |
| **AdminSessionUserCell** | **Conveniente** | Inline en `ActiveSessionsTableView` — columna admin exclusiva. |
| **AdminSessionsTableView** | **Conveniente** (rename) | **Mantener** `ActiveSessionsTableView` — editar in-place. |
| **AdminSessionsCardsView** | **Conveniente** (rename) | **Mantener** `ActiveSessionsCardsView` — editar in-place. |
| **MySessionsTableView** | **Innecesario** | `ActiveSessionsTableView` con prop `variant="self"` + `hiddenColumns`. |
| **MySessionsCardsView** | **Innecesario** | `ActiveSessionsCardsView` con `variant="self"`. |
| **SessionDetailDrawer** | **Innecesario V1** | Correctamente deferido — confirmar **fuera de alcance**. |

**Duplicación detectada en diseño:** carpetas `components/admin/` + `components/user/` duplican views que solo difieren en columnas visibles. **Una view parametrizada reduce ~4 archivos.**

**Número mínimo de componentes nuevos:** **2** (`SessionDeviceCell`, `SessionStatusBadge`). Opcional tercero si se extrae `SessionCurrentMarker`.

---

### 3.3 Hooks — simplificación

| Hook propuesto | Clasificación | Gate |
|----------------|---------------|------|
| **useAdminSessionsErpList** | **Innecesario** (rename) | Extender `useActiveSessionsList` existente. Export names estables = cero churn tests/rutas. |
| **useMySessionsList** | **Imprescindible** | Query simple `GET /sessions/`. ~40 líneas. |
| **useRevokeSessionAdmin** | **Absorbible** | |
| **useRevokeSessionSelf** | **Absorbible** | → **`useRevokeSession({ mode: 'admin' \| 'self' })`** un solo hook mutación. |

**Lógica revoke+probe:** permanecer en `executeActiveSessionRevoke` exportado desde `ActiveSessionsPage.tsx` (ya existe, tests IMPL-08/regresión Phase-03). Para MySessions: reutilizar misma función con deps `mode: 'self'` o extraer a `admin/utils/iam-session-revoke.utils.ts` **solo cuando** MySessionsPage lo necesite — no archivo separado en fase 1.

**Sobreingeniería detectada:** cuatro hooks de mutación/listado cuando **dos list + uno mutación** bastan.

---

### 3.4 Servicios

**Veredicto: un único `session.service.ts` es suficiente — permanecer en `features/admin/services/`.**

| Función | Acción |
|---------|--------|
| `getAdminSessions` | Extender — sin mover |
| `getMySessions` | Añadir (alias `getCurrentUserSessions` deprecado inline) |
| `revokeSessionAdmin` | Renombrar semántico opcional; **mantener export** `revokeSessionById` |
| `revokeSessionSelf` | Añadir |
| `logoutAllSessions` | Sin cambio — compositor L9 sigue importando mismo path |

**Wrappers innecesarios:** ningún wrapper HTTP adicional.  
**Lógica que debe permanecer donde está:** `executeActiveSessionRevoke` en page hasta segunda consumidora; normalizer en `iam-session-list-normalize.ts` existente (extender dual envelope).

---

### 3.5 Tipos

**Estrategia OpenAPI — correcta en espíritu; simplificar ejecución:**

```typescript
// Mínimo necesario (conceptual)
interface SessionDeviceRead { /* RC1 */ }
interface UserSessionRead { /* RC1 */ }
interface AdminSessionRead extends UserSessionRead { /* + admin fields */ }
```

| Propuesta diseño | Gate |
|------------------|------|
| `AdminSessionReadLegacy` rename | **Eliminar** — extender tipo existente; TypeScript forzará fixes en compile |
| `session-display.types.ts` | **Eliminar** — props en interfaces de cada component |
| Alias exports service | **Suficiente:** `getCurrentUserSessions`, `revokeSessionById` 1 sprint |
| Campos redundantes en tipos | API trae aliases (`created_at`/`issued_at`) — **tipar ambos** como RC1; UI usa canónicos |

**No duplicar** tipos en `auth/types` — single source `admin/types/session.types.ts`.

---

### 3.6 Migración — ¿minimiza riesgo?

**Veredicto: la migración strangler + re-exports del diseño NO minimiza riesgo.**

| Acción diseño | Riesgo | Gate |
|---------------|--------|------|
| Mover `session.service.ts` | Rompe compositor L9 + tests | **No mover** |
| Renombrar page/hook | Churn imports, lazy routes, regresión Phase-03 | **No renombrar** |
| Re-exports deprecated 1 sprint | Dos paths = confusión | **No re-exports** — edit in place |
| FE-IMPL-07 cleanup grep 0 | Fase entera evitable | **Eliminar fase** |

**Archivos que NO deben moverse:**

- `ActiveSessionsPage.tsx` (path y nombre)
- `useActiveSessionsList.ts`
- `session.service.ts` (path)
- `admin/routes.tsx` (solo añadir ruta auth en otro archivo)

**Refactors innecesarios:**

- Renombrado AdminSessions*
- Módulo `iam-sessions/`
- Separación `components/admin/` vs `components/user/` bajo nuevo root

---

### 3.7 Compatibilidad — checklist

| Elemento | ¿Diseño lo rompe? | Gate |
|----------|-------------------|------|
| `ActiveSessionsPage` path/nombre | Sí (rename propuesto) | Mantener |
| Ruta `/admin/sesiones` | No | OK |
| `useActiveSessionsList` exports | Sí (rename) | Mantener API pública hook |
| Permisos tenant admin | No | OK |
| Navegación admin | No | OK |
| Auto-refresh 30 s | No (si page in-place) | OK |
| `ActiveSessionsPage.post-revoke.test.ts` | Riesgo si move/rename | Mantener imports |
| `auth-phase-03-regression` | Referencia path test | No cambiar paths |
| `executeActiveSessionRevoke` export | Riesgo si extraer prematuramente | Mantener export page hasta FE-IMPL-03 |

---

### 3.8 Riesgos reclasificados

#### Crítico

| ID | Riesgo |
|----|--------|
| **RC-01** | Migración a módulo nuevo rompe import compositor L9 (`logoutAllSessions`) |
| **RC-02** | UA parsing sigue activo si FE-IMPL UI se retrasa respecto a types |
| **RC-03** | Self-revoke ausente bloquea MySessions |
| **RC-04** | Pérdida probe post-revoke sesión propia |

#### Alto

| ID | Riesgo |
|----|--------|
| **RA-01** | Renombrados masivos → churn sin valor RC1 |
| **RA-02** | Dual envelope mal normalizado |
| **RA-03** | Copy «última actividad» vs semántica `last_refresh_at` |
| **RA-04** | Micro-componentes prematuras ralentizan entrega admin RC1 |

#### Medio

| ID | Riesgo |
|----|--------|
| **RM-01** | `auth → admin` import en MySessions (aceptable) |
| **RM-02** | Ruta `/cuenta/sesiones` sin Gate UX |
| **RM-03** | Admin revoke 404 en reintento (no idempotente) |

#### Bajo

| ID | Riesgo |
|----|--------|
| **RB-01** | logoutAll UI usuario |
| **RB-02** | Filtro `usuario_id` sin UI |
| **RB-03** | SessionDetailDrawer V1.1 |

---

### 3.9 Roadmap — validación y optimización

**Diseño original:** 7 fases — **excesivo** para alcance RC1 (admin ya operativo al 80%).

#### Roadmap optimizado (4 fases)

```
FE-IMPL-01 — Fundación RC1 (types + service + normalizer)
FE-IMPL-02 — Admin alignment (utils + views in-place + ActiveSessionsPage)
FE-IMPL-03 — My Sessions (useMySessionsList + MySessionsPage + self-revoke)
FE-IMPL-04 — Validación (tests + regresión + acta)
```

#### FE-IMPL-01 — Fundación RC1

| Campo | Valor |
|-------|-------|
| **Archivos** | `admin/types/session.types.ts`, `admin/services/session.service.ts`, `admin/utils/iam-session-list-normalize.ts`, tests normalize |
| **Dependencias** | Contrato RC1 |
| **Riesgos** | RC-02, RA-02 |
| **Done** | Tipos RC1; `getMySessions`, `revokeSessionSelf`; dual envelope; **0 cambios UI** |

#### FE-IMPL-02 — Admin alignment (RC1 en pantalla existente)

| Campo | Valor |
|-------|-------|
| **Archivos** | `iam-session-display.utils.ts`, `iam-current-session.ts`, `iam-session-user-agent.utils.ts` (deprecar UA display), `ActiveSessionsTableView`, `ActiveSessionsCardsView`, `SessionDeviceCell`, `SessionStatusBadge`, `ActiveSessionsPage` |
| **Dependencias** | FE-IMPL-01 |
| **Riesgos** | RC-02, RC-04, RA-04 |
| **Done** | Admin consume `device.*`, `status`, `is_current`; sin UA parse display; tests post-revoke verdes; paridad UX |

**Fusiona diseño:** FE-IMPL-01(parcial UI utils) + FE-IMPL-03 shared + FE-IMPL-05 admin.

#### FE-IMPL-03 — My Sessions

| Campo | Valor |
|-------|-------|
| **Archivos** | `useMySessionsList.ts`, `useRevokeSession.ts`, `auth/pages/MySessionsPage.tsx`, ruta auth, reutiliza Table/Cards `variant="self"` |
| **Dependencias** | FE-IMPL-01, FE-IMPL-02 |
| **Riesgos** | RC-03, RC-04, RM-02 |
| **Done** | Self-revoke idempotente; loading/error/empty; sin columnas admin |

**Fusiona diseño:** FE-IMPL-04 hooks mutación + FE-IMPL-06.

#### FE-IMPL-04 — Validación

| Campo | Valor |
|-------|-------|
| **Archivos** | Tests tipos/normalizer/revoke; actualizar regresión si aplica; `ERP-IAM-SESSIONS-FE-VALIDATION-01` |
| **Dependencias** | FE-IMPL-02, FE-IMPL-03 |
| **Riesgos** | RM-01 |
| **Done** | tsc + tests verdes; QA manual admin + user; sin grep cleanup de módulo fantasma |

**Elimina diseño:** FE-IMPL-07 (no hay módulo que limpiar).

#### Fases eliminadas y motivo

| Fase diseño | Motivo eliminación |
|-------------|-------------------|
| FE-IMPL-03 (shared standalone) | Absorbida en FE-IMPL-02 |
| FE-IMPL-05 (AdminSessionsPage migration) | Reemplazada por edit in-place FE-IMPL-02 |
| FE-IMPL-07 (cleanup legacy) | Innecesaria sin módulo nuevo |

---

### 3.10 Simplificaciones explícitas

| Elemento | Acción Gate |
|----------|-------------|
| Módulo `iam-sessions/` | **Eliminar del diseño** |
| `useAdminSessionsErpList` | **Eliminar** — usar `useActiveSessionsList` |
| `useRevokeSessionAdmin` + `useRevokeSessionSelf` | **Fusionar** → `useRevokeSession` |
| `session-query-keys.ts` | **Eliminar** |
| `session-display.types.ts` | **Eliminar** |
| `session-revoke-orchestration.ts` (prematuro) | **Diferir** — usar export page existente |
| `SessionActionMenu` | **Eliminar** |
| `SessionExpirationCell` | **Eliminar** |
| `SessionClientTypeIcon` (archivo) | **Eliminar** |
| `MySessionsTableView` / `MySessionsCardsView` | **Eliminar** — variant en views existentes |
| Renombrar `AdminSessionReadLegacy` | **Eliminar** |
| Re-exports sprint deprecated | **Eliminar** |
| 7 fases implementación | **Reducir a 4** |

**Normalizador:** extender `iam-session-list-normalize.ts` — **no** crear `session-list-normalize.ts` paralelo.

**Duplicación tipos:** prohibido tipos en `auth/` — single source admin.

---

## 4. Ajustes obligatorios al diseño (bloqueantes pre-FE-IMPL-01)

1. **Abandonar** creación de `src/features/iam-sessions/` — evolucionar `features/admin/` + `features/auth/pages/MySessionsPage.tsx`.
2. **Mantener** nombres estables: `ActiveSessionsPage`, `useActiveSessionsList`, `ActiveSessionsTableView`, `ActiveSessionsCardsView`.
3. **Mantener** `session.service.ts` en `features/admin/services/` (compositor L9 depende del path).
4. **Reducir** componentes nuevos a **2 imprescindibles** (`SessionDeviceCell`, `SessionStatusBadge`); views existentes con prop `variant`.
5. **Unificar** hooks mutación en **`useRevokeSession({ mode })`**.
6. **Adoptar** roadmap **4 fases** (§3.9).
7. **Actualizar** DESIGN-01 o tratar este Gate como addendum normativo antes de implementar.

---

## 5. Componentes a eliminar del diseño

- `SessionActionMenu`
- `SessionExpirationCell` (como componente)
- `SessionClientTypeIcon` (como archivo separado)
- `MySessionsTableView`
- `MySessionsCardsView`
- `AdminSessionsPage` (nombre — usar existente)
- `AdminSessionsTableView` / `AdminSessionsCardsView` (renames)
- Carpeta `iam-sessions/components/user/`
- `session-display.types.ts`

---

## 6. Hooks a simplificar

| Antes (diseño) | Después (gate) |
|----------------|----------------|
| `useAdminSessionsErpList` | **`useActiveSessionsList`** (extend) |
| `useMySessionsList` | **`useMySessionsList`** (sin cambio) |
| `useRevokeSessionAdmin` | **`useRevokeSession({ mode: 'admin' })`** |
| `useRevokeSessionSelf` | **`useRevokeSession({ mode: 'self' })`** |

---

## 7. Servicios — sin fusión adicional

Un solo archivo **`features/admin/services/session.service.ts`** — añadir métodos RC1, no mover, no duplicar en auth.

---

## 8. Archivos a eliminar del plan (no crear)

Todo el árbol `src/features/iam-sessions/**`  
`session-query-keys.ts`  
`session-display.types.ts`  
`session-revoke-orchestration.ts` (hasta FE-IMPL-03 si MySessions lo requiere)  
Re-exports deprecated en paths legacy

---

## 9. Criterios para iniciar FE-IMPL-01

| # | Criterio | Responsable |
|---|----------|-------------|
| C1 | Gate-01 aprobado — DESIGN-01 actualizado o addendum referenciado | Arquitectura |
| C2 | OpenAPI / RC1 congelado — sin cambios BE | Backend sign-off |
| C3 | Alcance V1 acotado: **sin** SessionDetailDrawer, **sin** logoutAll UI, **sin** módulo nuevo | Producto/FE |
| C4 | Ruta MySessions definida (Gate UX mínimo) o FE-IMPL-03 bloqueada solo en routing | UX |
| C5 | Lista archivos in-place confirmada (§3.1 alternativa mínima) | FE lead |
| C6 | Tests existentes inventariados: `post-revoke`, `iam-current-session`, Phase-03 regression | QA/FE |

**FE-IMPL-01 puede iniciar cuando C1–C3 y C5 estén cumplidos.** C4 puede paralelizarse antes de FE-IMPL-03.

---

## 10. Alineación estándares (sin cambios)

| Estándar | Cumplimiento gate |
|----------|-------------------|
| V2 §9.1 Admin IAM | Mantener componentes bajo `admin/components/iam` |
| V2 §5.11 listados | `useActiveSessionsList` + `ErpPagination` — sin rename |
| RC1 §9 prohibiciones | Eliminar UA parse — **obligatorio FE-IMPL-02** |
| Baseline V1 | No aplica refactor provider |
| ER-02 | Toast en hook `onError` — `useRevokeSession` |

---

## 11. Conclusión

El diseño FE-DESIGN-01 es **funcionalmente sólido** pero **estructuralmente sobredimensionado** para V1 RC1. La pantalla admin ya existe con paginación, tests y integración L9; el trabajo real es **alinear tipos/display con RC1** y **añadir MySessions**.

**Mínimo cambio arquitectónico = edit in place + 2 componentes + 3 hooks + 1 página auth.**

Con los ajustes obligatorios de este Gate, la implementación puede iniciar con **riesgo P0 controlado** y **~40% menos superficie de migración** que el diseño original.

---

## Control de versiones

| Versión | Fecha | Cambio |
|---------|-------|--------|
| **1.0** | 2026-06-19 | Gate crítico ERP-IAM-SESSIONS-FE-GATE-01 |

---

**Fin — ERP-IAM-SESSIONS-FE-GATE-01**
