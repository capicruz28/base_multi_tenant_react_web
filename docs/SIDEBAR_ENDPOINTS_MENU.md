# Sidebar: menú de navegación y endpoints

El menú lateral, la barra superior (modo navbar) y la búsqueda global (**Ctrl+K**) comparten **una sola fuente de datos** en el frontend. No hay menú estático ni fetch independiente en `NewSidebar`.

---

## 1. Endpoint y carga

| Concepto | Valor |
|----------|--------|
| **Endpoint** | `GET /auth/menu` |
| **Servicio** | `menuService.getAuthMenu()` en `src/features/admin/services/menu.service.ts` |
| **Estado global** | `AuthContext.menuModulos` (`AuthMenuModulo[] \| null`) |
| **Permisos de ruta** | Indexados del mismo payload: `indexRoutePermissionsFromMenu` → `AuthContext.permissions` (solo guards; no recalcula RBAC) |
| **Cuándo carga** | Tras login/bootstrap (`updateAccessLevels` → `loadMenuAndPermissionsFromAuthMenu`) |

`null` = menú aún no cargado (spinner en sidebar). `[]` = sin módulos o error de carga.

**No usar para el sidebar:** `GET /modulos-menus/me/` (no existe `getMenuMe` en el frontend). Los endpoints `/modulos-menus/*` siguen usándose en pantallas de **administración de menús** (CRUD, permisos por rol), no para renderizar la navegación del usuario.

---

## 2. Shells de layout (Punto 3)

Cada ruta monta un layout con `LayoutShellVariant`:

| Shell | Layout | Qué muestra la navegación |
|-------|--------|---------------------------|
| `app` | `AppLayout` | Ítems del payload con scope **app** (`menu_scope` / `tipo_modulo` o ruta `/app/*` y legacy ERP) |
| `admin` | `AdminLayout` | Ítems con scope **admin** o ruta `/admin/*` |
| `super-admin` | `SuperAdminLayout` | Ítems con scope **platform** o ruta `/super-admin/*` |

**Visibilidad:** solo `is_visible` + `is_enabled` (backend ya aplicó contrato y `rol_menu_permiso`).

**Partición por shell (presentación):** `menu-shell.utils.ts` + `filterModulosForShell` en `sidebar-menu.utils.ts` (también `menuSearch.ts`, `TopNavbar`, `useAdminMenuItems`).

Ver diseño: `docs/frontend/MENU_SIDEBAR_ALINEACION.md`.

---

## 3. Transformación y rutas `/app/*`

| Componente | Transformación |
|------------|----------------|
| Sidebar ERP (shell `app`) | `transformAuthMenuToSidebarItems(filterModulosForShell(...), 'app')` |
| Sidebar admin | `useAdminMenuItems` → `transformAdminMenuFromAuthMenu` |
| Rutas ERP en BD | Pueden venir sin `/app`; el frontend normaliza con `normalizeNavRoute` → `mapLegacyErpPath` / `toAppPath` |
| Navegación interna en páginas | Preferir `toAppPath('/inv/...')` desde `src/core/routing/post-login-path.ts` |

Redirects legacy (`/inv/*` → `/app/inv/*`) siguen activos en el router; la navegación nueva debe usar `/app/*` directamente.

---

## 4. Modos de navegación

`NavModeContext`: `sidebar` (default) o `navbar`.

- **Sidebar:** `NewSidebar` + árbol jerárquico.
- **Navbar:** `TopNavbar` agrupado por `categoria` del módulo.
- **Búsqueda:** `GlobalSearch` + `searchMenuItems` (mismos filtros por shell).
- **Breadcrumbs:** única fuente en `Header` vía `useShellBreadcrumbs` (no escribe `NewSidebar`).

---

## 5. Permisos y visibilidad

- **Visibilidad en menú:** solo `is_visible` e `is_enabled` del payload `/auth/menu`.
- **Rutas ERP:** `PermissionGuard` + `usePermissions().can(module, action)` desde permisos indexados del menú (no desde catálogo `ERP_CODES`).
- **Acciones granulares UI:** `PermissionProvider` (`GET /auth/permissions/me`) — no filtra el sidebar.
- **Panel `/admin`:** `ProtectedRoute.requireTenantAdmin` (`user_type`), no `access_level >= 4`.

---

## 6. Diagnóstico

- Menú vacío en app: revisar respuesta de `GET /auth/menu` en DevTools y módulos contratados del tenant.
- Rutas legacy en BD: utilidad `listMenuRoutesWithoutAppPrefix(menuModulos)` en `sidebar-menu.utils.ts`.
- Auditoría detallada: `docs/frontend/auditoria/AUDITORIA_SIDEBAR_CONTEXTO.md`.

---

*Actualizado mayo 2026 — Alineación menú BE como fuente de verdad.*
