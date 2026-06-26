# ACCOUNT_CENTER_V1 — Diseño UX/UI

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_UX_DESIGN.md`  
**Épica:** `ACCOUNT_CENTER_V1` (Mi Cuenta)  
**Versión:** 1.0  
**Fecha:** 2026-06-24  
**Tipo:** Diseño UX/UI (contrato de experiencia)  
**Modo:** READ ONLY al crear — sin implementación

**Fuentes obligatorias (alcance cerrado):**

| Documento | Uso en este diseño |
|-----------|-------------------|
| `ACCOUNT_CENTER_V1_SPEC.md` | Funcionalidad, rutas, naming, reutilización |
| `ACCOUNT_CENTER_V1_AUDIT.md` | Estado actual, deuda Header |
| `FRONTEND_AUTH_AUDIT.md` | Flujos auth, gaps UX logout all |
| `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` | Copy errores auth (referencia) |
| `ERP_FRONTEND_STANDARDS_V2.md` | TB-01, SK-01, ES-01, ER-02, UX-06, BR-01…05 |

Este documento **no reemplaza** V2 ni `.cursorrules`. Define **cómo se ve y se comporta** Mi Cuenta; no **cómo se implementa**.

---

## 1. Arquitectura visual del módulo

### 1.1 Concepto

**Mi Cuenta** es un **hub de configuración personal** embebido en el shell ERP (`/app/*`). Visualmente se distingue del módulo operativo por:

- Un **marco propio** (sidebar interna + área de contenido) dentro del layout global existente (Header + sidebar/navbar ERP).
- **Densidad informativa** moderada en Información personal y Preferencias; **densidad de datos** alta en Sesiones (tabla enterprise).
- **Sin H1 en body** (V2 TB-01): la identificación de página la resuelven **breadcrumb global** + **título de sección** en el panel de contenido (nivel visual secundario, no `<h1>`).

### 1.2 Diagrama de composición

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER GLOBAL (existente)                                                  │
│  [Breadcrumb] … [Empresa] [Tema] [Nav mode] [Avatar ▼]                      │
├──────────┬──────────────────────────────────────────────────────────────────┤
│ SIDEBAR  │  MI CUENTA — área principal                                       │
│ ERP      │  ┌──────────────┬───────────────────────────────────────────────┐ │
│ (global) │  │ Nav interna  │  Panel de contenido (sección activa)          │ │
│          │  │ Mi Cuenta    │  ┌─────────────────────────────────────────┐  │ │
│          │  │ · Info pers. │  │ Intro sección (opcional, text-soft)     │  │ │
│          │  │ · Seguridad  │  │ Bloques / form / tabla                    │  │ │
│          │  │ · Sesiones   │  └─────────────────────────────────────────┘  │ │
│          │  │ · Preferenc. │                                               │ │
│          │  └──────────────┴───────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

### 1.3 Principios visuales

| # | Principio | Norma |
|---|-----------|-------|
| P1 | **Desktop First** | Diseño primario ≥1280px; responsive es degradación controlada |
| P2 | **Capa 1 estructural** | Fondos, textos, bordes: tokens semánticos (`bg-page`, `bg-surface`, `text-text-base`, `border-border-base`) |
| P3 | **Capa 2 marca** | Solo CTAs primarios, links activos, focus rings (`bg-brand-primary`, `text-brand-primary`, `focus:ring-brand-primary`) |
| P4 | **Coherencia INV/ORG** | Cards `bg-surface border border-border-base rounded-lg shadow-sm`; toolbars patrón catálogo |
| P5 | **No UUID visible** | V2 E-ME4 — solo labels humanos |
| P6 | **Reutilizar antes de inventar** | Sesiones y dialogs existentes conservan look & feel actual |

---

## 2. Layout Desktop First

### 2.1 Viewport de referencia

| Breakpoint | Rol |
|------------|-----|
| **≥1280px** | Diseño canónico — sidebar interna fija |
| 1024–1279px | Sidebar interna estrecha (solo icono + tooltip) o colapsable |
| <1024px | Fuera de alcance primario V1; ver §14 |

### 2.2 Contenedor Mi Cuenta

| Propiedad | Valor UX |
|-----------|----------|
| Fondo página | `bg-page` (hereda shell ERP) |
| Padding área hub | `p-4` a `p-6` coherente con módulos INV/ORG |
| Altura | Ocupa alto disponible bajo Header (`min-h` flex child del layout) |
| Ancho máximo contenido informativo | ~720px en Información personal, Seguridad (form), Preferencias |
| Ancho Sesiones | **100%** del panel derecho — tabla full width |

### 2.3 Estructura flex

```
AccountCenterShell (flex row, gap-0)
├── AccountCenterSidebar   → width fijo 220px (desktop)
└── AccountCenterContent   → flex-1 min-w-0 overflow-auto
```

### 2.4 Título de sección (cumple TB-01)

- **Prohibido:** `<h1>` en body.
- **Permitido:** encabezado de sección como `<h2>` visual dentro del panel (`text-lg font-semibold text-text-base`) precedido por breadcrumb global.
- **Subtítulo opcional:** una línea `text-sm text-text-soft` bajo el título de sección (descriptivo, no marketing).

---

## 3. Sidebar interna

### 3.1 Anatomía

| Elemento | Especificación |
|----------|----------------|
| Contenedor | `bg-surface border border-border-base rounded-lg` o panel flush left sin doble card — preferir **panel integrado** sin card flotante para reducir ruido |
| Ancho | **220px** fijo (desktop) |
| Header sidebar | Label «Mi cuenta» `text-xs font-semibold uppercase tracking-wide text-text-faint` + separador |
| Items | Lista vertical; icono Lucide 16px + label |

### 3.2 Ítems de navegación (orden fijo)

| Orden | Label | Icono sugerido | Ruta |
|-------|-------|----------------|------|
| 1 | Información personal | `User` | `/app/cuenta/informacion` |
| 2 | Seguridad | `Shield` o `Lock` | `/app/cuenta/seguridad` |
| 3 | Sesiones | `MonitorSmartphone` | `/app/cuenta/sesiones` |
| 4 | Preferencias | `Settings` | `/app/cuenta/preferencias` |

### 3.3 Estados del ítem

| Estado | Visual |
|--------|--------|
| **Default** | `text-text-soft hover:bg-overlay hover:text-text-base` |
| **Activo** | `bg-overlay text-text-base font-medium border-l-2 border-brand-primary` (acento marca en borde izquierdo) |
| **Focus teclado** | `ring-2 ring-brand-primary ring-offset-2` |
| **Disabled** | No aplica en V1 (todas las secciones accesibles salvo guard force-password global) |

### 3.4 Comportamiento

- Click → navegación client-side; actualiza panel derecho y breadcrumb.
- Item activo derivado de ruta actual.
- **No** submenús anidados en V1.

---

## 4. Breadcrumbs

### 4.1 Patrón global (Header existente)

El breadcrumb vive en **Header**, no duplicado dentro del panel Mi Cuenta.

### 4.2 Trail por sección

| Ruta | Breadcrumb |
|------|------------|
| `/app/cuenta/informacion` | Inicio → **Mi cuenta** → Información personal |
| `/app/cuenta/seguridad` | Inicio → **Mi cuenta** → Seguridad |
| `/app/cuenta/sesiones` | Inicio → **Mi cuenta** → Sesiones |
| `/app/cuenta/preferencias` | Inicio → **Mi cuenta** → Preferencias |
| `/app/cuenta` (redirect) | Resuelve como Información personal |

### 4.3 Reglas

- «Mi cuenta» es clickeable → `/app/cuenta/informacion`.
- Último segmento **no** clickeable (página actual).
- Home icon → destino shell ERP (`/app/home` o equivalente `SHELL_HOME_PATH`).
- Si breadcrumb no resuelve automáticamente: mapa estático en extensión de `useShellBreadcrumbs` (decisión implementación — fuera de este doc).

---

## 5. Navegación entre secciones

### 5.1 Flujos primarios

| Origen | Acción | Destino |
|--------|--------|---------|
| Header → «Mi cuenta» | Click | `/app/cuenta/informacion` |
| Header → «Mis sesiones» | Click atajo | `/app/cuenta/sesiones` |
| Sidebar interna | Click ítem | Sección correspondiente |
| Breadcrumb «Mi cuenta» | Click | `/app/cuenta/informacion` |
| Post cambio password éxito | Permanece | `/app/cuenta/seguridad` |
| Post logout all éxito | Redirect | `/login` (fuera del hub) |

### 5.2 Guards UX (sin pantalla intermedia)

| Condición | Experiencia |
|-----------|-------------|
| `requiresPasswordChange` | Usuario **nunca ve** Mi Cuenta; redirect a `/change-password` |
| Impersonación activa | Hub accesible; **logout all oculto/deshabilitado** con mensaje inline si intento |
| Selección empresa pendiente | Hub no accesible (gate ERP estándar) |

### 5.3 Deep linking

Todas las rutas `/app/cuenta/*` son **bookmarkables**. Al cargar directo, sidebar marca ítem activo y breadcrumb correcto.

---

## 6. Jerarquía visual

### 6.1 Niveles tipográficos (panel contenido)

| Nivel | Uso | Estilo semántico |
|-------|-----|------------------|
| L0 | Breadcrumb Header | Existente shell |
| L1 | Título sección | `text-lg font-semibold text-text-base` |
| L2 | Subtítulo / intro | `text-sm text-text-soft` |
| L3 | Título de bloque/card | `text-sm font-medium text-text-base` |
| L4 | Label campo | `text-sm font-medium text-text-soft` |
| L5 | Valor campo | `text-sm text-text-base` |
| L6 | Ayuda / hint | `text-xs text-text-faint` |

### 6.2 Jerarquía de acciones

| Prioridad | Estilo | Ejemplos |
|-----------|--------|----------|
| Primaria | `bg-brand-primary hover:bg-brand-primary-hover` | «Actualizar contraseña», «Guardar» (N/A V1) |
| Secundaria | Borde `border-border-base bg-surface hover:bg-overlay` | «Actualizar listado» sesiones |
| Destructiva | `text-error` / botón danger en dialog | Revocar sesión, logout all |
| Terciaria / link | `text-text-soft underline hover:text-text-base` | Enlace admin sesiones |

### 6.3 Espaciado entre bloques

- Entre secciones lógicas dentro de una pantalla: `space-y-6`.
- Entre campos en formulario: `space-y-4`.
- Padding card: `p-4` sm `p-6`.

---

## 7. Diseño por sección

### 7.1 Información personal

**Objetivo UX:** Tarjeta de identidad consultable; sensación de «ficha de usuario» enterprise, no formulario editable.

**Layout:**

```
[Título: Información personal]
[Subtítulo: Consulta los datos de tu cuenta en este tenant.]

┌─ Card: Identidad ─────────────────────────────────────┐
│  Avatar iniciales (círculo grande) │ Nombre Apellido   │
│                                     │ correo@tenant.com │
│                                     │ Badge tipo usuario│
└───────────────────────────────────────────────────────┘

┌─ Card: Detalles ──────────────────────────────────────┐
│  Grid 2 columnas (desktop)                            │
│  Label / Valor pairs                                  │
│  · Nombre de usuario                                  │
│  · Tenant                                             │
│  · Subdominio (si aplica)                             │
│  · Empresa activa (nombre)                            │
│  · Nivel de acceso                                    │
│  · Estado (badge success)                             │
└───────────────────────────────────────────────────────┘

┌─ Card: Roles ─────────────────────────────────────────┐
│  Lista chips o bullet list de roles (nombres)         │
│  Empty roles: «Sin roles asignados» text-text-soft    │
└───────────────────────────────────────────────────────┘
```

**Avatar V1:** Círculo con iniciales derivadas de nombre/apellido; `bg-brand-primary text-white` — mismo criterio que Header.

**Badge estado cuenta:** `es_activo` → badge semántico `success` «Activa» / `error` «Inactiva» (caso raro en sesión activa).

**Acción opcional V1.1:** Link terciario «Actualizar datos» (refresh) — **no obligatorio V1**.

**Mensaje read-only:** Banner sutil `bg-subtle border border-border-base rounded-md p-3 text-sm text-text-soft` al pie: «Para modificar tus datos de contacto, contacta al administrador de tu organización.»

---

### 7.2 Seguridad

**Objetivo UX:** Dos bloques claramente separados — credenciales y alcance de sesión global.

**Layout:**

```
[Título: Seguridad]
[Subtítulo: Administra tu contraseña y el cierre de sesiones en todos tus dispositivos.]

┌─ Card: Contraseña ────────────────────────────────────┐
│  (Oculto completo si usuario SSO — ver §7.2.1)        │
│  Campos: actual, nueva, confirmar                       │
│  Hint reglas: text-xs text-text-soft                    │
│  [Actualizar contraseña] primary                        │
│  Errores inline bajo campos + toast API                 │
└───────────────────────────────────────────────────────┘

┌─ Card: Sesión global ───────────────────────────────────┐
│  Icono Shield + texto explicativo                       │
│  «Cierra tu sesión en este navegador y en todos los     │
│   demás dispositivos conectados.»                       │
│  [Cerrar sesión en todos los dispositivos] — secondary  │
│    destructive outline o botón danger secundario          │
│  Nota: «Para cerrar solo este dispositivo, use          │
│         Cerrar sesión en el menú superior.» text-faint  │
└─────────────────────────────────────────────────────────┘
```

#### 7.2.1 Estado SSO (condicional)

Si proveedor ≠ local: card Contraseña reemplazada por:

- Icono info + mensaje: «Tu cuenta utiliza inicio de sesión corporativo (SSO). La contraseña se administra externamente.»
- Sin campos password.

#### 7.2.2 Formulario contraseña — campos

| Campo | Tipo | UX |
|-------|------|-----|
| Contraseña actual | password + toggle mostrar | `autoComplete="current-password"` |
| Nueva contraseña | password + toggle | Hint reglas debajo |
| Confirmar | password | Sin toggle obligatorio |

Validación **inline antes de submit** (cliente); errores en banner `text-error bg-error/10` sobre el form.

---

### 7.3 Sesiones

**Objetivo UX:** **Conservar** la experiencia actual de `MySessionsPage`; solo añadir marco hub (sidebar + breadcrumb).

**Layout (sin cambio funcional visual):**

```
[Título: Sesiones]  ← nuevo encabezado sección hub
[Subtítulo: Dispositivos donde has iniciado sesión con tu cuenta.]

┌─ Toolbar (OrgCompanyToolbar existente) ───────────────┐
│  Descriptor: «Sesiones activas de tu cuenta»          │
│  Acciones derecha: [Tabla|Grid] [Refresh]              │
└───────────────────────────────────────────────────────┘

┌─ Card tabla / grid ────────────────────────────────────┐
│  ActiveSessionsTableView | CardsView variant=self      │
└────────────────────────────────────────────────────────┘
```

**Enlace admin (condicional):** Si usuario tiene acceso `/admin/sesiones`, texto bajo subtítulo:

«¿Necesitas administrar sesiones de otros usuarios? [Ir a Sesiones activas (administración)]» — link `text-brand-primary`.

**No** incluir logout all en esta sección (pertenece a Seguridad).

---

### 7.4 Preferencias

**Objetivo UX:** Panel de control de apariencia local; refleja inmediatamente en shell.

**Layout:**

```
[Título: Preferencias]
[Subtítulo: Personaliza la apariencia de la interfaz en este navegador.]

┌─ Card: Apariencia ─────────────────────────────────────┐
│  Tema                                                   │
│  ○ Claro   ○ Oscuro   ○ Sistema (auto)   — radio group  │
│  Descripción Sistema: «Sigue la preferencia del SO.»    │
└─────────────────────────────────────────────────────────┘

┌─ Card: Navegación ──────────────────────────────────────┐
│  Disposición del menú                                   │
│  ○ Barra lateral   ○ Barra superior   — radio group     │
│  Mini preview iconográfico opcional (wireframe simple)  │
└─────────────────────────────────────────────────────────┘

Nota pie: «Estas preferencias se guardan solo en este navegador.»
text-xs text-text-faint
```

**Convivencia Header:** Cambiar aquí actualiza toggles Header instantáneamente; no mostrar warning de sincronización.

**Vista sesiones tabla/grid:** Permanece preferencia local en Sesiones — **no** duplicar en Preferencias V1.

---

## 8. Estados transversales

### 8.1 Loading

| Contexto | Patrón UX | Componente referencia |
|----------|-----------|----------------------|
| Hub inicial / auth gate | Spinner full content area o shell gate existente | `LoadingSpinner` / gate `ProtectedRoute` |
| Información personal | Skeleton cards 2 bloques | Pulse `bg-subtle animate-pulse rounded-lg h-24` |
| Seguridad form idle | Sin skeleton | — |
| Seguridad submit | Botón primary disabled + spinner inline | `Loader` en botón |
| Sesiones carga inicial | `InvTableSkeleton` cols=4 o grid pulse cards | V2 SK-01 |
| Sesiones refresh | Opacity 70% tabla + `aria-busy` | Patrón actual MySessions |
| Preferencias | N/A (instantáneo desde context) | — |
| Logout all pending | Dialog `loading` + Header disabled | `LogoutAllConfirmDialog` |

### 8.2 Empty

| Contexto | Copy título | Copy descripción |
|----------|-------------|------------------|
| Sesiones tabla | «No tienes otras sesiones activas.» | «Cuando inicies sesión en otro dispositivo, aparecerá aquí.» |
| Sesiones grid | Mismo + icono `MonitorSmartphone` | Idem |
| Roles (info personal) | «Sin roles asignados» | — |
| SSO security block | N/A | Mensaje SSO sustituye form |

**Sesiones empty:** MUST `IamTableEmptyState` en tbody (V2 ES-01) para vista tabla.

### 8.3 Error

| Contexto | Visual | Acción |
|----------|--------|--------|
| Sesiones fetch fail | Banner `text-error bg-error/10 p-4 rounded-lg` | Botón «Reintentar» primary |
| Cambio password API | Toast error + field banner si 422 | Usuario corrige y reintenta |
| Logout all fail | Toast error con mensaje API | Dialog permanece abierto hasta cerrar |
| Información personal sin user | Redirect login (no pantalla error dedicada) | — |

### 8.4 Forbidden / blocked

| Contexto | UX |
|----------|-----|
| Force password | No renderiza hub — redirect `/change-password` |
| Impersonación + logout all | Botón oculto o disabled; tooltip/toast: «Finaliza el modo soporte antes de cerrar todas las sesiones.» |
| Logout all + force (edge) | Toast: «Debe cambiar su contraseña antes. Use Cerrar sesión en el menú superior.» |
| Sin acceso admin sesiones | No mostrar enlace admin |

**No** usar pantalla 403 dedicada dentro del hub V1.

### 8.5 Success

| Acción | Feedback |
|--------|----------|
| Cambio password OK | Toast success «Contraseña actualizada correctamente.» — permanece en Seguridad |
| Revoke sesión OK | Toast success (hook existente) — listado refresh |
| Revoke sesión actual | Terminación sesión → redirect login (sin toast success) |
| Logout all OK | Redirect login — sin toast (sesión terminada) |
| Preferencia cambiada | Cambio visual inmediato — toast **opcional** omitido V1 (feedback instantáneo suficiente) |

---

## 9. Confirm dialogs

### 9.1 Inventario V1

| Dialog | Trigger | Variant V2 | Copy confirm |
|--------|---------|------------|--------------|
| **Logout all** | Seguridad o Header | `danger` (UX-06 — irreversible multi-dispositivo) | «Cerrar todas las sesiones» |
| **Revoke sesión remota** | Sesiones fila/card | `danger` | «Cerrar sesión» |
| **Revoke sesión actual** | Sesiones (este dispositivo) | `danger` | «Cerrar esta sesión» |

### 9.2 LogoutAllConfirmDialog (reutilizar)

| Propiedad | Valor |
|-----------|-------|
| Título | «Cerrar sesión en todos los dispositivos» |
| Mensaje | «Se cerrará tu sesión en este navegador y en todos los demás dispositivos donde hayas iniciado sesión. Deberás volver a identificarte.» |
| Confirm | «Cerrar todas las sesiones» |
| Cancel | «Cancelar» |
| Loading | Durante request — botones disabled |

**Regla AP-13 / B11-10:** No abrir ConfirmDialog encima de Radix Dialog detalle. Sesiones: cerrar cualquier modal detalle antes de confirm revoke (V1 self-revoke usa ConfirmDialog directo — patrón actual OK).

### 9.3 Revoke sesión — mensajes

| Caso | Mensaje dialog |
|------|----------------|
| Sesión actual | «¿Cerrar la sesión en este dispositivo? Tendrás que iniciar sesión nuevamente aquí.» |
| Sesión remota | «¿Cerrar esta sesión remota? El dispositivo deberá iniciar sesión nuevamente.» |

---

## 10. Toasts

### 10.1 Norma V2 ER-02

Toast de error API **solo** desde hook/mutation `onError`. Validación cliente pre-submit **puede** toast en componente (ER-03).

### 10.2 Matriz de toasts

| Evento | Tipo | Mensaje | Duración |
|--------|------|---------|----------|
| Password OK | success | «Contraseña actualizada correctamente.» | 3s |
| Password error API | error | `detail` API vía `getErrorMessage` | 5s |
| Validación password cliente | error | Mensaje regla específica | 4s |
| Revoke sesión OK | success | «Sesión cerrada correctamente.» (o copy hook existente) | 3s |
| Revoke error | error | `detail` API | 5s |
| Logout all error | error | Mensaje orientativo según status | 5s |
| Impersonation block logout all | error | «Finaliza el modo soporte…» | 4s |

**Sin toast:** logout simple Header (redirect); logout all éxito; cambio preferencia tema/nav.

---

## 11. Skeletons

| Pantalla | Skeleton | ColSpan / forma |
|----------|----------|-----------------|
| Información personal | 2 cards pulse | Rectángulos altura 120px + 200px |
| Seguridad | Ninguno en idle | — |
| Sesiones tabla | `InvTableSkeleton` | **4 columnas** (`MY_SESSIONS_TABLE_COLSPAN`) |
| Sesiones grid | 2–3 cards pulse `h-48` | Patrón actual |
| Preferencias | Ninguno | — |

V2 SK-01: skeleton debe coincidir con estructura real (colSpan thead sesiones).

---

## 12. Componentes reutilizados

| Componente | Sección | Modificación visual |
|------------|---------|---------------------|
| `MySessionsPage` (contenido) | Sesiones | Solo wrapper hub; contenido intacto |
| `ActiveSessionsTableView` | Sesiones | Ninguna |
| `ActiveSessionsCardsView` | Sesiones | Ninguna |
| `OrgCompanyToolbar` | Sesiones | Ninguna |
| `InvPageLayout` | Sesiones | Anidado en content area |
| `InvTableSkeleton` | Sesiones | Ninguna |
| `IamTableEmptyState` | Sesiones | Ninguna |
| `ConfirmDialog` | Sesiones, Seguridad | Ninguna |
| `LogoutAllConfirmDialog` | Seguridad, Header | Ninguna |
| `ChangePasswordPage` validación/copy | Seguridad | Extraer form — misma UX campos |
| `ThemeContext` / `NavModeContext` | Preferencias | Ninguna |
| Header avatar dropdown | Global | Rewire ítems §15 |

---

## 13. Componentes nuevos (solo UX — sin código)

| Componente conceptual | Responsabilidad |
|----------------------|-----------------|
| `AccountCenterShell` | Layout flex sidebar + outlet |
| `AccountCenterSidebar` | Nav interna 4 ítems |
| `AccountCenterSectionHeader` | Título L1 + subtítulo L2 (no H1) |
| `AccountProfileIdentityCard` | Avatar iniciales + resumen |
| `AccountProfileDetailsGrid` | Label/valor read-only |
| `AccountProfileRolesList` | Chips roles |
| `AccountReadOnlyNotice` | Banner contacto admin |
| `AccountSecurityPasswordCard` | Form cambio voluntario |
| `AccountSecuritySessionGlobalCard` | Copy + CTA logout all |
| `AccountPreferencesAppearanceCard` | Radio tema |
| `AccountPreferencesNavigationCard` | Radio nav mode |
| `AccountAdminSessionsLink` | Enlace condicional admin |

**Total:** ~11 piezas de presentación; **cero** lógica de negocio nueva.

---

## 14. Responsive

### 14.1 Desktop First (≥1280px)

- Sidebar interna visible completa.
- Grid Información personal 2 columnas.
- Tabla sesiones full width con scroll horizontal si necesario.

### 14.2 Tablet (1024–1279px)

- Sidebar colapsa a **iconos + tooltip** o drawer lateral activable por botón «Secciones» en toolbar hub.
- Grid Información personal 1 columna.

### 14.3 Mobile (<1024px)

**V1 — degradación mínima aceptable:**

- Sidebar → **tabs horizontales scrollables** bajo breadcrumb (4 tabs).
- Sesiones: cards preferidas por defecto si viewport estrecho (opcional: respetar preferencia usuario).
- Form Seguridad: campos full width apilados.

**No** objetivo V1: optimización touch completa; ERP desktop es canal primario.

---

## 15. Integración con Header

### 15.1 Dropdown avatar — estado final visual

```
┌─────────────────────────────────┐
│ [Avatar] Nombre Apellido        │
│          correo@…               │
│          [Badge tipo] [Nivel n] │
├─────────────────────────────────┤
│ 🏢 Cliente / subdominio (cond.) │
├─────────────────────────────────┤
│ 👤 Mi cuenta                    │  → /app/cuenta/informacion
│ 📱 Mis sesiones                 │  → /app/cuenta/sesiones
├─────────────────────────────────┤
│ 📱 Cerrar sesión todos…         │  → dialog (condicional)
│ 🚪 Cerrar sesión                │  → logout
└─────────────────────────────────┘
```

**Eliminados:** Mi perfil, Bandeja de entrada, Configuraciones de la cuenta.

### 15.2 Corrección deuda visual Header (recomendado en misma épica)

Migrar dropdown de clases prohibidas (`bg-brand-surface`, `text-brand-text-*`, `border-brand-border`) a tokens Capa 1:

- Panel: `bg-surface border border-border-base shadow-lg`
- Texto: `text-text-base`, `text-text-soft`
- Hover ítems: `hover:bg-overlay`

### 15.3 Toggles barra Header

| Control | Comportamiento |
|---------|----------------|
| Tema | Atajo binario; estado reflejado en Preferencias |
| Modo nav | Atajo toggle; estado reflejado en Preferencias |
| Empresa | Sin cambios — fuera Mi Cuenta |

### 15.4 Bloqueo acciones Header durante operaciones

Cuando `logoutAllPending`: deshabilitar ítems destructivos del dropdown y toggles opcionales — patrón actual `Header.tsx`.

---

## 16. UX de Logout All

### 16.1 Entry points

| Ubicación | Componente visual | Preconfirmación |
|-----------|-------------------|-----------------|
| Header dropdown | Ítem texto + dialog | Sí |
| Seguridad card | Botón/CTA secundario destructive | Sí — **mismo dialog** |

### 16.2 Flujo

```
Usuario click CTA
  → LogoutAllConfirmDialog opens (variant danger)
  → Usuario confirma
  → Loading en dialog
  → Éxito: redirect /login (sin hub visible)
  → Error: toast + dialog cerrable
```

### 16.3 Visibilidad condicional

Ocultar ítem Header y CTA Seguridad cuando:

- Impersonación activa
- `requiereSeleccionEmpresa`
- `requiresPasswordChange`
- Flag `SESSION_LOGOUT_V3_ENABLED` off (rollback técnico — ocultar ambos)

### 16.4 Copy informativo en Seguridad

Texto bajo CTA (siempre visible si CTA visible):

«Esta acción cerrará todas tus sesiones activas, incluida la de este navegador.»

---

## 17. UX de Cambio voluntario de contraseña

### 17.1 Diferenciación vs force flow

| Aspecto | Force `/change-password` | Voluntario `/app/cuenta/seguridad` |
|---------|------------------------|-----------------------------------|
| Layout | Auth standalone centrado | Hub ERP + card Seguridad |
| Branding login | LoginBrandingHeader | Shell ERP tenant |
| Gate | Bloquea ERP | No |
| Logout link | Sí en página auth | No — referencia Header |
| Campos | Idénticos | Idénticos |
| Validación | Idéntica | Idéntica |
| Éxito | Navegación post-login path | Toast + permanece en Seguridad |

**No** unificar pantallas — solo **paridad de formulario**.

### 17.2 Flujo éxito

1. Usuario completa form → submit.
2. Botón loading «Actualizando…».
3. Toast success.
4. Form **limpia** campos password (seguridad — no dejar valores en DOM).
5. Usuario permanece en Seguridad.

### 17.3 Flujo error

| Error | UX |
|-------|-----|
| 401 contraseña actual incorrecta | Banner campo + toast |
| 400 SSO / misma password | Banner + toast con `detail` |
| 422 validación | Mensajes Pydantic concatenados |
| Red | Toast genérico conexión |

### 17.4 Accesibilidad form

- Labels visibles (no solo placeholder).
- `aria-invalid` + `role="alert"` en errores.
- Toggle mostrar password con `aria-label` «Mostrar» / «Ocultar».

---

## 18. UX de Sesiones

### 18.1 Preservación integral

La UX de Sesiones **es** la de `MySessionsPage` certificada en IAM Sessions FE. Cambios permitidos V1:

- Añadir `AccountCenterSectionHeader` arriba del toolbar existente.
- Añadir enlace admin condicional bajo subtítulo.
- Envolver en `AccountCenterShell`.

**Prohibido:** Rediseñar columnas, cambiar copy revoke, alterar toggle tabla/grid.

### 18.2 Identificación sesión actual

Conservar indicador visual existente en fila/card «Esta sesión» / badge current — sin UUID.

### 18.3 Acciones por fila

| Acción | Label | Estilo |
|--------|-------|--------|
| Revocar remota | «Cerrar sesión» | Botón ghost/error |
| Revocar actual | «Cerrar esta sesión» | Idem |

### 18.4 Toolbar

Mantener disposición: descriptor izquierda (OrgCompanyToolbar children), acciones derecha (view toggle + refresh). Iconos `List` / `Grid3x3` con estado activo `bg-brand-primary text-white`.

---

## 19. Reglas visuales

### 19.1 Tokens Capa 1 (estructura) — MUST

| Elemento | Clases semánticas |
|----------|-------------------|
| Fondo página hub | `bg-page` |
| Cards / panels | `bg-surface border border-border-base rounded-lg shadow-sm` |
| Sidebar panel | `bg-surface border-r border-border-base` |
| Texto principal | `text-text-base` |
| Texto secundario | `text-text-soft` |
| Texto hint | `text-text-faint` |
| Bordes | `border-border-base` |
| Hover filas/menú | `hover:bg-overlay` |
| Fondo alterno/header tabla | `bg-subtle` |
| Error | `text-error bg-error/10` |
| Success badge | `text-success bg-success/10` |
| Warning | `text-warning bg-warning/10` |

### 19.2 Tokens Capa 2 (marca) — MUST

| Elemento | Clases |
|----------|--------|
| Botón primario | `bg-brand-primary hover:bg-brand-primary-hover text-white` |
| Item nav activo acento | `border-brand-primary` |
| Link acción | `text-brand-primary hover:underline` |
| Focus inputs | `focus:ring-brand-primary` |
| Toggle vista activo sesiones | `bg-brand-primary text-white` |

### 19.3 Prohibiciones (V2 BR-05 + .cursorrules)

- **NO** `bg-white`, `bg-gray-*`, `bg-slate-*` en estructura.
- **NO** `bg-brand-surface`, `border-brand-border`, `text-brand-text-*` en Mi Cuenta ni dropdown Header corregido.
- **NO** mostrar UUID en UI.
- **NO** H1 en body (TB-01).
- **NO** loader full-page ocultando tabla en Sesiones (SK-01).

### 19.4 Iconografía

- Librería: Lucide (consistente con Header e IAM Sessions).
- Tamaño nav sidebar: 16px (`h-4 w-4`).
- Tamaño empty state sesiones: 48px (`h-12 w-12 text-text-soft`).

### 19.5 Motion

- Transiciones hover/opacidad: `transition-colors duration-150`.
- Refresh sesiones: `opacity-70` + spinner icon — sin animaciones elaboradas.

---

## 20. Recomendaciones UX

### 20.1 Prioridad implementación visual

1. Shell + sidebar + breadcrumbs (marco).
2. Información personal (landing default).
3. Header rewire + corrección tokens dropdown.
4. Seguridad (form + logout all card).
5. Sesiones (integración wrapper mínima).
6. Preferencias.

### 20.2 Copy bank (español — canónico V1)

| Key | Texto |
|-----|-------|
| `nav.account` | Mi cuenta |
| `nav.personal_info` | Información personal |
| `nav.security` | Seguridad |
| `nav.sessions` | Sesiones |
| `nav.preferences` | Preferencias |
| `header.my_account` | Mi cuenta |
| `header.my_sessions` | Mis sesiones |
| `info.read_only_notice` | Para modificar tus datos de contacto, contacta al administrador de tu organización. |
| `security.logout_current_hint` | Para cerrar solo este dispositivo, use Cerrar sesión en el menú superior. |
| `preferences.local_notice` | Estas preferencias se guardan solo en este navegador. |
| `sso.password_unavailable` | Tu cuenta utiliza inicio de sesión corporativo (SSO). La contraseña se administra externamente. |

### 20.3 Accesibilidad mínima V1

- Navegación sidebar: `aria-current="page"` en ítem activo.
- Dialogs: focus trap existente en `ConfirmDialog`.
- Contraste: tokens semánticos cumplen dark mode automático.
- Teclado: todos los CTAs alcanzables por tab order lógico (sidebar → contenido).

### 20.4 Evolución UX post-V1

- Avatar upload con crop.
- Historial de accesos en Seguridad.
- Preview en vivo tema split-pane.
- Mi Cuenta accesible desde shell `/admin`.

### 20.5 Anti-patrones a evitar

- Modal fullscreen Mi Cuenta desde avatar.
- Duplicar logout simple dentro del hub.
- Tabs horizontales como patrón primario en desktop.
- Formulario edición perfil «deshabilitado» que confunda (mejor read-only claro).
- Segunda implementación de tabla sesiones con estilos distintos.

---

## 21. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Es documento exclusivamente UX/UI? | **Sí** |
| ¿Contiene código React/TS/CSS/Tailwind implementable? | **No** — solo referencias semánticas a tokens existentes |
| ¿Contiene plan técnico o rutas de archivos implementación? | **No** |
| ¿Modifica alcance funcional SPEC? | **No** — consume SPEC cerrado |
| ¿Define wireframes Figma? | **No** — wireframes ASCII conceptuales |
| ¿Cubre 20 puntos solicitados? | **Sí** (§1–§20 + integración Header/auth) |
| ¿Alineado V2? | **Sí** — TB-01, SK-01, ES-01, ER-02, UX-06, BR-01…05 |
| ¿Desktop First? | **Sí** |
| ¿Preserva UX MySessions? | **Sí** — §18 |

---

## 22. Dictamen final

# **A) Diseño UX aprobado y listo para Implementation Plan**

**Justificación:**

El diseño cierra la capa de experiencia pendiente tras `ACCOUNT_CENTER_V1_SPEC.md`: arquitectura visual hub + sidebar, estados transversales, convivencia Header, paridad formularios auth, preservación integral Sesiones y reglas visuales V2/tokens. No quedan decisiones UX bloqueantes para elaborar el **Implementation Plan técnico** (fases, archivos, tareas).

**Handoff Implementation Plan debe referenciar:**

1. Componentes nuevos §13 vs reutilizados §12.
2. Copy bank §20.2.
3. Matrices estados §8, toasts §10, dialogs §9.
4. Corrección visual Header §15.2 como tarea opcional acoplada.
5. Criterios de no-regresión Sesiones §18.1.

---

*Diseño UX ACCOUNT_CENTER_V1 — 2026-06-24.*  
*Funcionalidad: ACCOUNT_CENTER_V1_SPEC.md v1.0 (aprobada).*
