# FRONTEND — Active Sessions Enterprise UX Design

**Documento:** `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN.md`  
**Versión:** 1.0  
**Fecha:** 2026-06-23  
**Estado:** **DISEÑO — READ ONLY (sin implementación)**  
**Audiencia:** Producto, UX, Frontend IAM, QA

**Entradas normativas:**

| Documento | Rol |
|-----------|-----|
| `AUDITORIA_FE_SESSIONS_ADMIN_ENTERPRISE-01.md` | Auditoría oficial Backend (referenciada por negocio; contrato considerado definitivo) |
| `BACKEND_PLATFORM_API_CONTRACT_V2.md` §1d | `GET /api/v1/auth/sessions/admin/` — params, envelope, whitelist sort |
| `ERP-IAM-SESSIONS-API-CONTRACT-V1.md` | DTOs `AdminSessionRead`, `SessionDeviceRead`, semántica campos |
| `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` | Semántica V2 (`session_id`, `login_ip`, `last_business_activity_at`, `status`) |
| `ERP_FRONTEND_STANDARDS_V2.md` §5, §9.1 | Plantilla Admin IAM, listado Tier C, tokens Capa 1 / brand Capa 2 |
| Código actual | `ActiveSessionsPage`, `ActiveSessionsTableView`, `ActiveSessionsCardsView` |

**Restricciones explícitas:** sin cambios Backend · sin cambios OpenAPI · sin código en este ticket.

---

## 0. Resumen ejecutivo

La pantalla **Sesiones Activas** admin cumple funcionalmente el contrato IAM V2, pero su **densidad informativa** (10 columnas visibles, fechas absolutas repetidas, dispositivo/navegador/tipo redundantes) provoca **scroll horizontal** y fatiga cognitiva en tenants con cientos de sesiones concurrentes.

**Propuesta:** una **vista única tipo tabla responsive** (eliminar dualidad tabla/cards en desktop), **6 columnas operativas**, **panel lateral (Drawer) de detalle** para auditoría forense, **franja KPI** alimentada solo con datos del endpoint existente, y **filtros enterprise** que respeten la whitelist server-side.

**Orden predeterminado recomendado:** `last_used_at DESC` (legacy BE — sesiones con refresh más reciente primero). Preset alternativo: «Próximas a expirar» → `expires_at ASC`.

**Decisión vista Cards vs Tabla:** la tabla condensada **reemplaza** a las cards en viewports ≥ `md`; cards solo como fallback móvil opcional en Fase 4 o eliminación total si la tabla stacked es suficiente.

---

## 1. Contexto operativo — administrador ERP multiempresa

Un administrador de tenant con **decenas de empresas** y **cientos de usuarios** usa esta pantalla para:

| Necesidad | Prioridad | Implicación UX |
|-----------|-----------|----------------|
| Identificar **quién** está conectado y **en qué empresa** opera | P0 | Usuario + empresa en columna principal; nunca UUID |
| Detectar sesiones **anómalas** (IP distinta, múltiples dispositivos) | P0 | IP visible; detalle login vs última IP en Drawer |
| **Revocar** rápido una sesión comprometida | P0 | Acción primaria en fila; confirmación destructiva |
| Ver **caducidad** y sesiones «expira pronto» | P1 | Badge + tiempo relativo; preset sort |
| Auditar **dispositivo/navegador** sin parsear UA en FE | P1 | `device.*` del BE; UA crudo solo en Drawer admin |
| Monitorear **volumen** web vs mobile | P2 | KPIs vía queries paralelas con `client_type` |
| Buscar por login, nombre o IP | P0 | `search` server-side existente |

**Lo que el admin NO necesita en la grilla:** timestamps absolutos duplicados, `user_agent` crudo, `token_id`/`session_id`, duración en segundos crudos, tres columnas que describen el mismo dispositivo.

---

## 2. Inventario de datos disponibles (`AdminSessionRead`)

Campos consumibles **sin inventar** (superset V2 tolerado):

| Grupo | Campos | Uso propuesto |
|-------|--------|---------------|
| Identidad usuario | `nombre_usuario`, `nombre`, `apellido`, `usuario_id` | Columna principal; filtro `usuario_id` |
| Contexto ERP | `empresa_nombre`, `empresa_id` | Subtítulo columna usuario (display nombre) |
| Sesión | `session_id`, `token_id`, `status`, `is_current`, `duration_seconds` | Drawer; marker «Tu sesión» si `isCurrentSession` |
| Temporal | `issued_at`/`created_at`, `last_refresh_at`/`last_used_at`, `expires_at`, `last_business_activity_at?` | Relativo en tabla; absoluto en Drawer |
| Red | `device.ip_address`, `login_ip?`, `ip_address` (alias) | Columna IP; contraste login vs last seen en Drawer |
| Dispositivo | `device.device_label`, `device.browser`, `device.os`, `device.platform`, `device.client_type`, `client_type` | Columna dispositivo condensada |
| Admin diagnóstico | `user_agent` | Solo Drawer — prohibido parsear (contrato §9) |
| Revocación | `POST …/revoke_admin/` | Acción fila — sin cambio contrato |

**Params query disponibles:** `page`, `limit`, `search`, `sort_by`, `sort_order`, `client_type`, `usuario_id`.

**Params NO disponibles (limitación BE congelada):** filtro por `empresa_id`, filtro por `status`, filtro por `platform`, endpoint KPI agregado.

---

## 3. Diagnóstico — estado actual (Actual)

### 3.1 Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Toolbar: [Tabla|Cards] [Auto/Manual] [Refresh] | Búsqueda | Tipo cliente │
├─────────────────────────────────────────────────────────────────────────┤
│ Tabla 10 cols (overflow-x-auto)  O  Grid 3 cols cards                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ErpPagination                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Columnas tabla admin actual

| # | Columna | Sort server | Problema |
|---|---------|-------------|----------|
| 1 | Usuario (+ nombre completo) | `nombre_usuario` | OK — ancla visual |
| 2 | Empresa | No | Ocupa ancho; no searchable server-side |
| 3 | Tipo cliente | `client_type` | Redundante con dispositivo |
| 4 | Dispositivo (`device_label`) | — | OK |
| 5 | Navegador (`browser · os`) | — | Redundante con `device_label` |
| 6 | Última IP | — | OK |
| 7 | Emitida | `created_at` | Fecha absoluta — poco escaneable |
| 8 | Último refresh | `last_used_at` | Fecha absoluta — confundible con «actividad ERP» |
| 9 | Expira + badge | `expires_at` | Dos líneas por celda |
| 10 | Acciones (texto + icono) | — | Ancho extra |

**Causa del scroll horizontal:** 10 columnas × `px-6` × `whitespace-nowrap` × fechas localizadas largas ≈ **> 1400 px** mínimo.

### 3.3 Gaps UX actuales

| ID | Gap | Severidad |
|----|-----|-----------|
| UX-G1 | Sin KPIs de volumen tenant | P1 |
| UX-G2 | Sin Drawer — toda la info forzada en grilla | P0 |
| UX-G3 | Tres columnas dispositivo/tipo/navegador | P0 |
| UX-G4 | Fechas absolutas sin tiempo relativo | P1 |
| UX-G5 | Filtro `usuario_id` en contrato pero no expuesto | P1 |
| UX-G6 | `last_business_activity_at` V2 no mostrado | P2 |
| UX-G7 | Dual vista tabla/cards duplica mantenimiento | P2 |
| UX-G8 | Auto-refresh off por defecto; sin «Actualizado hace…» | P2 |
| UX-G9 | Búsqueda no incluye `empresa_nombre` (whitelist BE) | P2 — documentar |

---

## 4. Diseño propuesto (Propuesta)

### 4.1 Principios

1. **Escaneo en 3 segundos:** quién · dónde (empresa) · desde dónde (IP/dispositivo) · qué tan reciente · riesgo caducidad.
2. **Progressive disclosure:** forense en Drawer; grilla solo operativa.
3. **Cero UUID visible** (V2 E-ME4).
4. **Server-driven:** sort/filtros/paginación BE; KPIs derivados de `total` del envelope sin full-load.
5. **Una vista canónica** en desktop; responsive stacked rows en móvil.

### 4.2 Franja KPI (parte superior)

Queries **paralelas ligeras** (mismo endpoint, `page=1&limit=1` — solo se usa `total_sesiones`/`total`):

| KPI | Fuente | Precisión |
|-----|--------|-----------|
| **Sesiones activas** | Sin filtro → `total` envelope | Exacta tenant-wide |
| **Web** | `client_type=web&page=1&limit=1` → `total` | Exacta |
| **Mobile** | `client_type=mobile&page=1&limit=1` → `total` | Exacta |
| **Expira pronto** | `page=1&limit=100&sort_by=expires_at&sort_order=asc` → contar `status === 'expiring_soon'` en items | **Cota inferior** si >100; mostrar «100+» con tooltip explicativo |

**Comportamiento KPI clickeable:**

| KPI | Acción al click |
|-----|-----------------|
| Sesiones activas | Reset filtros |
| Web / Mobile | Activa filtro `client_type` correspondiente |
| Expira pronto | Aplica preset sort `expires_at ASC` + scroll a tabla |

**Meta línea secundaria:** «Actualizado hace 2 min» + botón refresh (toolbar existente).

> **Nota:** sin endpoint stats dedicado, «Expira pronto» es la única KPI con aproximación. Es aceptable enterprise como **indicador de alerta**, no como cifra contable.

### 4.3 Toolbar — filtros enterprise

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar usuario, nombre o IP…]  [Usuario ▼]  [Tipo ▼]  [Presets ▼] │
│                                                    [↻ Actualizado 14:32] │
└──────────────────────────────────────────────────────────────────────────┘
```

| Control | Tipo | Param BE | Notas |
|---------|------|----------|-------|
| Búsqueda | `OrgToolbarSearch` + debounce 350 ms | `search` | Placeholder: «Usuario, nombre o IP…» |
| Usuario | Combobox async (IAM users) | `usuario_id` | Ver sesiones de un empleado concreto |
| Tipo cliente | Select / chips | `client_type` | Todos · Web · Mobile |
| Presets | Dropdown | sort + order | «Más recientes» (`last_used_at desc`, default) · «Próximas a expirar» (`expires_at asc`) · «Recién emitidas» (`created_at desc`) |
| Auto-refresh | Toggle | invalidate RQ | Default **ON** 60 s admin (ajuste desde 30 s actual); indicador visual |

**Filtros NO implementables sin BE:** empresa, plataforma (`desktop`/`tablet`), estado `expiring_soon` server-side.

**Workaround empresa:** mostrar `empresa_nombre` prominente; admin filtra mentalmente o busca por usuario conocido de esa empresa.

### 4.4 Tabla condensada — 6 columnas

| # | Columna | Contenido | Sort BE | Ancho |
|---|---------|-----------|---------|-------|
| 1 | **Usuario** | `nombre_usuario` bold · `{nombre} {apellido}` muted · `empresa_nombre` truncada · `SessionCurrentMarker` si es sesión del admin | `nombre_usuario` | ~22% |
| 2 | **Cliente** | Icono platform + badge `Web`/`Mobile` + `device.device_label` truncado (1 línea) | `client_type` | ~20% |
| 3 | **IP** | `last_seen_ip` / `device.ip_address` · icono ⚠ si `login_ip` ≠ last seen (Drawer explica) | `ip_address` | ~12% |
| 4 | **Actividad** | Relativo: «Hace 12 min» desde `last_refresh_at`; fallback «Sin refresh» | `last_used_at` | ~14% |
| 5 | **Vigencia** | Relativo: «Expira en 2 h» / «Hace 3 días» + `SessionStatusBadge` | `expires_at` | ~16% |
| 6 | **Acciones** | Icono `LogOut` + menú `⋯` (Ver detalle · Revocar) | — | ~8% |

**Eliminación scroll horizontal:**

- Quitar `whitespace-nowrap` global; permitir wrap controlado en columnas 1–2.
- Reducir padding horizontal `px-6` → `px-4` en tbody.
- Fechas absolutas **solo** en Drawer.
- Acción revocar: icono en desktop; texto en tooltip/`aria-label`.
- Tabla `table-fixed` + `w-full` con `%` columnas; contenedor **sin** `overflow-x-auto` en viewports ≥ `lg`.

### 4.5 Drawer — detalle de sesión

Apertura: click fila · «Ver detalle» en menú acciones · **no** revocar al click fila.

```
┌─────────────────────────────────────┐
│ Detalle de sesión              [✕]  │
├─────────────────────────────────────┤
│ [Avatar placeholder]                │
│ juan.perez                          │
│ Juan Pérez                          │
│ Empresa: ACME Colombia SAS          │
│ [Activa] o [Expira pronto]          │
├─────────────────────────────────────┤
│ DISPOSITIVO                         │
│ Chrome 120 · Windows · desktop      │
│ Etiqueta: Chrome 120 en Windows     │
│ Tipo: Web                           │
├─────────────────────────────────────┤
│ RED                                 │
│ IP última conexión: 181.49.x.x      │
│ IP inicio sesión:   190.25.x.x      │  ← login_ip V2 si presente
├─────────────────────────────────────┤
│ TIEMPOS                             │
│ Inicio sesión:    18/06/2026 10:00  │  ← issued_at
│ Último refresh:   21/06/2026 08:30  │
│ Última act. ERP:  21/06/2026 08:25  │  ← last_business_activity_at (si null: «—» + nota)
│ Expira:           25/06/2026 10:00  │
│ Duración:         3 días 2 h        │  ← duration_seconds formateado
├─────────────────────────────────────┤
│ DIAGNÓSTICO (solo admin)            │
│ User-Agent: [texto monospace scroll]│  ← user_agent literal, copiable
├─────────────────────────────────────┤
│ [Revocar sesión]  (danger)          │
└─────────────────────────────────────┘
```

**Reglas Drawer:**

- Nunca mostrar `token_id`, `session_id`, `usuario_id`, `cliente_id`, `empresa_id`.
- `user_agent` **literal** — prohibido parsear (alineado contrato).
- Nota UX bajo «Último refresh»: *«Indica último refresh de token, no actividad en pantallas ERP.»*
- Nota bajo «Última act. ERP»: *«Actualización aproximada (throttle backend ~5 min). No cierra sesión.»*

### 4.6 Formato tiempo relativo (tabla)

| Condición | Copy |
|-----------|------|
| < 1 min | «Ahora» |
| < 60 min | «Hace N min» |
| < 24 h | «Hace N h» |
| < 7 d | «Hace N días» |
| ≥ 7 d | Fecha corta `dd/MM` |
| Futuro (expires) | «Expira en N h» / «Expira en N días» / «Expirada» si pasada |
| null refresh | «Sin refresh» |

Tooltip en hover muestra datetime absoluto (`Intl` es-ES).

### 4.7 Badges e iconografía

| Elemento | Regla |
|----------|-------|
| `SessionStatusBadge` | Mantener — consume `status` BE |
| Tipo cliente | Chip compacto: `Web` (Monitor/info) · `Mobile` (Smartphone/success) |
| Platform | Icono en columna Cliente — reutilizar `SessionDeviceCell` |
| IP mismatch | Icono `AlertTriangle` warning si `login_ip` presente y ≠ last seen |
| Sesión actual admin | `SessionCurrentMarker` — borde fila existente |
| Múltiples sesiones mismo usuario | **No detectable en página** sin agrupación — Fase 3 opcional: agrupar client-side en página actual |

### 4.8 Orden predeterminado

| Contexto | `sort_by` | `sort_order` | Justificación |
|----------|-----------|--------------|---------------|
| **Default landing** | *(omitir — BE legacy)* | — | BE aplica `last_used_at DESC, token_id ASC` |
| Preset «Más recientes» | `last_used_at` | `desc` | Explícito en UI |
| Preset «Próximas a expirar» | `expires_at` | `asc` | Operaciones seguridad / offboarding |
| Preset «Recién conectadas» | `created_at` | `desc` | Onboarding / soporte |

**Recomendación:** no enviar `sort_by` en carga inicial (compat legacy documentada); presets sí envían par explícito.

### 4.9 Vista Cards vs Tabla — decisión

| Criterio | Tabla condensada | Cards grid |
|----------|------------------|------------|
| 100+ sesiones paginadas | ✅ Escaneo denso | ❌ Scroll vertical excesivo |
| Sort server columnas | ✅ | ❌ |
| Acción revocar masiva | ✅ Patrón fila | ⚠️ |
| Móvil | ⚠️ Requiere stacked | ✅ Natural |
| Mantenimiento doble | — | ❌ Coste duplicado |

**Decisión:** **Tabla única canónica** en `md+`. En `< md`, **filas apiladas** (misma data, layout block por sesión — no grid 3 columnas). **Eliminar toggle Tabla/Cards** en Fase 4.

Cards actuales pueden servir como referencia de contenido del Drawer, no como vista paralela.

---

## 5. Wireframe funcional

### 5.1 Desktop (≥ 1280 px) — vista principal

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  SESIONES ACTIVAS (título sidebar — sin H1 body, TB-01)                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────────┐            ║
║  │    247     │ │    198     │ │     49     │ │   12  (100+)    │            ║
║  │  Activas   │ │    Web     │ │  Mobile    │ │ Expira pronto   │            ║
║  └────────────┘ └────────────┘ └────────────┘ └─────────────────┘            ║
║  Actualizado hace 1 min                              [Auto ON ●] [↻]         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [🔍 Buscar usuario, nombre o IP…________________] [Usuario ▼] [Tipo ▼]      ║
║  [Presets: Más recientes ▼]                                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Usuario          │ Cliente           │ IP          │ Actividad │ Vigencia │⋯║
║  ─────────────────┼───────────────────┼─────────────┼───────────┼──────────┼─║
║  juan.perez       │ 🖥 Web            │ 181.49.x.x  │ Hace 5m   │ En 2d    │⋯║
║  Juan Pérez       │ Chrome·Windows    │             │           │ [Activa] │  ║
║  ACME Colombia    │                   │             │           │          │  ║
║  ─────────────────┼───────────────────┼─────────────┼───────────┼──────────┼─║
║  maria.gomez  ★   │ 📱 Mobile         │ 10.0.0.5 ⚠  │ Hace 2h   │ En 3h    │⋯║
║  María Gómez      │ App·Android       │             │           │[Exp.pronto│ ║
║  ACME México      │                   │             │           │          │  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Mostrando 1–25 de 247    [10 ▼] [◀ 1 2 3 … 10 ▶]                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

                                    ┌─────────────────────────┐
                                    │ DETALLE SESIÓN       ✕  │
                                    │ (Drawer 400px derecha)  │
                                    │ … ver §4.5              │
                                    └─────────────────────────┘
```

### 5.2 Mobile (< 768 px) — fila apilada

```
┌──────────────────────────────┐
│ juan.perez · ACME Colombia   │
│ 🖥 Web · Chrome en Windows   │
│ 181.49.x.x · Hace 5m         │
│ Expira en 2d · [Activa]      │
│ [Ver detalle]  [Revocar]     │
└──────────────────────────────┘
```

### 5.3 Flujo revocación (sin cambio contrato)

```
Click Revocar → ConfirmDialog danger
  → POST /auth/sessions/{id}/revoke_admin/
  → toast éxito → invalidate list
  → si sesión propia admin → runSessionValidityProbe (existente)
```

---

## 6. Tabla Actual vs Propuesta

| Aspecto | Actual | Propuesta | Justificación |
|---------|--------|-----------|---------------|
| **Columnas visibles** | 10 | 6 + Drawer | Elimina scroll; progressive disclosure |
| **Empresa** | Columna dedicada | Subtítulo bajo usuario | Multiempresa visible sin ancho extra |
| **Tipo + Dispositivo + Navegador** | 3 columnas | 1 columna «Cliente» | `device_label` ya sintetiza BE |
| **Emitida + Refresh + Expira** | 3 cols fechas absolutas | Actividad + Vigencia relativas | Escaneo temporal rápido |
| **IP** | Columna plana | Columna + alerta mismatch | Seguridad sin Drawer obligatorio |
| **user_agent** | No mostrado | Drawer diagnóstico | Admin forense; contrato admin-only |
| **login_ip / last_business** | No mostrado | Drawer | Campos V2 ya en DTO |
| **KPIs superiores** | Ninguno | 4 tiles + timestamp | Volumen tenant sin full-load |
| **Filtro usuario** | No UI | Combobox → `usuario_id` | Param BE existente |
| **Presets orden** | Sort por click header | Presets + headers sortables | Descubribilidad enterprise |
| **Vista Cards** | Toggle grid 3 cols | Eliminar (Fase 4) | Una fuente verdad |
| **Auto-refresh** | Off default, 30 s | On default, 60 s + indicador | Monitoreo admin |
| **Scroll horizontal** | `overflow-x-auto` | `table-fixed` sin overflow lg+ | Objetivo explícito |
| **Click fila** | No | Abre Drawer (no revoke) | Patrón B-L hub §6.3 — solo detalle |
| **Paginación** | ErpPagination 10/25/50 | Igual | Tier C §5.11 — sin cambio |
| **Búsqueda por empresa** | No (BE) | No — tooltip limitación | Fuera alcance sin BE |

---

## 7. Lista priorizada de mejoras UX

| Pri | ID | Mejora | Impacto | Esfuerzo | Fase |
|-----|-----|--------|---------|----------|------|
| **P0** | UX-01 | Condensar tabla 6 columnas | Alto — elimina scroll | M | 1 |
| **P0** | UX-02 | Drawer detalle sesión | Alto — forense + alivia grilla | M | 2 |
| **P0** | UX-03 | Tiempo relativo + tooltip absoluto | Alto — escaneo | S | 1 |
| **P1** | UX-04 | Franja KPI (total, web, mobile) | Alto — situational awareness | M | 1 |
| **P1** | UX-05 | Filtro usuario (`usuario_id`) | Alto — soporte multiempresa | M | 3 |
| **P1** | UX-06 | Presets orden (expira pronto) | Medio — operaciones seguridad | S | 3 |
| **P1** | UX-07 | KPI «Expira pronto» (cota) | Medio — alerta | S | 1 |
| **P1** | UX-08 | Alerta IP login ≠ last seen | Medio — detección anomalía | S | 2 |
| **P2** | UX-09 | Auto-refresh ON + «Actualizado hace…» | Medio — monitoreo | S | 3 |
| **P2** | UX-10 | Mostrar `last_business_activity_at` Drawer | Medio — claridad V2 | S | 2 |
| **P2** | UX-11 | Eliminar toggle Cards | Medio — deuda mantenimiento | M | 4 |
| **P2** | UX-12 | Filas stacked móvil | Medio — responsive | M | 4 |
| **P3** | UX-13 | Agrupación visual mismo usuario (página) | Bajo | M | 5 |
| **P3** | UX-14 | Copiar UA al portapapeles | Bajo | S | 5 |
| **P3** | UX-15 | Nota limitación búsqueda sin empresa | Bajo | S | 1 |

**Leyenda esfuerzo:** S = 1–2 d · M = 3–5 d · L = >1 semana

---

## 8. Plan de implementación por fases (sin código)

### Fase 1 — Fundación escaneable (P0/P1 core)

**Objetivo:** tabla condensada sin scroll + KPIs + tiempo relativo.

| Entregable | Criterio done |
|------------|---------------|
| Util `formatSessionRelativeTime` | Unit tests es-ES; pasado/futuro/null |
| Refactor `ActiveSessionsTableView` 6 cols | Sin `overflow-x` en lg; tests enterprise actualizados |
| Componente `ActiveSessionsKpiStrip` | 3 queries paralelas `limit=1`; loading skeleton |
| KPI expira pronto (cota) | Tooltip «conteo parcial si >100» |
| Nota footer búsqueda empresa | Texto `text-text-faint` bajo toolbar |
| QA visual | 1280 / 1024 / 768 px — 0 scroll horizontal tabla |

**Fuera de alcance Fase 1:** Drawer, filtro usuario, eliminar cards.

---

### Fase 2 — Drawer forense (P0/P1)

**Objetivo:** progressive disclosure completa.

| Entregable | Criterio done |
|------------|---------------|
| `SessionDetailDrawer` | Secciones §4.5; RBAC admin only |
| Apertura fila + menú ⋯ | No revoke en click fila |
| IP mismatch indicator | Solo si `login_ip` presente en DTO |
| `user_agent` monospace scroll | Sin parseo; copiable Fase 5 |
| ConfirmDialog revoke desde Drawer | Mismo flujo `useRevokeSession` |
| Tests | Drawer render admin fields; no UUID visible |

---

### Fase 3 — Filtros enterprise (P1/P2)

**Objetivo:** explotar params BE restantes.

| Entregable | Criterio done |
|------------|---------------|
| Combobox usuario → `usuario_id` | Reutilizar patrón IAM user search |
| Presets sort dropdown | Reset page=1 al cambiar |
| Auto-refresh default ON 60 s | Toggle persiste localStorage |
| Timestamp «Actualizado hace…» | Deriva de `dataUpdatedAt` RQ |

---

### Fase 4 — Unificación vista (P2)

**Objetivo:** eliminar dualidad tabla/cards.

| Entregable | Criterio done |
|------------|---------------|
| Remover toggle Tabla/Cards | localStorage key deprecada |
| `ActiveSessionsStackedRow` móvil | `< md` breakpoint |
| Deprecar `ActiveSessionsCardsView` admin | Comentario deprecated; mantener variant=self si MySessions lo usa |
| Regresión MySessions | variant=self sin regresión |

---

### Fase 5 — Pulido enterprise (P3)

**Objetivo:** nice-to-have post-estabilización.

| Entregable | Criterio done |
|------------|---------------|
| Agrupación visual por `usuario_id` en página | Borde sutil grupos 2+ sesiones |
| Copiar UA / IP | Botón icon clipboard |
| Accesibilidad audit | WCAG focus trap Drawer; sort aria |

---

## 9. Alineación normativa V2

| Regla | Cumplimiento propuesta |
|-------|------------------------|
| TB-01 sin H1 body | ✅ Toolbar first |
| ES-01 / SK-01 | ✅ `IamTableEmptyState` + `InvTableSkeleton` |
| LR-01 paginación server | ✅ Sin cambio hook |
| E-ME4 sin UUID | ✅ Drawer y tabla |
| ME-02 sin selector empresa toolbar | ✅ Sesiones tenant-scoped |
| ER-02 toast en hook | ✅ Revoke sin cambio |
| UX-01 Desactivar/Reactivar vocabulario | N/A — «Revocar/Cerrar sesión» IAM |
| Capa 1 tokens | ✅ Sin gray-* hardcode |
| Prohibido parsear UA | ✅ Solo literal en Drawer |

---

## 10. Riesgos y limitaciones documentadas

| Riesgo | Mitigación UX |
|--------|---------------|
| KPI expira pronto impreciso | Tooltip + label «100+» |
| No filtrar por empresa | Subtítulo empresa + nota bajo búsqueda |
| `last_refresh_at` ≠ actividad ERP | Copy educativo Drawer |
| Revocación remota no instantánea misma pestaña | Fuera alcance pantalla — ver probe architecture |
| 4 queries KPI + list = 5 requests carga | Paralelizar; staleTime KPI 60 s |
| Agrupación por usuario incompleta cross-page | Solo visual en página; no contador global |

---

## 11. Criterios de aceptación diseño (Gate UX)

- [ ] Admin escanea 25 filas en < 10 s sin scroll horizontal en 1280 px.
- [ ] Toda información forense accesible en ≤ 2 clicks (fila → Drawer).
- [ ] Cero UUID en UI incluyendo Drawer y tooltips.
- [ ] KPI total coincide con `ErpPagination.total`.
- [ ] Filtros UI ⊆ params BE documentados.
- [ ] MySessions (variant self) no regresa por eliminación cards admin.
- [ ] Documento revisado sin requerir cambio OpenAPI.

---

## 12. Referencias código actual

| Artefacto | Ruta |
|-----------|------|
| Página | `src/features/admin/pages/ActiveSessionsPage.tsx` |
| Tabla | `src/features/admin/components/iam/sessions/ActiveSessionsTableView.tsx` |
| Cards | `src/features/admin/components/iam/sessions/ActiveSessionsCardsView.tsx` |
| Hook listado | `src/features/admin/hooks/useActiveSessionsList.ts` |
| Tipos | `src/features/admin/types/session.types.ts` |
| Display utils | `src/features/admin/utils/iam-session-display.utils.ts` |

---

**Fin del documento — modo READ ONLY. Implementación sujeta a ticket FE posterior y Gate UX sign-off.**
