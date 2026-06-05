# PLATFORM_DASHBOARD_P1C_IMPLEMENTATION_REPORT.md

**Fase:** Dashboard P1-C — Profundidad operativa  
**Fecha:** 2026-06-03  
**Contrato:** `PLATFORM_DASHBOARD_FRONTEND_CONTRACT.md` §1.4–1.7, W6–W10, W13  
**Referencias:** `PLATFORM_DASHBOARD_P1_CAPABILITY_AUDIT.md`, P1-A/B reports, `PLATFORM_DASHBOARD_UX1_IMPLEMENTATION_REPORT.md`

---

## 1. Resumen

Se completaron los widgets P1 restantes **implementables con contratos existentes**, manteniendo layout UX-1, React Query, degradación parcial por widget y cero datos mock.

| Entregable | Widget | Estado |
|------------|--------|--------|
| Gráfico eventos por tipo | **W6** | ✅ Recharts bar |
| Tabla top IPs | **W7** | ✅ |
| Tabla top usuarios | **W8** | ✅ |
| Feed sincronización | **W10** | ✅ |
| Clientes recientes | **W13** | ✅ Sort FE snapshot |
| Operadores Platform | §6.3 | ✅ |
| Actividad auth ampliada | **W9** | ✅ limit 5 → 15 |
| Alertas operadores | **W15** | ✅ `USER_BLOCKED`, `PLATFORM_OPERATOR_NONE_ACTIVE` |
| Layout UX-1 | — | ✅ Preservado |
| Tests dashboard | — | ✅ **28/28** |

**No implementado (BFF / fuera contrato §1):** licencias globales, conexiones globales, top tenants, W15 reglas §4.2 server-side.

---

## 2. Archivos creados / modificados

### 2.1 Servicios y tipos

| Archivo | Acción |
|---------|--------|
| `src/types/superadmin-auditoria.types.ts` | **Modificado** — `SyncAuditLog`, `PaginatedSyncAuditLogResponse` |
| `src/services/superadmin-auditoria.service.ts` | **Modificado** — `getSyncLogs()` |
| `src/services/superadmin-usuario.service.ts` | **Modificado** — params `cliente_id`, `ordenar_por`, `orden` |

### 2.2 Dashboard feature

| Archivo | Acción |
|---------|--------|
| `hooks/usePlatformDashboardP1C.ts` | **Creado** — sync, operadores, W13, alertas operador |
| `hooks/usePlatformDashboardP0.ts` | **Modificado** — W9 `limit: 15` |
| `utils/auditoria-stats.utils.ts` | **Creado** — `toEventTypeChartSegments` (W6) |
| `utils/clientes-snapshot.utils.ts` | **Modificado** — `getRecentClientesFromSnapshot` (W13) |
| `utils/dashboard-alert.rules.ts` | **Modificado** — `buildOperatorAlertsFromUsuarios` |
| `pages/SuperAdminDashboard.tsx` | **Modificado** — widgets P1-C + sección Operación |
| `components/DashboardPanel.tsx` | **Creado** — panel reutilizable UX-1 |
| `components/AuthEventsBarChart.tsx` | **Creado** — W6 |
| `components/TopIpsTable.tsx` | **Creado** — W7 |
| `components/TopUsuariosTable.tsx` | **Creado** — W8 |
| `components/SyncActivityFeed.tsx` | **Creado** — W10 |
| `components/RecentClientesList.tsx` | **Creado** — W13 |
| `components/PlatformOperatorsPanel.tsx` | **Creado** — operadores Platform |

### 2.3 Tests

| Archivo | Acción |
|---------|--------|
| `utils/__tests__/auditoria-stats.utils.test.ts` | **Creado** |
| `utils/__tests__/clientes-snapshot.utils.test.ts` | **Modificado** — W13 |
| `utils/__tests__/dashboard-alert.rules.test.ts` | **Modificado** — alertas operador |
| `hooks/__tests__/usePlatformDashboardP1C.test.ts` | **Creado** |
| `hooks/__tests__/usePlatformDashboardP0.test.ts` | **Modificado** — limit 15 |

**Sin cambios:** Header, Breadcrumb, LayoutWrapper, shell, Backend, hooks P1-A/P1-B (salvo consumo de `estadisticas` ya expuesto).

---

## 3. Widgets implementados

### W6 — Eventos por tipo (24 h)

| Campo | Valor |
|-------|-------|
| **Fuente** | `GET /superadmin/auditoria/estadisticas/` → `autenticacion.eventos_por_tipo` |
| **Hook** | Reutiliza `usePlatformDashboardP1A` (`security.estadisticas`) |
| **UI** | `AuthEventsBarChart` — barras Recharts, degradación loading/error/empty |
| **Ubicación** | Sección **Seguridad 24h**, grid 3 cols bajo KPIs |

### W7 — Top IPs

| Campo | Valor |
|-------|-------|
| **Fuente** | `estadisticas.top_ips` |
| **UI** | `TopIpsTable` — link drill-down `/super-admin/auditoria?ip_address=` |
| **Alertas** | Reglas `IP_SUSPICIOUS` ya en P1-A (sin cambio) |

### W8 — Top usuarios

| Campo | Valor |
|-------|-------|
| **Fuente** | `estadisticas.top_usuarios` |
| **UI** | `TopUsuariosTable` — usuario + total eventos |

### W9 — Actividad auth (ampliación)

| Campo | Valor |
|-------|-------|
| **Request** | `GET /superadmin/auditoria/autenticacion/?page=1&limit=15&orden=desc` |
| **Cambio** | `usePlatformDashboardP0` limit 5 → **15** |
| **UI** | Panel en sección **Operación** (sin cambio visual de filas) |

### W10 — Feed sincronización

| Campo | Valor |
|-------|-------|
| **Request** | `GET /superadmin/auditoria/sincronizacion/?page=1&limit=10&orden=desc&ordenar_por=fecha_sincronizacion` |
| **Servicio** | `superadminAuditoriaService.getSyncLogs()` (**nuevo**) |
| **Hook** | `usePlatformDashboardP1C` — `refetchInterval: 60s` |
| **UI** | `SyncActivityFeed` — estado exitoso/fallido, link fallos auditoría |

### W13 — Clientes recientes

| Campo | Valor |
|-------|-------|
| **Request** | Snapshot compartido `GET /clientes/?solo_activos=false&limit=1000` |
| **Lógica** | `getRecentClientesFromSnapshot()` — sort FE `fecha_creacion` desc, top 5 |
| **Cache** | Misma queryKey `platform-dashboard/clientes-snapshot` que P1-B |
| **UI** | `RecentClientesList` — link detalle cliente, nota si snapshot parcial |

### Operadores Platform

| Campo | Valor |
|-------|-------|
| **Request** | `GET /superadmin/usuarios/?cliente_id={PLATFORM_SUPERADMIN_CLIENTE_ID}&es_activo=true&limit=50&ordenar_por=fecha_ultimo_acceso&orden=desc` |
| **Constante** | `PLATFORM_SUPERADMIN_CLIENTE_ID` (`auth-session-snapshot.ts`) |
| **UI** | `PlatformOperatorsPanel` — top 5 + contador adicional |

### Alertas integradas (W15 extensión)

| Código | Severidad | Condición |
|--------|-----------|-----------|
| `USER_BLOCKED` | warning | Scan `GET /usuarios/?limit=100` — `fecha_bloqueo != null` (parcial si >100 usuarios) |
| `PLATFORM_OPERATOR_NONE_ACTIVE` | critical | Lista operadores SYSTEM activos vacía |

Merge en dashboard:

```typescript
mergeDashboardAlerts(
  security.securityAlerts,
  portfolio.portfolioAlerts,
  operations.operatorAlerts,
)
```

---

## 4. Contratos consumidos

| Endpoint | Widgets / uso |
|----------|---------------|
| `GET /superadmin/auditoria/estadisticas/?fecha_desde&fecha_hasta` | W3–W8 (P1-A + P1-C) |
| `GET /superadmin/auditoria/autenticacion/?limit=15` | W9 |
| `GET /superadmin/auditoria/sincronizacion/?limit=10` | **W10** (nuevo consumo FE) |
| `GET /clientes/?solo_activos=false&limit=1000` | W13 + P1-B (cache compartida) |
| `GET /superadmin/usuarios/?cliente_id=SYSTEM&…` | Operadores Platform |
| `GET /superadmin/usuarios/?limit=100` | Alerta `USER_BLOCKED` |

**Total requests nuevos al mount (orientativo):** +2 respecto P1-B (`sincronizacion`, scan bloqueados) + operadores filtrados; snapshot no duplica fetch gracias a React Query cache.

---

## 5. Layout final (UX-1 preservado)

```
Centro de Operaciones
→ PlatformAlertBanner (auth + cartera + operadores)
→ PLATAFORMA [4 KPIs]
→ SEGURIDAD 24h
    [3 KPIs]
    [W6 Eventos por tipo | W7 Top IPs | W8 Top usuarios]
→ CARTERA [4 KPIs + donut W14]
→ OPERACIÓN
    [W9 Actividad 15 | W10 Sync feed]
    [W13 Clientes recientes | Operadores Platform]
→ Acciones rápidas
```

Mock textual:

```
┌─ SEGURIDAD 24h ─────────────────────────────────────────────────────────┐
│ [KPI fallidos][KPI exitosos][KPI sync fallidas]                         │
│ ┌─────────────┬─────────────┬─────────────┐                               │
│ │ Eventos/tipo│ Top IPs     │ Top usuarios│                               │
│ │ [bar chart] │ IP | T | F  │ user | ev   │                               │
│ └─────────────┴─────────────┴─────────────┘                               │
└──────────────────────────────────────────────────────────────────────────┘

┌─ OPERACIÓN ─────────────────────────────────────────────────────────────┐
│ Actividad reciente (15)          │ Sync recientes (10)                    │
│ ● tenant · evento · HH:MM        │ ✓/✗ tipo · operación · HH:MM           │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Clientes recientes (5)           │ Operadores Platform (5)                │
│ NEW Corp · plan · fecha          │ ops.admin · último acceso              │
└──────────────────────────────────┴────────────────────────────────────────┘
```

---

## 6. QA ejecutado

### 6.1 Tests automatizados

```bash
npx vitest run src/features/super-admin/dashboard
```

| Suite | Tests | Resultado |
|-------|-------|-----------|
| `auditoria-period.utils.test.ts` | 1 | ✅ |
| `auditoria-stats.utils.test.ts` | 2 | ✅ |
| `dashboard-alert.rules.test.ts` | 10 | ✅ |
| `clientes-snapshot.utils.test.ts` | 5 | ✅ |
| `usePlatformDashboardP0.test.ts` | 2 | ✅ |
| `usePlatformDashboardP1A.test.ts` | 3 | ✅ |
| `usePlatformDashboardP1B.test.ts` | 2 | ✅ |
| `usePlatformDashboardP1C.test.ts` | 3 | ✅ |
| **Total** | **28** | **✅ PASS** |

### 6.2 Checklist manual recomendado

- [ ] W6 renderiza barras con datos reales o empty state honesto
- [ ] W7 links IP abren auditoría filtrada
- [ ] W8 lista usuarios del periodo 24h
- [ ] W9 muestra hasta 15 eventos auth
- [ ] W10 feed sync con estados exitoso/fallido y mensaje error
- [ ] W13 orden cronológico correcto; nota si snapshot >1000 clientes
- [ ] Operadores listan usuarios SYSTEM activos
- [ ] Banner muestra `USER_BLOCKED` / `PLATFORM_OPERATOR_NONE_ACTIVE` cuando aplica
- [ ] Fallo de un endpoint no tumba otros widgets (degradación parcial)
- [ ] Shell / breadcrumb / header sin cambios

---

## 7. Degradación parcial por widget

| Widget | Si falla API | Comportamiento |
|--------|--------------|----------------|
| W6–W8 | `estadisticas/` error | Mensaje en panel; KPIs W3–W5 muestran «—» |
| W9 | `autenticacion/` error | Panel error independiente |
| W10 | `sincronizacion/` error | Panel error; KPI sync y alerta AUTH_SYNC siguen desde stats |
| W13 | snapshot error | Panel error; cartera P1-B también degrada |
| Operadores | `usuarios/` error | Panel error; alerta operador omitida |
| USER_BLOCKED | scan usuarios error | Sin alerta USER_BLOCKED (no inventar conteo) |

---

## 8. Limitaciones — futuro BFF

| Ítem | Motivo | Fase |
|------|--------|------|
| Licencias globales (vencidas / por vencer / activas) | N+1 `cliente-modulo` por tenant | BFF F5/F6 |
| Conexiones globales / semáforo salud BD | Solo per-tenant §1.11 | BFF F7/F8 |
| Top tenants por actividad | Sin agregado server-side | BFF F4 |
| Alertas `LICENSE_*`, `CONN_*` globales | Requieren scan N tenants | BFF §4.2 |
| `USER_BLOCKED` conteo exacto | Scan limitado a 100 usuarios | BFF o endpoint contador |
| W13 clientes recientes globales exactos | Snapshot max 1000 | BFF F1 `clientes.recientes` |
| `GET /superadmin/dashboard/` bundle | No existe | P2 BFF |
| Polling toolbar / selector ventana 24h | UX-2 / contrato §8.2 UI | Opcional futuro |

---

## 9. Criterios de aceptación P1-C

| Criterio | Cumple |
|----------|--------|
| W6, W7, W8, W10, W13 implementados | ✅ |
| Operadores Platform | ✅ |
| Sin datos mock | ✅ |
| Sin endpoints nuevos Backend | ✅ |
| Layout UX-1 mantenido | ✅ |
| React Query + degradación parcial | ✅ |
| Alertas integradas en banner | ✅ |
| Tests verdes | ✅ 28/28 |

---

## 10. Cierre fase Dashboard P1

Con P1-C, el dashboard Platform consume **todos los widgets clasificados como BUILD** en la auditoría de capacidad P1. Los gaps restantes dependen exclusivamente del **BFF `GET /superadmin/dashboard/`** o reglas §4.2 que requieren agregación server-side.

**Próximo paso sugerido (fuera scope actual):** definir contrato BFF con Backend para licencias/conexiones globales y bundle de carga único.

---

*Implementación completada 2026-06-03.*
