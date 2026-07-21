# CFG Frontend — Matriz Acceptance / Review / DoD

**Versión:** 1.0  
**Fecha:** 2026-07-18  
**Leyenda:** ✓ = evidenciado en código/tests · ~ = parcial / smoke manual · ○ = ops externo

---

## 1. Acceptance por Wave (Spec 11)

### Wave 0

| ID | Estado |
|----|:------:|
| A0.1–A0.5 | ✓ (ruta, guard, registros; smoke E2E ops) |

### Wave 1

| ID | Estado |
|----|:------:|
| A1.1–A1.4 | ✓ |

### Wave 2

| ID | Estado |
|----|:------:|
| A2.1–A2.5 | ✓ |

### Wave 3

| ID | Estado |
|----|:------:|
| A3.1–A3.6 | ✓ |

### Wave 4

| ID | Estado |
|----|:------:|
| A4.1–A4.6 | ✓ |
| A4.7 Dirty discard | ✓ código · ~ test página |
| A4.8 Field errors 422 | ✓ código + utils tests |

### Wave 5

| ID | Estado |
|----|:------:|
| A5.1–A5.6 | ✓ |
| A5.7 Contrato 07 A–J | ✓ estático · ○ J OpenAPI snapshot |

**DoD Waves:** cumplido a nivel implementación + suites; A4.7/A5.7 con matices documentados.

---

## 2. Review Checklist (Spec 10) — consolidado

| Wave | Ítems review | Resultado |
|------|--------------|:---------:|
| W0 | Types, permissions, ERP registries, stub, sin FCE | ✓ |
| W1 | Service 6 métodos, utils, tests | ✓ |
| W2 | Keys, ErpList, mutations, preview no-inv, auth ×3 | ✓ |
| W3 | Sin Create/empresa, toolbar/empty/skeleton/pager, badges | ✓ |
| W4 | Edit detail, readonly/locked, PATCH, B11, RB-ROW, stay-open | ✓ |
| W5 | Disclaimer, NOT_ALLOWED, inactive, a11y, no invalidate | ✓ |

---

## 3. Blueprint DoD módulo (§3 Checklist post-implementación)

| Ítem | Estado |
|------|:------:|
| Menú/ruta exigen consultar | ✓ FE · ○ menú Backend |
| Solo lectura sin actualizar | ✓ |
| List GET + filtros MVP + page | ✓ |
| Detail + locked UX | ✓ |
| PATCH solo formato | ✓ |
| DELETE / reactivar + confirms | ✓ |
| Preview + disclaimer + no invalidate | ✓ |
| Errores mapa contrato | ✓ |
| Sin create/align/fiscal | ✓ |
| 6 operationIds | ✓ |
| Norma V2 (TB/SR/SK/ES/LR/PR/RB-ROW/B11/ME-02/UX-01/ER-02/E-ME4) | ✓ |
| ERP registries + feature sin FCE | ✓ |
| Tests P0/P1 verdes | ✓ (51) |
| Invalidación sesión CFG | ✓ |
| UX smoke manual | ~ (responsabilidad QA/ops) |

---

## 4. Definition of Done (Blueprint 11 §4)

| Criterio DoD | Estado |
|--------------|:------:|
| 1. Waves 0–5 implementadas | ✓ |
| 2. Checklist §3 completo (FE) | ✓ con ○ ops |
| 3. Contrato 07 A–J verificable | ✓ estático · ~ integración |
| 4. Sin superficies fuera de alcance | ✓ |
| 5. Sin desviaciones no documentadas | ✓ (obs. catalogadas) |
| 6. Sign-off review técnico | **Este paquete** |

---

## 5. Conclusión matriz

El módulo cumple el **DoD Frontend MVP** a nivel de código y tests automatizados. Los ítems marcados ○/~ no invalidan la certificación FE; se gestionan como condiciones de go-live operativo.
