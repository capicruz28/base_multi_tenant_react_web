# CFG — PR Strategy por Wave

**Versión:** 1.0

---

## 1. Principios

1. **Un PR = una Wave** (0–5).
2. PR mergeable de forma independiente hacia la rama de integración acordada.
3. Título convencional: `feat(cfg): waveN <slug>`.
4. Descripción: link a Spec + Blueprint wave + checklist aceptación.
5. No mezclar refactors ajenos (FCE, ORG, INV) salvo wiring auth invalidate en W2.

---

## 2. PRs planificados

| PR | Wave | Scope archivos (alto nivel) | Reviewers focus |
|----|------|-----------------------------|-----------------|
| PR0 | 0 | types, constants, erp-modules, route segments, routes, stub page, app-route-tree | routing/RBAC gate |
| PR1 | 1 | service, utils, fixtures, unit tests | API contract fidelity |
| PR2 | 2 | query keys, hooks, invalidate, auth wiring ×3, hook tests | cache matrix |
| PR3 | 3 | badges, SecuenciasPage list, page test | V2 list UX |
| PR4 | 4 | edit dialog, formato fields, locked banner, confirms, dirty | B11 + PATCH |
| PR5 | 5 | preview dialog, wire, hardening, final checklists | disclaimer + DoD |

---

## 3. Criterios de merge por Wave

Comunes a todos:

- [ ] CI verde (lint/tsc/tests del scope)
- [ ] Checklist review `10` de la wave
- [ ] Checklist acceptance `11` de la wave
- [ ] Sin archivos prohibidos
- [ ] Sin `any` nuevo
- [ ] Descripción PR completa

Específicos: exit criteria Blueprint `08` por wave.

---

## 4. Criterios de rollback

| Situación | Acción |
|-----------|--------|
| PR no mergeado | cerrar PR / revert commits locales |
| PR mergeado rompe prod/staging | `git revert` del merge commit del PR de la wave |
| Regresión solo UI wave N | revert PR N; waves N+1 no deben existir aún |
| Auth wiring W2 rompe sesión | revert PR2 prioritario; feature cfg hooks quedan pero sin invalidate global hasta fix |
| Menú Backend ausente | **no** rollback FE; feature accesible por URL directa |

**Regla:** no “forward-fix” saltando waves; si W3 falla, no abrir W4.

---

## 5. Branch naming sugerido

```text
feat/cfg-wave0-foundation
feat/cfg-wave1-service
feat/cfg-wave2-hooks
feat/cfg-wave3-list
feat/cfg-wave4-edit
feat/cfg-wave5-preview
```

---

## 6. Tamaño / riesgo

| Wave | Riesgo merge | Notas |
|------|:------------:|-------|
| 0 | Bajo | toca router global — review cuidadoso |
| 1 | Bajo | aislado feature |
| 2 | Medio | toca auth invalidation |
| 3–5 | Medio | UX; sin cambios API BE |

---

## 7. Hotfix post-DoD

Tras Wave 5, hotfixes: PR `fix(cfg): …` fuera del esquema wave, pero deben actualizar tests y no violar guardrails Blueprint `10`.
