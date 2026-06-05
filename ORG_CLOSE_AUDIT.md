# Auditoría de cierre ORG — Estándares reutilizables y deuda técnica

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — sin implementación, sin commit  
**Contexto:** ORG cerrado funcionalmente (Multiempresa JWT, P0/P1, B.1.1, E-SEC, E-UX, E-UX.1). Pre-requisito para iniciar INV.

---

## PARTE A — Inventario de activos reutilizables

### Leyenda de obligatoriedad

| Nivel | Significado |
|-------|-------------|
| **OBL** | Obligatorio en todo módulo ERP nuevo o en refactor mayor |
| **OBL-C** | Obligatorio en pantallas **company-scoped** (JWT empresa activa) |
| **OBL-T** | Obligatorio en pantallas **tenant-scoped** (sin empresa en sesión) |
| **OBL-H** | Obligatorio si hay formularios modales con edición |
| **OBL-L** | Obligatorio en listados tabulares |
| **REC** | Recomendado; adoptar al tocar la vista |
| **MOD** | Específico de ORG hoy; generalizar antes de copiar a INV |

---

### INFRAESTRUCTURA

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `AuthContext` | `src/shared/context/AuthContext.tsx` | Sesión, JWT, impersonación, `requiereSeleccionEmpresa` | **OBL** |
| `useEmpresaActiva` | `src/features/auth/hooks/useEmpresaActiva.ts` | Empresa activa, elegibles, `cambiarEmpresaActiva` | **OBL** |
| `hasEmpresaActiva`, `empresa-access` | `src/core/auth/utils/empresa-access.ts` | Gates de acceso por empresa | **OBL** |
| `empresa-scope-errors` | `src/core/auth/utils/empresa-scope-errors.ts` | Mensajes 403 empresa | **REC** |
| `useTenantQuery` | `src/core/hooks/useTenantQuery.ts` | Query keys con `tenantId` (INV ya lo usa) | **OBL** |
| `getErrorMessage` / validación | `src/core/services/error.service.ts` | Errores API y field errors | **OBL** |
| `usePermissions` | `src/core/auth/hooks/usePermissions.ts` | RBAC `can(modulo, accion)` | **OBL** |
| `PermissionGuard` | `src/app/router/guards/PermissionGuard.tsx` | Rutas por permiso | **OBL** |
| `useHeaderEmpresaContextVisible` | `src/shared/hooks/useHeaderEmpresaContextVisible.ts` | Evitar banner duplicado (P1) | **OBL-C** |
| Axios + interceptores | `src/core/api/axios-instances.ts` | JWT / tenant headers | **OBL** |

**Nota:** ORG no inventó AuthContext; lo **formalizó** como fuente única de empresa operativa vía `useOrgSessionScope`.

---

### MULTIEMPRESA

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `useOrgSessionScope` | `src/features/org/hooks/useOrgSessionScope.ts` | `scopeEmpresaId`, labels, gates, invalidación al cambiar empresa | **MOD → OBL-C** (extraer patrón `useErpCompanyScope` cross-módulo) |
| `useOrgCompanyQueryGate` | `src/features/org/hooks/org-company-query-gate.ts` | `enabled` + `scopeEmpresaId` en hooks | **MOD → OBL-C** |
| `useOrgScopeEmpresaReset` | `src/features/org/hooks/useOrgSessionScope.ts` | Reset filtros locales al cambiar empresa | **REC** |
| `canOperateOrgCompanyScope` | `src/features/org/utils/org-company-scope-access.ts` | P0 tenant_admin en rutas company | **MOD** (reglas por módulo pueden variar) |
| `assertBodyEmpresaMatchesSession` | `src/features/org/utils/org-body-scope.ts` | Payload `empresa_id` = JWT | **OBL-C** |
| `OrgCompanyRouteGuard` | `src/features/org/components/guards/OrgCompanyRouteGuard.tsx` | Redirect / bloqueo sin empresa | **MOD → OBL-C** |
| `OrgTenantRouteGuard` | `src/features/org/components/guards/OrgTenantRouteGuard.tsx` | Rutas tenant-wide (`/empresa`) | **OBL-T** (equivalente por módulo) |
| `OrgActiveEmpresaBanner` | `src/features/org/components/OrgActiveEmpresaBanner.tsx` | Fallback si header no muestra empresa | **REC** |
| `OrgSessionEmpresaField` | `src/features/org/components/OrgSessionEmpresaField.tsx` | Campo readonly en modales create | **OBL-C** |
| `invalidateOrgQueries` | `src/features/org/utils/invalidate-org-queries.ts` | Invalidación React Query al cambiar empresa | **MOD** (patrón por módulo: `invalidateInvQueries`) |
| E-ME4 (sin UUID en UI) | Banner + `OrgSessionEmpresaField` | No `title` con UUID | **OBL** |

---

### MODALES

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `OrgDiscardConfirmDialog` | `src/features/org/components/OrgDiscardConfirmDialog.tsx` | Confirmación B.1.1 | **OBL-H** (o equivalente IAM) |
| `createOrgDiscardHandlers` | `src/features/org/utils/org-discard-handlers.ts` | Cerrar Radix → confirm si dirty | **OBL-H** |
| `org-dialog-guard-props` | `src/features/org/utils/org-dialog-guard-props.ts` | `onInteractOutside` / ESC bloqueados | **OBL-H** |
| `scheduleModalStackValidation` | `src/features/admin/utils/iam-modal-stack-validation.ts` | Evitar overlay negro (IAM) | **OBL-H** |
| `ConfirmDialog` | `src/shared/components/ui/ConfirmDialog.tsx` | Baja lógica / reactivar | **OBL** |
| Radix `Dialog` | `src/shared/components/ui/dialog` | Formularios CRUD | **OBL** |

---

### CRUD

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| Hooks por entidad (`useX`, `useCreateX`, …) | `src/features/org/hooks/*.hooks.ts` | React Query + toast en `onError` hook | **OBL** |
| `org.service.ts` | `src/features/org/services/org.service.ts` | Capa HTTP tipada | **OBL** (por módulo) |
| `org.types.ts` | `src/features/org/types/org.types.ts` | Create/Update/Read separados | **OBL** |
| Vocabulario Desactivar/Reactivar | Todas las páginas ORG | Baja lógica | **OBL** |
| `useOrgEmpresaScopeErrorHandler` | `src/features/org/hooks/useOrgEmpresaScopeErrorHandler.ts` | 403 scope empresa | **REC** |

---

### TABLAS

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `OrgPageLayout` | `src/features/org/components/OrgPageLayout.tsx` | Wrapper sin H1 duplicado | **REC** |
| `OrgCompanyToolbar` | `src/features/org/components/OrgCompanyToolbar.tsx` | Toolbar compacta + CTA derecha | **OBL-C** (generalizar nombre) |
| `OrgToolbarSearch` | `src/features/org/components/OrgToolbarSearch.tsx` | `IamSearchInput` con ancho acotado | **OBL-L** |
| Tabla estándar tokens | Patrón en páginas | `bg-subtle` thead, `hover:bg-overlay` | **OBL** |
| Badges estado activo/inactivo | Páginas ORG | Semánticos success/error | **OBL** |
| Sin columna UUID | Todas las tablas ORG listado | E-ME4 + reglas proyecto | **OBL** |

---

### BÚSQUEDA

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `IamSearchInput` | `@/features/admin/components/iam` | Campo búsqueda con icono | **OBL-L** |
| `OrgToolbarSearch` | Ver arriba | Wrapper layout (E-UX.1) | **OBL-L** |
| `buscar` en queryKey hooks | Hooks ORG company-scoped | Refetch al escribir (sin debounce aún) | **OBL** |
| Debounce | — | IAM 500ms; ORG pendiente | **REC** (post-INV estabilización) |

---

### EMPTY STATES

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `IamTableEmptyState` | `@/features/admin/components/iam` | Icono + título + description + CTA | **OBL-L** |
| Variante `hasSearch` | 6 páginas ORG | Sin CTA crear si búsqueda vacía | **OBL-L** |
| `actionDisabled` con `discardPending` | Páginas ORG | CTA deshabilitado durante confirm discard | **REC** |

---

### SKELETONS

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `InvTableSkeleton` | `src/features/inv/components/InvTableSkeleton.tsx` | Origen del patrón | **OBL-L** |
| `OrgTableSkeleton` | Re-export INV | Mismo chrome tabla ORG | **OBL-L** (o import directo INV) |

---

### FORMULARIOS

| Activo | Ubicación | Uso | Obligatoriedad |
|--------|-----------|-----|----------------|
| `FormSection` | `src/features/org/components/FormSection.tsx` | Secciones en modales | **REC** |
| `form-dirty/*` por entidad | `src/features/org/utils/form-dirty/` | Comparación dirty B.1.1 | **OBL-H** (por entidad; extraer factory **REC**) |
| `org-form-dirty.helpers.ts` | Util compartido ORG | Helpers normalización | **REC** |
| Catálogos geográficos inline | `EmpresaPage`, `SucursalesPage` | País → distrito | **MOD** (candidato shared) |
| Hidden `empresa_id` en create | `OrgSessionEmpresaField` | Scope JWT en body | **OBL-C** |

---

### Parámetros híbridos (específico ORG)

| Activo | Uso | Obligatoriedad |
|--------|-----|----------------|
| `OrgParametroHybridTabs` | Tabs GLOBAL / OVERRIDE | Solo módulos con alcance híbrido |
| `org-parametro-scope.ts`, `resolve` | Payload y filtros por tab | **MOD** |
| `useOrgCanManageGlobalParametros` | RBAC parámetros globales | **MOD** |

---

### Resumen: paquete mínimo para un módulo company-scoped nuevo

1. `useErpCompanyScope` (hoy `useOrgSessionScope`) + query gate + route guard  
2. `ErpCompanyToolbar` + `ErpToolbarSearch` + `IamTableEmptyState` + skeleton tabla  
3. Hooks con `scopeEmpresaId` en queryKey e invalidación al cambiar empresa  
4. B.1.1: discard handlers + `OrgDiscardConfirmDialog` (o extracción `ErpDiscard*`)  
5. Sin selector local de empresa; `OrgSessionEmpresaField` en creates  
6. RBAC, `getErrorMessage`, toasts solo en hooks  

---

## PARTE B — Deuda técnica ORG

### P0 — Bloquea confianza o compilación

| ID | Item | Evidencia | Impacto |
|----|------|-----------|---------|
| ORG-D-P0-1 | Error TypeScript en `parametro-query-keys.ts` | `ParametroHybridTab` vs `ParametroVista` | `tsc -b` falla en CI estricto |
| ORG-D-P0-2 | `EmpresaPage.tsx` monolito (~1 588 líneas) | Un archivo: listado + 2 modales mega-form + geo + onboarding | Riesgo regresión alto en cualquier cambio UX/legal |

### P1 — Mantenimiento costoso; no bloquea build

| ID | Item | Evidencia | Impacto |
|----|------|-----------|---------|
| ORG-D-P1-1 | Duplicación B.1.1 × 6 entidades | `form-dirty/*`, handlers repetidos por página | Cada nueva entidad = ~80–120 líneas boilerplate |
| ORG-D-P1-2 | `SucursalesPage` (~769 líneas) | Geo + CRUD en una página | Misma clase que Empresa, menor escala |
| ORG-D-P1-3 | `ParametrosPage` (~614 líneas) | Tabs híbridos + modales + alcance | Complejidad de dominio mezclada con UI |
| ORG-D-P1-4 | Sin capa `features/erp-shared` | Patrones en `org/components` con prefijo Org | INV no puede importar sin acoplar a ORG |
| ORG-D-P1-5 | Debounce búsqueda ausente | `buscar` → refetch por tecla | Carga API innecesaria en listas grandes |

### P2 — Mejora estructural

| ID | Item | Evidencia | Impacto |
|----|------|-----------|---------|
| ORG-D-P2-1 | Factory empty-state messages | 6 copias de strings `hasSearch` | Drift de copy |
| ORG-D-P2-2 | `useEmpresasTenant` vs sesión | Documentado; riesgo uso incorrecto en nuevas pantallas | Datos cross-company en UI |
| ORG-D-P2-3 | E-RESET (modal abierto + cambio empresa) | Audit E-SEC; fuera de E-UX | Estado local inconsistente |
| ORG-D-P2-4 | Onboarding solo en `EmpresaPage` | `?onboarding=true` acoplado | Difícil reutilizar flujo |

### P3 — Calidad menor

| ID | Item | Evidencia | Impacto |
|----|------|-----------|---------|
| ORG-D-P3-1 | ESLint `react-hooks/exhaustive-deps` en `CargosPage` | Warning L99 | Ruido en lint |
| ORG-D-P3-2 | `OrgTableSkeleton` como re-export | Indirección mínima | OK; documentar convención |
| ORG-D-P3-3 | IAM listados aún usan `Loader` no skeleton | Inconsistencia monorepo | Percepción UX desigual |

### Duplicaciones detectadas

- Toolbar: lógica duplicada en `EmpresaPage` vs `OrgCompanyToolbar` (E-UX.1 alineó visualmente; no unificó componente).
- Dirty + discard: 6× `isXDialogDirty` + wiring idéntico.
- Listado CRUD: mismo esqueleto tabla/modal/confirm en 5 páginas company-scoped.
- Catálogo geo: `EmpresaPage` + `SucursalesPage` cargan países/provincias de forma similar.

### Componentes candidatos a extracción (post-ORG, pre/durante INV)

| Candidato | Destino sugerido | Prioridad |
|-----------|------------------|-----------|
| `OrgCompanyToolbar` + `OrgToolbarSearch` | `src/shared/components/erp/ErpListToolbar.tsx` | P1 |
| Discard stack | `src/shared/components/erp/ErpDiscardDialog.tsx` | P1 |
| `useOrgSessionScope` | `src/core/empresa/useErpCompanyScope.ts` | P0 para INV |
| `FormSection` | `src/shared/components/erp/FormSection.tsx` | P2 |
| Geo cascade hook | `src/shared/hooks/useGeoCascade.ts` | P2 |

### Riesgos de mantenimiento

1. **Regresión multiempresa** si INV mantiene `empresaFilter` local mientras ORG ya usa JWT.  
2. **Doble fuente de verdad** empresa: header vs `<select>Todas las empresas</select>` en INV.  
3. **B.1.1 no portado a INV** → UX inconsistente y bugs de overlay al cerrar modales dirty.  
4. **EmpresaPage** como cuello de botella para legal/branding/onboarding.

---

## Criterio de “ORG cerrado”

| Área | Estado |
|------|--------|
| Multiempresa JWT en rutas company-scoped | ✅ Cerrado |
| P0/P1 contexto header/banner | ✅ Cerrado |
| B.1.1 modales ORG | ✅ Cerrado (6/6) |
| E-UX homogéneo | ✅ Cerrado |
| E-UX.1 toolbar compacta | ✅ Cerrado |
| Deuda P0 EmpresaPage / TS keys | ⚠ Aceptada con plan post-INV |
| Generalización cross-módulo | ❌ Pendiente (bloqueante para INV multiempresa) |

**Recomendación:** Declarar ORG **cerrado para operación**, **no** cerrado como **plataforma reusable** hasta extraer `useErpCompanyScope` + toolbar compartida (puede hacerse en el primer sprint INV sin reabrir lógica ORG).

---

*Documento generado sin cambios en código. Sin commit.*
