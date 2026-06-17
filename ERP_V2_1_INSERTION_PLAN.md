# ERP Frontend Standards — Plan de inserción V2.1

**Fecha:** 10 junio 2026  
**Estado:** Propuesta para aprobación — **sin cambios aplicados**  
**Base:** `ERP_V2_DOCUMENTATION_AUDIT.md` + evidencia ORG/INV implementada  
**Alcance:** Solo adiciones; cero eliminación, reescritura o reordenación de contenido existente

---

## 0. Resumen ejecutivo

| Métrica | Valor |
|---------|--------|
| Archivos afectados | 3 |
| Inserciones planificadas | 22 bloques aditivos |
| IDs nuevos | 18 |
| IDs existentes modificados | **0** |
| IDs existentes renumerados | **0** |
| Capítulos reescritos | **0** |
| Secciones movidas | **0** |

**Corrección respecto a auditoría previa:** Los IDs **PB-09**, **PB-10** y **PB-11** ya existen en **§6.4 B-R** (consulta). Las reglas de stacking B-L usan **PB-13** y **PB-14** (siguiente hueco libre en serie PB tras PB-12).

**Mapa candidato audit → ID final V2.1:**

| Nombre audit | ID final V2.1 |
|--------------|---------------|
| MD-STACK-01 | **B11-10**, **AP-13** |
| MD-STACK-02 | **PB-13** |
| MD-STACK-03 | **PB-14** |
| MD-SEM-01 | **UX-05** |
| MD-SEM-02 | **UX-06** |
| MD-SEM-03 | **UX-07** |
| MD-SEM-04 | **UX-08** |
| RB-ROW-01…03 | **RB-ROW-01…03** |
| MD-01…04 | **MD-01…04** |
| Cierre Radix antes de confirm (procedimiento) | **B11-11** |

---

## 1. Validación previa (obligatoria antes de merge)

### 1.1 Contradicciones con reglas existentes

| Nueva regla | Regla existente | ¿Contradicción? | Resolución |
|-------------|-----------------|-----------------|------------|
| RB-ROW-01 (no Editar en inactivo) | UX-04 (no `es_activo` en edit modal) | **No** | UX-04 regula formulario; RB-ROW regula visibilidad en tabla. Complementarias. |
| RB-ROW-01 | RB-01 (permisos) | **No** | RB-ROW aplica después de RB-01. |
| B11-10 / AP-13 | AP-06 (no mezclar baja con `discardPending`) | **No** | AP-06 = estado compartido; B11-10 = overlays simultáneos. Ortogonales. |
| B11-10 | B11-02 | **No** | B11-02 independencia discard; B11-10 stacking físico. |
| PB-13 | PB-08 (workflow sin B.1.1 dirty) | **No** | PB-08 = tipo de confirm; PB-13 = secuencia cierre detalle. |
| PB-13 | SEC-08 (detalle sin B.1.1) | **No** | SEC-08 permite ESC en detalle; PB-13 cierra detalle antes del confirm. |
| PB-13 | PB-04 (workflow en detalle) | **No** | PB-04 = ubicación acciones; PB-13 = secuencia al confirmar. |
| UX-05 (`warning` workflow positivo) | UX-01 (vocabulario) | **No** | UX-05 añade capa visual; no cambia términos. |
| UX-07 (confirm reactivar) | B11-02 / PA-07 | **No** | Formaliza obligatoriedad y `variant` ya practicados post-P1. |
| UX-08 (`warning` discard) | B11-04 (textos discard) | **No** | UX-08 norma variant; B11-04 norma copy. |
| MD-03 (Tipo A sin `orgDialogGuardProps`) | B11-06 (guard en dirty) | **No** | MD-03 solo detalle lectura B-L; CRUD sigue B11-06. |

**Veredicto:** Ninguna contradicción normativa. Una **ambigüedad operativa** a resolver en redacción: UX-05 y UX-08 comparten `variant="warning"` — documentar que se distinguen por contexto (workflow vs discard) y copy (B11-04).

### 1.2 Duplicidad funcional

| Par | Tipo | Aceptable |
|-----|------|-----------|
| B11-10 + AP-13 | Prohibición (B11) + anti-patrón (AP) | **Sí** — patrón V2 existente (AP-06 ↔ B11-02) |
| B11-10 + B11-11 | MUST NOT + MUST procedimiento | **Sí** — prohibición + procedimiento positivo |
| B11-02 + UX-07 | Independencia discard + confirm reactivar | **Sí** — UX-07 añade variant y obligatoriedad pre-mutación |
| PA-07 + UX-07 | Desactivar/reactivar independiente | **Parcial** — PA-07 no se modifica; UX-07 extiende solo reactivar |
| UX-04 + RB-ROW-01 | Formulario vs fila | **No es duplicidad** — hogares distintos |

**Veredicto:** Sin duplicidad que requiera eliminar reglas existentes.

### 1.3 Consistencia de IDs con estructura V2

| Prefijo | Uso actual V2 | Nuevos IDs | ¿Conflicto? |
|---------|---------------|------------|-------------|
| B11- | §7.1, hasta B11-09 | B11-10, B11-11 | **No** |
| PB- | §6.3 PB-04…08; §6.4 PB-09…12 | PB-13, PB-14 en §6.3 | **No** (PB-09…12 intactos en B-R) |
| AP- | §3.2 hasta AP-11; §9.1 AP-12 | AP-13, AP-14 en §3.2 | **No** |
| UX- | §8.4 UX-01…02; §8.6 UX-03…04 | UX-05…08 en §8.8 | **No** |
| RB- | §8.3 RB-01…02 | RB-ROW-* en §5.10 | **No** (subfamilia nueva, explícita) |
| MD- | No existía | MD-01…04 en §7.1.1 | **No** |
| SEC- | §7.2…7.3 hasta SEC-10 | Sin nuevos SEC | **No** |

---

## 2. `ERP_FRONTEND_STANDARDS_V2.md`

### INS-V2-00 — Metadatos §0 (cabecera)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Líneas 1–7 — reemplazo **solo** de valores en filas `Versión`, `Fecha`, `Estado`; resto intacto |
| **Ancla antes** | `# Estándares frontend ERP — v2.0` |
| **Ancla después** | Bloque `**Fuentes consolidadas:**` sin cambios |

**Texto a agregar / ajustar (solo estas líneas):**

```markdown
# Estándares frontend ERP — v2.1

**Versión:** 2.1  
**Fecha:** [FECHA_MERGE]  
**Estado:** **Normativo** — post-cierre IAM · ORG · INV · incorporación modales/acciones fila ORG+INV
```

| IDs | — |
|-----|---|
| **Justificación** | Identificar revisión sin alterar precedencia ni principio *write once*. |
| **Dependencias** | Última inserción del plan (metadatos + §13). |
| **Riesgos** | Bajo — cosmético. |
| **Compatibilidad** | V2.0 sigue válida; V2.1 es extensión aditiva. |

---

### INS-V2-01 — Anti-patrones §3.2

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Tabla §3.2 — **nueva fila al final**, después de **AP-11**, antes del `---` que precede §4 |
| **Ancla antes** | `\| **AP-11** \| Toast error duplicado hook + componente \| Todas \| ER-02 \|` |
| **Ancla después** | `---` + `## §4 — Multiempresa JWT` |

**Texto exacto a agregar:**

```markdown
| **AP-13** | Radix `Dialog` `open` + `ConfirmDialog` `isOpen` simultáneos | A, B-L, T, H, Admin | B11-10 |
| **AP-14** | Acciones fila catálogo sin rama `row.es_activo` | A, A+, T, H | RB-ROW-02 |
```

| IDs finales | **AP-13**, **AP-14** |
|-------------|----------------------|
| **Justificación** | Anti-patrones detectados en INV B-L (stacking P0) y ORG (acciones fila RA-ORG-01/02). |
| **Dependencias** | B11-10, RB-ROW-02 definidos en mismo release. |
| **Riesgos** | Bajo. Código ORG+INV post-fix ya conforme. |
| **Compatibilidad** | Aditivo. AP-01…11 sin cambio. |

---

### INS-V2-02 — Acciones de fila §5.10 (sección nueva)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | **Después** de §5.9 Referencias canónicas Plantilla A, **antes** del `---` que precede `## §6` |
| **Ancla antes** | Última fila tabla §5.9: `\| INV \| \`ProductosPage\` \| A+ \|` |
| **Ancla después** | `---` + `## §6 — Plantilla B` |

**Texto exacto a agregar:**

```markdown
### §5.10 Acciones de fila — catálogo (Plantilla A, A+, T, H)

> Complementa **UX-04** (formularios) y **RB-01** (permisos). Referencia: INV `AlmacenesPage`; ORG `DepartamentosPage`.

| ID | Regla |
|----|-------|
| **RB-ROW-01** | MUST en listados con baja lógica: si `row.es_activo === true` → Editar + Desactivar (con permiso); si `false` → Reactivar **únicamente** (con permiso) |
| **RB-ROW-02** | MUST rama única `row.es_activo ? accionesActivas : accionesInactivas` — MUST NOT bloques aditivos que muestren Editar/Desactivar/Reactivar sin discriminar estado |
| **RB-ROW-03** | MUST guards de dominio adicionales (ej. `rowCanMutate` en hybrid) **dentro** de cada rama; no sustituyen RB-ROW-01 |

**Convención permiso Reactivar:** MAY usar permiso `editar` — ver implementación ORG/INV §9.2, §9.3.
```

| IDs finales | **RB-ROW-01**, **RB-ROW-02**, **RB-ROW-03** |
|-------------|---------------------------------------------|
| **Justificación** | Cierra gap RA-ORG-01/02; explicita patrón INV ya referencia en §9. |
| **Dependencias** | UX-04, UX-07, RB-01, PA-08, TB-05, B11-03. |
| **Riesgos** | Medio-bajo: flujo «Reactivar → Editar» vs edición directa en inactivo. |
| **Compatibilidad** | Código ORG+INV alineado post-RA; módulos legacy pueden requerir ajuste mecánico. |

---

### INS-V2-03 — Lista transaccional B-L §6.3

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Tabla §6.3 — **nuevas filas después de PB-08**, antes de línea `Referencia: INV` |
| **Ancla antes** | `\| **PB-08** \| MUST \`ConfirmDialog\` workflow (aprobar/anular) sin mezclar B.1.1 form dirty \|` |
| **Ancla después** | `Referencia: INV \`MovimientosPage\`, \`InventarioFisicoPage\`.` |

**Texto exacto a agregar:**

```markdown
| **PB-13** | MUST al abrir `ConfirmDialog` workflow desde modal detalle B-L: cerrar detalle (`setDetailOpen(false)` o equivalente) **antes** de `isOpen={true}` |
| **PB-14** | SHOULD defensa en profundidad: `open={detailOpen && !workflowConfirmOpen}` y `onOpenChange` que no cierre detalle mientras confirm workflow abierto |
```

**Texto exacto a agregar (línea referencia — reemplazo de una línea, no del párrafo completo):**

```markdown
Referencia: INV `MovimientosPage`, `InventarioFisicoPage`. Caso de estudio stacking: `INV_MODAL_STACKING_AUDIT.md`.
```

| IDs finales | **PB-13**, **PB-14** |
|-------------|----------------------|
| **Justificación** | Formaliza fix P0 INV; **no** reutiliza PB-09…11 (ocupados por B-R §6.4). |
| **Dependencias** | B11-10, SEC-08, SEC-09, PB-08. |
| **Riesgos** | Bajo en INV (implementado). Medio en futuros B-L si omiten PB-14. |
| **Compatibilidad** | PB-04…12 sin cambio. Gate 3 B-R sigue citando PB-09…12. |

---

### INS-V2-04 — Comportamiento B.1.1 §7.1 (tabla Comportamiento)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Tabla «Comportamiento» §7.1 — **después de B11-06**, antes de `#### Flujo post-save` |
| **Ancla antes** | `\| **B11-06** \| MUST \`onInteractOutside\` / \`onEscapeKeyDown\` → \`preventDefault\` si dirty \|` |
| **Ancla después** | `#### Flujo post-save` |

**Texto exacto a agregar:**

```markdown
| **B11-10** | MUST NOT tener `Dialog` Radix con `open={true}` y `ConfirmDialog` con `isOpen={true}` simultáneamente |
| **B11-11** | MUST cerrar `Dialog` Radix antes de abrir cualquier `ConfirmDialog` (discard, baja, reactivar, workflow) |
```

| IDs finales | **B11-10**, **B11-11** |
|-------------|------------------------|
| **Justificación** | Norma explícita del patrón ya implementado en `createOrgDiscardHandlers` e INV B-L. |
| **Dependencias** | AP-13, B11-02, PB-13, MD-04. |
| **Riesgos** | Bajo — código referencia conforme. |
| **Compatibilidad** | B11-01…09 intactos. |

---

### INS-V2-05 — Clasificación modal §7.1.1 (subsección nueva)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | **Después** de tabla Dirty A+ (B11-08…09), **antes** de `#### Piezas técnicas` |
| **Ancla antes** | `\| **B11-09** \| MUST dirty compare solo campos UI del modal \|` |
| **Ancla después** | `#### Piezas técnicas` |

**Texto exacto a agregar:**

```markdown
#### §7.1.1 Clasificación de superficies modal (Tipo A / B / C)

| ID | Regla |
|----|-------|
| **MD-01** | MUST clasificar cada superficie modal en **Tipo A** (solo lectura), **Tipo B** (formulario editable CRUD) o **Tipo C** (`ConfirmDialog` negocio/discard) antes de implementar |
| **MD-02** | MUST Tipo B: `orgDialogGuardProps` + B.1.1 completo (B11-01…09) |
| **MD-03** | MUST Tipo A (detalle lectura B-L): Radix default (ESC y click fuera permitidos); MUST NOT `orgDialogGuardProps` — ver SEC-08 |
| **MD-04** | MUST Tipo C: `ConfirmDialog` a nivel página; cierre solo Cancelar/X; MUST cumplir B11-10 al abrir desde un `Dialog` Radix |
```

| IDs finales | **MD-01**, **MD-02**, **MD-03**, **MD-04** |
|-------------|---------------------------------------------|
| **Justificación** | Marco tipológico del audit modal; evita aplicar B.1.1 en detalle B-L. |
| **Dependencias** | SEC-08, B11-10, PB-13. |
| **Riesgos** | Bajo — documenta práctica INV B-L actual. |
| **Compatibilidad** | No altera SEC-08/09. |

---

### INS-V2-06 — Piezas técnicas §7.1 (una línea)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Párrafo `#### Piezas técnicas` — **añadir al final del párrafo** (misma línea o línea nueva) |
| **Ancla antes** | `scheduleModalStackValidation` → **§10**. |
| **Ancla después** | `#### QA mínimo modal` |

**Texto exacto a agregar:**

```markdown
Patrón página B-L (no componente §10): derivar `workflowConfirmOpen` de flags locales y `detailDialogOpen = detailOpen && !workflowConfirmOpen` — ver PB-13, PB-14.
```

| IDs finales | Pointer a **PB-13**, **PB-14** |
|-------------|----------------------------------|
| **Justificación** | Documentar patrón sin añadir fila a §10 ni tocar `ConfirmDialog`. |
| **Dependencias** | INS-V2-03, INS-V2-05. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | §10 sin cambios obligatorios. |

---

### INS-V2-07 — ConfirmDialog semántica §8.8 (sección nueva)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | **Después** de §8.7 Paginación, **antes** de `---` + `## §9` |
| **Ancla antes** | Párrafo final §8.7: `PR-01 no es MUST global.` |
| **Ancla después** | `---` + `## §9 — Módulos de referencia cerrados` |

**Texto exacto a agregar:**

```markdown
### §8.8 ConfirmDialog — semántica `variant`

> Complementa **UX-01** (vocabulario) y **§8.4**. No modifica la primitiva `ConfirmDialog` — solo uso normativo.

| Acción / contexto | `variant` | ID |
|-------------------|-----------|-----|
| Aprobar, Autorizar, Procesar, Finalizar | `warning` | **UX-05** |
| Desactivar, Anular irreversible | `danger` | **UX-06** |
| Reactivar (confirm antes de mutar) | `info` | **UX-07** |
| Descarte B.1.1 dirty (`OrgDiscardConfirmDialog`) | `warning` + textos B11-04 | **UX-08** |

| ID | Regla |
|----|-------|
| **UX-05** | MUST NOT `variant="danger"` en Aprobar, Autorizar, Procesar, Finalizar; MUST `variant="warning"` |
| **UX-06** | MUST `variant="danger"` en Desactivar y Anular irreversible |
| **UX-07** | MUST `variant="info"` y confirmación obligatoria antes de mutar en Reactivar; MUST `isOpen` con guard `discardPending === null` (B11-02) |
| **UX-08** | MUST `variant="warning"` en descarte dirty; MUST textos B11-04 |

**Nota:** UX-05 y UX-08 comparten `warning` — distinguir por contexto (workflow vs discard) y copy, no solo por color.
```

| IDs finales | **UX-05**, **UX-06**, **UX-07**, **UX-08** |
|-------------|---------------------------------------------|
| **Justificación** | Formaliza P1 ORG+INV; hogar separado de vocabulario §8.4. |
| **Dependencias** | UX-01, B11-02, B11-04, PA-07, PB-08. |
| **Riesgos** | Bajo — código referencia conforme post-P1. |
| **Compatibilidad** | UX-01…04 sin cambio. |

---

### INS-V2-08 — Pointer UX-04 → RB-ROW

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Fila **UX-04** tabla §8.6 — **ampliar texto de regla**, sin cambiar ID |
| **Ancla** | `\| **UX-04** \| MUST NOT \`es_activo\` en edit modal; usar Desactivar/Reactivar en tabla \|` |

**Texto exacto resultante (sustitución solo de celda Regla):**

```markdown
| **UX-04** | MUST NOT `es_activo` en edit modal; ciclo de vida vía tabla — ver **RB-ROW-01** (§5.10) |
```

| IDs finales | **UX-04** (texto extendido, mismo ID) |
|-------------|----------------------------------------|
| **Justificación** | Enlace explícito formulario ↔ acciones fila sin nueva regla. |
| **Dependencias** | INS-V2-02. |
| **Riesgos** | Ninguno — pointer, no nueva obligación. |
| **Compatibilidad** | UX-04 semántica preservada. |

> **Nota:** Única «modificación» a regla existente: añadir referencia cruzada. No cambia nivel MUST ni alcance. Si se prefiere cero edición de filas existentes, omitir INS-V2-08 y confiar solo en §5.10.

---

### INS-V2-09 — Referencias ORG §9.2

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Tabla aspectos §9.2 — **nueva fila al final de la tabla** |
| **Ancla antes** | `\| Toolbar / empty \| E-UX.1 \| A \|` |
| **Ancla después** | `**ORG-REF-01:**` |

**Texto exacto a agregar:**

```markdown
| Acciones fila `es_activo` | Patrón ternario RB-ROW | A, T, H — `DepartamentosPage`, `ParametrosPage` |
```

| IDs finales | Pointer **RB-ROW-01…03** |
|-------------|---------------------------|
| **Justificación** | Referencia canónica sin reabrir ORG-REF-01. |
| **Dependencias** | INS-V2-02. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Aditivo. |

---

### INS-V2-10 — Referencias INV §9.3

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Tabla plantillas §9.3 — **dos filas nuevas al final** |
| **Ancla antes** | `\| B.1.1 catálogo \| Patrón ORG E-SEC reutilizado (M3) \|` |
| **Ancla después** | `**INV-REF-01:**` |

**Texto exacto a agregar:**

```markdown
| Acciones fila catálogo | `AlmacenesPage`, `TiposMovimientoPage` — RB-ROW | A |
| B-L stacking workflow | `MovimientosPage`, `InventarioFisicoPage` — PB-13, PB-14 | B-L |
```

| IDs finales | **RB-ROW-***, **PB-13**, **PB-14** |
|-------------|-------------------------------------|
| **Justificación** | Punteros copy-paste para PUR/SLS. |
| **Dependencias** | INS-V2-02, INS-V2-03. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | INV-REF-01 intacto. |

---

### INS-V2-11 — Gates §11.3

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Lista §11.3 — **ítems nuevos al final**, antes de `### §11.4` |
| **Ancla antes** | `- [ ] Catálogos clasificados **A+** (§2.1): verificar además **PA+-01** … **PA+-03** (§5.8)` |
| **Ancla después** | `### §11.4 Gate 3` |

**Texto exacto a agregar:**

```markdown
- [ ] **RB-ROW-01** … **RB-ROW-03** (§5.10); confirms baja/reactivar **UX-06**, **UX-07**
- [ ] **B11-10**, **B11-11** en modales CRUD con confirms (§7.1)
```

| IDs finales | Gate 2 checklist |
|-------------|------------------|
| **Justificación** | Verificabilidad en cierre M1. |
| **Dependencias** | INS-V2-02, INS-V2-04, INS-V2-07. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Ítems Gate 2 existentes preservados. |

---

### INS-V2-12 — Gates §11.4

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Bajo ítem `- [ ] **B-L:**` — **añadir sub-ítems** (no reemplazar línea PB-04…08) |
| **Ancla antes** | `- [ ] **B-L:** **PB-04** … **PB-08**` |
| **Ancla después** | `- [ ] **B-F:**` |

**Texto exacto a agregar (inmediatamente después de la línea B-L existente):**

```markdown
- [ ] **B-L:** **PB-13**, **PB-14**; QA stacking (`INV_MODAL_STACKING_AUDIT.md`)
- [ ] **B-L:** confirms workflow **UX-05** (acciones positivas) y **UX-06** (anular)
```

| IDs finales | Gate 3 B-L |
|-------------|------------|
| **Justificación** | Gate 3 por ruta — solo aplica a B-L. |
| **Dependencias** | INS-V2-03, INS-V2-07. |
| **Riesgos** | Ninguno. PB-09…12 en B-R sin cambio. |
| **Compatibilidad** | Línea PB-04…08 conservada. |

---

### INS-V2-13 — Gates §11.5

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Lista §11.5 — **ítem nuevo** después de UX-01…04 |
| **Ancla antes** | `- [ ] **RB-01**, **ER-02**, **API-04**, **UX-01** … **UX-04**` |
| **Ancla después** | `- [ ] **PR-01**` |

**Texto exacto a agregar:**

```markdown
- [ ] **UX-05** … **UX-08** si la ruta usa `ConfirmDialog` (§8.8)
```

| IDs finales | Gate 4 |
|-------------|--------|
| **Justificación** | Calidad transversal variants. |
| **Dependencias** | INS-V2-07. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Gate 4 existente intacto. |

---

### INS-V2-14 — Control de versión §13

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Tabla §13 — **nueva fila después de 2.0** |
| **Ancla antes** | `\| **2.0** \| **2026-05-31** \| Post-cierre IAM/ORG/INV; ...` |
| **Ancla después** | `### §13.1 Relación documentos derivados` |

**Texto exacto a agregar:**

```markdown
| **2.1** | **[FECHA_MERGE]** | Modales stacking (B11-10/11, PB-13/14, MD-01…04); acciones fila RB-ROW; semántica ConfirmDialog UX-05…08; AP-13/14 |
```

| IDs finales | Changelog |
|-------------|-----------|
| **Justificación** | Trazabilidad revisión. |
| **Dependencias** | Todas las INS-V2-*. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Historial 1.0/2.0 preservado. |

---

### INS-V2-15 — Índice referencias cruzadas

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Bloque código índice — **líneas nuevas al final del bloque**, antes de cierre ``` |
| **Ancla antes** | `Anexo A ←→ §12 GAP resueltos` |
| **Ancla después** | Cierre del bloque ``` |

**Texto exacto a agregar:**

```
§5.10 RB-ROW ←→ §8.6 UX-04, §11.3 Gate 2
§6.3 PB-13/14 ←→ §7.1 B11-10/11, §11.4 Gate 3 B-L
§7.1.1 MD-xx ←→ §7.3 SEC-08, PB-13
§8.8 UX-05…08 ←→ §8.4 UX-01, §7.1 B11-04
```

| IDs finales | Índice |
|-------------|--------|
| **Justificación** | Mantenimiento *write once* / navegación. |
| **Dependencias** | Todas las secciones nuevas. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Índice existente preservado. |

---

### INS-V2-16 — Matriz anti-redundancia

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Tabla final — **filas nuevas al final** |
| **Ancla antes** | `\| Diseño 2 capas \| \`.cursorrules\` \| No en V2 \|` |
| **Ancla después** | `---` final del documento |

**Texto exacto a agregar:**

```markdown
| Acciones fila catálogo | §5.10 RB-ROW | §8.6 UX-04 pointer |
| Stacking modal | §7.1 B11-10/11, §6.3 PB-13/14 | §3.2 AP-13 |
| Semántica ConfirmDialog | §8.8 UX-05…08 | §8.4 vocabulario |
| Clasificación modal A/B/C | §7.1.1 MD-01…04 | §7.3 SEC-08 |
```

| IDs finales | Matriz |
|-------------|--------|
| **Justificación** | Evitar duplicación futura en §5/§8. |
| **Dependencias** | Todas las INS-V2-*. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Filas existentes intactas. |

---

## 3. `.cursorrules`

> Principio V2: **pointers + IDs**, sin tablas normativas completas. **No tocar** diseño 2 capas ni reglas multiempresa/API.

### INS-CR-01 — Plantilla A

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Sección `## ERP — PLANTILLA A / LISTADOS` — **nueva viñeta antes** del `---` de cierre de sección |
| **Ancla antes** | `- Referencias canónicas: INV catálogos (M3), ORG E-SEC — V2 §9.2, §9.3` |
| **Ancla después** | `---` antes de `## ERP — PLANTILLA B` |

**Texto exacto a agregar:**

```markdown
- Acciones fila catálogo: `row.es_activo === true` → Editar + Desactivar; `false` → Reactivar solo — ternario obligatorio (V2 §5.10 RB-ROW-01…03)
```

| IDs finales | **RB-ROW-01…03** (pointer) |
|-------------|------------------------------|
| **Justificación** | Recordatorio diario sin duplicar §5.10. |
| **Dependencias** | INS-V2-02. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Viñetas existentes intactas. |

---

### INS-CR-02 — Plantilla B

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Sección `## ERP — PLANTILLA B / TRANSACCIONAL` — **nueva viñeta antes** del `---` |
| **Ancla antes** | `- Layout secciones: \`bg-surface border border-border-base rounded-lg shadow-sm\` — CD-08, CD-09` |
| **Ancla después** | `---` antes de `## ERP — CHECKLIST MÓDULO` |

**Texto exacto a agregar:**

```markdown
- B-L workflow: cerrar Dialog detalle antes de ConfirmDialog; nunca Radix `open` + Confirm `isOpen` a la vez (V2 B11-10, PB-13, PB-14)
```

| IDs finales | **B11-10**, **PB-13**, **PB-14** |
|-------------|-------------------------------------|
| **Justificación** | Previene regresión stacking. |
| **Dependencias** | INS-V2-03, INS-V2-04. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Aditivo. |

---

### INS-CR-03 — Feedback (precisión variant)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Subsección `### Feedback` — **reemplazar una viñeta**, misma posición |
| **Ancla** | `- ConfirmDialog antes de desactivar, anular, aprobar (V2 §8.4)` |

**Texto exacto resultante:**

```markdown
- ConfirmDialog: `danger` = desactivar/anular; `info` = reactivar; `warning` = discard dirty y workflow positivo (aprobar/autorizar/procesar/finalizar) — V2 §8.8 UX-05…08
```

| IDs finales | **UX-05…08** |
|-------------|--------------|
| **Justificación** | Elimina ambigüedad «aprobar» sin variant. |
| **Dependencias** | INS-V2-07. |
| **Riesgos** | Bajo — clarifica, no contradice UX-01. |
| **Compatibilidad** | Sustituye una línea por precisión; no elimina otras reglas Feedback. |

---

### INS-CR-04 — Modales (stacking pointer)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Subsección `### Modales` — **nueva viñeta después** de B11-02 |
| **Ancla antes** | `- \`ConfirmDialog\` baja/reactivar **independiente** de discard dirty — B11-02` |
| **Ancla después** | `### Transformación visual inputs` |

**Texto exacto a agregar:**

```markdown
- Cerrar Radix Dialog antes de abrir ConfirmDialog — B11-10, B11-11; ver AP-13
```

| IDs finales | **B11-10**, **B11-11**, **AP-13** |
|-------------|-------------------------------------|
| **Justificación** | Refuerzo operativo CRUD + B-L. |
| **Dependencias** | INS-V2-04. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Aditivo. |

---

### INS-CR-05 — Evaluación código existente

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Lista numerada — **ítems 7 y 8 al final**, antes de `Clasificación:` |
| **Ancla antes** | `6. ¿Selector local de empresa o "Todas las empresas" en toolbar? → Desalineado (V2 ME-02)` |
| **Ancla después** | `Clasificación:` |

**Texto exacto a agregar:**

```markdown
7. ¿Radix Dialog abierto con ConfirmDialog abierto? → Desalineado (V2 AP-13, B11-10)
8. ¿Catálogo con Editar/Desactivar en filas inactivas o Reactivar en activas? → Desalineado (V2 RB-ROW-01)
```

| IDs finales | **AP-13**, **B11-10**, **RB-ROW-01** |
|-------------|--------------------------------------|
| **Justificación** | Detección en code review sin leer V2 completo. |
| **Dependencias** | INS-V2-01, INS-V2-02. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Ítems 1–6 intactos. |

---

## 4. `docs/prompts/PROMPT_FRONTEND_MAESTRO.md`

### INS-PR-01 — Reglas absolutas

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Bloque `❌ NO` — **tres líneas nuevas antes** de la línea `✅ ConfirmDialog` |
| **Ancla antes** | `❌ NO \`empresaFilter\` local — empresa operativa = sesión JWT \`scopeEmpresaId\` (V2 ME-01)` |
| **Ancla después** | `✅ ConfirmDialog del proyecto para confirmaciones` |

**Texto exacto a agregar:**

```markdown
❌ NO Radix Dialog `open` + ConfirmDialog `isOpen` simultáneos (V2 B11-10, AP-13)
❌ NO acciones fila catálogo sin rama `row.es_activo` (V2 RB-ROW-02)
❌ NO `variant="danger"` en Aprobar/Autorizar/Procesar/Finalizar (V2 UX-05)
```

| IDs finales | **B11-10**, **AP-13**, **RB-ROW-02**, **UX-05** |
|-------------|--------------------------------------------------|
| **Justificación** | Detección temprana Fase 0–2. |
| **Dependencias** | INS-V2-*. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Reglas ❌ existentes intactas. |

---

### INS-PR-02 — Reglas absolutas (affirmativas)

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Bloque `✅` — **dos líneas nuevas después** de `✅ Modales CRUD A: B.1.1 dirty` |
| **Ancla antes** | `✅ Modales CRUD A: B.1.1 dirty (V2 §7.1)` |
| **Ancla después** | `✅ Gates obligatorios al cerrar sprint: V2 §11` |

**Texto exacto a agregar:**

```markdown
✅ Catálogo A: matriz acciones fila RB-ROW (V2 §5.10)
✅ ConfirmDialog `variant` según V2 §8.8 (UX-05…08)
```

| IDs finales | **RB-ROW-***, **UX-05…08** |
|-------------|----------------------------|
| **Justificación** | Pointers implementación Fase 2. |
| **Dependencias** | INS-V2-02, INS-V2-07. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Aditivo. |

---

### INS-PR-03 — Plantilla A Fase 2

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | `### Plantilla A / A+ (V2 §5)` — **sub-bloque nuevo al final**, antes de `### Plantilla B-F` |
| **Ancla antes** | `- **Gate 2:** checklist V2 §11.3; QA modal: \`INV_M3_B11_CATALOGS_AUDIT.md\`` |
| **Ancla después** | `### Plantilla B-F (V2 §6.5, §7.2)` |

**Texto exacto a agregar:**

```markdown
**Acciones de fila (RB-ROW):**
- Rama `row.es_activo ? (Editar + Desactivar) : (Reactivar)` con RBAC (RB-01)
- Hybrid: guards dominio dentro de cada rama (RB-ROW-03)
- Reactivar: `ConfirmDialog` `variant="info"` antes de mutar (UX-07)
- Desactivar: `variant="danger"` (UX-06); independiente de `discardPending` (B11-02)
```

| IDs finales | **RB-ROW-01…03**, **UX-06**, **UX-07**, **B11-02** |
|-------------|-----------------------------------------------------|
| **Justificación** | Checklist implementación M1. |
| **Dependencias** | INS-V2-02, INS-V2-07. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Bullets Plantilla A existentes intactos. |

---

### INS-PR-04 — Plantilla B-L Fase 2

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | `### Plantilla B-L (V2 §6.3)` — **sub-bloque nuevo al final** |
| **Ancla antes** | `- **Gate 3 B-L:** PB-04…PB-08` |
| **Ancla después** | `### Plantilla B-R (V2 §6.4)` |

**Texto exacto a agregar:**

```markdown
**Stacking modal (B-L):**
- Clasificar detalle como Tipo A, confirms como Tipo C (MD-01…04)
- Al pulsar workflow en detalle: `setDetailOpen(false)` antes del confirm (PB-13)
- Defensa: `workflowConfirmOpen` + `detailDialogOpen = detailOpen && !workflowConfirmOpen` (PB-14)
- Workflow positivo: `variant="warning"` (UX-05); Anular: `variant="danger"` (UX-06)
- Referencia: `INV_MODAL_STACKING_AUDIT.md`, INV `MovimientosPage`
```

| IDs finales | **MD-01…04**, **PB-13**, **PB-14**, **UX-05**, **UX-06** |
|-------------|-----------------------------------------------------------|
| **Justificación** | Previene P0 en nuevos módulos B-L. |
| **Dependencias** | INS-V2-03, INS-V2-05, INS-V2-07. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | PB-04…08 citados sin cambio. |

---

### INS-PR-05 — Normas transversales

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | `### Normas transversales` — **ampliar primer bullet** |
| **Ancla** | `- Vocabulario, FK, \`es_activo\`: **V2 §8.2–§8.4**` |

**Texto exacto resultante:**

```markdown
- Vocabulario, FK, `es_activo`, acciones fila, ConfirmDialog `variant`: **V2 §5.10, §8.2–§8.4, §8.8**
```

| IDs finales | Pointers §5.10, §8.8 |
|-------------|----------------------|
| **Justificación** | Un solo pointer actualizado. |
| **Dependencias** | INS-V2-02, INS-V2-07. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Bullets RBAC y diseño intactos. |

---

### INS-PR-06 — Fase 3 verificación

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | Lista numerada Fase 3 — **ítems 11 y 12 al final** |
| **Ancla antes** | `10. Generar: \`docs/frontend/modulos/[CODIGO]_FRONTEND_IMPLEMENTACION.md\`` |
| **Ancla después** | `---` antes de `# FASE 3.5` |

**Texto exacto a agregar:**

```markdown
11. Plantilla A: matriz acciones fila activo/inactivo conforme RB-ROW-01
12. B-L: 0 instancias Radix `open` + ConfirmDialog `isOpen` simultáneos (B11-10)
```

| IDs finales | **RB-ROW-01**, **B11-10** |
|-------------|---------------------------|
| **Justificación** | Sign-off verificable. |
| **Dependencias** | INS-V2-02, INS-V2-04. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Ítems 1–10 intactos. |

---

### INS-PR-07 — Fase 3.5 Gate 2

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | `### M1 — Catálogos Plantilla A` — **viñeta nueva al final** |
| **Ancla antes** | `- [ ] QA B.1.1 modal (matriz INV_M3)` |
| **Ancla después** | `### M2 — Transaccional` |

**Texto exacto a agregar:**

```markdown
- [ ] RB-ROW-01…03; confirms reactivar UX-07 y desactivar UX-06
```

| IDs finales | Gate 2 M1 |
|-------------|-----------|
| **Justificación** | Alineado con §11.3 V2. |
| **Dependencias** | INS-V2-11. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Aditivo. |

---

### INS-PR-08 — Fase 3.5 Gate 3 B-L

| Campo | Valor |
|-------|-------|
| **Ubicación exacta** | `### M2 — Transaccional` — **viñeta nueva** después de línea Gate 3 |
| **Ancla antes** | `- [ ] §11.4 Gate 3 — **solo ítems de la plantilla de esa ruta**` |
| **Ancla después** | `- [ ] B-F: QA INV_M2_SEC matriz` |

**Texto exacto a agregar:**

```markdown
- [ ] B-L: PB-13, PB-14, UX-05/06 — ref. `INV_MODAL_STACKING_AUDIT.md`
```

| IDs finales | Gate 3 B-L |
|-------------|------------|
| **Justificación** | Checklist M2 transaccional. |
| **Dependencias** | INS-V2-12. |
| **Riesgos** | Ninguno. |
| **Compatibilidad** | Gate 3 por ruta preservado. |

---

## 5. Orden de aplicación recomendado (post-aprobación)

```
1. ERP_FRONTEND_STANDARDS_V2.md
   INS-V2-01 → 02 → 03 → 04 → 05 → 06 → 07 → [08 opcional] → 09 → 10
   → 11 → 12 → 13 → 14 → 15 → 16 → 00 (metadatos al inicio o al cierre)
2. .cursorrules — INS-CR-01 → 05
3. PROMPT_FRONTEND_MAESTRO.md — INS-PR-01 → 08
4. Banner en ERP_V2_STANDARDS_PROPOSAL.md: «Incorporado en V2.1» (documento derivado, no normativo)
```

**Una sola PR documentación.** Sin cambios de código. Sin tocar `ConfirmDialog.tsx`.

---

## 6. Criterios de aceptación del plan

| # | Criterio | Estado |
|---|----------|--------|
| AC-1 | Cero IDs existentes renumerados | ✅ |
| AC-2 | Cero reglas existentes eliminadas | ✅ |
| AC-3 | Cero capítulos reescritos | ✅ |
| AC-4 | PB-09…12 B-R sin conflicto (uso PB-13/14) | ✅ |
| AC-5 | Precedencia OpenAPI > V2 > .cursorrules > PROMPT sin cambio | ✅ |
| AC-6 | §4 ME, §8.1 API, §9.1 IAM, diseño 2 capas sin tocar | ✅ |
| AC-7 | Validación no-contradicción documentada §1.1 | ✅ |
| AC-8 | Texto exacto listo para copy-paste | ✅ |

---

## 7. Decisión pendiente de aprobación

| Tema | Opciones | Recomendación |
|------|----------|---------------|
| INS-V2-08 (editar celda UX-04) | Aplicar pointer / Omitir | **Aplicar** — enlace UX-04 ↔ RB-ROW sin nueva obligación |
| PB-14 nivel | SHOULD / MUST | **SHOULD** en V2; MUST en PROMPT para B-L nuevos |
| INS-V2-00 metadatos | Al inicio o al final del merge | **Al final** del merge para evitar conflicto si se aborta |

---

## 8. Referencias

| Documento | Uso en este plan |
|-----------|------------------|
| `ERP_V2_DOCUMENTATION_AUDIT.md` | Análisis previo aprobado |
| `ERP_V2_STANDARDS_PROPOSAL.md` | Texto origen MD-* (IDs ajustados PB-13/14) |
| `ERP_ORG_ROW_ACTIONS_ALIGNMENT_REPORT.md` | Evidencia RB-ROW implementado |
| `ERP_MODAL_STANDARDIZATION_P1_REPORT.md` | Evidencia UX-05…07 |
| `INV_MODAL_STACKING_AUDIT.md` | Evidencia PB-13/14 |

---

*Plan de inserción V2.1 — solo propuesta. Ningún archivo normativo modificado.*
