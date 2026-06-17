# ERP V2.1 — Auditoría final de consistencia documental (redundancy check)

**Fecha:** 10 junio 2026  
**Estado:** Solo auditoría — **sin cambios aplicados** a documentos normativos  
**Objeto auditado:** `ERP_V2_1_INSERTION_PLAN.md` (22 inserciones + decisiones aprobadas)  
**Documentos normativos revisados (solo lectura):**

- `ERP_FRONTEND_STANDARDS_V2.md` (v2.0)
- `.cursorrules`
- `docs/prompts/PROMPT_FRONTEND_MAESTRO.md`

**Decisiones de aprobación incorporadas en esta revisión:**

1. **INS-V2-08** aprobado — pointer UX-04 → RB-ROW-01.
2. **PB-14** permanece **SHOULD** en V2 (no elevar a MUST).
3. PB-13 / PB-14 (no PB-09…11) para stacking B-L.

---

## 1. Resumen ejecutivo

| Dimensión | Resultado |
|-----------|-----------|
| IDs duplicados (colisión con V2.0) | **0** |
| Referencias cruzadas inválidas post-merge | **0** |
| Contradicciones normativas | **0** |
| Conflictos de precedencia | **0** |
| Reglas redundantes inaceptables | **0** |
| Solapamientos parciales aceptables | **8** (documentados §3) |
| Ajustes menores recomendados pre-merge | **4** (§6) |
| Riesgos proceso (no documentales) | **2** (§5) |

### Veredicto final

## **APTO PARA MERGE CON AJUSTES**

El plan V2.1 es **seguro y no destructivo**. Puede ejecutarse tras aplicar los **4 micro-ajustes opcionales** del §6 (recomendados, no bloqueantes). Ningún ajuste requiere renumerar IDs, mover secciones ni alterar precedencia.

---

## 2. Inventario de IDs nuevos — validación de unicidad

### 2.1 IDs propuestos (18)

| ID | Hogar planificado | ¿Existe en V2.0? | ¿En otros docs normativos? | Estado |
|----|-------------------|------------------|----------------------------|--------|
| **AP-13** | §3.2 | No (AP-12 solo en §9.1) | No | ✅ Libre |
| **AP-14** | §3.2 | No | No | ✅ Libre |
| **B11-10** | §7.1 | No (máx. B11-09) | No en normativos | ✅ Libre |
| **B11-11** | §7.1 | No | No en normativos | ✅ Libre |
| **PB-13** | §6.3 | No | No en normativos | ✅ Libre |
| **PB-14** | §6.3 | No | No en normativos | ✅ Libre |
| **RB-ROW-01** | §5.10 | No | Solo audits/propuestas | ✅ Libre |
| **RB-ROW-02** | §5.10 | No | Idem | ✅ Libre |
| **RB-ROW-03** | §5.10 | No | Idem | ✅ Libre |
| **MD-01** | §7.1.1 | No | Solo audits | ✅ Libre |
| **MD-02** | §7.1.1 | No | Idem | ✅ Libre |
| **MD-03** | §7.1.1 | No | Idem | ✅ Libre |
| **MD-04** | §7.1.1 | No | Idem | ✅ Libre |
| **UX-05** | §8.8 | No (V2 UX-01…04) | Audits Platform usan UX-05…08 **fuera de V2** | ✅ Libre en V2 |
| **UX-06** | §8.8 | No | Idem | ✅ Libre en V2 |
| **UX-07** | §8.8 | No | Idem | ✅ Libre en V2 |
| **UX-08** | §8.8 | No | Idem | ✅ Libre en V2 |

### 2.2 IDs existentes intocables — confirmación

| Serie | Rango V2.0 | ¿Tocado por plan? |
|-------|------------|-------------------|
| PB- | 01…12 (§6.3 + §6.4) | **No** — PB-13/14 son adiciones |
| B11- | 01…09 | **No** — solo añade 10/11 |
| AP- | 01…11 (§3.2) + 12 (§9.1) | **No** — solo añade 13/14 en §3.2 |
| UX- | 01…04 | **Solo INS-V2-08** — extensión pointer UX-04 (aprobado) |
| ME-, AUTH-, IMP-, CD-, API-, SEC- | Completos | **No tocados** |

### 2.3 Corrección PB-09…11 (validación crítica)

| Verificación | Resultado |
|--------------|-----------|
| ¿Plan usa PB-09/10/11 para stacking? | **No** — corregido a PB-13/14 |
| ¿PB-09…12 B-R permanecen intactos? | **Sí** |
| ¿Hueco PB-09…12 entre PB-08 (§6.3) y PB-13 (§6.3)? | **Sí** — PB-09…12 viven en §6.4 B-R; no es colisión de ID |

**Nota:** La serie PB queda **no contigua por sección** (08 → [09…12 en B-R] → 13…14 en B-L). Es consistente con V2 actual (AP-12 en §9.1, no en §3.2). Riesgo: confusión lectora — mitigar con changelog §13 (ya en plan).

---

## 3. Reglas redundantes y solapamientos parciales

### 3.1 Redundancia aceptable (patrón V2 existente)

| Par | Tipo | ¿Aceptable? | Justificación |
|-----|------|-------------|---------------|
| **B11-10** + **AP-13** | Prohibición + anti-patrón | ✅ | Igual que AP-06 ↔ B11-02 |
| **B11-10** + **B11-11** | MUST NOT + MUST procedimiento | ✅ | Prohibición + cómo cumplir |
| **RB-ROW-02** + **AP-14** | Regla + anti-patrón | ✅ | Mismo patrón |
| **B11-02** + **UX-07** (guard `discardPending`) | Parcial | ✅ | UX-07 añade variant + pre-mutación |
| **PA-07** + **UX-07** | Parcial | ✅ | PA-07 no se modifica; UX-07 detalla reactivar |
| **B11-04** + **UX-08** | Copy + variant | ✅ | Hogares distintos |
| **UX-04** + **RB-ROW-01** | Formulario + fila | ✅ | Complementarias; INS-V2-08 enlaza |

### 3.2 Solapamiento parcial — sin acción obligatoria

| Par | Severidad | Análisis |
|-----|-----------|----------|
| **UX-05** + **UX-08** (`warning`) | Media operativa | Plan incluye nota explícita en §8.8. No es contradicción. |
| **B11-03** + **TB-05** | Baja | Preexistente V2.0 (deshabilitar acciones con `discardPending`). No introducido por V2.1. |
| **§8.8 tabla resumen** + **§8.8 tabla ID** | Baja | Dos tablas en mismo hogar; patrón V2 habitual (resumen + MUST). |
| **Gate §11.3** `B11-01…09` + ítems nuevos `B11-10/11` | Baja | Rango antiguo no actualizado; ítems nuevos cubren gap. Ver ajuste A-3 §6. |
| **INS-V2-12** dos líneas `- [ ] **B-L:**` | Baja | Redundancia estructural checklist; ver ajuste A-4 §6. |

### 3.3 Duplicidad funcional inaceptable

**Ninguna detectada** que requiera eliminar reglas nuevas o existentes.

---

## 4. Referencias cruzadas — validación post-merge

### 4.1 Grafo de dependencias (todas válidas)

```
AP-13 ──→ B11-10 ←── B11-11
              ↑
MD-04 ────────┘
PB-13 ──→ B11-10, SEC-08, PB-08
PB-14 ──→ PB-13
RB-ROW-01 ←── UX-04 (INS-V2-08)
AP-14 ──→ RB-ROW-02
UX-07 ──→ B11-02, PA-07
UX-08 ──→ B11-04
MD-03 ──→ SEC-08
```

### 4.2 Referencias en plan — checklist

| Referencia | ¿Destino existe post-merge? | Estado |
|------------|----------------------------|--------|
| UX-04 → §5.10 RB-ROW-01 | §5.10 nuevo | ✅ |
| AP-13 → B11-10 | §7.1 | ✅ |
| Gate 2 → §5.10, §8.8 | Nuevas secciones | ✅ |
| Gate 3 B-L → PB-13/14 | §6.3 | ✅ |
| .cursorrules → V2 §5.10, §8.8 | Nuevas secciones | ✅ |
| PROMPT → §5.10, §8.8 | Nuevas secciones | ✅ |
| `INV_MODAL_STACKING_AUDIT.md` | Archivo repo | ✅ |
| §7.1.1 MD-xx | Nuevo subapartado | ✅ |

### 4.3 Referencias huérfanas post-merge (pointers desactualizados)

| Ubicación V2.0 | Pointer actual | Gap post-merge | Severidad |
|----------------|----------------|----------------|-----------|
| §5.6 PA-03…08 bloque | `Vocabulario baja: §8.4` | No menciona §8.8 (variants) | **Baja** |
| §10 fila `ConfirmDialog` | Estándar `§8.4` | Variants en §8.8 | **Baja** |
| §11.3 Gate 2 | `B11-01 … B11-09` | B11-10/11 fuera del rango literal | **Baja** |
| Índice §8 | `§8 UX/ER/API ←→ §5 PA-08` | No cita §8.8 | **Baja** (INS-V2-15 parcialmente corrige) |
| §13.1 derivados | «Acción pendiente .cursorrules» | Quedará obsoleto tras merge | **Cosmética** |

**Ninguna huérfana invalida una regla.** Son pointers de navegación — ver ajustes A-1, A-2, A-3 §6.

### 4.4 Documentos derivados no normativos con IDs obsoletos

| Documento | Issue | Impacto en merge |
|-----------|-------|------------------|
| `ERP_V2_DOCUMENTATION_AUDIT.md` | Cita PB-09 para stacking en .cursorrules; B11-11 como guard `discardPending` | **Ninguno** — no normativo; actualizar banner post-merge |
| `ERP_V2_STANDARDS_PROPOSAL.md` | Usa nombres MD-STACK-* | **Ninguno** — banner «merged V2.1» planificado |

---

## 5. Riesgos encontrados

### 5.1 Riesgos documentales

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| **R-DOC-01** | Confusión PB-08…14 (B-L) vs PB-09…12 (B-R) | Media | Bajo | Changelog §13; matriz §9.3; PROMPT ref. explícita PB-13/14 |
| **R-DOC-02** | UX-05/UX-08 ambos `warning` | Media | Medio | Nota en §8.8 (en plan); copy distinto en PROMPT |
| **R-DOC-03** | Pointers §5.6 / §10 sin §8.8 | Media | Bajo | Ajustes A-1, A-2 §6 |
| **R-DOC-04** | Gate 2 rango B11-01…09 desactualizado | Baja | Bajo | Ajuste A-3 §6 |
| **R-DOC-05** | `.cursorrules` excede *write once* si copia tablas | Baja | Medio | Plan cumple: solo bullets + IDs ✅ |

### 5.2 Riesgos de proceso (fuera del plan, no bloquean merge doc)

| ID | Riesgo | Notas |
|----|--------|-------|
| **R-PROC-01** | QA manual P1 + RB-ROW aún con ☐ | Norma refleja código ya implementado; QA puede cerrarse en paralelo al merge |
| **R-PROC-02** | Módulos legacy pre-RA-ORG sin ternario | V2.1 no exige refactor retroactivo inmediato; Gates detectan en nuevos sprints |

### 5.3 Conflictos de precedencia

| Cadena | ¿Alterada? | Verificación |
|--------|------------|--------------|
| OpenAPI > V2 > .cursorrules > PROMPT | **No** | Cabecera V2 y §3.1 intactas |
| Diseño 2 capas solo `.cursorrules` | **No** | Plan no toca esa sección |
| ME / API / IAM | **No** | Cero inserciones en §4, §8.1, §9.1 |

**Veredicto precedencia:** Sin conflictos.

### 5.4 Coherencia entre los tres documentos normativos

| Tema | V2 (hogar) | .cursorrules | PROMPT | ¿Alineado? |
|------|------------|--------------|--------|------------|
| RB-ROW | §5.10 MUST | Pointer | Checklist Fase 2/3 | ✅ |
| Stacking | B11-10/11, PB-13 | Pointer B11-10, PB-13/14 | Fase 2 B-L, Fase 3 | ✅ |
| PB-14 SHOULD | §6.3 SHOULD | Menciona PB-14 | Describe patrón sin elevar a MUST | ✅ |
| UX variants | §8.8 UX-05…08 | Pointer INS-CR-03 | Reglas absolutas + Fase 2 | ✅ |
| MD tipos A/B/C | §7.1.1 | No (correcto) | Solo B-L checklist | ✅ |

**Inconsistencia menor:** PROMPT Fase 3 ítem 12 exige B11-10 (equivalente MUST) para B-L, mientras PB-14 es SHOULD en V2 — **no es conflicto de precedencia** (PROMPT puede ser más estricto en verificación si no contradice V2). PB-14 SHOULD no impide checklist más exigente.

---

## 6. Recomendaciones previas al merge

### 6.1 Micro-ajustes al plan (recomendados, no bloqueantes)

| ID | Ajuste | Dónde | Texto sugerido |
|----|--------|-------|----------------|
| **A-1** | Ampliar pointer §5.6 | INS-V2-02 o nuevo **INS-V2-17** | Tras fila PA-08, línea: `Variants ConfirmDialog: §8.8 UX-05…08. Vocabulario baja: §8.4.` (reemplazar solo la línea `Stack types/hooks…`) |
| **A-2** | Ampliar §10 ConfirmDialog | **INS-V2-18** opcional | Columna Estándar: `§8.4, §8.8` (sin cambiar ruta ni componente) |
| **A-3** | Gate 2 rango B11 | Editar línea existente §11.3 | `B11-01 … **B11-11**` en lugar de solo …09; **o** dejar ítems INS-V2-11 como única fuente de 10/11 |
| **A-4** | Consolidar Gate 3 B-L | INS-V2-12 | Una sola línea: `- [ ] **B-L:** **PB-04** … **PB-08**, **PB-13**, **PB-14**; UX-05/06; QA stacking` |

### 6.2 Acciones post-merge (no parte del merge normativo)

| # | Acción |
|---|--------|
| 1 | Banner en `ERP_V2_STANDARDS_PROPOSAL.md`: «Incorporado en V2.1» |
| 2 | Nota al pie en `ERP_V2_DOCUMENTATION_AUDIT.md`: IDs PB-13/14; B11-11 = cierre Radix |
| 3 | Actualizar §13.1 «acción pendiente» en .cursorrules/PROMPT tras merge |
| 4 | Cerrar QA ☐ en `ERP_ORG_ROW_ACTIONS_ALIGNMENT_REPORT.md` y `ERP_MODAL_STANDARDIZATION_P1_REPORT.md` |

### 6.3 Simplificaciones evaluadas y descartadas

| Propuesta | ¿Aplicar? | Motivo descarte |
|-----------|-----------|-----------------|
| Fusionar B11-10 y B11-11 en un solo ID | No | Pierde patrón AP+B11 probado |
| Mover UX-05…08 a §8.4 | No | Mezcla vocabulario y variants |
| Usar prefijo MD-SEM en lugar de UX-05…08 | No | Rompe continuidad UX-01…04 |
| Elevar PB-14 a MUST | **No** — decisión aprobada | Usuario confirmó SHOULD |
| Omitir MD-01…04 | No | Marco necesario para SEC-08 vs MD-02 |

---

## 7. Validación por archivo del plan

### 7.1 `ERP_FRONTEND_STANDARDS_V2.md` — 17 inserciones (INS-V2-00…16)

| INS | ¿Destructivo? | ¿IDs únicos? | ¿Refs válidas? | Estado |
|-----|---------------|--------------|----------------|--------|
| V2-00 Metadatos | No | N/A | N/A | ✅ |
| V2-01 AP-13/14 | No | ✅ | ✅ | ✅ |
| V2-02 §5.10 RB-ROW | No | ✅ | ✅ | ✅ |
| V2-03 PB-13/14 | No | ✅ | ✅ | ✅ |
| V2-04 B11-10/11 | No | ✅ | ✅ | ✅ |
| V2-05 §7.1.1 MD | No | ✅ | ✅ | ✅ |
| V2-06 Piezas técnicas | No | N/A | ✅ | ✅ |
| V2-07 §8.8 UX | No | ✅ | ✅ | ✅ |
| V2-08 UX-04 pointer | **Edición mínima aprobada** | ✅ | ✅ | ✅ |
| V2-09…16 | No | ✅ | ✅ | ✅ |

### 7.2 `.cursorrules` — 5 inserciones (INS-CR-01…05)

| Verificación | Estado |
|--------------|--------|
| Sin tablas normativas completas | ✅ |
| Sin tocar diseño 2 capas | ✅ |
| INS-CR-03 reemplazo precisión «aprobar» | ✅ Alineado UX-05 |
| Pointers a §5.10, §8.8, B11-10, PB-13/14 | ✅ |

### 7.3 `PROMPT_FRONTEND_MAESTRO.md` — 8 inserciones (INS-PR-01…08)

| Verificación | Estado |
|--------------|--------|
| Fase 0 intacta | ✅ |
| PB-14 no elevado a MUST en PROMPT | ✅ (describe patrón; V2 SHOULD) |
| Gates alineados con §11 | ✅ |
| Sin duplicar tablas V2 | ✅ |

---

## 8. Matriz de compatibilidad hacia atrás

| Escenario | ¿Compatible V2.0? | Notas |
|-----------|-------------------|-------|
| Código ORG+INV post-P0/P1/RA | **Sí** | Plan norma práctica existente |
| Módulos PUR sin migrar | **Sí** | Gates nuevos aplican en M1/M2 futuro |
| Lectores con bookmarks §8.6 | **Sí** | §8.8 insertado después §8.7; §8.6 intacto |
| Checklists Gate 2 con B11-01…09 | **Sí** | Ítems adicionales; rango ampliable (A-3) |
| Referencias externas a «V2.0» | **Sí** | V2.0 histórico en §13; 2.1 aditivo |

---

## 9. Checklist final pre-merge

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Cero colisión IDs con V2.0 | ✅ |
| 2 | Cero renumeración IDs existentes | ✅ |
| 3 | INS-V2-08 aprobado | ✅ |
| 4 | PB-14 SHOULD (no MUST) consistente en V2/PROMPT | ✅ |
| 5 | PB-13/14 (no PB-09…11) en plan | ✅ |
| 6 | Precedencia intacta | ✅ |
| 7 | ME / API / IAM / 2 capas intactos | ✅ |
| 8 | Sin contradicciones normativas | ✅ |
| 9 | Referencias cruzadas válidas | ✅ |
| 10 | Micro-ajustes A-1…A-4 documentados | ⚠ Recomendados |

---

## 10. Veredicto final detallado

| Opción | ¿Aplica? | Motivo |
|--------|----------|--------|
| **APTO PARA MERGE** | Casi | Solo micro-gaps de pointers (§5.6, §10) no bloquean corrección normativa |
| **APTO PARA MERGE CON AJUSTES** | **Sí** | 4 ajustes menores §6.1 mejoran navegación; cero bloqueantes |
| **NO APTO PARA MERGE** | No | No hay colisiones, contradicciones ni conflictos de precedencia |

### Decisión recomendada

**Proceder con la incorporación V2.1** aplicando el plan `ERP_V2_1_INSERTION_PLAN.md` en el orden §5 del plan, con:

1. **INS-V2-08** incluido (aprobado).
2. **PB-14** como **SHOULD** en V2 solamente.
3. **Ajustes A-1 y A-2** incorporados al mismo PR si el revisor lo desea (5 minutos adicionales).
4. **A-3 y A-4** opcionales — mejora checklist, no requisito de corrección.

Tras merge: ejecutar revisión rápida de pointers §5.6 / §10 / §13.1 y cerrar QA proceso (R-PROC-01).

---

## 11. Referencias

| Documento | Rol en esta auditoría |
|-----------|----------------------|
| `ERP_V2_1_INSERTION_PLAN.md` | Objeto de validación |
| `ERP_V2_DOCUMENTATION_AUDIT.md` | Análisis previo (contiene 2 referencias obsoletas PB-09/B11-11 — no normativo) |
| `ERP_FRONTEND_STANDARDS_V2.md` | Baseline v2.0 |
| Evidencia código ORG+INV | Implementación ya alineada con reglas a normar |

---

*Auditoría de redundancia completada. Ningún archivo normativo modificado.*
