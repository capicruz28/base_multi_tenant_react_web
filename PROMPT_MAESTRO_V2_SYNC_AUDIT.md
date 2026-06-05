# Auditoría de sincronización — `PROMPT_FRONTEND_MAESTRO.md` vs `ERP_FRONTEND_STANDARDS_V2`

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — **sin modificar** PROMPT  
**Norma vigente (congelada):** [`ERP_FRONTEND_STANDARDS_V2.md`](./ERP_FRONTEND_STANDARDS_V2.md)  
**Objeto auditado:** [`docs/prompts/PROMPT_FRONTEND_MAESTRO.md`](./docs/prompts/PROMPT_FRONTEND_MAESTRO.md) (589 líneas)  
**Sin código · sin commit**

---

## 1. Veredicto ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿PROMPT contradice V2? | **Sí — 6 contradicciones 🔴** |
| ¿Duplica norma que debe vivir solo en V2? | **Sí — ~200 líneas** (diseño 2 capas, vocabulario, layout) |
| ¿Proceso Fase 0–3 sigue válido? | **✅ Sí** — falta integrar §2 y §11 |
| ¿Listo para generar v2? | **✅ Sí** tras plan §7 |

**Principio acordado (V2 §0.3):** PROMPT = **procedimiento** Fase 0–4; reglas MUST → pointers a V2; diseño 2 capas → `.cursorrules` únicamente.

---

## 2. Mapa de cobertura por fase

| Sección PROMPT | Líneas | Rol | Alineación V2 |
|----------------|--------|-----|---------------|
| Reglas absolutas | 15–38 | Resumen | ⚠ L36 multiempresa |
| Diseño 2 capas + ejemplos TSX | 42–157 | **Duplica `.cursorrules`** | 🔴 mover a pointer |
| Fase 0 OpenAPI | 160–230 | Proceso | ✅ falta §2 |
| Fase 1 auditoría | 234–311 | Proceso | ✅ falta plantilla en reporte |
| Fase 2 bloques 1–3 | 315–360 | Proceso | ⚠ L334 empresa_id |
| Bloque 4 diseño + layout | 361–436 | **Norma duplicada** | 🔴 pointer V2 |
| Vocabulario + FK + maestros | 437–556 | **Norma duplicada** | 🔴 pointer §8.4, §10 |
| Fase 3 verificación | 559–578 | Proceso | ⚠ falta Gates §11 |
| Inicio | 582–589 | Proceso | ✅ |

---

## 3. Contradicciones 🔴 con V2

| ID | PROMPT | V2 | Regla |
|----|--------|-----|-------|
| **PR-01** | L36: “empresa_id donde el API lo requiera” | ME-01, ME-05 | Company-scoped: empresa = **sesión JWT**, no Zustand/filtro local |
| **PR-02** | L191: “empresa_id del tenant” vía **Zustand** | §4, §10 `useEmpresaActiva` | Fuente operativa JWT + AuthContext |
| **PR-03** | L376: “Ejemplo Almacenes: **Empresa**, Tipo…” | ME-02, AP-01 | PROHIBIDO filtro empresa en toolbar |
| **PR-04** | L542: “Filtros: **empresa**, fechas…” analíticos | ME-02, PB-02 | Filtros dominio; empresa vía sesión |
| **PR-05** | L503–504: “Empty state con ícono + mensaje” genérico | ES-01 | MUST `IamTableEmptyState` (Plantilla A) |
| **PR-06** | L504: “Loading con skeleton **de tabla**” sin componente | SK-01 | MUST `InvTableSkeleton` |

**Precedencia:** V2 gana. PROMPT v2 debe corregir PR-01…PR-06.

---

## 4. Reglas obsoletas

### 4.1 Obsoletas por cierre IAM/ORG/INV

| PROMPT actual | Sustituido por V2 |
|---------------|-------------------|
| “Usar patrón módulo referencia Fase 0” sin tabla ORG/INV | §2.3 matriz + §9.5 “qué copiar” |
| Referencia solo ORG vocabulario (L441–444) | §9.1 IAM + §9.3 INV + §8.4 tabla única |
| Maestros genéricos L494–505 | §5 Plantilla A (PA-xx, TB-xx, ES-xx) |
| Transaccionales L521–535 | §6 B-F/B-L (CD-xx, PB-xx, SEC-xx) |
| Analíticos L537–542 | §6.4 B-R (PB-09…12) |
| Sin B.1.1 / discard | §7 B11-xx, SEC-xx |
| Sin multiempresa guards | §4 ME-xx, §4.5 patrón hooks |
| Sin clasificación A/A+/B-* | §2 árbol |

### 4.2 Obsoletas por arquitectura documental

| PROMPT actual | Motivo | Acción v2 |
|---------------|--------|-----------|
| Bloque diseño 2 capas L42–157 (~115 líneas) | V2 §0.2 → solo `.cursorrules` | “Ver `.cursorrules` § diseño 2 capas” |
| Reglas layout L390–435 duplican V2 §5/§6 | Write once | Pointer §5.2, §6.6, CD-08 |
| Tabla vocabulario L448–456 | Duplica §8.4 UX-01 | “Vocabulario: V2 §8.4” |
| Tabla FK L477–487 | Duplica §8.2 FK-01 | Mantener **ejemplos** como ilustración OK; añadir “norma FK-01 §8.2” |

### 4.3 Vigentes — mantener en PROMPT

| Contenido | Motivo |
|-----------|--------|
| Fase 0 pasos 0.1–0.3 OpenAPI | Proceso exclusivo PROMPT |
| Tabla endpoints contrato | Gate 0 API-01 |
| Clasificación ✅/🔴/🔁 archivos | Alineado evaluación código |
| Fase 1 estructura `AUDITORIA_FRONTEND_[CODIGO].md` | Gate 0 + Fase 1 |
| Bloques 1–3 types/services/hooks orden | Proceso |
| Paso 4.0 decisiones diseño **por entidad** | Procedimiento (no norma) |
| Fase 3 inventario archivos + deprecated check | Proceso |
| Detente entre fases | Control flujo |
| Reglas absolutas iniciales (ajustadas) | Cabina rápida |

---

## 5. Duplicaciones

### 5.1 Triplicación actual (V2 + cursorrules + PROMPT)

| Tema | V2 | `.cursorrules` | PROMPT | Destino v2 |
|------|-----|----------------|--------|------------|
| Diseño 2 capas | ❌ | ✅ | ✅ L42–157 | **Solo `.cursorrules`** |
| Tabla tokens Capa 1/2 | ❌ | ✅ | ✅ | **Solo `.cursorrules`** |
| Patrón tabla TSX ejemplo | ❌ | ❌ | ✅ L90–109 | **Solo `.cursorrules`** o eliminar |
| Vocabulario Desactivar/Anular | §8.4 | parcial | ✅ L448–458 | **Solo V2** + 1 línea PROMPT |
| Layout toolbar H1 | TB-01 | ✅ | ✅ L392–404 | V2 + 1 línea PROMPT |
| Cabecera+detalle UI | CD-08/09 | ✅ | ✅ L419–435 | V2 pointer |
| es_activo create/edit | UX-03/04 | ❌ | ✅ L489–492 | V2 pointer |
| Toast hook only | ER-02 | ✅ | ✅ L348–351 | OK resumen PROMPT |

**Ahorro estimado PROMPT v2:** **~150–180 líneas** recortadas → pointers.

### 5.2 Duplicación que debe quedar **solo en V2**

| Contenido | Acción PROMPT v2 |
|-----------|------------------|
| Árbol §2.1 completo | Fase 0.4: “Clasificar cada ruta — V2 §2.1” |
| Gates §11 checklist | Fase 3.5 nueva |
| ME-01…ME-06 detalle | 2 líneas + §4 |
| B11-01…B11-09, SEC-01…06 | “Cumplir V2 §7; QA INV_M3 / INV_M2 matrices” |
| §9 referencias INV/ORG | Tabla compacta §9.5 o link |
| AUTH/IMP | Link §4.8 |
| Componentes §10 mapa | Lista 6 nombres + “resto §10” |

### 5.3 Duplicación aceptada en PROMPT (procedimiento)

| Contenido | Por qué OK |
|-----------|------------|
| Pasos Fase 0.1 tabla OpenAPI | Operacional por módulo |
| Estructura auditoría markdown | Plantilla entregable |
| Orden bloques implementación | Flujo agente |
| Paso 4.0 columnas/filtros **por entidad** | Decisiones caso a caso |
| Checklist Fase 3 deprecated/UUID | Verificación final |

---

## 6. Ajustes necesarios por fase (PROMPT v2)

### 6.1 Header + reglas absolutas

**Añadir:**

```markdown
Norma ERP: ERP_FRONTEND_STANDARDS_V2.md (CONGELADO)
Precedencia: OpenAPI > V2 > .cursorrules > este prompt
Diseño 2 capas: ver .cursorrules (no repetir aquí)
```

**Corregir:**

- L36 → “empresa_id operativo = sesión JWT (V2 ME-01); ver §4”
- Eliminar duplicado diseño 2 capas L42–157 → 3 líneas pointer

### 6.2 Fase 0 — nuevos pasos

| Paso | Contenido propuesto | V2 |
|------|---------------------|-----|
| **0.4** (nuevo) | Clasificar **cada ruta** del módulo con árbol §2.1 | CL-01, §2.3 PUR |
| **0.5** (nuevo) | Elegir archivo patrón §9.5 (ORG/INV/IAM) | §9 |
| 0.2 ajuste | Sustituir Zustand empresa → `useEmpresaActiva`, `use*SessionScope` | §4, §10 |
| 0.3 ampliar | Columna **Plantilla** (A/A+/B-L/B-F/B-R) en tabla archivos | §2 |

### 6.3 Fase 1 — auditoría

**Añadir sección obligatoria en `AUDITORIA_FRONTEND_[CODIGO].md`:**

```markdown
### CLASIFICACIÓN PLANTILLA POR RUTA
| Ruta | Plantilla V2 | Referencia §9 | Gates aplicables |
```

**Pointer:** Gates objetivo por sprint (M0→1, M1→2, M2→3).

### 6.4 Fase 2 — Bloque 4

| Actual | v2 |
|--------|-----|
| L376 ejemplo Empresa en filtros | “Tipo, estado, búsqueda — **sin** selector empresa (ME-02)” |
| L390–435 layout completo | **Recortar 80%** → “Layout: V2 §5 Plantilla A / §6 Plantilla B según clasificación 0.4” |
| L441 ORG solo como referencia | §9.5: INV catálogo M3 + ORG E-SEC + IAM componentes |
| L494–556 maestros/transaccional/analítico | **Reemplazar** por 3 bullets + links §5, §6, §7 |
| Sin B.1.1 | “Modales A: V2 §7.1. B-F: §7.2 SEC-01” |
| Sin multiempresa infra | “M0: copiar patrón INV M0-b — V2 §4.5, §10” |

### 6.5 Fase 3 — verificación + Gates

**Nueva Fase 3.5 — Gates V2 §11:**

| Sprint | Gates |
|--------|-------|
| M0 | 0, 1, 4 |
| M1 (catálogos) | 0, 2, 4 por pantalla |
| M2 (transaccional) | 0, 3, 4 por ruta B |

Checklist: copiar ítems §11.1–11.5 según plantillas del módulo (no pegar documento completo).

**Ampliar Fase 3:**

- Confirmar cumplimiento ME-02 (grep `empresaFilter`, “Todas las empresas”)
- Plantilla A: `IamTableEmptyState`, `InvTableSkeleton` presentes
- B-F: `use*TransactionalFormGuard` o equivalente module-local

---

## 7. Plan propuesto — `PROMPT_FRONTEND_MAESTRO` v2 (esqueleto)

### 7.1 Estructura objetivo

| § | Contenido | Líneas ~ |
|---|----------|----------|
| Contexto + precedencia | MODULO, CODIGO, link V2 | 20 |
| Reglas absolutas | 15 bullets (sin diseño 2 capas) | 25 |
| **Fase 0** | 0.1–0.5 OpenAPI + clasificación + patrón | 90 |
| **Fase 1** | Auditoría + plantilla clasificación | 80 |
| **Fase 2** | Bloques 1–3 sin cambio; Bloque 4 **recortado** | 120 |
| **Fase 3** | Verificación existente | 25 |
| **Fase 3.5** | Gates §11 por sprint | 30 |
| Inicio | 0.1→0.5 secuencial | 10 |
| **Total** | | **~400** (-190 vs actual) |

### 7.2 Bloque 4 v2 — plantilla maestros (ejemplo recorte)

```markdown
## Bloque 4 — Componentes

Antes de codificar: clasificación Fase 0.4 confirmada.

### Plantilla A / A+ (V2 §5)
- Copiar referencia §9.5 (ej. INV UnidadesMedidaPage o ORG DepartamentosPage)
- Cumplir Gates §11.3 — checklist V2 §11.3
- B.1.1: V2 §7.1. Componentes: V2 §10

### Plantilla B-F / B-L / B-R (V2 §6)
- B-F: INV MovimientoFormPage + V2 §7.2
- B-L: INV MovimientosPage
- B-R: INV StockPage
- Gate 3 por ruta — V2 §11.4

Vocabulario, FK, es_activo: V2 §8.2–§8.4 (no repetir tablas).
Diseño visual: .cursorrules
```

### 7.3 Referencias PUR en Fase 0.4 (ejemplo fijo)

| Ruta PUR | Plantilla | Copiar |
|----------|-----------|--------|
| Proveedores, contactos | A | INV `UnidadesMedidaPage` |
| Solicitudes, cotizaciones | B-L | INV `MovimientosPage` |
| OC, recepciones | B-F | INV `MovimientoFormPage` |

*(Tabla completa: V2 §2.3 — no duplicar entera; link o subconjunto PUR)*

---

## 8. Matriz sincronización PUR-M0 / M1 / M2

| Necesidad sprint | V2 | PROMPT actual | PROMPT v2 |
|------------------|-----|---------------|-----------|
| Clasificar rutas | §2 | ❌ | Fase 0.4 |
| Infra scope M0 | §4.5 | ❌ | Bloque 4 pointer |
| Sin empresa toolbar | ME-02 | 🔴 PR-03 | Corregido |
| Gate 1 QA | §11.2 | ❌ | Fase 3.5 M0 |
| Catálogo A + B.1.1 | §5, §7.1 | parcial | Gate 2 + INV_M3 QA ref |
| OC B-F + SEC | §7.2 | parcial transaccional | Gate 3 B-F only |
| OpenAPI Fase 0 | — | ✅ | ✅ |

---

## 9. Contradicciones PROMPT ↔ `.cursorrules` (triangulación)

| Tema | PROMPT | `.cursorrules` | V2 | Acción derivados |
|------|--------|----------------|-----|------------------|
| Filtro empresa | PR-03, PR-04 | CR-01 | ME-02 | Corregir ambos |
| Empty genérico | PR-05 | CR-03 | ES-01 | Pointer V2 |
| Diseño 2 capas | 115 líneas | 70 líneas | fuera | **Solo cursorrules** |
| empresa_id | PR-01, PR-02 | CR-02 | ME-01 | Corregir ambos |

PROMPT v2 y `.cursorrules` v2 deben aplicarse **en paralelo** antes de PUR-M0.

---

## 10. Checklist pre-generación PROMPT v2

- [ ] Header precedencia + link V2 congelado
- [ ] Eliminar bloque diseño 2 capas L42–157
- [ ] Corregir PR-01…PR-06
- [ ] Añadir Fase 0.4 clasificación + 0.5 patrón
- [ ] Ajustar Paso 0.2 multiempresa (`useEmpresaActiva`)
- [ ] Recortar Bloque 4 layout/vocabulario → pointers V2
- [ ] Añadir Fase 3.5 Gates §11
- [ ] Ampliar plantilla auditoría con columna Plantilla
- [ ] Mantener Fase 0.1 OpenAPI y Fase 1 estructura
- [ ] **No** pegar §11 completo ni §2 árbol completo
- [ ] Referencia PUR §2.3 subconjunto o link

---

## 11. Veredicto final

| Criterio | Estado |
|----------|--------|
| Contradicciones PROMPT vs V2 | 6 (PR-01…PR-06) |
| Duplicación eliminable | ~150–180 líneas |
| Proceso Fase 0–3 | ✅ válido con 0.4, 0.5, 3.5 |
| Alineación PUR | 🔴 actual insuficiente; ✅ con plan v2 |
| Listo validar generación v2 | ✅ |

**Orden recomendado de generación (post-validación):**

1. `.cursorrules` v2 ([`CURSORRULES_V2_SYNC_AUDIT.md`](./CURSORRULES_V2_SYNC_AUDIT.md) §6)
2. `PROMPT_FRONTEND_MAESTRO` v2 (este documento §7)
3. Banner supersede V1 + opcional `reglas.md` sync manual

---

*Auditoría sync PROMPT. Sin modificar archivos. Sin commit.*
