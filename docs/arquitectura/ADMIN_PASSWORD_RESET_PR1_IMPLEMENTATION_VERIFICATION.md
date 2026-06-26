# ADMIN_PASSWORD_RESET — Verificación READ ONLY de implementación PR1

**Documento:** `docs/arquitectura/ADMIN_PASSWORD_RESET_PR1_IMPLEMENTATION_VERIFICATION.md`  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — sin cambios de código  
**Motivo:** Inconsistencia reportada — la UI muestra solo **Editar** y **Desactivar**; no aparece **Restablecer contraseña**.

---

## 1. Conclusión ejecutiva

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe `renderResetPasswordButton()` en el repo? | **Sí** — en el **working tree** (archivo modificado, no commiteado). |
| ¿Está en el último commit Git (`HEAD`)? | **No** — `HEAD` no contiene `KeyRound`, `renderResetPasswordButton` ni `canShowAdminPasswordReset`. |
| ¿La ruta `/admin/usuarios` usa ese archivo? | **Sí** — `adminRoutes` → lazy `UserManagementPage`. |
| ¿Por qué no se ve el botón? | **Dos causas posibles, no excluyentes:** (A) **build/código desplegado = `HEAD` sin PR1**; (B) **código PR1 cargado pero gates devuelven `false`** — en la práctica, la causa más probable con código PR1 activo es **`hasResetPermission === false`** (permiso `admin.usuario.reset_password` ausente en `GET /auth/permissions/me`). |

**La implementación PR1 está aplicada en disco pero no está integrada en Git.** El informe PR1 describe código que existe localmente como cambios sin commit. Si el entorno observado corre sobre `HEAD` (CI, preview, otro clone, build sin guardar), la pantalla coincide exactamente con lo reportado: solo Editar + Desactivar.

---

## 2. Evidencia: `renderResetPasswordButton()`

### 2.1 ¿Existe?

**Sí.**

| Atributo | Valor |
|----------|-------|
| Archivo | `src/features/admin/pages/UserManagementPage.tsx` |
| Función | `renderResetPasswordButton` |
| Líneas definición | **642–659** |
| Import `KeyRound` | Línea **7** |
| Import `canShowAdminPasswordReset` | Líneas **40–44** |

```642:659:src/features/admin/pages/UserManagementPage.tsx
  const renderResetPasswordButton = (user: UserWithRoles) => {
    if (!canShowAdminPasswordReset(user, resetVisibilityCtx)) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={() => handleOpenResetConfirm(user)}
        className="text-warning hover:text-warning/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
        title="Restablecer contraseña"
        disabled={authLoading || !isAuthenticated || pageActionsLocked || isResetPending}
      >
        <KeyRound className="h-4 w-4" />
        <span className="sr-only">Restablecer contraseña</span>
      </button>
    );
  };
```

**No es código muerto en el working tree:** la función se invoca en el JSX de filas activas e inactivas.

### 2.2 ¿Quién la llama?

| Llamador | Archivo | Líneas |
|----------|---------|--------|
| Fila **activa** (entre Editar y Desactivar) | `UserManagementPage.tsx` | **828** |
| Fila **inactiva** (después de Reactivar) | `UserManagementPage.tsx` | **852** |

```825:838:src/features/admin/pages/UserManagementPage.tsx
                                      <Edit3 className="h-4 w-4" />
                                      <span className="sr-only">Editar usuario</span>
                                    </button>
                                    {renderResetPasswordButton(user)}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDeactivateConfirm(user)}
                                      ...
                                      <Trash2 className="h-4 w-4" />
```

Si `canShowAdminPasswordReset` devuelve `false`, `renderResetPasswordButton` devuelve **`null`** y el DOM queda exactamente como se observa: **Editar → Desactivar** sin elemento intermedio.

---

## 3. Evidencia: ruta `/admin/usuarios`

| Paso | Archivo | Líneas | Evidencia |
|------|---------|--------|-----------|
| Router admin | `src/features/admin/routes.tsx` | **5, 16–20** | `lazy(() => import('./pages/UserManagementPage'))` en `path: 'usuarios'` |
| Montaje app | `src/app/router.tsx` | **45, 50** | `ProtectedRoute requireTenantAdmin` + `adminRoutes.children` |
| URL efectiva | — | — | `/admin/usuarios` (prefijo según layout shell) |
| Menú admin | `src/shared/config/adminMenu.ts` | **30** | `ruta: '/admin/usuarios'` |

**No existe otro `UserManagementPage`** en `src/` que compita por la misma ruta. El único componente de página es `src/features/admin/pages/UserManagementPage.tsx`.

---

## 4. Condición exacta que oculta el botón

### 4.1 Cadena de decisión

```
renderResetPasswordButton(user)
  → canShowAdminPasswordReset(user, resetVisibilityCtx)  [iam-user-password-reset.utils.ts:16-25]
  → si false: return null (sin botón en DOM)
```

### 4.2 Función normativa (working tree)

```16:25:src/features/admin/utils/iam-user-password-reset.utils.ts
export function canShowAdminPasswordReset(
  user: UserWithRoles,
  ctx: AdminPasswordResetVisibilityContext,
): boolean {
  if (!ctx.hasResetPermission) return false;
  if (!ctx.currentUsuarioId) return false;
  if (user.usuario_id === ctx.currentUsuarioId) return false;
  if (ctx.pageActionsLocked) return false;
  if (!isLocalAuthUser(user)) return false;
  return true;
}
```

### 4.3 Construcción del contexto en página

```167:178:src/features/admin/pages/UserManagementPage.tsx
  const pageActionsLocked = discardPending !== null || isResetPending;

  const hasResetPermission = hasPermission(ADMIN_USUARIO_PERMISSIONS.RESET_PASSWORD);
  const currentUsuarioId = auth.user?.usuario_id ?? null;

  const resetVisibilityCtx = useMemo(
    () => ({
      currentUsuarioId,
      hasResetPermission,
      pageActionsLocked,
    }),
    [currentUsuarioId, hasResetPermission, pageActionsLocked],
  );
```

Constante permiso: `src/features/admin/constants/admin-usuario.permissions.ts` línea **3** → `'admin.usuario.reset_password'`.

### 4.4 `hasPermission` — origen real

```126:131:src/core/auth/PermissionContext.tsx
  const hasPermission = useCallback(
    (code: string): boolean => {
      if (!code || typeof code !== 'string') return false;
      return permissions.includes(code.trim());
    },
    [permissions]
  );
```

Permisos cargados desde **`GET /auth/permissions/me`** (líneas 82–84). Si el código no está en el array → **`hasResetPermission === false` para todas las filas**.

### 4.5 Tabla de gates

| Gate | Variable / función | Si falla | Efecto en botón |
|------|-------------------|----------|-----------------|
| Permiso RBAC | `hasResetPermission` = `permissions.includes('admin.usuario.reset_password')` | `false` | **Oculto en TODAS las filas** |
| Sesión con `usuario_id` | `currentUsuarioId` = `auth.user?.usuario_id` | `null` | **Oculto en TODAS las filas** |
| Auto-reset | `user.usuario_id === currentUsuarioId` | `true` en esa fila | Oculto **solo en fila del admin** |
| Acciones bloqueadas | `pageActionsLocked` = discard modal \|\| reset pending | `true` | **Oculto en TODAS las filas** (`canShow` devuelve false; spec §2.1) |
| SSO | `isLocalAuthUser(user)` — `proveedor_autenticacion` debe ser ausente o `'local'` | `false` | Oculto **solo en esa fila** |
| Usuario eliminado | No en listado | N/A | No aplica |
| Activo / inactivo | No es gate de visibilidad | — | Botón puede mostrarse en ambos |

**Importante:** **Editar** y **Desactivar** no usan `hasPermission`. La ruta admin solo exige `requireTenantAdmin` (`ProtectedRoute` L232–242). Un `tenant_admin` **puede ver la página sin** `admin.usuario.reset_password`. Eso explica ver Editar/Desactivar pero no Reset.

---

## 5. Evaluación por gate — dos usuarios típicos en tabla

Sin acceso al runtime del observador, se modelan los **dos escenarios más frecuentes** con dos filas visibles. Sustituir IDs reales comprobando DevTools → Network → `/auth/permissions/me` y fila en tabla.

### 5.1 Escenario A — Código PR1 **no** cargado (`HEAD` / build sin cambios)

| Usuario en tabla | ¿Botón Reset? | Motivo |
|------------------|---------------|--------|
| Cualquiera | **No** | `renderResetPasswordButton` **no existe** en `HEAD`; JSX solo tiene Editar + Desactivar |

**Coincide al 100%** con el comportamiento reportado.

### 5.2 Escenario B — Código PR1 cargado (working tree), admin con 2 filas

Supuestos: fila 1 = otro usuario local; fila 2 = el propio admin (misma sesión).

| Gate | Valor esperado fila 1 (otro usuario) | Valor esperado fila 2 (self) |
|------|--------------------------------------|------------------------------|
| `hasResetPermission` | Debe ser **`true`** para ver botón en fila 1 | Igual (global) |
| `currentUsuarioId` | UUID admin autenticado | Igual |
| `user.usuario_id === currentUsuarioId` | **`false`** | **`true`** → gate falla |
| `pageActionsLocked` | **`false`** (sin modal discard) | Igual |
| `proveedor_autenticacion` | ausente o `'local'` → **`true`** en `isLocalAuthUser` | Igual |
| `es_activo` | No afecta visibilidad | No afecta |

**Resultado esperado si `hasResetPermission === true`:** botón solo en **fila 1**, no en fila 2.

### 5.3 Escenario C — Código PR1 cargado, **`hasResetPermission === false`** (más probable con PR1 activo)

Contrato certificación **O2:** permiso puede no estar asignado en tenants legacy.

| Usuario en tabla | ¿Botón Reset? |
|------------------|---------------|
| Fila 1 (cualquier usuario) | **No** |
| Fila 2 (cualquier usuario) | **No** |

**Coincide** con solo Editar + Desactivar en **todas** las filas.

### 5.4 Escenario D — Ambos usuarios SSO (`proveedor_autenticacion !== 'local'`)

| Fila | `isLocalAuthUser` | ¿Botón? |
|------|-------------------|---------|
| Ambas | `false` | **No** (aunque `hasResetPermission` sea true) |

---

## 6. Evidencia Git / build vs implementación

### 6.1 Estado del repositorio (verificado en auditoría)

| Archivo PR1 | Estado Git |
|-------------|------------|
| `pages/UserManagementPage.tsx` | **M** (modificado, sin commit) |
| `services/usuario.service.ts` | **M** |
| `types/usuario.types.ts` | **M** |
| `components/iam/index.ts` | **M** |
| `constants/admin-usuario.permissions.ts` | **??** (untracked) |
| `utils/iam-user-password-reset.utils.ts` | **??** |
| `hooks/useResetUserPassword.ts` | **??** |
| `components/iam/UserPasswordResetRevealDialog.tsx` | **??** |
| Tests PR1 | **??** |

### 6.2 `HEAD` vs working tree

Comando: `git show HEAD:src/features/admin/pages/UserManagementPage.tsx | Select-String KeyRound`

**Resultado:** sin coincidencias.

En `HEAD`, imports de iconos (línea equivalente):

```
import { Edit3, Trash2, RotateCcw, UserPlus, Users } from 'lucide-react';
```

Sin `KeyRound`. Acciones de fila: `Edit3` seguido directamente de `Trash2` — **sin llamada a `renderResetPasswordButton`**.

Último commit que tocó el archivo (histórico): `9c9f850` — anterior a PR1 reset.

### 6.3 ¿La build actual corresponde al código implementado?

| Entorno | ¿Incluye PR1? |
|---------|----------------|
| `git checkout HEAD` + build | **No** |
| Working tree local + `npm run dev` (Vite lee disco) | **Sí**, si el archivo guardado contiene los cambios |
| CI / preview / otro dev sin pull de cambios locales | **No** |
| Deploy desde rama sin commit PR1 | **No** |

**El informe PR1 describe implementación en working tree; no está certificada por commit en `HEAD`.**

---

## 7. Verificaciones adicionales solicitadas

| Verificación | Resultado |
|--------------|-----------|
| ¿Icono `KeyRound` en JSX? | **Sí** — `UserManagementPage.tsx` L655 (working tree) |
| ¿Eliminado por otro commit? | **No en historial reciente** — nunca estuvo en `HEAD`; cambios locales sin commit |
| ¿Código muerto? | **No** en working tree — función llamada L828 y L852; retorna `null` cuando gates fallan |
| ¿Otro componente de usuarios? | **No** — una sola página para `/admin/usuarios` |
| ¿Tests prueban visibilidad? | **Sí** — `UserManagementPage.password-reset.test.tsx` (untracked); mock `hasPermission` → true para ver 1 botón |

---

## 8. Árbol de diagnóstico recomendado (sin modificar código)

Para el observador en runtime:

1. **Confirmar código cargado:** en DevTools → Sources, buscar `renderResetPasswordButton` en `UserManagementPage.tsx`.
   - **No encontrado** → causa **A** (build/HEAD).
   - **Encontrado** → continuar.

2. **Confirmar permiso:** Network → `GET /api/v1/auth/permissions/me` → ¿incluye `"admin.usuario.reset_password"`?
   - **No** → causa **C** (gate global; comportamiento correcto según SPEC).
   - **Sí** → revisar por fila: `usuario_id` self, `proveedor_autenticacion`.

3. **Confirmar Git:** `git status src/features/admin/pages/UserManagementPage.tsx`
   - **`M` o `??`** → PR1 no commiteado; otros entornos no lo tendrán.

---

## 9. Respuestas directas al checklist

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | ¿Existe `renderResetPasswordButton()`? | **Sí** (working tree) |
| 2 | ¿Archivo? | `src/features/admin/pages/UserManagementPage.tsx` |
| 3 | ¿Líneas? | Definición **642–659**; llamadas **828**, **852** |
| 4 | ¿Quién llama? | JSX del `users.map` en columna Acciones (activo e inactivo) |
| 5 | ¿Mismo page que `/admin/usuarios`? | **Sí** — `admin/routes.tsx` L16–20 |
| 6 | ¿Condición que impide aparición? | `canShowAdminPasswordReset` → `false`; causas: **sin permiso RBAC** (global), **self**, **SSO**, **pageActionsLocked**, **sin usuario_id sesión**; o **código PR1 ausente en build** |

---

## 10. Dictamen de verificación

La implementación PR1 **sí fue escrita** en el repositorio local (evidencia en archivos y líneas citadas), pero **no está en el commit `HEAD`**. El comportamiento observado (solo Editar + Desactivar) es **consistente** con:

1. **Ejecución sobre código pre-PR1** (sin `renderResetPasswordButton`), **o**
2. **Ejecución sobre código PR1** con **`hasResetPermission === false`** para el admin autenticado (comportamiento especificado; no es bug de render omitido).

No se detectó eliminación del botón por commit posterior ni código muerto en el working tree. La inconsistencia entre el **informe PR1** y la **UI observada** se explica por **desalineación Git/despliegue** y/o **gate de permiso granular** no satisfecho, no por ausencia de la función en el código fuente local.

---

*Verificación READ ONLY — ADMIN_PASSWORD_RESET PR1 — 2026-06-24.*
