# CFG Frontend — Certificación de Tests

**Versión:** 1.0  
**Fecha:** 2026-07-18  
**Evidencia:** `npx vitest run src/features/cfg` → **12 files / 51 tests PASS**

---

## 1. Inventario

| Archivo | Casos (aprox.) | Capa |
|---------|---------------:|------|
| `services/__tests__/cfg-secuencias.service.test.ts` | 6 | Service P0 |
| `hooks/__tests__/cfg-hooks.test.ts` | 7 | RQ P0 |
| `utils/__tests__/invalidate-cfg-queries.test.ts` | 4 | Cache P0 |
| `utils/__tests__/cfg-secuencia-form.utils.test.ts` | 7 | Form/dirty P0 |
| `utils/__tests__/cfg-error.utils.test.ts` | 4 | Errores P0 |
| `utils/__tests__/cfg-display.utils.test.ts` | 3 | E-ME4 P0 |
| `pages/__tests__/SecuenciasPage.test.tsx` | 5 | Page smoke |
| `components/__tests__/CfgSecuenciaEditDialog.test.tsx` | 4 | Edit P1 |
| `components/__tests__/CfgSecuenciaPreviewDialog.test.tsx` | 4 | Preview P1 |
| `components/__tests__/CfgSecuenciaFormatoFields.test.tsx` | 3 | Fields P1 |
| `components/__tests__/CfgSecuenciaStatusBadges.test.tsx` | 3 | Badges |
| `components/__tests__/CfgLockedBanner.test.tsx` | 1 | Locked |
| Auth: `session-rq-invalidation.test.ts` (CFG assert) | 1+ | Session W2 |

**Total feature CFG:** 51 tests verdes.

---

## 2. Cobertura vs Spec Testing / Blueprint

| Requisito P0/P1 | Cubierto | Notas |
|-----------------|:--------:|-------|
| 6 métodos service + operationIds | Sí | |
| PATCH sin `es_activo` | Sí | |
| Preview POST sin body | Sí | |
| Preview no invalidate list | Sí | Hook test |
| Invalidate keys | Sí | |
| Update dirty-only payload | Sí | |
| Error codes → field/locked/preview | Sí | |
| Display nunca UUID | Sí | |
| Edit readonly / locked / save / desactivar callback | Sí | |
| Preview disclaimer / inactive / NOT_ALLOWED | Sí | |
| Page unauthorized / no Crear / Preview / Desactivar | Sí | |
| Dirty discard página (OrgDiscard) | **Parcial** | Gap O-02 |
| Consultar-only: ocultar Desactivar/Reactivar en fila | **Parcial** | EditDialog sí; page no |
| B11-10 assert explícito | **Parcial** | Lógica presente; test fino ausente |
| E2E Playwright | No | Explicit No-DoD Blueprint |

---

## 3. Calidad de la suite

| Atributo | Evaluación |
|----------|------------|
| Aislamiento (mocks service/tenant/toast) | Adecuado |
| Fixtures estables | Sí (`cfg-secuencia.fixtures.ts`) |
| Warnings `act(...)` en page tests | Presentes; no fallan CI |
| Regresión auth CFG en `'org-inv'` | Cubierta |

---

## 4. Dictamen tests

**PASS WITH OBSERVATIONS** — P0 sólido; P1 UI suficiente para certificación con seguimiento O-02 (ampliar tests página B11/RBAC consultar-only en backlog no bloqueante).

E2E completo **no** es requisito DoD Frontend MVP (Blueprint `11` §5).
