# Archivos a modificar — Motor de Códigos ORG Ola 1

**Principio:** Modificar **únicamente** lo estrictamente necesario.  
**Fecha:** 2026-07-12

---

## 1. Resumen cuantitativo

| Categoría | Cantidad |
|-----------|----------|
| Archivos **obligatorios** | **6** |
| Archivos **opcionales** (UX / errores) | **5–6** |
| Archivos **prohibidos** en Ola 1 | Ver §4 |
| Tests nuevos recomendados | **0–5** (sin tests ORG previos) |

---

## 2. Archivos OBLIGATORIOS (PR-1 mínimo viable)

Estos seis archivos son **suficientes** para cumplir O-01, O-02 y O-07 del contrato.

### 2.1 Tipos

| Archivo | Cambios exactos |
|---------|-----------------|
| `src/features/org/types/org.types.ts` | `EmpresaCreate.codigo_empresa?: string \| null`; `SucursalCreate.codigo?: string \| null`; `DepartamentoCreate.codigo?: string \| null`; `CentroCostoCreate.codigo?: string \| null`; `CargoCreate.codigo?: string \| null` |

### 2.2 Páginas CREATE (validación + payload)

| Archivo | Líneas / zonas a tocar | Cambios exactos |
|---------|------------------------|-----------------|
| `src/features/org/pages/EmpresaPage.tsx` | `handleCreate` (~L300–338); input CREATE (~L528–537) | Quitar guard `codigo_empresa`; omitir clave si vacío en payload; quitar `*` del label CREATE |
| `src/features/org/pages/SucursalesPage.tsx` | `handleCreate` (~L285–303); input CREATE (~L528) | Quitar guard `codigo`; quitar `required`; omitir clave en payload |
| `src/features/org/pages/DepartamentosPage.tsx` | `handleCreate` (~L204–218); input CREATE (~L380) | Idem sucursal |
| `src/features/org/pages/CentrosCostoPage.tsx` | `handleCreate` (~L213–228); input CREATE (~L455) | Idem; mantener guard `tipo_centro_costo` |
| `src/features/org/pages/CargosPage.tsx` | `handleCreate` (~L233–245); input CREATE (~L402) | Idem sucursal |

### 2.3 Patrón payload recomendado (repetir en cada `handleCreate`)

```typescript
const payload = { ...form /* campos requeridos */ };
if (!payload.codigo?.trim()) {
  delete payload.codigo;
}
// Empresa: delete payload.codigo_empresa si vacío
```

> No crear util compartida salvo que se repita 5 veces y el equipo apruebe — inline es más conservador.

---

## 3. Archivos OPCIONALES (PR-2 … PR-4)

### 3.1 Toast con código asignado (O-03 / P-04)

| Archivo | Cambio |
|---------|--------|
| `src/features/org/hooks/empresa.hooks.ts` | `onSuccess: (data) => toast.success(\`Empresa creada (${data.codigo_empresa}).\`)` |
| `src/features/org/hooks/sucursal.hooks.ts` | Incluir `data.codigo` en toast |
| `src/features/org/hooks/departamento.hooks.ts` | Idem |
| `src/features/org/hooks/centro-costo.hooks.ts` | Idem |
| `src/features/org/hooks/cargo.hooks.ts` | Idem |

**Alternativa más conservadora:** enriquecer toast solo en `handleCreate` de cada página (sin tocar hooks compartidos).

### 3.2 Errores 409 por campo (O-05 / O-06)

| Archivo | Cambio |
|---------|--------|
| `src/features/org/pages/EmpresaPage.tsx` | En catch CREATE: parsear 409 y setear `fieldErrors.codigo_empresa` / `fieldErrors.ruc` |
| Páginas company-scoped (4) | catch CREATE: `fieldErrors.codigo` en 409 |

**Nota:** `getValidationErrors` ya existe para Empresa UPDATE — reutilizar patrón, no el servicio global.

### 3.3 UX opcional (P-01 … P-03)

| Archivo | Cambio |
|---------|--------|
| 5 páginas CREATE | Ocultar input código; badge «El código se asignará al guardar»; sección colapsada manual |

---

## 4. Archivos que NO deben modificarse

### 4.1 Servicios y contrato API

| Archivo | Motivo |
|---------|--------|
| `src/features/org/services/org.service.ts` | Passthrough correcto |
| OpenAPI / codegen externo | Fuera de alcance explícito |
| `.env` / configuración API | Sin cambio |

### 4.2 Hooks globales / gates (prohibido por alcance)

| Archivo |
|---------|
| `src/features/org/hooks/org-company-query-gate.ts` |
| `src/features/org/hooks/useOrgSessionScope.ts` |
| `src/features/org/hooks/useOrgModalCreateDirty.ts` |
| `src/features/org/hooks/useOrgEmpresaScopeErrorHandler.ts` |
| `src/core/hooks/useTenantQuery.ts` |
| `src/shared/context/AuthContext` (y compositors auth) |

### 4.3 Componentes shared reutilizables

| Archivo |
|---------|
| `src/features/org/components/OrgDiscardConfirmDialog.tsx` |
| `src/features/org/components/OrgSessionEmpresaField.tsx` |
| `src/features/org/components/OrgCompanyToolbar.tsx` |
| `src/features/org/components/OrgToolbarSearch.tsx` |
| `src/features/org/components/OrgPageLayout.tsx` |
| `src/features/org/components/FormSection.tsx` |
| `src/shared/components/ui/*` |

### 4.4 Utilidades sin relación directa

| Archivo | Motivo |
|---------|--------|
| `src/features/org/utils/org-body-scope.ts` | `empresa_id` ya correcto |
| `src/features/org/utils/org-api-error.ts` | Toast global suficiente en PR-1 |
| `src/features/org/utils/form-dirty/*.ts` | Baseline `codigo: ''` compatible |
| `src/features/org/utils/org-discard-handlers.ts` | Sin relación |
| `src/features/org/routes.tsx` | Rutas prohibidas |

### 4.5 Entidades fuera de Ola 1

| Archivo | Motivo |
|---------|--------|
| `src/features/org/pages/ParametrosPage.tsx` | `codigo_parametro` MANUAL_ONLY |
| `src/features/super-admin/catalogos/**` | Catálogos platform, no ORG motor |
| `src/types/catalogos.types.ts` | `CatDepartamentoCreate` ≠ ORG |
| Otros módulos (INV, PUR, FIN, …) | No consumen `*Create` ORG |

### 4.6 Listados y UPDATE

| Zona | Motivo |
|------|--------|
| Columnas código en tablas (5 páginas) | Read sin cambio |
| Modales EDIT (5 páginas) | Código sigue editable/required en UX |
| Handlers `handleUpdate` | Sin cambio contrato |

---

## 5. Archivos form-dirty — veredicto

| Archivo | ¿Modificar? | Razón |
|---------|-------------|-------|
| `empresa-form-dirty.ts` | **No** | Baseline `codigo_empresa: ''` correcto |
| `sucursal-form-dirty.ts` | **No** | Baseline `codigo: ''` |
| `departamento-form-dirty.ts` | **No** | Idem |
| `centro-costo-form-dirty.ts` | **No** | Idem |
| `cargo-form-dirty.ts` | **No** | Idem |

Si PR-3 oculta el input código en CREATE, dirty guard sigue funcionando (nombre y demás campos disparan dirty).

---

## 6. Tests — recomendación

No hay tests ORG hoy. **Opcional** post-PR-1:

| Archivo sugerido | Caso |
|------------------|------|
| `src/features/org/pages/__tests__/EmpresaPage.create-code.test.tsx` | Submit sin `codigo_empresa` no muestra toast validación cliente |
| Tests análogos por entidad | Payload omite `codigo` cuando vacío |

Prioridad baja — QA manual con casos EMP-01, SUC-01, etc. del contrato.

---

## 7. Checklist pre-merge (archivos)

```
[ ] org.types.ts — 5 campos optional
[ ] EmpresaPage.tsx — CREATE only
[ ] SucursalesPage.tsx — CREATE only
[ ] DepartamentosPage.tsx — CREATE only
[ ] CentrosCostoPage.tsx — CREATE only
[ ] CargosPage.tsx — CREATE only
[ ] Ningún otro archivo en git diff
[ ] ParametrosPage.tsx NO tocado
[ ] org.service.ts NO tocado
[ ] shared/components NO tocados
```

---

## 8. Orden de edición sugerido

1. `org.types.ts` — desbloquea compilación con payloads parciales  
2. `EmpresaPage.tsx` — crítico onboarding  
3. `SucursalesPage.tsx`  
4. `DepartamentosPage.tsx`  
5. `CentrosCostoPage.tsx`  
6. `CargosPage.tsx`  
7. (Opcional) hooks toast  
8. (Opcional) 409 field errors  

---

*Plan detallado: [`03_IMPLEMENTATION_PLAN.md`](03_IMPLEMENTATION_PLAN.md)*
