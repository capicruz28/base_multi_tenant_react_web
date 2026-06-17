# Plan Frontend — Provisionamiento de Tenant + Force Password Change

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Tipo:** Auditoría de impacto + plan de implementación (sin código)  
**Referencias:**

| Documento | Uso |
|-----------|-----|
| Auditoría previa onboarding clientes (chat 2026-06-08) | Estado actual FE crear cliente |
| `docs/backend_openapi.json` | Contrato `ClienteCreateResponse`, `CredencialesInicialesRead`, auth schemas |
| `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md` | Contrato definitivo backend force password |

---

## Resumen ejecutivo

El frontend tiene **dos brechas críticas** que impiden el flujo SaaS completo tenant → admin → ERP:

| Historia | Brecha actual | Impacto |
|----------|---------------|---------|
| **A — Provisionamiento** | `cliente.service.createCliente` descarta `credenciales_iniciales` | Superadmin nunca ve usuario/contraseña temporal |
| **B — Force Password Change** | `requires_password_change` no existe en tipos, guards ni interceptores | Admin con contraseña temporal entra a ERP → `403 PASSWORD_CHANGE_REQUIRED` o spinner infinito en `/auth/menu` |

Ambas historias deben implementarse **en secuencia coordinada**: A entrega credenciales al operador; B obliga al admin a cambiarlas en primer login.

---

# HISTORIA A — Provisionamiento de Tenant

## A.1 Estado actual (evidencia)

| Capa | Archivo | Comportamiento real |
|------|---------|---------------------|
| UI | `CreateClientModal.tsx` | Submit → `mutateAsync` → `onSuccess()` + `onClose()` sin usar respuesta |
| Hook | `useCreateCliente.ts` | Retorno `Cliente`; toast genérico; invalida `['clientes']` |
| Service | `cliente.service.ts` | `POST /clientes/` tipado como `ClienteResponse`; retorna solo `data.data` |
| Types | `cliente.types.ts` | Sin `CredencialesInicialesRead` ni `ClienteCreateResponse` |
| Page | `ClientManagementPage.tsx` | `handleCreateSuccess` solo cierra modal |

### Contrato backend (OpenAPI) vs implementación

```
POST /api/v1/clientes/  →  201 ClienteCreateResponse

ClienteCreateResponse {
  success: boolean
  message: string
  data: ClienteRead          // tenant creado
  credenciales_iniciales: CredencialesInicialesRead   // REQUERIDO en schema
}

CredencialesInicialesRead {
  nombre_usuario: string     // default "admin"
  contrasena: string         // REQUERIDO — texto plano, una sola vez
  requiere_cambio: boolean   // default true
}
```

El service actual tipa `ClienteResponse` (sin `credenciales_iniciales`) y hace *unwrap* parcial → **pérdida garantizada** del bloque de credenciales.

---

## A.2 Cómo debe recibirse `ClienteCreateResponse`

### Principio de diseño

Separar **dominio de creación** del **dominio de listado/detalle**:

| Operación | Tipo retorno service | Consumidor |
|-----------|---------------------|------------|
| `createCliente` | `ClienteCreateResult` (nuevo) | Modal + hook de creación |
| `getClientes`, `updateCliente`, etc. | `Cliente` (sin cambio) | Listado, detalle, edición |

### Flujo de datos recomendado

```text
POST /clientes/
    ↓
cliente.service.createCliente()
    → parsea ClienteCreateResponse completo
    → valida presencia de data + credenciales_iniciales
    → retorna ClienteCreateResult
    ↓
useCreateCliente.onSuccess(data)
    → invalida queries
    → NO toast genérico aquí (el modal de credenciales comunica éxito)
    ↓
CreateClientModal / ClientManagementPage
    → recibe ClienteCreateResult
    → abre modal de credenciales (no cierra sin acknowledgment)
```

### Validación defensiva en service

| Condición | Acción |
|-----------|--------|
| `data` ausente | `throw` — igual que hoy |
| `credenciales_iniciales` ausente | `throw` con mensaje explícito — el contrato OpenAPI la marca requerida; sin ella el provisionamiento está incompleto |
| `credenciales_iniciales.contrasena` vacía | `throw` — campo requerido en schema |

> **Nota:** No persistir credenciales en `localStorage`, `sessionStorage` ni React Query cache. Solo estado React efímero en memoria hasta cierre del modal.

---

## A.3 Tipado correcto

### Nuevos tipos en `cliente.types.ts`

```typescript
// Pseudotipos — referencia de diseño, no implementación

interface CredencialesInicialesRead {
  nombre_usuario: string;
  contrasena: string;
  requiere_cambio: boolean;
}

interface ClienteCreateResponse {
  success: boolean;
  message: string;
  data: Cliente;
  credenciales_iniciales: CredencialesInicialesRead;
}

/** Retorno del service — lo que consume la UI */
interface ClienteCreateResult {
  cliente: Cliente;
  credenciales: CredencialesInicialesRead;
  message: string;
}
```

### Cambios en tipos existentes

| Tipo | Acción |
|------|--------|
| `ClienteResponse` | Mantener para PUT/activar/desactivar; **no** usarlo en POST create |
| `Cliente` | Sin cambios — ya alineado con `ClienteRead` tenant |
| `useCreateCliente` genéricos | `useMutation<ClienteCreateResult, Error, ClienteCreate>` |

### Alineación OpenAPI

- `ClienteCreateResponse.data` referencia `app__modules__tenant__presentation__schemas__ClienteRead` — mapea 1:1 al `Cliente` FE existente.
- `credenciales_iniciales` es hermano de `data`, **no** anidado dentro del cliente.

---

## A.4 Cómo evitar perder credenciales

| Punto de fuga | Mitigación |
|---------------|------------|
| Service hace `return data.data` | Retornar `{ cliente: data.data, credenciales: data.credenciales_iniciales, message: data.message }` |
| Hook ignora `data` en `onSuccess` | Cambiar firma; propagar `ClienteCreateResult` al callback `onSuccess` del modal |
| Modal llama `onClose()` inmediato | **No cerrar** modal create hasta que credenciales modal termine; o transición create → credentials en la misma sesión |
| React Query no almacena credenciales | Correcto — no incluir `credenciales` en ninguna `queryKey` |
| Re-fetch GET cliente | Nunca devolverá contraseña — diseño intencional backend |

### Cadena de propagación

```text
credenciales_iniciales (HTTP)
  → ClienteCreateResult.credenciales (service)
  → mutation result (hook)
  → state local ClientProvisioningCredentialsModal (UI)
  → clipboard / PDF (acciones usuario)
  → discard al cerrar modal con acknowledgment
```

---

## A.5 UX post-creación — evaluación de opciones

### Opción A — Modal de credenciales (dedicado)

Modal bloqueante que aparece tras éxito de creación. Muestra resumen del tenant + credenciales con acciones de copia.

| Pros | Contras |
|------|---------|
| Patrón SaaS estándar (AWS keys, Stripe secrets, Azure SP) | Riesgo de cierre accidental |
| Mínimo impacto en routing | Menos espacio que página completa |
| Reutiliza `Dialog` / `ConfirmDialog` del design system | |
| El superadmin permanece en contexto de gestión de clientes | |
| Implementación acotada (1 componente nuevo) | |

### Opción B — Pantalla resumen de provisioning

Navegación a `/super-admin/clientes/:id/provisionado` con resumen completo.

| Pros | Contras |
|------|---------|
| Más espacio visual | Nueva ruta + guard + estado de navegación |
| Puede combinar datos tenant + credenciales + próximos pasos | Credenciales en URL history si no se diseña con cuidado |
| | Overhead para acción que ocurre una sola vez |
| | Back button del browser puede re-exponer o perder estado |

### Opción C — Wizard de finalización

Paso 5 del wizard existente (post "Crear Cliente").

| Pros | Contras |
|------|---------|
| Flujo guiado continuo | El wizard create ya tiene 4 secciones — añadir paso credenciales mezcla "formulario" con "resultado sensible" |
| | Si el usuario navega tabs del wizard, puede saltar el paso final |
| | Complejidad en `useClienteModalDiscard` (dirty state vs resultado) |
| | Anti-patrón: los wizards de provisioning SaaS suelen separar formulario de revelación de secretos |

### Recomendación: **Opción A — Modal de credenciales dedicado**

**Justificación:**

1. Alineado con práctica SaaS: el secreto se muestra **una vez** en overlay modal, no en flujo de navegación.
2. Menor superficie de cambio: no requiere rutas nuevas ni alterar el wizard de 4 secciones.
3. El componente puede vivir en `ClientCredentialsRevealModal.tsx` montado desde `ClientManagementPage` con estado `lastCreatedCredentials: ClienteCreateResult | null`.
4. Desacopla el modal de **creación** (formulario) del modal de **revelación** (secretos) — responsabilidad única.

### Wireframe conceptual (Opción A)

```text
┌─────────────────────────────────────────────────────────┐
│  ✓ Cliente creado exitosamente                     [×]  │
├─────────────────────────────────────────────────────────┤
│  ACME Corp · acme · admin@acme.com                      │
│                                                         │
│  ⚠ Estas credenciales solo se muestran una vez.         │
│     Compártelas de forma segura con el administrador.   │
│                                                         │
│  Usuario administrador                                  │
│  ┌──────────────────────┐  [Copiar]                     │
│  │ admin                │                               │
│  └──────────────────────┘                               │
│                                                         │
│  Contraseña temporal                                      │
│  ┌──────────────────────┐  [Copiar]  [👁]               │
│  │ ••••••••••••         │                               │
│  └──────────────────────┘                               │
│                                                         │
│  URL de acceso: https://acme.{dominio}                  │
│                                                         │
│  [Copiar credenciales completas]  [Descargar PDF]       │
│                                                         │
│  ☐ Confirmo que he guardado las credenciales              │
│                                                         │
│              [Cerrar]  (disabled hasta checkbox)        │
└─────────────────────────────────────────────────────────┘
```

---

## A.6 Funcionalidades de copia y exportación

| Funcionalidad | Prioridad | Diseño |
|---------------|-----------|--------|
| **Copiar usuario** | P0 | `navigator.clipboard.writeText(nombre_usuario)` + toast "Usuario copiado" |
| **Copiar contraseña** | P0 | Idem; campo con toggle visibilidad (`Eye`/`EyeOff` — patrón `PasswordFieldWithGenerate`) |
| **Copiar credenciales completas** | P0 | Bloque texto: `Usuario: admin\nContraseña: …\nURL: https://{subdominio}.{host}\nRequiere cambio en primer acceso: Sí` |
| **Descargar PDF** | P1 | Generar PDF cliente-side (ya existe `jspdf` en `ReporteAutorizacionPage`). Incluir: razón social, subdominio, usuario, contraseña, fecha, disclaimer. **No** almacenar en servidor. |
| **Imprimir** | P2 | `window.print()` sobre contenido del modal con `@media print` — alternativa ligera al PDF |
| **Cerrar modal** | P0 | Solo habilitado tras acknowledgment (ver A.7) |

### Formato "credenciales completas" (clipboard)

```text
=== Credenciales de acceso — {razon_social} ===
URL:      https://{subdominio}.{baseHost}
Usuario:  {nombre_usuario}
Contraseña: {contrasena}

Importante: El administrador debe cambiar la contraseña en el primer inicio de sesión.
Generado: {fecha_local} por {operador_nombre}
```

---

## A.7 Comportamiento al cerrar sin copiar

### Evaluación de alternativas

| Enfoque | Descripción | Veredicto |
|---------|-------------|-----------|
| **Confirm dialog** | Al intentar cerrar (×, ESC, backdrop): "¿Ha guardado las credenciales? No podrá verlas de nuevo." | ✅ Complemento |
| **Advertencia persistente** | Banner ámbar siempre visible en el modal | ✅ Obligatorio |
| **Cierre libre** | Cerrar sin fricción | ❌ Pérdida operativa frecuente |
| **Hard block** | Imposible cerrar nunca | ❌ UX hostil; operador queda atrapado |

### Recomendación: **Acknowledgment checkbox + confirm dialog en segundo intento**

1. **Primera barrera (soft):** Checkbox obligatorio: *"Confirmo que he guardado o compartido las credenciales de forma segura"*. Botón "Cerrar" deshabilitado hasta marcarlo.
2. **Segunda barrera (al × / ESC / backdrop):** `ConfirmDialog` variant `warning`: *"Las credenciales no se mostrarán de nuevo. ¿Desea cerrar sin copiarlas?"* con acciones "Volver" / "Cerrar de todos modos".
3. **Sin tracking de "copió o no":** No fiarse de `navigator.clipboard` success (puede fallar en HTTP/no-permission). El acknowledgment es responsabilidad del operador — patrón AWS IAM.
4. **Tras cerrar:** Limpiar estado `lastCreatedCredentials` de memoria. Toast opcional: *"Cliente creado. Recuerde que las credenciales no están disponibles en el detalle del cliente."*

---

## A.8 Funcionalidades futuras

| Funcionalidad | ¿Corresponde? | Fase | Notas |
|---------------|---------------|------|-------|
| **Descarga PDF** | Sí — P1 | Historia A v1.1 | Sin endpoint backend; PDF 100% cliente. Reutilizar `jspdf`. |
| **Envío email** | Futuro — no v1 | Historia A v2 | No existe endpoint en OpenAPI (`POST /clientes/{id}/enviar-credenciales`). Requiere contrato backend. No diseñar UI activa; solo placeholder "Próximamente" si se desea. |
| **Regenerar contraseña** | Futuro — no v1 | Historia A v2 | No existe endpoint. Tab Usuarios en detalle podría exponerlo cuando backend lo implemente. |

---

## A.9 Archivos React/TS afectados — Historia A

| Archivo | Cambio |
|---------|--------|
| `src/features/super-admin/clientes/types/cliente.types.ts` | +`CredencialesInicialesRead`, `ClienteCreateResponse`, `ClienteCreateResult` |
| `src/features/super-admin/clientes/services/cliente.service.ts` | `createCliente` retorna `ClienteCreateResult` |
| `src/features/super-admin/clientes/services/__tests__/cliente.service.test.ts` | Tests create con credenciales |
| `src/core/hooks/useClienteMutations.ts` | Tipo mutación; ajustar `onSuccess` |
| `src/features/super-admin/clientes/components/CreateClientModal.tsx` | Recibir result; no cerrar directo; callback `onCreated(result)` |
| `src/features/super-admin/clientes/components/ClientCredentialsRevealModal.tsx` | **NUEVO** — modal revelación |
| `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` | Estado `credentialsReveal`; orquestación modales |
| `src/features/super-admin/clientes/utils/provisioning-credentials.format.ts` | **NUEVO** — formateo clipboard/PDF (opcional, puede ser inline) |

**Sin cambios esperados:** `ClientDetailPage`, `ClientUsersTab`, routing super-admin, `AuthContext`.

---

# HISTORIA B — Force Password Change

## B.1 Estado actual (evidencia)

| Área | Estado | Riesgo |
|------|--------|--------|
| `UserData` / `auth.types.ts` | Sin `requires_password_change` | Flag ignorado en login |
| `decodeAccessToken.ts` | Sin claim `requires_password_change` | Refresh no sincroniza flag |
| `auth.service.ts` | Sin `changePassword()` | No hay llamada a `POST /auth/password/change/` |
| `AuthContext.tsx` | `initializeAuth` llama `/auth/me` + `/auth/menu` sin gate | `/auth/menu` → `403 PASSWORD_CHANGE_REQUIRED` → menú vacío, spinner o ERP roto |
| `ProtectedRoute.tsx` | Gates: auth, empresa, onboarding | Sin gate password change |
| `Login.tsx` | Post-login → onboarding o `resolvePostLoginPath` | Nunca redirige a cambio contraseña |
| `SmartRedirect.tsx` | Prioridad: selección → onboarding → ERP | Sin prioridad password |
| Interceptor response | Solo maneja `401` refresh | `403 PASSWORD_CHANGE_REQUIRED` no interceptado |
| `error.service.ts` | Sin extracción de `error_code` | No detecta código específico |
| Routing | Sin ruta cambio contraseña | — |

### Comportamiento actual con admin de tenant recién creado

```text
Login OK (requires_password_change: true en response, ignorado por FE)
  → setAuthFromLogin → applyFullSessionToken → initializeAuth
  → GET /auth/me OK (whitelist)
  → GET /auth/menu 403 PASSWORD_CHANGE_REQUIRED
  → menuModulos = []; menuPermissionsReady = true (catch genérico)
  → Login redirige a /app/onboarding o /app/home
  → Usuario en ERP sin menú / con errores en cada API
```

---

## B.2 Propagación de `requires_password_change`

### Fuente de verdad (prioridad)

| # | Origen | Cuándo actualizar |
|---|--------|-------------------|
| 1 | `user_data.requires_password_change` | Login, password change, selección empresa |
| 2 | `GET /auth/me` | Bootstrap, post-refresh (si no se decodifica JWT) |
| 3 | JWT claim `requires_password_change` | Tras login, refresh, password change |

### Cambios de modelo

**`UserData`** — añadir:

```typescript
requires_password_change?: boolean;  // default false en normalize
```

**`AccessTokenClaims`** — añadir:

```typescript
requires_password_change?: boolean;
```

**`AuthContextType`** — añadir:

```typescript
requiresPasswordChange: boolean;
```

### Puntos de sincronización

| Evento | Acción |
|--------|--------|
| `normalizeUserData()` | `requires_password_change: toApiBoolean(raw.requires_password_change)` |
| `decodeAccessToken()` | `requires_password_change: Boolean(payload.requires_password_change)` |
| `initializeAuth()` tras `/auth/me` | Propagar a state `requiresPasswordChange` |
| `applyFullSessionToken()` | Leer de `user_data` o JWT antes de cargar menú |
| `POST /auth/password/change/` éxito | `requiresPasswordChange = false`; reemplazar tokens |
| `refreshToken()` éxito | Decodificar nuevo access → actualizar flag |
| `completeEmpresaSelection()` | Preservar flag del `user_data` en response (backend lo conserva) |
| Logout | Reset a `false` |

### Regla crítica: no cargar ERP antes del cambio

```text
if (requiresPasswordChange && !isImpersonation && userType !== 'platform_admin') {
  → NO llamar GET /auth/menu
  → NO llamar GET /auth/permissions/me
  → NO invalidar queries ERP
  → menuPermissionsReady = true (gate satisfecho para password screen)
}
```

Esto evita el spinner infinito en `ProtectedRoute` (`sessionGatesPending = !menuPermissionsReady`).

---

## B.3 Reacción ante `error_code = PASSWORD_CHANGE_REQUIRED`

### Contrato

```json
HTTP 403
{
  "detail": "Debe cambiar su contraseña antes de acceder a este recurso.",
  "error_code": "PASSWORD_CHANGE_REQUIRED"
}
```

### Estrategia de defensa en profundidad

| Capa | Mecanismo |
|------|-----------|
| **1 — Proactivo (preferido)** | Guard en `ProtectedRoute` + redirect en `Login` si flag conocido |
| **2 — Interceptor HTTP** | En response interceptor de `api`: si `403` + `error_code === 'PASSWORD_CHANGE_REQUIRED'` → `navigate('/change-password')` + `setRequiresPasswordChange(true)` |
| **3 — React Query** | `onError` global opcional; secundario al interceptor |

### Interceptor — reglas anti-bucle

| Ruta | ¿Interceptar 403? |
|------|-------------------|
| `/auth/password/change/` | No |
| `/auth/me/` | No |
| `/auth/logout/` | No |
| `/auth/refresh/` | No |
| `/auth/empresa/seleccionar/` | No |
| `/auth/impersonate/*` | No |
| Cualquier otra ERP | **Sí** → redirect |

### Helper en `error.service.ts`

```typescript
// Diseño — no implementación
function getApiErrorCode(error: unknown): string | null
function isPasswordChangeRequired(error: unknown): boolean
```

### Constante

```typescript
export const ERROR_CODE_PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED';
```

---

## B.4 Pantalla `ChangePasswordPage`

### Ruta recomendada

```
/change-password
```

Fuera de `/app/*` y `/admin/*` — pantalla auth standalone (como `/login`), sin sidebar ERP.

### Layout

- `hideChrome` en layout — igual que `/app/onboarding` y `/app/seleccionar-empresa`
- Sin `PermissionGuard`
- Accesible solo si `isAuthenticated && requiresPasswordChange`
- Si `!requiresPasswordChange` → redirect a destino post-login normal

### Contenido UX

| Elemento | Detalle |
|----------|---------|
| Título | "Cambio de contraseña obligatorio" |
| Subtítulo | "Por seguridad, debe establecer una nueva contraseña antes de continuar." |
| Campo | Contraseña actual |
| Campo | Nueva contraseña (validación inline: 8+ chars, mayúscula, minúscula, número) |
| Campo | Confirmar nueva contraseña (solo FE) |
| Indicador fortaleza | Reutilizar patrón IAM si existe |
| CTA primario | "Actualizar contraseña" |
| CTA secundario | "Cerrar sesión" → `logout()` |
| Errores | 401 → "Contraseña actual incorrecta"; 422 → `detail`; 400 misma contraseña / SSO |

### Post-éxito

1. Reemplazar `access_token` (y cookie refresh en web) desde response `Token`
2. `requiresPasswordChange = false`
3. Resolver siguiente destino:

```typescript
if (requiere_seleccion_empresa || hasPendingSelection) → /app/seleccionar-empresa
else if (shouldOnboardEmpresa(...)) → /app/onboarding
else → resolvePostLoginPath(...)
```

---

## B.5 Flujo completo recomendado — orden de pasos

### Comparación

| Orden | Flujo |
|-------|-------|
| **A (recomendado)** | Login → **Cambio contraseña** → Selección empresa → Onboarding empresa → ERP |
| **B** | Login → Selección empresa → **Cambio contraseña** → Onboarding → ERP |

### Decisión: **Orden A — Cambio de contraseña primero**

| Criterio | Orden A | Orden B |
|----------|---------|---------|
| Contrato backend §6.3 | Opción A explícitamente recomendada | Permitida (whitelist) |
| Seguridad | Credencial temporal eliminada antes de cualquier contexto ERP | Usuario opera en selección con password temporal |
| `initializeAuth` actual | Tras login, `/auth/menu` falla con 403 — orden A evita llegar a ERP | Selección empresa OK, pero post-selección `applyFullSessionToken` vuelve a llamar `/auth/menu` → mismo 403 |
| `/auth/empresa/cambiar/` | Bloqueado con flag — irrelevante en primer login | Bloqueado igual |
| UX SaaS estándar | Microsoft 365, Google Workspace: password change antes del tenant shell | Menos común |
| Onboarding admin sin empresa | Password → onboarding crear empresa — secuencia natural | Selección N/A; iría a password después de login sin fricción extra |
| Multi-empresa | Password → elegir empresa → ERP | Elegir empresa con password temporal — confuso para el usuario |

### Diagrama flujo end-to-end (provisionamiento + primer login)

```text
[SUPERADMIN — Platform]
  Crear cliente (CreateClientModal)
       ↓
  POST /clientes/ → ClienteCreateResponse
       ↓
  ClientCredentialsRevealModal
  (copiar / PDF / acknowledgment / cerrar)
       ↓
  Entregar credenciales al admin del tenant (canal externo: email, ticket, etc.)

[TENANT ADMIN — Primer login]
  Login en https://{subdominio}.host
       ↓
  POST /auth/login/ → user_data.requires_password_change: true
       ↓
  /change-password (ChangePasswordPage)
       ↓
  POST /auth/password/change/ → tokens nuevos, flag false
       ↓
  ┌─ requiere_seleccion_empresa? ──→ /app/seleccionar-empresa
  ├─ shouldOnboardEmpresa? ─────────→ /app/onboarding → crear empresa
  └─ else ────────────────────────→ /app/home (ERP)
```

### Prioridad de guards en `ProtectedRoute` / `SmartRedirect`

```text
1. isAuthenticated
2. requiresPasswordChange → /change-password     ← NUEVO (antes de empresa)
3. hasPendingSelection / mustSelectEmpresa
4. shouldOnboardEmpresa
5. ERP / admin normal
```

---

## B.6 Archivos exactos a modificar — Historia B

| Archivo | Cambio |
|---------|--------|
| `src/features/auth/types/auth.types.ts` | `requires_password_change` en `UserData`; `PasswordChangeRequest`; constante error code |
| `src/core/auth/utils/decodeAccessToken.ts` | Claim `requires_password_change` |
| `src/features/auth/services/auth.service.ts` | `normalizeUserData`; +`changePassword()` |
| `src/shared/context/AuthContext.tsx` | State `requiresPasswordChange`; gate menú; interceptor 403; `applyFullSessionToken`; bootstrap |
| `src/shared/components/ProtectedRoute.tsx` | Redirect `/change-password` con mayor prioridad que empresa/onboarding |
| `src/shared/components/SmartRedirect.tsx` | Misma prioridad |
| `src/features/auth/pages/Login.tsx` | Post-login: check flag antes de onboarding/ERP |
| `src/features/auth/pages/ChangePasswordPage.tsx` | **NUEVO** |
| `src/features/auth/routes.tsx` | Ruta `/change-password` |
| `src/core/routing/post-login-path.ts` | `APP_CHANGE_PASSWORD = '/change-password'`; helper `resolvePostPasswordChangePath()` |
| `src/core/api/auth-http.utils.ts` | `shouldSkipPasswordChangeRedirect(url)` whitelist |
| `src/core/services/error.service.ts` | `getApiErrorCode()`, `isPasswordChangeRequired()` |
| `src/shared/components/layout/NewLayout.tsx` | `hideChrome` para `/change-password` |
| `src/features/auth/pages/SeleccionarEmpresaPage.tsx` | Post-selección: si flag aún true (edge) → change-password |
| `src/features/auth/stores/empresa-selection.store.ts` | Opcional: persistir `requires_password_change` en selection schema A |
| `src/core/auth/utils/empresa-access.ts` | `shouldForcePasswordChange()` helper |
| `src/app/router.tsx` | Ruta protegida change-password (auth required, no ERP layout) |

### Archivos de test

| Archivo | Cambio |
|---------|--------|
| `src/core/auth/utils/__tests__/menu-permissions-ready.test.ts` | Escenario flag true → menu skip |
| Nuevo: `change-password-flow.test.ts` | Guards + normalize |
| Nuevo: `auth-http-password-change.test.ts` | Interceptor whitelist |

---

## B.7 Riesgos de regresión

| ID | Riesgo | Severidad | Mitigación |
|----|--------|-----------|------------|
| R1 | Spinner infinito en `ProtectedRoute` si `/auth/menu` falla y `menuPermissionsReady` nunca true | **Alta** | Si `requiresPasswordChange`, set `menuPermissionsReady = true` sin llamar menú |
| R2 | Bucle redirect `/change-password` ↔ ERP | **Alta** | Whitelist en interceptor; guard solo redirige si flag true y pathname ≠ change-password |
| R3 | `platform_admin` forzado a cambiar contraseña | **Alta** | Excluir `userType === 'platform_admin'` y `is_super_admin` |
| R4 | Impersonación bloqueada | **Alta** | Excluir `is_impersonation === true` en guards e interceptor |
| R5 | Usuario SSO ve pantalla cambio local | **Media** | Ocultar si backend devuelve 400 SSO; idealmente no mostrar si `proveedor !== local` (cuando esté en perfil) |
| R6 | Multi-empresa: selection_token con flag pierde estado | **Media** | Leer flag de `user_data` en `LoginEmpresaSelectionResponse`; store en `empresa-selection.store` |
| R7 | Login Schema A (selección): redirect incorrecto | **Media** | Tras guardar pending selection, redirect a `/change-password` antes de `/app/seleccionar-empresa` |
| R8 | Refresh token mantiene flag stale | **Media** | Decodificar JWT post-refresh; fallback `/auth/me` |
| R9 | React Query cache ERP tras change password | **Baja** | `queryClient.clear()` ya existe en `applyFullSessionToken` — reutilizar |
| R10 | Historia A: credenciales en logs DEV | **Media** | No `console.log` credenciales; redactar en auth-debug |
| R11 | `cambiarEmpresaActiva` con flag true | **Media** | `POST /empresa/cambiar/` bloqueado — deshabilitar `EmpresaSelector` si flag true |
| R12 | Onboarding admin: conflicto orden password vs crear empresa | **Baja** | Orden A resuelve: password → onboarding (sin empresa) → ERP |

---

## B.8 Plan de implementación por fases

### Fase 0 — Preparación (0.5 d)

- [ ] Validar OpenAPI local vs contrato force password (ya alineados según docs)
- [ ] Acordar copy UX modal credenciales y pantalla cambio contraseña
- [ ] Definir `baseHost` para URL tenant en modal (desde `window.location` o config)

### Fase 1 — Fundamentos de tipos y errores (1 d)

**Alcance:** tipos compartidos, error helpers, sin UI.

- [ ] `CredencialesInicialesRead`, `ClienteCreateResponse`, `ClienteCreateResult`
- [ ] `requires_password_change` en `UserData`, `AccessTokenClaims`
- [ ] `PasswordChangeRequest`, `ERROR_CODE_PASSWORD_CHANGE_REQUIRED`
- [ ] `getApiErrorCode()`, `isPasswordChangeRequired()`
- [ ] `shouldForcePasswordChange()` en `empresa-access.ts`

**Criterio de aceptación:** build pasa; tests unitarios de tipos/normalize.

### Fase 2 — Historia A: Provisionamiento (2 d)

- [ ] `cliente.service.createCliente` → `ClienteCreateResult`
- [ ] `useCreateCliente` propaga result
- [ ] `ClientCredentialsRevealModal` (copiar, visibilidad, acknowledgment, confirm close)
- [ ] Integración `ClientManagementPage` + ajuste `CreateClientModal`
- [ ] Tests service create
- [ ] (P1) PDF download con `jspdf`

**Criterio de aceptación:** Crear cliente en staging → modal muestra credenciales → cerrar con checkbox → listado actualizado → detalle cliente no muestra password.

### Fase 3 — Historia B: Auth core + pantalla (2 d)

- [ ] `auth.service.changePassword()`
- [ ] `AuthContext`: state `requiresPasswordChange`, sync en login/me/refresh
- [ ] Gate: no cargar `/auth/menu` si flag true
- [ ] `ChangePasswordPage` + ruta `/change-password`
- [ ] `Login.tsx`: redirect post-login
- [ ] `NewLayout` hideChrome

**Criterio de aceptación:** Admin con password temporal → login → pantalla cambio → submit → redirect onboarding o ERP.

### Fase 4 — Historia B: Guards + interceptor (1.5 d)

- [ ] `ProtectedRoute` + `SmartRedirect` prioridad password
- [ ] Interceptor 403 `PASSWORD_CHANGE_REQUIRED`
- [ ] `auth-http.utils` whitelist
- [ ] Multi-empresa: flag en selection flow
- [ ] Exclusiones: impersonation, platform_admin

**Criterio de aceptación:** Ninguna ruta ERP accesible con flag true; `/auth/empresa/seleccionar/` funciona; impersonación sin bloqueo.

### Fase 5 — Integración E2E + hardening (1.5 d)

- [ ] Flujo completo: superadmin crea → admin login → change password → onboarding empresa → ERP
- [ ] Flujo multi-empresa: login → change → selección → ERP
- [ ] Bootstrap F5 con sesión flag true → change-password
- [ ] Regresión: platform_admin, impersonación, SSO (mock 400), logout en change screen
- [ ] QA checklist del contrato §9

**Criterio de aceptación:** Checklist §9 del `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md` completo.

### Estimación total

| Fase | Días dev |
|------|----------|
| 0 | 0.5 |
| 1 | 1 |
| 2 | 2 |
| 3 | 2 |
| 4 | 1.5 |
| 5 | 1.5 |
| **Total** | **~8.5 días** |

### Orden de despliegue recomendado

```text
Fase 1 → Fase 2 (Historia A) → Fase 3 → Fase 4 → Fase 5
```

Historia A puede desplegarse independiente. Historia B debe desplegarse **antes** de que operadores entreguen credenciales a admins reales (o concurrente), para evitar admins atrapados en ERP roto.

---

## Dependencias entre historias

```text
Historia A                    Historia B
(credenciales al              (force change en
 superadmin)                   primer login)
      │                              │
      └──────────┬───────────────────┘
                 │
                 ▼
        Flujo SaaS completo
   Superadmin ve password temp
   Admin debe cambiarla al entrar
```

| Dependencia | Tipo |
|-------------|------|
| A → B | **Funcional:** A entrega `contrasena` temporal; B obliga a cambiarla (`requiere_cambio: true` en OpenAPI) |
| B → A | **No bloqueante:** A puede desplegarse sola |
| Backend | **Cerrado:** ambos contratos aprobados sin más cambios |

---

## Checklist de aceptación global

### Historia A

- [ ] `POST /clientes/` retorna y muestra `credenciales_iniciales`
- [ ] Copiar usuario, contraseña y bloque completo funcionan
- [ ] Cierre requiere acknowledgment
- [ ] Credenciales no persisten tras cerrar modal
- [ ] Detalle cliente / tab usuarios no expone contraseña

### Historia B

- [ ] `requires_password_change` sincronizado en login, me, JWT, refresh
- [ ] `/change-password` accesible con flag true
- [ ] ERP bloqueado hasta cambio exitoso
- [ ] Interceptor captura 403 `PASSWORD_CHANGE_REQUIRED`
- [ ] Orden: password → selección empresa → onboarding → ERP
- [ ] Impersonación y platform_admin excluidos
- [ ] Logout disponible en pantalla de cambio

---

## Referencias de código actual (líneas clave)

| Archivo | Líneas | Relevancia |
|---------|--------|------------|
| `cliente.service.ts` | 78–84 | Pérdida de credenciales |
| `useClienteMutations.ts` | 18–26 | Toast sin credenciales |
| `CreateClientModal.tsx` | 253–256 | Cierre inmediato post-create |
| `AuthContext.tsx` | 323–406 | `/auth/menu` sin gate password |
| `AuthContext.tsx` | 1281–1334 | `applyFullSessionToken` → `initializeAuth` |
| `ProtectedRoute.tsx` | 148–177 | Prioridad onboarding/selección sin password |
| `Login.tsx` | 104–108 | Redirect onboarding sin check password |
| `decodeAccessToken.ts` | 5–17 | Claims sin `requires_password_change` |

---

**Fin del documento.** Listo para implementación por el equipo Frontend.
