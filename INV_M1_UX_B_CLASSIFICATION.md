# Clasificación de hallazgos INV-M1-UX-B — Criterio de evaluación

**Fecha:** 31 mayo 2026  
**Estado:** Solo análisis — sin implementación, sin commit  
**Contexto:** INV refactorizado según rules y [`PROMPT_FRONTEND_MAESTRO.md`](./docs/prompts/PROMPT_FRONTEND_MAESTRO.md). Diferencias con ORG o [`ERP_FRONTEND_STANDARDS_V1.md`](./ERP_FRONTEND_STANDARDS_V1.md) **no implican cambio automático** si el patrón transaccional INV es válido.  
**Complemento:** [`INV_M1_UX_B_AUDIT.md`](./INV_M1_UX_B_AUDIT.md)

---

## 1. Reglas de clasificación aplicadas

| Categoría | Criterio |
|-----------|----------|
| **1. Obligatorio corregir** | Rompe MUST de estándar/prompt maestro, multiempresa JWT, navegación funcional o regla explícita de UI (p. ej. UUID visible) |
| **2. Recomendado** | Mejora UX real, reduce deuda o alinea mantenibilidad; **no** bloquea operación actual |
| **3. Mantener como está** | Comportamiento válido patrón B; diferencia justificada vs ORG; alineado a prompt maestro |

**Principio rector:** INV-M1-UX-B debe ser **quirúrgico**. No replicar ORG en transaccionales.

---

## 2. Clasificación por hallazgo

### 2.1 Toolbar operativa B

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | Stock, Kardex, Movimientos e IF: una fila `flex-wrap`, filtros a la izquierda, CTA o toggles a la derecha (`ml-auto` donde aplica). Form pages: header compacto volver + título + Guardar/Cancelar. |
| **vs ORG** | No usa `OrgCompanyToolbar` — **correcto** (catálogo vs operativo). |
| **vs Prompt maestro** | Bloque layout: *“Filtros a la izquierda, botón crear a la derecha”*, *“toolbar compacta”* — **cumple**. |
| **vs ERP §5** | §5 describe toolbar catálogo E-UX.1; §14 dice patrón INV transaccional distinto. |

**Clasificación: 3. Mantener como está**

**Motivo:** La toolbar B actual implementa el diseño transaccional acordado. Homogeneizar con un wrapper nuevo no corrige un fallo; solo buscaría paridad cosmética con ORG.

**Descartar de M1-UX-B:** refactor toolbar, `InvOperationalToolbar`, segunda pasada de layout en las 4 listas.

---

### 2.2 `IamTableEmptyState` en listas transaccionales

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | Empty inline (icono + `<p>`) en Stock, Kardex, Movimientos, IF. |
| **vs ORG / M1-UX-A** | Catálogos usan `IamTableEmptyState`; transaccionales no. |
| **vs Prompt maestro** | Exige *“empty state”* — **cumplido** con inline. No exige componente IAM en B. |
| **vs ERP §7** | Norma escrita en contexto listado catálogo (§10.3). §15.3 checklist “listado” es genérico pero no impone IAM en B-R/B-L. |

**Clasificación: 3. Mantener como está** (componente IAM)

**Matiz UX real:** mensaje distinto cuando **hay filtros activos y 0 resultados** vs lista realmente vacía — hoy no siempre se distingue bien (Kardex parcialmente con hint; Mov/IF no).

| Sub-hallazgo | Clasificación |
|--------------|---------------|
| Migrar las 4 listas a `IamTableEmptyState` | **2. Recomendado** (consistencia IAM, no obligatorio) |
| Variante “sin resultados con filtros activos” (texto/description) | **2. Recomendado** (mejora UX real; puede hacerse **sin** cambiar de inline a IAM) |

**Descartar de M1-UX-B (obligatorio):** migración masiva a `IamTableEmptyState` como requisito de cierre.

**Opcional en sprint:** solo mejorar copy/variante de empty con filtros (inline o IAM).

---

### 2.3 `TABLE_COLSPAN`

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | Números literales (`8`, `9`, `7`) repetidos en skeleton, empty y thead. |
| **vs ERP SK-03** | Recomienda constante compartida — alinea skeleton/empty/thead. |
| **Impacto funcional** | Ninguno mientras coincidan (hoy coinciden). |

**Clasificación: 2. Recomendado**

**Motivo:** Mantenibilidad; no rompe estándar ni operación.

**Descartar de M1-UX-B (obligatorio):** no es criterio de cierre del sprint.

---

### 2.4 Stock UUID fallback

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | `productoLabel` muestra `productoId.substring(0, 8)…` si falla lookup. |
| **vs ERP §12 / E-ME4** | **Prohibido** mostrar UUID (ni truncado) como etiqueta. |
| **vs Prompt maestro** | *“NUNCA dejar ninguna columna con UUID — siempre resolver al nombre descriptivo”*. |
| **vs Kardex/Mov** | Esas pantallas ya usan `—` como fallback. |

**Clasificación: 1. Obligatorio corregir**

**Motivo:** Incumplimiento explícito MUST; inconsistencia interna INV; no es diferencia justificada del patrón B.

**Incluir en M1-UX-B:** sí.

---

### 2.5 Deep-link Stock → Kardex

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | Stock navega a `/inv/kardex?empresa_id&producto_id&almacen_id`; Kardex **no lee** query al montar → filtros vacíos. |
| **vs funcional** | El botón “Kardex” promete contexto producto/almacén — **flujo roto**. |
| **vs multiempresa** | `empresa_id` en query es redundante post-JWT; no rompe ME, pero el deep-link de producto/almacén sí falla. |

**Clasificación: 1. Obligatorio corregir**

**Motivo:** Rompe navegación y consistencia funcional entre pantallas del mismo módulo.

**Incluir en M1-UX-B:** sí (Kardex hidrata `producto_id` y `almacen_id` desde URL; omitir o ignorar `empresa_id` en query).

---

### 2.6 `toAppPath`

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | Mezcla: algunos links `toAppPath('/inv/…')`, otros hardcoded `/app/inv/…`. |
| **vs navegación** | Rutas bajo `/app/*` — **ambos funcionan** hoy (`mapLegacyErpPath` convierte `/inv` → `/app/inv`). |
| **vs mantenibilidad** | Una sola convención reduce riesgo si cambia prefijo o aliases legacy. |

**Clasificación: 2. Recomendado**

**Motivo:** No hay rotura actual demostrable; es deuda de consistencia.

**Descartar de M1-UX-B (obligatorio):** no condicionar cierre del sprint.

**Opcional en sprint:** unificar CTAs que aún usan string literal (Movimientos “Nuevo”, IF “Nueva toma”, forms Cancelar) si el diff es pequeño.

---

### 2.7 Empty CTA en Movimientos e Inventario Físico

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | Empty solo texto; CTA “Nuevo movimiento” / “Nueva toma” **ya está en toolbar** (`canCrear`). |
| **vs ORG catálogo** | Catálogos repiten CTA en empty — patrón A. |
| **vs Prompt maestro** | Toolbar ya tiene acción principal a la derecha. |

**Clasificación: 3. Mantener como está**

**Motivo:** Duplicar CTA en empty no aporta UX crítica; el usuario ya tiene el botón en toolbar. Paridad ORG no aplica a B-L.

**Descartar de M1-UX-B:** empty CTA en Movimientos e IF.

---

### 2.8 `InvOperationalToolbar` (opcional)

| Aspecto | Evaluación |
|---------|------------|
| **Propuesta auditoría** | Wrapper `justify-between` reutilizable para 4 listas. |
| **Estado actual** | Cada página ya logra layout operativo con flex local. |
| **Coste/beneficio** | Nuevo archivo + migración 4 pantallas por estética marginal. |

**Clasificación: 3. Mantener como está** (sin crear componente)

**Descartar de M1-UX-B:** creación de `InvOperationalToolbar`.

---

### 2.9 `InvPageLayout` en formularios B-F

| Aspecto | Evaluación |
|---------|------------|
| **Estado actual** | `MovimientoFormPage` e `InventarioFisicoFormPage` usan `div.w-full` + header compacto + secciones §11. |
| **vs Prompt maestro** | Form transaccional: *“Header compacto con identificador del documento + acciones”* — **sin** `InvPageLayout`. |
| **vs ERP §11.5** | Secciones cabecera/detalle en contenedores — **cumple**. |
| **vs listas** | Listas sí usan `InvPageLayout` (breadcrumb chrome) — diferencia intencional. |

**Clasificación: 3. Mantener como está**

**Descartar de M1-UX-B:** envolver forms en `InvPageLayout`.

---

## 3. Tabla resumen

| Hallazgo | 1 Obligatorio | 2 Recomendado | 3 Mantener | Entrar M1-UX-B |
|----------|:-------------:|:-------------:|:----------:|:--------------:|
| Toolbar operativa B | | | ✅ | **No** |
| `IamTableEmptyState` (migración completa) | | ✅ | ✅* | **No** (oblig.) |
| Variante empty con filtros activos | | ✅ | | Opcional |
| `TABLE_COLSPAN` | | ✅ | ✅ | Opcional |
| Stock UUID → `—` | ✅ | | | **Sí** |
| Deep-link Stock → Kardex | ✅ | | | **Sí** |
| `toAppPath` unificado | | ✅ | ✅ | Opcional |
| Empty CTA Mov / IF | | | ✅ | **No** |
| `InvOperationalToolbar` | | | ✅ | **No** |
| `InvPageLayout` en forms | | | ✅ | **No** |

\* Mantener empty inline es válido; migrar a IAM es recomendación, no obligación.

---

## 4. Recomendación final — alcance real INV-M1-UX-B

### 4.1 Aprobar sprint acotado (“M1-UX-B mínimo”)

Solo **obligatorios** — corrige incumplimientos MUST y flujo roto, sin re-trabajar UX ya válida:

| # | Entrega | Archivos |
|---|---------|----------|
| **B-O1** | Stock: fallback producto `—` (nunca UUID truncado) | `StockPage.tsx` |
| **B-O2** | Kardex: leer `producto_id` y `almacen_id` de query URL al montar; respetar reset empresa | `KardexPage.tsx` |

**Criterio de cierre:** QA manual Stock/Kardex + regresión multiempresa + verificar botón Kardex desde fila Stock.

**Esfuerzo estimado:** bajo (2 archivos, sin hooks/API/guards).

---

### 4.2 Stretch opcional (solo si hay capacidad; no bloquea cierre)

| # | Entrega | Clasificación |
|---|---------|---------------|
| **B-R1** | Mensajes empty diferenciados con filtros activos (Kardex, Movimientos, IF, Stock) — puede ser inline | Recomendado |
| **B-R2** | Constantes `TABLE_COLSPAN` en 4 listas | Recomendado |
| **B-R3** | Unificar links restantes con `toAppPath` | Recomendado |

---

### 4.3 Descartar explícitamente (evitar cambios innecesarios)

| Item | Motivo descarte |
|------|-----------------|
| Refactor toolbar operativa B | Ya cumple prompt maestro |
| `InvOperationalToolbar` | Abstracción sin fallo que corregir |
| Migración obligatoria a `IamTableEmptyState` | Paridad ORG no aplica a B; empty inline válido |
| Empty CTA duplicado en Mov / IF | CTA ya en toolbar |
| `InvPageLayout` en form pages | Contradice patrón transaccional del prompt maestro |
| Fase B3 forms (salvo `toAppPath` opcional) | Forms ya conformes §11 |
| B.1.1, dirty guard, N+1 productos | **INV-M2-SEC** (sin cambio) |

---

### 4.4 Lo que permanece fuera de INV-M1-UX-B (confirmado)

- Multiempresa JWT, hooks, guards, servicios  
- B.1.1 y modales workflow  
- Catálogos (M1-UX-A cerrado)  
- Toolbar/search estilo ORG en transaccionales  

---

## 5. Veredicto para aprobación

**INV-M1-UX-B puede aprobarse** con alcance **mínimo obligatorio (B-O1 + B-O2)**.

La auditoría original sobreestimó el sprint al tratar **paridad cosmética con ORG** (IAM empty, toolbar wrapper, TABLE_COLSPAN obligatorio) como requisitos de cierre. Tras aplicar el criterio *“diferencia ≠ defecto”*, el sprint transaccional se reduce a **correcciones MUST reales** más un **paquete recomendado opcional**.

**INV-M2-SEC** sigue reservando B.1.1, dirty en forms y optimización FK.

---

## 6. Backlog técnico (Recomendado — no bloquea cierre M1-UX-B)

| ID | Item | Pantallas | Notas |
|----|------|-----------|-------|
| BL-B1 | Variante empty con filtros activos (copy inline) | Kardex, Movimientos, IF, Stock | Mejora UX; no requiere `IamTableEmptyState` |
| BL-B2 | Constante `TABLE_COLSPAN` alineada skeleton/empty/thead | 4 listas B | Mantenibilidad |
| BL-B3 | Unificar links con `toAppPath` | Movimientos, IF, forms | Consistencia rutas |
| BL-B4 | Migración opcional a `IamTableEmptyState` | 4 listas B | Paridad IAM; no obligatoria en B |
| BL-B5 | Filtro `producto_id` en Stock (API disponible) | Stock | Funcional extra |
| BL-B6 | Batch lookup productos (evitar N× GET) | Stock, Kardex, modales | INV-M2-SEC / performance |

---

*Documento generado sin código, sin repair, sin commit.*
