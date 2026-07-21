# CFG Frontend — Certificación de Arquitectura

**Versión:** 1.0  
**Fecha:** 2026-07-18  
**Referencias:** Blueprint `01`–`05`, Spec `01`–`07`, Baseline ERP V1 / V2 (plantilla A/A+)

---

## 1. Ubicación y estructura

**Root:** `src/features/cfg/`

| Capa | Estado vs Blueprint |
|------|:-------------------:|
| `routes.tsx` | PASS |
| `constants/` (permissions, list, scope-labels) | PASS |
| `types/` (cfg, list, discard) | PASS |
| `services/cfg-secuencias.service.ts` | PASS |
| `utils/` (invalidate, form, dirty, error, display) | PASS |
| `hooks/` (keys, defaults, list, detail, 4 mutations) | PASS |
| `components/` (Edit, Preview, Badges, Locked, FormatoFields) | PASS |
| `pages/SecuenciasPage.tsx` | PASS |
| Tests colocalizados + fixtures | PASS |
| `index.ts` (opcional) | Ausente — aceptable |

**No existen** artefactos prohibidos: CreateDialog, página detalle `:id`, align/fiscal, admin FCE.

---

## 2. Routing y registros plataforma

| Punto | Evidencia | Resultado |
|-------|-----------|:---------:|
| Feature router index → `secuencias` | `routes.tsx` | PASS |
| Lazy + Suspense page | `routes.tsx` | PASS |
| `app-route-tree` path `cfg/*` | `src/app/router/app-route-tree.tsx` | PASS |
| `PermissionGuard module="cfg" action="ver"` | mismo | PASS |
| `ERP_MODULES` entrada CFG | `erp-modules.ts` | PASS |
| `ERP_ROUTE_SEGMENTS` incluye `'cfg'` | `post-login-path.ts` | PASS |
| Gate página `cfg.secuencias.consultar` | `SecuenciasPage` → `/unauthorized` | PASS |

**RBAC dual (D9 / Readiness W-05):** LBAC `cfg.ver` (menú/ruta) + negocio `cfg.secuencias.consultar|actualizar`. Diseño intencional; no es defecto.

---

## 3. Capas de datos

### Service

- 6 métodos = 6 operationIds documentados en JSDoc.
- Paths relativos `/cfg/secuencias…` con `baseURL` `/api/v1` → contrato `/api/v1/cfg/…`.
- PATCH tipado sin `es_activo`.
- Preview POST sin body.
- Sin fetch desde pages/components (solo hooks).

### React Query

| Aspecto | Resultado |
|---------|:---------:|
| Prefijo `['cfg']` | PASS |
| List via `useErpListQuery` + `forcePagination` | PASS |
| Detail via `useTenantQuery` + `refetchOnMount: 'always'` | PASS |
| Sin company query gate | PASS |
| Mutations escritura: toast ER-02 + invalidate list+detail | PASS |
| Preview: **no** invalidate | PASS |
| Spec oficial: invalidate vs `setQueryData` frágil | PASS |

### Session / Auth wiring

`invalidateCfgQueries` cableado en:

1. `session-rq-invalidation.ts` (case `'org-inv'`)
2. `auth-provider-public-actions.ts`
3. `auth-provider-auth-sync.compositor.ts`

Cumple Readiness W-03. Nombre legacy `'org-inv'` conservado a propósito (observación O-05).

---

## 4. UI / UX arquitectura

| Plantilla / norma | Cumplimiento |
|-------------------|:------------:|
| Plantilla A/A+ listado | PASS |
| Tier B + `ErpPagination` | PASS |
| TB-01 sin H1 body | PASS |
| ME-02 sin selector empresa | PASS |
| RB-ROW activo/inactivo + lock | PASS |
| B11 dirty + OrgDiscard + B11-10/11 | PASS |
| UX-01 Desactivar/Reactivar | PASS |
| E-ME4 sin UUID en UI | PASS |
| Tokens Capa 1 / brand solo CTA primaria Guardar | PASS |
| Dialog permanece tras PATCH OK (D5b) | PASS |
| Preview disclaimer + no reserva | PASS |

---

## 5. Dependencias permitidas vs prohibidas

| Tipo | Estado |
|------|--------|
| Reuso ORG (`OrgPageLayout`, discard, FormSection, dirty helpers) | PASS |
| Reuso shared erp-list / Dialog / ConfirmDialog | PASS |
| Import `@/core/codigo` (FCE) | **0** — PASS |
| Import Create / align / fiscal | **0** — PASS |
| `any` TypeScript en feature | **0** — PASS |

---

## 6. Escalabilidad y performance

| Tema | Evaluación |
|------|------------|
| Listado server-side page/limit/sort | Adecuado Tier B |
| staleTime list 45s / detail 30s | Conforme Blueprint |
| Filter signature en queryKey | Aislamiento de caché correcto |
| Preview one-shot mutation (no source of truth) | Correcto |
| Filtro módulo hardcode ORG/INV | Limitación MVP (O-03), no deuda estructural |

---

## 7. Dictamen arquitectura

**PASS** a nivel estructural y de patrones de plataforma.

No se requieren refactors arquitectónicos para certificación. Observaciones en `05_OBSERVATIONS_AND_RISKS.md`.
