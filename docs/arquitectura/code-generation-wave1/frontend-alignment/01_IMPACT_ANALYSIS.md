# Análisis de impacto — Motor de Códigos ORG Ola 1

**Audiencia:** Equipo Frontend  
**Metodología:** Búsqueda estática en `src/features/org/` + referencias cruzadas a tipos `*Create`  
**Fecha:** 2026-07-12

---

## 1. Formularios CREATE afectados

### 1.1 Inventario (5 formularios — todos desalineados)

| # | Página | Ruta app | Modal CREATE | Campo | Evidencia desalineación |
|---|--------|----------|--------------|-------|-------------------------|
| 1 | `EmpresaPage.tsx` | `/app/org/empresa` | Dialog crear empresa | `codigo_empresa` | Label `Código *`; guard `!form.codigo_empresa.trim()` |
| 2 | `SucursalesPage.tsx` | `/app/org/sucursales` | Dialog crear | `codigo` | Label `Código *`; HTML `required`; guard `!form.codigo.trim()` |
| 3 | `DepartamentosPage.tsx` | `/app/org/departamentos` | Dialog crear | `codigo` | Idem sucursal |
| 4 | `CentrosCostoPage.tsx` | `/app/org/centros-costo` | Dialog crear | `codigo` | Idem + guard incluye `tipo_centro_costo` |
| 5 | `CargosPage.tsx` | `/app/org/cargos` | Dialog crear | `codigo` | Idem sucursal |

### 1.2 Formularios CREATE explícitamente NO afectados

| Página | Motivo |
|--------|--------|
| `ParametrosPage.tsx` | `codigo_parametro` es MANUAL_ONLY — contrato §6 excluye |
| `OnboardingEmpresaPage.tsx` | Solo navega a `EmpresaPage?onboarding=true`; no tiene formulario propio |

### 1.3 Flujo onboarding empresa

`EmpresaPage` abre automáticamente el modal CREATE cuando `?onboarding=true`.  
El guard actual exige `codigo_empresa` — **bloquea el primer alta post-bootstrap**, donde el contrato espera auto `EMP002`.

---

## 2. Schemas de validación afectados

**No existen schemas Zod/Yup** en el módulo ORG. La validación es **inline** en handlers y atributos HTML.

| Ubicación | Tipo validación | Regla actual sobre código | Acción requerida |
|-----------|-----------------|---------------------------|------------------|
| `EmpresaPage.handleCreate` | Guard JS + toast | `codigo_empresa.trim()` obligatorio | Quitar del guard CREATE |
| `SucursalesPage.handleCreate` | Guard JS + toast | `codigo.trim()` obligatorio | Quitar del guard CREATE |
| `DepartamentosPage.handleCreate` | Guard JS + toast | Idem | Quitar del guard CREATE |
| `CentrosCostoPage.handleCreate` | Guard JS + toast | Idem (+ tipo) | Quitar código del guard |
| `CargosPage.handleCreate` | Guard JS + toast | Idem | Quitar del guard CREATE |
| Inputs CREATE (5 páginas) | HTML `required` | Bloquea submit nativo | Quitar `required` en CREATE |
| Labels CREATE | UI `Código *` | Indica obligatorio | Quitar asterisco o cambiar copy |

**UPDATE:** Los formularios de edición mantienen código obligatorio en UI — **correcto** según contrato (código editable en PUT).

---

## 3. Tipos TypeScript afectados

Archivo único: `src/features/org/types/org.types.ts`

| Interface | Campo | Tipo actual | Tipo objetivo (Ola 1) | Read sin cambio |
|-----------|-------|-------------|-------------------------|-----------------|
| `EmpresaCreate` | `codigo_empresa` | `string` (required) | `string \| null \| undefined` (optional) | `Empresa.codigo_empresa: string` ✅ |
| `SucursalCreate` | `codigo` | `string` (required) | optional | `Sucursal.codigo: string` ✅ |
| `DepartamentoCreate` | `codigo` | `string` (required) | optional | `Departamento.codigo: string` ✅ |
| `CentroCostoCreate` | `codigo` | `string` (required) | optional | `CentroCosto.codigo: string` ✅ |
| `CargoCreate` | `codigo` | `string` (required) | optional | `Cargo.codigo: string` ✅ |

**Interfaces Read / Update:** Sin cambio estructural. `*Update extends Partial<*Create>` heredará optional en código — compatible con PUT.

**Consumidores de `*Create` fuera de páginas:**

| Archivo | Impacto |
|---------|---------|
| `org.service.ts` | Ninguno — acepta payload más permisivo |
| `*.hooks.ts` (5 hooks create) | Ninguno — genéricos sobre tipo |
| `form-dirty/*.ts` | Ninguno funcional — baseline ya usa `codigo: ''` |

**No confundir:** `CatDepartamentoCreate` en `src/types/catalogos.types.ts` (super-admin platform) es entidad distinta.

---

## 4. Interfaces afectadas

Además de las interfaces `*Create` en `org.types.ts`:

| Interface / tipo | Archivo | Relación con código | ¿Cambio? |
|------------------|---------|---------------------|----------|
| `EditEmpresaFormSnapshot` | `empresa-form-dirty.ts` | Incluye `codigo_empresa: string` | No — snapshot edición |
| `EditSucursalFormSnapshot` | `sucursal-form-dirty.ts` | Incluye `codigo` | No |
| `EditDepartamentoFormSnapshot` | `departamento-form-dirty.ts` | Incluye `codigo` | No |
| `EditCentroCostoFormSnapshot` | `centro-costo-form-dirty.ts` | Incluye `codigo` | No |
| `EditCargoFormSnapshot` | `cargo-form-dirty.ts` | Incluye `codigo` | No |
| `EMPRESA_CREATE_BASELINE` | `empresa-form-dirty.ts` | `codigo_empresa: ''` | No — baseline vacío correcto |

---

## 5. Servicios API afectados

Archivo: `src/features/org/services/org.service.ts`

| Método | Endpoint | ¿Requiere cambio? | Motivo |
|--------|----------|-------------------|--------|
| `empresaService.create` | POST `/org/empresa` | **No** | Passthrough Axios; payload lo arma la página |
| `sucursalService.create` | POST `/org/sucursales` | **No** | Idem |
| `departamentoService.create` | POST `/org/departamentos` | **No** | Idem |
| `centroCostoService.create` | POST `/org/centros-costo` | **No** | Idem |
| `cargoService.create` | POST `/org/cargos` | **No** | Idem |
| Métodos list/get/update/delete | Varios | **No** | Read sin cambio de contrato |

**Nota:** El servicio no transforma ni valida campos — la alineación ocurre en capa de página al construir el payload.

---

## 6. Formularios que consideran obligatorio `codigo` / `codigo_empresa`

### 6.1 CREATE (deben dejar de exigirlo)

| Entidad | Guard cliente | HTML | Label |
|---------|---------------|------|-------|
| Empresa | `!form.codigo_empresa.trim()` en L302 | Sin `required` nativo | `Código *` |
| Sucursal | `!form.codigo.trim()` en L287 | `required` | `Código *` |
| Departamento | `!form.codigo.trim()` en L206 | `required` | `Código *` |
| Centro costo | `!form.codigo.trim()` en L215 | `required` | `Código *` |
| Cargo | `!form.codigo.trim()` en L235 | `required` | `Código *` |

### 6.2 UPDATE (permanecen con código editable — sin cambio Ola 1)

Las cinco páginas mantienen input código en edición con `required` y label `Código *`.  
Comportamiento alineado con contrato §UPDATE.

---

## 7. Lugares donde el Frontend genera códigos

**Resultado: ninguno.**

Búsqueda por patrones `generateCodigo`, `nextCodigo`, prefijos `SUC001`/`EMP00`/`CAR001`, auto-correlativo: **0 coincidencias** en el codebase.

El Frontend **asume entrada manual** y no reserva `EMP001` (correcto — bootstrap Backend).

---

## 8. Lugares donde el Frontend asume códigos manuales

| Capa | Comportamiento manual asumido |
|------|-------------------------------|
| Estado inicial form | `codigo: ''` / `codigo_empresa: ''` en DEFAULT de cada página |
| Validación pre-submit | Rechaza string vacío — impide camino auto |
| Payload | Spread `{ ...form }` envía clave con `""` (Backend lo trata como omitido, pero no es el patrón recomendado) |
| UX | Usuario debe escribir código antes de guardar |
| Dirty tracking | Baseline con `codigo: ''` — no distingue "sin código" vs "con código"; funcional para dirty guard |

---

## 9. Lugares donde deberá mostrar el código devuelto por Backend

| Punto | Estado actual | Recomendación contrato |
|-------|---------------|------------------------|
| Toast éxito CREATE | Genérico: «Empresa creada.», «Sucursal creada.», etc. (`*.hooks.ts`) | Opcional P-04: «Creado con código {X}» |
| Respuesta mutation | Páginas ignoran `created.codigo` / `created.codigo_empresa` salvo `empresa_id` en onboarding | Consumir campo código del 201 |
| Tabla listado | Columna código ya visible | Sin cambio — invalidación refetch suficiente |
| Onboarding | Toast «Empresa creada. Bienvenido…» sin código | Mostrar `codigo_empresa` asignado (EMP002 típico) |
| Modal post-create | Se cierra sin mostrar código | Opcional: mensaje informativo antes de cerrar |

**Implementación mínima:** enriquecer toast en `onSuccess` del hook o en `handleCreate` con dato del `mutateAsync` response.

---

## 10. Riesgos de regresión (resumen)

Ver detalle en [`04_RISK_ANALYSIS.md`](04_RISK_ANALYSIS.md).

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Usuario deja de enviar código y Backend no desplegado Ola 1 | Alta (pre-deploy) | Verificar Backend staging antes de merge |
| Payload con `codigo: ""` vs omitido | Baja | Backend acepta ambos; preferir `delete payload.codigo` |
| Dirty guard falso positivo al ocultar campo | Baja | Baseline ya es `''` |
| UPDATE accidentalmente relajado | Media | Solo tocar guards CREATE, no EDIT |
| Onboarding primera empresa bloqueada | Alta (actual) | Prioridad PR-1 EmpresaPage |

---

## 11. Riesgos de romper otros módulos

| Módulo / área | Import ORG | Riesgo |
|---------------|------------|--------|
| INV, FIN, HCM, etc. | `Empresa`, `Sucursal`, `Cargo` (Read) + `empresaService.list` | **Nulo** — no usan `*Create` |
| `account-profile-display.utils` | Lee `codigo_empresa` de sesión | **Nulo** — Read |
| Super-admin catálogos | `CatDepartamentoCreate` | **Nulo** — tipo distinto |
| Auth / onboarding | Navega a EmpresaPage | **Bajo** — mejora al alinear |
| `org-form-dirty.helpers` | Reexport en INV | **Nulo** — helpers genéricos |

**Conclusión:** El blast radius está **contenido en `src/features/org/pages/` + `org.types.ts`**.

---

## 12. Dependencias compartidas

| Dependencia | Uso en flujo CREATE | ¿Modificar? |
|-------------|---------------------|-------------|
| `assertBodyEmpresaMatchesSession` | Inyecta `empresa_id` sesión | **No** |
| `toastOrgApiError` / `getErrorMessage` | Errores 409/403 | **No** (opcional mapeo campo) |
| `getValidationErrors` | Solo EmpresaPage UPDATE | **No** en PR-1 |
| `createOrgDiscardHandlers` | Dirty modal | **No** |
| `useOrgCompanyQueryGate` | Gate empresa activa | **No** |
| `OrgSessionEmpresaField` | Muestra empresa sesión | **No** |
| React Query hooks `useCreate*` | Mutations | **Opcional** toast |

---

## 13. Componentes reutilizables que podrían verse afectados

**Ninguno requiere modificación** para cumplir contrato O-01…O-07.

| Componente | Rol | Veredicto |
|------------|-----|-----------|
| `OrgDiscardConfirmDialog` | Dirty guard | Intocable |
| `OrgSessionEmpresaField` | Empresa JWT | Intocable |
| `OrgCompanyToolbar` | Toolbar company-scoped | Intocable |
| `OrgTableSkeleton` / `OrgPageLayout` | Layout | Intocable |
| `FormSection` | Secciones modal | Intocable |
| `ConfirmDialog` | Desactivar/reactivar | Intocable |

Cualquier cambio UX (badge «Código automático») vive **dentro del JSX de cada página**, no en shared.

---

## 14. Hooks compartidos que NO deben modificarse

| Hook | Motivo |
|------|--------|
| `useOrgCompanyQueryGate` | Gate multiempresa JWT — fuera de alcance |
| `useOrgSessionScope` | Scope sesión — fuera de alcance |
| `useOrgScopeEmpresaReset` | Reset queries al cambiar empresa |
| `useOrgModalCreateDirty` | Patrón dirty INV/ORG — no relacionado con código |
| `useTenantQuery` | Core query |
| `usePermissions` / `useAuth` | RBAC / auth global |
| `useDebouncedSearch` | Listados |

**Hooks opcionales (solo toast):** `useCreateEmpresa`, `useCreateSucursal`, `useCreateDepartamento`, `useCreateCentroCosto`, `useCreateCargo` — cambio cosmético, no funcional.

---

## 15. Matriz de cumplimiento contrato (O-01 … O-07)

| ID contrato | Requisito | Estado FE | Archivos implicados |
|-------------|-----------|-----------|---------------------|
| O-01 | Código optional en validación CREATE | ❌ | 5 páginas |
| O-02 | No bloquear submit sin código | ❌ | 5 páginas |
| O-03 | Consumir código del 201 | ⚠ Parcial | Páginas + hooks |
| O-04 | `empresa_id` = sesión | ✅ | Ya implementado |
| O-05 | 409 duplicado en campo código | ⚠ Solo toast global | Páginas (opcional PR-4) |
| O-06 | 409 RUC duplicado empresa | ⚠ Solo toast global | EmpresaPage (opcional) |
| O-07 | Tipos TS Create optional | ❌ | `org.types.ts` |

---

*Inventario de archivos: [`02_FILES_TO_MODIFIY.md`](02_FILES_TO_MODIFIY.md)*
