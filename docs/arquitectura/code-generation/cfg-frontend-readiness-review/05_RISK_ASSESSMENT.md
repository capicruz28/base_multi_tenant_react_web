# CFG Readiness — Risk Assessment

**Versión:** 1.0  
**Escala:** Bloquea Wave 0 | Alto | Medio | Bajo

---

## Matriz de riesgos (§21–30)

| # | Categoría | Riesgo principal | Severidad vs W0 | Mitigación documental |
|---|-----------|------------------|:---------------:|------------------------|
| 21 | Técnico | OpenAPI ausente → types incompletos | Bajo (W0) / Medio (W1+) | Tipar contrato §7; alinear snapshot |
| 22 | Arquitectónico | Acoplar FCE al admin | Medio (disc.) | MUST NOT imports; review W0+ |
| 23 | Integración | LBAC `cfg.ver` ≠ códigos `consultar` | Medio (QA) | Dual gate; coordinar roles |
| 24 | Mantenimiento | Cross-import ORG dirty desde cfg | Bajo | Patrón ya usado INV→ORG |
| 25 | Regresión | Touch `app-route-tree` / erp-modules | Medio | PR W0 pequeño; smoke otras rutas |
| 26 | Performance | List sin page / full-load | Bajo W0 (stub) | forcePagination desde W2/W3 |
| 27 | UX | Preview como allocate; Create UI | Bajo W0 | Guardrails; W5 copy |
| 28 | Testing | Falta fixtures hasta W1 | Bajo W0 | Spec 08 calendariza tests |
| 29 | Deployment | Menú Backend ausente en env | Bajo W0 | URL directa; menú para E2E |
| 30 | Merge | PR W2 auth wiring amplio | Medio W2 | Un PR/wave; revert plan Spec 09 |

---

## Detalle por categoría

### 21 — Técnico

- Service/hooks bien especificados.
- Riesgo real: drift OpenAPI cuando llegue snapshot — proceso de alinear types en W1, no reabrir diseño.

### 22 — Arquitectónico

- Separación FCE/CFG consistente en toda la cadena.
- No hay propuesta de company gate ni shell admin.

### 23 — Integración

- Session `'org-inv'` (W-03): al implementar W2 incluir CFG en ese case.
- Menú dinámico: dependencia Backend fuera del FE.

### 24 — Mantenimiento

- Feature autocontenido; invalidate helpers espejo INV.
- Deuda aceptada: badges/preview locales (YAGNI shared).

### 25 — Regresión

- W0 toca router global → riesgo controlado (mismo patrón que módulos existentes).
- W2 toca auth invalidate → mayor; no es W0.

### 26 — Performance

- Tier B + limit 50 documentado.
- Preview one-shot sin cache spam.

### 27 — UX

- Empty/loading/error/dirty/B11 especificados.
- Riesgo: W3 sin acciones Ver puede confundir QA — Spec lo declara; comunicar en PR3.

### 28 — Testing

- Pirámide clara; W0 puede mergear con tsc + smoke manual A0.
- P0 hooks obligatorios desde W2.

### 29 — Deployment

- Feature flag no requerido.
- Sin migraciones FE.
- Dependencia ops: menú + permisos en ambiente.

### 30 — Merge

- Estrategia 1 PR/wave reduce conflictos.
- Rollback documentado.
- No mergear W(n+1) si W(n) falla acceptance.

---

## Riesgos que NO bloquean Wave 0

Todos los ítems anteriores: **ninguno** tiene severidad “Bloquea Wave 0”.

---

## Top 5 a vigilar post-GO

1. Disciplina no-FCE en reviews  
2. Dual RBAC roles Backend  
3. W2 session invalidate incluye CFG  
4. OpenAPI snapshot timing  
5. No adelantar UI W3/W4 en PR de W0/W1  
