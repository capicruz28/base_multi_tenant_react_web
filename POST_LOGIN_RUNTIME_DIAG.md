# Diagnóstico runtime — POST_LOGIN_DIAG

**Objetivo:** Identificar exactamente quién navega a `/unauthorized` tras login MANAGER/USER.  
**Sin fixes.** Solo instrumentación DEV temporal.

---

## 1. Cómo capturar evidencia

1. `npm run dev`
2. DevTools → Console → filtro: **`POST_LOGIN_DIAG`**
3. Login como **manager** (reproducir bug)
4. Copiar **todos** los logs `[POST_LOGIN_DIAG]` en orden de `ts`
5. Anotar URL en barra de direcciones cuando aparece `/unauthorized`

---

## 2. Mapa de eventos

| component | event | Significado |
|-----------|-------|-------------|
| `Login` | `destination-calculated` | Destino post-login antes de `navigate()` |
| `resolvePostLoginPath` | `return` | Rama usada + ruta retornada |
| `ProtectedRoute` | `spinner` | Esperando gates (`permissionsInitialized`, `menuPermissionsReady`) |
| `ProtectedRoute` | `access-allowed` | Pasó todos los checks del shell |
| `ProtectedRoute` | `redirect-unauthorized` | **ProtectedRoute** redirige (no PermissionGuard) |
| `PermissionGuard` | `spinner` | Esperando `menuPermissionsReady` |
| `PermissionGuard` | `can-evaluated` | Evaluación `can()` con permisos actuales |
| `PermissionGuard` | `redirect-unauthorized` | **PermissionGuard** redirige |
| `PermissionGuard` | `access-allowed` | Guard OK |
| `UnauthorizedPage` | `mounted` | Estado de navegación recibido |

---

## 3. Campos a extraer (entregable)

Tras reproducir, completar:

| Campo | Dónde leerlo |
|-------|----------------|
| **URL destino post-login** | `Login` → `destination-calculated.destination` |
| **Rama resolvePostLoginPath** | `resolvePostLoginPath` → `return.branch` |
| **Componente que redirige** | Último `redirect-unauthorized` antes de `UnauthorizedPage` → `component` |
| **requiredPermission** | `PermissionGuard` → `redirect-unauthorized.requiredPermission` **o** `UnauthorizedPage` → `requiredPermission` |
| **can() exacto** | `PermissionGuard` → `can-evaluated.canResult` |
| **pathname original** | `PermissionGuard` → `redirect-unauthorized.pathname` **o** `UnauthorizedPage` → `fromPathname` |
| **permissions en deny** | `PermissionGuard` → `permissionsKeys`, `modulePermissions`, `permissionsIsNull` |
| **Gates en deny** | `ProtectedRoute` spinner previo: `permissionsInitialized`, `menuPermissionsReady` |

---

## 4. Interpretación rápida

### Si el redirect lo hace `PermissionGuard`

```text
[POST_LOGIN_DIAG] { component: 'PermissionGuard', event: 'redirect-unauthorized', ... }
```

→ Denegación por `can(module, action)`. Revisar:
- `canResult: false`
- `permissionsIsNull` / `modulePermissions`
- `menuPermissionsReady` en `can-evaluated` (debe ser `true` si deny es legítimo)

### Si el redirect lo hace `ProtectedRoute`

```text
[POST_LOGIN_DIAG] { component: 'ProtectedRoute', event: 'redirect-unauthorized', reason: '...' }
```

→ No es race de menú; es `requireTenantAdmin`, `requireSuperAdmin`, `accessLevel`, o `requiredRole`.

### Si `UnauthorizedPage` monta sin `from` en state

→ Redirect desde `ProtectedRoute` (no pasa `state.from`).

---

## 5. Secuencia esperada (login OK)

```text
Login              destination-calculated  { destination: '/app/...' }
resolvePostLoginPath return               { branch: 'fromMenu', route: '...' }
ProtectedRoute     spinner                { menuPermissionsReady: false }  // opcional breve
ProtectedRoute     access-allowed         { pathname: '/app/...' }
PermissionGuard    can-evaluated          { canResult: true, menuPermissionsReady: true }
PermissionGuard    access-allowed
```

## 6. Secuencia bug (objetivo capturar)

```text
Login              destination-calculated  { destination: '/app/XXX' }
ProtectedRoute     access-allowed          { pathname: '/app/XXX' }
PermissionGuard    can-evaluated           { canResult: false, modulePermissions: ... }
PermissionGuard    redirect-unauthorized   { requiredPermission: 'YYY.ver', pathname: '/app/XXX' }
UnauthorizedPage   mounted                 { fromPathname: '/app/XXX', requiredPermission: 'YYY.ver' }
```

---

## 7. Archivos instrumentados

- `src/core/auth/utils/post-login-diag-log.ts` — helper temporal
- `src/features/auth/pages/Login.tsx`
- `src/core/routing/post-login-path.ts`
- `src/shared/components/ProtectedRoute.tsx`
- `src/app/router/guards/PermissionGuard.tsx`
- `src/pages/UnauthorizedPage.tsx`

**Eliminar** `post-login-diag-log.ts` y logs tras cerrar investigación.

---

## 8. Plantilla de reporte QA

```markdown
### Reproducción MANAGER post-login

- destination: 
- resolvePostLoginPath branch: 
- redirect component: 
- pathname original: 
- requiredPermission: 
- canResult: 
- menuPermissionsReady at deny: 
- permissionsKeys: 
- modulePermissions: 
- permissionsIsNull: 
```

Pegar logs `[POST_LOGIN_DIAG]` completos debajo.
