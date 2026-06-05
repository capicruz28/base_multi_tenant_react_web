# M2 Frontend Multiempresa — Implementación y evidencia de validación

**Fecha:** 31 mayo 2026  
**Alcance implementado:** M2.1, M2.2, M2.3  
**Commit:** Pendiente (no generado)

---

## 1. Resumen de cambios

| Fase | Archivo | Cambio |
|------|---------|--------|
| **M2.1** | `src/shared/context/AuthContext.tsx` | `empresasDisponibles` se carga para `tenant_admin` (mismo `GET /org/empresa` que operativos). `platform_admin` sigue excluido. |
| **M2.2** | `src/shared/components/layout/Header.tsx` | `EmpresaSelector` visible en `/app/*` (todos) y `/admin/*` (solo `tenant_admin`). |
| **M2.3** | `src/core/auth/PermissionContext.tsx` | Permisos se reinician y recargan al cambiar `empresaActivaId` o `auth.token`. |

**Archivos no modificados (según restricciones):** Login, SeleccionarEmpresaPage, guards, backend.

---

## 2. Diff funcional (referencia)

### M2.1 — AuthContext `initializeAuth`

**Antes:** lista empresas solo si `type !== 'platform_admin' && type !== 'tenant_admin'`.

**Después:**

```typescript
if (type !== 'platform_admin' && !isOnboardingAdmin) {
  const all = await empresaService.list({ solo_activos: true });
  setEmpresasDisponibles(/* ... */);
}
```

### M2.2 — Header

**Antes:** `{shell === 'app' && <EmpresaSelector />}`

**Después:**

```tsx
{(shell === 'app' || (shell === 'admin' && isTenantAdminUser)) && (
  <EmpresaSelector />
)}
```

### M2.3 — PermissionContext

**Antes:** reset y reload solo por `usuario_id` / sesión genérica.

**Después:**

```typescript
useEffect(() => {
  setPermissionsInitialized(false);
}, [auth.user?.usuario_id, empresaActivaId]);

useEffect(() => {
  // ...
  loadPermissions();
}, [
  isAuthenticated,
  authLoading,
  loadPermissions,
  requiereSeleccionEmpresa,
  auth.token,
  empresaActivaId,
]);
```

---

## 3. Cadena de refresco post-cambio (sin cambios en M2, verificada)

`EmpresaSelector` → `cambiarEmpresaActiva` → `authService.cambiarEmpresa` → `applyFullSessionToken`:

1. `queryClient.clear()` + `invalidateOrgQueries()`
2. Nuevo token en AuthContext
3. `initializeAuth()` → `GET /auth/me` → `syncEmpresaSession` → **`empresaActivaId` actualizado**
4. `loadMenuAndPermissionsFromAuthMenu` → **`GET /auth/menu`**
5. **M2.3:** cambio de `empresaActivaId` / `auth.token` → **`GET /auth/permissions/me`**

---

## 4. Evidencia de validación manual

### Metodología

| Tipo | Descripción |
|------|-------------|
| **Estática** | Trazado de código + linter en archivos tocados |
| **Build** | `npm run build` — errores TS preexistentes en otros módulos; **ninguno en los 3 archivos M2** |
| **Runtime** | Checklist para ejecutar en entorno con backend M1/M4 validado |

---

### Escenario 1 — `tenant_admin` con 1 empresa

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | Login como `tenant_admin`, tenant con 1 empresa activa | Redirect a `/admin/*` o `/app/*` según menú | Sin cambio login |
| 2 | Observar header en `/admin/usuarios` | Badge empresa (icono + nombre), **sin chevron** | `isMultiEmpresa = empresasDisponibles.length > 1` → false; Header monta selector (M2.2) |
| 3 | Observar header en `/app/home` | Mismo badge estático | Misma condición Header |
| 4 | Intentar click en badge | No abre dropdown | `EmpresaSelector` líneas 142–147: render `div` no interactivo si `!isMultiEmpresa` |

**Estado validación estática:** ✅ Coherente con implementación.

**Runtime QA:**

```
[ ] Login tenant_admin (1 empresa)
[ ] Header /admin muestra nombre empresa, sin dropdown
[ ] Header /app muestra nombre empresa, sin dropdown
```

---

### Escenario 2 — `tenant_admin` con múltiples empresas

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | Login `tenant_admin`, N≥2 empresas (M4 default o selección previa) | Sesión con `empresa_activa` en JWT | Backend validado |
| 2 | Bootstrap | `empresasDisponibles.length >= 2` | **M2.1** carga lista para `tenant_admin` |
| 3 | Header `/admin` y `/app` | Botón con chevron ▼ | `isMultiEmpresa === true` |
| 4 | Abrir dropdown | Lista con N empresas; actual resaltada | `empresasDisponibles.map` + `isActive` |

**Estado validación estática:** ✅ Coherente.

**Runtime QA:**

```
[ ] empresasDisponibles poblado (DevTools → AuthContext / React Query org list)
[ ] Dropdown visible en /admin y /app
[ ] Empresa actual marcada en lista
```

---

### Escenario 3 — Cambio de empresa desde `/app`

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | `tenant_admin` en `/app/inv/stock` (o home) | Selector visible | M2.2 |
| 2 | Elegir otra empresa en dropdown | Spinner en botón | `changing` state |
| 3 | Éxito | Toast `Empresa activa: {nombre}` | `EmpresaSelector.handleSelect` |
| 4 | Network | `POST /auth/empresa/cambiar/` → 200 | `auth.service.cambiarEmpresa` |
| 5 | Network | `GET /auth/me`, `GET /auth/menu`, `GET /auth/permissions/me` | `applyFullSessionToken` + **M2.3** |
| 6 | UI | Label header actualizado | `syncEmpresaSession` + `displayName` effect |

**Estado validación estática:** ✅ Coherente.

**Runtime QA:**

```
[ ] POST /auth/empresa/cambiar/ 200
[ ] GET /auth/me → empresa_activa nueva
[ ] Header muestra nueva empresa
[ ] Permanece en ruta /app (sin redirect forzado)
```

---

### Escenario 4 — Cambio de empresa desde `/admin`

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | `tenant_admin` en `/admin/usuarios` | Selector visible (**nuevo M2**) | `(shell === 'admin' && isTenantAdminUser)` |
| 2 | Cambiar empresa | Misma cadena que escenario 3 | `cambiarEmpresaActiva` compartido |
| 3 | Permanece en `/admin/usuarios` | Sin redirect | Sin cambio de navegación post-cambio |

**Estado validación estática:** ✅ Coherente.

**Runtime QA:**

```
[ ] Selector visible en /admin (antes NO visible)
[ ] Cambio empresa exitoso desde /admin
[ ] Ruta admin conservada tras cambio
```

---

### Escenario 5 — Refresco de menú

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | Tras cambio empresa | Sidebar/navbar items pueden cambiar | `loadMenuAndPermissionsFromAuthMenu` en `initializeAuth` |
| 2 | `ShellCrossNav` | Destinos recalculados | `useMemo` depende de `menuModulos` |
| 3 | Breadcrumbs | Actualizados | `useShellBreadcrumbs(menuModulos, ...)` |

**Estado validación estática:** ✅ Sin regresión; flujo existente intacto.

**Runtime QA:**

```
[ ] Network: GET /auth/menu tras cambio
[ ] Sidebar refleja menú de nueva empresa (si difiere por BE)
[ ] ShellCrossNav sigue apuntando a rutas válidas
```

---

### Escenario 6 — Refresco de permisos

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | Tras cambio empresa | `permissionsInitialized` → false → true | **M2.3** reset effect |
| 2 | Network | Nuevo `GET /auth/permissions/me` | deps incluyen `auth.token`, `empresaActivaId` |
| 3 | UI granular | `hasPermission(...)` coherente | `PermissionContext` state actualizado |
| 4 | AuthContext permisos menú | Recalculados desde `/auth/menu` | flujo previo sin cambio |

**Estado validación estática:** ✅ Fix M2.3 cierra gap documentado en auditoría M2.

**Runtime QA:**

```
[ ] GET /auth/permissions/me disparado tras cambio (mismo usuario_id, distinta empresa)
[ ] ProtectedRoute no queda en spinner infinito (permissionsInitialized vuelve a true)
[ ] Botones condicionados a hasPermission reflejan nueva empresa
```

---

### Escenario 7 — `platform_admin` sin regresiones

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | Login `platform_admin` | `/super-admin/dashboard` | Sin cambio |
| 2 | Header super-admin | **Sin** `EmpresaSelector` | Condición requiere `shell === 'app' \|\| (admin && tenant_admin)`; super-admin shell = `'super-admin'` |
| 3 | `empresasDisponibles` | No cargado | **M2.1** excluye `platform_admin` |
| 4 | Acceso `/app` | Bloqueado por guard | Sin cambio guards |

**Estado validación estática:** ✅ Sin impacto.

**Runtime QA:**

```
[ ] Super-admin header sin selector empresa
[ ] Sin llamadas extra a /org/empresa en bootstrap platform_admin
[ ] Flujo impersonación sin regresión (fuera alcance M2 pero smoke test recomendado)
```

---

### Escenario 8 — Usuario operativo (`user`) sin regresiones

| Paso | Acción | Resultado esperado | Evidencia estática |
|------|--------|-------------------|-------------------|
| 1 | Login operativo multiempresa | Flujo login/selección intacto | Restricción: no tocar login |
| 2 | Header `/app` | Selector como antes | `shell === 'app'` sigue true |
| 3 | Header `/admin` | Sin selector | Operativo no es `isTenantAdminUser` |
| 4 | `empresasDisponibles` | Sigue cargando | **M2.1** incluye `user`, excluye solo `platform_admin` |
| 5 | Cambio empresa | Misma cadena + **M2.3** beneficia también a operativos | Permisos recargan al cambiar empresa |

**Estado validación estática:** ✅ Comportamiento preservado; mejora permisos también para operativos.

**Runtime QA:**

```
[ ] Operativo: selector solo en /app (no en /admin)
[ ] Cambio empresa operativo sigue funcionando
[ ] Permisos se recargan tras cambio (verificar Network)
```

---

## 5. Verificación técnica local

| Check | Resultado |
|-------|-----------|
| Linter archivos M2 (`AuthContext`, `Header`, `PermissionContext`) | ✅ Sin errores |
| `npm run build` | ⚠️ Falla por errores TS **preexistentes** en otros módulos (INV, PUR, HCM, etc.). **Ningún error en líneas M2.** |
| Archivos fuera de alcance modificados | ✅ Ninguno |

---

## 6. Matriz de regresión rápida

| Actor | Shell | Selector M2 | Lista empresas M2.1 | Permisos M2.3 |
|-------|-------|-------------|---------------------|---------------|
| `platform_admin` | super-admin | ❌ | ❌ | N/A |
| `tenant_admin` | app | ✅ | ✅ | ✅ reload |
| `tenant_admin` | admin | ✅ **nuevo** | ✅ **nuevo** | ✅ reload |
| `user` | app | ✅ | ✅ | ✅ reload |
| `user` | admin | ❌ (sin acceso) | — | — |

---

## 7. Notas para QA runtime

1. **DevTools → Network:** filtrar `empresa/cambiar`, `auth/me`, `auth/menu`, `auth/permissions/me` en secuencia tras cambio.
2. **React DevTools:** `AuthProvider` → `empresaActivaId`, `empresasDisponibles.length`.
3. **Casos edge:** error 400 en cambiar → toast error, label anterior conservado (`EmpresaSelector` catch).
4. **Manager:** tratar como `user` con roles elevados; mismos criterios escenario 8.

---

## 8. Conclusión

| Fase | Estado implementación | Validación estática |
|------|----------------------|---------------------|
| M2.1 | ✅ Completo | ✅ |
| M2.2 | ✅ Completo | ✅ |
| M2.3 | ✅ Completo | ✅ |

**Pendiente:** ejecución runtime de checklists §4 en entorno con backend M1/M4 y usuarios de prueba.  
**Commit:** no generado (según instrucción).

---

*Generado tras implementación M2.1–M2.3.*
