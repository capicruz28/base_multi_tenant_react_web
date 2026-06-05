# PLATFORM_DASHBOARD_MVP_UX_AUDIT.md

**Tema:** Auditoría funcional, UX, UI y arquitectónica — Dashboard Platform  
**Fecha:** 2026-06-03  
**Alcance:** Repositorio Frontend exclusivamente  
**Contrato autorizado:** `PLATFORM_DASHBOARD_FRONTEND_CONTRACT.md` (única fuente de verdad API)  
**Rutas analizadas:**

| Ruta | Componente |
|------|------------|
| `/super-admin/dashboard` | `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx` |
| `/super-admin/auditoria` | `src/features/super-admin/auditoria/pages/AuditoriaGlobalPage.tsx` |

**Tipo:** Auditoría — **sin código, sin commits, sin implementación**

---

## 0. Resumen ejecutivo

| Dimensión | Veredicto |
|-----------|-----------|
| **Funcional** | Dashboard **100 % mock**; landing post-login muestra métricas ficticias como datos reales |
| **Contrato** | **0/16 widgets MVP (W1–W15)** conectados; **0/12 widgets futuros (F1–F12)** aplicables hoy |
| **UX/UI** | Layout visual coherente internamente, pero **desalineado** con Clientes/Catálogos/Módulos (sin toolbar, H1 prominente, `rounded-xl` vs `rounded-lg`) |
| **Arquitectura** | Sin capa `platformDashboardApi`, sin hooks, sin composición paralela; Auditoría Global **sí** consume API real vía `AuthAuditLogPanel` |
| **Riesgo principal** | **Confianza operativa**: operador Platform toma decisiones sobre números inventados (5 clientes, 12 conexiones «Todas activas») |
| **MVP viable hoy** | **Sí**, según contrato §5 — requiere conectar endpoints ya documentados y retirar bloques sin soporte |

**Recomendación:** Implementar Dashboard MVP Fase 1 (widgets W1–W15 implementables), reutilizar `AuthAuditLogPanel` como fuente de actividad reciente, alinear shell visual con superficies Platform existentes, reservar widgets F1–F12 para Fase 2 (`GET /api/v1/superadmin/dashboard/`).

---

## 1. Snapshot actual

### 1.1 Dashboard (`/super-admin/dashboard`)

**Archivo:** `SuperAdminDashboard.tsx` (~262 LOC) — único archivo del feature `dashboard/`.

| Aspecto | Estado |
|---------|--------|
| Servicios / hooks / fetch | **Ninguno** |
| Comentario en código | `// Datos de ejemplo para el dashboard` |
| Guard `isSuperAdmin` | **Sí** — único comportamiento real |
| Routing | `superAdminRoutes` → lazy + `LoadingSpinner` |
| Post-login default | `post-login-path.ts`, `ProtectedRoute`, wildcard `*` → dashboard |

**Inventario visual:**

```
┌─────────────────────────────────────────────────────────────────┐
│ H1 text-3xl «Dashboard de Super Administrador» + subtítulo      │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ K1 Clientes  │ K2 Usuarios  │ K3 Módulos   │ K4 Conexiones      │
│ 5 / 4 act.   │ 25 / 22 act. │ 8 / 6 act.   │ 12 «Todas activas» │
├──────────────────────────────┬──────────────────────────────────┤
│ A1 Alertas (badge «2»)       │ R1 Actividad reciente (4 ítems)   │
│ Licencia / conexión ficticia │ ACME, Tech Corp, fechas 2024      │
├─────────────────────────────────────────────────────────────────┤
│ Q1 Acciones rápidas: 3 botones sin navigate/Link                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Auditoría Global (`/super-admin/auditoria`)

**Archivos:**

| Archivo | Rol |
|---------|-----|
| `AuditoriaGlobalPage.tsx` | Shell: back-link, H1, descripción |
| `AuthAuditLogPanel.tsx` | Panel reutilizable (~580 LOC): KPIs página, filtros, tabla, detalle modal |
| `ClientAuditTab.tsx` | Wrapper: `<AuthAuditLogPanel clienteId={…} />` en detalle cliente |

| Aspecto | Estado |
|---------|--------|
| API auth logs | **SUPPORTED** — `GET /superadmin/auditoria/autenticacion/` |
| API estadísticas | **No consumida** — endpoint §1.4 del contrato sin método FE |
| API sync logs | **No consumida** — endpoint §1.6 sin servicio FE |
| KPIs superiores | **PARTIAL** — cuentan solo página actual (`logs.length`, filter local), no stats globales |

### 1.3 Capa FE existente vs contrato

| Endpoint contrato | Servicio / hook FE | Estado |
|-------------------|-------------------|--------|
| `GET /clientes/` | `clienteService`, `useClientes` | **Expuesto** |
| `GET /modulos-v2/` | `moduloV2Service.getModulos` | **Expuesto** |
| `GET /superadmin/auditoria/autenticacion/` | `superadminAuditoriaService.getAuthLogsByCliente` | **Expuesto** |
| `GET /superadmin/auditoria/estadisticas/` | — | **Sin servicio** |
| `GET /superadmin/auditoria/sincronizacion/` | — | **Sin servicio** |
| `GET /superadmin/usuarios/` | — (solo `getUsuariosByCliente`) | **Gap FE** |
| `GET /clientes/{id}/estadisticas/` | `clienteService.getClienteStats` | **Por tenant** |
| `GET /cliente-modulo/cliente/{id}/` | En tabs cliente | **Por tenant** |
| `GET /conexiones/clientes/{id}/` | `conexionService` | **Por tenant** |
| `GET /api/v1/superadmin/dashboard/` | — | **No existe** (Fase 2) |

---

## 2. Dashboard actual — inventario widget por widget

### 2.1 KPIs

| ID UI | Etiqueta | Valor mostrado | Fuente real | Clasificación contrato |
|-------|----------|----------------|-------------|------------------------|
| K1 | Total Clientes | 5 (+ «4 activos») | Literal `stats` L18–27 | **MOCK** — contrato W1/W2 no conectados |
| K2 | Total Usuarios | 25 (+ «22 activos») | Literal | **MOCK** — W12 no conectado; subtexto «activos» requiere query adicional |
| K3 | Módulos | 8 (+ «6 activos») | Literal | **MOCK** — W11 no conectado |
| K4 | Conexiones | 12 (+ «Todas activas») | Literal + texto fijo | **MOCK / UNSUPPORTED** — sin endpoint global (contrato §2.5 ❌) |

**KPIs reales hoy:** **ninguno**.

**KPIs mock hoy:** K1, K2, K3, K4, badge `stats.alertas`.

### 2.2 Paneles secundarios

| ID UI | Bloque | Contenido | Clasificación |
|-------|--------|-----------|---------------|
| A1 | Alertas del Sistema | 2 alertas inventadas (licencia, error conexión) | **MOCK** — W15 parcialmente calculable (§4.1), pero panel actual **sin contrato** y copy ficticio |
| R1 | Actividad Reciente | 4 eventos genéricos (2024) | **MOCK** — W9 **SUPPORTED** en contrato pero **desconectado** en dashboard |
| Q1 | Acciones Rápidas | 3 botones decorativos | **PARTIAL** — rutas destino existen; sin `Link`/`navigate` |

### 2.3 Widgets sin contrato (UI actual, no en §5 ni §6)

| Widget | Motivo |
|--------|--------|
| Subtexto K4 «Todas activas» | Afirmación de salud sin dato; contrato §9 excluye semáforo conexión global |
| Copy alertas «Licencia próxima a vencer en ACME Corp» | Narrativa inventada; no mapea a código §4.1 sin implementación |
| Acción «Gestionar Conexiones» global | No hay ruta Platform cross-tenant de conexiones |

### 2.4 Widgets desconectados (contrato SUPPORTED, FE no wired)

| Widget contrato | Endpoint | Gap |
|-----------------|----------|-----|
| W1, W2 | `GET /clientes/?limit=1` | Hook `useClientes` existe; dashboard no lo usa |
| W3–W8 | `GET /superadmin/auditoria/estadisticas/` | Sin método en `superadminAuditoriaService` |
| W9 | `GET /superadmin/auditoria/autenticacion/?limit=20` | Servicio existe; dashboard no lo usa |
| W10 | `GET /superadmin/auditoria/sincronizacion/` | Sin servicio FE |
| W11 | `GET /modulos-v2/?limit=1` | `moduloV2Service` existe; dashboard no lo usa |
| W12 | `GET /superadmin/usuarios/?limit=1` | Sin `getUsuariosGlobales` en servicio |
| W13, W14 | `GET /clientes/` + agregación FE | Servicio existe; dashboard no lo usa |
| W15 | Composición alertas §4.1 | No implementado |

### 2.5 Widgets parcialmente soportados

| Widget UI | Soporte parcial | Detalle |
|-----------|-----------------|---------|
| K2 Usuarios activos | **PARTIAL** | `total_usuarios` ✅ vía §1.7; «X activos» requiere `es_activo=true` (🔄 contrato §2.3) |
| A1 Alertas | **PARTIAL** | Reglas §4.1 calculables con datos reales, pero **no** el copy actual del mock |
| R1 Actividad | **PARTIAL** | Misma API que W9; `AuthAuditLogPanel` ya renderiza filas reales en `/auditoria` |
| Q1 Acciones | **PARTIAL** | Rutas `/super-admin/clientes`, `/modulos`, `/auditoria` existen; botones no navegan |

### 2.6 Widgets que deben eliminarse (MVP honesto)

| Widget | Motivo |
|--------|--------|
| **K4 Conexiones** + «Todas activas» | UNSUPPORTED global (contrato §2.5 ❌, §9) |
| **A1 Alertas** (estado mock actual) | MOCK sin API; sustituir por W15 derivado o retirar hasta implementación |
| **Badge `stats.alertas`** | Derivado de mock |
| **Arrays `stats`, `alertas`, `actividadReciente`** | Literals de negocio |
| **Q1 «Gestionar Conexiones»** | Sin superficie global; reemplazar por CTA Auditoría |

### 2.7 Widgets que deben conservarse (estructura UX)

| Widget | Motivo |
|--------|--------|
| **Grid KPI 3–4 tarjetas** | Patrón estándar SaaS; alimentar con W1–W5, W11, W12 |
| **Panel actividad reciente** | W9 — alto valor operativo; reutilizar datos/patrón de `AuthAuditLogPanel` |
| **Acciones rápidas** | Navegación operativa; alinear destinos con sidebar Platform |
| **Guard acceso restringido** | Comportamiento correcto |
| **Header descriptivo** | Ajustar escala visual (ver §5) |

---

## 3. Auditoría Global — coherencia y reutilización

### 3.1 Coherencia visual con Dashboard

| Elemento | Dashboard | Auditoría Global | Clientes / Módulos / Catálogos |
|----------|-----------|------------------|--------------------------------|
| Título página | `text-3xl`, `mb-8` | `text-2xl`, `mb-6` + back-link | H1 **comentado** — título en shell/breadcrumb |
| Radio tarjetas | `rounded-xl` | `rounded-lg` | `rounded-lg` |
| Toolbar acciones | No tiene | Filtros embebidos en panel | Barra `p-4` con búsqueda + acciones |
| KPI cards | Icono + número + subtexto | 3 mini-KPIs (página) | Clientes: contador en paginación, no cards superiores |
| Tabla / lista | Lista simple actividad | Tabla completa + modal detalle | Tabla CRUD estándar |
| Loading | No aplica (mock) | `Loader` + reintentar | `RefreshCw` spin / skeleton |
| Empty state | Genérico | Contextual (filtros vs global) | Icono + copy por entidad |

**Veredicto coherencia:** Dashboard y Auditoría comparten tokens (`bg-surface`, `border-border-base`, iconos Lucide), pero Dashboard **rompe** el patrón Platform reciente (H1 grande, sin toolbar card, `rounded-xl`).

### 3.2 Oportunidades de reutilización

| Componente / pieza | Origen | Uso propuesto Dashboard |
|--------------------|--------|-------------------------|
| `AuthAuditLogPanel` | `/auditoria`, tab cliente | **No embeber completo** — extraer `AuthActivityFeed` (lista compacta W9, `limit=5–15`) |
| Tipos `AuthAuditLog` | `superadmin-auditoria.types` | Mapeo filas actividad reciente |
| `superadminAuditoriaService` | Ya integrado | Preview actividad + futuro stats W3–W8 |
| `useClientes` | Clientes | KPI W1/W2; agregación W14 |
| `moduloV2Service` | Módulos | KPI W11 |
| `ConfirmDialog`, `Dialog` | Platform transversal | Detalle evento auth en dashboard (opcional MVP) |
| Patrón KPI 3-col | `AuthAuditLogPanel` L190–222 | Unificar `DashboardKpiCard` compartido |
| Paginación adapters | Clientes (`skip`) vs Auditoría (`page`) | Contrato §0.5 — centralizar en capa API |

### 3.3 Widgets compartibles (DRY)

```
┌──────────────────────────────────────────────────────────────┐
│  shared/platform/                                            │
│    DashboardKpiCard.tsx      ← KPI grid (dashboard + stats)  │
│    AuthActivityFeed.tsx      ← W9 preview (dashboard)          │
│    PlatformAlertBanner.tsx   ← W15 (dashboard)                 │
│    hooks/usePlatformDashboardHome.ts  ← composición §5 bundle  │
└──────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
  SuperAdminDashboard          AuthAuditLogPanel (refactor opcional:
                               usar AuthActivityFeed en modo full)
```

### 3.4 Actividad reciente reutilizable

| Capacidad | Auditoría Global | Dashboard objetivo |
|-----------|------------------|-------------------|
| Endpoint | `getAuthLogsByCliente` sin `cliente_id` | Idem, `limit=5`, `orden=desc` |
| Campos fila | fecha, usuario, cliente, evento, IP, resultado | tenant + evento + hora (compacto) |
| Drill-down | Modal detalle + `getAuthLogDetalle` | Link «Ver todo» → `/super-admin/auditoria?evento=…` |
| Filtro fallos | `exitoFilter` | Preview opcional solo `login_failed` para alertas |
| Polling | No (manual refetch vía filtros) | Contrato §8.2: 60 s auth feed |

**Gap:** Dashboard mock usa acciones inventadas («Módulo activado», «Conexión probada») — **no** existen en contrato §3 actividad reciente.

---

## 4. Matriz widget vs contrato

**Leyenda:** SUPPORTED = implementable hoy con contrato §1; PARTIAL = requiere agregación FE o método FE mínimo; UNSUPPORTED = requiere BFF §6; MOCK = UI actual con datos ficticios.

### 4.1 Widgets MVP contrato (W1–W16)

| # | Widget contrato | UI actual equivalente | Clasificación | Acción MVP |
|---|-----------------|----------------------|---------------|------------|
| W1 | Tarjeta clientes activos | K1 (parcial) | **MOCK** → **SUPPORTED** | Conectar `useClientes` `solo_activos=true`, `limit=1` |
| W2 | Tarjeta clientes (todos) | K1 total | **MOCK** → **SUPPORTED** | Segunda query `solo_activos=false` |
| W3 | Logins fallidos 24h | — | **UNSUPPORTED** en UI | Añadir servicio stats + tarjeta (reemplazo K4 u O4) |
| W4 | Logins exitosos 24h | — | **UNSUPPORTED** en UI | Idem W3 |
| W5 | Sync fallidas 24h | — | **UNSUPPORTED** en UI | Idem stats |
| W6 | Gráfico eventos por tipo | — | **UNSUPPORTED** en UI | Fase 1 opcional / Fase 1.5 |
| W7 | Tabla top IPs | — | **UNSUPPORTED** en UI | Panel secundario o link auditoría |
| W8 | Tabla top usuarios | — | **UNSUPPORTED** en UI | Idem |
| W9 | Feed auth reciente | R1 | **MOCK** → **SUPPORTED** | `getAuthLogsByCliente`, `limit=15` |
| W10 | Feed sync recientes | — | **UNSUPPORTED** en UI | Servicio sync + panel (Fase 1.5) |
| W11 | Módulos catálogo | K3 | **MOCK** → **SUPPORTED** | `moduloV2Service`, `pagination.total` |
| W12 | Usuarios globales | K2 | **MOCK** → **PARTIAL** | Nuevo `getUsuariosGlobales`; activos = query extra |
| W13 | Clientes recientes | — | **UNSUPPORTED** en UI | Sort FE `fecha_creacion` (§3.3 limitación) |
| W14 | Donut planes/estados | — | **PARTIAL** | Agregación FE; excluir `SYSTEM` |
| W15 | Banner alertas derivadas | A1 | **MOCK** → **PARTIAL** | Reglas §4.1; **no** copy mock |
| W16 | Drill-down tenant | — | **SUPPORTED** | Rutas existentes detalle cliente (no home) |

### 4.2 Widgets UI actual vs contrato (inverso)

| Widget UI actual | Contrato | Clasificación final |
|------------------|----------|---------------------|
| K1 Clientes | W1 + W2 | **MOCK** |
| K2 Usuarios | W12 | **MOCK** |
| K3 Módulos | W11 | **MOCK** |
| K4 Conexiones | — (§9 fuera alcance) | **MOCK / UNSUPPORTED** |
| A1 Alertas | W15 (reglas distintas al mock) | **MOCK** |
| R1 Actividad | W9 | **MOCK** (API **SUPPORTED** pero desconectada) |
| Q1 Acciones | Navegación §8 | **PARTIAL** |
| Badge alertas | W15 | **MOCK** |

### 4.3 Widgets futuros BFF (F1–F12) — Fase 2

| # | Widget BFF | UI actual | Estado |
|---|------------|-----------|--------|
| F1 | Resumen clientes unificado | K1 mock | **UNSUPPORTED** — esperar `GET /superadmin/dashboard/` |
| F2 | Trials por vencer/vencidos | — | **UNSUPPORTED** |
| F3 | Estado incoherente (conteo) | — | **PARTIAL** hoy vía W14 agregación; BFF preferido |
| F4 | Top tenants actividad | — | **UNSUPPORTED** |
| F5 | Resumen licencias global | — | **UNSUPPORTED** |
| F6 | Top módulos activados | — | **UNSUPPORTED** |
| F7 | Salud conexiones global | K4 mock | **UNSUPPORTED** — **eliminar mock** |
| F8 | Conexiones críticas | A1 mock parcial | **UNSUPPORTED** |
| F9 | Operadores Platform | — | **UNSUPPORTED** |
| F10 | Panel alertas unificado | A1 mock | **UNSUPPORTED** server-side |
| F11 | Meta limitaciones | — | **UNSUPPORTED** |
| F12 | Carga parcial secciones | — | **UNSUPPORTED** |

---

## 5. Evaluación UX/UI

### 5.1 Jerarquía visual

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| H1 `text-3xl` en dashboard | Media | Clientes/Módulos ocultaron H1 body; dashboard es la única superficie con título grande — **doble jerarquía** con shell sidebar |
| KPIs dominan viewport | Baja | Correcto para home; valores mock **engañan** |
| Alertas vs actividad 50/50 | Media | Panel alertas mock compite con actividad; contrato recomienda W15 banner + W9 feed |
| Sin indicador «última actualización» | Baja | Contrato §8.2 sugiere polling; falta timestamp / refresh |

### 5.2 Tarjetas KPI

| Aspecto | Dashboard actual | Patrón objetivo Platform |
|---------|------------------|--------------------------|
| Contenedor | `rounded-xl p-6` | `rounded-lg p-4` (auditoría, catálogos) |
| Icono | Lucide 8×8 color semántico | Igual — **conservar** |
| Subtexto | «X activos» / «Todas activas» | Solo si derivado de API |
| Loading | Ausente | Skeleton por tarjeta o `—` |
| Error | Ausente | Estado degraded por widget (contrato §8.3) |

### 5.3 Panel actividad reciente

| Aspecto | Actual (mock) | Objetivo (W9) |
|---------|---------------|---------------|
| Densidad | 4 filas, hora truncada | 5–15 filas; fecha completa o relativa |
| Semántica | Acciones de negocio inventadas | `evento` + `exito` + tenant |
| Interacción | Ninguna | Click → detalle o auditoría filtrada |
| Empty | Copy genérico | «No hay eventos recientes» (API vacía) |
| Coherencia | Lista simple | Alinear badges éxito/fallo con tabla auditoría |

### 5.4 Alertas

| Aspecto | Actual | Contrato §4 |
|---------|--------|-------------|
| Presentación | Panel dedicado 50% ancho | Banner compacto W15 recomendado |
| Severidad | `warning` / `error` ad hoc | Códigos tipados (`AUTH_LOGIN_FAILURES_HIGH`, etc.) |
| Acción | Ninguna | `accion_url` → `/super-admin/auditoria?evento=login_failed` |
| Datos | Ficticios | Derivados de stats + listados — **no** replicar narrativa mock |

### 5.5 Navegación rápida

| Botón actual | Destino correcto | Estado |
|--------------|------------------|--------|
| Gestionar Clientes | `/super-admin/clientes` | Botón sin `Link` |
| Gestionar Módulos | `/super-admin/modulos` | Botón sin `Link` |
| Gestionar Conexiones | **No existe ruta global** | **Eliminar** → `/super-admin/auditoria` |
| — | `/super-admin/catalogos/*` | Opcional P2 — no en MVP contrato |

### 5.6 Responsive

| Breakpoint | Dashboard | Observación |
|------------|-----------|-------------|
| `< md` | KPI 1 col; paneles 1 col | OK |
| `md` | KPI 2 col | OK |
| `lg` | KPI 4 col; alertas|actividad 2 col | En MVP sin alertas panel: actividad full width o + sidebar stats |
| Tabla auditoría | `overflow-x-auto` | Dashboard lista simple — sin riesgo horizontal |

### 5.7 Consistencia con Clientes, Catálogos y Módulos

| Patrón Platform maduro | Dashboard | Gap |
|------------------------|-----------|-----|
| Toolbar card superior | ❌ | Añadir barra refresh + rango 24h (stats) |
| H1 en breadcrumb/shell | ❌ H1 body prominente | Reducir a subtítulo operativo o eliminar |
| `getErrorMessage` + reintentar | ❌ | Por sección |
| React Query / stale | ❌ | `usePlatformDashboardHome` |
| ConfirmDialog / modales | ❌ | Opcional detalle auth |
| Toasts en error | ❌ | Solo en acciones, no en KPIs |

---

## 6. Roadmap MVP

### 6.1 Fase 1 — Solo widgets implementables hoy (contrato §5)

**Principio:** Cero literals de negocio; degradación parcial si una API falla.

**Bundle de carga inicial (paralelo, contrato §5):**

```text
Promise.allSettled([
  GET /clientes/?solo_activos=true&limit=1,           → W1
  GET /clientes/?solo_activos=false&limit=1,          → W2
  GET /superadmin/auditoria/estadisticas/?24h,        → W3–W8 (requiere nuevo método FE)
  GET /superadmin/auditoria/autenticacion/?limit=15,  → W9
  GET /modulos-v2/?solo_activos=true&limit=1,        → W11
  GET /superadmin/usuarios/?limit=1,                  → W12
])
```

**Entregables Fase 1 (priorizados):**

| Prioridad | Entregable | Widgets | Esfuerzo |
|-----------|------------|---------|----------|
| P0 | Eliminar mocks (K4, A1 mock, arrays literales) | — | 0.5 h |
| P0 | KPI Clientes W1+W2 | K1 real | 0.5 d |
| P0 | KPI Módulos W11 | K3 real | 0.25 d |
| P0 | Feed actividad W9 + link auditoría | R1 real | 0.5 d |
| P0 | Acciones rápidas con `Link` | Q1 | 0.25 h |
| P1 | KPI Usuarios W12 (+ activos query) | K2 real | 0.5 d |
| P1 | Servicio `getAuditoriaEstadisticas` + KPI W3/W5 | Reemplazo K4 | 0.5 d |
| P1 | Banner alertas W15 (reglas §4.1 básicas) | Sustituye A1 | 1 d |
| P2 | Donut W14 (si `<100` tenants) | Nuevo panel | 1 d |
| P2 | Top IPs / usuarios W7–W8 | Panel secundario | 0.5 d |
| P2 | Feed sync W10 | Requiere servicio sync | 0.5 d |
| P2 | Clientes recientes W13 | Sort FE + paginación | 0.5 d |
| P3 | Gráfico W6 | Recharts/bar simple | 0.5 d |

**Layout objetivo Fase 1:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Opcional] Subtítulo + Refresh + selector ventana 24h           │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ W1 Clientes  │ W12 Usuarios │ W11 Módulos  │ W3 Fallos 24h      │
│ activos/tot  │ total        │ catálogo     │ o W2 inactivos     │
├─────────────────────────────────────────────────────────────────┤
│ W15 Alert banner (0–N alertas derivadas, dismissible)           │
├──────────────────────────────┬──────────────────────────────────┤
│ W9 Actividad auth (5–15)     │ W7 Top IPs compacto (opcional)   │
│ «Ver todo» → /auditoria      │ o CTA módulos/clientes           │
├─────────────────────────────────────────────────────────────────┤
│ Acciones: Clientes | Módulos | Auditoría Global                 │
└─────────────────────────────────────────────────────────────────┘
```

**Eliminado vs actual:** K4 Conexiones, panel A1 mock, badge «2 alertas» ficticio, botón Conexiones.

### 6.2 Fase 2 — Esperar BFF `GET /api/v1/superadmin/dashboard/`

| Entregable | Widgets BFF | Migración FE |
|------------|-------------|--------------|
| Adapter único `platformDashboardApi.getDashboard()` | F1–F12 | Reemplazar bundle §6.1 |
| Mantener componentes visuales | Mapeo campos BFF → props existentes | Sin reescritura UI (contrato §6) |
| Alertas server-side | F10 | Retirar reglas FE costosas §4.2 |
| Placeholders feature-flag | F5–F8 | Mostrar «Próximamente» hasta BFF |
| Polling 90 s | F11 meta TTL | Ajustar intervalos |

**No implementar en Fase 1 (explícito contrato §4.2, §6):**

- Iteración N tenants × conexiones/licencias
- KPI conexiones globales
- MRR/churn/metrics API
- Alertas `CONN_*`, `LICENSE_*` globales sin BFF

---

## 7. Backlog priorizado

| ID | Item | Tipo | Fase | Depende |
|----|------|------|------|---------|
| BD-01 | Retirar literals mock dashboard | UX/func | 1 | — |
| BD-02 | `usePlatformDashboardHome` composición | Arch | 1 | — |
| BD-03 | `DashboardKpiCard` shared | UX | 1 | — |
| BD-04 | Conectar W1/W2 clientes | Func | 1 | `useClientes` |
| BD-05 | Conectar W11 módulos | Func | 1 | `moduloV2Service` |
| BD-06 | `AuthActivityFeed` desde panel auditoría | UX/DRY | 1 | BD-09 |
| BD-07 | `getUsuariosGlobales` servicio | Func | 1 | Contrato §1.7 |
| BD-08 | `getAuditoriaEstadisticas` servicio | Func | 1 | Contrato §1.4 |
| BD-09 | `getSyncLogs` servicio | Func | 1.5 | Contrato §1.6 |
| BD-10 | `PlatformAlertBanner` reglas §4.1 | UX | 1 | BD-08, BD-04 |
| BD-11 | Acciones rápidas `Link` | UX | 1 | — |
| BD-12 | Alinear visual `rounded-lg`, quitar H1 3xl | UX | 1 | — |
| BD-13 | Polling 60s auth / 120s clientes | Arch | 1 | BD-02 |
| BD-14 | Donut W14 agregación clientes | Func | 1.5 | BD-04 |
| BD-15 | Adapter BFF dashboard único | Arch | 2 | Backend BFF |
| BD-16 | Feature flags widgets F5–F8 | UX | 2 | BD-15 |
| BD-17 | Refactor `AuthAuditLogPanel` usar feed compartido | Arch | 1.5 | BD-06 |

---

## 8. Diseño objetivo Dashboard MVP

### 8.1 Principios UX

1. **Honestidad operativa** — ningún número sin fuente API trazable al contrato.
2. **Degradación graceful** — tarjeta en error no bloquea el resto (§8.3).
3. **Drill-down claro** — actividad → auditoría; KPI clientes → listado clientes.
4. **Paridad visual Platform** — toolbar card, `rounded-lg`, tokens existentes.
5. **Exclusión SYSTEM** — agregaciones W14/W15 (contrato §8.4).

### 8.2 Component tree objetivo

```
SuperAdminDashboard
├── PlatformPageToolbar (refresh, periodo 24h)
├── DashboardKpiGrid
│   ├── KpiClientesCard      (W1/W2)
│   ├── KpiUsuariosCard      (W12)
│   ├── KpiModulosCard       (W11)
│   └── KpiAuthFailuresCard  (W3) | KpiClientesInactivos (W2 alt)
├── PlatformAlertBanner      (W15)
├── DashboardMainGrid
│   ├── AuthActivityFeed     (W9)
│   └── TopIpsMiniTable      (W7, opcional)
└── DashboardQuickActions    (Links)
```

### 8.3 Estados por widget

| Estado | Tratamiento UI |
|--------|----------------|
| Loading | Skeleton en tarjeta / spinner inline feed |
| Error | Icono + «No disponible» + reintentar |
| Empty | Copy neutral (no mock) |
| Degraded | Badge «Parcial» si agregación incompleta (paginación clientes) |

---

## 9. Estimación

| Fase | Alcance | Esfuerzo | Calendario orientativo |
|------|---------|----------|------------------------|
| **Fase 1 MVP core** | P0 backlog (BD-01–06, 11–12) | **2–3 d** | Sprint actual |
| **Fase 1 MVP+** | P1–P2 (stats, alertas, sync, donut) | **+3–4 d** | Sprint siguiente |
| **Fase 2 BFF** | Adapter + migración + flags | **2–3 d** FE (post-BFF) | Cuando exista endpoint |
| **QA manual** | Matriz §10 contrato + regresión post-login | **0.5 d** | Por entrega |

**Total Fase 1 completa (W1–W15):** **5–7 días** desarrollo + QA.

---

## 10. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R-01 | Operador confía en mocks actuales | Alta | Alto | P0 retirar literals antes de conectar APIs |
| R-02 | `GET /superadmin/usuarios/` 403/404 en staging | Media | Medio | Card degraded; resto dashboard operativo |
| R-03 | `estadisticas/` sin método FE retrasa W3–W8 | Media | Medio | MVP core sin stats; usar W9 feed como señal auth |
| R-04 | Agregación W14 incompleta si `>1000` clientes | Baja | Medio | Nota UI «basado en N clientes»; esperar F1 BFF |
| R-05 | `usuario_id` number input en auditoría vs UUID contrato | Media | Bajo | QA filtros; alinear tipo en servicio |
| R-06 | Usuario echa de menos panel Alertas mock | Media | Bajo | Comunicar W15 banner; no reintroducir fiction |
| R-07 | Doble título shell + body | Baja | Bajo | BD-12 alinear con Clientes/Módulos |
| R-08 | Polling múltiple aumenta carga API | Baja | Medio | Intervalos §8.2; React Query staleTime |
| R-09 | Tenants dedicated ausentes en auditoría global | Media | Medio | Disclaimer contrato §3.5 |
| R-10 | Migración BFF rompe composición si no hay abstracción | Media | Alto | BD-02 adapter desde día 1 |

---

## 11. Checklist QA (contrato §10 adaptado)

| # | Caso | Fase |
|---|------|------|
| Q1 | Dashboard sin números fijos 5/25/8/12 | 1 |
| Q2 | KPI clientes = listado Clientes (`total_clientes`) | 1 |
| Q3 | KPI módulos = listado Módulos (`pagination.total`) | 1 |
| Q4 | Actividad = eventos reales o empty honesto | 1 |
| Q5 | Sin panel alertas ficticias | 1 |
| Q6 | Acciones navegan a rutas Platform | 1 |
| Q7 | Una API caída → tarjetas restantes OK | 1 |
| Q8 | Alertas W15 con códigos §4.1 trazables | 1+ |
| Q9 | Exclusión `SYSTEM` en donuts/agregaciones | 1+ |
| Q10 | Migración BFF sin cambio visual regresivo | 2 |

---

## 12. Conclusión

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dashboard tiene datos reales? | **No** — 100 % mock local |
| ¿Auditoría Global es referencia viable? | **Sí** — `AuthAuditLogPanel` implementa W9 full; KPIs página son PARTIAL |
| ¿Qué conservar del dashboard actual? | Estructura KPI grid, actividad reciente, acciones rápidas, guard |
| ¿Qué eliminar? | Conexiones globales, alertas mock, literals, botón conexiones |
| ¿MVP sin Backend nuevo? | **Sí** — contrato §5 (W1–W15) con gaps FE acotados |
| ¿Cuándo F2? | Tras `GET /api/v1/superadmin/dashboard/` — widgets F1–F12 |

---

**Referencias internas analizadas:**

- `PLATFORM_DASHBOARD_FRONTEND_CONTRACT.md` (contrato exclusivo)
- `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx`
- `src/features/super-admin/auditoria/pages/AuditoriaGlobalPage.tsx`
- `src/features/super-admin/auditoria/components/AuthAuditLogPanel.tsx`
- `src/services/superadmin-auditoria.service.ts`
- `src/services/superadmin-usuario.service.ts`
- `src/core/hooks/useClientes.ts`
- `src/features/modulos/services/modulo-v2.service.ts`
- Superficies comparación: `ClientManagementPage`, `ModuleManagementPage`, `PaisesPage`

*Fin — PLATFORM_DASHBOARD_MVP_UX_AUDIT.md — sin código, sin commits.*
