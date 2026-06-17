# Revisión final de arquitectura — Provisionamiento + Force Password Change

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Tipo:** Validación pre-implementación (sin código)  
**Documento revisado:** `TENANT_PROVISIONING_AND_FORCE_PASSWORD_CHANGE_FRONTEND_PLAN.md`  
**Contratos:** `docs/backend_openapi.json`, `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md`

---

## Veredicto ejecutivo

El plan original es **funcionalmente correcto** pero **sobredimensiona el alcance** en algunos archivos. Tras contrastarlo con la arquitectura real del repo:

| Historia | Ajuste principal |
|----------|------------------|
| **A — Provisionamiento** | **No es obligatorio** modificar `ClientManagementPage` ni `useCreateCliente` (core). El flujo puede encapsularse en `CreateClientModal` + service + tipos + componente nuevo. |
| **B — Force Password Change** | Los **4 pilares** (AuthContext, ProtectedRoute, Login, ChangePasswordPage) son el núcleo P0, pero **sin tocar AuthContext en menú/interceptor el ERP seguirá roto**. Varios archivos del plan original son P1/P2, no P0. |
| **Interceptor 403** | Debe vivir en **AuthContext** (donde ya está el interceptor de sesión), no en `axios-instances.ts`. Clasificación: **P1** (defensa en profundidad), no P0. |
| **PDF credenciales** | **P1** — no bloquea MVP; clipboard es suficiente en v1. |
| **Estado `requiresPasswordChange`** | **Solo AuthContext**, derivado de `auth.user.requires_password_change` + sincronización JWT en refresh. Sin Zustand ni React Query. |

---

## Principios arquitectónicos del proyecto (referencia)

Patrones observados en el código actual:

| Dominio | Patrón actual | Implicación |
|---------|---------------|-------------|
| Sesión / flags auth | `AuthContext` (`esAdminCliente`, `requiereSeleccionEmpresa`, `menuPermissionsReady`) | Nuevos flags auth van aquí, no en stores paralelos |
| Selección empresa pendiente | Zustand persist (`empresa-selection.store`) | Solo para estado **pre-sesión** (selection_token). No mezclar force-password ahí |
| Datos servidor | React Query | Credenciales de provisioning **nunca** en cache RQ |
| Interceptor sesión (401 refresh) | `AuthContext.tsx` líneas ~884–1049 | Extensión natural para 403 password |
| Interceptor 5xx | `axios-instances.ts` | Solo toast servidor; no lógica de routing |
| Guards navegación | `ProtectedRoute` + `SmartRedirect` (solo `/`) | Password gate en ProtectedRoute es P0; SmartRedirect es P1 |
| Rutas auth standalone | `auth/routes.tsx` (`/login`) | `/change-password` debe vivir aquí, **no** bajo `/app` |

---

# 1. Historia A — Provisionamiento de Tenant

## 1.1 ¿Es necesario modificar cada archivo del plan?

| Archivo (plan original) | ¿Obligatorio? | Veredicto |
|-------------------------|---------------|-----------|
| `cliente.types.ts` | **Sí** | P0 — sin tipos no hay contrato |
| `cliente.service.ts` | **Sí** | P0 — único punto de pérdida de `credenciales_iniciales` |
| `ClientCredentialsRevealModal.tsx` (nuevo) | **Sí** | P0 — UX de revelación |
| `CreateClientModal.tsx` | **Sí, mínimo** | P0 — orquestar form → reveal → cierre. No evitable sin reescribir quién hace submit |
| `useCreateCliente` (`core/hooks`) | **No** | Evitable — ver alternativa aislada |
| `ClientManagementPage.tsx` | **No** | Evitable — ver alternativa aislada |
| `cliente.service.test.ts` | Recomendado | P1 |
| `provisioning-credentials.format.ts` | Opcional | P2 — inline en modal al inicio |

### Evidencia de acoplamiento actual

```
useCreateCliente  →  solo importado por CreateClientModal.tsx
CreateClientModal →  solo montado en ClientManagementPage.tsx
```

No hay otros consumidores de `useCreateCliente`. Modificarlo es de **bajo riesgo**, pero **viola la capa core** para lógica exclusiva de super-admin provisioning.

---

## 1.2 Alternativa de menor acoplamiento (recomendada)

### Estrategia: flujo autocontenido en `CreateClientModal`

```text
CreateClientModal (estado interno)
  │
  ├─ fase: "form"     → wizard actual
  ├─ fase: "reveal"   → ClientCredentialsRevealModal (inline o sub-componente)
  └─ onSuccess()      → llamado SOLO tras acknowledgment de credenciales
                        (comportamiento externo idéntico al actual)
```

| Capa | Responsabilidad |
|------|-----------------|
| `cliente.service.ts` | Retorna `ClienteCreateResult` |
| `useProvisionCliente.ts` (**nuevo**, en `features/super-admin/clientes/hooks/`) | Mutación con invalidación; **sin toast**; retorno tipado |
| `CreateClientModal.tsx` | Importa `useProvisionCliente`; tras éxito → fase `reveal`; `onSuccess()` al final |
| `ClientCredentialsRevealModal.tsx` | UI copia / acknowledgment |
| `ClientManagementPage.tsx` | **Sin cambios** — sigue pasando `onSuccess={handleCreateSuccess}` |

### Comparación de impacto

| Enfoque | Archivos tocados | Capas core afectadas |
|---------|------------------|----------------------|
| Plan original | 8 (incl. core hook + page) | `core/hooks/useClienteMutations.ts` |
| **Alternativa recomendada** | **5** (types, service, hook feature, modal create, modal reveal) | **Ninguna** en `core/` |

---

## 1.3 Dependencias reales (Historia A)

```text
cliente.types.ts
       ↓
cliente.service.ts ──→ useProvisionCliente.ts (feature)
       ↓                        ↓
       └────────────→ CreateClientModal.tsx
                              ↓
                    ClientCredentialsRevealModal.tsx
```

**Dependencia externa:** ninguna sobre AuthContext, routing global ni React Query más allá de `invalidateQueries(['clientes', tenantId])` (ya existente).

---

## 1.4 Riesgos de regresión (Historia A)

| ID | Riesgo | Prob. | Mitigación |
|----|--------|-------|------------|
| A-R1 | Toast duplicado (hook + modal) | Media | `useProvisionCliente` sin toast en `onSuccess` |
| A-R2 | Modal create cierra antes de reveal | Alta | Estado `phase` interno; no llamar `onClose` hasta acknowledgment |
| A-R3 | Credenciales en logs DEV | Media | Prohibir log de `contrasena`; redactar en tests |
| A-R4 | `useCreateCliente` queda huérfano | Baja | Mantener sin cambios para edición futura o eliminar import muerto |
| A-R5 | Tests `cliente.service` desactualizados | Media | P1 — actualizar mock POST con `credenciales_iniciales` |
| A-R6 | Dirty-state / discard durante reveal | Baja | En fase `reveal`, deshabilitar discard del form (ya no está dirty) |

**Riesgo cero esperado en:** `ClientManagementPage`, `EditClientModal`, `ClientDetailPage`, routing super-admin, AuthContext.

---

## 1.5 Decisión definitiva Historia A

| Decisión | Elección |
|----------|----------|
| ¿Modificar `useCreateCliente`? | **No** — crear `useProvisionCliente` en feature |
| ¿Modificar `ClientManagementPage`? | **No** — flujo interno al modal |
| ¿Modificar `CreateClientModal`? | **Sí** — mínimo (fase reveal + hook feature) |
| PDF en v1 | **P1** (ver sección 5) |

---

# 2. Historia B — Force Password Change

## 2.1 ¿Bastan AuthContext + ProtectedRoute + Login + ChangePasswordPage?

**No del todo.** Esos cuatro son el **núcleo UX/navegación**, pero sin cambios adicionales mínimos el sistema sigue fallando:

| Problema sin cambios extra | Archivo mínimo adicional |
|----------------------------|--------------------------|
| `initializeAuth` llama `/auth/menu` → 403 → menú vacío / spinner | `AuthContext` — extender `shouldSkipErpMenuLoad` |
| `UserData` sin campo → flag ignorado | `auth.types.ts` |
| `normalizeUserData` no mapea flag | `auth.service.ts` |
| Refresh no sincroniza flag (`user_data: null`) | `decodeAccessToken.ts` |
| No hay endpoint FE para cambiar password | `auth.service.ts` — `changePassword()` |
| No hay ruta | `auth/routes.tsx` |

**Conclusión:** los 4 pilares son necesarios pero **insuficientes**. El mínimo real son **8 archivos P0** (los 4 pilares + 4 de soporte de contrato).

---

## 2.2 Clasificación P0 / P1 / P2

### P0 — Obligatorios

| Archivo | Razón |
|---------|-------|
| `src/features/auth/types/auth.types.ts` | `requires_password_change` en `UserData`; `PasswordChangeRequest` |
| `src/features/auth/services/auth.service.ts` | `normalizeUserData`; `changePassword()` |
| `src/core/auth/utils/decodeAccessToken.ts` | Claim JWT tras refresh |
| `src/shared/context/AuthContext.tsx` | Gate `/auth/menu`; sync flag; handler post-change; exponer flag en context |
| `src/shared/components/ProtectedRoute.tsx` | Redirect `/change-password` antes de ERP/onboarding/selección |
| `src/features/auth/pages/Login.tsx` | Redirect post-login (Schema A y B) |
| `src/features/auth/pages/ChangePasswordPage.tsx` | **Nuevo** — pantalla obligatoria |
| `src/features/auth/routes.tsx` | Registrar `/change-password` |

### P1 — Recomendados (defensa en profundidad / completitud)

| Archivo | Razón |
|---------|-------|
| `AuthContext.tsx` (interceptor 403) | Captura APIs ERP disparadas por RQ, links directos, race post-refresh |
| `src/core/services/error.service.ts` | `getApiErrorCode()` / `isPasswordChangeRequired()` — legibilidad |
| `src/core/api/auth-http.utils.ts` | Whitelist URLs en interceptor (evitar bucles) |
| `src/shared/components/SmartRedirect.tsx` | Gate en `/` (F5 en raíz) |
| `src/core/routing/post-login-path.ts` | Constante `APP_CHANGE_PASSWORD` + helper post-change |
| `src/core/auth/utils/__tests__/menu-permissions-ready.test.ts` | Documentar caso `requires_password_change → ready=true` |

### P2 — Opcionales (no bloquean MVP)

| Archivo | Razón |
|---------|-------|
| `SeleccionarEmpresaPage.tsx` | Login + ProtectedRoute redirigen antes; página solo accesible tras change |
| `empresa-selection.store.ts` | `userPreview: UserData` ya persiste flag si tipado |
| `empresa-access.ts` | Helper `shouldForcePasswordChange()` — puede inline en guards |
| `NewLayout.tsx` | **No necesario** si ruta vive en `authRoutes` (fuera de AppLayout) |
| `EmpresaSelector` / `cambiarEmpresaActiva` | Deshabilitar cambio empresa con flag (backend ya bloquea con 403) |
| `PermissionGuard.tsx` | Sin cambio si usuario no alcanza `/app/*` |
| `SmartRedirect` duplicado en bootstrap | Cubierto por ProtectedRoute en rutas hijas |

---

## 2.3 Enforcement mínimo viable (MVP Historia B)

Capas en orden de prioridad:

```text
1. Login → redirect /change-password          (proactivo, P0)
2. ProtectedRoute → block /app/*, /admin/*      (proactivo, P0)
3. AuthContext shouldSkipErpMenuLoad            (evita spinner, P0)
4. AuthContext interceptor 403                  (reactivo, P1)
```

Con capas 1–3 **sin** interceptor, el MVP funciona para el flujo feliz. El interceptor P1 cubre: refresh en background, `reloadMenuAndPermissions`, deep links guardados, componentes montados que disparan fetch antes del redirect.

---

# 3. Routing — Matriz de navegación

## 3.1 Ubicación de `/change-password`

**Recomendación definitiva:** ruta **hermana de `/login`** en `authRoutes`, **fuera** de `ProtectedRoute requireOperationalUser` y **fuera** de `AppLayout`.

Motivo: evita tocar `NewLayout`, `PermissionGuard`, sidebar y la lógica `hideChrome` de `/app/onboarding`.

### Condición de acceso a `/change-password`

```text
isAuthenticated === true
AND requiresPasswordChange === true
AND NOT isImpersonation
AND userType !== 'platform_admin'
```

Si `requiresPasswordChange === false` → redirect a destino post-login normal.

---

## 3.2 Matriz completa de navegación

Leyenda: ✅ permitido | 🔒 redirect → `/change-password` | ➡️ redirect otro | 🚫 bloqueado | ➖ N/A

| Escenario | `requires_password_change` | Ruta destino | Resultado |
|-----------|---------------------------|--------------|-----------|
| **Login Schema B — admin onboarding** | `true` | `/change-password` | 🔒 correcto |
| **Login Schema B — admin onboarding** | `true` | `/app/onboarding` (hoy) | 🔒 debe interceptar ProtectedRoute |
| **Login Schema B — user normal** | `false` | ERP | ➡️ flujo actual OK |
| **Login Schema A — multi-empresa** | `true` | `/app/seleccionar-empresa` (hoy) | 🔒 Login debe ir a `/change-password` **primero** |
| **Login Schema A — multi-empresa** | `true` | `/change-password` | ✅ guardar selection en Zustand; tras change → selección |
| **Post change password — multi-empresa** | `false` | `/app/seleccionar-empresa` | ➡️ si `hasPendingSelection` |
| **Post change — admin sin empresa** | `false` | `/app/onboarding` | ➡️ si `shouldOnboardEmpresa` |
| **Post change — sesión completa** | `false` | `/app/home` | ➡️ |
| **F5 en `/app/home` con flag true** | `true` | — | 🔒 ProtectedRoute |
| **F5 en `/change-password` con flag true** | `true` | — | ✅ permanece |
| **F5 en `/change-password` con flag false** | `false` | `/app/home` o `/` | ➡️ |
| **F5 en `/` con flag true** | `true` | — | 🔒 SmartRedirect (P1) o ProtectedRoute padre |
| **Onboarding `/app/onboarding`** | `true` | — | 🔒 ProtectedRoute antes de onboarding gate |
| **Onboarding** | `false` | — | ✅ flujo actual |
| **Selección `/app/seleccionar-empresa`** | `true` | — | 🔒 no debe alcanzarse si Login ordena password primero |
| **Selección** | `false` + pending | — | ✅ flujo actual |
| **Platform admin login** | cualquiera | `/super-admin/*` | ➖ enforcement no aplica (backend excluye) |
| **Platform admin con flag en JWT** | `true` (edge) | `/super-admin/*` | ➡️ FE debe ignorar flag si `platform_admin` |
| **Impersonación soporte** | `true` en tenant | `/app/*` | ✅ operador excluido (`is_impersonation`) |
| **Impersonación** | — | `/change-password` | 🚫 nunca mostrar al operador |
| **SSO user** | `false` (backend) | ERP | ➖ sin pantalla change |
| **SSO intenta `/change-password` manual** | — | — | ➡️ redirect ERP; API devuelve 400 si intenta change |
| **Logout desde change page** | — | `/login` | ✅ whitelist backend |
| **`/admin/*` con flag true** | `true` | — | 🔒 ProtectedRoute (requireTenantAdmin path) |
| **Deep link `/login`** | — | — | ✅ sin conflicto |

### Prioridad de guards (definitiva)

```text
1. isAuthenticated
2. requiresPasswordChange → /change-password     (except: platform_admin, impersonation)
3. hasPendingSelection / mustSelectEmpresa
4. shouldOnboardEmpresa
5. Permisos / roles / ERP
```

### Conflictos resueltos

| Conflicto potencial | Resolución |
|--------------------|------------|
| Onboarding vs change | Change **antes** — onboarding es paso 3 |
| Selección vs change | Change **antes** — selección es paso 2 |
| Impersonación vs change | Exclusión explícita por `is_impersonation` |
| Platform admin vs change | Exclusión por `userType === 'platform_admin'` |
| SSO vs change | Backend no activa flag; FE no redirige |

---

# 4. Interceptor HTTP — ¿AuthContext o global separado?

## 4.1 Estado actual

| Ubicación | Responsabilidad |
|-----------|-----------------|
| `AuthContext.tsx` | Interceptor **completo** de sesión: 401 → refresh → retry |
| `axios-instances.ts` | Solo `showServerErrorToast` en instancias locales |

**No existe** interceptor de routing en `api.ts` ni `axios-instances.ts`.

## 4.2 Decisión

| Opción | Veredicto |
|--------|-----------|
| **A) AuthContext** (extender interceptor existente) | ✅ **Arquitectura actual** — un solo lugar para auth + sesión + navegación reactiva |
| **B) Nuevo interceptor en `axios-instances.ts`** | ❌ Fragmenta lógica; `apiCentral` no tiene hoy acceso a `navigate` ni flag sin acoplar store |
| **B2) Módulo `password-change-interceptor.ts` importado desde AuthContext** | ⚠️ Solo si el `useEffect` de AuthContext crece demasiado — refactor cosmético P2 |

### Clasificación del interceptor 403

| Nivel | Rol |
|-------|-----|
| **P0** | Guards proactivos (Login + ProtectedRoute + skip menu) |
| **P1** | Interceptor 403 en AuthContext — **defensa en profundidad**, alineado con cómo ya se maneja 401 |

### Reglas anti-bucle (P1)

No redirigir a `/change-password` si la request es:

- `/auth/password/change/`
- `/auth/me/`
- `/auth/logout/`
- `/auth/refresh/`
- `/auth/empresa/seleccionar/`
- `/auth/impersonate/*`
- La propia navegación ya está en `/change-password`

---

# 5. PDF de credenciales — P0 o P1

## Análisis

| Criterio | Evaluación |
|----------|------------|
| **Valor usuario** | Medio — útil para adjuntar en ticket/email; no sustituye clipboard |
| **Complejidad** | Media — `jspdf` ya en repo pero solo en módulo HCM; plantilla nueva, disclaimer legal, datos sensibles en archivo local |
| **Mantenimiento** | Bajo-medio — otra superficie de formato, i18n, branding |
| **Riesgo seguridad** | Archivo PDF en disco del operador — mismos riesgos que copiar; requiere copy de disclaimer |
| **MVP SaaS** | Copiar usuario + contraseña + bloque completo cubre el 90% del caso |

## Recomendación: **P1** (no P0)

| Entregable v1 (P0) | Entregable v1.1 (P1) |
|--------------------|----------------------|
| Copiar usuario | Descargar PDF |
| Copiar contraseña | Imprimir (`window.print`) |
| Copiar bloque completo | |
| Acknowledgment + confirm close | |

---

# 6. Estado global — `requiresPasswordChange`

## Opciones evaluadas

| Opción | ¿Alineada? | Veredicto |
|--------|------------|-----------|
| **AuthContext** (`auth.user.requires_password_change` + getter) | ✅ Mismo patrón que `esAdminCliente`, `requiereSeleccionEmpresa` | **Elegida** |
| Zustand store | ❌ Solo usado para selection_token pendiente (pre-sesión persistida) | Rechazada |
| React Query cache | ❌ Flag es de sesión, no recurso servidor cacheable | Rechazada |
| Combinación AuthContext + Zustand | ❌ Duplicación; `userPreview` en Zustand ya es `UserData` si hace falta leer flag durante selection pendiente | Innecesaria |

## Estrategia definitiva (única)

```text
Fuente de verdad: auth.user.requires_password_change
  │
  ├─ Escrito en: normalizeUserData (login, me, change password)
  ├─ Sincronizado en: initializeAuth, applyFullSessionToken
  ├─ Refresh: decodeAccessToken(newAccess).requires_password_change
  │            → merge en auth.user si user_data null
  └─ Expuesto en context: requiresPasswordChange (computed getter, NO useState separado)
```

**Por qué computed y no `useState` separado:** evita desincronización user/flag (mismo problema que ya resuelve `empresaActivaId` con `syncEmpresaSession`). Si se necesita performance, `useMemo` sobre `auth.user`.

**Excepciones en getter:**

```text
requiresPasswordChange =
  Boolean(auth.user?.requires_password_change)
  && !isImpersonation
  && userType !== 'platform_admin'
```

---

# 7. Arquitectura recomendada definitiva

## 7.1 Diagrama Historia A (mínimo acoplamiento)

```text
ClientManagementPage (sin cambios)
        │
        ▼
CreateClientModal
  ├─ useProvisionCliente (feature hook)
  ├─ cliente.service.createCliente → ClienteCreateResult
  └─ ClientCredentialsRevealModal (fase interna)
        │
        ▼
onSuccess() → cierra modal → lista refrescada
```

## 7.2 Diagrama Historia B (MVP)

```text
Login / Bootstrap
  → auth.user.requires_password_change
  → requiresPasswordChange (computed)
        │
        ├─ true  → /change-password (authRoutes)
        │           → auth.service.changePassword
        │           → applyFullSessionToken (flag false)
        │           → resolve next: selection | onboarding | ERP
        │
        └─ false → ProtectedRoute gates normales
                    (shouldSkipErpMenuLoad → carga menú)
```

---

## 7.3 Archivos a modificar (lista definitiva)

### Historia A — P0

| Archivo | Acción |
|---------|--------|
| `src/features/super-admin/clientes/types/cliente.types.ts` | +tipos provisioning |
| `src/features/super-admin/clientes/services/cliente.service.ts` | Retorno completo |
| `src/features/super-admin/clientes/hooks/useProvisionCliente.ts` | **Nuevo** |
| `src/features/super-admin/clientes/components/ClientCredentialsRevealModal.tsx` | **Nuevo** |
| `src/features/super-admin/clientes/components/CreateClientModal.tsx` | Fase reveal |

### Historia A — P1

| Archivo | Acción |
|---------|--------|
| `src/features/super-admin/clientes/services/__tests__/cliente.service.test.ts` | Mock credenciales |
| PDF / print en reveal modal | P1 |

### Historia B — P0

| Archivo | Acción |
|---------|--------|
| `src/features/auth/types/auth.types.ts` | Campo + request type |
| `src/features/auth/services/auth.service.ts` | normalize + changePassword |
| `src/core/auth/utils/decodeAccessToken.ts` | Claim |
| `src/shared/context/AuthContext.tsx` | Gate menú + getter + change handler |
| `src/shared/components/ProtectedRoute.tsx` | Redirect priority |
| `src/features/auth/pages/Login.tsx` | Redirect post-login |
| `src/features/auth/pages/ChangePasswordPage.tsx` | **Nuevo** |
| `src/features/auth/routes.tsx` | Ruta |

### Historia B — P1

| Archivo | Acción |
|---------|--------|
| `AuthContext.tsx` | Interceptor 403 |
| `src/core/services/error.service.ts` | `getApiErrorCode` |
| `src/core/api/auth-http.utils.ts` | Whitelist |
| `src/shared/components/SmartRedirect.tsx` | Gate `/` |
| `src/core/routing/post-login-path.ts` | Constantes/helpers |

---

## 7.4 Archivos que NO deben tocarse

| Archivo | Motivo |
|---------|--------|
| `src/core/hooks/useClienteMutations.ts` | Aislado con `useProvisionCliente` |
| `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` | Flujo interno al modal |
| `src/core/api/axios-instances.ts` | Sin lógica de auth routing |
| `src/core/api/api.ts` | Sin cambios |
| `src/features/auth/stores/empresa-selection.store.ts` | `userPreview` basta |
| `src/features/auth/pages/OnboardingEmpresaPage.tsx` | Guard redirige antes |
| `src/features/org/pages/EmpresaPage.tsx` | Idem |
| `src/features/auth/pages/SeleccionarEmpresaPage.tsx` | P2 — MVP vía Login order |
| `src/shared/components/layout/NewLayout.tsx` | Ruta fuera de AppLayout |
| `src/app/router/guards/PermissionGuard.tsx` | Inaccesible con flag true |
| `src/features/super-admin/clientes/pages/ClientDetailPage.tsx` | Fuera de alcance |
| `src/features/super-admin/clientes/components/EditClientModal.tsx` | Fuera de alcance |
| `src/features/super-admin/routes.tsx` | Sin rutas nuevas para A |
| `src/app/router.tsx` | Solo si authRoutes se importa estáticamente (cambio mínimo en auth/routes, no aquí) |
| Módulos ERP (`features/inv`, `pur`, etc.) | Sin cambios |

---

## 7.5 Orden de implementación más seguro

Prioridad: **evitar admins atrapados en ERP roto (B)** antes o en paralelo con credenciales (A).

```text
Bloque 0 — Fundamentos (medio día)
  auth.types.ts + decodeAccessToken + cliente.types.ts

Bloque 1 — Historia B núcleo (2 días)  ← CRÍTICO PRIMERO
  auth.service.ts (normalize + changePassword)
  AuthContext: shouldSkipErpMenuLoad + requiresPasswordChange getter
  ChangePasswordPage + auth/routes
  Login redirect
  ProtectedRoute gate

Bloque 2 — Historia B endurecimiento (1 día)
  AuthContext interceptor 403 (P1)
  SmartRedirect (P1)
  error.service + auth-http.utils (P1)

Bloque 3 — Historia A (1.5 días)
  cliente.service + useProvisionCliente
  ClientCredentialsRevealModal
  CreateClientModal fase reveal

Bloque 4 — QA E2E (1 día)
  Flujo completo: crear tenant → copiar creds → login admin → change → onboarding → ERP
  Regresión: platform_admin, impersonación, multi-empresa, F5

Bloque 5 — P1 opcional (0.5 días)
  PDF credenciales
```

**Por qué B antes que A:** un admin creado manualmente en BD o vía API ya necesita force-password; A sin B deja ERP inutilizable. A sin B también significa que el superadmin entrega credenciales que el admin no puede usar correctamente.

---

## 7.6 Riesgos de regresión restantes (post-arquitectura ajustada)

| ID | Riesgo | Severidad | Estado tras MVP | Mitigación residual |
|----|--------|-----------|-----------------|---------------------|
| R1 | Spinner infinito `ProtectedRoute` | Alta | **Cerrado** con `shouldSkipErpMenuLoad` + `menuPermissionsReady=true` | Test QA documentado |
| R2 | Login Schema A salta password | Alta | **Cerrado** con orden en Login | E2E multi-empresa |
| R3 | Bucle `/change-password` ↔ ERP | Alta | **Cerrado** con guard + whitelist P1 | Manual + interceptor |
| R4 | Impersonación bloqueada | Alta | **Cerrado** con exclusión | QA soporte |
| R5 | Platform admin forzado | Alta | **Cerrado** con exclusión | QA login plataforma |
| R6 | Race: fetch ERP antes de redirect | Media | **Mitigado** P1 interceptor | Monitorear Sentry |
| R7 | `cambiarEmpresaActiva` con flag | Media | **Abierto** P2 | Backend 403; deshabilitar UI en P2 |
| R8 | SSO muestra change page | Baja | **Cerrado** backend | FE redirect solo si flag true |
| R9 | Credenciales en memoria tras crash | Baja | Aceptado | Operador recrea cliente o reset manual BD |
| R10 | `useCreateCliente` muerto | Baja | Aceptado | Lint/import cleanup opcional |
| R11 | Refresh deja user stale 1 ciclo | Media | **Mitigado** decode JWT | `/me` en bootstrap ya corre |
| R12 | Local API instances (on-premise) sin interceptor 403 | Media | **Abierto** | P2 — replicar handler en `createLocalApi` si clientes on-premise usan force-password |

---

## 7.7 Diferencias vs plan v1.0 (changelog)

| Tema | Plan v1.0 | Esta revisión |
|------|-----------|---------------|
| `useCreateCliente` | Modificar | **No tocar** — `useProvisionCliente` |
| `ClientManagementPage` | Modificar | **No tocar** |
| `NewLayout` hideChrome | Modificar | **No tocar** — ruta en authRoutes |
| Interceptor 403 | P0 implícito | **P1** — AuthContext, no nuevo global |
| PDF | P1 | **P1 confirmado** (no P0) |
| SmartRedirect | P0 implícito | **P1** |
| `empresa-selection.store` | Modificar | **No tocar** |
| Estado flag | useState dedicado | **Computed desde `auth.user`** |
| Orden implementación | A → B | **B núcleo → A** |

---

## 7.8 Criterios de aprobación pre-merge

### Historia A
- [ ] Crear cliente muestra credenciales sin modificar `ClientManagementPage`
- [ ] `core/hooks/useClienteMutations.ts` sin diff (o diff cero en `useCreateCliente`)
- [ ] Clipboard P0 funcional; PDF no bloquea merge

### Historia B
- [ ] Admin con flag no alcanza `/app/*` ni `/admin/*`
- [ ] `GET /auth/menu` no se llama con flag true
- [ ] `menuPermissionsReady === true` con flag true (sin spinner)
- [ ] Impersonación y platform_admin sin regresión
- [ ] Interceptor 403 puede entrar en PR separado P1 si guards P0 están en mismo release

---

**Fin de la revisión.** Arquitectura validada contra el código actual. Lista para implementación con alcance reducido y menor riesgo de regresión.
