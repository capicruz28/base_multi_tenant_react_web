# CFG — Estructura de carpetas y responsabilidades

**Versión:** 1.0  
**Root:** `src/features/cfg/`

---

## 1. Árbol completo (target)

```text
src/features/cfg/
├── routes.tsx
├── index.ts                          # opcional: reexports públicos mínimos
├── constants/
│   ├── cfg-permissions.ts
│   ├── cfg-list.constants.ts
│   └── cfg-scope-labels.ts
├── types/
│   ├── cfg.types.ts                  # schemas API (Read, Update, Preview, Scope)
│   ├── cfg-list.types.ts             # filtros listado FE
│   └── cfg-discard.types.ts          # discard pending local (si no reusa ORG type)
├── services/
│   └── cfg-secuencias.service.ts
├── utils/
│   ├── invalidate-cfg-queries.ts
│   ├── cfg-secuencia-form.utils.ts   # build PATCH payload, local validation
│   ├── cfg-secuencia-dirty.utils.ts  # normalize baseline compare
│   ├── cfg-error.utils.ts            # map internal_code → field/banner
│   └── cfg-display.utils.ts          # labels scope_type, humanize
├── hooks/
│   ├── cfg-query-keys.ts             # factory keys oficiales
│   ├── cfg-query-defaults.ts         # staleTime
│   ├── useCfgSecuenciasErpList.ts
│   ├── useCfgSecuencia.ts
│   ├── useUpdateCfgSecuencia.ts
│   ├── useDesactivarCfgSecuencia.ts
│   ├── useReactivarCfgSecuencia.ts
│   └── usePreviewCfgSecuencia.ts
├── components/
│   ├── CfgSecuenciaEditDialog.tsx
│   ├── CfgSecuenciaPreviewDialog.tsx
│   ├── CfgSecuenciaStatusBadges.tsx
│   ├── CfgLockedBanner.tsx
│   └── CfgSecuenciaFormatoFields.tsx # opcional split del edit form
├── pages/
│   └── SecuenciasPage.tsx
└── __tests__/                        # o colocalizados __tests__ por capa
    ├── cfg-secuencias.service.test.ts
    ├── cfg-secuencia-form.utils.test.ts
    ├── cfg-error.utils.test.ts
    ├── useCfgSecuenciasErpList.test.ts
    ├── useUpdateCfgSecuencia.test.ts
    └── … (ver 09_TESTING_BLUEPRINT)
```

**Cableado externo (fuera del feature):**

```text
src/app/router/app-route-tree.tsx          # path cfg/*
src/core/constants/erp-modules.ts          # entrada CFG
src/core/routing/post-login-path.ts        # segmento 'cfg'
```

---

## 2. Responsabilidades por archivo

### `routes.tsx`

- Define `CfgRouter`: index → `Navigate` a `secuencias`.
- Ruta `secuencias` → lazy `SecuenciasPage` + Suspense.
- Gate página opcional: redirect si `!hasPermission(consultar)` (además del PermissionGuard).

### `constants/cfg-permissions.ts`

- `CFG_PERMISSIONS.SECUENCIAS_CONSULTAR`
- `CFG_PERMISSIONS.SECUENCIAS_ACTUALIZAR`

### `constants/cfg-list.constants.ts`

- `SECUENCIAS_LIST_CONFIG: ErpListResourceConfig`
- sortableColumns whitelist contrato
- `forcePagination: true`, `defaultLimit: 50`
- default sort `sequence_key` asc

### `constants/cfg-scope-labels.ts`

- Map `TENANT|EMPRESA|ALMACEN|PUNTO_VENTA` → labels UI

### `types/*`

- Ver `07_TYPES_BLUEPRINT.md`

### `services/cfg-secuencias.service.ts`

- Único access point HTTP CFG secuencias
- Methods: `list`, `getById`, `update`, `desactivar`, `reactivar`, `preview`
- Usa `api` central; `BASE = '/api/v1/cfg'`
- Comentarios `operationId` por método

### `utils/invalidate-cfg-queries.ts`

- `CFG_QUERY_KEY_PREFIX = ['cfg']`
- `invalidateCfgQueries`, `removeCfgQueries`
- Helpers `invalidateCfgSecuenciasList`, `invalidateCfgSecuenciaDetail`

### `utils/cfg-secuencia-form.utils.ts`

- Validación local pre-PATCH
- `buildCfgSecuenciaUpdatePayload(baseline, current)` → solo dirty fields
- Uppercase prefijo visual/normalización FE

### `utils/cfg-secuencia-dirty.utils.ts`

- Normalizer campos formato para `isDirtyAgainstBaseline`

### `utils/cfg-error.utils.ts`

- Extraer `internal_code` si existe
- Map a field errors / locked banner / preview disabled
- Mensajes alineados a contrato `03_ERROR_HANDLING`

### `utils/cfg-display.utils.ts`

- Scope label, empty “—”, nunca UUID

### `hooks/*`

- Ver `05_REACT_QUERY_BLUEPRINT.md`

### `components/*` / `pages/*`

- Ver `06_COMPONENT_BLUEPRINT.md`

---

## 3. Organización por capa (resumen)

| Capa | Contiene | No contiene |
|------|----------|-------------|
| pages | Orquestación UI, estado local dialogs/confirms | HTTP directo |
| components | Presentación dialogs/badges/fields | QueryClient invalidate ad hoc sin hooks |
| hooks | RQ + toasts mutation | JSX |
| services | Axios | toast, navigate |
| types | Contratos | lógica |
| constants | Literales / config list | llamadas API |
| utils | Puros / invalidate | React components |

---

## 4. Imports permitidos / prohibidos

| From → To | ¿OK? |
|-----------|:----:|
| cfg → `@/core/*`, `@/shared/*` | Sí |
| cfg → ORG dirty/discard/FormSection | Sí (patrón existente INV→ORG) |
| cfg → `src/core/codigo` engine | **No** |
| cfg → `features/inv-bill` Series | **No** |
| features/org → cfg | No en MVP |
| pages → services | **No** (vía hooks) |

---

## 5. Archivos que NO se crean

- `pages/SecuenciaDetailPage.tsx`
- `components/CfgSecuenciaCreateDialog.tsx`
- `services/cfg-align.service.ts`
- Cualquier archivo bajo `src/core/codigo` para admin
- Duplicado de `ConfirmDialog` / `ErpPagination`
