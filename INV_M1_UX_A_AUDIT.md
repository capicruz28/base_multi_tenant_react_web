# Auditoría INV-M1-UX-A — Catálogos INV vs estándar ORG

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — sin implementación, sin commit  
**Prerequisitos cerrados:** INV-M0-b (multiempresa JWT + regresiones REG-001–005 + UX Productos sin UM)  
**Referencias:** [`ERP_FRONTEND_STANDARDS_V1.md`](./ERP_FRONTEND_STANDARDS_V1.md) · [`INV_UX_CLASSIFICATION_AUDIT.md`](./INV_UX_CLASSIFICATION_AUDIT.md) · [`INV_M0_B_CLOSURE.md`](./INV_M0_B_CLOSURE.md)  
**Alcance:** Plantilla A — listados de **Categorías**, **Unidades de medida**, **Tipos de movimiento**, **Almacenes**, **Productos (solo listado)**.

---

## 1. Resumen ejecutivo

Las cinco pantallas catálogo INV comparten **multiempresa JWT alineado (M0-b)** pero **no alcanzan paridad UX con ORG E-UX.1**. La brecha principal es homogeneizar **toolbar compacta de una fila**, **`IamTableEmptyState`**, y **`OrgToolbarSearch`** (ancho acotado), manteniendo **`InvTableSkeleton`** y la **estructura de tablas/modales** actual.

| Dimensión | Estado global INV catálogos | Referencia ORG |
|-----------|----------------------------|----------------|
| Multiempresa JWT | ✅ Cerrado (M0-b) | ✅ |
| Toolbar `justify-between` | ❌ Parcial (solo `ml-auto` ad hoc) | `OrgCompanyToolbar` |
| Buscador IAM | ❌ Solo Productos (input nativo) | `OrgToolbarSearch` + `IamSearchInput` |
| Empty state | ❌ Inline manual (icono + p + botón) | `IamTableEmptyState` |
| Skeleton | ✅ `InvTableSkeleton` | `OrgTableSkeleton` (= reexport) |
| B.1.1 modales | ❌ Fuera de M1-UX-A | ORG sí |
| CTA Crear | ✅ Presente + RBAC | ✅ |

**Veredicto:** INV-M1-UX-A es un sprint de **paridad visual/comportamental de listado** con ORG, **sin tocar** contratos API, multiempresa, ni formularios modales complejos.

---

## 2. Comparación contra estándares

### 2.1 `ERP_FRONTEND_STANDARDS_V1` — aplicabilidad

| Sección | Aplica a M1-UX-A | Notas |
|---------|------------------|-------|
| §3 Multiempresa JWT | **NO modificar** | Ya cerrado M0-b |
| §5 Toolbar | **SÍ** | TB-01–TB-04 |
| §6 Búsqueda | **SÍ** | `OrgToolbarSearch`; debounce **opcional** |
| §7 Empty state | **SÍ** | ES-01, ES-02 |
| §8 Skeleton | **Mantener** | SK-01–03 ya cumplidos |
| §9 B.1.1 | **NO** (M2-SEC) | Explícitamente excluido |
| §10 CRUD modal | **Parcial** | Solo listado; modales sin B.1.1 en M1 |

### 2.2 ORG cerrado — referencia canónica

| Patrón | Archivo referencia |
|--------|-------------------|
| Toolbar E-UX.1 | `DepartamentosPage.tsx`, `CentrosCostoPage.tsx` |
| Toolbar component | `OrgCompanyToolbar.tsx` |
| Search wrapper | `OrgToolbarSearch.tsx` |
| Empty | `IamTableEmptyState` |
| Skeleton | `OrgTableSkeleton.tsx` → `InvTableSkeleton` |

### 2.3 Toolbar objetivo (una fila, sin ancho completo en búsqueda)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [ w-52 buscar ] [ Ver inactivos ]                    [ Crear … ]        │
│ └─ grupo izq (gap-3, min-w-0) ─┘                    └─ shrink-0 ─┘   │
└─────────────────────────────────────────────────────────────────────────┘
     justify-between (OrgCompanyToolbar)
```

**Productos excepción validada:** banner UM **encima** de la toolbar (bloque aparte), **no** dentro de la fila.

---

## 3. Matriz por pantalla

Leyenda clasificación: **O** = UX obligatorio · **R** = UX recomendado · **P** = UX opcional · **—** = mantener sin cambio · **⊘** = explícitamente fuera de M1-UX-A

| Dimensión | Categorías | Unidades | Tipos mov. | Almacenes | Productos (lista) |
|-----------|------------|----------|------------|-----------|-------------------|
| **Toolbar actual** | `[Inactivos] … [Crear]` | Igual | Igual | Igual | `[Banner UM?]` + `[Search flex-1] [Inactivos] [Crear]` |
| **Toolbar objetivo** | `OrgCompanyToolbar` | Idem | Idem | Idem | Banner + `OrgCompanyToolbar` |
| **Buscador** | Sin buscar API | Sin buscar API | Sin buscar API | Sin buscar API | Nativo → `OrgToolbarSearch` **O** |
| **Empty** | Inline | Inline | Inline | Inline | Inline |
| **Skeleton** | 7 cols ✅ | 7 ✅ | 8 ✅ | 7 ✅ | 7 ✅ |
| **Modal CRUD** | max-w-lg | max-w-lg | max-w-lg | max-w-lg | max-w-3xl **—** |
| **Col. Empresa (tabla)** | `activeEmpresaLabel` | — | — | — | — |

### 3.1 Categorías (`CategoriasPage.tsx`)

| Elemento | Estado actual | Brecha vs ORG | Clasificación |
|----------|---------------|---------------|---------------|
| Toolbar | `flex gap-3`; CTA `ml-auto` | Falta `justify-between` + grupo izq/dcha | **O** |
| Buscador | No | API sin `buscar`; ver §4.1 | **P** (client-side) / **R** si API |
| Ver inactivos | ✅ | Falta `shrink-0` explícito | **R** |
| Empty | Icono + texto + botón manual | No `IamTableEmptyState`; sin variante `hasSearch` | **O** |
| Skeleton | ✅ 7 cols | Falta constante `TABLE_COLSPAN` | **R** |
| Tabla / acciones | ✅ tokens Capa 1 | — | **—** |
| Modal create/edit | ✅ `OrgSessionEmpresaField` | Sin B.1.1 | **⊘** M2 |
| Columna Empresa | Muestra label sesión | Redundante post-M0 | **P** quitar columna |

### 3.2 Unidades de medida (`UnidadesMedidaPage.tsx`)

| Elemento | Estado actual | Brecha | Clasificación |
|----------|---------------|--------|---------------|
| Toolbar | Igual categorías | `OrgCompanyToolbar` | **O** |
| Buscador | No | API sin `buscar` | **P** |
| Empty / Skeleton | Inline / ✅ | `IamTableEmptyState` | **O** / **R** |
| Modal | ✅ simple | — | **—** |

### 3.3 Tipos de movimiento (`TiposMovimientoPage.tsx`)

| Elemento | Estado actual | Brecha | Clasificación |
|----------|---------------|--------|---------------|
| Toolbar | Igual | `OrgCompanyToolbar` | **O** |
| Buscador | No | API sin `buscar`; lista puede crecer | **P** / **R** |
| Empty / Skeleton | Inline / ✅ 8 cols | `IamTableEmptyState` | **O** |
| Modal campos | ~8 cols tabla | Layout modal OK | **—** |

### 3.4 Almacenes (`AlmacenesPage.tsx`)

| Elemento | Estado actual | Brecha | Clasificación |
|----------|---------------|--------|---------------|
| Toolbar | Igual | `OrgCompanyToolbar` | **O** |
| Buscador | No | API sin `buscar`; sucursal en modal | **P** |
| Empty / Skeleton | Inline / ✅ | `IamTableEmptyState` | **O** |
| Modal sucursal | Carga por `scopeEmpresaId` | — | **—** |

### 3.5 Productos — solo listado (`ProductosPage.tsx`)

| Elemento | Estado actual | Brecha | Clasificación |
|----------|---------------|--------|---------------|
| Banner sin UM | ✅ validado M0-b | — | **— NO TOCAR** |
| Toolbar búsqueda | `flex-1 max-w-md` + input nativo | Rompe patrón E-UX.1; debe ser `OrgToolbarSearch` **sin** `flex-1` en contenedor | **O** |
| Toolbar layout | `ml-auto` en CTA | `OrgCompanyToolbar` + `actions` | **O** |
| Empty | Inline; sin variante búsqueda | `IamTableEmptyState` + `hasSearch` | **O** |
| Skeleton | ✅ | `TABLE_COLSPAN` | **R** |
| Tooltip Crear sin UM | ✅ | — | **—** |
| Modal producto | ~1200 líneas max-w-3xl | Fuera de alcance lista | **⊘** |
| Debounce búsqueda | No (envío directo) | Estándar SHOULD 500ms | **P** |

---

## 4. Búsqueda — decisión por pantalla

| Pantalla | API `buscar` hoy | Enfoque M1-UX-A recomendado |
|----------|------------------|----------------------------|
| Categorías | ❌ (`categoriaService.list`) | **P:** filtro client-side **o** omitir buscador en A1 y ticket backend |
| Unidades | ❌ | **P:** omitir o client-side |
| Tipos movimiento | ❌ | **P:** client-side si volumen; else omitir |
| Almacenes | ❌ | **P:** omitir o client-side |
| Productos | ✅ (`productoService.list`) | **O:** `OrgToolbarSearch` + `hasSearch` en empty |

**Regla:** no expandir `IamSearchInput` a ancho completo; siempre vía `OrgToolbarSearch` (`w-52 min-w-[12rem] max-w-md shrink-0`).

---

## 5. Qué MANTENER sin modificar (explícito)

### 5.1 Infraestructura multiempresa (M0-b)

- `useInvSessionScope`, `useInvCompanyQueryGate`, `InvCompanyRouteGuard`
- `invalidateInvQueries`, keys con `scopeEmpresaId`
- `OrgSessionEmpresaField` + `assertBodyEmpresaMatchesSession` en creates
- **Sin** selector empresa local ni “Todas las empresas”

### 5.2 Comportamiento funcional validado

- **Productos:** regla UM obligatoria; banner + tooltip + enlace a Unidades
- **Productos:** lógica `sinUnidadesMedidaEnSesion` / `crearProductoDeshabilitado`
- Hooks, servicios, contratos API (sin añadir `buscar` en servicio salvo ticket aparte)
- RBAC `can('inv', …)` en CTAs y acciones fila
- `ConfirmDialog` desactivar/reactivar (vocabulario baja lógica)
- Secuencia render: `Toolbar → Skeleton → Error → Tabla`

### 5.3 Layouts que NO deben degradarse

| Elemento | Motivo |
|----------|--------|
| **Una sola fila** de toolbar por pantalla | ORG E-UX.1; no segunda fila de filtros |
| **Ancho acotado** del buscador | No `flex-1` / no `w-full` en wrapper de búsqueda |
| **Columnas de tabla** actuales (thead/tbody) | No rediseñar grids en M1 |
| **Modales** (campos, grids internos, `max-w-lg` / `max-w-3xl`) | Fuera alcance lista; Productos modal intacto |
| **Banner UM** (Productos) | Bloque separado encima de toolbar |
| **`InvTableSkeleton`** con `columns` = thead | Ya alineado SK-01 |
| **Tokens** `border-border-base`, `bg-subtle`, `text-text-soft`, etc. | Capa 1 existente |

### 5.4 Fuera de INV-M1-UX-A

- B.1.1 / `OrgDiscardConfirmDialog` / `form-dirty/*` → **INV-M2-SEC**
- Pantallas transaccionales (Stock, Kardex, Movimientos, IF)
- Productos formulario modal → posible **INV-EMP** futuro
- Debounce global obligatorio
- Refactor `useErpCompanyScope` compartido

---

## 6. Alcance definitivo INV-M1-UX-A

### 6.1 Páginas incluidas

| # | Pantalla | Archivo |
|---|----------|---------|
| 1 | Categorías | `CategoriasPage.tsx` |
| 2 | Unidades de medida | `UnidadesMedidaPage.tsx` |
| 3 | Tipos de movimiento | `TiposMovimientoPage.tsx` |
| 4 | Almacenes | `AlmacenesPage.tsx` |
| 5 | Productos (listado) | `ProductosPage.tsx` — **sin** modal form |

### 6.2 Componentes a reutilizar (sin reinventar)

| Componente | Origen | Uso en INV |
|------------|--------|------------|
| `OrgCompanyToolbar` | `@/features/org/components/OrgCompanyToolbar` | Toolbar catálogos |
| `OrgToolbarSearch` | `@/features/org/components/OrgToolbarSearch` | Búsqueda ancho acotado |
| `IamSearchInput` | `@/features/admin/components/iam` | Vía `OrgToolbarSearch` |
| `IamTableEmptyState` | `@/features/admin/components/iam` | Empty en tbody |
| `InvTableSkeleton` | `@/features/inv/components/InvTableSkeleton` | Loading (mantener) |
| `InvPageLayout` | `@/features/inv/components/InvPageLayout` | Layout (mantener) |
| `OrgSessionEmpresaField` | ORG | Modales create (mantener) |

### 6.3 Componentes a crear (mínimo)

| Componente | Propuesta | Clasificación |
|------------|-----------|---------------|
| `InvCompanyToolbar` | Re-export de `OrgCompanyToolbar` en `src/features/inv/components/` | **P** — claridad módulo; puede importar ORG directo |
| `InvToolbarSearch` | Re-export de `OrgToolbarSearch` | **P** |
| Nuevo skeleton / empty | No necesario | — |

### 6.4 Cambios por tipo (consolidado)

| Cambio | O | R | P |
|--------|---|---|---|
| Adoptar `OrgCompanyToolbar` + `justify-between` | 5 pantallas | | |
| Reemplazar empty inline → `IamTableEmptyState` | 5 | | |
| Constante `TABLE_COLSPAN` alineada skeleton/thead/empty | | 5 | |
| `OrgToolbarSearch` en Productos | 1 | | |
| Variante empty `hasSearch` (Productos) | 1 | | |
| Checkbox `shrink-0` | | 5 | |
| Buscador en catálogos sin API (client-side) | | | 4 |
| Debounce 500ms Productos | | | 1 |
| Quitar columna Empresa (Categorías) | | | 1 |
| Aliases `InvCompanyToolbar` | | | 1 |

### 6.5 Orden de implementación recomendado

```mermaid
flowchart LR
  A0[Infra opcional re-exports]
  A1[Categorías piloto UX]
  A2[Unidades + Tipos]
  A3[Almacenes]
  A4[Productos listado]
  A0 --> A1 --> A2 --> A3 --> A4
```

| Fase | Pantalla(s) | Entregable |
|------|-------------|------------|
| **A0** | — | (Opcional) `InvCompanyToolbar` / `InvToolbarSearch` re-exports |
| **A1** | Categorías | Toolbar ORG + `IamTableEmptyState` + `TABLE_COLSPAN`; buscador **omitido** o client-side documentado |
| **A2** | Unidades, Tipos | Paridad A1; validar tipos 8 cols skeleton |
| **A3** | Almacenes | Paridad A1 |
| **A4** | Productos lista | `OrgToolbarSearch`; empty `hasSearch`; **preservar banner UM**; no tocar modal |

**Criterio de cierre M1-UX-A:** las 5 pantallas pasan checklist §7 con paridad visual ORG E-UX.1 en toolbar/empty/skeleton.

---

## 7. Checklist QA esperado (post M1-UX-A)

### Toolbar (todas)

- [ ] Una fila compacta; `justify-between`; CTA Crear a la derecha (`shrink-0`)
- [ ] Buscador (si aplica) con ancho `w-52` / `max-w-md`, **no** ancho completo
- [ ] Ver inactivos a la izquierda del CTA
- [ ] Sin selector empresa; sin segunda fila de toolbar

### Empty states

- [ ] Lista vacía activos → título “No hay … activos.” + CTA Crear (permiso + scope)
- [ ] Con inactivos → “No hay … registrados.”
- [ ] Con búsqueda sin resultados (Productos) → título búsqueda + description; **sin** CTA Crear
- [ ] `colSpan` = columnas thead = skeleton

### Carga / error

- [ ] `InvTableSkeleton` durante loading (no Loader pantalla completa)
- [ ] Banner error sin ocultar chrome

### Productos específico

- [ ] Banner UM visible solo sin UM; enlace Unidades funciona
- [ ] Crear deshabilitado sin UM; tooltip presente
- [ ] Búsqueda IAM reemplaza input nativo; layout horizontal preservado
- [ ] Modal producto **sin cambios** visibles en M1

### Multiempresa (regresión M0-b)

- [ ] Cambio empresa → invalidación + reset filtros buscar/inactivos
- [ ] Guard sin empresa → redirect / mensaje guard

### Explícitamente NO verificar en M1-UX-A

- [ ] B.1.1 en modales (M2)
- [ ] Formulario modal Productos refactor

---

## 8. Riesgos y regresiones a vigilar

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Buscador `flex-1` / `w-full` en toolbar | Rompe layout E-UX.1 | Solo `OrgToolbarSearch`; revisar Productos |
| Segunda fila de toolbar | Degradación visual | Banner UM **fuera** de `OrgCompanyToolbar` |
| Empty sin `hasSearch` en Productos | CTA Crear incorrecto con filtro activo | Matriz §7 estándar |
| Tocar hooks/API al añadir buscar | Regresión M0-b | Client-side o omitir; Productos ya tiene API |
| `colSpan` ≠ skeleton cols | Layout roto en empty/loading | Constante `TABLE_COLSPAN` |
| Confundir M1 con M2 (B.1.1) | Scope creep | No importar `OrgDiscardConfirmDialog` en M1 |
| Editar modal Productos por error | Alto blast radius | Code review: diff solo JSX listado |
| Quitar columna Empresa sin acuerdo | Stakeholder | Marcar **P**; default mantener en M1 |
| Client-side search + paginación futura | Deuda | Documentar si se elige **P** |

---

## 9. Conclusión

**INV-M1-UX-A** es un sprint acotado de **homologación de listados catálogo** con ORG E-UX.1: toolbar compacta (`OrgCompanyToolbar`), empty IAM (`IamTableEmptyState`), búsqueda IAM en Productos (`OrgToolbarSearch`), y constantes de tabla — **preservando** multiempresa M0-b, modales, banner UM, columnas y reglas de negocio.

**No incluye:** B.1.1, transaccionales, refactor modal Productos, ni cambios de contrato API.

Tras implementación + QA §7, el módulo INV queda listo para **INV-M1-UX-B** (transaccionales) según [`INV_UX_CLASSIFICATION_AUDIT.md`](./INV_UX_CLASSIFICATION_AUDIT.md).

---

*Auditoría generada sin código, sin repair, sin commit.*
