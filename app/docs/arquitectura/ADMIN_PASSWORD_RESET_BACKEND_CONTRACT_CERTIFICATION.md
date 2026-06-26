# Certificación de Contrato — Reset Administrativo de Contraseña (Backend)

**Documento:** `app/docs/arquitectura/ADMIN_PASSWORD_RESET_BACKEND_CONTRACT_CERTIFICATION.md`  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — sin modificación de código, OpenAPI ni documentación preexistente  
**Auditoría Frontend previa:** `docs/arquitectura/ADMIN_PASSWORD_RESET_FRONTEND_AUDIT.md`  
**Fuentes consultadas:** `docs/backend_openapi.json`, OpenAPI en vivo `http://platform.app.local:8000/openapi.json`, `BACKEND_PLATFORM_API_CONTRACT_V2.md`, `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md`, `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md`, esquema BD `MULTITENANT_SCHEMA.sql`

---

## 1. Resumen ejecutivo

| Pregunta | Resultado certificación |
|----------|-------------------------|
| ¿Existe endpoint HTTP canónico de **reset administrativo** de contraseña? | **No** |
| ¿Está documentado en OpenAPI commitado? | **No** |
| ¿Está documentado en OpenAPI del Backend en ejecución? | **No** (verificado en vivo) |
| ¿Puede el Frontend implementar reset admin solo con contratos actuales? | **No** |
| ¿Existe infraestructura de dominio relacionada? | **Sí** — `requiere_cambio_contrasena`, `CredencialesInicialesRead`, `POST /usuarios/` con `contrasena` |

**Conclusión:** No es posible certificar un contrato HTTP de **reset administrativo de contraseña** porque **no existe** en las fuentes contractuales del repositorio ni en el OpenAPI publicado por el Backend en ejecución (511 paths, 2026-06-24).

Lo único certificable hoy son contratos **adyacentes**:

- Creación de usuario con contraseña inicial (`POST /api/v1/usuarios/`)
- Provisionamiento super-admin con credenciales temporales (`POST /api/v1/clientes/`)
- Cambio de contraseña del usuario autenticado (`POST /api/v1/auth/password/change/`)

El flujo force-password del **usuario afectado** tras un reset hipotético **sí** está soportado por contratos auth existentes (`requires_password_change` / `requiere_cambio_contrasena`).

---

## 2. Endpoint certificado

### 2.1 Reset administrativo — **NO CERTIFICABLE**

| Campo | Valor |
|-------|-------|
| **Método HTTP** | — |
| **Ruta exacta** | — |
| **Estado** | **Ausente** en contrato |

**Búsqueda realizada (sin resultado):**

| Patrón | `docs/backend_openapi.json` | OpenAPI vivo `:8000` |
|--------|----------------------------|----------------------|
| `reset-password`, `reset_password`, `reset-contrasena` | No | No |
| `/usuarios/{id}/...` con password/reset/restablecer | No | No |
| Schemas `*Reset*Password*`, `AdminPassword*` | No | No |
| `operationId` / `summary` con restablecer/reset admin | No | No |

Paths `/usuarios/` en OpenAPI vivo (2026-06-24):

```
GET|POST  /api/v1/usuarios/
GET|PUT|DELETE  /api/v1/usuarios/{usuario_id}/
POST  /api/v1/usuarios/{usuario_id}/reactivate/
POST|DELETE  /api/v1/usuarios/{usuario_id}/roles/{rol_id}/
GET  /api/v1/usuarios/{usuario_id}/roles/
```

**Ninguno** corresponde a reset administrativo de contraseña.

### 2.2 Endpoints adyacentes certificados (no sustitutos)

| Endpoint | Rol | ¿Sustituye reset admin? |
|----------|-----|-------------------------|
| `POST /api/v1/usuarios/` | Contraseña solo en **creación** | No |
| `PUT /api/v1/usuarios/{usuario_id}/` | `UsuarioUpdate` **sin** `contrasena` | No |
| `POST /api/v1/clientes/` | Credenciales admin inicial tenant (super-admin) | No (otro actor, otro flujo) |
| `POST /api/v1/auth/password/change/` | Usuario autenticado cambia **su** contraseña | No (self-service) |

---

## 3. Request

### 3.1 Reset administrativo

**No certificable** — sin endpoint.

Atributos **indeterminados** hasta publicación de contrato:

| Atributo | Estado |
|----------|--------|
| Body completo | ❓ No definido |
| Headers (`Authorization`, `X-Client-Type`) | ❓ No definido |
| JWT requerido | ❓ No definido |
| Permisos (`admin.usuario.*`) | ❓ No definido |
| Scopes / tenant isolation | ❓ No definido |

### 3.2 Referencia — `POST /api/v1/usuarios/` (creación, no reset)

**OpenAPI vivo — solo contexto:**

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Ruta | `/api/v1/usuarios/` |
| Auth | JWT + rol Administrador |
| Body | `UsuarioCreate` — `contrasena` **requerida** |
| Headers | `Authorization: Bearer`, `X-Client-Type` (convención plataforma) |

**Nota:** Establece contraseña inicial al crear; no modifica usuario existente ni devuelve contraseña en respuesta 201 (`UsuarioReadWithRoles`).

### 3.3 Referencia — `CredencialesInicialesRead` (provisionamiento, no reset admin)

Usado en `POST /api/v1/clientes/` — patrón de **contraseña en texto plano una sola vez**:

```json
{
  "nombre_usuario": "admin",
  "contrasena": "<string plaintext>",
  "requiere_cambio": true
}
```

No aplica a tenant admin sobre usuario existente en Gestión de Usuarios.

---

## 4. Response

### 4.1 Reset administrativo

**No certificable.**

Preguntas del alcance — **sin respuesta contractual hoy:**

| Pregunta | Estado |
|----------|--------|
| ¿Devuelve contraseña temporal? | ❓ |
| ¿Devuelve mensaje? | ❓ |
| ¿Devuelve usuario? | ❓ |
| ¿Devuelve `requires_password_change`? | ❓ |
| ¿Devuelve `logout_sessions` / conteo sesiones revocadas? | ❓ |
| ¿Devuelve metadata adicional? | ❓ |

### 4.2 Campos de lectura ya certificados en `UsuarioReadWithRoles`

Disponibles en `GET /usuarios/{id}/` y listados — **post-facto**, no como respuesta de reset:

| Campo OpenAPI | Tipo | Relevancia force-password |
|---------------|------|---------------------------|
| `requiere_cambio_contrasena` | `boolean` | Flag BD → JWT `requires_password_change` en login |
| `proveedor_autenticacion` | `string` | `local` vs SSO — guard reset |
| `fecha_ultimo_cambio_contrasena` | `datetime` | Informativo |
| `es_activo` | `boolean` | Usuario inactivo no debe resetearse |

---

## 5. Flujo Backend

### 5.1 Reset administrativo

**No certificable** — sin servicio/endpoint documentado.

### 5.2 Comportamiento esperado (inferido solo de dominio — NO contractual)

Evidencia **no normativa** (esquema BD + auditoría FE), **no sustituye** contrato HTTP:

| Comportamiento | Evidencia en repo | Certificado HTTP |
|----------------|-------------------|------------------|
| Genera contraseña temporal automáticamente | No documentado | ❌ |
| Recibe contraseña desde cliente | No documentado | ❌ |
| Marca `requiere_cambio_contrasena=true` | BD `MULTITENANT_SCHEMA.sql` L238-240 | ❌ (sin endpoint) |
| Revoca refresh tokens del usuario target | Patrón `POST /auth/password/change/` | ❌ (no aplicable a admin reset) |
| Mantiene access token del **operador** admin | N/A | ❌ |
| Fuerza change password en siguiente login del target | `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md` + campo BD | ✅ (downstream, si flag=true) |

### 5.3 Flujo certificado downstream — usuario afectado

Si un proceso (hipotético reset admin o create user) deja `requiere_cambio_contrasena=true`:

```
Login target → user_data.requires_password_change=true
  → JWT claim requires_password_change
  → POST /auth/password/change/ (whitelist con flag activo)
  → requiere_cambio_contrasena=false + nuevos tokens
```

Certificado en `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` §4 y OpenAPI vivo `POST /api/v1/auth/password/change/`.

---

## 6. Seguridad

### 6.1 Reset administrativo

| Control | Estado |
|---------|--------|
| Autenticación JWT operador | ❓ No definido |
| Aislamiento tenant (`cliente_id` JWT) | ❓ No definido |
| Revocación sesiones del **target** | ❓ No definido |
| Contraseña plaintext solo en respuesta única | Patrón existente en `CredencialesInicialesRead` (referencia, no reset) |
| Auditoría (`password_reset`, `password_change`) | Tipos en BD audit log; sin endpoint admin reset |

### 6.2 `POST /auth/password/change/` (self-service — certificado)

| Control | Valor certificado |
|---------|-------------------|
| JWT Bearer obligatorio | Sí |
| Whitelist con `requires_password_change=true` | Sí |
| Revoca refresh tokens previos del usuario | Sí |
| Blacklist access `jti` actual | Sí |
| Solo `proveedor_autenticacion = local` | Sí (400 SSO) |

---

## 7. Permisos

### 7.1 Reset administrativo

**No certificable.**

### 7.2 Permisos usuarios IAM certificados (`BACKEND_PLATFORM_API_CONTRACT_V2.md`)

| Operación | Permiso documentado |
|-----------|---------------------|
| `GET /usuarios/` | `admin.usuario.leer` + rol Administrador |
| `POST /usuarios/{id}/reactivate/` | `admin.usuario.actualizar` + rol Administrador |
| `POST /usuarios/` (create) | Rol Administrador (OpenAPI vivo) |

**No existe** `admin.usuario.reset_password` ni equivalente en contratos del repo.

### 7.3 Actores

| Actor | Reset admin certificado |
|-------|-------------------------|
| Tenant Admin (`/admin/usuarios`) | ❌ |
| Super Admin plataforma | ❌ (solo lectura usuarios globales) |
| Platform Admin | ❌ |
| Usuario final (self) | Solo `POST /auth/password/change/` |

---

## 8. Casos borde

Sin endpoint admin reset, los casos borde **no tienen respuesta HTTP certificada**. Comportamiento esperado **solo inferible** donde hay contrato relacionado:

| Caso | Contrato actual | Reset admin |
|------|-----------------|-------------|
| Usuario SSO (`proveedor_autenticacion != local`) | `POST /auth/password/change/` → 400 | ❓ No definido |
| Usuario inactivo (`es_activo=false`) | Login/refresh rechazados | ❓ No definido |
| Usuario eliminado (`es_eliminado=true`) | Excluido de listado; reactivate disponible | ❓ No definido |
| Super Admin plataforma | Excluido force-password self | ❓ No definido |
| Tenant Admin operador | Acceso panel `/admin/*` por `user_type` | ❓ Sin acción reset |
| Platform Admin | Sin endpoint reset en OpenAPI | ❌ |
| Cross-tenant (usuario otro `cliente_id`) | `PUT /usuarios/` → 403 documentado | ❓ No definido |

---

## 9. Errores

### 9.1 Reset administrativo

**No certificable** — tabla HTTP vacía.

| Código | Documentado para reset admin |
|--------|------------------------------|
| 400 | ❌ |
| 401 | ❌ |
| 403 | ❌ |
| 404 | ❌ |
| 409 | ❌ |
| 422 | ❌ |
| 500 | ❌ |

### 9.2 Referencia — `POST /auth/password/change/` (certificado)

Ver `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` §4.4–4.5: 200, 400, 401, 403, 404, 422, 500 con mensajes `detail` documentados.

OpenAPI vivo lista explícitamente respuestas `200`, `422` en schema; códigos 4xx/5xx adicionales documentados en certificación auth.

### 9.3 Referencia — `POST /usuarios/` create

OpenAPI vivo: 201, 409, 422, 500.

---

## 10. Compatibilidad con el flujo actual de Force Password

| Aspecto | Compatibilidad | Fuente |
|---------|----------------|--------|
| Campo BD `requiere_cambio_contrasena` | ✅ Modelo soporta passwords temporales / post-reset | `MULTITENANT_SCHEMA.sql` |
| Claim JWT `requires_password_change` | ✅ Propagado en login/refresh | `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md` |
| Redirect FE `/change-password` | ✅ Implementado | Auditoría auth |
| `POST /auth/password/change/` con flag activo | ✅ Whitelist certificada | OpenAPI vivo + AUTH cert |
| SSO excluido | ✅ 400 en change self-service | AUTH cert §4.5 |
| **Reset admin que active el flag** | ⚠️ **Depende de endpoint inexistente** | Sin contrato |

**Conclusión:** El pipeline force-password del **usuario afectado** está listo. Falta el contrato HTTP que, desde Gestión de Usuarios, establezca hash temporal + `requiere_cambio_contrasena=true` (y opcionalmente revoque sesiones del target).

---

## 11. Estado del OpenAPI

| Verificación | `docs/backend_openapi.json` | OpenAPI vivo `:8000` | Dictamen |
|--------------|----------------------------|----------------------|----------|
| Endpoint reset admin | ❌ No existe | ❌ No existe | **Ausente** |
| `POST /auth/password/change/` | ❌ Ausente | ✅ Presente | **Desactualizado** en repo |
| `POST /usuarios/{id}/reactivate/` | ❌ Ausente | ✅ Presente | **Desactualizado** en repo |
| `CredencialesInicialesRead` | ✅ Presente | ✅ Presente | Alineado |
| `requiere_cambio_contrasena` en `UsuarioReadWithRoles` | ✅ Presente | ✅ Presente | Alineado |

**Observaciones:**

1. El snapshot commitado `docs/backend_openapi.json` (503 paths) está **desfasado** respecto al Backend en ejecución (511 paths).
2. El desfase **no explica** la ausencia de reset admin: el endpoint tampoco existe en el OpenAPI vivo.
3. `allow_password_reset` en `AuthConfigRead` describe **recuperación por email**, no reset administrativo desde Gestión de Usuarios.

---

## 12. Dictamen

### Evaluación de opciones

| Opción | Aplica | Justificación |
|--------|--------|---------------|
| **A) Contrato listo para Frontend** | **No** | No hay endpoint HTTP certificable para reset administrativo. |
| **B) Requiere actualización OpenAPI** | **Parcial** | El repo está desactualizado (auth password change, reactivate), pero **actualizar OpenAPI no expone** un endpoint que hoy no existe en el Backend vivo. |
| **C) Requiere cambios Backend** | **Sí** | El contrato HTTP de reset administrativo **no está publicado ni implementado** en la API expuesta (verificación en vivo 2026-06-24). |

# **C) Requiere cambios Backend**

Antes de implementación Frontend se requiere como mínimo:

1. **Publicar** endpoint canónico (método + ruta + schemas request/response + errores + permisos).
2. **Actualizar** `docs/backend_openapi.json` en el repositorio.
3. **Certificar** explícitamente: generación vs recepción de contraseña, flag `requiere_cambio_contrasena`, revocación de sesiones del target, restricción SSO, y respuesta one-time plaintext (si aplica).

Hasta entonces, la única vía contractual para asignar contraseña a un usuario desde admin es **`POST /usuarios/`** (usuario nuevo) — no equivalente a reset sobre usuario existente.

---

*Certificación READ ONLY — ADMIN_PASSWORD_RESET_BACKEND_CONTRACT — 2026-06-24.*
