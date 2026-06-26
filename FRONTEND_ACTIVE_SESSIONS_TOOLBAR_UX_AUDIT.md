# FRONTEND — Active Sessions Enterprise — Toolbar UX Audit

**Documento:** `FRONTEND_ACTIVE_SESSIONS_TOOLBAR_UX_AUDIT.md`  
**Versión:** 1.0  
**Fecha:** 2026-06-23  
**Modo:** READ ONLY — **sin cambios de código**  
**Especificación:** `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_1.md`  
**Implementación auditada:** Fases 1A + 1B + 2 (reports PHASE_1A, PHASE_1B, PHASE_2)

---

## 0. Resumen ejecutivo

La pantalla **Sesiones Activas** cumple funcionalmente la spec congelada, pero el **toolbar superior presenta fricción cognitiva**: demasiados controles en la zona izquierda, **dos campos de búsqueda con semántica superpuesta (usuario)**, metadatos contextuales **insertados entre KPI y toolbar** (rompiendo el flujo vertical de la spec §3.2), y **acciones de refresh duplicadas** con el mismo icono.

La auditoría propone una **reorganización visual exclusiva** — sin alterar contratos, hooks ni comportamiento — alineada con el patrón IAM de referencia (`UserManagementPage`: búsqueda + un filtro + acciones derecha).

**Dictamen UX:** **Requiere consolidación visual** (P0/P1). No requiere reimplementación de Fases 1A, 1B ni 2.

---

## 1. Diagnóstico visual

### 1.1 Orden vertical actual (de arriba a abajo)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ KPI Strip (4 tiles: totales · Web · Mobile · Ver próximas a expirar)    │
├─────────────────────────────────────────────────────────────────────────┤
│ «Actualizado hace X»                          ← ActiveSessionsUpdatedMeta │
├─────────────────────────────────────────────────────────────────────────┤
│ «247 sesiones activas del tenant»             ← solo si hay filtros      │
│ «49 resultados»                               ← ActiveSessionsFiltered…  │
├─────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (OrgCompanyToolbar)                                              │
│  IZQ: [🔍 Buscar sesiones] [🔍 Filtrar usuario + ▼ select] [▼ Tipo]     │
│  DER: [Tabla|Cards] [Auto/Manual ↻] [↻ Actualizar]                     │
├─────────────────────────────────────────────────────────────────────────┤
│ «La búsqueda no incluye nombre de empresa…»   ← nota fija §3.3           │
├─────────────────────────────────────────────────────────────────────────┤
│ Panel tabla + paginación                                                 │
│   (con filtros: «49 resultados · 247 en el tenant» sobre paginación)    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Orden vertical spec §3.2 (congelado)

```
1. KPI Strip
2. Toolbar (justify-between — filtros izq · acciones der)
3. Panel tabla
4. Paginación
```

**Desviación:** Entre KPI y toolbar hay **hasta tres bloques de texto** (actualizado + copy dual). La spec ubica «Actualizado hace…» junto a auto-refresh en toolbar derecha (§7.3, Fase 3), no como párrafo intermedio.

### 1.3 Inventario de controles en toolbar

| Zona | Control | Tipo visual | Rol UX |
|------|---------|-------------|--------|
| Izq | `OrgToolbarSearch` | Input con icono, ancho fijo | Búsqueda libre sesiones (`search`) |
| Izq | `ActiveSessionsUserFilter` — input | Input search sin icono | Buscar usuarios para poblar select |
| Izq | `ActiveSessionsUserFilter` — select | Native select | Filtro exacto `usuario_id` |
| Izq | Select tipo cliente | Native select | Filtro `client_type` |
| Der | Toggle Tabla / Cards | Segmented control | Vista (Fase 4: eliminar) |
| Der | Auto / Manual | Botón con texto + icono | Auto-refresh (Fase 3: 60 s, localStorage) |
| Der | Icono RefreshCw | Icon button | Refresh manual KPI + listado |

### 1.4 Controles fuera del toolbar pero en zona superior

| Elemento | Ubicación | Impacto |
|----------|-----------|---------|
| KPI Web / Mobile | Franja KPI | Atajos de filtro `client_type` |
| KPI Total tenant | Franja KPI | Reset filtros |
| Copy dual filtrado | Entre KPI y toolbar | Contexto resultados |
| Nota empresa | Bajo toolbar | Limitación BE búsqueda |

---

## 2. Problemas encontrados

### P0 — Confusión inmediata / scan path roto

| ID | Problema | Evidencia |
|----|----------|-----------|
| **P0-01** | **Doble búsqueda orientada a «usuario»** | Placeholder sesiones: «Buscar por usuario, nombre o IP…». Filtro usuario: input «Filtrar por usuario…» + select. Un admin no distingue cuál usar para «ver sesiones de Juan». |
| **P0-02** | **Metadatos entre KPI y toolbar** | `ActiveSessionsUpdatedMeta` + `ActiveSessionsFilteredResultsMeta` interrumpen el par KPI→filtros. El ojo recorre KPI → texto → texto → controles → tabla; la spec define KPI → controles → tabla. |
| **P0-03** | **Dos botones RefreshCw en toolbar derecho** | Toggle Auto/Manual y botón Actualizar comparten icono. En mobile (solo icono en toggle) la diferencia es opaca. |

### P1 — Jerarquía débil / redundancia perceptual

| ID | Problema | Evidencia |
|----|----------|-----------|
| **P1-01** | **Filtro usuario ocupa altura doble en fila horizontal** | `ActiveSessionsUserFilter` apila input + select en columna (`flex-col gap-1`) dentro de `flex-wrap` horizontal. Desalinea respecto a search y select tipo. |
| **P1-02** | **Filtro plataforma duplicado (KPI + select)** | Tiles Web/Mobile en KPI y select «Todos/Web/Mobile» en toolbar controlan el mismo param. Funcionalmente correcto (spec §6.1), pero **sin indicador visual de sincronía** (select no refleja estado activo del tile salvo por valor). |
| **P1-03** | **Copy de resultados triplicado con filtros** | (a) Meta sobre toolbar: «247 sesiones…» + «49 resultados». (b) Línea pre-paginación: «49 resultados · 247 en el tenant». (c) ErpPagination: «Mostrando 1 a 25 de 49». Información correcta pero **redundante**. |
| **P1-04** | **Spec §7.1 vs presentación** | Spec congela «Combobox async» para usuario; implementación = search + select nativo. Cumple param BE pero **no cumple patrón visual IAM** ni densidad enterprise. |
| **P1-05** | **Acciones de vista mezcladas con monitoreo** | Toggle Tabla/Cards (legacy, Fase 4 elimina) comparte grupo con refresh. Mezcla **preferencia de layout** con **operación de datos**. |

### P2 — Pulido / alineación futura

| ID | Problema | Evidencia |
|----|----------|-----------|
| **P2-01** | **Nota empresa como párrafo suelto** | Texto útil pero ocupa línea completa bajo toolbar; fácil de ignorar o confundir con error/ayuda global. |
| **P2-02** | **Sin chips de filtros activos ni «Limpiar»** | Reset solo vía tile KPI total o borrado manual. Enterprise tables suelen mostrar filtros activos removibles. |
| **P2-03** | **Presets sort ausentes en toolbar** | Previsto Fase 3 (§7.1); hoy sort solo por headers — toolbar quedará más cargado si no se planifica fila. |
| **P2-04** | **Select tipo sin label visible** | Solo `sr-only`; en toolbar denso el select «Todos/Web/Mobile» flota sin etiqueta corta. |

---

## 3. Duplicidad de filtros — análisis

| Par de controles | ¿Redundante en API? | ¿Redundante en UX? | Recomendación |
|------------------|---------------------|--------------------|---------------|
| Búsqueda libre vs Filtro usuario | **No** — `search` vs `usuario_id` | **Sí (perceptual)** | **Mantener ambos** con labels diferenciados: «Buscar en listado» vs «Usuario (exacto)». No fusionar. |
| Búsqueda libre vs KPI Web/Mobile | **No** — `search` vs `client_type` | No | Mantener separados. |
| KPI Web/Mobile vs Select tipo | **Sí (mismo param)** | **Parcial** | **Mantener ambos** (spec §6.1): KPI = atajo analítico; select = control explícito. Añadir **estado visual sincronizado** (select refleja tile; tile activo resaltado). |
| Input búsqueda usuarios vs Select usuario | **No** — alimenta opciones vs selección | **Sí (presentación)** | **Fusionar en un solo combobox** (una sola caja visible). El input interno para buscar opciones no debe ser campo independiente en toolbar. |
| Copy dual meta vs Copy paginación | N/A | **Sí** | **Consolidar**: una sola zona de contexto (chips o línea única sobre tabla). |
| Auto-refresh vs Refresh manual | **No** | No (distinto propósito) | **Agrupar visualmente** con «Actualizado hace…» (§7.3). |

**Conclusión:** No eliminar filtros del contrato. **Fusionar solo presentación** del filtro usuario (1 control) y **consolidar copy contextual** (1 ubicación).

---

## 4. Flujo de uso (recorrido izquierda → derecha)

### 4.1 Escaneo actual

1. Admin ve KPIs globales (contexto tenant).
2. Lee «Actualizado hace…» — **¿es filtro? ¿es estado?** (ambiguo).
3. Si hay filtros, lee dos líneas numéricas **antes** de ver controles.
4. Encuentra toolbar: **tres controles de filtro** en izquierda (uno doble altura).
5. Derecha: vista + dos refresh.
6. Nota empresa en texto pequeño.
7. Tabla.

### 4.2 Respuestas

| Pregunta | Respuesta |
|----------|-----------|
| ¿Un administrador entiende **inmediatamente** cómo filtrar sesiones? | **Parcialmente.** El select tipo y los KPI Web/Mobile son claros. La distinción búsqueda libre vs filtro usuario **no es inmediata** (P0-01). |
| ¿Hay controles que generan confusión? | **Sí:** (1) dos campos «usuario», (2) dos RefreshCw, (3) bloques de texto entre KPI y filtros, (4) copy numérico duplicado arriba y abajo. |

### 4.3 Flujo objetivo (post-consolidación)

KPI (contexto) → **una fila toolbar** (filtrar + ordenar + actualizar) → **chips filtros activos** (opcional) → tabla.

El admin debe poder responder en &lt;3 s: «¿Qué filtros tengo?» y «¿Cómo los cambio?».

---

## 5. Consistencia UX Enterprise

Comparación con **patrón IAM referencia** (`UserManagementPage`) y tablas admin SaaS:

| Dimensión | IAM Usuarios (referencia) | Sesiones Activas (actual) | Gap |
|-----------|---------------------------|---------------------------|-----|
| Toolbar | 1 búsqueda + 1 filtro + 1 acción primaria | 2 búsquedas + 2 selects + 3 acciones secundarias | Densidad alta |
| KPI / métricas | No aplica | Franja 4 tiles — **correcto** para monitoreo | OK |
| Filtros activos | Implícito (checkbox) | Dispersos; sin chips | Mejorable |
| Acciones datos | Refresh implícito en mutaciones | Refresh explícito duplicado | Consolidar |
| Jerarquía | TB-01: toolbar → tabla | Meta intercalada | Desalineado §3.2 |
| Placeholders | Uno por campo | Dos mencionan «usuario» | Conflicto semántico |

**Fortalezas enterprise actuales:** KPI strip clickable, copy dual tenant vs resultados (§6.2), tokens Capa 1, sin selector empresa local (ME-02), tabla 5 columnas sin scroll horizontal.

**Debilidades:** Toolbar no sigue la **regla de oro enterprise** — «primary filters on one baseline, secondary/monitoring on the right».

---

## 6. Información contextual — nota empresa

**Texto actual (§3.3):**  
«La búsqueda no incluye nombre de empresa. Use el listado o filtre por usuario.»

| Opción | Evaluación | Recomendación |
|--------|------------|---------------|
| Permanecer bajo toolbar | Cumple spec Fase 1A; baja visibilidad | **Transitorio OK** |
| Mover junto a KPI | Mezcla contexto analítico con limitación BE | No |
| Integrar al campo búsqueda | Icono `Info` + tooltip o `description` bajo input | **Recomendado (P2)** — reduce ruido vertical |
| Eliminar | Pierde aviso proactivo | No hasta empty state Fase 3 (§3.3 REV-P2-05) |

**Propuesta:** Mantener contenido; **cambiar ubicación** a helper del `OrgToolbarSearch` (tooltip o texto `text-xs` pegado al input). Repetir variante en empty state cuando Fase 3 lo implemente — sin duplicar párrafo fijo permanente.

---

## 7. Responsive (propuesta sin implementar)

### Desktop (≥ lg, 1024 px)

```
[KPI ─────────────────────────────────── 4 cols ──────────────────────────────]

[ 🔍 Buscar listado    ] [ Usuario ▼ combobox ] [ Plataforma ▼ ] [ Orden ▼ F3 ]
                                    [ Actualizado hace 2 min · Auto OFF · ↻ ]

[ chip: Web × ] [ chip: usuario × ] [ Limpiar filtros ]          (si activos)

[ Tabla 5 cols ───────────────────────────────────────────────────────────── ]
```

### Tablet (md–lg)

- KPI: 2×2 grid (actual OK).
- Toolbar: **fila 1** filtros (search full-width o 50%); **fila 2** usuario + plataforma; **fila 3** derecha refresh group.
- User combobox **una sola línea** — crítico (elimina `flex-col`).

### Mobile (&lt; md)

- KPI: 1 columna.
- Toolbar: stack vertical ordenado:
  1. Búsqueda listado (100%)
  2. Usuario combobox (100%)
  3. Plataforma select (100%)
  4. Barra acciones: `[↻ Actualizar]` + overflow menu para Auto / Vista (hasta Fase 4)
- Nota empresa → tooltip en icono info del search.
- Copy dual → **solo** sobre paginación (eliminar bloque intermedio).

---

## 8. Wireframe ASCII — toolbar recomendado definitivo

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  SESIONES ACTIVAS (header app — fuera scope toolbar)                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────────────┐   ║
║  │ 247      │ │ 180 Web  │ │ 67 Mobile│ │ Ver próximas a expirar →    │   ║
║  │ totales  │ │          │ │          │ │                             │   ║
║  └──────────┘ └──────────┘ └──────────┘ └─────────────────────────────┘   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  FILA TOOLBAR ÚNICA — justify-between, items-center, gap-3                   ║
║                                                                              ║
║  ┌─ ZONA FILTROS (min-w-0 flex-wrap) ─────────────────────────────────────┐  ║
║  │ [🔍 Buscar por usuario, nombre o IP… ⓘ]                               │  ║
║  │ [👤 Usuario: Todos ▼]  ← combobox async único                         │  ║
║  │ [📱 Plataforma: Todos ▼]                                              │  ║
║  │ [↕ Orden: Más recientes ▼]  ← Fase 3                                  │  ║
║  └───────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌─ ZONA MONITOREO (shrink-0) ───────────────────────────────────────────┐  ║
║  │ Actualizado hace 2 min  │  [Auto OFF ▼]  │  [↻]                        │  ║
║  └───────────────────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  (opcional, solo si filtros)  Filtros: [Web ×] [jdoe ×]  Limpiar todo       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ┌─ PANEL TABLA ──────────────────────────────────────────────────────────┐  ║
║  │ Usuario │ Cliente │ IP │ Estado │ Acciones                             │  ║
║  │ ...                                                                    │  ║
║  ├────────────────────────────────────────────────────────────────────────┤  ║
║  │ 49 resultados · 247 en el tenant          Mostrando 1–25 de 49  [◀ ▶]   │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════╝

ⓘ = tooltip nota empresa (sin párrafo bajo toolbar)
```

**Eliminado del toolbar definitivo (Fase 4 spec):** toggle Tabla/Cards admin.

---

## 9. Toolbar recomendado — especificación UX

### 9.1 Zona izquierda — Filtros (orden fijo)

| # | Control | Label visible corto | Placeholder / valores | Notas |
|---|---------|---------------------|----------------------|-------|
| 1 | Búsqueda listado | — (icono suficiente) | «Buscar por usuario, nombre o IP…» | Helper ⓘ nota empresa |
| 2 | Usuario exacto | «Usuario» | «Filtrar por usuario…» | **Un solo combobox** |
| 3 | Plataforma | «Plataforma» | Todos · Web · Mobile | Sync visual con KPI |
| 4 | Orden | «Orden» | Presets §4.2 | Fase 3 |

**Baseline alignment:** todos los inputs/selects **misma altura** (`py-1.5` / `IamSearchInput`).

### 9.2 Zona derecha — Monitoreo

| Control | Comportamiento |
|---------|----------------|
| «Actualizado hace…» | Texto muted, no clickable |
| Auto-refresh | Toggle/dropdown OFF default (Fase 3) |
| Refresh manual | Un solo icono RefreshCw con `aria-label` «Actualizar listado y métricas» |

### 9.3 Contexto resultados — una sola ubicación

| Estado | Dónde mostrar |
|--------|---------------|
| Sin filtros | Solo ErpPagination estándar |
| Con filtros | **Línea única** en footer panel: «X resultados · Y en el tenant» integrada con paginación (no bloque sobre toolbar) |

Retirar `ActiveSessionsFilteredResultsMeta` de la zona entre KPI y toolbar en la consolidación visual.

### 9.4 KPI strip — sin cambios funcionales

Permanece **encima** del toolbar. Tiles Web/Mobile siguen siendo atajos; al clicar, select Plataforma debe reflejar valor (estado controlled ya existe — solo refuerzo visual).

---

## 10. Justificación UX

1. **Ley de Miller / carga cognitiva:** Reducir campos visibles de filtro de 4+ a 3 en baseline (+ orden F3) disminuye decisiones simultáneas.
2. **Affordance:** Un combobox usuario comunica «elijo una entidad»; búsqueda libre comunica «texto parcial». Separación **semantic + visual** elimina P0-01.
3. **Proximidad (Gestalt):** Filtros juntos; monitoreo juntos. Meta «actualizado» pertenece al cluster temporal derecho (§7.3), no al cluster analítico KPI.
4. **Consistencia IAM:** Alineación con `UserManagementPage` (1 search + filtros compactos) refuerza predictibilidad cross-módulo.
5. **Progressive disclosure:** Nota empresa en tooltip evita ruido para usuarios que ya conocen la limitación; empty state Fase 3 cubre caso descubrimiento.
6. **Spec compliance:** La consolidación **restaura** §3.2 (KPI → toolbar → tabla) sin contradecir §7.1 controles ni params BE.

---

## 11. Riesgo de implementación

| Aspecto | Nivel | Detalle |
|---------|-------|---------|
| Funcional / regresión Fases 1A–2 | **Bajo** | Mismos state vars y hooks; solo reorder JSX + CSS layout |
| Filtro usuario → combobox | **Medio** | Refactor **presentacional** de `ActiveSessionsUserFilter`; param `usuario_id` intacto |
| Copy dual relocation | **Bajo** | Mover/eliminar render de meta intermedia; paginación ya tiene línea |
| Responsive | **Medio** | Probar breakpoints sm/md/lg; user filter `flex-col` es principal pain point |
| Fase 3 dependencies | **Bajo** | Reservar slot «Orden» evita segundo refactor |
| Fase 4 toggle removal | **Nulo en esta auditoría** | Ya planificado; consolidación puede anticipar layout sin toggle |
| a11y | **Bajo** | Labels visibles cortos mejoran sobre solo `sr-only` |
| Testing | **Bajo** | Tests unitarios de componentes no dependen de orden DOM; E2E visual manual recomendado |

**Estimación esfuerzo:** 1–2 días frontend (consolidación visual + combobox usuario + QA responsive). **No** epic; ticket UX polish independiente de Fase 3 funcional.

---

## 12. Compatibilidad con Fases 1A, 1B y 2

| Fase | ¿Requiere reimplementación? | Alcance consolidación |
|------|----------------------------|------------------------|
| **1A** — Tabla 5 cols, búsqueda, tipo, sort headers | **No** | Tabla intacta. Toolbar conserva mismos controles, mejor ordenados. |
| **1B** — KPI strip, updated meta, invalidación | **No** | KPI sin cambios. «Actualizado hace…» **reposicionado**, no reescrito. |
| **2** — Dialog, Eye, usuario_id, IP mismatch, copy dual | **No** | Dialog/tabla/hooks intactos. Filtro usuario: **misma API**, distinta shell. Copy dual: **misma información**, una ubicación. |

**Confirmación explícita:** Las Fases 1A, 1B y 2 **no requieren reimplementación funcional**. La propuesta es **reorganización visual y de copy** en `ActiveSessionsPage` y presentación de `ActiveSessionsUserFilter`, compatible con la spec v1.1 y con las fases futuras 3–4 (slots reservados).

---

## 13. Matriz de prioridad — plan de acción sugerido

| Prioridad | Acción | Impacto |
|-----------|--------|---------|
| **P0** | Mover meta «Actualizado» + refresh group a toolbar derecha; eliminar bloque entre KPI y toolbar | Restaura scan path §3.2 |
| **P0** | Diferenciar labels: búsqueda listado vs usuario exacto; unificar filtro usuario en combobox | Elimina confusión principal |
| **P0** | Unificar refresh: un icono manual + toggle auto claramente etiquetados | Elimina ambigüedad iconos |
| **P1** | Consolidar copy dual en footer tabla únicamente | Reduce redundancia |
| **P1** | Labels visibles «Plataforma» / sync KPI ↔ select | Clarifica atajos KPI |
| **P1** | Baseline horizontal filtros (eliminar stack vertical user filter) | Alineación enterprise |
| **P2** | Nota empresa → tooltip/helper en search | Limpia vertical |
| **P2** | Chips filtros activos + Limpiar | Patrón admin estándar |
| **P2** | Slot Orden (Fase 3) en wireframe | Evita tercer refactor |

---

## 14. Referencias

- `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_1.md` — §3.2, §3.3, §6.2, §7.1–7.3, §13 Fases 3–4
- `src/features/admin/pages/ActiveSessionsPage.tsx` — implementación auditada
- `src/features/admin/components/iam/sessions/ActiveSessionsUserFilter.tsx` — filtro usuario
- `src/features/admin/pages/UserManagementPage.tsx` — patrón toolbar IAM referencia

---

**Fin del documento — READ ONLY. Ningún cambio de código realizado.**
