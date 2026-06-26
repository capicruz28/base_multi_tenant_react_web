# ACCOUNT_CENTER_V1 — Especificación Funcional

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_SPEC.md`  
**Épica:** `ACCOUNT_CENTER_V1`  
**Versión:** 1.0  
**Fecha:** 2026-06-24  
**Tipo:** Especificación funcional (contrato de épica)  
**Modo:** READ ONLY al crear — sin implementación

**Precedencia documental:**

| Prioridad | Documento | Relación |
|-----------|-----------|----------|
| 1 | `ERP_FRONTEND_STANDARDS_V2.md` | Norma UX/plataforma ERP |
| 2 | `.cursorrules` | Recordatorios operativos |
| 3 | **`ACCOUNT_CENTER_V1_SPEC.md`** | **Contrato funcional de esta épica** |
| 4 | `docs/arquitectura/ACCOUNT_CENTER_V1_AUDIT.md` | Evidencia estado actual (referencia) |
| 5 | `docs/arquitectura/FRONTEND_AUTH_AUDIT.md` | Contratos auth reutilizables |
| 6 | `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` | Endpoints auth certificados |

Este documento **no reemplaza** V2, `.cursorrules` ni `PROMPT_FRONTEND_MAESTRO.md`.

---

## 1. Objetivo funcional

### 1.1 Qué es Account Center

**Mi Cuenta** (nombre oficial de producto — ver §2) es el **módulo self-service del usuario autenticado** dentro del panel ERP (`/app/*`). Centraliza en un único hub las capacidades que el usuario puede gestionar sobre **sí mismo**: identidad visible, seguridad de acceso, dispositivos con sesión activa y preferencias de interfaz local.

Es un **centro de gestión personal**, no un módulo administrativo ni transaccional de negocio.

### 1.2 Problema que resuelve

| Problema actual | Resolución V1 |
|-----------------|---------------|
| Placeholders en menú avatar («Mi perfil», «Bandeja», «Configuraciones») sin acción | Entrada única funcional «Mi cuenta» |
| Capacidades dispersas (sesiones, password, tema) sin contexto | Hub con secciones definidas |
| `/app/cuenta/sesiones` huérfana, sin navegación padre | Integrada bajo Mi Cuenta |
| Sin pantalla de información personal | Sección read-only consolidada |
| Cambio de contraseña solo en flujo obligatorio | Sección Seguridad con cambio voluntario |

### 1.3 Funcionalidades que centraliza (V1)

1. **Información personal** — consulta de datos de identidad (solo lectura).
2. **Seguridad** — cambio voluntario de contraseña; cierre de sesión en todos los dispositivos.
3. **Sesiones** — listado y revocación de sesiones propias (reutilización de `MySessionsPage`).
4. **Preferencias** — tema visual y modo de navegación del shell ERP.

### 1.4 Funcionalidades que NO pertenecen al módulo

Quedan **fuera del dominio** Mi Cuenta por diseño:

| Capacidad | Ubicación canónica | Motivo |
|-----------|-------------------|--------|
| Cerrar sesión (dispositivo actual) | Header global | Acción frecuente; atajo global |
| Cambio de empresa operativa | Header — `EmpresaSelector` | Contexto JWT multiempresa (V2 ME-01) |
| Cambio de contraseña **obligatorio** | `/change-password` (auth, sin layout ERP) | Flujo de enforcement previo al ERP |
| Login / refresh / bootstrap | Auth pipeline | Pre-autenticación |
| Gestión de usuarios del tenant | `/admin/usuarios` | Admin IAM |
| Gestión de perfiles/roles IAM | `/admin/roles` | Admin IAM — «perfil» en sentido RBAC |
| Sesiones activas del tenant (admin) | `/admin/sesiones` | Operación IAM sobre terceros |
| Configuración de empresa / ORG | Módulo ORG | Catálogo transaccional |
| Branding del tenant | Runtime tenant API | Capa 2 — no preferencia usuario |
| Impersonación / modo soporte | Banner + AuthContext | Flujo especial plataforma |

---

## 2. Naming oficial

### 2.1 Opciones evaluadas

| Nombre | Uso típico ERP | Pros | Contras |
|--------|----------------|------|---------|
| **Mi Perfil** | RRHH, datos personales editables | Familiar | Colisión con **perfiles IAM** (roles) ya usados en admin; implica edición que V1 no ofrece |
| **Mi Cuenta** | Microsoft 365, Google Workspace, SAP Fiori «User Settings» | Denota identidad + seguridad + preferencias; estándar self-service | Menos específico para datos RRHH |
| **Centro de Cuenta** | Portales enterprise formales | Descriptivo, escalable | Verboso en menú; menos habitual en dropdown avatar |

### 2.2 Decisión oficial

| Elemento | Valor oficial |
|----------|---------------|
| **Nombre de producto (UI)** | **Mi Cuenta** |
| **Identificador épica / código** | `ACCOUNT_CENTER_V1` |
| **Prefijo rutas** | `/app/cuenta` |
| **Entrada Header** | «Mi cuenta» |

### 2.3 Justificación

1. **Desambiguación IAM:** En CAXIS ERP, «perfil» está sobrecargado (`RoleManagementPage`, «Perfiles asignados», permisos de perfil). «Mi cuenta» evita confundir self-service con RBAC admin.
2. **Expectativa enterprise:** Productos B2B (Dynamics, Salesforce, Zoho) usan «Account» / «Mi cuenta» para password, sesiones y preferencias — no «Profile» para seguridad.
3. **Honestidad funcional V1:** V1 es mayormente **consulta + seguridad**; «Mi perfil» promete edición de datos personales inexistente en V1.
4. **Escalabilidad:** «Mi cuenta» admite futuras secciones (notificaciones, API keys) sin rename; «Centro de cuenta» queda reservado para copy secundario o breadcrumb («Inicio → Mi cuenta → Seguridad»).

### 2.4 Nomenclatura de secciones (UI)

| Sección | Label UI | No usar |
|---------|----------|---------|
| Información personal | «Información personal» | «Mi perfil» |
| Seguridad | «Seguridad» | «Contraseña» (solo) |
| Sesiones | «Sesiones» | «Mis sesiones activas» (en nav interna; atajo Header puede decir «Mis sesiones») |
| Preferencias | «Preferencias» | «Configuraciones de la cuenta» |

---

## 3. Alcance V1

### 3.1 In scope — obligatorio V1

| ID | Sección | Entregable funcional |
|----|---------|---------------------|
| AC-01 | Hub Mi Cuenta | Layout con navegación interna desktop-first; acceso desde Header |
| AC-02 | Información personal | Vista read-only de campos definidos en §5 |
| AC-03 | Seguridad | Cambio voluntario de contraseña; acción logout all con confirmación |
| AC-04 | Sesiones | Reutilización integral de `MySessionsPage` bajo hub |
| AC-05 | Preferencias | Tema (claro/oscuro/sistema); modo navegación (sidebar/navbar) |
| AC-06 | Header | Rewire según §9; eliminación de placeholders |
| AC-07 | Rutas | Árbol definido en §10 |
| AC-08 | Guards | Usuario autenticado operativo; force-password redirige fuera del hub |

### 3.2 In scope — condicional V1

| ID | Condición | Comportamiento |
|----|-----------|----------------|
| AC-C1 | Usuario SSO (sin cambio password local) | Ocultar bloque cambio contraseña en Seguridad cuando BE indique proveedor ≠ local *(depende campo en `/auth/me` — ver §5.4)* |
| AC-C2 | Tenant admin con acceso `/admin/sesiones` | Enlace informativo opcional en Sesiones hacia administración IAM — no embebido |
| AC-C3 | `requiresPasswordChange === true` | Usuario **no accede** a Mi Cuenta; permanece en `/change-password` hasta completar |

### 3.3 Out of scope — explícito V1

Ver §12 completo. Resumen: edición perfil, avatar, MFA, API keys, notificaciones, bandeja, firma, preferencias servidor, idioma, logout simple en hub, selector empresa, admin sesiones embebido.

---

## 4. Arquitectura funcional

### 4.1 Modelo conceptual

```
Mi Cuenta (/app/cuenta)
│
├── Información personal    → Identidad visible del usuario en el tenant
├── Seguridad               → Credenciales y alcance de cierre de sesión
├── Sesiones                → Dispositivos/browser con sesión propia activa
└── Preferencias            → Apariencia y layout local del shell ERP
```

### 4.2 Responsabilidades por sección

#### 4.2.1 Información personal

- **Propósito:** Permitir al usuario **consultar** quién es en el contexto del tenant autenticado.
- **Actor:** Usuario operativo autenticado (cualquier `user_type` con acceso `/app/*`).
- **Operaciones:** Solo lectura V1.
- **Fuente de verdad:** Sesión JWT + `GET /auth/me/` (via AuthContext bootstrap).

#### 4.2.2 Seguridad

- **Propósito:** Gestionar credenciales y postura de sesiones globales del propio usuario.
- **Operaciones V1:**
  - Cambiar contraseña (voluntario, usuarios locales).
  - Cerrar sesión en todos los dispositivos (logout all).
- **No incluye:** Logout del dispositivo actual (Header).

#### 4.2.3 Sesiones

- **Propósito:** Visibilidad y control **self-service** sobre sesiones activas del usuario.
- **Operaciones:** Listar; revocar sesión remota; revocar sesión actual (con confirmación destructiva).
- **Alcance:** Solo sesiones del usuario autenticado (`GET /auth/sessions/`).

#### 4.2.4 Preferencias

- **Propósito:** Personalizar experiencia **local** del shell desktop.
- **Operaciones:** Elegir tema; elegir modo de navegación.
- **Persistencia:** Cliente (localStorage) — sin sincronización multi-dispositivo V1.

### 4.3 Principios de diseño funcional

1. **Desktop First:** Navegación lateral interna; contenido ancho completo en Sesiones (tablas).
2. **Reutilizar antes de crear:** Sesiones y auth flows existentes (§11).
3. **Una fuente de verdad por acción:** Logout solo Header; preferencias comparten mismo state que toggles Header.
4. **Separación self vs admin:** Nunca mezclar sesiones tenant-admin dentro del hub.
5. **No mostrar UUID** en UI (V2 E-ME4): nombres, correo, roles legibles — nunca `usuario_id`, `cliente_id`, `empresa_id`.

---

## 5. Información personal

### 5.1 Objetivo de la sección

Presentar al usuario una **vista consolidada read-only** de su identidad en el tenant. No permite edición en V1.

### 5.2 Campos a mostrar (V1)

| Campo UI | Fuente primaria | Fuente secundaria | Visible | Editable V1 |
|----------|-----------------|-------------------|---------|-------------|
| Nombre | `auth.user.nombre` | `/auth/me/` | Sí | No |
| Apellido | `auth.user.apellido` | `/auth/me/` | Sí | No |
| Correo electrónico | `auth.user.correo` | `/auth/me/` | Sí | No |
| Nombre de usuario | `auth.user.nombre_usuario` | `/auth/me/` | Sí | No |
| Tenant (razón social o nombre comercial) | `auth.user.cliente` o `clienteInfo` | `/auth/me/` | Sí | No |
| Subdominio tenant | `clienteInfo.subdominio` | `auth.user.cliente` | Sí, si existe | No |
| Tipo de usuario | Derivado `user_type`, `is_super_admin`, `es_admin_cliente` | Claims JWT | Sí — label humano | No |
| Roles asignados | `auth.user.roles[]` | `/auth/me/` | Sí — lista nombres | No |
| Nivel de acceso | `accessLevel` (AuthContext) | `/auth/me/` | Sí — numérico o label | No |
| Estado cuenta | `auth.user.es_activo` | `/auth/me/` | Sí — badge Activo/Inactivo | No |
| Empresa activa (nombre) | Resolución vía `empresa_activa` + catálogo elegibles | `/auth/me/` | Sí — **nombre**, no UUID | No |

### 5.3 Campos explícitamente prohibidos en UI

| Campo | Motivo |
|-------|--------|
| `usuario_id`, `cliente_id`, `empresa_activa` (UUID) | V2 E-ME4 |
| `current_session_id`, `current_token_id` | Identificadores internos IAM |
| `empresas_disponibles` como lista UUID | Mostrar solo empresa activa con nombre |

### 5.4 Datos pendientes de Backend (post-V1 o condicional)

| Campo | Necesidad | Impacto funcional |
|-------|-----------|-------------------|
| `proveedor_autenticacion` (local / SSO) | Seguridad — ocultar cambio password | Si ausente en V1: mostrar cambio password; SSO recibirá error 400 del BE |
| Foto / avatar URL | Avatar | V1 usa iniciales derivadas de nombre |
| Teléfono, cargo, departamento | RRHH enriquecido | Fuera V1 — posible integración HCM futura |
| Último acceso / fecha cambio password | Seguridad informativa | Nice-to-have; no bloqueante V1 |

### 5.5 Comportamiento funcional

- Al entrar a la sección, mostrar datos de **`auth.user` en memoria** (ya hidratado por bootstrap).
- **Opcional V1:** acción «Actualizar» que dispare refresh vía `authService.me()` sin editar — solo si UX lo requiere; no obligatorio en spec funcional mínima.
- Si `auth.user` es null tras gate: redirigir a login (comportamiento estándar `ProtectedRoute`).
- **Sin formulario submit** en V1.

### 5.6 Relación auth.user vs /auth/me

| Momento | Fuente |
|---------|--------|
| Post-login / bootstrap | `/auth/me/` es autoritativa; se mergea en AuthContext |
| Pantalla Información personal | Lee AuthContext (`auth.user`, `clienteInfo`, `accessLevel`, `empresaActivaId` + resolución nombre empresa) |
| Tras cambio contraseña exitoso | `completePasswordChange` → `applyFullSessionToken` actualiza user |

No se requiere llamada `/auth/me` dedicada al abrir la sección si bootstrap completó con éxito.

---

## 6. Seguridad

### 6.1 Objetivo de la sección

Centralizar acciones que afectan **credenciales y sesiones globales** del usuario, con contexto explicativo (textos de ayuda — copy definido en UX, no en esta spec).

### 6.2 Cambio voluntario de contraseña

| Aspecto | Definición funcional |
|---------|---------------------|
| **Disponibilidad** | Usuario autenticado en ERP con sesión completa; **no** en flujo force-password |
| **Endpoint** | `POST /api/v1/auth/password/change/` (contrato certificado) |
| **Campos** | Contraseña actual, nueva contraseña, confirmación nueva (validación cliente) |
| **Reglas validación** | Mínimo 8 caracteres; mayúscula; minúscula; número; nueva ≠ actual |
| **Acción éxito** | Actualizar sesión via `completePasswordChange`; `requires_password_change = false`; toast éxito |
| **Errores** | 401 contraseña incorrecta; 400 SSO/misma password; 422 validación — mensaje vía `detail` |
| **SSO** | Si proveedor ≠ local: **no mostrar** formulario (AC-C1) |
| **Relación force flow** | **Independiente** de `/change-password` |

### 6.3 Cambio obligatorio de contraseña (force)

| Aspecto | Definición funcional |
|---------|---------------------|
| **Ruta** | `/change-password` — **fuera** de Mi Cuenta |
| **Trigger** | `requiresPasswordChange === true` post-login o interceptor 403 `PASSWORD_CHANGE_REQUIRED` |
| **Comportamiento** | Bloquea acceso ERP y Mi Cuenta hasta completar |
| **Misma API** | `POST /auth/password/change/` + `completePasswordChange` |
| **Coexistencia** | Tras éxito, usuario puede acceder a Mi Cuenta → Seguridad para cambios futuros voluntarios |
| **Logout en force screen** | Permanece disponible (whitelist contrato) — **solo en ChangePasswordPage**, no duplicar en hub |

**Regla:** No migrar `/change-password` dentro del hub. Son **dos entry points**, un solo contrato backend.

### 6.4 Logout All (cerrar sesión en todos los dispositivos)

| Aspecto | Definición funcional |
|---------|---------------------|
| **Disponibilidad hub** | Sección Seguridad — acción primaria con explicación |
| **Disponibilidad Header** | Atajo opcional mantenido (confirmación dialog) |
| **Endpoint** | `POST /api/v1/auth/logout_all/` |
| **Precondiciones** | Sesión autenticada; **no** impersonación; **no** selección empresa pendiente; **no** `requiresPasswordChange` |
| **Confirmación** | Dialog destructivo obligatorio (reutilizar `LogoutAllConfirmDialog`) |
| **Post-éxito** | Wipe sesión local; redirect login — usuario debe reautenticarse |
| **Post-error** | Mensaje claro; si 403 force-password: orientar a logout simple |

### 6.5 Logout simple (dispositivo actual)

| Aspecto | Definición |
|---------|------------|
| **Ubicación V1** | **Únicamente Header** |
| **Mi Cuenta Seguridad** | **No incluye** logout simple — solo texto informativo opcional («Para cerrar solo este dispositivo, use el menú superior») |
| **Endpoint** | `POST /api/v1/auth/logout/` |

### 6.6 Matriz de convivencia

| Flujo | Ruta / ubicación | Usuario objetivo | Bloquea ERP |
|-------|------------------|------------------|-------------|
| Force password | `/change-password` | Obligado | Sí |
| Cambio voluntario | `/app/cuenta/seguridad` | Autenticado normal | No |
| Logout simple | Header | Todos | Termina sesión |
| Logout all | Header atajo + `/app/cuenta/seguridad` | Autenticado normal | Termina sesión global |

---

## 7. Sesiones

### 7.1 Objetivo de la sección

Permitir al usuario **ver y revocar** sus propias sesiones activas en el tenant.

### 7.2 Reutilización obligatoria

| Regla | Detalle |
|-------|---------|
| **Página** | `MySessionsPage` existente — **no reimplementar** |
| **Ruta canónica** | `/app/cuenta/sesiones` — **mantener** (registrada bajo hub layout) |
| **Hooks** | `useMySessionsList`, `useRevokeSession({ mode: 'self' })` |
| **Vistas** | `ActiveSessionsTableView` / `ActiveSessionsCardsView` con `variant="self"` |
| **API** | `GET /auth/sessions/`; `POST /auth/sessions/{id}/revoke/` |

**Prohibido V1:** Crear segunda página de sesiones self; duplicar tablas; fork de hooks.

### 7.3 Funcionalidad preservada (sin regresión)

- Toggle vista tabla / tarjetas (preferencia local existente).
- Refresh manual listado.
- Estados loading, error con reintentar, empty.
- Confirmación antes de revocar.
- Copy diferenciado «Cerrar esta sesión» vs «Cerrar sesión» remota.
- Identificación sesión actual.

### 7.4 Sesiones propias vs Sesiones administrador

| Dimensión | Sesiones propias (Mi Cuenta) | Sesiones admin (IAM) |
|-----------|------------------------------|----------------------|
| **Ruta** | `/app/cuenta/sesiones` | `/admin/sesiones` |
| **Actor** | Usuario sobre sí mismo | Admin tenant sobre usuarios del tenant |
| **API listado** | `GET /auth/sessions/` | `GET /auth/sessions/admin/` (paginado) |
| **Revocación** | Self-revoke | Admin revoke + self-revoke admin |
| **Filtros** | Ninguno (solo propias) | Búsqueda, usuario, KPIs, paginación |
| **Columnas** | Sin columna «usuario» ajeno | Con usuario, filtros enterprise |
| **Logout all** | No en esta pantalla | No — acción de cuenta en Seguridad |

**Regla:** El administrador que necesite vista tenant-wide **no** usa Mi Cuenta → Sesiones; usa `/admin/sesiones`. Enlace cruzado opcional solo como referencia textual.

### 7.5 Integración bajo hub

Funcionalmente, al navegar Mi Cuenta → Sesiones:

1. Se renderiza el **mismo contenido funcional** que hoy en `MySessionsPage`.
2. Cambia el **marco de navegación** (sidebar Mi Cuenta + breadcrumb).
3. No cambia el contrato API ni reglas de negocio.

---

## 8. Preferencias

### 8.1 Objetivo de la sección

Permitir al usuario configurar **aspecto y disposición** del shell ERP en su navegador.

### 8.2 Preferencias V1 — locales (in scope)

| Preferencia | Valores | Persistencia | Contexto existente |
|-------------|---------|--------------|-------------------|
| **Tema** | Claro / Oscuro / Sistema (auto) | `localStorage` key `theme` | `ThemeContext` |
| **Modo navegación** | Sidebar / Navbar superior | `localStorage` key `nav_layout_mode` | `NavModeContext` |
| **Vista sesiones** (tabla/grid) | Tabla / Tarjetas | `localStorage` por pantalla | Ya en `MySessionsPage` — **no mover** a Preferencias V1 |

### 8.3 Convivencia Header ↔ Preferencias

| Control | Header (atajo) | Preferencias (vista completa) |
|---------|----------------|------------------------------|
| Tema | Toggle binario claro/oscuro | Selector tres estados incl. Sistema |
| Modo nav | Toggle sidebar ↔ navbar | Selector explícito |

**Regla:** Ambos manipulan el **mismo state**. Cambiar en uno refleja en el otro instantáneamente. No existen dos fuentes de verdad.

### 8.4 Preferencias futuras — requieren Backend (out of scope V1)

| Preferencia | Motivo exclusión V1 |
|-------------|---------------------|
| Idioma / locale | Sin infra i18n en plataforma |
| Zona horaria | Requiere contrato perfil servidor |
| Densidad UI global | Sin spec plataforma |
| Notificaciones email/push | Sin módulo notificaciones |
| Sync preferencias multi-dispositivo | Requiere API persistencia usuario |
| Preferencias por tenant vs globales | Modelo de datos no definido |

---

## 9. Header — estado final esperado

### 9.1 Bloque resumen avatar (mantener)

- Iniciales / avatar circular derivado.
- Nombre + apellido (truncado).
- Correo (truncado).
- Badge tipo usuario (resumen).
- Nivel acceso (si > 0).
- Bloque cliente (tenant admin): razón social + subdominio.

### 9.2 Ítems menú dropdown — estado final V1

| Ítem actual | Estado V1 | Acción |
|-------------|-----------|--------|
| **Mi cuenta** | **NUEVO** — reemplaza entrada principal | Navigate `/app/cuenta` (redirect → informacion) |
| Mis sesiones | **MANTENER** — atajo opcional | Navigate `/app/cuenta/sesiones` |
| Mi perfil | **ELIMINAR** | Placeholder — sustituido por «Mi cuenta» |
| Bandeja de entrada | **ELIMINAR** | Placeholder sin backend |
| Configuraciones de la cuenta | **ELIMINAR** | Placeholder — absorbido por «Mi cuenta» |
| Administración Global | **MANTENER** | Solo super-admin shell |
| Cerrar sesión en todos los dispositivos | **MANTENER** | `LogoutAllConfirmDialog` + guards |
| Cerrar sesión | **MANTENER** | `logout()` |

### 9.3 Controles barra Header (fuera dropdown)

| Control | Estado V1 |
|---------|-----------|
| **Empresa activa** (`EmpresaSelector`) | **MANTENER** — no mover a Mi Cuenta |
| **Toggle tema** | **MANTENER** — atajo; detalle en Preferencias |
| **Toggle modo nav** | **MANTENER** — atajo; detalle en Preferencias |
| Búsqueda global | Sin cambio |
| Breadcrumbs | Extender para rutas `/app/cuenta/*` |

### 9.4 Orden funcional propuesto del dropdown

1. Bloque identidad (read-only)
2. Bloque cliente (condicional)
3. ─── separador ───
4. Mi cuenta
5. Mis sesiones *(atajo)*
6. ─── separador ───
7. Cerrar sesión en todos los dispositivos *(condicional — mismos guards que hoy)*
8. Cerrar sesión

---

## 10. Navegación

### 10.1 Rutas funcionales oficiales

| Ruta | Sección | Comportamiento |
|------|---------|----------------|
| `/app/cuenta` | Hub | Redirect → `/app/cuenta/informacion` |
| `/app/cuenta/informacion` | Información personal | Vista read-only §5 |
| `/app/cuenta/seguridad` | Seguridad | Password voluntario + logout all |
| `/app/cuenta/sesiones` | Sesiones | `MySessionsPage` reutilizada |
| `/app/cuenta/preferencias` | Preferencias | Tema + modo navegación |

**Nota:** Se adopta `informacion` (no `perfil`) en URL para alineación con label «Información personal» y evitar colisión semántica IAM.

### 10.2 Rutas relacionadas (fuera del hub)

| Ruta | Relación |
|------|----------|
| `/change-password` | Force password — auth layout |
| `/admin/sesiones` | Admin IAM — enlace opcional |
| `/login` | Post logout / logout all |

### 10.3 Protección de acceso

| Ruta | Guard funcional |
|------|-----------------|
| `/app/cuenta/*` | Usuario autenticado con acceso panel operativo (`ProtectedRoute requireOperationalUser`) |
| `/app/cuenta/*` + force-password | Redirect a `/change-password` — hub inaccesible |
| `/app/cuenta/*` + impersonación | Acceso permitido salvo restricciones existentes (logout all bloqueado) |

### 10.4 Justificación arquitectura navegación

**Sidebar interna + outlet** (Desktop First):

1. Escalabilidad: V2 puede añadir secciones sin rediseñar Header.
2. Sesiones requiere ancho de tabla — incompatible con modal o single-page scroll único.
3. Patrón enterprise consolidado (Settings hub).
4. Breadcrumb predecible: `Inicio → Mi cuenta → [Sección]`.

**Descartado V1:** modal desde avatar; tabs horizontales como patrón primario; cards hub obligatorio (redirect directo a informacion es suficiente).

### 10.5 Shells aplicables

| Shell | Mi Cuenta V1 |
|-------|--------------|
| `/app/*` operativo | **Sí** — alcance principal |
| `/admin/*` tenant admin | **Evaluación futura** — V1 solo `/app/cuenta`; admin usa mismo Header pero puede no tener ruta cuenta en V1 |
| `/super-admin/*` | **Fuera V1** — plataforma admin |

**Decisión V1:** Mi Cuenta vive en **panel operativo** `/app/cuenta`. Usuarios tenant_admin acceden cuando operan en shell `/app`. Acceso desde shell `/admin` queda **fase futura** si se requiere paridad.

---

## 11. Reutilización

### 11.1 Inventario obligatorio — no reimplementar

| Categoría | Artefacto existente | Uso en Mi Cuenta |
|-----------|---------------------|------------------|
| **Página** | `MySessionsPage` | Sección Sesiones — integración layout |
| **Página** | `ChangePasswordPage` | Extraer lógica form validación — force flow intacto |
| **Dialog** | `LogoutAllConfirmDialog` | Seguridad + Header |
| **Dialog** | `ConfirmDialog` | Revoke sesión (via MySessions) |
| **Vistas IAM** | `ActiveSessionsTableView`, `ActiveSessionsCardsView` | variant `self` |
| **Card** | `SessionSelfCard` | Vista grid sesiones |
| **Hook** | `useMySessionsList` | Sesiones |
| **Hook** | `useRevokeSession` | Sesiones |
| **Hook** | `useAuth` | Hub completo |
| **Hook** | `useTheme`, `useNavMode` | Preferencias |
| **Service** | `authService.changePassword` | Seguridad |
| **Service** | `getMySessions`, `revokeSessionSelf` | Sesiones |
| **Context action** | `completePasswordChange` | Seguridad |
| **Context action** | `logoutAllSessions` | Seguridad + Header |
| **Context action** | `logout` | Solo Header |
| **Context state** | `auth.user`, `clienteInfo`, `accessLevel`, `empresaActivaId` | Información personal |
| **Layout** | `InvPageLayout` / `OrgPageLayout` | Contenedor secciones |
| **Toolbar** | `OrgCompanyToolbar` | Sesiones (existente) |
| **Empty/Skeleton** | `IamTableEmptyState`, `InvTableSkeleton` | Sesiones |
| **Utils** | `validateNewPassword` (ChangePasswordPage) | Seguridad |
| **Utils** | `getErrorMessage` | Errores form |
| **Utils** | `getSessionCloseActionLabel` | Sesiones |

### 11.2 Compositors / AuthContext — sin cambio de contrato público V1

Reutilizar API existente documentada en `FRONTEND_AUTH_AUDIT.md`:

- `completePasswordChange`
- `logoutAllSessions`
- `requiresPasswordChange`
- Bootstrap `/auth/me` vía flujo estándar

**No se requiere** nuevo compositor de dominio «account» en AuthContext para V1.

### 11.3 Únicas piezas funcionales nuevas (conceptuales)

| Pieza | Naturaleza |
|-------|------------|
| Hub layout Mi Cuenta + nav lateral | Marco navegación — contenido mínimo |
| Vista Información personal read-only | Nueva presentación — datos existentes |
| Form cambio password voluntario | Extracción comportamiento existente |
| Vista Preferencias | Nueva presentación — state existente |

---

## 12. Exclusiones V1

Las siguientes capacidades **no forman parte** del contrato funcional ACCOUNT_CENTER_V1:

| # | Exclusión | Motivo |
|---|-----------|--------|
| E1 | Edición de datos personales | Sin contrato BE self-update perfil |
| E2 | Avatar / foto de perfil | Sin API almacenamiento imagen |
| E3 | MFA / 2FA | Sin flujo auth definido |
| E4 | API Keys / tokens personales | Sin producto |
| E5 | Notificaciones / centro de mensajes | Sin backend |
| E6 | Bandeja de entrada | Placeholder eliminado |
| E7 | Firma digital / certificados | Dominio DMS/firma |
| E8 | Preferencias servidor / sync cross-device | Sin API |
| E9 | Idioma / i18n | Plataforma monolingüe V1 |
| E10 | Logout simple dentro del hub | Duplicidad — Header exclusivo |
| E11 | Selector empresa en Mi Cuenta | V2 ME-02 — Header JWT |
| E12 | Gestión usuarios / roles IAM | Admin module |
| E13 | Sesiones admin embebidas | Separación self/admin |
| E14 | Configuración suscripción / billing | Fuera ERP operativo |
| E15 | Cambio email / username | Requiere flujo verificación BE |
| E16 | Historial de accesos / auditoría personal | Módulo AUD admin |
| E17 | Dispositivos de confianza | Sin spec IAM |
| E18 | Mi Cuenta en shell super-admin | V1 solo `/app` |

---

## 13. Roadmap funcional

### Fase 1 — Hub y entrada (fundación)

- Establecer Mi Cuenta como producto oficial.
- Hub navegable con secciones vacías o mínimas excepto Información personal read-only.
- Rewire Header: «Mi cuenta» funcional; eliminar placeholders.
- Redirect `/app/cuenta` → informacion.
- Breadcrumb funcional básico.

**Criterio de done funcional:** Usuario accede a Mi Cuenta desde Header; ve identidad read-only; no existen ítems muertos en menú.

### Fase 2 — Seguridad

- Cambio voluntario de contraseña en `/app/cuenta/seguridad`.
- Integración logout all en Seguridad con confirmación.
- Guards force-password e impersonación aplicados.
- Coexistencia verificada con `/change-password`.

**Criterio de done funcional:** Usuario local cambia password sin force flag; logout all funciona desde Seguridad y Header.

### Fase 3 — Sesiones integradas

- `MySessionsPage` bajo layout Mi Cuenta en `/app/cuenta/sesiones`.
- Atajo Header «Mis sesiones» apunta a ruta integrada.
- Paridad funcional con comportamiento pre-hub (revoke, views, estados).

**Criterio de done funcional:** Cero regresión en self-revoke; navegación coherente desde hub y Header.

### Fase 4 — Preferencias

- Sección Preferencias con tema tres estados y modo navegación.
- Convivencia verificada con toggles Header.

**Criterio de done funcional:** Cambio en Preferencias refleja Header y viceversa.

### Fases futuras (post-V1 — no comprometidas)

- Edición perfil (BE).
- Mi Cuenta en shell `/admin`.
- Notificaciones.
- MFA.
- Avatar.
- Enlace enriquecido admin sesiones con RBAC granular.

---

## 14. Riesgos

| ID | Riesgo funcional | Prob. | Impacto | Mitigación en spec |
|----|------------------|-------|---------|-------------------|
| RF1 | Scope creep (bandeja, MFA, edit perfil) | Alta | Alto | §12 exclusiones explícitas |
| RF2 | Usuario confunde «Mi cuenta» vs «Perfiles» admin | Media | Medio | Naming §2; copy UX |
| RF3 | Duplicar logout en hub y Header | Media | Bajo | §6.5 — logout solo Header |
| RF4 | Duplicar implementación sesiones | Baja | Alto | §7.2 reutilización obligatoria |
| RF5 | Force-password: usuario accede hub | Baja | Medio | §10.3 guard |
| RF6 | Logout all durante force-password → 403 | Media | Bajo | Guard AC-C3; FRONTEND_AUTH_AUDIT G3 |
| RF7 | SSO sin flag → form password visible → error 400 | Media | Bajo | AC-C1 cuando BE disponible |
| RF8 | Preferencias Header vs página desincronizadas | Media | Medio | §8.3 una fuente de verdad |
| RF9 | Tenant admin en shell admin sin Mi Cuenta | Media | Bajo | Documentado §10.5 — fase futura |
| RF10 | Mostrar UUID en información personal | Baja | Alto | §5.3 prohibición V2 E-ME4 |

---

## 15. Recomendaciones — evolución futura

### 15.1 V1.1 — quick wins

- Campo `proveedor_autenticacion` en UI Seguridad (ocultar password SSO).
- Botón «Actualizar datos» en Información personal (refresh `/me`).
- Enlace contextual a `/admin/sesiones` para admins con permiso.

### 15.2 V2 — Account Center ampliado

- **Edición perfil limitada** (teléfono, nombre display) tras contrato BE.
- **Preferencias servidor** sync cross-device.
- **Mi Cuenta en shell admin** — misma ruta relativa o `/admin/cuenta` con layout compartido.
- **Actividad reciente** (últimos accesos) read-only.

### 15.3 V3 — seguridad avanzada

- MFA enrollment.
- API keys personales para integraciones.
- Gestión dispositivos de confianza.

### 15.4 Principio rector evolutivo

Mi Cuenta debe permanecer **self-service del usuario sobre sí mismo**. Cualquier capacidad que actúe sobre **otros usuarios** o **configuración del tenant** permanece en módulos IAM/ORG/Admin — enlazable desde Mi Cuenta pero nunca embebido.

---

## 16. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Es documento funcional? | **Sí** — define qué, no cómo implementar |
| ¿Contiene código React/TypeScript? | **No** |
| ¿Contiene wireframes/Figma? | **No** |
| ¿Contiene plan de implementación técnico? | **No** |
| ¿Re-audita Backend? | **No** — referencia contratos ya certificados |
| ¿Re-audita estado FE? | **No** — consume `ACCOUNT_CENTER_V1_AUDIT.md` |
| ¿Resuelve naming? | **Sí** — «Mi Cuenta» |
| ¿Define alcance V1 acotado? | **Sí** — §3 y §12 |
| ¿Define reutilización? | **Sí** — §11 |
| ¿Alineado V2? | **Sí** — ME-02, E-ME4, TB-01 implícito |
| ¿Modifica docs oficiales? | **No** |

---

## 17. Dictamen final

# **A) Especificación funcional aprobada y lista para diseño UX**

**Justificación:**

Este documento cierra las decisiones conceptuales pendientes identificadas en la auditoría (naming, alcance V1, convivencia Header/hub, rutas, reutilización, exclusiones). No quedan ambigüedades funcionales bloqueantes para iniciar **diseño UX desktop-first** (wireframes, copy, estados visuales).

**Handoff a UX debe incluir:**

1. Sidebar Mi Cuenta — 4 secciones.
2. Estados Información personal read-only.
3. Form Seguridad + dialog logout all.
4. Integración visual MySessions sin cambio funcional.
5. Preferencias + convivencia toggles Header.
6. Header dropdown estado final §9.

**Implementación:** requiere documento técnico separado (fuera de alcance de esta spec).

---

*Especificación funcional ACCOUNT_CENTER_V1 — 2026-06-24.*  
*Referencias: ACCOUNT_CENTER_V1_AUDIT.md, FRONTEND_AUTH_AUDIT.md, AUTH_FRONTEND_CONTRACT_CERTIFICATION.md.*
