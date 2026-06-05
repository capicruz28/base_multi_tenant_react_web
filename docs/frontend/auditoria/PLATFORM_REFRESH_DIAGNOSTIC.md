# Diagnóstico — Refresh 401 solo en `platform_admin` (F5)

**Estado confirmado (mayo 2026)**

| Flujo | Resultado |
|-------|-----------|
| Login tenant | OK |
| Login platform | OK |
| F5 tenant → `POST /auth/refresh/` | **200** |
| F5 platform → `POST /auth/refresh/` | **401** → logout |

**Conclusión:** FE/axios/CORS OK. Bug aislado en **refresh + tenant SUPERADMIN** (`platform.app.local`).

**No depurar impersonación** hasta: platform login → F5 → refresh 200 → `/auth/me`.

---

## Matriz comparativa (capturar en DevTools + backend)

Ejecutar **dos sesiones limpias** (ventana incógnito o borrar cookies `.app.local` entre pruebas).

| # | Tenant (`acme.app.local`) | Platform (`platform.app.local`) |
|---|---------------------------|----------------------------------|
| 1 | `POST /auth/login/` → status | Igual |
| 2 | Response **Set-Cookie** `refresh_token` | ¿Presente en ambos? ¿Mismos atributos? |
| 3 | Access JSON `user_data.cliente_id` | ¿`00000000-0000-0000-0000-000000000001`? |
| 4 | JWT access `cliente_id` (decodificar payload) | ¿Coincide con SUPERADMIN? |
| 5 | F5 → `POST /auth/refresh/` Request **Cookie** | ¿Se envía `refresh_token` en platform? |
| 6 | F5 → refresh status | 200 vs **401** |
| 7 | Fila `refresh_tokens` tras login | Comparar `cliente_id`, `usuario_id` |

En consola DEV (tras login): buscar `[AuthSnapshot] post-login` — tabla con `jwtClienteMatchesSuperadmin` / `userClienteMatchesSuperadmin`.

---

## A) Cookies (evidencia en navegador)

### Login exitoso — Response headers

Inspeccionar **cada** atributo de `Set-Cookie: refresh_token=...`:

| Atributo | Tenant (anotar) | Platform (anotar) |
|----------|-----------------|-------------------|
| **Presente** | sí/no | sí/no |
| Domain | ej. `.app.local` | |
| Path | ej. `/` o `/api/v1` | |
| SameSite | Lax / None | |
| Secure | true / false | |
| HttpOnly | true | |
| Max-Age / Expires | | |

**Hipótesis A1:** Platform login **no emite** Set-Cookie (solo access en JSON) → refresh sin cookie → 401.

**Hipótesis A2:** Mismo Set-Cookie pero **Path** demasiado restrictivo y no aplica a `/api/v1/auth/refresh/`.

**Hipótesis A3:** Cookie emitida con **Domain** que no incluye `backend.app.local` en el envío cross-site (menos probable si tenant funciona con la misma API URL).

### F5 — Request `POST /auth/refresh/`

| Campo | Tenant | Platform |
|-------|--------|----------|
| Request URL | `http://backend.app.local:8000/api/v1/auth/refresh/` | Igual |
| `Origin` | `http://acme.app.local:5173` | `http://platform.app.local:5173` |
| `Cookie` header | `refresh_token=...` | **¿vacío?** |
| `X-Client-Type` | web | web |
| Response status | 200 | 401 |
| Response body `detail` | — | copiar texto exacto |

`document.cookie` **no muestra** refresh HttpOnly — solo Network.

---

## B) Validación backend del refresh

Puntos a instrumentar en código FastAPI (o equivalente):

### `POST /auth/login/` (platform)

```
[auth.login] subdomain_resolved=platform cliente_id=00000000-0000-0000-0000-000000000001
[auth.login] usuario_id=... user_type=platform_admin
[auth.login] refresh_row_created cliente_id=... token_id=...
[auth.login] set_cookie refresh_token domain=... path=... samesite=...
```

Verificar: **`refresh_tokens.cliente_id` insertado** = `00000000-0000-0000-0000-000000000001`.

### `POST /auth/refresh/` (platform F5)

```
[auth.refresh] origin=... forwarded_host=... subdomain_resolved=platform
[auth.refresh] cookie_present=true|false cookie_name=refresh_token
[auth.refresh] token_hash_lookup found=true|false
[auth.refresh] row cliente_id=... usuario_id=... is_revoked=... expires_at=...
[auth.refresh] tenant_expected_cliente_id=00000000-...
[auth.refresh] mismatch reason=...  (solo si 401)
```

**Hipótesis B1:** Cookie presente pero **hash no encontrado** (cookie de otro entorno / login no persistió fila).

**Hipótesis B2:** Fila encontrada pero **`cliente_id` fila ≠ tenant resuelto** en middleware.

**Hipótesis B3:** Regla explícita que **rechaza** `cliente_id` SUPERADMIN en refresh (bug de producto).

**Hipótesis B4:** `usuario_id` en fila no coincide con usuario platform (login creó token para otro user).

---

## C) Tenant middleware en refresh

Flujo esperado en `platform.app.local`:

```
Host/Origin → subdominio "platform" → cliente_id 00000000-0000-0000-0000-000000000001
```

Comparar con tenant:

```
"acme" → cliente_id <uuid-acme>
```

En refresh platform, loggear:

| Variable | Valor esperado |
|----------|----------------|
| `resolved_subdomain` | `platform` |
| `resolved_cliente_id` | `00000000-0000-0000-0000-000000000001` |
| `refresh_row.cliente_id` | **mismo UUID** |
| `refresh_row.usuario_id` | usuario del login platform |

**Mismatch típico:** login guarda refresh con `cliente_id` del usuario en tabla `usuario` (otro tenant) pero middleware en refresh exige SUPERADMIN.

---

## D) SQL — comparar filas `refresh_tokens`

Tras login (antes de F5), para el mismo `usuario_id` de platform_admin:

```sql
-- Último refresh del usuario platform (ajustar @usuario_id)
SELECT TOP 5
  token_id,
  cliente_id,
  usuario_id,
  client_type,
  expires_at,
  is_revoked,
  revoked_reason,
  created_at,
  last_used_at,
  uso_count
FROM refresh_tokens
WHERE usuario_id = @platform_usuario_id
ORDER BY created_at DESC;

-- Comparar con tenant operativo
SELECT TOP 5
  token_id,
  cliente_id,
  usuario_id,
  expires_at,
  is_revoked,
  created_at
FROM refresh_tokens
WHERE usuario_id = @tenant_usuario_id
ORDER BY created_at DESC;

-- Cliente SUPERADMIN
SELECT cliente_id, subdominio, razon_social
FROM cliente
WHERE subdominio = 'platform'
   OR cliente_id = '00000000-0000-0000-0000-000000000001';
```

**Esquema relevante** (`MULTITENANT_SCHEMA.sql`): `refresh_tokens(cliente_id, usuario_id, token_hash, expires_at, is_revoked, ...)`.

No hay columna `token_family` en este esquema — usar `token_id` / `token_hash` si el backend añadió familia en otra migración.

---

## E) Árbol de decisión Auth flow

```
platform login OK?
├─ NO → arreglar login
└─ SÍ
    └─ Set-Cookie en response login?
        ├─ NO → backend no emite cookie web para platform_admin (fix emisión)
        └─ SÍ
            └─ F5: Cookie en request refresh?
                ├─ NO → atributos Domain/Path/SameSite (fix cookie)
                └─ SÍ
                    └─ Backend encuentra token_hash?
                        ├─ NO → cookie inválida / otra BD / hash distinto
                        └─ SÍ
                            └─ cliente_id fila = tenant resuelto?
                                ├─ NO → mismatch middleware (fix guardar o validar)
                                └─ SÍ
                                    └─ otra regla (revoked, expired, user_type, empresa_id, ...)
```

---

## Frontend — qué hace el bootstrap (referencia)

1. `waitForEmpresaSelectionHydration()`
2. Si `sessionStorage.platform_parent_session` → restore (solo impersonación; **limpiar** al probar login puro)
3. `POST /auth/refresh/` con `withCredentials: true`, headers solo `X-Client-Type`
4. 200 → `initializeAuth()` → `GET /auth/me/`
5. 401 → `doLogout(false)` → usuario a `/login`

Mismo código para tenant y platform — **no hay rama FE distinta** en refresh.

---

## Logs backend sugeridos (plantilla Python)

```python
# middleware/tenant.py
logger.info(
    "tenant_resolve path=%s host=%s origin=%s subdomain=%s cliente_id=%s",
    request.url.path,
    request.headers.get("host"),
    request.headers.get("origin"),
    subdomain,
    str(cliente_id),
)

# auth/refresh.py
cookie_val = request.cookies.get("refresh_token")
logger.info("refresh_start cookie_present=%s origin=%s", bool(cookie_val), request.headers.get("origin"))

row = find_refresh_by_cookie(cookie_val)
if not row:
    logger.warning("refresh_fail reason=token_not_found")
    raise HTTPException(401)

logger.info(
    "refresh_token_row cliente_id=%s usuario_id=%s revoked=%s expires=%s",
    row.cliente_id, row.usuario_id, row.is_revoked, row.expires_at,
)

tenant_id = get_current_tenant_cliente_id()
if str(row.cliente_id) != str(tenant_id):
    logger.warning(
        "refresh_fail reason=cliente_mismatch row=%s tenant=%s",
        row.cliente_id, tenant_id,
    )
    raise HTTPException(401)
```

Repetir el mismo logging en **`/auth/login/`** al crear la fila y al llamar `set_cookie`.

---

## Checklist antes de cada prueba platform

1. `sessionStorage.removeItem('platform_parent_session')`
2. Borrar cookies del sitio / Application → Cookies → `.app.local` y hosts
3. Login platform → capturar Network login + `[AuthSnapshot] post-login`
4. F5 → capturar Network refresh + log bootstrap
5. Ejecutar SQL sobre `usuario_id` del snapshot

---

## Fix esperado (backend)

Cuando se identifique la causa, el fix suele ser **uno** de:

1. Persistir `refresh_tokens.cliente_id = 00000000-...` en login platform.
2. Validar refresh comparando fila con cookie **sin** exigir mismatch con Origin si el token ya trae `cliente_id`.
3. Alinear `Set-Cookie` Domain/Path entre login tenant y platform.
4. Eliminar regla que bloquea refresh para tenant sistema.

**No reactivar headers `X-Tenant-Subdomain` en FE** hasta CORS actualizado; no son necesarios si el backend resuelve por `Origin`.

---

## Impersonación

**Pausada** hasta refresh platform 200 en F5.
