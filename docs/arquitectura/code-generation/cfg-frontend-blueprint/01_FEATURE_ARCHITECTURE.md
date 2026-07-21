# CFG — Arquitectura técnica del feature

**Versión:** 1.0

---

## 1. Posición en la arquitectura Frontend

```text
Shell ERP (/app)
  └── AppLayout
        └── PermissionGuard(module="cfg", action="ver")
              └── CfgRouter (lazy)
                    └── SecuenciasPage
                          ├── list hooks → cfg service → /api/v1/cfg
                          ├── Edit Dialog
                          ├── Preview Dialog
                          └── ConfirmDialogs
```

| Capa | Tecnología |
|------|------------|
| Routing | React Router v6 · lazy feature |
| Server state | TanStack Query · `useTenantQuery` · `useErpListQuery` |
| HTTP | Axios `api` central (`src/core/api/api.ts`) |
| Auth session | `ProtectedRoute` + AuthContext |
| RBAC menú | `PermissionGuard` + `usePermissions` |
| RBAC negocio | `usePermission().hasPermission` |
| UI | Plantilla A/A+ · erp-list · Dialog ORG patterns |

---

## 2. Capas internas del feature (orden de dependencia)

```text
types  →  constants  →  services  →  utils  →  hooks  →  components  →  pages  →  routes
```

Reglas:

- `pages` no llaman Axios.
- `components` no definen query keys.
- `hooks` no renderizan UI (salvo retornar estado).
- `services` no importan React.
- `types` no importan runtime de feature.

---

## 3. Separación FCE vs CFG

| Capa | Path | Relación |
|------|------|----------|
| FCE | `src/core/codigo`, `shared/components/codigo`, manifests ORG/INV | Consumidor de secuencias en forms |
| CFG Admin | `src/features/cfg` | Administra secuencias vía `/api/v1/cfg` |

**MUST NOT:** importar `useCodigoFieldController` / registry en CFG admin.  
**MAY:** copiar patrones visuales de paneles FCE en Preview (sin imports de engine).

---

## 4. Scope de datos

| Aspecto | Valor |
|---------|-------|
| Tenant | Obligatoria vía sesión + `useTenantQuery` |
| Empresa JWT | No gate; no filtro toolbar `empresa_id` |
| Query enabled | Tenant válido + (opcional) permiso consultar |

---

## 5. Superficies UI (mapeo técnico)

| Superficie funcional | Artefacto técnico |
|----------------------|-------------------|
| Listado | `pages/SecuenciasPage.tsx` |
| Edit/Detail | `components/CfgSecuenciaEditDialog.tsx` |
| Preview | `components/CfgSecuenciaPreviewDialog.tsx` |
| Badges | `components/CfgSecuenciaStatusBadges.tsx` |
| Locked banner | `components/CfgLockedBanner.tsx` |
| Desactivar/Reactivar | `ConfirmDialog` (página) |
| Discard dirty | `OrgDiscardConfirmDialog` (página) |

---

## 6. Integraciones externas al feature

| Integración | Archivo(s) a tocar en impl |
|-------------|----------------------------|
| App route tree | `src/app/router/app-route-tree.tsx` |
| ERP modules | `src/core/constants/erp-modules.ts` |
| Route segments | `src/core/routing/post-login-path.ts` |
| Menú | Ninguno FE — Backend `/auth/menu` |
| Scope empresa reset (opcional) | Invalidar `['cfg']` si existe hook global de cambio empresa |

---

## 7. Referencias canónicas de código (leer, no copiar ciego)

| Necesidad | Referencia |
|-----------|------------|
| ErpList + mutations | `src/features/inv/hooks/categorias.hooks.ts` + `CategoriasPage` |
| Dirty modal | ORG `DepartamentosPage` + discard handlers |
| Permisos dotted | WMS pages / `inv-permissions.ts` |
| Invalidate module | `src/features/inv/utils/invalidate-inv-queries.ts` |
| Service BASE | `org.service.ts` / `inv.service.ts` |

---

## 8. Principios no negociables

1. OpenAPI/contrato > Blueprint > código.
2. Sin `any`.
3. Sin endpoints inventados.
4. Sin create UI.
5. Sin PATCH `es_activo`.
6. Preview no invalida listado.
7. Toast error API solo en `onError` de mutations (ER-02).
8. Nunca UUID en UI (E-ME4).
