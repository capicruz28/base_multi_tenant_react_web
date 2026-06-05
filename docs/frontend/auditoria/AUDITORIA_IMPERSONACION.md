# Auditoría — Impersonación (Punto 5)

**Fecha:** mayo 2026  
**Alcance:** Fase 1 — solo auditoría estática (sin cambios de código de aplicación).  
**Referencias:** `contexto-refactorizacion.mdc`, Puntos 1–4 (JWT, shells, sidebar).

**Metodología:** búsqueda en repo frontend (`src/`, `docs/`), contrato OpenAPI (`docs/backend_openapi.json`), documentación de referencia backend (`src/reference_backend/`), esquemas SQL en `src/docs/database/`. No se dispone del código fuente FastAPI en este workspace; el backend se infiere de OpenAPI + snapshots de referencia.

---

## Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe impersonación implementada? | **No** — ni UI, ni servicios, ni endpoints dedicados |
| ¿Hay tokens o JWT de “act-as”? | **No** en contratos visibles; login estándar por credenciales del usuario |
| ¿Qué hay parecido? | Gestión de **sesiones** (listar/revocar), auditoría de **auth**, SSO, separación **platform_admin / tenant_admin / operativo** |
| ¿Riesgo si se implementara mal? | **Alto** en multi-tenant (fuga cross-tenant, auditoría, menú/permisos incorrectos) |
| Recomendación global | **Diferir implementación** hasta diseño backend + requisitos; no añadir atajos en frontend |

---

## 1. ¿Existe algo de impersonación?

### 1.1 Términos buscados (sin hallazgos funcionales)

En todo el repositorio (código + docs), sin coincidencias relevantes para:

`impersonate`, `impersonation`, `suplantar`, `act-as`, `act_as`, `switch user`, `login as`, `masquerade`, `sudo`, `on-behalf`, `delegated session`, `original_user`, `acting_user`, `real_user`.

### 1.2 Conclusión

**No hay feature de impersonación** en el frontend actual. Tampoco aparece en:

- `docs/backend_openapi.json` (paths ni descripciones)
- `src/reference_backend/endpoints.md` / `services.md` / `schemas.md`
- Comentarios de eventos en `auth_audit_log` (`MULTITENANT_SCHEMA.sql`)

---

## 2. Inventario por capa

### 2.1 Frontend — autenticación y tokens

| Archivo / área | Rol | Relación con impersonación |
|----------------|-----|---------------------------|
| `src/features/auth/services/auth.service.ts` | `POST /auth/login/` solo `username` + `password`; tenant por **Host/subdominio** | Login del usuario real; sin parámetro “target user” |
| `src/shared/context/AuthContext.tsx` | Token en memoria; bootstrap `/auth/me`, menú `/auth/menu` | Un solo `auth.user` por sesión; sin flag “modo impersonación” |
| `src/core/utils/secureStorage.ts` | Comentarios: tokens preferentemente en memoria | Sin almacenamiento de “token original” / “token suplente” |
| `src/core/api/axios-instances.ts` | Header fijo `X-Client-Type: web` | Sin headers `X-Impersonate-*`, `X-Acting-User`, etc. |
| `src/features/auth/types/auth.types.ts` | `UserType`: `platform_admin` \| `tenant_admin` \| `user` | Tipos de rol, no modo suplantación |

**JWT en frontend:** el access token **no se decodifica** en cliente para claims (`empresa_id`, impersonación, etc.). Los TODOs en guards solo mencionan validar `empresa_id` / `empresa_selection_pending` en el futuro — no impersonación.

### 2.2 Frontend — rutas y guards (aislamiento, no suplantación)

| Mecanismo | Comportamiento | Nota |
|-----------|----------------|------|
| `ProtectedRoute.requireOperationalUser` en `/app/*` | Bloquea `platform_admin` y `tenant_admin` del ERP | Evita que un admin “entre” al shell operativo con su propia sesión |
| `ProtectedRoute.requireSuperAdmin` en `/super-admin/*` | Solo `platform_admin` | Panel CAXIS separado |
| `PermissionGuard` | `can(module, action)` desde permisos de `/auth/menu` | Sin bypass por impersonación |

Esto **no sustituye** impersonación: un super admin **no puede** operar el ERP como otro usuario sin un token emitido para ese usuario.

### 2.3 Frontend — Super Admin / Admin (gestión de usuarios y sesiones)

| UI | Servicio | Endpoints (OpenAPI) | ¿Impersona? |
|----|----------|---------------------|-------------|
| `ClientUsersTab` (`ClientDetailPage`) | `superadminUsuarioService` | `GET .../superadmin/usuarios/clientes/{cliente_id}/usuarios/`, `.../actividad/`, `.../sesiones/` | **No** — solo lectura de listado, actividad y sesiones |
| `ActiveSessionsPage` (admin tenant) | `session.service.ts` | `GET /auth/sessions/admin/`, `POST /auth/sessions/{token_id}/revoke_admin/` | **No** — revocación de sesiones ajenas, no asumir identidad |
| `UserManagementPage` | CRUD usuarios tenant | Rutas admin estándar | Gestión de cuentas, no login como usuario |
| `ClientAuditTab` | `superadminAuditoriaService` | `GET /superadmin/auditoria/autenticacion/` | Auditoría de eventos auth; sin evento `impersonation_*` en esquema SQL |

No hay botones del tipo «Entrar como», «Suplantar», «Ver como usuario» en componentes revisados.

### 2.4 Frontend — SSO (autenticación alternativa, no impersonación)

OpenAPI incluye:

- `POST /api/v1/auth/sso/azure/`
- `POST /api/v1/auth/sso/google/`

Flujo de identidad federada del **mismo usuario**, no suplantación administrativa.

### 2.5 Backend (contrato y referencia en repo)

#### Endpoints de autenticación relevantes

| Endpoint | Propósito |
|----------|-----------|
| `POST /api/v1/auth/login/` | Login con credenciales en contexto de **un cliente** (tenant) |
| `POST /api/v1/auth/refresh/` | Renovar access token |
| `POST /api/v1/auth/logout/`, `POST /api/v1/auth/logout_all/` | Cerrar sesión(es) |
| `GET /api/v1/auth/me/` | Perfil del usuario del token |
| `GET /api/v1/auth/menu` | Menú + permisos efectivos del usuario del token |
| `GET /api/v1/auth/permissions/me` | Códigos string de permisos (Wave 3A) |
| `GET /api/v1/auth/sessions/` | Sesiones del usuario actual |
| `GET /api/v1/auth/sessions/admin/` | Todas las sesiones activas (admin) |
| `POST /api/v1/auth/sessions/{token_id}/revoke_admin/` | Revocar sesión por ID |

**Ausentes:** `/auth/impersonate`, `/auth/impersonate/stop`, `/auth/token/exchange`, `/superadmin/usuarios/{id}/impersonate`, etc.

#### Superadmin usuarios (referencia `endpoints.md`)

- Listado global / por cliente, detalle, actividad, sesiones.
- Protegido con `@require_super_admin()` (nivel 5).
- **Sin** endpoint para emitir token del usuario objetivo.

#### JWT / claims (Punto 1 — contexto refactorización)

Documentado en `contexto-refactorizacion.mdc` (implementado en backend, consumido indirectamente):

- `empresa_id`, `es_admin_cliente` en JWT
- `refresh_tokens` con `empresa_id`
- Roles/permisos filtrados por empresa

**No** se documenta en este repo ningún claim tipo `impersonated_by`, `acting_user_id`, `impersonation_session_id`.

#### Auditoría (`auth_audit_log`)

Eventos documentados en `MULTITENANT_SCHEMA.sql`: login/logout, tokens, password, cuenta, 2FA, `suspicious_activity` — **ninguno** de impersonación. Si se implementara, habría que **extender** el catálogo de `evento` y la UI de `ClientAuditTab`.

### 2.6 Documentación de producto

| Documento | Mención impersonación |
|-----------|------------------------|
| `docs/SIDEBAR_ENDPOINTS_MENU.md` | No |
| `docs/multi-tenancy-best-practices.md` | Cambio de **tenant** (cliente), no de usuario |
| `docs/prompts/*` | No |
| `.cursorrules` | No |

Punto 5 en auditorías previas solo figura como **pendiente** (`AUDITORIA_RUTAS_LAYOUTS`, `AUDITORIA_SIDEBAR_CONTEXTO`).

---

## 3. Capacidades relacionadas (no son impersonación)

| Capacidad | Qué hace | Por qué no es impersonación |
|-----------|----------|------------------------------|
| Panel `/super-admin/*` | Gestión clientes, módulos, usuarios cross-tenant | El actor sigue siendo `platform_admin`; no recibe token del usuario final |
| Panel `/admin/*` | Usuarios, roles, menús del tenant | Actor `tenant_admin` |
| Revocar sesiones | Corta refresh tokens de otro usuario | Seguridad; no inicia sesión como él |
| Ver sesiones/actividad de usuario | Telemetría en `ClientUsersTab` | Solo lectura |
| SSO Azure/Google | Login del usuario con IdP | Misma identidad |
| `TenantContext` / cambio de tenant | Aislamiento de stores y queries por `cliente_id` | Cambio de contexto de **cliente**, no suplantar **usuario** dentro del tenant |
| Bloqueo `/app/*` para admins | Router | Impide confundir panel admin con ERP; no habilita “ver ERP como Juan” |

---

## 4. Riesgos de seguridad (si se implementara)

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| Cross-tenant | 🔴 | Token del usuario B generado desde sesión de admin del tenant A |
| Menú/permisos incorrectos | 🔴 | `/auth/menu` del suplantado vs expectativa del soporte; `PermissionGuard` desalineado |
| Auditoría insuficiente | 🔴 | Sin trazabilidad `quién → a quién → cuándo → IP` |
| No revocación clara | 🟡 | Sesión impersonada vs sesión real; `logout` ambiguo |
| Confusión UX | 🟡 | Banner “Estás viendo como X” mal implementado → acciones irreversibles |
| `empresa_id` en JWT | 🟡 | Operar ERP suplantado sin empresa activa coherente (Punto 1 pendiente en UI) |
| Evidencia legal / compliance | 🔴 | ERP y datos personales requieren justificación y retención de logs |
| Escalada desde tenant_admin | 🟡 | ¿Quién puede impersonar? Solo `platform_admin` vs también `tenant_admin` |

**Riesgo actual (sin feature):** bajo para impersonación técnica; medio por **procedimientos manuales** (compartir credenciales, pantalla compartida) si soporte lo hace fuera del sistema.

---

## 5. Gaps vs arquitectura multi-tenant

| Gap | Estado actual | Necesario para impersonación segura |
|-----|---------------|-------------------------------------|
| Token con doble identidad | No existe | Claims `sub` (sujeto) + `act` / `impersonator_id` + TTL corto |
| Endpoint dedicado + autorización | No existe | Solo roles permitidos; motivo obligatorio; scope por `cliente_id` |
| Menú/permisos | Un usuario por token | Backend debe armar menú del **sujeto**, no del admin |
| Shells `/app` \| `/admin` \| `/super-admin` | Admins bloqueados en `/app/*` | Decisión de producto: impersonación solo en `/app/*` con banner y salida explícita |
| `empresa_id` operativo | JWT con empresa; UI selector pendiente | Impersonación debe fijar empresa válida del suplantado |
| Auditoría | `auth_audit_log` sin eventos | `impersonation_start`, `impersonation_end`, fallos |
| Frontend state | Un `AuthContext` | Modo impersonación: guardar token admin, UI “Salir de suplantación”, no mezclar pestañas |
| OpenAPI / tipos | Sin contrato | Evitar hacks (`login` con password del usuario) |

---

## 6. Tabla de diagnóstico y recomendaciones

| ID | Hallazgo | Sev. | Recomendación |
|----|----------|------|----------------|
| I1 | Cero implementación de impersonación en FE/BE (contrato) | 🟢 | **No implementar** en frontend hasta contrato backend |
| I2 | Gestión de sesiones y auditoría auth ya existen | 🟢 | **Mantener/mejorar** como herramientas de soporte (revocar, investigar) |
| I3 | Separación de shells impide “admin en ERP” sin suplantación | 🟢 | **Mantener**; cualquier impersonación debe ser flujo explícito en `/app` |
| I4 | Sin claims JWT de impersonación documentados | 🟡 | **Diferir** — diseñar en Punto 1/backend antes que UI |
| I5 | `auth_audit_log` sin eventos de suplantación | 🟡 | **Diferir** — extender esquema + filtros en `ClientAuditTab` con backend |
| I6 | Riesgo operativo (credenciales compartidas) | 🟡 | Proceso de soporte + sesiones; no sustituto de feature |
| I7 | Implementar impersonación solo en frontend | 🔴 | **No implementar** — inseguro e incompleto |
| I8 | Impersonación cross-tenant sin diseño | 🔴 | **No implementar** hasta reglas estrictas por `cliente_id` |
| I9 | SSO como atajo para “entrar como” | 🔴 | **No usar** SSO para suplantación administrativa |

### Orden sugerido (cuando el producto apruebe la feature)

1. **Especificación** — actores (`platform_admin` ¿tenant_admin?), alcance (solo mismo tenant), duración, auditoría, legal.
2. **Backend** — `POST /auth/impersonate` + `POST /auth/impersonate/end`, claims JWT, eventos audit, tests de aislamiento tenant.
3. **Frontend Fase 2** — banner persistente, “Salir de suplantación”, `AuthContext` con stack de sesión, entrada desde `ClientUsersTab` / admin usuarios, bloqueo de acciones críticas opcional.
4. **No** reutilizar `login` con contraseña del usuario ni copiar tokens de `refresh_tokens` desde admin.

Si el negocio **no** requiere suplantación: cerrar Punto 5 como **won’t implement** y documentar uso de sesiones + auditoría.

---

## 7. Archivos clave revisados

```
src/features/auth/services/auth.service.ts
src/shared/context/AuthContext.tsx
src/shared/components/ProtectedRoute.tsx
src/app/router/guards/PermissionGuard.tsx
src/features/admin/services/session.service.ts
src/features/admin/pages/ActiveSessionsPage.tsx
src/services/superadmin-usuario.service.ts
src/features/super-admin/clientes/components/ClientUsersTab.tsx
src/services/superadmin-auditoria.service.ts
src/features/super-admin/clientes/components/ClientAuditTab.tsx
docs/backend_openapi.json
src/reference_backend/endpoints.md (superadmin_usuarios)
src/docs/database/MULTITENANT_SCHEMA.sql (auth_audit_log)
contexto-refactorizacion.mdc (Punto 1 JWT)
```

---

*Fase 1 completada — esperar decisión de producto antes de cualquier implementación (Fase 2).*
