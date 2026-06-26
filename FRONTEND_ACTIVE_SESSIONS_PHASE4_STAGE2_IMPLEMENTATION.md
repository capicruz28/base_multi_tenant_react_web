# FRONTEND — Active Sessions Enterprise — Fase 4 Stage 2 Implementation

**Documento:** `FRONTEND_ACTIVE_SESSIONS_PHASE4_STAGE2_IMPLEMENTATION.md`  
**Versión:** 1.0  
**Fecha:** 2026-06-23  
**Especificación:** `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_2.md` §9.3, §13 Fase 4  
**Auditoría base:** `FRONTEND_ACTIVE_SESSIONS_CARDS_ARCHITECTURE_AUDIT.md` §13.2 pasos 4.7–4.12  
**Prerequisito:** `FRONTEND_ACTIVE_SESSIONS_PHASE4_STAGE1_IMPLEMENTATION.md`  
**Estado:** **COMPLETADO**

**Alcance Stage 2:** Paridad funcional Lista ↔ Cards admin; composición `SessionAdminCard` + `SessionSelfCard`; wiring `onViewDetail`; grid Desktop First compacto.  
**Fuera de alcance:** Backend, OpenAPI, hooks, servicios, Toolbar, KPIs, Dialog, Tabla, shared Stage 1 (salvo correcciones menores — ninguna requerida).

---

## 0. Resumen ejecutivo

Se completó la **paridad funcional** entre la vista Lista (tabla admin) y la vista Cards admin, reutilizando exclusivamente los primitivos shared de Stage 1.

`ActiveSessionsCardsView` quedó reducido a **contenedor grid** que delega en `SessionAdminCard` (admin) o `SessionSelfCard` (self). La page admin cablea `onViewDetail={handleViewDetail}` hacia Cards con el mismo handler que la tabla.

**Validación:** `npx vitest run src/features/admin` → **24 files, 107 passed, 0 failed** (+2 tests nuevos admin cards).

---

## 1. Arquitectura final

```
ActiveSessionsPage
├── ActiveSessionsTableView (admin)     ← sin cambios Stage 2
│   └── shared/* (Stage 1)
└── ActiveSessionsCardsView (contenedor)
    ├── variant=admin → SessionAdminCard
    │   ├── SessionUsuarioBlock
    │   ├── SessionClienteLine → SessionClientTypeIcon + SessionClientTypeChip
    │   ├── SessionIpLine
    │   ├── SessionEstadoLine → SessionStatusBadge
    │   └── SessionListActions (Eye + LogOut)
    └── variant=self → SessionSelfCard (comportamiento legacy)

MySessionsPage
└── ActiveSessionsCardsView variant=self → SessionSelfCard
```

**Principio:** Cards admin no reimplementa lógica de presentación; compone los mismos bloques que la fila de tabla.

---

## 2. Nuevos componentes

| Archivo | Responsabilidad |
|---------|-----------------|
| `SessionAdminCard.tsx` | Card admin compacta (`p-3`); paridad columnas tabla; acciones Eye + LogOut vía `SessionListActions`; sin campos avanzados en superficie |
| `SessionSelfCard.tsx` | Card self extraída del monolito legacy; mismo comportamiento (fechas absolutas, CTA full-width, `SessionDeviceCell`); `p-5` conservado |

### 2.1 `SessionAdminCard` — layout

| Zona | Contenido | Equivalente tabla |
|------|-----------|-------------------|
| Header | `SessionUsuarioBlock` | Columna Usuario |
| Cuerpo | `SessionClienteLine`, `SessionIpLine`, `SessionEstadoLine` | Columnas Cliente, IP, Estado |
| Footer | `SessionListActions` | Columna Acciones |

**Eliminado de superficie card admin (solo en `SessionDetailDialog`):**

- Emitida
- Browser / OS explícitos
- Fechas absolutas (`formatIssuedAt`, `formatSessionDateTime` en card)
- Información duplicada (device label repetido, etc.)

### 2.2 `SessionSelfCard` — sin delta funcional

- Conserva copy CTA: «Cerrar esta sesión» / «Cerrar sesión»
- Conserva densidad `p-5`, iconografía Calendar/Globe/Monitor
- Reutiliza `SessionClientTypeIcon` shared (alineación arquitectónica)
- **No** recibe `onViewDetail` (self no tiene Eye en spec)

---

## 3. Componentes reutilizados (Stage 1 shared)

| Shared | Uso en SessionAdminCard | Uso indirecto |
|--------|-------------------------|---------------|
| `SessionUsuarioBlock` | Header usuario/nombre/empresa + marker | — |
| `SessionClienteLine` | Línea cliente | `SessionClientTypeIcon`, `SessionClientTypeChip` |
| `SessionIpLine` | IP + mismatch `AlertTriangle` | — |
| `SessionEstadoLine` | Refresh relativo + expira relativo + badge | `SessionStatusBadge` |
| `SessionListActions` | Eye + LogOut | — |
| `session-view.types.ts` | Tipo `ActiveSessionsViewVariant` | Import directo en CardsView |

**Otros reutilizados (pre-Stage 1):**

- `SessionCurrentMarker` / `getCurrentSessionCardClass` — highlight sesión actual
- `resolveSessionId` — keys estables en grid

---

## 4. Cambios en contenedor y page

### 4.1 `ActiveSessionsCardsView.tsx`

| Antes (pre-Stage 2) | Después |
|---------------------|---------|
| Monolito ~200 LOC con lógica admin/self inline | Contenedor ~60 LOC |
| Sin `onViewDetail` | Prop opcional `onViewDetail` → `SessionAdminCard` |
| Grid `p-4`, columnas menos densas | `grid gap-3 p-3`; `xl:grid-cols-4`; `2xl:grid-cols-5` |
| `ClientTypeIcon` / helpers duplicados | Eliminados — admin usa shared |

### 4.2 `ActiveSessionsPage.tsx`

Único wiring añadido:

```tsx
<ActiveSessionsCardsView
  ...
  onViewDetail={handleViewDetail}
/>
```

Mismo `handleViewDetail` que alimenta `ActiveSessionsTableView` → abre `SessionDetailDialog`.

---

## 5. Comparación Lista vs Cards (admin)

| Dimensión | Lista (tabla) | Cards admin | Paridad |
|-----------|---------------|-------------|---------|
| Usuario / nombre / empresa | `SessionUsuarioBlock` | `SessionUsuarioBlock` | ✅ |
| Cliente (icon + chip + label) | `SessionClienteLine` | `SessionClienteLine` | ✅ |
| IP última + mismatch | `SessionIpLine` | `SessionIpLine` | ✅ |
| Estado (refresh + expira relativo + badge) | `SessionEstadoLine` | `SessionEstadoLine` | ✅ |
| Ver detalle (Eye) | `SessionListActions` → `onViewDetail` | Idem | ✅ |
| Cerrar sesión (LogOut) | `SessionListActions` → `onRevoke` | Idem | ✅ |
| Sesión actual (marker + borde) | Fila `data-current-session` | Card `data-current-session` | ✅ |
| Permisos / `actionsDisabled` | Prop a acciones | Prop a acciones | ✅ |
| Emitida / browser / OS / fechas abs. | Solo en Dialog | Solo en Dialog | ✅ |
| Sort / click fila | Exclusivo tabla | N/A (spec v1.2) | ✅ by design |

---

## 6. Validación de paridad

| Caso | Test | Resultado |
|------|------|-----------|
| Eye → `onViewDetail(session)` | `variant=admin cards — Eye, paridad tabla...` | ✅ |
| LogOut → `onRevoke(session)` | Idem | ✅ |
| IP mismatch `aria-label` | Idem + test tabla existente | ✅ |
| «Último refresh:» relativo | Idem | ✅ |
| Sin «Emitida:» en card admin | Idem | ✅ |
| Marker sesión actual admin | `variant=admin cards — marker sesión actual` | ✅ |
| variant=self cards sin regresión | Tests self existentes (2) | ✅ |
| variant=self tabla sin regresión | Test self tabla | ✅ |
| Fallback token_id current | Test existente | ✅ |

---

## 7. Validación Desktop First

| Requisito v1.2 / prompt | Implementación | Cumple |
|-------------------------|----------------|--------|
| Padding contenedor `p-3` | Grid wrapper | ✅ |
| Gap `gap-3` | Grid wrapper | ✅ |
| Cards compactas admin `p-3` | `SessionAdminCard` | ✅ |
| `xl:grid-cols-4` | Grid | ✅ |
| `2xl:grid-cols-5` | Grid | ✅ |
| Información equivalente a tabla | Solo 4 bloques + acciones | ✅ |
| Detalle avanzado en Dialog únicamente | Admin card sin fechas abs. | ✅ |
| Self sin cambio densidad | `SessionSelfCard` `p-5` | ✅ |

**Breakpoints grid:** `grid-cols-1` → `md:2` → `lg:3` → `xl:4` → `2xl:5`.

---

## 8. Cobertura de tests

```bash
npx vitest run src/features/admin
```

| Métrica | Stage 1 | Stage 2 |
|---------|---------|---------|
| Test files | 24 | 24 |
| Tests | 105 | **107** |
| Failed | 0 | **0** |

### Tests añadidos / actualizados

**Archivo:** `active-sessions-views.enterprise.test.tsx`

| Test | Cobertura |
|------|-----------|
| `variant=admin cards — Eye, paridad tabla, sin campos prohibidos` | Eye, revoke, IP mismatch, refresh relativo, ausencia Emitida |
| `variant=admin cards — marker sesión actual` | Marker + borde brand en card actual |

### Tests sin regresión (muestra)

- `variant=self cards` — badge, fondo, borde, copy CTA
- `variant=self tabla` — paridad marker fila
- `variant=admin tabla` — 5 cols, Eye, refresh, IP mismatch
- Suite hooks (`useRevokeSession`, `useMySessionsList`), Dialog, KPI, Toolbar, utils IAM

**Nota:** Shared components siguen validados indirectamente vía tabla + cards admin (misma composición).

---

## 9. Deuda técnica — estado post Fase 4

| ID auditoría | Stage 1 | Stage 2 | Estado |
|--------------|---------|---------|--------|
| TD-03 ClientTypeIcon duplicado | Tabla | Cards admin vía shared | ✅ Resuelto |
| TD-04 SessionEstadoCell privado | → shared | Consumido en card | ✅ Resuelto |
| TD-05 Browser/OS solo cards admin | — | Eliminado de admin card | ✅ Resuelto |
| TD-07 CTA sin Eye en cards | — | `SessionListActions` | ✅ Resuelto |
| TD-09 ViewVariant en TableView | Tipo shared | Cards import directo | ✅ Resuelto |
| Self card fechas absolutas | — | Intencional (legacy self) | ⚪ Aceptado spec |

---

## 10. Checklist final Fase 4

Referencia: v1.2 §13 + auditoría §13.2.

### Stage 1 ✅

- [x] Extraer 7 shared + `session-view.types.ts`
- [x] Refactor `ActiveSessionsTableView` sin delta UX
- [x] Suite admin verde (105 tests)

### Stage 2 ✅

- [x] Crear `SessionAdminCard` compositor (wireframe §9.3)
- [x] Crear `SessionSelfCard` (arquitectura, sin delta funcional)
- [x] `ActiveSessionsCardsView` solo contenedor + delegación variant
- [x] Wiring `onViewDetail` en `ActiveSessionsPage` → Cards
- [x] Eliminar campos sobrantes admin card (emitida, browser/os, fechas abs.)
- [x] Grid compacto Desktop First (`p-3`, `gap-3`, `xl:4`, `2xl:5`)
- [x] Tests admin cards: Eye, mismatch, relative time, handlers
- [x] Regresión variant=self cards
- [x] Documento Stage 2 (este archivo)

### Fuera de alcance Fase 4 (no implementar)

- [ ] StackedRow / layout mobile dedicado
- [ ] Eliminar toggle Lista/Cards
- [ ] Cambios Backend / OpenAPI / hooks / services

---

## 11. Autoauditoría Stage 2

| Restricción prompt | Cumple |
|--------------------|--------|
| NO Backend / OpenAPI / hooks / servicios | ✅ |
| NO Toolbar / KPIs / Dialog / Tabla | ✅ |
| NO modificar shared Stage 1 | ✅ |
| NO reescribir monolito en CardsView — solo contenedor | ✅ |
| SessionAdminCard usa shared exclusivamente | ✅ |
| SessionSelfCard sin cambios funcionales | ✅ |
| Paridad Eye / Dialog / LogOut / IP / tiempo relativo / badge / permisos | ✅ |
| Desktop First compacto | ✅ |
| Suite admin verde, cero regresiones | ✅ |
| Sin funcionalidades extra fuera Fase 4 | ✅ |

---

## 12. Archivos tocados (Stage 2)

| Archivo | Acción |
|---------|--------|
| `SessionAdminCard.tsx` | **Nuevo** |
| `SessionSelfCard.tsx` | **Nuevo** |
| `ActiveSessionsCardsView.tsx` | Refactor contenedor |
| `ActiveSessionsPage.tsx` | Wiring `onViewDetail` en Cards |
| `__tests__/active-sessions-views.enterprise.test.tsx` | +2 tests admin cards |
| `FRONTEND_ACTIVE_SESSIONS_PHASE4_STAGE2_IMPLEMENTATION.md` | **Nuevo** (este doc) |

---

**SIGNOFF Fase 4 (Stage 1 + Stage 2):** Infraestructura shared + paridad Lista ↔ Cards admin completada. Lista y Cards coexisten con paridad funcional Desktop First según v1.2.
