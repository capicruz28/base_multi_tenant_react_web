# Informe de Actualización — `.cursorrules` (Etapa 2)

**Documento:** `CURSORRULES_UPDATE_REPORT.md`  
**Versión:** 1.0.0  
**Fecha:** 2026-06-24  
**Alcance:** Etapa 2 — sincronización `.cursorrules` con `ERP_FRONTEND_STANDARDS_V2.md` v2.5  
**Fuente de verdad:** `FRONTEND_MASTER_DOCUMENTS_UPDATE_PLAN.md` (§8.2 B-09, B-10, B-11)  

**Archivo modificado:** `.cursorrules` (mismo nombre físico)  
**No modificados:** `ERP_FRONTEND_STANDARDS_V2.md`, `docs/prompts/PROMPT_FRONTEND_MAESTRO.md`

---

## 1. Cambios realizados

| ID plan | Ubicación | Acción |
|---------|-----------|--------|
| **B-09** | L10 — Norma ERP | Actualizar «CONGELADO» → «Normativo» + pointer §4.8.4 |
| **B-10** | § ERP MULTIEMPRESA JWT (~L175–177) | Agregar bullet identidad sesión V2 + ampliar bullet auth existente |
| **B-11** | Checklist evaluación código (~L115–116) | Agregar ítems 13 y 14 condicionales |

**Total líneas netas:** +4 (3 ediciones puntuales, sin reestructuración).

---

## 2. Reglas agregadas

### Checklist evaluación (B-11)

| # | Texto |
|---|-------|
| **13** | ¿Código de sesión usa `session_id` (no `token_id` como ID) vía V2 §4.8.4? — solo si aplica API sesiones |
| **14** | ¿Impersonación bloquea cambio empresa (IMP-05)? |

### Bloque MULTIEMPRESA / Auth (B-10)

| Pointer | Contenido |
|---------|-----------|
| Nuevo bullet | Identidad sesión V2: V2 §4.8.4 AUTH-V2-*; IMP-05 impersonación empresa |

---

## 3. Reglas actualizadas

| Ubicación | Antes | Después |
|-----------|-------|---------|
| L10 Norma ERP | `(CONGELADO — única fuente normativa UX/plataforma)` | `(Normativo — única fuente normativa UX/plataforma; revisión §4.8.4 auth V2)` |
| Bullet auth/impersonation | `V2 §4.8 AUTH-xx, IMP-xx` | `V2 §4.8 AUTH-xx, IMP-xx (§4.8.4 AUTH-V2-* si API sesiones)` |

---

## 4. Reglas eliminadas

| Texto eliminado | Ubicación | Motivo |
|-----------------|-----------|--------|
| Literal **CONGELADO** | L10 | C-02 plan — alinear con V2 v2.5 «Normativo» |

**No eliminado:** ítems checklist 1–12, integridad API, ME-*, plantillas, §5.11, diseño 2 capas, Baseline, precedencia.

---

## 5. Diff lógico

```
L10
  - CONGELADO
  + Normativo; revisión §4.8.4 auth V2

Checklist evaluación (ítems 1–12 intactos)
  + 13 session_id vs token_id (§4.8.4, condicional)
  + 14 IMP-05 impersonación empresa

ERP — MULTIEMPRESA JWT
  ~ Auth / impersonation bullet (+ §4.8.4 condicional)
  + Identidad sesión V2: §4.8.4 AUTH-V2-*; IMP-05

SIN CAMBIO:
  Precedencia, integridad API, deprecated, cabecera+detalle,
  E-ME4, errores API, ME-01…ME-10 bullets, Baseline V1,
  Plantilla A/B, §5.11 PERF, dirty forms, RBAC, Gates pointer,
  UX/UI resumen, diseño 2 capas, orden prioridad conflicto
```

---

## 6. Validación contra `FRONTEND_MASTER_DOCUMENTS_UPDATE_PLAN.md`

| Ítem plan §8.2 | Estado |
|----------------|--------|
| B-09 CONGELADO → Normativo | ✅ |
| B-10 bullet §4.8.4 + IMP-05 | ✅ |
| B-11 ítems 13–14 | ✅ |
| No tocar ítems 1–12 | ✅ |
| No incorporar categoría D | ✅ |
| AUD-PH-01 en .cursorrules | ➖ Fuera alcance (solo PROMPT) |
| No duplicar tablas V2 | ✅ (solo pointers) |

---

## 7. Validación sincronización con `ERP_FRONTEND_STANDARDS_V2.md` v2.5

| Regla V2 | Pointer en `.cursorrules` |
|----------|---------------------------|
| §4.8.4 AUTH-V2-* | L10, bullet identidad sesión, ítem 13 |
| IMP-05 | Bullet identidad sesión, ítem 14 |
| IMP-01…04 (existente) | Bullet auth/impersonation preservado |
| §4.8.3 Baseline / AuthContext | Sin cambio |
| §9.1 IAM (no Active Sessions) | Sin referencia a paneles módulo |

**Coherencia semántica:** `.cursorrules` referencia IDs normativos definidos en V2 §4.8.4 y §4.8.2; no redefine tablas completas (principio *write once*).

---

## 8. Validación — sin referencias Active Sessions

```text
rg ActiveSessions|SessionDetail|KpiStrip|SessionAdmin|ToolbarMonitoring|CardsView
→ 0 coincidencias en .cursorrules
```

**Nota:** ítem 13 menciona `session_id` / API sesiones como **regla transversal auth** (AUTH-V2), no como componente Active Sessions.

---

## 9. Autoauditoría READ ONLY

### 9.1 Integridad estructural

| Check | OK |
|-------|-----|
| `alwaysApply: false` frontmatter intacto | ✅ |
| Precedencia OpenAPI > V2 > Baseline > .cursorrules > PROMPT | ✅ |
| Orden secciones sin reordenamiento | ✅ |
| Diseño 2 capas exclusivo aquí | ✅ |
| Gates → V2 §11 pointer | ✅ |

### 9.2 ORG / INV / PERF intactos

| Sección | Modificado |
|---------|------------|
| Plantilla A / ORG E-SEC refs | ❌ No |
| §5.11 PERF block | ❌ No |
| B-L ERP-BL-ACT-01 | ❌ No |
| INV `useInvRbacFormAccess` | ❌ No |

### 9.3 Riesgos

| Riesgo | Evaluación |
|--------|------------|
| Sobre-ingeniería checklist PUR | Mitigado — ítem 13 «solo si aplica API sesiones» |
| Duplicar norma V2 en .cursorrules | Mitigado — solo pointers, sin tablas AUTH-V2 |
| Contaminación Active Sessions | Ausente |

### 9.4 CONGELADO residual

```text
rg CONGELADO .cursorrules → 0 coincidencias
```

---

## 10. Dictamen final

### **A) `.cursorrules` sincronizado correctamente y listo para actualizar `PROMPT_FRONTEND_MAESTRO.md`.**

**Justificación:**

1. B-09, B-10 y B-11 aplicados según plan §8.2.
2. Sincronización con V2 v2.5 (§4.8.4, IMP-05) verificada.
3. Cero referencias Active Sessions; ítems 1–12 y núcleo ERP intactos.
4. Autoauditoría sin hallazgos bloqueantes.

**Próximo paso:** Etapa 3 — `PROMPT_FRONTEND_MAESTRO.md` (plan §8.3: B-12, B-13, B-14, C-03).

---

*Informe Etapa 2. Solo `.cursorrules` modificado en esta entrega.*
