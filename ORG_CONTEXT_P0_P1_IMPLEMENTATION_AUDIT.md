# Auditoría de implementación — ORG contexto P0 + P1

**Fecha:** 31 mayo 2026  
**Estado:** Listo para implementación — **sin código, sin commit**  
**Alcance:** Solo hallazgos **P0** (regla ORG company-scoped) y **P1** (banner duplicado).  
**Referencia:** `ORG_CONTEXT_AUDIT.md` (aprobada por QA).

**Fuera de alcance (explícito):** B.1.1, empty states, skeletons, refactor `EmpresaPage`, navegación, onboarding, mensajes P2 del guard, tests automatizados (recomendados pero no obligatorios en este sprint).

---

## Resumen ejecutivo

| ID | Problema | Cambio propuesto | Archivos tocados (estimado) |
|----|----------|------------------|----------------------------|
| **P0** | `canAccessCompanyOrg` usa `canAccessErp`, que excluye `tenant_admin` | Función pura `canOperateOrgCompanyScope` + cableado en `useOrgSessionScope` | 2 (1 nuevo + 1 modificado) |
| **P1** | `OrgActiveEmpresaBanner` duplica `EmpresaSelector` del header | Hook espejo de visibilidad del header + condicional en `OrgCompanyToolbar` | 2 (1 nuevo + 1 modificado) |

**Superficie de regresión:** concentrada en `useOrgSessionScope` y toolbar ORG; páginas, hooks React Query y guards **no requieren** cambios de lógica si P0 se resuelve en el hook central.

---

## P0 — Regla ORG company-scoped

### Situación actual

```69:70:src/features/org/hooks/useOrgSessionScope.ts
  const canAccessCompanyOrg =
    canAccessErp && hasEmpresaActiva(scopeEmpresaId) && !empresaSelectionPending;
```

`canAccessErp` (`empresa-access.ts`) devuelve `false` para `tenant_admin` y `platform_admin` por diseño (shell ERP operativo). El header y `EmpresaSelector` **no** usan esa regla; usan `empresaActivaId` + `showEmpresaActiva`.

### Comportamiento objetivo

| Condición | `canOperateOrgCompanyScope` |
|-----------|----------------------------|
| `empresa_selection_pending` / `requiereSeleccionEmpresa` | `false` → redirect guard existente |
| Sin `empresaActivaId` válido (`!hasEmpresaActiva`) | `false` |
| `platform_admin` en flujo `/app` | `false` (sin cambio de routing global) |
| `tenant_admin` + empresa activa válida | **`true`** |
| `user` (MANAGER / operativo) + empresa activa válida | **`true`** (equivalente al caso que ya pasaba vía `canAccessErp`) |

**No modificar** `canAccessErp`, `ProtectedRoute`, ni flujos de onboarding/selección.

### Implementación propuesta

**Nuevo archivo:** `src/features/org/utils/org-company-scope-access.ts`

```ts
export interface OrgCompanyScopeAccessInput {
  userType: string;
  scopeEmpresaId: string | null;
  empresaSelectionPending: boolean;
}

export function canOperateOrgCompanyScope({
  userType,
  scopeEmpresaId,
  empresaSelectionPending,
}: OrgCompanyScopeAccessInput): boolean {
  if (empresaSelectionPending) return false;
  if (!hasEmpresaActiva(scopeEmpresaId)) return false;
  if (userType === 'platform_admin') return false;
  // tenant_admin y user (operativo): ORG company-scoped con empresa en JWT
  return userType === 'tenant_admin' || userType === 'user';
}
```

**Modificar:** `src/features/org/hooks/useOrgSessionScope.ts`

- Importar `canOperateOrgCompanyScope`.
- Sustituir `canAccessCompanyOrg` / `canAccessHybridOrg` / `canQuery*` por la nueva regla.
- Dejar de desestructurar `canAccessErp` de `useEmpresaActiva()` si ya no se usa en este hook.

**Sin cambios esperados** (consumen el hook ya corregido):

- `org-company-query-gate.ts`
- `OrgCompanyRouteGuard.tsx`
- Hooks `*.hooks.ts` con `useOrgCompanyQueryGate`
- Páginas: `SucursalesPage`, `DepartamentosPage`, `CargosPage`, `CentrosCostoPage`, `ParametrosPage`

---

## P1 — Una sola fuente visible de contexto

### Situación actual

`OrgCompanyToolbar` siempre renderiza `OrgActiveEmpresaBanner`. El header ya monta `EmpresaSelector` cuando:

```173:176:src/shared/components/layout/Header.tsx
          {!isSuperAdminUser &&
            (shell === 'app' || (shell === 'admin' && isTenantAdminUser)) && (
              <EmpresaSelector />
            )}
```

`EmpresaSelector` solo pinta UI si `showEmpresaActiva && empresaActivaId` (misma señal que `useEmpresaActiva`).

### Implementación propuesta

**Nuevo hook:** `src/shared/hooks/useHeaderEmpresaContextVisible.ts` (o `src/features/auth/hooks/` — preferir `shared` por acoplamiento a `Header` + `LayoutShellContext`).

Lógica **espejo** del header (no duplicar solo la mitad):

1. `useUserType()` → `isSuperAdminUser`, `isTenantAdminUser`
2. `useLayoutShell()` → `shell`
3. `useEmpresaActiva()` → `showEmpresaActiva`, `empresaActivaId`

```ts
const headerShowsEmpresaSlot =
  !isSuperAdminUser &&
  (shell === 'app' || (shell === 'admin' && isTenantAdminUser));

return (
  headerShowsEmpresaSlot &&
  showEmpresaActiva &&
  !!empresaActivaId
);
```

**Modificar:** `src/features/org/components/OrgCompanyToolbar.tsx`

```tsx
const headerEmpresaVisible = useHeaderEmpresaContextVisible();
// ...
{!headerEmpresaVisible && <OrgActiveEmpresaBanner />}
```

**Mantener sin borrar (por ahora):** `OrgActiveEmpresaBanner.tsx` — útil si en el futuro una ruta company-scoped no tuviera chrome de header (hoy no aplica a `/app/org/*`).

**Sin cambios en páginas** que usan `OrgCompanyToolbar` (5 pantallas company-scoped + parámetros hybrid).

**No incluido en P1:** quitar `title={scopeEmpresaId}` del banner (hallazgo M4 de auditoría previa); puede ir en Sprint E.

---

## 1. Archivos afectados

| Acción | Ruta | P0 | P1 |
|--------|------|----|----|
| **Crear** | `src/features/org/utils/org-company-scope-access.ts` | ✓ | — |
| **Crear** | `src/shared/hooks/useHeaderEmpresaContextVisible.ts` | — | ✓ |
| **Modificar** | `src/features/org/hooks/useOrgSessionScope.ts` | ✓ | — |
| **Modificar** | `src/features/org/components/OrgCompanyToolbar.tsx` | — | ✓ |

### Archivos que NO deben cambiarse en este sprint

| Área | Archivos |
|------|----------|
| Auth global | `AuthContext.tsx`, `empresa-access.ts` (`canAccessErp`) |
| Routing / guards globales | `PermissionGuard`, `ProtectedRoute`, `router.tsx` |
| Header | `Header.tsx`, `EmpresaSelector.tsx` (solo referencia para el hook espejo) |
| Páginas ORG | `*Page.tsx` (salvo QA manual) |
| Guards ORG | `OrgCompanyRouteGuard.tsx`, `OrgTenantRouteGuard.tsx` (comportamiento vía hook) |
| Mi Empresa | `EmpresaPage.tsx` — no usa `OrgCompanyToolbar` |

### Consumidores indirectos (validación QA, sin diff)

- `OrgCompanyRouteGuard`, `org-company-query-gate.ts`, hooks ORG company-scoped
- `OrgActiveEmpresaBanner` (solo deja de montarse en toolbar cuando header visible)
- `OrgSessionEmpresaField`, `OrgParametroAlcanceField` (siguen usando labels del hook; sin cambio P1)

---

## 2. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Divergencia hook vs Header** si cambia condición del header sin actualizar `useHeaderEmpresaContextVisible` | Media | Comentario en ambos archivos enlazando la regla; QA cruzado admin + manager |
| **`tenant_admin` accede ORG company sin permiso backend** | Baja (preexistente) | RBAC en menú/rutas; P0 solo alinea UI con JWT ya mostrado en header |
| **`platform_admin` impersonando** con empresa en JWT | Baja | Regla mantiene `platform_admin` → false en ORG company; flujo impersonación sigue en banner/guard de impersonación |
| **Label vacío en guard** si empresa no está en `empresasElegibles` pero sí en JWT | Baja (preexistente) | Header resuelve con `getById`; guard puede mostrar mensaje sin nombre — fuera de P0/P1 |
| **Flash banner** durante hidratación sesión | Muy baja | Hook usa mismas señales que `EmpresaSelector`; ambos ocultos hasta `empresaActivaId` |
| **Ampliar `canOperateOrgCompanyScope` a otros `userType`** futuros | Media | Lista explícita `tenant_admin \| user`; nuevos tipos requieren decisión de producto |
| **Operativo `esAdminCliente` sin empresa** en `/app/org/empresa` (tenant guard) | Ninguna P0 | `OrgTenantRouteGuard` no usa `canAccessCompanyOrg` |

---

## 3. Compatibilidad MANAGER y USER

Perfil en código: `user_type === 'user'` (MANAGER y usuarios operativos del tenant).

| Escenario | Antes P0 | Después P0 | P1 (banner) |
|-----------|----------|------------|-------------|
| MANAGER + empresa en JWT en `/app/org/sucursales` | Acceso OK; **banner duplicado** | Acceso OK | **Sin banner**; solo header |
| USER operativo + empresa, sin multi-empresa | Acceso OK | Acceso OK | Sin banner si header muestra empresa |
| USER sin empresa / `selection_pending` | Bloqueo / redirect | **Igual** | Banner podría mostrarse si header no muestra selector — **correcto** (única pista visual) |
| `tenant_admin` + empresa en JWT | **Bloqueado** (bug) | **Acceso OK** | Sin banner en `/app` y `/admin` |
| `tenant_admin` sin empresa (edge) | Bloqueado | Bloqueado | Sin selector en header → banner **sí** (fallback coherente) |
| `platform_admin` | No aplica shell ORG típico | Sin cambio | Sin `EmpresaSelector` en super-admin |

**MANAGER:** sin regresión de acceso; mejora UX (menos ruido).  
**USER:** mismos bloqueos de seguridad; no se relaja `empresa_selection_pending` ni ausencia de `empresa_id`.

---

## 4. Plan QA

### Pre-requisitos

- Usuario **tenant_admin** con al menos una empresa asignada y `empresa_id` en JWT tras login/selección.
- Usuario **MANAGER** (`user`) con empresa activa y permisos ORG en menú.
- Usuario operativo **sin empresa** o con flag `empresa_selection_pending`.

### Matriz P0 (acceso datos)

| # | Perfil | Ruta | Esperado |
|---|--------|------|----------|
| 1 | tenant_admin | `/app/org/sucursales` | Tabla carga; **no** «Empresa activa requerida» |
| 2 | tenant_admin | `/app/org/parametros` | Tabs hybrid cargan |
| 3 | tenant_admin | Cambiar empresa en header | Queries ORG se invalidan (`useOrgScopeEmpresaReset` / `invalidateOrgQueries`) |
| 4 | MANAGER | `/app/org/departamentos` | Datos visibles (igual que antes) |
| 5 | USER sin empresa | `/app/org/sucursales` | Redirect `/app/seleccionar-empresa` o empty guard |
| 6 | Cualquiera con `selection_pending` | Cualquier company route | Redirect selección; **sin** fetch company-scoped |
| 7 | tenant_admin | `/app/inv/*` (módulo ERP) | Sin regresión: `canAccessErp` sigue false; verificar que no se “abrió” ERP por error |

### Matriz P1 (UI contexto)

| # | Perfil | Ruta | Esperado |
|---|--------|------|----------|
| 8 | MANAGER | `/app/org/cargos` | **No** aparece banner «Empresa activa: …» bajo título; **sí** empresa en header |
| 9 | tenant_admin | `/app/org/centros-costo` | Igual que #8 |
| 10 | tenant_admin | `/admin/*` con ORG si aplica | Sin banner si header muestra empresa |
| 11 | USER sin empresa en header | Company route bloqueada | Banner **puede** mostrarse si guard deja ver toolbar — verificar que no contradice mensaje del guard |
| 12 | `/app/org/empresa` (Mi Empresa) | Sin `OrgCompanyToolbar` | Sin cambio visual |

### Regresión rápida

- F5 en tenant_admin en ORG company-scoped: persiste acceso.
- Impersonación soporte (si aplica): banner impersonación + header; sin doble banner empresa.
- DevTools: queries ORG con `enabled: false` cuando no hay `scopeEmpresaId`.

### Criterios de cierre

- [ ] Casos 1–3 (ADMIN) pasan.  
- [ ] Casos 4, 8–9 (MANAGER) pasan sin duplicado.  
- [ ] Casos 5–6 (bloqueos) pasan.  
- [ ] Caso 7 sin regresión ERP.

---

## 5. Impacto ORG y módulos company-scoped futuros

### ORG inmediato

- **Guards y React Query** siguen dependiendo de `canQueryCompanyScoped` / `useOrgCompanyQueryGate` — un solo punto de verdad tras P0.
- **ParametrosPage** (hybrid) hereda la misma regla vía `canQueryHybridScoped`.
- **EmpresaPage** (tenant-scoped) no usa la regla company; sin impacto.

### Patrón recomendado para INV, FIN, etc.

| Necesidad | Usar | No usar |
|-----------|------|---------|
| ¿Puedo consultar APIs con `empresa_id` implícito en JWT? | `canOperateOrgCompanyScope` o hook derivado (`useOrgSessionScope` como referencia) | `canAccessErp` |
| ¿Muestro contexto de empresa en toolbar de página? | `useHeaderEmpresaContextVisible` antes de banner local | Banner fijo en cada módulo |
| Scope de datos | `AuthContext.empresaActivaId` / `scopeEmpresaId` | `?empresa_id` en query, selectores locales |

### Extensión futura (no implementar ahora)

- Mover `canOperateOrgCompanyScope` a `src/core/auth/utils/` si varios módulos lo importan (INV ya company-scoped en auditorías previas).
- Test unitario Vitest de la función pura (tabla de casos tenant_admin / user / pending / sin id).
- Unificar mensajes `OrgCompanyRouteGuard` (P2 auditoría contexto).

---

## Orden de implementación sugerido

1. **P0:** util + `useOrgSessionScope` → verificar tenant_admin en sucursales (caso QA #1).  
2. **P1:** hook + `OrgCompanyToolbar` → verificar MANAGER sin banner (#8).  
3. Smoke regresión ERP (#7) y selection_pending (#5–6).

**Estimación:** ~80–120 líneas netas, 4 archivos, sin migraciones ni cambios de API.

---

## Checklist pre-merge (post-implementación)

- [ ] `canAccessErp` sin referencias nuevas en `features/org/**`
- [ ] `tsc` / lint en archivos tocados
- [ ] QA matriz §4 completa
- [ ] Commit solo si el usuario lo solicita explícitamente
