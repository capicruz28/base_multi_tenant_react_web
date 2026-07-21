# CFG Frontend Audit — Navegación, shells y layouts (AS-IS)

**Fecha:** 2026-07-17  
**Contrato menú:** `docs/frontend-contracts/cfg/04_RBAC.md` (entrada “Secuencias de código”)

---

## 1. Shell correcto para CFG

| Pregunta | Respuesta AS-IS |
|----------|-----------------|
| ¿Tenant Admin (`/admin`)? | **No** |
| ¿Super Admin (`/super-admin`)? | **No** |
| ¿ERP operativo (`/app`)? | **Sí** |

Evidencia:

- Contrato: sesión ERP tenant, API `/api/v1/cfg`.
- Router: módulos de negocio cuelgan de `/app` + `AppLayout` (`src/app/router.tsx`).
- Menú ERP se renderiza en `NewSidebar` cuando `shell === 'app'`.

---

## 2. Layouts a reutilizar

| Pieza | Path | Rol |
|-------|------|-----|
| `AppLayout` | `src/shared/components/layout/AppLayout.tsx` | Wrapper `NewLayout variant="app"` |
| `NewLayout` | `src/shared/components/layout/NewLayout.tsx` | Chrome: sidebar, header, topnav |
| `NewSidebar` | `src/shared/components/layout/NewSidebar.tsx` | Menú módulos ERP |
| Page layout mínimo | `OrgPageLayout` / `InvPageLayout` | Contenedor de página sin H1 (TB-01) |

CFG no requiere layout propio de shell. Debe reutilizar el chrome ERP existente.

---

## 3. Fuente de verdad del menú

**Primaria:** Backend `GET /auth/menu` → `AuthContext.menuModulos`.

Partición por shell (Frontend):

| Utilidad | Path |
|----------|------|
| Scope shell | `src/core/auth/utils/menu-shell.utils.ts` |
| Filtro sidebar | `src/shared/components/layout/sidebar-menu.utils.ts` |
| Render ERP | `src/shared/components/layout/NewSidebar.tsx` |
| Render admin/platform | `src/shared/components/layout/MenuSelector.tsx` |

**No** hay registro local TypeScript de ítems ERP (a diferencia del helper estático limitado `adminMenu.ts` para Tenant Admin).

### Implicación para CFG

| Responsabilidad | Actor |
|-----------------|-------|
| Crear ítem “Secuencias de código” con `ruta` tipo `/app/cfg/secuencias` | Backend / menú plataforma |
| Filtrar por shell `app` y flags `is_visible` / `is_enabled` | Frontend (ya existe) |
| Tener ruta SPA que coincida con `ruta` del menú | Frontend (pendiente de implementar) |

Sin ítem en `/auth/menu`, el módulo no aparecerá en sidebar aunque existan rutas. Eso es dependencia de plataforma, no un defecto de arquitectura Frontend.

---

## 4. Patrón de navegación existente (reutilizar)

Flujo canónico observado en ORG/INV/WMS:

```text
src/app/router.tsx
  └── /app + AppLayout + ProtectedRoute(requireOperationalUser)
        └── app-route-tree.tsx
              └── path: '<mod>/*'
                    └── PermissionGuard(module, action="ver")
                          └── Suspense + Lazy FeatureRouter
                                └── features/<mod>/routes.tsx
                                      └── pages/...
```

Ejemplo real: `org/*` en `app-route-tree.tsx` → `OrgRouter` → páginas con guards internos (`OrgTenantRouteGuard` / `OrgCompanyRouteGuard`).

### Estado AS-IS respecto a CFG

- No hay lazy import de `CfgRouter`.
- No hay `path: 'cfg/*'`.
- Segmento `cfg` no está en `ERP_ROUTE_SEGMENTS` → rutas legacy sin `/app` no se mapearían automáticamente.

---

## 5. Guards de autenticación y acceso (capa navegación)

| Guard | Path | Qué valida | Aplica a CFG |
|-------|------|------------|--------------|
| `ProtectedRoute` + `requireOperationalUser` | `src/shared/components/ProtectedRoute.tsx` | Auth, bootstrap, empresa, password, permisos init | **Sí** (shell `/app`) |
| `PermissionGuard` | `src/app/router/guards/PermissionGuard.tsx` | LBAC `can(module, action)` desde menú | **Sí** a nivel módulo (patrón actual) |
| `OrgCompanyRouteGuard` | ORG | Exige `scopeEmpresaId` JWT | Solo si se decide company-scoped |
| `OrgTenantRouteGuard` | ORG | Tenant-scoped (ej. Empresa) | Posible análogo si CFG es tenant-wide |
| `InvCompanyRouteGuard` | INV | Company INV | No por defecto |

### Lectura del contrato vs scope empresa

El listado CFG admite filtro opcional `empresa_id`, pero el recurso es de **tenant** (secuencias pueden ser TENANT / EMPRESA / ALMACEN / PUNTO_VENTA).

AS-IS: no existe un `CfgTenantRouteGuard`. Los guards company de ORG/INV **no son obligatorios** para un listado tenant-wide; forzar `useInvCompanyQueryGate` bloquearía listados sin empresa activa de forma incorrecta si el módulo no es company-scoped.

**Hecho de auditoría:** el diseño funcional debe clasificar el scope de pantalla (tenant-wide vs company) antes de reutilizar guards ORG/INV company.

---

## 6. Rutas esperadas por contrato (solo lectura)

El contrato no fija paths SPA, pero sí pantallas:

| Pantalla contrato | Contenido |
|-------------------|-----------|
| Listado | Tabla + filtros |
| Detalle / edición | Lectura + mutaciones condicionadas |

Patrones SPA existentes en el proyecto:

| Patrón | Ejemplo | Observación |
|--------|---------|-------------|
| List + modal edit | ORG Departamentos, INV Categorías | Un path, detalle en Dialog |
| List + página detalle | Algunos módulos transaccionales | Dos paths |

Ambos son viables; la elección es de **diseño funcional**, no de arquitectura.

Ruta de menú sugerida por convención del repo (no implementada): `/app/cfg/secuencias`.

---

## 7. Cross-nav y post-login

| Pieza | Relevancia CFG |
|-------|----------------|
| `ShellCrossNav` | Navegación entre shells; CFG permanece en `app` |
| `mapLegacyErpPath` / `ERP_ROUTE_SEGMENTS` | Sin `cfg`, URLs legacy `/cfg/...` no se reescriben a `/app/cfg/...` |
| Post-login first route | Depende del menú Backend; si CFG es primer ítem visible, la ruta debe existir |

---

## 8. Resumen de navegación

| Decisión AS-IS | Valor |
|----------------|-------|
| Shell | `app` / `AppLayout` |
| Menú | Dinámico ERP — “Secuencias de código” |
| Patrón router | Lazy feature + `PermissionGuard` + `routes.tsx` |
| Layout página | Reutilizar page layout tipo ORG/INV |
| Guards company ORG/INV | No asumir por defecto; evaluar scope tenant |
| Estado actual | Sin rutas ni menú Frontend locales para CFG |
