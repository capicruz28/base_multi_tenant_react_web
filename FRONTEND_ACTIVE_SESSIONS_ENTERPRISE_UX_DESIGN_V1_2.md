# FRONTEND — Active Sessions Enterprise UX Design

**Documento:** `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_2.md`  
**Versión:** **1.2 — ESPECIFICACIÓN OFICIAL**  
**Fecha:** 2026-06-23  
**Estado:** **APROBADO PARA IMPLEMENTACIÓN (Fases pendientes)**  
**Audiencia:** Producto, UX, Frontend IAM, QA

> **Este documento sustituye completamente a `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_1.md` v1.1** y constituye la **especificación oficial vigente** para Sesiones Activas Enterprise.

**Restricciones congeladas:** sin cambios Backend · sin cambios OpenAPI · sin cambios React Query / Auth / Session Management en tickets de UX.

**Entradas normativas:**

| Documento | Rol |
|-----------|-----|
| `BACKEND_PLATFORM_API_CONTRACT_V2.md` §1d | `GET /api/v1/auth/sessions/admin/` |
| `ERP-IAM-SESSIONS-API-CONTRACT-V1.md` | DTOs `AdminSessionRead`, `SessionDeviceRead` |
| `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` | Semántica V2 campos sesión |
| `ERP_FRONTEND_STANDARDS_V2.md` §5, §7.1, §9.1 | Plantilla Admin IAM, Tier C, Dialog, B11 |
| Código referencia | `ActiveSessionsPage`, `UserManagementPage`, `UserCreateDialog` |

---

## 0. Resumen ejecutivo

La pantalla **Sesiones Activas** (`/admin/sesiones`, `ActiveSessionsPage`) es un panel **Admin IAM Tier C** con:

- **Tabla enterprise de 5 columnas** (vista Lista)
- **Vista Cards** oficial (representación visual alternativa)
- **Franja KPI** (3 métricas + enlace preset)
- **`SessionDetailDialog`** como única fuente de detalle avanzado
- **Toolbar** con filtros server-side, presets de orden y monitoreo

**Orden predeterminado:** omitir `sort_by` en carga inicial → Backend aplica `last_used_at DESC, token_id ASC`.

**Plataforma objetivo:** **Desktop First Enterprise · Tablet Friendly.**  
Monitores administrativos **22–27"**, laptops y tablet landscape. **No Mobile First.** No layouts exclusivos para teléfonos.

> **Declaración oficial v1.2:**  
> **Lista y Cards son vistas equivalentes funcionalmente. La única diferencia permitida es la representación visual.**

---

## 0.1 Historial de cambios respecto a v1.1

| Área | v1.1 | v1.2 |
|------|------|------|
| Plataforma UX | Responsive genérico; stacked row `< md` | **Desktop First Enterprise · Tablet Friendly** |
| Vista Cards admin | Eliminar en Fase 4 (D-19) | **Permanente** — feature oficial ERP |
| Toggle Lista/Cards | Eliminar en Fase 4 | **Permanente** en toolbar monitoreo |
| `ActiveSessionsStackedRow` | Fase 4 obligatorio | **Descartado** — no crear |
| Mobile `<768 px` | Objetivo UX con stacked | **Fuera de alcance** — degradación aceptable |
| Paridad Lista/Cards | Implícita solo en tabla | **MUST** paridad funcional explícita |
| Cards contenido | N/A (deprecación) | **Condensadas** — no más info que tabla |
| Fase 4 | Unificación → eliminar cards | **Paridad + rediseño compacto Cards** |
| QA viewports | 1280 px, 1024 px | **1920, 1600, 1440, 1366, 1280** + tablet landscape |
| Fases 1A–3 | Planificadas | **Completadas** (ver §13.0) |

---

## 1. Registro de decisiones

### 1.1 Decisiones ACEPTADAS (v1.1 — vigentes sin cambio)

| ID | Decisión |
|----|----------|
| D-01 | Tabla **5 columnas** (Usuario · Cliente · IP · Estado · Acciones) |
| D-02 | Columna **Estado** fusiona refresh + expiración + `SessionStatusBadge` |
| D-03 | **`SessionDetailDialog`** — no Drawer/Sheet |
| D-04 | Acciones: iconos **`Eye` + `LogOut`** únicamente |
| D-05 | **`Eye` obligatorio**; click `<tr>` **MAY** abrir Dialog |
| D-06 | **MUST NOT** revocar desde click fila |
| D-07 | KPIs: **Total tenant**, **Web**, **Mobile** |
| D-08 | KPI tile 4: **«Ver próximas a expirar →»** sin número |
| D-09 | Copy dual KPI vs paginación filtrada |
| D-10 | Auto-refresh **Manual/OFF default**; intervalos configurables (ver §7.4) |
| D-11 | Timestamp **«Actualizado hace…»** visible |
| D-12 | Filtro **`usuario_id`** en Fase 2 |
| D-13 | Dialog cierra antes `ConfirmDialog` revoke (B11-10) |
| D-14 | Hook **`useActiveSessionsKpiSummary`**; staleTime ≥ 60 s |
| D-15 | Tiempo relativo en grilla + tooltip absoluto |
| D-16 | IP en grilla + alerta mismatch |
| D-17 | `user_agent` colapsable «Diagnóstico avanzado» |
| D-18 | `duration_seconds` secundario en Dialog |
| D-20 | Paginación default **25**; opciones 10/25/50 |
| D-22 | QA gates desktop **1280–1920 px** — cero scroll horizontal tabla Lista |

### 1.2 Decisiones NUEVAS (v1.2 — oficiales)

| ID | Decisión |
|----|----------|
| **D-23** | ERP Admin IAM = **Desktop First Enterprise · Tablet Friendly · No Mobile First** |
| **D-24** | Viewports objetivo: **1920, 1600, 1440, 1366, 1280** px + **tablet landscape** |
| **D-25** | **Toggle Lista/Cards permanente** — preferencia en `localStorage` |
| **D-26** | **`ActiveSessionsCardsView` admin permanente** — no deprecar |
| **D-27** | **Paridad funcional MUST** entre Lista y Cards (§1.4) |
| **D-28** | Cards = **representación visual condensada** — **MUST NOT** mostrar más campos que Lista |
| **D-29** | **Información avanzada exclusiva** en `SessionDetailDialog` |
| **D-30** | Cards **rediseño compacto** Fase 4: mayor densidad, más tarjetas por fila (§9.3) |
| **D-31** | **No crear** `ActiveSessionsStackedRow` ni layouts mobile exclusivos |
| **D-32** | Teléfono móvil (`<768 px`): **fuera de alcance UX** — no gate QA obligatorio |

### 1.3 Decisiones DESCARTADAS v1.1 — revocadas en v1.2

| ID v1.1 | Decisión revocada | Motivo revocación v1.2 |
|---------|-------------------|------------------------|
| **D-19** | Eliminar toggle Cards admin Fase 4 | Producto: dual view es feature ERP desktop |
| **§9.1** | `ActiveSessionsStackedRow` en `< md` | ERP no orientado a operación móvil |
| **§13 Fase 4** | Remover grid cards admin | Sustituido por paridad + compact cards |
| **§7.3** | «Eliminar toggle Tabla/Cards en Fase 4» | Toggle permanente (D-25) |

### 1.4 Paridad funcional Lista ↔ Cards (MUST)

Ambas vistas **MUST** soportar idénticamente:

| Capacidad | Lista | Cards |
|-----------|-------|-------|
| `Eye` → `SessionDetailDialog` | ✅ MUST | ✅ MUST |
| `LogOut` → revoke (ConfirmDialog) | ✅ MUST | ✅ MUST |
| `SessionStatusBadge` | ✅ MUST | ✅ MUST |
| Estado (refresh + expiración relativos) | ✅ MUST | ✅ MUST |
| IP + mismatch `AlertTriangle` | ✅ MUST | ✅ MUST |
| `SessionCurrentMarker` | ✅ MUST | ✅ MUST |
| Mismos handlers / permisos RBAC | ✅ MUST | ✅ MUST |
| Mismo flujo B11-10 revoke | ✅ MUST | ✅ MUST |
| Sort / filtros / paginación (page-level) | ✅ MUST | ✅ MUST |

**MUST NOT** en Cards:

- Campos adicionales no presentes en Lista (p. ej. fechas absolutas emitida/expira en card body)
- CTA revoke full-width como **única** acción sin Eye
- Información forense (`user_agent`, duración, login_ip explicado) fuera del Dialog

> **Lista y Cards son vistas equivalentes funcionalmente. La única diferencia permitida es la representación visual.**

### 1.5 Decisiones DESCARTADAS históricas (v1.0/v1.1 — siguen vigentes)

Sin cambio vs v1.1 §1.2 (X-01…X-12): Drawer, 6 columnas, KPI expira numérico, menú ⋯, avatar, etc.

**Nuevas descartadas v1.2:**

| ID | Propuesta | Motivo |
|----|-----------|--------|
| **X-13** | Eliminar Cards admin | Revocado — D-26 |
| **X-14** | Eliminar toggle Lista/Cards | Revocado — D-25 |
| **X-15** | `ActiveSessionsStackedRow` | D-31 — no mobile layouts |
| **X-16** | Mobile First / UX teléfono como objetivo | D-23, D-32 |
| **X-17** | Cards con más densidad informativa que tabla | D-28 — Dialog es detalle |

### 1.6 Reglas MUST / MUST NOT (actualizadas)

| Regla | Detalle |
|-------|---------|
| **MUST** | Paridad funcional Lista/Cards §1.4 |
| **MUST** | `Eye` + `LogOut` en **cada** card admin |
| **MUST** | Cards no excedan información visible de Lista |
| **MUST** | Toggle vista persiste `localStorage` |
| **MUST NOT** | Crear `ActiveSessionsStackedRow` |
| **MUST NOT** | Crear layouts exclusivos mobile para admin sesiones |
| **MUST NOT** | Deprecar `ActiveSessionsCardsView` variant admin |
| *Resto* | Sin cambio vs v1.1 §1.3 |

---

## 2. Arquitectura final de la pantalla

### 2.1 Clasificación V2

Sin cambio vs v1.1 §2.1.

### 2.2 Árbol de componentes (objetivo post-Fase 5)

```
ActiveSessionsPage
├── ActiveSessionsKpiStrip                    (Fase 1B ✅)
├── OrgCompanyToolbar
│   ├── OrgToolbarSearch                      (Fase 1A ✅)
│   ├── ActiveSessionsUserFilter              (Fase 2 ✅)
│   ├── ActiveSessionsClientTypeFilter        (Fase 1A ✅)
│   ├── ActiveSessionsSortPresets             (Fase 3 ✅)
│   ├── ActiveSessionsFiltersSummary          (Fase 3 ✅)
│   └── ActiveSessionsToolbarMonitoring       (Consolidación + Fase 3 ✅)
│       ├── formatActiveSessionsUpdatedLabel
│       ├── Toggle Lista / Cards              (PERMANENTE — D-25)
│       ├── ActiveSessionsAutoRefreshSelect
│       └── Refresh manual
├── ActiveSessionsTableView                   (Fase 1A ✅ — vista Lista)
├── ActiveSessionsCardsView                   (PERMANENTE — Fase 4 rediseño compacto)
├── ActiveSessionsPanelPagination             (Fase 2 + consolidación ✅)
├── SessionDetailDialog                       (Fase 2 ✅)
└── ConfirmDialog                             (revoke — existente)
```

**Eliminado del árbol:** `ActiveSessionsStackedRow`.

### 2.3 Flujo de datos

Sin cambio vs v1.1 §2.3. El toggle Lista/Cards solo altera componente de render; **no** altera queries ni contratos.

---

## 3. Layout definitivo

### 3.1 Desktop First (1280–1920 px) — objetivo principal

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  [KPI Strip — 4 tiles]                                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [Toolbar — filtros izq]     [Actualizado · Lista|Cards · Auto · ↻]         ║
║  [Resumen filtros — Usuario · Plataforma · Orden]                            ║
║  Nota limitación búsqueda empresa                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [Vista Lista — tabla 5 cols]  OR  [Vista Cards — grid compacto]             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [ErpPagination + copy dual si filtros]                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 3.2 Orden vertical (TB-01)

1. KPI Strip  
2. Toolbar (`justify-between`)  
3. Resumen filtros (Fase 3)  
4. Nota limitación BE  
5. Panel Lista **o** Cards (`bg-surface border…`)  
6. Paginación  
7. Modales portaled

### 3.3 Nota limitación BE

Sin cambio vs v1.1 §3.3.

---

## 4. Columnas definitivas — Vista Lista (5)

Sin cambio vs v1.1 §4 (columnas, sort, presets extendidos Fase 3 implementada).

**Presets implementados (Fase 3):** Último refresh, Próximas a expirar, Más recientes, Usuario A-Z, Usuario Z-A + Predeterminado.

---

## 5. SessionDetailDialog

Sin cambio vs v1.1 §5. **Única fuente** de información avanzada para ambas vistas.

---

## 6. KPIs definitivos

Sin cambio vs v1.1 §6.

---

## 7. Toolbar definitiva

### 7.1 Controles — estado implementado + vigente

| Control | Fase | Estado |
|---------|------|--------|
| Búsqueda | 1A | ✅ |
| Tipo cliente | 1A | ✅ |
| Usuario combobox | 2 | ✅ |
| Presets orden | 3 | ✅ |
| Resumen filtros | 3 | ✅ |
| Auto-refresh select | 3 | ✅ Manual / 30s / 1min / 5min |
| Timestamp actualizado | 1B/3 | ✅ |
| Refresh manual | 1A | ✅ |
| **Toggle Lista / Cards** | **Permanente** | ✅ — **no eliminar** |

### 7.2 Placeholders

Sin cambio vs v1.1 §7.2.

### 7.3 Acciones toolbar derecha (definitivo v1.2)

```
[Actualizado hace X]  [Lista | Cards]  [Auto-refresh ▼]  [↻]
```

**MUST NOT** eliminar segmented control Lista/Cards.

### 7.4 Auto-refresh (implementado Fase 3)

| Valor | Comportamiento |
|-------|----------------|
| Manual | Default; sin intervalo |
| 30 s / 1 min / 5 min | Invalida list + KPI; localStorage |

---

## 8. Flujo de revocación

Sin cambio vs v1.1 §8. Aplica **idéntico** desde Lista o Cards.

---

## 9. Responsive — Desktop First Enterprise

### 9.1 Filosofía v1.2

| Nivel | Objetivo |
|-------|----------|
| **Desktop First** | Experiencia **excelente** en 1920, 1600, 1440, 1366, 1280 px |
| **Tablet Friendly** | Usable en tablet landscape (~1024 px); KPI 2×2; toolbar wrap aceptable |
| **Mobile** | **No objetivo.** Sin layouts dedicados. Degradación aceptable en `<768 px` |

### 9.2 Matriz por viewport (gates QA)

| Viewport | Lista (tabla) | Cards | KPI | Toolbar |
|----------|---------------|-------|-----|---------|
| **1920 px** | 5 cols, sin scroll H | Grid 4–5 cols compactas | 1×4 | 1 fila ideal |
| **1600 px** | Idem | Grid 4 cols | 1×4 | 1 fila |
| **1440 px** | Idem | Grid 3–4 cols | 1×4 | 1–2 filas |
| **1366 px** | Idem | Grid 3 cols | 1×4 | Wrap 2 filas OK |
| **1280 px** | Idem; gate sin scroll H | Grid 3 cols | 1×4 | Wrap OK |
| **1024 px** (tablet L) | Compacta; sin scroll H objetivo | Grid 2–3 cols | 2×2 | Wrap |
| **<768 px** | Fuera alcance | Fuera alcance | 1 col | No gate |

### 9.3 Vista Cards — rediseño compacto (Fase 4)

**Objetivos de densidad:**

| Atributo | Actual (pre-Fase 4) | Objetivo Fase 4 |
|----------|---------------------|-----------------|
| Padding card | `p-5` | `p-3` – `p-4` |
| Grid desktop 1920 | `lg:grid-cols-3` | **`xl:grid-cols-4` `2xl:grid-cols-5`** |
| Grid 1366 | 3 cols | **4 cols** donde ancho lo permita |
| Campos visibles | Exceso vs tabla (fechas absolutas) | **Paridad §1.4** — solo subset Lista |
| Acciones | Solo LogOut full-width | **Eye + LogOut** iconos (como fila) |
| Altura card | ~192 px+ | **≤140 px** objetivo |

**Contenido card admin (máximo permitido — espejo Lista):**

```
┌─ Card compacta ─────────────────────────┐
│ nombre_usuario [ESTA SESIÓN]    [badge]│
│ nombre apellido · empresa (trunc)      │
│ [Web] device_label trunc · IP [⚠]      │
│ Últ. refresh: X · Expira: Y            │
│                    [Eye] [LogOut]      │
└────────────────────────────────────────┘
```

**Prohibido en card:** bloques Calendar múltiples, browser/os expandidos, fechas absolutas emitida/expira.

### 9.4 MySessions (`variant=self`)

- Toggle Lista/Cards **puede** mantenerse en self.
- Paridad funcional recomendada; rediseño compacto Fase 4 **prioriza admin**.
- Sin stacked row en self.

---

## 10. Formato tiempo relativo

Sin cambio vs v1.1 §10.

---

## 11. Inventario datos API

Sin cambio vs v1.1 §11.

---

## 12. Wireframe funcional consolidado (v1.2)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  [247 totales] [198 Web] [49 Mobile] [Ver próximas a expirar →]             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [🔍] [Usuario ▼] [Plataforma ▼] [Orden ▼]    [hace 1m][▤|▦][Auto▼][↻]   ║
║  Usuario: Todos · Plataforma: Todas · Orden: Predeterminado                 ║
║  La búsqueda no incluye nombre de empresa.                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  VISTA LISTA                          OR          VISTA CARDS (compacta)    ║
║  Usuario │ Cliente │ IP │ Estado │ ⚙              [card][card][card][card]  ║
║  ────────┼─────────┼────┼────────┼───              [card][card][card][card]  ║
║  …       │ …       │ …  │ …      │[👁][⎋]          Eye+LogOut en cada card  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Mostrando 1–25 de 49 · 247 en el tenant              [25 ▼] [◀ 1 2 ▶]      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 13. Plan de implementación — roadmap actualizado

### 13.0 Estado de fases (2026-06-23)

| Fase | Estado | Notas |
|------|--------|-------|
| **1A** Tabla 5 cols | ✅ **COMPLETADA** | |
| **1B** KPI strip | ✅ **COMPLETADA** | |
| **2** Dialog + filtro usuario | ✅ **COMPLETADA** | |
| **Toolbar Consolidation** | ✅ **COMPLETADA** | Entre 2 y 3 |
| **3** Presets + auto-refresh + resumen filtros | ✅ **COMPLETADA** | Extensiones vs v1.1 documentadas §7.4 |
| **4** Paridad Cards + compact | 🔲 **PENDIENTE** | Redefinida v1.2 |
| **5** Pulido enterprise | 🔲 **PENDIENTE** | Sin stacked row |

### Fase 4 — Paridad Cards + rediseño compacto (P1)

**Objetivo v1.2:** Lista y Cards funcionalmente equivalentes; Cards más densas en desktop.

| Entregable | Done cuando |
|------------|-------------|
| `Eye` + `LogOut` en cada card admin | Abre mismo Dialog / Confirm |
| Eliminar campos card **no** presentes en Lista | Sin fechas absolutas en body |
| Rediseño grid compacto §9.3 | QA 1920/1366 — más cards visibles |
| IP mismatch + badge + refresh/expira relativos | Paridad §1.4 |
| Tests paridad Lista/Cards | Mismos handlers mockeados |
| **No** remover toggle | Toggle permanece |

**Fuera alcance Fase 4:**

- ❌ Eliminar Cards  
- ❌ Eliminar toggle  
- ❌ `ActiveSessionsStackedRow`  
- ❌ Layouts mobile exclusivos  

#### Criterios aceptación Fase 4

- [ ] Cards admin: Eye abre `SessionDetailDialog` idéntico a Lista.
- [ ] Cards admin: LogOut dispara mismo flujo revoke.
- [ ] Cards no muestran campos fuera del subset Lista §9.3.
- [ ] Grid ≥4 cols en 1920 px; ≥3 cols en 1366 px.
- [ ] Toggle Lista/Cards persiste y funciona.
- [ ] MySessions (`variant=self`) sin regresión.

---

### Fase 5 — Pulido enterprise (P2/P3)

**Objetivo:** a11y desktop + forense Dialog. **Sin** mobile layouts.

| Entregable | Done cuando |
|------------|-------------|
| `DialogDescription` / aria en SessionDetailDialog | Radix a11y |
| `aria-sort` en headers Lista | Sort accesible |
| Resumen filtros incluye búsqueda activa | UX-S-02 audit |
| Spin `RefreshCw` solo durante fetch real | UX-MI-01 |
| Agrupación visual `usuario_id` (opcional) | Borde sutil |
| Copiar UA / IP en Dialog | Clipboard + toast |
| QA axe desktop 1280+ | Eye/LogOut anunciados |

**Eliminado vs v1.1 Fase 5:** requisitos mobile stacked.

---

## 14. Alineación normativa V2

Sin cambio vs v1.1 §14 + D-23 alinea con ME-01 (admin desktop JWT context).

---

## 15. Riesgos residuales (aceptados)

| Riesgo | Mitigación v1.2 |
|--------|-----------------|
| Cards desalineadas vs Lista (estado actual) | **Fase 4** paridad MUST |
| Toolbar denso 1366 px | Wrap aceptable Desktop First |
| Mobile `<768 px` ilegible | **Aceptado** — fuera alcance D-32 |
| Doble mantenimiento Lista/Cards | Shared utils/handlers; paridad testeada |
| *Resto* | vs v1.1 §15 |

---

## 16. Gate final diseño v1.2

| Criterio | v1.2 |
|----------|------|
| Desktop First Enterprise | ✅ §9 |
| Lista + Cards permanentes | ✅ D-25, D-26 |
| Paridad funcional MUST | ✅ §1.4 |
| Dialog única fuente detalle | ✅ D-29 |
| No StackedRow / no mobile layouts | ✅ D-31, D-32 |
| Fases 1A–3 completadas | ✅ §13.0 |
| Fase 4 redefinida (compact + parity) | ✅ §13 |
| Sin ambigüedad Backend/OpenAPI | ✅ |

**Estado documento:** **APROBADO** — ejecutar **Fase 4 → Fase 5**. v1.1 **superseded**.

---

## 17. Trazabilidad

| Documento | Disposición |
|-----------|-------------|
| `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_1.md` | **Superseded por v1.2** |
| `ACTIVE_SESSIONS_ENTERPRISE_FINAL_UX_AUDIT.md` | Auditoría pre-v1.2; dictamen C parcialmente **obsoleto** (§17.1) |
| Fases 1A–3 implementation reports | Válidos; referenciar v1.2 para pendientes |

### 17.1 Nota sobre auditoría UX 2026-06-23

La auditoría `ACTIVE_SESSIONS_ENTERPRISE_FINAL_UX_AUDIT.md` recomendaba Fase 4 = eliminar Cards + stacked row (basada en v1.1). **v1.2 revoca esas recomendaciones.** Hallazgos de **paridad Cards** (UX-S-06, UX-CV-02) **permanecen válidos** y se resuelven en la **nueva Fase 4**.

| Artefacto código | Acción pendiente |
|------------------|------------------|
| `ActiveSessionsCardsView.tsx` | **Refactor compacto + paridad** (Fase 4) — **no deprecar** |
| `ActiveSessionsStackedRow` | **No crear** |
| Toggle Lista/Cards | **Mantener** |

---

## 18. Dictamen arquitectónico UX (v1.2)

### ¿La nueva dirección es más consistente con un ERP Enterprise Desktop-First?

**Sí — de forma decisiva.**

| Criterio | Propuesta v1.1 (stacked / sin cards) | Dirección v1.2 |
|----------|--------------------------------------|----------------|
| Alineación producto ERP admin | Influencia mobile-first genérica | **Coherente** con uso 22–27" y laptop |
| Coste mantenimiento | Eliminar cards simplifica, pero fuerza mobile layout | Dual view con **paridad testeada** — coste acotado |
| Preferencia administrador | Tabla única impuesta | **Elección Lista/Cards** — patrón común en dashboards enterprise |
| Progressive disclosure | Correcto en ambas | Igual — Dialog central |
| Riesgo regresión mobile | Alto esfuerzo stacked para uso raro | **Evitado** — scope explícito |
| Deuda actual audit | Cards sin Eye | **Fase 4 cerrará paridad** — problema real, solución clara |

**Conclusión:** v1.2 es **más consistente** con la visión global del ERP como plataforma **administrativa desktop-first**. La propuesta v1.1 de stacked rows respondía a un objetivo mobile que **no es prioritario** para este producto. Mantener Lista/Cards con paridad funcional y Cards compactas optimiza **densidad en monitores anchos** — el caso de uso principal — sin inventar un tercer layout mobile.

**Riesgo a gestionar:** garantizar paridad Cards (Fase 4) con tests; sin ello, la dualidad genera deuda UX. La spec v1.2 lo convierte en **requisito MUST**, no opcional.

---

**Fin de especificación v1.2 — OFICIAL.**

> **Este documento sustituye completamente a v1.1 y constituye la especificación oficial para implementación pendiente (Fases 4–5).**
