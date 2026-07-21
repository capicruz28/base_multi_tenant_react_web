# CFG — Componentes: reuso y nuevos

**Versión:** 1.0  
**Principio:** maximizar reuso ORG/INV/shared; crear solo lo específico de dominio CFG.

---

## 1. Componentes / piezas reutilizadas (sin modificar contrato de API)

### Shell y layout

| Pieza | Origen |
|-------|--------|
| `AppLayout` / `NewLayout` | `src/shared/components/layout/` |
| Page wrapper estilo `OrgPageLayout` | ORG (o equivalente mínimo) |
| `PermissionGuard` | `src/app/router/guards/` |
| `ProtectedRoute` | shared |

### Listado

| Pieza | Origen |
|-------|--------|
| `ErpListToolbar` | `src/shared/components/erp-list/` |
| `ErpSearchInput` / `OrgToolbarSearch` | erp-list / ORG |
| `ErpListTableShell` | erp-list |
| `ErpSortableHeader` | erp-list |
| `ErpPagination` | erp-list |
| `InvTableSkeleton` | INV |
| `IamTableEmptyState` | IAM admin |
| `useErpListQuery` / `useDebouncedSearch` / `normalizeListResponse` | `src/core/list/` |
| `useTenantQuery` | `src/core/hooks/` |

### Forms / dialogs

| Pieza | Origen |
|-------|--------|
| `Dialog`, `DialogContent`, `DialogBody`, `DialogHeader`, `DialogFooter`, `DialogTitle` | `shared/components/ui/dialog` |
| `Button`, `Label`, `Checkbox` | shared/ui |
| `FormSection` | ORG |
| `iamInputClass` o `inputClass` local | IAM / patrón ORG |
| `ConfirmDialog` | shared/ui |
| `OrgDiscardConfirmDialog` + `createOrgDiscardHandlers` | ORG |
| Dirty helpers | ORG `form-dirty` / `isDirtyAgainstBaseline` |

### Feedback / auth

| Pieza | Origen |
|-------|--------|
| `getErrorMessage` | `src/core/services/error.service.ts` |
| `usePermission` / `usePermissions` | core auth |
| `toast` (react-hot-toast) | patrón módulos |

### Solo referencia visual (no acoplar FCE)

| Pieza | Uso |
|-------|-----|
| `CodigoFieldAutoPanel` | Inspiración layout Preview |
| `CodigoFieldWarningBanner` | Inspiración disclaimer / locked |

---

## 2. Componentes nuevos necesarios (feature `cfg`)

| Componente funcional | Responsabilidad | ¿Shared genérico? |
|----------------------|-----------------|-------------------|
| `SecuenciasPage` | Página listado | No — page |
| `CfgSecuenciaEditDialog` | Detalle + edición formato | No |
| `CfgSecuenciaPreviewDialog` | Estimación + disclaimer | No |
| `CfgSecuenciaStatusBadges` | Activa/Inactiva/Bloqueada/Drift | No (local); opcional extraer si se repite |
| `CfgLockedBanner` | Mensaje locked | No — trivial local |
| Formato fields group | Inputs prefijo/separador/… | Parte del Edit Dialog |

**No crear** en shared:

- Preview genérico multi-módulo (YAGNI).
- Badge primitivo global (usar patrón inline/local).

**No crear:**

- Página detalle.
- Wizard create.
- Dialog “Nueva secuencia”.
- Integración `CodigoField` controller en admin.

---

## 3. Capas de feature (Blueprint — solo mapa)

```text
src/features/cfg/
  pages/SecuenciasPage.tsx
  components/CfgSecuenciaEditDialog.tsx
  components/CfgSecuenciaPreviewDialog.tsx
  components/CfgSecuenciaStatusBadges.tsx
  hooks/… (Blueprint)
  services/… (Blueprint)
  types/… (Blueprint)
  constants/cfg-permissions.ts (Blueprint)
  routes.tsx (Blueprint)
```

Este documento **no** autoriza a crear esos archivos aún.

---

## 4. Consistencia visual

- Tokens Capa 1 para estructura.
- Brand solo en CTA Guardar / focus.
- Misma densidad de tabla que INV Categorías / ORG Departamentos.

---

## 5. Resumen

| Categoría | Cantidad aprox. |
|-----------|-----------------|
| Reutilizados existentes | Alto (erp-list + ORG dirty + ui) |
| Nuevos específicos CFG | 3–5 componentes de feature |
| Cambios a FCE / core codigo | **Ninguno** |
