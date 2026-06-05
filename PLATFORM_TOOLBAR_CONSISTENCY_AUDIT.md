# PLATFORM_TOOLBAR_CONSISTENCY_AUDIT.md

**Tema:** Consistencia visual de toolbars — Platform Administration  
**Fecha:** 2026-06-03  
**Tipo:** Auditoría exclusiva UX/UI — **sin implementación, sin Backend, sin Dashboard**

**Disparador:** QA manual — filtro «Activos» en Clientes queda visualmente aislado en el centro de la toolbar; misma percepción en Países y Monedas.

**Referencias:**

- `PLATFORM_UX_CONSISTENCY_FINAL_AUDIT.md` — TB-01..TB-05, FIL-02
- `PAUX_PHASE_A_FILTERS_DECISION_AUDIT.md` — P1-01 ocultó Plan/Estado en Clientes
- `PAUX_CONVERGENCE_PHASE_A_IMPLEMENTATION_REPORT.md`

**Alcance analizado:**

| Superficie | Archivo |
|------------|---------|
| Clientes | `clientes/pages/ClientManagementPage.tsx` |
| Países | `catalogos/pages/PaisesPage.tsx` |
| Monedas | `catalogos/pages/MonedasPage.tsx` |
| Departamentos | `catalogos/pages/DepartamentosPage.tsx` |
| Provincias | `catalogos/pages/ProvinciasPage.tsx` |
| Distritos | `catalogos/pages/DistritosPage.tsx` |
| Módulos | `modulos/pages/ModuleManagementPage.tsx` |
| Auditoría Global | `auditoria/pages/AuditoriaGlobalPage.tsx`, `auditoria/components/AuthAuditLogPanel.tsx` |

**Fuera de alcance:** Dashboard, Backend, IAM Tenant, ORG tenant, shell global (Header/Breadcrumb).

---

## 1. Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe un patrón único hoy? | **No.** Hay 4 variantes de composición de toolbar. |
| ¿Por qué el filtro queda «aislado»? | **`justify-between` con 3 hijos directos** separa search \| filtro \| acciones. |
| ¿Empeoró con P1-01? | **Sí en Clientes:** al quitar Plan/Estado, el select Registro quedó solo en el slot central. |
| ¿Catálogos leaf comparten el bug? | **Sí:** Países y Monedas usan la misma estructura de 3 hijos. |
| ¿Hay referencia buena en Platform? | **Sí:** Departamentos/Provincias/Distritos y Módulos agrupan filtros a la izquierda. |
| **Veredicto** | Definir **patrón Platform Toolbar de 2 zonas** y migrar superficies divergentes (P2 toolbar). |

---

## 2. Inventario actual por superficie

### 2.1 Matriz de composición

| Superficie | Contenedor | Hijos directos (sm+) | Zona izquierda | Zona central (aislada) | Zona derecha |
|------------|------------|----------------------|----------------|------------------------|--------------|
| **Clientes** | Card `p-4` | **3** | Search `w-64` | Select Todos/Activos/Inactivos | Refresh + Nuevo Cliente |
| **Países** | Card `p-4` | **3** | Search `w-64` | Checkbox «Ver inactivos» | Refresh + Nuevo País |
| **Monedas** | Card `p-4` | **3** | Search `w-64` | Checkbox «Ver inactivos» | Refresh + Nueva Moneda |
| **Departamentos** | Card `p-4` | **2** | Grupo: search + FK país + checkbox | — | Refresh + Nuevo |
| **Provincias** | Card `p-4` | **2** | Grupo: search + FK depto + checkbox | — | Refresh + Nuevo |
| **Distritos** | Card `p-4` | **2** | Grupo: search + FK prov + checkbox | — | Refresh + Nuevo |
| **Módulos** | Card `p-4` | **2** | Grupo: search + categoría + Solo activos | — | Page size + view + export + refresh + create |
| **Auditoría Global** | Sin toolbar listado estándar | Panel propio | KPI strip + filter card grid | — | Paginación en tabla |

### 2.2 Diagrama del anti-patrón (Clientes / Países / Monedas)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Toolbar card (flex row, justify-between)                                   │
│                                                                             │
│  [ 🔍 Buscar........ ]     [ Filtro único ]     [ ↻ ] [ + Primary CTA ]   │
│       ↑ izquierda              ↑ CENTRO              ↑ derecha              │
│                            (visualmente aislado)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Diagrama del patrón referencia (Dept / Prov / Dist / Módulos)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Toolbar card (flex row, justify-between)                                   │
│                                                                             │
│  [ 🔍 Buscar ] [ FK select ] [ ☐ Ver inactivos ]     [ ↻ ] [ + Primary ]   │
│  └────────────── zona izquierda agrupada ──────────┘   └── zona derecha ──┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Análisis de causa raíz

### 3.1 Clientes — regresión visual post P1-01

**Antes (3 selects en zona central):** Plan + Estado + Registro formaban un **grupo visual** coherente.

**Después (P1-01):** solo queda el select Registro en un `<div className="flex flex-wrap gap-2">` como **segundo hijo** del flex principal:

```198:225:src/features/super-admin/clientes/pages/ClientManagementPage.tsx
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">...</div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <select ...>Todos | Activos | Inactivos</select>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">...</div>
```

Con `justify-between` y tres bloques hermanos, el filtro **flota en el centro** del ancho disponible.

### 3.2 Países / Monedas — mismo esqueleto

Estructura idéntica de 3 hijos: search | checkbox bordered | acciones.

```172:203:src/features/super-admin/catalogos/pages/PaisesPage.tsx
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-64">...search...</div>
          <label className="flex items-center gap-2 px-3 py-2 border ...">Ver inactivos</label>
          <div className="flex gap-2">...refresh + create...</div>
```

El checkbox con borde (`px-3 py-2 border rounded-lg`) parece un control suelto en el centro, no agrupado con la búsqueda.

### 3.3 Catálogos jerárquicos — patrón correcto

```192:219:src/features/super-admin/catalogos/pages/DepartamentosPage.tsx
        <div className="flex flex-col sm:flex-row gap-4 justify-between ...">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative w-full sm:w-64">...search...</div>
            <select ...>Todos los países</select>
            <label ...>Ver inactivos</label>
          </div>
          <div className="flex gap-2">...acciones...</div>
```

**Dos hijos directos:** grupo filtros (izq) + acciones (der). Este es el patrón a estandarizar.

### 3.4 Módulos — superset funcional

Alineado en **2 zonas**, pero la derecha incluye controles extra (page size, vista tabla/grid, export) que no existen en otras superficies. No es un bug de aislamiento; es **riqueza desigual** documentada (TB-04).

### 3.5 Auditoría Global — patrón distinto (válido con convergencia parcial)

- `AuditoriaGlobalPage`: H1 + subtítulo + link «Volver al dashboard» (única superficie listada con H1 visible).
- `AuthAuditLogPanel`: KPI strip (3 cards) + **filter card** en `grid md:grid-cols-4`, no toolbar CRUD.

No sufre el bug del centro, pero **no comparte slot** con Clientes/Catálogos → convergencia pendiente a nivel de **familia de filtros**, no copiar toolbar CRUD literal.

---

## 4. Divergencias transversales (UX/UI)

| ID | Hallazgo | Superficies | Sev. |
|----|----------|-------------|------|
| TB-C01 | Tres hijos + `justify-between` → filtro central aislado | Clientes, Países, Monedas | **P1 visual** |
| TB-C02 | P1-01 Clientes dejó un solo control en slot central | Clientes | **P1 visual** |
| TB-C03 | Leaf vs jerárquico: misma familia catálogo, distinto layout | Países/Monedas vs Dept/Prov/Dist | **P2** |
| TB-C04 | Semántica activo/inactivo: select 3-way vs checkbox «Ver inactivos» vs «Solo activos» | Clientes / Catálogos / Módulos | **P1 funcional** (deferido P1-02) |
| TB-C05 | Botones primarios: `<button>` nativo vs shadcn `Button` en acciones tabla | Clientes/Módulos vs Catálogos | **P3** |
| TB-C06 | Search width fijo `sm:w-64` vs full width mobile | Todas CRUD | **P3** (aceptable) |
| TB-C07 | Sin botón refresh en toolbar Auditoría | Auditoría | **P3** |
| TB-C08 | ~15 copias markup sin componente compartido | Todas CRUD | **P2** (kit) |
| TB-C09 | Módulos toolbar más ancha que viewport en pantallas medianas | Módulos | **P3** |

---

## 5. Patrón único propuesto — Platform Admin Toolbar

### 5.1 Especificación visual (2 zonas)

**Contenedor (sin cambios de token):**

```text
mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4
```

**Layout interno:**

```text
flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center
```

| Zona | Rol | Contenido | Reglas |
|------|-----|-----------|--------|
| **Left cluster** | Descubrimiento + restricción | Search + filtros relacionados | Un solo `<div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">` |
| **Right cluster** | Acciones | Refresh (icon) + Primary CTA | `<div className="flex gap-2 shrink-0">` |

**Regla de oro:** el flex principal del toolbar tiene **exactamente 2 hijos** (left cluster, right cluster). Nunca 3+.

### 5.2 Orden de controles en left cluster

| Orden | Control | Aplica a |
|-------|---------|----------|
| 1 | Search (icon + input, `sm:w-64`) | Todas |
| 2 | Filtros de scope / FK (select) | Dept, Prov, Dist, Módulos (categoría), Auditoría (cliente) |
| 3 | Filtro estado activo/inactivo | Clientes (select), Catálogos (checkbox), Módulos (checkbox) |
| 4 | (Opcional) chips / contador filtros activos | Auditoría, futuro |

### 5.3 Orden en right cluster

| Orden | Control | Obligatorio |
|-------|---------|-------------|
| 1 | Controles secundarios de vista (page size, export, toggle grid) | Solo Módulos hoy |
| 2 | Refresh icon button | CRUD listados |
| 3 | Primary CTA (`bg-brand-primary`, Plus icon) | CRUD con alta |

### 5.4 Wireframe objetivo — Clientes (post-convergencia)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [ 🔍 Buscar clientes... ] [ Todos ▼ Activos/Inactivos ]    [ ↻ ] [ + Nuevo ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Wireframe objetivo — Catálogo leaf (Países / Monedas)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [ 🔍 Buscar... ] [ ☐ Ver inactivos ]                        [ ↻ ] [ + Nuevo ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

Alineado con jerárquicos; elimina slot central.

### 5.6 Wireframe objetivo — Auditoría Global (convergencia parcial)

No forzar toolbar CRUD idéntica; sí **misma gramática visual** en filter card:

| Elemento | Propuesta |
|----------|-----------|
| Contenedor filtros | Mantener card `p-4` bajo KPIs |
| Grid | `flex flex-wrap gap-3` en lugar de grid rígido 4 cols cuando rompe alineación |
| Agrupación | Cliente + evento + usuario en fila 1; éxito + fechas en fila 2 |
| Acciones | Añadir icon refresh alineado a CRUD (opcional P3) |
| Primary | N/A (listado read-only) |

---

## 6. Mapping de migración por superficie

| Superficie | Cambio estructural | Cambio copy/semántica | Prioridad |
|------------|-------------------|------------------------|-----------|
| **Clientes** | Mover select Registro al **left cluster** | Mantener Todos/Activos/Inactivos (P1-02) | **P1** |
| **Países** | Mover checkbox al left cluster | Mantener «Ver inactivos» | **P1** |
| **Monedas** | Idem Países | Idem | **P1** |
| **Departamentos** | ✅ Ya conforme | — | — |
| **Provincias** | ✅ Ya conforme | — | — |
| **Distritos** | ✅ Ya conforme | — | — |
| **Módulos** | ✅ 2 zonas OK | FIL-02 deferido; documentar superset derecho | **P3** |
| **Auditoría** | Reorganizar filter card (wrap, no toolbar CRUD) | Opcional refresh | **P2** |

**Diff mínimo Clientes (conceptual, no implementado):**

```tsx
// Antes: 3 hijos (search | filtros | acciones)
// Después: 2 hijos
<div className="flex ... justify-between">
  <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
    {/* search */}
    {/* select activeFilter */}
  </div>
  <div className="flex gap-2 shrink-0">
    {/* refresh + create */}
  </div>
</div>
```

Mismo diff aplicable a `PaisesPage.tsx` y `MonedasPage.tsx` moviendo el `<label>Ver inactivos</label>` al cluster izquierdo.

---

## 7. Decisiones explícitas (para aprobación)

| # | Decisión | Recomendación |
|---|----------|---------------|
| D-01 | ¿Patrón oficial = 2 zonas? | **Sí** |
| D-02 | ¿Unificar semántica activo/inactivo ahora? | **No** — fuera de scope toolbar; FIL-02 separado |
| D-03 | ¿Crear `PlatformListToolbar` shared? | **P2** — tras alinear markup manualmente en P1 |
| D-04 | ¿Igualar Módulos superset derecho en todas? | **No** — excepción documentada |
| D-05 | ¿Auditoría adopta toolbar CRUD? | **No** — adopta tokens + agrupación, mantiene KPI + grid filtros |
| D-06 | ¿Implementar en Phase A? | **No** — auditoría only; batch **PAUX Phase B toolbar** |

---

## 8. Criterios de aceptación propuestos (post-implementación)

| CA | Criterio |
|----|----------|
| CA-T01 | Clientes: search + filtro Registro visualmente agrupados a la izquierda |
| CA-T02 | Países/Monedas: search + «Ver inactivos» agrupados a la izquierda |
| CA-T03 | Ninguna toolbar CRUD Platform usa 3 hijos directos con `justify-between` |
| CA-T04 | Dept/Prov/Dist/Módulos sin regresión |
| CA-T05 | Auditoría: filter card responsive sin controles huérfanos en columna central vacía |
| CA-T06 | QA visual sm/md/lg — filtro no flota centrado en viewport ≥640px |

---

## 9. Veredicto

| Dimensión | Estado |
|-----------|--------|
| Patrón visual único definido | ✅ (este documento) |
| Implementación | ❌ — pendiente aprobación |
| Bloqueante funcional | No |
| Bloqueante percepción UX Platform | **Sí** — Clientes, Países, Monedas |

**Acción solicitada:** aprobar patrón **2 zonas (left cluster + right cluster)** e incluir en **PAUX Phase B** junto con kit toolbar opcional. **No implementar en este ticket.**
