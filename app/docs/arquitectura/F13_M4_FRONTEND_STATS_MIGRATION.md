# F13-M4 — Migración Frontend: estadísticas Platform (`/usuarios/stats`)

**Documento:** `app/docs/arquitectura/F13_M4_FRONTEND_STATS_MIGRATION.md`  
**Fecha:** 2026-06-29  
**Contrato fuente:** `F13_M3_FRONTEND_CONTRACT.md`  
**Auditoría previa:** `app/docs/arquitectura/F13_M3A_FRONTEND_BOOTSTRAP_AUDIT.md`

---

## 1. Resumen

Migración mínima del dashboard Platform Admin para consumir `GET /api/v1/superadmin/usuarios/stats` en lugar de anti-patrones agregados sobre el listado paginado enriquecido.

| Caso de uso | Antes | Después |
|-------------|-------|---------|
| KPI W12 — Total Usuarios | `GET /superadmin/usuarios/?page=1&limit=1` → `total_usuarios` | `GET /superadmin/usuarios/stats` → `total_usuarios` |
| Alerta `USER_BLOCKED` | `GET /superadmin/usuarios/?page=1&limit=100` + conteo client-side `fecha_bloqueo` | `GET /superadmin/usuarios/stats` → `usuarios_bloqueados` |
| Panel Operadores Platform | `GET /superadmin/usuarios/?limit=50&cliente_id=…` | **Sin cambio** (requiere filas enriquecidas) |

---

## 2. Contrato utilizado

**Endpoint:** `GET /api/v1/superadmin/usuarios/stats`  
**Schema:** `PlatformUsuariosStatsResponse`

| Campo | Tipo | Uso FE |
|-------|------|--------|
| `total_usuarios` | integer ≥ 0 | KPI dashboard W12 |
| `usuarios_activos` | integer ≥ 0 | No consumido en esta migración |
| `usuarios_inactivos` | integer ≥ 0 | No consumido en esta migración |
| `usuarios_bloqueados` | integer ≥ 0 | Alerta `USER_BLOCKED` |

Query params opcionales del contrato (`cliente_id`, `search`, `proveedor_autenticacion`): expuestos en el servicio; el dashboard global invoca stats **sin filtros**.

---

## 3. Archivos modificados / creados

### 3.1 Tipos (nuevo, independiente)

| Archivo | Descripción |
|---------|-------------|
| `src/types/platform-usuarios-stats.types.ts` | `PlatformUsuariosStatsResponse`, `PlatformUsuariosStatsParams` |

No reutiliza `PaginatedSuperadminUsuariosResponse` ni `SuperadminUsuario`.

### 3.2 Servicio (nuevo, independiente)

| Archivo | Método |
|---------|--------|
| `src/services/superadmin-usuario-stats.service.ts` | `superadminUsuarioStatsService.getUsuariosStats()` |

No modifica `src/services/superadmin-usuario.service.ts` (`getUsuariosGlobales` intacto para listados).

### 3.3 Hooks

| Archivo | Cambio |
|---------|--------|
| `src/features/super-admin/dashboard/hooks/usePlatformDashboardP0.ts` | Query W12 → stats + `select: total_usuarios` |
| `src/features/super-admin/dashboard/hooks/usePlatformDashboardP1C.ts` | Alerta bloqueados → `usuarios_bloqueados` desde stats; eliminado scan `limit=100` |

### 3.4 Tests

| Archivo | Cambio |
|---------|--------|
| `src/services/__tests__/superadmin-usuario-stats.service.test.ts` | **Nuevo** |
| `src/features/super-admin/dashboard/hooks/__tests__/usePlatformDashboardP0.test.ts` | Mock stats en lugar de listado |
| `src/features/super-admin/dashboard/hooks/__tests__/usePlatformDashboardP1C.test.ts` | Mock stats; `getUsuariosGlobales` solo operadores |

### 3.5 Sin modificar

- AuthContext, login, logout, impersonation, routing, guards, providers
- `superadminUsuarioService.getUsuariosGlobales` (listado paginado)
- `ClientUsersTab`, `/admin/usuarios`, otros KPIs dashboard
- `dashboard-alert.rules.ts` (firma sin cambio; recibe `blockedCount` numérico)

---

## 4. Queries React Query

| Query key | Hook | queryFn | Campo consumido |
|-----------|------|---------|-----------------|
| `['platform-dashboard', 'usuarios-stats']` | P0 + P1C (deduplicada) | `getUsuariosStats()` | P0: `total_usuarios` (select); P1C: `usuarios_bloqueados` |

**Nota:** P0 y P1C comparten la misma `queryKey` para que React Query ejecute **una sola** petición HTTP `/stats` al montar el dashboard.

| Query key (eliminada) | Motivo |
|-----------------------|--------|
| `['platform-dashboard', 'usuarios-total']` | Reemplazada por stats |
| `['platform-dashboard', 'blocked-users-scan', 100]` | Reemplazada por stats |

---

## 5. Antes / después

### 5.1 KPI Total Usuarios (W12)

**Antes:**

```typescript
superadminUsuarioService.getUsuariosGlobales({ page: 1, limit: 1 });
return data.total_usuarios;
```

**Después:**

```typescript
superadminUsuarioStatsService.getUsuariosStats();
select: (data) => data.total_usuarios;
```

### 5.2 Alerta USER_BLOCKED

**Antes:**

```typescript
getUsuariosGlobales({ page: 1, limit: 100 });
countBlockedUsers(data.usuarios.filter(u => u.fecha_bloqueo != null));
```

**Después:**

```typescript
getUsuariosStats();
data.usuarios_bloqueados;
```

---

## 6. Decisión sobre `limit=100`

| Pregunta | Respuesta |
|----------|-----------|
| ¿El scan solo necesitaba un agregado? | **Sí** — la alerta `USER_BLOCKED` usa únicamente un contador entero en `buildOperatorAlertsFromUsuarios`. |
| ¿Necesitaba filas individuales? | **No** — no se renderizan usuarios bloqueados ni se usa `fecha_bloqueo` por fila en UI. |
| ¿El contrato cubre el caso? | **Sí** — `usuarios_bloqueados` = `fecha_bloqueo IS NOT NULL` (contrato §3.1, §4.1). |
| **Decisión** | **Migrar** a `/stats`. Elimina el anti-patrón parcial (máx. 100 filas) y alinea con conteo server-side completo. |

**No migrado:** query `limit=50` de operadores Platform — requiere array `usuarios[]` con campos enriquecidos para `PlatformOperatorsPanel` y alerta `PLATFORM_OPERATOR_NONE_ACTIVE`.

---

## 7. Impacto esperado en llamadas HTTP (bootstrap dashboard)

### Antes (F13-M3A)

Al montar `/super-admin/dashboard`:

```
GET /superadmin/usuarios/?page=1&limit=1      ← KPI W12
GET /superadmin/usuarios/?page=1&limit=100    ← alerta USER_BLOCKED
GET /superadmin/usuarios/?page=1&limit=50&cliente_id=…  ← operadores
```

### Después (F13-M4)

```
GET /superadmin/usuarios/stats                  ← KPI W12 + alerta USER_BLOCKED (1 request)
GET /superadmin/usuarios/?page=1&limit=50&cliente_id=…  ← operadores (sin cambio)
```

**Reducción neta:** 2 llamadas al listado enriquecido eliminadas; 1 llamada stats añadida → **−1 request** al bootstrap dashboard respecto a usuarios globales.

---

## 8. Impacto esperado en logs Backend

Según contrato F13-M3 §4.3 y §6.4:

| Log / efecto | Antes (listado `limit=1`) | Después (stats) |
|--------------|---------------------------|-----------------|
| **RI-39** (reachability / enriquecimiento por fila) | Posible side-effect al invocar listado J2 aunque `limit=1` | **No aplica** — stats no enriquece filas |
| **RD-08** asociados al KPI | Posibles trazas de degradación J2 del listado | **No esperados** en traza de stats |
| Consultas innecesarias listado enriquecido | Sí — payload paginado + pipeline J2 | **Eliminadas** para KPI y alerta bloqueados |

El listado `limit=50` (operadores) **sigue** pudiendo generar RI-39/RD-08 — fuera del alcance de esta migración.

---

## 9. Validaciones ejecutadas

| Validación | Resultado |
|------------|-----------|
| Ausencia de `getUsuariosGlobales({ limit: 1 })` en dashboard | ✅ grep `src/` sin coincidencias |
| Ausencia de scan `limit=100` | ✅ eliminado de P1C |
| KPI lee `total_usuarios` desde stats | ✅ P0 test |
| Alerta usa `usuarios_bloqueados` | ✅ P1C test |
| Listado paginado preservado | ✅ `getUsuariosGlobales` sin cambios; operadores intacto |
| Tests unitarios | ✅ 7/7 (`vitest run` archivos migration) |

**Paridad `total_usuarios` stats vs listado:** garantizada por contrato §5.2 (mismo WHERE base); verificación runtime requiere entorno Backend (fuera de alcance FE).

---

## 10. Entregable final

### Endpoints eliminados del bootstrap dashboard

```
GET /api/v1/superadmin/usuarios/?page=1&limit=1
GET /api/v1/superadmin/usuarios/?page=1&limit=100
```

### Endpoints que permanecen

```
GET /api/v1/superadmin/usuarios/?page=1&limit=50&cliente_id={PLATFORM_SUPERADMIN_CLIENTE_ID}&es_activo=true&ordenar_por=fecha_ultimo_acceso&orden=desc
GET /api/v1/superadmin/usuarios/?page=…&limit=…   (listados en otras pantallas: ClientUsersTab, futuros)
GET /api/v1/superadmin/usuarios/clientes/{cliente_id}/usuarios/…
```

### Endpoints nuevos

```
GET /api/v1/superadmin/usuarios/stats
```

### Resultado esperado post-migración

Tras login o salida de impersonación, al aterrizar en `/super-admin/dashboard`:

1. **Bootstrap auth** sin cambios (`/auth/login`, `/auth/me`, `/auth/menu`).
2. **Una** llamada `GET /superadmin/usuarios/stats` alimenta KPI Total Usuarios y alerta usuarios bloqueados.
3. **Desaparecen** del bootstrap las invocaciones agregadas al listado con `limit=1` y `limit=100`.
4. **Deberían desaparecer** en la traza Backend asociada al KPI/alerta bloqueados:
   - **RI-39** durante esas métricas agregadas.
   - **RD-08** ligados al pipeline J2 del listado para esos consumos.
   - Consultas de enriquecimiento por fila innecesarias para contadores.
5. Pantallas, listados, búsqueda, filtros, paginación y edición **sin cambio funcional**.

---

*Fin migración F13-M4 — sin commits en este ticket.*
