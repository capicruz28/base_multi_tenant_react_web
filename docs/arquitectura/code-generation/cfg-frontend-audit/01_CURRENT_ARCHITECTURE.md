# CFG Frontend Audit — Arquitectura actual (AS-IS)

**Fecha:** 2026-07-17  
**Fuente de contrato:** `docs/frontend-contracts/cfg/`  
**Norma estructural:** `docs/arquitectura/ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md`  
**Norma UX/plataforma:** `ERP_FRONTEND_STANDARDS_V2.md`

---

## 1. Organización de features

Los dominios viven bajo `src/features/<modulo>/`. Los módulos maduros (ORG, INV) siguen capas:

```text
src/features/<modulo>/
  routes.tsx
  pages/
  components/          (+ guards/ cuando aplica)
  hooks/
  services/
  types/
  utils/               (form-dirty, invalidation, …)
  constants/           (permisos, cuando hay códigos punteados)
  codigo/              (solo consumidores FCE: ORG, INV)
```

### Features relevantes al entorno CFG

| Feature | Path | Rol respecto a CFG |
|---------|------|--------------------|
| *(inexistente)* | `src/features/cfg` | **Destino natural** del admin de secuencias |
| org | `src/features/org` | Referencia UX catálogo; consumidor FCE |
| inv | `src/features/inv` | Referencia listados ErpList; consumidor FCE |
| wms | `src/features/wms` | Referencia RBAC `hasPermission('wms.*')` |
| admin | `src/features/admin` | Tenant Admin IAM — **no** es shell de CFG |
| super-admin | `src/features/super-admin` | Plataforma — **no** es shell de CFG |
| inv-bill | `src/features/inv-bill` | Series fiscales — dominio distinto |
| core codigo | `src/core/codigo` | Motor FCE (form fields) — **no** es admin CFG |
| shared codigo UI | `src/shared/components/codigo` | Presenters `CodigoField*` — consumo FCE |

---

## 2. Tres shells de aplicación

Definidos en `src/shared/components/layout/layout-shell.types.ts`:

| Shell | Variant | Layout | Guard de entrada | Uso |
|-------|---------|--------|------------------|-----|
| ERP operativo | `app` | `AppLayout` → `NewLayout` | `ProtectedRoute requireOperationalUser` | Módulos ORG, INV, WMS, … |
| Tenant Admin | `admin` | `AdminLayout` | `ProtectedRoute requireTenantAdmin` | Usuarios, roles, sesiones |
| Platform / Super Admin | `super-admin` | `SuperAdminLayout` | `ProtectedRoute requireSuperAdmin` | Clientes, catálogos plataforma |

Router raíz: `src/app/router.tsx`.  
Hijos ERP: `src/app/router/app-route-tree.tsx`.

### Clasificación AS-IS de CFG

Según el contrato (`01_API_CONTRACT.md`, `05_FRONTEND_INTEGRATION_GUIDE.md`):

- Base API: `/api/v1/cfg`
- Sesión: JWT / sesión ERP tenant
- No es administración de plataforma ni IAM de tenant

**Conclusión arquitectónica:** CFG es un **módulo ERP operativo** del shell `app` (`/app/cfg/*`).

No debe vivir en:

- `/admin/*` (Tenant Admin)
- `/super-admin/*` (Platform)

---

## 3. Capas transversales que CFG reutilizará (sin crear alternativas)

| Capa | Ubicación | Función |
|------|-----------|---------|
| HTTP | `src/core/api/` (`api.ts`, axios instances) | Cliente Axios configurado |
| Errores | `src/core/services/error.service.ts` (`getErrorMessage`) | Extracción de mensajes API |
| Tenant queries | `src/core/hooks/useTenantQuery.ts` | Query keys con `tenantId` |
| Listados | `src/core/list/` | ErpList, normalize, debounce, params |
| Auth shell | `src/shared/context/AuthContext` | Sesión, menú, LBAC derivado |
| RBAC códigos | `src/core/auth/PermissionContext.tsx` | `hasPermission(code)` |
| LBAC menú | `src/core/auth/hooks/usePermissions.ts` | `can(module, action)` |
| UI primitiva | `src/shared/components/ui/` | Dialog, Button, ConfirmDialog, Label |
| List UI | `src/shared/components/erp-list/` | Toolbar, table shell, pagination, search |
| Tokens | `src/styles/tokens.css` | Capa 1 design system |

---

## 4. Registro de módulos ERP (estado actual)

Fuente: `src/core/constants/erp-modules.ts`.

- Contiene 27 módulos (ORG…AUD).
- **No incluye CFG.**
- `ERP_ROUTE_SEGMENTS` en `src/core/routing/post-login-path.ts` tampoco incluye `cfg`.

Esto no invalida la arquitectura; indica que el módulo aún no está cableado. En implementación futura (fuera de esta auditoría) el registro es el mismo patrón que ORG/INV.

---

## 5. Separación crítica: FCE vs Administrador CFG

| Concepto | Ubicación AS-IS | Responsabilidad |
|----------|-----------------|-----------------|
| **FCE / Motor de códigos** | `src/core/codigo`, manifests ORG/INV, `CodigoField` | Política de campo `codigo` en formularios de entidad (AUTO/MANUAL) |
| **CFG Admin (este contrato)** | *no implementado* | Administrar secuencias: formato, soft-delete, preview |

El FCE **consume** secuencias (vía Backend en create/update de entidades).  
CFG **administra** esas secuencias. Son capas distintas; no deben fusionarse en un solo feature folder ni reutilizar páginas FCE como admin.

---

## 6. Clasificación de plantilla (lectura del contrato vs V2)

Contrato CFG MVP:

- Listado + detalle/edición
- Sin create
- Soft DELETE + reactivar
- Preview no mutante
- Filtros / sort / paginación opcionales

Encaje con `ERP_FRONTEND_STANDARDS_V2`:

| Aspecto | Clasificación |
|---------|---------------|
| Plantilla UX | **A / A+** (catálogo admin), no B-F transaccional |
| Listado | **Tier B** recomendable (envelope `page`/`limit`) |
| Vocabulario baja | Desactivar / Reactivar (alineado a UX-01) |
| Multiempresa | Tenant session; filtro opcional `empresa_id` en API (ver riesgos) |

---

## 7. Estructura de carpetas prevista (AS-IS pattern, no implementación)

Por consistencia con ORG/INV, el destino natural observado es:

```text
src/features/cfg/
  routes.tsx
  types/
  services/
  hooks/
  constants/          # cfg-permissions.ts (códigos punteados)
  pages/
  components/
  utils/              # invalidate, form-dirty si aplica
```

Cableado externo observado en otros módulos:

- `src/app/router/app-route-tree.tsx` → `path: 'cfg/*'`
- `src/core/constants/erp-modules.ts` → entrada CFG
- `src/core/routing/post-login-path.ts` → segmento `'cfg'`

*(Solo inventario de patrón; no se propone implementación aquí.)*

---

## 8. Módulos de referencia arquitectónica (ranking)

| Prioridad | Módulo | Por qué |
|-----------|--------|---------|
| 1 | **ORG** | Catálogo modal, dirty discard, Desactivar/Reactivar, toolbar, FormSection |
| 2 | **INV catálogos** (`CategoriasPage` + `useCategoriasErpList`) | `useErpListQuery`, sort whitelist, paginación, invalidate |
| 3 | **WMS / INV transaccional** | `hasPermission('modulo.recurso.accion')` — mismo shape que `cfg.secuencias.*` |
| 4 | **ORG Parámetros** | Pantalla de configuración tenant/hybrid; badges de alcance |
| — | Super-admin catalogos | **No** — otro shell y auth |
| — | inv-bill Series | **No** como primary — dominio fiscal y patrones mixtos |
| — | `src/core/codigo` | **No** como admin — es motor de campo |

---

## 9. Resumen

La arquitectura Frontend actual es **Provider + feature modules + shells**. CFG encaja como feature nuevo en el shell ERP, siguiendo el mismo esqueleto que ORG/INV, sin requerir cambios estructurales al core ni a Baseline V1.
