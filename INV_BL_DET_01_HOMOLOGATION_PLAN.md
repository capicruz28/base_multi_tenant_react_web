# INV-BL-DET-01 — Plan técnico de homologación

**Patrón oficial adoptado:** INV-BL-DET-01 — acceso híbrido al detalle en listados B-L de Inventarios.

**Estado:** Plan pre-implementación — **sin cambios de código**.

**Referencias:** `INV_DETAIL_NAVIGATION_HOMOLOGATION_AUDIT.md`, `ERP_FRONTEND_STANDARDS_V2.md` v2.1, implementaciones UX-003 / UX-004.

**Alcance:** Homologación de navegación listado → detalle modal únicamente. **Fuera de alcance:** workflows, Editar en fila vs modal, dirty guards, normativa V2.1 congelada, otros módulos INV.

---

## 1. Resumen ejecutivo

| Dimensión | Valor |
|-----------|-------|
| **Objetivo** | Ambas pantallas B-L cumplen INV-BL-DET-01 |
| **Archivos afectados** | **2** (solo páginas) |
| **Cambio mayor** | `InventarioFisicoPage` — nueva columna Acciones + refactor `abrirDetalle` |
| **Cambio menor** | `MovimientosPage` — click fila + a11y + `stopPropagation` |
| **Riesgo stacking / UX-003 / UX-004** | **Bajo** — no se toca lógica modal workflow |
| **Estimación** | **~2–3 h** implementación + **~45 min** QA manual |
| **Complejidad** | **Baja** |

---

## 2. Reglas INV-BL-DET-01 (recordatorio)

| # | Regla | Verificación homologación |
|---|-------|---------------------------|
| R1 | Función única `abrirDetalle(entidad)` | Ambas páginas |
| R2 | Botón explícito «Ver detalle» en columna Acciones | IF **nuevo**; Mov **existente** (mejorar a11y) |
| R3 | Click fila como atajo pointer | IF **existente**; Mov **nuevo** |
| R4 | Fila e icono invocan **la misma** función | Ambas |
| R5 | Workflow solo en modal detalle (PB-04) | Sin cambios |
| R6 | `stopPropagation` en botones Acciones si fila clickeable | Ambas |

---

## 3. Auditoría de impacto por pantalla

### 3.1 MovimientosPage.tsx — delta requerido

**Estado actual (post UX-004):**

| Elemento | Estado |
|----------|--------|
| `abrirDetalle(mov)` | ✅ Existe |
| Columna Acciones + `Eye` | ✅ Existe |
| `title="Ver detalle"` | ✅ Existe |
| `aria-label` | ❌ Falta |
| Click en `<tr>` | ❌ No |
| `cursor-pointer` en fila | ❌ No |
| `stopPropagation` en Acciones | ❌ No |
| `InvTableSkeleton columns={9}` | ✅ Alineado (sin cambio) |
| Empty `colSpan={9}` | ✅ Sin cambio |

**Cambios planificados:**

```typescript
// 1. Fila clickeable — mismo handler que icono
<tr
  key={row.movimiento_id}
  className="hover:bg-overlay dark:hover:bg-overlay cursor-pointer"
  onClick={() => abrirDetalle(row)}
>

// 2. Ver detalle — stopPropagation + aria-label
<Button
  variant="ghost"
  size="icon"
  className="text-brand-primary hover:text-brand-primary/80"
  title="Ver detalle"
  aria-label="Ver detalle"
  onClick={(e) => {
    e.stopPropagation();
    abrirDetalle(row);
  }}
>

// 3. Editar — stopPropagation (Link dentro de Button asChild)
<Button
  variant="ghost"
  size="icon"
  asChild
  title="Editar"
  aria-label="Editar"
  onClick={(e) => e.stopPropagation()}
>
  <Link to={toAppPath(...)} ...>
```

**Impacto funcional:** Ninguno en detalle modal, workflow, mutaciones, UX-004 dirty guard. Solo capa de interacción en tabla.

**Líneas estimadas:** +12–18 netas.

---

### 3.2 InventarioFisicoPage.tsx — delta requerido

**Estado actual (post UX-003):**

| Elemento | Estado |
|----------|--------|
| Apertura detalle | Inline `onClick` en `<tr>` con `setSelectedId` + `setDetailOpen` |
| `abrirDetalle()` | ❌ No existe como función nombrada |
| Columna Acciones | ❌ No |
| Import `Eye` | ❌ No |
| `InvTableSkeleton columns={7}` | ⚠️ Pasará a **8** |
| Empty `colSpan={7}` | ⚠️ Pasará a **8** |
| Click fila | ✅ Existe |
| `stopPropagation` | N/A hasta tener Acciones |

**Cambios planificados:**

```typescript
// 1. Función única (reemplaza inline onClick)
const abrirDetalle = (row: InventarioFisico) => {
  setSelectedId(row.inventario_fisico_id);
  setDetailOpen(true);
};

// 2. thead — nueva columna
<th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">
  Acciones
</th>

// 3. tbody fila
<tr
  key={row.inventario_fisico_id}
  className="hover:bg-overlay dark:hover:bg-overlay cursor-pointer"
  onClick={() => abrirDetalle(row)}
>
  {/* ... celdas datos ... */}
  <td className="px-4 py-3">
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="text-brand-primary hover:text-brand-primary/80"
        title="Ver detalle"
        aria-label="Ver detalle"
        onClick={(e) => {
          e.stopPropagation();
          abrirDetalle(row);
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  </td>
</tr>

// 4. Skeleton y empty
<InvTableSkeleton columns={8} />
<td colSpan={8} ...>
```

**Nota Editar en fila:** IF mantiene Editar **solo en modal detalle** (decisión explícita fuera de INV-BL-DET-01). Columna Acciones en IF tendrá **solo** Ver detalle en v1 homologación.

**Impacto funcional:** Ninguno en UX-003 (Aprobar dirty guard), stacking, mutaciones.

**Líneas estimadas:** +35–48 netas.

---

## 4. Archivos afectados

| Archivo | Tipo cambio | Obligatorio |
|---------|-------------|-------------|
| `src/features/inv/pages/MovimientosPage.tsx` | Click fila, a11y, stopPropagation | ✅ |
| `src/features/inv/pages/InventarioFisicoPage.tsx` | `abrirDetalle`, columna Acciones, colSpan/skeleton | ✅ |

**Sin cambios (confirmado):**

| Archivo / área | Motivo |
|----------------|--------|
| `ConfirmDialog.tsx` | Sin relación |
| `OrgDiscardConfirmDialog.tsx` | Sin relación |
| `inv-list-empresa-reset.ts` | Sin relación |
| Hooks / services / API | Sin relación |
| `InvTableSkeleton.tsx` | Solo prop `columns` desde página |
| `ERP_FRONTEND_STANDARDS_V2.md` | Normativa congelada — registro en anexo INV posterior |
| Otros módulos INV | Fuera alcance |

**Total archivos:** **2**.

---

## 5. Verificaciones de compatibilidad

### 5.1 Accesibilidad

| Requisito INV-BL-DET-01 | MovimientosPage | InventarioFisicoPage |
|-------------------------|-----------------|----------------------|
| Control accesible primario (botón) | Mejorar: `aria-label="Ver detalle"` | **Nuevo** botón con `title` + `aria-label` |
| Navegación teclado | Tab → botón Eye → Enter | Idem |
| Fila como atajo pointer-only | Documentado — **sin** `tabIndex` en `<tr>` | Idem |
| Icono decorativo | `Eye` dentro de botón nombrado — OK | Idem |
| Editar (solo Mov) | `aria-label="Editar"` recomendado | N/A en fila |

**Decisión a11y:** No hacer `<tr role="button" tabIndex={0}>` — el patrón aprobado delega teclado al botón Eye (WCAG 2.x: controles interactivos explícitos).

### 5.2 Stacking modal (PB-13, PB-14, MD-04)

| Pregunta | Respuesta |
|----------|-----------|
| ¿`abrirDetalle` altera stacking? | **No** — solo `setSelectedId` + `setDetailOpen(true)` |
| ¿Interfiere con UX-003 discard? | **No** — `detailDialogOpen` ya excluye `discardPending` |
| ¿Interfiere con UX-004 discard? | **No** — idem |
| ¿Abrir detalle durante workflow confirm? | Imposible desde lista — confirms bloquean interacción |
| ¿Doble apertura detalle? | Idempotente — mismo ID reabre |

**Invariante preservada:** apertura detalle no modifica `aprobarOpen`, `anularOpen`, `discardPending`.

### 5.3 Compatibilidad UX-003 (InventarioFisicoPage — Aprobar)

| Área UX-003 | Impacto homologación |
|-------------|----------------------|
| `handleOpenAprobar` | Sin cambio |
| `handleRequestCloseAprobar` | Sin cambio |
| `OrgDiscardConfirmDialog` | Sin cambio |
| `detailDialogOpen` formula | Sin cambio |
| Botón Aprobar en modal | Sin cambio |

Homologación **solo toca tabla listado** — cero regresión esperada en dirty guard.

### 5.4 Compatibilidad UX-004 (MovimientosPage — Anular)

| Área UX-004 | Impacto homologación |
|-------------|----------------------|
| `handleOpenAnular` | Sin cambio |
| `handleRequestCloseAnular` | Sin cambio |
| `OrgDiscardConfirmDialog` | Sin cambio |
| `discardPending` / baseline | Sin cambio |

Homologación **solo toca tabla listado**.

### 5.5 ERP Frontend Standards V2.1

| ID | Evaluación post-homologación |
|----|------------------------------|
| **PB-04** | ✅ Workflow permanece en modal; Acciones fila = Ver + Editar (Mov), no workflow |
| **PB-07** | ✅ Skeleton actualizado (IF col 8) |
| **PB-13 / PB-14** | ✅ Sin cambio en secuencia workflow |
| **MD-01 / MD-03** | ✅ Detalle sigue Tipo A |
| **MD-04** | ✅ Sin overlays adicionales |
| **RB-ROW-01…03** | N/A — reglas catálogo A/A+, no B-L detalle |
| **Gap normativo** | INV-BL-DET-01 pendiente de registro en anexo INV (no V2.1 en este ticket) |

---

## 6. Diseño técnico de implementación

### 6.1 Orden sugerido

1. **InventarioFisicoPage** — refactor `abrirDetalle` + columna Acciones (cambio estructural).
2. **MovimientosPage** — click fila + a11y + stopPropagation (cambio incremental).
3. QA matriz §8 en ambas pantallas.
4. Verificación visual colSpan / skeleton alineados.

### 6.2 Contrato `abrirDetalle`

| Pantalla | Firma | Cuerpo |
|----------|-------|--------|
| MovimientosPage | `(mov: Movimiento) => void` | `setSelectedMovimientoId(mov.movimiento_id); setDetailOpen(true);` |
| InventarioFisicoPage | `(row: InventarioFisico) => void` | `setSelectedId(row.inventario_fisico_id); setDetailOpen(true);` |

**No incluir** en `abrirDetalle`: reset filtros, cierre de discard, cierre de workflow — apertura desde lista en estado limpio.

### 6.3 Constantes tabla (IF)

| Constante | Antes | Después |
|-----------|-------|---------|
| `TABLE_COLSPAN` / skeleton cols | 7 | **8** |
| Empty state colSpan | 7 | **8** |

Opcional: extraer `const TABLE_COLSPAN = 8` local para evitar drift (MAY — no obligatorio en v1).

### 6.4 Imports adicionales (IF)

```typescript
import { Loader, ClipboardList, Plus, Pencil, Eye } from 'lucide-react';
```

---

## 7. Riesgos

### 7.1 Funcionales

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Doble fire abrirDetalle (burbuja) | Media sin stopPropagation | Bajo | R6 — stopPropagation en botones |
| Click fila accidental | Baja | Bajo | Patrón aprobado; hover affordance |
| colSpan desalineado (IF) | Media | Medio | Actualizar skeleton + empty + thead juntos |
| Regresión UX-003/004 | Muy baja | Alto | No tocar handlers workflow; QA targeted |

### 7.2 UX

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| IF tabla más ancha (+1 col) | Certeza | Bajo | Columna estrecha icon-only |
| Usuario no nota fila clickeable en Mov | Baja | Bajo | cursor-pointer + hover |

### 7.3 Accesibilidad

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Usuario teclado no usa fila | N/A | — | Botón Eye es path principal |
| Solo `title` sin `aria-label` | Alta pre-fix Mov | Medio | Añadir `aria-label` en homologación |

### 7.4 Técnicos

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| `onClick` en `Button asChild` + Link (Mov Editar) | Baja | Medio | stopPropagation en Button wrapper |
| Duplicar lógica abrirDetalle | Baja | Bajo | Una función por página — no helper compartido (alcance) |

---

## 8. Matriz QA

### 8.1 Funcional — abrirDetalle

| # | Pantalla | Acción | Resultado esperado |
|---|----------|--------|-------------------|
| Q1 | IF | Click fila | Modal detalle abre; ID correcto |
| Q2 | IF | Click icono Eye | Mismo resultado que Q1 |
| Q3 | Mov | Click fila | Modal detalle abre; ID correcto |
| Q4 | Mov | Click icono Eye | Mismo resultado que Q3 |
| Q5 | IF | Eye con fila clickeable | Un solo open; sin parpadeo doble |
| Q6 | Mov | Eye + Editar en fila clickeable | stopPropagation; no dispara fila dos veces |

### 8.2 Accesibilidad

| # | Acción | Resultado esperado |
|---|--------|-------------------|
| Q7 | Tab hasta botón Eye (IF/Mov) | Foco visible; Enter abre detalle |
| Q8 | Inspeccionar Eye | `aria-label="Ver detalle"` presente |
| Q9 | Mov Tab → Editar | Navega a form; no abre detalle por bubbling |

### 8.3 Regresión UX-003 / UX-004

| # | Pantalla | Acción | Resultado esperado |
|---|----------|--------|-------------------|
| Q10 | IF | Abrir detalle → Aprobar → dirty cancel | Discard UX-003 intacto |
| Q11 | IF | Abrir detalle → Aprobar OK | Mutación OK |
| Q12 | Mov | Abrir detalle → Anular → dirty cancel | Discard UX-004 intacto |
| Q13 | Mov | Abrir detalle → Anular OK | Mutación OK |
| Q14 | Ambas | Workflow desde detalle | PB-04 — sin acciones workflow en fila |

### 8.4 Stacking / visual

| # | Acción | Resultado esperado |
|---|--------|-------------------|
| Q15 | Abrir detalle desde fila | Un overlay (O1 detalle) |
| Q16 | Cerrar detalle | Vuelve a listado |
| Q17 | IF loading skeleton | 8 columnas alineadas con thead |
| Q18 | IF empty state | colSpan 8 |

### 8.5 PB-04 / listado

| # | Acción | Resultado esperado |
|---|--------|-------------------|
| Q19 | Inspeccionar columna Acciones IF | Solo Ver detalle (sin Aprobar/Anular) |
| Q20 | Inspeccionar columna Acciones Mov | Ver + Editar (si borrador); sin Autorizar/Procesar/Anular |

---

## 9. Estimación real

| Tarea | Esfuerzo |
|-------|----------|
| IF: `abrirDetalle` + columna Acciones + colSpan/skeleton | 1–1.5 h |
| Mov: fila clickeable + a11y + stopPropagation | 0.5 h |
| QA manual matriz §8 | 0.75 h |
| **Total** | **~2.25–2.75 h** |

| Métrica | Valor |
|---------|-------|
| Archivos | 2 |
| LOC netas aprox. | +47–66 |
| Complejidad | **Baja** |
| Tests automatizados | Opcional P3 — smoke manual suficiente |
| Dependencias | Ninguna — independiente de UX-003/004 merge order |

---

## 10. Checklist pre-merge (futuro)

- [ ] `abrirDetalle` única en cada página
- [ ] Fila e icono invocan `abrirDetalle`
- [ ] `aria-label="Ver detalle"` en ambos Eye
- [ ] `stopPropagation` en botones Acciones (Mov: Eye + Editar)
- [ ] IF: `columns={8}`, `colSpan={8}`
- [ ] Sin workflow en columna Acciones (PB-04)
- [ ] QA Q10–Q13 UX-003/004 pasan
- [ ] Sin cambios fuera de los 2 archivos autorizados

---

## 11. Fuera de alcance (v1 homologación)

- Editar en fila en IF (paridad con Mov).
- Helper compartido `abrirDetalleInvBl`.
- Registro formal INV-BL-DET-01 en V2.1 o anexo (ticket documentación separado).
- `IamTableEmptyState` / `hasActiveFilters` (deuda PB-06 ES-B).
- Módulos B-L futuros (PUR, SLS) — aplicar patrón en su sprint.

---

## 12. Veredicto del plan

| Pregunta | Respuesta |
|----------|-----------|
| ¿Impacto acotado? | **Sí** — 2 archivos, capa tabla |
| ¿Compatible UX-003/004? | **Sí** |
| ¿Compatible V2.1? | **Sí** — refuerza PB-04 |
| ¿Listo para implementación? | **Sí** — tras aprobación explícita del plan |

---

*Generado: 2026-06-10 — INV-BL-DET-01 homologación, sin cambios de código.*
