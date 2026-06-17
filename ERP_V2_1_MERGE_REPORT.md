# ERP Frontend Standards — Reporte merge V2.1

**Fecha:** 10 junio 2026  
**Estado:** **Merge completado** — solo documentación normativa  
**Base:** `ERP_V2_1_INSERTION_PLAN.md` + `ERP_V2_1_REDUNDANCY_CHECK.md`  
**Versión resultante:** **V2.1**

---

## 1. Resumen ejecutivo

| Métrica | Valor |
|---------|--------|
| Archivos modificados | **3** |
| Líneas netas (git diff) | **+104 / −11** |
| IDs nuevos incorporados | **18** |
| IDs existentes renumerados | **0** |
| Reglas existentes eliminadas | **0** |
| Capítulos reescritos | **0** |
| Cambios de código | **0** |

Incorporación aditiva de estándares validados en ORG+INV: stacking modal, acciones fila por `es_activo`, semántica `ConfirmDialog`, clasificación modal Tipo A/B/C.

---

## 2. Archivos modificados

| Archivo | Inserciones plan | Ajustes extra | Δ líneas (git) |
|---------|------------------|---------------|----------------|
| `ERP_FRONTEND_STANDARDS_V2.md` | INS-V2-00…16 | A-1, A-2, INS-V2-08 | +84 / −4 |
| `.cursorrules` | INS-CR-01…05 | — | +7 / −1 |
| `docs/prompts/PROMPT_FRONTEND_MAESTRO.md` | INS-PR-01…08 | — | +24 / −1 |

---

## 3. Inserciones ejecutadas

### 3.1 `ERP_FRONTEND_STANDARDS_V2.md`

| ID plan | Descripción | Estado |
|---------|-------------|--------|
| INS-V2-00 | Metadatos v2.1 (cabecera) | ✅ |
| INS-V2-01 | AP-13, AP-14 en §3.2 | ✅ |
| INS-V2-02 | §5.10 RB-ROW-01…03 | ✅ |
| INS-V2-03 | PB-13, PB-14 en §6.3 + ref. audit | ✅ |
| INS-V2-04 | B11-10, B11-11 en §7.1 | ✅ |
| INS-V2-05 | §7.1.1 MD-01…04 | ✅ |
| INS-V2-06 | Patrón B-L en piezas técnicas | ✅ |
| INS-V2-07 | §8.8 UX-05…08 | ✅ |
| INS-V2-08 | Pointer UX-04 → RB-ROW-01 | ✅ |
| INS-V2-09 | Fila referencia ORG §9.2 | ✅ |
| INS-V2-10 | Filas referencia INV §9.3 | ✅ |
| INS-V2-11 | Gate 2 §11.3 | ✅ |
| INS-V2-12 | Gate 3 B-L §11.4 | ✅ |
| INS-V2-13 | Gate 4 §11.5 | ✅ |
| INS-V2-14 | Changelog §13 v2.1 | ✅ |
| INS-V2-15 | Índice referencias cruzadas | ✅ |
| INS-V2-16 | Matriz anti-redundancia | ✅ |
| **A-1** | §5.6 pointer §8.8 | ✅ |
| **A-2** | §10 ConfirmDialog → §8.4, §8.8 | ✅ |

### 3.2 `.cursorrules`

| ID plan | Descripción | Estado |
|---------|-------------|--------|
| INS-CR-01 | RB-ROW pointer Plantilla A | ✅ |
| INS-CR-02 | Stacking B-L pointer | ✅ |
| INS-CR-03 | Variants ConfirmDialog (Feedback) | ✅ |
| INS-CR-04 | B11-10/11 pointer Modales | ✅ |
| INS-CR-05 | Evaluación código ítems 7–8 | ✅ |

### 3.3 `PROMPT_FRONTEND_MAESTRO.md`

| ID plan | Descripción | Estado |
|---------|-------------|--------|
| INS-PR-01 | Reglas ❌ stacking / RB-ROW / UX-05 | ✅ |
| INS-PR-02 | Reglas ✅ RB-ROW + §8.8 | ✅ |
| INS-PR-03 | Checklist acciones fila Plantilla A | ✅ |
| INS-PR-04 | Checklist stacking B-L | ✅ |
| INS-PR-05 | Normas transversales §5.10, §8.8 | ✅ |
| INS-PR-06 | Fase 3 ítems 11–12 | ✅ |
| INS-PR-07 | Gate 2 M1 RB-ROW / UX | ✅ |
| INS-PR-08 | Gate 3 B-L PB-13/14 | ✅ |

---

## 4. IDs incorporados (18 nuevos)

| ID | Nivel | Hogar V2.1 |
|----|-------|------------|
| **AP-13** | Anti-patrón | §3.2 |
| **AP-14** | Anti-patrón | §3.2 |
| **B11-10** | MUST NOT | §7.1 |
| **B11-11** | MUST | §7.1 |
| **PB-13** | MUST | §6.3 B-L |
| **PB-14** | **SHOULD** | §6.3 B-L |
| **RB-ROW-01** | MUST | §5.10 |
| **RB-ROW-02** | MUST | §5.10 |
| **RB-ROW-03** | MUST | §5.10 |
| **MD-01** | MUST | §7.1.1 |
| **MD-02** | MUST | §7.1.1 |
| **MD-03** | MUST | §7.1.1 |
| **MD-04** | MUST | §7.1.1 |
| **UX-05** | MUST / MUST NOT | §8.8 |
| **UX-06** | MUST | §8.8 |
| **UX-07** | MUST | §8.8 |
| **UX-08** | MUST | §8.8 |

**ID existente extendido (no renumerado):** **UX-04** — pointer a RB-ROW-01 (INS-V2-08).

**IDs existentes preservados sin cambio de numeración:** AP-01…11, AP-12 (§9.1), PB-01…12, B11-01…09, UX-01…03, ME-*, AUTH-*, IMP-*, API-*, SEC-*, CD-*, etc.

---

## 5. Ajustes A-1 y A-2 aplicados

### A-1 — Pointer §5.6 → §8.8

**Ubicación:** §5.6 Modal CRUD, línea bajo tabla PA-03…08.

**Texto resultante:**

```
Stack types/hooks: §8.1. Vocabulario baja: §8.4. Variants `ConfirmDialog`: §8.8 UX-05…08.
```

### A-2 — Pointer §10 ConfirmDialog

**Ubicación:** §10 mapa componentes, fila `ConfirmDialog`.

**Antes:** Estándar `§8.4`  
**Después:** Estándar `§8.4, §8.8`

---

## 6. Validación final de referencias cruzadas

| Referencia | Destino | Estado |
|------------|---------|--------|
| AP-13 → B11-10 | §7.1 | ✅ |
| AP-14 → RB-ROW-02 | §5.10 | ✅ |
| UX-04 → RB-ROW-01 (§5.10) | §5.10 | ✅ |
| MD-04 → B11-10 | §7.1 | ✅ |
| MD-03 → SEC-08 | §7.3 | ✅ |
| UX-07 → B11-02 | §7.1 | ✅ |
| UX-08 → B11-04 | §7.1 | ✅ |
| PB-13/14 → INV_MODAL_STACKING_AUDIT.md | Repo | ✅ |
| §5.10 ↔ §8.6 UX-04 | Índice | ✅ |
| §8.8 ↔ §8.4 UX-01 | Índice + matriz | ✅ |
| .cursorrules → V2 §5.10, §8.8, B11-10 | V2 | ✅ |
| PROMPT → V2 §5.10, §8.8, PB-13/14 | V2 | ✅ |
| §10 ConfirmDialog → §8.4, §8.8 | A-2 | ✅ |

**Referencias inválidas detectadas:** **0**

---

## 7. Validación final de IDs

| Verificación | Resultado |
|--------------|-----------|
| Colisión PB-13/14 vs PB-09…12 B-R | **Sin colisión** — hogares distintos (§6.3 vs §6.4) |
| B11-10/11 vs B11-01…09 | **Secuencia válida** |
| UX-05…08 vs UX-01…04 | **Secuencia válida** |
| AP-13/14 vs AP-12 (§9.1 IAM) | **Sin colisión** — AP-12 permanece en §9.1 |
| RB-ROW vs RB-01/02 (§8.3) | **Prefijos distintos** — sin colisión |
| PB-14 nivel SHOULD en V2 | **Confirmado** — línea §6.3: `SHOULD defensa en profundidad` |

---

## 8. Resumen de cambios por archivo

### `ERP_FRONTEND_STANDARDS_V2.md`

- Versión **2.0 → 2.1**; fecha 10 junio 2026.
- **§3.2:** +AP-13, AP-14.
- **§5.6:** pointer §8.8 (A-1).
- **§5.10:** nueva sección RB-ROW (3 reglas).
- **§6.3:** +PB-13 (MUST), PB-14 (SHOULD); ref. stacking audit.
- **§7.1:** +B11-10, B11-11; §7.1.1 MD-01…04; patrón B-L en piezas técnicas.
- **§8.6:** UX-04 pointer RB-ROW (INS-V2-08).
- **§8.8:** nueva sección UX-05…08.
- **§9.2 / §9.3:** filas referencia ORG/INV.
- **§10:** ConfirmDialog §8.4, §8.8 (A-2).
- **§11.3–11.5:** ítems Gate 2/3/4.
- **§13:** changelog 2.1.
- Índice + matriz anti-redundancia actualizados.

### `.cursorrules`

- Plantilla A: pointer RB-ROW.
- Plantilla B: pointer stacking B11-10, PB-13/14.
- Feedback: variants UX-05…08 (reemplazo línea ambigua «aprobar»).
- Modales: pointer B11-10/11, AP-13.
- Evaluación código: ítems 7–8.
- **Sin cambios** en diseño 2 capas, ME, API, IAM.

### `PROMPT_FRONTEND_MAESTRO.md`

- 3 reglas ❌ + 2 reglas ✅ nuevas.
- Checklists Plantilla A (RB-ROW) y B-L (stacking + MD).
- Normas transversales ampliadas.
- Fase 3 ítems 11–12; Gates M1/M2 ampliados.
- **Sin cambios** en Fase 0 OpenAPI ni M0 multiempresa.

---

## 9. Evidencia: reglas existentes no eliminadas

### 9.1 Muestreo IDs críticos pre-merge — presentes post-merge

| ID | Sección | Presente |
|----|---------|----------|
| ME-01 … ME-06 | §4.3 | ✅ |
| API-01 … API-04 | §8.1 | ✅ |
| AP-01 … AP-11 | §3.2 | ✅ |
| AP-12 | §9.1 IAM | ✅ |
| PB-09 … PB-12 | §6.4 B-R | ✅ |
| B11-01 … B11-09 | §7.1 | ✅ |
| UX-01 … UX-03 | §8.4, §8.6 | ✅ |
| IAM-REF-01 | §9.1 | ✅ |
| Precedencia OpenAPI > V2 > .cursorrules > PROMPT | §0, §3.1 | ✅ |

### 9.2 Áreas explícitamente no tocadas

| Área | Verificación |
|------|--------------|
| §4 Multiempresa (ME-*, AUTH-*, IMP-*) | Sin modificaciones |
| §8.1 API (API-*) | Sin modificaciones |
| §9.1 IAM | Sin modificaciones (solo AP-12 intacto) |
| `.cursorrules` diseño 2 capas | Sección completa intacta |
| §6.5 CD-* / §7.2 SEC-* transaccional | Sin modificaciones |

### 9.3 Única edición de regla existente

| ID | Tipo cambio | Alcance |
|----|-------------|---------|
| **UX-04** | Pointer a RB-ROW-01 | Celda regla §8.6 — semántica MUST preservada |

**Líneas eliminadas (git −11):** sustitución puntual UX-04, Feedback `.cursorrules`, footer V2; **ninguna fila normativa completa removida**.

---

## 10. Restricciones cumplidas

| Restricción | Cumplida |
|-------------|----------|
| INS-V2-08 aprobado | ✅ |
| PB-14 SHOULD en V2 | ✅ |
| Sin renumerar IDs | ✅ |
| Sin eliminar reglas | ✅ |
| Sin alterar precedencia | ✅ |
| Sin tocar ME / API / IAM / 2 capas | ✅ |
| Sin cambios de código | ✅ |

---

## 11. Próximos pasos sugeridos (fuera de este merge)

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | Banner «Incorporado en V2.1» en `ERP_V2_STANDARDS_PROPOSAL.md` | Baja |
| 2 | Cerrar QA ☐ P1 modales + RB-ROW | Media |
| 3 | Actualizar §13.1 «acción pendiente derivados» en próxima revisión | Baja |

---

## 12. Veredicto merge

| Pregunta | Respuesta |
|----------|-----------|
| ¿Merge V2.1 completado? | **Sí** |
| ¿Documentación coherente? | **Sí** |
| ¿Listo para uso normativo? | **Sí** |

---

*Reporte generado tras merge documental V2.1. Sin commit automático.*
