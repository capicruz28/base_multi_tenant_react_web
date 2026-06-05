# Auditoría UX/UI funcional — Frontend multi-tenant / multiempresa

**Fecha:** 31 mayo 2026  
**Alcance:** Solo código frontend del repositorio (sin backend ni documentación externa)  
**Módulos excluidos:** ERP operativo (MFG, PUR, SLS, HCM, QMS, BI, etc.)

---

## 1. Resumen ejecutivo

El frontend implementa un modelo SaaS multi-tenant con **sesión por empresa activa**, **menús dinámicos** (`GET /auth/menu`) y **tres shells de navegación** (`/app`, `/admin`, `/super-admin`). Los flujos de login, selección de empresa, onboarding y cambio de sesión están centralizados en `AuthContext`, `ProtectedRoute` y utilidades en `empresa-access.ts`.

**Fortalezas detectadas:**
- Modelo de autenticación en dos fases (Schema A: token de selección → Schema B: JWT completo) con guards coherentes en la mayoría de rutas.
- Selector de empresa en header como punto único de cambio de contexto; módulo ORG alineado con JWT (banner read-only, invalidación de cache al cambiar empresa).
- Menú lateral 100 % dinámico desde backend; guards de módulo (`PermissionGuard`) sincronizados con permisos indexados del menú.
- Fix reciente de race condition post-login (`menuPermissionsReady`) documentado en `POST_LOGIN_PERMISSION_GUARD_FIX.md`.

**Debilidades críticas:**
- **Gestión de usuarios sin asignación de empresa** en UI — gap funcional directo vs. el modelo multiempresa descrito.
- **Dos sistemas de permisos paralelos** (LBAC desde menú vs. RBAC string desde `/auth/permissions/me`) sin unificación ni guía para el administrador.
- **Desalineación Login vs. guards** en reglas de onboarding.
- **Página Unauthorized genérica** que ignora el permiso requerido pasado por navegación.
- **Administración del tenant repartida** entre `/admin/*` y `/app/org/*` sin señalización clara para el usuario.

---

## 2. Alcance y metodología

### 2.1 Áreas auditadas

| Área | Archivos / componentes principales |
|------|-------------------------------------|
| Multiempresa y empresa activa | `AuthContext`, `empresa-access.ts`, `useEmpresaActiva`, `useOrgSessionScope` |
| Selección / cambio de empresa | `SeleccionarEmpresaPage`, `OnboardingEmpresaPage`, `EmpresaSelector`, `empresa-selection.store` |
| Header | `Header.tsx`, `ShellCrossNav`, `ImpersonationSupportBanner` |
| Usuarios / roles / permisos | `UserManagementPage`, `RoleManagementPage`, `RolePermissionsManager` |
| Menús | `NewSidebar`, `MenuSelector`, `MenuManagementPage`, `PermissionGuard` |
| Admin tenant | `/admin/*`, `/app/org/*`, guards ORG |
| Estados vacíos | Sidebar, ORG, admin CRUD, guards |
| Unauthorized | `UnauthorizedPage`, `ProtectedRoute`, `PermissionGuard` |

### 2.2 Mapeo funcional solicitado → código

| Concepto funcional | Equivalente en código | Shell / ruta |
|--------------------|----------------------|--------------|
| ADMIN_TENANT (administra tenant, multiempresa) | `user_type === 'tenant_admin'` | `/admin/*` + `/app/*` (incl. ORG) |
| MANAGER_TENANT (una empresa, operativo) | `user_type === 'user'` con permisos de menú | `/app/*` |
| USER_TENANT (consulta) | `user_type === 'user'` con permisos reducidos | `/app/*` |
| Platform / SYS_ADMIN | `platform_admin` / `isSuperAdmin` | `/super-admin/*` (bloqueado en `/app` salvo impersonación) |

> **Nota:** No existen tipos `ADMIN_TENANT`, `MANAGER_TENANT` ni `USER_TENANT` en el código. La distinción manager vs. user operativo depende exclusivamente de **roles asignados** y **permisos del menú**, no de un `user_type` dedicado.

---

## 3. Arquitectura UX actual

### 3.1 Flujo post-login

```mermaid
flowchart TD
  Login[Login] --> SchemaA{Schema A?}
  SchemaA -->|Sí| SelEmp[/app/seleccionar-empresa]
  SchemaA -->|No| OnboardCheck{Admin sin empresa?}
  OnboardCheck -->|Login simple| Onb[/app/onboarding]
  OnboardCheck -->|Guards completos| SelCheck{Debe seleccionar?}
  SelCheck -->|Sí| SelEmp
  SelCheck -->|No| Resolve[resolvePostLoginPath desde menú]
  Resolve --> AppShell[/app/*]
  Resolve --> AdminShell[/admin/*]
  Resolve --> SuperShell[/super-admin/*]

  SelEmp --> SelectAPI[POST /auth/empresa/seleccionar]
  SelectAPI --> Home[/app/home fijo]

  Onb --> CreateEmp[/app/org/empresa?onboarding=true]
```

### 3.2 Capas de protección

```
AuthGate (bootstrap)
  → ProtectedRoute (shell + empresa + sesión ready)
    → PermissionGuard (módulo.ver desde /auth/menu)
      → OrgCompanyRouteGuard / OrgTenantRouteGuard (scope ORG)
```

### 3.3 Fuentes de verdad

| Dato | Fuente primaria | UI que lo consume |
|------|-----------------|-------------------|
| Empresa activa | JWT `empresa_id` + `/auth/me` | Header `EmpresaSelector`, ORG banner |
| Empresas elegibles | `/auth/me` → `empresas_disponibles`; fallback tenant_admin: catálogo ORG | Selector header, selección login |
| Menú visible | `GET /auth/menu` | Sidebar, breadcrumbs, post-login path |
| Permisos de ruta | Indexado desde menú (`indexRoutePermissionsFromMenu`) | `PermissionGuard` |
| Permisos granulares UI | `GET /auth/permissions/me` (strings) | Algunos botones WMS; gate de spinner en `ProtectedRoute` |

---

## 4. Hallazgos UX/UI por área

### 4.1 Multiempresa y empresa activa

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| ME-01 | **tenant_admin ve todas las empresas del tenant** en el selector (fallback `empresaService.list`), no solo las asignadas por rol. Comportamiento distinto al operativo, pero no explicado en UI. | Media |
| ME-02 | **Operativo con una sola empresa** ve pill read-only en header — correcto, pero sin tooltip que indique “sesión limitada a esta empresa”. | Baja |
| ME-03 | **`OrgActiveEmpresaBanner` puede no mostrarse** si la empresa activa no está en `empresasElegibles` (sin fallback API), mientras el header sí resuelve el nombre vía `getById`. Inconsistencia visual entre ORG y header. | Media |
| ME-04 | Tras **cambio de empresa**, se recarga sesión completa (token, menú, permisos, cache ORG) con toast de confirmación — buena UX, pero **no hay aviso de que datos en pantalla pueden quedar obsoletos** si el usuario tenía formularios abiertos en otra pestaña. | Baja |
| ME-05 | **`canAccessErp` excluye `tenant_admin`**, pero `tenant_admin` sí accede a `/app/*`. La utilidad no refleja la UX real; puede generar guards ORG confusos (`canAccessCompanyOrg` false para tenant_admin en algunos edge cases). | Media |

### 4.2 Selección de empresa (login)

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| SE-01 | Pantalla **minimalista y clara** (`SeleccionarEmpresaPage`): iconografía, copy, loading por fila, manejo 401/403/409 con redirect a login. | Positivo |
| SE-02 | **Lista vacía sin acciones**: solo texto “No hay empresas disponibles para su usuario.” — sin botón cerrar sesión, reintentar ni contacto soporte. Usuario bloqueado. | Alta |
| SE-03 | **Sin opción “recordar última empresa”** ni indicador de cuál usó antes (depende 100 % del backend Schema A). | Baja |
| SE-04 | Tras seleccionar, **destino fijo `/app/home`** (`resolvePostEmpresaSelectionPath`), no respeta menú del usuario ni tipo (tenant_admin podría preferir `/admin`). | Media |

### 4.3 Onboarding (primera empresa)

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| OB-01 | Flujo **onboarding → crear empresa en ORG** bien encadenado con `?onboarding=true` y chrome oculto. | Positivo |
| OB-02 | **Sin logout ni “salir”** en `OnboardingEmpresaPage`. Usuario atrapado si entró por error. | Media |
| OB-03 | **Regla de onboarding en Login diverge de guards**: Login usa `es_admin_cliente && !empresa_activa`; guards usan `shouldOnboardEmpresa` que exige además `empresasDisponiblesCount === 0` y `!requiereSeleccionEmpresa`. Puede redirigir a onboarding cuando debería ir a selección, o viceversa. | Alta |

### 4.4 Header

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| HE-01 | **Selector visible** en shell `app` para operativos y en `admin` solo para `tenant_admin`. Operativo en `/admin` no aplica (bloqueado por guard). Coherente. | Positivo |
| HE-02 | **`ShellCrossNav`** permite a tenant_admin alternar ERP ↔ Administración usando primera ruta visible del menú — útil pero **etiquetas genéricas** (“Administración”, “Módulos”) sin indicar destino concreto. | Media |
| HE-03 | **Menú de usuario**: “Mi perfil”, “Bandeja de entrada”, “Configuraciones” son **placeholders sin navegación**. Expectativa rota. | Media |
| HE-04 | Badge de tipo de usuario (**ADMINISTRADOR GLOBAL**, nombre tenant, USUARIO) ayuda orientación, pero **no distingue MANAGER vs USER** operativo. | Media |
| HE-05 | Durante carga de nombre de empresa, muestra **“Cargando empresa…”** en cursiva — aceptable; si falla API, puede quedar pill con UUID en `title` sin feedback visible al usuario. | Baja |
| HE-06 | **Banner impersonación** (modo soporte) visible solo en shell `app` — claro, con salida explícita. | Positivo |

### 4.5 Usuarios (`/admin/usuarios`)

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| US-01 | **No existe UI para asignar empresa(s) a un usuario.** Tipos `UserFormData` / `UserWithRoles` no incluyen `empresa_id`. Búsqueda en todo `src/features/admin` sin referencias a “empresa”. **Gap crítico vs. modelo multiempresa.** | Crítica |
| US-02 | Tabla muestra **`usuario_id` (UUID)** como primera columna — dato técnico sin valor para el administrador del tenant. | Media |
| US-03 | CRUD de usuarios con roles en create/edit modal — funcional para roles, **no para ámbito empresa**. | — |
| US-04 | Estados vacíos **mínimos** (texto plano en celda de tabla, sin icono ni CTA). Contraste con páginas ORG. | Baja |
| US-05 | Guard de fetch espera autenticación (`authLoading`, `isAuthenticated`) — patrón correcto (a diferencia de roles). | Positivo |
| US-06 | Desactivación de usuario con confirmación; estado Activo/Inactivo visible. | Positivo |

### 4.6 Roles y permisos (`/admin/roles`)

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| RO-01 | **`RolePermissionsManager`** combina dos mundos: permisos de menú (LBAC, colapsable/avanzado) y **permisos de negocio (RBAC)** como sección principal. Copy indica que menú es “opcional”, pero un admin puede no entender la relación menú ↔ acceso real. | Alta |
| RO-02 | **Fallo silencioso** al cargar permisos de menú → matriz vacía sin error. Admin puede guardar creyendo que no hay permisos. | Alta |
| RO-03 | Permisos de negocio muestran **mensaje explícito en 403** (`admin.rol.leer`) — buen patrón, ausente en otras áreas. | Positivo |
| RO-04 | **`RoleManagementPage` no espera auth ready** antes del fetch inicial (a diferencia de usuarios). Riesgo de requests prematuros / estados inconsistentes. | Media |
| RO-05 | No hay indicación de **qué permisos afectan shell admin vs. módulos ERP** en la UI de roles. | Media |

### 4.7 Menús

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| MN-01 | Sidebar **100 % dinámico** desde `/auth/menu`; estados loading y “Sin módulos disponibles” cuando ERP vacío. | Positivo |
| MN-02 | **`/admin/menus` (`MenuManagementPage`) sigue registrado y accesible por URL** aunque la intención de producto es que estructura la define platform admin. Riesgo de tenant editando árbol global por error. | Alta |
| MN-03 | **`/admin/areas` también accesible** pero oculto del menú lateral dinámico — ruta huérfana. | Media |
| MN-04 | Sidebar vacío **no ofrece enlace** a panel admin, selección de empresa ni soporte — usuario sin módulos queda en `/app/home` con mensaje lateral mínimo y home genérico. | Alta |
| MN-05 | Posible **desincronización menú visible vs. `PermissionGuard`**: ítem visible en sidebar pero deep link / F5 → `/unauthorized` si falta `modulo.ver` indexado. | Media |

### 4.8 Administración del tenant

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| AD-01 | **Dos ubicaciones** para administrar el tenant: **configuración organizacional** en `/app/org/*` (empresas, sucursales, parámetros) y **seguridad/usuarios** en `/admin/*`. No hay mapa mental unificado. | Alta |
| AD-02 | **`EmpresaPage`** (crear/gestionar empresas) bajo ORG en shell ERP; **usuarios/roles** bajo shell admin. Flujo “alta de empresa + alta de usuarios asignados” **no está guiado**. | Alta |
| AD-03 | **`OrgCompanyRouteGuard`** muestra empty state inline rico (“Empresa activa requerida”) — buen patrón reutilizable. | Positivo |
| AD-04 | **`ParametrosPage`** con tabs híbridos (efectivos / globales / overrides) y hint de precedencia — UX avanzada pero bien documentada in-page. | Positivo |
| AD-05 | **`tenant_admin` en `/admin` ve selector de empresa** con catálogo completo; operaciones admin (usuarios) **no filtran por empresa activa** en UI — ambigüedad sobre si usuarios son tenant-wide o por empresa. | Alta |

### 4.9 Estados vacíos

| ID | Patrón | Evaluación |
|----|--------|------------|
| ES-01 | ORG tablas: icono + mensaje contextual + CTA crear | Bueno |
| ES-02 | Admin tablas: texto plano centrado | Débil |
| ES-03 | Sidebar: “Sin módulos disponibles” | Insuficiente (sin next step) |
| ES-04 | Selección empresa lista vacía | Crítico (sin escape) |
| ES-05 | Onboarding: solo CTA crear | Aceptable para happy path |
| ES-06 | Home (`/app/home`): solo título “Bienvenido…” | No orienta al usuario sin módulos |

### 4.10 Unauthorized

| ID | Hallazgo | Severidad UX |
|----|----------|--------------|
| UN-01 | **`UnauthorizedPage` recibe `requiredPermission` en state** (desde `PermissionGuard`) pero **no lo muestra** — mensaje genérico “no tienes los permisos necesarios”. | Alta |
| UN-02 | **`ProtectedRoute` redirige a `/unauthorized` sin state** — imposible saber si fue por rol, tenant admin, super admin o nivel. | Media |
| UN-03 | Botón “Volver” usa **`resolvePostLoginPath`** (menu-aware) — correcto para no dejar al usuario atrapado. | Positivo |
| UN-04 | Fix **`menuPermissionsReady`** reduce redirects transitorios post-login; riesgo residual si menú y permisos string divergen. | Media |

---

## 5. Inconsistencias funcionales

| # | Descripción | Evidencia en código |
|---|-------------|---------------------|
| IF-01 | Login onboarding ≠ `shouldOnboardEmpresa` | `Login.tsx` L103-108 vs `empresa-access.ts` L73-99 |
| IF-02 | Post-selección empresa siempre `/app/home`; post-login usa menú | `post-login-path.ts` L172-189 vs `resolvePostLoginPath` |
| IF-03 | `useUserType.canManageUsers` incluye roles `admin`/`supervisor`, pero `/admin/*` exige `user_type === 'tenant_admin'` | `useUserType.ts` L20-21 vs `ProtectedRoute.tsx` L188-198 |
| IF-04 | Dos APIs de permisos: menú (LBAC) vs `/auth/permissions/me` (RBAC strings) | `AuthContext` vs `PermissionContext.tsx` |
| IF-05 | `determineUserType` fallback devuelve `'super_admin'`; resto del código usa `'platform_admin'` | `AuthContext.tsx` L230-234 |
| IF-06 | Header resuelve label empresa con API fallback; ORG banner no | `EmpresaSelector.tsx` L83-109 vs `useOrgSessionScope.ts` L77-80 |
| IF-07 | Rutas admin huérfanas (`/admin/areas`, `/admin/menus`) registradas pero fuera del menú dinámico | `admin/routes.tsx` |
| IF-08 | `SmartRedirect` prioriza selección antes que onboarding; `ProtectedRoute` prioriza onboarding antes que selección en `/app` | `SmartRedirect.tsx` L39-58 vs `ProtectedRoute.tsx` L161-177 |
| IF-09 | Modelo funcional habla de asignar empresa a usuarios; frontend admin no lo implementa | Ausencia en `UserManagementPage` y tipos usuario |

---

## 6. Problemas de comprensión para el usuario

1. **“¿Por qué no veo el panel de administración?”** — Solo `tenant_admin` accede a `/admin`. Un supervisor con rol `admin` pero `user_type: user` no entiende por qué el menú ERP sí aparece pero “Administración” no.

2. **“¿Estoy viendo datos de qué empresa?”** — El selector en header ayuda, pero páginas `/admin/usuarios` no muestran empresa activa ni aclaran si la gestión es tenant-wide.

3. **“¿Menú o permisos de negocio?”** — Al editar un rol, dos sistemas con nombres similares; el administrador no sabe cuál controla qué pantalla.

4. **“¿ORG o Admin?”** — Crear empresas está en “Organización” (`/app/org/empresa`); crear usuarios en “Administración” (`/admin/usuarios`). Sin onboarding guiado, el tenant nuevo no tiene un recorrido claro.

5. **“Acceso denegado sin explicación”** — `/unauthorized` no indica módulo ni permiso faltante (`inv.ver`, `requireTenantAdmin`, etc.).

6. **“No tengo módulos”** — Sidebar vacío + home genérico no explican si es falta de permisos, falta de roles, o empresa incorrecta.

7. **Badges de usuario** — “USUARIO” no diferencia consulta vs. gestión operativa dentro de la empresa.

8. **Placeholder del menú usuario** — Opciones que parecen funcionales pero no navegan.

---

## 7. Problemas de navegación

| # | Problema | Impacto |
|---|----------|---------|
| NV-01 | **Dos shells para tenant admin** (`/app` + `/admin`) unidos solo por `ShellCrossNav` — fácil perder contexto de dónde configurar qué. | Alto |
| NV-02 | **Post-selección empresa fuerza ERP home** aunque el usuario sea admin con destino natural en `/admin`. | Medio |
| NV-03 | **Rutas admin ocultas pero navegables** (`/admin/menus`, `/admin/areas`) — navegación por URL inconsistente con sidebar. | Medio |
| NV-04 | **Breadcrumbs reemplazan títulos de página** (`OrgPageLayout` depreca title) — en admin CRUD no hay breadcrumbs ricos; páginas pueden sentirse “huérfanas”. | Bajo |
| NV-05 | **`/app/home` wildcard** redirige rutas ERP desconocidas a home — usuario puede creer que llegó a un destino válido. | Medio |
| NV-06 | **Selección/onboarding sin chrome** — correcto para foco, pero sin link global de logout en selección de empresa. | Medio |
| NV-07 | **Cross-nav destino depende del orden del menú backend** — cambio en API altera adónde lleva “Administración” / “Módulos”. | Medio |

---

## 8. Riesgos operativos

| # | Riesgo | Consecuencia |
|---|--------|--------------|
| RO-01 | **Usuarios creados sin asignación de empresa en UI** | Operativos sin empresas en `/auth/me` → bloqueo en selección o ERP |
| RO-02 | **Tenant edita menú global en `/admin/menus`** | Estructura de navegación corrupta para todo el tenant |
| RO-03 | **Permisos de menú mal configurados + fallo silencioso** | Roles sin acceso real; soporte difícil de diagnosticar |
| RO-04 | **Divergencia LBAC vs RBAC** | Botones visibles pero API 403, o rutas bloqueadas con acciones permitidas en UI |
| RO-05 | **Onboarding vs selección desalineados** | Admin multiempresa atrapado en flujo incorrecto tras login |
| RO-06 | **Cambio de empresa sin advertencia de formularios** | Pérdida de datos o guardado en scope incorrecto |
| RO-07 | **Race residual post-login** (mitigado pero no eliminado para todos los paths) | Flash de unauthorized en conexiones lentas |
| RO-08 | **Impersonación → selección empresa → `/app/home`** | Soporte platform puede no encontrar panel admin del tenant si lo necesita |

---

## 9. Roadmap priorizado

### P0 — Crítico (bloquea operación o genera datos incorrectos)

| ID | Acción | Justificación |
|----|--------|---------------|
| P0-1 | **Implementar asignación de empresa(s) en gestión de usuarios** (listado, alta, edición) | Modelo multiempresa incompleto sin esto |
| P0-2 | **Unificar regla de onboarding** entre `Login.tsx`, `SmartRedirect` y `ProtectedRoute` | Usuarios admin atrapados o mal enrutados |
| P0-3 | **Empty state accionable en selección sin empresas** (logout, reintentar, mensaje soporte) | Callejón sin salida |
| P0-4 | **Mostrar permiso/motivo en `UnauthorizedPage`** (`requiredPermission`, tipo de guard) | Diagnóstico y autonomía del admin |
| P0-5 | **Restringir o eliminar `/admin/menus` para tenant** (redirect, guard, o feature flag) | Evitar edición accidental de estructura global |

### P1 — Importante (fricción alta, confusión frecuente)

| ID | Acción | Justificación |
|----|--------|---------------|
| P1-1 | **Unificar UX de permisos en roles** — wizard o copy que explique LBAC (menú) vs RBAC (negocio) | Reduce errores de configuración |
| P1-2 | **Error visible si falla carga de permisos de menú** en `RolePermissionsManager` | Evita matrices vacías silenciosas |
| P1-3 | **`resolvePostEmpresaSelectionPath` alineado con `resolvePostLoginPath`** | Paridad post-login / post-selección |
| P1-4 | **Indicador de empresa activa en páginas `/admin/*`** + aclarar scope tenant vs empresa | Comprensión multiempresa |
| P1-5 | **Empty state sidebar sin módulos** con links (admin, contacto, logout) | Usuarios sin módulos orientados |
| P1-6 | **Alinear `useUserType.canManageUsers` con guard `/admin`** o documentar en UI por qué no aplica | Expectativa supervisor/admin |
| P1-7 | **Logout en onboarding y selección de empresa** | Escape de flujos bloqueantes |
| P1-8 | **Ocultar o proteger `/admin/areas`** si está deprecado | Rutas huérfanas |
| P1-9 | **Guard de auth en `RoleManagementPage`** igual que usuarios | Consistencia de carga |
| P1-10 | **Fallback de label en `OrgActiveEmpresaBanner`** igual que header | Consistencia visual ORG |

### P2 — Mejora futura (calidad, pulido, deuda)

| ID | Acción | Justificación |
|----|--------|---------------|
| P2-1 | Componente **`EmptyState` compartido** (icono, título, descripción, CTA) | Consistencia admin vs ORG |
| P2-2 | **Home dashboard orientativo** según tipo usuario / módulos disponibles | Reemplazar placeholder “Bienvenido…” |
| P2-3 | **Wire-up o eliminar placeholders** del menú usuario (perfil, bandeja, settings) | Evitar expectativas rotas |
| P2-4 | **Diferenciar badge MANAGER vs USER** operativo (desde roles o permisos) | Claridad de capacidades |
| P2-5 | **Tooltips en selector empresa** (solo lectura vs multi) | Autoexplicación |
| P2-6 | **Confirmación al cambiar empresa** si hay formularios dirty (patrón global) | Prevención pérdida de datos |
| P2-7 | **Unificar sistemas de permisos** a una sola fuente o capa de abstracción | Deuda arquitectónica UX |
| P2-8 | **Eliminar `adminMenu.ts` estático duplicado** (código muerto) | Mantenibilidad |
| P2-9 | **Ocultar columna UUID** en tabla usuarios; mostrar nombre completo prominente | Legibilidad admin |
| P2-10 | **Mapa de “Administración del tenant”** — hub o sección en sidebar que agrupe ORG + Admin | Navegación unificada |
| P2-11 | **Corregir fallback `determineUserType` → `platform_admin`** | Robustez si backend omite `user_type` |
| P2-12 | **Recordar última empresa seleccionada** (localStorage + backend) | UX multiempresa recurrente |

---

## 10. Matriz de cobertura vs. objetivo

| Objetivo auditoría | Cobertura | Estado general |
|--------------------|-----------|----------------|
| Multiempresa | Flujos Schema A/B, elegibles, JWT | Implementado con gaps en admin usuarios |
| Empresa activa | Header, ORG, guards | Sólido en ERP/ORG; débil en admin |
| Cambio de empresa | `cambiarEmpresaActiva`, invalidación cache | Funcional |
| Header | Selector, cross-nav, impersonación | Funcional con placeholders |
| Usuarios | CRUD + roles | **Sin empresa** |
| Roles | CRUD + permisos dual | Funcional pero confuso |
| Permisos | LBAC + RBAC paralelos | Funcional pero inconsistente |
| Menús | Dinámico + gestión tenant | Riesgo en `/admin/menus` |
| Admin tenant | `/admin` + `/app/org` | Fragmentado |
| Estados vacíos | Mixto | Débil en admin y sin módulos |
| Unauthorized | Página global | Genérica |

---

## 11. Anexo — referencias de código

| Tema | Archivo |
|------|---------|
| Reglas empresa | `src/core/auth/utils/empresa-access.ts` |
| Sesión central | `src/shared/context/AuthContext.tsx` |
| Guards ruta | `src/shared/components/ProtectedRoute.tsx` |
| Guard módulo | `src/app/router/guards/PermissionGuard.tsx` |
| Post-login | `src/core/routing/post-login-path.ts` |
| Login | `src/features/auth/pages/Login.tsx` |
| Selección | `src/features/auth/pages/SeleccionarEmpresaPage.tsx` |
| Selector header | `src/shared/components/layout/EmpresaSelector.tsx` |
| Usuarios | `src/features/admin/pages/UserManagementPage.tsx` |
| Roles/permisos | `src/features/admin/components/RolePermissionsManager.tsx` |
| Unauthorized | `src/pages/UnauthorizedPage.tsx` |
| Sidebar vacío | `src/shared/components/layout/NewSidebar.tsx` (~L729) |
| ORG scope | `src/features/org/hooks/useOrgSessionScope.ts` |
| Fix post-login | `POST_LOGIN_PERMISSION_GUARD_FIX.md` |

---

## 12. Conclusión

El frontend tiene **bases sólidas** para multi-tenant y multiempresa en autenticación, sesión JWT y navegación dinámica. Los principales problemas UX/UI están en la **capa de administración del tenant**: gestión de usuarios incompleta respecto a empresas, permisos duales difíciles de entender, administración repartida entre dos shells, estados vacíos desiguales y una experiencia de acceso denegado poco informativa.

Priorizar **P0-1 a P0-5** reduce riesgo operativo inmediato y alinea la interfaz con el modelo funcional descrito (ADMIN_TENANT multiempresa, MANAGER/USER por empresa, menús y permisos dinámicos).

---

*Documento generado por auditoría estática del código frontend. No incluye cambios de implementación.*
