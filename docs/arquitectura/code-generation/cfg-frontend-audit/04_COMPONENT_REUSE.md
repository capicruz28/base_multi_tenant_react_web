# CFG Frontend Audit — Componentes reutilizables (AS-IS)

**Fecha:** 2026-07-17  
**Contrato UI:** `docs/frontend-contracts/cfg/02_UI_BEHAVIOR.md`

Inventario de piezas existentes que un módulo CFG podría consumir. No propone componentes nuevos.

---

## 1. Tablas

| Pieza | Path | Notas |
|-------|------|-------|
| `ErpListTableShell` | `src/shared/components/erp-list/ErpListTableShell.tsx` | Orquesta loading / error / empty / children |
| `InvTableSkeleton` | `src/features/inv/components/InvTableSkeleton.tsx` | Skeleton tabular (SK-01); ORG reexporta |
| `IamTableEmptyState` | `src/features/admin/components/iam/IamTableEmptyState.tsx` | Empty en `<tbody>` (ES-01) |
| `ErpSortableHeader` | `src/shared/components/erp-list/ErpSortableHeader.tsx` | Sort contra whitelist |
| Markup tabla | Páginas INV/ORG catálogo | Tabla nativa + tokens Capa 1 |

**Alineación contrato:** listado con loading, badges por fila, refresh tras mutaciones.

---

## 2. Filtros / toolbar / búsqueda

| Pieza | Path | Notas |
|-------|------|-------|
| `ErpListToolbar` | `src/shared/components/erp-list/ErpListToolbar.tsx` | `justify-between`; limpiar filtros |
| `ErpSearchInput` | `src/shared/components/erp-list/ErpSearchInput.tsx` | Debounce 350 ms integrado |
| `OrgToolbarSearch` | `src/features/org/components/OrgToolbarSearch.tsx` | Wrapper de `IamSearchInput` |
| `IamSearchInput` | `src/features/admin/components/iam/IamSearchInput.tsx` | Input search base |
| `useDebouncedSearch` | `src/core/list/useDebouncedSearch.ts` | Hook canónico SR-03 |
| Checkbox “Ver inactivos” | Inline en catálogos INV/ORG | Mapea a `es_activo` / `solo_activos` |

**Filtros contrato CFG:** `modulo_codigo`, `es_activo`, `sequence_key`, `empresa_id`, `buscar`, `scope_type`.  
Los selects de dominio suelen ser nativos + clases locales (no hay Select genérico shared).

---

## 3. Paginación

| Pieza | Path | Notas |
|-------|------|-------|
| `ErpPagination` | `src/shared/components/erp-list/ErpPagination.tsx` | `total`, `pagina_actual`, `total_paginas`, `limit` |
| Constantes | `src/core/list/erp-list.constants.ts` | Default limit 50, máx 100 |
| Normalize | `src/core/list/erp-list-normalize.ts` | Envelope + array |

**Contrato:** con `page` → envelope; sin `page` → array. El stack ErpList fuerza `page` cuando `forcePagination: true` (patrón INV Tier B).

---

## 4. Formularios

| Pieza | Path | Notas |
|-------|------|-------|
| `Label` | `src/shared/components/ui/label.tsx` | |
| `Button` | `src/shared/components/ui/button.tsx` | Primary = brand |
| `Checkbox` | `src/shared/components/ui/checkbox.tsx` | |
| `FormSection` | `src/features/org/components/FormSection.tsx` | Secciones con título |
| `iamInputClass` | `src/features/admin/components/iam/iam-form-classes.ts` | Clases input canónicas |
| Input nativo + `inputClass` local | ORG/INV pages | Patrón dominante |

Campos editables CFG (contrato): `prefijo`, `separador`, `longitud_numero`, `numero_inicial`.  
Campos readonly: identidad, scope, `ultimo_numero`, `generation_policy`, auditoría.

---

## 5. Dialogs / modales

| Pieza | Path | Notas |
|-------|------|-------|
| Dialog stack | `src/shared/components/ui/dialog.tsx` | Incluye `DialogBody` (scroll) |
| Patrón CRUD modal | ORG/INV catálogos | Header + body + footer fijo |

Regla V2: cerrar Radix Dialog antes de abrir `ConfirmDialog` (B11-10).

---

## 6. Confirmaciones

| Pieza | Path | Notas |
|-------|------|-------|
| `ConfirmDialog` | `src/shared/components/ui/ConfirmDialog.tsx` | `danger` / `warning` / `info` |
| `OrgDiscardConfirmDialog` | `src/features/org/components/OrgDiscardConfirmDialog.tsx` | Discard dirty |
| `createOrgDiscardHandlers` | `src/features/org/utils/org-discard-handlers.ts` | Stack modal dirty |
| Dirty create | `useOrgModalCreateDirty` | Baseline create |
| Dirty compare | `isDirtyAgainstBaseline` | `org-form-dirty.helpers.ts` |

**Contrato CFG:** confirmación antes de desactivar; vocabulario Desactivar/Reactivar (no Eliminar).

---

## 7. Preview

| Pieza | Estado AS-IS |
|-------|--------------|
| Componente genérico `Preview*` | **No existe** |
| `CodigoFieldAutoPanel` | `src/shared/components/codigo/CodigoFieldAutoPanel.tsx` — panel visual cercano |
| `CodigoFieldWarningBanner` | Disclaimer / avisos |
| `CodigoFieldReadOnly` | Valor destacado readonly |

El contrato exige mostrar `codigo_estimado` + `disclaimer` + `consume_contador === false`.  
Hoy no hay un componente admin-CFG listo; solo patrones visuales del FCE.

---

## 8. Badges / estados

| Pieza | Path | Notas |
|-------|------|-------|
| Badge primitivo shared | **No existe** | |
| Activo/Inactivo inline | Catálogos INV/ORG | `bg-success/10 text-success` / error |
| `OrgParametroAlcanceBadge` | ORG | Modelo para badges informativos + Tooltip |
| Badges provisioning / sessions | Admin / Super-admin | Otros dominios |

Contrato sugiere: Inactiva, Bloqueada (`config_locked`), drift (`policy_drift`).

---

## 9. Loading

| Pieza | Path | Uso |
|-------|------|-----|
| `InvTableSkeleton` vía `ErpListTableShell` | ver §1 | Listados |
| `LoadingSpinner` | `src/shared/components/LoadingSpinner.tsx` | Suspense / fullScreen |
| `ConfirmDialog loading` | ConfirmDialog | Acción confirm |
| `mutation.isPending` / botones disabled | Páginas CRUD | saving / previewing |

Estados contrato: `loading_list`, `loading_detail`, `saving`, `toggling_active`, `previewing`.

---

## 10. Empty states

| Pieza | Path | Notas |
|-------|------|-------|
| `IamTableEmptyState` | IAM | Único empty tabular compartido |
| `ErpListTableShell` + `hasSearch` | erp-list | “Sin resultados para la búsqueda” |

---

## 11. Design system (recordatorio AS-IS)

| Capa | Fuente |
|------|--------|
| Capa 1 estructura | `src/styles/tokens.css` — `bg-page`, `bg-surface`, `text-text-*`, `border-border-*`, semánticos |
| Capa 2 marca | `bg-brand-primary`, `text-brand-primary`, `focus:ring-brand-primary` |

Prohibido en estructura: `gray-*`, `slate-*`, `bg-white`, `bg-brand-surface*`.

---

## 12. Composición AS-IS recomendada (mapa, no implementación)

```text
Listado CFG
  ErpListToolbar + search/filtros
  ErpListTableShell + tabla + badges
  ErpPagination

Detalle / edición
  Dialog (+ DialogBody)  ó  página
  FormSection + inputs
  dirty ORG helpers si modal
  ConfirmDialog desactivar/reactivar
  OrgDiscardConfirmDialog si dirty

Preview
  Panel nuevo estilo CodigoFieldAutoPanel (no existe aún)
```

---

## 13. Resumen de cobertura

| Necesidad contrato | ¿Existe reutilizable? |
|--------------------|------------------------|
| Tabla + skeleton + empty | Sí |
| Filtros + debounce | Sí |
| Paginación envelope | Sí |
| Form modal + dirty | Sí (ORG) |
| Confirm desactivar | Sí |
| Badges estado | Parcial (inline / ORG badges) |
| Preview admin | **No** (solo patrones FCE) |
| Badge `config_locked` / drift | **No** genérico |
