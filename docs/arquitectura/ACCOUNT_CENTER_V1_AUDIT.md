# ACCOUNT_CENTER_V1 — Auditoría Frontend «Mi Perfil»

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_AUDIT.md`  
**Épica:** `ACCOUNT_CENTER_V1` (Mi Perfil)  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — sin cambios de código ni documentación oficial  
**Alcance:** Estado actual Frontend del área «Mi Perfil» / cuenta de usuario  
**Excluido:** Contratos Backend auth (change/logout/logout_all ya certificados); implementación; diseño visual detallado (Figma)

**Referencias cruzadas (solo lectura):**
- `docs/arquitectura/FRONTEND_AUTH_AUDIT.md` — gaps auth reutilizables en Account Center
- `docs/arquitectura/ERP-IAM-SESSIONS-FE-VALIDATION-01.md` — MySessions implementado

---

## 1. Resumen Ejecutivo

Hoy **no existe un «Centro de cuenta» ni una pantalla «Mi perfil»** en el Frontend. La etiqueta aparece en el menú del avatar (`Header.tsx`) como **placeholder sin `onClick` ni ruta**. Lo más cercano a un módulo de cuenta es **`/app/cuenta/sesiones`** (`MySessionsPage`), una página aislada de sesiones propias sin hub padre ni navegación lateral.

Las acciones de sesión y autenticación están **dispersas en el Header global**: logout, logout all, tema, modo de navegación, selector de empresa y enlace directo a «Mis sesiones». Los datos de perfil provienen de **`AuthContext` → `auth.user`** (hydrate vía `GET /auth/me/`), pero **no hay UI de edición ni vista de solo lectura** fuera del dropdown del avatar.

| Área evaluada | Estado |
|---------------|--------|
| Pantalla «Mi perfil» | **No existe** |
| Hub `/app/cuenta` | **No existe** (solo sub-ruta `sesiones`) |
| Mis sesiones (self) | **Completo** — `MySessionsPage` |
| Sesiones admin | **Completo** — `/admin/sesiones` (audiencia distinta) |
| Cambio contraseña voluntario | **No existe** (solo force `/change-password`) |
| Preferencias UI (tema, layout) | **Parcial** — toggles en Header, sin pantalla |
| Placeholders menú avatar | **3 ítems muertos** (Mi perfil, Bandeja, Configuraciones) |

**Conclusión:** La épica es **viable y recomendable**, pero requiere **decisiones conceptuales** (hub vs rutas sueltas, qué permanece en Header vs Account Center, alcance V1) antes del diseño UX formal.

---

## 2. Estado Actual

### 2.1 Ubicación en la aplicación

| Elemento | Ubicación | Shell | Protección |
|----------|-----------|-------|------------|
| Menú avatar usuario | `Header.tsx` | `app`, `admin`, `super-admin` | Global en layout |
| Mis sesiones | `/app/cuenta/sesiones` | `app` | `ProtectedRoute requireOperationalUser` |
| Sesiones activas (admin) | `/admin/sesiones` | `admin` | `ProtectedRoute requireTenantAdmin` |
| Cambio contraseña obligatorio | `/change-password` | Auth (sin layout ERP) | Guard interno en página |
| Logout / Logout all | Acciones Header | Todos los shells con Header | `useAuth()` |

No hay rutas `/app/cuenta`, `/app/cuenta/perfil`, `/app/perfil` ni equivalente en `/admin`.

### 2.2 Navegación actual (menú avatar)

Flujo real del dropdown en `src/shared/components/layout/Header.tsx`:

```
Avatar → dropdown
├── [Bloque info] nombre, apellido, correo, badge tipo, nivel acceso
├── [Opcional] cliente (razón social, subdominio) — tenant admin
├── Mis sesiones          → navigate('/app/cuenta/sesiones')  ✅
├── Mi perfil             → (sin handler)                     ❌ placeholder
├── Bandeja de entrada    → (sin handler)                     ❌ placeholder
├── Configuraciones cuenta→ (sin handler)                     ❌ placeholder
├── [Super-admin] Administración Global
├── Cerrar sesión todos   → LogoutAllConfirmDialog            ✅
└── Cerrar sesión         → logout()                            ✅
```

Acciones **fuera del dropdown** pero en la misma barra Header:
- Toggle tema claro/oscuro (`ThemeContext`)
- Toggle sidebar/navbar (`NavModeContext`)
- Selector empresa (`EmpresaSelector`) — no es perfil; es contexto operativo JWT

### 2.3 Datos mostrados hoy

| Dato | Fuente | Dónde se muestra | Editable |
|------|--------|------------------|----------|
| `nombre`, `apellido` | `auth.user` | Header dropdown | No |
| `correo` | `auth.user` | Header dropdown | No |
| `nombre_usuario` | `auth.user` | ChangePasswordPage (force) | No |
| Badge tipo usuario | Derivado `useUserType` | Header — textos fijos | N/A |
| `accessLevel` | AuthContext | Header — «Nivel N» | No |
| `clienteInfo` | AuthContext | Header — tenant admin | No |
| Roles / perfiles IAM | `auth.user.roles` | **No visible al usuario** | No |
| `empresa_activa` | AuthContext | EmpresaSelector (Header) | Sí (cambiar empresa) |
| Sesiones dispositivos | `GET /auth/sessions/` | MySessionsPage | Revocar (self) |

### 2.4 Datos hardcodeados / derivados frágiles

| Item | Archivo | Observación |
|------|---------|-------------|
| Badge «ADMINISTRADOR GLOBAL» | `Header.tsx` | String fijo para super admin |
| Badge «USUARIO» | `Header.tsx` | String fijo operativo |
| Badge tenant admin | `Header.tsx` | Usa `clienteInfo.razon_social` o fallback «ADMINISTRADOR» |
| Breadcrumb «Dashboard» | `Header.tsx` | Fallback cuando no hay crumbs |
| Empty copy sesiones | `MySessionsPage.tsx` | Textos estáticos UX |
| `VIEW_MODE_STORAGE_KEY` | MySessions, ActiveSessions | Preferencia local por pantalla, no centralizada |

**Antipatrón visual detectado:** el dropdown del Header usa clases `bg-brand-surface`, `border-brand-border`, `text-brand-text-*` — prohibidas para UI estructural según `.cursorrules` (Capa 2 en estructura). Account Center V1 debería nacer con tokens Capa 1 (`bg-surface`, `border-border-base`, `text-text-base`).

### 2.5 Wiring AuthContext y compositors

| Capacidad | API AuthContext | Uso en «cuenta» hoy |
|-----------|-----------------|---------------------|
| Perfil sesión | `auth.user` | Solo Header + guards |
| Refresh perfil | Bootstrap `/auth/me` | Automático; sin botón «actualizar perfil» |
| Cambio contraseña | `completePasswordChange` | Solo force flow |
| Logout | `logout()` | Header |
| Logout all | `logoutAllSessions()` | Header + dialog |
| Impersonación | `isImpersonation`, banners | Bloquea logout all |
| Force password | `requiresPasswordChange` | Redirect; no Account Center |

No hay compositor ni hook dedicado a «account center». `MySessionsPage` importa capa admin (`features/admin/hooks`, `features/admin/components/iam/sessions/*`) — patrón aceptado según IAM Sessions FE Gate.

### 2.6 Dependencias entre módulos

```
Header (shared/layout)
  └── useAuth, useTheme, useNavMode, LogoutAllConfirmDialog

MySessionsPage (features/auth/pages)
  └── features/admin/*  (hooks, views, utils, service)
  └── InvPageLayout, OrgCompanyToolbar

ActiveSessionsPage (features/admin/pages)
  └── Mismo stack sesiones + filtros admin + KPIs

ChangePasswordPage (features/auth/pages)
  └── completePasswordChange — fuera de /app/cuenta
```

---

## 3. Inventario

### 3.1 Rutas relacionadas con cuenta / perfil

| Ruta | Componente | Estado |
|------|------------|--------|
| `/app/cuenta/sesiones` | `MySessionsPage` | **Implementada** |
| `/admin/sesiones` | `ActiveSessionsPage` | **Implementada** (admin IAM) |
| `/change-password` | `ChangePasswordPage` | **Implementada** (force auth) |
| `/app/cuenta` | — | **No existe** |
| `/app/cuenta/*` (perfil, seguridad, prefs) | — | **No existe** |

Registro: `src/app/router/app-route-tree.tsx` (línea ~47–54).

### 3.2 Componentes existentes reutilizables

| Componente | Path | Reutilización Account Center |
|------------|------|------------------------------|
| `MySessionsPage` | `features/auth/pages/` | Sección «Sesiones» — embed o sub-ruta |
| `ActiveSessionsTableView/CardsView` | `admin/components/iam/sessions/` | Ya usados con `variant="self"` |
| `SessionSelfCard` | idem | Cards self-service |
| `LogoutAllConfirmDialog` | `features/auth/components/` | Sección Seguridad o acceso rápido |
| `ConfirmDialog` | `shared/components/ui/` | Patrón confirmaciones |
| `ChangePasswordPage` form + `validateNewPassword` | `features/auth/pages/` | Extraer form cambio voluntario |
| `InvPageLayout` / `OrgPageLayout` | org/inv | Layout páginas ERP (toolbar-first, sin H1 body) |
| `OrgCompanyToolbar` | org | Toolbar superior sección |
| `IamTableEmptyState`, `InvTableSkeleton` | admin/inv | Estados listado |
| `ThemeContext` / `NavModeContext` | shared/context | Sección Preferencias |
| `useMySessionsList`, `useRevokeSession` | admin/hooks | Sesiones propias |
| `completePasswordChange` | AuthContext | Seguridad |

### 3.3 Hooks y servicios

| Hook / Service | Función | Account Center |
|----------------|---------|----------------|
| `useAuth()` | Estado sesión + acciones auth | Hub central |
| `useMySessionsList` | GET `/auth/sessions/` | Sesiones V1 |
| `useRevokeSession({ mode: 'self' })` | Revocar sesión propia | Sesiones V1 |
| `authService.me` | Perfil | Información personal (read-only V1) |
| `authService.changePassword` | Cambio contraseña | Seguridad V1 |
| `logoutAllSessions` (session.service) | Logout all API | Seguridad — vía AuthContext |
| `useTheme`, `useNavMode` | Preferencias locales | Preferencias V1 |

### 3.4 Placeholders confirmados

| UI | Evidencia | Riesgo UX |
|----|-----------|-----------|
| «Mi perfil» | `Header.tsx` — botón sin `onClick` | Usuario espera pantalla; click no hace nada |
| «Bandeja de entrada» | idem | Feature inexistente; confusión |
| «Configuraciones de la cuenta» | idem | Solapamiento semántico con épica actual |
| Breadcrumbs en `/app/cuenta/sesiones` | No está en menú lateral ni `/auth/menu` | Crumb genérico o vacío |

---

## 4. Funcionalidades: Real vs Placeholder

| Funcionalidad | Estado | Ubicación actual |
|---------------|--------|------------------|
| Ver nombre/correo propio | **Real** (limitado) | Header dropdown |
| Editar datos personales | **No existe** | — |
| Ver roles asignados | **No existe** (dato en `user.roles`) | — |
| Cambio contraseña obligatorio | **Real** | `/change-password` |
| Cambio contraseña voluntario | **No existe** | — |
| Cerrar sesión actual | **Real** | Header |
| Cerrar todas las sesiones | **Real** | Header + dialog |
| Listar sesiones propias | **Real** | `/app/cuenta/sesiones` |
| Revocar sesión remota (self) | **Real** | MySessionsPage |
| Administrar sesiones tenant | **Real** | `/admin/sesiones` (otro rol) |
| Tema claro/oscuro/auto | **Real** | Header toggle + `ThemeContext` |
| Modo sidebar/navbar | **Real** | Header toggle + `NavModeContext` |
| Vista tabla/cards sesiones | **Real** | localStorage por página |
| Bandeja / inbox | **Placeholder** | Header |
| Notificaciones cuenta | **No existe** | — |
| 2FA / MFA | **No existe** | — |
| Avatar / foto perfil | **No existe** (iniciales generadas) | Header |

---

## 5. Evaluación de Secciones Propuestas

Criterios: valor usuario ERP desktop, contratos BE disponibles, código FE existente, duplicidad con Header.

### 5.1 Información personal

| Criterio | Evaluación |
|----------|------------|
| Datos BE | `GET /auth/me/` — lectura ✅; **edición perfil propio no auditada en esta épica** |
| FE actual | Solo lectura parcial en Header |
| Recomendación V1 | **Incluir — solo lectura**: nombre, apellido, correo, usuario, tenant, roles (descriptivos, sin UUID). Sin formulario edit hasta contrato BE explícito. |
| Prioridad | **P1** — ancla visual del hub |

### 5.2 Seguridad

| Criterio | Evaluación |
|----------|------------|
| Cambio contraseña | Contrato certificado; `completePasswordChange` listo (ver FRONTEND_AUTH_AUDIT) |
| Logout / Logout all | Wiring AuthContext completo |
| SSO | Sin campo `proveedor_autenticacion` en `UserData` — ocultar cambio password pendiente |
| Recomendación V1 | **Incluir**: cambio contraseña voluntario (form reutilizado), enlace/copy logout all, **no** duplicar logout simple (permanece Header). |
| Prioridad | **P1** |

### 5.3 Sesiones

| Criterio | Evaluación |
|----------|------------|
| FE | `MySessionsPage` enterprise-ready (table/cards, revoke, empty/error/loading) |
| vs Admin | `/admin/sesiones` es IAM tenant — **no fusionar** |
| Recomendación V1 | **Incluir** — reubicar bajo hub; opción: ruta hija `/app/cuenta/sesiones` sin reescribir page. |
| Prioridad | **P1** — ya implementado; solo integración navegación |

### 5.4 Preferencias

| Criterio | Evaluación |
|----------|------------|
| FE | `ThemeContext` (light/dark/auto), `NavModeContext` (sidebar/navbar) |
| BE | Preferencias **solo localStorage** — sin sync servidor |
| Recomendación V1 | **Incluir parcial**: mover/contemplar toggles desde Header; sección «Apariencia» desktop. **Excluir V1**: notificaciones, idioma (no hay i18n), densidad tabla global. |
| Prioridad | **P2** — mejora UX; Header puede mantener accesos rápidos |

### 5.5 Secciones **no** recomendadas V1

| Sección | Motivo |
|---------|--------|
| Bandeja de entrada | Placeholder sin backend ni diseño |
| Configuración empresa | Pertenece ORG/admin; ME-02 prohíbe selector empresa en toolbar local — empresa es Header |
| Gestión usuarios/roles | `/admin/usuarios` — admin IAM, no self-service |
| Facturación / suscripción | Fuera dominio operativo ERP |
| Active Sessions admin | Audiencia tenant admin; enlace contextual solo si RBAC |

---

## 6. Integración Funcional Recomendada

| Capacidad | Dónde V1 | Dónde NO | Notas |
|-----------|----------|----------|-------|
| **Cambio contraseña voluntario** | Account Center → Seguridad | No reemplazar `/change-password` force | Mismo servicio; UI distinta (sin gate `requiresPasswordChange`) |
| **Logout** | **Header únicamente** | No duplicar en hub | Acción global frecuente; ERP desktop mantiene atajo |
| **Logout all** | Seguridad en hub **+** Header opcional | — | Header: atajo; hub: contexto explicativo |
| **Sesiones propias** | Hub → Sesiones (`/app/cuenta/sesiones`) | No mezclar con admin | Reutilizar page actual |
| **Sesiones admin** | Enlace desde hub **solo si** RBAC admin | No embebido | `/admin/sesiones` |
| **Tema / layout** | Preferencias (+ atajo Header) | — | Evitar dos fuentes de verdad |
| **Empresa activa** | **Header** (JWT) | No Account Center | V2 ME-01 |

---

## 7. Duplicidad y Solapamiento

| Par | Tipo | Resolución propuesta |
|-----|------|----------------------|
| Header «Mis sesiones» vs hub Sesiones | Navegación dual | Header → deep link a sección; hub es canónico |
| Header «Configuraciones cuenta» vs hub | Placeholder vs futuro | Eliminar label placeholder; unificar en «Mi cuenta» |
| Header toggles tema/nav vs Preferencias | Funcional duplicada | Header = atajo; Preferencias = vista completa (auto/light/dark) |
| Header info usuario vs Información personal | Datos repetidos | Header = resumen mínimo; hub = vista completa |
| Logout Header vs Seguridad | Acción duplicada | Logout solo Header; hub explica logout all |
| `MySessionsPage` vs `ActiveSessionsPage` | Dominio distinto | Mantener separados (self vs admin) |
| `ChangePasswordPage` vs cambio voluntario | Flujos distintos | Rutas separadas; form compartido |
| `features/auth` page import `features/admin` | Acoplamiento | Aceptado (Gate IAM); Account Center puede vivir en `features/auth` o nuevo `features/account` |

---

## 8. Opciones de Navegación (Desktop First)

### 8.1 Alternativas evaluadas

| Patrón | Pros desktop ERP | Contras | Veredicto |
|--------|------------------|---------|-----------|
| **Página simple** (una sola scroll) | Simple | Escala mal con sesiones + seguridad + prefs | ❌ No V1 |
| **Tabs horizontales** | Familiar, compacto | Muchas secciones → overflow; peor con tablas anchas (sesiones) | ⚠ Secundario |
| **Sidebar interno + outlet** | Estándar enterprise (Settings, M365, SAP Fiori shell) | Requiere layout dedicado | ✅ **Recomendado** |
| **Cards hub landing** | Buen descubrimiento | Extra click siempre | ⚠ Como índice `/app/cuenta` opcional |
| **Modal desde Header** | Rápido | Insuficiente para sesiones tabulares; anti-patrón ERP | ❌ |

### 8.2 Arquitectura de navegación recomendada

```
/app/cuenta                    → AccountCenterLayout (sidebar interna)
├── /app/cuenta                → redirect → /app/cuenta/perfil (o resumen)
├── /app/cuenta/perfil         → Información personal (read-only V1)
├── /app/cuenta/seguridad      → Cambio password + logout all
├── /app/cuenta/sesiones       → MySessionsPage (existente)
└── /app/cuenta/preferencias   → Tema + modo navegación
```

**Header avatar (simplificado V1):**
- Resumen usuario (mantener)
- **«Mi cuenta»** → `/app/cuenta` (reemplaza placeholders)
- Mis sesiones → opcional mantener atajo directo
- Cerrar sesión / logout all (mantener)
- **Eliminar o posponer:** Mi perfil, Bandeja, Configuraciones (placeholders)

**Breadcrumbs:** registrar secciones en mapa estático o extensión mínima de `useShellBreadcrumbs` para prefijo `/app/cuenta/*` (hoy no resuelve estas rutas).

---

## 9. Arquitectura Enterprise Propuesta (Desktop First)

### 9.1 Estructura de módulo (spec — no implementar aún)

```
src/features/account/                    # Propuesto — epic ACCOUNT_CENTER_V1
├── pages/
│   ├── AccountCenterLayout.tsx          # Sidebar + <Outlet />
│   ├── AccountProfilePage.tsx           # Información personal
│   ├── AccountSecurityPage.tsx          # Seguridad
│   └── AccountPreferencesPage.tsx       # Preferencias
├── components/
│   ├── AccountCenterNav.tsx             # Sidebar items
│   ├── AccountProfileSummary.tsx        # Read-only fields
│   └── ChangePasswordForm.tsx           # Extraído de ChangePasswordPage
├── routes.tsx                           # Rutas hijas /app/cuenta/*
└── hooks/
    └── useAccountProfile.ts             # Wrapper auth.user + optional me refetch
```

**Alternativa mínima:** extender `features/auth/pages/` sin nuevo feature folder — válido si se quiere menos superficie; la auditoría recomienda **`features/account`** para separar auth (login/force) de cuenta autenticada.

### 9.2 Layout desktop

- **Plantilla:** extender patrón ORG/INV — `OrgPageLayout` / toolbar sin H1 en body (V2 TB-01).
- **Sidebar interna:** ancho fijo ~220px, items con icono Lucide, estado activo `bg-overlay` + `text-brand-primary`.
- **Área contenido:** max-width cómoda para formularios (~720px) en Perfil/Seguridad; **full width** en Sesiones (tabla).
- **Sin drawer mobile-first:** responsive colapsa sidebar a tabs solo bajo breakpoint; diseño primario ≥1280px.

### 9.3 AuthContext — impacto

| Cambio | ¿Necesario? |
|--------|-------------|
| Nuevos métodos públicos | **No** — reutilizar `completePasswordChange`, `logoutAllSessions`, `auth.user` |
| Compositors | **No** en V1 |
| RBAC ruta | **No** PermissionGuard — cualquier usuario operativo autenticado (`ProtectedRoute`) |
| Force password | Redirect a `/change-password` sigue prevaleciendo sobre `/app/cuenta/*` |

### 9.4 Alineación ERP_FRONTEND_STANDARDS_V2

| Regla | Aplicación Account Center |
|-------|---------------------------|
| TB-01 sin H1 body | Toolbar con título sección en sidebar o page header compacto |
| E-ME4 no UUID | Perfil: nombres, no `usuario_id` |
| ME-02 | Sin selector empresa en cuenta |
| Capa 1 tokens | Obligatorio en nuevo layout (corregir deuda Header dropdown en epic separada o mismo bloque) |
| ER-02 toast | Mutaciones password en hook onError |

---

## 10. UX Propuesta (Desktop First)

### 10.1 Flujos principales

**F1 — Acceder a Mi cuenta**
1. Click avatar → «Mi cuenta»
2. Landing sidebar «Información personal»
3. Breadcrumb: Inicio → Mi cuenta → [sección]

**F2 — Cambiar contraseña (voluntario)**
1. Mi cuenta → Seguridad → formulario
2. Validación cliente (8+, mayúscula, minúscula, número)
3. `completePasswordChange` → toast éxito → permanece en hub

**F3 — Gestionar sesiones**
1. Mi cuenta → Sesiones (o atajo Header)
2. Tabla/cards existentes; revoke con ConfirmDialog

**F4 — Preferencias**
1. Mi cuenta → Preferencias
2. Radio: Claro / Oscuro / Sistema; Sidebar / Navbar
3. Persistencia localStorage (existente)

### 10.2 Estados UX obligatorios (V2)

| Pantalla | Loading | Error | Empty |
|----------|---------|-------|-------|
| Perfil | Spinner si `!authInitialized` | Banner si `!auth.user` | N/A |
| Seguridad | Submit loading | Field + toast API | N/A |
| Sesiones | ✅ existente | ✅ existente | ✅ existente |
| Preferencias | N/A (instant) | N/A | N/A |

### 10.3 Copy y nomenclatura

| Evitar | Usar |
|--------|------|
| «Configuraciones de la cuenta» (placeholder) | «Mi cuenta» / «Centro de cuenta» |
| «Mi perfil» suelto en menú | «Información personal» dentro del hub |
| «Perfil» (confusión IAM roles) | «Información personal» vs «Perfiles» admin |

---

## 11. Hallazgos

| ID | Hallazgo | Severidad |
|----|----------|-----------|
| H1 | No existe pantalla «Mi perfil» pese a label en menú | Alta |
| H2 | Tres ítems de menú avatar son placeholders sin feedback | Alta |
| H3 | `/app/cuenta/sesiones` huérfana — sin hub ni breadcrumb dedicado | Media |
| H4 | Preferencias UI dispersas en Header sin pantalla unificada | Media |
| H5 | Cambio contraseña voluntario ausente; force flow aislado en `/change-password` | Media |
| H6 | `user.roles` no expuesto al usuario final | Baja |
| H7 | Header dropdown usa tokens Capa 2 prohibidos en estructura | Media (deuda UX) |
| H8 | `MySessionsPage` acoplada a `features/admin` — documentado y aceptado | Info |
| H9 | Sin contrato FE auditado para editar perfil propio | Alta (scope) |
| H10 | «Bandeja de entrada» implica módulo inexistente | Media |

---

## 12. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R1 | Usuario hace click «Mi perfil» — no pasa nada | Alta | Medio | Epic prioriza rewire Header |
| R2 | Duplicar logout/tema en hub y Header confunde | Media | Bajo | Matriz §7 — reglas claras |
| R3 | Scope creep (bandeja, edit perfil, MFA) | Alta | Alto | Roadmap por fases; V1 acotado |
| R4 | Breadcrumbs rotos en `/app/cuenta/*` | Media | Bajo | Extender `useShellBreadcrumbs` |
| R5 | Force-password vs navegación cuenta | Baja | Medio | ProtectedRoute ya redirige |
| R6 | SSO sin detección en cambio password | Media | Medio | Depende campo BE en `/me` |
| R7 | Admin sessions vs self — usuario abre ruta equivocada | Baja | Bajo | Labels distintos + RBAC |

---

## 13. Oportunidades

1. **Consolidar** entrada única «Mi cuenta» eliminando placeholders muertos.
2. **Reutilizar** `MySessionsPage` y stack IAM sin reescritura.
3. **Extraer** `ChangePasswordForm` para voluntario sin tocar force flow.
4. **Centralizar** preferencias desktop sin backend.
5. **Corregir** tokens Capa 1 en área cuenta + oportunidad arreglar dropdown Header.
6. **Exponer** roles legibles (nombres rol IAM) en información personal — dato ya en JWT/me.
7. **Enlace contextual** a admin sesiones para tenant admins con permiso.

---

## 14. Reutilización — Matriz

| Activo | Reutilizar | Adaptar | No tocar |
|--------|------------|---------|----------|
| `MySessionsPage` | ✅ Sub-ruta | Breadcrumb/título | Lógica revoke |
| `ActiveSessions*View` | ✅ variant self | — | variant admin |
| `LogoutAllConfirmDialog` | ✅ | Copy contexto hub | Header usage |
| `ChangePasswordPage` | Extraer form | Modo voluntario | Force route |
| `ThemeContext` / `NavModeContext` | ✅ | UI Preferencias | Lógica storage |
| `InvPageLayout` | ✅ | Wrapper layout cuenta | — |
| `useAuth` | ✅ | — | Compositors |
| `Header` | Rewire links | Reducir placeholders | Logout placement |
| `UserManagementPage` | — | — | Admin only |

---

## 15. Roadmap Recomendado

### Fase 0 — Diseño UX (prerequisito)
- Wireframes desktop sidebar + 4 secciones
- Decisión copy «Mi cuenta» vs «Centro de cuenta»
- Wire Header avatar simplificado
- Validar con V2 TB-01 / tokens Capa 1

### Fase 1 — Hub mínimo (MVP)
- `AccountCenterLayout` + rutas `/app/cuenta/*`
- Perfil read-only
- Rewire Header «Mi cuenta»
- Eliminar/deshabilitar placeholders

### Fase 2 — Seguridad
- `ChangePasswordForm` voluntario + SSO guard (si BE)
- Sección logout all (reutilizar dialog)
- Tests form validation

### Fase 3 — Integración sesiones
- Mover/registrar `MySessionsPage` bajo layout
- Breadcrumbs cuenta
- Atajo Header opcional

### Fase 4 — Preferencias
- Página Preferencias (tema completo + nav mode)
- Documentar convivencia con toggles Header

### Fase 5 — Opcional / backlog
- Edición perfil (requiere contrato BE)
- Bandeja notificaciones
- Avatar upload
- MFA

---

## 16. Prioridades

| Prioridad | Item | Justificación |
|-----------|------|---------------|
| **P0** | Rewire Header — eliminar placeholders rotos | Confianza usuario |
| **P0** | Hub layout + ruta `/app/cuenta` | Arquitectura epic |
| **P1** | Información personal read-only | Valor inmediato sin BE |
| **P1** | Integrar sesiones existentes | Evitar reimplementación |
| **P1** | Cambio contraseña voluntario | Contrato BE listo |
| **P2** | Preferencias centralizadas | Nice-to-have; toggles Header existen |
| **P2** | Breadcrumbs cuenta | Polish desktop |
| **P3** | Enlace admin sesiones condicional | Solo tenant admins |
| **P3** | Refactor tokens Header dropdown | Deuda visual |

---

## 17. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se modificó código? | **No** |
| ¿Se auditó Backend? | **No** — contratos auth asumidos certificados |
| ¿«Mi perfil» existe como pantalla? | **No** — hallazgo central |
| ¿Hay base reutilizable? | **Sí** — MySessions, AuthContext, preferencias contexts |
| ¿Desktop First? | **Sí** — sidebar interno recomendado |
| ¿Mobile First? | **No** — fuera de alcance |
| ¿Duplicidad controlada? | **Matriz §7** definida |
| ¿V1 acotado sin scope creep? | **Sí** — sin bandeja, sin edit perfil, sin MFA |
| ¿Alineado V2? | **Sí** — Plantilla A, tokens, ME-02 |
| ¿Listo para Figma/wireframes? | **Condicional** — ver dictamen |

---

## 18. Dictamen Final

# **B) Requiere ajustes conceptuales**

**Justificación:**

La épica **ACCOUNT_CENTER_V1 es viable y recomendable**. Existe base sólida (sesiones self-service, AuthContext, preferencias locales, contratos auth para seguridad). Sin embargo, **no se puede pasar directamente a diseño UX visual** sin cerrar antes estas decisiones conceptuales:

1. **Naming:** «Mi cuenta» vs «Mi perfil» vs «Centro de cuenta» — y retiro de placeholders (Bandeja, Configuraciones).
2. **Alcance V1:** confirmar read-only perfil; diferir edición hasta contrato BE.
3. **Convivencia Header ↔ Hub:** qué acciones permanecen globales (logout, empresa, atajos tema).
4. **Ubicación módulo:** `features/account` vs extender `features/auth`.
5. **SSO / cambio password:** dependencia posible de campo en `/me`.

Una vez resueltas (workshop corto o spec addendum de 1–2 páginas), el estado pasará a **A) Listo para diseño UX**.

**No aplica C)** — no hay bloqueadores arquitectónicos; el problema es ausencia de hub y placeholders, no deuda técnica insalvable.

---

*Auditoría READ ONLY — ACCOUNT_CENTER_V1 — 2026-06-24.*  
*Evidencia: `Header.tsx`, `MySessionsPage.tsx`, `app-route-tree.tsx`, `AuthContext.tsx`, IAM Sessions FE docs.*
