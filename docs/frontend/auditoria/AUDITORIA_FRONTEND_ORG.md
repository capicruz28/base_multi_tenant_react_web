# AUDITORÍA FRONTEND — ORG (Organización)

Fecha: 2026-05-09  
Contrato fuente: `docs/api/ORG_API.json`  
Implementación revisada: `src/features/org/*`

---

## 1) Endpoints del contrato API (inventario)

**Total**: 36 operaciones (6 entidades × 6 operaciones).

Patrones globales del contrato:
- **Auth**: `OAuth2PasswordBearer` (JWT).
- **Paginación**: no hay; listas devuelven `array`.
- **Filtros**: `solo_activos?: boolean (default true)`, `buscar?: string | null` (en listas).
- **Ámbito empresa**:
  - `Empresa`: no usa `empresa_id` como query param.
  - Resto: `empresa_id?: uuid | null` como **query param** en varios endpoints (lista y también detalle/mutaciones).
  - `Parámetros`: `empresa_id` en query tiene semántica especial (permite globales `empresa_id NULL` o de esa empresa; excluye otras).

### Empresa
- `GET /api/v1/org/empresa` (query: `solo_activos?`, `buscar?`) → `EmpresaRead[]`
- `POST /api/v1/org/empresa` (body: `EmpresaCreate`) → `EmpresaRead`
- `GET /api/v1/org/empresa/{empresa_id}` → `EmpresaRead`
- `PUT /api/v1/org/empresa/{empresa_id}` (body: `EmpresaUpdate`) → `EmpresaRead`
- `DELETE /api/v1/org/empresa/{empresa_id}` → 204
- `POST /api/v1/org/empresa/{empresa_id}/reactivar` → `EmpresaRead`

### Sucursales
- `GET /api/v1/org/sucursales` (query: `empresa_id?`, `solo_activos?`, `buscar?`) → `SucursalRead[]`
- `POST /api/v1/org/sucursales` (body: `SucursalCreate`) → `SucursalRead`
- `GET /api/v1/org/sucursales/{sucursal_id}` (query: `empresa_id?`) → `SucursalRead`
- `PUT /api/v1/org/sucursales/{sucursal_id}` (query: `empresa_id?`, body: `SucursalUpdate`) → `SucursalRead`
- `DELETE /api/v1/org/sucursales/{sucursal_id}` (query: `empresa_id?`) → 204
- `POST /api/v1/org/sucursales/{sucursal_id}/reactivar` (query: `empresa_id?`) → `SucursalRead`

### Centros de costo
- `GET /api/v1/org/centros-costo` (query: `empresa_id?`, `solo_activos?`, `buscar?`) → `CentroCostoRead[]`
- `POST /api/v1/org/centros-costo` (body: `CentroCostoCreate`) → `CentroCostoRead`
- `GET /api/v1/org/centros-costo/{centro_costo_id}` (query: `empresa_id?`) → `CentroCostoRead`
- `PUT /api/v1/org/centros-costo/{centro_costo_id}` (query: `empresa_id?`, body: `CentroCostoUpdate`) → `CentroCostoRead`
- `DELETE /api/v1/org/centros-costo/{centro_costo_id}` (query: `empresa_id?`) → 204
- `POST /api/v1/org/centros-costo/{centro_costo_id}/reactivar` (query: `empresa_id?`) → `CentroCostoRead`

### Departamentos
- `GET /api/v1/org/departamentos` (query: `empresa_id?`, `solo_activos?`, `buscar?`) → `DepartamentoRead[]`
- `POST /api/v1/org/departamentos` (body: `DepartamentoCreate`) → `DepartamentoRead`
- `GET /api/v1/org/departamentos/{departamento_id}` (query: `empresa_id?`) → `DepartamentoRead`
- `PUT /api/v1/org/departamentos/{departamento_id}` (query: `empresa_id?`, body: `DepartamentoUpdate`) → `DepartamentoRead`
- `DELETE /api/v1/org/departamentos/{departamento_id}` (query: `empresa_id?`) → 204
- `POST /api/v1/org/departamentos/{departamento_id}/reactivar` (query: `empresa_id?`) → `DepartamentoRead`

### Cargos
- `GET /api/v1/org/cargos` (query: `empresa_id?`, `solo_activos?`, `buscar?`) → `CargoRead[]`
- `POST /api/v1/org/cargos` (body: `CargoCreate`) → `CargoRead`
- `GET /api/v1/org/cargos/{cargo_id}` (query: `empresa_id?`) → `CargoRead`
- `PUT /api/v1/org/cargos/{cargo_id}` (query: `empresa_id?`, body: `CargoUpdate`) → `CargoRead`
- `DELETE /api/v1/org/cargos/{cargo_id}` (query: `empresa_id?`) → 204
- `POST /api/v1/org/cargos/{cargo_id}/reactivar` (query: `empresa_id?`) → `CargoRead`

### Parámetros
- `GET /api/v1/org/parametros` (query: `empresa_id?`, `modulo_codigo?`, `solo_activos?`, `buscar?`) → `ParametroRead[]`
- `POST /api/v1/org/parametros` (body: `ParametroCreate`) → `ParametroRead`
- `GET /api/v1/org/parametros/{parametro_id}` (query: `empresa_id?`) → `ParametroRead`
- `PUT /api/v1/org/parametros/{parametro_id}` (query: `empresa_id?`, body: `ParametroUpdate`) → `ParametroRead`
- `DELETE /api/v1/org/parametros/{parametro_id}` (query: `empresa_id?`) → 204
- `POST /api/v1/org/parametros/{parametro_id}/reactivar` (query: `empresa_id?`) → `ParametroRead`

---

## 2) Implementación actual detectada (inventario)

### Rutas
- `src/features/org/routes.tsx` expone: `empresa`, `sucursales`, `departamentos`, `cargos`, `centros-costo`, `parametros`.
- `src/app/router.tsx`: módulo completo protegido con `PermissionGuard module="org" action="ver"`.

### Types
- `src/features/org/types/org.types.ts`
  - Define interfaces: `Empresa`, `Sucursal`, `CentroCosto`, `Departamento`, `Cargo`, `Parametro` + `Create/Update`.
  - Incluye tipos no presentes en ORG_API: `Moneda*` (potencial desalineamiento, ver sección 4).

### Services
- `src/features/org/services/org.service.ts`
  - Servicios por entidad: `empresaService`, `sucursalService`, `centroCostoService`, `departamentoService`, `cargoService`, `parametroService`.
  - Patrón actual: usa `api` (`src/core/api/api.ts` → `apiCentral`).
  - No existen hooks React Query para ORG; las pages consumen services directamente con `useEffect + useState`.

### Pages (UI)
- `src/features/org/pages/EmpresaPage.tsx`
- `src/features/org/pages/SucursalesPage.tsx`
- `src/features/org/pages/CentrosCostoPage.tsx`
- `src/features/org/pages/DepartamentosPage.tsx`
- `src/features/org/pages/CargosPage.tsx`
- `src/features/org/pages/ParametrosPage.tsx`

---

## 3) Evaluación por endpoint (service/hook/componente)

Leyenda:
- **✔ Completo**: endpoint existe en service y está consumido en UI, con estados loading/error/empty, y tenant/empresa_id acorde.
- **⚠ Parcial**: existe pero falta (a) hook React Query, (b) params requeridos por contrato, (c) UI incompleta, o (d) RBAC por acción.
- **✖ Faltante**: no hay implementación.

> Nota: En ORG no se implementaron hooks React Query; por lo tanto, todas las filas quedan como **⚠ Parcial** o **✖** aunque exista llamada en service/UI.

| Endpoint | Método | Service | Hook | Componente | Estado |
|---|---|---|---|---|---|
| `/api/v1/org/empresa` | GET | `empresaService.list` | ✖ | `EmpresaPage` | ⚠ (no soporta `buscar`) |
| `/api/v1/org/empresa` | POST | `empresaService.create` | ✖ | `EmpresaPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/empresa/{empresa_id}` | GET | `empresaService.getById` | ✖ | ✖ | ⚠ (service existe, UI no usa) |
| `/api/v1/org/empresa/{empresa_id}` | PUT | `empresaService.update` | ✖ | `EmpresaPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/empresa/{empresa_id}` | DELETE | `empresaService.delete` | ✖ | `EmpresaPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/empresa/{empresa_id}/reactivar` | POST | `empresaService.reactivar` | ✖ | `EmpresaPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/sucursales` | GET | `sucursalService.list` | ✖ | `SucursalesPage` | ⚠ (no soporta `buscar`) |
| `/api/v1/org/sucursales` | POST | `sucursalService.create` | ✖ | `SucursalesPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/sucursales/{sucursal_id}` | GET | `sucursalService.getById` | ✖ | ✖ | ⚠ (falta `empresa_id` query, UI no usa) |
| `/api/v1/org/sucursales/{sucursal_id}` | PUT | `sucursalService.update` | ✖ | `SucursalesPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/sucursales/{sucursal_id}` | DELETE | `sucursalService.delete` | ✖ | `SucursalesPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/sucursales/{sucursal_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/org/centros-costo` | GET | `centroCostoService.list` | ✖ | `CentrosCostoPage` | ⚠ (no soporta `buscar`) |
| `/api/v1/org/centros-costo` | POST | `centroCostoService.create` | ✖ | `CentrosCostoPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/centros-costo/{centro_costo_id}` | GET | `centroCostoService.getById` | ✖ | ✖ | ⚠ (falta `empresa_id` query, UI no usa) |
| `/api/v1/org/centros-costo/{centro_costo_id}` | PUT | `centroCostoService.update` | ✖ | `CentrosCostoPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/centros-costo/{centro_costo_id}` | DELETE | `centroCostoService.delete` | ✖ | `CentrosCostoPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/centros-costo/{centro_costo_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/org/departamentos` | GET | `departamentoService.list` | ✖ | `DepartamentosPage` | ⚠ (no soporta `buscar`) |
| `/api/v1/org/departamentos` | POST | `departamentoService.create` | ✖ | `DepartamentosPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/departamentos/{departamento_id}` | GET | `departamentoService.getById` | ✖ | ✖ | ⚠ (falta `empresa_id` query, UI no usa) |
| `/api/v1/org/departamentos/{departamento_id}` | PUT | `departamentoService.update` | ✖ | `DepartamentosPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/departamentos/{departamento_id}` | DELETE | `departamentoService.delete` | ✖ | `DepartamentosPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/departamentos/{departamento_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/org/cargos` | GET | `cargoService.list` | ✖ | `CargosPage` | ⚠ (no soporta `buscar`) |
| `/api/v1/org/cargos` | POST | `cargoService.create` | ✖ | `CargosPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/cargos/{cargo_id}` | GET | `cargoService.getById` | ✖ | ✖ | ⚠ (falta `empresa_id` query, UI no usa) |
| `/api/v1/org/cargos/{cargo_id}` | PUT | `cargoService.update` | ✖ | `CargosPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/cargos/{cargo_id}` | DELETE | `cargoService.delete` | ✖ | `CargosPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/cargos/{cargo_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/org/parametros` | GET | `parametroService.list` | ✖ | `ParametrosPage` | ⚠ (no soporta `buscar`; no filtra por `empresa_id`) |
| `/api/v1/org/parametros` | POST | `parametroService.create` | ✖ | `ParametrosPage` | ⚠ (sin RBAC acción) |
| `/api/v1/org/parametros/{parametro_id}` | GET | `parametroService.getById` | ✖ | ✖ | ⚠ (falta `empresa_id` query, UI no usa) |
| `/api/v1/org/parametros/{parametro_id}` | PUT | `parametroService.update` | ✖ | `ParametrosPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/parametros/{parametro_id}` | DELETE | `parametroService.delete` | ✖ | `ParametrosPage` | ⚠ (falta `empresa_id` query, sin RBAC acción) |
| `/api/v1/org/parametros/{parametro_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |

---

## 4) Brechas por endpoint / técnica (lo más relevante)

### 4.1 Endpoints faltantes (críticos)
- Falta `POST /.../reactivar` para:
  - `sucursales/{sucursal_id}/reactivar`
  - `centros-costo/{centro_costo_id}/reactivar`
  - `departamentos/{departamento_id}/reactivar`
  - `cargos/{cargo_id}/reactivar`
  - `parametros/{parametro_id}/reactivar`

### 4.2 Query params requeridos por contrato no aplicados
- **`buscar`**: ninguno de los `list()` en `org.service.ts` lo expone; las pages no implementan búsqueda.
  - Impacta: listas de Empresa/Sucursal/CentroCosto/Departamento/Cargo/Parametro.
- **`empresa_id` en detalle/mutaciones** (contrato lo define como query param opcional para validar pertenencia a empresa):
  - Actualmente **no se envía** en `getById/update/delete` de Sucursal/CentroCosto/Departamento/Cargo/Parametro.
  - Impacto: backend puede rechazar o permitir acceso más amplio de lo previsto; además rompe el patrón explícito de “scope empresa”.
- **Parámetros**: el contrato define `empresa_id` query con scope especial; hoy no se soporta en `getById/update/delete/reactivar`.

### 4.3 Arquitectura de datos: React Query no usado en ORG
- No existen hooks tipo `useOrg*` ni uso de `useTenantQuery/useTenantMutation`.
- Riesgo: cache/invalidation manual, inconsistencias multi-tenant, UX menos consistente.

### 4.4 API híbrida (central vs local) no respetada en services ORG
- `org.service.ts` usa `api` (central) en vez de `getApiInstance(clienteInfo)` o patrón equivalente.
- Impacto: en clientes on-prem/hybrid, ORG podría apuntar siempre al servidor central.

### 4.5 RBAC por acción (crear/editar/eliminar) no aplicado
- El módulo `ORG` está protegido por `PermissionGuard` para acción `ver`.
- Pero los botones/acciones de **crear/editar/eliminar/reactivar** no validan `usePermissions().can('org', action)`.
- Impacto: UI muestra acciones a usuarios sin permiso (aunque el backend podría bloquear).

### 4.6 UI: activo/inactivo inconsistente vs contrato
- `EmpresaPage` sí implementa “incluir inactivos” + botón reactivar (solo empresa).
- Para el resto de entidades:
  - Las listas se consumen con `solo_activos: true` fijo.
  - No hay modo de ver inactivos ni reactivar (aunque el contrato lo soporta).

### 4.7 Tipado potencialmente desalineado con OpenAPI
- `Parametro.valor_json` está tipado como `unknown` (correcto), pero en UI se convierte a string/JSON; OK.
- `Cargo.rango_salarial_min/max`: OpenAPI permite `number|string|null`; tipos actuales lo fuerzan a `number|null`.
- `Sucursal.latitud/longitud`: OpenAPI permite `number|string|null`; en types no se observa aquí (revisar si están presentes).
- `types/org.types.ts` contiene `Moneda*` que no aparece en `ORG_API.json` (posible legado o módulo distinto).

---

## 5) Componentes desalineados (NO eliminar)

No se detectaron componentes que llamen rutas inexistentes del contrato ORG.
Sin embargo, hay **desalineamiento funcional** por omisión:
- Falta soporte de `buscar` en UI.
- Falta manejo de inactivos/reactivar en 5 entidades.
- Falta envío de `empresa_id` query en detalle/mutaciones donde el contrato lo define.

---

## 6) Problemas de tipado / multi-tenant / RBAC (resumen)

- **Multi-tenant**: `empresa_id` se usa como filtro en listas, pero no como scope en detalle/mutaciones; `cliente_id` se asume por token (correcto).
- **RBAC**: solo guard de lectura; falta control granular por acción en UI.
- **React Query**: no implementado; se usa `useEffect` + state local.
- **API híbrida**: services ORG actualmente no seleccionan instancia (central/local) según tenant.

---

## 7) Recomendación de implementación (para Fase 3, no ejecutar aquí)

Prioridad sugerida:
1) Completar endpoints faltantes (`reactivar` en 5 entidades) en `org.service.ts`.
2) Ajustar firma de services para soportar `buscar` y `empresa_id` query donde aplique.
3) Migrar ORG a hooks React Query (preferible `useTenantQuery/useTenantMutation`) + invalidaciones.
4) Aplicar RBAC por acción en botones: `can('org', 'crear'|'editar'|'eliminar')`.
5) Alinear tipos con OpenAPI en campos `number|string|null` (cargo/sucursal) para evitar rechazos.

