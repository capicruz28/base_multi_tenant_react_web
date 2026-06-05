# PAUX_PHASE_A_FILTERS_DECISION_AUDIT.md

**Tema:** Decisión filtros — P1-01 (Plan/Estado Clientes) y P1-02 (activo/inactivo)  
**Fecha:** 2026-06-03  
**Tipo:** Auditoría de decisión — **sin Backend, sin implementación de P1-01 / rediseño Clientes P1-02**

**Contexto:**

- Aprobados para implementar ya: **P1-03**, **P1-04**, **P1-05** (independientes de este documento).
- **P1-01** y **rediseño Clientes en P1-02** quedan **bloqueados** hasta cerrar decisiones aquí.
- Base: `PAUX_CONVERGENCE_PHASE_A_IMPLEMENTATION_PLAN.md`, `PLATFORM_UX_CONSISTENCY_FINAL_AUDIT.md`, `PLATFORM_CLIENTES_FUNCTIONAL_GAP_AUDIT.md`.

---

## 0. Resumen ejecutivo

| Tema | Veredicto recomendado |
|------|------------------------|
| **Filtro Plan (Clientes list)** | **Opción 1 — Ocultar** (controles heredados sin soporte) |
| **Filtro Estado suscripción (Clientes list)** | **Opción 1 — Ocultar** (idem + UI incompleta) |
| **Filtro Registro Todos \| Activos \| Inactivos** | **Sin cambios** — validado manualmente |
| **Catálogos «Ver inactivos»** | **Sin cambios** — referencia canónica |
| **Módulos «Solo activos»** | **Deferir** convergencia mínima — valor marginal vs riesgo de cambio de default |

**Conclusión:** Los selects Plan/Estado en listado Clientes **no son requisitos activos demostrables** hoy; son **controles heredados** con wiring roto desde el diseño inicial del toolbar. La necesidad operativa de cartera/planes está **cubierta por el Dashboard** (snapshot P1-B). La remediación de bajo riesgo es **ocultar**, no snapshot FE ni rediseño de filtros Clientes.

---

## 1. Metodología

Evidencia revisada (Frontend + documentación interna, sin Backend):

| Fuente | Qué aporta |
|--------|------------|
| `ClientManagementPage.tsx` L220–254 | Controles Plan/Estado + Registro en toolbar |
| `cliente.service.ts` L30–70 | Solo `activeFilter` + `buscar` → API |
| `ClienteFilters` + OpenAPI `GET /clientes/` | Params: `skip`, `limit`, `solo_activos`, `buscar` — **sin** plan/estado |
| `PLATFORM_CLIENTES_FUNCTIONAL_GAP_AUDIT.md` §3 | Hallazgo H2 — filtros sin efecto (Frontend) |
| `PLATFORM_CLIENTES_P0_P1_REMEDIATION_PLAN.md` §3.2, D2 | Recomendación previa: **ocultar** Plan/Estado |
| `PLATFORM_FINAL_SURFACE_AUDIT.md` PLAT-SURF-015 | P3 — sin efecto; ocultar o BE |
| Dashboard P1-B (`clientes-snapshot.utils.ts`) | Agregación global plan/estados — **otro caso de uso** |
| Validación manual usuario (2026-06-03) | **Todos \| Activos \| Inactivos** claro y aprobado — **no** Plan/Estado |

**Pregunta guía:** ¿El operador Platform **necesita filtrar el listado paginado** por plan/estado, o bastan Dashboard + columna visible + detalle cliente?

---

## 2. P1-01 — Filtro «Plan de suscripción»

### 2.1 Estado actual

| Aspecto | Detalle |
|---------|---------|
| **UI** | `<select>` «Todos los planes» + trial/básico/profesional/enterprise |
| **State** | `filters.plan_suscripcion` en React Query key |
| **Servicio** | **No leído** por `getClientes()` |
| **API** | Sin query param documentado |
| **Columna tabla** | Plan visible en fila — escaneo visual **sin filtro** |

### 2.2 ¿Requisito activo de producto?

| Evidencia a favor | Evidencia en contra |
|-------------------|---------------------|
| Valores alineados a `SubscriptionPlan` — diseño intencional superficial | Nunca wired en servicio; auditado como gap desde P0 remediation |
| Dashboard W14 donut «Distribución por plan» — **necesidad analítica** | Dashboard ya responde «¿cuántos por plan?» — no requiere filtro listado |
| Campo en create/edit modal — **dato de negocio real** | Modal ≠ filtro de listado |
| — | `PLATFORM_CLIENTES_P0_P1_REMEDIATION_PLAN` recomendó **ocultar** salvo BE |
| — | Sin user story / QA histórico que valide filtro Plan en listado |
| — | Snapshot FE duplicaría patrón Dashboard con mismas limitaciones (>1000) |

**Veredicto analítico:** El **dato plan** es requisito; el **control filtro en toolbar del listado** es **heredado / aspiracional**, no un requisito activo validado.

### 2.3 Opciones evaluadas

| # | Opción | Descripción | Pros | Contras |
|---|--------|-------------|------|---------|
| **1** | **Mantener y ocultar** | Quitar selects del toolbar; mantener tipos y modals | Elimina UI engañosa; reversible; 0 riesgo paginación; alineado D2 remediation | Operador pierde filtro listado (nunca funcionó) |
| **2** | Mantener con snapshot FE | `limit=1000` + filter client-side + paginar | Funcional sin BE; reutiliza patrón inactive | Totales parciales; duplica Dashboard; complejidad query key; **falsa precisión** si >1000 clientes |
| **3** | Esperar soporte Backend | `GET /clientes/?plan_suscripcion=` + paginación server | Solución definitiva; totales correctos | Requiere BE + OpenAPI; fuera alcance actual |
| **4** | Eliminar definitivamente | Borrar state, selects y keys de filtros plan | Toolbar más limpio | Pierde placeholder para futuro; refactor tipos `ClienteFilters` |

### 2.4 Decisión recomendada — Plan

| Decisión | **Opción 1 — Ocultar** |
|----------|-------------------------|
| **Alternativa futura** | Opción 3 cuando Backend exponga param (o BFF listado) |
| **No recomendado ahora** | Opción 2 (snapshot) — costo/beneficio inferior a ocultar dado Dashboard |
| **Opción 4** | Equivalente funcional a ocultar para MVP; reservar eliminación de tipos para limpieza posterior |

**Implementación futura (si se aprueba Opción 1):** comentario o remoción JSX de select Plan en `ClientManagementPage.tsx`; no tocar modals ni Dashboard.

---

## 3. P1-01 — Filtro «Estado de suscripción»

### 3.1 Estado actual

| Aspecto | Detalle |
|---------|---------|
| **UI** | `<select>` con solo: Todos, activo, trial, suspendido |
| **Dominio completo** | `SubscriptionStatus`: trial, activo, suspendido, **cancelado**, **moroso** |
| **Servicio / API** | Igual que Plan — **sin efecto** |
| **Superposición semántica** | «Registro» Todos/Activos/Inactivos filtra `es_activo`; estado suscripción es **eje distinto** |

### 3.2 ¿Requisito activo de producto?

| Evidencia a favor | Evidencia en contra |
|-------------------|---------------------|
| Estados de cartera son core SaaS | Dashboard P1-B: KPIs suspendidos, trial, cancelados, morosos + alertas `CLIENT_*` |
| Columna Plan/Estado en tabla | Filtro toolbar **incompleto** (faltan cancelado, moroso) — señal de UI no terminada |
| — | Misma brecha wiring que Plan (H2 audit) |
| — | Confunde con filtro Registro Activos/Inactivos (`es_activo` ≠ `estado_suscripcion`) |
| — | Remediation plan P0: ocultar |

**Veredicto analítico:** La necesidad de **monitorear cartera por estado** está resuelta en **Dashboard** y badges de fila. El select toolbar es **heredado incompleto**, no requisito activo del listado paginado.

### 3.3 Opciones evaluadas

Misma matriz 1–4 que §2.3.

### 3.4 Decisión recomendada — Estado suscripción

| Decisión | **Opción 1 — Ocultar** |
|----------|-------------------------|
| **Alternativa futura** | Opción 3 — query param BE `estado_suscripcion` con enum completo |
| **No recomendado ahora** | Opción 2 — snapshot; además mezcla dos ejes (registro vs suscripción) en paginación client-side |
| **Nota** | Si producto exige filtro listado antes de BE: mejor **enlace** «Ver clientes suspendidos» desde Dashboard → Clientes con query param futuro, no snapshot |

---

## 4. P1-01 — Matriz de decisión consolidada

| Control | ¿Requisito activo listado? | Decisión | Opción # |
|---------|---------------------------|----------|----------|
| **Plan suscripción** | **No** (heredado; analytics en Dashboard) | **Ocultar** del toolbar | **1** |
| **Estado suscripción** | **No** (heredado incompleto; KPIs en Dashboard) | **Ocultar** del toolbar | **1** |
| **Registro Todos \| Activos \| Inactivos** | **Sí** (validado manual) | **Mantener sin cambios** | — |
| **Búsqueda `buscar`** | **Sí** (wired API) | **Mantener** | — |

### 4.1 Comparativa de opciones globales P1-01

| Criterio | 1 Ocultar | 2 Snapshot FE | 3 Esperar BE | 4 Eliminar |
|----------|-----------|---------------|--------------|------------|
| Riesgo FE | Bajo | Medio | Nulo (ahora) | Bajo |
| Honestidad UX | Alta | Media (parcial) | Alta (futuro) | Alta |
| Esfuerzo | ~0.5 h | ~1–2 d | BE + FE | ~1 h |
| Alineado audits previos | ✅ D2 | Parcial | ✅ definitivo | ✅ |
| **Recomendación** | **✅ Ahora** | ❌ | ⏸ Futuro | Opcional post-ocultar |

---

## 5. P1-02 — Convergencia filtro activo/inactivo

### 5.1 Decisión explícita — Clientes

| Superficie | Decisión | Motivo |
|------------|----------|--------|
| **Clientes** | **Sin cambios** | UI `Todos \| Activos \| Inactivos` validada manualmente; cubre inactive-only (Catálogos no lo necesitan) |

No aplicar checkbox «Ver inactivos» ni select «Registro» del plan PAUX Phase A original.

### 5.2 Decisión explícita — Catálogos (×5)

| Superficie | Decisión | Motivo |
|------------|----------|--------|
| **Países, Monedas, Dept, Prov, Dist** | **Sin cambios** | Patrón «Ver inactivos» estable; referencia interna |

### 5.3 Evaluación — Módulos únicamente

#### Estado actual

| Superficie | Control | Default | Comportamiento API |
|------------|---------|---------|-------------------|
| **Catálogos** | «Ver inactivos» ☐ | unchecked | `solo_activos: true` → activos |
| **Clientes** | Select Registro | Activos | `solo_activos: true` / slice inactive / all |
| **Módulos** | «Solo activos» ☐ | **unchecked** | `es_activo: false` → **`solo_activos=false` → muestra todos** |

**Inconsistencia real:** solo Módulos muestra **inactivos por defecto** (al mostrar todos). Etiqueta «Solo activos» además usa semántica **invertida** respecto a «Ver inactivos» (checked = restrict vs checked = include).

#### ¿Aporta convergencia mínima en Módulos?

| A favor renombrar + invertir a «Ver inactivos» | En contra |
|------------------------------------------------|-----------|
| Label alineado con Catálogos | **Cambia default** listado (de «todos» a «solo activos») — riesgo operador |
| Default activos-only coherente con Clientes/Catálogos | Módulos catálogo global ≠ cartera clientes — ver todos puede ser intencional |
| PLAT-SURF-014 documentado | Valor **cosmético** > funcional si Clientes no converge |
| Esfuerzo ~1 h FE | Usuario no reportó fricción en Módulos |

#### Opciones Módulos (marco 1–4 adaptado)

| # | Opción | Descripción |
|---|--------|-------------|
| **A** | **Mantener sin cambios** (equivalente «mantener y ocultar» convergencia) | Dejar «Solo activos» y default actual |
| **B** | Renombrar «Ver inactivos» + invertir mapeo (`solo_activos: !showInactivos`) | Default pasa a solo activos |
| **C** | Solo renombrar label sin cambiar lógica | Sigue confuso semánticamente |
| **D** | Eliminar checkbox | Pierde filtro útil en módulos inactivos |

### 5.4 Decisión recomendada — Módulos

| Decisión | **Opción A — Mantener sin cambios (deferir P1-02 Módulos)** |
|----------|---------------------------------------------------------------|
| **Condición para revisitar B** | Producto confirma que default debe ser «solo activos» en catálogo módulos |
| **Rationale** | Con Clientes y Catálogos congelados, convergir solo Módulos **no cierra** inconsistencia cross-surface; el beneficio es marginal frente al cambio de default |

**Nota:** Documentar en código (comentario one-line) la divergencia conocida PLAT-SURF-014 — opcional, bajo riesgo.

---

## 6. Impacto en roadmap PAUX

### 6.1 Bloqueado hasta nueva decisión producto (solo si se rechaza ocultar)

| Ítem | Estado |
|------|--------|
| P1-01 snapshot FE | **No iniciar** — rechazado en recomendación |
| P1-01 ocultar selects | **Pendiente aprobación** explícita post-audit |
| P1-02 rediseño Clientes | **Cancelado** — mantener UI actual |
| P1-02 Módulos | **Deferido** — recomendación mantener |

### 6.2 Desbloqueado (sin relación con este audit)

| Ítem | Estado |
|------|--------|
| **P1-03** Editar detalle | ✅ Aprobado — implementar |
| **P1-04** 422 por campo | ✅ Aprobado — implementar |
| **P1-05** ER-03 copy | ✅ Aprobado — implementar |

### 6.3 Implementación mínima post-decisión (solo P1-01 Opción 1)

| Archivo | Cambio |
|---------|--------|
| `ClientManagementPage.tsx` | Remover/ocultar 2 selects Plan y Estado |
| `cliente.types.ts` | Opcional: comentario en `ClienteFilters` — campos reservados BE |
| Tests | Sin cambio servicio si no se implementa snapshot |

**No tocar:** Dashboard, `cliente.service` inactive path, select Registro.

---

## 7. Riesgos de cada decisión

| Decisión | Riesgo |
|----------|--------|
| **Ocultar Plan/Estado** | Operador que creía que filtraba pierde control — **mitigación:** nunca funcionó; Dashboard + columna |
| **Snapshot FE** | Paginación/total incorrectos; duplicación lógica Dashboard |
| **Esperar BE** | Toolbar sin filtros prolongado — aceptable si Dashboard cubre analytics |
| **Módulos converger** | Regresión percepción «desaparecieron módulos inactivos» al cambiar default |
| **Mantener todo status quo** | Inconsistencia documentada PLAT-SURF-014 persiste — **aceptable** para cierre MVP |

---

## 8. Preguntas para product owner (opcional)

Si se desea revisar recomendación **Opción 1 Ocultar**:

| # | Pregunta | Si «Sí» → implicación |
|---|----------|------------------------|
| Q1 | ¿Operadores filtran listado Clientes por plan semanalmente? | Considerar Opción 3 BE prioritario |
| Q2 | ¿Operadores necesitan listado filtrado por moroso/cancelado? | Completar enum + BE; no toolbar parcial actual |
| Q3 | ¿Default Módulos debe mostrar solo activos? | Reconsiderar Opción B Módulos |

Sin respuesta afirmativa a Q1–Q2: **mantener recomendación Ocultar**.

---

## 9. Resumen de decisiones propuestas

```
P1-01 Plan suscripción     → 1 OCULTAR (no snapshot, no BE ahora)
P1-01 Estado suscripción   → 1 OCULTAR
P1-02 Clientes Registro    → SIN CAMBIOS (Todos|Activos|Inactivos)
P1-02 Catálogos            → SIN CAMBIOS (Ver inactivos)
P1-02 Módulos              → DEFERIR (mantener Solo activos actual)

P1-03 / P1-04 / P1-05     → Proceder independientemente
```

---

## 10. Próximo paso

1. **Producto confirma** decisiones §9 (especialmente Ocultar Plan/Estado).
2. Si confirmado Opción 1: ticket FE mínimo ocultar selects (~30 min) — **fuera de P1-01 snapshot plan**.
3. Implementar **P1-03, P1-04, P1-05** en paralelo (sin dependencia).
4. Actualizar `PAUX_CONVERGENCE_PHASE_A_IMPLEMENTATION_PLAN.md` marcando P1-01/P1-02 acotados según este audit.
5. **No** evaluar Dashboard P2 / BFF hasta cierre PAUX Phase A restante.

---

*Fin — PAUX_PHASE_A_FILTERS_DECISION_AUDIT.md — auditoría de decisión, sin commits.*
