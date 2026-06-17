# INV — Auditoría UX: Homologación de acceso al detalle (B-L)

**Fecha:** 10 junio 2026  
**Estado:** Solo auditoría — sin implementación, sin commits  
**Alcance:** Patrón de navegación listado → detalle modal en `MovimientosPage` e `InventarioFisicoPage`  
**Fuera de alcance:** Workflows (Autorizar, Aprobar, Anular, etc.), botón Editar, dirty guards, contratos API  
**Norma de referencia:** `ERP_FRONTEND_STANDARDS_V2.md` v2.1 (B-L, PB-04, MD-01/03, RB-ROW*, AP-14)

---

## 1. Resumen ejecutivo

| Dimensión | Veredicto |
|-----------|-----------|
| **Consistencia actual INV B-L** | ❌ **Desalineado** — dos patrones coexisten |
| **Norma V2.1 explícita sobre entrada al detalle** | ⚠️ **No prescribe** fila vs icono; sí prescribe workflow en modal (PB-04) |
| **Patrón recomendado oficial INV** | **Híbrido:** click en fila **+** acción explícita «Ver detalle» en columna Acciones |
| **Homologación prioritaria** | Añadir columna Acciones + icono en IF; añadir click en fila en Movimientos |
| **Severidad deuda** | **P2** — UX/consistencia; no bloqueante funcional |
| **Implementación** | **No iniciar** en esta fase — solo definición de patrón |

---

## 2. Estado actual — evidencia de código

### 2.1 MovimientosPage (patrón A: acción explícita)

| Aspecto | Implementación |
|---------|----------------|
| Columna Acciones | **Sí** — 9.ª columna |
| Entrada al detalle | Botón ghost icon `Eye`, `title="Ver detalle"`, `onClick={() => abrirDetalle(row)}` |
| Click en fila | **No** — `<tr>` sin `onClick`, sin `cursor-pointer` |
| Otras acciones en fila | **Editar** (Link a form B-F) cuando estado borrador |
| Detalle | Radix `Dialog` Tipo A (solo lectura) + botones workflow |

```401:408:src/features/inv/pages/MovimientosPage.tsx
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-brand-primary hover:text-brand-primary/80"
                          title="Ver detalle"
                          onClick={() => abrirDetalle(row)}
                        >
                          <Eye className="h-4 w-4" />
```

```166:168:src/features/inv/pages/MovimientosPage.tsx
  const abrirDetalle = (mov: Movimiento) => {
    setSelectedMovimientoId(mov.movimiento_id);
    setDetailOpen(true);
  };
```

### 2.2 InventarioFisicoPage (patrón B: click en fila)

| Aspecto | Implementación |
|---------|----------------|
| Columna Acciones | **No** — 7 columnas de datos |
| Entrada al detalle | `onClick` en `<tr>` + `cursor-pointer` + hover |
| Acción explícita «Ver detalle» | **No** |
| Otras acciones en fila | **Ninguna** — Editar solo dentro del modal detalle |
| Detalle | Radix `Dialog` Tipo A + botones workflow |

```381:387:src/features/inv/pages/InventarioFisicoPage.tsx
                  <tr
                    key={row.inventario_fisico_id}
                    className="hover:bg-overlay dark:hover:bg-overlay cursor-pointer"
                    onClick={() => {
                      setSelectedId(row.inventario_fisico_id);
                      setDetailOpen(true);
                    }}
                  >
```

### 2.3 Comparación estructural

| Criterio | MovimientosPage | InventarioFisicoPage |
|----------|-----------------|----------------------|
| Plantilla V2.1 | B-L | B-L |
| Modal detalle | Tipo A (MD-01) | Tipo A |
| Workflow en detalle | ✅ PB-04 | ✅ PB-04 |
| Columnas tabla | 9 (incl. Acciones) | 7 (sin Acciones) |
| Editar desde lista | Sí (icono fila) | No (solo en modal) |
| Affordance visual detalle | Icono + tooltip | Hover + cursor |
| Target clickeable | ~32×32 px (icono) | Fila completa (~100% ancho) |

**Nota:** La diferencia de Editar en fila vs solo en modal es **fuera del alcance** de esta auditoría, pero condiciona la homologación: Movimientos ya reserva columna Acciones; IF no.

---

## 3. Análisis de alternativas

### 3.1 Alternativa 1 — Acción explícita «Ver detalle» (modelo Movimientos)

**Descripción:** Columna Acciones con icono `Eye` (o texto «Ver»); fila no clickeable.

| Ventajas | Desventajas |
|----------|-------------|
| Alta **descubribilidad** para usuarios nuevos | Target pequeño; más clics para usuarios frecuentes |
| **Accesibilidad:** control nombrado, `title`, focusable, activable con teclado | Columna extra reduce espacio datos |
| Alineado con patrón **RB-ROW** de catálogos (acciones explícitas en fila) | IF requiere **nueva columna** + posible columna Editar futura |
| Coexiste naturalmente con **Editar** en misma celda | Sin atajo de fila completa |
| Ya implementado y referenciado en auditorías INV | Homologar IF implica refactor tabla |

**V2.1:** Compatible. PB-04 no prohíbe acceso al detalle en tabla; prohíbe **workflow** en tabla.

### 3.2 Alternativa 2 — Click en fila (modelo Inventario Físico)

**Descripción:** `<tr onClick>` + `cursor-pointer`; sin columna Acciones para ver.

| Ventajas | Desventajas |
|----------|-------------|
| **Productividad** alta — target grande | **Descubribilidad baja** sin entrenamiento |
| Tabla más compacta (menos columnas) | Patrón implícito — no cumple espíritu a11y sin refuerzo |
| Patrón común en apps enterprise densas | Riesgo clic accidental al seleccionar texto |
| Ya implementado en IF | Movimientos **ya tiene** columna Acciones por Editar — difícil eliminar |
| | Screen reader: fila clickeable sin `role="button"` es **deuda a11y** |

**V2.1:** Compatible. `INV_M1_UX_B_AUDIT.md` marca click fila como «patrón válido B-L» con nota **P:** icono explícito por accesibilidad.

### 3.3 Alternativa 3 — Modelo híbrido (recomendado)

**Descripción:** Click en fila **y** icono «Ver detalle» en Acciones; ambos invocan la misma función `abrirDetalle(id)`.

| Ventajas | Desventajas |
|----------|-------------|
| Combina productividad (fila) + descubribilidad (icono) | Duplicidad de entry points — requiere convención documentada |
| Mejor **accesibilidad** que fila sola | Implementación en **ambas** pantallas |
| Homologación **aditiva** — no elimina preferencias existentes | Columna Acciones en IF (nuevo) |
| Escalable a PUR/SLS B-L con regla clara | Editar en fila (Mov) vs modal (IF) sigue siendo asimetría separada |
| Cumple deuda **P** de `INV_M1_UX_B_AUDIT` | |

**V2.1:** Compatible y alineado con espíritu MD-03 (detalle Tipo A accesible) sin violar PB-04.

---

## 4. Evaluación por criterio

### 4.1 Consistencia UX

| Criterio | Patrón A (icono) | Patrón B (fila) | Híbrido |
|----------|------------------|-----------------|---------|
| Consistencia intra-INV | Solo si IF adopta A | Solo si Mov adopta B | ✅ Ambos convergen |
| Consistencia con ORG catálogos | ✅ Acciones explícitas | ❌ ORG no usa fila clickeable | ✅ Icono alinea con ORG |
| Predictibilidad cross-módulo | Media | Baja (único en INV) | Alta |

### 4.2 Descubribilidad (usuarios nuevos)

| Patrón | Puntuación | Notas |
|--------|------------|-------|
| Icono Eye + tooltip | **Alta** | Convención ERP universal |
| Click fila | **Baja–Media** | Requiere hover/cursor como única pista |
| Híbrido | **Alta** | Icono enseña; fila acelera después |

### 4.3 Productividad (usuarios frecuentes)

| Patrón | Puntuación | Notas |
|--------|------------|-------|
| Icono solo | Media | Precisión de puntero |
| Fila | **Alta** | Un clic anywhere en fila |
| Híbrido | **Alta** | Misma velocidad que fila |

### 4.4 Accesibilidad

| Patrón | Teclado | Screen reader | WCAG espíritu |
|--------|---------|---------------|---------------|
| Icono `Button` | ✅ Tab + Enter | ✅ Nombre accesible (`title` / `aria-label`) | ✅ |
| Fila `onClick` | ❌ Sin foco en fila | ⚠️ Fila no semántica como control | ⚠️ |
| Híbrido | ✅ Via botón | ✅ Via botón; fila es conveniencia pointer | ✅ |

**Recomendación a11y:** Si se mantiene click en fila, el icono «Ver detalle» MUST existir como control accesible primario; la fila es atajo pointer-only (documentar en norma INV).

### 4.5 Compatibilidad ERP Frontend Standards V2.1

| ID | Aplica a entrada detalle | Patrón A | Patrón B | Híbrido |
|----|--------------------------|----------|----------|---------|
| **PB-04** | Workflow solo en modal | ✅ | ✅ | ✅ |
| **PB-13/14** | Stacking al abrir workflow | ✅ (post UX-003/004) | ✅ | ✅ |
| **MD-01** | Detalle = Tipo A | ✅ | ✅ | ✅ |
| **MD-03** | Detalle lectura sin B.1.1 | ✅ | ✅ | ✅ |
| **RB-ROW-01…03** | Acciones catálogo baja lógica | N/A B-L | N/A | N/A |
| **AP-14** | Acciones fila catálogo | N/A | N/A | N/A |
| **Norma explícita fila vs icono** | — | **Silencio normativo** | **Silencio** | Llenar gap vía guía INV |

**Conclusión normativa:** V2.1 **no define** hoy el mecanismo de apertura del detalle B-L. La homologación requiere **guía de dominio INV** (Anexo o ADR) sin modificar V2.1 en esta fase.

### 4.6 Escalabilidad futuros módulos INV

Módulos B-L previstos en V2.1 §2.1: PUR solicitudes, SLS cotizaciones/pedidos, LOG guías, INV_BILL, CRM pipeline.

| Patrón | Escalabilidad |
|--------|---------------|
| Solo icono | Clara; copiar columna Acciones |
| Solo fila | Compacta; riesgo inconsistencia si algún listado necesita Acciones por Editar |
| **Híbrido documentado** | **Mejor** — regla única copy-paste: `abrirDetalle` + fila + Eye |

---

## 5. Deuda documental existente

| Fuente | Hallazgo relevante |
|--------|-------------------|
| `INV_M1_UX_B_AUDIT.md` §4.4 / §4.5 | Mov: icono ver explícito ✅; IF: click fila válido, **P:** icono por a11y |
| `ERP_FRONTEND_STANDARDS_V2.md` §6.3 | PB-04 workflow en detalle — **no** regula entrada |
| `INV_MODAL_STACKING_AUDIT.md` | Diagrama «Click fila / Ver detalle» — **acepta ambos** |
| Referencias canónicas V2.1 | Cita **ambas** páginas sin distinguir patrón entrada |

---

## 6. Matriz de decisión

|  | Explicit icono | Click fila | **Híbrido** |
|--|----------------|------------|-------------|
| Consistencia INV | Media | Media | **Alta** |
| Descubribilidad | Alta | Baja | **Alta** |
| Productividad | Media | Alta | **Alta** |
| Accesibilidad | Alta | Baja | **Alta** |
| Coste homologación IF | Media (+col) | Bajo (ya tiene fila) | Media (+col) |
| Coste homologación Mov | — (ya tiene) | Bajo (+fila) | **Bajo (+fila)** |
| V2.1 compliance | ✅ | ✅ | ✅ |
| Escalabilidad | Media | Media | **Alta** |
| **Total recomendación** | Viable | Viable | **Óptimo** |

---

## 7. Recomendación arquitectónica final

### 7.1 Patrón oficial propuesto — **INV-BL-DET-01** (híbrido)

**Regla:** En listados **Plantilla B-L** del dominio Inventarios:

1. **MUST** existir función única `abrirDetalle(entidad)` que setea ID seleccionado + `detailOpen=true`.
2. **MUST** columna **Acciones** con botón icono **«Ver detalle»** (`Eye`, `title` + `aria-label="Ver detalle"`, variant ghost).
3. **MAY** click en fila (`<tr>`) como atajo pointer que invoca la **misma** función — con `cursor-pointer` y hover token `bg-overlay`.
4. **MUST NOT** poner acciones **workflow** en la fila (PB-04) — solo Ver detalle y, si aplica, Editar/enlace B-F.
5. **MUST NOT** doble handler divergente — fila e icono comparten `abrirDetalle`.
6. **SHOULD** `event.stopPropagation()` en botones Acciones (Editar, Ver) si la fila es clickeable — evita doble disparo.

**No es parte de esta regla:** unificar si Editar vive en fila (Mov) o solo en modal (IF) — decisión separada de navegación Editar.

### 7.2 Dirección de homologación (cuando se implemente — fuera de este documento)

| Pantalla | Cambio hacia INV-BL-DET-01 |
|----------|----------------------------|
| `InventarioFisicoPage` | **Añadir** columna Acciones + icono Ver detalle; **mantener** click fila |
| `MovimientosPage` | **Añadir** click fila + `cursor-pointer`; **mantener** icono Ver detalle |

### 7.3 Alternativas descartadas como patrón único

| Alternativa | Motivo descarte como único oficial |
|-------------|-----------------------------------|
| Solo icono | Sacrifica productividad; IF pierde atajo fila ya aprendido |
| Solo fila | Deuda a11y; contradice `INV_M1` recomendación P; Mov ya tiene columna Acciones |

### 7.4 Ubicación normativa futura (sin editar V2.1 ahora)

Cuando se cierre homologación, registrar **INV-BL-DET-01** en:

- Anexo operativo INV (ej. `docs/frontend/modulos/B_INV_FRONTEND_IMPLEMENTACION.md`), **o**
- ADR de dominio INV,

sin modificar `ERP_FRONTEND_STANDARDS_V2.md` hasta ciclo normativo acordado.

---

## 8. Riesgos de no homologar

| Riesgo | Prob. | Impacto |
|--------|-------|---------|
| Usuario IF no descubre detalle sin capacitación | Media | Medio |
| Usuario Mov espera click fila (otros ERP) | Baja | Bajo |
| Nuevos módulos B-L eligen patrón ad hoc | Alta | Medio |
| Auditorías QA inconsistentes | Media | Bajo |

**Severidad global:** P2 — deuda UX/consistencia.

---

## 9. Veredicto

| Pregunta | Respuesta |
|----------|-----------|
| ¿Hay inconsistencia real? | **Sí** — dos patrones en el mismo dominio B-L |
| ¿V2.1 prohíbe alguno? | **No** — ambos compatibles con PB-04 y MD-01/03 |
| ¿Cuál debe ser el patrón oficial? | **Híbrido INV-BL-DET-01** (fila + icono Ver detalle) |
| ¿Implementar ahora? | **No** — solo definición; homologación en ticket posterior |
| ¿Bloquea operación actual? | **No** |

### Recomendación ejecutiva

Adoptar **INV-BL-DET-01 (híbrido)** como patrón único oficial de acceso al detalle en listados B-L de Inventarios. Homologar **ambas** pantallas hacia ese patrón en un sprint de consistencia UX dedicado, **después** de aprobar explícitamente este criterio.

---

*Auditoría completada. Sin cambios de código, commits ni documentación normativa V2.1.*
