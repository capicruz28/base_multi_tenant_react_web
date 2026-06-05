# Auditoría de preservación UX/UI — Baseline vs stack V2

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — **sin modificar archivos**  
**Baseline (v1 operativo):** [`reglas.md`](./reglas.md) · [`docs/prompts/FRONTEND_MAESTRO_ANT.md`](./docs/prompts/FRONTEND_MAESTRO_ANT.md)  
**Stack vigente:** [`ERP_FRONTEND_STANDARDS_V2.md`](./ERP_FRONTEND_STANDARDS_V2.md) · [`.cursorrules`](./.cursorrules) · [`docs/prompts/PROMPT_FRONTEND_MAESTRO.md`](./docs/prompts/PROMPT_FRONTEND_MAESTRO.md)

**Nota:** `reglas.md` es copia histórica del `.cursorrules` pre-V2 (304 líneas, idéntico en UX/diseño).

---

## 1. Veredicto ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se perdió UX/UI crítico? | **No** — lo normativo está en V2; operativo en `.cursorrules` |
| ¿Hay reglas degradadas? | **Sí — 12 ítems** (detalle operativo/cosmético, no MUST) |
| ¿Hay reglas perdidas? | **Sí — 5 ítems** (checklist pre-entrega, antipatrón brand-surface, etc.) |
| ¿Riesgo real PUR/SLS/FIN/LOG? | **Bajo** si se usa V2 + PROMPT Fase 0.4/0.5; **Medio** si agente solo lee `.cursorrules` sin abrir V2 |

**Conclusión:** La migración V2 **mejora** multiempresa, componentes nombrados y B.1.1 normativo. La **pérdida net** es detalle procedimental/cosmético del PROMPT antiguo, no reglas de cierre IAM/ORG/INV.

---

## 2. Metodología

| Clasificación | Criterio |
|---------------|----------|
| **Preservada** | Regla equivalente o más estricta en algún doc del stack V2 |
| **Resumida correctamente** | Pointer suficiente; detalle canónico en V2 o `.cursorrules` |
| **Degradada** | Existe parcialmente; agente puede omitir matices sin leer V2 |
| **Perdida** | No aparece en V2, `.cursorrules` v2 ni PROMPT v3 |

**Fuentes baseline:**

| Baseline | Rol histórico |
|----------|---------------|
| `reglas.md` | Recordatorio diario + diseño 2 capas |
| `FRONTEND_MAESTRO_ANT.md` | Procedimiento + diseño 2 capas duplicado + layout/vocabulario extenso |

---

## 3. Matriz por área de atención

### 3.1 Diseño 2 capas (tokens + brand)

| Regla baseline | ANT / reglas.md | Stack V2 | Clasificación |
|--------------|-----------------|----------|---------------|
| Dos capas separadas | ✅ ambos | V2 §0.2 → **solo `.cursorrules`** | **Preservada** |
| Tabla Capa 1 (bg-page, text-text-*, semánticos) | ✅ reglas L243–258 | `.cursorrules` v2 L270–285 | **Preservada** |
| Prohibido gray/slate/white estructura | ✅ ambos | `.cursorrules` v2 L287–289 | **Preservada** |
| Tabla Capa 2 brand-primary | ✅ ambos | `.cursorrules` v2 L294–301 | **Preservada** |
| Prohibido bg-blue-*, bg-primary | ✅ reglas | `.cursorrules` v2 L303–304 | **Preservada** |
| **Antipatrón bg-brand-surface, text-brand-text-*** | ✅ ANT L85–88 | ❌ no en V2 ni `.cursorrules` v2 | **Perdida** |
| Prohibido dark:bg-gray-*, dark:text-white | ✅ ANT L68 | ❌ no en `.cursorrules` v2 | **Perdida** |
| Regla decisión rápida brand vs token | ✅ reglas L279–282 | `.cursorrules` v2 L306–309 | **Preservada** |
| tema_personalizado JSON limitado | ✅ reglas L284–292 | `.cursorrules` v2 L311–319 | **Preservada** |
| Archivos fuente única branding | ✅ reglas L294–303 | `.cursorrules` v2 L321–330 | **Preservada** |
| Ejemplos TSX tabla/input/badge | ✅ ANT L90–145 | ❌ eliminados de PROMPT v3 | **Perdida** en PROMPT |
| Checklist pre-entrega componente (6 ítems) | ✅ ANT L147–156 | ❌ ningún doc V2 | **Perdida** |

**Veredicto área:** Núcleo **preservado** en `.cursorrules` v2. **Riesgo moderado:** antipatrón `bg-brand-surface` y checklist visual ya no están en el flujo del agente vía PROMPT.

---

### 3.2 Toolbars

| Regla baseline | Baseline | V2 / derivados | Clasificación |
|--------------|----------|----------------|---------------|
| Sin H1 en body | reglas L147–148 | V2 TB-01; `.cursorrules` L207 | **Preservada** |
| Body → toolbar primero | reglas L146 | V2 PA-02, TB | **Preservada** |
| Filtros izq / CTA der | ANT L401–404 | V2 TB-02 ASCII diagram §5.2 | **Preservada** (V2) |
| Compacta, gap coherente | ANT L404 | V2 TB-04 `gap-3` | **Preservada** (V2) |
| **Sin filtro empresa toolbar** | ❌ reglas L177 "empresa" | V2 ME-02; `.cursorrules` L220 | **Mejorada** (corrección) |
| Ver inactivos en catálogo A | ❌ no en reglas | V2 §5.2 diagrama + Plantilla A | **Añadida** (post-ORG) |
| `OrgCompanyToolbar` / `OrgToolbarSearch` | ❌ no en baseline | V2 §5, §10; PROMPT Bloque 4 | **Añadida** |
| disable toolbar si `discardPending` | ❌ no en baseline | V2 TB-05, B11-03 | **Añadida** |
| B-L/B-R toolbar distinta (sin Ver inactivos) | ❌ no en baseline | V2 PB-01…PB-03 | **Añadida** |

**Veredicto área:** **Preservada y ampliada** en V2. `.cursorrules` v2 resume; detalle toolbar A en V2 §5.2.

---

### 3.3 Empty states

| Regla baseline | Baseline | Stack V2 | Clasificación |
|--------------|----------|----------|---------------|
| Empty con icono + mensaje + CTA | reglas L169; ANT L503 | V2 ES-01 `IamTableEmptyState` | **Mejorada** |
| Variante búsqueda sin CTA crear | ❌ no en baseline | V2 ES-03, matriz §5.4.1 | **Añadida** |
| `hasSearch` | ❌ no en baseline | V2 SR-02, ES-03 | **Añadida** |
| colSpan = thead | ❌ no en baseline | V2 ES-02, SK-02 | **Añadida** |
| B-L empty inline MAY | ❌ no en baseline | V2 PB-06 (Anexo ES-B) | **Añadida** |

**Veredicto área:** Baseline genérico **superado** por V2 + componente IAM. **No hay pérdida.**

---

### 3.4 Skeletons

| Regla baseline | Baseline | Stack V2 | Clasificación |
|--------------|----------|----------|---------------|
| "skeleton o spinner" | reglas L167 | V2 SK-01 `InvTableSkeleton` MUST | **Mejorada** |
| No Loader ocultando tabla | ❌ no explícito | V2 SK-03, AP-09 | **Añadida** |
| TABLE_COLSPAN constante | ❌ no en baseline | V2 SK-02 | **Añadida** |

**Veredicto área:** **Mejorada**. Baseline permisivo reemplazado por norma estricta.

---

### 3.5 B.1.1 (discard dirty)

| Regla baseline | Baseline | Stack V2 | Clasificación |
|--------------|----------|----------|---------------|
| Cerrar ESC/outside excepto dirty | reglas L205 | V2 B11-01, B11-06 | **Preservada → ampliada** |
| Textos "Seguir editando" / "Sí, descartar" | ❌ no en baseline | V2 B11-04 | **Añadida** |
| ConfirmDialog baja separado | ❌ no en baseline | V2 B11-02, PA-07 | **Añadida** |
| Handlers + OrgDiscardConfirmDialog | ❌ no en baseline | V2 §7.1, §10 | **Añadida** |
| B-F `useInvTransactionalFormGuard` | ❌ no en baseline | V2 SEC-01…SEC-06 | **Añadida** |
| QA matriz 9 casos / INV_M3 | ❌ no en baseline | V2 §7.1; PROMPT Gate 2 | **Añadida** |
| `scheduleModalStackValidation` | ❌ no en baseline | V2 §10 | **Añadida** |

**Veredicto área:** Baseline tenía **1 línea**. V2 tiene capítulo completo §7. **No hay pérdida** — hay ganancia normativa. `.cursorrules` v2 = pointer; detalle solo V2 = **Resumida correctamente**.

---

### 3.6 Componentes IAM / ORG / INV

| Regla baseline | Baseline | Stack V2 | Clasificación |
|--------------|----------|----------|---------------|
| Referencia ORG Departamentos/Sucursales vocabulario | ANT L441–444 | V2 §9.2 + §9.3 + §9.5 | **Preservada y ampliada** |
| `IamSearchInput`, `IamTableEmptyState` | ❌ no nombrados | V2 §10; `.cursorrules`; PROMPT | **Añadida** |
| `InvTableSkeleton` | ❌ no nombrados | V2 SK-01, §10 | **Añadida** |
| `OrgSessionEmpresaField`, guards, scope hooks | ❌ no en baseline | V2 §4, §10 | **Añadida** |
| `createOrgDiscardHandlers`, `form-dirty/*` | ❌ no en baseline | V2 §7, §10 | **Añadida** |
| INV Plantilla B referencias | ❌ no en baseline | V2 §9.3, §2.3 | **Añadida** |
| IAM solo componentes tabla | ❌ parcial | V2 §9.1 IAM-REF-01 | **Preservada** |

**Veredicto área:** Stack V2 **supera** baseline ANT (solo ORG). **Sin pérdida.**

---

## 4. Inventario completo — reglas baseline vs stack V2

### 4.1 Preservadas (sin pérdida funcional)

| # | Regla | Hogar actual |
|---|-------|--------------|
| P-01 | Integridad API, deprecated, cabecera+detalle | `.cursorrules` + V2 §8 |
| P-02 | No UUID en UI | `.cursorrules` + V2 E-ME4 |
| P-03 | Toast error solo en hook | `.cursorrules` + V2 ER-02 |
| P-04 | Jerarquía errores API | `.cursorrules` (detalle) + V2 ER-01 |
| P-05 | RBAC no render / no disabled destructivas | `.cursorrules` + V2 RB-01/02 |
| P-06 | Sin H1 body; toolbar first | `.cursorrules` + V2 TB-01 |
| P-07 | Layout transaccional bg-surface secciones | `.cursorrules` + V2 CD-08/09 |
| P-08 | Diseño 2 capas tokens + brand tablas | `.cursorrules` v2 completo |
| P-09 | Vocabulario Desactivar/Reactivar | V2 §8.4; PROMPT pointer |
| P-10 | ConfirmDialog obligatorio | PROMPT v3 + V2 §8.4 |
| P-11 | es_activo no en create/edit modal | V2 UX-03/04; PROMPT pointer |
| P-12 | Acciones flujo en detalle no tabla | `.cursorrules` + V2 PB-04 |
| P-13 | uppercase/lowercase inputs visual | `.cursorrules` v2 L228–229 |
| P-14 | Paginación si API soporta | `.cursorrules` + V2 PR-xx |
| P-15 | Evaluación código ✅/🔴/🔁 | `.cursorrules` (+ ME-02 check) |

---

### 4.2 Resumidas correctamente (detalle en V2)

| # | Regla baseline | Resumen en derivados | Canónico |
|---|----------------|---------------------|----------|
| R-01 | Toolbar justify-between, CTA derecha | `.cursorrules` 2 líneas | V2 §5.2 TB-01…05 + ASCII |
| R-02 | B.1.1 modales 1 línea | `.cursorrules` pointer B11 | V2 §7.1 completo |
| R-03 | Empty/skeleton genérico | Nombres componentes | V2 §5.4, §5.5 |
| R-04 | Tabla vocabulario 6 filas (ANT) | PROMPT → V2 §8.4 | V2 §8.4 (sin textos modal completos) |
| R-05 | FK tabla ejemplos (ANT L477–487) | PROMPT → V2 §8.2 | V2 FK-01/02 (sin tabla ejemplos) |
| R-06 | Layout B-F detallado (ANT L419–435) | PROMPT pointer §6 | V2 §6.5, §6.6 |
| R-07 | Maestros/transaccional/analítico bloques | PROMPT Plantilla A/B | V2 §5, §6 |
| R-08 | Formularios modal grid 2 cols | `.cursorrules` 1 línea | V2 PA + convención |
| R-09 | Flujo estados badges colores | Implícito V2 §8.4 | Código productivo INV/ORG |

---

### 4.3 Degradadas (parcial — riesgo si no se lee V2)

| # | Regla baseline | Estado en stack V2 | Impacto |
|---|----------------|-------------------|---------|
| D-01 | Validación tiempo real bajo campo (reglas L183) | No en `.cursorrules` v2; no ID V2 | Bajo — convención proyecto |
| D-02 | Campos requeridos asterisco (reglas L184) | No explícito V2 | Bajo |
| D-03 | Modal footer Cancelar izq / Guardar der (ANT L417) | No en V2 | Bajo — patrón shadcn existente |
| D-04 | Foco atrapado en modal (reglas L204) | No en stack V2 | Bajo — Radix default |
| D-05 | B-F th `tracking-wider uppercase` (ANT L431) | V2 CD-09 parcial | Cosmético |
| D-06 | Badge estados documento colores (borrador=gris…) | V2 §8.4 genérico | Bajo — INV implementa |
| D-07 | Tabla vocabulario textos modal exactos (ANT L448–456) | V2 UX-01 sin plantillas string | Medio para copy nuevo |
| D-08 | Diseño 2 capas en PROMPT (115 líneas) | Solo `.cursorrules` | **Resumida OK** si agente lee cursorrules |
| D-09 | Paso 4.0 ejemplo "Empresa" en filtros | Corregido ME-02 en PROMPT v3 | **Mejorada** (ya no degradada) |
| D-10 | Transaccional: exportación analíticos (ANT L540) | No en V2 | Muy bajo |
| D-11 | Debounce búsqueda | V2 SR-03 SHOULD only | Bajo hasta M1 |
| D-12 | FormSection / DialogBody cosmética | Anexo A M3-R01 | Opcional |

---

### 4.4 Perdidas (no en stack V2)

| # | Regla | Estaba en | Riesgo PUR+ |
|---|-------|-----------|-------------|
| L-01 | Antipatrón **bg-brand-surface**, **text-brand-text-*** | ANT L85–88 | **Medio** — regresión visual conocida |
| L-02 | Prohibición **dark:bg-gray-***, **dark:text-white** | ANT L68 | Bajo |
| L-03 | **Checklist pre-entrega** 6 ítems (gray, brand-surface, badges…) | ANT L147–156 | **Medio** — QA visual agente |
| L-04 | **Ejemplos TSX** tabla/input/badge copy-paste | ANT L90–145 | Bajo — convención en código INV/ORG |
| L-05 | Referencia explícita solo **SucursalesPage/DepartamentosPage** como única plantilla ORG | ANT L441–444 | **Nulo** — V2 §9.5 amplía a INV |

---

## 5. Comparativa por documento

### 5.1 `reglas.md` → `.cursorrules` v2

| Aspecto | Cambio |
|---------|--------|
| UX genérico L143–210 | **Recortado** → pointers V2 + nombres componentes |
| Filtro empresa L177 | **Eliminado** → ME-02 |
| empresa_id L25 | **Corregido** → ME-01 |
| Diseño 2 capas L234–303 | **Preservado** casi ídéntico |
| Formularios detalle L182–188 | **Recortado** → degradación D-01/D-02 |
| Modales L201–205 | **Mejorado** → pointer B.1.1 |
| **Añadido** | Bloques ERP multiempresa, Plantilla A/B, Gates |

**Balance:** Ganancia normativa ERP >> pérdida detalle formulario genérico.

---

### 5.2 `FRONTEND_MAESTRO_ANT.md` → `PROMPT_FRONTEND_MAESTRO` v3

| Aspecto | Cambio |
|---------|--------|
| Diseño 2 capas L42–157 (~115 líneas) | **Eliminado** → `.cursorrules` |
| Layout Bloque 4 L390–435 | **Recortado** → V2 §5/§6 pointers |
| Vocabulario tabla L448–456 | **Recortado** → V2 §8.4 |
| FK tabla L477–487 | **Recortado** → V2 §8.2 |
| Filtros empresa L376, L542 | **Corregido** ME-02 |
| Empty/skeleton genérico | **Mejorado** → componentes nombrados |
| **Añadido** | Fase 0.4, 0.5, 3.5 Gates, multiempresa, INV refs |

**Balance:** −190 líneas duplicadas; + clasificación plantillas. Pérdidas L-01…L-03 eran **solo en PROMPT**, no en reglas.md.

---

### 5.3 Baseline → `ERP_FRONTEND_STANDARDS_V2`

| Baseline | V2 |
|----------|-----|
| Sin taxonomía plantillas | §2 A/A+/B-* completo |
| Sin B.1.1 normativo | §7 B11 + SEC |
| Sin componentes nombrados | §10 mapa |
| Sin multiempresa JWT | §4 ME + AUTH/IMP |
| Sin Gates | §11 |
| Diseño 2 capas en reglas/PROMPT | **Fuera V2** (decisión explícita §0.2) |

V2 **contiene** todo lo cerrado IAM/ORG/INV que baseline **no tenía**.

---

## 6. Riesgo para módulos futuros PUR · SLS · FIN · LOG

### 6.1 Matriz de riesgo

| Escenario agente | Riesgo UX | Mitigación |
|------------------|-----------|------------|
| Lee **V2 §5–§7 + §10** + PROMPT Fase 0.4/0.5 | **Bajo** | Flujo diseñado |
| Solo **`.cursorrules` + PROMPT`** sin V2 | **Medio** | B.1.1 incompleto; toolbar ASCII; matriz empty |
| Solo **`.cursorrules`** | **Medio-alto** | Sin procedimiento Fase 0.4 |
| Ignora ME-02 | **Alto** | Reintroduce empresaFilter (PUR legacy) |

### 6.2 Riesgos concretos por módulo

| Módulo | Riesgo | Origen | Severidad |
|--------|--------|--------|-----------|
| **PUR-M0** | Selector empresa local | Baseline permitía "empresa" en filtros | **P0 evitado** por ME-02 en stack V2 |
| **PUR-M1** | Empty inline sin IAM | Baseline genérico | **Evitado** por ES-01 en PROMPT v3 |
| **PUR-M1** | B.1.1 omitido en modales | Baseline 1 línea vaga | **Evitado** por Gate 2 + V2 §7 |
| **PUR-M2 B-F** | Sin transactional guard | No en baseline | **Evitado** por SEC-01 + INV ref |
| **Todos** | bg-brand-surface en UI nueva | L-01 perdida | **P2** cosmético |
| **Todos** | Copy modal Desactivar impreciso | D-07 degradada | **P3** |
| **B-R** | Empty inline OK | V2 PB-06 MAY | **Nulo** — alineado |

### 6.3 Veredicto módulos futuros

| Pregunta | Respuesta |
|----------|-----------|
| ¿PUR/SLS/FIN/LOG pierden estándar UX de IAM/ORG/INV? | **No** — V2 codifica cierres |
| ¿Baseline aportaba algo que V2 no tiene y era crítico? | **No** — baseline era pre-cierre y más débil en componentes/B.1.1 |
| ¿Hay riesgo real? | **Sí, acotado:** agente que no abra V2 §5–§7; regresión antipatrón brand-surface |
| ¿Acción obligatoria pre-PUR? | PROMPT Fase 0 + Gates; opcional restaurar L-01/L-03 en `.cursorrules` |

---

## 7. Recomendaciones opcionales (sin modificar en esta auditoría)

| Prioridad | Acción | Resuelve |
|-----------|--------|----------|
| P2 | Añadir 4 líneas antipatrón `bg-brand-surface` en `.cursorrules` | L-01 |
| P3 | Añadir checklist pre-entrega (6 ítems) en `.cursorrules` diseño 2 capas | L-03 |
| P3 | Añadir tabla FK ejemplos en V2 Anexo o PROMPT apéndice | R-05 |
| P4 | Plantillas string modal Desactivar en V2 §8.4 ampliado | D-07 |

**No bloquean PUR-M0.**

---

## 8. Resumen cuantitativo

| Clasificación | Cantidad |
|---------------|----------|
| **Preservada** | 15 |
| **Resumida correctamente** | 9 |
| **Degradada** | 12 |
| **Perdida** | 5 |
| **Mejorada / añadida** (vs baseline) | 20+ (multiempresa, IAM components, B.1.1, Gates, plantillas) |

---

## 9. Veredicto final

La migración documental V2 **no degradó** el estándar UX/UI operativo heredado de IAM/ORG/INV. Lo **formalizó** en V2 y **recortó duplicidad** en PROMPT.

Las únicas **pérdidas reales** son procedimentales/cosméticas del PROMPT antiguo (antipatrón brand-surface, checklist pre-entrega, ejemplos TSX), no reglas de producto cerradas en código.

**Riesgo global PUR/SLS/FIN/LOG: BAJO** con uso correcto de V2 + PROMPT v3 Fase 0.4/0.5/3.5.

---

*Auditoría preservación UX/UI. Sin modificar archivos. Sin código. Sin commit.*
