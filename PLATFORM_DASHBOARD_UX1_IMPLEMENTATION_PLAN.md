# PLATFORM_DASHBOARD_UX1_IMPLEMENTATION_PLAN.md

**Tema:** Plan de implementación UX-1 — optimización visual del Dashboard Platform  
**Fecha:** 2026-06-03  
**Ruta:** `/super-admin/dashboard`  
**Baseline funcional:** P0 + P1-A + P1-B (sin cambios de datos)  
**Tipo:** Plan exclusivo — **sin código en esta entrega**

**Referencias:**

- `PLATFORM_DASHBOARD_UX_OPTIMIZATION_AUDIT.md` (QW-02, QW-03, QW-04, QW-05)
- `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx` (estado actual)

---

## 0. Resumen ejecutivo

| Aspecto | Decisión |
|---------|----------|
| **Alcance** | Solo contenido renderizado por `SuperAdminDashboard` y componentes hijos del feature `dashboard/` |
| **Fuera de alcance** | Header global, Breadcrumb, `LayoutWrapper`, shell, hooks, servicios, queries, contratos API, P1-C, widgets nuevos |
| **Quick wins incluidos** | QW-02, QW-03, QW-04, QW-05 + encabezado compacto (variante de QW-01 parcial) |
| **Quick wins excluidos** | QW-06 (donut más bajo / grid 2 col), QW-07 (actividad + acciones en fila), QW-08–QW-10 |
| **Título compacto recomendado** | **«Panel de Control»** — ver §3.1 |
| **Esfuerzo estimado** | 0,5–1 día FE (markup + Tailwind, sin lógica) |

**Objetivo:** Convertir el dashboard de un «informe apilado» en una **consola operativa densa** alineada visualmente con Clientes, Módulos, Catálogos y Auditoría Global, **sin alterar qué datos se muestran ni cómo se obtienen**.

---

## 1. Alcance e invariantes

### 1.1 Lo que NO se tocará

| Área | Archivos / sistemas |
|------|---------------------|
| Shell global | `Header.tsx`, `LayoutWrapper.tsx`, breadcrumbs (`useShellBreadcrumbs`, etc.) |
| Routing / guards | `router.tsx`, guards de permisos |
| Capa de datos | `usePlatformDashboardP0.ts`, `usePlatformDashboardP1A.ts`, `usePlatformDashboardP1B.ts` |
| Servicios / API | `superadmin-*.service.ts`, axios, contratos OpenAPI |
| Reglas de alertas | `dashboard-alert.rules.ts`, `clientes-snapshot.utils.ts`, `auditoria-period.utils.ts` |
| P1-C | Licencias globales, conexiones, widgets W6–W8, W10, W13, W15 |
| Widgets nuevos | Ninguno |

### 1.2 Lo que SÍ cambiará (solo presentación)

- Orden DOM de bloques en la página.
- Densidad y tokens visuales de tarjetas KPI.
- Agrupación semántica por dominio con labels de sección.
- Encabezado de página (título + eliminación de subtítulo).
- Consistencia `rounded-lg` en superficies del dashboard.
- Extracción de componentes visuales reutilizables dentro del feature (DRY, sin lógica de negocio).

### 1.3 Invariantes funcionales (deben permanecer idénticos)

- Mismos 11 KPIs con mismos labels, iconos semánticos y fuentes de datos.
- Mismo `mergeDashboardAlerts(security.securityAlerts, portfolio.portfolioAlerts)`.
- Misma lógica de `PlatformAlertBanner` (dismiss, severidades, links).
- Mismo feed de actividad (W9) y mismas acciones rápidas con mismas rutas.
- Mismo gráfico donut W14 (`ClientesPlanDonutChart`) con mismos props.
- Estado restringido (`!isSuperAdmin`) sin cambios.

---

## 2. Quick wins aprobados — especificación técnica

### QW-02 — Alertas arriba de KPIs

**Estado actual:** `PlatformAlertBanner` se renderiza **después** de las 3 filas de KPIs y el donut (línea ~256 de `SuperAdminDashboard.tsx`).

**Estado objetivo:**

```
Encabezado compacto
→ PlatformAlertBanner (si hay alertas visibles)
→ Sección Plataforma (KPIs P0)
→ Sección Seguridad 24h (KPIs P1-A)
→ Sección Cartera (KPIs P1-B + donut)
→ Actividad reciente
→ Acciones rápidas
```

**Cambio:** Solo reordenamiento JSX + ajuste de márgenes (`mb-6` entre bloques). Sin cambios en props ni en `dashboard-alert.rules.ts`.

---

### QW-03 — Compactar tarjetas KPI (densidad)

**Estado actual (por tarjeta):**

| Token | Actual |
|-------|--------|
| Padding | `p-6` |
| Radio | `rounded-xl` |
| Icono | `h-8 w-8` |
| Valor | `text-2xl font-semibold` |
| Grid gap | `gap-6` |
| Separación filas | `mb-8` |

**Estado objetivo:**

| Token | Objetivo |
|-------|----------|
| Padding | `p-4` |
| Radio | `rounded-lg` |
| Icono | `h-6 w-6` |
| Valor | `text-xl font-semibold` |
| Label | `text-sm font-medium text-text-soft` (sin cambio semántico) |
| Espaciado icono–texto | `ml-3` (antes `ml-4`) |
| Loader en valor | `h-5 w-5` (antes `h-6 w-6`) |
| Grid gap | `gap-4` |
| Separación secciones | `mb-6` vía `DashboardSection` |

**Implementación:** Centralizar en `DashboardKpiCard` para evitar 11 bloques duplicados en la página.

---

### QW-04 — Alinear con Platform (`rounded-lg`)

**Patrón de referencia Platform** (Clientes, Catálogos, Auditoría):

```tsx
bg-surface rounded-lg shadow-sm border border-border-base p-4
```

**Superficies del dashboard a unificar:**

| Superficie | Archivo | Cambio |
|------------|---------|--------|
| 11 tarjetas KPI | `DashboardKpiCard.tsx` (nuevo) | `rounded-lg p-4` |
| Items de alerta | `PlatformAlertBanner.tsx` | `rounded-xl` → `rounded-lg` en cada fila |
| Contenedor donut | `SuperAdminDashboard.tsx` | `rounded-xl p-6` → `rounded-lg p-4` |
| Panel actividad | `SuperAdminDashboard.tsx` | `rounded-xl` → `rounded-lg`; header `p-6` → `px-4 py-3` |
| Panel acciones rápidas | `SuperAdminDashboard.tsx` | `rounded-xl p-6` → `rounded-lg p-4` |

**Nota:** `ClientesPlanDonutChart.tsx` no requiere cambios internos salvo que contenga `rounded-xl` propio (actualmente el contenedor es padre en la página).

---

### QW-05 — Agrupar KPIs por dominio

Reemplazar las tres «filas sueltas» + H2 «Salud de cartera» por tres bloques con **label de sección** homogéneo:

| Sección | Label UI | KPIs incluidos | Grid |
|---------|----------|----------------|------|
| **Plataforma** | `PLATAFORMA` | Clientes Activos, Total Clientes, Total Usuarios, Módulos | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` |
| **Seguridad 24h** | `SEGURIDAD 24H` | Logins fallidos, Logins exitosos, Sync fallidas | `grid-cols-1 md:grid-cols-3` |
| **Cartera** | `CARTERA` | Suspendidos, Trial, Cancelados, Morosos + donut «Distribución por plan» | KPIs: `lg:grid-cols-4`; donut: ancho completo bajo KPIs |

**Estilo del label de sección** (consistente con auditoría UX, sin H2 pesado):

```tsx
<p className="text-xs font-semibold uppercase tracking-wide text-text-soft mb-3">
  {title}
</p>
```

**Eliminar:** H2 `Salud de cartera` (`text-lg font-medium`) — su función la absorbe el label `CARTERA`.

**Mantener:** Subtítulo parcial del donut («Basado en X de Y clientes») cuando `portfolio.isPartialSnapshot`.

---

### Ajuste adicional — Encabezado compacto (sin eliminar)

**Estado actual:**

```tsx
<h1 className="text-3xl font-bold ...">Dashboard de Super Administrador</h1>
<p className="mt-2 text-lg text-text-soft">Visión general del sistema multi-tenant</p>
```

**Estado objetivo:**

```tsx
<div className="mb-4">
  <h1 className="text-2xl font-bold text-text-base">Panel de Control</h1>
</div>
```

#### §3.1 Elección del título

| Opción | Pros | Contras |
|--------|------|---------|
| **Panel de Control** ✅ recomendada | Diferencia clara del breadcrumb «Dashboard»; patrón alineado con «Auditoría Global» (`text-2xl font-bold`); comunica rol de consola operativa | Ninguno relevante |
| Plataforma | Coherente con dominio «Platform admin» | Puede confundirse con nombre de producto/módulo; menos específico para página home |

**Decisión para implementación:** usar **«Panel de Control»** salvo indicación contraria del product owner. Si se prefiere «Plataforma», solo cambia el string del H1; el resto del plan es idéntico.

**Patrón de referencia:** `AuditoriaGlobalPage.tsx` — `text-2xl font-bold`, contenedor `mb-6` reducido a `mb-4` porque las alertas/KPIs siguen inmediatamente.

---

## 3. Archivos a modificar y crear

### 3.1 Archivos nuevos (solo UI, feature dashboard)

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/features/super-admin/dashboard/components/DashboardKpiCard.tsx` | Tarjeta KPI compacta: props `icon`, `iconClassName`, `label`, `metric: DashboardMetricState`, usa `formatMetricValue` internamente o recibe nodo formateado |
| `src/features/super-admin/dashboard/components/DashboardSection.tsx` | Wrapper: `title: string`, `children`, clases `mb-6 last:mb-0`, label uppercase |
| `src/features/super-admin/dashboard/components/index.ts` | Re-export opcional de componentes dashboard (si el feature ya usa barrel; crear solo si existe convención en carpeta) |

**Alternativa mínima:** Si se prefiere menos archivos, `DashboardSection` puede quedar inline en la página; se recomienda extraer ambos por mantenibilidad (11 KPIs → declarativos).

### 3.2 Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `SuperAdminDashboard.tsx` | Encabezado compacto; reorden DOM (alertas ↑); refactor KPIs → `DashboardKpiCard` × 11 dentro de 3× `DashboardSection`; QW-04 en paneles actividad/acciones/donut; eliminar H2 «Salud de cartera»; reducir gaps/márgenes |
| `PlatformAlertBanner.tsx` | `rounded-xl` → `rounded-lg`; contenedor `mb-8` → `mb-6`; sin cambio de lógica dismiss/severidad |

### 3.3 Archivos explícitamente sin cambios

```
hooks/usePlatformDashboardP0.ts
hooks/usePlatformDashboardP1A.ts
hooks/usePlatformDashboardP1B.ts
hooks/__tests__/*
utils/dashboard-alert.rules.ts
utils/clientes-snapshot.utils.ts
utils/auditoria-period.utils.ts
utils/__tests__/*
components/ClientesPlanDonutChart.tsx   ← props y render interno intactos
services/*
types/*
shared/components/layout/*
```

### 3.4 Tests

| Expectativa |
|-------------|
| Tests de hooks/utils existentes (**19 tests**) deben seguir pasando sin modificación |
| No se requieren tests nuevos para markup puro salvo regresión manual |
| Si existe test de snapshot de página (actualmente **no**), actualizar snapshot post-implementación |

---

## 4. Componentes visuales — antes / después

### 4.1 `DashboardKpiCard` (nuevo)

**API propuesta:**

```tsx
interface DashboardKpiCardProps {
  icon: LucideIcon;
  iconClassName?: string; // ej. text-brand-primary, text-error
  label: string;
  metric: DashboardMetricState;
}
```

**Markup objetivo:**

```tsx
<div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
  <div className="flex items-center">
    <Icon className={`h-6 w-6 flex-shrink-0 ${iconClassName}`} />
    <div className="ml-3 min-w-0">
      <p className="text-sm font-medium text-text-soft">{label}</p>
      <p className="text-xl font-semibold text-text-base">{/* formatMetricValue */}</p>
    </div>
  </div>
</div>
```

**Nota:** `formatMetricValue` puede moverse a `dashboard/components/dashboard-metric.utils.ts` solo si se usa en card + página; opcional — puede vivir en `DashboardKpiCard.tsx` para minimizar archivos.

---

### 4.2 `DashboardSection` (nuevo)

```tsx
interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

// Estructura
<section className="mb-6">
  <p className="text-xs font-semibold uppercase tracking-wide text-text-soft mb-3">
    {title}
  </p>
  {children}
</section>
```

---

### 4.3 `PlatformAlertBanner` (ajuste menor)

Solo clases Tailwind:

- Contenedor: `mb-8 space-y-3` → `mb-6 space-y-2`
- Item: `rounded-xl border p-4` → `rounded-lg border p-3` (opcional `p-3` para densidad acorde a KPIs; mantener legibilidad)

Comportamiento, props y accesibilidad (`role="region"`, dismiss) **sin cambios**.

---

### 4.4 `SuperAdminDashboard` — mapa declarativo de KPIs

Tras refactor, la página define arrays o JSX agrupado:

**Plataforma (4):**

| Label | Hook | Icono | Color icono |
|-------|------|-------|-------------|
| Clientes Activos | `dashboard.clientesActivos` | `Building` | `text-brand-primary` |
| Total Clientes | `dashboard.totalClientes` | `Building` | `text-brand-primary` |
| Total Usuarios | `dashboard.totalUsuarios` | `Users` | `text-info` |
| Módulos | `dashboard.totalModulos` | `Package` | `text-success` |

**Seguridad 24h (3):**

| Label | Hook | Icono | Color |
|-------|------|-------|-------|
| Logins fallidos (24 h) | `security.loginsFallidos` | `ShieldAlert` | `text-error` |
| Logins exitosos (24 h) | `security.loginsExitosos` | `CheckCircle2` | `text-success` |
| Sync fallidas (24 h) | `security.syncFallidas` | `RefreshCw` | `text-warning` |

**Cartera (4 + donut):**

| Label | Hook | Icono | Color |
|-------|------|-------|-------|
| Clientes suspendidos | `portfolio.suspendidos` | `PauseCircle` | `text-warning` |
| Clientes trial | `portfolio.trial` | `Sparkles` | `text-info` |
| Clientes cancelados | `portfolio.cancelados` | `Ban` | `text-text-soft` |
| Clientes morosos | `portfolio.morosos` | `AlertCircle` | `text-error` |

Donut: mismo bloque actual con título H3 «Distribución por plan» (se mantiene como subtítulo dentro de Cartera, no como H2 de sección).

---

## 5. Mock textual del resultado final

Vista desktop (~1200px). Shell global **sin cambios** (omitido aquí).

```
┌─ Breadcrumb (shell) ────────────────────────────────────────────────────┐
│ Inicio  >  …  >  Dashboard                                               │
└──────────────────────────────────────────────────────────────────────────┘

Panel de Control                                    ← H1 text-2xl, sin subtítulo

┌─ ALERTA (solo si aplica) ────────────────────────────────────────────────┐
│ ⚠  N logins fallidos en las últimas 24 h                    [Ver] [×]   │
│ ⚠  X clientes morosos detectados en cartera                 [Ver] [×]   │
└──────────────────────────────────────────────────────────────────────────┘

PLATAFORMA                                          ← label uppercase xs
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 🏢 Clientes  │ 🏢 Total     │ 👥 Total     │ 📦 Módulos   │
│    Activos   │    Clientes  │    Usuarios  │              │
│    42        │    58        │    1 204     │    12        │
└──────────────┴──────────────┴──────────────┴──────────────┘
   compact p-4 · rounded-lg · gap-4 · value text-xl

SEGURIDAD 24H
┌────────────────────┬────────────────────┬────────────────────┐
│ 🛡 Logins fallidos │ ✓ Logins exitosos│ ↻ Sync fallidas    │
│   (24 h)           │   (24 h)         │   (24 h)           │
│   7                │   312            │   2                │
└────────────────────┴────────────────────┴────────────────────┘

CARTERA
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ ⏸ Suspendid. │ ✨ Trial     │ 🚫 Cancelad. │ ⚠ Morosos    │
│   3          │   8          │   5          │   2          │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─ Distribución por plan ──────────────────────────────────────────────────┐
│ Basado en 58 de 58 clientes                          (si snapshot parcial)│
│                    [ Donut W14 — sin cambio de datos ]                    │
│                    leyenda lateral / inferior                             │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Actividad Reciente ─────────────────────────────── [ Ver todo → ] ────┐
│ ● Cliente ACME · LOGIN_SUCCESS · jperez              14:32               │
│ ● Cliente Beta SA · SYNC_FAILED · sistema            14:28               │
│ …                                                                         │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Acciones Rápidas ───────────────────────────────────────────────────────┐
│ [ Gestionar Clientes ]  [ Gestionar Módulos ]  [ Auditoría Global ]      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Comparación de scroll (objetivo)

| Métrica | Antes (estimado) | Después UX-1 (objetivo) |
|---------|------------------|-------------------------|
| Viewports hasta alertas | ~2 (alertas al final) | **0** — alertas visibles tras título |
| Altura bloque KPIs | ~480–520px | ~320–360px (−25–30 %) |
| Títulos body redundantes | H1 + subtítulo + H2 cartera | H1 compacto + 3 labels xs |
| Consistencia `rounded-lg` | Parcial | Total en superficies dashboard |

### 5.2 Estados vacíos / loading (sin cambio semántico)

- Sin alertas: banner no renderiza (`null`) — igual que hoy.
- KPI loading: spinner compacto en valor.
- KPI error: «—» en valor.
- Actividad / donut: mismos estados empty/error/loading actuales.

---

## 6. Orden de implementación (cuando se apruebe codificar)

1. **Crear** `DashboardKpiCard.tsx` y `DashboardSection.tsx`.
2. **Refactorizar** `SuperAdminDashboard.tsx`:
   - Encabezado compacto.
   - Mover `<PlatformAlertBanner />` bajo encabezado.
   - Sustituir 11 bloques inline por secciones + cards.
   - Aplicar QW-04 a paneles secundarios.
3. **Ajustar** `PlatformAlertBanner.tsx` (rounded + márgenes).
4. **Verificar** manualmente en `/super-admin/dashboard`:
   - Super admin con alertas / sin alertas.
   - Loading states.
   - Responsive md/lg.
5. **Ejecutar** `npm test -- src/features/super-admin/dashboard` — debe permanecer verde sin edits en hooks.
6. **Generar** `PLATFORM_DASHBOARD_UX1_IMPLEMENTATION_REPORT.md` (post-implementación).

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Regresión visual en mobile | Probar `grid-cols-1` en las tres secciones; gaps `gap-4` |
| Pérdida de jerarquía al quitar subtítulo | H1 `text-2xl` + labels de sección restauran escaneabilidad |
| Duplicación breadcrumb vs título | Título «Panel de Control» ≠ «Dashboard» en breadcrumb — aceptable y alineado con otras páginas Platform |
| Scope creep hacia P1-C | Plan acota explícitamente; no importar hooks/servicios nuevos |

---

## 8. Criterios de aceptación UX-1

- [ ] Alertas visibles **antes** del primer KPI cuando existen.
- [ ] 11 KPIs agrupados bajo **Plataforma**, **Seguridad 24h**, **Cartera**.
- [ ] Tarjetas KPI con `p-4`, `rounded-lg`, valor `text-xl`, icono `h-6`.
- [ ] Encabezado: un solo H1 compacto, **sin subtítulo**.
- [ ] Paneles actividad, acciones y donut usan `rounded-lg`.
- [ ] Cero cambios en hooks, servicios, utils de negocio y tests de datos.
- [ ] Header, Breadcrumb, LayoutWrapper y shell **bit-identical**.

---

## 9. Próximo paso

**Pendiente de aprobación de este plan** → implementación FE en rama actual → informe `PLATFORM_DASHBOARD_UX1_IMPLEMENTATION_REPORT.md`.

**No iniciar P1-C** hasta cierre UX-1.

---

*Documento generado como plan previo a implementación. No incluye diff de código.*
