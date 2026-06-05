# PLATFORM_DASHBOARD_P0_IMPLEMENTATION_REPORT.md

**Fase:** Dashboard P0 — superficie operativa real (sin mock)  
**Fecha:** 2026-06-03  
**Contrato:** `PLATFORM_DASHBOARD_FRONTEND_CONTRACT.md`  
**Auditoría base:** `PLATFORM_DASHBOARD_MVP_UX_AUDIT.md` (aprobada)

---

## 1. Resumen

Se eliminó el 100 % de datos mock del Dashboard Platform (`/super-admin/dashboard`) y se conectaron los widgets P0 a APIs documentadas en el contrato:

| Widget | Contrato | Estado |
|--------|----------|--------|
| Clientes Activos | W1 | ✅ Implementado |
| Total Clientes | W2 | ✅ Implementado |
| Total Usuarios | W12 | ✅ Implementado |
| Módulos en catálogo | W11 | ✅ Implementado |
| Actividad reciente (auth) | W9 | ✅ Implementado |
| Acciones rápidas | Navegación | ✅ Implementado |

**Fuera de P0 (sin cambios):** W3–W15, panel alertas, KPI conexiones, BFF futuro.

---

## 2. Archivos modificados / creados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx` | **Modificado** | Eliminación mock; KPIs, actividad y links reales |
| `src/features/super-admin/dashboard/hooks/usePlatformDashboardP0.ts` | **Creado** | Composición React Query de W1, W2, W11, W12, W9 |
| `src/services/superadmin-usuario.service.ts` | **Modificado** | Nuevo `getUsuariosGlobales()` → `GET /superadmin/usuarios/` |
| `src/features/super-admin/dashboard/hooks/__tests__/usePlatformDashboardP0.test.ts` | **Creado** | Tests unitarios de contrato de llamadas API |

---

## 3. Eliminaciones (mock)

| Elemento removido | Evidencia |
|-------------------|-----------|
| Objeto `stats` hardcodeado | Eliminado de `SuperAdminDashboard.tsx` |
| Array `actividadReciente` mock | Eliminado |
| Array `alertas` mock | Eliminado |
| Panel «Alertas del Sistema» | Eliminado (W15 pendiente P1) |
| Tarjeta KPI «Conexiones» | Eliminada (sin contrato global) |
| Botón «Gestionar Conexiones» | Reemplazado por «Auditoría Global» |
| Subtextos ficticios («22 activos», «Todas activas») | Eliminados |

**Verificación estática:**

```bash
rg "totalClientes: 5|Datos de ejemplo|conexionesActivas|2024-01-15" src/features/super-admin/dashboard/pages/
# → sin coincidencias
```

---

## 4. Implementación por widget

### 4.1 W1 — Clientes Activos

```http
GET /api/v1/clientes/?skip=0&limit=1&solo_activos=true
```

- **FE:** `clienteService.getClientes(1, 1, { activeFilter: 'active' })`
- **Campo UI:** `response.total_clientes`

### 4.2 W2 — Total Clientes

```http
GET /api/v1/clientes/?skip=0&limit=1&solo_activos=false
```

- **FE:** `clienteService.getClientes(1, 1, { activeFilter: 'all' })`
- **Campo UI:** `response.total_clientes`

### 4.3 W12 — Total Usuarios

```http
GET /api/v1/superadmin/usuarios/?page=1&limit=1
```

- **FE:** `superadminUsuarioService.getUsuariosGlobales({ page: 1, limit: 1 })` *(nuevo)*
- **Campo UI:** `response.total_usuarios`

### 4.4 W11 — Módulos en catálogo

```http
GET /api/v1/modulos-v2/?skip=0&limit=1
```

- **FE:** `moduloV2Service.getModulos({ skip: 0, limit: 1 })`
- **Campo UI:** `response.total` (adapter desde `pagination.total`)

### 4.5 W9 — Actividad reciente

```http
GET /api/v1/superadmin/auditoria/autenticacion/?page=1&limit=5&orden=desc&ordenar_por=fecha_evento
```

- **FE:** `superadminAuditoriaService.getAuthLogsByCliente(...)` *(misma infraestructura que Auditoría Global)*
- **Campos UI por fila:** `cliente.razon_social`, `evento`, usuario intento, `fecha_evento`, semáforo `exito`
- **Link:** «Ver todo» → `/super-admin/auditoria`

### 4.6 Acciones rápidas

| Acción | Ruta | Componente |
|--------|------|--------------|
| Gestionar Clientes | `/super-admin/clientes` | `<Link>` |
| Gestionar Módulos | `/super-admin/modulos` | `<Link>` |
| Auditoría Global | `/super-admin/auditoria` | `<Link>` |

---

## 5. Arquitectura

```
SuperAdminDashboard
  └── usePlatformDashboardP0(isSuperAdmin)
        ├── useQueries (5 paralelas, staleTime 60s)
        │     ├── clienteService (W1, W2)
        │     ├── superadminUsuarioService (W12)
        │     ├── moduloV2Service (W11)
        │     └── superadminAuditoriaService (W9)
        └── Degradación por widget: loading spinner | «—» en error
```

- **Sin N+1:** solo contadores con `limit=1` / `limit=5`.
- **Queries deshabilitadas** si `!isSuperAdmin`.
- **Errores aislados:** fallo en una tarjeta no bloquea las demás.

---

## 6. QA ejecutado

### 6.1 Automatizado

| Comando | Resultado |
|---------|-----------|
| `npm run test:run -- src/features/super-admin/dashboard/hooks/__tests__/usePlatformDashboardP0.test.ts` | **2/2 passed** |
| `npx tsc -b` (archivos dashboard) | **0 errores** en archivos P0 |
| `rg` mock literals en dashboard page | **0 coincidencias** |

**Tests cubiertos:**

1. Carga W1/W2/W11/W12/W9 con valores derivados de respuestas simuladas alineadas al contrato.
2. Verificación de parámetros exactos enviados a cada servicio.
3. `enabled: false` no dispara fetch.

### 6.2 Manual (checklist P0)

| # | Caso | Estado |
|---|------|--------|
| M1 | Dashboard ya no muestra 5 / 25 / 8 / 12 fijos | ✅ Código |
| M2 | KPI Clientes Activos = listado Clientes (filtro activos) | ⏳ Requiere sesión super-admin + API |
| M3 | KPI Total Clientes = listado Clientes (todos) | ⏳ Idem |
| M4 | KPI Usuarios = `GET /superadmin/usuarios/` | ⏳ Idem |
| M5 | KPI Módulos = listado Módulos | ⏳ Idem |
| M6 | Actividad = eventos auth reales o empty | ⏳ Idem |
| M7 | Sin panel alertas ficticias | ✅ Código |
| M8 | Acciones navegan a Clientes / Módulos / Auditoría | ✅ Código (`Link`) |
| M9 | Una API caída → tarjeta «—», resto operativo | ✅ Código |
| M10 | Usuario no super-admin → mensaje restricción | ✅ Sin regresión |

> **Nota:** QA runtime M2–M6 requiere entorno con API Platform autenticada. La evidencia de contrato de red se valida en tests unitarios; capturas en staging pendientes de ejecución manual del operador.

---

## 7. Evidencia de consumo API real

### 7.1 Test unitario — parámetros de red (extracto)

El test `loads W1, W2, W11, W12 and W9 from contract endpoints` verifica:

```typescript
expect(clienteService.getClientes).toHaveBeenCalledWith(1, 1, { activeFilter: 'active' });
expect(clienteService.getClientes).toHaveBeenCalledWith(1, 1, { activeFilter: 'all' });
expect(superadminUsuarioService.getUsuariosGlobales).toHaveBeenCalledWith({ page: 1, limit: 1 });
expect(moduloV2Service.getModulos).toHaveBeenCalledWith({ skip: 0, limit: 1 });
expect(superadminAuditoriaService.getAuthLogsByCliente).toHaveBeenCalledWith({
  page: 1,
  limit: 5,
  orden: 'desc',
  ordenar_por: 'fecha_evento',
});
```

### 7.2 Datos de ejemplo (contrato + test) — forma esperada en UI

**W1/W2 (test simula respuesta contrato §1.1):**

```json
{ "total_clientes": 38 }   // activos
{ "total_clientes": 42 }   // todos
```

**W12 (contrato §1.7):**

```json
{ "total_usuarios": 120, "pagina_actual": 1, "total_paginas": 1 }
```

**W11 (contrato §1.9):**

```json
{ "pagination": { "total": 24 } }
```

**W9 (contrato §1.5 — fila renderizada):**

```json
{
  "log_id": "…",
  "cliente": { "razon_social": "ACME Corp S.A." },
  "evento": "login_success",
  "exito": true,
  "fecha_evento": "2026-06-03T08:12:33"
}
```

**UI resultante (test):** tarjetas 38 | 42 | 120 | 24; actividad con 1 fila «ACME Corp S.A. · login_success».

### 7.3 Cómo verificar en staging (operador)

1. Login como super-admin Platform.
2. Abrir DevTools → Network → filtrar `clientes`, `usuarios`, `modulos-v2`, `autenticacion`.
3. Navegar a `/super-admin/dashboard`.
4. Confirmar 5 requests paralelos y que los números coinciden con `total_clientes`, `total_usuarios`, `pagination.total`, `logs[]`.

---

## 8. Cambios visuales (dentro de alcance P0)

| Antes | Después | Motivo |
|-------|---------|--------|
| 4 KPIs: Clientes+sub, Usuarios+sub, Módulos+sub, Conexiones | 4 KPIs: Activos, Total, Usuarios, Módulos | W1/W2 separados; conexiones eliminadas |
| Panel Alertas + Actividad (2 cols) | Solo Actividad (col-span 2) | Alertas mock eliminadas |
| 3 botones sin acción | 3 `<Link>` funcionales | P0 navegación |
| Actividad inventada | Feed auth real | W9 |

**Conservado:** header `text-3xl`, tarjetas `rounded-xl`, grid KPI 4 cols, estilos tokens, sección acciones rápidas.

---

## 9. Limitaciones pendientes para P1

| ID | Item | Contrato | Motivo diferido |
|----|------|----------|-----------------|
| P1-01 | KPI logins fallidos 24h | W3 | Requiere `GET /superadmin/auditoria/estadisticas/` (sin servicio FE) |
| P1-02 | KPI logins exitosos 24h | W4 | Idem |
| P1-03 | KPI sync fallidas | W5 | Idem |
| P1-04 | Gráfico eventos por tipo | W6 | Idem stats |
| P1-05 | Tabla top IPs / usuarios | W7, W8 | Idem stats |
| P1-06 | Feed sync recientes | W10 | Sin `getSyncLogs` en FE |
| P1-07 | Clientes recientes (sort FE) | W13 | Agregación + paginación clientes |
| P1-08 | Donut planes/estados | W14 | Listado completo clientes |
| P1-09 | Banner alertas derivadas | W15 | Reglas §4.1 + composición |
| P1-10 | Subtexto «usuarios activos» | — | Query extra `es_activo=true` (opcional) |
| P1-11 | Polling 60s / refresh toolbar | §8.2 | No solicitado en P0 |
| P1-12 | BFF único | F1–F12 | Endpoint no existe |

---

## 10. Riesgos residuales P0

| Riesgo | Mitigación aplicada |
|--------|---------------------|
| `GET /superadmin/usuarios/` 403 en staging | Tarjeta usuarios muestra «—»; resto operativo |
| Actividad vacía en tenant nuevo | Empty state «No hay actividad reciente» |
| KPI módulos ≠ expectativa operador | Muestra total catálogo (W11), no licencias por tenant |

---

## 11. Conclusión

Dashboard P0 cumple el objetivo: **superficie operativa real** sin literals de negocio, consumiendo exclusivamente contratos §1.1, §1.5, §1.7 y §1.9. La infraestructura de Auditoría Global se reutiliza para W9. Acciones rápidas navegan a superficies Platform existentes.

**Siguiente fase recomendada:** P1 — servicio `getAuditoriaEstadisticas` + widgets W3–W8 y banner W15.

---

*Fin — PLATFORM_DASHBOARD_P0_IMPLEMENTATION_REPORT.md*
