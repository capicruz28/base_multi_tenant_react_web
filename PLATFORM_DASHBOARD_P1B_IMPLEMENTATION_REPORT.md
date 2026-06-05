# PLATFORM_DASHBOARD_P1B_IMPLEMENTATION_REPORT.md

**Fase:** Dashboard P1-B — Salud de cartera SaaS  
**Fecha:** 2026-06-03  
**Contrato:** `PLATFORM_DASHBOARD_FRONTEND_CONTRACT.md` §2.1, §4.1, W14  
**Referencias:** `PLATFORM_DASHBOARD_P1_CAPABILITY_AUDIT.md`, `PLATFORM_DASHBOARD_P1A_IMPLEMENTATION_REPORT.md`

---

## 1. Resumen

Se añadió la sección **Salud de cartera** bajo el bloque de seguridad P1-A, sin modificar KPIs P0 ni P1-A. Datos derivados de snapshot `GET /clientes/?solo_activos=false&limit=1000` con exclusión de tenant `SYSTEM`.

| Entregable | Estado |
|------------|--------|
| `fetchClientesSnapshot()` | ✅ |
| KPIs suspendidos / trial / cancelados / morosos | ✅ |
| W14 donut planes (Básico, Profesional, Enterprise, Trial) | ✅ Recharts |
| Alertas `CLIENT_*` en `PlatformAlertBanner` | ✅ |
| Degradación parcial | ✅ |
| Regresión P0 / P1-A | ✅ Tests |

---

## 2. Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `utils/clientes-snapshot.utils.ts` | **Creado** — fetch, filtro SYSTEM, agregación |
| `utils/dashboard-alert.rules.ts` | **Modificado** — reglas portfolio + `mergeDashboardAlerts` |
| `hooks/usePlatformDashboardP1B.ts` | **Creado** — React Query snapshot |
| `components/ClientesPlanDonutChart.tsx` | **Creado** — W14 con `recharts` |
| `pages/SuperAdminDashboard.tsx` | **Modificado** — sección cartera + alertas merge |
| `utils/__tests__/clientes-snapshot.utils.test.ts` | **Creado** |
| `utils/__tests__/dashboard-alert.rules.test.ts` | **Modificado** — tests CLIENT_* |
| `hooks/__tests__/usePlatformDashboardP1B.test.ts` | **Creado** |

**No modificados:** `cliente.service.ts` (reutiliza `getClientes`), Clientes/Módulos/Catálogos/Auditoría Global pages.

---

## 3. Snapshot clientes

### 3.1 Request

```http
GET /api/v1/clientes/?skip=0&limit=1000&solo_activos=false
```

- **FE:** `fetchClientesSnapshot()` → `clienteService.getClientes(1, CLIENTES_INACTIVE_FETCH_LIMIT, { activeFilter: 'all' })`
- **Exclusión:** `codigo_cliente !== 'SYSTEM'` (`filterBusinessClientes`)
- **Parcial:** `isPartial = total_clientes > clientes.length` en respuesta API

### 3.2 Agregación (`aggregateClientesSnapshot`)

| KPI / campo | Regla |
|-------------|--------|
| Suspendidos | `estado_suscripcion === 'suspendido'` |
| Trial | `plan_suscripcion === 'trial'` **o** `estado_suscripcion === 'trial'` |
| Cancelados | `estado_suscripcion === 'cancelado'` |
| Morosos | `estado_suscripcion === 'moroso'` |
| Por plan W14 | Agrupa `plan_suscripcion` en basico / profesional / enterprise / trial |
| Trial vencido | `plan_suscripcion=trial` y `fecha_fin_trial < hoy` |
| Trial por vencer | fin trial en próximos 7 días |
| Estado incoherente | `estado_suscripcion=activo` y `es_activo=false` |

---

## 4. Reglas alertas implementadas

| Código | Severidad | Condición |
|--------|-----------|-----------|
| `CLIENT_TRIAL_EXPIRED` | warning | `trialExpired > 0` |
| `CLIENT_TRIAL_EXPIRING` | info | `trialExpiring > 0` (ventana 7 días) |
| `CLIENT_STATE_INCOHERENT` | critical | `estadoIncoherente > 0` |
| `CLIENT_SUSPENDED` | info | `suspendidos > 0` |

Integración banner:

```typescript
mergeDashboardAlerts(security.securityAlerts, portfolio.portfolioAlerts)
```

Alertas P1-A (AUTH_*, IP_*) **sin cambios** — composición en dashboard.

---

## 5. Layout (additive)

```
[P0 — 4 KPIs — sin cambios]
[P1-A — 3 KPIs seguridad — sin cambios]
[P1-B — Salud de cartera]                    ← nuevo
  · 4 mini-KPIs cartera
  · Donut W14 (recharts PieChart innerRadius)
[PlatformAlertBanner — P1-A + P1-B alerts]   ← movido debajo cartera
[Actividad P0 — sin cambios]
[Acciones rápidas — sin cambios]
```

---

## 6. Ejemplos de agregación

**Input (3 clientes, sin SYSTEM):**

| Cliente | plan | estado | es_activo | fecha_fin_trial |
|---------|------|--------|-----------|-----------------|
| A | profesional | suspendido | true | — |
| B | trial | trial | true | 2026-06-01 (vencido) |
| C | basico | activo | false | — |

**Output:**

```json
{
  "suspendidos": 1,
  "trial": 1,
  "cancelados": 0,
  "morosos": 0,
  "estadoIncoherente": 1,
  "trialExpired": 1,
  "trialExpiring": 0,
  "porPlan": { "basico": 1, "profesional": 1, "enterprise": 0, "trial": 1 }
}
```

**Alertas emitidas:** `CLIENT_TRIAL_EXPIRED`, `CLIENT_STATE_INCOHERENT`, `CLIENT_SUSPENDED`

**Segmentos W14:** Básico=1, Profesional=1, Trial=1 (Enterprise omitido si 0)

---

## 7. QA ejecutado

### 7.1 Automatizado

| Comando | Resultado |
|---------|-----------|
| `npm run test:run -- src/features/super-admin/dashboard` | **19/19 passed** |
| ReadLints dashboard | **0 errores** |

| Suite | Tests |
|-------|-------|
| `clientes-snapshot.utils.test.ts` | 4 — SYSTEM, KPIs, trials, segments |
| `dashboard-alert.rules.test.ts` | 7 — security + portfolio |
| `usePlatformDashboardP1B.test.ts` | 2 — KPIs, alerts, enabled=false |
| P0 + P1A | 5 — regresión |

### 7.2 Manual (staging)

| # | Caso | Estado |
|---|------|--------|
| M1 | Network: `GET /clientes/?limit=1000&solo_activos=false` | ⏳ Staging |
| M2 | KPIs cartera coherentes con listado Clientes | ⏳ Staging |
| M3 | Snapshot falla → KPIs `—`, P0/P1-A operativos | ✅ Hooks separados |
| M4 | Banner muestra alertas CLIENT_* cuando aplica | ✅ Tests |
| M5 | Nota parcial si `total_clientes > 1000` | ✅ UI |
| M6 | Donut refleja distribución plan | ⏳ Staging |

---

## 8. Arquitectura

```
SuperAdminDashboard
├── usePlatformDashboardP0
├── usePlatformDashboardP1A
└── usePlatformDashboardP1B
      └── useQuery ['platform-dashboard','clientes-snapshot']
            └── fetchClientesSnapshot()
                  └── aggregateClientesSnapshot()
                        ├── KPIs cartera
                        ├── toPlanDistributionSegments() → ClientesPlanDonutChart
                        └── buildPortfolioAlertsFromSnapshot()
```

- **staleTime snapshot:** 120s (contrato §8.2 clientes)
- **Gráfico:** `recharts` (dependencia existente, sin librerías nuevas)

---

## 9. Riesgos pendientes

| ID | Riesgo | Mitigación aplicada |
|----|--------|---------------------|
| R-B01 | Snapshot incompleto si >1000 tenants | Badge «Basado en N de M clientes» |
| R-B02 | `CLIENT_SUSPENDED` informativo con muchos suspendidos | Mensaje agregado, link a Clientes |
| R-B03 | Trial KPI cuenta plan **o** estado trial | Puede incluir clientes trial por estado sin plan trial — alineado contrato §2.1 |
| R-B04 | Licencias globales no incluidas | Fuera P1-B; BFF F5 |
| R-B05 | Filtros plan/estado en ClientManagement no van al API | Snapshot independiente; no afecta P1-B |

---

## 10. Pendiente P1-C

| Item | Widget |
|------|--------|
| W6–W8 paneles seguridad extendidos | Stats |
| W10 feed sync | `getSyncLogs` |
| W13 clientes recientes | Sort FE |
| Operadores Platform | Usuarios SYSTEM |
| Polling / refresh toolbar | §8.2 |

---

## 11. Conclusión

P1-B entrega **salud de cartera SaaS** sobre contratos existentes: snapshot único alimenta KPIs, donut W14 y alertas operativas de clientes, integradas al banner existente sin regresión de P0/P1-A.

---

*Fin — PLATFORM_DASHBOARD_P1B_IMPLEMENTATION_REPORT.md*
