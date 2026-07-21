# CFG — Routing Blueprint

**Versión:** 1.0  
**Ruta canónica:** `/app/cfg/secuencias`

---

## 1. Router del feature (`src/features/cfg/routes.tsx`)

```text
CfgRouter
  ├── index → Navigate to "secuencias"
  └── path "secuencias" → SecuenciasPage (lazy + Suspense)
```

- Default export: `CfgRouter` (igual que ORG/INV).
- Sin rutas `:secuenciaId`.
- Sin nested layouts propios.

### Gate RBAC en feature (recomendado)

Tras `PermissionGuard` externo:

1. `usePermission().hasPermission(CFG_PERMISSIONS.SECUENCIAS_CONSULTAR)`
2. Si false → `<Navigate to="/unauthorized" />` (o empty acceso denegado)

Cubre desalineación LBAC vs códigos.

---

## 2. Integración App Router

### `src/app/router/app-route-tree.tsx`

Añadir bloque hermano de `org/*` / `inv/*`:

| Propiedad | Valor |
|-----------|-------|
| `path` | `'cfg/*'` |
| Guard | `<PermissionGuard module="cfg" action="ver">` |
| Lazy | `lazy(() => import('@/features/cfg/routes'))` |
| Suspense | `LoadingSpinner` message módulo CFG |

Shell ya aplicado: `/app` + `AppLayout` + `ProtectedRoute requireOperationalUser` en `router.tsx` — **no cambiar**.

---

## 3. Registro `ERP_MODULES`

Archivo: `src/core/constants/erp-modules.ts`

Entrada:

| Campo | Valor |
|-------|-------|
| `codigo` | `'CFG'` |
| `routePrefix` | `'cfg'` |
| `permissionModule` | `'cfg'` |
| `descripcion` | `'Administrador de secuencias de código'` (o similar) |

Actualizar comentario “27 módulos” → N+1 si se mantiene el conteo.

---

## 4. Registro `ERP_ROUTE_SEGMENTS`

Archivo: `src/core/routing/post-login-path.ts`

- Añadir `'cfg'` al array `ERP_ROUTE_SEGMENTS`.
- Efecto: `mapLegacyErpPath('/cfg/secuencias')` → `/app/cfg/secuencias`.

---

## 5. Integración menú dinámico

| Aspecto | Spec |
|---------|------|
| Fuente | `GET /auth/menu` |
| FE cambia menú estático | **No** |
| Etiqueta | “Secuencias de código” |
| `ruta` esperada | `/app/cfg/secuencias` |
| Shell | `app` (`menu-shell.utils`) |
| Visibilidad | `is_visible && is_enabled` + rol |

**Dependencia Backend/ops:** ítem debe existir para QA de menú. El FE solo registra la ruta SPA.

---

## 6. PermissionGuard

| Capa | Guard | Criterio |
|------|-------|----------|
| Shell | `ProtectedRoute requireOperationalUser` | Usuario operativo |
| Módulo | `PermissionGuard module="cfg" action="ver"` | LBAC menú |
| Página | `hasPermission('cfg.secuencias.consultar')` | Código negocio |

Si LBAC `cfg.ver` no está en menú del rol, el usuario no entra aunque tenga código — **prerequisito P4** (roles alineados).

---

## 7. Integración RBAC en rutas vs UI

| Acción | Dónde se aplica |
|--------|-----------------|
| Entrar módulo | Guards arriba |
| Ver botones mutación | Página/dialogs vía `hasPermission(actualizar)` |
| Locked | Estado entidad, no ruta |

No crear `CfgCompanyRouteGuard` ni `CfgTenantRouteGuard` en MVP (tenant-first sin gate empresa).

---

## 8. Deep linking

| URL | Resultado |
|-----|-----------|
| `/app/cfg` | Redirect → `/app/cfg/secuencias` |
| `/app/cfg/secuencias` | Listado |
| `/app/cfg/secuencias?x=` | Ignorar query SPA desconocidas (filtros son state local) |
| `/cfg/secuencias` (legacy) | Reescritura vía `ERP_ROUTE_SEGMENTS` tras registro |

Query params de filtro en URL: **fuera de MVP** (estado React local).

---

## 9. Orden de cableado (impl)

1. `erp-modules.ts`
2. `ERP_ROUTE_SEGMENTS`
3. `features/cfg/routes.tsx` (puede ser stub page)
4. `app-route-tree.tsx`
5. Página real

Ver waves en `08_IMPLEMENTATION_WAVES.md`.
