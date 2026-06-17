# Plan de actualización documental — ERP-BL-ACT-01 · INV-UX-003 · INV-UX-004

**Fecha:** 10 junio 2026  
**Estado:** **Aprobado con ajustes** — aplicación documental autorizada  
**Versión normativa:** **V2.1** (sin bump a V2.2; consolidación diferida)  
**Alcance:** `ERP_FRONTEND_STANDARDS_V2.md`, `.cursorrules`, `docs/prompts/PROMPT_FRONTEND_MAESTRO.md`  
**Principio rector:** incremental; **cero eliminaciones**; **cero reorganización masiva**; **cero modificación** de reglas fuera de alcance.

---

## Ajustes aprobados (respecto al plan inicial)

| # | Ajuste | Decisión |
|---|--------|----------|
| 1 | Versión documento | **Mantener V2.1**; extensiones normativas dentro de v2.1; V2.2 diferida (UX-006, UX-007, auditorías abiertas) |
| 2 | INV-BL-DET-01 | **Una sola** nota histórica en §6.3.1; sin marcas «superseded» en otros documentos |
| 3 | Principio incremental | Sin tocar filas/reglas existentes salvo adición; R-06 **intacto** — nueva fila **R-06-INV** aditiva |
| 4 | IDs a incorporar | PB-15…PB-21, UX-09, SEC-11…SEC-13, ERP-BL-ACT-01, INV-UX-003, INV-UX-004 |

---

## Contenido incorporado

### ERP_FRONTEND_STANDARDS_V2.md (v2.1)

| Ubicación | Acción |
|-----------|--------|
| Cabecera Estado | Append extensiones jun 2026 (sin cambiar Versión) |
| §1.1 Glosario | +5 filas |
| §6.3.1 (nueva) | ERP-BL-ACT-01 + PB-15…PB-21 + nota histórica INV-BL-DET-01 |
| §7.3.1 (nueva) | SEC-11…SEC-13 + cierre INV-UX-003/004 |
| §8.4 | +fila vocabulario + UX-09 |
| §9.3 | +fila B-L acciones Hub |
| §11.4 | +2 ítems checklist |
| §13.2 | +nota extensiones v2.1 (sin fila 2.2) |
| Anexo A | +fila R-06-INV (R-06 sin modificar) |
| Índice + matriz | +referencias cruzadas |

### .cursorrules

| Ubicación | Acción |
|-----------|--------|
| Evaluación #9 | Anti-patrón B-L click fila |
| Plantilla B | +2 bullets pointer |

### PROMPT_FRONTEND_MAESTRO.md

| Ubicación | Acción |
|-----------|--------|
| Plantilla B-L | Bloque ERP-BL-ACT-01 + dirty guard |
| Fase 3 | Ítems 13–14 |
| Fase 3.5 | Checkboxes PB-15…21, SEC-11…13 |

---

## Estadísticas diff final

| Documento | Agregadas | Modificadas | Eliminadas |
|-----------|-----------|-------------|------------|
| `ERP_FRONTEND_STANDARDS_V2.md` | ~98 | 1 (Estado append) | **0** |
| `.cursorrules` | 3 | **0** | **0** |
| `PROMPT_FRONTEND_MAESTRO.md` | 17 | **0** | **0** |

---

## Fase 4

- [x] Plan ajustado aprobado
- [x] Diff final presentado
- [x] Aplicación documental autorizada

*Actualizado: 2026-06-10 — Gobernanza documental ERP Frontend.*
