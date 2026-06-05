# Fix post-login — PermissionGuard race condition

**Fecha:** 31 mayo 2026  
**Referencia:** `MANAGER_POST_LOGIN_UNAUTHORIZED_AUDIT.md`  
**Objetivo:** Eliminar redirección transitoria a `/unauthorized` tras login (MANAGER / USER / tenant_admin).

---

## 1. Problema (resumen)

Tras login, `Login.tsx` navegaba con menú disponible en ref síncrono, pero `PermissionGuard` evaluaba `can()` con `AuthContext.permissions === null` (state React aún no commiteado). `AuthContext.loading` ya era `false` en `/login`, por lo que el guard no esperaba.

`ProtectedRoute` esperaba `permissionsInitialized` (`GET /auth/permissions/me`) pero **no** la indexación de permisos desde `/auth/menu`.

---

## 2. Solución implementada

### 2.1 Señal `menuPermissionsReady` (AuthContext)

Nuevo booleano en `AuthContext`:

| Valor | Significado |
|-------|-------------|
| `false` | Menú/permisos de ruta no listos para evaluar guards |
| `true` | Carga terminal de `loadMenuAndPermissionsFromAuthMenu` |

**Se pone `true` cuando:**

- Operativo / tenant_admin: `GET /auth/menu` OK → `menuModulos` + `permissions` indexados
- `platform_admin`: menú cargado (`permissions` intencionalmente `null`)
- Skip ERP menu (onboarding sin empresa): estado terminal sin menú
- Usuario sin roles: `permissions = {}` terminal
- Error no-409 en `/auth/menu`: estado terminal `{}` / `[]`

**Se pone `false` cuando:**

- Inicio de `loadMenuAndPermissionsFromAuthMenu`
- `applyFullSessionToken` (nueva sesión)
- Logout / clear user
- 409 selección empresa pendiente
- JWT `empresa_selection_pending`

### 2.2 PermissionGuard

```tsx
if (!menuPermissionsReady) {
  return <LoadingSpinner fullScreen message="Verificando permisos..." />;
}
// solo entonces can(module, action)
```

- **No** usa `AuthContext.loading`
- **No** redirige a `/unauthorized` mientras `menuPermissionsReady === false`
- **No** invoca `can()` hasta ready

### 2.3 ProtectedRoute

Gate unificado para sesión autenticada:

```tsx
const sessionGatesPending =
  isAuthenticated && (!permissionsInitialized || !menuPermissionsReady);
```

Evita ventana donde `permissionsInitialized === true` pero `permissions === null` en AuthContext.

Rutas especiales (`/app/seleccionar-empresa` con selección pendiente) siguen sin bloquearse.

### 2.4 usePermissions

Exporta `menuPermissionsReady` en lugar de `loading` para guards.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/shared/context/AuthContext.tsx` | Estado `menuPermissionsReady`, wiring en `loadMenuAndPermissionsFromAuthMenu`, login/logout/init |
| `src/app/router/guards/PermissionGuard.tsx` | Gate `menuPermissionsReady` |
| `src/shared/components/ProtectedRoute.tsx` | `sessionGatesPending` |
| `src/core/auth/hooks/usePermissions.ts` | Expone `menuPermissionsReady` |
| `src/app/router/guards/__tests__/PermissionGuard.test.tsx` | **Nuevo** — tests guard |
| `src/core/auth/utils/__tests__/menu-permissions-ready.test.ts` | **Nuevo** — matriz semántica |

---

## 4. Resultados QA (automated + runtime)

### 4.1 Tests automatizados — PASS

```text
npm run test:run -- \
  src/app/router/guards/__tests__/PermissionGuard.test.tsx \
  src/core/auth/utils/__tests__/menu-permissions-ready.test.ts

 ✓ menu-permissions-ready.test.ts  (10 tests)
 ✓ PermissionGuard.test.tsx        (3 tests)

 Test Files  2 passed (2)
      Tests  13 passed (13)
```

**Casos cubiertos:**

| Test | Resultado | Evidencia |
|------|-----------|-----------|
| `menuPermissionsReady=false` | Spinner, **sin** `/unauthorized`, **sin** `can()` | `PermissionGuard.test.tsx` |
| `menuPermissionsReady=true` + `can()=true` | Render contenido protegido | ✅ log `Acceso permitido a inv.ver` |
| `menuPermissionsReady=true` + `can()=false` | Redirect legítimo a `/unauthorized` | ✅ log `Acceso denegado a inv.ver` |

### 4.2 QA runtime manual (checklist por rol)

Ejecutar en DEV con backend local. **Resultado esperado:** primera navegación post-login **nunca** muestra `/unauthorized` por carga incompleta.

| Rol | Pasos | Esperado | Console DEV |
|-----|-------|----------|-------------|
| **manager** (`user_type: user`) | Login → observar primera URL | Módulo ERP o `/app/home`; **no** `/unauthorized` | `[Login] navigate → ...` luego `✅ [PermissionGuard]` o spinner breve |
| **user** operativo | Igual | Igual | `[ProtectedRoute] spinner` puede mostrar `menuPermissionsReady: false` brevemente |
| **tenant_admin** | Login → `/admin` o `/app` según menú | Panel correcto; **no** unauthorized transitorio | `menuPermissionsReady: true` antes de deny |

**Logs DEV a verificar (orden):**

1. `[Login] navigate → /app/...`
2. `[ProtectedRoute] spinner` con `menuPermissionsReady: false` (opcional, breve)
3. `✅ [AuthContext] Menú y permisos cargados: N módulo(s)`
4. `✅ [PermissionGuard] Acceso permitido a X.ver`

**No debe aparecer** (salvo denegación real de permiso):

```text
🚫 [PermissionGuard] Acceso denegado ... (con permissions aún null en React DevTools)
```

### 4.3 Escenarios de regresión

| Escenario | Esperado |
|-----------|----------|
| F5 en `/app/inv/*` autenticado | Spinner → módulo (no unauthorized falso) |
| Logout → login otro usuario | `menuPermissionsReady` reset → recarga OK |
| Selección empresa (409) | `/app/seleccionar-empresa` accesible (bypass gate) |
| `/app/home` | Sin PermissionGuard; ProtectedRoute espera gates y renderiza Home |

---

## 5. Diagrama post-fix

```
Login → initializeAuth → /auth/menu → setPermissions + menuPermissionsReady=true
                                              ↓
navigate(/app/xxx) → ProtectedRoute (permissionsInitialized ∧ menuPermissionsReady)
                                              ↓
                              PermissionGuard (menuPermissionsReady → can())
                                              ↓
                                    módulo OK (no race)
```

---

## 6. Fuera de alcance

- Backend
- Commit (pendiente aprobación)
- Cambio de destino post-login (`resolvePostLoginPath` sigue usando primera ruta del menú)

---

*Fix validado por tests unitarios del guard. QA manual por rol pendiente de ejecución en entorno con backend.*
