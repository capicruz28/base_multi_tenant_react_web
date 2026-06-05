# Auditoría — Context Switch Administración ↔ Módulos en impersonación

**Fecha:** 31 mayo 2026  
**Alcance:** Repositorio frontend + contratos en repo. Backend en repositorio separado — no analizado como código.  
**Estado:** Solo auditoría y recomendación — **sin código, sin repair, sin commit**.

**Contexto validado (QA):**

- Impersonación operativa; multiempresa operativa; ORG e INV operativos en modo soporte.
- Backend corregido (permisos con tenant efectivo del JWT).
- Cambio de empresa en impersonación bloqueado — **correcto por diseño** (aceptado).
- Caso observado: impersonar **Tenant Admin** → ERP OK → switch **Administración ↔ Módulos** visible → en **Administración** sidebar **vacío** → al volver a **Módulos** todo OK.

**Documentos relacionados:** `PLATFORM_IMPERSONATION_AUDIT.md`, `PLATFORM_IMPERSONATION_PHASE0_FINDINGS.md`, `ERP_FRONTEND_STANDARDS_V2.md` §4.8, `docs/frontend/MENU_SIDEBAR_ALINEACION.md`.

---

## 1. Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Sidebar vacío en Administración es bug? | **Sí — inconsistencia de implementación**, no comportamiento documentado ni alineado con V2 |
| ¿Es restricción incompleta (Modelo B)? | **Parcialmente** — entrada ERP-first sí; ocultar switch no |
| ¿Switch visible con sidebar vacío es coherente? | **No** |
| Modelo arquitectónico recomendado | **Modelo A acotado** (paridad con sujeto impersonado), con **ocultar ShellCrossNav en impersonación** solo si producto elige Modelo B explícitamente |

**Causa técnica en FE (trazable):** el **Context Switcher** puede llevar a `/admin/*` aunque el sidebar de administración dependa de ítems con shell `admin` en `GET /auth/menu`, y esa partición devuelve **vacío** en la sesión observada. La navegación usa **fallback hardcodeado** (`/admin/usuarios`); el sidebar **no** usa el mismo fallback ni el catálogo estático `tenantAdminNavItems` (hoy **no conectado**).

---

## 2. Respuesta A — Comportamiento correcto durante impersonación

### Modelo A — Paridad con el Tenant Admin impersonado

| Principio | Detalle |
|-----------|---------|
| Quién ve qué | Soporte ve **lo que el sujeto vería** con el mismo JWT, menú y guards |
| Shells | Acceso a **Módulos** (`/app/*`) y **Administración** (`/admin/*`) si el menú y `user_type` lo permiten |
| Context switch | Visible **solo si** el payload incluye rutas en ambos shells (o política producto lo exige) |
| Sidebar admin | Poblado desde **`GET /auth/menu` filtrado shell `admin`**, igual que login normal del tenant admin |
| IMP-01 (V2) | No bypass de guards; el sujeto es el token impersonado (`user_type`, roles, menú) |

**Alineación normativa:** IMP-01 (“MUST NOT bypass guards”) se interpreta como **actuar como el sujeto**, no como platform_admin con superpoderes. Para un **tenant_admin** impersonado, Modelo A es la lectura más coherente con SaaS de soporte (“ver lo que ve el cliente”).

### Modelo B — Solo ERP en modo soporte

| Principio | Detalle |
|-----------|---------|
| Alcance | Soporte opera **solo** catálogos/transacciones bajo `/app/*` |
| Administración | **No** navegable: sin `/admin/*`, sin IAM tenant desde soporte |
| Context switch | **Oculto** en impersonación |
| Entrada | Coherente con `resolvePostEmpresaSelectionPath` → `/app/home` |

**Alineación parcial en código:** la entrada post-impersonación fuerza ERP (`/app/home`), pero **no** se oculta `ShellCrossNav` ni se bloquea router `/admin` — el producto **no cerró** Modelo B en UI.

### Posición recomendada (sección E)

**Modelo A acotado** como norma objetivo, con estas reglas de soporte SaaS:

1. Paridad menú/guards/API con el **usuario impersonado** (tenant admin en este caso).
2. Banner “modo soporte” (IMP-04) siempre visible en `/app`.
3. Cambio de empresa **deshabilitado** en impersonación (ya aceptado — ver §7).
4. Si el menú del sujeto **no incluye** shell `admin`, el switch **no debe mostrarse** (evitar pantalla huérfana).

Modelo B solo si negocio **prohíbe** explícitamente que soporte toque IAM tenant; en ese caso debe ser **cerrado en router + header**, no solo sidebar vacío.

---

## 3. Respuesta B — ¿Qué es el sidebar vacío según la implementación actual?

| Clasificación | Veredicto | Justificación |
|---------------|-----------|---------------|
| Bug | **Sí (UX/arquitectura FE)** | Usuario llega a `/admin/*` con chrome lateral vacío sin mensaje |
| Restricción incompleta Modelo B | **Sí (híbrido)** | Entrada ERP-first + switch visible + admin alcanzable |
| Comportamiento esperado | **No** | Ningún doc V2/FLUJO define “admin vacío intencional” en impersonación |

**No es** fallo de `PermissionGuard` ni de guards ORG/INV (ya validados). Es **desacople navegación ↔ renderizado de menú admin**.

---

## 4. Respuesta C — Si el sistema pretende Modelo A: dónde se rompe

### 4.1 Diagrama del fallo

```mermaid
flowchart LR
  subgraph entrada [Entrada impersonación]
    I[POST impersonate] --> S[Selección empresa]
    S --> H[/app/home]
  end
  subgraph header [Header tenant_admin]
    H --> X[ShellCrossNav visible]
    X --> N[navigate /admin/usuarios]
  end
  subgraph sidebar [NewSidebar shell admin]
    M[menuModulos completo] --> F[filterModulosForShell admin]
    F --> E[Lista vacía]
    E --> V[Sidebar vacío]
  end
  N --> V
```

### 4.2 Punto de ruptura 1 — Partición del menú (shell `admin`)

**Archivo:** `src/shared/components/layout/MenuSelector.tsx`

```typescript
// shell === 'admin' → filterModulosForShell(menu, 'admin')
// → transformAdminMenuFromAuthMenu(forShell)
```

**Archivo:** `src/core/auth/utils/menu-shell.utils.ts`

- Ítem entra en shell `admin` si `menu_scope` / `tipo_modulo` = admin **o** prefijo de ruta `/admin/*`.

**Si `GET /auth/menu` en impersonación solo trae módulos ERP (`menu_scope` app, rutas `/app/*`):**

- `filterModulosForShell(menu, 'admin')` → **[]**
- `useAdminMenuItems().items` → **[]**
- `NewSidebar` → `tenantAdminItems` vacío → **sidebar vacío**

**Evidencia:** comentario en `NewSidebar` L726: menú app “sin admin”; sección admin es **solo** payload filtrado por shell, no catálogo local.

### 4.3 Punto de ruptura 2 — Context Switcher vs sidebar (criterios distintos)

**Archivo:** `src/shared/components/layout/ShellCrossNav.tsx`

| Shell actual | Destino | Criterio |
|--------------|---------|----------|
| `app` | Primera ruta con prefijo `/admin` en **menú completo** | `findFirstRouteWithPrefix(menuModulos, '/admin')` |
| Fallback | `/admin/usuarios` | `SHELL_HOME_PATH.admin` |

`findFirstRouteWithPrefix` recorre **todo** el payload visible (`collectVisibleRoutes`), **sin** filtrar por `menu_scope`.

**Consecuencia:** aunque **ningún** ítem pase `filterModulosForShell(..., 'admin')`, el botón **Administración** puede enviar a `/admin/usuarios` por **fallback fijo**.

→ **Navegación permitida** + **sidebar sin ítems** = síntoma QA exacto.

### 4.4 Punto de ruptura 3 — Catálogo estático desconectado

**Archivos:** `src/config/adminMenu.ts`, `src/shared/config/adminMenu.ts` — `tenantAdminNavItems` (usuarios, roles, sesiones).

**No importados** por `MenuSelector`, `NewSidebar` ni `ShellCrossNav`. La arquitectura actual (**MENU_SIDEBAR_ALINEACION.md**) exige **solo** `GET /auth/menu`.

En login tenant admin “clásico”, si el backend envía ítems `/admin/*`, el sidebar funciona. En impersonación con menú **solo ERP**, el fallback estático **no rescata** la UX.

### 4.5 Punto de ruptura 4 — `NewSidebar` no construye árbol app en shell admin

**Archivo:** `src/shared/components/layout/NewSidebar.tsx` L166–171

```typescript
shell === 'app' && menuModulos
  ? transformAuthMenuToSidebarItems(filterModulosForShell(menuModulos, 'app'), 'app')
  : []  // shell admin: menuItems operativo siempre vacío
```

En shell `admin`, el árbol “Módulos” **no se muestra** (correcto). Solo `renderShellAdminMenu`. Si admin está vacío, **no queda ninguna sección** en el nav.

### 4.6 AuthContext y permisos — no explican el vacío

| Componente | Impersonación tenant_admin | Efecto en sidebar admin |
|------------|---------------------------|-------------------------|
| `loadMenuAndPermissionsFromAuthMenu` | Misma llamada `GET /auth/menu` que usuario normal | Contenido depende del **payload**, no del flag impersonación en FE |
| `isSuperAdmin = false` | Correcto | No bypass `can()` |
| `user_type` del JWT | `tenant_admin` | Habilita `ShellCrossNav` vía `useUserType` |
| `PermissionContext` `/auth/permissions/me` | Paralelo | **No alimenta** sidebar admin |

**Conclusión Modelo A:** la rotura no está en “no refrescar permisos”, sino en **payload sin ítems admin** + **navegación con fallback** que ignora esa vacuidad.

### 4.7 Qué validar en Network (sin tocar backend repo)

Misma sesión impersonada tenant admin:

1. `GET /auth/menu` — ¿existen ítems con `ruta` bajo `/admin/*` o `menu_scope: admin`?
2. Comparar con login **tenant admin real** mismo cliente (mismo contrato menú).
3. Si impersonación **no** trae ítems admin pero login sí → gap **backend menú/resolver** para `is_impersonation`.
4. Si **ninguno** trae ítems admin → Modelo A exige fix backend; FE solo debe **ocultar switch** si lista admin vacía.

---

## 5. Respuesta D — Si el sistema pretendiera Modelo B: por qué el switch sigue visible

| Control esperado Modelo B | Estado en FE |
|---------------------------|--------------|
| Ocultar `ShellCrossNav` si `isImpersonation` | **No implementado** — `Header.tsx` L170–171 solo mira `isTenantAdminUser` |
| Bloquear rutas `/admin/*` si impersonación | **No** — `ProtectedRoute requireTenantAdmin` pasa con `user_type === tenant_admin` |
| Post-login solo `/app/*` | **Sí** — `resolvePostEmpresaSelectionPath` + impersonation → `APP_HOME` |
| Banner modo soporte | **Sí** — solo en layout `app` (`NewLayout` L26) |

**Por qué el switch es visible:** el JWT impersonado conserva `user_type: tenant_admin`; `useUserType().isTenantAdminUser === true`; **no hay condición** `&& !isImpersonation` en `ShellCrossNav`.

**Por qué Administración sigue siendo alcanzable:** router `/admin` abierto a tenant admin; cross-nav + fallback `/admin/usuarios`.

→ Modelo B **no está cerrado**; solo la **entrada por defecto** apunta a ERP.

---

## 6. Análisis por componente solicitado

### 6.1 AuthContext

| Aspecto | Comportamiento impersonación tenant admin |
|---------|----------------------------------------|
| Menú | `GET /auth/menu` tras `applyFullSessionToken` / `initializeAuth` |
| Permisos ruta | `indexRoutePermissionsFromMenu` — capa menú (`org.ver`, etc.) |
| `isImpersonation` | No altera filtrado de menú por shell |
| `isSuperAdmin` | `false` durante impersonación |
| Restore parent | Sin impacto en switch mientras sesión activa |

### 6.2 Context Switcher (`ShellCrossNav`)

| Aspecto | Hallazgo |
|---------|----------|
| Visibilidad | `tenant_admin` en shell `app` o `admin` |
| Impersonación | **Sin tratamiento** |
| Navegación admin | Menú completo o fallback `/admin/usuarios` |
| Riesgo | Lleva a shell admin sin ítems admin en sidebar |

### 6.3 Sidebar administración vs módulos

| Shell | Fuente ítems | Vacío si |
|-------|--------------|----------|
| `app` | `filterModulosForShell(menu, 'app')` | Sin módulos ERP en payload |
| `admin` | `filterModulosForShell(menu, 'admin')` → `useAdminMenuItems` | Sin ítems `/admin` ni scope admin en payload |

### 6.4 Generación de menú

| Fuente | Rol |
|--------|-----|
| `GET /auth/menu` | Única fuente activa sidebar (V2 menú alineación) |
| `tenantAdminNavItems` | **Legacy / no cableado** al render |
| OpenAPI `GET /auth/menu` | Filtrado tenant + Permission Resolver + `rol_menu_permiso` |

### 6.5 Permisos en frontend

| Sistema | Uso en admin shell |
|---------|-------------------|
| `AuthContext.permissions` (desde menú) | `PermissionGuard` en rutas hijas si existieran |
| `PermissionContext` (`permissions/me`) | Botones granulares; no sidebar |
| API 403 | Independiente del vacío sidebar |

### 6.6 Flujo `is_impersonation`

| Elemento | Efecto |
|----------|--------|
| JWT `is_impersonation` | Banner, bypass bloqueo `platform_admin` en `/app` |
| `resolvePostEmpresaSelectionPath` | Fuerza `/app/home` (no `/admin` primero) |
| Menú admin | **Sin lógica específica** impersonación |

### 6.7 `tenant_admin` vs `platform_admin`

| Tipo | Impersonación típica | Switch | Sidebar admin |
|------|---------------------|--------|---------------|
| `tenant_admin` | Caso QA | Visible | Depende payload admin |
| `platform_admin` | No aplica en `/app` (bloqueado salvo impersonation) | N/A en ERP | N/A |

### 6.8 ERP_FRONTEND_STANDARDS_V2

| Regla | Relación con el caso |
|-------|---------------------|
| IMP-01…IMP-04 | No definen shell admin en soporte |
| IMP-04 banner | Solo `app` layout |
| PL-02 | Platform admin; no regula tenant admin impersonado |
| §4 multiempresa | Cambio empresa bloqueado — aceptado; no causa sidebar vacío |

**Gap V2:** falta norma explícita **IMP-05** (propuesta): “En impersonación, visibilidad de ShellCrossNav = paridad menú admin del sujeto o oculto.”

### 6.9 Reglas de navegación actuales

| Regla | Archivo |
|-------|---------|
| `tenant_admin` post-login prefer `/admin` | `resolvePostLoginPath` |
| Impersonación post-selección → `/app/home` | `resolvePostEmpresaSelectionPath` |
| `tenant_admin` puede `/app/*` | `ProtectedRoute` (solo bloquea `platform_admin` sin impersonation) |
| Admin requiere `requireTenantAdmin` | `router.tsx` |

---

## 7. Cambio de empresa en impersonación (nota)

En el código revisado, `EmpresaSelector` usa `canSwitchEmpresa = empresasElegibles.length > 1` sin leer `isImpersonation`. El bloqueo aceptado por diseño puede deberse a:

- Una sola empresa en `empresas_disponibles` del sujeto impersonado, o
- Fallo/omisión de `POST /auth/empresa/cambiar/` en backend para token impersonado.

**No explica** el sidebar admin vacío. Se documenta como **decisión aparte** ya validada por QA.

---

## 8. Matriz de evidencias

| ID | Afirmación | Clasificación |
|----|------------|---------------|
| E-01 | Sidebar admin usa solo `GET /auth/menu` + `filterModulosForShell(admin)` | **Confirmado FE** |
| E-02 | Sidebar app usa `filterModulosForShell(app)` | **Confirmado FE** |
| E-03 | `ShellCrossNav` no filtra por shell admin al elegir destino | **Confirmado FE** |
| E-04 | Fallback navegación `/admin/usuarios` sin ítems sidebar | **Confirmado FE** |
| E-05 | `ShellCrossNav` no considera `isImpersonation` | **Confirmado FE** |
| E-06 | `tenantAdminNavItems` estático no usado en render | **Confirmado FE** |
| E-07 | Impersonación desactiva bypass `isSuperAdmin` en guards menú | **Confirmado FE** |
| E-08 | Entrada impersonación prioriza `/app/home` vs tenant admin normal | **Confirmado FE** |
| E-09 | V2 no especifica admin en impersonación | **Confirmado contrato V2** |
| E-10 | Payload incluye ítems shell admin en impersonación | **No verificable solo repo** → Network |
| E-11 | Paridad menú impersonación vs login tenant admin mismo cliente | **Requiere validación backend** (respuesta `/auth/menu`) |
| E-12 | Páginas `/admin/*` cargan contenido con 403/200 | **Requiere validación backend** (API IAM) |

---

## 9. Respuesta E — Recomendación arquitectónica única

### Decisión normativa propuesta

Adoptar **Modelo A acotado** como estándar ERP para impersonación de **tenant_admin** (y en general cualquier sujeto con dual shell), alineado con IMP-01 y experiencia SaaS (“soporte ve lo que ve el cliente”).

### Reglas operativas (una sola solución coherente)

| # | Regla | Capa |
|---|-------|------|
| R-1 | **Un solo criterio** para “¿puede ir a Administración?”: existencia de ítems visibles tras `filterModulosForShell(menu, 'admin')` (misma fuente que el sidebar). | FE |
| R-2 | Si R-1 es falso → **no renderizar** `ShellCrossNav` en impersonación (y opcionalmente en cualquier sesión sin menú admin). | FE |
| R-3 | Si R-1 es verdadero → sidebar admin **debe** poblarse desde ese mismo filtro; prohibido navegar por fallback `/admin/usuarios` si la lista filtrada está vacía. | FE |
| R-4 | Mantener entrada soporte en **`/app/home`** (ERP-first) — compatible con priorizar diagnóstico operativo. | FE (ya existe) |
| R-5 | Mantener **banner** modo soporte + **sin cambio de empresa** en impersonación. | FE / producto |
| R-6 | Backend debe garantizar que impersonación de tenant admin incluya en `/auth/menu` los mismos ítems admin (`/admin/*` o `menu_scope: admin`) que login normal del mismo sujeto, si Modelo A. | Backend (repo separado) |
| R-7 | Documentar en V2 §4.8 **IMP-05** (nueva): paridad shells impersonación / criterio switch = menú admin efectivo. | Documentación |

### Por qué no recomendar Modelo B como está hoy

Dejar switch visible con sidebar vacío es el peor estado: parece bug, no política de seguridad. Modelo B válido solo con **ocultar switch + bloquear `/admin/*`** explícito — cambio de producto mayor y peor paridad de soporte.

### Por qué no recomendar solo “arreglar backend” sin R-1–R-3

Aunque el backend envíe menú admin, el **fallback** `/admin/usuarios` sin ítems seguiría siendo frágil ante cualquier desalineación futura. FE debe **atar switch a la misma partición que el sidebar**.

### Criterio de aceptación QA (post-corrección futura)

1. Impersonar tenant admin con menú admin en payload → switch visible → sidebar admin con ítems → páginas IAM cargan.
2. Impersonar sujeto sin ítems admin en menú → switch **oculto** → usuario permanece en ERP sin pantalla lateral vacía.
3. Volver a Módulos → sidebar ERP intacto (regresión cero).

---

## 10. Conclusión final

### Con certeza desde este repositorio

1. El síntoma **sidebar vacío en Administración** es una **inconsistencia FE** entre `ShellCrossNav` (navega con menú global + fallback) y `NewSidebar` / `useAdminMenuItems` (solo ítems shell `admin`).
2. **No** es el comportamiento documentado en V2 ni en `MENU_SIDEBAR_ALINEACION.md`.
3. El flujo impersonación **no está mal** en ORG/INV ni en carga de menú app; el fallo aparece al **cambiar de layout shell** a `admin`.
4. El switch visible durante impersonación es **esperado por código actual** (`tenant_admin` + sin check `isImpersonation`), pero **no es coherente** con sidebar vacío.
5. La arquitectura objetivo del menú es **100 % `/auth/menu`**; los archivos `tenantAdminNavItems` **no** participan — cualquier fix no debe reintroducir dos fuentes de verdad sin decisión explícita.

### Qué investigar en backend (repo separado)

1. ¿`GET /auth/menu` para token `is_impersonation=true` de tenant admin incluye ítems con rutas `/admin/*` o `menu_scope: admin`?
2. ¿Es idéntico al menú del mismo usuario en login directo (no impersonado)?
3. Si falta menú admin solo en impersonación → ajustar Permission Resolver / menú para sujeto de soporte.
4. Si falta también en login directo → dato de rol/menú en BD, no específico de impersonación.

### Veredicto sobre alineación arquitectónica

| Estado | Descripción |
|--------|-------------|
| **No alineado** | Híbrido: entrada tipo Modelo B, switch tipo Modelo A, sidebar vacío = ningún modelo cerrado |
| **Acción conceptual** | Cerrar **Modelo A acotado** con reglas R-1–R-7; evitar estado intermedio actual |

---

## 11. Archivos clave

```
src/shared/context/AuthContext.tsx
src/core/auth/PermissionContext.tsx
src/core/auth/hooks/usePermissions.ts
src/app/router/guards/PermissionGuard.tsx
src/app/router.tsx
src/features/auth/hooks/useImpersonation.ts
src/core/routing/post-login-path.ts
src/core/routing/resolve-post-login-from-menu.ts
src/core/auth/utils/menu-shell.utils.ts
src/shared/components/layout/ShellCrossNav.tsx
src/shared/components/layout/Header.tsx
src/shared/components/layout/NewSidebar.tsx
src/shared/components/layout/MenuSelector.tsx
src/shared/components/layout/layout-shell.types.ts
src/core/hooks/useUserType.ts
src/config/adminMenu.ts
docs/FLUJO_AUTH_MULTIEMPRESA_FE.md
docs/frontend/MENU_SIDEBAR_ALINEACION.md
ERP_FRONTEND_STANDARDS_V2.md §4.8
```

---

*Auditoría context switch impersonación. Sin implementación. Sin repair. Sin commit.*
