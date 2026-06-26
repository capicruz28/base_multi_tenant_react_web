# ACTIVE SESSIONS — Auditoría Final UX Enterprise

**Documento:** `ACTIVE_SESSIONS_ENTERPRISE_FINAL_UX_AUDIT.md`  
**Versión:** 1.0  
**Fecha:** 2026-06-23  
**Modo:** READ ONLY — sin cambios de código  
**Audiencia:** Producto, UX, Frontend IAM, QA

**Alcance auditado:** Implementación completa Fases 1A, 1B, 2, Toolbar Consolidation y Fase 3 sobre `ActiveSessionsPage` (`/admin/sesiones`).

**Referencias normativas:** `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_1.md`, `ERP_FRONTEND_STANDARDS_V2.md` §5/§9, patrón IAM `UserManagementPage`.

**Excluido:** Funcionalidad API, contratos, hooks, Session Management, Auth — ya certificados.

---

## 0. Resumen ejecutivo

La pantalla **Sesiones Activas** alcanza un nivel **enterprise sólido en desktop** (≥1024 px): jerarquía KPI → toolbar → tabla restaurada tras consolidación, tabla de 5 columnas escaneable, progressive disclosure vía `SessionDetailDialog`, copy dual honesto bajo filtros, y monitoreo operativo (auto-refresh configurable, timestamp, presets de orden).

Los principales gaps UX **no son de funcionalidad** sino de **cierre multi-viewport y unificación de vistas** ya previstos en la spec congelada (Fases 4 y 5): ausencia de filas apiladas en `< md`, persistencia del toggle Tabla/Cards admin con **paridad incompleta** en cards, y pulido a11y residual (aria-sort, DialogDescription, semántica del icono refresh).

**Comparación enterprise:** La pantalla está **alineada o por encima** de `UserManagementPage` en densidad informativa y estados de carga/error; el toolbar admin sesiones es **más denso** que el de usuarios (5 controles izquierda + 4 derecha), coherente con un panel de monitoreo pero al límite en 1366 px.

### Dictamen final

## **C) Requiere otra fase importante antes del cierre**

**Justificación:** En desktop operativo (1366–1920) la calidad UX es **cerrable con pulido menor** (veredicto parcial B). Sin embargo, la spec v1.1 §9 define un layout mobile distinto (`ActiveSessionsStackedRow`) que **no está implementado**, y la vista Cards admin **rompe paridad** con el flujo Eye → Dialog. Ambos son entregables de **Fase 4** (unificación vista), no micro-ajustes. Hasta completar esa fase, la pantalla **no puede declararse enterprise terminada en todos los viewports** ni en todas las variantes de vista expuestas al usuario.

**Nota:** No se detectan hallazgos P0 bloqueantes en el flujo principal tabla + dialog en desktop.

---

## 1. Metodología

| Eje | Método |
|-----|--------|
| Jerarquía y consistencia | Revisión árbol componentes + wireframe spec §12 |
| Espaciado / tipografía / iconos | Inspección clases Tailwind vs tokens Capa 1 / brand Capa 2 |
| Responsive | Análisis breakpoints Tailwind en page y componentes; gates spec 1024/1280 |
| Accesibilidad | aria-labels, focus, tests existentes, warnings Radix en suite |
| Estados | Trazado loading / empty / error / filtered / refresh / revoke / dialog |
| Design System | Checklist `.cursorrules` Capa 1/2 |
| Benchmark | `UserManagementPage`, `MySessionsPage` |
| Cards | Evaluación valor vs deuda (spec D-19, Fase 4) |

---

## 2. Jerarquía visual

### 2.1 Orden vertical actual (post-consolidación + Fase 3)

```
KPI Strip (4 tiles)
→ Toolbar (filtros izq · monitoreo der)
→ Resumen filtros (Usuario · Plataforma · Orden)    ← Fase 3
→ Nota limitación búsqueda empresa
→ Panel tabla/cards + paginación
→ SessionDetailDialog / ConfirmDialog revoke
```

**Evaluación:** **Correcta.** Restaura el scan path spec §3.2 (KPI → toolbar → contenido). La consolidación resolvió P0-02 de la auditoría toolbar previa.

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-H-01** | El resumen de filtros (Fase 3) se inserta **entre toolbar y nota empresa**, generando una banda de metadatos de 2 líneas antes del panel de datos. Legible, pero alarga el «preámbulo» vertical. | **P2** |
| **UX-H-02** | KPI strip permanece **global** con atenuación (`opacity-90`) bajo filtros — decisión spec D-09 correcta y bien ejecutada. | ✅ |
| **UX-H-03** | Enlace «Ver próximas a expirar →» en KPI como cuarto tile mantiene jerarquía clara (acción secundaria brand, no KPI numérico). | ✅ |

### 2.2 Peso visual relativo

| Zona | Peso | Comentario |
|------|------|------------|
| KPI números `text-2xl font-semibold` | Alto | Apropiado — ancla situacional |
| Toolbar controles | Medio-alto | 9 controles totales; competencia visual en 1366 px |
| Tabla thead `uppercase text-xs` | Medio | Coherente con IAM/INV |
| Nota empresa `text-xs text-text-faint` | Bajo | Correcto |

---

## 3. Consistencia Toolbar · KPI · Tabla · Dialog

### 3.1 Matriz de sincronía

| Estado | KPI Web/Mobile | Select Plataforma | Resumen filtros | Tabla |
|--------|----------------|-------------------|-----------------|-------|
| Filtro `web` | Highlight `border-brand-primary` | Highlight activo | «Web» | Filas web |
| Filtro `mobile` | Idem | Idem | «Mobile» | Filas mobile |
| Preset orden | — | — | Label preset | Headers sort / datos |
| Búsqueda libre | KPI atenuado | — | **No reflejada** | Filas filtradas |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-S-01** | Sincronización KPI ↔ select plataforma (Fase 3) **correcta** y mejora P1-02 de auditoría toolbar previa. | ✅ |
| **UX-S-02** | `ActiveSessionsFiltersSummary` **no incluye búsqueda libre** (`search`) ni estado «con filtros activos» global — solo Usuario/Plataforma/Orden. Con búsqueda por IP el resumen muestra «Todos» en usuario y puede inducir lectura errónea. | **P1** |
| **UX-S-03** | Doble vía de filtro usuario persiste: búsqueda sesiones («usuario, nombre o IP») vs combobox `usuario_id`. Semánticamente distinto pero **cognitivamente solapado** para admins no expertos. Consolidación mejoró presentación (combobox único) pero no elimina ambigüedad. | **P2** |
| **UX-S-04** | Tabla ↔ Dialog: mismos formatters (`formatUserDisplayName`, IP mismatch, badges) — **consistente**. | ✅ |
| **UX-S-05** | Revoke: B11-10 respetado (Dialog cierra antes de Confirm). Flujo coherente entre fila, dialog y confirm. | ✅ |
| **UX-S-06** | Cards admin **no expone Eye ni `SessionDetailDialog`** — ruptura de paridad con tabla. Usuario en vista cards pierde progressive disclosure enterprise. | **P1** |

### 3.2 Comparación con `UserManagementPage`

| Aspecto | UserManagement | Active Sessions | Evaluación |
|---------|----------------|-----------------|------------|
| Toolbar izquierda | Search + 1 checkbox | Search + combobox + 2 selects | Sesiones más denso (esperado) |
| Toolbar derecha | 1 CTA primario | Monitoreo (4 controles) | Patrones distintos, válidos por dominio |
| Acciones fila | Iconos + texto implícito | Eye + LogOut solo icono | Sesiones más compacto — aceptable con aria-label |
| Paginación | `ErpPagination` estándar | `ErpPagination` + `summarySlot` dual | Sesiones superior bajo filtros |
| KPI strip | No tiene | 4 tiles | Diferenciador enterprise sesiones |

---

## 4. Espaciados, alineación y densidad

### 4.1 Tokens y medidas recurrentes

| Elemento | Clases observadas | DS Capa 1 |
|----------|-------------------|-----------|
| Panel tabla | `bg-surface border-border-base rounded-lg shadow-sm` | ✅ |
| KPI tiles | `px-4 py-3`, `gap-3`, `mb-3` | ✅ |
| Toolbar | `OrgCompanyToolbar mb-4`, `gap-3` / `gap-2` | ✅ |
| Table cells | `px-4 py-3` (sesiones) vs `px-6 py-3` (usuarios) | **P3** — ligera variación intra-IAM |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-SP-01** | Sin uso de `gray-*`, `slate-*`, `bg-white` en estructura — cumple checklist Capa 1. | ✅ |
| **UX-SP-02** | Botones primarios error/brand usan tokens correctos (`bg-brand-primary`, `bg-error`). | ✅ |
| **UX-SP-03** | Toolbar en **1366 px**: 5 controles izq (`w-52` ×2 + 2 selects) + grupo der (label + toggle + select auto + refresh) **provoca wrap en 2 filas** con `flex-wrap`. Funcional pero reduce densidad vertical útil. | **P1** |
| **UX-SP-04** | En **1920 px** el layout respira; alineación `justify-between` del toolbar es clara. | ✅ |
| **UX-SP-05** | Columna Estado (2 líneas + badge) genera filas ~64–80 px — dentro del objetivo spec; en 1024 px sigue sin scroll horizontal (`lg:overflow-x-visible`). | ✅ |
| **UX-SP-06** | `ActiveSessionsFiltersSummary` y nota empresa comparten `mb-3` — ritmo vertical uniforme. | ✅ |

---

## 5. Iconografía

| Contexto | Iconos | Evaluación |
|----------|--------|------------|
| Tabla cliente | `Monitor` / `Smartphone` / `Globe` + chip | ✅ Semántico |
| Acciones fila | `Eye`, `LogOut` | ✅ Spec D-04 |
| IP mismatch | `AlertTriangle` warning | ✅ |
| Toolbar vista | `List`, `Grid3x3` | ✅ |
| Refresh | `RefreshCw` | ⚠️ Ver UX-MI-01 |
| Dialog avanzado | `ChevronRight` / `ChevronDown` | ✅ |
| Cards admin | `Globe` reutilizado para empresa, IP; `Monitor` en línea device | **P2** — semántica difusa |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-IC-01** | Iconografía tabla/dialog **alineada** con Lucide y convenciones IAM. | ✅ |
| **UX-IC-02** | Cards admin reutiliza `Globe` para contextos distintos (empresa vs IP) — reduce escaneabilidad. | **P2** |

---

## 6. Tipografía

| Rol | Implementación | Spec / IAM |
|-----|--------------|------------|
| KPI valor | `text-2xl font-semibold tabular-nums` | ✅ |
| KPI etiqueta | `text-sm text-text-soft` — «totales tenant» en minúsculas | **P3** — capitalización inconsistente («Web»/«Mobile» vs «totales tenant») |
| Headers tabla | `text-xs uppercase tracking-wider text-text-soft` | ✅ Igual familia que UserManagement |
| Cuerpo tabla | `text-sm` + jerarquía `text-xs` secundarios | ✅ |
| Dialog secciones | `text-xs font-semibold uppercase` | ✅ Patrón IAM dialog |
| Resumen filtros | `text-sm` con labels `text-text-faint` | ✅ |
| Nota empresa | `text-xs text-text-faint` | ✅ |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-TY-01** | Jerarquía tipográfica **clara y coherente** con Admin IAM. | ✅ |
| **UX-TY-02** | Label KPI «totales tenant» en minúsculas rompe paralelismo con «Web»/«Mobile». | **P3** |

---

## 7. Responsive Desktop

### 7.1 1366 px

| Aspecto | Estado |
|---------|--------|
| Tabla 5 cols sin scroll horizontal | ✅ |
| Toolbar | Wrap probable — 2 filas |
| KPI | `lg:grid-cols-4` — 1 fila |
| Dialog `max-w-lg` | ✅ Centrado |

### 7.2 1600 px

| Aspecto | Estado |
|---------|--------|
| Toolbar una fila | ✅ Alta probabilidad |
| Tabla | Cómoda; truncates en usuario/empresa funcionan |
| Densidad filas visibles | ~8–10 filas útiles + KPI + toolbar |

### 7.3 1920 px

| Aspecto | Estado |
|---------|--------|
| Layout | ✅ Enterprise estándar |
| Espacio lateral | Panel tabla no estirado artificialmente — correcto `w-full` |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-RD-01** | Desktop 1280–1920: **objetivo enterprise cumplido** en vista tabla. | ✅ |
| **UX-RD-02** | Toolbar wrap en 1366 degrada scan path «filtros en una línea». | **P1** |

---

## 8. Responsive Tablet (768–1023 px)

| Aspecto | Estado |
|---------|--------|
| KPI | `sm:grid-cols-2` → 2×2 — ✅ |
| Tabla | Sigue renderizándose (5 cols `table-fixed`) — compacta pero usable |
| Toolbar | Wrap multi-línea esperado |
| Dialog | `sm:max-w-lg` — ✅ |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-RT-01** | Tablet landscape (~1024): gate spec D-22 cumplible — sin scroll horizontal tabla. | ✅ |
| **UX-RT-02** | Toolbar muy cargado en tablet portrait; controles táctiles nativos (`select`) ayudan pero área de click en iconos toolbar der es **≤36 px** en algunos botones. | **P2** |

---

## 9. Responsive Mobile (<768 px)

| Aspecto | Spec v1.1 §9 | Implementado |
|---------|--------------|--------------|
| Layout sesiones | `ActiveSessionsStackedRow` | ❌ No existe |
| Alternativa actual | — | Tabla con `overflow-x-auto` **o** grid cards |
| Toggle vista | Eliminar en Fase 4 | ❌ Aún presente |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-RM-01** | **Desviación normativa:** spec exige filas apiladas `< md`, no cards grid admin. | **P1** |
| **UX-RM-02** | Tabla en mobile fuerza scroll horizontal o columnas ilegibles — **no enterprise**. | **P1** |
| **UX-RM-03** | Empty state cards usa layout distinto a `IamTableEmptyState` — inconsistencia menor. | **P2** |
| **UX-RM-04** | KPI 1 columna (`grid-cols-1`) — correcto para mobile. | ✅ |

---

## 10. Accesibilidad

### 10.1 Fortalezas

| Item | Evidencia |
|------|-----------|
| Eye / LogOut | `aria-label` en cada botón fila |
| Búsqueda / selects | `aria-label` o `sr-only` labels |
| Sesión actual | `SessionCurrentMarker` con `role="status"` + texto, no solo color |
| Live regions | `aria-live="polite"` en timestamp y resumen filtros |
| Revoke confirm | `ConfirmDialog` con variant danger |
| Focus fila | Eye y LogOut focusables independientes del `<tr>` click |

### 10.2 Gaps

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-A11Y-01** | `SessionDetailDialog`: tests reportan **falta `Description` / `aria-describedby`** en `DialogContent` (Radix). | **P2** |
| **UX-A11Y-02** | Headers sort: **sin `aria-sort`** en columnas ordenables (pendiente Fase 5 spec). | **P2** |
| **UX-A11Y-03** | Click `<tr>` abre detalle pero `<tr>` **no es focusable** ni activable por teclado — mitigado por Eye obligatorio (spec D-05). | **P3** |
| **UX-A11Y-04** | Combobox usuario: `role="combobox"` custom — sin `aria-activedescendant` completo; funcional pero mejorable. | **P3** |
| **UX-A11Y-05** | Contraste: tokens semánticos `text-text-soft` sobre `bg-surface` — dentro de Capa 1; badges status usan semánticos fijos. **Sin hallazgo.** | ✅ |
| **UX-A11Y-06** | Tooltips: tiempos relativos con `title` absoluto en grilla — ✅. KPI tooltip solo con filtros activos — ✅. | ✅ |

---

## 11. Microinteracciones

| Interacción | Comportamiento | Evaluación |
|-------------|----------------|------------|
| Refresh manual | `RefreshCw` + `opacity-70` panel | ✅ |
| Auto-refresh ON | Icono `RefreshCw` **siempre animado** (`animate-spin`) aunque no haya fetch activo | Ver abajo |
| KPI click | `hover:bg-overlay`, atenuación con filtros | ✅ |
| Fila hover | `hover:bg-overlay/50` | ✅ |
| Dialog collapse UA | Chevron toggle | ✅ |
| Revoke loading | `pageActionsLocked` deshabilita acciones | ✅ |
| Scroll preset expirar | `scrollIntoView` suave al panel | ✅ |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-MI-01** | `RefreshCw` en spin permanente con auto-refresh ≠ Manual sugiere «cargando ahora» cuando solo hay timer programado — **semántica visual ambigua**. | **P2** |
| **UX-MI-02** | Transición `opacity` 150 ms en refresh — sutil y profesional. | ✅ |
| **UX-MI-03** | Highlight sincronía plataforma (`ring-brand-primary`) — feedback claro sin animación excesiva. | ✅ |

---

## 12. Estados UX

### 12.1 Matriz de estados

| Estado | Implementación | Calidad |
|--------|----------------|---------|
| **Loading inicial** | `ActiveSessionsKpiStripSkeleton` + `InvTableSkeleton` / pulse cards | ✅ Sin layout shift KPI |
| **Loading refresh** | Opacity panel + `aria-busy` + spin icon | ✅ |
| **Empty sin filtros** | `IamTableEmptyState` + copy contextual | ✅ |
| **Empty con búsqueda** | Título + descripción «Prueba con otro término…» | ✅ |
| **Empty filtro usuario/plataforma** | Copy específico | ✅ |
| **Error listado** | Banner `text-error bg-error/10` + Reintentar brand | ✅ Patrón UserManagement |
| **Filtered** | KPI atenuado + paginación dual + resumen Fase 3 | ✅ (parcial — falta búsqueda en resumen) |
| **Revoke** | Confirm danger + loading + lock acciones | ✅ |
| **Dialog abierto** | Secciones + footer destructivo | ✅ |
| **Revoke desde dialog** | Cierra dialog → confirm | ✅ B11-10 |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-ST-01** | Cobertura de estados **completa** según V2 SK-01/ES-01/ER-01. | ✅ |
| **UX-ST-02** | Vista cards empty **no usa** `IamTableEmptyState` — copy equivalente pero patrón visual distinto. | **P3** |

---

## 13. Design System ERP (2 capas)

| Regla | Cumplimiento |
|-------|--------------|
| Capa 1 estructura (`bg-page`, `bg-surface`, `text-text-*`, `border-border-*`) | ✅ |
| Capa 2 brand (`bg-brand-primary`, `text-brand-primary`, `ring-brand-primary`) | ✅ |
| Prohibido `bg-brand-surface*` en tablas/formularios | ✅ |
| Semánticos fijos success/error/warning/info en badges e iconos | ✅ |
| Inputs `focus:ring-brand-primary` | ✅ |
| Sin UUID en UI | ✅ |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-DS-01** | **Cumplimiento DS alto** — sin antipatrones graves detectados en código auditado. | ✅ |

---

## 14. Vista Cards — evaluación de valor

### 14.1 Estado actual admin

| Criterio | Tabla | Cards admin |
|----------|-------|-------------|
| Eye + SessionDetailDialog | ✅ | ❌ |
| IP mismatch visual | ✅ | ❌ |
| Sort / column scan | ✅ | ❌ |
| Revoke | ✅ | ✅ (CTA full-width) |
| Densidad 25+ sesiones | Alta | Baja (3 cols grid) |
| Mantenimiento | Canónica | Duplicada |
| Spec v1.1 D-19 / Fase 4 | Vista objetivo | **Deprecar admin** |

### 14.2 Veredicto Cards

| Pregunta | Respuesta |
|----------|-----------|
| ¿Aporta valor en admin enterprise? | **No material** frente a tabla en desktop/tablet. |
| ¿Aporta en mobile? | **Parcial** vs tabla rota, pero **inferior** al stacked row planificado. |
| ¿Debe eliminarse? | **Sí en admin** (Fase 4). Mantener componente para `variant=self` en `MySessionsPage` hasta migración stacked self. |
| ¿Riesgo de eliminarla? | Bajo en admin si se implementa `ActiveSessionsStackedRow` para `< md`. |

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| **UX-CV-01** | Toggle Tabla/Cards admin es **deuda UX** explícita en spec; mezcla preferencia layout con monitoreo (P1-05 auditoría toolbar). | **P1** |
| **UX-CV-02** | Cards admin sin detalle es **regresión de paridad** respecto al estándar enterprise definido en Fase 2. | **P1** |
| **UX-CV-03** | Recomendación: **eliminar toggle admin** y sustituir mobile por stacked row — no invertir en mejorar cards admin. | **P1** (acción Fase 4) |

---

## 15. Registro consolidado de hallazgos

### P0 — Bloqueante UX enterprise

*Ninguno* en flujo desktop tabla + dialog + revoke.

### P1 — Debe resolverse antes de declarar cierre

| ID | Hallazgo |
|----|----------|
| UX-S-02 | Resumen filtros omite búsqueda libre |
| UX-S-06 | Cards admin sin Eye/Dialog |
| UX-SP-03 | Toolbar wrap denso en 1366 px |
| UX-RM-01 | Sin `ActiveSessionsStackedRow` en mobile (desviación spec §9) |
| UX-RM-02 | Tabla no usable en mobile |
| UX-CV-01 | Toggle Tabla/Cards admin (deuda Fase 4) |
| UX-CV-02 | Paridad cards vs tabla rota |

### P2 — Pulido recomendado

| ID | Hallazgo |
|----|----------|
| UX-H-01 | Preámbulo vertical (resumen + nota) |
| UX-S-03 | Ambigüedad búsqueda sesiones vs combobox usuario |
| UX-IC-02 | Iconografía difusa en cards |
| UX-RT-02 | Targets táctiles pequeños toolbar der |
| UX-RM-03 | Empty cards inconsistente |
| UX-A11Y-01 | Dialog sin Description |
| UX-A11Y-02 | Sin aria-sort |
| UX-MI-01 | Spin refresh con auto-refresh ON |

### P3 — Nice-to-have

| ID | Hallazgo |
|----|----------|
| UX-SP-01 | `px-4` vs `px-6` vs UserManagement |
| UX-TY-02 | Capitalización «totales tenant» |
| UX-A11Y-03 | tr click sin teclado |
| UX-A11Y-04 | Combobox a11y avanzado |
| UX-ST-02 | Empty cards distinto a IamTableEmptyState |

---

## 16. Comparativa enterprise — scorecard

| Dimensión | Nota (1–5) | Comentario |
|-----------|------------|------------|
| Jerarquía visual | 4.5 | Consolidación exitosa |
| Consistencia cross-component | 4.0 | Cards rompen paridad |
| Espaciado / densidad | 4.0 | Toolbar al límite 1366 |
| Iconografía | 4.5 | Tabla/dialog fuertes |
| Tipografía | 4.5 | Minor KPI label |
| Desktop 1366–1920 | 4.5 | Listo operativamente |
| Tablet | 3.5 | Usable, toolbar cargado |
| Mobile | 2.0 | Spec no cumplida |
| Accesibilidad | 4.0 | Eye/labels sólidos; gaps Fase 5 |
| Microinteracciones | 4.0 | Spin refresh ambiguo |
| Estados | 4.5 | Completo |
| Design System | 5.0 | Cumplimiento alto |
| vs UserManagement | 4.5 | Más rico; más complejo |
| Vista Cards admin | 2.0 | Eliminar |

**Media ponderada desktop-first:** ~4.3 / 5  
**Media incluyendo mobile:** ~3.8 / 5

---

## 17. Cierre y recomendación de fases

### Lo que está «enterprise terminado» hoy

- Tabla 5 columnas + Dialog + revoke + KPI + filtros server + paginación dual
- Toolbar consolidado + monitoreo Fase 3
- Design System y estados de carga/error/empty
- Desktop 1280+ y tablet landscape operativos

### Lo que impide dictamen A

1. **Mobile** sin stacked row (spec §9)  
2. **Cards admin** con paridad rota y sin justificación post-Fase 4  
3. **Resumen filtros** incompleto respecto a búsqueda activa  

### Fase recomendada para cierre (sin nuevas funcionalidades)

**Fase 4 (spec existente):** eliminar toggle admin, implementar `ActiveSessionsStackedRow`, deprecar cards admin, QA mobile.

**Fase 5 (spec existente):** aria-sort, DialogDescription, auditoría axe focalizada.

**Pulido menor (podría ir en Fase 4 o 5):** resumen filtros + búsqueda, spin refresh solo en fetch, capitalización KPI.

---

## 18. Dictamen formal

| Opción | Aplica |
|--------|--------|
| **A) Pantalla Enterprise terminada** | ❌ Mobile y cards admin impiden |
| **B) Solo requiere pulido visual menor** | ⚠️ Parcial — válido solo para **desktop-only** |
| **C) Requiere otra fase importante antes del cierre** | ✅ **Fase 4** (unificación vista + responsive mobile) |

### **DICTAMEN: C) Requiere otra fase importante antes del cierre**

La pantalla está **lista para operación enterprise en desktop** y supera el listado IAM de referencia en riqueza operativa. El cierre **normativo y multi-viewport** según spec v1.1 requiere ejecutar **Fase 4** (no es rediseño; es deuda planificada). Tras Fase 4 + pulido Fase 5, el dictamen puede ascender a **A** sin cambios de Backend ni contratos.

---

**Fin de auditoría — READ ONLY — sin implementación.**
