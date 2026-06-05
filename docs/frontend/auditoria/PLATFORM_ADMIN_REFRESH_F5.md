# Investigación — F5 pierde sesión solo en `platform_admin` (`platform.app.local`)

**Fecha:** mayo 2026  
**Estado:** diagnóstico FE + logs; corrección backend pendiente de validar.

---

## Síntoma

| Escenario | F5 | `POST /auth/refresh/` | Resultado |
|-----------|----|------------------------|-----------|
| Tenant normal (`acme.app.local`) | OK | 200 | Sesión persiste |
| `platform_admin` (`platform.app.local`) | Falla | **401** | `doLogout` → `/login` |

El flujo general refresh/cookies **funciona** en tenants; el fallo está **aislado** al contexto plataforma / subdominio `platform`.

`POST /auth/impersonate/` con 401 es **consecuencia** de la sesión plataforma ya perdida tras F5, no causa raíz.

---

## Arquitectura local observada (`.env`)

```env
VITE_API_BASE_URL=http://backend.app.local:8000/api/v1
```

| Capa | Host |
|------|------|
| Frontend | `http://platform.app.local:5173` (o `acme.app.local:5173`) |
| API | `http://backend.app.local:8000` |

Implicaciones:

1. **Cross-origin** FE → API (`platform.app.local` ≠ `backend.app.local`).
2. `withCredentials: true` en Axios es **obligatorio** (ya configurado en `apiCentral`).
3. La cookie `refresh_token` debe tener `Domain` compatible (típico: `.app.local`) para enviarse a `backend.app.local`.
4. `document.cookie` en consola **no muestra** `refresh_token` (HttpOnly) — validar siempre en **DevTools → Network**.

---

## Resolución de tenant en frontend

`tenant-resolver` en `platform.app.local` → subdominio **`platform`**.

Backend (logs): `Subdominio SUPERADMIN: platform -> Cliente ID: 00000000-0000-0000-0000-000000000001`.

Hipótesis principal: en **refresh**, el backend resuelve tenant por Host/Origin/headers y valida que el `refresh_token` en BD pertenezca a ese `cliente_id`. Si el token se emitió con otro contexto o no se emitió cookie para plataforma → **401**.

---

## Diferencias FE: login tenant vs platform_admin

| Aspecto | Mismo código |
|---------|----------------|
| `POST /auth/login/` | `auth.service.ts` |
| Body | `username`, `password` (+ ahora `subdominio` si hay subdominio en URL) |
| Headers | `X-Client-Type: web` + contexto tenant (ver abajo) |
| Bootstrap F5 | `AuthContext` → `refreshToken()` → `initializeAuth()` |

**No hay rama FE distinta** para `platform_admin` en login/refresh. La diferencia es **subdominio resuelto** (`platform` vs `acme`) y respuesta/backend del tenant SUPERADMIN.

---

## Regresión corregida (Network Error / status 0 en login)

**Causa:** headers custom en `auth.service.ts` (`X-Forwarded-Host`, `X-Tenant-Subdomain`, `X-Client-Origin`, …) disparan **preflight OPTIONS**. Si el backend no los incluye en `Access-Control-Allow-Headers`, el navegador bloquea el POST → `AxiosError: Network Error`, `net::ERR_FAILED`, **status 0**.

Con `VITE_API_BASE_URL=http://backend.app.local:8000/api/v1` el **proxy Vite no interviene**; el fallo era solo headers en Axios.

**Fix FE:** login/refresh vuelven a enviar solo `X-Client-Type` (+ `Content-Type`). Headers tenant quedan detrás de `VITE_AUTH_TENANT_HEADERS=true` cuando backend actualice CORS.

**Verificación en DevTools:**

1. OPTIONS antes de POST login — si falla, revisar `Allow-Headers` en respuesta OPTIONS.
2. POST login debe salir con status 200/401 (no 0).
3. Consola sin `blocked by CORS policy` en request headers.

---

## Cambios FE aplicados (diagnóstico)

### 1. Logs `[AuthDebug]` (solo `import.meta.env.DEV`)

- `auth-debug.ts`: contexto (`hostname`, `origin`, `tenantResolver`, `VITE_API_BASE_URL`, `document.cookie`).
- `login` / `refresh`: resultado, status, aviso de inspeccionar `Set-Cookie` en Network.
- Bootstrap: `hasPlatformParentSession`, detalle del 401.

### 2. Headers de contexto tenant en auth

`auth-tenant-context.ts` — enviados en login, refresh, logout, impersonate, seleccionar:

- `X-Forwarded-Host`: `platform.app.local:5173`
- `X-Forwarded-Proto`: `http`
- `X-Client-Origin`: `http://platform.app.local:5173`
- `X-Tenant-Subdomain`: `platform` (si aplica)

**Backend debe leer estos headers** (o `Origin`) cuando `Host` es `backend.app.local`.

### 3. Login: `subdominio` en form body

Si hay subdominio en la URL, se envía `subdominio=platform` en `application/x-www-form-urlencoded` (alineado con descripción OpenAPI aunque el schema generado no lo liste).

### 4. Proxy Vite (si se usa `/api/v1` relativo)

Reenvía `X-Forwarded-Host` y `X-Tenant-Subdomain` al backend (antes solo `changeOrigin` sin contexto).

---

## Checklist backend (prioridad)

Comparar en **Network** tras login exitoso en `platform.app.local` vs `acme.app.local`:

### A. `POST /auth/login/` — Set-Cookie

| Atributo | Tenant OK | Platform (verificar) |
|----------|-----------|----------------------|
| `Domain` | ¿`.app.local`? | ¿Igual o más restrictivo? |
| `Path` | ¿`/` o `/api`? | ¿Excluye `/api/v1/auth/refresh`? |
| `SameSite` | `Lax` / `None` | ¿Igual? |
| `Secure` | según HTTPS | ¿Bloquea en HTTP local? |
| `HttpOnly` | sí | sí |
| Presencia | sí | **¿Falta cookie en platform_admin?** |

### B. Fila `refresh_tokens` (o equivalente)

Para sesión web `platform_admin`:

- `cliente_id` = `00000000-0000-0000-0000-000000000001`
- Token no revocado, no expirado
- Mismo `cliente_id` que usa el middleware en refresh con `X-Tenant-Subdomain: platform`

### C. `POST /auth/refresh/` con cookie

Con cookie presente en request:

1. ¿Middleware resuelve tenant desde `Origin` / `X-Forwarded-Host` / `X-Tenant-Subdomain`?
2. ¿Compara `refresh_token.cliente_id` con tenant resuelto?
3. ¿Ruta especial SUPERADMIN rechaza refresh aunque la cookie sea válida?

### D. CORS (`backend.app.local`)

- `Access-Control-Allow-Origin` debe reflejar `http://platform.app.local:5173` (no `*` si credentials).
- `Access-Control-Allow-Credentials: true`.

---

## Cómo reproducir con logs

1. Abrir consola (DEV).
2. Login en `http://platform.app.local:5173/login` como `platform_admin`.
3. Buscar `[AuthDebug] login BEFORE` / `login response`.
4. En Network → login → Response headers → **Set-Cookie**.
5. F5 en `/super-admin/dashboard`.
6. Buscar `[AuthDebug] bootstrap START` → `refresh BEFORE` → `refresh ERROR` o `refresh OK`.

Si `refresh` falla con 401 y en login **no hubo Set-Cookie** → bug backend emisión cookie plataforma.

Si hubo Set-Cookie pero refresh **no envía Cookie** → Domain/Path/SameSite.

Si Cookie se envía y sigue 401 → validación tenant/token en backend (cliente_id SUPERADMIN).

---

## Impersonación — no depurar hasta estabilizar plataforma

- `sessionStorage.platform_parent_session` solo afecta bootstrap si quedó basura de pruebas; limpiar con `sessionStorage.removeItem('platform_parent_session')` al probar login puro.
- No probar impersonate hasta: login platform → F5 → refresh **200**.

---

## Archivos tocados

- `src/core/auth/utils/auth-debug.ts`
- `src/core/auth/utils/auth-tenant-context.ts`
- `src/features/auth/services/auth.service.ts`
- `src/shared/context/AuthContext.tsx` (logs bootstrap)
- `vite.config.ts` (proxy headers)
