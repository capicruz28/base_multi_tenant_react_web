# AUDITORÍA FINAL FRONTEND — MULTI-COMPANY ARCHITECTURE REFACTORING

**Fecha:** mayo 2026  
**Alcance:** Verificación estática del estado real del frontend frente a los 5 puntos de refactorización y al contrato backend multi-empresa.  
**Metodología:** Lectura de código en `src/`, routers, contextos, servicios auth y documentación (`docs/FLUJO_AUTH_MULTIEMPRESA_FE.md`, auditorías previas). **No se modificó código de aplicación.**

**Referencias backend:** `docs/FLUJO_AUTH_MULTIEMPRESA_FE.md`, `docs/backend_openapi.json`  
**Referencias frontend previas:** `AUDITORIA_RUTAS_LAYOUTS.md`, `AUDITORIA_EMPRESA_JWT.md`, `AUDITORIA_SIDEBAR_CONTEXTO.md`, `AUDITORIA_IMPERSONACION.md`, `contexto-refactorizacion.mdc`

---

## OBJETIVO

Verificar el estado real de implementación de los 5 puntos de refactorización en el frontend, contrastando con lo que el backend ya tiene listo. Identificar qué está correcto, qué está incompleto y qué falta implementar.

---

## CONTEXTO — Lo que el backend ya tiene listo

- JWT incluye: `empresa_id`, `es_admin_cliente`, `user_type`, `is_super_admin`, `access_level`, `empresa_selection_pending`
- Login devuelve: `Token` normal o `LoginEmpresaSelectionResponse` con `requiere_seleccion_empresa`, `empresas_disponibles`, `selection_token`
- Endpoints: `POST /auth/login/`, `POST /auth/refresh/`, `POST /auth/empresa/seleccionar/`, `POST /auth/empresa/cambiar/`, `GET /auth/me/`, `GET /auth/menu`, `GET /auth/permissions/me`
- `user_data` en login incluye: `empresa_activa`, `es_admin_cliente`
- `modulo_menu` en BD con rutas `/app/org/*`, `/app/inv/*`, etc.
- Onboarding crea usuario admin con `empresa_id = NULL` en `usuario_rol`

---

## PUNTO 1 — JWT y tipos de usuario en el frontend

### 1.1 Lectura del JWT

| Pregunta | Resultado |
|----------|-----------|
| ¿Se decodifica el JWT en el cliente? | ✅ |
| Archivo | `src/core/auth/utils/decodeAccessToken.ts` |
| Claims leídos | `empresa_id`, `empresa_selection_pending`, `es_admin_cliente`, `user_type`, `cliente_id`, `sub` |
| Claims **no** leídos del JWT en decode | `is_super_admin`, `access_level` (se toman de `/auth/me` / `user_data`) |

**Fuente combinada de empresa y flags:** `AuthContext.syncEmpresaSession()` prioriza `user_data` de `/auth/me` y complementa con claims JWT (`empresa_activa` → `empresaActivaId`; fallback `claims.empresa_id`).

### 1.2 AuthContext y tipos

Archivo principal: `src/shared/context/AuthContext.tsx`  
Tipos: `src/features/auth/types/auth.types.ts` (`UserData`)

| Campo | ¿Presente en el tipo? | ¿Se usa en algún componente? |
|-------|----------------------|------------------------------|
| `empresa_id` | ❌ (no en `UserData`; BE usa `empresa_activa` en perfil) | ✅ vía `empresaActivaId` en contexto (mapeo `empresa_activa` + JWT `empresa_id`) |
| `empresa_activa` | ✅ | ✅ (`AuthContext`, guards, login, selección) |
| `es_admin_cliente` | ✅ | ✅ (`empresa-access.ts`, `ProtectedRoute`, login) |
| `user_type` | ✅ | ✅ (login, guards, sidebar, `useUserType`) |
| `is_super_admin` | ✅ | ✅ (fallback si falta `user_type`; no define `isSuperAdmin` directamente) |
| `access_level` | ✅ | ✅ (`ProtectedRoute` nivel 4, `resolvePostLoginPath`) |
| `requiere_seleccion_empresa` | ✅ | ✅ (fase selection, skip menú/permisos) |

**Estado expuesto en contexto (además de `auth.user`):** `empresaActivaId`, `empresasDisponibles`, `requiereSeleccionEmpresa`, `esAdminCliente`, `canAccessErp`, `mustSelectEmpresa`.

### 1.3 useUserType

Archivo canónico: `src/core/hooks/useUserType.ts` (re-export: `src/hooks/useUserType.ts`).

| Verificación | Resultado |
|--------------|-----------|
| ¿Compara `user_type` con `'platform_admin'`? | ✅ (`canAccessSuperAdmin`, `isOperationalUser`) |
| ¿Usa `'super_admin'` como tipo operativo? | ❌ como destino de login; el fallback interno `determineUserType()` en `AuthContext` devuelve `'super_admin'` si `is_super_admin` sin `user_type` — **divergencia menor** si el BE solo emite `platform_admin` |
| ¿`isSuperAdmin` usa comparación correcta? | ✅ En contexto: `setIsSuperAdmin(type === 'platform_admin')` |
| ¿`isTenantAdmin` / tenant admin? | ✅ `userType === 'tenant_admin'` o `accessLevel >= 4` (`AccessLevel.TENANT_ADMIN`) |

### 1.4 Llamada a /auth/me

| Pregunta | Resultado |
|----------|-----------|
| ¿Se llama `GET /auth/me`? | ✅ Tras login completo (`applyFullSessionToken` → `initializeAuth`), en fase selección (`setAuthFromEmpresaSelection`), y en bootstrap (`refresh` + `initializeAuth`) |
| ¿Se mapea a empresa y admin? | ✅ `normalizeUserData` preserva `empresa_activa`, `es_admin_cliente`, `requiere_seleccion_empresa`; `syncEmpresaSession` actualiza `empresaActivaId` y flags |

**Nota:** El comentario en `AuthContext` indica que el usuario “solo proviene de `/auth/me`” tras tener token; el login guarda token primero y luego hidrata con `me`.

---

## PUNTO 2 — Flujo post-login y selección de empresa

### 2.1 Redirección post-login

Archivos: `src/features/auth/pages/Login.tsx`, `src/shared/components/SmartRedirect.tsx`, `src/core/routing/post-login-path.ts`

| Condición | ¿A dónde redirige? | ¿Correcto? |
|-----------|-------------------|------------|
| `user_type === 'platform_admin'` | `/super-admin/dashboard` (`resolvePostLoginPath`) | ✅ |
| `access_level >= 4` / `tenant_admin` | `/admin/usuarios` | ✅ |
| `requiere_seleccion_empresa = true` (respuesta B o flag en user) | `/app/seleccionar-empresa` | ✅ en `Login.tsx` |
| `es_admin_cliente` sin empresa | `/app/home` (no va a selección; `canAccessErp` permite ERP) | ✅ alineado con reglas BE/onboarding |
| Usuario normal con empresa | `/app/home` o `from` mapeado a `/app/*` | ✅ |
| Usuario normal sin empresa y no admin | `/app/seleccionar-empresa` | ✅ |

**SmartRedirect (`/`):** Solo usa `resolvePostLoginPath` por tipo/nivel; **no** comprueba `requiere_seleccion_empresa` ni `mustSelectEmpresa`. El guard de `/app/*` corrige en la práctica al entrar al ERP. | 🟡 |

### 2.2 Pantalla de selección de empresa

| Verificación | Resultado |
|--------------|-----------|
| ¿Existe componente? | ✅ `src/features/auth/pages/SeleccionarEmpresaPage.tsx` |
| ¿Ruta en router? | ✅ `/app/seleccionar-empresa` en `src/app/router/app-route-tree.tsx` |
| ¿Llama `POST /auth/empresa/seleccionar/`? | ✅ vía `authService.seleccionarEmpresa` + `completeEmpresaSelection` |
| ¿Actualiza AuthContext? | ✅ `applyFullSessionToken` → `initializeAuth` + menú |
| ¿Redirige después? | ✅ `APP_HOME` (`/app/home`) |
| ¿UI sin UUID? | ✅ Muestra `razon_social` / `nombre_comercial` (`buildEmpresaOptions` + fallback genérico) |

**Menú/permisos con selection token:** No se invoca `GET /auth/menu` ni `GET /auth/permissions/me` (`shouldSkipErpMenuLoad`, `PermissionContext` con `requiereSeleccionEmpresa`). | ✅ |

### 2.3 Pantalla de onboarding primera empresa

| Verificación | Resultado |
|--------------|-----------|
| ¿Componente dedicado onboarding/setup? | ❌ No hay ruta `/app/onboarding` ni wizard específico |
| ¿Ruta definida? | ❌ |
| ¿Redirección explícita si `es_admin_cliente` sin empresa? | ❌ No; entra a `/app/home` y puede usar módulo ORG |
| Alternativa existente | 🟡 `EmpresaPage` en `/app/org/empresa` (CRUD “Crear empresa”) — no es flujo guiado de onboarding |

### 2.4 Cambio de empresa en sesión

| Verificación | Resultado |
|--------------|-----------|
| ¿Selector en header? | ✅ `EmpresaSelector.tsx` en `Header.tsx` solo si `shell === 'app'` |
| ¿Selector en sidebar? | ❌ |
| ¿`POST /auth/empresa/cambiar/`? | ✅ `authService.cambiarEmpresa` → `cambiarEmpresaActiva` |
| ¿Actualiza contexto y menú? | ✅ `applyFullSessionToken` + `loadMenuAndPermissionsFromAuthMenu` |
| ¿Limpia cache React Query? | ❌ No hay `invalidateQueries` / `queryClient` en `AuthContext` al cambiar empresa |
| ¿Visible si 1 empresa? | ❌ (`showEmpresaSelector` requiere `empresasDisponibles.length > 1`) |

---

## PUNTO 3 — Separación de rutas

### 3.1 Prefijos de rutas

Archivo: `src/app/router.tsx`

| Contexto | Prefijo | ¿Existe? |
|----------|---------|----------|
| Super Admin CAXIS | `/super-admin/*` | ✅ + `SuperAdminLayout` + `requireSuperAdmin` |
| Admin cliente | `/admin/*` | ✅ + `AdminLayout` + `requiredLevel={4}` |
| ERP operativo | `/app/*` | ✅ + `AppLayout` + `requireOperationalUser` |

### 3.2 Módulos ERP bajo `/app/*`

Definidos en `src/app/router/app-route-tree.tsx` (hijos de `/app`):

| Módulo | Ruta anterior (legacy) | Ruta actual | ¿Bajo `/app/*`? |
|--------|------------------------|-------------|-----------------|
| Home | `/home` | `/app/home` | ✅ |
| ORG | `/org/*` | `/app/org/*` | ✅ |
| INV | `/inv/*` | `/app/inv/*` | ✅ |
| PUR, SLS, facturación, PRC, LOG, FIN, WMS, QMS, CRM, POS, HCM, MFG, MRP, MPS, MNT, CST, TAX, BDG, PM, SVC, TKT, DMS, WFL, BI, AUD | `/{modulo}/*` | `/app/{modulo}/*` | ✅ |
| Autorización / reportes HCM | `/finalizartareo`, `/reportedestajo` | `/app/autorizacion/*`, `/app/reportes/*` | ✅ |

Routers internos (ej. `OrgRouter`) usan paths relativos (`empresa`, `sucursales`); el prefijo `/app/org` lo aplica el árbol padre.

### 3.3 Redirects de compatibilidad

Archivo: `src/app/router/legacy-redirect-routes.tsx` + `LegacyErpRedirect` + `mapLegacyErpPath` / `toAppPath`.

| Redirect | ¿Existe? |
|----------|----------|
| `/org/*` → `/app/org/*` | ✅ (segmento `org` en `ERP_ROUTE_SEGMENTS`) |
| `/inv/*` → `/app/inv/*` | ✅ |
| `/home` → `/app/home` | ✅ |
| Resto de segmentos ERP | ✅ Un redirect por cada entrada de `ERP_ROUTE_SEGMENTS` (28 segmentos + aliases) |

**Conteo:** ~28 módulos ERP con `{path: '/{segment}', ...}` y `{path: '/{segment}/*', ...}` más `/home` y aliases HCM.

### 3.4 Guards por contexto

Archivo: `src/shared/components/ProtectedRoute.tsx`  
Guard adicional: `src/app/router/guards/PermissionGuard.tsx` (permisos por módulo en rutas hijas).

| Guard | ¿Existe? | ¿Qué verifica? |
|-------|----------|----------------|
| `requireSuperAdmin` para `/super-admin/*` | ✅ | `isSuperAdmin` (`user_type === 'platform_admin'`) |
| `requiredLevel >= 4` para `/admin/*` | ✅ | `accessLevel < 4` → `/unauthorized` |
| Empresa / ERP para `/app/*` | ✅ (integrado, no componente separado) | `requireOperationalUser` + `mustSelectEmpresa` / `canAccessErp` |
| `requireOperationalUser` para `/app/*` | ✅ | Excluye `platform_admin` y `tenant_admin`; redirige a sus shells |

### 3.5 EmpresaGuard

| Verificación | Resultado |
|--------------|-----------|
| ¿Existe componente `EmpresaGuard`? | ❌ |
| Equivalente | ✅ Lógica en `ProtectedRoute` + `src/core/auth/utils/empresa-access.ts` |
| ¿Lee empresa del contexto/JWT? | ✅ `empresaActivaId`, `requiereSeleccionEmpresa`, claims vía `syncEmpresaSession` |
| ¿Redirige si selection pending? | ✅ → `/app/seleccionar-empresa` |
| ¿Redirige si operativo sin empresa y no admin? | ✅ |
| ¿Redirige `es_admin_cliente` sin empresa? | ❌ (permite ERP; coherente con onboarding) |
| ¿Flag `ENABLE_EMPRESA_GUARD`? | ❌ No existe; guard siempre activo en `/app/*` vía `requireOperationalUser` |

---

## PUNTO 4 — Layouts y sidebar por contexto

### 4.1 Layouts existentes

| Layout | ¿Existe? | ¿Usado en qué contexto? |
|--------|----------|-------------------------|
| `SuperAdminLayout` | ✅ | `/super-admin/*` |
| `AdminLayout` | ✅ | `/admin/*` |
| `AppLayout` | ✅ | `/app/*` (ERP operativo) |
| `NewLayout` | ✅ (legacy) | No montado en `router.tsx` actual; shells usan layouts dedicados |

`LayoutShellContext` expone variante `app` | `admin` | `super-admin` al Header/sidebar.

### 4.2 Sidebar por contexto

Archivos: `NewSidebar.tsx`, `TopNavbar.tsx`, `sidebar-menu.utils.ts` (`filterModulosForShell`, `isMenuVisibleForShell`).

| Verificación | Resultado |
|--------------|-----------|
| ¿Secciones distintas por contexto? | ✅ Filtro por shell y prefijo de ruta |
| Super admin solo `/super-admin/*` en su shell | ✅ |
| Admin cliente solo `/admin/*` | ✅ |
| ERP solo módulos `/app/*` | ✅ + `mapLegacyErpPath` en shell `app` |
| ¿Mezcla de secciones? | ❌ No intencional; ERP oculto en admin/super-admin y viceversa |

### 4.3 Menú dinámico desde BD

| Verificación | Resultado |
|--------------|-----------|
| ¿Consume `GET /auth/menu`? | ✅ `AuthContext.loadMenuAndPermissionsFromAuthMenu` |
| ¿Rutas del menú con `/app/*`? | 🟡 Depende de BD; el FE normaliza con `normalizeNavRoute` / `mapLegacyErpPath` si el backend aún envía rutas legacy |
| ¿Sidebar construye navegación desde menú? | ✅ `transformAuthMenuToSidebarItems` |

### 4.4 Selector de empresa en UI

| Verificación | Resultado |
|--------------|-----------|
| ¿En header? | ✅ (`EmpresaSelector`, solo shell `app`) |
| ¿En sidebar? | ❌ |
| ¿Muestra nombre de empresa? | ✅ `razon_social` / `nombre_comercial` |
| ¿Permite cambiar? | ✅ si >1 empresa y sesión completa |

---

## PUNTO 5 — Impersonación

| Verificación | Resultado |
|--------------|-----------|
| ¿Botón “Acceder como cliente”? | ❌ |
| ¿Ruta de impersonación? | ❌ |
| Estado documentado | ✅ Diferido — `AUDITORIA_IMPERSONACION.md` |

---

## CONTRASTE BACKEND vs FRONTEND

| Capacidad backend | ¿Frontend la consume? | Estado |
|-------------------|----------------------|--------|
| `empresa_id` en JWT | ✅ (`decodeAccessToken` → `empresaActivaId`) | 🟢 |
| `es_admin_cliente` en JWT / me | ✅ | 🟢 |
| `LoginEmpresaSelectionResponse` | ✅ (`isLoginEmpresaSelectionResponse`, login) | 🟢 |
| `POST /auth/empresa/seleccionar/` | ✅ | 🟢 |
| `POST /auth/empresa/cambiar/` | ✅ | 🟢 |
| Rutas `/app/*` en `modulo_menu` BD | 🟡 FE normaliza; depende de datos BD | 🟡 |
| Redirección por `user_type` | ✅ Login + `resolvePostLoginPath` | 🟢 |
| Guard por empresa / selection pending | ✅ (`ProtectedRoute` + `empresa-access`) | 🟢 |
| `GET /auth/permissions/me` con empresa | ✅ (omitido con selection token) | 🟢 |
| Onboarding admin sin empresa | 🟡 Acceso ERP sin pantalla guiada | 🟡 |
| 409 menú con selection token | 🟡 Estado en contexto; sin toast global dedicado | 🟡 |

---

## DIAGNÓSTICO FINAL

### Tabla de estado

| Área | Estado | Pendiente |
|------|--------|-----------|
| `empresa_id` / `empresaActivaId` en AuthContext | 🟢 | Migrar más páginas ERP a `useEmpresaActiva` como default de filtros |
| `es_admin_cliente` en AuthContext | 🟢 | Flujo UX onboarding primera empresa (opcional) |
| `useUserType` con `platform_admin` | 🟢 | Alinear fallback `determineUserType` (`super_admin` vs `platform_admin`) si aplica |
| Redirección post-login correcta | 🟡 | `SmartRedirect` sin chequeo de selección pendiente |
| Pantalla selección de empresa | 🟢 | — |
| Pantalla onboarding primera empresa | 🔴 | Ruta/flujo guiado para `es_admin_cliente` sin empresa |
| Cambio de empresa en sesión | 🟡 | Invalidar React Query al cambiar empresa |
| Rutas `/app/*` en router | 🟢 | — |
| Redirects de compatibilidad | 🟢 | — |
| EmpresaGuard en `/app/*` | 🟢 | Lógica integrada (sin componente ni feature flag) |
| `SuperAdminLayout` separado | 🟢 | — |
| `AdminLayout` separado | 🟢 | — |
| Sidebar diferenciado por contexto | 🟢 | — |
| Menú desde BD con rutas `/app/*` | 🟡 | Verificar/normalizar datos en BD |
| Selector empresa activa en UI | 🟢 | Solo header; solo si >1 empresa |
| Impersonación diferida | 🟢 | Esperar diseño BE |

### Preguntas de cierre

#### 1. ¿Qué está implementado correctamente y no necesita ningún cambio?

- Decodificación JWT para claims de empresa y selection (`decodeAccessToken`).
- Tipos y servicios auth: login A/B, `seleccionarEmpresa`, `cambiarEmpresa`, normalización `UserData`.
- Estado multi-empresa en `AuthContext` (`empresaActivaId`, flags, skip menú/permisos con selection token).
- Pantalla y ruta `/app/seleccionar-empresa` con nombres de empresa en UI.
- Separación de shells `/super-admin`, `/admin`, `/app` con layouts y guards de tipo de usuario.
- Redirects legacy masivos hacia `/app/*`.
- Sidebar/menú filtrado por shell; consumo de `GET /auth/menu`.
- Selector de empresa en header del shell ERP (cambio de sesión con recarga de menú).
- Impersonación correctamente ausente y documentada como diferida.

#### 2. ¿Qué está implementado pero incompleto o con algún detalle que corregir?

- **`SmartRedirect`:** no redirige a selección de empresa si la sesión quedó en fase pending tras refresh o navegación a `/`.
- **Onboarding:** `es_admin_cliente` sin empresa accede al ERP pero no hay flujo dedicado (solo CRUD en ORG).
- **React Query:** al `cambiarEmpresaActiva` no se invalida caché; riesgo de datos de la empresa anterior en listados.
- **409 en menú:** se marca `requiereSeleccionEmpresa` pero no hay toast/redirect UX unificado en todos los puntos de llamada.
- **Filtros `empresa_id` en páginas:** patrón piloto solo en 3 páginas INV; el resto sigue con filtros locales.
- **Fallback `determineUserType`:** emite `super_admin` en lugar de `platform_admin` si solo viene `is_super_admin`.
- **Menú BD:** rutas pueden llegar sin `/app`; el FE compensa, pero conviene alinear BD con contrato.

#### 3. ¿Qué falta implementar completamente para E2E multi-empresa?

| Prioridad | Item |
|-----------|------|
| Alta | Flujo UX **onboarding primera empresa** (ruta + redirect cuando `es_admin_cliente` && sin `empresa_activa`) |
| Alta | **Invalidación de React Query** (y/o reset de estado de módulos) al seleccionar/cambiar empresa |
| Media | **SmartRedirect** y bootstrap: redirigir a `/app/seleccionar-empresa` si `mustSelectEmpresa` tras refresh |
| Media | Migración sistemática de **filtros por empresa** en módulos ERP (no solo INV piloto) |
| Baja | Toast/redirect global ante **409** en menú/permisos |
| Baja | Feature flag `ENABLE_EMPRESA_GUARD` (solo si se requiere rollout gradual) |
| Fuera de alcance actual | **Impersonación** (backend + FE) |

#### 4. Orden de prioridad para completar lo que falta

1. Onboarding guiado + redirect para admin cliente sin empresa.  
2. Invalidación de caché al cambiar/seleccionar empresa.  
3. Ajustar `SmartRedirect` / bootstrap para `mustSelectEmpresa`.  
4. Extender `useEmpresaActiva` al resto de páginas con `empresaFilter`.  
5. Pulir UX 409 y alineación final de rutas en menú BD.  
6. Impersonación cuando exista contrato BE.

---

## ARCHIVOS CLAVE REVISADOS

| Área | Rutas |
|------|-------|
| JWT decode | `src/core/auth/utils/decodeAccessToken.ts` |
| Reglas acceso ERP | `src/core/auth/utils/empresa-access.ts` |
| Auth estado | `src/shared/context/AuthContext.tsx` |
| Auth API | `src/features/auth/services/auth.service.ts` |
| Tipos | `src/features/auth/types/auth.types.ts` |
| Login / selección | `src/features/auth/pages/Login.tsx`, `SeleccionarEmpresaPage.tsx` |
| Router | `src/app/router.tsx`, `app-route-tree.tsx`, `legacy-redirect-routes.tsx` |
| Guards | `src/shared/components/ProtectedRoute.tsx`, `PermissionContext.tsx` |
| UI empresa | `src/shared/components/layout/EmpresaSelector.tsx`, `Header.tsx` |
| Sidebar | `src/shared/components/layout/sidebar-menu.utils.ts` |
| Post-login | `src/core/routing/post-login-path.ts`, `SmartRedirect.tsx` |
| Hook | `src/core/hooks/useUserType.ts`, `src/features/auth/hooks/useEmpresaActiva.ts` |

---

## RELACIÓN CON AUDITORÍAS PREVIAS

- **Empresa/JWT (implementación):** `AUDITORIA_EMPRESA_JWT.md` — detalle de Fase 2; este documento consolida verificación final.  
- **Rutas/layouts:** `AUDITORIA_RUTAS_LAYOUTS.md` — Punto 3 en gran parte cerrado.  
- **Sidebar:** `AUDITORIA_SIDEBAR_CONTEXTO.md` — Punto 4 cerrado.  
- **Impersonación:** `AUDITORIA_IMPERSONACION.md` — Punto 5 cerrado como diferido.

---

*Auditoría generada sin modificar código fuente de la aplicación.*
