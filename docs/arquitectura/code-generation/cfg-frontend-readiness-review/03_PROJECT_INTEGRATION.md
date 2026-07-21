# CFG Readiness — Project Integration

**Versión:** 1.0  
**Método:** contraste documentación vs código AS-IS del repo (lectura)

---

## 1. Routing (§7)

| Requisito doc | Estado repo hoy | Plan |
|---------------|-----------------|------|
| Path `/app/cfg/*` | No existe | W0 `app-route-tree` |
| Feature `routes.tsx` | No existe | W0 |
| Shell AppLayout | Existe | Reutilizar |
| Index → secuencias | — | W0 |

Patrón idéntico a `org/*` / `inv/*`. **PASS.**

---

## 2. PermissionGuard (§8)

| Requisito | Existe en repo | Plan |
|-----------|----------------|------|
| `PermissionGuard module action="ver"` | Sí | `module="cfg"` |
| Gate página `hasPermission(consultar)` | Patrón WMS/INV B | Spec page/routes |

**PASS.** Dual RBAC documentado; dependencia de roles Backend = watch W-05, no bloqueo W0.

---

## 3. ERP_MODULES (§9)

| Requisito | Repo | Plan |
|-----------|------|------|
| Entrada `{ codigo: 'CFG', routePrefix: 'cfg', permissionModule: 'cfg' }` | Ausente | W0.7 |

Archivo y shape `ERPModuleConfig` verificados — extensión natural. **PASS.**

---

## 4. ERP_ROUTE_SEGMENTS (§10)

| Requisito | Repo | Plan |
|-----------|------|------|
| Segmento `'cfg'` | Ausente | W0.8 |

`mapLegacyErpPath` usará el segmento tras W0. **PASS.**

---

## 5. React Query / Keys / Invalidaciones (§11–13)

| Requisito | Repo capability | Plan |
|-----------|-----------------|------|
| Prefijo `['cfg']` | N/A (nuevo) | W2 |
| useErpListQuery | Existe + forcePagination | W2 |
| useTenantQuery append tenantId | Existe | W2 detail/list |
| Mutations toast ER-02 | Patrón ORG/INV | W2 |
| Preview no invalidate | Spec test P0 | W2/W5 |

**PASS.**

---

## 6. Session Reset (§14) — watch Wave 2

### Hallazgo de integración (código real)

`src/core/auth/session/session-rq-invalidation.ts`:

- Acción `'org-inv'` invalida **solo** ORG + INV al cambiar empresa.
- `'clear-all'` hace `queryClient.clear()` (cubre CFG automáticamente).

`auth-provider-public-actions.ts` / `auth-provider-auth-sync.compositor.ts` llaman `invalidateOrgQueries` + `invalidateInvQueries` en puntos de sesión.

### Implicación

Spec W2.10 pide añadir `invalidateCfgQueries` en esos tres archivos. Eso es **correcto y necesario** para cambio de empresa (labels/scope), aunque CFG sea tenant-first.

**No requiere renombrar** el tipo `PostRefreshRqAction` en W2 si se añade CFG dentro del case `'org-inv'` (nombre legacy). Opcional futuro: renombrar a `'module-scoped'` — fuera de Wave 0.

**PASS con watch W-03** — no bloquea Wave 0 (wiring es Wave 2).

---

## 7. useTenantQuery / useErpListQuery (§15–16)

| Check | Resultado |
|-------|-----------|
| ErpListResourceConfig soporta forcePagination + defaultSort | Sí (`erp-list.types.ts`) |
| Tenant-first sin company gate | Documentado y correcto |
| normalizeListResponse en stack ErpList | Sí |

**PASS.**

---

## 8. Types (§17)

| Check | Resultado |
|-------|-----------|
| Types manuales (sin codegen) | Alineado al proyecto |
| Campos UI mínimos en Spec 06 | Suficientes para W0–W1 |
| Snapshot OpenAPI ausente | W-01 — no bloquea W0 |

**PASS.**

---

## 9. Componentes reutilizados (§18)

Inventario Spec/Diseño existe en repo: erp-list, Dialog, ConfirmDialog, OrgDiscard*, FormSection, InvTableSkeleton, IamTableEmptyState, getErrorMessage.

**PASS.** No se depende de componentes inexistentes (Preview/Badges son nuevos en feature).

---

## 10. Veredicto integración

El proyecto **puede absorber** CFG Wave 0 sin cambios estructurales previos. Los únicos puntos de integración delicados están **calendarizados en Wave 2** (session invalidate) y **ops Backend** (menú/roles).
