# ORG — Implementación Frontend (Fase 4: verificación final)

Fecha: 2026-05-09  
Módulo: Organización (`ORG`)  
Contrato: `docs/api/ORG_API.json`

---

## 1) Archivos creados o modificados (alcance ORG)

### Creados
- `docs/frontend/auditoria/AUDITORIA_FRONTEND_ORG.md`
- `src/features/org/hooks/empresa.hooks.ts`
- `src/features/org/hooks/sucursal.hooks.ts`
- `src/features/org/hooks/centro-costo.hooks.ts`
- `src/features/org/hooks/departamento.hooks.ts`
- `src/features/org/hooks/cargo.hooks.ts`
- `src/features/org/hooks/parametro.hooks.ts`

### Modificados
- `src/features/org/types/org.types.ts`
- `src/features/org/services/org.service.ts`
- `src/features/org/pages/EmpresaPage.tsx`
- `src/features/org/pages/SucursalesPage.tsx`
- `src/features/org/pages/CentrosCostoPage.tsx`
- `src/features/org/pages/DepartamentosPage.tsx`
- `src/features/org/pages/CargosPage.tsx`
- `src/features/org/pages/ParametrosPage.tsx`

---

## 2) Cobertura por endpoint (types/service/hook/componente)

**Total endpoints ORG**: 36.

Convención aplicada:
- **Types**: `src/features/org/types/org.types.ts`
- **Services**: `src/features/org/services/org.service.ts`
- **Hooks (React Query)**: `src/features/org/hooks/*.hooks.ts`
- **UI**: `src/features/org/pages/*Page.tsx`

### Empresa
- `GET /api/v1/org/empresa`
  - **Types**: `Empresa`
  - **Service**: `empresaService.list({ solo_activos?, buscar? })`
  - **Hook**: `useEmpresas({ solo_activos?, buscar? })`
  - **UI**: `EmpresaPage` (búsqueda + ver inactivos)
- `POST /api/v1/org/empresa`
  - **Types**: `EmpresaCreate`
  - **Service**: `empresaService.create(payload)`
  - **Hook**: `useCreateEmpresa()`
  - **UI**: `EmpresaPage` (Dialog crear)
- `GET /api/v1/org/empresa/{empresa_id}`
  - **Types**: `Empresa`
  - **Service**: `empresaService.getById(empresaId)`
  - **Hook**: `useEmpresa(empresaId)`
  - **UI**: `EmpresaPage` (flujo actual usa lista+edit; detalle hook disponible)
- `PUT /api/v1/org/empresa/{empresa_id}`
  - **Types**: `EmpresaUpdate`
  - **Service**: `empresaService.update(empresaId, payload)`
  - **Hook**: `useUpdateEmpresa()`
  - **UI**: `EmpresaPage` (Dialog editar)
- `DELETE /api/v1/org/empresa/{empresa_id}`
  - **Service**: `empresaService.delete(empresaId)`
  - **Hook**: `useDeleteEmpresa()`
  - **UI**: `EmpresaPage` (ConfirmDialog)
- `POST /api/v1/org/empresa/{empresa_id}/reactivar`
  - **Service**: `empresaService.reactivar(empresaId)`
  - **Hook**: `useReactivarEmpresa()`
  - **UI**: `EmpresaPage` (botón reactivar)

### Sucursales
- `GET /api/v1/org/sucursales` (query: `empresa_id?`, `solo_activos?`, `buscar?`)
  - **Types**: `Sucursal`
  - **Service**: `sucursalService.list({ empresa_id?, solo_activos?, buscar? })`
  - **Hook**: `useSucursales({ empresa_id?, solo_activos?, buscar? })`
  - **UI**: `SucursalesPage`
- `POST /api/v1/org/sucursales`
  - **Types**: `SucursalCreate`
  - **Service**: `sucursalService.create(payload)`
  - **Hook**: `useCreateSucursal()`
  - **UI**: `SucursalesPage`
- `GET /api/v1/org/sucursales/{sucursal_id}` (query: `empresa_id?`)
  - **Types**: `Sucursal`
  - **Service**: `sucursalService.getById(id, { empresa_id? })`
  - **Hook**: `useSucursal(id, { empresa_id? })`
  - **UI**: hook disponible (flujo actual usa lista+edit)
- `PUT /api/v1/org/sucursales/{sucursal_id}` (query: `empresa_id?`)
  - **Types**: `SucursalUpdate`
  - **Service**: `sucursalService.update(id, payload, { empresa_id? })`
  - **Hook**: `useUpdateSucursal()`
  - **UI**: `SucursalesPage`
- `DELETE /api/v1/org/sucursales/{sucursal_id}` (query: `empresa_id?`)
  - **Service**: `sucursalService.delete(id, { empresa_id? })`
  - **Hook**: `useDeleteSucursal()`
  - **UI**: `SucursalesPage`
- `POST /api/v1/org/sucursales/{sucursal_id}/reactivar` (query: `empresa_id?`)
  - **Service**: `sucursalService.reactivar(id, { empresa_id? })`
  - **Hook**: `useReactivarSucursal()`
  - **UI**: `SucursalesPage`

### Centros de costo
- `GET /api/v1/org/centros-costo` (query: `empresa_id?`, `solo_activos?`, `buscar?`)
  - **Types**: `CentroCosto`
  - **Service**: `centroCostoService.list({ empresa_id?, solo_activos?, buscar? })`
  - **Hook**: `useCentrosCosto({ empresa_id?, solo_activos?, buscar? })`
  - **UI**: `CentrosCostoPage`
- `POST /api/v1/org/centros-costo`
  - **Types**: `CentroCostoCreate`
  - **Service**: `centroCostoService.create(payload)`
  - **Hook**: `useCreateCentroCosto()`
  - **UI**: `CentrosCostoPage`
- `GET /api/v1/org/centros-costo/{centro_costo_id}` (query: `empresa_id?`)
  - **Types**: `CentroCosto`
  - **Service**: `centroCostoService.getById(id, { empresa_id? })`
  - **Hook**: `useCentroCosto(id, { empresa_id? })`
  - **UI**: hook disponible (flujo actual usa lista+edit)
- `PUT /api/v1/org/centros-costo/{centro_costo_id}` (query: `empresa_id?`)
  - **Types**: `CentroCostoUpdate`
  - **Service**: `centroCostoService.update(id, payload, { empresa_id? })`
  - **Hook**: `useUpdateCentroCosto()`
  - **UI**: `CentrosCostoPage`
- `DELETE /api/v1/org/centros-costo/{centro_costo_id}` (query: `empresa_id?`)
  - **Service**: `centroCostoService.delete(id, { empresa_id? })`
  - **Hook**: `useDeleteCentroCosto()`
  - **UI**: `CentrosCostoPage`
- `POST /api/v1/org/centros-costo/{centro_costo_id}/reactivar` (query: `empresa_id?`)
  - **Service**: `centroCostoService.reactivar(id, { empresa_id? })`
  - **Hook**: `useReactivarCentroCosto()`
  - **UI**: `CentrosCostoPage`

### Departamentos
- `GET /api/v1/org/departamentos` (query: `empresa_id?`, `solo_activos?`, `buscar?`)
  - **Types**: `Departamento`
  - **Service**: `departamentoService.list({ empresa_id?, solo_activos?, buscar? })`
  - **Hook**: `useDepartamentos({ empresa_id?, solo_activos?, buscar? })`
  - **UI**: `DepartamentosPage`
- `POST /api/v1/org/departamentos`
  - **Types**: `DepartamentoCreate`
  - **Service**: `departamentoService.create(payload)`
  - **Hook**: `useCreateDepartamento()`
  - **UI**: `DepartamentosPage`
- `GET /api/v1/org/departamentos/{departamento_id}` (query: `empresa_id?`)
  - **Service**: `departamentoService.getById(id, { empresa_id? })`
  - **Hook**: `useDepartamento(id, { empresa_id? })`
  - **UI**: hook disponible (flujo actual usa lista+edit)
- `PUT /api/v1/org/departamentos/{departamento_id}` (query: `empresa_id?`)
  - **Service**: `departamentoService.update(id, payload, { empresa_id? })`
  - **Hook**: `useUpdateDepartamento()`
  - **UI**: `DepartamentosPage`
- `DELETE /api/v1/org/departamentos/{departamento_id}` (query: `empresa_id?`)
  - **Service**: `departamentoService.delete(id, { empresa_id? })`
  - **Hook**: `useDeleteDepartamento()`
  - **UI**: `DepartamentosPage`
- `POST /api/v1/org/departamentos/{departamento_id}/reactivar` (query: `empresa_id?`)
  - **Service**: `departamentoService.reactivar(id, { empresa_id? })`
  - **Hook**: `useReactivarDepartamento()`
  - **UI**: `DepartamentosPage`

### Cargos
- `GET /api/v1/org/cargos` (query: `empresa_id?`, `solo_activos?`, `buscar?`)
  - **Types**: `Cargo`
  - **Service**: `cargoService.list({ empresa_id?, solo_activos?, buscar? })`
  - **Hook**: `useCargos({ empresa_id?, solo_activos?, buscar? })`
  - **UI**: `CargosPage`
- `POST /api/v1/org/cargos`
  - **Types**: `CargoCreate`
  - **Service**: `cargoService.create(payload)`
  - **Hook**: `useCreateCargo()`
  - **UI**: `CargosPage`
- `GET /api/v1/org/cargos/{cargo_id}` (query: `empresa_id?`)
  - **Service**: `cargoService.getById(id, { empresa_id? })`
  - **Hook**: `useCargo(id, { empresa_id? })`
  - **UI**: hook disponible (flujo actual usa lista+edit)
- `PUT /api/v1/org/cargos/{cargo_id}` (query: `empresa_id?`)
  - **Service**: `cargoService.update(id, payload, { empresa_id? })`
  - **Hook**: `useUpdateCargo()`
  - **UI**: `CargosPage`
- `DELETE /api/v1/org/cargos/{cargo_id}` (query: `empresa_id?`)
  - **Service**: `cargoService.delete(id, { empresa_id? })`
  - **Hook**: `useDeleteCargo()`
  - **UI**: `CargosPage`
- `POST /api/v1/org/cargos/{cargo_id}/reactivar` (query: `empresa_id?`)
  - **Service**: `cargoService.reactivar(id, { empresa_id? })`
  - **Hook**: `useReactivarCargo()`
  - **UI**: `CargosPage`

### Parámetros
- `GET /api/v1/org/parametros` (query: `empresa_id?`, `modulo_codigo?`, `solo_activos?`, `buscar?`)
  - **Types**: `Parametro`
  - **Service**: `parametroService.list({ empresa_id?, modulo_codigo?, solo_activos?, buscar? })`
  - **Hook**: `useParametros({ empresa_id?, modulo_codigo?, solo_activos?, buscar? })`
  - **UI**: `ParametrosPage` (módulo + buscar + ver inactivos)
- `POST /api/v1/org/parametros`
  - **Types**: `ParametroCreate`
  - **Service**: `parametroService.create(payload)`
  - **Hook**: `useCreateParametro()`
  - **UI**: `ParametrosPage`
- `GET /api/v1/org/parametros/{parametro_id}` (query: `empresa_id?`)
  - **Service**: `parametroService.getById(id, { empresa_id? })`
  - **Hook**: `useParametro(id, { empresa_id? })`
  - **UI**: hook disponible (flujo actual usa lista+edit)
- `PUT /api/v1/org/parametros/{parametro_id}` (query: `empresa_id?`)
  - **Service**: `parametroService.update(id, payload, { empresa_id? })`
  - **Hook**: `useUpdateParametro()`
  - **UI**: `ParametrosPage`
- `DELETE /api/v1/org/parametros/{parametro_id}` (query: `empresa_id?`)
  - **Service**: `parametroService.delete(id, { empresa_id? })`
  - **Hook**: `useDeleteParametro()`
  - **UI**: `ParametrosPage`
- `POST /api/v1/org/parametros/{parametro_id}/reactivar` (query: `empresa_id?`)
  - **Service**: `parametroService.reactivar(id, { empresa_id? })`
  - **Hook**: `useReactivarParametro()`
  - **UI**: `ParametrosPage`

---

## 3) Confirmaciones (requisitos Fase 4)

- **No se eliminó ningún componente existente**: OK (solo se refactorizaron pages; se eliminaron únicamente los types `Moneda*` del archivo de tipos ORG, según solicitud).
- **No se usa `any` en el módulo ORG** (`src/features/org/*`): OK (búsqueda sin coincidencias).
- **Cada endpoint del contrato tiene**:
  - **TypeScript types**: OK (interfaces en `org.types.ts`)
  - **Service**: OK (`org.service.ts` incluye CRUD + `reactivar` para las 6 entidades, y `buscar`/`empresa_id` donde aplica)
  - **Hook React Query**: OK (`src/features/org/hooks/*`)
  - **Componente consumidor**: OK (todas las páginas usan hooks; los hooks de detalle existen aunque la UI opere principalmente en modo lista+modal)

