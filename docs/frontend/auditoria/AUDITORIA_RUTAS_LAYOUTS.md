# Auditoría Punto 3 — Separación de rutas y layouts frontend

**Alcance:** organización actual de rutas, layouts, redirección post-login, sidebar y protección de rutas (solo análisis).  
**Fecha de revisión:** 18 de mayo de 2026.  
**Objetivo de referencia:** tres contextos separados — `/super-admin/*`, `/admin/*`, `/app/*`.

---

## PASO 1 — Inventario de archivos de rutas y layouts

### Router principal

| Archivo | Propósito | Rutas aprox. |
|---------|-----------|--------------|
| `src/app/router.tsx` | **Router central** (`createBrowserRouter`). Agrupa rutas públicas, árbol ERP/usuario (`/`), árbol tenant admin (`/admin`), árbol super admin (`/super-admin`). Lazy-load de módulos ERP. | ~45 definiciones de ruta de primer nivel (incl. wildcards, redirects y 28 entradas de módulos ERP) |
| `src/app/App.tsx` | Monta `RouterProvider` con el router exportado. | 0 (solo provider) |
| `src/app/router/guards/PermissionGuard.tsx` | Guard LBAC por módulo/acción (`ver`, etc.) sobre rutas ERP. | 0 (wrapper, no define paths) |

### Rutas por feature (archivos `routes.tsx`)

| Archivo | Propósito | Rutas aprox. |
|---------|-----------|--------------|
| `src/features/auth/routes.tsx` | Login público | 1 |
| `src/features/home/routes.tsx` | Home post-login | 1 |
| `src/features/admin/routes.tsx` | Panel admin del cliente (usuarios, roles, áreas, menús, sesiones) | 6 (+ wildcard) |
| `src/features/super-admin/routes.tsx` | Panel CAXIS (clientes, módulos, catálogos globales) | 13 (+ wildcard) |
| `src/features/org/routes.tsx` | Módulo ORG (empresa, sucursales, etc.) | 7 |
| `src/features/inv/routes.tsx` | Inventarios | 12 |
| `src/features/pur/routes.tsx` | Compras | 8 |
| `src/features/sls/routes.tsx` | Ventas | 6 |
| `src/features/inv-bill/routes.tsx` | Facturación electrónica | 4 |
| `src/features/prc/routes.tsx` | Precios y promociones | 4 |
| `src/features/fin/routes.tsx` | Finanzas | 5 |
| `src/features/log/routes.tsx` | Logística | 7 |
| `src/features/wms/routes.tsx` | WMS | 5 |
| `src/features/qms/routes.tsx` | Calidad | 5 |
| `src/features/crm/routes.tsx` | CRM | 5 |
| `src/features/pos/routes.tsx` | POS | 4 |
| `src/features/hcm/routes.tsx` | RRHH / planillas | 8 |
| `src/features/hcm/asistencia/autorizacion/routes.tsx` | Autorización asistencia | 3 |
| `src/features/hcm/reportes/routes.tsx` | Reportes HCM | 3 |
| `src/features/mfg/routes.tsx` | Manufactura | 8 |
| `src/features/mrp/routes.tsx` | MRP | 5 |
| `src/features/mps/routes.tsx` | MPS | 4 |
| `src/features/mnt/routes.tsx` | Mantenimiento | 5 |
| `src/features/cst/routes.tsx` | Costeo | 4 |
| `src/features/tax/routes.tsx` | Libros electrónicos | 3 |
| `src/features/bdg/routes.tsx` | Presupuestos | 3 |
| `src/features/pm/routes.tsx` | Proyectos | 3 |
| `src/features/svc/routes.tsx` | Órdenes de servicio | 4 |
| `src/features/tkt/routes.tsx` | Mesa de ayuda | 2 |
| `src/features/dms/routes.tsx` | Gestión documental | 3 |
| `src/features/wfl/routes.tsx` | Workflows | 3 |
| `src/features/bi/routes.tsx` | BI / reportes | 3 |
| `src/features/aud/routes.tsx` | Auditoría | 3 |

**Total estimado de rutas hoja (páginas):** ~130–140 (sin contar redirects `*` ni `index`).

### Layouts de aplicación (shell)

| Archivo | Propósito | Usado en router |
|---------|-----------|-----------------|
| `src/shared/components/layout/NewLayout.tsx` | **Único layout de aplicación**: sidebar o top navbar + header + `<Outlet>`. | Sí — los 3 contextos (`/`, `/admin`, `/super-admin`) |
| `src/shared/components/layout/NewSidebar.tsx` | Sidebar dinámico (menú BD + bloques admin). | Hijo de `NewLayout` (modo `sidebar`) |
| `src/shared/components/layout/TopNavbar.tsx` | Navegación horizontal por categorías (misma fuente `/auth/menu`). | Hijo de `NewLayout` (modo `navbar`) |
| `src/shared/components/layout/Header.tsx` | Barra superior: breadcrumb, usuario, tema, modo nav. | Hijo de `NewLayout` |
| `src/shared/components/layout/MenuSelector.tsx` | Hook `useAdminMenuItems` — transforma módulos no-ERP del menú auth en ítems admin. | Usado por `NewSidebar` |
| `src/shared/components/LayoutWrapper.tsx` | Padding del contenido principal. | Dentro de `NewLayout` |
| `src/common/LayoutWrapper.tsx` | Duplicado del wrapper de padding (misma implementación). | No referenciado por `NewLayout` (usa el de `shared`) |

**No existen** `AdminLayout`, `SuperAdminLayout`, `MainLayout` ni layouts distintos por contexto en el router.

### Layouts de página por módulo (`*PageLayout.tsx`)

Hay ~25 componentes `*PageLayout.tsx` bajo `src/features/*/components/` (p. ej. `InvPageLayout`, `OrgPageLayout`). Son **layouts internos de pantalla** (título, acciones, contenedor del módulo), no shells de aplicación ni rutas.

### Otros archivos relacionados

| Archivo | Propósito |
|---------|-----------|
| `src/shared/components/ProtectedRoute.tsx` | Guard de autenticación, nivel de acceso y super admin. |
| `src/shared/components/SmartRedirect.tsx` | Redirect en `/` y rutas `*` del árbol principal según tipo de usuario. |
| `src/core/auth/AuthGate.tsx` | Bloquea el router hasta que `/auth/me` (bootstrap) termine. |
| `src/context/AuthContext.tsx` | Copia legacy; el provider activo es `src/shared/context/AuthContext.tsx`. |

---

## PASO 2 — Estructura de rutas actual

### Árbol de enrutamiento (resumen)

```
/login                          → Login (público)
/unauthorized                   → UnauthorizedPage (público)

ProtectedRoute (auth)
└── / + NewLayout
    ├── / (index)               → SmartRedirect
    ├── /home                   → Home
    ├── /autorizacion/*         → HCM autorización (+ PermissionGuard)
    ├── /reportes/*             → HCM reportes (+ PermissionGuard)
    ├── /org/* … /aud/*         → Módulos ERP en raíz (+ PermissionGuard cada uno)
    └── *                       → SmartRedirect

ProtectedRoute (requiredLevel={4})
└── /admin + NewLayout
    ├── /admin (index)          → redirect /admin/usuarios
    ├── /admin/usuarios … sesiones
    └── /admin/*                → redirect /admin/usuarios

ProtectedRoute (requireSuperAdmin)
└── /super-admin + NewLayout
    ├── /super-admin (index)    → redirect /super-admin/dashboard
    ├── /super-admin/dashboard … catalogos/*
    └── /super-admin/*          → redirect /super-admin/dashboard
```

### Prefijos objetivo vs realidad

| Prefijo objetivo | ¿Existe? | Rutas actuales |
|------------------|----------|----------------|
| `/super-admin/*` | **Sí** | Ver tabla siguiente |
| `/admin/*` | **Sí** | Ver tabla siguiente |
| `/app/*` | **No** | Los módulos ERP viven en **raíz**: `/inv/*`, `/org/*`, `/fin/*`, etc. |

### Rutas `/super-admin/*`

| Ruta | Componente | Layout | Auth | Rol / condición |
|------|------------|--------|------|-----------------|
| `/super-admin` | Navigate → dashboard | `NewLayout` | Sí | `requireSuperAdmin` (`user_type === platform_admin`) |
| `/super-admin/dashboard` | `SuperAdminDashboard` | `NewLayout` | Sí | Super admin |
| `/super-admin/clientes` | `ClientManagementPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/clientes/:id` | `ClientDetailPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/modulos` | `ModuleManagementPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/secciones` | `SectionManagementPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/menus` | `MenuManagementPageSuperAdmin` | `NewLayout` | Sí | Super admin |
| `/super-admin/plantillas-roles` | `RoleTemplateManagementPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/vista-jerarquica` | `HierarchicalViewPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/catalogos/paises` | `PaisesPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/catalogos/departamentos` | `DepartamentosPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/catalogos/provincias` | `ProvinciasPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/catalogos/distritos` | `DistritosPage` | `NewLayout` | Sí | Super admin |
| `/super-admin/catalogos/monedas` | `MonedasPage` | `NewLayout` | Sí | Super admin |

### Rutas `/admin/*`

| Ruta | Componente | Layout | Auth | Rol / condición |
|------|------------|--------|------|-----------------|
| `/admin` | Navigate → usuarios | `NewLayout` | Sí | `accessLevel >= 4` (tenant admin) |
| `/admin/usuarios` | `UserManagementPage` | `NewLayout` | Sí | Tenant admin |
| `/admin/roles` | `RoleManagementPage` | `NewLayout` | Sí | Tenant admin |
| `/admin/areas` | `AreaManagementPage` | `NewLayout` | Sí | Tenant admin |
| `/admin/menus` | `MenuManagementPage` | `NewLayout` | Sí | Tenant admin |
| `/admin/sesiones` | `ActiveSessionsPage` | `NewLayout` | Sí | Tenant admin |

### Rutas `/app/*`

**No hay ninguna ruta con prefijo `/app`.**

### Rutas ERP y operativas (árbol `/` + `NewLayout`)

Todas requieren autenticación (`ProtectedRoute` sin nivel extra). La mayoría llevan además `PermissionGuard` con `action="ver"` salvo excepciones de bypass (ver Paso 6).

| Prefijo router | Módulo | Ejemplos de rutas hijas |
|----------------|--------|-------------------------|
| `/home` | Inicio | `/home` |
| `/autorizacion/*` | HCM autorización | `/autorizacion/finalizartareo` |
| `/reportes/*` | HCM reportes | `/reportes/reportedestajo` |
| `/org/*` | Organización | `/org/empresa`, `/org/sucursales`, … |
| `/inv/*` | Inventarios | `/inv/productos`, `/inv/movimientos/nuevo`, … |
| `/pur/*` | Compras | `/pur/proveedores`, … |
| `/sls/*` | Ventas | `/sls/clientes`, … |
| `/facturacion/*` | Facturación (inv-bill) | `/facturacion/comprobantes`, … |
| `/prc/*` | Precios | `/prc/listas-precio`, … |
| `/log/*` | Logística | `/log/guias-remision`, … |
| `/fin/*` | Finanzas | `/fin/asientos`, … |
| `/wms/*`, `/qms/*`, `/crm/*`, `/pos/*`, `/hcm/*` | WMS, QMS, CRM, POS, HCM | Ver `src/features/*/routes.tsx` |
| `/mfg/*`, `/mrp/*`, `/mps/*`, `/mnt/*` | Producción / mantenimiento | Idem |
| `/cst/*`, `/tax/*`, `/bdg/*`, `/pm/*`, `/svc/*`, `/tkt/*` | Costeo, PLE, presupuestos, … | Idem |
| `/dms/*`, `/wfl/*`, `/bi/*`, `/aud/*` | Documentos, workflows, BI, auditoría | Idem |

**Compatibilidad legacy en router:** `/finalizartareo` → `/autorizacion/finalizartareo`; `/reportedestajo` → `/reportes/reportedestajo`.

### Mezcla ERP vs administración

- **En rutas:** `/admin/*` y `/super-admin/*` están en árboles separados con guards distintos. Los módulos ERP **no** usan `/admin` ni `/app`.
- **Excepción conceptual:** el módulo **ORG** (`/org/*`) es ERP pero gestiona datos de empresa (razón social, sucursales, parámetros). Convive en el mismo árbol que inventario o ventas.
- **En menú lateral:** el sidebar puede mostrar **módulos ERP y bloques de administración** en el mismo componente (`NewSidebar`), filtrados por `user_type` (ver Paso 5).

---

## PASO 3 — Análisis de layouts existentes

Solo hay un layout de aplicación relevante: **`NewLayout`**, compartido por los tres contextos.

### `NewLayout` (`src/shared/components/layout/NewLayout.tsx`)

| Pregunta | Respuesta |
|----------|-----------|
| **A) ¿Qué sidebar renderiza?** | `NewSidebar` cuando `navMode === 'sidebar'` (`NavModeContext`). |
| **B) ¿Qué navbar renderiza?** | `Header` siempre; `TopNavbar` cuando `navMode === 'navbar'`. |
| **C) ¿Verifica tipo de usuario?** | **No** en el layout. La distinción super/tenant/user ocurre en `NewSidebar` / `TopNavbar` y en guards de ruta. |
| **D) ¿Verifica `empresa_id` antes del ERP?** | **No.** No hay comprobación de empresa activa a nivel layout. |
| **E) ¿Cómo obtiene el menú?** | Indirectamente vía hijos: `AuthContext.menuModulos` desde **GET `/auth/menu`** (BD/backend). No hay menú hardcodeado en el layout. |
| **F) ¿Redirecciones dentro del layout?** | **No.** Solo renderiza `<Outlet />` con wrappers de UI. |

### `NewSidebar`

| Pregunta | Respuesta |
|----------|-----------|
| **A) Sidebar** | Él mismo. |
| **B) Navbar** | N/A (modo sidebar). |
| **C) Tipo de usuario** | **Sí:** bloque “Administración Global” si `userType === 'platform_admin'`; “Administración General” si `userType === 'tenant_admin'`. Módulos ERP para cualquier usuario con menú cargado. |
| **D) `empresa_id`** | **No.** |
| **E) Menú** | Producto: `menuModulos` filtrando códigos `SYS_ADMIN`, `ADMIN_SYSTEM`, `ADMINISTRACION`. Admin: `useAdminMenuItems()` → módulos no-ERP de la misma respuesta `/auth/menu`. |
| **F) Redirecciones** | **No** (solo `navigate` al hacer clic). |

### `TopNavbar` (modo navbar alternativo)

Misma fuente de menú (`menuModulos`), agrupa módulos ERP por categoría (`ERP_MODULES` + metadatos). Filtra módulos admin con `ERP_CODES`. No valida `empresa_id`.

### Layouts `*PageLayout` por módulo

Contenedores de UI de pantalla (título, toolbar). **No** sustituyen shell ni cambian sidebar/navbar global.

---

## PASO 4 — Flujo post-login actual

| Pregunta | Respuesta |
|----------|-----------|
| **¿Qué archivo maneja la redirección post-login?** | Principalmente `src/features/auth/pages/Login.tsx` (`handleSubmit` → `navigate`). Complementario: `SmartRedirect` en `/` y `*` del árbol ERP. |
| **¿A qué ruta redirige tras login exitoso?** | Si `roles` incluye **`'Super Administrador'`** → `/super-admin/dashboard`. En cualquier otro caso → `location.state.from.pathname` si existe y no es `/login` ni `/unauthorized`, si no → **`/home`**. |
| **¿Evalúa tipo de usuario (`super_admin` / `tenant_admin` / `user`)?** | **Parcialmente:** Login usa **nombre de rol** (`Super Administrador`), no `user_type` de `/auth/me`. No envía tenant admin a `/admin/*`. `SmartRedirect` sí usa `isSuperAdmin` y `accessLevel >= 4` del contexto. |
| **¿Evalúa `empresa_id` en el JWT?** | **No.** `UserData` en frontend no define `empresa_id`; no hay decode de JWT en el cliente para empresa. |
| **¿Evalúa empresas disponibles / `requiere_seleccion_empresa`?** | **No** en login ni en guards. |
| **¿Pantalla de selección de empresa?** | **❌** No existe ruta ni componente dedicado (`SeleccionEmpresa`, etc.). |
| **¿Pantalla onboarding / primera empresa?** | **❌** No encontrada en el frontend. |

### Secuencia técnica post-login

1. `authService.login` → `access_token` (+ cookie refresh HttpOnly).
2. `setAuthFromLogin` guarda **solo el token**; usuario viene de **`/auth/me`** (`initializeAuth`).
3. Se cargan `user_type`, `access_level`, menú y permisos vía **`GET /auth/menu`**.
4. `Login.tsx` ejecuta `navigate(destination)`.
5. `AuthGate` ya permitió montar el router tras bootstrap previo o actualizado.

### Inconsistencias detectadas

- Login prioriza rol **`Super Administrador`**; el resto del sistema usa **`user_type === 'platform_admin'`** (`AuthContext.isSuperAdmin`).
- Tenant admin con `accessLevel >= 4` cae en **`/home`** en login, no en `/admin/usuarios` (solo `SmartRedirect` en `/` los llevaría a admin).
- `useUserType` compara `userType` con `'super_admin'` / `'tenant_admin'`, pero el backend/contexto usa **`platform_admin`** / **`tenant_admin`** → flags como `isSuperAdminUser` pueden quedar en falso aunque el usuario sea platform admin.

---

## PASO 5 — Análisis del sidebar

**Componente principal:** `src/shared/components/layout/NewSidebar.tsx` (alternativa horizontal: `TopNavbar.tsx`).

| Pregunta | Respuesta |
|----------|-----------|
| **¿Cómo construye el menú?** | **Combinación:** estructura y rutas desde **GET `/auth/menu`** (`AuthContext.menuModulos`); transformación a ítems sidebar; constantes locales solo para filtrar códigos admin (`ADMIN_MODULE_CODES`, `ERP_CODES` en `MenuSelector`). |
| **¿Diferencia super admin / admin cliente / ERP?** | **Sí, parcialmente:** sección “Módulos” (ERP, sin códigos admin); bloque “Administración Global” (`/super-admin…`) solo `platform_admin`; “Administración General” (`/admin…`) solo `tenant_admin`. Usuario operativo ve principalmente módulos ERP. |
| **¿Filtra por permisos?** | **Sí a nivel ítem:** `is_visible` / `is_enabled` en menús y submenús. Permisos granulares (`permissions`) alimentan `PermissionGuard` en rutas, no ocultan ítems uno a uno en sidebar (salvo flags del menú BD). |
| **¿ERP y administración en el mismo sidebar?** | **✅ Sí** — mismo `NewSidebar`, secciones distintas. Para `platform_admin` / `tenant_admin` puede verse **Módulos + Administración** juntos (problema de separación UX si se busca aislamiento total). |
| **¿Selector de empresa activa en sidebar?** | **❌ No** en sidebar ni header global. La “empresa” se elige **por pantalla** (dropdown `empresaFilter` en muchas páginas ERP) vía listados API, no contexto global de sesión. |

---

## PASO 6 — Análisis de protección de rutas

| Pregunta | Respuesta |
|----------|-----------|
| **Archivo** | `src/shared/components/ProtectedRoute.tsx` (+ `PermissionGuard` para módulos ERP). |
| **¿Solo autenticación?** | En el árbol `/`: sí, basta `isAuthenticated` + permisos inicializados. En `/admin` y `/super-admin`: auth + condición extra. |
| **¿Verifica tipo para `/super-admin/*`?** | **Sí:** `requireSuperAdmin` → `isSuperAdmin` (`user_type === 'platform_admin'`). |
| **¿Verifica `empresa_id` para ERP `/app/*`?** | **No** (y no existe prefijo `/app`). |
| **¿Usuario sin empresa asignada?** | **No manejado** en guards. |
| **¿Selección de empresa pendiente (`empresa_selection_pending`)?** | **No** referenciado en frontend. |

### `ProtectedRoute` — reglas

- Espera `authInitialized`, `!authLoading`, `permissionsInitialized`.
- Sin sesión → `/login` (guarda `from` en state).
- `requiredLevel` (p. ej. 4 en `/admin`) → compara `accessLevel`.
- `requireSuperAdmin` → `isSuperAdmin`.
- `requiredRole` → sinónimos de roles en `auth.user.roles`.

### `PermissionGuard` — reglas ERP

- `accessLevel >= 4` o super admin → **pasa sin comprobar** permiso granular del módulo.
- Usuario normal → `can(module, action)` desde permisos derivados del menú.
- Sin permiso → `/unauthorized`.

### Observación de seguridad UX

Un **tenant admin** autenticado puede entrar manualmente a rutas ERP (`/inv/...`) aunque el menú esté orientado a admin: el árbol `/` no exige `accessLevel < 4` ni `user_type === 'user'`.

---

## PASO 7 — Diagrama del flujo actual

```mermaid
flowchart TD
  A[Login exitoso] --> B[access_token en memoria AuthContext]
  B --> C[Cookie refresh HttpOnly]
  C --> D[GET /auth/me]
  D --> E[GET /auth/menu + permisos derivados]
  E --> F{Login.tsx: rol Super Administrador?}
  F -->|Sí| G[/super-admin/dashboard]
  F -->|No| H{state.from válido?}
  H -->|Sí| I[Ruta from ej. /inv/productos]
  H -->|No| J[/home]
  G --> K[NewLayout]
  I --> K
  J --> K
  K --> L{navMode}
  L -->|sidebar| M[NewSidebar: módulos + admin según user_type]
  L -->|navbar| N[TopNavbar + Header]
  M --> O{¿Ruta ERP con PermissionGuard?}
  N --> O
  O -->|Usuario normal| P[can módulo.ver]
  O -->|Tenant admin o super admin| Q[Acceso directo]
  P -->|No| R[/unauthorized]
  P -->|Sí| S[Contenido módulo]
  Q --> S
```

**Verificaciones antes del contenido:**

1. `AuthGate` — bootstrap `/auth/me` completado.  
2. `ProtectedRoute` — sesión (+ nivel o super admin según árbol).  
3. `PermissionGuard` — permiso de módulo (salvo bypass admin).  
4. **No hay** gate de empresa activa ni selección pendiente.

---

## PASO 8 — Diagnóstico

| Aspecto | Estado | Problema detectado |
|---------|--------|-------------------|
| Rutas `/super-admin/*` separadas | 🟢 | Árbol dedicado con `requireSuperAdmin`. |
| Rutas `/admin/*` separadas | 🟢 | Árbol dedicado con `requiredLevel={4}`. |
| Rutas `/app/*` para ERP | 🔴 | **No implementado.** ERP en raíz (`/inv`, `/org`, …). |
| Layout por contexto | 🔴 | **Un solo `NewLayout`** para los tres contextos. |
| Redirección post-login por tipo usuario | 🟡 | Login usa rol string; no redirige tenant admin a `/admin`. Desalineado con `SmartRedirect` y `user_type`. |
| Redirección por `empresa_id` en JWT | 🔴 | No existe uso de `empresa_id` en auth/routing. |
| Sidebar diferenciado por contexto | 🟡 | Secciones por `user_type`, pero **mismo componente** y posible mezcla ERP + admin. |
| Protección de rutas por tipo usuario | 🟡 | Super admin y tenant admin en rutas propias; tenant admin **puede** acceder al árbol ERP. |
| Pantalla selección de empresa | 🔴 | Ausente. |
| Pantalla onboarding primera empresa | 🔴 | Ausente. |

### Respuestas concretas

**1. ¿Los 3 contextos ya están separados en rutas o mezclados?**

- **Super admin** y **admin cliente** tienen prefijos y guards propios (**parcialmente separados**).
- **ERP operativo** no usa `/app/*`; comparte layout y muchas rutas bajo `/` con **home**, **ORG** y módulos de negocio (**mezclado** respecto al modelo objetivo de tres shells).

**2. ¿El frontend ya usa `empresa_id` del JWT para algo?**

- **No** a nivel de autenticación, routing ni layout.
- **Sí** de forma **local por pantalla**: filtros y formularios ERP llaman APIs con `empresa_id` como query/body tras cargar listas de empresas del backend (patrón repetido en INV, HCM, FIN, etc.).

**3. ¿Qué es lo más urgente a corregir?**

1. **Definir e implementar el prefijo `/app/*`** (o equivalente acordado) y mover módulos ERP fuera de la raíz, con guard que exija contexto operativo (y eventualmente `empresa_id` activa).  
2. **Layouts o shells distintos** (o al menos sidebars 100 % aislados) por contexto, evitando admin + ERP en la misma navegación para roles administrativos.  
3. **Unificar redirección post-login** con `user_type` / `accessLevel` (alinear `Login.tsx` con `SmartRedirect`) y añadir flujo de **selección de empresa** si el backend expone `requiere_seleccion_empresa` o `empresa_selection_pending`.  
4. **Corregir desajuste `platform_admin` vs `super_admin`** en hooks y redirecciones para no depender del string de rol `Super Administrador`.

---

## Referencias de código clave

- Router: `src/app/router.tsx`
- Layout único: `src/shared/components/layout/NewLayout.tsx`
- Protección: `src/shared/components/ProtectedRoute.tsx`, `src/app/router/guards/PermissionGuard.tsx`
- Post-login: `src/features/auth/pages/Login.tsx`, `src/shared/components/SmartRedirect.tsx`
- Menú: `src/shared/components/layout/NewSidebar.tsx`, `src/shared/context/AuthContext.tsx` (carga `/auth/menu`)

---

## Implementación (mayo 2026)

**Estado:** Fase A (rutas/guards) y Fase B (layouts aislados) completadas.

### Archivos clave

| Área | Archivos |
|------|----------|
| Router | `src/app/router.tsx`, `src/app/router/app-route-tree.tsx`, `src/app/router/legacy-redirect-routes.tsx`, `src/app/router/LegacyErpRedirect.tsx` |
| Post-login / rutas | `src/core/routing/post-login-path.ts` (`APP_HOME`, `resolvePostLoginPath`, `mapLegacyErpPath`) |
| Layouts | `src/shared/components/layout/AppLayout.tsx`, `AdminLayout.tsx`, `SuperAdminLayout.tsx`, `NewLayout.tsx`, `LayoutShellContext.tsx` |
| Menú / nav | `src/shared/components/layout/sidebar-menu.utils.ts`, `NewSidebar.tsx`, `TopNavbar.tsx`, `Header.tsx`, `GlobalSearch.tsx`, `src/shared/utils/menuSearch.ts` |
| Guards | `src/shared/components/ProtectedRoute.tsx` (`requireOperationalUser`), `src/app/router/guards/PermissionGuard.tsx` |

### Comportamiento implementado

- **Super admin:** `/super-admin/*` + `SuperAdminLayout` (solo nav administración global).
- **Tenant admin:** `/admin/*` + `AdminLayout` (solo nav administración tenant).
- **Operativo:** `/app/*` + `AppLayout` (solo nav ERP); sin acceso directo para admins a `/app/*`.
- **Menú desde BD:** rutas ERP se normalizan al renderizar/navegar; redirects legacy cubren enlaces antiguos.

### Pendiente (fuera de Punto 3)

- Migración de rutas en BD (`GET /auth/menu` y tablas de menú) para persistir prefijo `/app`.
- Selección de empresa y uso de `empresa_id` / `empresa_selection_pending` en JWT y routing.
- **Punto 4:** auditoría profunda del sidebar dinámico (más allá del aislamiento por shell).
- **Punto 5:** impersonación.

### Enlaces hardcodeados ERP sin `/app` (no corregidos en Fase A)

Funcionan vía redirect legacy; conviene migrar a `/app/...` en limpieza posterior:

| Archivo | Patrón |
|---------|--------|
| `src/features/inv/pages/StockPage.tsx` | `navigate(\`/inv/kardex?...\`)` |
| `src/features/inv/pages/InventarioFisicoPage.tsx` | `Link to={\`/inv/inventario-fisico/${id}/editar\`}` |
| `src/features/inv/pages/MovimientosPage.tsx` | `Link to={\`/inv/movimientos/${id}/editar\`}` (×2) |
| `src/features/fin/pages/AsientosPage.tsx` | `navigate(\`/fin/asientos/${id}/detalles\`)` |
| `src/features/prc/pages/ListasPrecioPage.tsx` | `navigate(\`/prc/listas-precio/${id}/detalles\`)` |
| `src/features/log/pages/GuiasRemisionPage.tsx` | `navigate(\`/log/guias-remision/${id}/detalles\`)` |
| `src/features/log/pages/DespachosPage.tsx` | `navigate(\`/log/despachos/${id}/guias\`)` |
| `src/features/tax/pages/PlePage.tsx` | `navigate(\`/tax/ple/${id}\`)` |

---

*Documento generado por auditoría estática del repositorio. Sección «Implementación» actualizada tras Fases A y B (mayo 2026).*
