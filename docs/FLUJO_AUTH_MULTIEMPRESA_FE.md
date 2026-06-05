# Flujo auth multi-empresa (contrato FE)

## Pasos

| Paso | Método | Path | Cuándo |
|------|--------|------|--------|
| Login | POST | `/api/v1/auth/login/` | Siempre |
| Selección | POST | `/api/v1/auth/empresa/seleccionar/` | Tras `requiere_seleccion_empresa` |
| Cambio | POST | `/api/v1/auth/empresa/cambiar/` | Usuario operativo con sesión |
| Perfil | GET | `/api/v1/auth/me/` | Bootstrap (incluye `empresa_activa`) |
| Permisos | GET | `/api/v1/auth/permissions/me` | Tras sesión con `empresa_id` |
| Menú | GET | `/api/v1/auth/menu` | Tras sesión con `empresa_id` |

JWT tras sesión completa: `empresa_id` presente salvo admin sin empresa (onboarding); nunca `empresa_selection_pending`.

OpenAPI en vivo: `GET /openapi.json` (incluye schemas `LoginEmpresaSelectionResponse`, `EmpresaIdRequest`, `Token`).

## Impersonación (platform_admin)

| Paso | Método | Path |
|------|--------|------|
| Iniciar | POST | `/api/v1/auth/impersonate/{cliente_id}/` |
| Finalizar | POST | `/api/v1/auth/impersonate/end/` |

- Respuesta idéntica a login (Schema A o B). Sin refresh token; TTL ~2h.
- Claims JWT: `is_impersonation`, `impersonated_by`, `impersonated_by_username` (persisten tras seleccionar empresa).
- FE guarda sesión plataforma en `sessionStorage` (`platform_parent_session`) antes de impersonar.

## POST seleccionar

```http
POST /api/v1/auth/empresa/seleccionar/
Authorization: Bearer <selection_token>
Content-Type: application/json
X-Client-Type: web

{"empresa_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}
```

**200 (web):**

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_data": {
    "nombre_usuario": "jperez",
    "empresa_activa": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "es_admin_cliente": false,
    "requiere_seleccion_empresa": false,
    "roles": ["Usuario"]
  }
}
```

Refresh en cookie HttpOnly (mismo nombre que login). **409** si el Bearer no es selection token.

## POST cambiar

```http
POST /api/v1/auth/empresa/cambiar/
Authorization: Bearer <access_token_sesion>
Content-Type: application/json
X-Client-Type: mobile

{
  "empresa_id": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
  "refresh_token": "<refresh_actual>"
}
```

**200:** mismo shape que seleccionar; nuevo access + refresh (JSON en mobile).

**400:** empresa no asignada. **403:** empresa de otro tenant/inactiva. **409:** token con `empresa_selection_pending`.

## GET /me

Con sesión completa añade `empresa_activa`, `es_admin_cliente`, `requiere_seleccion_empresa: false`.
Con selection token: perfil mínimo y `requiere_seleccion_empresa: true` (sin menú/permisos ERP).

## Breaking changes

Ninguno en login/refresh existentes. Nuevos campos opcionales en `UserDataWithRoles` (`requiere_seleccion_empresa`). Menú y permisos devuelven **409** si se llaman con selection token.
