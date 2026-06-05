# PLATFORM_DASHBOARD_UX_OPTIMIZATION_AUDIT.md

**Tema:** Auditoría UX/UI — optimización densidad e jerarquía visual  
**Fecha:** 2026-06-03  
**Ruta:** `/super-admin/dashboard` → `SuperAdminDashboard.tsx`  
**Baseline funcional:** P0 + P1-A + P1-B aprobados (datos reales)  
**Tipo:** Auditoría exclusiva — **sin código, sin Backend, sin nuevas funcionalidades**

**Referencias de código analizadas:**

- `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx`
- `src/shared/components/layout/Header.tsx`, `LayoutWrapper.tsx`, `useShellBreadcrumbs.ts`
- Superficies comparación: Clientes, Módulos, Auditoría Global, Catálogos (Países)

---

## 0. Resumen ejecutivo

| Dimensión | Veredicto |
|-----------|-----------|
| **Funcionalidad** | ✅ Datos reales; widgets operativos |
| **Jerarquía** | ⚠️ Redundancia título breadcrumb + H1 body + subtítulo largo |
| **Densidad** | ❌ Baja — 11 tarjetas KPI apiladas consumen ~2 viewports antes de alertas/actividad |
| **Layout** | ⚠️ Secuencial tipo «informe»; alertas operativas demasiado abajo |
| **Consistencia Platform** | ❌ Dashboard es outlier (`text-3xl`, `rounded-xl`, `p-6`, H1 en body) |
| **Prioridad optimización** | Compactar KPIs, reordenar alertas, alinear shell Platform |

**Conclusión:** El dashboard funciona como consola de datos pero **no como consola operativa densa**. La optimización debe ser **reorganización visual y compactación** (sin P1-C ni endpoints nuevos).

---

## 1. Snapshot actual

### 1.1 Árbol visual (orden de scroll)

```
┌─ Shell global ─────────────────────────────────────────────────────────┐
│ Header h-16: [Home > … breadcrumb menú]  [search]  [user]            │
│ LayoutWrapper: px-2..6 py-2..3                                        │
└──────────────────────────────────────────────────────────────────────┘
┌─ Body página (SuperAdminDashboard) ──────────────────────────────────┐
│ [H1 text-3xl] Dashboard de Super Administrador          mb-8         │
│ [p text-lg]   Visión general del sistema multi-tenant                │
├──────────────────────────────────────────────────────────────────────┤
│ FILA P0 — grid lg:4 md:2 gap-6 mb-8                                  │
│ [Clientes Activos][Total Clientes][Total Usuarios][Módulos]          │
│ cards: rounded-xl p-6, icon h-8, value text-2xl                      │
├──────────────────────────────────────────────────────────────────────┤
│ FILA P1-A — grid md:3 gap-6 mb-8                                     │
│ [Logins fallidos 24h][Logins exitosos][Sync fallidas]                │
├──────────────────────────────────────────────────────────────────────┤
│ SECCIÓN P1-B — mb-8                                                  │
│ [H2 text-lg] Salud de cartera                                        │
│ grid lg:4: [Suspendidos][Trial][Cancelados][Morosos]  mb-6           │
│ card full-width: Donut W14 h-64 + leyenda                             │
├──────────────────────────────────────────────────────────────────────┤
│ PlatformAlertBanner — 0–N filas rounded-xl p-4        mb-8           │
├──────────────────────────────────────────────────────────────────────┤
│ grid lg:2 gap-8 (solo 1 col ocupada lg:col-span-2)                   │
│ Panel Actividad Reciente — header p-6 + lista p-6                    │
├──────────────────────────────────────────────────────────────────────┤
│ Acciones Rápidas — mt-8 p-6, grid md:3                               │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Inventario cuantitativo

| Elemento | Cantidad | Clases dominantes |
|----------|----------|-------------------|
| Títulos body | H1 + H2 + 3× H3 | `text-3xl`, `text-lg` |
| Tarjetas KPI | **11** | `rounded-xl shadow-sm border p-6 gap-6` |
| Filas KPI independientes | **3** | `mb-8` entre filas |
| Paneles secundarios | 3 | Alertas, Actividad, Acciones |
| Gráfico donut | 1 | altura fija `h-64` (256px) |
| Iconos KPI | 11× `h-8 w-8` | Horizontal flex + `ml-4` |

### 1.3 Estimación densidad vertical (desktop ~900px útil)

| Bloque | Altura aprox. |
|--------|----------------|
| Header shell | 64px |
| Layout padding + H1/subtítulo | ~120px |
| 3 filas KPI (11 cards) | ~360–420px |
| Donut + título cartera | ~320px |
| Alertas (si 2–3) | ~120–180px |
| Actividad (5 ítems) | ~280px |
| Acciones rápidas | ~120px |
| **Total scroll** | **~1.400–1.500px** (~1,5–1,7 viewports) |

**Actividad reciente** y **acciones rápidas** quedan **below the fold** en laptop 768px alto.

---

## 2. Jerarquía visual

### 2.1 Capas de encabezado

| Capa | Ubicación | Contenido típico en dashboard |
|------|-----------|-------------------------------|
| **Breadcrumb** | `Header.tsx` | Home → ítem menú sidebar (p. ej. módulo + «Dashboard») |
| **Fallback header** | Si `breadcrumbs.length === 0` | Icono Home + texto «Dashboard» `text-lg font-semibold` |
| **H1 body** | `SuperAdminDashboard` L67–70 | «Dashboard de Super Administrador» `text-3xl font-bold` |
| **Subtítulo body** | L71–73 | «Visión general del sistema multi-tenant» `text-lg text-text-soft` |

### 2.2 Redundancias detectadas

| Problema | Severidad | Detalle |
|----------|-----------|---------|
| **Triple identificación de página** | Alta | Breadcrumb + H1 + subtítulo repiten «dashboard / visión general» |
| **H1 más grande que resto Platform** | Media | Clientes/Módulos **comentaron** H1 body; Catálogos/Auditoría usan `text-2xl` o solo breadcrumb |
| **Subtítulo `text-lg`** | Media | Ocupa espacio equivalente a una fila KPI; poco valor operativo post-P1 |
| **H2 «Salud de cartera»** | Baja | Necesario como separador semántico; podría integrarse en label de sección compacta |

### 2.3 Jerarquía operativa actual vs deseada

| Prioridad operativa | Posición actual | Problema |
|--------------------|-----------------|----------|
| Alertas accionables | Después de 11 KPIs + donut | Operador debe scroll para ver incidentes |
| KPIs seguridad 24h | Fila 2 | Correcto conceptualmente; perdido entre filas similares |
| Actividad reciente | Penúltimo bloque | Tarde para monitoreo diario |
| Acciones rápidas | Footer | Patrón válido pero invisible tras scroll largo |

**Recomendación jerárquica:** 1) Contexto mínimo (breadcrumb/toolbar) → 2) **Alertas** → 3) KPIs agrupados → 4) Contenido analítico (donut + actividad) → 5) Acciones.

---

## 3. Densidad de información

### 3.1 Tarjetas KPI

| Atributo | Dashboard actual | Clientes / Módulos / Auditoría KPI |
|----------|------------------|-------------------------------------|
| Padding | `p-6` (24px) | Auditoría panel: `p-4`; toolbar: `p-4` |
| Radio | `rounded-xl` | `rounded-lg` |
| Icono | `h-8 w-8` + `ml-4` | Auditoría: `h-8 w-8` en `p-4` (similar) |
| Valor | `text-2xl font-semibold` | Auditoría: `text-2xl` |
| Layout | Icono horizontal siempre | Mismo patrón |

**Hallazgo:** cada KPI ocupa ~100–112px de alto con **mucho padding vacío** lateral (icono + label corto). No hay subtexto contextual (p. ej. «últimas 24 h», «vs total») que justifique la altura.

### 3.2 Espaciado vertical

| Token | Uso repetido | Impacto |
|-------|--------------|---------|
| `mb-8` | Entre casi todas las secciones (32px) | Acumula ~160px solo en márgenes |
| `gap-6` | Grids KPI (24px) | Estándar; aceptable |
| `mt-8` | Acciones rápidas | Separación extra al final |
| `space-y-4` | Filas actividad | OK para legibilidad |

### 3.3 Espaciado horizontal

| Aspecto | Estado |
|---------|--------|
| `LayoutWrapper` max padding `lg:px-6` | OK |
| P0 `lg:grid-cols-4` | 4 columnas en ≥1024px — bien en desktop ancho |
| P1-A `md:grid-cols-3` | Salto a 3 cols en 768px — fila ancha con poco contenido por card |
| Donut full-width | No comparte fila con KPIs cartera — **desperdicia ancho** en desktop |

### 3.4 Aprovechamiento viewport

| Viewport | KPIs visibles sin scroll | Alertas visibles |
|----------|--------------------------|------------------|
| 1366×768 laptop | ~Fila P0 parcial | No |
| 1920×1080 desktop | P0 + parte P1-A | No |
| 768×1024 tablet | P0 completa | No |

**Densidad información / viewport:** **baja** — ratio alto de «cajas vacías» vs datos (11 números enteros + 1 gráfico + 5 logs).

---

## 4. Layout — evaluación por bloque

| Bloque | Ubicación actual | Evaluación | Nota |
|--------|------------------|------------|------|
| **KPIs P0** | Fila 1, 4 cols | ✅ Grupo lógico «Plataforma» | Duplicidad icono Building en 2 cards |
| **KPIs P1-A** | Fila 2, 3 cols | ⚠️ Visualmente igual a P0 | Falta label sección «Seguridad 24h» |
| **KPIs P1-B** | Fila 3 + H2 | ⚠️ Cuarta fila de cards idénticas | Fatiga visual |
| **Donut W14** | Bajo KPIs cartera, full width | ⚠️ Desacoplado | Debería compartir fila en desktop |
| **Alertas** | Post cartera | ❌ Orden subóptimo | Mover arriba (post-toolbar) |
| **Actividad** | Post alertas, pseudo 2-col | ⚠️ Wrapper `lg:grid-cols-2` innecesario | Preparar columna derecha futura P1-C |
| **Acciones rápidas** | Footer | ⚠️ OK patrón; mala visibilidad | Considerar barra compacta o sidebar |

### 4.1 Layout objetivo SaaS moderno (propuesta)

Principios: **zona de alertas primero**, **KPIs compactos por dominio**, **2 columnas analíticas**, **sin nuevos widgets**.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb shell — sin H1 body redundante]                               │
│ Toolbar compacto: «Consola Platform» · Actualizado hace Xm · [↻]        │
├──────────────────────────────────────────────────────────────────────────┤
│ ALERTAS (compact stack, max 3 visibles + «ver todas»)                     │
├──────────────────────────────────────────────────────────────────────────┤
│ RESUMEN PLATAFORMA (strip compacto, 4 cols, p-4, text-xl)               │
│ Activos | Total clientes | Usuarios | Módulos catálogo                    │
├──────────────────────────────────────────────────────────────────────────┤
│ SEGURIDAD 24h (strip 3 cols compacto, borde lateral o bg-subtle)         │
│ Fallidos | Exitosos | Sync fallidas                                       │
├───────────────────────────────┬──────────────────────────────────────────┤
│ CARTERA (4 mini-KPIs 2×2)     │ DISTRIBUCIÓN PLAN (donut h-48)           │
│ Suspend. Trial Cancel. Moroso   │ nota parcial snapshot                    │
├───────────────────────────────┴──────────────────────────────────────────┤
│ OPERACIÓN (grid 2 cols lg)                                                │
│ Actividad auth (lista densa)  │ Acciones rápidas verticales / chips       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Beneficios:**

- Alertas above the fold en laptop
- De 11 cards grandes → 3 **bandas** semánticas + 1 panel 2 cols
- Actividad y acciones en misma zona operativa (menos scroll al footer)
- Donut comparte fila con KPIs cartera (mejor uso ancho)

---

## 5. Responsive

### 5.1 Desktop (≥1280px)

| Aspecto | Actual | Riesgo |
|---------|--------|--------|
| 4+3+4 KPIs en filas | Mucho scroll vertical | Medio |
| Donut full width | Subutiliza columnas | Medio |
| Actividad full width | OK legibilidad | Bajo |

**Objetivo:** 2–3 bandas + grid 2 cols centro.

### 5.2 Laptop (1024–1279px)

| Aspecto | Actual |
|---------|--------|
| P0 `lg:grid-cols-4` | 4 cols apretadas; labels wrap |
| P1-A 3 cols | OK |
| P1-B 4 cols | Cards estrechas |

**Objetivo:** P0 4 cols compactas `p-4`; cartera 2×2 + donut stack en `< lg`.

### 5.3 Tablet (768–1023px)

| Aspecto | Actual |
|---------|--------|
| P0 `md:grid-cols-2` | 2×2 — OK |
| P1-A 3 cols en md | 3 cols puede apretar labels «Logins exitosos (24 h)» |
| Scroll total | Muy largo (~2+ viewports solo KPIs) |

**Objetivo:** Todas las bandas KPI → 2 cols; donut debajo cartera; alertas sticky opcional.

### 5.4 Mobile (<768px)

| Aspecto | Actual |
|---------|--------|
| 1 col KPIs | 11 scrolls de cards — **crítico** |
| Acciones 1 col | OK |

**Objetivo:** KPIs colapsables por sección (accordion «Seguridad», «Cartera») o carrusel horizontal.

---

## 6. Consistencia con superficies Platform

### 6.1 Matriz comparativa

| Patrón | Dashboard | Clientes | Módulos | Auditoría Global | Catálogos |
|--------|-----------|----------|---------|------------------|-----------|
| H1 body | ✅ `text-3xl` | ❌ comentado | ❌ comentado | ✅ `text-2xl` | ❌ sin H1 |
| Subtítulo body | ✅ `text-lg` | ❌ comentado | ❌ comentado | ✅ `text-sm` | ❌ |
| Breadcrumb shell | ✅ | ✅ | ✅ | ✅ | ✅ |
| Toolbar card first | ❌ | ✅ `p-4 rounded-lg` | ✅ | ❌ (filtros en panel) | ✅ |
| Radio cards | `rounded-xl` | `rounded-lg` | `rounded-lg` | `rounded-lg` | `rounded-lg` |
| Padding cards | `p-6` | `p-4` toolbar | `p-4` | `p-4` KPIs | `p-4` |
| Back link dashboard | — | — | — | ✅ | — |

### 6.2 Hallazgos de inconsistencia

1. **Dashboard es la única superficie** con H1 `text-3xl` + subtítulo `text-lg` activos.
2. **`rounded-xl`** solo en dashboard (KPIs, paneles, alertas); resto Platform usa **`rounded-lg`**.
3. **Sin toolbar** de acciones contextuales (refresh, rango 24h) mientras Módulos/Clientes lideran con barra superior.
4. **Iconografía KPI:** 11 iconos grandes sin componente compartido (`DashboardKpiCard`) — duplicación markup vs oportunidad DRY con Auditoría KPI row.
5. **Colores hardcoded** en donut (`#3b82f6`…) vs tokens semánticos del design system — menor prioridad visual dark mode.

### 6.3 Alineación recomendada (sin perder identidad «home»)

| Ajuste | Target Platform |
|--------|-----------------|
| Eliminar o reducir H1 body | Igual Clientes/Módulos |
| `rounded-lg`, `p-4` en KPIs | Igual Catálogos |
| Toolbar compacto superior | Variante dashboard del patrón Clientes |
| Títulos sección `text-sm uppercase tracking-wide text-text-soft` | Estilo operativo SaaS |

---

## 7. Problemas UX (priorizados)

| ID | Problema | Severidad | Impacto |
|----|----------|-----------|---------|
| UX-01 | Alertas below the fold tras 11 KPIs + donut | **Alta** | Operador pierde incidentes |
| UX-02 | Redundancia breadcrumb + H1 + subtítulo | **Alta** | Ruido, menos espacio útil |
| UX-03 | 11 tarjetas KPI homogéneas — fatiga visual | **Alta** | Difícil escanear dominios |
| UX-04 | Scroll ~1,5 viewport hasta actividad | **Media** | Baja eficiencia consola |
| UX-05 | Donut full-width desacoplado de cartera | **Media** | Desperdicio horizontal |
| UX-06 | Grid `lg:grid-cols-2` con un solo hijo | **Baja** | Código/confusión layout |
| UX-07 | Acciones rápidas al final del scroll | **Media** | Navegación tardía |
| UX-08 | Sin indicador «última actualización» | **Media** | Confianza temporal KPIs |
| UX-09 | Mobile: 11 cards apiladas | **Alta** | UX móvil pobre |
| UX-10 | Inconsistencia `rounded-xl` / `p-6` vs Platform | **Media** | Percepción producto fragmentado |
| UX-11 | Dos cards P0 con mismo icono Building | **Baja** | Diferenciación visual |
| UX-12 | Banner alertas: N filas completas ocupan mucho | **Media** | Densidad alertas |

---

## 8. Mock textual — layout recomendado

```
╔══════════════════════════════════════════════════════════════════════════╗
║  🏠 Platform  ›  Dashboard                          [↻] hace 1 min      ║
╠══════════════════════════════════════════════════════════════════════════╣
║  ⚠ 70 logins fallidos en 24h — Ver detalle                    [×]       ║
║  ⚠ 3 sync fallidas — Ver detalle                              [×]       ║
╠══════════════════════════════════════════════════════════════════════════╣
║  RESUMEN PLATAFORMA                                                       ║
║  ┌─────────┬─────────┬─────────┬─────────┐                               ║
║  │ 38      │ 42      │ 120     │ 24      │  ← p-4, text-xl, gap-4       ║
║  │ Activos │ Total   │ Usuarios│ Módulos │                               ║
║  └─────────┴─────────┴─────────┴─────────┘                               ║
╠══════════════════════════════════════════════════════════════════════════╣
║  SEGURIDAD · últimas 24 h                                                 ║
║  ┌──────────────┬──────────────┬──────────────┐                          ║
║  │ 70 fallidos  │ 1180 OK      │ 3 sync ↯     │                          ║
║  └──────────────┴──────────────┴──────────────┘                          ║
╠═══════════════════════════════╦══════════════════════════════════════════╣
║  CARTERA CLIENTES             ║  PLANES (W14)                            ║
║  ┌────┬────┬────┬────┐        ║       ╭───╮                              ║
║  │ 3  │ 8  │ 2  │ 1  │        ║      ╱     ╲  Básico 40%                 ║
║  │Susp│Tr. │Can.│Mor.│        ║     │ donut │  Prof 35%                  ║
║  └────┴────┴────┴────┘        ║      ╲     ╱  …                         ║
║  snapshot 42/42               ║       ╰───╯                              ║
╠═══════════════════════════════╩══════════════════════════════════════════╣
║  ┌─ Actividad reciente ──────────────┬─ Acciones ─────────────────────┐  ║
║  │ ACME · login_failed · 08:12       │ → Clientes                     │  ║
║  │ … (lista densa, 5–8 filas)        │ → Módulos                      │  ║
║  │ Ver todo →                        │ → Auditoría                      │  ║
║  └───────────────────────────────────┴────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 9. Quick wins (bajo esfuerzo, sin P1-C)

| # | Cambio | Esfuerzo | Impacto |
|---|--------|----------|---------|
| QW-01 | Eliminar H1 `text-3xl` + subtítulo `text-lg`; confiar en breadcrumb | 0,5 h | Alto |
| QW-02 | Mover `PlatformAlertBanner` **debajo de toolbar / arriba de KPIs** | 1 h | Alto |
| QW-03 | Reducir KPI `p-6` → `p-4`, valor `text-2xl` → `text-xl` | 1 h | Medio |
| QW-04 | Unificar `rounded-xl` → `rounded-lg` | 0,5 h | Medio (consistencia) |
| QW-05 | Añadir labels sección: «Plataforma», «Seguridad 24h», «Cartera» (`text-xs uppercase`) | 1 h | Medio |
| QW-06 | Donut `h-64` → `h-48`; grid 2 cols con KPIs cartera en `lg` | 2 h | Alto |
| QW-07 | Eliminar wrapper grid 2-col vacío; actividad + acciones en fila real | 2 h | Medio |
| QW-08 | Icono distinto P0 «Total clientes» (p. ej. `Layers`) | 0,25 h | Bajo |
| QW-09 | Alert banner: agrupar >2 alertas con «+N más» colapsable | 2 h | Medio |
| QW-10 | Timestamp «Datos al …» en toolbar (solo UI, datos hooks existentes) | 1 h | Medio |

**Total quick wins estimado:** **1–2 días** FE (solo CSS/markup/reorden).

---

## 10. Cambios de bajo riesgo

| Cambio | Riesgo | Mitigación |
|--------|--------|------------|
| Reordenar bloques DOM (alertas arriba) | Bajo | Sin cambio datos |
| Compactar padding/tipografía KPIs | Bajo | Misma información |
| Alinear tokens `rounded-lg` | Bajo | Visual only |
| Extraer `DashboardKpiCard` shared | Bajo | Refactor markup |
| Grid 2 cols cartera + donut | Bajo | Responsive stack en `< lg` |
| Quitar H1 body | Bajo | Breadcrumb ya identifica |

**No tocar:** hooks P0/P1-A/P1-B, servicios, reglas alertas, contratos API.

---

## 11. Cambios de alto impacto (fase UX-2)

| Cambio | Impacto | Esfuerzo |
|--------|---------|----------|
| **Bandas KPI semánticas** vs 11 cards sueltas | Escaneo operativo +40% | 2–3 d |
| **Toolbar dashboard** (refresh manual, staleTime visible) | Confianza operador | 1 d |
| **Alertas sticky** bajo header al scroll | Incidentes siempre visibles | 1–2 d |
| **Actividad + acciones en 2 cols** fijas | Reduce scroll ~300px | 1 d |
| **Secciones colapsables mobile** | Tablet/móvil usable | 2 d |
| **Componente `DashboardSection`** unificado | Mantenibilidad + consistencia | 2 d |
| **Donut tokens CSS** + leyenda compacta inline | Dark mode + densidad | 1 d |

**Fase UX-2 estimada:** **3–5 días** (sin P1-C).

---

## 12. Fuera de alcance (esta optimización)

- Nuevos widgets P1-C (W6–W10, operadores, etc.)
- Cambios Backend o BFF
- Rediseño sidebar / header global
- Migración a design system nuevo

---

## 13. Plan de ejecución sugerido

| Fase | Entregable | Dependencia |
|------|------------|-------------|
| **UX-1** | QW-01, 02, 03, 04, 05 | Ninguna |
| **UX-2** | QW-06, 07 + layout 2 cols cartera/donut | UX-1 |
| **UX-3** | Toolbar + timestamp + alertas colapsables | UX-1 |
| **UX-4** | Responsive mobile accordion | UX-2 |
| **QA** | Checklist viewport laptop + regresión P0/P1-A/P1-B | Tras UX-2 |

---

## 14. Checklist QA post-optimización (futuro)

| # | Criterio |
|---|----------|
| 1 | Alertas visibles sin scroll en 768px alto (con ≥1 alerta) |
| 2 | Sin H1 redundante si breadcrumb presente |
| 3 | Misma data KPIs; solo cambia presentación |
| 4 | P0/P1-A/P1-B datos unchanged |
| 5 | Donut + cartera en una fila en ≥1024px |
| 6 | `rounded-lg` / `p-4` alineado Catálogos |
| 7 | Actividad visible en ≤1,2 viewports en laptop |
| 8 | Acciones rápidas visibles junto actividad (desktop) |

---

## 15. Conclusión

El Dashboard Platform **cumple funcionalmente** como consola multi-tenant con datos reales, pero la **presentación acumula 11 KPIs grandes en serie**, ubica **alertas demasiado tarde** y **duplica encabezados** respecto al shell. La optimización prioritaria es **reordenar** (alertas → KPIs compactos por dominio → analítica en 2 columnas → operación), **compactar** (`p-4`, `text-xl`, `rounded-lg`) y **alinear** con Clientes/Catálogos — **sin agregar widgets** ni tocar Backend.

**Siguiente paso recomendado:** implementar fase **UX-1** (quick wins QW-01–05) antes de P1-C.

---

*Fin — PLATFORM_DASHBOARD_UX_OPTIMIZATION_AUDIT.md — sin código, sin implementación.*
