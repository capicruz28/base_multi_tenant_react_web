# Auditoría Inventarios (INV) — Multiempresa y alineación ERP

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — sin implementación, sin commit  
**Alcance código:** `src/features/inv/**` (12 páginas, 11 hooks, 1 service, 2 componentes)  
**Contrato:** `docs/api/INV_API.json`  
**Referencia previa:** `docs/frontend/auditoria/AUDITORIA_FRONTEND_INV.md` (2026-05-14) — API/deprecated; este documento amplía **multiempresa JWT** y **brecha vs ORG cerrado**.

---

## 1. Mapa del módulo

| Vista | Archivo | Líneas (~) | Tipo | `empresa_id` en API |
|-------|---------|------------|------|---------------------|
| Categorías | `CategoriasPage.tsx` | 461 | Maestro modal | List + body create |
| Unidades medida | `UnidadesMedidaPage.tsx` | 319 | Maestro modal | Idem |
| Productos | `ProductosPage.tsx` | 1 257 | Maestro modal (grande) | Idem |
| Almacenes | `AlmacenesPage.tsx` | 361 | Maestro modal | Idem + sucursal |
| Stock | `StockPage.tsx` | 234 | Solo lectura | Query filter |
| Tipos movimiento | `TiposMovimientoPage.tsx` | 463 | Maestro modal | Idem |
| Movimientos | `MovimientosPage.tsx` | 527 | Lista + detalle modal | Idem |
| Movimiento form | `MovimientoFormPage.tsx` | 506 | Transaccional página | Cabecera+detalle |
| Inventario físico | `InventarioFisicoPage.tsx` | 490 | Lista + flujos | Idem |
| Inventario físico form | `InventarioFisicoFormPage.tsx` | 352 | Transaccional página | Cabecera+detalle |
| Kardex | `KardexPage.tsx` | 232 | Solo lectura | Query filter |

**Índice router:** default → `productos`. Sin route guards de empresa.

---

## 2. Hallazgos por categoría de auditoría

### 2.1 Selectores locales de empresa

| Página | Selector toolbar | Selector en modal create/edit | Fuente lista empresas |
|--------|------------------|-------------------------------|------------------------|
| Categorías | ✅ `Todas las empresas` | ✅ `<select> Empresa *` | `empresaService.list` local |
| Unidades medida | ✅ | ✅ | `loadEmpresas` local |
| Productos | ✅ | ✅ (en form) | local + sync parcial JWT |
| Almacenes | ✅ | ✅ (+ cambia filter al elegir) | local |
| Stock | ✅ | — | local + sync parcial JWT |
| Tipos movimiento | ✅ | ✅ | local |
| Movimientos | ✅ | — (lista; form en otra página) | local |
| Movimiento form | — (página) | ✅ selector empresa cabecera | local |
| Inventario físico | ✅ | — | local |
| Inventario físico form | — | ✅ | local |
| Kardex | ✅ | — | local |

**Conclusión:** **11/11** flujos con dependencia de empresa usan **selector local** en toolbar y/o formulario. **Incompatible** con regla ORG cerrada: *contexto empresa vive en el Header, no en página*.

---

### 2.2 Dependencias incompatibles con JWT company-scoped

| Patrón INV actual | Patrón ORG objetivo | Gap |
|-------------------|---------------------|-----|
| `useState(empresaFilter)` | `scopeEmpresaId` desde `useOrgSessionScope` | No existe `useInvSessionScope` |
| `enabled: !!empresaFilter` en algunas queries | `useOrgCompanyQueryGate` | Hooks INV aceptan `empresa_id` opcional sin gate sesión |
| Opción `""` = todas las empresas | Una empresa activa por sesión | Riesgo datos cross-company para `tenant_admin` |
| `empresaService.list` en cada página | No listar empresas para filtrar | N+1 cargas y UI redundante con header |
| Query keys con `empresaFilter` variable local | Keys con `scopeEmpresaId` + invalidate al cambiar header | Cambiar empresa en header **no** invalida INV si filter local queda viejo |

**Sync parcial JWT (insuficiente):**

- `CategoriasPage`, `ProductosPage`, `StockPage` importan `useEmpresaActiva` y hacen `setEmpresaFilter(empresaActivaId)` en `useEffect`.
- **Problema:** el usuario puede cambiar el `<select>` local después y **desincronizar** header vs datos.
- Resto de páginas: solo auto-selección si `data.length === 1`, no siguen cambios de header.

---

### 2.3 Uso de `empresa_id` en filtros y hooks

Todos los hooks de listado INV propagan `empresa_id` opcional al service:

- `useCategorias`, `useUnidadesMedida`, `useProductos`, `useAlmacenes`, `useTiposMovimiento`, `useStocks`, `useMovimientos`, `useInventarioFisico`, `useKardex`, etc.

**Query keys** incluyen `empresaId ?? ''` — correcto para cache **si** el ID es el de sesión; incorrecto si es filter local vacío (mezcla listas).

**Hooks transaccionales:** `useMovimientoConDetalle`, `useCreateMovimientoConDetalle` — correctos en diseño API (con-detalle).

**Hooks deprecated sin uso UI activo:** `useCreateMovimiento`, `useUpdateMovimiento`, cabecera sola — marcados `@deprecated` ✅.

---

### 2.4 Company-scoped incorrecto

| Severidad | Hallazgo |
|-----------|----------|
| 🔴 | Toolbar permite ver/agregar datos con `empresa_id` vacío o distinto al JWT (`Categorias`: `enabled: true` sin exigir empresa). |
| 🔴 | `tenant_admin` puede operar conceptualmente “todas las empresas” en UI mientras ORG ya restringe por sesión. |
| 🟡 | Form create permite elegir cualquier empresa del tenant, no solo la activa. |
| 🟡 | Sin `OrgCompanyRouteGuard` equivalente: usuario sin empresa activa ve páginas vacías o con error API, no mensaje guía. |
| 🟡 | Sin invalidación global al cambiar empresa en header (solo sync en 3 páginas). |

---

### 2.5 Modales sin patrón B.1.1

| Página | Confirmación baja/reactivar | Discard dirty (ESC/outside) |
|--------|----------------------------|-----------------------------|
| Categorías | `ConfirmDialog` ✅ | ❌ Cierra directo |
| Unidades | ✅ | ❌ |
| Productos | ✅ | ❌ |
| Almacenes | ✅ | ❌ |
| Tipos movimiento | ✅ | ❌ |
| Movimientos (modal detalle) | ✅ parcial | ❌ |
| Inventario físico | ✅ | ❌ |

**No hay:** `discardPending`, `createOrgDiscardHandlers`, `scheduleModalStackValidation`, `onInteractOutside` bloqueado.

**Riesgo:** regresión overlay negro ya corregida en ORG/IAM al editar INV modales largos (`ProductosPage` ~1 257 líneas).

---

### 2.6 Toolbars

| Aspecto | Estado INV | Estado ORG (E-UX.1) |
|---------|------------|---------------------|
| Estructura | `mb-4 flex flex-wrap gap-3` + `ml-auto` CTA | `justify-between` + grupo izquierdo + `OrgToolbarSearch` |
| Búsqueda | `<input>` nativo con icono Lucide inline (`ProductosPage`) | `IamSearchInput` + wrapper ancho fijo |
| Filtro empresa | Primer control (select ancho) | **Eliminado** (header) |
| Ver inactivos | Inline ✅ | Inline ✅ |
| Densidad | Aceptable en INV **sin** `IamSearchInput` `w-full`; riesgo si migran búsqueda sin wrapper | Compacta validada |

---

### 2.7 Empty states

| Página | Patrón |
|--------|--------|
| Todas las listas | Inline: icono + `<p>` + botón opcional (`colSpan` manual) |
| Variante búsqueda | ❌ No distingue `hasSearch` |
| Componente | ❌ No usa `IamTableEmptyState` |

---

### 2.8 Skeletons

| Página | Skeleton |
|--------|----------|
| Categorías, Unidades, Productos, Almacenes, Tipos, Movimientos, Stock, Kardex, Inventario físico (lista) | `InvTableSkeleton` ✅ |
| Inventario físico (detalle en página) | `Loader` spinner 🟡 |
| MovimientoFormPage, InventarioFisicoFormPage (carga inicial) | `Loader` 🟡 |
| MovimientosPage (panel detalle) | `Loader` h-6 🟡 |

**Conclusión:** Listados alineados a patrón visual INV; formularios transaccionales aún spinner centrado.

---

### 2.9 Formularios cabecera / detalle

| Flujo | Implementación | Alineación API |
|-------|----------------|---------------|
| Movimiento crear/editar | `MovimientoFormPage` — líneas locales, un submit | ✅ `POST/PUT .../con-detalle` |
| Inventario físico | `InventarioFisicoFormPage` | ✅ `con-detalle` |
| Movimientos lista | Modal detalle + acciones autorizar/anular | ✅ Lectura; mutaciones estado |
| Service | No POST detalle suelto | ✅ Comentarios deprecated |

**Fortaleza INV:** referencia **funcional** para transacciones embebidas.  
**Debilidad:** selector empresa en cabecera del form, no campo sesión readonly.

---

### 2.10 Complejidad real del módulo

| Dimensión | Evaluación |
|-----------|------------|
| Entidades maestras | 5 (categoría, UM, producto, almacén, tipo movimiento) — CRUD modal repetido |
| Consultas | Stock, Kardex — solo lectura, filtros múltiples |
| Transacciones | Movimientos + inventario físico — 2 form pages, mayor complejidad |
| Líneas de código UI | ~6 800 en pages; `ProductosPage` domina (~19% del módulo) |
| Acoplamiento ORG | `empresaService` importado en **todas** las páginas con filtro empresa |
| RBAC | Presente en mutaciones; Stock/Kardex ⚠ sin acciones (solo lectura OK) |
| Multiempresa | **Mayor brecha del módulo** — bloqueante antes de “INV cerrado” |

**Estimación esfuerzo alineación multiempresa INV:** 3–5 días (gate + quitar selects + invalidación + 11 páginas) **sin** contar B.1.1 ni E-UX.

---

## 3. Matriz por entidad (solicitado en brief)

| Entidad | Selector local | JWT sync | B.1.1 | Empty IAM | Skeleton lista | Notas |
|---------|---------------|----------|-------|-----------|----------------|-------|
| **Categorías** | ✅ | Parcial | ❌ | ❌ | ✅ | Lista sin `enabled` empresa estricto |
| **Productos** | ✅ | Parcial | ❌ | ❌ | ✅ | Página más grande |
| **Unidades** | ✅ | No | ❌ | ❌ | ✅ | |
| **Almacenes** | ✅ | No | ❌ | ❌ | ✅ | Depende sucursal por empresa filter |
| **Stock** | ✅ | Parcial | N/A | ❌ | ✅ | Solo lectura |
| **Tipos mov.** | ✅ | No | ❌ | ❌ | ✅ | |
| **Movimientos** | ✅ | No | ❌ | ❌ | ✅ | Form en ruta aparte |

---

## 4. Diagnóstico semáforo

| Área | Semáforo | Comentario |
|------|----------|------------|
| Contrato API / deprecated | 🟢 | `inv.service.ts` alineado (auditoría previa) |
| Cabecera + detalle | 🟢 | Form pages correctas |
| Multiempresa JWT | 🔴 | Selectores locales y “todas las empresas” |
| UX listados (empty/search/toolbar) | 🟡 | Skeletons sí; empty y toolbar desactualizados vs ORG |
| Modales seguridad UX (B.1.1) | 🔴 | Ausente en todo INV |
| Mantenibilidad | 🟡 | Duplicación `loadEmpresas` × N páginas |

---

## 5. Plan recomendado (solo estrategia, sin implementar)

### Fase INV-M0 — Multiempresa (bloqueante)

1. Crear `useInvCompanyScope` (wrapper de patrón `useOrgSessionScope` / compartido en `core`).  
2. Eliminar `<select>Todas las empresas</select>` en toolbars.  
3. Sustituir campo Empresa en modales por `OrgSessionEmpresaField` (o versión neutral `ErpSessionEmpresaField`).  
4. `useInvCompanyQueryGate` en todos los hooks.  
5. `invalidateInvQueries` al cambiar `scopeEmpresaId`.  
6. Route guard opcional bajo `/inv/*` (mensaje igual que ORG).

### Fase INV-M1 — Paridad UX ORG

1. `IamTableEmptyState` + `hasSearch`.  
2. `OrgToolbarSearch` / `ErpToolbarSearch` + toolbar `justify-between`.  
3. Portar B.1.1 a modales maestros (prioridad Productos, Almacenes).

### Fase INV-M2 — Deuda estructural

1. Partir `ProductosPage`.  
2. Debounce búsqueda.  
3. Unificar `loadEmpresas` → eliminado post-M0.

---

## 6. Confirmación explícita

- **No se modificó código** en esta auditoría.  
- **No se refactorizó INV.**  
- **ORG permanece fuente de verdad** para multiempresa y UX listados cerrados.  
- **INV permanece fuente de verdad** para transacciones `con-detalle` y skeleton de tabla (origen).

---

*Documento generado sin cambios en código. Sin commit.*
