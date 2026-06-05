# PLATFORM_DASHBOARD_P1A_IMPLEMENTATION_REPORT.md

**Fase:** Dashboard P1-A — Seguridad operativa  
**Fecha:** 2026-06-03  
**Contrato:** `PLATFORM_DASHBOARD_FRONTEND_CONTRACT.md` §1.4, §4.1  
**Baseline:** P0 (`PLATFORM_DASHBOARD_P0_IMPLEMENTATION_REPORT.md`)

---

## 1. Resumen

Se extendió el Dashboard Platform con capacidades de **seguridad operativa 24h** sin modificar el bloque visual P0 existente. Todos los datos provienen de `GET /superadmin/auditoria/estadisticas/`.

| Entregable | Widget / regla | Estado |
|------------|----------------|--------|
| KPI logins fallidos 24h | W3 | ✅ |
| KPI logins exitosos 24h | W4 | ✅ |
| KPI sync fallidas 24h | W5 | ✅ |
| `getAuditoriaEstadisticas()` | Servicio | ✅ |
| Tipos `AuditoriaEstadisticasResponse` | Tipos | ✅ |
| `PlatformAlertBanner` | UI | ✅ |
| `AUTH_LOGIN_FAILURES_HIGH` | Alerta | ✅ |
| `AUTH_SYNC_FAILURES` | Alerta | ✅ |
| `IP_SUSPICIOUS` | Alerta | ✅ |

**Sin mock.** **Sin cambios** en Clientes, Módulos, Catálogos ni Auditoría Global.

---

## 2. Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `src/types/superadmin-auditoria.types.ts` | Tipos estadísticas agregadas |
| `src/services/superadmin-auditoria.service.ts` | `getAuditoriaEstadisticas()` |
| `src/features/super-admin/dashboard/utils/auditoria-period.utils.ts` | Ventana 24h |
| `src/features/super-admin/dashboard/utils/dashboard-alert.rules.ts` | Reglas alertas P1-A |
| `src/features/super-admin/dashboard/hooks/usePlatformDashboardP1A.ts` | Hook React Query |
| `src/features/super-admin/dashboard/components/PlatformAlertBanner.tsx` | Banner dismissible |
| `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx` | Integración additive |
| `src/features/super-admin/dashboard/utils/__tests__/dashboard-alert.rules.test.ts` | Tests reglas |
| `src/features/super-admin/dashboard/utils/__tests__/auditoria-period.utils.test.ts` | Tests ventana |
| `src/features/super-admin/dashboard/hooks/__tests__/usePlatformDashboardP1A.test.ts` | Tests hook |

**No modificados:** `AuthAuditLogPanel`, rutas auditoría, servicios clientes/módulos/catálogos.

---

## 3. Integración API

### 3.1 Endpoint

```http
GET /api/v1/superadmin/auditoria/estadisticas/?fecha_desde={ISO}&fecha_hasta={ISO}
```

- **Ventana:** últimas 24 h (`getLast24HoursRange()`).
- **Alcance:** global (sin `cliente_id`).

### 3.2 Mapeo widgets

| Widget | Campo response |
|--------|----------------|
| W3 Logins fallidos | `autenticacion.login_fallidos` |
| W4 Logins exitosos | `autenticacion.login_exitosos` |
| W5 Sync fallidas | `sincronizacion.fallidas` |

### 3.3 Reglas alertas (§4.1)

| Código | Condición | Umbral |
|--------|-----------|--------|
| `AUTH_LOGIN_FAILURES_HIGH` | `login_fallidos >= 50` | `AUTH_LOGIN_FAILURES_THRESHOLD = 50` |
| `AUTH_SYNC_FAILURES` | `sincronizacion.fallidas > 0` | — |
| `IP_SUSPICIOUS` | `eventos_fallidos / total_eventos > 0.5` | Por cada ítem en `top_ips[]` |

Alertas derivadas **solo** de la respuesta cacheada de estadísticas (sin requests extra).

---

## 4. Layout (additive sobre P0)

```
[Header P0 — sin cambios]
[Fila KPI P0 — 4 tarjetas — sin cambios]
[Fila KPI P1-A — 3 tarjetas: fallidos | exitosos | sync fallidas]  ← nuevo
[PlatformAlertBanner — 0–N alertas]                                  ← nuevo
[Actividad reciente P0 — sin cambios]
[Acciones rápidas P0 — sin cambios]
```

Degradación parcial: si `estadisticas` falla, KPIs P1-A muestran `—`; P0 sigue operativo con hooks independientes.

---

## 5. Arquitectura

```
SuperAdminDashboard
├── usePlatformDashboardP0(isSuperAdmin)     ← intacto
└── usePlatformDashboardP1A(isSuperAdmin)   ← nuevo
      └── useQuery → getAuditoriaEstadisticas(24h)
            ├── W3 / W4 / W5 metrics
            └── buildSecurityAlertsFromEstadisticas()
                  └── PlatformAlertBanner
```

- **staleTime:** 60s (alineado P0).
- **Query key:** `['platform-dashboard', 'auditoria-estadisticas', fecha_desde, fecha_hasta]`.

---

## 6. QA ejecutado

### 6.1 Automatizado

| Comando | Resultado |
|---------|-----------|
| `npm run test:run -- src/features/super-admin/dashboard` | **11/11 passed** |
| ESLint archivos P1-A | **0 errores** |
| ReadLints IDE | **0 errores** |

**Cobertura tests:**

| Suite | Casos |
|-------|-------|
| `dashboard-alert.rules.test.ts` | 5 — umbrales AUTH_LOGIN, AUTH_SYNC, IP_SUSPICIOUS |
| `auditoria-period.utils.test.ts` | 1 — ventana 24h |
| `usePlatformDashboardP1A.test.ts` | 3 — W3–W5, alertas, enabled=false |
| `usePlatformDashboardP0.test.ts` | 2 — regresión P0 |

### 6.2 Manual (checklist staging)

| # | Caso | Código |
|---|------|--------|
| M1 | Fila P0 intacta (4 KPIs clientes/usuarios/módulos) | ✅ Estructura |
| M2 | 3 KPIs seguridad cargan desde Network `estadisticas/` | ⏳ Staging |
| M3 | KPIs P1-A en error no bloquean P0 | ✅ Hooks separados |
| M4 | Banner visible si fallidos ≥ 50 o sync fallidas > 0 | ✅ Tests |
| M5 | Banner dismissible por ítem | ✅ UI |
| M6 | Links alerta → `/super-admin/auditoria` (+ query params) | ✅ |
| M7 | Sin literals mock en dashboard | ✅ |

---

## 7. Evidencia consumo API (tests)

```typescript
expect(superadminAuditoriaService.getAuditoriaEstadisticas).toHaveBeenCalledTimes(1);
// call[0]: { fecha_desde: ISO, fecha_hasta: ISO }

expect(result.current.loginsFallidos.value).toBe(70);   // W3
expect(result.current.loginsExitosos.value).toBe(1180); // W4
expect(result.current.syncFallidas.value).toBe(3);      // W5
```

Respuesta simulada alineada al contrato §1.4 ejemplo JSON.

---

## 8. Limitaciones / P1-B pendiente

| Item | Fase |
|------|------|
| W6–W8 (charts, top IPs tabular en panel) | P1-C |
| W10 feed sync | P1-C |
| Alertas `CLIENT_*` | P1-B |
| Polling toolbar refresh | P1-C |
| Query params auditoría (`evento`, `ip_address`) leídos por `AuthAuditLogPanel` | Mejora futura (sin tocar panel en P1-A) |

---

## 9. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| `estadisticas/` 404/403 en staging | KPIs P1-A `—`; P0 operativo |
| Dedicated tenants ausentes en stats | Disclaimer contrato §3.5 (sin cambio P1-A) |
| Muchas IPs sospechosas → banner largo | Dismiss por ítem; scroll natural |

---

## 10. Conclusión

P1-A cumple el objetivo de **consola operativa de seguridad** sobre la estructura P0: una query de estadísticas alimenta W3–W5 y el banner de alertas derivadas, con tests y degradación parcial.

**Siguiente:** P1-B — snapshot clientes, estados, donut planes, alertas `CLIENT_*`.

---

*Fin — PLATFORM_DASHBOARD_P1A_IMPLEMENTATION_REPORT.md*
