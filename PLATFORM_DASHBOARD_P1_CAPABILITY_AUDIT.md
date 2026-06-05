# PLATFORM_DASHBOARD_P1_CAPABILITY_AUDIT.md

**Tema:** Auditoría de capacidades Frontend — Dashboard Platform P1  
**Fecha:** 2026-06-03  
**Tipo:** Auditoría + plan de construcción — **sin código, sin commits, sin implementación**

**Referencias exclusivas:**

| Documento | Rol |
|-----------|-----|
| `PLATFORM_DASHBOARD_FRONTEND_CONTRACT.md` | Contrato API autorizado |
| `PLATFORM_DASHBOARD_P0_IMPLEMENTATION_REPORT.md` | Baseline implementado |
| Código Frontend actual | Servicios, tipos y superficies consumidas |

**No se asumen endpoints nuevos. No se analiza Backend.**

---

## 0. Resumen ejecutivo

| Dimensión | Veredicto P1 |
|-----------|--------------|
| **Objetivo P1** | Evolucionar de superficie informativa (P0) a **consola operativa SaaS** |
| **Widgets contrato W3–W15** | **11/11 implementables** en algún grado con contratos §1 existentes |
| **Bloque licencias global** | **No viable** en P1 sin N+1 masivo → esperar BFF (F5, F6) |
| **Bloque conexiones global** | **No viable** en P1 → esperar BFF (F7, F8) |
| **Gap FE principal** | `getAuditoriaEstadisticas`, `getSyncLogs`, util agregación clientes, tipos stats |
| **Esfuerzo estimado P1** | **5–8 días** FE (3 sub-fases) |

**Conclusión:** P1 puede entregar **seguridad operativa** (stats auth/sync, alertas derivadas, top IPs), **salud de cartera clientes** (estados, planes, trials) y **feeds ampliados** (auth, sync, clientes recientes), reutilizando infraestructura P0. **Licencias y conexiones globales** quedan fuera o como drill-down por tenant hasta el BFF.

---

## 1. Baseline P0 (estado actual Frontend)

### 1.1 Implementado en Dashboard

| Widget | Hook / servicio | Endpoint |
|--------|-----------------|----------|
| W1 Clientes activos | `usePlatformDashboardP0` → `clienteService` | `GET /clientes/?solo_activos=true&limit=1` |
| W2 Total clientes | idem | `GET /clientes/?solo_activos=false&limit=1` |
| W11 Módulos catálogo | `moduloV2Service.getModulos` | `GET /modulos-v2/?limit=1` |
| W12 Total usuarios | `superadminUsuarioService.getUsuariosGlobales` | `GET /superadmin/usuarios/?limit=1` |
| W9 Actividad auth | `superadminAuditoriaService.getAuthLogsByCliente` | `GET /superadmin/auditoria/autenticacion/?limit=5` |

### 1.2 Servicios FE existentes (relevantes P1)

| Servicio | Ruta | Consumido hoy | P1 |
|----------|------|---------------|-----|
| `clienteService` | `features/super-admin/clientes/services/` | Dashboard, Clientes, detalle | Agregación snapshot |
| `superadminAuditoriaService` | `services/superadmin-auditoria.service.ts` | Dashboard, Auditoría Global, tab cliente | + stats, + sync |
| `superadminUsuarioService` | `services/superadmin-usuario.service.ts` | Dashboard, tab usuarios cliente | + filtros operadores |
| `moduloV2Service` | `features/modulos/services/` | Dashboard, Módulos | Sin cambio |
| `clienteModuloService` | `features/modulos/services/cliente-modulo.service.ts` | Tab módulos cliente | Solo drill-down |
| `conexionService` | `features/super-admin/clientes/services/conexion.service.ts` | Tab conexiones cliente | Solo drill-down |

### 1.3 Servicios FE ausentes (contrato §1, no consumidos)

| Endpoint contrato | Gap |
|-------------------|-----|
| `GET /superadmin/auditoria/estadisticas/` | Sin método ni tipos |
| `GET /superadmin/auditoria/sincronizacion/` | Sin método ni tipos |
| `GET /superadmin/usuarios/?cliente_id=&ordenar_por=` | Params no expuestos en `SuperadminUsuarioListParams` |

### 1.4 Hallazgo transversal — filtros clientes

`ClienteFilters` define `plan_suscripcion` y `estado_suscripcion`, y `ClientManagementPage` los envía en `filtros`, pero **`clienteService.getClientes` no los propaga al API** (solo `solo_activos` + `buscar`).

**Impacto P1:** agregaciones de estados/planes deben hacerse vía **snapshot local** (`GET /clientes/?limit=1000&solo_activos=false`) + util FE, no confiar en filtros del listado CRUD actual.

---

## 2. Licencias

### 2.1 Requerimiento operativo

| Métrica | Expectativa negocio |
|---------|---------------------|
| Vencidas | Licencias con `fecha_vencimiento < hoy` y `esta_activo=true` |
| Por vencer | Vencimiento en ventana (p. ej. 30 días) |
| Activas | Total activaciones vigentes en plataforma |

### 2.2 Contrato y FE hoy

| Fuente | Endpoint | Alcance |
|--------|----------|---------|
| Licencias por tenant | `GET /cliente-modulo/cliente/{cliente_id}/` | ✅ `clienteModuloService.getClienteModulosByClienteId` |
| Campos | `fecha_vencimiento`, `esta_activo`, `modo_prueba`, `fecha_fin_prueba` | ✅ Tipos `ClienteModulo` |
| Agregación global | — | ❌ Contrato §2.6 |

### 2.3 Clasificación P1

| Widget | Clasificación | Motivo |
|--------|---------------|--------|
| Licencias vencidas (global) | **BFF — F5** | Requiere iterar N tenants × `cliente-modulo` |
| Licencias por vencer (global) | **BFF — F5** | Idem |
| Activaciones activas (global) | **BFF — F5** | Idem |
| Licencias por tenant (detalle) | **BUILD** | Ya en `ClientModulesTab` / drill-down W16 |
| Alerta `LICENSE_EXPIRED_TENANT` (global) | **BFF** | Contrato §4.2 — no scan N+1 |
| Alerta `LICENSE_EXPIRING_TENANT` (global) | **BFF** | Idem |

### 2.4 Recomendación P1

| Acción | Detalle |
|--------|---------|
| **No** KPI global de licencias en home | Evitar N+1 y números parciales engañosos |
| **Sí** placeholder honesto | «Resumen global de licencias — próximamente» + link a Clientes |
| **Sí** alertas por tenant en detalle | Tab módulos cliente (fuera dashboard home) |
| **P2/BFF** | Panel `licencias.*` cuando exista `GET /superadmin/dashboard/` |

---

## 3. Estados de clientes

### 3.1 Requerimiento vs contrato

| Estado UI | Campo contrato | Obtención |
|-----------|----------------|-----------|
| Activos (registro) | `es_activo === true` | ✅ W1 (`total_clientes` con `solo_activos=true`) — **P0** |
| Suspendidos | `estado_suscripcion === 'suspendido'` | 🔄 Agregación FE |
| Trial | `estado_suscripcion === 'trial'` o `plan_suscripcion === 'trial'` | 🔄 Agregación FE |
| Cancelados | `estado_suscripcion === 'cancelado'` o `es_activo === false` | 🔄 Agregación FE |
| Morosos | `estado_suscripcion === 'moroso'` | 🔄 Agregación FE |
| Estado incoherente | `estado_suscripcion='activo' && es_activo=false` | 🔄 Agregación FE → alerta W15 |

**Valores alineados FE:** `SubscriptionStatus` en `src/core/constants/subscription.types.ts`.

### 3.2 Estrategia de construcción

```http
GET /api/v1/clientes/?skip=0&limit=1000&solo_activos=false
```

1. Reutilizar patrón `CLIENTES_INACTIVE_FETCH_LIMIT = 1000` (`cliente.service.ts`).
2. Crear util `aggregateClientesSnapshot(clientes[])` excluyendo `codigo_cliente === 'SYSTEM'` (contrato §8.4).
3. Constante SYSTEM: `PLATFORM_SUPERADMIN_CLIENTE_ID` ya existe en `auth-session-snapshot.ts`; preferir filtro por `codigo_cliente !== 'SYSTEM'`.

### 3.3 Clasificación P1

| Widget | Clasificación | Esfuerzo |
|--------|---------------|----------|
| Mini-KPIs suspendidos / trial / cancelados | **BUILD** | 1 d |
| Badge trials por vencer (7 d) | **BUILD** (FE) | Incluido en snapshot |
| Conteo estado incoherente | **BUILD** (FE) | Incluido + W15 |
| Resumen unificado server-side | **BFF — F1, F3** | Post-P1 |

### 3.4 Limitación

Si `total_clientes > 1000`, el snapshot es **parcial**. UI debe mostrar nota: «Basado en N de M clientes» hasta BFF.

---

## 4. Distribución por plan

### 4.1 Mapeo contrato ↔ UI

| Label UI (usuario) | Valor API (`plan_suscripcion`) | Constante FE |
|--------------------|--------------------------------|--------------|
| Basic | `basico` | `SubscriptionPlan.BASIC` |
| Professional | `profesional` | `SubscriptionPlan.PROFESSIONAL` |
| Enterprise | `enterprise` | `SubscriptionPlan.ENTERPRISE` |
| Trial | `trial` | `SubscriptionPlan.TRIAL` *(plan separado)* |

**Nota:** el contrato agrupa **plan** (`plan_suscripcion`) distinto de **estado** (`estado_suscripcion`). El donut P1 debe usar `plan_suscripcion` (W14).

### 4.2 Clasificación P1

| Widget | Contrato | Clasificación |
|--------|----------|---------------|
| Donut / barras por plan | W14 | **BUILD** — agregación snapshot |
| Donut por estado suscripción | W14 (variante) | **BUILD** — opcional segundo chart |
| GROUP BY server-side | F1 `clientes.por_plan` | **BFF** |

### 4.3 Reutilización FE

| Pieza existente | Uso P1 |
|-----------------|--------|
| `getSubscriptionPlanLabel()` | Labels donut |
| `ClientDetailPage` badges plan/estado | Consistencia visual semáforos |
| `ClientManagementPage` columnas plan/estado | Validación cruzada QA |

---

## 5. Alertas operativas

### 5.1 Matriz reglas — clasificación completa

| Código contrato §4.1 | Severidad | Fuente datos | Clasificación P1 |
|----------------------|-----------|--------------|----------------|
| `AUTH_LOGIN_FAILURES_HIGH` | warning | `auditoria/estadisticas` → `login_fallidos` | **BUILD** — requiere nuevo servicio stats |
| `AUTH_SYNC_FAILURES` | warning | `estadisticas` → `sincronizacion.fallidas` | **BUILD** |
| `CLIENT_TRIAL_EXPIRED` | warning | Snapshot clientes | **BUILD** (FE agregación) |
| `CLIENT_TRIAL_EXPIRING` | info | Snapshot clientes | **BUILD** (FE) |
| `CLIENT_STATE_INCOHERENT` | critical | Snapshot clientes | **BUILD** (FE) |
| `CLIENT_SUSPENDED` | info | Snapshot clientes | **BUILD** (FE) |
| `CONN_ERROR_ON_TENANT` | critical | `conexionService` por tenant | **DEFER** — N+1; no banner global |
| `LICENSE_EXPIRING_TENANT` | info | `cliente-modulo` por tenant | **DEFER** — N+1 |
| `LICENSE_EXPIRED_TENANT` | critical | idem | **DEFER** — N+1 |
| `USER_BLOCKED` | warning | `getUsuariosGlobales` con paginación | **PARTIAL** — requiere listado >1 página o `limit=100` |
| `IP_SUSPICIOUS` | warning | `estadisticas` → `top_ips` | **BUILD** |

### 5.2 Reglas §4.2 — Backend futuro (no P1)

`CONN_ERROR_RECENT`, `CONN_NO_SUCCESS_RECENT`, `CONN_DEDICATED_NO_PRINCIPAL`, `LICENSE_EXPIRED_ACTIVE`, `LICENSE_EXPIRING`, `MODULE_CATALOG_INACTIVE_WITH_ACTIVE_LICENSES`, `SSO_MODE_WITHOUT_FEDERATION`, `SYNC_ENABLED_STALE`, `TENANT_NO_ACTIVE_USERS`, `PLATFORM_OPERATOR_NONE_ACTIVE`.

### 5.3 Implementación propuesta W15

```
src/features/super-admin/dashboard/
  utils/dashboard-alert.rules.ts      ← reglas puras (input → AlertItem[])
  components/PlatformAlertBanner.tsx  ← banner dismissible
```

**Inputs cacheados (React Query):**

- `auditoriaEstadisticas` (24h)
- `clientesSnapshot`
- `usuariosGlobales` (limit alto, opcional)

**Principio:** composición sobre datos ya fetched para el dashboard; **no** requests adicionales por alerta.

---

## 6. Seguridad

### 6.1 Inventario vs P0

| Capacidad | P0 | P1 propuesto | Endpoint | Servicio FE |
|-----------|----|--------------|----------|-------------|
| Logins exitosos 24h | ❌ | **W4** KPI | `GET /superadmin/auditoria/estadisticas/` | Nuevo `getAuditoriaEstadisticas` |
| Logins fallidos 24h | ❌ | **W3** KPI | idem | idem |
| Sync fallidas 24h | ❌ | **W5** KPI | idem | idem |
| Eventos por tipo | ❌ | **W6** mini chart | idem | idem |
| Top IPs | ❌ | **W7** tabla compacta | idem | idem |
| Top usuarios eventos | ❌ | **W8** tabla | idem | idem |
| Actividad reciente | ✅ W9 | Ampliar a `limit=15` | `autenticacion/` | Existente |
| Feed sync | ❌ | **W10** panel | `sincronizacion/` | Nuevo `getSyncLogs` |
| Usuarios platform | Parcial W12 | Panel operadores | `usuarios/?cliente_id=SYSTEM` | Extender servicio |
| Top tenants actividad | ❌ | **BFF F4** | — | No hoy |

### 6.2 Actividad reciente (W9) — ampliación P1

| Mejora | Detalle |
|--------|---------|
| `limit` 5 → 15 | Contrato §5 bundle recomendado |
| Filtro rápido «Solo fallos» | Link `/super-admin/auditoria?exito=failed` o query param |
| Extraer `AuthActivityFeed` | DRY con `AuthAuditLogPanel` |
| Polling 60s | Contrato §8.2 |

### 6.3 Usuarios Platform

| Métrica | Cómo (contrato §2.3) | Gap FE |
|---------|----------------------|--------|
| Total usuarios | W12 P0 | ✅ |
| Usuarios activos | `es_activo=true`, `limit=1` → total | **BUILD** — 1 query extra |
| Operadores activos | Filtrar `cliente_id=00000000-0000-0000-0000-000000000001` + `is_super_admin` | **BUILD** — añadir `cliente_id` a params servicio |
| Usuarios bloqueados | `fecha_bloqueo != null` en listado | **PARTIAL** — paginar si >100 |
| Acceso reciente | `ordenar_por=fecha_ultimo_acceso&limit=10` | **BUILD** — extender params servicio |

**Constante disponible:** `PLATFORM_SUPERADMIN_CLIENTE_ID` en `src/core/auth/utils/auth-session-snapshot.ts`.

### 6.4 Clasificación seguridad P1

| Prioridad | Entregable |
|-----------|------------|
| **P1-A (must)** | Servicio stats + KPIs W3–W5 + banner alertas auth/sync |
| **P1-B (should)** | W6–W8 paneles + W10 sync feed |
| **P1-C (should)** | Panel operadores platform + usuarios recientes |
| **Defer** | Series temporales, top tenants, sesiones activas globales |

---

## 7. Conexiones

### 7.1 Información existente hoy (Frontend)

| Dato | Fuente | Alcance |
|------|--------|---------|
| Listado conexiones | `conexionService.getConexiones(cliente_id)` | Por tenant |
| Conexión principal módulo | `getConexionPrincipal(cliente_id, modulo_id)` | Por tenant + módulo |
| `ultimo_error`, `fecha_ultimo_error` | Tipo `Conexion` | Por conexión |
| `ultima_conexion_exitosa`, `es_activo` | Tipo `Conexion` | Por conexión |
| Conteo BD | `clienteService.getClienteStats(id)` → `conexiones_bd` | Por tenant |
| Test conectividad | `POST /conexiones/test` | ⚠️ Simulado — contrato §9 **no usar en alertas** |

**UI existente:** `ClientConnectionsTab`, stats en `ClientDetailPage`.

### 7.2 Viabilidad global en Dashboard P1

| Widget | Viable | Alternativa P1 |
|--------|--------|----------------|
| Total conexiones activas global | **No** | — |
| Lista conexiones críticas | **No** | Link «Revisar conexiones» → detalle cliente |
| Semáforo salud global | **No** | — |
| KPI conexiones por tenant | **Sí** (detalle) | Tab conexiones — fuera home |
| Alerta error conexión reciente (global) | **No** | BFF F7/F8 |

### 7.3 Recomendación

**No reintroducir tarjeta «Conexiones» en home P1.** Opcional: CTA en alertas o acciones rápidas hacia Clientes con badge «Revisar tenants dedicated» (solo si snapshot detecta `tipo_instalacion=dedicated` — dato ya en listado clientes, **sin** llamar conexiones).

---

## 8. Matriz consolidada — widgets P1

| # | Widget / bloque | Clasificación | Dependencia FE |
|---|-----------------|---------------|----------------|
| W1–W2, W11–W12, W9 | P0 | ✅ Hecho | — |
| W3–W5 | KPIs seguridad 24h | **BUILD** | `getAuditoriaEstadisticas` + tipos |
| W6 | Chart eventos | **BUILD** | idem |
| W7–W8 | Top IPs / usuarios | **BUILD** | idem |
| W10 | Feed sync | **BUILD** | `getSyncLogs` + tipos |
| W13 | Clientes recientes | **BUILD** | Snapshot + sort `fecha_creacion` |
| W14 | Donut planes | **BUILD** | Snapshot + util agregación |
| W15 | Banner alertas | **BUILD** | Reglas §4.1 + datos anteriores |
| Estados clientes (mini-KPIs) | **BUILD** | Snapshot |
| Licencias global | **BFF** | F5, F6 |
| Conexiones global | **BFF** | F7, F8 |
| Operadores platform | **BUILD** | Extender `superadminUsuarioService` |
| Polling / refresh toolbar | **BUILD** | §8.2 contrato |

**Leyenda:** **BUILD** = implementable P1 sin endpoint nuevo | **BFF** = esperar `GET /superadmin/dashboard/` | **PARTIAL** = viable con limitaciones documentadas

---

## 9. Gaps Frontend a cerrar antes/durante P1

| ID | Gap | Acción | Archivo sugerido |
|----|-----|--------|------------------|
| G-01 | Sin `getAuditoriaEstadisticas` | Método + tipos response | `superadmin-auditoria.service.ts`, `superadmin-auditoria.types.ts` |
| G-02 | Sin `getSyncLogs` | Método + tipos paginación | idem |
| G-03 | Sin agregación clientes | Util snapshot | `dashboard/utils/clientes-snapshot.utils.ts` |
| G-04 | Sin motor alertas | Reglas puras + banner | `dashboard/utils/dashboard-alert.rules.ts` |
| G-05 | `SuperadminUsuarioListParams` incompleto | `cliente_id`, `ordenar_por`, `orden` | `superadmin-usuario.service.ts` |
| G-06 | Hook monolítico P0 | Evolucionar a `usePlatformDashboardP1` | `dashboard/hooks/` |
| G-07 | `AuthActivityFeed` compartido | Extraer de panel auditoría | `dashboard/components/` |
| G-08 | Sin componente chart | Recharts existente en proyecto | Donut W14 / barras W6 |

---

## 10. Plan de construcción P1 (3 sub-fases)

### Fase P1-A — Seguridad operativa (2–3 d)

| Entregable | Widgets |
|------------|---------|
| `getAuditoriaEstadisticas(periodo)` | W3, W4, W5 |
| 3 KPIs auth/sync en fila superior o segunda fila | W3–W5 |
| `PlatformAlertBanner` reglas auth/sync/IP | W15 parcial |
| Selector ventana 24h / refresh | §8.2 |

**Requests nuevos:** +1 (`estadisticas`).

### Fase P1-B — Cartera clientes (2–3 d)

| Entregable | Widgets |
|------------|---------|
| `fetchClientesSnapshot()` limit 1000 | Base agregación |
| Mini-KPIs: suspendidos, trial, cancelados, morosos | §3 |
| Donut distribución plan (basico/profesional/enterprise/trial) | W14 |
| Alertas clientes en banner | W15 `CLIENT_*` |
| Nota degradación si >1000 tenants | UX |

**Requests nuevos:** +1 (snapshot; cache compartido con W14 y alertas).

### Fase P1-C — Profundidad operativa (1–2 d)

| Entregable | Widgets |
|------------|---------|
| `getSyncLogs` + panel sync | W10 |
| Top IPs / top usuarios tablas compactas | W7, W8 |
| Clientes recientes (sort FE) | W13 |
| Panel operadores Platform | §6.3 |
| Ampliar actividad W9 a 15 + polling | W9 |
| Gráfico eventos por tipo (opcional) | W6 |

**Requests nuevos:** +2–3 (`sincronizacion`, usuarios filtrados, opcional listado usuarios).

### Bundle de carga P1 objetivo (paralelo)

```text
Promise.allSettled([
  /* P0 */
  GET /clientes/?solo_activos=true&limit=1,
  GET /clientes/?solo_activos=false&limit=1,
  GET /modulos-v2/?limit=1,
  GET /superadmin/usuarios/?limit=1,
  GET /superadmin/auditoria/autenticacion/?limit=15&orden=desc,
  /* P1 */
  GET /superadmin/auditoria/estadisticas/?fecha_desde={24h},
  GET /clientes/?solo_activos=false&limit=1000&skip=0,
  GET /superadmin/auditoria/sincronizacion/?limit=10&orden=desc,
  GET /superadmin/usuarios/?cliente_id={SYSTEM}&es_activo=true&limit=50,
])
```

**Total orientativo:** 8–9 requests paralelos; degradación parcial por widget.

---

## 11. Dashboard objetivo — layout visual P1

Conserva tokens P0 (`rounded-xl`, grid KPI, acciones rápidas). Evoluciona a **consola operativa** en 5 zonas:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard Platform                    [Ventana: 24h ▼]  [↻ Actualizar] │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ W1 Activ │ W2 Total │ W12 User │ W11 Mod  │ W4 OK    │ W3 Fallos       │
│ clientes │ clientes │          │ catálogo │ logins   │ logins          │
├──────────┴──────────┴──────────┴──────────┴──────────┴─────────────────┤
│ W15 PlatformAlertBanner (0–N: auth, sync, trial, incoherente, IP…)      │
├───────────────────────────────┬─────────────────────────────────────────┤
│ SALUD CARTERA                 │ SEGURIDAD                               │
│ ┌─────┬─────┬─────┬─────┐     │ ┌─────────────┬─────────────────────┐   │
│ │Susp.│Trial│Canc.│Mor. │     │ │ W6 eventos  │ W7 Top IPs (mini)   │   │
│ └─────┴─────┴─────┴─────┘     │ └─────────────┴─────────────────────┘   │
│ W14 Donut planes              │ W8 Top usuarios (mini)                  │
│ (Básico/Prof/Emp/Trial)       │                                         │
├───────────────────────────────┴─────────────────────────────────────────┤
│ OPERACIÓN RECIENTE                                                      │
│ ┌─────────────────────────────┬───────────────────────────────────────┐ │
│ │ W9 Actividad auth (15)      │ W10 Sync recientes / fallos           │ │
│ │ Ver todo → /auditoria       │ Ver fallos → /auditoria?estado=fallido│ │
│ └─────────────────────────────┴───────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ W13 Clientes recientes (5)          │ Operadores Platform (5)           │
├─────────────────────────────────────────────────────────────────────────┤
│ Acciones rápidas: Clientes | Módulos | Auditoría Global                  │
└─────────────────────────────────────────────────────────────────────────┘

EXCLUIDO P1 (placeholder o link):
  · Licencias global (vencidas / por vencer / activas)
  · Conexiones global / semáforo salud BD
  · Top tenants por actividad
```

### 11.1 Jerarquía operativa

1. **Banner alertas** — acción inmediata (W15).
2. **KPIs seguridad 24h** — señal de incidente (W3–W5).
3. **Salud cartera** — negocio SaaS (estados + planes).
4. **Feeds** — investigación (W9, W10, W13).
5. **Drill-down** — links a Clientes, Auditoría, detalle tenant.

### 11.2 Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| `< lg` | KPIs 2 cols; paneles apilados |
| `lg+` | KPIs 6 cols (fila extendida) o 4+2; cartera|seguridad 2 cols |
| Tablas top IPs | `overflow-x-auto` (patrón Auditoría Global) |

---

## 12. Fuera de alcance P1 (explícito)

| Ítem | Motivo | Fase |
|------|--------|------|
| Licencias global (vencidas/por vencer/activas) | N+1 / BFF F5 | P2/BFF |
| Conexiones global | Solo per-tenant §1.11 | P2/BFF |
| Top módulos activados | BFF F6 | P2/BFF |
| Alertas conexión/licencia global | §4.2 | P2/BFF |
| Scan N tenants × conexiones/licencias | Contrato prohíbe | — |
| BFF `GET /superadmin/dashboard/` | No existe | P2 |
| MRR, churn, métricas API `/metrics` | §9 contrato | — |
| Rediseño shell Platform (H1, toolbar) | Fuera scope P1 | P3 UX |

---

## 13. Riesgos P1

| ID | Riesgo | Mitigación |
|----|--------|------------|
| R-P1-01 | Snapshot clientes incompleto si >1000 | Badge «parcial» + BFF futuro |
| R-P1-02 | `estadisticas/` sin servicio FE retrasa P1-A | Priorizar G-01 en sprint day 1 |
| R-P1-03 | Filtros plan/estado en ClientManagement no van al API | No reutilizar ese path; snapshot dedicado |
| R-P1-04 | Operador confunde licencias catálogo vs activaciones | Copy claro; no KPI licencias global |
| R-P1-05 | 8–9 requests al mount | `allSettled`, staleTime, cache snapshot |
| R-P1-06 | Dedicated tenants ausentes en auditoría global | Disclaimer contrato §3.5 |
| R-P1-07 | `USER_BLOCKED` incompleto con limit=1 | Query `limit=100` o contador aproximado |

---

## 14. Criterios de aceptación P1 (pre-implementación)

| # | Criterio |
|---|----------|
| AC-01 | Cero datos mock; extensión de P0, no regresión |
| AC-02 | W3–W5 alimentados por `estadisticas/` real |
| AC-03 | Estados/planes derivados de snapshot, excluyendo SYSTEM |
| AC-04 | Banner W15 con códigos trazables a §4.1 |
| AC-05 | Sin KPI global licencias/conexiones inventados |
| AC-06 | Degradación parcial si una API falla |
| AC-07 | Links operativos a Clientes / Auditoría con contexto |

---

## 15. Conclusión

Dashboard P1 **puede construirse íntegramente sobre contratos §1 ya documentados**, extendiendo servicios FE en 3 gaps (stats auditoría, sync logs, params usuarios) y una util de agregación clientes. La consola operativa prioriza **seguridad (24h)**, **salud de cartera (estados/planes/alertas clientes)** y **feeds ampliados**, reutilizando `AuthAuditLogPanel` y el hook P0.

**No implementar en P1:** licencias globales, conexiones globales, top tenants, alertas que requieran N+1 — reservados al BFF `GET /api/v1/superadmin/dashboard/`.

**Orden recomendado:** P1-A (seguridad) → P1-B (cartera) → P1-C (feeds + operadores).

---

**Referencias código analizadas:**

- `src/features/super-admin/dashboard/hooks/usePlatformDashboardP0.ts`
- `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx`
- `src/services/superadmin-auditoria.service.ts`
- `src/services/superadmin-usuario.service.ts`
- `src/features/super-admin/clientes/services/cliente.service.ts`
- `src/features/modulos/services/cliente-modulo.service.ts`
- `src/features/super-admin/clientes/services/conexion.service.ts`
- `src/core/auth/utils/auth-session-snapshot.ts`
- `src/core/constants/subscription.types.ts`

*Fin — PLATFORM_DASHBOARD_P1_CAPABILITY_AUDIT.md — sin código, sin commits.*
