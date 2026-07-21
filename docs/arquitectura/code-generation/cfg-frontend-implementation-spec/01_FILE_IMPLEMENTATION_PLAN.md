# CFG — Plan de implementación archivo por archivo

**Versión:** 1.0  
**Root feature:** `src/features/cfg/`

---

## 1. Leyenda

| Columna | Significado |
|---------|-------------|
| Wave | Primera wave que crea/completa el archivo |
| Deps | Archivos que deben existir antes |
| DoD archivo | Criterio mínimo para considerar el archivo listo |

---

## 2. Inventario completo (orden de creación)

### Wave 0 — Foundation

| # | Archivo | Responsabilidad | Exports públicos | Deps | DoD archivo |
|---|---------|-----------------|------------------|------|-------------|
| 0.1 | `types/cfg.types.ts` | Schemas API Read/Update/Preview/Scope | named types | — | Compila; campos § contrato |
| 0.2 | `types/cfg-list.types.ts` | Params list + filtros UI | named types | 0.1 | Mapper types listos |
| 0.3 | `types/cfg-discard.types.ts` | `CfgDiscardPending = 'edit' \| null` | type | — | O reexport ORG type documentado |
| 0.4 | `constants/cfg-permissions.ts` | Códigos RBAC | `CFG_PERMISSIONS` | — | 2 códigos exactos |
| 0.5 | `constants/cfg-list.constants.ts` | `SECUENCIAS_LIST_CONFIG` | config + sort whitelist | core/list types | `forcePagination: true` |
| 0.6 | `constants/cfg-scope-labels.ts` | Labels scope | map + helper getLabel | 0.1 | 4 scopes |
| 0.7 | `src/core/constants/erp-modules.ts` | Entrada CFG | (modificar) | — | `codigo CFG`, prefix `cfg` |
| 0.8 | `src/core/routing/post-login-path.ts` | Segmento `cfg` | (modificar) | — | legacy map works |
| 0.9 | `pages/SecuenciasPage.tsx` | **Stub** página | `default` | 0.4 | Texto stub + gate consultar opcional |
| 0.10 | `routes.tsx` | CfgRouter | `default` | 0.9 | index→secuencias |
| 0.11 | `src/app/router/app-route-tree.tsx` | Lazy `cfg/*` | (modificar) | 0.10 | PermissionGuard cfg/ver |

**Imports esperados Wave 0 (ejemplos conceptuales, no código):**

- `routes` → react-router, Suspense, LoadingSpinner, SecuenciasPage
- `app-route-tree` → lazy CfgRouter, PermissionGuard
- page stub → `usePermission`, `CFG_PERMISSIONS`, Navigate

**Externos NO tocar en W0:** menú estático, FCE, OpenAPI file (solo leer si existe).

---

### Wave 1 — Service + utils

| # | Archivo | Responsabilidad | Exports | Deps | DoD |
|---|---------|-----------------|---------|------|-----|
| 1.1 | `services/cfg-secuencias.service.ts` | HTTP 6 métodos | `cfgSecuenciaService` | 0.1, 0.2 | operationIds JSDoc |
| 1.2 | `utils/cfg-display.utils.ts` | Labels, “—”, no UUID | helpers | 0.1, 0.6 | unit tests |
| 1.3 | `utils/cfg-secuencia-form.utils.ts` | validate + build PATCH | helpers | 0.1 | unit tests |
| 1.4 | `utils/cfg-secuencia-dirty.utils.ts` | normalize formato | helpers | 0.1 | unit tests |
| 1.5 | `utils/cfg-error.utils.ts` | internal_code map | helpers + CFG_ERROR_CODES | contrato errores | unit tests |
| 1.6 | tests service/utils | Ver 08 | — | 1.1–1.5 | P0 verdes |

**Imports service:** `api` from `@/core/api/api`; types from `../types`.  
**MUST NOT:** toast, react-query, pages.

---

### Wave 2 — React Query

| # | Archivo | Responsabilidad | Exports | Deps | DoD |
|---|---------|-----------------|---------|------|-----|
| 2.1 | `hooks/cfg-query-keys.ts` | Factory keys | `cfgQueryKeys` | — | shape Blueprint |
| 2.2 | `hooks/cfg-query-defaults.ts` | staleTimes | constants | — | 45s/30s |
| 2.3 | `utils/invalidate-cfg-queries.ts` | invalidate/remove | helpers + prefix | 2.1 | mirrors INV |
| 2.4 | `hooks/useCfgSecuenciasErpList.ts` | list query | hook | 1.1, 0.5, 2.1–2.2 | forcePagination |
| 2.5 | `hooks/useCfgSecuencia.ts` | detail query | hook | 1.1, 2.1–2.2 | enabled gate |
| 2.6 | `hooks/useUpdateCfgSecuencia.ts` | PATCH mutation | hook | 1.1, 2.3 | toast+invalidate |
| 2.7 | `hooks/useDesactivarCfgSecuencia.ts` | DELETE | hook | 1.1, 2.3 | toast+invalidate |
| 2.8 | `hooks/useReactivarCfgSecuencia.ts` | POST reactivar | hook | 1.1, 2.3 | toast+invalidate |
| 2.9 | `hooks/usePreviewCfgSecuencia.ts` | POST preview | hook | 1.1 | **no** list invalidate |
| 2.10 | Session invalidation wiring | Llamar `invalidateCfgQueries` | (modificar) | 2.3 | 3 archivos auth |
| 2.11 | hook tests | P0 | — | 2.4–2.9 | verdes |

**Archivos auth a modificar (Wave 2.10)** — mismo patrón ORG/INV:

1. `src/core/auth/provider/auth-provider-public-actions.ts`
2. `src/core/auth/provider/auth-provider-auth-sync.compositor.ts`
3. `src/core/auth/session/session-rq-invalidation.ts`

Añadir `invalidateCfgQueries(queryClient)` junto a `invalidateOrgQueries` / `invalidateInvQueries`.

---

### Wave 3 — Listado read-only

| # | Archivo | Responsabilidad | Exports | Deps | DoD |
|---|---------|-----------------|---------|------|-----|
| 3.1 | `components/CfgSecuenciaStatusBadges.tsx` | Badges fila/dialog | named | 0.1 | 3 badges |
| 3.2 | `pages/SecuenciasPage.tsx` | Listado completo RO | default | 2.4, 3.1 | toolbar+table+pager |
| 3.3 | page test smoke | filtros → page 1 | — | 3.2 | RTL |

**W3 MUST NOT:** Confirm lifecycle, Edit Dialog completo, Preview Dialog (Preview botón puede existir disabled o no render hasta W5).  
**Decisión Spec:** en W3, acción fila = solo **Ver** (abre nada aún) **o** Ver no-op documentado; preferible **no abrir dialog** hasta W4. Botón Ver puede setear `editId` solo si Edit stub mínimo; **Spec oficial:** W3 sin dialogs — solo listado. Ver/Editar aparecen en W4.

---

### Wave 4 — Edit + lifecycle

| # | Archivo | Responsabilidad | Exports | Deps | DoD |
|---|---------|-----------------|---------|------|-----|
| 4.1 | `components/CfgLockedBanner.tsx` | Banner locked | named | — | copy contrato |
| 4.2 | `components/CfgSecuenciaFormatoFields.tsx` | Inputs formato | named | 1.3 | field errors |
| 4.3 | `components/CfgSecuenciaEditDialog.tsx` | Detail+edit | named | 2.5, 2.6, 4.1–4.2 | dirty B11 |
| 4.4 | `pages/SecuenciasPage.tsx` | Orquestar edit+confirms | default | 4.3, 2.7, 2.8 | B11-10/11 |
| 4.5 | tests dialog/page | RBAC+dirty+confirm | — | 4.3–4.4 | P1 |

---

### Wave 5 — Preview + hardening

| # | Archivo | Responsabilidad | Exports | Deps | DoD |
|---|---------|-----------------|---------|------|-----|
| 5.1 | `components/CfgSecuenciaPreviewDialog.tsx` | Preview UX | named | 2.9 | disclaimer |
| 5.2 | `pages/SecuenciasPage.tsx` | Wire preview fila+edit | default | 5.1 | no invalidate |
| 5.3 | `index.ts` (opcional) | reexports mínimos | named | — | o omitir |
| 5.4 | tests preview + a11y pass | — | — | 5.1–5.2 | DoD módulo |

---

## 3. Grafo de dependencias (resumen)

```text
types/constants
    → service → form/error/display utils
        → query-keys → invalidate → hooks
            → badges → SecuenciasPage (list)
                → EditDialog + confirms
                    → PreviewDialog
erp-modules + route segments + app-route-tree  (W0, paralelo a types)
auth invalidation wiring  (W2, tras invalidate utils)
```

---

## 4. Archivos explícitamente prohibidos

- `SecuenciaDetailPage.tsx`
- `CfgSecuenciaCreateDialog.tsx`
- Cualquier import `@/core/codigo` / engine
- Service paths fuera de `/api/v1/cfg/secuencias…`

---

## 5. DoD por Wave (archivo agregado)

Ver `11_ACCEPTANCE_CRITERIA.md` y Blueprint `08`. Esta Spec no cambia exit criteria.
