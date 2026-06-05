# Auditoría INV-M1-UX-B — Pantallas transaccionales INV

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — sin implementación, sin commit  
**Prerequisito cerrado:** INV-M1-UX-A (5 catálogos homogeneizados + búsqueda client/server)  
**Referencias:** [`ERP_FRONTEND_STANDARDS_V1.md`](./ERP_FRONTEND_STANDARDS_V1.md) · [`INV_UX_CLASSIFICATION_AUDIT.md`](./INV_UX_CLASSIFICATION_AUDIT.md) · [`INV_M1_UX_A_SEARCH_AUDIT.md`](./INV_M1_UX_A_SEARCH_AUDIT.md) · [`docs/api/INV_API.json`](./docs/api/INV_API.json)

---

## 1. Resumen ejecutivo

Las **6 pantallas transaccionales** INV tienen **multiempresa JWT operativo** (post INV-M0-b) y **patrón funcional correcto** (filtros API, `con-detalle`, formularios en página completa). La brecha principal vs estándar es **UX de listados/consultas B**: toolbars operativas no homogéneas, **empty states inline** (sin `IamTableEmptyState` / variantes con filtros), **sin `TABLE_COLSPAN`**, y **deuda de presentación** (UUID parcial en Stock, deep-link Kardex roto).

| Veredicto | Detalle |
|-----------|---------|
| **Clasificación funcional** | Correcta — no forzar Plantilla A (ORG catálogo) |
| **Multiempresa JWT** | Cerrado en hooks/guards; deuda menor en UI (Stock UUID, links) |
| **Patrón transaccional §11** | Form pages **cumplen** CD-04–07; listas cumplen API |
| **INV-M1-UX-B** | Homogeneizar **listados/consultas B** (toolbar, empty, skeleton, filtros UX) |
| **INV-M2-SEC** | B.1.1, dirty en modales/formularios, guard navegación |

---

## 2. Clasificación por pantalla

| Pantalla | Ruta | Clase | Patrón estándar | CRUD / flujo |
|----------|------|-------|-----------------|--------------|
| **Stock** | `/inv/stock` | **B-R** | Consulta solo lectura | Filtro almacén; toggle Stock/Alertas; enlace Kardex |
| **Kardex** | `/inv/kardex` | **B-R** | Consulta analítica | Filtros almacén, producto, fechas |
| **Movimientos** | `/inv/movimientos` | **B-L** | Lista transaccional | Filtros + CTA página; detalle modal; workflow estado |
| **MovimientoFormPage** | `/inv/movimientos/nuevo`, `/:id/editar` | **B-F** | Cabecera + detalle §11 | POST/PUT `con-detalle`; líneas editables |
| **InventarioFisicoPage** | `/inv/inventario-fisico` | **B-L** | Lista transaccional | Filtros + CTA; detalle modal; aprobar/finalizar/anular |
| **InventarioFisicoFormPage** | `/inv/inventario-fisico/nuevo`, `/:id/editar` | **B-F** | Cabecera + detalle §11 | POST/PUT `con-detalle`; líneas conteo |

**Regla de decisión (§14):** estas pantallas **no** adoptan `OrgCompanyToolbar` ni `OrgToolbarSearch` de catálogo. Toolbar **operativa B**: filtros estructurados + CTA contextual (si aplica).

---

## 3. Matriz comparativa vs `ERP_FRONTEND_STANDARDS_V1`

Leyenda brecha: **O** = obligatorio M1-UX-B · **R** = recomendado · **P** = opcional · **—** = conforme · **M2** = INV-M2-SEC

| Dimensión | Stock | Kardex | Movimientos | Mov. Form | IF lista | IF Form |
|-----------|-------|--------|-------------|-----------|----------|---------|
| **§11 Transaccional API** | — | — | — | — | — | — |
| **§11 UI cabecera+detalle** | N/A | N/A | N/A | — | N/A | — |
| **§12 UUID en UI** | ❌ prefijo UUID | — | — | — | — | — |
| **§13 Multiempresa** | — hooks | — hooks | — hooks | — | — hooks | — |
| **Toolbar compacta** | Parcial | Parcial | Parcial | Header propio | Parcial | Header propio |
| **Filtros reset empresa** | — | — | — | Parcial create | — | Parcial create |
| **InvTableSkeleton** | — | — | — | N/A | — | N/A |
| **TABLE_COLSPAN** | ❌ | ❌ | ❌ | N/A | ❌ | N/A |
| **IamTableEmptyState** | ❌ inline | ❌ inline | ❌ inline | N/A | ❌ inline | N/A |
| **Empty `hasFilters`** | ❌ | ❌ | ❌ | N/A | ❌ | N/A |
| **B.1.1** | N/A | N/A | M2 modal | M2 página | M2 modal aprobar | M2 página |
| **InvPageLayout** | — | — | — | ❌ sin layout | — | ❌ sin layout |
| **Deep-link / rutas** | Link Kardex | ❌ no lee query | Link mixto | Links `/app/…` | Link mixto | Links `/app/…` |

---

## 4. Ficha detallada por pantalla

### 4.1 Stock (`StockPage.tsx`) — B-R

| Aspecto | Estado actual | Brecha vs estándar |
|---------|---------------|-------------------|
| **Multiempresa** | `useInvSessionScope`, `useInvScopeEmpresaReset`, hooks con gate | — |
| **Toolbar** | `[Almacén ▼]` + toggle Stock/Alertas (`ml-auto`) | **R:** componente toolbar operativa unificada; hint rendimiento si lista grande |
| **Filtros API** | `almacen_id` vía hook | **P:** API expone `producto_id` — filtro producto no expuesto en UI |
| **Skeleton** | `InvTableSkeleton columns={8}` | **O:** constante `TABLE_COLSPAN=8` |
| **Empty** | Inline icono + texto | **O:** `IamTableEmptyState`; variantes alertas vs stock vacío |
| **UUID §12** | `productoLabel` muestra `uuid…` si lookup falla | **O:** mostrar `—` (REG UX / E-ME4) |
| **Enriquecimiento FK** | N× `productoService.getById` por fila | **P:** deuda performance (M2 o batch API) |
| **Navegación** | Botón Kardex con query `empresa_id`, `producto_id`, `almacen_id` | Kardex **no consume** query → deep-link roto (**O** en Kardex) |
| **B.1.1** | N/A | — |

---

### 4.2 Kardex (`KardexPage.tsx`) — B-R

| Aspecto | Estado actual | Brecha vs estándar |
|---------|---------------|-------------------|
| **Multiempresa** | Gate en hook; producto select `disabled={!canQueryCompanyScoped}` | — |
| **Toolbar** | Almacén, producto, fechas + hint texto | **R:** agrupar filtros; `justify-between` si se añade acción futura |
| **Filtros API** | Alineado `INV_API` (`producto_id`, `almacen_id`, `fecha_desde/hasta`) | — |
| **Deep-link** | No `useSearchParams` — ignora params desde Stock | **O:** hidratar filtros desde URL al montar |
| **Skeleton / empty** | Skeleton 8 cols; empty inline | **O:** `TABLE_COLSPAN` + `IamTableEmptyState` con mensaje “acote fechas/filtros” |
| **Buscador texto** | No (correcto para B-R) | — |
| **Producto select** | Lista completa productos activos | **P:** virtualizar o buscar si catálogo grande |

---

### 4.3 Movimientos — listado (`MovimientosPage.tsx`) — B-L

| Aspecto | Estado actual | Brecha vs estándar |
|---------|---------------|-------------------|
| **Multiempresa** | `useInvScopeEmpresaReset`; hooks gated | — |
| **Toolbar** | 5 filtros + CTA `Nuevo movimiento` (`ml-auto`) | **O:** toolbar B compacta (`justify-between`: filtros | CTA) |
| **CTA ruta** | `Link to="/app/inv/movimientos/nuevo"` hardcoded | **O:** `toAppPath('/inv/movimientos/nuevo')` (consistencia) |
| **Filtros API** | almacén, tipo, estado, fechas | — |
| **Skeleton / empty** | 9 cols; empty “No hay movimientos” sin variante filtros | **O:** `TABLE_COLSPAN=9`, `IamTableEmptyState`, `hasActiveFilters` |
| **Empty CTA** | Sin enlace “Nuevo” en empty | **R:** CTA si `canCrear` y sin filtros activos |
| **Detalle modal** | Read-only + acciones workflow | Layout aceptable |
| **B.1.1 modal** | Dialog detalle + `ConfirmDialog` anular (motivo en otro dialog) | **M2:** B.1.1 en dialog aprobar/anular si campos editables |
| **Edit link** | `toAppPath` ✅ en fila | — |

---

### 4.4 Movimiento — formulario (`MovimientoFormPage.tsx`) — B-F

| Aspecto | Estado actual | Brecha vs estándar |
|---------|---------------|-------------------|
| **§11 CD-04–07** | Página completa; cabecera + líneas; `OrgSessionEmpresaField`; `assertBodyEmpresaMatchesSession` | — |
| **Layout §11.5** | Secciones `bg-surface border rounded-lg`; cabecera `p-6 mb-6`; detalle header `px-4 py-3 border-b` | — |
| **Multiempresa** | Reset parcial al cambiar empresa (solo create) | — |
| **Shell** | `div.w-full` sin `InvPageLayout` | **P:** envolver o documentar excepción form full-bleed |
| **Carga inicial** | `Loader` pantalla completa (edit) | — conforme §8.3 |
| **Navegación** | Volver/Cancelar `Link to="/app/inv/movimientos"` | **R:** `toAppPath` |
| **B.1.1 / dirty** | Cancelar navega sin confirmar cambios | **M2:** guard dirty al salir (página completa) |
| **Líneas vacías** | Submit bloqueado si sin líneas válidas | — |
| **INV-M1-UX-B** | **Alcance mínimo:** links + consistencia visual header | Sin B.1.1 |

---

### 4.5 Inventario físico — listado (`InventarioFisicoPage.tsx`) — B-L

| Aspecto | Estado actual | Brecha vs estándar |
|---------|---------------|-------------------|
| **Multiempresa** | Reset filtros; hooks gated | — |
| **Toolbar** | Almacén, estado, fechas + CTA “Nueva toma” | **O:** paridad toolbar con Movimientos |
| **CTA ruta** | `Link to="/app/inv/inventario-fisico/nuevo"` | **O:** `toAppPath` |
| **Skeleton / empty** | 7 cols; empty inline | **O:** `TABLE_COLSPAN=7`, `IamTableEmptyState`, `hasActiveFilters` |
| **Interacción** | Click fila → modal detalle | **—** (patrón válido B-L) |
| **Modal aprobar** | Select tipo ajuste + observaciones | **M2:** B.1.1 si formulario dirty |
| **Acciones lista** | Sin columna acciones (solo row click) | **P:** icono ver explícito (accesibilidad) |

---

### 4.6 Inventario físico — formulario (`InventarioFisicoFormPage.tsx`) — B-F

| Aspecto | Estado actual | Brecha vs estándar |
|---------|---------------|-------------------|
| **§11** | Estructura análoga a MovimientoFormPage | — |
| **Multiempresa** | `OrgSessionEmpresaField`, assert body, reset create | — |
| **Shell / links** | Sin `InvPageLayout`; links `/app/inv/…` | **R:** `toAppPath` |
| **B.1.1** | Sin guard dirty | **M2** |
| **INV-M1-UX-B** | Alcance mínimo: links | — |

---

## 5. Multiempresa — estado y brechas restantes

| ID | Área | Estado post M0-b | Brecha M1-UX-B |
|----|------|-------------------|----------------|
| ME-01 | `InvCompanyRouteGuard` | ✅ Todas rutas INV | — |
| ME-02 | `useInvCompanyQueryGate` en hooks | ✅ stock, kardex, mov, IF | — |
| ME-03 | Sin selector empresa local | ✅ | — |
| ME-04 | Reset filtros al cambiar empresa | ✅ listas B | — |
| ME-05 | Forms: `OrgSessionEmpresaField` + assert | ✅ B-F | — |
| ME-06 | UUID visible (Stock fallback) | ❌ | **O** — §12 |
| ME-07 | Deep-link Kardex (Stock → Kardex) | ❌ | **O** — hidratar URL |
| ME-08 | Links hardcoded `/app/inv/…` | ⚠️ parcial | **O/R** — `toAppPath` |

**Conclusión:** no reabrir INV-M0-b. M1-UX-B solo corrige **presentación y navegación** multiempresa-compatible.

---

## 6. B.1.1 — mapa de deuda (INV-M2-SEC)

| Superficie | Tipo | Campos editables | Prioridad M2 |
|------------|------|------------------|------------|
| Movimientos — modal detalle | Modal lectura + botones | No (workflow vía ConfirmDialog) | **P** |
| Movimientos — dialog anular | ConfirmDialog + textarea motivo | Sí (motivo) | **R** |
| IF — modal aprobar | Dialog select + textarea | Sí | **O** M2 |
| IF — modal detalle | Lectura | No | **P** |
| MovimientoFormPage | Página completa | Cabecera + líneas | **O** M2 (dirty guard navegación) |
| InventarioFisicoFormPage | Página completa | Cabecera + líneas | **O** M2 |

**INV-M1-UX-B:** explícitamente **sin** B.1.1.

---

## 7. Alcance definitivo INV-M1-UX-B

### 7.1 Incluido (cierre sprint)

| Fase | Pantallas | Entregables UX |
|------|-----------|----------------|
| **B1** | Stock, Kardex | Toolbar operativa B; `TABLE_COLSPAN`; `IamTableEmptyState` (+ variantes); fix UUID Stock; Kardex lee query URL |
| **B2** | Movimientos, InventarioFisico (lista) | Toolbar B; empty + `hasActiveFilters`; `TABLE_COLSPAN`; `toAppPath` en CTAs; empty CTA “Nuevo” opcional |
| **B3** | MovimientoFormPage, InventarioFisicoFormPage | **Solo** `toAppPath` en links volver/cancelar; sin B.1.1 |

### 7.2 Componentes a reutilizar / crear

| Componente | Acción |
|------------|--------|
| `IamTableEmptyState` | Reutilizar — props `title` / `description` para filtros activos (no `hasSearch` de catálogo) |
| `InvTableSkeleton` | Mantener |
| `InvPageLayout` | Mantener en listas B; forms pueden quedar sin layout (documentado) |
| `InvOperationalToolbar` (nuevo, **opcional**) | Wrapper `justify-between` para filtros + `actions` — evita duplicar flex en 4 listas |
| `OrgCompanyToolbar` / `OrgToolbarSearch` | **No usar** en B |

### 7.3 Fuera de alcance M1-UX-B

| Item | Sprint |
|------|--------|
| B.1.1 modales y formularios | INV-M2-SEC |
| Cambios API / hooks / `inv.service.ts` | — |
| Multiempresa JWT / guards | — |
| Catálogos (M1-UX-A cerrado) | — |
| Refactor N+1 `getById` productos | M2 performance |
| Filtro `producto_id` en Stock | **P** dentro de B1 si tiempo |
| Paginación server-side | Futuro |
| Debounce filtros fecha | **P** |

### 7.4 Clasificación cambios

| Cambio | O | R | P |
|--------|---|---|---|
| `IamTableEmptyState` + variantes filtros (4 listas) | 4 | | |
| `TABLE_COLSPAN` (4 listas) | 4 | | |
| Toolbar operativa homogénea | 4 | | |
| Kardex hidratar URL desde Stock | 1 | | |
| Stock: `—` en lugar de UUID | 1 | | |
| `toAppPath` links CTAs/listas/forms | | 6 | |
| `InvOperationalToolbar` reutilizable | | | 1 |
| Filtro producto en Stock | | | 1 |
| Empty CTA “Nuevo movimiento/toma” | | 2 | |
| InvPageLayout en form pages | | | 1 |

---

## 8. INV-M2-SEC — reservado explícitamente

1. **B.1.1** en modales con formulario (aprobar IF, anular con motivo editable).
2. **Dirty guard** en `MovimientoFormPage` e `InventarioFisicoFormPage` al cancelar/volver/navegar.
3. **`inv-form-dirty/*`** + adaptación de `OrgDiscardConfirmDialog` o variante INV.
4. **Performance:** batch lookup productos en Stock/Kardex/listas modales (evitar N× GET).
5. **Auditoría modales** Movimientos/IF post-B.1.1.

---

## 9. Archivos afectados (estimación implementación)

| Archivo | B1 | B2 | B3 |
|---------|:--:|:--:|:--:|
| `src/features/inv/pages/StockPage.tsx` | ✅ | | |
| `src/features/inv/pages/KardexPage.tsx` | ✅ | | |
| `src/features/inv/pages/MovimientosPage.tsx` | | ✅ | |
| `src/features/inv/pages/InventarioFisicoPage.tsx` | | ✅ | |
| `src/features/inv/pages/MovimientoFormPage.tsx` | | | ✅ |
| `src/features/inv/pages/InventarioFisicoFormPage.tsx` | | | ✅ |
| `src/features/inv/components/InvOperationalToolbar.tsx` | P | P | — |
| Hooks / services / guards | — | — | — |

---

## 10. Checklist QA esperado (post M1-UX-B)

### Listas B-R / B-L (Stock, Kardex, Movimientos, IF)

- [ ] Toolbar una fila operativa; CTA principal a la derecha (si aplica)
- [ ] **No** `OrgToolbarSearch` de catálogo
- [ ] `InvTableSkeleton` con `TABLE_COLSPAN` = thead
- [ ] Empty con `IamTableEmptyState`
- [ ] Con filtros activos y 0 filas → mensaje “sin resultados para filtros” (sin CTA crear incorrecto)
- [ ] Sin filtros y lista vacía → mensaje contextual + CTA si aplica (Mov/IF)
- [ ] Cambio empresa resetea filtros
- [ ] Sin selector empresa local

### Stock específico

- [ ] Producto sin lookup → `—`, nunca prefijo UUID
- [ ] Toggle Stock/Alertas intacto
- [ ] Enlace Kardex pre-carga filtros en Kardex

### Kardex específico

- [ ] URL `?producto_id=&almacen_id=` aplica filtros al entrar
- [ ] Hint fechas visible

### Formularios B-F

- [ ] Cabecera + líneas sin regresión
- [ ] Links volver/cancelar funcionan en entorno multi-base (`toAppPath`)
- [ ] **Sin** B.1.1 (comportamiento actual de cancelar directo documentado)

### Regresión multiempresa

- [ ] M0-b intacto; guards; queries scoped

---

## 11. Riesgos y regresiones a vigilar

| Riesgo | Mitigación |
|--------|------------|
| Forzar Plantilla A (buscador catálogo) en B | Auditoría §2 — usar toolbar operativa |
| Romper workflow autorizar/procesar/anular | No tocar lógica mutaciones en UX-B |
| Kardex URL params conflict con reset empresa | Aplicar URL solo en mount inicial |
| Empty CTA “Nuevo” con filtros activos | Usar `hasActiveFilters` explícito |
| Scope creep B.1.1 | Excluido en definición §7.3 |
| Stock UUID fix oculta datos | Asegurar lookup async sigue funcionando |

---

## 12. Conclusión

**INV-M1-UX-B** homogeneiza **4 listados/consultas transaccionales** (Stock, Kardex, Movimientos, IF lista) con empty IAM, skeleton consistente y toolbar operativa B, más **correcciones puntuales** (UUID Stock, deep-link Kardex, `toAppPath`). Los **formularios B-F** ya cumplen el núcleo §11; en M1-UX-B solo reciben **ajuste de navegación**.

**INV-M2-SEC** concentra **B.1.1**, dirty en páginas de documento y optimización de enriquecimiento FK.

---

*Auditoría generada sin código, sin repair, sin commit.*
