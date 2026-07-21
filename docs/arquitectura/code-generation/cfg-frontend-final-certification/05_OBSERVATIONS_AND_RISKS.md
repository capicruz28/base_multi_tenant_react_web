# CFG Frontend — Observaciones y riesgos

**Versión:** 1.0  
**Fecha:** 2026-07-18  
**Dictamen global:** PASS WITH OBSERVATIONS

---

## 1. Tabla de observaciones

| ID | Descripción | Severidad | Impacto | ¿Bloquea merge? | ¿Bloquea producción FE? | Recomendación |
|----|-------------|:---------:|---------|:---------------:|:-----------------------:|---------------|
| O-01 | En `PREVIEW_NOT_ALLOWED`, `usePreviewCfgSecuencia.onError` hace toast y el dialog muestra `localError` → posible doble feedback | Media | UX confusa puntual | No | No | Backlog: silenciar toast cuando dialog maneja NOT_ALLOWED **sin** cambiar contrato del hook en hotfix; o mapear toast solo a errores no-dialog |
| O-02 | Tests página no cubren OrgDiscard dirty ni fila consultar-only | Media | Riesgo regresión UX B11/RBAC | No | No* | Añadir 2–3 RTL en siguiente PR de hardening |
| O-03 | Select módulo hardcodeado `ORG`/`INV` | Media | Otros módulos de secuencias no filtrables en UI | No | No** | Extender opciones cuando Backend exponga catálogo estable |
| O-04 | OpenAPI snapshot / menú LBAC / roles `cfg.secuencias.*` (Readiness W-01/W-02/W-05) | Media (ops) | Smoke integración / menú | No | Condicionado ops | Seguimiento Backend/ops; tipado FE ya anclado a contrato docs |
| O-05 | Acción RQ sigue llamándose `'org-inv'` aunque invalida CFG | Baja | Claridad para maintainers | No | No | Rename opcional futuro (`module-scoped`) fuera de CFG |
| O-06 | Comentario JSDoc residual Wave 4 sobre Preview en EditDialog | Baja | Documentación local | No | No | Limpiar en chore menor |
| O-07 | Toast en componente ante error GET detail (404/403) | Baja–Media | Matiz ER-02 (no es mutation) | No | No | Aceptable para cierre dialog; opcional unificar mensaje |

\* Producción FE: **sí** con smoke QA manual de discard/RBAC.  
\*\* Si el tenant solo usa ORG/INV en MVP, impacto nulo.

---

## 2. Anti-patrones verificados (ausentes)

| Anti-patrón | Resultado |
|-------------|:---------:|
| Import `@/core/codigo` / FCE | Ausente |
| UI Create secuencia | Ausente |
| Filtro / selector `empresa_id` toolbar | Ausente |
| Company query gate en list | Ausente |
| `setQueryData` en update (frágil tenant) | Ausente |
| `any` en feature | Ausente |
| Preview invalida listado | Ausente |
| Copy que promete “código reservado” | Ausente |
| Mostrar UUID en celdas/tooltips | Ausente (utils E-ME4) |

---

## 3. Riesgos residuales (no bloquean certificación)

| Riesgo | Mitigación actual |
|--------|-------------------|
| Roles Backend incompletos | Gate FE + Unauthorized; menú depende LBAC |
| Drift OpenAPI vs types | Types anclados a contrato FE docs; regenerar cuando exista snapshot |
| Doble lazy route | Observación histórica W0; no funcional |

---

## 4. Clasificación para stakeholders

| Pregunta | Respuesta |
|----------|-----------|
| ¿Hay FAIL arquitectónico? | **No** |
| ¿Hay deuda que exija refactor antes de merge? | **No** |
| ¿Hay deuda que exija fix antes de producción? | **No** (solo smoke + ops) |
| ¿Se autoriza backlog de hardening? | **Sí** (O-01, O-02, O-03, O-06) |
