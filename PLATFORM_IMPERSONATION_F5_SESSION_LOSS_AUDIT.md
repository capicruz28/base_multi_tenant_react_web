# Auditoría técnica — Pérdida de impersonación tras F5 (frontend)

**Fecha:** 02 jun 2026  
**Alcance:** Solo repositorio frontend (`d:/base_multi_tenant_react_web`). Backend es proyecto separado (fuera de alcance de cambios), pero se referencia como dependencia de flujos (refresh/cookies).  
**Estado:** Auditoría + causa raíz probable + propuesta mínima (sin implementar). **Sin código, sin commit.**

---

## 1. Síntoma QA (confirmado)

**Antes de F5 (sesión impersonada operativa):**

- `GET /auth/me` devuelve `user_type = tenant_admin` y sesión impersonada activa (JWT claim `is_impersonation = true`).
- `sessionStorage` contiene `platform_parent_session`.
- Banner “Modo soporte activo” visible.

**Después de F5 en cualquier `/app/*`:**

- Se pierde la sesión impersonada y vuelve el contexto platform.
- `GET /auth/me` devuelve `user_type = platform_admin`, `is_impersonation = false`.
- `platform_parent_session` desaparece de `sessionStorage`.

---

## 2. Qué significa este síntoma en términos de arquitectura

El frontend **solo persiste** en `sessionStorage` la **sesión padre platform** (`platform_parent_session`), pero **no persiste** el **access token impersonado** (sesión de soporte).  
El access token impersonado vive en **memoria** (`AuthContext` / `authRef.current.token`).

Por diseño del navegador, al presionar **F5**:

- el estado de React se reinicia → `authRef.current.token` vuelve a `null` (`initialAuth`),
- `sessionStorage` **permanece** (misma pestaña) → `platform_parent_session` sigue presente,
- por lo tanto, el bootstrap interpreta: **“hay parent session, pero no hay token impersonado en memoria”**,
  y ejecuta una restauración a platform, lo que además **borra** `platform_parent_session`.

Este mecanismo explica exactamente tu evidencia.

---

## 3. Evidencia en código (puntos exactos)

### 3.1 Dónde se crea `platform_parent_session`

En `AuthContext.startImpersonationHandler` se guarda la sesión padre antes de solicitar el token impersonado:

```1321:1329:src/shared/context/AuthContext.tsx
savePlatformParentSession({
  accessToken: current.token,
  userData: current.user,
  tenantContext: {
    tenantId: current.user.cliente_id ?? clienteInfo?.cliente_id ?? null,
    subdomain: clienteInfo?.subdominio ?? null,
    clienteInfo,
  },
});
```

La implementación escribe en `sessionStorage`:

```17:23:src/core/auth/utils/platform-parent-session.ts
export function savePlatformParentSession(session: PlatformParentSession): void {
  try {
    sessionStorage.setItem(PLATFORM_PARENT_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    // ...
  }
}
```

---

### 3.2 Dónde se elimina `platform_parent_session` (todos los caminos)

**A) Logout estándar (cualquier sesión):**

```541:543:src/shared/context/AuthContext.tsx
clearImpersonationState();
clearPlatformParentSession();
```

Este camino se ejecuta dentro de `doLogout()`.

**B) Restauración de plataforma (salida de modo soporte):**

`restorePlatformSession()` siempre termina limpiando el parent:

```764:770:src/shared/context/AuthContext.tsx
setAuth(restoredAuth);
authRef.current = restoredAuth;
clearPlatformParentSession();
```

**C) Falla al iniciar impersonación (Schema B no hidrata sesión):**

```1350:1353:src/shared/context/AuthContext.tsx
if (!session?.user) {
  clearPlatformParentSession();
  clearImpersonationState();
  throw new Error('No se pudo iniciar la sesión de soporte');
}
```

**D) Restauración cuando el parent está corrupto/inválido:**

```742:747:src/shared/context/AuthContext.tsx
const parent = getPlatformParentSession();
if (!parent?.accessToken?.trim()) {
  clearPlatformParentSession();
  clearImpersonationState();
  await doLogout(false);
  // ...
  return;
}
```

---

### 3.3 Qué flujo se ejecuta al seleccionar empresa (impersonación)

La pantalla `SeleccionarEmpresaPage` llama a `completeEmpresaSelection` y luego navega según `resolvePostEmpresaSelectionPath`.

```39:48:src/features/auth/pages/SeleccionarEmpresaPage.tsx
const user = await completeEmpresaSelection(empresaId);
// ...
navigate(
  resolvePostEmpresaSelectionPath(auth.token, { isImpersonation }),
  { replace: true },
);
```

En `AuthContext.completeEmpresaSelection` el token completo devuelto por backend se aplica a la sesión:

```1254:1271:src/shared/context/AuthContext.tsx
const tokenResponse = await authService.seleccionarEmpresa(empresaId, selectionToken);
const session = await applyFullSessionToken(tokenResponse);
useEmpresaSelectionStore.getState().clearPendingSelection();
return session?.user ?? null;
```

**Punto clave:** `applyFullSessionToken` guarda el **access token** solo en memoria (`setAuth`, `authRef.current`) y limpia caches, pero **no persiste** ese token impersonado en `sessionStorage`.

```1208:1212:src/shared/context/AuthContext.tsx
const newAuth = { token: response.access_token, user: response.user_data ?? null };
setAuth(newAuth);
authRef.current = newAuth;
```

---

### 3.4 Qué flujo se ejecuta en el bootstrap tras F5

En `AuthContext` el `runBootstrap()` aplica un orden estricto. El caso relevante es:

1) No estamos en `/login`.  
2) No hay `empresa-selection` pendiente.  
3) **Sí** hay `platform_parent_session` en `sessionStorage`.  
4) Pero tras F5 el `memToken` (token en memoria) vuelve a `null`.

Esto dispara explícitamente la restauración de platform:

```1081:1114:src/shared/context/AuthContext.tsx
if (hasPlatformParentSession()) {
  const memToken = authRef.current.token;
  if (isImpersonationToken(memToken) && canInitializeFullSession(memToken)) {
    // rehidratar sesión impersonada desde token EN MEMORIA (no aplica tras F5)
    await initializeAuth();
    return;
  }
  if (!isImpersonationToken(memToken)) {
    const redirect = window.location.pathname.startsWith('/app');
    await restorePlatformSession({ redirectToSuperAdmin: redirect });
    return;
  }
  // ...
}
```

Como `memToken` es `null`, `isImpersonationToken(null)` es `false` y se ejecuta:

- `restorePlatformSession()` → setea auth con token de platform y **borra** `platform_parent_session` (ver §3.2.B).

**Esto explica exactamente tu evidencia:**

- tras F5 `GET /auth/me` vuelve a ser platform_admin (porque el FE restauró platform),
- `platform_parent_session` desaparece (porque `restorePlatformSession()` lo limpia).

---

### 3.5 ¿Existe `clearAuthStorage`, `logout parcial`, `sessionStorage.clear`, etc.?

En lo revisado para esta incidencia:

- **No** hay `sessionStorage.clear()` asociado al flujo de impersonación.
- El borrado observado se explica por **`clearPlatformParentSession()`**, llamado desde:
  - `doLogout()`, o
  - `restorePlatformSession()` (camino activado tras F5).

---

## 4. Causa raíz probable (con alta confianza)

**Causa raíz:** La sesión impersonada (token de soporte) **no es persistente**; vive solo en memoria.  
En presencia de `platform_parent_session`, el bootstrap trata la ausencia de token impersonado en memoria como señal de “soporte terminó / estado inconsistente” y restaura automáticamente la sesión platform, eliminando el parent.

En otras palabras:

- `platform_parent_session` es un “stack” de sesión,
- pero falta el elemento superior del stack (token impersonado persistido),
- al refrescar, el sistema **rebobina** al padre.

**Por qué se manifiesta “después de seleccionar empresa”:** porque es el primer momento en el que existe una sesión impersonada **completa** (Schema B) que vive en memoria y permite navegar `/app/*`. Tras F5 esa memoria se pierde.

---

## 5. Archivos involucrados (directos)

```
src/shared/context/AuthContext.tsx
src/core/auth/utils/platform-parent-session.ts
src/core/auth/utils/impersonation-session.ts
src/core/auth/utils/session-token.ts
src/features/auth/pages/SeleccionarEmpresaPage.tsx
src/features/auth/stores/empresa-selection.store.ts
```

---

## 6. Propuesta mínima de corrección (sin implementar)

### Objetivo de la corrección

Permitir que tras F5, si la sesión impersonada sigue siendo válida, el frontend pueda **rehidratar** el token impersonado en vez de “rebobinar” automáticamente a platform.

### Opción 1 (mínima FE, recomendada si backend no da refresh a impersonación)

**Persistir el access token impersonado en `sessionStorage` solo durante modo soporte**, por ejemplo en una key dedicada (p. ej. `impersonation_access_token`), y limpiar esa key al finalizar soporte.

**Ajuste conceptual del bootstrap:**

- Si `hasPlatformParentSession()` y existe `impersonation_access_token` en sessionStorage:
  - cargarlo en `authRef.current.token`,
  - ejecutar `initializeAuth()` para reconstruir `/auth/me` + `/auth/menu`,
  - **no** restaurar platform.
- Si no existe, mantener comportamiento actual (restore platform).

**Trade-off:** El access token impersonado quedaría en `sessionStorage` (mismo riesgo que cualquier token persistido). Se mitiga porque:

- solo se guarda en soporte,
- se borra en `endImpersonationHandler` / `restorePlatformSession` / `doLogout`,
- se puede guardar solo un prefijo o cifrado (pero cifrado en FE no es seguridad fuerte).

### Opción 2 (mejor seguridad: backend)

Hacer la sesión impersonada refresheable (refresh cookie / exchange token) para que tras F5 el FE haga `POST /auth/refresh/` en el contexto impersonado.  
Esta opción depende del backend; aquí solo se menciona como alternativa.

### Opción 3 (cambiar semántica actual)

No borrar `platform_parent_session` en `restorePlatformSession()` cuando el restore sea disparado por bootstrap; mantenerlo para permitir “volver a soporte” manualmente.  
Esto cambia UX y puede introducir estados ambiguos (no recomendado sin diseño).

---

## 7. Conclusión

La pérdida de impersonación tras F5 **no es un bug “de permisos”** ni de selección de empresa: es un comportamiento determinístico del bootstrap frente a `platform_parent_session` con token impersonado no persistido.

El código que “provoca” la pérdida del `platform_parent_session` es el camino:

1) `hasPlatformParentSession() === true` en bootstrap,  
2) `authRef.current.token === null` tras F5,  
3) `restorePlatformSession()` ejecutado,  
4) `clearPlatformParentSession()` llamado dentro de `restorePlatformSession()`.

La corrección mínima (sin tocar auth/JWT/RBAC/router) es persistir el token impersonado durante soporte o habilitar refresh de impersonación en backend.

