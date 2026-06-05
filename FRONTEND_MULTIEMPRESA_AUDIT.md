# Auditoría funcional — Multiempresa (Frontend)

**Fecha:** 31 mayo 2026  
**Alcance:** Solo lectura del código. Sin modificaciones.  
**Contrato de referencia:** [`docs/FLUJO_AUTH_MULTIEMPRESA_FE.md`](docs/FLUJO_AUTH_MULTIEMPRESA_FE.md), OpenAPI [`docs/backend_openapi.json`](docs/backend_openapi.json)

---

## Resumen ejecutivo

El frontend **sí implementa** un flujo multiempresa completo en código: login con dos esquemas de respuesta, pantalla de selección, cambio de empresa en sesión, guards de routing, estado global en `AuthContext`, y selector visual en el header del shell ERP.

La activación del flujo **depende del runtime**: el backend debe devolver el **Schema A** (`selection_token` + `empresas_disponibles`) en login cuando el usuario tiene varias empresas, y el usuario debe operar en el **shell `/app`** como usuario operativo (`user_type: user`). Si el backend devuelve siempre un `access_token` completo (Schema B) o el usuario es `tenant_admin` en `/admin`, la UI multiempresa no se percibe aunque el código exista.

**Conclusión:** **B) El frontend sí tiene soporte pero puede no estar siendo activado** — con matices de cobertura parcial en módulos ERP y ausencia deliberada del selector en el shell Administración.

---

## 1. Login

### Archivos clave

| Archivo | Rol |
|---------|-----|
| `src/features/auth/pages/Login.tsx` | Orquestación post-login |
| `src/features/auth/services/auth.service.ts` | `POST /auth/login/` |
| `src/features/auth/types/auth.types.ts` | Tipos Schema A / B |
| `src/features/auth/stores/empresa-selection.store.ts` | Persistencia fase selección |

### Campos consumidos del response de login

El servicio distingue dos formas de respuesta (`LoginResponse = Token | LoginEmpresaSelectionResponse`):

#### Schema A — Selección pendiente (sin sesión ERP)

| Campo | Uso en FE |
|-------|-----------|
| `requiere_seleccion_empresa` | Flag; default `true` si falta |
| `empresas_disponibles` | Lista `{ empresa_id, razon_social, nombre_comercial }` → Zustand |
| `selection_token` | Bearer para `POST /auth/empresa/seleccionar/` |
| `token_type` | Informativo (`bearer`) |
| `user_data` | Preview opcional (`userPreview` en store) |

**No se consume** `access_token` en este esquema (su ausencia es condición de detección).

#### Schema B — Sesión completa

| Campo | Uso en FE |
|-------|-----------|
| `access_token` | Sesión ERP vía `setAuthFromLogin` → `applyFullSessionToken` |
| `token_type` | Informativo |
| `user_data` | Bootstrap inicial; **perfil definitivo viene de `GET /auth/me/`** |

Campos de `user_data` relevantes tras sesión completa:

- `empresa_activa` — UUID empresa activa
- `es_admin_cliente` — onboarding / acceso sin empresa
- `user_type`, `roles`, `cliente_id`, etc.

### Detección Schema A vs B

```typescript
// src/features/auth/types/auth.types.ts — isLoginEmpresaSelectionResponse()
// true si: NO hay access_token Y (requiere_seleccion_empresa === true O hay selection_token)
```

### ¿Existe soporte para `empresa_selection_required`?

**No.** Ese nombre **no aparece** en el repositorio ni en el OpenAPI documentado (`docs/backend_openapi.json` contiene `requiere_seleccion_empresa`, no `empresa_selection_required`).

El equivalente en frontend es:

| Concepto | Campo respuesta login | Claim JWT |
|----------|----------------------|-----------|
| Selección pendiente | `requiere_seleccion_empresa` | `empresa_selection_pending` |

Si un backend emitiera solo `empresa_selection_required` (inglés), el FE **no lo reconocería** salvo que también envíe `selection_token` (el type guard lo aceptaría por el token) o `requiere_seleccion_empresa`.

### ¿Existe soporte para `selection_token`?

**Sí, completo.**

1. **Login:** `auth.service.login()` lo preserva en Schema A.
2. **Store:** `useEmpresaSelectionStore.setPendingSelection()` lo persiste en `localStorage` (`caxis-empresa-selection-pending`).
3. **Selección:** `authService.seleccionarEmpresa(empresaId, selectionToken)` → `POST /auth/empresa/seleccionar/` con instancia `apiSelection` (sin interceptores ERP).
4. **Impersonación:** `startImpersonation` también puede devolver Schema A; mismo store.
5. **Bootstrap F5:** Si hay `selectionToken` persistido, se omite refresh y `/auth/me` hasta completar selección.

### Flujo en `Login.tsx`

```
POST /auth/login/
  ├─ Schema A → setPendingSelection() → navigate('/app/seleccionar-empresa')
  └─ Schema B → setAuthFromLogin() → initializeAuth (/auth/me)
       ├─ es_admin_cliente && !empresa_activa → /app/onboarding
       └─ resolvePostLoginPath() → destino según menú / user_type
```

---

## 2. Empresa activa

### Fuente de verdad

La empresa activa vive en **`AuthContext`** (`src/shared/context/AuthContext.tsx`), no en un contexto de empresa separado.

| Estado | Descripción |
|--------|-------------|
| `empresaActivaId` | UUID string \| null |
| `requiereSeleccionEmpresa` | Fase selection / JWT pending |
| `empresasDisponibles` | Lista para selector (operativos) |
| `esAdminCliente` | Admin tenant sin empresa → onboarding |

### ¿Usa `auth/me`?

**Sí.** Tras cualquier sesión completa (login B, selección, cambio, refresh bootstrap):

1. `applyFullSessionToken` / bootstrap llaman `initializeAuth()`.
2. `initializeAuth()` exige token sin `empresa_selection_pending` (`canInitializeFullSession`).
3. Llama `GET /auth/me/` y fusiona:
   - `empresa_activa` ← `me.empresa_activa || claims.empresa_id`
   - `es_admin_cliente` ← me + JWT

Comentario explícito en código: *"El usuario SOLO proviene de /auth/me, nunca de la respuesta de login"* (salvo merge de respaldo si `usuario_id` vacío).

### ¿Usa JWT?

**Sí, como complemento.**

`syncEmpresaSession(user, token)` en `AuthContext`:

```typescript
const activaRaw = user?.empresa_activa ?? claims?.empresa_id ?? null;
const pending = Boolean(claims?.empresa_selection_pending);
```

Claims leídos en `src/core/auth/utils/decodeAccessToken.ts`:

- `empresa_id`
- `empresa_selection_pending`
- `es_admin_cliente`
- `user_type`, `cliente_id`, claims impersonación

`canInitializeFullSession` bloquea menú/permisos/me si `empresa_selection_pending === true`.

### ¿Usa Zustand / Context?

| Capa | Qué guarda |
|------|------------|
| **React Context** (`AuthContext`) | `empresaActivaId`, flags, lista empresas, sesión completa |
| **Zustand persist** (`empresa-selection.store`) | Solo fase **pre-sesión**: `selectionToken`, `empresasDisponibles`, `userPreview` |
| **Hook** `useEmpresaActiva()` | Facade sobre AuthContext para módulos ERP/ORG |

Zustand **no** almacena la empresa activa de sesión; se limpia con `clearPendingSelection()` al completar selección.

### Empresa mostrada en el header — resolución del nombre

`EmpresaSelector.tsx`:

1. Busca en `empresasDisponibles` (AuthContext).
2. Fallback: store de selección pendiente.
3. Fallback API: `empresaService.list({ solo_activos: true })` para resolver etiqueta por `empresa_id`.

Etiqueta: `nombre_comercial || razon_social` (nunca UUID en UI).

---

## 3. Selector de empresa

### Componentes existentes

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `EmpresaSelector` | `src/shared/components/layout/EmpresaSelector.tsx` | Dropdown en header; cambio vía `cambiarEmpresaActiva` |
| `SeleccionarEmpresaPage` | `src/features/auth/pages/SeleccionarEmpresaPage.tsx` | Pantalla full-page post-login Schema A |
| `OnboardingEmpresaPage` | `src/features/auth/pages/OnboardingEmpresaPage.tsx` | Primera empresa (admin cliente) |
| `OrgActiveEmpresaBanner` | `src/features/org/components/OrgActiveEmpresaBanner.tsx` | Banner solo lectura en módulo ORG |
| `OrgSessionEmpresaField` | `src/features/org/components/OrgSessionEmpresaField.tsx` | Campo formulario solo lectura |
| `OrgCompanyToolbar` | Compone banner ORG | Barra estándar company-scoped |

### Rutas

| Ruta | Registro | Layout |
|------|----------|--------|
| `/app/seleccionar-empresa` | `app-route-tree.tsx` | Chrome oculto (sin header/sidebar) |
| `/app/onboarding` | `app-route-tree.tsx` | Chrome oculto |

Guards en `ProtectedRoute` (`requireOperationalUser`):

- Redirect a selección si `mustSelectEmpresa` o `hasPendingSelection`.
- Onboarding tiene prioridad sobre selección para `es_admin_cliente` sin empresas en lista.
- Excepción: `/app/org/empresa` accesible durante onboarding/selección.

### APIs de selección / cambio

| Acción | Endpoint | Token |
|--------|----------|-------|
| Selección inicial | `POST /auth/empresa/seleccionar/` | Bearer `selection_token` |
| Cambio en sesión | `POST /auth/empresa/cambiar/` | Bearer `access_token` sesión |

Ambas terminan en `applyFullSessionToken` → refresh menú/permisos vía `/auth/me` + `/auth/menu`.

### Código muerto / referencias obsoletas

| Item | Estado |
|------|--------|
| `src/context/AuthContext.tsx` | **Eliminado** (git); vivo en `src/shared/context/AuthContext.tsx` |
| `setAuthFromEmpresaSelection` | **No existe** en código; mencionado solo en docs (`AUDITORIA_EMPRESA_JWT.md`) |
| `src/config/superAdminMenu.ts` | **Eliminado**; menú desde `/auth/menu` |
| Filtros `empresaFilter` locales en decenas de páginas ERP | **Legacy activo** — no muerto, pero no alineado al patrón `useEmpresaActiva` |

No hay modal de selección; solo **página dedicada** + **dropdown en header**.

---

## 4. Multiempresa

### ¿El frontend soporta múltiples empresas?

**Sí**, para usuarios operativos (`user_type !== platform_admin && !== tenant_admin`):

| Capacidad | Implementado |
|-----------|--------------|
| Login multi-empresa (Schema A) | ✅ |
| Pantalla elegir empresa | ✅ |
| Cambiar empresa en sesión | ✅ (`EmpresaSelector` + `cambiarEmpresa`) |
| Guards ERP | ✅ (`empresa-access.ts`) |
| Scope JWT en ORG | ✅ (`useOrgSessionScope`) |
| Piloto INV con `useEmpresaActiva` | ✅ (Stock, Categorías, Productos) |
| Resto módulos ERP | 🟡 Filtro local `empresaFilter` + `empresaService.list` |

### ¿Espera una sola empresa?

No exclusivamente. Reglas:

- **1 empresa:** login puede devolver Schema B directo; selector muestra nombre **sin** dropdown (`isMultiEmpresa === false`).
- **N empresas:** backend debe devolver Schema A; tras selección, `empresasDisponibles` se carga con `empresaService.list({ solo_activos: true })` para el dropdown.
- **Admin cliente sin empresa:** flujo onboarding (`/app/onboarding` → crear empresa → `cambiarEmpresaActiva` o `completeEmpresaSelection`).

### ¿Existe UI para cambiar empresa?

**Sí**, condicionada:

```typescript
// useEmpresaActiva.ts
showEmpresaSelector: hasEmpresaActiva && !requiereSeleccionEmpresa
isMultiEmpresa: empresasDisponibles.length > 1
```

- Dropdown interactivo solo si `isMultiEmpresa`.
- Si una sola empresa: badge estático con nombre.
- **No visible** si aún hay selección pendiente o no hay `empresaActivaId`.

### Restricciones por tipo de usuario

| `user_type` | Lista empresas en contexto | Selector header | Selección login |
|-------------|---------------------------|-----------------|-----------------|
| `user` (operativo) | ✅ `empresaService.list` | ✅ shell `app` | ✅ |
| `tenant_admin` | ❌ no se carga en `initializeAuth` | ❌ (shell admin) | ❌ guards excluyen |
| `platform_admin` | ❌ | ❌ | ❌ redirige a super-admin |

`canAccessErp` y `shouldSelectEmpresa` retornan `false` para `platform_admin` y `tenant_admin`.

---

## 5. Header — App vs Administración

### Por qué muestra empresa en shell App

```tsx
// Header.tsx línea 173
{shell === 'app' && <EmpresaSelector />}
```

Razones de diseño implícitas en código y docs:

1. El shell **`/app`** es el **panel ERP operativo** — datos y permisos dependen de `empresa_id` en JWT.
2. `EmpresaSelector` permite cambiar contexto operativo sin re-login (`POST /auth/empresa/cambiar/`).
3. `useOrgSessionScope` y módulos ORG/INV pilot referencian *"cambiar en el encabezado"*.

### Por qué desaparece en shell Administración

Misma condición: `shell === 'app'` es **explícita**. En `/admin/*`:

- `AdminLayout` usa `NewLayout variant="admin"`.
- `Header` se renderiza, pero **`EmpresaSelector` no**.
- `tenant_admin` gestiona usuarios/roles/menú a nivel **tenant**, no operación ERP por empresa.
- `empresasDisponibles` **no se pobla** para `tenant_admin` en bootstrap.

No es un bug de datos faltantes en admin: es **decisión de layout** — el selector multiempresa está acoplado al shell operativo.

### Diagrama de shells

```
/login
  └─ Schema A → /app/seleccionar-empresa (sin chrome)

/app/*  (AppLayout, shell=app)
  ├─ Header + EmpresaSelector ✅
  ├─ Guards requireOperationalUser
  └─ empresaActivaId → filtros ERP / ORG scope

/admin/*  (AdminLayout, shell=admin)
  ├─ Header sin EmpresaSelector ❌
  ├─ Guards requireTenantAdmin
  └─ Sin contexto empresa en header

/super-admin/*  (SuperAdminLayout)
  └─ Sin empresa (platform_admin)
```

---

## 6. Conclusión

### Evaluación A / B / C

| Opción | Veredicto |
|--------|-----------|
| **A) Backend listo, falta UI** | ❌ Incorrecto. UI, rutas, servicios y guards existen. |
| **B) FE tiene soporte pero no se activa** | ✅ **Principal.** El flujo requiere que el backend emita Schema A y que el usuario opere en `/app`. |
| **C) Ambos incompletos** | 🟡 **Parcial.** Migración ERP incompleta (filtros locales); selector ausente en admin por diseño. |

### Veredicto final: **B (con matices hacia C parcial)**

El frontend **implementó** el contrato multiempresa documentado en `FLUJO_AUTH_MULTIEMPRESA_FE.md`. Si en producción no se ve selección ni cambio de empresa, las causas probables son:

1. **Backend devuelve Schema B** (access_token con `empresa_id` ya fijada) aunque el usuario tenga N empresas.
2. **Usuario es `tenant_admin`** y navega en `/admin` — sin selector por diseño.
3. **Usuario con una sola empresa** — selector es badge estático, no dropdown.
4. **Campo mal nombrado** — si backend usa `empresa_selection_required` sin `selection_token`/`requiere_seleccion_empresa`, el FE no entra en Schema A.
5. **Bootstrap F5 con selection token en refresh** — si refresh devuelve token pending, el FE hace logout (`isSelectionPendingToken`).

### Gaps remanentes (no bloquean el flujo core)

| Gap | Impacto |
|-----|---------|
| ~40+ páginas con `empresaFilter` local | Usuario puede filtrar otra empresa en UI sin cambiar sesión JWT |
| Selector solo en shell `app` | Admin tenant no cambia empresa desde header |
| `tenant_admin` sin lista `empresasDisponibles` | No puede usar dropdown aunque entre a `/app` (bloqueado por guards) |
| Docs internos mencionan APIs renombradas (`setAuthFromEmpresaSelection`) | Confusión en mantenimiento, no runtime |

---

## Referencia rápida de archivos

| Área | Archivos |
|------|----------|
| Login | `Login.tsx`, `auth.service.ts`, `auth.types.ts` |
| Estado sesión | `AuthContext.tsx`, `useEmpresaActiva.ts` |
| Fase selección | `empresa-selection.store.ts`, `empresa-selection-hydration.ts` |
| UI selector | `EmpresaSelector.tsx`, `SeleccionarEmpresaPage.tsx`, `Header.tsx` |
| Guards | `ProtectedRoute.tsx`, `empresa-access.ts`, `session-token.ts` |
| JWT | `decodeAccessToken.ts` |
| ORG scope | `useOrgSessionScope.ts`, `OrgActiveEmpresaBanner.tsx` |
| Routing | `app-route-tree.tsx`, `post-login-path.ts`, `SmartRedirect.tsx` |
| API HTTP | `axios-instances.ts` (`apiSelection`), `auth-http.utils.ts` |

---

## Checklist de verificación manual

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| 1 | Login usuario con 2+ empresas, backend Schema A | Redirect `/app/seleccionar-empresa`, lista visible |
| 2 | Elegir empresa | `POST seleccionar` → home, header con nombre |
| 3 | Login 1 empresa, Schema B | Directo a home, badge sin chevron |
| 4 | Cambiar empresa en header (N>1) | `POST cambiar`, menú recargado, toast éxito |
| 5 | F5 en selección pendiente | Store rehidratado, sin logout |
| 6 | `tenant_admin` en `/admin` | Sin selector en header |
| 7 | Admin cliente sin empresa | `/app/onboarding` → crear → sesión con empresa |
| 8 | Impersonación multi-empresa | Mismo flujo Schema A posible |

---

*Auditoría generada por inspección estática del código. No se modificó ningún archivo fuente.*
